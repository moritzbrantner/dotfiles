import { spawnSync } from "node:child_process";

for (const [command, args] of [
  ["node", ["scripts/validate-configs.mjs"]],
  ["node", ["--test", "skills/work-loop/workctl.test.mjs"]],
  ["node", ["--test", "scripts/bootstrap.test.mjs"]],
  ...(process.platform === "linux"
    ? [["node", ["--test", "scripts/disk-maintenance.test.mjs"]]]
    : []),
  ["git", ["diff", "--check"]],
  ["git", ["diff", "--cached", "--check"]],
]) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("dotfiles configuration checks passed");
