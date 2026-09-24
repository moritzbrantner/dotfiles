# AGENTS.md

## Scope

This repository owns personal, reusable development-environment preferences.

- Keep repository-specific build, test, dependency, runtime, and architecture policy in the repository that owns it.
- Consumer repositories may copy or symlink preferences from here, but must not require this repository at runtime.
- Repository-local configuration overrides these personal defaults.

## Safety and portability

- Do not commit secrets, credentials, tokens, private keys, Git identity, or machine-specific absolute paths.
- Prefer settings that work across Linux/WSL and Windows-hosted VS Code.
- Avoid global settings that can hide a repository defect, such as globally ignoring `.env`, generated lockfiles, or repository-owned configuration.
- Do not install or regenerate coding-agent conventions unless explicitly requested.

## Changes

- Prefer executable configuration over prose.
- Keep defaults conservative: avoid surprising background network activity, implicit publishing, or destructive automation.
- Validate the syntax of every edited configuration format.
- When a preference belongs only to a particular language, framework, or repository type, keep it out of the global baseline unless there is a strong cross-project reason.
