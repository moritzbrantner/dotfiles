# Product-selection acceptance scenarios

Authoritative scope: dotfiles issue #30. This contract was independently derived from
that issue and default-branch revision `26a21068519ebf69cef9b549c9720dd6709dc1ab`
before production policy edits. It reviews the instructions an agent consumes;
it does not claim that text matching proves a future agent's execution.

Run this semantic review against `skills/work-loop/SKILL.md` and its referenced
existing skills. For each fixture below, locate the operative instruction and
record the required choice and prohibited claim in the PR evidence. A missing or
contradictory instruction fails acceptance. Also run `node scripts/check.mjs` in
full: no verified dependency map exists between policy changes and existing tests.
The configuration and workctl tests prove mechanical integrity, not product success.

## Regression matrix

| Fixture input | Required decision | Failure to reject |
| --- | --- | --- |
| A repository declares video into an editable multi-object Blender scene as its highest-priority acceptance scenario. Its referenced real-input E2E last failed because objects cannot be separately edited. Several geometry micro-optimization issues and the scene blocker are actionable. | Choose the evidenced scene blocker, preferring its existing issue. | Pick a convenient micro-optimization or infer the scene passes from geometry tests. |
| The repository declares a product goal but has no executable acceptance scenario or reliable recorded outcome. Optional implementation issues are actionable. | Surface the evidence gap and prioritize independently specifying a minimal representative scenario/fixture and acceptance authorship in the owning repository before optional implementation. | Invent a success claim, score, synthetic product pass, or implementation-authored expectation. |
| An urgent high-severity correctness regression is actionable alongside a feature acceptance blocker. | The urgent regression remains eligible and can supersede the feature blocker with a recorded reason. | Categorically defer urgent correctness or security work behind features. |
| A ready PR passes both mechanical and independent acceptance gates. An acceptance issue is blocked by an open native dependency; its prerequisite is actionable. | Finish the ready PR first, then choose the actionable prerequisite rather than the blocked issue. Preserve repair precedence, default-branch merge rules, needs-decision exclusions and open-closing-PR exclusions. | Start a blocked issue or merge on mechanical readiness alone. |
| Internal unit tests are green and the implementation is merged, but the independent real-input E2E still fails the intended editable-scene experience. | Report implementation state, demonstrated capability, and user-observable acceptance separately. Escalate a conflict with the intended reference experience through grill/owner decision and clarify product specs before more implementation selection. | Report a product pass from a merge, closed issue, green unit tests or fabricated fixture; weaken acceptance to fit implementation. |


## Cross-repository tie regression

Independent review follow-up derived from issue #30 after review finding
`4243022193`; pre-fix baseline `32c4d174afed1f92f5227573bf969a04a257a4e5`.

Fixture: repositories A and B each declare a highest-priority scenario, each has
reliable independent failing acceptance evidence and an actionable earliest
blocker. No owner-approved cross-repository order or evidence establishes that
one is more consequential. Neither has an urgent override or existing PR to
finish. Both must remain valid product-blocker candidates.

Required decision: use a documented owner-approved cross-repository order or an
explicit evidence-based reason when one exists. Otherwise make the tie visible.
An explicit neutral scheduling rule (for example oldest actionable blocker by
GitHub creation time, with repository/issue identity breaking exact timestamp
ties) is acceptable only when recorded as scheduling between equally eligible
blockers, never superior product priority. Alternatively ask the owner when the
choice would establish a consequential product trade-off. Do not invent weights,
semantic priority, scores, freshness or urgency from implementation convenience.
Missing acceptance evidence must still use the existing evidence-gap path rather
than being promoted into an artificial tie.

Prohibited result: choose by scan order or agent intuition without a stated tie
rule/reason; claim an older issue is a more important product; force an owner
question for a routine scheduling tie after a neutral rule is declared; or apply
neutral scheduling over established owner priorities or urgent severity evidence.

Baseline observation: step 2 handles each repository's local priority and blocker
but declares no cross-repository comparison or tie behavior, so this fixture
fails its policy review. This scenario reviews instructions, not future execution.

## Upstream dependency regression

Owner decision 2026-10-14: a worker scoped to one repository may follow a
blocking dependency into the repository that owns the missing capability.

Fixture: the owner starts the loop for repository A only. A's selected blocker
needs a capability owned by repository B, which A consumes. B's checkout is clean
and no other worker owns it.

Required decision: create the smallest issue in B, record it as a native
`blockedBy` dependency of A's issue, implement it in B under B's own
instructions, acceptance, review and merge rules with its own issue and PR, then
update A's dependency after B's change merges (and publishes, if A pins a
release) and resume A. Skip B and report when its checkout has unrelated
uncommitted changes, or when another worker owns it and has not both stopped
and handed off its exact branch/PR. This covers an owner that is still active
(even if it announced a handoff) and one that is stopped or rate-limited while
its checkout is clean between commits.

Prohibited result: implement both repositories from one issue or PR, stack PRs
across repositories, leave A's issue parked only because the owner named A, or
run two implementations at once, or treat a clean checkout as unowned.

## Authority and boundary checks

### Current Atlas authority during selection

Independent acceptance extension for review finding `4243229084`, baseline
`b008d9a61cbdf61f70a828fe7f0e8b14a32a132a`.

Fixture: repository A's old roadmap/test calls scenario X highest priority, but
its current owning Atlas Decision retires X and selects Y. Repository B also
has an evidenced actionable blocker. The loop must consult current applicable
Atlas Decisions before comparing repositories, scenarios or blocker issues.
Only the currently approved scenario is eligible; historical evidence for X
does not reauthorize X or establish priority over B. Use scoped queries and
authoritative Markdown when the query/index is unavailable or stale. Missing
current direction/evidence uses the existing gap/owner-decision path.

Required result: selection uses Y and its actual evidence before selecting an
issue or applying the neutral cross-repository tie rule. Looking up the Atlas
only after choosing A/X is insufficient. No retired or superseded text may
override a current Decision.

Baseline observation: step 2 selects from declared scenarios and evidence;
explicit current Atlas retrieval occurs only in step 3, so this fixture fails.

- Selection uses the repository's declared highest-priority scenario and its actual
  last recorded outcome, with existing scenario/test references. It does not infer
  priority or freshness when reliable evidence is unavailable.
- Choose the earliest actionable, evidenced blocker on the failing journey;
  prefer an existing GitHub issue and create only a focused necessary issue.
- Product intent, fixtures, executable acceptance and architecture belong in the
  owning repository. GitHub issues/PRs and native dependencies remain execution
  state; only `needs-decision` is introduced as a workflow label.
- No new planner, daemon, score database, queue, coordination state or universal
  product specification schema is required. Deterministic workctl mechanics
  remain separate from product semantics.
- Independent acceptance expectations cannot be weakened by the implementation
  agent. Unknown test impact requires the full applicable suite.
- Dogfood selection on video-to-3d issue #77, PR #149 and issues #150/#151 using
  their current recorded evidence. A policy review is not a claim that their
  product acceptance passes; record observed decisions and any evidence gap.

## Baseline observation

At the pinned baseline, step 2 chooses unblocking work, then bugs, then recent
progress. It does not inspect a declared product scenario/outcome, distinguish
implementation/capability/product acceptance, or specify the missing-evidence
selection path. The first, second and fifth fixtures therefore fail the policy
review. Existing PR-first and dependency exclusions already cover part of the
fourth fixture and must be preserved.

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
