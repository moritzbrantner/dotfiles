# dotfiles

Personal development-environment and reusable coding preferences.

## What belongs here

This repository stores portable defaults that are useful across projects. Repository-local configuration and pinned conventions remain authoritative when a project needs different behavior.

Keep secrets, credentials, machine-specific paths, and Git identity out of the repository.

## Safe one-command bootstrap (Linux and WSL)

From this repository, preview the complete setup before installing anything:

```sh
node scripts/bootstrap.mjs --dry-run
node scripts/bootstrap.mjs --apply
```

The bootstrap plans all existing Git, EditorConfig, Claude Code and Codex skills, and
`workctl` links before changing the filesystem. It refuses any conflicting file or
symlink **before creating links**, leaves correctly installed links alone, and is
idempotent. It never installs packages, fetches dependencies, publishes, or auto-installs
VS Code extensions. Preview never changes files.

It also sets up the tracked **personal VS Code preferences**:

- Native Linux: `~/.config/Code/User/settings.json` (or `$XDG_CONFIG_HOME/Code/User/settings.json`).
- WSL: `~/.vscode-server/data/Machine/settings.json` in Linux, **never** Windows-host
  settings. Native Windows support is intentionally deferred.

When no settings file exists, apply creates one. If it exists, the plan displays **only
missing preferences** and interactive apply asks for explicit `y` approval before adding
them; existing values and JSONC comments are preserved. Declining, running without a
terminal, or encountering unsafe/unparseable settings **skips the VS Code settings step**
without interfering with safe links. No user-owned settings file is silently overwritten.

Node.js 22.18+ (22.x) or 24.2+ (newer major versions) is required for the linked
`workctl` CLI. The bootstrap itself runs on the available Node.js runtime used for
repository validation.

## Home-level defaults

- `.gitconfig` — fast-forward-only pulls, pruned fetches, automatic upstream setup, rerere, zdiff3 conflicts, histogram diffs, autostash for explicit rebases, and review-friendly commit/status defaults.
- `.config/git/ignore` — only OS/editor trash. Semantic project ignores such as `.env` remain owned by each repository.
- `.editorconfig` — LF line endings, final newlines, two-space defaults, 100-column guidance, and Rust/Makefile overrides.

To run the older **home-links-only** command instead, preview with:

```sh
node scripts/link-home.mjs --dry-run
```

Apply them with:

```sh
node scripts/link-home.mjs
```

The linker is intentionally non-destructive: it refuses to replace an existing file or unrelated symlink.

## Project coding preferences

- `.oxfmtrc.json` — Oxfmt formatting defaults with deterministic import sorting.
- `.oxlintrc.json` — Oxlint correctness, suspicious-code, performance, TypeScript, control-flow, and import rules.
- `eslint.config.mjs` — dependency-free ESLint flat-config baseline for JavaScript projects that still need ESLint-specific integrations.

Copy or symlink these into a project when appropriate, then keep project-specific additions in that project. Do not make a project depend on this repository at runtime.

## Coding-agent workflow

Use [steer](skills/steer/SKILL.md) for broad direction or detailed questions, then [work-loop](skills/work-loop/SKILL.md) for authorized implementation. Routine bugs and already specified work may enter the loop directly.

**[Flowcharts: happy path and exceptions](docs/human-steering-flowcharts.md)** · **[Owner questions and incorporation](docs/owner-questions.md)**

### Broad steering and issue investigation

- Approve broad outcomes in any session, including voice: “add export to the list” need not settle every detail.
- Before affected implementation, the same worker examines the selected issue, code, approved decisions, conventions and inputs, then asks remaining owner questions.
- Apply settled preferences first. Ask about unresolved user-facing behavior, workflow, appearance or scope even when reversible; choose ordinary technical details yourself.
- Keep answers and revisions in conversation. When the owner ends it or says **“capture and incorporate now”**, reconcile owning Markdown and necessary GitHub issues in the same session, without another confirmation.

### Work-loop mental model

