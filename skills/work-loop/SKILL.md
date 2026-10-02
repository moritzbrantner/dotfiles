---
name: work-loop
description: Run the global coding loop over the moritzbrantner GitHub repositories — pick an actionable open issue, implement it in its repository by that repository's AGENTS.md, validate, update GitHub, repeat. Hands over to the unblock skill when nothing is actionable. Use when the user says "work", "run the loop", "pick up work" or invokes /work-loop.
---

# Work loop

One loop for every repository. GitHub is the only work queue and the only durable state: open issues are the work, issue links are the dependencies, pull requests show what is in flight. Repositories hold their own instructions (`AGENTS.md`, `CLAUDE.md`), conventions, tests and architecture; this loop adds nothing on top of them.

There are no claims, queue files, roles, status labels, triage passes or per-repository loops. The only label the loop sets is `needs-decision`.

## One iteration

1. **Scan.**
   - Open PRs of yours first, because finishing beats starting: `gh search prs --owner moritzbrantner --state open --author @me --limit 1000 --json repository,number,title,url`. A PR with a failed check, an unanswered review finding or a merge conflict is the next piece of work.
   - Close a PR that is superseded (its work is already on the default branch or replaced by another PR) with the reason in the closing comment.
   - Then open issues: `gh search issues --owner moritzbrantner --state open --limit 1000 --json repository,number,title,labels,updatedAt`.
2. **Pick one actionable issue.** An issue is actionable when:
   - it is not labelled `needs-decision`;
   - it is not a bot issue (Renovate's Dependency Dashboard and similar);
   - every issue it names as `Blocked by …` (or its native GitHub dependencies) is closed;
   - no open PR is linked to it, since that PR is the work in flight:
     `gh api graphql -f query='{repository(owner:"moritzbrantner",name:"<repo>"){issue(number:<n>){closedByPullRequestsReferences(first:5,includeClosedPrs:false){nodes{number}}}}}'`.

   Among those, prefer issues that block other issues, then bugs, then whatever continues recent work. Use judgement; do not build a ranking. Labels such as `prd`, `ready-for-agent` or `enhancement` are information, not gates.
3. **Understand it.** Read the issue, its comments, the repository's `AGENTS.md`/`CLAUDE.md` and the code it touches. If the issue is already done, comment with the evidence and close it. If it is underspecified, settle what the code and docs settle and record the choice in the PR. If it needs the owner's product, scope or architecture decision, ask on the issue (one concrete question with options and your recommendation), add `needs-decision` (create the label first if the repository lacks it: `gh label create needs-decision -R <repo> --color d93f0b --description "Waiting on the owner's decision"`) and pick another issue.
4. **Work in the repository.**
   - The checkout lives at `~/privat/<repo>`; clone it with `gh repo clone moritzbrantner/<repo>` if it is missing.
   - Never edit the user's checked-out branch or a dirty tree. Work in a worktree from the fresh default branch: `git fetch origin && git worktree add ../<repo>-wt/<n> -b agent/<n>-<topic> origin/<default>`.
   - Follow the repository's instructions exactly: its scope rules, architecture boundaries, test and benchmark conventions and hooks. They override this skill.
   - Push early and open a draft PR that links the issue. Use `Closes #<n>` only when this PR satisfies the whole issue; for a partial slice use `Part of #<n>` or `Refs #<n>`. The open PR is the only signal that the issue is taken.
5. **Dependencies in other repositories.** When the work needs something another repository owns, do not change both from one task and do not coordinate across repositories. Create the smallest actionable issue there (`gh issue create -R moritzbrantner/<other>`) that would actually unblock this work, describing the missing capability and the consumer, add `Blocked by moritzbrantner/<other>#<m>` to this issue, and continue with work that does not need it or move on. Do not block on a broad PRD, roadmap or tracking issue when the real prerequisite is narrower (for example a publication, pin bump or one missing capability); create that narrow issue instead. The new issue is ordinary work for a later iteration.
6. **Validate.** Run the validation the repository documents for the touched scope. CI is the full gate; a red check blocks merge, so fix it rather than arguing with it.
7. **Update GitHub.** Mark the PR ready, wait for checks (`gh pr checks <n> --watch`), fix failures and answer every review finding, then merge per the repository's convention (default `gh pr merge <n> --merge --delete-branch`). The owner authorises the loop to merge its own PRs, pre-existing ones included, once every check is green and every review finding is answered; the Codex review comments count as the review, so no approving GitHub review is needed. If a merge is refused, leave the PR open and report it.
   - Stacked PRs: before merging a PR that is the base of another open PR, retarget that child (`gh pr edit <child> --base <new base>`); deleting the merged branch otherwise closes the child.
   - Clean up when a PR is merged or closed: `git worktree remove ../<repo>-wt/<n>` and `git branch -D <branch>`. Do the same during the scan for any `~/privat/<repo>-wt/*` worktree whose PR is already merged or closed. A worktree with uncommitted changes is not removed; report it instead.
   - Reviews converge: batch fixes into one push. After the initial automatic review, request at most three additional re-reviews (`@codex review`) per PR, and only after substantive fixes. After the third additional request, answer later findings in their thread without requesting another review; fix real bugs, and list non-blocking polish or follow-ups in the PR description instead of starting another round.
   - No Codex review yet: Codex has most likely hit its usage limit. Leave the PR open, move on to other work, and request `@codex review` again in a later iteration; this retry does not count toward the re-review limit. Merge only after Codex has reviewed.
8. **Repeat** from step 1. Keep going until nothing is actionable; one run is not one issue.

## When nothing is actionable

Invoke the `unblock` skill. Each decision it records makes an issue actionable again, so continue the loop afterwards. Stop when nothing is actionable and the user has no more answers.

## Keep it small

- Comments only where they carry information: decision questions, cross-repository dependencies, why an issue was closed. PR descriptions are short: what changed, which checks ran, what is not verified.
- Do not create issues for unrelated findings; mention them in one line of the PR.
- Do not add labels, trackers, status reports, dashboards or coordination files.

## Report

At the end, one line per issue touched: `repo#n → merged PR #m | PR #m waiting on <x> | needs-decision | closed (reason)`, plus anything the user must do, such as merges that were refused.
