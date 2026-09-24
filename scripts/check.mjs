import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const jsonFiles = [
  ".oxfmtrc.json",
  ".oxlintrc.json",
  ".vscode/extensions.json",
  ".vscode/settings.json",
];

for (const path of jsonFiles) {
  JSON.parse(readFileSync(path, "utf8"));
}

for (const [command, args] of [
  ["git", ["config", "--file", ".gitconfig", "--list"]],
  ["node", ["--check", "eslint.config.mjs"]],
  ["git", ["diff", "--check"]],
]) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("dotfiles configuration checks passed");
