# AGENTS.md

## Scope

This repository owns personal, reusable development-environment preferences.

- Keep repository-specific build, test, dependency, runtime, and architecture policy in the repository that owns it.
- Consumer repositories may copy or symlink preferences from here, but must not require this repository at runtime.
- Repository-local configuration overrides these personal defaults.
- `skills/` holds the single global implementation work loop and reusable unblock, design-grilling, issue-preflight, and independent acceptance-contract procedures; repositories do not define their own agent loops, claims, queues, or status labels.

## Execution selection (owner directive 2026-10-16)

- Product and technology areas have **no global implementation priority or discretionary deferral**. Defined GitHub issues are eligible whenever their actual issue-specific prerequisites are satisfied. Select the next unblocked issue by a neutral deterministic rule; explicit owner task/stop scope is still honored.
- Do not treat old product-priority Decisions, roadmap language, phrases like "after milestone X", or speculative time/worker/resource estimates as blocking dependencies. The current approved product behavior and acceptance remain authoritative; only obsolete scheduling authority is superseded.
- The coding agent's only routine management question is whether it has the inputs, authorization and dependencies needed to implement the issue. Obtain ordinary prerequisites; record an indispensable human-only blocker and continue elsewhere.
- **Happy path (owner directive 2026-10-17):** Implement routine issues without proactive acceptance authoring, extra test runs, browser/deployment checks or AI reviews. Existing repository-required CI, protection and ownership rules remain. Investigate observed failures, concrete serious security/data-integrity risks and explicit owner requests. An unrun check is **unverified**, not passed. See `skills/work-loop/SKILL.md` and `skills/acceptance-contract/SKILL.md`.

## Owner decision authority

Owner decision, process steering Q1 (2026-10-17): **B — reserve unresolved user-facing behavior for the owner.**

- Apply repository-local instructions, the repository's installed coding-agent-conventions, and approved product and technical decisions first. Use settled preferences without asking again.
- If user-facing behavior, workflow or appearance still has multiple plausible answers, ask the owner before choosing, even when the choice is reversible.
- Agents choose technical implementation details and straightforward repairs that preserve approved behavior. A recommendation or existing code alone does not approve new product intent.
- Preserve explicit owner decisions. The owner accepts the extra confirmations and expects recorded taste and preferences to be applied consistently.

## Decision Atlas and steering organization

- As a **rule of thumb**, keep roughly **8–10 direct Decisions/Questions per product-feature branch**. Reassess after **2–3 narrowly related steering questions** and prefer the next consequential product capability over repeatedly refining minor edge cases.
- When a branch needs more content, group it by meaningful **user workflows or feature topics**. This is a navigation heuristic, **not** a hard parser limit or a target to fill.
- Preserve every existing **stable Decision Atlas ID, owner-approved meaning, provenance, and explicit references**. Do not renumber or silently rewrite history to make a tree look balanced. Follow the owning repository's parser, append-only and heading rules; an approved navigation-only reorganization may move entries only where its source format permits.
- Keep routine UI polish, keyboard mechanics, numeric tuning, and test detail in implementation/acceptance work rather than growing the Atlas with one Question per small decision. The owning repository's product contract and implementation rules take precedence.

## Safety and portability

- Do not commit secrets, credentials, tokens, private keys, Git identity, or machine-specific absolute paths.
- Prefer settings that work across Linux/WSL and Windows-hosted VS Code.
- Avoid global settings that can hide a repository defect, such as globally ignoring `.env`, generated lockfiles, or repository-owned configuration.
- Do not install or regenerate coding-agent conventions unless explicitly requested.

## Changes

- Prefer executable configuration over prose.
- Keep defaults conservative: avoid surprising background network activity, implicit publishing, or destructive automation.
- Validate the syntax of every edited configuration format.
- Owner-approved non-executable instructions and product decisions should be committed directly to the owning default branch when permitted, without requiring green CI or an unnecessary PR. Preserve local protection/approval rules and keep implementation changes on their normal validated PR path (see `skills/steer/SKILL.md`).
- When a preference belongs only to a particular language, framework, or repository type, keep it out of the global baseline unless there is a strong cross-project reason.
