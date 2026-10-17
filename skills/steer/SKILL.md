---
name: steer
description: Elicit or synthesize product direction, record approved Decisions in the owning repository, and reconcile necessary GitHub issues without implementation.
---

# Steer

Scope `/steer` to the current repository or named subsystem. Infer **guided interview** or **free-form discussion** from the owner's request; no mode-selection question.

## Establish intent

- Read local `AGENTS.md`, applicable pinned conventions, and product authority. Use scoped `daq find/get/questions` for the Decision Atlas when available; verify against committed Markdown if its index may be stale. Without an Atlas, use existing product documents.
- Check relevant existing Decisions, Questions, documentation PRs, open/closed issues, implementation, acceptance evidence and actual demo before asking or writing. Distinguish owner approval, proposed intent, implementation and observed acceptance.
- Reserve Atlas Decisions/Questions for consequential product behavior, workflows, inputs/outputs, scope and trade-offs. Routine defects belong in issues; engineering choices belong in code, `AGENTS.md` or `/tech-steer`. A merged PR or passing test does not approve product intent.
- **Shared capabilities:** check `docs/capability-owners.md` first. Record the decision in the owning repository's Atlas; a consumer records only a one-line Decision linking it.
- During issue execution, ask only about an **unsettled owner fork on that issue** (definition and asynchronous format in `docs/owner-questions.md`); an unrelated Atlas Question or historical product priority is not a blocker. Do not ask the owner to rank product areas, decide worker allocation or defer an implementable issue. Explicit product-design sessions may explore broader consequential questions without prioritizing the backlog.

## Discuss

- **Guided:** Ask one consequential question at a time. Define the desired workflow, decide between 2–3 genuinely distinct A/B/C alternatives with trade-offs and a recommendation, approve a proposed statement, revise a cited Decision, or verify an observed demo. Open answers are valid. Avoid choices where a sensible default with specific overrides resolves the apparent alternatives.
- **Free-form:** Collect the owner's ideas before synthesizing. Group them by product capability and owning repository; compare existing IDs and behavior, highlight material conflicts, and ask at most one clarification at a time. An unambiguous owner directive is approved without redundant confirmation; suggestions and "maybe" remain proposals/Questions.
- **Voice/ChatGPT input:** an `Owner digest:` issue (or pasted digest/transcript) is free-form input. `DECIDE` lines are approved intent; `IDEA`, hedged or "maybe" lines become Questions or proposals. Keep the owner's verbatim words when interpreting; close the digest issue with links once recorded and reconciled. `### Owner answers` comments are handled as in `unblock`.
- For a narrow feature, reconsider breadth after roughly 2–3 consecutive questions; move to another consequential user journey or finish. Roughly 8–10 immediate Decision/Question children per Atlas branch is a navigation heuristic, not a quota or parser rule. Group longer topics by feature without renumbering existing IDs.
- `skip`/`later` leaves a Question open without blocking unrelated work. `I don't care` delegates routine implementation details, not unresolved consequential product choices. On "stop" or "wrap up", persist settled intent and finish. If no consequential question remains, stop; do not invent one.

## Record answers

1. Persist approved product intent promptly in the **owning repository** under its Atlas schema. Default semantic leaves are **Decision** and **Question**; preserve locally defined kinds and checkbox meanings (`[x]` may mean approved, not implemented). For a Question answer, retain the Question and append a Decision with `Answers <id>`. For revisions, preserve stable IDs/history and use the local supersession or inline-strikethrough convention. Do not infer approval from code or chronology.
2. Keep entries about product behavior and relevant rationale, not implementation plans or test matrices. Prefer the existing Atlas and `AGENTS.md`; use an ADR only for a consequential technical choice needing durable rationale. Without an Atlas, update existing authoritative product docs rather than creating a second source. Placement: what users get (preparation screen contents, which character pack, Rapier-for-now) → Atlas; consequential how (save format, runtime, cross-repo API shape) → technical record/ADR via `tech-steer`; invariants every worker must keep → `AGENTS.md`; choices only for one slice → the issue and PR.
3. **Approved, non-executable documentation:** Check the current default-branch head, existing documentation PRs, affected references and protection rules. Commit directly to default when permitted; otherwise finish the relevant documentation PR or create a short one. No CI, Codex review or independent acceptance handoff is required solely for approved intent. Never bypass branch protection or required human approval. Executable Markdown, code, tests, configuration, generated files and security rules retain their normal gates.
4. Record actual commit/PR evidence. If authoritative intent is not merged, do not treat its unmerged content as an executable implementation requirement.

## Reconcile GitHub issues

`/steer` has standing authorization to reconcile **durably approved** product Decisions into necessary implementation issues, not to implement or merge feature PRs. Do this after recording each answer or coherent batch, before the next guided question; do not ask again for permission to create issues. Honor an explicit read-only/no-issue request.

1. Compare approved outcomes and Atlas IDs with current code, real acceptance, **open and closed** issues, and PRs. Reuse or update coverage before creating anything. No issue for already verified behavior, tentative ideas, context-only Decisions or unresolved Questions; missing optional verification alone creates no work; a concrete failure can warrant acceptance.
2. Use `issue-preflight` for uncovered, independently verifiable work. Describe the observable outcome, scope, exclusions, Atlas references, acceptance and native GitHub dependencies. One issue may cover several Decisions. Follow repository issue conventions and owning cross-repository contracts; don't generate an issue per Decision or plan an agent-selected MVP.
3. If approved intent is still in an unmerged documentation PR, link that PR in affected issues and state that implementation waits for its merge. Do not label an answered choice `needs-decision`. If ownership or a material product choice remains unresolved, record a Question and withhold only the affected issue.
4. Make reconciliation idempotent: update actual gaps, preserve unrelated issue scope and dependencies, and report writes that failed. An owner-approved Decision does not authorize unrelated defect-issue writes.

## Continue or finish

In guided mode, after recording and reconciling an answer, ask the next material question **in the same reply** unless the owner stopped or no consequential fork remains. Normally cover 3–5 questions per session; continue if asked. Free-form discussion has no quota.

Report recorded Decision/Question IDs, issue coverage or changes, pending documentation merges, unverified acceptance and any indispensable owner input. Refer implementation to `work-loop`, historical reconstruction to `atlas-audit`, major product design to `grill`, technical choices to `tech-steer`, and issue blockers to `unblock`. Do not start implementation from `/steer`.
