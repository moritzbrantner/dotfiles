import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(repository, "scripts/disk-maintenance.py");
const day = 86400000;

function fixture(t, overrides = {}) {
  const home = mkdtempSync(join(tmpdir(), "disk-maintenance-acceptance-"));
  t.after(() => rmSync(home, { recursive: true, force: true }));
  const workspace = join(home, "workspace");
  mkdirSync(workspace);
  const config = join(home, "config.json");
  writeFileSync(config, JSON.stringify({ schemaVersion: 1, roots: [workspace], maxAgeDays: 7,
    maxTargetBytes: 10737418240, quietHours: 24, minFreeBytes: 0,
    restoreFreeBytes: 0, packageCaches: false, cacheMaxBytes: 1073741824, ...overrides }));
  return { home, workspace, config, env: { ...process.env, HOME: home, XDG_CACHE_HOME: join(home, "cache") } };
}

function cargoTarget(f, checkout, ageDays = 10, name = "target") {
  const target = join(f.workspace, checkout, name);
  mkdirSync(join(target, "debug"), { recursive: true });
  writeFileSync(join(target, ".rustc_info.json"), "{}");
  writeFileSync(join(target, "debug", "output"), "disposable build artifact");
  ageTree(target, ageDays);
  return target;
}

function ageTree(path, ageDays) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) ageTree(child, ageDays);
    else utimesSync(child, new Date(Date.now() - ageDays * day), new Date(Date.now() - ageDays * day));
  }
  utimesSync(path, new Date(Date.now() - ageDays * day), new Date(Date.now() - ageDays * day));
}

function invoke(f, args) {
  return spawnSync("python3", [cli, ...args], { cwd: repository, env: f.env, encoding: "utf8", timeout: 10000 });
}

function maintain(f, apply = false) {
  const result = invoke(f, ["maintain", "--config", f.config, ...(apply ? ["--apply"] : [])]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.ok(Array.isArray(report.actions));
  for (const action of report.actions) {
    assert.ok(["remove", "skip"].includes(action.action));
    assert.equal(typeof action.reason, "string");
  }
  return report.actions;
}

function isRemoval(actions, path) {
  return actions.some((action) => action.path === path && action.action === "remove");
}

async function waitFor(predicate, message) {
  const deadline = Date.now() + 5000;
  while (!predicate() && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 20));
  assert.ok(predicate(), message);
}

async function sleeper(t, f, options = {}) {
  const child = spawn(process.execPath, ["-e", options.code ?? "process.stdout.write('ready'); setInterval(() => {}, 1000)", ...(options.args ?? [])],
    { cwd: options.cwd ?? repository, env: f.env, stdio: ["ignore", "pipe", "pipe"] });
  let ready = false;
  child.stdout.on("data", () => { ready = true; });
  t.after(() => child.kill("SIGKILL"));
  await waitFor(() => ready, "fixture process did not become ready");
  return child;
}

test("dry run previews stale Cargo outputs and apply deletes only those outputs", (t) => {
  const f = fixture(t);
  const stale = cargoTarget(f, "stale");
  const recent = cargoTarget(f, "recent", 0);
  const alternate = cargoTarget(f, "alternate", 10, ".cargo-target");
  const source = join(f.workspace, "stale", "Cargo.toml");
  writeFileSync(source, "[package]\nname='preserved'\n");
  const unrelated = join(f.workspace, "ordinary", "target");
  mkdirSync(unrelated, { recursive: true });
  writeFileSync(join(unrelated, "personal-data"), "keep");
  const cache = join(f.home, "cache", "other-app");
  mkdirSync(cache, { recursive: true });
  writeFileSync(join(cache, "data"), "keep");
  const preview = maintain(f);
  assert.ok(isRemoval(preview, stale));
  assert.ok(isRemoval(preview, alternate));
  assert.equal(isRemoval(preview, recent), false);
  assert.ok(existsSync(stale), "default command mutated outputs");
  maintain(f, true);
  assert.equal(existsSync(stale), false);
  assert.equal(existsSync(alternate), false);
  assert.ok(existsSync(recent));
  assert.equal(readFileSync(source, "utf8"), "[package]\nname='preserved'\n");
  assert.equal(readFileSync(join(unrelated, "personal-data"), "utf8"), "keep");
  assert.equal(readFileSync(join(cache, "data"), "utf8"), "keep");
  assert.equal(maintain(f, true).some((action) => action.action === "remove"), false);
});

