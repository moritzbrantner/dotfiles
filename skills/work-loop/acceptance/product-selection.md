# Unblocked-issue selection acceptance scenarios

Owner execution policy, 2026-10-16: issues are implementable when their **real
issue-specific prerequisites** exist; no product-area ordering, capacity ranking,
"next milestone" deferral or roadmap priority question is permitted. This
contract supersedes the earlier product-scenario-priority selection fixtures,
which remain available in Git history for audit, not as operative test cases.

These tests review the instructions consumed by an agent, not a claim that any
future agent run or consumer application passed. For each case below, identify the
operative `skills/work-loop/SKILL.md` and associated skill instructions and
evaluate the required decision and explicitly prohibited behavior. A missing
or contradictory instruction fails the semantic review.

For executable changes run `node scripts/check.mjs` in full, because no
mechanically verified affected-test map exists for work-loop selection semantics.
Keep product acceptance, mechanical PR readiness and agent policy review separate.

## Current owner-driven selection regression matrix

| Fixture input | Required decision | Prohibited behavior |
| --- | --- | --- |
| Open music feature A is older than open speech feature B; both are specified, unblocked and have no active PR. An old Decision Atlas says "speech first" or music "deferred." No issue-specific dependency exists. | Choose A under oldest-created neutral scheduling (or obey a currently explicit owner-selected issue scope). | Treat product category, perceived time/resource scarcity or a legacy roadmap stage as a blocker; ask the owner to rank music versus speech. |
| Two unblocked issues in different repositories have equally sufficient specifications and evidence and no active owner focus. | Deterministically choose by GitHub creation time, then repository full name/issue number only for ties. | Invent value scores, schedule by scanner result order, or solicit business priorities to resolve an ordinary queue tie. |
| An issue has a clear behavior contract but has no acceptance fixture yet; an independent agent can author it. | Establish or independently verify the acceptance contract, then implement the issue. | Label `needs-decision`, ask the owner for priorities, or select a different category just because writing tests is work. |
| An issue needs a public, reproducible dataset or model bundle obtainable under its permitted license; it is not yet prepared. | Treat acquisition/preparation and validation as issue work, or create/follow a concrete upstream issue with a native dependency when truly independently owned. | Call ordinary implementable preparation a human blocker or infer a release/roadmap stage dependency. |
| An otherwise well-defined issue genuinely requires unreleased private owner-provided media, explicit licensing consent or a required consequential product decision; another unblocked issue exists. | Record the exact missing input and owner action, leave the affected issue open/blocked, work another unblocked issue, and ask the owner only about the actual missing item. | Fabricate an input, lower acceptance, add a blanket category deferral, or keep the worker idle. |
| An unanswered Atlas Question exists about an unrelated feature or hypothetical next milestone; the selected issue is fully specified. | Implement the selected issue; consult the Atlas only for applicable product behavior and genuine conflicts. | Turn every open Question into `needs-decision` or refuse to implement until an interview is completed. |
| A current Atlas Decision specifies the issue's required behavior, but supersedes an older product-ordering Decision. | Follow the current behavior contract, retain relevant acceptance and ignore superseded scheduling text. | Use stale priorities from roadmap/test/issue text to reorder or block the issue. |
| A ready existing PR passes both mechanical and independent acceptance gates; an issue also awaits work. | Finish/merge the existing PR first and verify the observable result where required, then choose the next actionable issue. | Start a duplicate implementation or merge solely because `workctl` is mechanically green. |
| An acceptance issue has a real native GitHub `blockedBy` edge to an open upstream issue; that upstream issue is doable. | Do the upstream issue in its owning repository under separate implementation/PR and acceptance, then unblock/resume the consumer. | Start the blocked issue, implement both repositories in one PR, or invent another coordination ledger. |
| An implementation merged and unit tests passed, but live product acceptance is missing or failing. | Keep the original issue's live deployment/acceptance handoff open; verify/repair the real product before calling it done. | Report a product success from a closed PR, green unit suite, or fabricated fixture. |
| An in-scope issue genuinely needs a human-only decision and no other issues are actionable. | Invoke `unblock` for that specific decision; stop when no human blocker remains. | Continue speculative A/B/C prioritization questions, create artificial maintenance or declare blocked issues complete. |
| An urgent supported-product security/correctness regression is open alongside unrelated product features. | Treat it as actionable normal issue work, honor the owner's explicit scope, and preserve normal severity/security rules. | Mark it "deferred because speech/motion/music first" or waive validation. |

## Upstream and owner-scope safeguards

An owner explicitly selecting a repository, issue, or stop condition constrains the
current work session, not all subsequent sessions' product-category ordering.
One implementation worker remains active per repository. A selected issue that
needs work in a separate upstream repository may follow that **native** dependency,
but it must not overwrite a checkout owned by another worker, and each repository
uses its own implementation PR and acceptance contract. If a checkout/resource is
truly unavailable, record the precise blocker instead of fabricating readiness.

Acceptance must still be independent for behavior changes, an implementation
PR must still satisfy its required checks and review/finding rules, and a
user-facing feature is not complete without its observable end-to-end acceptance.
Prioritization removal is not permission to skip engineering quality or security.

## Historical policy

The previous acceptance contract ranked declared highest-priority product
scenarios and their earliest blocker before other unblocked issues. The owner
superseded that policy on 2026-10-16. Historical owner evidence and regression
results remain in the Git history; none authorize an implicit business-priority
scheduler now.

## Retrospective regressions — 15 October 2026

Independently derived from the owner's request to fix four workflow problems in
**Work-loop retrospective — 15 October 2026**, before policy edits and without an
implementation patch. These four fixtures supplement, rather than replace, the
existing regression matrix and boundary checks.

