# Steering and development flow

Approved workflow, 2026-10-17. [Work-loop instructions](../skills/work-loop/SKILL.md) · [Owner questions and incorporation](owner-questions.md).

**Legend:** thick green arrows mark the happy path; dashed arrows mark exceptions. Blue is conversation, amber is a decision/input blocker, and red is failure investigation.

## Work loop

Resume existing in-scope work before selecting another issue. Prepare with the same implementing worker; obtain ordinary prerequisites and ask only the remaining owner choices. Load the basic instruction baseline once per run.

```mermaid
flowchart TD
    S["Start run: load basic instructions once"]
    Q{"Unblocked issue available?"}
    P["Select and prepare the issue"]
    R{"Ready to implement?"}
    W["Implement the full approved issue"]
    C["Existing required CI and merge rules"]
    M["Merge and record completion"]
    T["Report completion or remaining blockers"]

    O["Ask the owner"]
    B["Record blocker on GitHub"]
    F["Diagnose and repair"]

    S ==> Q
    Q ==>|Yes| P
    P ==> R
    R ==>|Happy path: yes| W
    W ==> C
    C ==>|Satisfied| M
    M ==> Q
    Q -->|No| T

    R -.->|Owner choice needed| O
    O -.->|Answered live| R
    O -.->|Owner absent or answer deferred| B
    R -.->|Required input unavailable| B
    B -.->|Continue with other work| Q

    W -.->|New choice or missing input| R
    W -.->|Observed failure or serious risk| F
    C -.->|Failed check| F
    F -.->|Repaired: resume approved work| W
    F -.->|Needs a decision or external input| R

    classDef happy fill:#e8f5e9,stroke:#2e7d32,color:#163f21,stroke-width:2px;
    classDef exception fill:#fff4d6,stroke:#b7791f,color:#5f370e,stroke-width:2px;
    classDef failure fill:#ffebee,stroke:#c62828,color:#7f1d1d,stroke-width:2px;
    classDef finish fill:#f3f4f6,stroke:#6b7280,color:#1f2937;

    class S,Q,P,R,W,C,M happy;
    class O,B exception;
    class F failure;
    class T finish;

    linkStyle 0,1,2,3,4,5,6 stroke:#2e7d32,stroke-width:3px;
```

- **Owner choice:** reuse settled preferences; ask about remaining user-facing behavior/scope even when reversible. `ask:live` asks now; `ask:github` (default) records unanswered questions and continues elsewhere.
- **Missing input or oversized work:** obtain available inputs first. Propose a usable split with the remaining obligations; obtain owner approval before smaller delivery unless already approved.
- **Failure:** investigate observed failures, concrete serious risks or explicitly required/requested checks. Keep repairs narrow and preserve required gates.
- **Completion:** record what landed and what remains unverified. Optional acceptance agents, extra tests, browser/deployment checks and AI reviews are absent from the normal path.

## Steering and incorporation

Broad ideas and prepared issue questions use the same conversation. An explicit live answer may guide the current authorized worker immediately. Recording waits for the owner's end signal; other workers learn decisions through incorporation.

```mermaid
flowchart TD
    D["Ideas and broad direction"]
    Q["Prepared worker questions"]
    S["Steering conversation"]
    A["Discuss, decide and revise in chat"]
    E{"Conversation finished or capture requested?"}
    I["Reconcile decisions and open questions"]
    G["Update owning Markdown and GitHub issues"]
    W["Decisions available to other workers"]

    D --> S
    Q --> S
    S --> A
    A --> E
    E -->|No: continue discussing| S
    E ==>|Yes: incorporate now| I
    I ==> G
    G ==> W

    classDef discussion fill:#e8f0fe,stroke:#3564a5,color:#183b66,stroke-width:2px;
    classDef incorporation fill:#e8f5e9,stroke:#2e7d32,color:#163f21,stroke-width:2px;

    class D,Q,S,A,E discussion;
    class I,G,W incorporation;

    linkStyle 5,6,7 stroke:#2e7d32,stroke-width:3px;
```

“Capture and incorporate now” completes reconciliation in the same session: apply corrections, update owning records and necessary issues, then report the result. No per-answer GitHub writes, extra confirmation or computer handoff. If a write fails, report the saved and unsaved portions for retry.

Only owner-approved generalizations become shared conventions. Atlas Decisions mean approved intent, Questions mean uncertainty, and `[x]` means built.
