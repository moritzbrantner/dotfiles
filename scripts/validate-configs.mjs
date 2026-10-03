import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
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

const temporaryDirectory = mkdtempSync(join(tmpdir(), "dotfiles-config-validation-"));
const javascriptFixture = join(temporaryDirectory, "fixture.js");
writeFileSync(javascriptFixture, "export {};\n");

try {
  run("eslint", ["--config", "eslint.config.mjs", "--print-config", "scripts/check.mjs"], {
    quietStdout: true,
    windowsShim: true,
  });
  run("oxlint", ["--config", ".oxlintrc.json", javascriptFixture], { windowsShim: true });
  run("oxfmt", ["--config", ".oxfmtrc.json", "--check", javascriptFixture], {
    windowsShim: true,
  });
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log("configuration validators passed");

function run(command, args, { quietStdout = false, windowsShim = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", quietStdout ? "ignore" : "inherit", "inherit"],
    shell: windowsShim && process.platform === "win32",
  });

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
