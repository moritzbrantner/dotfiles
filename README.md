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

Implementation work runs through one global loop over GitHub issues. Design discussions use reusable skills without creating another loop:

- `skills/work-loop` — scan open issues across the repositories, pick an actionable one, work in its repository by that repository's `AGENTS.md`, validate, update GitHub, repeat. Its `workctl.mjs` helper scans the open PR backlog, deterministically reports PR readiness, rejects stacked PR bases, and guards merges. A dependency on another repository becomes an issue there.
- `skills/unblock` — when nothing is actionable, ask the owner about `needs-decision` issues one question at a time and record each answer on the issue.
- `skills/grill` — proactively clarify the desired frontend experience, gameplay, architecture, and quality one **concrete question at a time**; use labeled A/B/C alternatives with illustrative reference images for visual choices, then persist owner decisions in the owning repository's vision/roadmap and ADRs.
- `skills/issue-preflight` — before creating an implementation issue or starting an unclear one, check its scope and independently observable acceptance against that durable intent; require owner-verifiable end-to-end product feature slices, not backend-only feature claims.
- `skills/acceptance-contract` — for changes to behavior or architecture, hand off specification-based acceptance tests to an independent agent before implementation, protect behavioral assertions, and fail closed to full test execution when impact mapping is uncertain.

GitHub issues and pull requests are the only **execution state**. Product vision, architecture decisions and quality bars live in the owning repository's existing documentation, referenced by issues rather than duplicated. Repositories keep their own instructions, conventions, tests and architecture; they do not define their own agent loops, claims, queues or status labels.

**Feature delivery rule:** Each user-facing feature issue must end in a real, independently verifiable user journey on GitHub Pages (or an equivalent product surface) with browser acceptance evidence and a check of the published result. Backend-only prerequisites remain technical issues, not completed product features. See `skills/issue-preflight` for exceptions and deployment timing.


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

To define an idea conversationally, invoke `grill` (for example, "/grill ARPG combat architecture"). It asks one substantive question at a time, normally 3–5 per session (longer only when requested), with **concrete, illustrated A/B/C alternatives** for visual product choices. Each question should make the intended user experience easier to imagine, not just discuss backend tasks. Use `issue-preflight` when converting that intent into bounded GitHub issues; the work loop also consults it before implementation. Neither skill requires a new global database, label, or queue. The work loop also invokes `acceptance-contract` for behavior and architecture changes. Independent acceptance authorship is a procedural handoff, not something a commit author or code review alone can prove.

**Using this skill in ChatGPT:** With GitHub connected, say: **"Use the [grill skill](https://github.com/moritzbrantner/dotfiles/blob/main/skills/grill/SKILL.md) for my ARPG; show example pictures for A/B/C and ask one concrete question at a time."** ChatGPT can read the current GitHub file and follow it. This repository link does not register a native ChatGPT slash command; refer to the skill explicitly when you want that workflow. For voice-only use, the short spoken option descriptions must stand on their own without images.

Install the skills for Claude Code and Codex by symlinking them:

```bash
mkdir -p ~/.claude/skills ~/.agents/skills ~/.local/share/coding-agent
for s in skills/*/; do
  ln -sfn "$PWD/$s" ~/.claude/skills/"$(basename "$s")"
  ln -sfn "$PWD/$s" ~/.agents/skills/"$(basename "$s")"
done
ln -sfn "$PWD/skills/work-loop/workctl.mjs" ~/.local/share/coding-agent/workctl.mjs
```

Run the linked helper with `node ~/.local/share/coding-agent/workctl.mjs scan` for the global PR backlog or `node ~/.local/share/coding-agent/workctl.mjs pr dotfiles#15` for one PR.
The helper requires Node.js 22.18+ on the 22.x line or Node.js 24.2+ on newer lines for native
ESM entry-point detection (`import.meta.main`). Symlink invocation needs no launcher. Importing
the module keeps the exported helpers available without running the CLI.

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
