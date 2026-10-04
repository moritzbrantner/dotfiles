import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const jsonFiles = [
  ".oxfmtrc.json",
  ".oxlintrc.json",
  ".vscode/extensions.json",
  ".vscode/settings.json",
];

for (const path of jsonFiles) {
  JSON.parse(readFileSync(resolve(repositoryRoot, path), "utf8"));
}

run("git", ["config", "--file", ".gitconfig", "--list"]);

run("eslint", ["--config", "eslint.config.mjs", "--print-config", "scripts/check.mjs"], {
  quietStdout: true,
  windowsShim: true,
});
run("oxlint", ["--config", ".oxlintrc.json", "scripts/check.mjs"], { windowsShim: true });
run("oxfmt", ["--config", ".oxfmtrc.json", "--check", "scripts/check.mjs"], {
  windowsShim: true,
});

console.log("configuration validators passed");

function run(command, args, { quietStdout = false, windowsShim = false } = {}) {
  const options = {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", quietStdout ? "ignore" : "inherit", "inherit"],
  };
  const useWindowsShell = windowsShim && process.platform === "win32";
  const result = useWindowsShell
    ? spawnSync(windowsShellCommand(command, args), { ...options, shell: true })
    : spawnSync(command, args, options);

  if (result.error?.code === "ENOENT") {
    throw new Error(
      `${command} is required to validate dotfiles configuration; install it explicitly before running checks`,
    );
  }

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}


function windowsShellCommand(command, args) {
  const tokens = [command, ...args];
  const shellSafe = /^[A-Za-z0-9_./:@=-]+$/;
  if (tokens.some((token) => !shellSafe.test(token))) {
    throw new Error("Windows validator command contains a shell-unsafe token");
  }
  return tokens.join(" ");
}
