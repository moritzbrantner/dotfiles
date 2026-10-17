---
name: issue-preflight
description: Keep GitHub issues aligned with approved product outcomes and repository ownership without routine verification ceremony.
---

# Issue preflight

Determine whether a GitHub issue is actionable and what it must deliver. This is a **scope check**, not a testing stage.

1. Read the issue and relevant `AGENTS.md`, installed conventions, code and approved product Decisions. Use scoped `daq` or the owning Atlas Markdown when present. Follow stable IDs and local schema. An unanswered unrelated Question, roadmap phase or historical priority is not a blocker.
2. For user-facing features, state the **observable outcome**, entrypoint (Pages or equivalent), main user action and expected result. A backend/library prerequisite is a separate technical enabler, not proof that its consuming feature works. Headless work instead names its API, executable or produced artifact.
3. Preserve the intended scope and authority boundaries. Split oversized work into coherent slices without silently discarding required behavior; use native GitHub dependencies for true prerequisites in other repositories.
4. A missing test, fixture, public dataset, tool or ordinary implementation detail does not require owner input or a speculative blocker. If a consequential product decision, private input, authorization or license is indispensable, record the exact issue-specific gap and use `unblock`; new major product direction goes to `grill`. Do not invent an agent-selected MVP.
5. **Fork coverage (creation gate):** Name the issue's owner forks (`docs/owner-questions.md`) and the Decision/technical-record ID that settles each. Before an issue is created or called **ready**, every unsettled owner fork is either recorded as an Atlas Question (product) or posted as an owner question block (issue-specific). Agent defaults are not listed as forks. This moves design questions ahead of the work loop instead of discovering them during implementation.
6. **Happy-path default:** Issue readiness requires a clear outcome, not a tests-first handoff, browser test plan, screenshot, independent acceptance, benchmark or pre-merge deployment proof. Use existing repository-required checks. Invoke `acceptance-contract` only for a serious observed failure, a concrete high-consequence risk, or an explicit requirement/request. Distinguish expected behavior from behavior actually tested.

## Issue reconciliation

`/steer` may reconcile **approved and durably recorded** Decisions into created or updated issues. Search open/closed issues, PRs and existing code before writing; update matching coverage instead of duplicating it. Tentative Questions and brainstorming do not authorize implementation issues. When approved intent is still in an unmerged document PR, link it and hold implementation until that source merges; an answered Question is not `needs-decision`.

Return **ready**, **needs owner decision** or **needs decomposition**. State only the outcome, necessary constraints, actual blockers and any known failed evidence.
