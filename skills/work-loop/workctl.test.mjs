import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  checkState,
  classify,
  codexReview,
  mergePolicy,
  main,
  markdownSections,
  parseTarget,
  parseWait,
  renderIssue,
  scanQuery,
  selectMergeMethod,
  unansweredBlockingCodexFindings,
  wait,
} from "./workctl.mjs";

test("CLI entry point follows symlinks while imports remain inert", () => {
  const directory = mkdtempSync(join(tmpdir(), "workctl-entry-"));
  const source = fileURLToPath(new URL("./workctl.mjs", import.meta.url));
  const link = join(directory, "workctl linked.mjs");
  const chainedLink = join(directory, "workctl.mjs");
  try {
    symlinkSync(source, link, "file");
    symlinkSync("workctl linked.mjs", chainedLink, "file");
    for (const entry of [source, link, chainedLink]) {
      for (const flags of [[], ["--preserve-symlinks-main"]]) {
        const result = spawnSync(process.execPath, [...flags, entry], {
          cwd: directory,
          encoding: "utf8",
          timeout: 10_000,
        });
        assert.equal(result.status, 1, `usage exit code for ${entry}: ${result.stderr}`);
        assert.equal(result.stdout, "");
        assert.match(JSON.parse(result.stderr).error, /^usage: workctl /);
      }
    }
    const importer = join(directory, "importer.mjs");
    writeFileSync(importer, 'import "./workctl.mjs";\n');
    for (const flags of [[], ["--preserve-symlinks"]]) {
      const result = spawnSync(process.execPath, [...flags, importer], {
        cwd: directory,
        encoding: "utf8",
        timeout: 10_000,
      });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, "");
      assert.equal(result.stderr, "");
    }
    symlinkSync("cycle.mjs", join(directory, "cycle.mjs"), "file");
    for (const argument of [
      source,
      link,
      chainedLink,
      "definitely-not-a-file",
      join(importer, "child"),
      "cycle.mjs",
    ]) {
      const result = spawnSync(
        process.execPath,
        ["--input-type=module", "-e", 'import "./workctl.mjs";', argument],
        { cwd: directory, encoding: "utf8", timeout: 10_000 },
      );
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, "");
      assert.equal(result.stderr, "");
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("targets", () => {
  assert.deepEqual(parseTarget("ui#66"), {
    owner: "moritzbrantner",
    repo: "ui",
    number: 66,
  });
  for (const repo of ["mmorpg", "arpg", "zoo", "my-farm"]) {
    assert.equal(parseTarget(`${repo}#454`).owner, "moenarch-games");
  }
  assert.equal(parseTarget("moritzbrantner/zoo#1").owner, "moritzbrantner");
  assert.deepEqual(parseTarget("x/y#12"), { owner: "x", repo: "y", number: 12 });
  assert.deepEqual(parseTarget("https://github.com/x/y/pull/12"), {
    owner: "x",
    repo: "y",
    number: 12,
  });
  assert.deepEqual(parseTarget("https://github.com/x/y/issues/7"), {
    owner: "x",
    repo: "y",
    number: 7,
  });
});

function issueFixture(overrides = {}) {
  return {
    title: "Ship it",
    state: "OPEN",
    stateReason: null,
    labels: { nodes: [{ name: "needs-decision" }] },
    blockedBy: { nodes: [{ number: 3, state: "OPEN", repository: { nameWithOwner: "x/dep" } }] },
    closedByPullRequestsReferences: { nodes: [{ number: 9, state: "OPEN" }] },
    body: "Intro\n<!-- hidden -->\n<details><summary>Log</summary>\n\nline\nline\n</details>\n",
    comments: {
      totalCount: 3,
      nodes: [
        {
          author: { login: "a" },
          createdAt: "2026-10-01T10:00:00Z",
          isMinimized: false,
          body: "old",
        },
        {
          author: { login: "b" },
          createdAt: "2026-10-02T10:00:00Z",
          isMinimized: true,
          body: "spam",
        },
        { author: null, createdAt: "2026-10-03T10:00:00Z", isMinimized: false, body: "new" },
      ],
    },
    ...overrides,
  };
}

test("issue view condenses markup, hides minimized comments and lists dependencies", () => {
  const text = renderIssue("x/y#1", issueFixture());
  assert.match(text, /^x\/y#1 OPEN: Ship it\n/);
  assert.match(text, /labels: needs-decision \| blocked by: x\/dep#3 OPEN \| closing PRs: #9 OPEN/);
  assert.match(text, /\[Log: 5 lines hidden, --full shows them\]/);
  assert.doesNotMatch(text, /hidden -->|spam/);
  assert.match(text, /--- 2 comments \(1 minimized hidden\)/);
  assert.match(text, /@ghost 2026-10-03 10:00:\nnew/);
  assert.match(renderIssue("x/y#1", issueFixture(), { full: true }), /<details>/);
});

test("issue view --since shows only newer comments without the body", () => {
  const text = renderIssue("x/y#1", issueFixture(), { since: "2026-10-02T00:00:00Z" });
  assert.doesNotMatch(text, /Intro|old/);
  assert.match(text, /--- 1 comments \(1 minimized hidden, 1 before 2026-10-02T00:00:00Z hidden\)/);
});

test("long issue bodies print an outline and sections on request", () => {
  const body = `Preface\n\n## Alpha\n${"aaaa\n".repeat(3000)}### Alpha detail\nx\n## Beta\nbeta text\n`;
  const outline = renderIssue("x/y#1", issueFixture({ body }));
  assert.match(outline, /outline below/);
  assert.match(
    outline,
    /Preface\n\n {2}Alpha \(3003 lines\)\n {4}Alpha detail \(2 lines\)\n {2}Beta \(2 lines\)/,
  );
  assert.doesNotMatch(outline, /beta text/);
  const section = renderIssue("x/y#1", issueFixture({ body }), { sections: ["beta"] });
  assert.match(section, /## Beta\nbeta text/);
  assert.doesNotMatch(section, /Alpha/);
  assert.deepEqual(
    markdownSections("```\n# not a heading\n```\n# Real").map((s) => s.title),
    ["Real"],
  );
});

test("CI states", () => {
  assert.equal(checkState([], []).state, "green");
  assert.equal(checkState([{ name: "ci", status: "in_progress" }], []).state, "pending");
  assert.equal(
    checkState([{ name: "ci", status: "completed", conclusion: "failure" }], []).state,
    "failed",
  );
  assert.equal(
    checkState([{ name: "ci", status: "completed", conclusion: "neutral" }], []).state,
    "green",
  );
});

test("Codex review status is informational rather than a latest-head merge gate", () => {
  const user = { login: "chatgpt-codex-connector[bot]", id: 199175422 };
  const completed = {
    user,
    body:
      "<!-- codex-pull-request-review-summary -->\n" +
      "| 📝 **Code Review** | ✅ **Completed** now | `ef9ecb8` | Manual |",
  };
  assert.deepEqual(codexReview([completed], "ef9ecb8b76ff"), {
    state: "complete",
    commit: "ef9ecb8",
  });
  assert.deepEqual(codexReview([completed], "aaaaaaaa"), {
    state: "stale",
    commit: "ef9ecb8",
  });
  assert.equal(codexReview([], "aaaaaaaa").state, "absent");
  assert.equal(
    codexReview([{ ...completed, body: completed.body.replace("Completed", "Running") }], "ef9ecb8")
      .state,
    "running",
  );
  assert.equal(
    codexReview([{ ...completed, body: completed.body.replace("`ef9ecb8`", "") }], "ef9ecb8").state,
    "unknown",
  );
  assert.equal(
    codexReview([{ ...completed, user: { login: "fake-codex-user", id: 123 } }], "ef9ecb8").state,
    "absent",
  );
});

test("only untriaged high-priority Codex comments block readiness", () => {
  const codex = { login: "chatgpt-codex-connector[bot]", id: 199175422 };
  const report = (id, priority) => ({
    id,
    in_reply_to_id: null,
    user: codex,
    body: `**![${priority} Badge](url) Defect**\nEvidence`,
  });
  const p0 = report(1, "P0");
  const p1 = report(2, "P1");
  const p2 = report(3, "P2");
  const p3 = report(4, "P3");
  assert.equal(unansweredBlockingCodexFindings([p0, p1, p2, p3]), 2);
  assert.equal(unansweredBlockingCodexFindings([p2, p3]), 0);
  assert.equal(
    unansweredBlockingCodexFindings([
      { ...p2, body: "**Possible regression**\nP1 mentioned in the explanation." },
    ]),
    0,
  );
  assert.equal(
    unansweredBlockingCodexFindings([
      p1,
      { id: 5, in_reply_to_id: 2, user: { login: "owner" }, author_association: "OWNER" },
    ]),
    0,
  );
  assert.equal(
    unansweredBlockingCodexFindings([
      p1,
      { id: 6, in_reply_to_id: 2, user: { login: "stranger" }, author_association: "NONE" },
    ]),
    1,
  );
  assert.equal(unansweredBlockingCodexFindings([{ ...p1, user: { login: "spoofed" } }]), 0);
});

test("PR classification", () => {
  const ready = {
    pr: {
      state: "open",
      draft: false,
      mergeable: true,
      mergeable_state: "clean",
    },
    checks: { state: "green", failed: [], pending: [] },
    review: { state: "complete" },
    blockingFindings: 0,
  };

  assert.equal(classify(ready).state, "ready");
  for (const review of [{ state: "absent" }, { state: "running" }, { state: "stale" }]) {
    assert.equal(classify({ ...ready, review }).state, "ready");
  }
  assert.equal(
    classify({
      ...ready,
      checks: { state: "pending", failed: [], pending: ["ci"] },
    }).state,
    "waiting",
  );
  assert.equal(classify({ ...ready, blockingFindings: 1 }).state, "broken");
  assert.equal(
    classify({
      ...ready,
      pr: { ...ready.pr, mergeable: false, mergeable_state: "dirty" },
    }).state,
    "broken",
  );
  assert.equal(
    classify({
      ...ready,
      pr: { ...ready.pr, mergeable: true, mergeable_state: "blocked" },
    }).state,
    "waiting",
  );
  assert.deepEqual(
    classify({
      ...ready,
      pr: { ...ready.pr, base: { ref: "agent/parent" } },
      defaultBranch: "main",
    }),
    {
      state: "waiting",
      reasons: ["base agent/parent is not default branch main"],
    },
  );
});

test("Renovate PRs skip review and all PRs retain CI and defect gates", () => {
  const pr = {
    state: "open",
    draft: false,
    user: { login: "renovate[bot]", type: "Bot" },
    mergeable: true,
    mergeable_state: "clean",
  };
  const ready = {
    pr,
    checks: { state: "green", failed: [], pending: [] },
    review: { state: "absent" },
    blockingFindings: 0,
  };

  assert.deepEqual(classify(ready), { state: "ready", reasons: [] });
  for (const user of [
    { login: "owner", type: "User" },
    { login: "dependabot[bot]", type: "Bot" },
    { login: "renovate[bot]", type: "User" },
  ]) {
    assert.equal(classify({ ...ready, pr: { ...pr, user } }).state, "ready");
  }
  assert.equal(
    classify({ ...ready, checks: { state: "pending", failed: [], pending: ["ci"] } }).state,
    "waiting",
  );
  assert.equal(
    classify({ ...ready, checks: { state: "failed", failed: ["ci"], pending: [] } }).state,
    "broken",
  );
  assert.equal(classify({ ...ready, blockingFindings: 1 }).state, "broken");
  assert.equal(
    classify({ ...ready, pr: { ...pr, mergeable: false, mergeable_state: "dirty" } }).state,
    "broken",
  );
});

test("merge method follows repository settings", () => {
  assert.equal(
    selectMergeMethod({
      allow_merge_commit: true,
      allow_squash_merge: true,
      allow_rebase_merge: true,
    }),
    "--merge",
  );
  assert.equal(
    selectMergeMethod({
      allow_merge_commit: false,
      allow_squash_merge: true,
      allow_rebase_merge: true,
    }),
    "--squash",
  );
  assert.equal(
    selectMergeMethod({
      allow_merge_commit: false,
      allow_squash_merge: false,
      allow_rebase_merge: true,
    }),
    "--rebase",
  );
  assert.equal(
    selectMergeMethod(
      {
        allow_merge_commit: true,
        allow_squash_merge: true,
        allow_rebase_merge: true,
      },
      [{ type: "required_linear_history" }],
    ),
    "--squash",
  );
  assert.equal(
    selectMergeMethod(
      {
        allow_merge_commit: true,
        allow_squash_merge: true,
        allow_rebase_merge: true,
      },
      [],
      { required_linear_history: { enabled: true } },
    ),
    "--squash",
  );
  assert.equal(
    selectMergeMethod(
      {
        allow_merge_commit: true,
        allow_squash_merge: true,
        allow_rebase_merge: true,
      },
      [
        {
          type: "pull_request",
          parameters: { allowed_merge_methods: ["rebase"] },
        },
      ],
    ),
    "--rebase",
  );
});

test("merge queue keeps the head branch", () => {
  assert.deepEqual(
    mergePolicy(
      {
        allow_merge_commit: true,
        allow_squash_merge: true,
        allow_rebase_merge: true,
      },
      [{ type: "merge_queue" }],
    ),
    { method: "--merge", deleteBranch: false, queue: true },
  );
});

test("scan can be scoped to one repository", () => {
  assert.equal(scanQuery("o"), "is:pr is:open user:o sort:updated-desc");
  assert.equal(
    scanQuery(),
    "is:pr is:open user:moritzbrantner user:moenarch-games sort:updated-desc",
  );
  assert.equal(scanQuery(undefined, "r"), "is:pr is:open repo:moritzbrantner/r sort:updated-desc");
  assert.equal(
    scanQuery(undefined, "zoo"),
    "is:pr is:open repo:moenarch-games/zoo sort:updated-desc",
  );
  assert.equal(scanQuery("o", "x/r"), "is:pr is:open repo:x/r sort:updated-desc");
  for (const argv of [
    ["scan", "--repo"],
    ["scan", "a/b/c"],
    ["scan", "r#1"],
    ["scan", ""],
    ["scan", "a", "b"],
  ]) {
    assert.throws(() => main(argv), /usage: workctl scan/);
  }
});

test("scan groups open PRs and leaves stacked PRs waiting without inspecting their gates", () => {
  const directory = mkdtempSync(join(tmpdir(), "workctl-scan-"));
  const executable = join(directory, "gh.mjs");
  writeFileSync(
    executable,
    `#!/usr/bin/env node
const fixture = JSON.parse(process.env.WORKCTL_FIXTURE);
const endpoint = process.argv[3];
const fields = process.argv.slice(4).filter((arg, index, all) => all[index - 1] === "-f");
let value;
if (endpoint === "graphql") {
  const query = fields.find((field) => field.startsWith("query=")) ?? "";
  if (query.includes("search(")) {
    const q = fields.find((field) => field.startsWith("q="));
    if (q !== "q=is:pr is:open user:moritzbrantner user:moenarch-games sort:updated-desc") throw new Error(q);
    value = fixture.graphqlSearch;
  } else {
    const ids = fields.filter((field) => field.startsWith("ids[]=")).map((field) => field.slice(6));
    value = { data: { nodes: ids.map((id) => fixture.graphqlNodes[id]) } };
  }
} else {
  value = fixture[endpoint];
}
if (value === undefined) throw new Error("Unexpected endpoint: " + endpoint);
process.stdout.write(JSON.stringify(value));
`,
    { mode: 0o755 },
  );
  const codex = { login: "chatgpt-codex-connector[bot]", id: 199175422 };
  const codexActor = { __typename: "Bot", login: "chatgpt-codex-connector", databaseId: 199175422 };
  const repository = {
    name: "dotfiles",
    owner: { login: "moritzbrantner" },
    defaultBranchRef: { name: "main" },
  };
  const node = (number, head, overrides = {}) => ({
    number,
    state: "OPEN",
    isDraft: false,
    headRefOid: head,
    baseRefName: "main",
    mergeable: "MERGEABLE",
    mergeStateStatus: "CLEAN",
    author: { __typename: "User", login: "owner", databaseId: 1 },
    repository,
    commits: { nodes: [{ commit: { statusCheckRollup: null } }] },
    comments: { pageInfo: { hasNextPage: false }, nodes: [] },
    reviewThreads: { pageInfo: { hasNextPage: false }, nodes: [] },
    ...overrides,
  });
  const thread = (id, body) => ({
    comments: {
      pageInfo: { hasNextPage: false },
      nodes: [
        { databaseId: id, body, authorAssociation: "NONE", replyTo: null, author: codexActor },
      ],
    },
  });
  const fixture = {
    graphqlSearch: {
      data: {
        search: {
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: ["PR21", "PR22", "PR23", "PR24", "PR25"].map((id) => ({ id })),
        },
      },
    },
    graphqlNodes: {
      // Truncated comments force the REST fallback for #21.
      PR21: node(21, "1111111aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", {
        comments: { pageInfo: { hasNextPage: true }, nodes: [] },
      }),
      PR22: node(22, "2222222bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", { baseRefName: "agent/parent" }),
      PR23: node(23, "3333333ccccccccccccccccccccccccccccccccc", {
        author: { __typename: "Bot", login: "renovate", databaseId: 2 },
      }),
      PR24: node(24, "4444444ddddddddddddddddddddddddddddddddd", {
        commits: {
          nodes: [
            {
              commit: {
                statusCheckRollup: {
                  contexts: {
                    pageInfo: { hasNextPage: false },
                    nodes: [
                      {
                        __typename: "CheckRun",
                        name: "ci",
                        status: "COMPLETED",
                        conclusion: "SUCCESS",
                      },
                      { __typename: "StatusContext", context: "legacy", state: "SUCCESS" },
                    ],
                  },
                },
              },
            },
          ],
        },
        reviewThreads: {
          pageInfo: { hasNextPage: false },
          nodes: [thread(88, "**[P2] Advisory finding**")],
        },
      }),
      PR25: node(25, "5555555eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", {
        reviewThreads: {
          pageInfo: { hasNextPage: false },
          nodes: [thread(89, "**[P1] Blocking finding**")],
        },
      }),
    },
    "repos/moritzbrantner/dotfiles": { default_branch: "main" },
    "repos/moritzbrantner/dotfiles/pulls/21": {
      state: "open",
      draft: false,
      head: { sha: "1111111aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
      base: { ref: "main" },
      mergeable: true,
      mergeable_state: "clean",
    },
    "repos/moritzbrantner/dotfiles/commits/1111111aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/check-runs?filter=latest&per_page=100":
      [{ check_runs: [] }],
    "repos/moritzbrantner/dotfiles/commits/1111111aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/status?per_page=100":
      [{ statuses: [] }],
    "repos/moritzbrantner/dotfiles/issues/21/comments?per_page=100": [
      [
        {
          user: codex,
          body:
            "<!-- codex-pull-request-review-summary -->\n" +
            "| Code Review | Completed | `1111111` | Automatic |",
        },
      ],
    ],
    "repos/moritzbrantner/dotfiles/pulls/21/comments?per_page=100": [[]],
  };
  const source = fileURLToPath(new URL("./workctl.mjs", import.meta.url));
  try {
    const result = spawnSync(process.execPath, [source, "scan"], {
      encoding: "utf8",
      env: {
        ...process.env,
        WORKCTL_GH: executable,
        WORKCTL_FIXTURE: JSON.stringify(fixture),
      },
    });
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.deepEqual(output.summary, { total: 5, ready: 3, broken: 1, waiting: 1 });
    assert.equal(output.ready[0].pr, "moritzbrantner/dotfiles#21");
    assert.equal(
      output.ready.find((item) => item.pr === "moritzbrantner/dotfiles#23")?.review,
      "skipped",
    );
    assert.equal(
      output.ready.find((item) => item.pr === "moritzbrantner/dotfiles#24")?.review,
      "absent",
    );
    assert.match(output.broken[0].reasons[0], /unanswered high-priority Codex finding/);
    assert.deepEqual(output.waiting[0].reasons, ["base agent/parent is not default branch main"]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

function fakeGh(responses) {
  const calls = [];
  return {
    calls,
    run: (args) => {
      calls.push(args);
      const next = responses.shift();
      return typeof next === "function" ? next(args) : next;
    },
  };
}

const ok = (value) => ({ status: 0, stdout: JSON.stringify(value), stderr: "" });
const clock = () => {
  let time = 0;
  return { now: () => time, pause: async (ms) => void (time += ms) };
};

test("wait parses targets and rejects malformed input", () => {
  assert.deepEqual(parseWait(["pr", "zoo#12", "--timeout", "90"]), {
    kind: "pr",
    timeoutMs: 90_000,
    owner: "moenarch-games",
    repo: "zoo",
    number: 12,
    target: "zoo#12",
  });
  assert.equal(parseWait(["run", "acme/zoo", "123"]).owner, "acme");
  assert.equal(parseWait(["pid", "42"]).pid, 42);
  assert.equal(parseWait(["file", "/tmp/x", "--contains", "done"]).contains, "done");
  for (const bad of [
    ["pr"],
    ["pid", "x"],
    ["run", "zoo", "abc"],
    ["file", "a", "--timeout", "0"],
    ["nope", "x"],
  ]) {
    assert.throws(() => parseWait(bad), /usage: workctl wait/);
  }
});

test("wait pr blocks on pending required checks, then reports red with exit 1", async () => {
  const gh = fakeGh([
    ok([{ name: "merge-ready", bucket: "pending" }]),
    ok([{ name: "merge-ready", bucket: "pending" }]),
    ok([{ name: "merge-ready", bucket: "fail" }]),
  ]);
  const result = await wait(parseWait(["pr", "zoo#7"]), { run: gh.run, ...clock() });
  assert.equal(result.exitCode, 1);
  assert.equal(result.state, "red");
  assert.deepEqual(result.failing, ["merge-ready"]);
  assert.deepEqual(gh.calls[0], [
    "pr",
    "checks",
    "7",
    "-R",
    "moenarch-games/zoo",
    "--required",
    "--json",
    "name,bucket",
  ]);
});

test("wait pr falls back to all checks when none are required and goes green", async () => {
  const gh = fakeGh([
    { status: 1, stdout: "", stderr: "no required checks reported on the 'x' branch" },
    ok([
      { name: "ci", bucket: "pass" },
      { name: "lint", bucket: "skipping" },
    ]),
  ]);
  const result = await wait(parseWait(["pr", "zoo#7"]), { run: gh.run, ...clock() });
  assert.equal(result.exitCode, 0);
  assert.equal(result.state, "green");
});

test("wait pr times out with exit 2", async () => {
  const pending = () => ok([{ name: "ci", bucket: "pending" }]);
  const gh = { run: pending };
  const result = await wait(parseWait(["pr", "zoo#7", "--timeout", "30"]), {
    run: gh.run,
    ...clock(),
  });
  assert.equal(result.exitCode, 2);
  assert.equal(result.state, "timeout");
});

test("wait run follows gh run view until completed", async () => {
  const gh = fakeGh([
    ok({ status: "in_progress", conclusion: "", name: "CI", url: "u" }),
    ok({ status: "completed", conclusion: "success", name: "CI", url: "u" }),
  ]);
  const result = await wait(parseWait(["run", "zoo", "99"]), { run: gh.run, ...clock() });
  assert.equal(result.exitCode, 0);
  assert.equal(result.conclusion, "success");
  assert.deepEqual(gh.calls[0].slice(0, 5), ["run", "view", "99", "-R", "moenarch-games/zoo"]);
});

test("wait pid and file poll local state", async () => {
  let alive = 2;
  const pid = await wait(parseWait(["pid", "123"]), { alive: () => alive-- > 0, ...clock() });
  assert.deepEqual([pid.exitCode, pid.state], [0, "exited"]);

  let content = "building";
  const read = () => {
    const current = content;
    content = "build finished";
    return current;
  };
  const file = await wait(parseWait(["file", "log", "--contains", "finished"]), {
    read,
    ...clock(),
  });
  assert.deepEqual([file.exitCode, file.state], [0, "matched"]);

  const missing = await wait(parseWait(["file", "log", "--timeout", "3"]), {
    read: () => {
      throw new Error("ENOENT");
    },
    ...clock(),
  });
  assert.equal(missing.exitCode, 2);
});

test("wait pid exits for a real process without matching itself", () => {
  const child = spawnSync(process.execPath, ["-e", "1"]);
  assert.equal(child.status, 0);
  const source = fileURLToPath(new URL("./workctl.mjs", import.meta.url));
  const result = spawnSync(
    process.execPath,
    [source, "wait", "pid", String(child.pid), "--timeout", "5"],
    {
      encoding: "utf8",
      timeout: 10_000,
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).state, "exited");
});
