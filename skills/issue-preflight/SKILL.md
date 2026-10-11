---
name: issue-preflight
description: Check a proposed or selected coding issue against its repository's product vision, architectural decisions, scale and quality requirements before creation or implementation. Use to avoid accidental MVP shortcuts, right-size issues, and define independently observable acceptance.
---

# Issue preflight

Prevent an individually correct change from violating the intended product. This is a short contract check, not a separate planning queue or mandatory new documentation layer.

## Default for new product features: owner-verifiable vertical slices

A **user-facing feature issue** must describe the smallest independently useful **end-to-end outcome**, not a backend, algorithm, API, or isolated UI layer. For projects with GitHub Pages, the default deliverable is a reachable demonstration in the real Pages application, wired to the actual implementation and meaningful data or results. A static mock, hardcoded showcase, disabled control, or passing backend test alone does not complete the feature. Right-size the feature by a coherent user experience, without silently replacing the intended product with a thinner MVP.

Before marking a feature issue ready, specify:

- **Try it:** the target Pages route or entrypoint (or equivalent real user interface) and exact starting actions.
- **Observe it:** expected success behavior and representative error, empty, or state-change behavior that lets the owner judge whether the feature is right.
- **Prove it:** independent acceptance covering the integrated journey, preferably with Playwright/real-browser tests where supported, plus screenshots or a recording when visual evidence helps. Distinguish planned evidence from executed checks.
- **Publish it:** how the feature becomes available on the actual site. When Pages publishes only after merging, test the production-like build or preview before merge, then check and report the public route after deployment. Never imply a public deployment was verified when it was not.

Backend/library prerequisites can be separately tracked **technical enablers** in their owning repositories using native issue dependencies; they do not themselves complete the consuming product feature. Pure maintenance, infrastructure, security, performance work, and headless products do not need artificial UI: verify them through a real runnable example, integration, benchmark, or output artifact appropriate to their users, and state why Pages is not the verification surface.

## Check

1. Read the owning repository's `AGENTS.md`, installed conventions, existing vision/roadmap and ADRs, the relevant code, and the proposed issue or selected issue with comments. Current owner instructions and repository decisions take precedence over general defaults.
2. Identify the promised outcome and user-visible or system-visible behavior. Check known architecture, authority boundaries, reuse requirements, supported environments, expected scale, and relevant performance or experience constraints.
3. Look for **silent scope reduction**: placeholders, a lowest-effort MVP, deferred interaction/visual quality, unbounded work per entity, unnecessary recomputation, or a new competing subsystem that appears to satisfy the wording but contradicts documented intent. Do not presume every small feature needs every quality dimension.
4. Right-size the work into one coherent PR with explicit in-scope and out-of-scope behavior. Split oversized product work along independently demonstrable user outcomes, not merely code layers; track required technical enablers separately when needed. For an existing oversized issue, preserve its intended outcome and link focused follow-ups; do not silently redefine completion.
5. Define acceptance **independently of the implementation**: observable scenarios or user journeys, architectural invariants, relevant failure cases, and evidence through existing tests, browser recordings, performance budgets, reference oracles, or representative benchmarks as appropriate. Prefer executable architecture checks; use stable public seams plus representative end-to-end journeys. Use only owner-approved numeric targets; do not fabricate budgets or claim unrun evidence.
6. Classify whether the actual task changes behavior or architecture. If so, arrange the `acceptance-contract` handoff: a **different agent/context** establishes or authors applicable tests before production implementation. Keep product specifications and acceptance tests in their owning repository. An implementation-authored test or a passing code review does not substitute for independent acceptance.

## Decision boundary

- If a consequential product, architecture, or quality choice remains unowned, ask **one** targeted question (use `grill` when a short series of decisions is needed). A work-loop issue that cannot proceed should retain `needs-decision` until resolved.
- If the choice is mechanical or already settled by the repository, proceed without interrupting the owner. State any harmless assumption clearly.
- Do not generate issues from brainstorming alone. Create or modify GitHub issues when explicitly requested or as part of an authorized work loop, using the repository's existing issue format.

## Output

Prepare or update a concise issue contract containing:

- **Outcome:** What capability or behavior the issue delivers and why.
- **Scope:** The bounded implementation slice and explicit exclusions.
- **Constraints:** Links to authoritative product and architecture documents, applicable quality bars, and non-negotiable invariants.
- **Acceptance evidence:** Independent observable behavior and proportionate correctness, browser, or performance checks. For product features, include the real Pages/demo route, owner actions and expected result, browser checks, and how published availability will be confirmed.
- **Dependencies / decisions:** Native GitHub dependencies where applicable and any blocking owner decision.

Return one status: **ready**, **needs owner decision**, or **needs decomposition**. Do not equate passing implementation-authored tests or an approving code review with satisfying an unspecified product contract.
