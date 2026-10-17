---
name: steer
description: Elicit or synthesize product direction, record approved Decisions in the owning repository, and reconcile necessary GitHub issues without implementation.
---

# Steer

Scope to the current repository or named capability. Infer guided interview or free-form discussion from the request. Read and follow the shared [owner-question and incorporation protocol](../../docs/owner-questions.md).

## Establish intent

- Use the run's loaded instructions and installed conventions; load them once if needed. Read relevant approved product/technical decisions and newly applicable repository/path instructions. Use scoped `daq find/get/questions` when available; check Markdown if its index may be stale.
- Inspect relevant code, issues and PRs to distinguish approved intent, proposals, implementation and observed results. Use available evidence without starting a proactive acceptance or browser audit.
- Keep questions within the requested scope. Historical priorities and unrelated Atlas Questions do not block an implementable issue; do not ask the owner to allocate workers or rank the backlog.

## Discuss

- **Guided:** Ask one useful question at a time, with concrete alternatives, material trade-offs and a recommendation when warranted. Accept open answers. Continue with the next useful question in the same reply after an answer.
- **Free-form:** Let the owner develop ideas, then synthesize by capability and owning repository. Clarify one unresolved point at a time.
- Accept unambiguous directives without redundant confirmation. Keep suggestions, `maybe` and unsettled alternatives as Questions. `skip`/`later` leaves the choice open without blocking unrelated work.
- Broad direction can approve “add export” while details remain open. Leave the implementing worker to investigate issue-specific questions before affected implementation.
- Use no question quota or exhaustive design gate. Reconsider breadth after several narrow questions; group long Atlas branches by meaningful workflows without changing stable IDs.

## Incorporate at conversation end

Keep answers and revisions **in chat** until the owner declares the conversation finished or says **“capture and incorporate now.”** Then complete the shared incorporation protocol in the same session. Do not write per-answer comments or reconcile issues between questions. If no useful question remains, say so without inventing a capture trigger.

- Reuse the existing Atlas/product documents and local answer, revision and migration conventions. Keep entries about approved product behavior and relevant rationale rather than implementation plans or test matrices.
- Reconcile necessary issues against existing open/closed issues, PRs and code. Use `issue-preflight`; preserve full approved scope, native dependencies and existing coverage. Broad approved work may have an issue with explicit unresolved Questions.
- Do not create an issue per Decision, for optional verification alone, or for unrelated defects. Report actual document/issue changes, pending merges and failed writes.

Honor explicit read-only/no-issue limits. Steering does not authorize feature implementation or merging feature PRs. Use `tech-steer` for technical choices, `grill` for major product design, `unblock` for blockers and `work-loop` for authorized execution; no new conversation is required.
