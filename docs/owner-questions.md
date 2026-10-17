# Owner questions and incorporation

Approved process steering, 2026-10-17. Applies to `steer`, `tech-steer`, `grill`, `unblock` and live work-loop questions. [Flowcharts](human-steering-flowcharts.md).

## Decision authority

- Apply repository instructions, installed conventions and approved decisions first; reuse settled preferences.
- Ask about remaining user-facing behavior, workflow, appearance or scope, even when reversible. Also ask about consequential hard-to-reverse architecture, cross-repository ownership, money, licensing, privacy or private inputs.
- Choose ordinary technical details and behavior-preserving repairs yourself. A recommendation or existing code does not approve new product intent.
- Propose a shared convention only when a local preference has useful broader scope; obtain owner approval for that scope before recording it globally.
- Before reducing delivery to a smaller slice, propose the usable outcome and remaining obligations. Obtain owner approval unless that split is already approved.

## Conversation first

Broad steering may approve “add export to the list” without settling every detail. Before affected implementation, the same worker investigates the selected issue and asks its remaining owner questions. No separate preparation agent, document or question quota.

Ask one focused question at a time, with plain-language outcomes and a grounded recommendation when useful. Broad and detailed steering work in any session, including voice.

Keep answers, revisions and ideas in the conversation. Do not write each answer to GitHub or reconcile files/issues after each exchange. An explicit live answer may guide the current authorized worker immediately; other workers learn it through incorporation.

## Incorporate at the owner's signal

When the owner declares the conversation finished or says **“capture and incorporate now”**, complete these steps in the same session without another confirmation:

1. Reconcile the whole conversation, including corrections. Separate approved decisions, tentative ideas and unanswered questions; never turn a suggestion into approval.
2. Update the owning records below. Preserve stable IDs and history; supersede or strike through revised intent according to the local format.
3. Reconcile necessary GitHub issues against existing issues, PRs and code. Update matching work instead of duplicating it. Broad approved capabilities may have issues with open details; resolve those details before affected implementation. Tentative ideas remain Questions.
4. Link durable decisions to affected issues. Clear `needs-decision` only after every blocking owner question is resolved and recorded; partial answers and “skip” leave their questions open. If an authoritative source awaits a required merge, record that prerequisite rather than calling its answered choice undecided.
5. Report what was saved, linked or left unresolved. Do not start feature implementation unless separately authorized.

Commit approved non-executable instructions directly to the owning default branch when permitted. Otherwise use its normal approval/PR path. Code, configuration, tests and machine-enforced contracts retain their required gates. Explicit live instructions govern the current authorized worker; other workers need the incorporated source.

| Content | Owning record |
| --- | --- |
| What users get | Decision Atlas or existing product docs |
| Consequential technical choice | Existing technical record or ADR |
| Repository invariant | `AGENTS.md` |
| Approved preference across projects | `coding-agent-conventions` |
| Detail for one delivery slice | Issue or PR |

Decide shared capabilities in their owning repository; consumers link that decision. Use an existing capability-owner map when available. In the Atlas, Decisions are approved, Questions are unsettled and `[x]` means **built only**. Preserve local schema and migration boundaries; do not reinterpret old checkboxes silently.

## Live and unattended execution

- `/work-loop ask:live`: ask in the current conversation; apply explicit answers to the current authorized work. Persist answers at the owner's end-of-conversation signal.
- `/work-loop ask:github` (**default**): post unanswered owner questions on the issue, add `needs-decision`, and continue other eligible work.
- Switch on request: “I'm here, ask me” / “I'm leaving.” On leaving, post still-unanswered questions; incorporate answers only if the owner also ends the conversation or requests capture.

Workers may post unanswered blockers and normal execution progress while steering answers remain in chat. A real missing external input blocks its affected work; obtain ordinary available prerequisites first.

Use one issue comment for related unanswered questions:

```md
### Owner questions
Context: <outcome and exact gap>
Q1: <question>
- A: <outcome> (recommended: <reason>)
- B: <outcome>
```

Reference each question as `<repo>#<issue>.Q<n>`; do not reuse or renumber IDs. Options are optional; avoid false choices. `/unblock` finds open `needs-decision` issues on GitHub and asks them in conversation.

## Existing captures and write failures

At the normal issue scan, incorporate existing `### Owner answers` comments or `Owner digest: <topic>` issues using the same rules. Match individual questions and later corrections; a newer comment does not answer every question. Close a digest only after its contents are incorporated, with links. These records are an import/fallback, not an extra step for new sessions.

If an end-of-session write fails, report the saved and unsaved portions and provide the remaining decisions/questions with repository and issue references for retry or paste. Preserve unresolved blockers; do not claim incorporation succeeded.
