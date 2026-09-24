import {
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
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

for (const [sourcePath, targetPath] of links) {
  const source = resolve(repositoryRoot, sourcePath);
  const target = resolve(home, targetPath);
  const targetDirectory = dirname(target);
  const desiredLink = relative(targetDirectory, source);

  if (existsSync(target)) {
    const stat = lstatSync(target);
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

  console.log(`${dryRun ? "would link" : "link"} ${targetPath} -> ${desiredLink}`);
  if (dryRun) {
    continue;
  }

  mkdirSync(targetDirectory, { recursive: true });
  symlinkSync(desiredLink, target);
}
