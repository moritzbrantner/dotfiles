# Owner questions and voice sessions

The owner works in two places: **voice/ChatGPT sessions** (ideas, decisions, answering questions while away from the computer) and **the computer** (overseeing `work-loop`). This file defines the only three text formats that cross between them. GitHub issues and the Decision Atlas stay the durable state; there is no other queue.

## When a fork goes to the owner

An **owner fork** is a choice that is not already settled by an Atlas Decision, a technical decision record, `AGENTS.md` or existing code **and** is one of:

- user-visible behavior, workflow or scope;
- hard-to-reverse architecture (runtime, storage/save format, protocol, public API shape, a new dependency family);
- cross-repository ownership (which repository owns a capability);
- money, licensing, privacy or private inputs.

Everything else is an **agent default**: decide it following the owner principles in `coding-agent-conventions/principles/README.md` (cleanest design, no compatibility shims, proportionate verification, idempotent setup, no temporary substitutes) and list it in the PR. A typical issue has 0–5 owner forks. Never pad to a count.

## 1. Owner question block (agent → issue)

Posted as one issue comment by any agent that finds owner forks, together with the `needs-decision` label. The agent then continues with other eligible work; it never waits.

```md
### Owner questions — <repo>#<n> <short title>
Context: <one or two sentences a listener can follow without the code>

**Q1. <question in plain words>**
- A — <outcome, what the user/developer gets> (recommended: <one reason>)
- B — <outcome>
- C — <outcome>

**Q2. …**
```

Rules: each question stands alone when read aloud; options describe outcomes, not code; no false choices; recommendation optional but grounded. IDs are `<repo>#<n>.Q<k>` and never renumbered.

## 2. Brief (computer → voice session)

`/unblock brief` collects every open owner question block (and Atlas Questions the owner asked to hear) across repositories into one plain-text brief, oldest first, grouped by repository. It asks nothing and writes nothing. Paste it into ChatGPT, or let ChatGPT read the `needs-decision` issues directly through its GitHub access.

## 3. Answers block and idea digest (voice session → computer)

At the end of a voice session ChatGPT outputs one block. Paste it into Claude Code with `/unblock` (answers) or `/steer` (ideas); the agent records answers on the issues and in the owning Atlas, removes `needs-decision`, and reconciles issues.

```text
ANSWERS <date>
arpg#175.Q1: A
arpg#175.Q4: other — "<owner's words, verbatim>"
asset-tooling#225.Q3: skip

DIGEST <date>
repo: arpg
DECIDE: <unequivocal owner directive>
QUESTION: <open consequential question the owner raised>
IDEA: <maybe / what-if; not approved>
```

`DECIDE` lines are approved intent. `IDEA` lines and anything hedged stay Questions or proposals. Verbatim owner words are kept for `other` answers so the recording agent interprets the owner, not ChatGPT's paraphrase.

## ChatGPT project instructions

Paste into a ChatGPT Project used for driving sessions:

> You help me steer my software projects by voice. My repositories are on GitHub under moritzbrantner; product intent lives in each repo's Decision Atlas (`docs/decisions/atlas.md` or `docs/DECISION-ATLAS.md`); the process is in `moritzbrantner/dotfiles/docs/owner-questions.md`.
> - **Answer mode** (I say "questions" or paste a brief): read me one question at a time, short, options as outcomes, with your recommendation. Accept A/B/C, "skip", or free words. Don't explain code.
> - **Idea mode** (I just talk): listen without interrupting; when I pause, summarize what you heard grouped by repository, and ask at most one clarification.
> - When I say "done", output exactly one `ANSWERS` and/or `DIGEST` block in the format from that file, with my own words verbatim for free-form answers. Never mark a "maybe" as DECIDE.
