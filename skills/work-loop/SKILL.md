---
name: work-loop
description: Run the global coding loop over the moritzbrantner GitHub repositories: finish existing PRs, pick an actionable issue, implement it under that repository's rules, validate, merge, and repeat. Ask the owner only when a real decision is required.
---

# Work loop

GitHub is the only durable work state: issues are work, native issue dependencies express blocking, and pull requests show work in flight. Repository-local instructions, conventions, tests, and architecture remain authoritative.

Do not add claims, queues, coordination files, per-repository loops, or status labels. The only workflow label this loop uses is `needs-decision`.

Use `node ~/.local/share/coding-agent/workctl.mjs` for deterministic PR scanning, readiness, and guarded merges.

## Loop

1. **Finish existing work first.**
   - Run `workctl scan` before starting an issue. Repair `broken`, leave `waiting` open, and merge `ready` with `workctl merge`.
   - A PR whose base is not the repository default branch is `waiting`: never merge it into another feature branch. For legacy stacked PRs, merge the base PR first, then retarget the child to the default branch and revalidate it.
   - Resume existing agent work when it can be traced to an open PR or issue. Discard stale agent-owned work only when its work is closed or superseded. Never overwrite unrelated user changes.

2. **Pick one actionable issue.**
   - Skip `needs-decision`, bot/meta issues, issues with open native `blockedBy` dependencies, and issues already represented by an open closing PR.
   - Prefer work that unblocks other work, then bugs, then work that continues recent progress. Use judgement rather than introducing another ranking or queue.

3. **Understand the issue.**
   - Read the issue, comments, applicable repository agent instructions, and the relevant code.
   - If it is already done, close it with evidence.
   - Apply `issue-preflight` before implementing: verify the issue's promised outcome against the repository's vision/ADRs, architecture and quality constraints. Keep this lightweight for routine, well-specified issues; do not silently replace the intended outcome with the quickest MVP.
   - If repository state settles an ambiguity, proceed and record the choice in the PR.
   - Classify whether the actual scope changes behavior or architecture. If so, use `acceptance-contract` to establish independent, repository-owned verification before production edits. Existing tests only suffice if an independent acceptance agent confirms their coverage.
   - If an owner product, scope, or architecture decision is required, ask one concrete question on the issue, add `needs-decision`, and move on. Use `grill` for a larger owner design discussion when appropriate.

4. **Implement one coherent scope.**
   - Work from a fresh default-branch worktree; do not edit the user's ordinary checkout.
   - For behavior/architecture changes, complete `acceptance-contract` with a **separate acceptance agent/context** first. Keep its tests-first commit and handoff in the same task PR; then implement in a distinct context. If independence cannot be arranged, leave the task draft awaiting handoff, not falsely verified.
   - Push early and open a draft PR with `Closes #<n>`, always targeting the repository default branch. Never create stacked PRs. If the next slice depends on an unmerged PR, leave it as an issue and work elsewhere until that PR lands.
   - If the selected issue is broader than one coherent PR, finish a substantial coherent chunk and create focused follow-up issues for the separable remainder before closing the selected issue. Do not create follow-up issues for unrelated findings.
   - If another repository owns a missing capability, create the smallest issue there that actually unblocks this work and add it as a native GitHub dependency. Do not implement both repositories from one issue.

5. **Validate and merge.**
   - Run the repository-documented validation for the touched scope.
   - Gate merge on new acceptance contracts, executable architecture invariants, and core smoke checks. Use a deterministically proven affected-test selection only when its dependency mapping is complete; otherwise run the full applicable suite and record the gap. Verify periodic full-suite coverage and record a follow-up if absent. Do not weaken expected behavior to fit an implementation; explicit current product specifications win after independent test verification.
   - Re-run `workctl pr <repo>#<n>` for the touched PR: repair `broken`, leave `waiting`, and invoke `workctl merge` only for `ready`.
   - Existing stacked PRs are migration state only: after their base lands, retarget them to the default branch before validation or merge.
   - Never request or re-request `@codex review` for PRs authored by `renovate[bot]`. They bypass only the Codex review gate; CI, mergeability, and existing unanswered review findings still apply.
   - For other PRs, batch review fixes. After a substantive fix changes an already-reviewed head, request a fresh `@codex review`; require the latest head to complete review before merge. Do not cap review rounds in the loop—the Codex exhaustive-review preference controls review depth.
   - Never sit waiting on a Codex review or CI. Once a PR's implementation is complete and it waits only on Codex or CI, start or continue an actionable issue in a different repository, and re-check waiting PRs with `workctl pr` at natural breakpoints (after a push, before picking the next issue) rather than polling. A draft whose implementation is still in progress is not a reason to switch; keep one implementation in progress at a time.

6. **Repeat** from step 1 until nothing is actionable.

## When nothing is actionable

Invoke the `unblock` skill. Each recorded owner decision can make work actionable again. Stop when no actionable work or unresolved owner decision remains.

## Report

At the end, report one line per issue touched: `repo#n → merged PR #m | PR #m waiting on <x> | needs-decision | closed (reason)`, plus anything the user must do.
