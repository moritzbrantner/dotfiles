---
name: grill
description: Run a bounded, one-question-at-a-time design conversation about product vision, gameplay, architecture, or quality expectations and record the decisions in the owning repository. Use for design grilling, including while driving, before implementation issues are written.
---

# Grill

Turn the owner's informal intent into a durable specification that future agents can implement without inventing a smaller MVP. This is a direct human-to-agent skill, not another work loop or issue queue.

## Prepare

1. Identify the owning repository and the intended outcome. Read its `AGENTS.md`, installed conventions, existing vision/roadmap, ADRs, relevant issues, and code where needed. Repository-local authority wins; reuse established documentation rather than creating a competing source.
2. Summarize what is already decided, what the owner wants, and the *consequential* unknowns. Follow the owner's chosen focus: architecture and mechanics are legitimate starting points; do not force UI/UX questions unless they expose a real gap.
3. Look for missing expectations that would otherwise produce a misleading "done": target behavior, representative workflows, expected scale, responsiveness or performance constraints, interoperability, quality floor, exclusions, and reference artifacts. For requested features, identify an initial independently useful workflow the owner can actually try on GitHub Pages or an equivalent product interface, rather than planning only backend stages. Ask only when the expected experience is genuinely unresolved. Do not invent thresholds or requirements.

## Ask

- Ask **one question per turn**, normally resolving at most **3–5 consequential decisions per session**. Stop earlier when the next questions would not change the design or when the owner asks to wrap up. Do not continue indefinitely to fill a quota.
- Ask only about a genuine fork with materially different consequences. Do not offer false opposites, options where one subsumes another, or a forced choice when the design space is open. Offer distinct alternatives and a brief recommendation when useful, or ask an open-ended question.
- State just enough context and trade-off to make a decision. Do not ask what repository instructions, code, or prior decisions already answer. Avoid large questionnaires.
- In driving/voice conversations, keep turns short and omit code and long lists. Track prior answers within the session.
- Distinguish an owner decision from an agent-inferable implementation detail. Record nonblocking unknowns rather than grilling about them.

## Persist the result

Write changes to the **owning repository** once the consequential decisions are settled or the owner asks to stop. Preserve existing structure and content; make targeted updates, not a full product rewrite. Owner-approved product decisions and the resulting current explicit specification are authoritative; an independent acceptance agent verifies that updated tests faithfully express those decisions, but does not approve or veto the owner's product intent (see `acceptance-contract`).

- **Product vision / roadmap:** Describe the intended end state, important user or gameplay scenarios, target scale, quality bar, explicit non-goals, and staged outcomes. An intermediate MVP is a milestone only when the owner explicitly accepts it, not a silent substitute for the target.
- **ADR / architecture documentation:** Record consequential architecture or mechanics choices with their rationale, constraints, ownership/seams, and rejected alternatives when relevant. Follow the repository's existing ADR convention.
- **Verification references:** Link supplied screenshots, videos, prototypes, recorded interactions, fixtures, benchmarks, or other observable examples. For new features, specify the first owner-checkable Pages/demo workflow and what should visibly happen. Translate expectations into measurable acceptance criteria where feasible, without making up budgets or evidence. Prioritize executable architecture invariants over unenforceable structural prose where practical; the owning repository retains its tests.
- **Uncertainty:** Mark open decisions, assumptions, and intentionally deferred concerns explicitly. Identify which ones block implementation; do not recast undecided choices as requirements.

Prefer one concise existing document for each kind of information over duplicate prose. Do not create implementation issues by default; create bounded issues when the owner asks for them, using `issue-preflight`. Issues reference the durable specification instead of restating the product vision.

Finish with a short recap of decisions, documents changed, unresolved questions, and any issues created. If repository write access is unavailable, supply a ready-to-apply draft and state that it was not persisted.
