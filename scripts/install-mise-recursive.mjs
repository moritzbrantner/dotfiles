#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readdirSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

// These directories contain generated or third-party trees, not owned projects.
const skippedDirectories = new Set([
  ".git", ".hg", ".svn", ".cache", ".next", ".turbo", ".venv",
  "build", "coverage", "dist", "node_modules", "out", "target", "vendor", "venv",
]);

function usage() {
  console.log(`Usage: node scripts/install-mise-recursive.mjs [--apply] [--include-tool-versions] [ROOT]

Recursively discover project mise configurations under ROOT (default: current directory).
Preview only by default. --apply explicitly runs mise install once per directory.
Files and directories reached through symlinks are never followed.
Only the current mise environment is installed (set MISE_ENV to select another).

Options:
  --apply                   Run mise install in every discovered directory
  --include-tool-versions   Also include asdf .tool-versions-only directories
  --help                    Show this help`);
}

function optionsFrom(args) {
  const options = { apply: false, includeToolVersions: false, root: process.cwd() };
  let positional = false;
  for (const arg of args) {
    if (arg === "--apply") options.apply = true;
    else if (arg === "--include-tool-versions") options.includeToolVersions = true;
    else if (arg === "--help" || arg === "-h") return null;
    else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    else if (positional) throw new Error("Specify only one root directory");
    else { options.root = arg; positional = true; }
  }
  return options;
}

function isMiseFilename(name) {
  return /^\.?mise(?:\.[a-zA-Z0-9_-]+)*(?:\.local)?\.toml$/.test(name);
}

function ownerForConfig(directory, name, includeToolVersions) {
  const confDirectory = basename(directory) === "conf.d" ? directory
    : basename(dirname(directory)) === "conf.d" && isMiseFilename(name)
      ? dirname(directory) : null;
  if (confDirectory && name.endsWith(".toml")) {
    const configDirectory = dirname(confDirectory);
    if (basename(configDirectory) === "mise" && basename(dirname(configDirectory)) === ".config") {
      return dirname(dirname(configDirectory));
    }
    if (basename(configDirectory) === "mise" || basename(configDirectory) === ".mise") {
      return dirname(configDirectory);
    }
  }
  if (isMiseFilename(name)) {
    if (basename(directory) === ".config") return dirname(directory);
    if (basename(directory) === "mise" && basename(dirname(directory)) === ".config") {
      return dirname(dirname(directory));
    }
    if (basename(directory) === "mise" || basename(directory) === ".mise") {
      return dirname(directory);
    }
    return directory;
  }
  if (name === ".tool-versions" && includeToolVersions) return directory;
  if (name !== "config.toml" && name !== "config.local.toml") return null;

  // mise also supports project-scoped config under mise/ and .mise/.
  if (basename(directory) === "mise" && basename(dirname(directory)) === ".config") {
    return dirname(dirname(directory));
  }
  if (basename(directory) === "mise" || basename(directory) === ".mise") {
    return dirname(directory);
  }
  return null;
}

function discover(root, includeToolVersions) {
  const projects = new Map();
  const pending = [root];
  while (pending.length) {
    const directory = pending.pop();
    const entries = readdirSync(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!skippedDirectories.has(entry.name)) pending.push(join(directory, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      const project = ownerForConfig(directory, entry.name, includeToolVersions);
      if (!project) continue;
      const files = projects.get(project) ?? new Set();
      files.add(relative(project, join(directory, entry.name)));
      projects.set(project, files);
    }
  }
  return [...projects].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
}

function main() {
  const options = optionsFrom(process.argv.slice(2));
  if (!options) return usage();
  const root = realpathSync(resolve(options.root));
  if (!statSync(root).isDirectory()) throw new Error(`Not a directory: ${root}`);

  const projects = discover(root, options.includeToolVersions);
  console.log(`Plan: ${projects.length} mise project(s) under ${root}`);
  for (const [directory, files] of projects) {
    console.log(`  ${relative(root, directory) || "."} (${[...files].sort().join(", ")})`);
  }
  if (!options.apply) {
    console.log("Preview only. Run with --apply to install explicitly.");
    return;
  }
  if (!projects.length) return;
  const preflight = spawnSync("mise", ["--version"], { cwd: root, encoding: "utf8" });
  if (preflight.error || preflight.status !== 0) {
    throw new Error("mise must be installed and available on PATH before using --apply");
  }

  // No trust or auto-install override: mise enforces each project's own policy.
  let failed = 0;
  for (const [directory] of projects) {
    console.log(`Installing: ${relative(root, directory) || "."}`);
    const result = spawnSync("mise", ["install"], { cwd: directory, stdio: "inherit" });
    if (result.error || result.status !== 0) {
      failed++;
      console.error(`Failed: ${directory} (${result.error?.message || `exit ${result.status ?? "unknown"}`})`);
    }
  }
  console.log(`Finished: ${projects.length - failed} succeeded, ${failed} failed.`);
  if (failed) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
