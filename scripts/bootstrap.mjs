import {
  chmodSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { applyLinks, homeLinks, planLinks, repositoryRoot } from "./link-home.mjs";

const source = join(repositoryRoot, ".vscode/settings.json");

export function assertSupportedPlatform(platform = process.platform) {
  if (platform !== "linux") {
    throw new Error("Unsupported platform: bootstrap currently supports Linux and WSL only");
  }
}

function readSettingsTemplate() {
  return JSON.parse(readFileSync(source, "utf8"));
}

function linkEntries() {
  const entries = [...homeLinks];
  const skills = readdirSync(join(repositoryRoot, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name).sort();
  for (const skill of skills) {
    entries.push([`skills/${skill}`, `.claude/skills/${skill}`]);
    entries.push([`skills/${skill}`, `.agents/skills/${skill}`]);
  }
  entries.push(["skills/work-loop/workctl.mjs", ".local/share/coding-agent/workctl.mjs"]);
  return entries;
}

function settingsPath(home, env) {
  if (env.WSL_DISTRO_NAME || env.WSL_INTEROP) {
    return resolve(home, ".vscode-server/data/Machine/settings.json");
  }
  const config = env.XDG_CONFIG_HOME && isAbsolute(env.XDG_CONFIG_HOME)
    ? env.XDG_CONFIG_HOME
    : join(home, ".config");
  return resolve(config, "Code/User/settings.json");
}

function lstatOrNull(path) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
    throw error;
  }
}

function settingsParentIsSafe(target, home, wsl) {
  const base = resolve(home);
  const normalizedTarget = resolve(target);
  if (wsl && !normalizedTarget.startsWith(base + sep)) return false;
  let current = dirname(normalizedTarget);
  while (true) {
    const stat = lstatOrNull(current);
    // Never write through symlinked settings directories, including into the Windows host.
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) return false;
    if (current === base || current === dirname(current)) break;
    current = dirname(current);
  }
  return true;
}

// Keep the same length and source offsets while masking JSONC comments.
function maskComments(input) {
  const chars = input.split("");
  let string = false;
  let escaped = false;
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (string) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') string = false;
      continue;
    }
    if (c === '"') { string = true; continue; }
    if (c === "/" && chars[i + 1] === "/") {
      while (i < chars.length && chars[i] !== "\n" && chars[i] !== "\r") chars[i++] = " ";
      i--;
    } else if (c === "/" && chars[i + 1] === "*") {
      const start = i;
      chars[i++] = " "; chars[i++] = " ";
      while (i < chars.length && !(chars[i] === "*" && chars[i + 1] === "/")) {
        if (chars[i] !== "\n" && chars[i] !== "\r") chars[i] = " ";
        i++;
      }
      if (i >= chars.length) throw new Error(`Unterminated JSONC comment at ${start}`);
      chars[i++] = " "; chars[i] = " ";
    }
  }
  if (string) throw new Error("Unterminated JSONC string");
  return chars.join("");
}

function stripTrailingCommas(masked) {
  const chars = masked.split("");
  let inString = false;
  let escaped = false;
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === ",") {
      let j = i + 1;
      while (/\s/.test(chars[j] || "") && j < chars.length) j++;
      if (chars[j] === "}" || chars[j] === "]") chars[i] = " ";
    }
  }
  return chars.join("");
}

function parseSettings(raw) {
  const masked = maskComments(raw);
  const parsed = JSON.parse(stripTrailingCommas(masked));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("VS Code settings must be a JSON object");
  }
  return { parsed, masked };
}

