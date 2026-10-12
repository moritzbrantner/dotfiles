---
name: issue-preflight
description: Check a proposed or selected coding issue against its repository's product vision, architectural decisions, scale and quality requirements before creation or implementation. Use to avoid accidental MVP shortcuts, right-size issues, and define independently observable acceptance.
---

# Issue preflight

Prevent an individually correct change from violating the intended product. This is a short contract check, not a separate planning queue or mandatory new documentation layer.

**Design-first gate:** For a *new product or major feature* whose consequential direction is not yet owner-approved, invoke `grill` and record the intended outcome **before** creating implementation issues. For an existing issue with such a gap, report `needs owner decision`, retain `needs-decision` if work is blocked, and do not substitute an agent-chosen MVP. Routine fixes, clear follow-on work and behavior-preserving refactors bypass grilling.

## Decision Atlas

When the owning repository has a Decision Atlas, treat it as the durable authority for **what the product should be**. Follow the repository-local Atlas schema; absent one, semantic leaf entries default to **Decisions** and **Questions**, with navigation branches as structure. Do not reject locally declared entry kinds.

- Retrieve only relevant entries with `daq find` / `daq get` / `daq questions` when available, falling back to the committed Markdown. Follow applicable current Decisions; do not treat struck-through wording or a stale index as current.
- An unanswered Question is not automatically blocking. Ask the owner **one question at a time** only when that Question materially affects the current task.
- If a consequential product fork is unsettled, record/reuse a Question rather than choosing silently. On owner approval, preserve the Question and append an `Answers` Decision. For changed intent, follow the owning Atlas's history convention (`Supersedes` or inline struck replacement as permitted); retain historical IDs and explicit links.
- Do not invent parallel Atlas kinds such as constraint, deferred decision, assumption, principle, or proposal beyond the local schema. Under the default, express those meanings in Decision/Question text or relationships.
- Issues remain work/acceptance records, not a second product-intent database. Reference Atlas IDs instead of copying durable product intent into issue prose when a reference is sufficient.

## Default for new product features: owner-verifiable vertical slices

A **user-facing feature issue** must describe the smallest independently useful **end-to-end outcome**, not a backend, algorithm, API, or isolated UI layer. For projects with GitHub Pages, the default deliverable is a reachable demonstration in the real Pages application, wired to the actual implementation and meaningful data or results. A static mock, hardcoded showcase, disabled control, or passing backend test alone does not complete the feature. Right-size the feature by a coherent user experience, without silently replacing the intended product with a thinner MVP.

Before marking a feature issue ready, specify:

- **Try it:** the target Pages route or entrypoint (or equivalent real user interface) and exact starting actions.
- **Observe it:** expected success behavior and representative error, empty, or state-change behavior that lets the owner judge whether the feature is right.
- **Prove it:** independent acceptance covering the integrated journey, preferably with Playwright/real-browser tests where supported, plus screenshots or a recording when visual evidence helps. Distinguish planned evidence from executed checks.
- **Publish it:** how the feature becomes available on the actual site. When Pages publishes only after merging, test the production-like build or preview before merge, then check and report the public route after deployment. Never imply a public deployment was verified when it was not.

Backend/library prerequisites can be separately tracked **technical enablers** in their owning repositories using native issue dependencies; they do not themselves complete the consuming product feature. Pure maintenance, infrastructure, security, performance work, and headless products do not need artificial UI: verify them through a real runnable example, integration, benchmark, or output artifact appropriate to their users, and state why Pages is not the verification surface.

## Check

1. Read the owning repository's `AGENTS.md`, installed conventions, Decision Atlas when present, existing vision/roadmap and ADRs, the relevant code, and the proposed issue or selected issue with comments. Current owner instructions and repository Decisions take precedence over general defaults.
2. Identify the promised outcome and user-visible or system-visible behavior. Check known architecture, authority boundaries, reuse requirements, supported environments, expected scale, and relevant performance or experience constraints.
3. Look for **silent scope reduction**: placeholders, a lowest-effort MVP, deferred interaction/visual quality, unbounded work per entity, unnecessary recomputation, or a new competing subsystem that appears to satisfy the wording but contradicts documented intent. Do not presume every small feature needs every quality dimension.
4. Right-size the work into one coherent PR with explicit in-scope and out-of-scope behavior. Split oversized product work along independently demonstrable user outcomes, not merely code layers; track required technical enablers separately when needed. For an existing oversized issue, preserve its intended outcome and link focused follow-ups; do not silently redefine completion.
5. Define acceptance **independently of the implementation**: observable scenarios or user journeys, architectural invariants, relevant failure cases, and evidence through existing tests, browser recordings, performance budgets, reference oracles, or representative benchmarks as appropriate. Prefer executable architecture checks; use stable public seams plus representative end-to-end journeys. Use only owner-approved numeric targets; do not fabricate budgets or claim unrun evidence.
6. Classify whether the actual task changes behavior or architecture. If so, arrange the `acceptance-contract` handoff: a **different agent/context** establishes or authors applicable tests before production implementation. Keep product specifications and acceptance tests in their owning repository. An implementation-authored test or a passing code review does not substitute for independent acceptance.

## Decision boundary

- If a consequential **product behavior or feature** choice remains unresolved, first check whether it exists as an Atlas Question. Ask **one** targeted question only when it materially affects the task (use `grill` when a short series is needed), then record the owner's answer using the owning Atlas convention. Architectural constraints and unusual technical trade-offs belong in `AGENTS.md` and occasional ADRs; code and tests own implementation details. Ordinary defects, performance regressions, or generic testing requirements should become focused issues/checks, not new product Decisions. A work-loop issue that truly cannot proceed should retain `needs-decision` until resolved.
- If the choice is mechanical or already settled by the repository, proceed without interrupting the owner. State any harmless assumption clearly.
- Do not generate issues from brainstorming alone. Create or modify GitHub issues only when explicitly requested, through an authorized work loop, **or through the owner's standing authorization for `/steer` to reconcile already-approved Decisions**. In `/steer`, inspect open/closed issues, existing PRs, implementation and acceptance evidence before writing; update existing coverage rather than creating duplicates. Follow the owning repository's issue format and the bounded, independently observable acceptance contract above.
- If approved intent exists only in an **unmerged Atlas or other authoritative product-document PR**, a reconciled issue must link that PR and explicitly say implementation is not actionable until the owning source merges. Do not conflate a settled but unmerged Decision with `needs-decision`; on execution, recheck the merged owning specification. The steering handoff never starts implementation or merges the intent PR.

## Output

Prepare or update a concise issue contract containing:

- **Outcome:** What capability or behavior the issue delivers and why.
- **Scope:** The bounded implementation slice and explicit exclusions.
- **Constraints:** Links to authoritative product and architecture documents, applicable quality bars, and non-negotiable invariants.
- **Acceptance evidence:** Independent observable behavior and proportionate correctness, browser, or performance checks. For product features, include the real Pages/demo route, owner actions and expected result, browser checks, and how published availability will be confirmed.
- **Dependencies / decisions:** Native GitHub dependencies where applicable and any blocking owner decision.

Return one status: **ready**, **needs owner decision**, or **needs decomposition**. Do not equate passing implementation-authored tests or an approving code review with satisfying an unspecified product contract.
