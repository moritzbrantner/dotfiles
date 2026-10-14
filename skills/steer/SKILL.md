---
name: steer
description: Guide owner product decisions and verification; automatically reconcile approved intent into bounded GitHub issues without starting implementation.
---

# Steer

The **single human-facing entry point** for product direction in the current repository.
The owner defines and approves intent; agents investigate, propose, record and verify it.
This is not a second work loop, issue queue, schema, or implementation worker.

Run `/steer` from a repository, optionally adding a feature or subsystem.
A request like "steer this repository" is equivalent when slash skills are unavailable.
Keep the scope to that repository or one named subsystem; follow relevant cross-repository
contracts only when they affect the choice.

## Two ways to steer

Use the **same Atlas authority and issue handoff** in either mode. Infer the mode
from the owner's input; do not require a mode-selection question or special flag.

- **Guided interview:** When the owner asks to be guided, investigate existing
  intent and ask the next consequential product question, one at a time.
  Use concrete A/B/C alternatives when there is a genuine fork.
- **Free-form discussion:** When the owner starts describing ideas, listen to the
  whole message or uninterrupted sequence first. Then synthesize, group and
  compare the ideas with existing Decisions, Questions and issues. Clarify only
  material ambiguity or conflict; do not force a monologue into A/B/C questions.

Switch naturally between modes, including when a free-form discussion leads to
one focused follow-up or the owner resumes brainstorming. A request to wrap up
means persist and reconcile what is settled, retain unresolved Questions and
finish rather than launching another interview.

## Orient before asking

1. Read the current repository's `AGENTS.md`, nested instructions for affected paths,
   installed/pinned conventions, and existing product documents. Follow local authority.
2. Read the owning Decision Atlas, if present. Prefer scoped `daq find`, `daq get` and
   `daq questions` when available; verify important findings in committed source, especially
   when an index could be stale. Review relevant open Atlas-documentation PRs to avoid duplicates.
   Without an Atlas, use the repository's existing authoritative documents; do not force a
   migration or invent a parallel product authority.
3. Inspect only the relevant vision, scenarios, ADRs, issues, PR discussions, acceptance
   evidence, and implementation. For visual products, examine the real Pages/demo experience
   when tools permit. Distinguish *owner-approved intent*, *agent proposals*, *implemented
   behavior*, *test evidence*, and *human acceptance*. Code or a merged PR is not product
   approval; green CI does not establish the intended user experience.
4. Identify the most consequential gaps in the current product or milestone, without
   creating a durable inventory. Prioritize an evidenced mismatch or unverified essential
   user journey, a conflicting settled decision, or an unresolved choice that can send
   implementation in the wrong direction. Use established owner priority, not an arbitrary
   scoring system or the oldest unanswered Question. Skip settled, irrelevant and routine
   technical choices. If nothing material needs the owner, say so and stop.

## Product feature, not engineering hygiene

The Atlas is organized by **product capabilities and user workflows**, not by development
activities. Record a Decision/Question only for a consequential choice about the
experience, supported input/output, user-visible behavior, product scope or a deliberate
trade-off that the owner must control. Do not create a Decision merely stating that the
product should be fast, tested, maintainable, reliable or high-quality.

If an agreed experience is slow, broken or missing, route the concrete regression through
the normal GitHub issue/acceptance process **without adding another Atlas entry**. For
example, "dialogue takes two seconds to advance" is an actionable defect, not a new
"quality dialogue" Decision. An explicit target behavior or chosen response-time
trade-off may belong in the Atlas when there is a real product fork. Generic test/CI
policy, implementation techniques and worker priorities stay in repository instructions,
conventions, acceptance specifications and issues. Do not broaden steering's existing
issue-write authorization: report or propose ordinary defects unless their issue write
is separately authorized.

When reorganizing an existing Atlas, prefer feature-oriented navigation and place
Questions beside related Decisions. **Preserve stable IDs and historical intent** even
when their original numbers no longer correspond to the containing heading. Do not
silently delete or retire legacy engineering records while changing presentation.

## Minimal durable documentation

