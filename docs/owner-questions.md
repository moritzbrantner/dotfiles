# Owner questions and voice sessions

The owner works in two places: **voice/ChatGPT sessions** (ideas, decisions, answering questions while away from the computer) and **the computer** (overseeing `work-loop`). Everything crosses through GitHub itself — the `needs-decision` label, native blocked-by links and issue comments — so nothing has to be uploaded or pasted. This file defines the three comment formats. The Decision Atlas stays the durable product authority; there is no other queue.

## When a fork goes to the owner

Follow the [owner decision authority approved in process steering Q1 (B)](https://github.com/moritzbrantner/dotfiles/blob/ea3ae3c06b9588efecf0c83b5f4cc12b6a8d3b1e/AGENTS.md#owner-decision-authority).

An **owner fork** is a choice that is not already settled by applicable repository-local instructions, installed `coding-agent-conventions`, an Atlas Decision or a technical decision record **and** is one of:

- user-visible behavior, workflow, appearance or scope, even when the choice is reversible;
- hard-to-reverse architecture (runtime, storage/save format, protocol, public API shape, a new dependency family);
- cross-repository ownership (which repository owns a capability);
- money, licensing, privacy or private inputs.

Everything else is an **agent default**: decide it following the owner principles in `coding-agent-conventions/principles/README.md` (cleanest design, no compatibility shims, proportionate verification, idempotent setup, no temporary substitutes) and list it in the PR. A typical issue has 0–5 owner forks. Never pad to a count.

## Broad direction and issue investigation

Follow the [broad steering and selected-issue investigation decision approved in process steering Q2 (B)](https://github.com/moritzbrantner/dotfiles/blob/4d124cfc5109c1d6dc82a0b93071c1d3a7d5f43a/README.md#broad-steering-and-issue-investigation).

A steering session can approve a capability and intended outcome before all details are known. Before coding the selected issue, the implementing worker investigates the relevant workflow, code, conventions, approved decisions and inputs, then settles the remaining blocking owner questions. Reuse the approved direction; unspecified user-facing behavior remains open. Broad and detailed steering are available in any session.

## Ask mode: live or github

The owner chooses per session how owner forks are asked:

- **`ask:github`** (default; unattended runs, nights): post `### Owner questions` on the issue, add `needs-decision`, continue with other eligible work. Nothing ever waits.
- **`ask:live`** (owner is at the session): ask owner forks immediately in the session, one at a time with the question tool, and continue the same issue once answered. A delegated worker that cannot ask directly stops and returns the questions to its orchestrator, which asks and resumes it. Open `needs-decision` questions from GitHub may be offered too.

Set it with the invocation (`/work-loop ask:live`, `/work-loop ask:github`) or by saying so mid-session ("I'm here, ask me" → live; "I'm leaving" → github). On a switch to github, post any still-unanswered live questions to their issues before continuing. Either way the record is the same: a live answer is posted as a `### Owner answers` comment with `Source: live session` and recorded in the Atlas exactly like a GitHub answer.

## 1. Owner questions (agent → issue)

Posted as one issue comment by any agent that finds owner forks, together with the `needs-decision` label. The agent then continues with other eligible work; it never waits.

```md
### Owner questions
<short title>
Context: <one or two sentences a listener can follow without the code>

**Q1. <question in plain words>**
- A — <outcome, what the user/developer gets> (recommended: <one reason>)
- B — <outcome>
- C — <outcome>

**Q2. …**
```

Rules: each question stands alone when read aloud; options describe outcomes, not code; no false choices; recommendation optional but grounded. IDs are `<repo>#<n>.Q<k>` and never renumbered.

## 2. Owner answers (voice session → issue)

ChatGPT finds open questions itself with the GitHub search `is:issue is:open label:needs-decision user:moritzbrantner`, reads each issue's latest `### Owner questions` comment and asks them one at a time. It then posts the answers as **one comment on the same issue**:

```md
### Owner answers
Q1: A
Q2: other — "<owner's words, verbatim>"
Q3: skip
```

`### Owner answers` is reserved for the owner's own words: written by the owner, by ChatGPT for the owner, or by an agent transcribing answers the owner just gave in an `ask:live` session (marked `Source: live session`). Agents never write it for their own defaults or guesses. ChatGPT does not edit labels, the Atlas or code.

**Pickup:** at its normal scan, `work-loop` (or `unblock`) treats a `needs-decision` issue whose latest `### Owner answers` comment is newer than its latest `### Owner questions` block as answered. It records product/architecture answers in the owning Atlas, comments the Atlas IDs, removes `needs-decision` once nothing blocking remains, and the issue becomes eligible again. `skip` keeps that question open; an ambiguous `other` answer gets a follow-up question in a new block instead of a guess.

## 3. Owner ideas (voice session → new issue)

New ideas are not answers. ChatGPT opens one issue in the owning repository titled `Owner digest: <topic>` whose body starts with:

```md
### Owner digest
DECIDE: <unequivocal owner directive>
QUESTION: <open consequential question the owner raised>
IDEA: <maybe / what-if; not approved>
```

`DECIDE` lines are approved intent; `IDEA` lines and anything hedged stay Questions or proposals. The next agent that selects it applies `steer`: record `DECIDE` lines in the Atlas, add Questions, reconcile implementation issues, then close the digest issue with links. No new label is needed.

**Fallback without GitHub write access:** ChatGPT outputs the same `Owner answers` (prefixed with `<repo>#<n>`) or `Owner digest` text in chat; paste it into `/unblock` or `/steer` in Claude Code.

## ChatGPT project instructions

Paste into a ChatGPT Project used for driving sessions:

> You help me steer my software projects by voice. My repositories are on GitHub under moritzbrantner; product intent lives in each repo's Decision Atlas (`docs/decisions/atlas.md` or `docs/DECISION-ATLAS.md`); formats are in `moritzbrantner/dotfiles/docs/owner-questions.md`.
> - **Questions** (I say "what's blocked" / "questions"): search GitHub for `is:issue is:open label:needs-decision user:moritzbrantner`, oldest first. For each issue read the latest `### Owner questions` comment and read me one question at a time: short, options as outcomes, with the recommendation. Accept A/B/C, "skip", or free words. Don't explain code. After each issue, post one `### Owner answers` comment on it with my words verbatim for free answers. Never change labels, files or code.
> - **Ideas** (I just talk): listen without interrupting; at a pause, summarize grouped by repository and ask at most one clarification. When I say "done", open one `Owner digest: <topic>` issue per repository in the `### Owner digest` format. Never mark a "maybe" as DECIDE.
> - If you can't write to GitHub, give me the same text to paste later.
