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
   - Run `workctl scan` before starting an issue. Repair `broken` and leave `waiting` open. Before merging **any** `ready` PR, including one that predates this skill, inspect its actual changes and issue for behavior/architecture impact and apply the `acceptance-contract` handoff when required. `workctl` readiness proves mechanical CI/review/mergeability only, **not** independent acceptance. For legacy PRs with implementation already committed, use the skill's **retrospective migration handoff** rather than pretending that tests preceded implementation. If required evidence is still missing, treat the PR as waiting and resume it rather than calling `workctl merge`; merge only after both gates pass.
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
   - For behavior/architecture changes, establish or independently verify acceptance with a **separate acceptance agent/context** before any production edits. If tests change, commit them before implementation. If existing tests already suffice, record their paths, baseline revision and independent verification on the issue **before** implementation; no empty or artificial test commit is required.
   - Push early and open a draft PR with `Closes #<n>` as soon as the acceptance change or another meaningful pre-implementation change can form a PR, **before** the implementation agent begins. If no pre-implementation file change is warranted, retain the earlier issue handoff, open the draft with the first meaningful implementation commit, and immediately link that pre-implementation handoff; never invent a dummy change. Always target the default branch; never create stacked PRs. If the next slice depends on an unmerged PR, leave it as an issue and work elsewhere until that PR lands.
   - Implement in a distinct agent/context using the established acceptance contract. If independence cannot be arranged, leave an existing task PR in draft awaiting handoff; when no draft or meaningful commit exists, record the missing handoff on the owning issue and do not begin implementation. Never manufacture a commit to create a placeholder PR.
   - If the selected issue is broader than one coherent PR, finish a substantial coherent chunk and create focused follow-up issues for the separable remainder before closing the selected issue. Do not create follow-up issues for unrelated findings.
   - If another repository owns a missing capability, create the smallest issue there that actually unblocks this work and add it as a native GitHub dependency. Do not implement both repositories from one issue.

5. **Validate and merge.**
   - Run the repository-documented validation for the touched scope.
   - Gate merge on new or independently verified existing acceptance contracts, executable architecture invariants, and core smoke checks. Use a deterministically proven affected-test selection only when its dependency mapping is complete; otherwise run the full applicable suite and record the gap. Verify periodic full-suite coverage and record a follow-up if absent. Do not weaken expected behavior to fit an implementation; explicit current product specifications control test expectations, with independent verification of test translations. Independently reverify harness/fixture changes that could alter what a test exercises, even if assertions are unchanged.
   - Re-run `workctl pr <repo>#<n>` for the touched PR: repair `broken`, leave `waiting`, and invoke `workctl merge` only for `ready`.
   - Existing stacked PRs are migration state only: after their base lands, retarget them to the default branch before validation or merge.
   - Never request or re-request `@codex review` for PRs authored by `renovate[bot]`. They bypass only the Codex review gate; CI, mergeability, and existing unanswered review findings still apply.
   - For other PRs, Codex review is **targeted only**; the owner disabled exhaustive automatic Codex review because of its cost and diminishing returns. Do not expect an automatic review and never request a normal exhaustive review. Once implementation and the documented validation are complete, request **one** `@codex review` that names the risky parts of the diff (files, contracts, edge cases) and asks Codex to focus there.
   - Require a completed Codex review on the latest head before merge, with every finding resolved or explicitly answered. Accept that a targeted review may catch fewer problems; do not compensate with extra rounds.
   - Request a repeat targeted review only when the previous one found a genuine defect (P1 or real bug), or when later commits (CI fix, conflict resolution, owner-requested change, P2/P3 fix) made the last completed review stale relative to the latest head; in the stale case, scope the request to the commits since the reviewed SHA. Before a defect-driven repeat, perform a **review-closure pass**: enumerate every Codex finding, resolve or explicitly answer each one, inspect the changed code plus its adjacent callers/contracts/tests for the same class of defect, and run the focused regression checks plus the applicable documented validation. Batch all fixes into one push, then ask Codex to verify the resolved findings and the regression surface of the fixes relative to the previously reviewed commit. Answer P2/P3 findings with a fix, a reply, or a focused follow-up issue rather than another round.
   - **Narrow exception to the `ready`-only merge rule in steps 1 and 5:** when GitHub Actions cannot run for a repository because of an account billing or spending-limit failure (common for private repositories), first confirm that **every** failed or missing check is individually a billing/spending-limit startup failure (its annotation says so); any other failed check, including external CI or an Actions job that did start, keeps the PR `broken` and must be repaired normally. Then run every job of the repository's workflows locally against the PR head, preferably with `act` (one job at a time); fall back to running a job's steps manually when `act` cannot. Skip only jobs that need unavailable secrets or GitHub-hosted services, and say so. Record the commands, head SHA and results in a PR comment and treat a green local run as the CI gate. `workctl` will still report failed checks, so merge with plain `gh pr merge` only when the billing-attributed checks are its sole failure reasons and every other gate (review, findings, mergeability, acceptance) passes; never use `--admin`, and leave the PR open for the owner if branch protection refuses the merge.
   - Never sit waiting on a Codex review or CI. Once a PR's implementation is complete and it waits only on Codex or CI, start or continue an actionable issue in a different repository, and re-check waiting PRs with `workctl pr` at natural breakpoints (after a push, before picking the next issue) rather than polling. A draft whose implementation is still in progress is not a reason to switch; keep one implementation in progress at a time.

6. **Repeat** from step 1 until nothing is actionable.

## When nothing is actionable

Invoke the `unblock` skill. Each recorded owner decision can make work actionable again. Stop when no actionable work or unresolved owner decision remains.

## Report

At the end, report one line per issue touched: `repo#n → merged PR #m | PR #m waiting on <x> | needs-decision | closed (reason)`, plus anything the user must do.
