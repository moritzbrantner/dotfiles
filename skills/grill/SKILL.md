---
name: grill
description: Refine new product or major-feature direction before implementation issues, one owner question at a time; persist Decisions and Questions in the owning repository.
---

# Grill

Turn the owner's informal intent into a durable specification that future agents can implement without inventing a smaller MVP. This is a direct human-to-agent skill, not another work loop or issue queue.

**Default order for new products and major features:** `grill` → record owner Decisions/Questions → `to-spec` / `issue-preflight` → implementation issues → `work-loop`. Establish intended experience, mechanics, architecture and quality *before* implementation. Already-specified features, routine bugs and behavior-preserving refactors do not need another grilling round.

## Prepare

1. Identify the owning repository and the intended outcome. Read its `AGENTS.md`, installed conventions, **Decision Atlas when present**, existing vision/roadmap, ADRs, relevant issues, and code where needed. Repository-local authority wins; reuse established documentation rather than creating a competing source. If an Atlas exists, prefer scoped `daq find`, `daq get` or `daq questions` queries when installed; otherwise read the relevant Markdown. Check current source when a generated index may be stale. Do not reread unrelated Atlas entries or re-ask settled choices.
2. Summarize what is already decided, what the owner wants, and the *consequential* unknowns. Follow the owner's chosen focus: architecture and mechanics are legitimate starting points; do not force UI/UX questions unless they expose a real gap.
3. Look for missing expectations that would otherwise produce a misleading "done": target behavior, representative workflows, expected scale, responsiveness or performance constraints, interoperability, quality floor, exclusions, and reference artifacts. Do not invent thresholds or requirements.

## Ask

- Ask **one question per turn**, normally resolving at most **3–5 consequential decisions per session**. Stop earlier when the next questions would not change the design or when the owner asks to wrap up. Do not continue indefinitely to fill a quota.
- Ask only about a genuine fork with materially different consequences. Do not offer false opposites, options where one subsumes another, or a forced choice when the design space is open. Offer distinct alternatives and a brief recommendation when useful, or ask an open-ended question.
- State just enough context and trade-off to make a decision. Do not ask what repository instructions, code, or prior decisions already answer. Avoid large questionnaires.
- In driving/voice conversations, keep turns short and omit code and long lists. Track prior answers within the session.
- Distinguish an owner decision from an agent-inferable implementation detail. Record nonblocking unknowns rather than grilling about them.

## Decision Atlas model

When the owning repository has a Decision Atlas, it is the durable product-intent map. Follow its repository-local schema; absent a declared local schema, use these two default semantic leaf-entry kinds:

- **Decision** — owner-selected intent that agents follow until superseded.
- **Question** — a consequential unresolved choice that may be asked when relevant.

Do not invent extra semantic categories for constraints, deferred decisions, assumptions, principles, or proposals beyond the repository-local schema (or the two-kind default). An irrelevant Question may remain unanswered. When a Question is answered, keep its ID and append a Decision linked with `Answers X.Y`. **To change or retire a Decision, keep its ID and use `~~old wording~~ replacement` or `~~old wording~~` in the owning Atlas**; Git preserves history. Preserve existing explicit `Supersedes` references where used, but do not mandate a new entry for ordinary revisions. Ask one material Question at a time.

## Persist the result

Write changes to the **owning repository** once consequential choices are settled or the owner asks to stop. If an Atlas exists, persist concise Decisions/Questions there and let specs/ADRs elaborate them without duplicating authority. Otherwise use the repository's existing authoritative documents; do not force an Atlas migration for a minor change. Preserve existing structure and content; make targeted updates, not a full product rewrite. Owner-approved Decisions and the resulting current explicit specification are authoritative; an independent acceptance agent verifies that updated tests faithfully express those decisions, but does not approve or veto the owner's product intent (see `acceptance-contract`).

- **Product vision / roadmap:** Describe the intended end state, important user or gameplay scenarios, target scale, quality bar, explicit non-goals, and staged outcomes. An intermediate MVP is a milestone only when the owner explicitly accepts it, not a silent substitute for the target.
- **ADR / architecture documentation:** Record consequential architecture or mechanics choices with their rationale, constraints, ownership/seams, and rejected alternatives when relevant. Follow the repository's existing ADR convention.
- **Verification references:** Link supplied screenshots, videos, prototypes, recorded interactions, fixtures, benchmarks, or other observable examples. Translate expectations into measurable acceptance criteria where feasible, without making up budgets or evidence. Prioritize executable architecture invariants over unenforceable structural prose where practical; the owning repository retains its tests.
- **Uncertainty:** In Atlas repositories, represent consequential unresolved product choices using the local schema, or Questions under the default. Identify which Questions actually block current implementation; do not recast unanswered choices as requirements.

Prefer one concise existing document for each kind of information over duplicate prose. Do not create implementation issues by default; create bounded issues when the owner asks for them, using `issue-preflight`. Issues reference the durable specification instead of restating the product vision.

Finish with a short recap of decisions, documents changed, unresolved questions, and any issues created. If repository write access is unavailable, supply a ready-to-apply draft and state that it was not persisted.