Baseline: dotfiles `c713c1ecbca28fb44bb93bbd2876a726efd855f9`;
`skills/work-loop/SKILL.md` SHA-256
`12c7e761ff4015efe89633ff1d1fa85bf1c3f2e8b97588204cdf43d69c4d8551`.
Shared convention sourceRevision:
`5ad0db36974c8b0e5f9812c90ee34a4f227852c3`.

The observations below are actual read-only semantic policy reviews, not new
agent executions or fabricated red product tests. Existing coverage is reported
alongside each gap. For candidate verification, identify the operative instruction,
required choice and prohibited claim for all four cases and the existing scenarios.
Mechanical baseline: `node scripts/check.mjs` exits 1 before validation because
ESLint is unavailable; this setup failure proves neither semantic failure nor
success. No dependency/environment changes were made by the acceptance author.

### R1. Keep the selected journey and respect wrap-up

Fixture: a configured-match journey and its necessary prerequisites are selected;
it remains incomplete while its PR waits on external CI. An unrelated repository
has a ready routine dependency update. The owner then says to finish the current
issue only and stop; the current PR receives a genuine review defect.

Required choice: keep work on the selected journey and evidenced blockers instead
of silently broadening into unrelated maintenance. Repair the current defect
without starting another feature or acceptance preparation after wrap-up. If only
external gates remain, record the exact issue/PR/head and pending evidence, then
stop without polling or claiming completion. Required upstream prerequisites and
evidenced urgent correctness remain eligible with their recorded reason and
normal ownership/acceptance rules; focus must not categorically forbid them.
Pending review, CI or live verification cannot be waived to meet the stop request.

Baseline observation: **partial coverage**. Step 2 already prioritizes evidenced
product blockers and permits urgent corrections; step 4 permits necessary upstream
work. Owner instructions remain authoritative. However, global PR-first,
continue-in-another-repository and repeat instructions do not define an active
journey limit or explicit shutdown handoff. The retrospective records scope drift;
no new agent execution was run to manufacture that result.

### R2. Check every explicit issue obligation before expensive completion

Fixture: the issue requires profile selection, a visible precreation board
description, concurrent configurations, rejection/restart behavior and legacy
creation. Independent API/browser checks cover everything except the board
description and pass.

Required choice: relate every explicit obligation to an existing/new acceptance
case, independent review or stated gap, using the owning issue/spec and handoff.
Catch the omitted visible outcome before implementation and the first expensive
completion gate; API success cannot substitute for it. If found after production
has begun, use the existing retrospective acceptance handoff and report chronology
honestly. Keep separate acceptance authorship and independently reverify helper or
fixture changes that might alter coverage, even with identical assertions. Reuse
sufficient existing checks; no universal product schema or new queue is required.

Baseline observation: **partial coverage**. Steps 3–5 and `acceptance-contract`
already require current intent, independent integrated coverage and every handoff
test; dropping an explicit requirement was already wrong. An obligation-to-evidence
completeness checkpoint before the expensive full gate is not explicit. The
recorded omission is an execution miss, not permission granted by the old policy.

### R3. Capture the failing boundary before spending more green repeats

Fixture: one required full two-peer recovery case fails; focused repeats pass.
The trace does not identify the pending operation and retired/replacement
connection that would distinguish hypotheses.

Required choice: preserve the first failure with its command/source context,
keep the required gate failed, and collect bounded relevant state at the actual
asynchronous boundary before many further repeats. Report unavailable observations
rather than inventing them; redact secrets. Use the evidence to establish a real
regression before repair. Diagnostic repeats may improve reproduction, but cannot
turn the failed gate green. Preserve ENV-004: use ordinary setup; a concrete
missing-library failure warrants proportionate environment investigation, while
successful normal runs need no fingerprints, runner receipts or forced containers.

Baseline observation: **partial coverage**. TEST-012 already forbids retry-to-green;
the existing diagnosis procedure supports red-capable loops and targeted state
capture. The work loop does not require that bounded capture early, and the
diagnosis procedure permits repeated reproduction before instrumentation. Existing
failure classification and environment trust remain covered guardrails.

### R4. Preserve evidence and distinguish commands, bookkeeping and product exit

Fixture: actual native and full commands exit 0, but a wrapper exits 1 because it
misinterprets boolean metadata. The full suite has 60 cases with 10 legitimate
optional skips; a required real-input tier separately executes 3 cases. A later
retry could overwrite a raw failure, and a test-then-commit report still records
the base HEAD. Contrast an exit-0 command whose entire required tier was skipped.

Required choice: retain original raw failures and record later observations
separately; label excerpt-only recovery honestly. Report actual per-command and
outer bookkeeping statuses separately, inspect executed/pass/fail/skip counts,
and distinguish required coverage from legitimate optional tiers. Zero executed
required cases are missing evidence, not a pass. Preserve the original HEAD record
and separately bind committed files to tested bytes, or re-run invalidated checks;
do not relabel old execution as new. No fixed filename or universal receipt schema
is required. A homepage/legacy path or completed native build with two cameras and
zero editable objects cannot establish the promised configured journey or editable
scene: preserve separate implementation, capability and product acceptance claims.

Baseline observation: **partial coverage**. Existing acceptance rules already
forbid unrun-pass claims and require current-head evidence, independent contracts,
architecture checks and conservative full-suite fallback. Steps 1/4/5 already keep
live verification open and distinguish bounded scope from product completion.
Explicit case-count inspection, raw-log preservation, bookkeeping separation and
test-then-commit binding are not stated in the loop. The recorded driver mistake
is not a product-test failure; none of these reporting fixes waives required gates.
