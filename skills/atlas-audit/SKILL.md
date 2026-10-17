---
name: atlas-audit
description: Audit historical decisions and drift; propose Atlas updates and approved issues.
---

# Atlas audit

Reconstruct consequential intent without treating current implementation as intended product.
This is an on-demand investigation, not a new work loop, issue queue, or decision authority.
Follow the [owner-question and incorporation protocol](../../docs/owner-questions.md): keep new answers in conversation until the owner ends it or requests capture.

## Scope and evidence

1. Audit one repository or subsystem at a time. Read its `AGENTS.md`, installed conventions,
   canonical `docs/decisions/atlas.md` when present, vision/roadmap, ADRs, and relevant issues,
   PRs, comments, tests, and code. Follow repository-specific formats and owner instructions.
2. Start with high-signal sources: direct owner answers, accepted designs, material issue/PR
   discussions, and observed product behavior. Cite specific source URLs, Atlas IDs, and code/test
   paths. Record uncertainty: a merged PR or existing code proves implementation, not
   owner approval.
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
  provenance in the *owning* repository. Reuse demonstrated approval; do not infer missing
  rationale or intent. Include approved additions in authorized end-of-conversation
  incorporation; a read-only audit leaves them as proposals.
- **Unresolved or contradictory:** Propose a Question, or retrieve the existing one. Ask the
  owner **one consequential question at a time** (use `grill` for a design discussion);
  do not choose for them. An unanswered Question need not block unrelated work.
- **Revision requested:** Clarify ambiguous revisions; incorporate clear owner instructions
  without another confirmation at the end-of-conversation signal.
  In current Atlas repositories, revise the existing entry inline with `~~old wording~~ replacement`;
  retire it with fully struck wording. Preserve its stable ID and Git history. Retain existing
  explicit `supersedes` relations in older formats and follow repository-local revision rules.
  When answering a Question, preserve it and append a Decision with an explicit `answers` link.
  Never resolve conflicting decisions merely by timestamps or code state. Do not automatically
  backfill routine mechanical implementation choices into the Atlas.

Repository-local Atlas schemas and formats take precedence. When the repository has no declared
schema, use exactly **Decision** and **Question** as the default semantic entry kinds, in one
authoritative source per owning repository. Do not rewrite or reject additional kinds declared locally. Preserve existing stable IDs and aliases, and keep indexes or
inferred associations read-only until individually reviewed. Prefer an explicit, cited relation
over repeatedly rediscovering the same connection.

## Turn approved direction into work

Once the owner-approved Atlas intent is established, compare it with current behavior. Creating
or updating GitHub issues requires an explicit request, authorized steering incorporation or
an already authorized work loop, consistent with `issue-preflight`.
For a read-only audit, report proposed issue changes without applying them. Within authorized
issue work, for each material gap, first update an existing issue if it already covers the work; otherwise use
`issue-preflight` to create a bounded implementation issue in the responsible repository.
Reference the authoritative Atlas ID(s), observed mismatch, intended outcome, available
relevant evidence and native dependencies. Obtain owner approval before reducing delivery
into smaller slices unless the split is already approved.
Do not turn unapproved hypotheses into issues or start implementation as part of
this audit. Land explicitly approved, non-executable intent under `/steer`'s
persistence rule, but do not auto-merge proposals still needing owner judgment.
GitHub issues remain execution state; the Atlas remains intent authority.

## Finish

Report the 2–4 highest-value findings, decisions/questions proposed or recorded, PRs and issues
created or updated, and what still needs the owner. If nothing material was found, say so.
Avoid inventing a permanent audit database, new status labels, or a repository-wide backlog.
