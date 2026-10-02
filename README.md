# dotfiles

Personal development-environment and reusable coding preferences.

## What belongs here

This repository stores portable defaults that are useful across projects. Repository-local configuration and pinned conventions remain authoritative when a project needs different behavior.

Keep secrets, credentials, machine-specific paths, and Git identity out of the repository.

## Coding preferences

- `.editorconfig` — LF line endings, final newlines, two-space defaults, 100-column guidance, and Rust/Makefile overrides.
- `.oxfmtrc.json` — Oxfmt formatting defaults with deterministic import sorting.
- `.oxlintrc.json` — Oxlint correctness, suspicious-code, performance, TypeScript, control-flow, and import rules.
- `eslint.config.mjs` — dependency-free ESLint flat-config baseline for JavaScript projects that still need ESLint-specific integrations.
- `.vscode/settings.json` — save-time Oxfmt then Oxlint fixes, portable file hygiene, and language-specific formatter defaults.
- `.vscode/extensions.json` — recommended Oxc, ESLint, EditorConfig, Rust Analyzer, and TOML extensions.

## Coding-agent workflow

All coding-agent work runs through one global loop over GitHub issues:

- `skills/work-loop` — scan open issues across the repositories, pick an actionable one, work in its repository by that repository's `AGENTS.md`, validate, update GitHub, repeat. A dependency on another repository becomes an issue there.
- `skills/unblock` — when nothing is actionable, ask the owner about `needs-decision` issues one question at a time and record each answer on the issue.

GitHub issues and pull requests are the only work state. Repositories keep their own instructions, conventions, tests and architecture; they do not define their own agent loops, claims, queues or status labels.

Install the skills for Claude Code and Codex by symlinking them:

```bash
mkdir -p ~/.claude/skills ~/.agents/skills
for s in skills/*/; do
  ln -sfn "$PWD/$s" ~/.claude/skills/"$(basename "$s")"
  ln -sfn "$PWD/$s" ~/.agents/skills/"$(basename "$s")"
done
```

## Reusing the files

Copy or symlink the relevant files into a project, then keep project-specific additions in that project. Do not make a project depend on this repository at runtime.

The lint/format configs are project-root configurations; storing them here makes the preferences reusable but does not make ESLint, Oxlint, or Oxfmt discover them globally.

Likewise, `.vscode/` is a workspace configuration. Use the same values in VS Code user settings when a preference should apply to every workspace.
