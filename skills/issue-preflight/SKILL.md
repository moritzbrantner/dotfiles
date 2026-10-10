---
name: issue-preflight
description: Check a proposed or selected coding issue against its repository's product vision, architectural decisions, scale and quality requirements before creation or implementation. Use to avoid accidental MVP shortcuts, right-size issues, and define independently observable acceptance.
---

# Issue preflight

Prevent an individually correct change from violating the intended product. This is a short contract check, not a separate planning queue or mandatory new documentation layer.

## Check

1. Read the owning repository's `AGENTS.md`, installed conventions, existing vision/roadmap and ADRs, the relevant code, and the proposed issue or selected issue with comments. Current owner instructions and repository decisions take precedence over general defaults.
2. Identify the promised outcome and user-visible or system-visible behavior. Check known architecture, authority boundaries, reuse requirements, supported environments, expected scale, and relevant performance or experience constraints.
3. Look for **silent scope reduction**: placeholders, a lowest-effort MVP, deferred interaction/visual quality, unbounded work per entity, unnecessary recomputation, or a new competing subsystem that appears to satisfy the wording but contradicts documented intent. Do not presume every small feature needs every quality dimension.
4. Right-size the work into one coherent PR with explicit in-scope and out-of-scope behavior. Before creating an oversized issue, split it into independently valuable, ordered issues with native dependencies where necessary. For an existing oversized issue, preserve its intended outcome and link focused follow-ups; do not silently redefine completion.
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
- **Acceptance evidence:** Independent observable behavior and proportionate correctness, browser, or performance checks.
- **Dependencies / decisions:** Native GitHub dependencies where applicable and any blocking owner decision.

Return one status: **ready**, **needs owner decision**, or **needs decomposition**. Do not equate passing implementation-authored tests or an approving code review with satisfying an unspecified product contract.
