---
name: grill
description: Refine product or major-feature direction through concrete questions; incorporate approved outcomes and open questions when the owner ends the conversation.
---

# Grill

Clarify the experience the owner wants for a new product or major feature. Read and follow the shared [owner-question and incorporation protocol](../../docs/owner-questions.md). Specified features, routine bugs and behavior-preserving repairs need no new grilling round.

## Prepare

- Identify the owning repository and intended outcome. Use the run's loaded instructions and installed conventions; load them once if needed. Read newly applicable authority, approved decisions, relevant issues and code. Use scoped Atlas queries when available; check Markdown if an index may be stale.
- Reuse settled preferences and existing documents. Distinguish approved direction, proposals, implementation and observed results; never infer owner approval from code or passing checks.
- Find the user-facing unknowns: representative workflows, visible behavior, interaction, quality expectations, inputs/outputs and exclusions. Ask where choices remain rather than inventing thresholds or requirements.
- Use relevant available screenshots, recordings or product evidence to ground visual choices. Inspect a live experience when the design question needs it, without making browser or acceptance checks mandatory. Never claim an inspection that did not occur.

## Ask

- Begin with the missing experience: what the user should see, do or accomplish. Ask one concrete question per turn, then the next useful one after an answer. There is no quota.
- Offer distinct imaginable alternatives, usually A/B/C, with short trade-offs and a supported recommendation. Open answers are valid. Avoid false opposites, repetitive questionnaires and re-asking settled choices.
- Illustrate visual options when useful with comparable project screenshots, owner references or attributable inspiration. Label inspiration honestly; do not commit third-party imagery without rights. Use prose when visuals are unavailable or irrelevant.
- Keep driving/voice turns short. Speak enough context to answer without images, code or long lists. Broad and detailed steering are available in either setting.
- Accept clear directives without a second approval. Keep tentative ideas and unresolved alternatives as Questions. A broad capability can be approved without deciding every detail; the implementing worker investigates the issue before affected implementation.

## Incorporate at conversation end

Keep answers and revisions **in chat** until the owner declares the conversation finished or says **“capture and incorporate now.”** Then complete the shared incorporation protocol in the same session. Do not update Markdown, post answer comments or reconcile issues after each exchange.

- Reuse the owning documents and preserve their structure, IDs, history and migration rules. Do not force a new Atlas or rewrite the whole product specification.
- Describe the intended user outcomes, relevant quality expectations and explicit exclusions. Preserve the full approved target; an intermediate delivery is a milestone only when the owner approves it.
- Link useful supplied evidence or measurable expectations without inventing budgets, results or an independent acceptance handoff. Reconcile necessary issues through `issue-preflight`, reusing coverage and linking the specification.
- Report actual documents/issues changed, unresolved choices and failed writes or pending merges.

Honor explicit read-only/no-issue limits. This skill does not implement features or merge their PRs. Continue into `steer` or `tech-steer` within the same conversation when useful; authorized implementation follows `work-loop`.
