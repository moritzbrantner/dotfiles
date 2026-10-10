---
name: acceptance-contract
description: Establish independent repository-owned behavioral and architecture acceptance before a coding agent changes behavior or architecture; protect expectations and choose fail-closed merge verification.
---

# Independent acceptance contract

This is a handoff procedure invoked by `work-loop` or `issue-preflight`, **not** a second issue queue, agent loop, test framework, or source of product truth. The owning repository's current product specification/ADRs, existing tests, local instructions, and installed conventions remain in place.

## Owner-approved product correctness decisions

1. Agents make routine implementation choices within established boundaries; ask the owner about consequential product or architecture choices.
2. The repository's approved product specification **and** independently verifiable acceptance contracts are authoritative.
3. An explicit, current specification wins over a contradictory test. Correct the test after independent verification; escalate ambiguous or outdated intent.
4. Unspecified behavior may be derived from established product principles and analogous behavior. Do not invent new principles; escalate when they do not determine an answer.
5. Agents maintain specifications and acceptance contracts when the changes follow existing decisions. New consequential product decisions require owner approval.
6. Prefer executable architecture tests for enforceable invariants; document only the architectural constraints that cannot be checked mechanically.
7. A distinct acceptance agent authors or independently establishes required acceptance evidence **before** the implementation agent starts.
8. Implementation agents may repair demonstrably non-semantic selectors, timing, and test infrastructure. Changes to mocks, fixtures, runners or helpers that could alter what a test exercises require independent acceptance re-verification, even when assertions are unchanged. Expected behavior changes also require independent re-verification against the specification.
9. Require an independent acceptance handoff for **behavioral and architectural changes**, not for genuinely behavior-preserving internal refactors.
10. Test stable public interfaces plus representative end-to-end user journeys; use architecture tests for structural ownership constraints.
11. Before merging, run deterministically selected affected tests, core smoke tests, and every new acceptance contract. Run the complete suite periodically.
12. If test dependency/impact evidence is incomplete or uncertain, run the **full applicable suite before merge**, and record the graph gap.
13. Product specifications and executable tests live in their owning repositories. Shared dotfiles skills define procedures; `coding-tooling` owns mechanical validation selection and evidence, not product semantics.

## Handoff for behavior or architecture changes

1. **Resolve intent.** Read the issue, comments, product/roadmap/ADRs, local `AGENTS.md`, conventions and current public behavior. Resolve a routine omission from settled principles and record the inference. If a consequential choice is unresolved, ask the owner **one** question and stop that issue until decided. Do not invent a second product-spec location when existing documentation suffices.
2. **Classify the actual change**, not its issue label. Behavioral fixes, new features, observable contract changes, and changes to authority/dependency boundaries require independent acceptance. A genuinely internal refactor with preserved behavior may reuse existing tests; a changed external contract is not merely a refactor.
3. **Assign a separate acceptance agent/context before production edits.** Give it the approved specification and source baseline, the promised observable outcome, and existing verification seams. Do not give it the implementation patch or proposed solution. It should independently derive tests of representative success/failure cases and architecture invariants, preferentially using existing framework, stable public APIs and real-browser journeys when needed. Reuse sufficient existing tests instead of manufacturing duplicates. New behavior tests should fail against the old behavior where practical; invariants may be green on the baseline but must detect a concrete violation.
4. **Record a reviewable handoff before production edits.** When acceptance tests are new or changed, commit them **before** implementation commits and open a draft PR with their initial evidence before implementation begins. When existing tests already suffice, the acceptance agent instead records their pinned paths, baseline revision, coverage rationale and observed evidence on the owning issue before implementation; **no empty or synthetic test commit** is required. Open the draft PR as soon as a meaningful change exists and link this earlier issue handoff. In the draft PR identify: authoritative specification path/revision; independent acceptance agent/context; test paths; acceptance commit SHA **if tests changed**, otherwise baseline SHA and existing-test evidence; what each test proves; any invariant that cannot be automated; and initial verification results. A commit sequence or claim does not mechanically prove independence.
5. **Implement in a distinct agent/context.** The implementation agent sees the approved contract and tests and may change production code. It may repair selectors, waits and test infrastructure only when they demonstrably preserve the exercised scenario, inputs, failures and assertions. Changes to mocks, fixtures, runners, shared helpers, timing or selectors that may alter acceptance coverage require **independent re-verification**, even if assertion text does not change; uncertainty counts as potential semantic impact. If an expected assertion contradicts an explicit current specification, the owner-approved intent remains authoritative and the independent acceptance agent verifies its **translation into tests** before assertions change; that agent does not approve or veto the owner's product decision. If resolving the mismatch requires a new product choice, escalate to the owner. Never bless implementation-authored tests as independent.
6. **Fail closed at merge.** Run all new acceptance tests on the current PR head, applicable executable architecture tests, and core smoke tests. Run only affected existing tests when the repository has a deterministic, verified impact mapping. When mapping is incomplete, unsupported, ambiguous or misses a shared boundary, run the full applicable suite; record the missing relationship for later improvement. Respect all existing required CI/evidence gates. Verify that a periodic full-suite run exists; if not, record a bounded follow-up instead of claiming coverage.
7. **Report the evidence, not an inference.** The PR records the specification, independent authoring/handoff, actual test commands and results, selection or full-suite fallback, and unresolved gaps. Never claim an unrun test passed or that independent authoring was mechanically verified by the commit history.

## If independent execution is unavailable

Do **not** let the same implementation agent impersonate the independent author or quietly change expected behavior. Leave the task PR as draft with the missing independent handoff clearly recorded; continue an unrelated actionable issue where possible. This is an execution dependency, not automatically an owner decision or a reason to create a new global label. Do not weaken established acceptance requirements to unblock the merge.

## Scope

Keep one coherent issue/PR and the repository's existing testing framework. Do not add product semantics to dotfiles or coding-tooling, define a universal product-spec schema, require special commit authors, create a second work loop, or change established CI/publishing authority.