// Patch only at the top level, preserving the user's existing formatting, comments,
// JSONC trailing commas, values, and unrelated properties byte for byte.
function appendMissing(raw, masked, parsed, additions) {
  const closing = masked.lastIndexOf("}");
  let last = closing - 1;
  while (last >= 0 && /\s/.test(masked[last])) last--;
  const occupied = Object.keys(parsed).length > 0;
  const needsComma = occupied && masked[last] !== ",";
  const before = needsComma
    ? raw.slice(0, last + 1) + "," + raw.slice(last + 1, closing)
    : raw.slice(0, closing);
  const lines = Object.entries(additions)
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`)
    .join(",\n");
  const updated = before + "\n" + lines + "\n" + raw.slice(closing);
  const result = parseSettings(updated).parsed;
  const expected = { ...parsed, ...additions };
  if (JSON.stringify(result) !== JSON.stringify(expected)) {
    throw new Error("Unable to safely merge VS Code settings");
  }
  return updated;
}

function planSettings(target, home, template, env) {
  const label = relative(home, target);
  const wsl = Boolean(env.WSL_DISTRO_NAME || env.WSL_INTEROP);
  if (!settingsParentIsSafe(target, home, wsl)) {
    return { target, label, action: "skip", reason: "unsafe VS Code settings directory" };
  }
  const stat = lstatOrNull(target);
  if (!stat) return { target, label, action: "create", template };
  if (!stat.isFile() || stat.isSymbolicLink()) {
    return { target, label, action: "skip", reason: "existing VS Code settings are not a regular file" };
  }
  try {
    const raw = readFileSync(target, "utf8");
    const { parsed, masked } = parseSettings(raw);
    const additions = Object.fromEntries(Object.entries(template).filter(([key]) =>
      !Object.hasOwn(parsed, key)));
    if (!Object.keys(additions).length) return { target, label, action: "ok" };
    const merged = appendMissing(raw, masked, parsed, additions);
    return { target, label, action: "consent", additions, merged, raw,
      mode: stat.mode & 0o777, ino: stat.ino, dev: stat.dev };
  } catch (error) {
    return { target, label, action: "skip", reason: `unsafe VS Code settings: ${error.message}` };
  }
}

function printPlan(linkPlan, settings) {
  console.log("Plan:");
  for (const entry of linkPlan) {
    console.log(`  ${entry.status === "ok" ? "ok" : "link"} ${entry.targetPath} -> ${entry.desiredLink}`);
  }
  console.log(`  VS Code ${settings.label}: ${settings.action}`);
  if (settings.action === "skip") console.log(`  skip VS Code settings: ${settings.reason}`);
  if (settings.action === "consent") {
    console.log("  Proposed missing VS Code preferences (approval required):");
    for (const [key, value] of Object.entries(settings.additions)) {
      console.log(`    ${JSON.stringify(key)}: ${JSON.stringify(value)}`);
    }
  }
}

async function approveSettings(settings) {
  if (settings.action !== "consent") return false;
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log("skip VS Code settings: cannot request consent non-interactively");
    return false;
  }
  const reader = createInterface({ input: process.stdin, output: process.stdout });
  let answer;
  try {
    answer = await reader.question("Merge the proposed missing VS Code preferences? [y/N] ");
  } finally {
    reader.close();
  }
  if (!/^(y|yes)$/i.test(answer.trim())) {
    console.log("skip VS Code settings: approval declined");
    return false;
  }
  return true;
}

function writeSettings(settings, accepted) {
  if (settings.action === "skip" || settings.action === "ok") return;
  if (!settingsParentIsSafe(settings.target, process.env.HOME, Boolean(process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP))) {
    console.log("skip VS Code settings: directory changed since preview");
    return;
  }
  if (settings.action === "consent" && !accepted) return;
  if (settings.action === "create") {
    mkdirSync(dirname(settings.target), { recursive: true });
    try {
      writeFileSync(settings.target, JSON.stringify(settings.template, null, 2) + "\n", {
        flag: "wx", mode: 0o600,
      });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      console.log("skip VS Code settings: file appeared after preview");
    }
    return;
  }
  if (!settingsUnchanged(settings)) {
    console.log("skip VS Code settings: changed since preview");
    return;
  }
  const temporary = settings.target + `.bootstrap-${process.pid}-${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, settings.merged, { flag: "wx", mode: settings.mode });
    chmodSync(temporary, settings.mode);
    // Node has no conditional rename, so recheck as the last step before replacing:
    // an editor save during the temporary write is detected and wins.
    if (!settingsUnchanged(settings)) {
      console.log("skip VS Code settings: changed since preview");
      return;
    }
    renameSync(temporary, settings.target);
  } finally {
    rmSync(temporary, { force: true });
  }
}

// Recheck before replacing any existing user-owned file (never follow symlinks).
function settingsUnchanged(settings) {
  const stat = lstatOrNull(settings.target);
  return Boolean(stat?.isFile()) && !stat.isSymbolicLink() && stat.ino === settings.ino &&
    stat.dev === settings.dev && readFileSync(settings.target, "utf8") === settings.raw;
}

export async function runBootstrap(args = process.argv.slice(2), env = process.env) {
  if (args.length !== 1 || !["--dry-run", "--apply"].includes(args[0])) {
    throw new Error("Usage: node scripts/bootstrap.mjs --dry-run | --apply");
  }
  assertSupportedPlatform();
  const home = env.HOME;
  if (!home || !isAbsolute(home)) throw new Error("HOME must be an absolute path");
  const normalizedHome = resolve(home);
  if (!statSync(normalizedHome).isDirectory()) throw new Error("HOME is not a directory");

  const linkPlan = planLinks(normalizedHome, linkEntries());
  const template = readSettingsTemplate();
  const settings = planSettings(settingsPath(normalizedHome, env), normalizedHome, template, env);
  printPlan(linkPlan, settings);
  if (args[0] === "--dry-run") return;
  const accepted = await approveSettings(settings);
  console.log("Applying:");
  applyLinks(linkPlan);
  writeSettings(settings, accepted);
  console.log("Bootstrap complete");
}

function isExecutedDirectly() {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isExecutedDirectly()) {
  runBootstrap().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
