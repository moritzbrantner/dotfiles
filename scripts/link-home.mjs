import {
  lstatSync,
  mkdirSync,
  readlinkSync,
  statSync,
  symlinkSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const home = process.env.HOME;

if (!home) {
  throw new Error("HOME is not set");
}

const dryRun = process.argv.includes("--dry-run");
const links = [
  [".gitconfig", ".gitconfig"],
  [".editorconfig", ".editorconfig"],
  [".config/git/ignore", ".config/git/ignore"],
];

// Plan every link before touching the filesystem so a refusal never leaves a partial setup.
const plan = [];
for (const [sourcePath, targetPath] of links) {
  const source = resolve(repositoryRoot, sourcePath);
  const target = resolve(home, targetPath);
  const targetDirectory = dirname(target);
  const desiredLink = relative(targetDirectory, source);

  assertDirectoryUsable(targetDirectory);

  // lstat (not existsSync) so a dangling symlink still counts as an existing target.
  const stat = lstatOrNull(target);
  if (stat) {
    if (stat.isSymbolicLink()) {
      const currentTarget = resolve(targetDirectory, readlinkSync(target));
      if (currentTarget === source) {
        console.log(`ok      ${targetPath}`);
        continue;
      }
    }

    throw new Error(
      `Refusing to replace existing ${target}. Move it aside explicitly before linking.`,
    );
  }

  plan.push({ targetPath, target, targetDirectory, desiredLink });
}

for (const { targetPath, target, targetDirectory, desiredLink } of plan) {
  console.log(`${dryRun ? "would link" : "link"} ${targetPath} -> ${desiredLink}`);
  if (dryRun) {
    continue;
  }

  mkdirSync(targetDirectory, { recursive: true });
  symlinkSync(desiredLink, target);
}

// Walk up to the nearest existing ancestor: it must resolve to a directory. A dangling
// symlink or a regular file there would make mkdirSync fail midway through a real run.
function assertDirectoryUsable(directory) {
  let current = directory;
  while (!lstatOrNull(current)) {
    const parent = dirname(current);
    if (parent === current) {
      return;
    }
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
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      return null;
    }
    throw error;
  }
}