test("newest nested artifact protects an otherwise stale target", (t) => {
  const f = fixture(t);
  const target = cargoTarget(f, "fresh-artifact");
  writeFileSync(join(target, "debug", "output"), "new build");
  assert.equal(isRemoval(maintain(f, true), target), false);
  assert.ok(existsSync(target));
});

test("oversized outputs require a quiet period", (t) => {
  const f = fixture(t, { maxTargetBytes: 1 });
  const quiet = cargoTarget(f, "quiet", 2);
  const active = cargoTarget(f, "recent", 0);
  const actions = maintain(f, true);
  assert.ok(isRemoval(actions, quiet));
  assert.equal(existsSync(quiet), false);
  assert.equal(isRemoval(actions, active), false);
  assert.ok(existsSync(active));
});

test("low free space can remove quiet younger outputs but preserves recent builds", (t) => {
  const f = fixture(t, { minFreeBytes: Number.MAX_SAFE_INTEGER, restoreFreeBytes: Number.MAX_SAFE_INTEGER });
  const quiet = cargoTarget(f, "quiet", 2);
  const recent = cargoTarget(f, "recent", 0);
  maintain(f, true);
  assert.equal(existsSync(quiet), false);
  assert.ok(existsSync(recent));
});

test("symlink targets and symlinked checkout ancestors never authorize deletion outside roots", (t) => {
  const f = fixture(t);
  const outside = join(f.home, "outside");
  mkdirSync(join(outside, "target", "debug"), { recursive: true });
  writeFileSync(join(outside, "target", ".rustc_info.json"), "{}");
  writeFileSync(join(outside, "target", "debug", "precious"), "preserve");
  ageTree(outside, 10);
  mkdirSync(join(f.workspace, "linked-target"));
  symlinkSync(join(outside, "target"), join(f.workspace, "linked-target", "target"));
  symlinkSync(outside, join(f.workspace, "linked-checkout"));
  maintain(f, true);
  assert.equal(readFileSync(join(outside, "target", "debug", "precious"), "utf8"), "preserve");
  assert.ok(existsSync(join(f.workspace, "linked-target", "target")));
  assert.ok(existsSync(join(f.workspace, "linked-checkout")));
});

