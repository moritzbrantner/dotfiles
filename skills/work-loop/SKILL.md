---
name: work-loop
description: Implement and merge unblocked GitHub issues with happy-path-first execution; investigate only concrete failures or high-consequence risks.
---

# Work loop

**Happy path is the default.** Implement the specified behavior and assume surrounding systems work. Do not preemptively write acceptance tests, assign an independent acceptance agent, run extra test suites, inspect browser deployments, request AI reviews, or build diagnostic infrastructure. Existing mandatory repository/CI checks and branch protection still apply. Report unverified behavior as **unverified**, not tested.

GitHub issues, native `blockedBy` links, PRs and the checkout hold execution state. Repository instructions, installed conventions and approved decisions govern implementation. Use `node ~/.local/share/coding-agent/workctl.mjs` for PR readiness/merges. No extra queues, claims or labels beyond `needs-decision`.

## Start once

Use current merged personal skills; refresh their source once if needed, preserving local edits. Load the basic instructions at startup and keep that baseline for the run. Do not refresh or recheck it per issue. Apply explicit owner redirection immediately; read newly relevant repository/path instructions as needed. Repository-pinned conventions change only through their normal version update.

Use `ask:github` by default, or `ask:live` when requested. Follow [owner questions and incorporation](../../docs/owner-questions.md), including end-of-conversation capture. Switching ask mode does not restart the run.

## Loop

1. **Finish in-scope work first.** Inspect the branch and uncommitted changes; resume identifiable work or an existing PR without overwriting user edits. Use `workctl scan` (bounded repository queries if unavailable): repair `broken`, leave `waiting`, merge `ready` after checking current head, mergeability, actual diff and required checks. A draft is unfinished; ready is a merge candidate. Never merge a stacked PR into another feature branch.

2. **Select an issue.** Honor the owner's repository, journey and stop scope. Otherwise choose the oldest eligible open issue by creation time, repository name and number. Exclude bot/meta issues, active closing PRs, real `needs-decision` blockers and open native dependencies. Ignore product priorities, roadmap phases, perceived scarcity and unrelated Atlas Questions. At the normal scan, reconcile already captured owner answers/digests through the shared protocol; do not leave answered issues blocked.

3. **Prepare before coding.** Using the loaded instruction baseline, the implementing worker examines the issue, comments, relevant workflow/code, approved decisions (scoped `daq` or Markdown) and available inputs. Obtain ordinary prerequisites. Identify remaining owner questions and settle them before affected implementation; later discoveries may require more questions. Approved broad direction does not settle unspecified user-facing behavior. Use `issue-preflight` for scope ambiguity and `steer` for broader direction; no separate preparation agent, document or question quota.

4. **Implement the full approved scope.** Use a task branch in the normal checkout, with **one active implementation writer per repository**. Resume stopped work without simultaneous writers. Choose ordinary technical details and behavior-preserving repairs yourself. Deliver the real integrated user outcome with required inputs. Make a coherent change, then open/update one PR targeting default; no placeholder PR, repeated progress pushes or stacked PRs.

5. **Handle exceptions.** In `ask:live`, ask the remaining owner choice and use an explicit answer immediately within authorized work; persist it at the owner's end-of-conversation signal. In `ask:github`, or when a live answer is deferred, post `### Owner questions`, add `needs-decision`, and continue other eligible work. Obtain available tools, fixtures and public dependencies yourself; block on genuinely unavailable required inputs rather than substituting them. Put cross-repository prerequisites in their owning issues/PRs with native dependencies; follow upstream work when its checkout is available. For an oversized or partly blocked issue, propose a usable split and its remaining obligations; obtain owner approval before delivering the smaller portion unless that split is already approved. Keep undelivered requirements open.

6. **Merge without extra ceremony.** Inspect existing required CI, repository-prescribed checks, unresolved concrete findings and `workctl pr <repo>#<n>`. Repair `broken`, leave `waiting`, merge `ready` with `workctl merge` when required gates pass. Do not bypass protection or claim unrun tests passed. Approved non-executable instructions may go directly to default when allowed; executable contracts, configuration and code use normal merge rules.

7. **Repeat within scope.** A merged PR proves implementation, not an independently tested or published user journey. Record completion and mark Atlas items built only to the extent delivered. Do not reopen issues solely because optional live verification is absent. For a known deployment/user failure, reopen the owning issue and repair it. If only external gates remain, record the pending PR/head and work another in-scope issue without polling. Return to issue selection, not startup. Honor an explicit stop.

## When to investigate

Escalate from happy path only for an **observed** build/CI/runtime failure, a reproducible user-visible regression, a concrete serious security/data-integrity risk, an explicit repository-required gate, or a direct owner request. Then:

- Preserve the first failure and its source revision. Reproduce the failing boundary once with the narrowest useful check; fix the cause, add a focused regression when warranted, and rerun the affected required gate. Use `acceptance-contract` for explicitly requested independent acceptance or a serious failure whose behavior needs an independent oracle.
- Do not turn one failure into a global audit, multiple full-suite repeats, a re-review loop, new infrastructure or speculative tests. Keep a failed required check failed until repaired; never replace it with a green unrelated check.
- If **every** missing or failed check is confirmed to be a billing/spending-limit startup failure and no other check is pending, run feasible required jobs locally at the PR head, record evidence, and merge with `gh pr merge` only if all other gates pass. Never use `--admin` or bypass protection; ordinary CI failures do not qualify.

If no issue is actionable, report completion, known failures, unverified behavior and exact blockers. In live mode, offer genuine owner questions; otherwise stop without inventing work.
