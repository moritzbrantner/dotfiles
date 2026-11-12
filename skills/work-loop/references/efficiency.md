# Small-sample work-loop accounting

Use existing runtime usage exports, run IDs, timestamps and PR/check results. Keep the record in the existing coordinator handoff; do not create a queue, database, GitHub comment per event, or a new instrumentation service. Do not scan complete historical transcripts just to reconstruct missing counters.

Establish telemetry availability once from the runtime data already exposed. When no usage counters are exposed, the coordinator may state once: "This runtime does not expose usage telemetry; this run will report outcomes, workers and repairs only." Tell workers to omit unavailable fields. Do not repeat this note per issue, PR wake or final summary, and do not search for counters or ask workers to retrieve them again. If real telemetry later becomes available, include it from that point and identify its coverage.

At each issue's completion or handoff, record:

- Issue and outcome: merged, awaiting gates, blocked, stopped or failed; PR/head; include first-start/latest-handoff timestamps only when known.
- Worker count (distinct implementation/repair workers), additional reviewer/investigator count, and repair rounds (a return to implementation after failed validation/review).
- Coordinator and child usage separately, including retries and failed/cancelled attempts: input, cached input, output, and reasoning tokens when exposed. Include only exposed categories and source/run IDs. Omit absent fields rather than printing `unknown`, `unavailable` or empty placeholders. Label reported usage `partial` when it omits some agents, runs or categories; never present a partial subtotal as total usage.
- Required-check outcome and known regressions, reopenings or owner corrections; missing independent verification stays unverified.

A compact handoff can use this shape without creating another persistent file:

```text
Efficiency: issue=<repo#issue>; outcome=<state>; PR/head=<identity>
Workers: <count>; other agents=<count>; repair rounds=<count>
Quality: <required checks; known regressions/corrections>
```

Only when available, append the measured time window and coordinator/child usage with provider/model, exposed token categories, source/run IDs and complete/partial coverage. Omitted measurements are not zero; never infer tokens from transcript length or invent timestamps.

Use each run's usage once. For cumulative session counters, use end-minus-start over the relevant interval rather than summing snapshots; never add a parent aggregate that already includes children to those children again. Cached tokens are a subset of input, and reasoning tokens are a subset of output when the provider reports them that way, not extra tokens. Preserve provider semantics if they differ. Shared coordinator runs spanning issues remain batch overhead unless reliable attribution is available; do not charge their full usage to every issue.

For the initial ten-issue sample, report completed and unfinished outcomes together, worker counts, repair rounds and known quality failures; include measured coordinator/child usage and elapsed time (including waits) only when available. Compare similar issue types with comparable usage coverage and model settings. Do not call elapsed time active execution time or raw tokens monetary cost. Estimate cost only with applicable rates and complete categories, labeled as an estimate. A high cache-hit rate alone is not task-level savings. No historical baseline means no demonstrated saving yet.

After the initial sample, continue measurement only when requested or needed to investigate concrete overhead. Missing telemetry never blocks implementation or integration.
