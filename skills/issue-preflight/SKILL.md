---
name: issue-preflight
description: Keep GitHub issues aligned with approved product outcomes and repository ownership without routine verification ceremony.
---

# Issue preflight

Check scope and readiness using the implementing worker's investigation. Follow [owner questions and incorporation](../../docs/owner-questions.md); no separate preparation agent or document.

1. Use the loaded instruction baseline; read the issue, relevant code/workflow, approved Decisions and newly relevant rules. Use scoped `daq` or owning Atlas Markdown when present. Follow stable IDs and local schema. Unrelated Questions, roadmap phases and historical priorities are not blockers.
2. State the observable outcome, entrypoint, main action and expected result. User-facing work delivers an integrated user journey; a backend enabler alone does not complete its consuming feature. Headless work names its API, executable or artifact.
3. Obtain ordinary prerequisites and identify the remaining owner choices before affected implementation. Reuse settled preferences; ask about unresolved user-facing behavior even when reversible. A broad approved capability may still have open details.
4. Preserve full approved scope. If smaller delivery is necessary, propose a usable split with all remaining obligations and obtain owner approval unless already approved. Use native GitHub dependencies for actual prerequisites. Do not substitute temporary inputs for required real ones.
5. **Happy-path default:** Readiness requires a clear outcome, not a tests-first handoff, browser test plan, screenshot, independent acceptance, benchmark or deployment proof. Existing required gates remain. Use `acceptance-contract` only for an observed serious failure, concrete high-consequence risk or explicit requirement/request. Distinguish expected behavior from behavior actually tested.

## Issue reconciliation

At the owner's end-of-conversation signal, reconcile **approved Decisions** into necessary issues. Search open/closed issues, PRs and relevant code; update matching coverage instead of duplicating it. Broad approved direction may produce an issue with recorded open questions; issue creation alone does not make it ready. Tentative ideas remain Questions.

Link durable decisions and exact blockers. An answered choice is not `needs-decision`; an authoritative change awaiting its required merge is a source prerequisite. An explicit live answer may guide the current authorized worker before capture; other workers need the incorporated source.

Return **ready**, **needs owner decision**, **needs input/dependency** or **needs owner-approved split**, with only the outcome, constraints and actual blockers.
