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
    const desiredLink = relative(targetDirectory, source);

    assertDirectoryUsable(targetDirectory);
    const stat = lstatOrNull(target);
    if (stat) {
      if (stat.isSymbolicLink()) {
        const currentTarget = resolve(targetDirectory, readlinkSync(target));
        if (currentTarget === source) {
          plan.push({ targetPath, target, targetDirectory, desiredLink, status: "ok" });
          continue;
        }
      }
      throw new Error(
        `Refusing to replace existing ${target}. Move it aside explicitly before linking.`,
      );
    }
    plan.push({ targetPath, target, targetDirectory, desiredLink, status: "create" });
  }
  return plan;
}

export function applyLinks(plan) {
  for (const entry of plan) {
    if (entry.status !== "create") continue;
    mkdirSync(entry.targetDirectory, { recursive: true });
    symlinkSync(entry.desiredLink, entry.target);
  }
}

function assertDirectoryUsable(directory) {
  let current = directory;
  while (!lstatOrNull(current)) {
    const parent = dirname(current);
    if (parent === current) return;
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
