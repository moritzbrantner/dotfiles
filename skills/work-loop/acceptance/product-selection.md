# Work-loop policy scenarios

Current owner policy (2026-10-17): **happy path first**. Implementation normally proceeds without voluntary verification; existing required merge gates remain. Historical detailed scenarios and former mandatory acceptance policy remain in Git history, not in force.

Review these as instruction scenarios, not proof that an agent executed them.

| Situation | Required behavior |
| --- | --- |
| Two unblocked issues, one older; old Atlas says to prioritize the newer feature | Choose oldest by creation time, then repository/issue tie-break. No category prioritization or discretionary deferral. |
| Existing PR is ready and a new issue exists | Finish/merge the PR after checking actual head and required gates; no new acceptance ceremony. |
| Routine well-specified feature has no acceptance test | Implement directly; no synthetic acceptance author, tests-only commit, or browser test. |
| Public fixture, dependency or tool is missing | Obtain/prepare it as issue work, without calling it an owner blocker. |
| Unrelated Atlas Question remains unanswered | Implement the specified issue. |
| Private input, permission or consequential owner choice is indispensable | Record the exact blocker and work another eligible issue; ask only that owner question. |
| Work needs another repository's capability | Use a native GitHub dependency and separate PR in its owning repository. |
| User-facing feature merges without a browser or published-route check | Report implementation; mark the journey unverified. Do not invent a pass or reopen solely for missing voluntary verification. |
| Required CI fails or a user reports a broken journey | Keep the gate/issue open, capture original evidence, diagnose narrowly, fix, and rerun the affected required check. |
| Concrete data-integrity/security failure risk is discovered | Use proportionate focused verification even before impact is observed. |
| Owner explicitly requests independent acceptance | Use `acceptance-contract`; do not claim an agent-authored test was independent. |
| PR waits on CI and owner said "finish and stop" | Record exact head and pending gate. Stop without starting unrelated work, polling or skipping the gate. |
| Narrow repro passes but required integration gate remains red | Gate stays failed. Collect state at its real failing boundary before repeated runs. |
| Wrapper fails despite green child commands, or optional tests skip | Record each real command and wrapper result; required zero-execution coverage is unverified, not passed. |
| Source was tested before commit and changed afterward | Keep the original revision/evidence; rerun required invalidated checks when escalation calls for them. |
| GitHub Actions cannot schedule due to billing | Use the narrowly documented billing exception only if every missing/failed check is confirmed billing-only and no other gate is pending; do not bypass protection. |

Product outcome, implementation, test evidence and publication remain distinct. Do not turn missing voluntary evidence into a synthetic blocker; do not treat failed required evidence as a pass.