Prefer **two default documents** in an owning product repository: the feature-oriented
Decision Atlas (what the product should do, with owner-approved Decisions and relevant
Questions) and `AGENTS.md` (repository-specific architecture, constraints and working
rules, alongside installed shared conventions). An **ADR is optional** when a consequential,
non-obvious engineering trade-off needs enduring rationale that cannot be communicated
clearly in `AGENTS.md`, tests or code.

Implementation details belong in code, types and tests; GitHub issues describe work and
defects, not permanent architecture authority. When a finished issue exposes an invariant
that future workers must preserve, put the constraint in code/tests or `AGENTS.md`. Do
not require a separate plan, spec file, ADR, roadmap, or code-symbol cross-reference
for every decision or feature. Reuse existing project documentation where genuinely
useful, without creating duplicate authorities.

When the repository uses checkbox Atlas entries, respect its semantics: `[x]` may
mean **owner-approved**, not implemented. Always consult that repository's actual
authoring rules and parser capabilities. A currently unindexed source remains the
authority; do not silently invent DAQ support or an implementation claim.

## Guided interview: one human action at a time

Choose **one** of the following conversational actions. These are activities, **not**
new Decision Atlas entry types or GitHub labels.

- **Define:** Elicit the intended end state or representative user workflow, including
  what the user sees/does, important exclusions and the quality floor. Ask for reference
  examples only when they resolve actual ambiguity. Do not shrink the vision to an
  agent-selected MVP.
- **Decide:** Present an existing consequential Question or a newly discovered fork.
  Explain why the choice matters and offer 2–3 genuinely different A/B/C outcomes with
  brief trade-offs and a grounded recommendation when useful. An open answer is valid.
  Avoid false choices: Do not ask questions where one option subsumes the others or where a sensible default with targeted overrides resolves the alternatives; ask only when there is a genuine, consequential trade-off that requires the owner's judgment.
- **Approve:** Show the exact proposed product statement, scenario or acceptance criterion,
  its affected scope and any material consequences. Ask whether to accept, adjust or
  defer it. Never call an agent suggestion owner-approved without an explicit answer.
- **Revise:** Cite the current Decision ID and the observed conflict or changed goal;
  ask what behavior should replace it. Do not infer a revision from code drift.
- **Verify:** Show the actual demo/preview URL or runnable scenario, revision when known,
  steps to try and observed evidence. Ask whether that behavior matches the owner's
  intended experience. If not, elicit the specific mismatch before proposing fixes.
  An unexecuted test or unavailable demo is **missing evidence**, not a pass.

For every turn, give only the necessary context, the relevant existing Atlas ID or
evidence reference, the consequence of the choice, and **one question**. Prefer
concrete user-observable examples to abstract design jargon. In voice/driving mode,
keep the options short and self-contained; images and code must not be required.
`skip` or `later` retains a nonblocking Question; `I don't care` delegates a
routine implementation detail, not a consequential product decision.

## Free-form discussion: synthesize and reconcile

1. **Capture before questioning.** Accept multiple ideas, examples, corrections
   and feature areas in the owner's own order, including rough voice input.
   Do not interrupt the stream with a questionnaire or prematurely pick an MVP.
   When the owner signals that they are continuing, keep accumulating context;
   synthesize at a natural pause or when they ask to sort or finish.
2. **Organize by product capability and user journey**, not the order mentioned
   or an engineering work breakdown. Identify the owning repository for shared
   capabilities; a consumer's desired behavior does not automatically change
   another repository's contract. For each distinct idea, compare the current
   feature-oriented Atlas, relevant open documentation PRs, issues (open and
   closed), PRs, implementation and acceptance evidence. Map existing IDs and
   deduplicate before proposing new ones.
3. **Separate intent from exploration.** An unequivocal owner directive
   (for example, "I want users to switch between two board shapes") is a
   decision to record, without redundant reapproval. "Maybe", "what if",
   contrasting possibilities, examples and agent extrapolations are not
   approved product requirements. Keep consequential uncertainty as Questions,
   and distinguish an experimental option from a promise to ship it as the
   default. Ordinary bugs or implementation tasks belong in issues, not the
   Atlas. Do not silently turn a suggestion into a Decision.
