# Landing and waiting outside T3

The coordinator owns integration. Workers return their PR and remain available for repairs. In T3 use the host's PR watches instead of these background waits; runtime instructions take precedence.

Outside T3, start at most one bounded `workctl land <repo>#<n>` for a PR after inspecting its actual diff and obligations. The runtime must own the background operation and deliver its completion. Do not detach an unobserved process. If background completion is unavailable, report the pending PR/head and resume on new evidence instead of polling from model turns.

`land` waits for required checks (exit 1 when red), then enqueues on merge-queue repositories (confirming `isInMergeQueue`, retrying once), enables `--auto` with the repository's merge method where allowed, or waits for pending checks and merges only when `workctl pr` says `ready`. It prints one JSON line; exit 0 may mean left waiting, not merged. Inspect `state` and `merged`.

On truth-core every check on the head must be green before merging, enqueueing or arming auto-merge. For Codex-gated repositories add `--wait-review [seconds]` (default two hours): it requests an absent/stale current-head review once, re-requests a review stuck for an hour once, and stops on unanswered blocking findings (exit 1) or timeout (exit 2). Renovate PRs need no review. Do not start this wait as well as a separate PR watcher.

## Optional disposable-clone cleanup

Omit `--clone` for normal checkouts and runtime-managed worktrees. Only pass `--clone <path>` for a disposable clone owned by this run under `~/.cache/agent-work/`. Run from outside that clone. `land` refuses deletion outside this root and reports a warning.

The helper deletes `<path>/target` once CI owns the PR and the clone only once merged, during `--wait-merged <seconds>` or a later `--cleanup-only --clone <path>`. It never removes uncommitted or unpushed work. If GitHub ejects the PR from the queue during the merge wait (open, unmerged and out of queue for a minute), it returns `state: "ejected"`, `merged: false`, exit 1 and available removal/check details. Preserve the clone and diagnose the failure; do not automatically re-enqueue.

## Other waits

For a check-only wait outside T3, use one `workctl wait pr <repo>#<n>` instead of `land`, not alongside it. `wait run <repo> <run-id>`, `wait pid <pid>` and `wait file <path> --contains <text>` cover non-PR operations. Each accepts `--timeout <seconds>` and returns one result: exit 0 green/done, 1 red, 2 timeout. Never write shell `sleep`/`until`/`pgrep` loops or repeatedly ask an agent to inspect unchanged state.
