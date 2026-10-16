---
name: unblock
description: Resolve issues that wait on the owner's decision — find open needs-decision issues across the moritzbrantner repositories, ask the user one focused question at a time and record each answer on GitHub so the work loop can continue. Use when the work loop finds nothing actionable, or when the user says "unblock", "what do you need from me" or invokes /unblock.
---

# Unblock

Resolves owner questions left by the work loop. GitHub retains issue execution state; the owning Decision Atlas (when present) retains product intent. This is a fallback for gaps discovered during implementation, not a replacement for design-first `grill` on new products or major features.

Only ask for information or approval that an agent cannot derive, obtain or implement itself. If no real owner-only blocker remains, return to the next unblocked GitHub issue without another steering question.

## Steps

1. **Find blocked issues:** `gh search issues --owner moritzbrantner --state open --label needs-decision --json repository,number,title,url,updatedAt`.
2. **Verify, then order:** confirm that each `needs-decision` label represents an indispensable unanswered human choice on that exact issue; remove stale labels once their answer is already recorded, and do not treat category-wide priorities, roadmap stages or historical deferrals as blockers. Review genuine human blockers in neutral oldest-created order, with repository/issue as ties. Native `blockedBy` dependencies remain authoritative for actual prerequisite work; do not invent textual blocker state.
3. **For each issue:**
   - Read the issue, comments, local instructions, and relevant code/docs. If the repository has an Atlas, retrieve applicable Decisions and Questions with `daq` when available (or read relevant source Markdown), checking that an answer isn't already recorded.
   - If current owner-approved intent already answers the issue (Atlas, an owner comment, or authoritative docs), cite it without asking again; code alone proves implementation, not owner approval.
   - Otherwise ask the user **one** question. Give brief context and a recommendation with genuinely distinct options when they exist (never false or nested choices); an open-ended question is valid. Use the question tool when available. Ask nothing that the repository or tools can answer.
   - Avoid false choices: Do not ask questions where one option subsumes the others or where a sensible default with targeted overrides resolves the alternatives; ask only when there is a genuine, consequential trade-off that requires the owner's judgment.
   - If several connected consequential choices remain, use `grill` one question at a time. Update the owning Atlas first when present; otherwise update established vision/ADR documentation.
4. **Persist, then unblock:**
   - For a consequential owner answer, update the owning Atlas when it exists: append a Decision linked `Answers <question-id>`, or change settled intent inline with `~~old~~ replacement` while preserving its ID. Without an Atlas, update the repository's existing authoritative document.
   - Comment on the issue with the answer and **Atlas ID/source link** (or existing spec/ADR link); update the issue body only where its implementation scope or acceptance changes.
   - Remove `needs-decision` (`gh issue edit <n> -R <repo> --remove-label needs-decision`) only when the blocking choice is durably recorded. If recording fails, leave the label and report the gap rather than treating an issue comment as a competing source of truth.
   - If the decision is "don't do it", close the issue as not planned with its reason and authoritative reference; if deferred, leave the issue unchanged.
5. **Continue** with the next issue until none remain or the user stops, then return to the `work-loop` skill.

Ask one question at a time; never send a questionnaire.
