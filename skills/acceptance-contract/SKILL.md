---
name: acceptance-contract
description: Diagnose serious regressions or supply explicitly requested independent acceptance; not a mandatory preimplementation step.
---

# Acceptance contract

**Not part of the normal happy path.** A routine feature, behavior change or refactor does not require an independent test author, tests-first commits, retrospective acceptance handoff, full-suite run or browser verification. §work-loop§ uses existing required repository gates.

Invoke this procedure for a concrete, significant regression, a disputed behavioral contract, an owner request for independent acceptance, or a repository-specific mandatory gate.

## Investigate

1. Read the failing issue, actual command/logs, source revision, applicable §AGENTS.md§, conventions, Atlas Decisions and existing tests. Current approved product intent controls expected behavior; changing a test to fit broken code is not a fix.
2. Identify the **specific observable failure**: operation, input, expected and actual result. Preserve its original evidence. If a narrower check passes, it does not clear the required failing gate.
3. Reproduce the boundary with the smallest existing test or real interaction. Add a focused regression when the defect could recur. Avoid building a general test framework, re-running broad suites without new information or generating synthetic evidence.

## Independent acceptance (when requested or necessary)

- A separate agent/context works from approved intent and the pre-fix baseline, not the implementation patch. It may independently verify existing coverage or author a focused test. Record test paths, baseline revision/result and source; commit new tests before the fix when practical.
- Do not create a tests-only draft PR, dummy commit or parallel implementation. Keep tests and code in the same task PR; resume existing acceptance-only drafts rather than duplicating them.
- If independence is unavailable, state the limitation. Do not claim that implementation-authored tests were independent or block unrelated happy-path work.
- If an existing PR predates the requested independent check, examine its actual pre-fix baseline; describe the work as **retrospective**, never as tests-first.

## Close the failure

Fix the root cause, run the focused regression and all existing required checks affected by the fix. A required failed check remains blocking until it passes; do not substitute a green unrelated test. A changed mock/fixture/harness that affects coverage needs renewed scrutiny. Preserve the failing and final evidence at their real revisions.

Report what actually executed and passed, what remains unverified, and any needed owner decision. No standing requirement to independently verify the next unrelated issue.
