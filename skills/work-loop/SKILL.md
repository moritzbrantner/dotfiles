---
name: work-loop
description: Run the global coding loop over the moritzbrantner GitHub repositories — pick an actionable open issue, implement it in its repository by that repository's AGENTS.md, validate, update GitHub, repeat. Hands over to the unblock skill when nothing is actionable. Use when the user says "work", "run the loop", "pick up work" or invokes /work-loop.
---

# Work loop

One loop for every repository. GitHub is the only work queue and the only durable state: open issues are the work, issue links are the dependencies, pull requests show what is in flight. Repositories hold their own instructions (`AGENTS.md`, `CLAUDE.md`), conventions, tests and architecture; this loop adds nothing on top of them.

There are no claims, queue files, roles, status labels, triage passes or per-repository loops. The only label the loop sets is `needs-decision`.

## One iteration

1. **Scan.**
   - Open PRs of yours first, because finishing beats starting: `gh search prs --owner moritzbrantner --state open --author @me --json repository,number,title,url`. A PR with a failed check, an unanswered review finding or a merge conflict is the next piece of work.
   - Then open issues: `gh search issues --owner moritzbrantner --state open --limit 1000 --json repository,number,title,labels,updatedAt`.
2. **Pick one actionable issue.** An issue is actionable when:
   - it is not labelled `needs-decision`;
   - it is not a bot issue (Renovate's Dependency Dashboard and similar);
   - every issue it names as `Blocked by …` (or its native GitHub dependencies) is closed;
   - no open PR is linked to it (`gh issue view <n> -R <repo> --json closedByPullRequestsReferences`), since that PR is the work in flight.

   Among those, prefer issues that block other issues, then bugs, then whatever continues recent work. Use judgement; do not build a ranking. Labels such as `prd`, `ready-for-agent` or `enhancement` are information, not gates.
3. **Understand it.** Read the issue, its comments, the repository's `AGENTS.md`/`CLAUDE.md` and the code it touches. If the issue is already done, comment with the evidence and close it. If it is underspecified, settle what the code and docs settle and record the choice in the PR. If it needs the owner's product, scope or architecture decision, ask on the issue (one concrete question with options and your recommendation), add `needs-decision` and pick another issue.
4. **Work in the repository.**
   - The checkout lives at `~/privat/<repo>`; clone it with `gh repo clone moritzbrantner/<repo>` if it is missing.
   - Never edit the user's checked-out branch or a dirty tree. Work in a worktree from the fresh default branch: `git fetch origin && git worktree add ../<repo>-wt/<n> -b agent/<n>-<topic> origin/<default>`.
   - Follow the repository's instructions exactly: its scope rules, architecture boundaries, test and benchmark conventions and hooks. They override this skill.
   - Push early and open a draft PR with `Closes #<n>`. The open PR is the only signal that the issue is taken.
5. **Dependencies in other repositories.** When the work needs something another repository owns, do not change both from one task and do not coordinate across repositories. Create an issue there (`gh issue create -R moritzbrantner/<other>`) describing the missing capability and the consumer, add `Blocked by moritzbrantner/<other>#<m>` to this issue, and continue with work that does not need it or move on. The new issue is ordinary work for a later iteration.
6. **Validate.** Run the validation the repository documents for the touched scope. CI is the full gate; a red check blocks merge, so fix it rather than arguing with it.
7. **Update GitHub.** Mark the PR ready, wait for checks (`gh pr checks <n> --watch`), fix failures and answer every review finding, then merge per the repository's convention (default `gh pr merge <n> --merge --delete-branch`). If a merge is refused, leave the PR open and report it. Remove the worktree afterwards.
8. **Repeat** from step 1. Keep going until nothing is actionable; one run is not one issue.

## When nothing is actionable

Invoke the `unblock` skill. Each decision it records makes an issue actionable again, so continue the loop afterwards. Stop when nothing is actionable and the user has no more answers.

## Keep it small

- Comments only where they carry information: decision questions, cross-repository dependencies, why an issue was closed. PR descriptions are short: what changed, which checks ran, what is not verified.
- Do not create issues for unrelated findings; mention them in one line of the PR.
- Do not add labels, trackers, status reports, dashboards or coordination files.

## Report

At the end, one line per issue touched: `repo#n → merged PR #m | PR #m waiting on <x> | needs-decision | closed (reason)`, plus anything the user must do, such as merges that were refused.
