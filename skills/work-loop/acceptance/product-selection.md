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
