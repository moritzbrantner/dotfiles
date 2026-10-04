# dotfiles

Personal development-environment and reusable coding preferences.

## What belongs here

This repository stores portable defaults that are useful across projects. Repository-local configuration and pinned conventions remain authoritative when a project needs different behavior.

Keep secrets, credentials, machine-specific paths, and Git identity out of the repository.

## Home-level defaults

- `.gitconfig` — fast-forward-only pulls, pruned fetches, automatic upstream setup, rerere, zdiff3 conflicts, histogram diffs, autostash for explicit rebases, and review-friendly commit/status defaults.
- `.config/git/ignore` — only OS/editor trash. Semantic project ignores such as `.env` remain owned by each repository.
- `.editorconfig` — LF line endings, final newlines, two-space defaults, 100-column guidance, and Rust/Makefile overrides.

On Linux or WSL, preview the home links with:

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

All coding-agent work runs through one global loop over GitHub issues:

- `skills/work-loop` — scan open issues across the repositories, pick an actionable one, work in its repository by that repository's `AGENTS.md`, validate, update GitHub, repeat. Its `workctl.mjs` helper deterministically reports PR readiness and guards merges. A dependency on another repository becomes an issue there.
- `skills/unblock` — when nothing is actionable, ask the owner about `needs-decision` issues one question at a time and record each answer on the issue.

GitHub issues and pull requests are the only work state. Repositories keep their own instructions, conventions, tests and architecture; they do not define their own agent loops, claims, queues or status labels.


### Work-loop mental model

The skill file is the operational definition; this diagram is the human-readable control flow. A current issue should produce one coherent PR. If the selected issue contains separable remainder beyond one coherent PR, create focused follow-up issues for that remainder rather than expanding the PR indefinitely. Unrelated findings are not added to the work queue.

```mermaid
flowchart TD
    START([▶ START WORK LOOP]):::start

    START --> EXISTING{Existing work to finish?}:::question

    EXISTING -->|Yes| FINISH[Finish / repair existing PR]:::yes
    EXISTING -->|No| ISSUE{Actionable issue available?}:::question

    FINISH --> VERIFY[Validate + review]:::action

    ISSUE -->|Yes| IMPLEMENT[Implement coherent issue scope]:::yes
    ISSUE -->|No| DECISION{Owner decision needed?}:::question

    IMPLEMENT --> EXTRA{Selected issue has separable remainder?}:::question

    EXTRA -->|Yes| FOLLOWUP[Create focused follow-up issue]:::yes
    EXTRA -->|No| VERIFY

    FOLLOWUP --> VERIFY

    VERIFY --> PASS{Everything green?}:::question

    PASS -->|Yes| MERGE[Merge PR]:::yes
    PASS -->|No| FIX[Fix problem]:::no

    FIX --> VERIFY
    MERGE --> START

    DECISION -->|Yes| ASK[Ask one focused question]:::yes
    DECISION -->|No| DONE([■ NOTHING ACTIONABLE]):::stop

    ASK --> RECORD[Record decision on issue]:::action
    RECORD --> START

    classDef start fill:#dbeafe,stroke:#2563eb,stroke-width:3px,color:#111;
    classDef stop fill:#e5e7eb,stroke:#4b5563,stroke-width:3px,color:#111;
    classDef question fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#111;
    classDef yes fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#111;
    classDef no fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#111;
    classDef action fill:#f3f4f6,stroke:#6b7280,stroke-width:1px,color:#111;
```

Install the skills for Claude Code and Codex by symlinking them:

```bash
mkdir -p ~/.claude/skills ~/.agents/skills ~/.local/share/coding-agent
for s in skills/*/; do
  ln -sfn "$PWD/$s" ~/.claude/skills/"$(basename "$s")"
  ln -sfn "$PWD/$s" ~/.agents/skills/"$(basename "$s")"
done
ln -sfn "$PWD/skills/work-loop/workctl.mjs" ~/.local/share/coding-agent/workctl.mjs
```

Run the linked helper directly with `node ~/.local/share/coding-agent/workctl.mjs pr dotfiles#15`.
The CLI resolves symlinks at its entry point; no launcher is needed. Importing the module keeps
the exported helpers available without running the CLI.

## VS Code

- `.vscode/settings.json` — save-time Oxfmt then Oxlint fixes, focused navigation/refactoring aids, explicit Git synchronization behavior, compact editor presentation, and Rust/TOML formatting.
- `.vscode/extensions.json` — Oxc, ESLint, EditorConfig, Rust Analyzer, TOML, WSL, and Dev Container recommendations.

The VS Code files are reusable workspace defaults. User-settings locations differ between Windows-hosted VS Code, WSL, and native Linux, so they are not linked automatically.

## Validation

Run:

```sh
node scripts/check.mjs
```

Configuration validation uses the tools that own the formats: Git validates `.gitconfig`, ESLint loads `eslint.config.mjs`, Oxlint loads `.oxlintrc.json`, and Oxfmt loads `.oxfmtrc.json`. JSON-only VS Code files are parsed directly. The check also runs the work-loop helper tests, including symlink CLI and import regressions, and `git diff --check` over unstaged and staged changes.

`eslint`, `oxlint`, and `oxfmt` must already be on `PATH`. Validation never installs tools or performs hidden network access.

## Convention policy

This repository currently does not pin `coding-agent-conventions`. Agents should use the published machine-readable shared conventions as fallback policy without silently installing or updating them.
