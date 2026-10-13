import {
  lstatSync,
  mkdirSync,
  readlinkSync,
  realpathSync,
  statSync,
  symlinkSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const homeLinks = [
  [".gitconfig", ".gitconfig"],
  [".editorconfig", ".editorconfig"],
  [".config/git/ignore", ".config/git/ignore"],
];

// Shared preflight for the standalone home linker and the complete bootstrap.
// Complete the entire plan before creating any directories or symlinks.
export function planLinks(home, entries) {
  const plan = [];
  for (const [sourcePath, targetPath] of entries) {
    const source = resolve(repositoryRoot, sourcePath);
    const target = resolve(home, targetPath);
    const targetDirectory = dirname(target);
    // The kernel resolves a relative link from the physical directory, which differs
    // from the lexical one when an ancestor (such as ~/.claude) is itself a symlink.
    const physicalDirectory = physicalPath(targetDirectory);
    const desiredLink = relative(physicalDirectory, source);

    const stat = lstatOrNull(target);
    if (stat) {
      if (stat.isSymbolicLink()) {
        const currentTarget = resolve(physicalDirectory, readlinkSync(target));
        if (currentTarget === source) {
          plan.push({ targetPath, target, targetDirectory, physicalDirectory, desiredLink, status: "ok" });
          continue;
        }
      }
      throw new Error(
        `Refusing to replace existing ${target}. Move it aside explicitly before linking.`,
      );
    }
    plan.push({ targetPath, target, targetDirectory, physicalDirectory, desiredLink, status: "create" });
  }
  return plan;
}

// The preview may be followed by an interactive prompt, so verify that every planned
// parent still resolves to the previewed directory before the first mutation, and
// again right before each link.
export function applyLinks(plan) {
  const pending = plan.filter((entry) => entry.status === "create");
  for (const entry of pending) assertUnchanged(entry);
  for (const entry of pending) {
    assertUnchanged(entry);
    mkdirSync(entry.targetDirectory, { recursive: true });
    symlinkSync(entry.desiredLink, entry.target);
  }
}

function assertUnchanged(entry) {
  let physicalDirectory;
  try {
    physicalDirectory = physicalPath(entry.targetDirectory);
  } catch {
    physicalDirectory = null;
  }
  if (physicalDirectory !== entry.physicalDirectory || lstatOrNull(entry.target)) {
    throw new Error(`Refusing to link ${entry.target}: it changed since preview. Run bootstrap again.`);
  }
}

// Resolve the nearest existing ancestor physically and append the missing remainder.
function physicalPath(directory) {
  let current = directory;
  while (!lstatOrNull(current)) {
    const parent = dirname(current);
    if (parent === current) return directory;
    current = parent;
  }

  let resolved;
  try {
    resolved = statSync(current);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        `Refusing to link under ${current}: it is a dangling symlink. Fix or move it aside first.`,
      );
    }
    throw error;
  }
  if (!resolved.isDirectory()) {
    throw new Error(`Refusing to link under ${current}: it is not a directory.`);
  }
  return resolve(realpathSync(current), relative(current, directory));
}

function lstatOrNull(path) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
    throw error;
  }
}

function isExecutedDirectly() {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isExecutedDirectly()) {
  try {
    const home = process.env.HOME;
    if (!home) throw new Error("HOME is not set");
    const dryRun = process.argv.includes("--dry-run");
    const plan = planLinks(home, homeLinks);
    for (const item of plan) {
      if (item.status === "ok") console.log(`ok      ${item.targetPath}`);
      else console.log(`${dryRun ? "would link" : "link"} ${item.targetPath} -> ${item.desiredLink}`);
    }
    if (!dryRun) applyLinks(plan);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