Load current merged personal skills and basic instructions once per run. Resume existing work, select the oldest eligible issue, prepare it, implement the full approved outcome, satisfy existing required gates, merge and repeat. Keep one active implementation writer per repository. Issues, PRs and native dependencies hold execution state; product priorities and old roadmap deferrals do not schedule it.

`/work-loop ask:live` asks in the conversation. `/work-loop ask:github` (default) posts unanswered blockers and continues other eligible work. Explicit live answers may guide current authorized implementation; their recording waits for conversation end. Ask before shipping a smaller slice or promoting a local preference into shared conventions unless already approved.

Happy-path work adds no proactive acceptance agent, extra tests, browser/deployment checks or AI review. Existing required CI and merge rules remain; observed failures and concrete serious risks trigger narrow investigation. Report unrun checks as unverified.

| Skill | Role |
| --- | --- |
| [steer](skills/steer/SKILL.md) | Product conversation and end-of-session incorporation |
| [tech-steer](skills/tech-steer/SKILL.md) | Consequential technical trade-offs |
| [grill](skills/grill/SKILL.md) | Explore unresolved product/design choices |
| [unblock](skills/unblock/SKILL.md) | Resolve actual owner blockers from GitHub |
| [issue-preflight](skills/issue-preflight/SKILL.md) | Check outcome, scope and readiness |
| [work-loop](skills/work-loop/SKILL.md) | Prepare, implement and merge eligible work |
| [atlas-audit](skills/atlas-audit/SKILL.md) | Requested decision/drift audit |
| [acceptance-contract](skills/acceptance-contract/SKILL.md) | Required/requested independent evidence or serious failure investigation |

Product intent belongs in the owning Atlas, consequential architecture in existing technical records, repository invariants in `AGENTS.md`, approved shared preferences in coding-agent-conventions, and slice details in issues/PRs. Decisions are approved; Questions are unsettled; `[x]` means built. Preserve IDs, history and local schema. No extra document is required for routine work.

Approved non-executable instructions go directly to the owning default branch when permitted. Preserve repository protection and approval rules; code, configuration, tests and machine-enforced contracts use their normal validated path.

To use these workflows in a GitHub-connected ChatGPT session, reference the linked skill and target repository. Broad and detailed steering are available in either voice or computer sessions.

For a manual installation **instead of the bootstrap**, link Claude Code and Codex skills:

```bash
mkdir -p ~/.claude/skills ~/.agents/skills ~/.local/share/coding-agent
for s in skills/*/; do
  ln -sfn "$PWD/$s" ~/.claude/skills/"$(basename "$s")"
  ln -sfn "$PWD/$s" ~/.agents/skills/"$(basename "$s")"
done
ln -sfn "$PWD/skills/work-loop/workctl.mjs" ~/.local/share/coding-agent/workctl.mjs
```

Run the linked helper with `node ~/.local/share/coding-agent/workctl.mjs scan` for the global PR backlog (or `scan <repo>` for one repository) or `node ~/.local/share/coding-agent/workctl.mjs pr dotfiles#15` for one PR. `workctl issue dotfiles#15` prints an issue compactly: state, labels, blockers and closing PRs, then the body and comments, with `<details>` collapsed and minimized comments hidden. A body over 8,000 characters prints as a heading outline; `--section <heading>` prints a matching section, `--full` prints everything, and `--since <ISO time>` shows only newer comments.
The helper requires Node.js 22.18+ on the 22.x line or Node.js 24.2+ on newer lines for native
ESM entry-point detection (`import.meta.main`). Symlink invocation needs no launcher. Importing
the module keeps the exported helpers available without running the CLI.

## VS Code

- `.vscode/settings.json` — save-time Oxfmt then Oxlint fixes, focused navigation/refactoring aids, explicit Git synchronization behavior, compact editor presentation, and Rust/TOML formatting.
- `.vscode/extensions.json` — Oxc, ESLint, EditorConfig, Rust Analyzer, TOML, WSL, and Dev Container recommendations.

