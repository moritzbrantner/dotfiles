# Disk maintenance acceptance handoff

The owner requested committed, automatic prevention of the accumulated regenerable package caches and inactive Rust verification outputs identified by the 2026-10-13 disk audit. Cleanup is authorized; source, models, personal data, dependency installations and active processes must remain intact. This shared development-environment capability belongs in dotfiles; repository-specific build policy remains in its owning repository.

Independent acceptance context: `disk_acceptance`, before production implementation. Baseline: `91eae91c077cdaebec711613c4c4879edb4779d2`. Shared convention sourceRevision: `5ad0db36974c8b0e5f9812c90ee34a4f227852c3`.

## Public contract

`python3 scripts/disk-maintenance.py maintain --config <JSON> [--apply]` defaults to dry-run. Its JSON output has `actions`, each with `path`, `action` (`remove` or `skip`) and a human-readable `reason`.

Configuration schemaVersion 1 declares roots, maxAgeDays, maxTargetBytes, quietHours, minFreeBytes, restoreFreeBytes, packageCaches and cacheMaxBytes. Roots must be strict descendants of HOME, without symlink ancestors. Absent roots are ignored. Installed defaults are seven days of retention, 10 GiB per target, 24 quiet hours, 50 GiB minimum free space, 75 GiB restoration threshold and 1 GiB package cache threshold.

The only automatically deleted build candidates are directories named `target` or `.cargo-target` with a Cargo marker (`.rustc_info.json` or `debug/.cargo-lock`). Age is determined by the newest file or directory timestamp. Expired candidates are eligible; oversized candidates are eligible only after the quiet period. Low free space additionally makes quiet candidates eligible, oldest first until the restoration threshold is reached. Recent outputs remain protected. Symlinks and Git-tracked files prohibit deletion. Linux process cwd, command arguments, open files and mapped files protect a candidate and its containing checkout. Unknown or inaccessible safety evidence must fail closed. Deletion must revalidate the boundary and activity; changes during discovery cannot grant deletion authority.

`run --config <JSON> -- <command argv>` creates its own private directory under `$XDG_CACHE_HOME/coding-agent-builds` (HOME/.cache by default), sets CARGO_TARGET_DIR and CARGO_INCREMENTAL=0, checks the free-space reserve, propagates command failure, and removes only its own outputs on success, failure, SIGTERM or SIGINT. During the command, free-space monitoring terminates its owned command group if the reserve is breached. SIGKILL and power loss cannot guarantee immediate cleanup; retention handles abandoned Cargo outputs later.

`install --workspace <path> [--apply]` previews by default. Applying installs the runner at HOME/.local/share/coding-agent/disk-maintenance.py, configuration at HOME/.config/coding-agent/disk-maintenance.json and a daily persistent systemd user timer/service named coding-agent-disk-maintenance. Roots include the specified workspace, ~/worktrees, ~/.cache/coding-tooling, ~/.cache/physics-queue, ~/.local/share/coding-agent and ~/.cache/coding-agent-builds. Installation reconciles its owned files and refuses foreign runner content. It calls systemctl --user daemon-reload and enable --now only on apply.

Package maintenance uses supported uv prune and threshold-controlled pip/npm cleanup commands, with captured diagnostics and no intentional network acquisition. It must leave Bun/T3 running package caches, node_modules, virtual environments, models, source and other applications' caches intact. Routine development may retain useful warm targets; transient verification uses the managed runner.

## Executable evidence

Run `node --test scripts/disk-maintenance.test.mjs`. Tests execute the actual Python CLI against temporary HOME and XDG_CACHE_HOME fixtures. No test cleans real caches, runs package cleanup commands, installs real services, or changes real user preferences. Installer tests use a logging systemctl fake.

The suite covers dry-run/no mutation, applied stale-target deletion, .cargo-target support, Cargo-marker requirement, source/unrelated-cache preservation, repeat no-op, newest nested mtime protection, oversized quiet-period enforcement, low-space quiet candidate removal, symlink boundary protection, tracked file protection, four live-process protection surfaces, successful/failing child cleanup and exit propagation, reserve refusal, both termination signals, invalid configuration, unsafe roots, absent roots, preview installation, persistent daily installation and foreign-runner refusal.

Before implementation, the CLI does not exist. Baseline failure evidence is recorded by the coordinating agent from the full command above. Negative rejection tests can already pass because the missing executable exits nonzero; these are invariants, not proof that the capability exists.

## Independent review required before completion

Re-run the unchanged acceptance suite on implementation. Review process-scan permissions/races, descriptor-based deletion or equivalent revalidation, directory replacement races, unknown Git safety status, child process groups and free-space monitoring. Review package-manager commands and their thresholds without running real cleanup in acceptance tests. Inspect timer activation and installed state on the actual host separately from fixture evidence. Run the full existing dotfiles gate because no deterministic impact mapping exists.

Bounded suite limitations: pressure selection order/restoration stop, reserve breach during a live command, concurrent mutation, package command invocation, installer file mtime preservation and detection of unreadable process/Git state require additional targeted evidence or independent implementation review. The control reduces managed disk growth; it cannot promise that unrelated applications or unlimited active builds never exhaust the filesystem.
