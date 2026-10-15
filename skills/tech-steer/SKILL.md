---
name: tech-steer
description: Turn an owning repository's approved Decision Atlas into evidenced, reuse-first technical choices and concise repository-owned Markdown, without implementing them.
---

# Technical steering

Use /tech-steer in the owning repository, optionally with a subsystem or Decision Atlas ID.
Run it after /steer when the product intent is settled but a consequential technical approach
is not. It can also review an existing approach against an approved product Decision.
This is a **technical decision procedure**, not a second work loop, issue queue, product
authority, or requirement to design every implementation detail up front.

## Establish the constraints

1. Read the repository's AGENTS.md, instructions for affected paths, installed conventions
   and versions, existing architecture documents/ADRs, and applicable Decision Atlas source.
   Prefer scoped daq queries when available, but check committed Markdown when indexing
   might be stale. Respect the repository's actual Atlas schema and stable IDs.
2. Resolve the **approved product outcome** from the relevant Atlas Decisions and Questions.
   An unanswered consequential product Question belongs to /steer or /unblock; do not turn
   it into a technical assumption or rewrite it here.
3. Inspect the actual code, dependency versions, existing integration points, open and
   closed issues, relevant PRs, tests, benchmark evidence, and affected consumers. Check
   external libraries, licenses, maintenance and compatibility against current sources
   before recommending them. Mark unavailable evidence explicitly.
4. Establish which repository owns each component or shared contract. Record consumer-side
   integration decisions in the consumer, and foundation-owned contracts in the foundation;
   cross-link instead of copying another repository's decision.

Work on one subsystem or milestone at a time. For an Atlas-wide request, identify the
few consequential architecture forks first; do not manufacture one technical record per
product Decision.

## Choose solutions

- Prefer proven external libraries, APIs, protocols or MCP services where they fulfill
  requirements with less cost and risk. Preserve an existing working solution until an
  in-house replacement demonstrates parity. When relevant, keep the external solution as
  a reference oracle or benchmark and define a real consumer seam for comparing both.
- Reuse the repository's present architecture and code before introducing new adapters,
  abstractions, modes, services, databases, or orchestration. Distinguish a dependency
  integration from owning an implementation of the same capability.
- Compare **real options**, not straw men: behavior/compatibility, complexity, maintenance,
  performance and scale, security/privacy, operating cost, licensing, portability,
  migration/rollback, and the ability to verify the choice. Evaluate only dimensions that
  actually matter to the problem. Do not invent metrics, version claims or benchmark wins.
- Choose routine, reversible details autonomously according to local conventions; these
  normally need **no Markdown decision** and no owner interview. Escalate costly-to-reverse
  architecture, externally visible compatibility, ownership, material financial/privacy
  commitments, or a conflict with product intent.
- Make a grounded recommendation. Ask **one** consequential question at a time only when
  the owner's judgment is required. Offer two or three materially distinct alternatives
  with concrete consequences; accept open answers or explicit delegation. Never mistake
  an agent proposal for owner approval. In a free-form discussion, synthesize all the
  owner's ideas before asking a clarification.

A technical recommendation may be documented as *proposed* for review, but only explicit
approval, established repository authority, or a clear owner delegation makes it a
selected direction. If evidence is missing, record the verification gap, not an
unverified success.

## Persist only durable architecture choices

Reuse the owning repository's existing ADR or architecture documentation if it already
covers this choice. Otherwise use **docs/technical-decisions.md** as the single concise
technical-decision register, creating it only once a consequential decision is worth
recording. Do not impose a new schema on repositories with their own documentation.

For a new register, use stable TECH-001, TECH-002, ... identifiers and entries shaped as:

### TECH-001 — Short technical choice
- **Product basis:** Links to exact Atlas Decision IDs (or existing authoritative spec).
- **Context:** The technical constraint and affected repository/components.
- **Selected approach:** Specific solution, dependency or boundary, and migration/fallback
  if material; who approved or explicitly delegated the choice.
- **Alternatives:** Serious options considered and why they lost, especially the external
  baseline when choosing an internal implementation.
- **Evidence:** Actual compatibility/benchmark/test links and results, clearly separating
  measured findings from validation still required.
- **Revisit when:** A concrete condition invalidates the decision, when useful.

Keep entries short and organized by capability, not by meeting date. Preserve stable IDs,
source links and historical rationale. A materially replaced decision retains its ID
and links to its successor; follow any existing local revision format instead.
Do not restate the Atlas's product requirements in full or duplicate code, generated
dependency lists, GitHub issue state, or routine plans. The Atlas remains authoritative
for **what**; this record explains consequential **how and why**. Architecture invariants
future agents must follow belong in AGENTS.md; mechanically enforceable rules belong in
code/tests rather than relying on Markdown alone.

For explicit owner-approved **non-executable documentation only**, follow /steer's fast
path: inspect current default branch, relevant documentation PRs and repository protection;
commit directly when permitted, without demanding CI or a PR. Respect required approvals.
Do not fast-path executable contracts, tests, configuration or implementation. Do not
silently persist an unapproved agent recommendation as an approved decision.

## Hand off; do not implement

1. Relate the selected approach and Atlas IDs to the relevant **existing** GitHub issue(s)
   and consumer contracts. Use issue-preflight for bounded, independently verifiable work
   when issue changes were requested or are authorized by an existing work-loop/steer
   handoff. Invoking /tech-steer alone does **not** create standing authorization to
   modify issues or launch implementation. Avoid one issue per technical record.
2. Point acceptance-contract at the architectural seams/invariants and product acceptance
   already defined by their owning source when the work-loop implements the change.
   Product-facing work still requires a real end-to-end acceptance surface.
3. Report the chosen direction, which repository Markdown was actually committed,
   references to applicable Atlas IDs, the issue handoff (if authorized), and any
   unverified benchmark or unresolved consequential choice. A Markdown decision alone
   is not evidence of implementation, CI success, or deployment.

Example: A consumer keeps MapLibre as the production renderer while it compares a
first-party map engine behind a real selector. The consumer documents its selector and
acceptance seam; the map engine owns its own implementation and benchmark decisions.
This illustrates the boundary, not an instruction to create that selector in every app.
