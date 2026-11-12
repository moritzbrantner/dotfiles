---
name: work-loop
description: Implement and merge unblocked GitHub issues with happy-path-first execution; investigate only concrete failures or high-consequence risks.
---

# Work loop

**Happy path is the default.** Implement the specified behavior and assume surrounding systems work. Do not preemptively write acceptance tests, assign an independent acceptance agent, run extra test suites, inspect browser deployments, request AI reviews, or build diagnostic infrastructure. Existing mandatory repository/CI checks and branch protection still apply. Report unverified behavior as **unverified**, not tested.

GitHub issues, native `blockedBy` links, PRs and the checkout hold execution state. Repository instructions, installed conventions and approved decisions govern implementation. Use `node ~/.local/share/coding-agent/workctl.mjs` for PR readiness/merges. No extra queues, claims or labels beyond `needs-decision`.

## Start once

Use current merged personal skills; refresh their source once if needed, preserving local edits. Load the basic instructions at startup and keep that baseline for the run. Do not refresh or recheck it per issue. Apply explicit owner redirection immediately; read newly relevant repository/path instructions as needed. Repository-pinned conventions change only through their normal version update.

Use `ask:github` by default, or `ask:live` when requested. Follow [owner questions and incorporation](../../docs/owner-questions.md), including end-of-conversation capture. Switching ask mode does not restart the run.

## Workers

**One worker owns an issue through implementation and repair.** The coordinator scans, selects, asks owner questions and owns integration; the worker performs steps 3–5, including required validation and authorized PR publication. The coordinator may inspect the diff for integration, but does not duplicate implementation investigation or edit alongside the worker. Workers do not merge, arm auto-merge, start landing processes or register PR watches.

Start each new issue with a fresh, bounded context, not the coordinator's conversation history. With native Codex spawning, use `fork_turns="none"`; with other runtimes use their supported isolated-context mode and a short task brief. Do not switch providers or create another execution layer merely to obtain isolation. If history inheritance cannot be disabled, disclose that limitation once. Supply:

- Repository, checkout, branch/base and issue; approved scope and completion criteria.
- Ask mode, owner answers, relevant decisions, and authority to commit, push and open/update the PR.
- Already resolved policy context: selected file paths, `sourceRevision` and local exceptions. Read the applicable files; a handoff alone does not require another resolution. Resolve again when policy inputs change or validation requires current evidence.
- For repairs, the current PR/head, first failure, relevant findings and checks already run.

Reuse the issue's worker for CI fixes and required follow-up verification. A phase transition alone does not justify another agent. If that worker is unavailable or its context is no longer useful, replace it with a bounded handoff after ending its ownership. Never assign a second issue to the same worker. Return the PR URL/head, checks and their source revision, unresolved findings, blockers and any directly available usage evidence; keep full logs out of the handoff. Independent review is reserved for required gates, explicit requests or concrete risks under **When to investigate**.

Keep at most one active implementation worker per repository, using its normal checkout by default. Use isolation only to protect unrelated work or satisfy an explicit request/runtime requirement. Disposable worker clones, when needed, live in `~/.cache/agent-work/<repo>-<task>`; never pass an ordinary checkout to clone cleanup. Follow the runtime's checkout lifecycle rather than creating a competing one.

Use `workctl` output directly for readiness and deterministic filtering. The coordinator handles short comments and status summaries itself; do not spawn queue scanners or text summarizers for already structured results or tiny transformations. Delegate substantial independent investigation only when its result justifies another context.

## Blender

For 3D asset work, adapt a CC0 source first (the Blender MCP `search_assets`, Kenney, Quaternius, Poly Haven); author from scratch only when nothing fits. Shape, inspect and review in the owner's **live Blender through the Blender MCP tools** (`mcp__blender__*`): call `get_addon_status` once, then use `execute_blender_code`, `get_scene_info` and `look` for quick single renders. Do not iterate with blind headless scripts. Headless `blender -b` remains for the repository's reproducible scripted builds and tests once a shape is settled. There is one live Blender, so the coordinator lets only one worker use it at a time and names that worker in the brief. If the MCP tools are unavailable, ask the owner to start Blender and click *Start MCP Server* (`ask:live`), or note "live Blender unavailable" in the PR and continue headless (`ask:github`). Never enable paid generators or sources.

## Loop

1. **Finish in-scope work first.** Inspect the branch and uncommitted changes; resume identifiable work or an existing PR without overwriting user edits. Use `workctl scan <repo>` in a repository-scoped session, scoped scans for a selected set of repositories, and global `workctl scan` only for global scope (bounded repository queries if unavailable); a scan is an observation, so inspect the PR freshly before merging: repair `broken`, leave `waiting`, merge `ready` after checking current head, mergeability, actual diff and required checks. A draft is unfinished; ready is a merge candidate. Never merge a stacked PR into another feature branch.

2. **Select an issue.** Honor the owner's repository, journey and stop scope. Otherwise choose the oldest eligible open issue by creation time, repository name and number. Exclude bot/meta issues, active closing PRs, real `needs-decision` blockers and open native dependencies. Ignore product priorities, roadmap phases, perceived scarcity and unrelated Atlas Questions. At the normal scan, reconcile already captured owner answers/digests through the shared protocol; do not leave answered issues blocked.

