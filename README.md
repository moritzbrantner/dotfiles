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

## Reusing the files

Copy or symlink the relevant files into a project, then keep project-specific additions in that project. Do not make a project depend on this repository at runtime.

The lint/format configs are project-root configurations; storing them here makes the preferences reusable but does not make ESLint, Oxlint, or Oxfmt discover them globally.

Likewise, `.vscode/` is a workspace configuration. Use the same values in VS Code user settings when a preference should apply to every workspace.