The VS Code files remain reusable workspace defaults. The bootstrap merges missing tracked preferences into the applicable personal Linux or WSL settings path, with consent for existing files; it does not change Windows-hosted settings or automatically install recommended extensions.

## Automatic disk maintenance (Linux)

Install the personal maintenance service once for a workspace collection:

```sh
python3 scripts/disk-maintenance.py install --workspace "$HOME/moritzbrantner" --apply
```

The command defaults to a preview without `--apply`. It installs links to this repository
and enables a daily persistent user timer. Configuration stays in
`~/.config/coding-agent/disk-maintenance.json`; repeated installation preserves configured
thresholds and adds only missing roots. The service intentionally uses that fixed configuration
path regardless of `XDG_CONFIG_HOME`. `XDG_CACHE_HOME` is honored for temporary verification
and package caches. Python 3.11+, Git and Linux `/proc` are required; systemd user services
are required for scheduling. Installation is explicit, separate from the general bootstrap.

The defaults remove Cargo-generated `target`, `.cargo-target`, and legacy `*-target`
directories after seven inactive days, or after 24 quiet hours when a target exceeds 10 GiB.
Below 50 GiB free, quiet outputs are cleaned oldest first until 75 GiB is available.
Only declared roots beneath the home directory are scanned. Cargo markers are required;
source, Git state, tracked files, symlink boundaries and outputs used by live processes are
preserved. Recent builds are kept. No cleanup runs through models, personal downloads,
virtual environments, `node_modules`, Bun/T3 installations or application databases.

The service runs supported `uv cache prune` and clears pip/npm caches when they exceed 1 GiB.
It pins each command to the inspected cache path and skips active package managers.
It never edits uv cache entries directly. An unreadable unknown same-user process prevents
deletion and reports unavailable safety evidence. Known root-owned service/credential
agents and sandboxed browser subprocesses are handled explicitly while retaining their
visible command-line checks; arbitrary uninspectable build processes are not exempt.

For a one-shot verification, use:

```sh
python3 ~/.local/share/coding-agent/disk-maintenance.py run -- cargo test --workspace
```

The wrapper uses a private target with incremental compilation disabled, returns the
command's exit status, and removes its output on success, failure, SIGINT and SIGTERM.
It refuses to start below the free-space reserve and stops its command group if that
reserve is crossed during execution. Keep reports outside its disposable target.
Abandoned wrapper directories are recovered by retention maintenance; live or detached
processes still using them are preserved. Commands that explicitly override Cargo's target
directory need their own cleanup lifecycle. Ordinary development builds can reuse their
existing targets and are covered by periodic retention rather than the wrapper's reserve.

Inspect the schedule and logs with `systemctl --user list-timers coding-agent-disk-maintenance.timer`
and `journalctl --user -u coding-agent-disk-maintenance.service`. Preview cleanup with
`python3 ~/.local/share/coding-agent/disk-maintenance.py maintain`; add `--apply` for an
immediate run. Disable scheduling with `systemctl --user disable --now coding-agent-disk-maintenance.timer`.
These controls bound regenerable development output; they do not impose a quota on retained
models, personal data or build commands that bypass the verification wrapper.

## Validation

Run:

```sh
node scripts/check.mjs
```

Configuration validation uses the tools that own the formats: Git validates `.gitconfig`, ESLint loads `eslint.config.mjs`, Oxlint loads `.oxlintrc.json`, and Oxfmt loads `.oxfmtrc.json`. JSON-only VS Code files are parsed directly. The check also runs the work-loop helper tests and isolated-home bootstrap acceptance tests (including symlinks, JSONC consent, and WSL boundaries), and `git diff --check` over unstaged and staged changes.

`eslint`, `oxlint`, and `oxfmt` must already be on `PATH`. Validation never installs tools or performs hidden network access.

## Convention policy

This repository currently does not pin `coding-agent-conventions`. Agents should use the published machine-readable shared conventions as fallback policy without silently installing or updating them.
