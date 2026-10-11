---
name: atlas-audit
description: Audit a repository's important product and architecture choices against historical evidence and current implementation. Use to backfill Decision Atlas entries, surface decisions worth revisiting, and create implementation issues only after the owner approves a direction.
---

# Atlas audit

Reconstruct consequential product intent without mistaking today's implementation for the intended product.
This is an on-demand investigation, not a new work loop, issue queue, or decision authority.

## Scope and evidence

1. Audit one repository or subsystem at a time. Read its `AGENTS.md`, installed conventions,
   canonical `docs/decisions/atlas.md` when present, vision/roadmap, ADRs, and relevant issues,
   PRs, comments, tests, and code. Follow repository-specific formats and owner instructions.
2. Start with high-signal sources: direct owner answers, accepted designs, material issue/PR
   discussions, and observed product behavior. Cite specific source URLs, Atlas IDs, and code/test
   paths. Record uncertainty; a merged PR or existing code proves implementation, not owner approval.
3. Compare what was intended, what is currently recorded, and what actually exists. Deduplicate
   against current Atlas entries and open/closed GitHub issues before proposing work. Check
   cross-repository dependencies and the single owner of each shared contract.
4. Bound the investigation to a useful slice; do not crawl every repository or backfill every
   historical implementation detail. Expand only when evidence points to a consequential gap.

## Choose what matters

Prioritize findings that could change product identity, essential workflows, gameplay/UX,
architecture or ownership boundaries, interoperability, correctness, scale, or quality.
Raise repeated implementation drift, contradictions, and costly-to-reverse choices first.
Prefer **2–4 high-impact findings** over an exhaustive historical catalog. Ignore routine
mechanical implementation choices unless they reveal product intent or a material conflict.

For each finding, briefly give:

- The proposed statement or unresolved choice, why it matters, and source links.
- The existing Atlas IDs and issue references, if any.
- What evidence establishes owner approval, or exactly what remains uncertain.
- The consequence for the current implementation and other repositories, if known.
- A recommendation: retain, explicitly record, ask, or revise. These are audit actions,
  **not** new semantic Atlas entry kinds.

## Reconcile with the owner

- **Already documented:** Do not duplicate it. If still applicable, stop; if code diverges,
  identify the implementation gap.
- **Historically approved but missing:** Propose the shortest faithful Decision addition with
  provenance in a reviewable PR to the *owning* repository. Do not infer rationale or approval.
- **Unresolved or contradictory:** Propose a Question, or retrieve the existing one. Ask the
  owner **one consequential question at a time** (use `grill` for a design discussion);
  do not choose for them. An unanswered Question need not block unrelated work.
- **Revision requested:** Confirm the new direction before modifying product intent.
  Append a Decision with an explicit `supersedes` link to the old ID. When answering a
  Question, append a Decision with `answers`. Preserve all historical entries and IDs;
  follow the repository's existing strikethrough convention if applicable. Never resolve
  conflicting decisions merely by timestamps or code state.

The Atlas has exactly **Decision** and **Question** as semantic entry kinds, in one authoritative
source per owning repository. Preserve existing stable IDs and aliases, and keep indexes or
inferred associations read-only until individually reviewed. Prefer an explicit, cited relation
over repeatedly rediscovering the same connection.

## Turn approved direction into work

Once the owner-approved Atlas intent is established, compare it with current behavior. For each
material gap, first update an existing issue if it already covers the work; otherwise use
`issue-preflight` to create a bounded implementation issue in the responsible repository.
Reference the authoritative Atlas ID(s), observed mismatch, intended outcome, independent
acceptance evidence, and any native dependencies. Split only when independently actionable.
Do not turn unapproved hypotheses into issues, auto-merge intent changes, or start implementation
as part of this audit. GitHub issues remain execution state; the Atlas remains intent authority.

## Finish

Report the 2–4 highest-value findings, decisions/questions proposed or recorded, PRs and issues
created or updated, and what still needs the owner. If nothing material was found, say so.
Avoid inventing a permanent audit database, new status labels, or a repository-wide backlog.
