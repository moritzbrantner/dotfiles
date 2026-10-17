---
name: tech-steer
description: Guide an owner through one consequential technical architecture choice at a time, grounded in approved product intent, evidence and reuse-first alternatives; record approved choices without implementing them.
---

# Technical steering

Scope to the owning repository and named subsystem or Atlas IDs. Read and follow the shared [owner-question and incorporation protocol](../../docs/owner-questions.md).

Infer the mode: ordinary `/tech-steer` starts a guided architecture discussion; free-form ideas call for synthesis; an explicit audit/document request calls for that assessment or incorporation. Do not force a mode-selection question or interview during an audit.

## Establish constraints

- Use the run's loaded instructions and installed conventions; load them once if needed. Read newly applicable authority, approved product intent and existing architecture records. Use scoped Atlas queries when available; check Markdown if the index may be stale.
- Inspect relevant code, dependencies, integration points, issues/PRs and available evidence. Check current authoritative sources for external library, compatibility, licensing or cost claims that affect the recommendation. Mark missing evidence; never invent metrics or benchmark wins.
- Identify component and shared-contract owners. Owners record shared choices; consumers link them and document their own integration.
- Work on the actual subsystem and useful next choices. Do not manufacture one technical record per product Decision or design every future extension.

## Discuss real choices

- Ask one material question at a time, grounded in the approved product goal. Present distinct options, relevant trade-offs and a supported recommendation; accept open answers or explicit delegation.
- Prefer proven external solutions and existing code where they meet requirements. Explain the concrete benefit before proposing a custom replacement, abstraction, service or orchestration. Use an external baseline for comparison when useful.
- Compare only relevant dimensions: behavior, complexity, maintenance, performance, security/privacy, cost/licensing, portability and migration. Avoid false alternatives and speculative requirements.
- In guided mode, ask the first useful unresolved question after preparation and continue with the next after an answer. In free-form mode, let the owner develop ideas before clarifying. Keep voice options understandable without images or long technical detail.
- Treat recommendations as proposals until approved. Resolve product-intent conflicts with the owner in the same conversation; do not hide them in technical assumptions.
- There is no question quota. If no consequential choice remains, report that without inventing one. Routine defects and delegated implementation details need no architecture interview.

## Incorporate at conversation end

Keep choices and revisions **in chat** until the owner declares the conversation finished or says **“capture and incorporate now.”** Then complete the shared incorporation protocol, including necessary issue reconciliation, in the same session. Do not persist each answer.

- Reuse the owning ADR or architecture document. If none exists and a consequential choice needs a record, use `docs/technical-decisions.md`; do not impose a new schema.
- Keep each record concise: stable ID, product basis, constraint, approved approach and rationale, serious alternatives, and relevant evidence or revisit condition. For a new register, use `TECH-001`, `TECH-002`, etc.
- Explain consequential **how and why** without duplicating Atlas requirements, issue state or routine plans. Link the owning records to existing issue coverage; use `issue-preflight` for necessary uncovered work.
- Report what was actually incorporated, pending merges/writes and unresolved choices. Separate measured findings from unverified claims.

Honor explicit read-only/no-issue limits. Do not implement features, merge their PRs or start proactive acceptance work from technical steering. Authorized implementation follows `work-loop`.
