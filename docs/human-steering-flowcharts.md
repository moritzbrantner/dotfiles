# Human steering and coding loops

These diagrams explain the **human-facing process**, the reusable skills, the implementation
loop, and the sources of authority. They do not introduce a new orchestrator or policy.
The procedures in `skills/*/SKILL.md` and the owning repository's local instructions are
operationally authoritative. For the existing detailed work-loop flowchart, see the
[dotfiles README](../README.md#work-loop-mental-model).

## 1. Your loop — use `/steer`

Start in the repository you want to shape. The agent identifies **one meaningful human
judgment at a time**. It must not treat a green CI check as your product approval.

```mermaid
flowchart TD
    S(["You invoke /steer"]) --> READ["Read repository rules, Atlas and product evidence"]
    READ --> ACTION{"What needs your judgment?"}
    ACTION -->|Define, decide, approve or revise| ASK["Ask one concrete question"]
    ASK --> ANSWER["You answer, adjust or defer"]
    ANSWER --> RESOLVED{"Intent settled?"}
    RESOLVED -->|Yes| PERSIST["Record owner-approved intent in owning Atlas or docs"]
    RESOLVED -->|No| QUESTION["Keep the Question unresolved"]
    ACTION -->|Verify| DEMO["Try real product with acceptance evidence"]
    DEMO --> MATCH{"Does it match your intent?"}
    MATCH -->|Yes| FEEDBACK["Record owner feedback, separately from CI"]
    MATCH -->|No| CAUSE{"Product definition or implementation?"}
    CAUSE -->|Definition| ASK
    CAUSE -->|Implementation| PROPOSE["Propose issue or acceptance correction"]
    PERSIST --> PREF["issue-preflight: reconcile approved decisions"]
    PREF --> NEEDED{"Necessary uncovered work?"}
    NEEDED -->|No| MORE
    NEEDED -->|Yes| MERGED{"Required intent change authoritative?"}
    MERGED -->|Yes or not applicable| ISSUE["Update existing or create bounded issue"]
    MERGED -->|Not yet| PENDING["Reconcile issue, but block implementation until Atlas PR merges"]
    ISSUE --> MORE{"Another consequential gap?"}
    PENDING --> MORE
    QUESTION --> MORE
    FEEDBACK --> MORE
    PROPOSE --> MORE
    MORE -->|Yes| READ
    MORE -->|No| DONE(["Finish session"])
    ACTION -->|Nothing material| DONE
```

`Define`, `decide`, `approve`, and `revise` change **intent** when you answer. `Verify`
checks the actual product against that intent. An implementation mismatch proposes a
correction; it does **not** automatically change your Decisions. Recording an approved
answer also authorizes **automatic issue reconciliation**. It does not authorize
implementation, merging or deploying.

## 2. Which skills are used?

`/steer` is a **single human entry point**, not another worker. Specialized skills retain
their original responsibilities; they can still be invoked directly.

```mermaid
flowchart TD
    HUMAN["Human starts /steer"] --> ROUTE{"Which specialist is useful?"}
    ROUTE -->|New or unclear direction| GRILL["grill: shape product intent"]
    ROUTE -->|Historical decisions or drift| AUDIT["atlas-audit: reconstruct evidence"]
    ROUTE -->|Issue awaits owner| UNBLOCK["unblock: resolve blocker"]
    ROUTE -->|Check product| VERIFY["Review real demo and evidence"]
    GRILL --> APPROVAL{"Explicitly owner-approved now or previously?"}
    AUDIT --> APPROVAL
    UNBLOCK --> APPROVAL
    APPROVAL -->|Yes| ATLAS["Owning Decision Atlas or existing product docs"]
    APPROVAL -->|Unresolved| QUESTION["Keep Question open; never invent approval"]
    QUESTION --> HUMAN
    VERIFY --> HUMAN
    ATLAS --> PREF["issue-preflight: auto reconcile approved intent"]
    PREF --> NEED{"Necessary issue changes?"}
    NEED -->|No| END(["Finish steering"])
    NEED -->|Yes| ISSUES["Update or create bounded GitHub issues"]
    ISSUES --> END
    END -.->|Separately invoked later| LOOP["/work-loop: implementation"]
    LOOP -->|New blocking Question| UNBLOCK
    LOOP --> QUALIFY{"Behavior or architecture change?"}
    QUALIFY -->|Yes| CONTRACT["acceptance-contract: independent checks before code"]
    QUALIFY -->|No, preserved| BUILD["One implementation worker per repository"]
    CONTRACT --> BUILD
    BUILD --> VERIFY
```

`atlas-audit` is investigative; implementation history or an agent proposal is not owner
approval, even when historically evidenced. `unblock` is the fallback for questions discovered while working. New major
features go through `grill` **before** implementation. `issue-preflight` automatically
reconciles approved steering Decisions, but cannot start `work-loop` or make speculative
issues. An issue linked to an unmerged Atlas PR is not yet actionable.

## 3. The agent implementation loop

Once there is approved direction and an authorized actionable issue, implementation is
mechanical wherever possible. Exactly **one active implementation worker per repository**;
independent acceptance authorship happens **before** changing behavior/architecture, not
as a simultaneous competing writer.

```mermaid
flowchart TD
    START(["work-loop: next natural scan"]) --> EXIST{"Open PR or live verification handoff?"}
    EXIST -->|Yes| RESUME["Finish or repair PR; verify deployment only when promised"]
    RESUME --> START
    EXIST -->|No| PICK{"Actionable evidenced issue?"}
    PICK -->|No| BLOCK{"An owner question blocks work?"}
    BLOCK -->|Yes| UNBLOCK["unblock: ask and persist answer"]
    UNBLOCK --> START
    BLOCK -->|No| END(["No actionable work: stop"])
    PICK -->|Yes| PREF["issue-preflight: Atlas and scoped daq"]
    PREF --> SOURCE{"Required intent change still unmerged?"}
    SOURCE -->|Yes| HOLD["Keep affected issue pending; do not implement"]
    HOLD --> START
    SOURCE -->|No or not applicable| Q{"Consequential choice unresolved?"}
    Q -->|Yes| PARK["Keep needs-decision; work elsewhere"]
    PARK --> START
    Q -->|No| CHANGE{"Behavior or architecture change?"}
    CHANGE -->|Yes| CONTRACT["acceptance-contract: independent tests first"]
    CHANGE -->|No, truly preserved| IMPLEMENT["One worker implements a bounded slice"]
    CONTRACT --> IMPLEMENT
    IMPLEMENT --> CHECK["Affected tests, browser preview, CI, targeted review"]
    CHECK --> PASS{"All gates pass?"}
    PASS -->|No| IMPLEMENT
    PASS -->|Yes| MERGE["Guarded merge"]
    MERGE --> LIVE_NEEDED{"Post-merge publication promised?"}
    LIVE_NEEDED -->|Yes| LIVE{"Published scenario verified?"}
    LIVE_NEEDED -->|No| EVIDENCE["Record applicable acceptance evidence"]
    LIVE -->|Yes| EVIDENCE
    LIVE -->|No or pending| REOPEN["Keep or reopen original issue with evidence gap"]
    EVIDENCE --> START
    REOPEN --> START
```

`workctl` checks mechanical PR readiness; it cannot approve product intent. Any required owning product-intent change must already be merged before its issue
becomes actionable. Independent
acceptance authorship is required for behavior or architecture changes, not a genuinely
behavior-preserving refactor. Post-merge live verification applies only when the issue
contract promises a published scenario. A merged feature
or green unit suite is not evidence that the published end-to-end scenario works. If the
live check is missing, stale, failing or still publishing, preserve the issue and evidence
for the next natural scan; do not poll or declare success prematurely. If a slice is
oversized, create or reuse focused successors rather than hiding unfinished scope.

## 4. Where knowledge and evidence live

```mermaid
flowchart LR
    OWNER["Human product authority"] -->|Approves intent| ATLAS["Owning Atlas: hierarchical Decisions and Questions"]
    ATLAS -->|Stable IDs| ISSUES["GitHub issues: flat work queue"]
    ATLAS -->|Query derived index| DAQ["daq: retrieval, not authority"]
    DAQ --> AGENT["steer, issue-preflight, work-loop"]
    AGENT -->|Issue changes separately authorized| ISSUES
    ATLAS -->|Specifies outcomes| CONTRACT["Independent acceptance contract"]
    ISSUES --> PR["PRs and code: execution state"]
    CONTRACT -->|Defined before behavior changes| PR
    PR --> PROOF["Tests, browser evidence and live product"]
    PROOF -->|Human observes result| OWNER
```

The **Decision Atlas is a hierarchy** for durable owner-controlled intent; its default
semantic leaves are only Decisions and Questions. **GitHub issues form a mostly flat
execution queue** and PRs track implementation. `daq` is a derived way to query Atlas
source, not another database of truth. Existing vision, roadmap and ADR documentation
can add detail without overriding current Decisions. Tests and demos are evidence, not
owner approval. Where no Atlas exists, use the existing authoritative product documents
rather than imposing a competing Atlas.

## What you actually do

Launch `/steer`, answer one concrete product question (or try one real scenario), and
adjust or approve the outcome. The agent records approved intent in a reviewable
repository change and **automatically reconciles only necessary bounded GitHub issues**.
Issues referencing unmerged product-intent PRs remain non-actionable until that source merges.
A separately invoked `/work-loop` then handles implementation, technical verification,
review, guarded merge and published-scenario checks. If the visible result is wrong, return to `/steer` to
distinguish changed intent from defective implementation.