4. **Reconcile conflicts explicitly.** Detect contradictions within the new
   ideas, against current Decisions, or across repository boundaries. Show the
   shortest faithful synthesis: clear owner choices, existing coverage,
   proposed Questions and the material conflicts, with existing IDs where
   possible. If an interpretation would materially alter intent, ask **one
   prioritized clarification at a time**; use A/B/C only when alternatives
   genuinely help. Never settle a conflict by guessing, recency or existing
   implementation. Nonblocking Questions may remain open.
5. **Persist in useful batches.** Record clear directives and outstanding
   material Questions under their feature areas, following the owning Atlas's
   stable-ID and revision rules. Accept corrections to the synthesis; revise
   affected statements instead of layering duplicate entries. Use a reviewable
   PR, preferably the existing relevant Atlas PR. After durable owner-approved
   Decisions, run the same automatic issue reconciliation below; unapproved
   ideas and unresolved Questions must not generate speculative issues.
   Do not defer all persistence until a later session or turn. If the owner
   ends the discussion, finish the recorded subset and report gaps without
   inventing answers.

## Record the owner's answer

1. Treat an explicit interview answer or unambiguous free-form product directive as
   authorization to record **that intent**; do not ask for a redundant second
   confirmation. State uncertainty when the response
   does not settle the choice. Never invent owner approval from tests, code, chat
   suggestions or a proposed PR.
2. Persist the choice in the **owning repository**, following its existing Atlas format.
   By default the only semantic leaves are **Decision** and **Question**. Preserve stable
   IDs and navigation hierarchy. When answering a Question, keep it and append a new
   Decision with `Answers <question-id>`. For revisions, preserve historical IDs
   and follow the owning Atlas convention (for example, a new linked `Supersedes` Decision
   or an explicit inline strikethrough where the local format permits it). Never
   silently renumber, overwrite, or infer owner approval.
   Keep accepted rationale, non-goals and acceptance examples concise. Without an
   Atlas, edit existing authoritative product docs instead.
3. For a new product with no stable source of intent, use `grill` to establish the
   direction and propose one repository-owned Atlas only when appropriate. Do not
   install a universal schema or duplicate existing vision/ADR authority.
4. Link relevant issues, PRs or acceptance scenarios when that materially clarifies
   authority or verification. Do not require manually maintained code-symbol links in
   the Atlas; derive reverse traceability from stable IDs, actual code and tests when
   useful. Record what is proposed, accepted, deferred, unimplemented or unverified
   **without turning those into new Atlas entry types**. Human sign-off and
   executable/browser evidence are different records; neither can impersonate the other.
5. Make approved documentation changes reviewable in the repository's normal branch/PR
   workflow; do not auto-merge. If write access or required evidence is unavailable,
   provide a precise proposed patch and say what was **not** persisted or verified.
   Before asking the next question, ensure the previous answer is recorded or clearly
   disclose the failed write. Do not silently proceed with an unrecorded premise.

## Automatically reconcile approved decisions into GitHub issues

The owner explicitly authorized `/steer` to **create or update necessary implementation
issues automatically** for decisions approved in steering sessions. This is standing
authorization for issue reconciliation, **not** permission to implement, merge or deploy.
Do not ask "Shall I create issues?" after each session. Honor a specific instruction
to skip issue changes or work read-only.

1. **Trigger on durable answers.** After an approved Decision is recorded in the owning
   Atlas or authoritative product documentation, reconcile its implementation coverage
   before asking the next question or ending the current turn. Batch answers from the
   same uninterrupted turn when useful, but do not depend on an explicit end-of-session
   command or a later agent remembering the conversation. An undecided Question, a
   suggestion, or a failed documentation write does **not** authorize a new issue.
2. **Search before writing.** Inspect relevant current code and product acceptance
   evidence, existing **open and closed** GitHub issues, open/merged PRs, and the
   applicable Atlas Decision IDs. Match by promised user-observable outcome as well as
   IDs; one issue can cover several Decisions. Do not create issues for context-only
   decisions, deferred possibilities, already-covered work, or behavior already
   implemented **and independently evidenced**. An unverified existing implementation
   needs acceptance evidence, not an automatic duplicate implementation issue.