3. **Prepare before coding.** Using the loaded instruction baseline, the issue's fresh worker examines the issue and comments with `workctl issue <repo>#<n>` (long bodies print an outline: use `--section <heading>`; on re-checks use `--since <time>`), plus relevant workflow/code, approved decisions (scoped `daq` or Markdown) and available inputs. Obtain ordinary prerequisites. Identify remaining owner questions and settle them before affected implementation; later discoveries may require more questions. Approved broad direction does not settle unspecified user-facing behavior. Use `issue-preflight` for scope ambiguity and `steer` for broader direction; no separate preparation agent, document or question quota.

4. **Implement the full approved scope.** Use a task branch in the normal checkout, with **one active implementation writer per repository**. Resume stopped work without simultaneous writers. Choose ordinary technical details and behavior-preserving repairs yourself. Deliver the real integrated user outcome with required inputs. Make a coherent change, then open/update one PR targeting default; no placeholder PR, repeated progress pushes or stacked PRs.

5. **Handle exceptions.** In `ask:live`, ask the remaining owner choice and use an explicit answer immediately within authorized work; persist it at the owner's end-of-conversation signal. In `ask:github`, or when a live answer is deferred, post `### Owner questions`, add `needs-decision`, and continue other eligible work. Obtain available tools, fixtures and public dependencies yourself; block on genuinely unavailable required inputs rather than substituting them. Put cross-repository prerequisites in their owning issues/PRs with native dependencies; follow upstream work when its checkout is available. For an oversized or partly blocked issue, propose a usable split and its remaining obligations; obtain owner approval before delivering the smaller portion unless that split is already approved. Keep undelivered requirements open.

6. **Integrate through the coordinator.** Inspect current `workctl pr <repo>#<n>`, the actual diff, required checks and unresolved findings. Return `broken` to the same issue worker, merge `ready` with `workctl merge`, and leave `waiting` to one runtime-owned waiting mechanism. In T3, follow its PR linking/watch instructions: finish needed repairs and pushes, register `watch_pull_request` when gates remain, and end the turn; do not also run background `land` or `wait`. Outside T3, the coordinator may own one bounded background `workctl land` operation; read [landing and waiting](references/integration.md) for command details and cleanup. Never combine watchers and background polling for the same PR. Preserve repository-required reviews, truth-core's all-checks-green gate and branch protection. Do not bypass protection or claim unrun checks passed. Approved non-executable instructions may go directly to default when allowed; executable contracts, configuration and code use normal merge rules.

7. **Repeat within scope.** A merged PR proves implementation, not an independently tested or published user journey. Record completion and mark Atlas items built only to the extent delivered. Do not reopen issues solely because optional live verification is absent. For a known deployment/user failure, reopen the owning issue and repair it. If only external gates remain, record the pending PR/head and work another in-scope issue without polling. Return to issue selection, not startup. Honor an explicit stop. During the sample below, include its compact efficiency record when closing or handing off an issue.

## When to investigate

Escalate from happy path only for an **observed** build/CI/runtime failure, a reproducible user-visible regression, a concrete serious security/data-integrity risk, an explicit repository-required gate, or a direct owner request. Then:

- Preserve the first failure and its source revision. Reproduce the failing boundary once with the narrowest useful check; fix the cause, add a focused regression when warranted, and rerun the affected required gate. Use `acceptance-contract` for explicitly requested independent acceptance or a serious failure whose behavior needs an independent oracle.
- Reuse passing checks at the same revision and relevant inputs; a coordinator handoff alone does not invalidate them. Rerun affected checks after relevant edits and complete required gates, without duplicating the worker's full gate merely for reassurance.
- Do not turn one failure into a global audit, multiple full-suite repeats, a re-review loop, new infrastructure or speculative tests. Keep a failed required check failed until repaired; never replace it with a green unrelated check.
- If **every** missing or failed check is confirmed to be a billing/spending-limit startup failure and no other check is pending, run feasible required jobs locally at the PR head, record evidence, and merge with `gh pr merge` only if all other gates pass. Never use `--admin` or bypass protection; ordinary CI failures do not qualify.

If no issue is actionable, report completion, known failures, unverified behavior and exact blockers. In live mode, offer genuine owner questions; otherwise stop without inventing work.

## Efficiency evidence

For the next ten issues handled after adopting this revision, include an issue-level efficiency record in the existing coordinator completion/handoff, using [the measurement guide](references/efficiency.md). Include unfinished and blocked attempts so they do not disappear from the accounting. Report only directly available usage, run IDs and timestamps. If telemetry is not exposed, the coordinator notes that once per loop run, tells workers to omit it, and leaves those fields out of subsequent updates and the final summary. Do not probe again on each issue or PR wake; resume reporting only if new telemetry becomes available. Missing values are never zero or estimated from transcript length. This is an informational sample, not a new delivery gate, scheduler or telemetry service. After the sample, report observed overhead and quality outcomes before proposing further changes; do not claim savings without a comparable baseline.
