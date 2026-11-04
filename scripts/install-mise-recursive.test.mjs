import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = resolve(dirname(fileURLToPath(import.meta.url)), "install-mise-recursive.mjs");

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "dotfiles-mise-recursive-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function touch(root, path, content = "[tools]\njq = \"latest\"\n") {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function run(root, args = [], env = {}) {
  return spawnSync(process.execPath, [script, ...args, root], {
    encoding: "utf8", env: { ...process.env, ...env }, timeout: 10000,
  });
}

function mockMise(root) {
  const bin = join(root, "bin");
  const log = join(root, "calls.jsonl");
  mkdirSync(bin);
  const executable = join(bin, "mise");
  writeFileSync(executable, `#!${process.execPath}\n` +
    'const fs = require("node:fs");\n' +
    'fs.appendFileSync(process.env.MISE_TEST_LOG, JSON.stringify({cwd:process.cwd(),args:process.argv.slice(2)})+"\\n");\n' +
    'if (process.cwd().endsWith("fails")) process.exit(7);\n');
  chmodSync(executable, 0o755);
  return { PATH: `${bin}:${process.env.PATH ?? ""}`, MISE_TEST_LOG: log, log };
}

test("preview is deterministic, recursive, and does not execute mise", (t) => {
  const root = fixture(t);
  touch(root, "a folder/mise.toml");
  touch(root, "a folder/mise.local.toml");
  touch(root, "deeper/project/.mise.toml");
  touch(root, "deeper/project/mise.dev.toml");
  touch(root, "x/.mise/config.toml");
  touch(root, "y/.config/mise/config.toml");
  touch(root, "y/.config/mise.toml");
  touch(root, "y/.config/mise/mise.toml");
  touch(root, "z/.mise/conf.d/tooling.toml");
  touch(root, "w/.config/mise/conf.d/tool-set/mise.toml");
  touch(root, "versions/.tool-versions");
  touch(root, ".git/mise.toml");
  touch(root, "node_modules/pkg/mise.toml");
  const external = fixture(t);
  touch(external, "outside/mise.toml");
  symlinkSync(join(external, "outside"), join(root, "linked"), "dir");

  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Plan: 6 mise project\(s\)/);
  assert.match(result.stdout, /a folder \(mise.local.toml, mise.toml\)/);
  assert.match(result.stdout, /deeper\/project \(\.mise.toml, mise.dev.toml\)/);
  assert.match(result.stdout, /x \(\.mise\/config.toml\)/);
  assert.match(result.stdout, /y \(\.config\/mise.toml, \.config\/mise\/config.toml, \.config\/mise\/mise.toml\)/);
  assert.match(result.stdout, /z \(\.mise\/conf.d\/tooling.toml\)/);
  assert.match(result.stdout, /w \(\.config\/mise\/conf.d\/tool-set\/mise.toml\)/);
  assert.doesNotMatch(result.stdout, /versions|linked|node_modules|\.git/);
  assert.ok(result.stdout.indexOf("a folder (") < result.stdout.indexOf("deeper/project ("));
});

test("tool-versions-only directories require a separate opt-in", (t) => {
  const root = fixture(t);
  touch(root, "project/.tool-versions", "nodejs 24\n");
  assert.match(run(root).stdout, /Plan: 0 mise project/);
  const result = run(root, ["--include-tool-versions"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /project \(\.tool-versions\)/);
});

test("apply invokes each project once and continues after failures", (t) => {
  const root = fixture(t);
  touch(root, "a/mise.toml");
  touch(root, "a/.mise.toml");
  touch(root, "fails/mise.toml");
  touch(root, "z/mise.toml");
  const mock = mockMise(root);
  const result = run(root, ["--apply"], mock);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Finished: 2 succeeded, 1 failed/);
  assert.match(result.stderr, /Failed: .*fails/);
  const calls = readFileSync(mock.log, "utf8").trim().split("\n").map(JSON.parse);
  assert.deepEqual(calls.map(({ cwd, args }) => ({ cwd, args })), [
    { cwd: root, args: ["--version"] },
    ...["a", "fails", "z"].map((p) => ({ cwd: join(root, p), args: ["install"] })),
  ]);
});

test("invalid arguments fail without running installation", (t) => {
  const root = fixture(t);
  touch(root, "mise.toml");
  const mock = mockMise(root);
  const result = run(root, ["--unknown"], mock);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown option/);
});
