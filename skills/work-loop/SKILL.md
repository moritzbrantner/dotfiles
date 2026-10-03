---
name: work-loop
description: Run the global coding loop over the moritzbrantner GitHub repositories — pick an actionable open issue, implement it in its repository by that repository's AGENTS.md, validate, update GitHub, repeat. Hands over to the unblock skill when nothing is actionable. Use when the user says "work", "run the loop", "pick up work" or invokes /work-loop.
---

# Work loop

One loop for every repository. GitHub is the only work queue and the only durable state: open issues are the work, issue links are the dependencies, pull requests show what is in flight. Repositories hold their own instructions (`AGENTS.md`, `CLAUDE.md`), conventions, tests and architecture; this loop adds nothing on top of them.

There are no claims, queue files, roles, status labels, triage passes or per-repository loops. The only label the loop sets is `needs-decision`.

## One iteration

1. **Scan.**
   - Open PRs of yours first, because finishing beats starting: `gh search prs --owner moritzbrantner --state open --author @me --limit 1000 --json repository,number,title,url`.
   - Classify each open PR: **ready** means mergeable, Codex-reviewed with no unanswered findings, and every configured check has a successful terminal conclusion (`success`, `skipped` or `neutral`); zero configured checks also counts as successful. Merge ready PRs. **Broken** means a failed check, unanswered review finding or merge conflict; repair it. **Waiting** means checks or review are still pending, or another external condition must change; leave it open and continue scanning. Only start an issue after every open PR is either finished or waiting.
   - Reuse existing agent progress instead of starting over. If an agent worktree, branch or dirty agent state can be traced to an open PR or open issue, resume that work. If its issue is closed, superseded or otherwise no longer work, discard that agent worktree/branch and start fresh. Never discard or overwrite unrelated user changes in the ordinary checkout.
   - Close a PR that is superseded (its work is already on the default branch or replaced by another PR) with the reason in the closing comment.
   - Then open issues: `gh search issues --owner moritzbrantner --state open --limit 1000 --json repository,number,title,labels,updatedAt`.
2. **Pick one actionable issue.** An issue is actionable when:
   - it is not labelled `needs-decision`;
   - it is not a bot issue (Renovate's Dependency Dashboard and similar);
   - every native GitHub dependency in `blockedBy` is closed (`gh issue view <n> -R <repo> --json blockedBy`);
   - no open PR closes it, since that closing PR is the work in flight:
     `gh api graphql -f query='{repository(owner:"moritzbrantner",name:"<repo>"){issue(number:<n>){closedByPullRequestsReferences(first:5,includeClosedPrs:false){nodes{number}}}}}'`.

   Use native GitHub dependencies as the durable dependency state. If an older issue contains an obvious legacy blocker reference in prose, honor it when encountered, but do not add or maintain textual `Blocked by` lines.

   Among those, prefer issues that block other issues, then bugs, then whatever continues recent work. Use judgement; do not build a ranking. Labels such as `prd`, `ready-for-agent` or `enhancement` are information, not gates.
3. **Understand it.** Read the issue, its comments, the repository's `AGENTS.md`/`CLAUDE.md` and the code it touches. If the issue is already done, comment with the evidence and close it. If it is underspecified, settle what the code and docs settle and record the choice in the PR. If it needs the owner's product, scope or architecture decision, ask on the issue (one concrete question with options and your recommendation), add `needs-decision` (create the label first if the repository lacks it: `gh label create needs-decision -R <repo> --color d93f0b --description "Waiting on the owner's decision"`) and pick another issue.
4. **Work in the repository.**
   - The checkout lives at `~/privat/<repo>`; clone it with `gh repo clone moritzbrantner/<repo>` if it is missing.
   - Never edit the user's checked-out branch or unrelated dirty tree. For new work, use a worktree from the fresh default branch: `git fetch origin && git worktree add ../<repo>-wt/<n> -b agent/<n>-<topic> origin/<default>`. For an existing PR or decipherable open-issue work, resume its existing branch/worktree instead of creating a second implementation branch.
   - Follow the repository's instructions exactly: its scope rules, architecture boundaries, test and benchmark conventions and hooks. They override this skill.
   - Push early and open a draft PR with `Closes #<n>`. The selected issue should be completed by this PR; the open closing PR is the only signal that the issue is taken.
   - If the issue turns out broader than one coherent PR, complete a substantial coherent chunk, create focused follow-up issues for the separable remainder, and make the moved scope explicit before closing the selected issue. Do not use partial PRs (`Part of #<n>` or `Refs #<n>`) as work-in-flight state.
5. **Dependencies in other repositories.** When the work needs something another repository owns, do not change both from one task and do not coordinate across repositories. Create the smallest actionable issue there that would actually unblock this work, describing the missing capability and the consumer, and make it a native GitHub dependency of the current issue (for example `gh issue create -R moritzbrantner/<other> --blocking https://github.com/moritzbrantner/<repo>/issues/<n>`). Do not add a textual `Blocked by` line. Continue with work that does not need the dependency or move on. Do not block on a broad PRD, roadmap or tracking issue when the real prerequisite is narrower (for example a publication, pin bump or one missing capability); create that narrow issue instead. The new issue is ordinary work for a later iteration.
6. **Validate.** Run the validation the repository documents for the touched scope. CI is the full gate; a failed check blocks merge, so fix it rather than arguing with it. `success`, `skipped` and `neutral` count as successful terminal conclusions; zero CI checks also counts as successful.
7. **Update GitHub.** Mark the PR ready, wait for checks (`gh pr checks <n> --watch`), fix failures and answer every review finding, then merge per the repository's convention (default `gh pr merge <n> --merge --delete-branch`). The owner authorises the loop to merge its own PRs, pre-existing ones included, once every check is green and every review finding is answered; the Codex review comments count as the review, so no approving GitHub review is needed. If a merge is refused, leave the PR open and report it.
   - Stacked PRs: before merging a PR that is the base of another open PR, retarget that child (`gh pr edit <child> --base <new base>`); deleting the merged branch otherwise closes the child.
   - Clean up when a PR is merged or closed: `git worktree remove ../<repo>-wt/<n>` and `git branch -D <branch>`. Do the same during the scan for stale `~/privat/<repo>-wt/*` agent worktrees. If uncommitted agent changes can be traced to a closed or superseded issue, discard that stale agent state; if their provenance is unclear or they may be unrelated user changes, do not remove them and report them instead.
   - Reviews converge: batch fixes into one push. After the initial automatic review, request at most three additional re-reviews (`@codex review`) per PR, and only after substantive fixes. After the third additional request, answer later findings in their thread without requesting another review; fix real bugs, and list non-blocking polish or follow-ups in the PR description instead of starting another round.
   - No Codex review yet: leave the PR open, treat it as waiting, move on to other work, and request `@codex review` again in a later iteration; this retry does not count toward the re-review limit. Merge only after Codex has reviewed.
8. **Repeat** from step 1. Keep going until nothing is actionable; one run is not one issue.

## When nothing is actionable

Invoke the `unblock` skill. Each decision it records makes an issue actionable again, so continue the loop afterwards. Stop when nothing is actionable and the user has no more answers.

## Keep it small

- Comments only where they carry information: decision questions, cross-repository dependencies, why an issue was closed. PR descriptions are short: what changed, which checks ran, what is not verified.
- Do not create issues for unrelated findings; mention them in one line of the PR.
- Do not add labels, trackers, status reports, dashboards or coordination files.

## Report

At the end, one line per issue touched: `repo#n → merged PR #m | PR #m waiting on <x> | needs-decision | closed (reason)`, plus anything the user must do, such as merges that were refused.