3. **Use `issue-preflight`.** Prefer updating the **existing relevant issue** with
   current Decision links, bounded scope, explicit exclusions, a real user journey
   (or representative headless evidence), independent acceptance expectations, and
   native dependencies when needed. Create an issue only for uncovered, necessary,
   bounded work with settled owner intent. One issue should describe one coherent, independently verifiable
   slice; split only meaningful separate outcomes. Do not turn every Decision into
   an issue, create speculative infrastructure, or replace product intent with a
   smaller agent-selected MVP. Follow the owning repository's issue conventions.
4. **Respect the intent merge boundary.** An explicit owner answer can be recorded in
   a reviewable Atlas or other authoritative product-document PR before that PR
   merges; it is not yet the default-branch product source. You may reconcile GitHub
   issues immediately, but link the exact pending intent PR and applicable Decision
   IDs, and mark in each affected issue body that **implementation must wait until
   the owning product-intent change merges**.
   Do not call those issues actionable yet, or misuse `needs-decision` for an
   already-answered question. `issue-preflight` and `work-loop` must recheck the
   merged authoritative source before implementing. Do not auto-merge intent PRs.
5. **Keep the queue trustworthy.** Re-running `/steer` must be idempotent: refresh
   the current GitHub state, reconcile only actual differences, and report existing
   coverage instead of duplicating issues. Do not rewrite unrelated scope, close
   issues just because a Decision changed, or disturb unrelated native dependencies.
   If an owning repo, material acceptance condition or cross-repository contract is
   unresolved, preserve the relevant Question and refrain from creating that issue;
   continue reconciling unrelated settled work.
6. **Report the handoff.** Name the Decisions reconciled, issues created/updated
   versus already covered, any unmerged intent PRs that must land first, and any
   unperformed checks. If GitHub access fails, give a precise proposed change and
   state it was **not** written. There is no new issue queue, tracker, label or
   automatic implementation step.

## Reuse specialist skills; do not recreate them

- `grill`: new product/major-feature design and multiple consequential choices.
- `atlas-audit`: reconstruct historical intent or diagnose implementation drift.
- `unblock`: an active issue explicitly waiting for an owner decision.
- `issue-preflight`: automatically reconcile approved intent into existing or necessary new bounded, observable issues.
- `acceptance-contract`: independent acceptance handoff before behavior or architecture
  implementation, when implementation is separately authorized.
- `work-loop`: implementation, validation, review and merge **after** direction is settled.

The owner's standing authorization covers only the issue reconciliation described
above. Starting `work-loop`, changing product behavior, merging PRs or publishing
requires its own authorized execution context. Keep GitHub issues a mostly flat queue,
one implementation worker per repository, and the Atlas the single authority for
product intent.

## Continue or finish

In **guided interviews**, normally ask 3–5 useful questions per session at most;
continue longer only at the owner's request. **Free-form discussion has no question
quota**: synthesize each natural batch, ask only material follow-ups, and stop
immediately when the owner says to stop. After each recorded batch or approved
answer, reconcile implementation issues as above before moving on; never make
the owner remember a separate "create issues" instruction. Then find the next
highest-impact *unresolved* human action instead of mechanically iterating
every Question. If no decision is necessary, offer a concrete acceptance scenario
to inspect, or end the session.

Summarize recorded Decision/Question IDs and links, issues created/updated/already
covered, pending Atlas merges, proposed or verified acceptance, remaining consequential
gaps, and the next executable step.
Report what was **not** checked or approved. Do not report completion from issue counts.

## Invocation

- **Claude Code / Codex:** `/steer <subsystem>` for a guided interview; `/steer
  discuss <subsystem>` followed by free-form ideas for synthesis. Neither syntax
  is required when the owner's intent already establishes the mode. Link the
  skill as described in `dotfiles/README.md`.
- **ChatGPT with GitHub:** "Follow the `steer` skill from
  `moritzbrantner/dotfiles/skills/steer/SKILL.md` for <repository>; ask me the next
  consequential product question" **or** "Use that skill for <repository>; I'll
  describe ideas freely, then organize them into Atlas Decisions and Questions,
  clarify conflicts and reconcile issues." Read the current skill source. A
  GitHub file is not automatically a native ChatGPT slash command.
