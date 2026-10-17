import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workLoop = readFileSync(new URL("./SKILL.md", import.meta.url), "utf8");
const acceptance = readFileSync(
  new URL("../acceptance-contract/SKILL.md", import.meta.url),
  "utf8",
);
const preflight = readFileSync(new URL("../issue-preflight/SKILL.md", import.meta.url), "utf8");

test("routine implementation starts without speculative verification", () => {
  assert.match(workLoop, /Happy path is the default/);
  assert.match(workLoop, /Do not preemptively write acceptance tests/);
  assert.match(acceptance, /Not part of the normal happy path/);
  assert.match(preflight, /not a tests-first handoff/);
});

test("existing required merge gates remain binding", () => {
  assert.match(workLoop, /mandatory repository\/CI checks and branch protection still apply/);
  assert.match(workLoop, /repair .broken., leave .waiting./);
  assert.match(acceptance, /required failed check remains blocking until it passes/);
});

test("concrete failures trigger bounded investigation, not a global audit", () => {
  assert.match(workLoop, /observed.*build\/CI\/runtime failure/);
  assert.match(workLoop, /Preserve the first failure/);
  assert.match(workLoop, /Do not turn one failure into a global audit/);
  assert.match(acceptance, /specific observable failure/);
});

test("outcomes are not falsely claimed verified", () => {
  assert.match(workLoop, /unverified.*not tested/);
  assert.match(workLoop, /A merged PR proves implementation, not an independently tested/);
  assert.match(preflight, /Distinguish expected behavior from behavior actually tested/);
});

test("scope, decisions and dependencies still govern execution", () => {
  assert.match(workLoop, /oldest eligible open issue/);
  assert.match(workLoop, /one active implementation writer per repository/i);
  assert.match(workLoop, /needs-decision/);
  assert.match(preflight, /reconcile.*approved.*Decisions/i);
});

test("owner forks are asked asynchronously with one shared threshold", () => {
  const steer = readFileSync(new URL("../steer/SKILL.md", import.meta.url), "utf8");
  const unblock = readFileSync(new URL("../unblock/SKILL.md", import.meta.url), "utf8");
  const formats = readFileSync(new URL("../../docs/owner-questions.md", import.meta.url), "utf8");
  assert.match(workLoop, /never waiting or relaying questions live/);
  assert.match(workLoop, /agent default/);
  assert.match(preflight, /Fork coverage \(creation gate\)/);
  assert.match(steer, /owner fork/);
  assert.match(unblock, /\/unblock brief/);
  assert.match(formats, /ANSWERS <date>/);
  assert.match(formats, /never mark a "maybe" as DECIDE/i);
});
