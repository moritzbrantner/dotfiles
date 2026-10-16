import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workLoop = readFileSync(new URL("./SKILL.md", import.meta.url), "utf8");
const acceptance = readFileSync(
  new URL("../acceptance-contract/SKILL.md", import.meta.url),
  "utf8",
);

// Guard the two independently consumed instruction entry points against policy drift.
// These are instruction-contract tests, not a simulated agent or a claim of CI acceptance.
test("expected-red acceptance commits hand off on the issue without a synthetic PR", () => {
  assert.match(workLoop, /tests-first commits on the \*\*same task branch\*\*/);
  assert.match(workLoop, /baseline result, source revision and independent context on the owning issue/);
  assert.match(workLoop, /Do not open an acceptance-only draft PR/);
  assert.match(workLoop, /meaningful implementation commit exists/);
  assert.match(acceptance, /commit them \*\*before\*\* implementation commits on the same task branch/);
  assert.match(acceptance, /baseline result \(including expected red\)/);
  assert.match(acceptance, /Do not create an acceptance-only draft PR/);
});

test("sufficient existing tests require an independent handoff, not a dummy commit", () => {
  assert.match(workLoop, /If existing tests already suffice, record their paths/);
  assert.match(workLoop, /no empty or artificial test commit is required/);
  assert.match(acceptance, /When existing tests already suffice, record their pinned paths/);
  assert.match(acceptance, /no empty or synthetic test commit/);
});

test("legacy acceptance-only drafts resume on the same branch", () => {
  assert.match(workLoop, /Resume existing acceptance-only draft PRs on their original branches/);
  assert.match(acceptance, /Resume a pre-existing acceptance-only draft PR on the same branch/);
  assert.match(workLoop, /If a repository-local rule requires an earlier PR, follow that rule/);
});

test("postimplementation failures still block merge, even after an expected-red baseline", () => {
  assert.match(acceptance, /red acceptance baseline does not waive any failure after implementation/);
  assert.match(acceptance, /every required check and current-head acceptance must pass before merge/);
  assert.match(workLoop, /repair `broken`, leave `waiting`/);
  assert.match(workLoop, /Gate merge on new or independently verified existing acceptance contracts/);
});
