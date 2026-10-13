import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  readlinkSync, readdirSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bootstrap = join(root, "scripts/bootstrap.mjs");
const settingsTemplate = JSON.parse(readFileSync(join(root, ".vscode/settings.json"), "utf8"));
const skills = readdirSync(join(root, "skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

function fixture(t) {
  const home = mkdtempSync(join(tmpdir(), "dotfiles-bootstrap-"));
  t.after(() => rmSync(home, { recursive: true, force: true }));
  return home;
}

function environment(home, overrides = {}) {
  const env = { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, ".config") };
  delete env.WSL_DISTRO_NAME;
  delete env.WSL_INTEROP;
  return { ...env, ...overrides };
}

function run(home, args, overrides = {}) {
  return spawnSync(process.execPath, [bootstrap, ...args], {
    cwd: root, env: environment(home, overrides),
    encoding: "utf8", timeout: 10000,
  });
}

function assertLink(home, target, source) {
  const path = join(home, target);
  assert.equal(lstatSync(path).isSymbolicLink(), true, target);
  assert.equal(resolve(dirname(path), readlinkSync(path)), resolve(root, source), target);
}

test("preview shows every target and does not create even parent directories", (t) => {
  const home = fixture(t);
  const result = run(home, ["--dry-run"]);
  assert.equal(result.status, 0, result.stderr);
  for (const target of [".gitconfig", ".editorconfig", ".config/git/ignore",
    ".local/share/coding-agent/workctl.mjs", ".config/Code/User/settings.json",
    ...skills.map((s) => `.agents/skills/${s}`),
    ...skills.map((s) => `.claude/skills/${s}`)]) {
    assert.ok(result.stdout.includes(target), `preview missing ${target}`);
  }
  assert.deepEqual(readdirSync(home), []);
});

test("apply installs existing targets, then remains idempotent", (t) => {
  const home = fixture(t);
  const result = run(home, ["--apply"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Plan:/);
  const applying = result.stdout.indexOf("Applying:");
  assert.ok(applying > result.stdout.indexOf("Plan:"), "plan must be printed before changes");
  for (const target of [".gitconfig", ".editorconfig", ".config/git/ignore",
    ".local/share/coding-agent/workctl.mjs", ".config/Code/User/settings.json",
    ...skills.map((s) => `.agents/skills/${s}`),
    ...skills.map((s) => `.claude/skills/${s}`)]) {
    const i = result.stdout.indexOf(target);
    assert.ok(i >= 0 && i < applying, `missing pre-apply preview for ${target}`);
  }
  for (const path of [".gitconfig", ".editorconfig", ".config/git/ignore"]) {
    assertLink(home, path, path);
  }
  for (const name of skills) {
    assertLink(home, `.agents/skills/${name}`, `skills/${name}`);
    assertLink(home, `.claude/skills/${name}`, `skills/${name}`);
  }
  assertLink(home, ".local/share/coding-agent/workctl.mjs", "skills/work-loop/workctl.mjs");
  const settings = join(home, ".config/Code/User/settings.json");
  assert.deepEqual(JSON.parse(readFileSync(settings, "utf8")), settingsTemplate);
  const again = run(home, ["--apply"]);
  assert.equal(again.status, 0, again.stderr);
  assert.deepEqual(JSON.parse(readFileSync(settings, "utf8")), settingsTemplate);
  for (const name of skills) {
    assertLink(home, `.agents/skills/${name}`, `skills/${name}`);
    assertLink(home, `.claude/skills/${name}`, `skills/${name}`);
  }
  for (const path of [".gitconfig", ".editorconfig", ".config/git/ignore"]) {
    assertLink(home, path, path);
  }
  assertLink(home, ".local/share/coding-agent/workctl.mjs", "skills/work-loop/workctl.mjs");
});

test("conflicting regular file refuses all links before creating any", (t) => {
  const home = fixture(t);
  const target = join(home, ".agents/skills/steer");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, "user content");
  const result = run(home, ["--apply"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /refus|conflict|already exist/i);
  assert.equal(readFileSync(target, "utf8"), "user content");
  assert.equal(existsSync(join(home, ".gitconfig")), false);
  assert.equal(existsSync(join(home, ".claude")), false);
});

test("unrelated existing symlink is not overwritten and blocks all links", (t) => {
  const home = fixture(t);
  const unrelated = join(home, "preserved-user-file");
  writeFileSync(unrelated, "keep me");
  const target = join(home, ".agents/skills/steer");
  mkdirSync(dirname(target), { recursive: true });
  symlinkSync(unrelated, target);
  const result = run(home, ["--apply"]);
  assert.notEqual(result.status, 0);
  assert.equal(readlinkSync(target), unrelated);
  assert.equal(readFileSync(unrelated, "utf8"), "keep me");
  assert.equal(existsSync(join(home, ".gitconfig")), false);
});

test("pre-apply plan is complete before any filesystem writes", (t) => {
  const home = fixture(t);
  const watch = mkdtempSync(join(tmpdir(), "bootstrap-watch-"));
  t.after(() => rmSync(watch, { recursive: true, force: true }));
  const preload = join(watch, "preload.mjs");
  const targets = [".gitconfig", ".editorconfig", ".config/git/ignore",
    ".local/share/coding-agent/workctl.mjs", ".config/Code/User/settings.json",
    ...skills.map((name) => `.agents/skills/${name}`),
    ...skills.map((name) => `.claude/skills/${name}`)];
  const code = `
    import fs from "node:fs";
    import { syncBuiltinESMExports } from "node:module";
    let stdout = "";
    const originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk, ...rest) => {
      stdout += chunk.toString();
      return originalWrite(chunk, ...rest);
    };
    for (const name of ["mkdirSync", "symlinkSync", "writeFileSync", "renameSync"]) {
      const original = fs[name].bind(fs);
      fs[name] = (...args) => {
        const required = ${JSON.stringify(targets)};
        if (!stdout.includes("Plan:") || !stdout.includes("Applying:") ||
          required.some((t) => stdout.indexOf(t) < 0 || stdout.indexOf(t) > stdout.indexOf("Applying:"))) {
          throw new Error("filesystem mutation before complete published plan: " + name);
        }
        return original(...args);
      };
    }
    syncBuiltinESMExports();
  `;
  writeFileSync(preload, code);
  const result = spawnSync(process.execPath, ["--import", pathToFileURL(preload).href,
    bootstrap, "--apply"], {
    cwd: root, env: environment(home), encoding: "utf8", timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr);
  assertLink(home, ".gitconfig", ".gitconfig");
});

test("dangling link in an ancestor fails without other mutations", (t) => {
  const home = fixture(t);
  symlinkSync(join(home, "missing"), join(home, ".claude"));
  const result = run(home, ["--apply"]);
  assert.notEqual(result.status, 0);
  assert.equal(existsSync(join(home, ".gitconfig")), false);
});

test("existing VS Code preferences are skipped without interactive approval", (t) => {
  const home = fixture(t);
  const target = join(home, ".config/Code/User/settings.json");
  mkdirSync(dirname(target), { recursive: true });
  const previous = '{\n  "editor.minimap.enabled": true,\n  "custom.preference": 42\n}\n';
  writeFileSync(target, previous);
  const result = run(home, ["--apply"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout + result.stderr, /skip.*VS Code|VS Code.*skip/i);
  assert.equal(readFileSync(target, "utf8"), previous);
  assertLink(home, ".gitconfig", ".gitconfig");
});

test("invalid user settings are preserved without blocking safe links", (t) => {
  const home = fixture(t);
  const target = join(home, ".config/Code/User/settings.json");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, "{ broken JSONC");
  const result = run(home, ["--apply"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(target, "utf8"), "{ broken JSONC");
  assert.match(result.stdout + result.stderr, /skip.*VS Code|VS Code.*skip/i);
  assertLink(home, ".gitconfig", ".gitconfig");
});

test("WSL configures remote machine settings but not Windows-hosted settings", (t) => {
  const home = fixture(t);
  const win = join(home, "windows-host/Code/User/settings.json");
  mkdirSync(dirname(win), { recursive: true });
  writeFileSync(win, '{"host":true}');
  const result = run(home, ["--apply"], {
    WSL_DISTRO_NAME: "Ubuntu",
    APPDATA: dirname(dirname(win)),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    JSON.parse(readFileSync(join(home, ".vscode-server/data/Machine/settings.json"), "utf8")),
    settingsTemplate,
  );
  assert.equal(readFileSync(win, "utf8"), '{"host":true}');
  assert.equal(existsSync(join(home, ".config/Code/User/settings.json")), false);
});

test("native Windows is rejected by the actual CLI before any filesystem writes", (t) => {
  const home = fixture(t);
  const watch = mkdtempSync(join(tmpdir(), "bootstrap-platform-"));
  t.after(() => rmSync(watch, { recursive: true, force: true }));
  const preload = join(watch, "pretend-windows.mjs");
  writeFileSync(preload, 'Object.defineProperty(process, "platform", { value: "win32" });\n');
  const result = spawnSync(process.execPath, ["--import", pathToFileURL(preload).href,
    bootstrap, "--apply"], {
    cwd: root, env: environment(home), encoding: "utf8", timeout: 10000,
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Linux|WSL|unsupported/i);
  assert.deepEqual(readdirSync(home), []);
});

function interactiveApply(home, answer) {
  const shellQuote = (s) => "'" + s.replaceAll("'", "'\\''") + "'";
  const command = shellQuote(process.execPath) + " " + shellQuote(bootstrap) + " --apply";
  return spawnSync("script", ["-q", "-e", "-c", command, "/dev/null"], {
    cwd: root, env: environment(home),
    input: answer + "\n", encoding: "utf8", timeout: 12000,
  });
}

function existingPreferences(home) {
  const target = join(home, ".config/Code/User/settings.json");
  mkdirSync(dirname(target), { recursive: true });
  const original = '{\n  "editor.minimap.enabled": true,\n  "custom.preference": 42\n}\n';
  writeFileSync(target, original);
  return { target, original };
}

function requirePseudoterminal(t) {
  if (spawnSync("script", ["--version"]).error?.code === "ENOENT") {
    t.skip("util-linux script is required for a pseudo-terminal acceptance run");
    return false;
  }
  return true;
}

test("interactive approval merges every missing preference without changing overrides", (t) => {
  if (!requirePseudoterminal(t)) return;
  const home = fixture(t);
  const { target } = existingPreferences(home);
  const result = interactiveApply(home, "y");
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const approvalIndex = result.stdout.indexOf("[y/N]");
  assert.ok(approvalIndex > 0, `missing approval prompt: ${result.stdout}`);
  for (const missingKey of Object.keys(settingsTemplate).filter(
    (k) => k !== "editor.minimap.enabled")) {
    assert.ok(result.stdout.indexOf(missingKey) >= 0 &&
      result.stdout.indexOf(missingKey) < approvalIndex,
    `missing preference not shown before approval: ${missingKey}`);
  }
  const merged = JSON.parse(readFileSync(target, "utf8"));
  assert.deepEqual(merged, {
    ...settingsTemplate,
    "editor.minimap.enabled": true,
    "custom.preference": 42,
  });
});

test("declined permission preserves settings and still installs other links", (t) => {
  if (!requirePseudoterminal(t)) return;
  const home = fixture(t);
  const { target, original } = existingPreferences(home);
  const result = interactiveApply(home, "n");
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /skip.*VS Code|VS Code.*skip/i);
  assert.equal(readFileSync(target, "utf8"), original);
  assertLink(home, ".gitconfig", ".gitconfig");
});

test("approved merge preserves valid JSONC comments, trailing commas, and overrides", (t) => {
  if (!requirePseudoterminal(t)) return;
  const home = fixture(t);
  const target = join(home, ".config/Code/User/settings.json");
  mkdirSync(dirname(target), { recursive: true });
  const original = '{\n  // Personal choice\n  "editor.minimap.enabled": true, // keep this\n  "custom.preference": 42,\n}\n';
  writeFileSync(target, original);
  const result = interactiveApply(home, "y");
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const current = readFileSync(target, "utf8");
  assert.ok(current.includes("// Personal choice"));
  assert.ok(current.includes("// keep this"));
  assert.ok(current.includes('"editor.minimap.enabled": true'));
  assert.ok(current.includes('"custom.preference": 42'));
  for (const key of Object.keys(settingsTemplate)) {
    assert.ok(current.includes(JSON.stringify(key)), `missing JSONC setting: ${key}`);
  }
});

test("does not call code or install extensions while applying settings", (t) => {
  const home = fixture(t);
  const tools = mkdtempSync(join(tmpdir(), "bootstrap-fake-bin-"));
  t.after(() => rmSync(tools, { recursive: true, force: true }));
  const sentinel = join(tools, "code-was-run");
  const shim = join(tools, "code");
  writeFileSync(shim, `#!/bin/sh\nprintf called > ${JSON.stringify(sentinel)}\nexit 90\n`, { mode: 0o755 });
  const result = run(home, ["--apply"], { PATH: tools + ":" + process.env.PATH });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(sentinel), false, "bootstrap launched VS Code CLI");
});
