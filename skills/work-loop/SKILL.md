---
name: work-loop
description: Implement and merge unblocked GitHub issues with happy-path-first execution; investigate only concrete failures or high-consequence risks.
---

# Work loop

**Happy path is the default.** Implement the specified behavior and assume surrounding systems work. Do not preemptively write acceptance tests, assign an independent acceptance agent, run extra test suites, inspect browser deployments, request AI reviews, or build diagnostic infrastructure. Existing mandatory repository/CI checks and branch protection still apply. Report unverified behavior as **unverified**, not tested.

GitHub issues, native `blockedBy` links, PRs and the current checkout hold execution state. Repository `AGENTS.md`, installed conventions, approved product Decisions and existing architecture control implementation. Use `node ~/.local/share/coding-agent/workctl.mjs` for PR readiness/merges. No extra queues, claims, or labels beyond `needs-decision`.

## Loop

1. **Finish in-scope work first.** Inspect the current branch and uncommitted changes; resume identifiable work or an existing PR without overwriting user edits. Use `workctl scan` (bounded repository queries if unavailable): repair `broken`, leave `waiting`, merge `ready` after checking current head, mergeability, actual diff and required checks. A draft is unfinished; ready is a merge candidate. Never merge a stacked PR into another feature branch.

2. **Select an issue.** Honor the owner's repository, journey and stop scope. Otherwise choose the oldest eligible open issue by creation time, repository name and number; exclude bot/meta issues, active closing PRs, real `needs-decision` blockers and open native dependencies. Ignore product priorities, roadmap phases, perceived scarcity and unrelated Atlas Questions.

3. **Implement directly.** Read the issue, comments, relevant code, `AGENTS.md`, installed conventions and applicable Atlas Decisions (scoped `daq` or source Markdown). Use `issue-preflight` for real scope ambiguity, not routine ceremony. For new major product direction lacking owner approval, use `grill`; ordinary implementation choices stay with the agent. Work in the normal checkout on a task branch, with **one active implementation writer per repository**. A stopped worker's PR is resumable; prevent simultaneous writers. Keep acceptance tests, extra reviews and exploratory checks out of the default path. Make a coherent change, then open/update one PR targeting default; no placeholder PR, repeated progress pushes or stacked PRs.

4. **Handle blockers.** Obtain available tools, fixtures and public dependencies yourself. Put prerequisites owned by other repositories in their own smallest issues/PRs, linked by native dependencies; follow upstream work when its checkout is available. Ask the owner through `unblock` only for an indispensable decision, permission or private input. Record the exact blocker and continue other eligible work. If the issue is oversized, deliver a coherent slice and retain all remaining obligations in successor issues; do not mark undelivered acceptance completed.

5. **Merge without extra ceremony.** Do not start manual testing or hosted checks merely to collect evidence. Inspect existing required CI, repository-prescribed checks, unresolved concrete findings and `workctl pr <repo>#<n>`. Repair `broken`, leave `waiting`, merge `ready` with `workctl merge` when required gates pass. Do not bypass protection or claim unrun tests passed. An approved **non-executable documentation-only** change can be committed directly to default when allowed; executable Markdown/configuration/code uses normal merge rules.

6. **Repeat within scope.** A merged PR proves implementation, not an independently tested or published user journey. Do not proactively audit deployed Pages or reopen issues solely because live verification is absent. For a **known** deployment/user failure, reopen the owning issue and repair it. If only external gates remain, record the pending PR/head and work on another in-scope issue without polling. Honor an explicit stop without expanding scope.

## When to investigate

Escalate from happy path only for an **observed** build/CI/runtime failure, a reproducible user-visible regression, a concrete security/data-integrity risk, an explicit repository-required gate, or a direct owner request. Then:

- Preserve the first failure and its source revision. Reproduce the failing boundary once with the narrowest useful check; fix the cause, add a focused regression when warranted, and rerun the affected required gate. Use `acceptance-contract` for explicitly requested independent acceptance or a serious failure whose behavior needs an independent oracle.
- Do not turn one failure into a global audit, multiple full-suite repeats, a re-review loop, new infrastructure or speculative tests. Keep a failed required check failed until repaired; never replace it with a green unrelated check.
- If GitHub Actions cannot start due solely to a **confirmed billing/spending-limit** failure, use the existing workctl billing-exception procedure: validate feasible required jobs locally against the PR head, record missing hosted evidence and obey protection; never use `--admin`. Other CI failures do not qualify.

If no issue is actionable and no genuine owner-only blocker exists, stop. Report only issue/PR outcome, known failures, unverified behavior and required owner action.
