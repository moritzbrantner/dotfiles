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
   - For other PRs, treat review as a batched convergence step, not a fix/review ping-pong loop. Before requesting any repeat `@codex review`, perform a **review-closure pass**: enumerate every existing Codex finding, resolve or explicitly answer each one, inspect the changed code plus its adjacent callers/contracts/tests for the same class of defect, and run the focused regression checks plus the repository-documented validation applicable to the changed scope. Do not request another review while a known actionable finding remains or after each individual fix.
   - After that closure pass, compare the new head with the last completed reviewed head. If the intervening changes only repair already-raised findings and their regression coverage without expanding product behavior, architecture, public contracts, or touched subsystem scope, make the repeat request **targeted**: identify the previously reviewed commit and ask Codex to verify the resolved findings and the regression surface introduced by those fixes. If behavior, architecture, contracts, or subsystem scope expanded, request a normal exhaustive review instead.
   - Require a completed Codex review on the latest head before merge. If a targeted review discovers a genuinely new defect, batch all resulting fixes and repeat the closure pass once; do not immediately trigger another review after each patch. Repeated rounds are allowed when they continue finding real defects, but a high round count is a signal to widen the closure pass before asking Codex again, not to keep cycling mechanically.
   - Never sit waiting on a Codex review or CI. Once a PR's implementation is complete and it waits only on Codex or CI, start or continue an actionable issue in a different repository, and re-check waiting PRs with `workctl pr` at natural breakpoints (after a push, before picking the next issue) rather than polling. A draft whose implementation is still in progress is not a reason to switch; keep one implementation in progress at a time.

6. **Repeat** from step 1 until nothing is actionable.

## Usage limits

- Run unattended loops in an open interactive session with Claude Code's `autoContinueAtUsageLimit` left on (the default). The main session then waits at a usage limit and continues at the reset. Background and `-p` sessions don't wait, and neither does any session whose reset is more than 24 hours away (typically the weekly limit).
- Delegated workers do not wait. A limit ends them with a rate-limit error. When the main session continues after a limit, or the owner says it has reset, check every worker before doing anything else. Resume each one that ended on a rate limit through its existing agent (not a fresh one), so it keeps its context and its repository assignment. Tell it to re-check its PRs with `workctl pr` first, because GitHub state may have moved while it was down.
- Before starting a replacement worker for the same repositories, stop the old one, so two workers never push to the same branches.

## When nothing is actionable

Invoke the `unblock` skill. Each recorded owner decision can make work actionable again. Stop when no actionable work or unresolved owner decision remains.

## Report

At the end, report one line per issue touched: `repo#n → merged PR #m | PR #m waiting on <x> | needs-decision | closed (reason)`, plus anything the user must do.
