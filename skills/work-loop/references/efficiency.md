# Small-sample work-loop accounting

Use existing runtime usage exports, run IDs, timestamps and PR/check results. Keep the record in the existing coordinator handoff; do not create a queue, database, GitHub comment per event, or a new instrumentation service. Do not scan complete historical transcripts just to reconstruct missing counters.

At each issue's completion or handoff, record:

- Issue and outcome: merged, awaiting gates, blocked, stopped or failed; PR/head and first-start/latest-handoff timestamps.
- Worker count (distinct implementation/repair workers), additional reviewer/investigator count, and repair rounds (a return to implementation after failed validation/review).
- Coordinator and child usage separately, including retries and failed/cancelled attempts: input, cached input, output, and reasoning tokens when exposed. Name the provider/model and usage source/run IDs. Mark unavailable categories `unknown` and partial coverage `partial`.
- Required-check outcome and known regressions, reopenings or owner corrections; missing independent verification stays unverified.

A compact handoff can use this shape without creating another persistent file:

```text
Efficiency: issue=<repo#issue>; outcome=<state>; PR/head=<identity>
Window: <first-start UTC> → <latest-handoff UTC>; workers=<count>; other agents=<count>; repair rounds=<count>
Coordinator usage: <provider/model; input/cached/output/reasoning or unknown; source/run IDs>
Child usage: <same categories, aggregated once across this issue's child runs>
Coverage: <complete/partial/unknown>; quality: <required checks; known regressions/corrections>
```

Use each run's usage once. For cumulative session counters, use end-minus-start over the relevant interval rather than summing snapshots; never add a parent aggregate that already includes children to those children again. Cached tokens are a subset of input, and reasoning tokens are a subset of output when the provider reports them that way, not extra tokens. Preserve provider semantics if they differ. Shared coordinator runs spanning issues remain batch overhead unless reliable attribution is available; do not charge their full usage to every issue.

For the initial ten-issue sample, report completed and unfinished outcomes together, total coordinator/child effort, elapsed time (including waits), repair rounds and known quality failures. Compare similar issue types with comparable usage coverage and model settings. Do not call elapsed time active execution time or raw tokens monetary cost. Estimate cost only with applicable rates and complete categories, labeled as an estimate. A high cache-hit rate alone is not task-level savings. No historical baseline means no demonstrated saving yet.

After the initial sample, continue measurement only when requested or needed to investigate concrete overhead. Missing telemetry never blocks implementation or integration.
