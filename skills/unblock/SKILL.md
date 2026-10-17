---
name: unblock
description: Find genuine needs-decision issues, ask focused owner questions, and incorporate answers when the owner ends the conversation or requests capture.
---

# Unblock

Resolve owner questions left by workers. Follow [owner questions and incorporation](../../docs/owner-questions.md); keep new answers in conversation until the owner declares it finished or says “capture and incorporate now.”

1. **Find blockers.** Search GitHub for `is:issue is:open label:needs-decision user:moritzbrantner` within the owner's scope. Review in oldest-created order, with repository and issue number as ties. Native dependencies retain actual prerequisite state; historical priorities do not block.
2. **Read before asking.** Inspect each issue's question IDs, comments, relevant code/docs and approved decisions. Import already captured answers/digests through the shared protocol. Match each question and later corrections; do not assume a newer comment answers everything. Resolve stale labels from existing durable decisions without asking again.
3. **Ask what remains.** Ask one focused owner question at a time, using plain outcomes and a grounded recommendation when useful. Reuse settled preferences, but do not infer new product approval from code or a recommendation. Obtain ordinary available inputs yourself. Use `steer` for broader connected decisions; no questionnaire or quota.
4. **Keep discussing.** Accept choices, revisions, free-form answers or “skip” in chat. An explicit live answer may guide current authorized implementation. Do not write new answers, edit their owning records or reconcile their issues after each exchange.
5. **Incorporate at the owner's signal.** Reconcile the whole conversation into the owning Markdown and necessary issues, link decisions, and clear only resolved owner blockers. Keep partial/skipped questions open. Close explicitly rejected work as not planned with its reason; preserve unresolved work. Report saved changes and remaining blockers without another confirmation.

After capture, resume implementation only if a work-loop or implementation task is already authorized. Otherwise finish the steering session.
