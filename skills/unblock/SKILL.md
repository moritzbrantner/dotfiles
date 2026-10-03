---
name: unblock
description: Resolve issues that wait on the owner's decision — find open needs-decision issues across the moritzbrantner repositories, ask the user one focused question at a time and record each answer on GitHub so the work loop can continue. Use when the work loop finds nothing actionable, or when the user says "unblock", "what do you need from me" or invokes /unblock.
---

# Unblock

Turns owner decisions into GitHub state. The work loop labels an issue `needs-decision` when it cannot proceed without the owner; this skill clears those issues.

## Steps

1. **Find blocked issues:** `gh search issues --owner moritzbrantner --state open --label needs-decision --json repository,number,title,url,updatedAt`.
2. **Order them:** issues that natively `blocking` other issues first, then the oldest. Honor an obvious legacy blocker reference in older prose if encountered, but do not create or maintain textual blocker state.
3. **For each issue:**
   - Read the issue, its comments and the code or docs it concerns.
   - If the answer is already there (answered in a comment, settled by the code, `AGENTS.md` or an ADR), record it as below without asking.
   - Otherwise ask the user **one** question. Give two or three lines of context and concrete options with your recommendation first, and use the question tool when one is available. Ask nothing that the repository or tools can answer.
4. **Record the answer** on the issue:
   - comment `Decision: <answer>` with any consequence for the scope;
   - edit the issue body only to update a section that the decision changes;
   - remove `needs-decision` (`gh issue edit <n> -R <repo> --remove-label needs-decision`);
   - if the answer is "don't do it", close the issue as not planned with the reason;
   - if the user defers, leave the issue as it is and move on.
5. **Continue** with the next issue until none remain or the user stops, then return to the `work-loop` skill.

Ask one question at a time; never send a questionnaire.