test("Git tracked files inside Cargo-looking targets are preserved", (t) => {
  const f = fixture(t);
  const target = cargoTarget(f, "tracked");
  const checkout = dirname(target);
  for (const args of [["init", "-q", checkout], ["-C", checkout, "add", "target"]]) {
    const result = spawnSync("git", args, { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  }
  maintain(f, true);
  assert.ok(existsSync(join(target, "debug", "output")));
});

for (const kind of ["cwd", "args", "open file", "mapped file"]) {
  test(`a live process ${kind} protects its containing checkout outputs`, async (t) => {
    const f = fixture(t);
    const target = cargoTarget(f, "busy");
    const checkout = dirname(target);
    const held = join(checkout, "held-source");
    writeFileSync(held, "source held by running process");
    if (kind === "cwd") await sleeper(t, f, { cwd: checkout });
    else if (kind === "args") await sleeper(t, f, { args: [held] });
    else if (kind === "open file") await sleeper(t, f, { code: `require('node:fs').openSync(${JSON.stringify(held)}, 'r'); process.stdout.write('ready'); setInterval(() => {}, 1000)` });
    else {
      const child = spawn("python3", ["-c", "import mmap,sys,time; f=open(sys.argv[1],'r+b'); m=mmap.mmap(f.fileno(),0); f.close(); print('ready',flush=True); time.sleep(60)", held], { cwd: repository, env: f.env, stdio: ["ignore", "pipe", "pipe"] });
      t.after(() => child.kill("SIGKILL"));
      let ready = false;
      child.stdout.on("data", () => { ready = true; });
      await waitFor(() => ready, "mapped-file fixture did not become ready");
    }
    const actions = maintain(f, true);
    assert.equal(isRemoval(actions, target), false);
    assert.ok(existsSync(target));
  });
}

for (const status of [0, 23]) {
  test(`isolated command propagates exit ${status} and removes its own build directory`, (t) => {
    const f = fixture(t);
    const evidence = join(f.home, "child-evidence.json");
    const code = `const fs=require('node:fs'); const p=process.env.CARGO_TARGET_DIR; fs.mkdirSync(p,{recursive:true}); fs.writeFileSync(p+'/output','build'); fs.writeFileSync(${JSON.stringify(evidence)}, JSON.stringify({target:p,incremental:process.env.CARGO_INCREMENTAL})); process.exit(${status});`;
    const result = invoke(f, ["run", "--config", f.config, "--", process.execPath, "-e", code]);
    assert.equal(result.status, status, result.stderr);
    const child = JSON.parse(readFileSync(evidence, "utf8"));
    assert.equal(child.incremental, "0");
    assert.ok(child.target.startsWith(join(f.home, "cache", "coding-agent-builds") + "/"));
    assert.equal(existsSync(child.target), false);
  });
}

test("low disk space refuses isolated commands before starting their work", (t) => {
  const f = fixture(t, { minFreeBytes: Number.MAX_SAFE_INTEGER, restoreFreeBytes: Number.MAX_SAFE_INTEGER });
  const evidence = join(f.home, "must-not-start");
  const result = invoke(f, ["run", "--config", f.config, "--", process.execPath, "-e", `require('node:fs').writeFileSync(${JSON.stringify(evidence)}, 'started')`]);
  assert.notEqual(result.status, 0);
  assert.equal(existsSync(evidence), false);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  test(`isolated command cleans temporary outputs after ${signal}`, async (t) => {
    const f = fixture(t);
    const evidence = join(f.home, "child-ready.json");
    const code = `const fs=require('node:fs'); const p=process.env.CARGO_TARGET_DIR; fs.mkdirSync(p,{recursive:true}); fs.writeFileSync(p+'/output','build'); fs.writeFileSync(${JSON.stringify(evidence)}, JSON.stringify({target:p,pid:process.pid})); setInterval(()=>{},1000);`;
    const wrapper = spawn("python3", [cli, "run", "--config", f.config, "--", process.execPath, "-e", code], { cwd: repository, env: f.env, stdio: "ignore" });
    t.after(() => wrapper.kill("SIGKILL"));
    await waitFor(() => existsSync(evidence), "isolated command failed to start");
    const child = JSON.parse(readFileSync(evidence, "utf8"));
    t.after(() => { try { process.kill(child.pid, "SIGKILL"); } catch {} });
    wrapper.kill(signal);
    await waitFor(() => wrapper.exitCode !== null || wrapper.signalCode !== null, "wrapper did not exit after signal");
    await waitFor(() => !existsSync(child.target), "temporary build outputs remain after signal");
    assert.throws(() => process.kill(child.pid, 0), "child command remained running after wrapper signal");
  });
}

test("invalid config is rejected without deleting otherwise eligible outputs", (t) => {
  const f = fixture(t, { schemaVersion: 999 });
  const target = cargoTarget(f, "stale");
  const result = invoke(f, ["maintain", "--config", f.config, "--apply"]);
  assert.notEqual(result.status, 0);
  assert.ok(existsSync(target));
});

for (const rootKind of ["home", "outside home", "symlink ancestor"]) {
  test(`unsafe ${rootKind} configured root is rejected before deletion`, (t) => {
    const f = fixture(t);
    const target = cargoTarget(f, "stale");
    let unsafe = f.home;
    if (rootKind === "outside home") unsafe = dirname(f.home);
    if (rootKind === "symlink ancestor") {
      symlinkSync(f.workspace, join(f.home, "alias"));
      unsafe = join(f.home, "alias", "stale");
    }
    const config = JSON.parse(readFileSync(f.config, "utf8"));
    config.roots = [unsafe];
    writeFileSync(f.config, JSON.stringify(config));
    const result = invoke(f, ["maintain", "--config", f.config, "--apply"]);
    assert.notEqual(result.status, 0);
    assert.ok(existsSync(target));
  });
}

test("absent configured descendant roots are harmless", (t) => {
  const f = fixture(t);
  const config = JSON.parse(readFileSync(f.config, "utf8"));
  config.roots.push(join(f.home, "missing"));
  writeFileSync(f.config, JSON.stringify(config));
  const target = cargoTarget(f, "stale");
  maintain(f, true);
  assert.equal(existsSync(target), false);
});

function installerFixture(t) {
  const f = fixture(t);
  const bin = join(f.home, "bin");
  mkdirSync(bin);
  f.systemctlLog = join(f.home, "systemctl.log");
  writeFileSync(join(bin, "systemctl"), "#!/usr/bin/env node\nrequire('node:fs').appendFileSync(process.env.SYSTEMCTL_LOG, JSON.stringify(process.argv.slice(2))+'\\n');\n", { mode: 0o755 });
  f.env = { ...f.env, PATH: bin + ":" + process.env.PATH, SYSTEMCTL_LOG: f.systemctlLog, XDG_CONFIG_HOME: join(f.home, ".config") };
  return f;
}

test("installer defaults to preview with no configuration writes or service calls", (t) => {
  const f = installerFixture(t);
  const result = invoke(f, ["install", "--workspace", f.workspace]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(join(f.home, ".config")), false);
  assert.equal(existsSync(join(f.home, ".local")), false);
  assert.equal(existsSync(f.systemctlLog), false);
});

test("installation persists conservative cleanup configuration and enables a daily user timer", (t) => {
  const f = installerFixture(t);
  const result = invoke(f, ["install", "--workspace", f.workspace, "--apply"]);
  assert.equal(result.status, 0, result.stderr);
  const configPath = join(f.home, ".config/coding-agent/disk-maintenance.json");
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.equal(config.schemaVersion, 1);
  assert.equal(config.packageCaches, true);
  assert.equal(config.minFreeBytes, 53687091200);
  assert.equal(config.restoreFreeBytes, 80530636800);
  for (const path of [f.workspace, join(f.home, "worktrees"), join(f.home, ".cache/coding-tooling"), join(f.home, ".cache/physics-queue"), join(f.home, ".local/share/coding-agent"), join(f.home, ".cache/coding-agent-builds")]) {
    assert.ok(config.roots.some((root) => root === path || root.replace(/^~(?=\/)/, f.home) === path), `missing managed root ${path}`);
  }
  const timer = readFileSync(join(f.home, ".config/systemd/user/coding-agent-disk-maintenance.timer"), "utf8");
  assert.match(timer, /OnCalendar=daily/);
  assert.match(timer, /Persistent=true/);
  const service = readFileSync(join(f.home, ".config/systemd/user/coding-agent-disk-maintenance.service"), "utf8");
  assert.match(service, /maintain.*--apply/);
  assert.ok(existsSync(join(f.home, ".local/share/coding-agent/disk-maintenance.py")));
  const calls = readFileSync(f.systemctlLog, "utf8").trim().split("\n").map((line) => JSON.parse(line));
  assert.ok(calls.some((args) => args.join(" ") === "--user daemon-reload"));
  assert.ok(calls.some((args) => args.join(" ") === "--user enable --now coding-agent-disk-maintenance.timer"));
  const again = invoke(f, ["install", "--workspace", f.workspace, "--apply"]);
  assert.equal(again.status, 0, again.stderr);
  assert.deepEqual(JSON.parse(readFileSync(configPath, "utf8")), config);
});

test("installer refuses a foreign runner without overwriting user content", (t) => {
  const f = installerFixture(t);
  const runner = join(f.home, ".local/share/coding-agent/disk-maintenance.py");
  mkdirSync(dirname(runner), { recursive: true });
  writeFileSync(runner, "user-owned content\n");
  const result = invoke(f, ["install", "--workspace", f.workspace, "--apply"]);
  assert.notEqual(result.status, 0);
  assert.equal(readFileSync(runner, "utf8"), "user-owned content\n");
  assert.equal(existsSync(f.systemctlLog), false);
});
