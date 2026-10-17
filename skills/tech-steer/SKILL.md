---
name: tech-steer
description: Guide an owner through one consequential technical architecture choice at a time, grounded in approved product intent, evidence and reuse-first alternatives; record approved choices without implementing them.
---

# Technical steering

Use /tech-steer in the owning repository, optionally with a subsystem or Decision Atlas ID.
Run it after /steer when product intent is settled but consequential technical choices remain.
**Ordinary /tech-steer means an interactive owner interview**, not an architecture audit
or a request to transcribe decisions. Keep the conversation going one useful decision at a
time until the owner ends it or no consequential unresolved choices remain. This is not a
second work loop, issue queue, product authority, or requirement to design every detail
up front.

## Conversation modes

Infer the mode from the user's request without making the user select a mode:

- **Guided interview (default):** "tech-steer physics-engine", "let's tech-steer Maps",
  "help me choose the architecture", or a comparable request means **investigate, then
  ask the next open, consequential engineering question**. Do not end the first turn
  after summarizing accepted architecture, documenting settled choices, or proposing
  follow-up issues. A prior product or architectural decision is context, not a reason
  to skip looking for the next material fork.
- **Free-form discussion:** When the owner talks through several technical ideas,
  receive and synthesize them before interrupting. Check existing authority and code,
  record unequivocally approved choices, and ask at most one material clarification
  at a time. Switch naturally into guided questioning when the owner asks to continue.
- **Audit/document mode (explicit):** "/tech-steer audit", "review our existing
  technical decisions", "document our settled direction" or an explicit read-only
  request calls for an assessment or authorized documentation update **without**
  forcing an interview. Do not infer audit mode merely because existing ADRs or
  implementation issues already describe a good solution.

The human owns consequential architecture/product-affecting trade-offs; the agent
researches, explains options, recommends, records answers and identifies verification.
Routine reversible implementation detail remains delegated to the implementation agent.

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

## Guided interview: one consequential question each turn

1. **Find what is still undecided.** Compare settled owner decisions, the actual
   implementation and reference providers, gaps in existing GitHub issues, and current
   evidence. Distinguish a known solution already selected, a candidate proposal,
   and a choice that has not yet been made. Look for the next material, costly-to-reverse
   fork, not another way to rephrase a settled decision. For example, an approved
   "Rapier as a reference" policy does not automatically answer whether consumers
   should **eventually** support a second production provider; first verify whether
   that longer-term choice has been settled elsewhere.
2. **Ask; do not just report.** Present one concrete question with a short statement of
   the relevant product goal and source links/Decision IDs. Give two or three genuinely
   different A/B/C technical options, including pros/cons on the actual constraint,
   a grounded recommendation where warranted, and what accepting each would change.
   End with one explicit question. The owner's open answer is equally valid.
3. **Continue after each answer.** Persist an unequivocal approved choice in the owning
   technical ADR/register or existing architecture document, preserving authority and
   history; if an answer reveals a product-intent conflict, route that issue to /steer
   instead. Report what was recorded, then ask the next open technical question in the
   **same reply** when the owner wants ongoing steering. Do not ask for redundant
   approval of an unambiguous answer or end the interview after one saved choice.
4. **Do not manufacture an interview.** Never offer fake alternatives, ask about a
   routine setting, or reopen approved choices just to generate a question. If a
   careful search finds no consequential unresolved technical fork, say that explicitly
   and stop, or ask for a new design area only if genuinely needed. An ordinary
   performance defect without a real architectural choice belongs in an issue.

A guided session should normally **finish its first reply with its first meaningful
question**, not a new Markdown file or an audit recap. The same rule applies to the
next turn after an owner answer. In voice mode, make each option understandable
without an image or a long technical explanation.

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
- Make a grounded recommendation grounded in the repository and external evidence.
  In **guided mode**, actively discover the next high-impact technical fork and present
  **one** owner question per turn. Do not skip the interview merely because the agent
  could implement a plausible solution or earlier decisions were easy to summarize.
  Accept open answers or explicit delegation. Never mistake a proposal for owner approval.
  In free-form mode, synthesize the owner's ideas before asking a clarification.

A technical recommendation may be documented as *proposed* for review, but only explicit
approval, established repository authority, or a clear owner delegation makes it a
selected direction. If evidence is missing, record the verification gap, not an
unverified success.

## Persist only durable architecture choices

Placement follows `steer`: product behavior → Atlas; consequential how → this register or an existing ADR; worker invariants → `AGENTS.md`; single-slice choices → issue/PR. Apply the owner principles in `coding-agent-conventions` (no compatibility shims or verification ceremony unless required) when recommending options.

Reuse the owning repository's existing ADR or architecture documentation if it already
covers this choice. Otherwise use **docs/technical-decisions.md** as the single concise
technical-decision register, creating it only once a consequential decision is worth
recording. Do not impose a new schema on repositories with their own documentation.
**Starting a guided interview is not approval to choose or record its answers.**
Before the owner answers, inspect existing records but do not replace the promised
question with an unsolicited transcription of old decisions. Persist explicit
answers promptly after they are given, not only at the end of a session.


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
2. Identify architectural seams or invariants for a future concrete failure investigation or requested independent acceptance. Routine implementation follows the happy-path work-loop without preemptive verification.
3. Report the chosen direction, which repository Markdown was actually committed,
   references to applicable Atlas IDs, the issue handoff (if authorized), and any
   unverified benchmark or unresolved consequential choice. A Markdown decision alone
   is not evidence of implementation, CI success, or deployment.

Example: A consumer keeps MapLibre as the production renderer while it compares a
first-party map engine behind a real selector. The consumer documents its selector and
acceptance seam; the map engine owns its own implementation and benchmark decisions.
This illustrates the boundary, not an instruction to create that selector in every app.

## Behavioral check

- "Let's tech-steer physics-engine" → inspect the settled engine/reference
  decisions, then **ask one material unresolved architectural question**. Do not
  treat the command as authorization to write an ADR and stop.
- "I choose B, continue" → record the approved technical choice with evidence,
  then ask the **next** material question, without implementing anything.
- "/tech-steer audit physics-engine" → review and report existing choices without
  asking a compulsory A/B/C question.
- When all consequential technical decisions are already settled, say so and do
  not invent a decision or imply that green tests prove owner approval.
