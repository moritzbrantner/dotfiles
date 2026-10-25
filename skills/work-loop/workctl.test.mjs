import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  checkState,
  classify,
  cloneKeepReason,
  codexReview,
  concatenatedJson,
  land,
  merge,
  mergePolicy,
  main,
  markdownSections,
  parseLand,
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
  for (const repo of ["mmorpg", "arpg", "zoo", "my-farm", "battle-royale", "raid-defense"]) {
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

test("Codex review status reads the summary table", () => {
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

test("Codex-gated repos wait for a completed review of the current head", () => {
  const codex = { login: "chatgpt-codex-connector[bot]", id: 199175422 };
  const head = "3e9fefe46934df230a94155d3f6321a2b9c02bfd";
  const summary = (status, sha) => ({
    user: codex,
    body:
      "<!-- codex-pull-request-review-summary -->\n" +
      `<!-- codex-review-state:v1 {"code_review":{"commit_sha":"${sha}","status":"${status}"},"security_review":{"commit_sha":null,"status":null}} -->\n` +
      "| 📝 **Code Review** | 🔄 **Running** since now | `3e9fefe` | Manual request |",
  });
  const old = "a93ac4f6e6a93ac4f6e6a93ac4f6e6a93ac4f6e6";
  const reviews = {
    absent: codexReview([], head),
    running: codexReview([summary("running", head)], head),
    complete: codexReview([summary("completed", head)], head),
    stale: codexReview([summary("completed", old)], head),
  };
  assert.deepEqual(
    Object.fromEntries(Object.entries(reviews).map(([key, value]) => [key, value.state])),
    { absent: "absent", running: "running", complete: "complete", stale: "stale" },
  );

  const ready = {
    repo: "truth-core",
    pr: { state: "open", draft: false, mergeable: true, mergeable_state: "clean" },
    checks: { state: "green", failed: [], pending: [] },
    blockingFindings: 0,
  };
  assert.deepEqual(classify({ ...ready, review: reviews.complete }), {
    state: "ready",
    reasons: [],
  });
  for (const name of ["absent", "running", "stale"]) {
    assert.deepEqual(classify({ ...ready, review: reviews[name] }), {
      state: "waiting",
      reasons: [`Codex review ${name} for current head`],
    });
    assert.equal(classify({ ...ready, repo: "dotfiles", review: reviews[name] }).state, "ready");
  }
  assert.equal(
    classify({ ...ready, review: reviews.complete, blockingFindings: 1 }).state,
    "broken",
  );
});

test("land does not hand a Codex-gated PR to auto-merge or the queue before review", async () => {
  for (const policy of [{ autoMerge: true }, { queue: true }]) {
    const gh = landGh({});
    const status = landStatus({
      repo: "truth-core",
      review: { state: "running" },
      state: "waiting",
      reasons: ["Codex review running for current head"],
    });
    const result = await land(parseLand(["truth-core#5"]), landDepsFor(gh, { status, policy }));
    assert.equal(result.exitCode, 0);
    assert.equal(result.state, "waiting");
    assert.equal(result.merged, false);
    assert.equal(merges(gh).length, 0);
  }
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
    { method: "--merge", deleteBranch: false, queue: true, autoMerge: false },
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

function landStatus(overrides = {}) {
  return {
    owner: "moenarch-games",
    repo: "mmorpg",
    number: 5,
    target: "moenarch-games/mmorpg#5",
    head: "abc123",
    pr: {
      state: "open",
      draft: false,
      mergeable: true,
      mergeable_state: "clean",
      base: { ref: "main" },
    },
    checks: { state: "green", failed: [], pending: [] },
    review: { state: "absent" },
    blockingFindings: 0,
    state: "ready",
    reasons: [],
    ...overrides,
  };
}

/** Fake gh for land/merge: tracks one PR; `onMerge`/`onEnqueue` mutate it like GitHub would. */
function landGh(pr, { onMerge = () => {}, onEnqueue = () => {} } = {}) {
  const state = {
    id: "PR_1",
    state: "OPEN",
    merged: false,
    isInMergeQueue: false,
    headRefName: "agent/x",
    headRefOid: "abc123",
    autoMergeRequest: null,
    ...pr,
  };
  const calls = [];
  const run = (args) => {
    calls.push(args);
    const query = args.find((arg) => arg.startsWith("query=")) ?? "";
    if (args[0] === "pr" && args[1] === "merge") onMerge(state, args);
    else if (query.includes("enqueuePullRequest")) onEnqueue(state, args);
    else if (query.includes("pullRequest(number"))
      return ok({ data: { repository: { pullRequest: { ...state } } } });
    return ok({});
  };
  return { state, calls, run };
}

function landFs(paths) {
  const present = new Set(paths);
  return {
    present,
    exists: (path) => present.has(path),
    remove: (path) => {
      for (const entry of [...present])
        if (entry === path || entry.startsWith(`${path}/`)) present.delete(entry);
    },
  };
}

function landDepsFor(
  gh,
  {
    status = landStatus(),
    policy = {},
    checks = { exitCode: 0, state: "green" },
    git,
    fs = landFs([]),
    ...extra
  } = {},
) {
  return {
    cloneRoot: "/",
    realPath: resolve,
    run: gh.run,
    pause: async () => {},
    now: () => 0,
    inspect: () => status,
    policy: () => ({
      method: "--squash",
      deleteBranch: false,
      queue: false,
      autoMerge: false,
      ...policy,
    }),
    waitChecks: async () => checks,
    git: git ?? (() => ({ status: 1, stdout: "" })),
    exists: fs.exists,
    remove: fs.remove,
    ...extra,
  };
}

const merges = (gh) => gh.calls.filter((args) => args[0] === "pr" && args[1] === "merge");

test("land parses its options", () => {
  assert.deepEqual(parseLand(["mmorpg#5", "--clone", "/c", "--wait-merged", "60"]), {
    owner: "moenarch-games",
    repo: "mmorpg",
    number: 5,
    target: "mmorpg#5",
    clone: "/c",
    cleanupOnly: false,
    timeoutMs: 3600_000,
    waitMergedMs: 60_000,
    waitReviewMs: 0,
  });
  assert.equal(parseLand(["a#1", "--wait-review"]).waitReviewMs, 7200_000);
  assert.equal(parseLand(["a#1", "--wait-review", "600", "--clone", "/c"]).waitReviewMs, 600_000);
  assert.equal(parseLand(["a#1", "--wait-review", "--clone", "/c"]).clone, "/c");
  for (const bad of [
    [],
    ["a#1", "b#2"],
    ["a#1", "--cleanup-only"],
    ["a#1", "--timeout", "0"],
    ["a#1", "--wait-review", "0"],
    ["a#1", "--x"],
  ]) {
    assert.throws(() => parseLand(bad), /usage: workctl land/);
  }
});

/** Statuses a Codex-gated PR moves through while land --wait-review polls `inspect`. */
function reviewSequence(...reviews) {
  const statuses = reviews.map(([review, extra = {}]) =>
    landStatus({
      repo: "truth-core",
      owner: "moritzbrantner",
      target: "moritzbrantner/truth-core#5",
      review: { state: review },
      state: review === "complete" ? "ready" : "waiting",
      ...extra,
    }),
  );
  let index = 0;
  return () => statuses[Math.min(index++, statuses.length - 1)];
}

const reviewComments = (gh) => gh.calls.filter((args) => args[0] === "pr" && args[1] === "comment");

test("land --wait-review waits for the Codex review of the current head, then merges", async () => {
  const gh = landGh({}, { onMerge: (pr) => void (pr.merged = true) });
  const time = clock();
  const inspect = reviewSequence(["absent"], ["running"], ["running"], ["complete"]);
  const result = await land(
    parseLand(["truth-core#5", "--wait-review"]),
    landDepsFor(gh, { inspect, ...time }),
  );
  assert.equal(result.exitCode, 0);
  assert.equal(result.state, "merged");
  assert.deepEqual(result.reviewWait, { waitedSeconds: 285, requested: false });
  assert.equal(reviewComments(gh).length, 0);
  assert.equal(merges(gh).length, 1);
});

test("land --wait-review re-requests a stuck review once, then keeps waiting", async () => {
  const gh = landGh({}, { onMerge: (pr) => void (pr.merged = true) });
  const time = clock();
  const stuck = Array.from({ length: 20 }, () => ["running"]);
  const inspect = reviewSequence(...stuck, ["complete"]);
  const result = await land(
    parseLand(["truth-core#5", "--wait-review"]),
    landDepsFor(gh, { inspect, ...time }),
  );
  assert.equal(result.state, "merged");
  assert.equal(result.reviewWait.requested, true);
  assert.deepEqual(reviewComments(gh), [
    ["pr", "comment", "5", "-R", "moritzbrantner/truth-core", "--body", "@codex review"],
  ]);
});

test("land --wait-review stops as broken on blocking findings and times out with exit 2", async () => {
  const gh = landGh({});
  const inspect = reviewSequence(["running"], ["complete", { blockingFindings: 1 }]);
  const broken = await land(
    parseLand(["truth-core#5", "--wait-review"]),
    landDepsFor(gh, { inspect, ...clock() }),
  );
  assert.equal(broken.exitCode, 1);
  assert.equal(broken.state, "broken");
  assert.equal(broken.blockingFindings, 1);
  assert.equal(broken.merged, false);
  assert.equal(merges(gh).length, 0);

  const timedOut = await land(
    parseLand(["truth-core#5", "--wait-review", "600"]),
    landDepsFor(gh, { inspect: reviewSequence(["running"]), ...clock() }),
  );
  assert.deepEqual([timedOut.exitCode, timedOut.state, timedOut.merged], [2, "timeout", false]);
  assert.equal(merges(gh).length, 0);
});

test("land never deletes a clone outside the agent-work root and warns about it", async () => {
  const gh = landGh({ merged: true, state: "MERGED" });
  const fs = landFs(["/home/u/moritzbrantner/x", "/home/u/moritzbrantner/x/target"]);
  const out = { "symbolic-ref": "agent/x", status: "", "rev-list": "0" };
  const git = (cwd, args) => ({ status: 0, stdout: args[0] === "rev-parse" ? cwd : out[args[0]] });
  for (const clone of ["/home/u/moritzbrantner/x", "/home/u/.cache/agent-work"]) {
    const result = await land(
      parseLand(["dotfiles#5", "--clone", clone, "--cleanup-only"]),
      landDepsFor(gh, { fs, git, cloneRoot: "/home/u/.cache/agent-work" }),
    );
    assert.equal(result.state, "merged");
    assert.deepEqual(result.clone, { path: clone, kept: "outside /home/u/.cache/agent-work" });
    assert.match(result.warning, /is not under \/home\/u\/\.cache\/agent-work/);
  }
  assert.equal(fs.present.size, 2);
});

test("land enqueues on a merge-queue repo and retries via GraphQL when gh leaves it un-queued", async () => {
  const gh = landGh({}, { onEnqueue: (pr) => void (pr.isInMergeQueue = true) });
  const fs = landFs(["/c", "/c/target", "/c/target/debug"]);
  const result = await land(
    parseLand(["mmorpg#5", "--clone", "/c"]),
    landDepsFor(gh, { policy: { queue: true }, fs }),
  );
  assert.equal(result.exitCode, 0);
  assert.equal(result.state, "queued");
  assert.equal(result.merged, false);
  assert.deepEqual(result.clone, { path: "/c", removed: "target" });
  assert.deepEqual([...fs.present], ["/c"]);
  assert.deepEqual(merges(gh)[0], [
    "pr",
    "merge",
    "5",
    "-R",
    "moenarch-games/mmorpg",
    "--match-head-commit",
    "abc123",
  ]);
  assert.ok(gh.calls.some((args) => args.includes("id=PR_1") && args.includes("head=abc123")));
});

test("land exits 1 when the merge queue never accepts the PR, keeping target", async () => {
  const gh = landGh({});
  const fs = landFs(["/c", "/c/target"]);
  const result = await land(
    parseLand(["mmorpg#5", "--clone", "/c"]),
    landDepsFor(gh, { policy: { queue: true }, fs }),
  );
  assert.equal(result.exitCode, 1);
  assert.equal(result.state, "not-queued");
  assert.equal(result.clone, undefined);
  assert.ok(fs.present.has("/c/target"));
});

test("land stops on red checks without merging", async () => {
  const gh = landGh({});
  const checks = {
    exitCode: 1,
    kind: "pr",
    target: "x",
    state: "red",
    failing: ["ci"],
    waitedSeconds: 3,
  };
  const result = await land(parseLand(["mmorpg#5"]), landDepsFor(gh, { checks }));
  assert.deepEqual(result, {
    exitCode: 1,
    pr: "moenarch-games/mmorpg#5",
    state: "red",
    failing: ["ci"],
    waitedSeconds: 3,
    merged: false,
  });
  assert.equal(merges(gh).length, 0);
});

test("land enables squash auto-merge where the repo allows it", async () => {
  const gh = landGh({}, { onMerge: (pr) => void (pr.autoMergeRequest = { enabledAt: "now" }) });
  const status = landStatus({
    state: "waiting",
    pr: { ...landStatus().pr, mergeable_state: "blocked" },
  });
  const result = await land(
    parseLand(["mmorpg#5"]),
    landDepsFor(gh, { status, policy: { autoMerge: true, deleteBranch: true } }),
  );
  assert.equal(result.state, "auto-merge");
  assert.deepEqual(merges(gh)[0].slice(5), [
    "--auto",
    "--squash",
    "--delete-branch",
    "--match-head-commit",
    "abc123",
  ]);
});

test("land leaves a not-ready PR on a plain repo and merges a ready one, then removes a clean clone", async () => {
  const waiting = landGh({});
  const notReady = landStatus({
    state: "broken",
    blockingFindings: 1,
    reasons: ["1 unanswered high-priority Codex finding"],
  });
  const left = await land(parseLand(["dotfiles#5"]), landDepsFor(waiting, { status: notReady }));
  assert.equal(left.exitCode, 0);
  assert.equal(left.state, "broken");
  assert.equal(left.merged, false);
  assert.equal(merges(waiting).length, 0);

  const gh = landGh({}, { onMerge: (pr) => void (pr.merged = true) });
  const fs = landFs(["/c", "/c/target"]);
  const git = (_cwd, args) => {
    const out = { "rev-parse": "/c", "symbolic-ref": "agent/x", status: "", "rev-list": "0" }[
      args[0]
    ];
    return { status: 0, stdout: out };
  };
  const result = await land(
    parseLand(["dotfiles#5", "--clone", "/c"]),
    landDepsFor(gh, { fs, git }),
  );
  assert.equal(result.state, "merged");
  assert.equal(result.merged, true);
  assert.equal(result.method, "merge");
  assert.deepEqual(result.clone, { path: "/c", removed: "clone" });
  assert.equal(fs.present.size, 0);
  assert.ok(merges(gh)[0].includes("--squash"));
});

test("land --cleanup-only removes a merged clone only when it has no local work", async () => {
  const gh = landGh({ merged: true, state: "MERGED" });
  const fs = landFs(["/c", "/c/target"]);
  const git = (_cwd, args) => ({
    status: 0,
    stdout: { "rev-parse": "/c", "symbolic-ref": "agent/x", status: " M a.rs", "rev-list": "0" }[
      args[0]
    ],
  });
  const result = await land(
    parseLand(["dotfiles#5", "--clone", "/c", "--cleanup-only"]),
    landDepsFor(gh, { fs, git }),
  );
  assert.equal(result.exitCode, 0);
  assert.deepEqual(result.clone, { path: "/c", kept: "uncommitted changes", removed: "target" });
  assert.ok(fs.present.has("/c"));
  assert.equal(gh.calls.length, 2);
});

test("merge on a merge-queue repo confirms the PR entered the queue", async () => {
  const gh = landGh({});
  const deps = { ...landDepsFor(gh, { policy: { queue: true } }) };
  const rejected = await merge("mmorpg#5", deps);
  assert.deepEqual([rejected.exitCode, rejected.state, rejected.merged], [1, "waiting", false]);

  const accepted = landGh({}, { onMerge: (pr) => void (pr.isInMergeQueue = true) });
  const result = await merge("mmorpg#5", landDepsFor(accepted, { policy: { queue: true } }));
  assert.deepEqual(result, {
    exitCode: 0,
    pr: "moenarch-games/mmorpg#5",
    state: "queued",
    head: "abc123",
    merged: false,
  });
});

test("clone cleanup refuses dirty, unpushed or foreign checkouts", () => {
  const directory = mkdtempSync(join(tmpdir(), "workctl-clone-"));
  const git = (cwd, ...args) => {
    const result = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  };
  try {
    const remote = join(directory, "remote.git");
    const clone = join(directory, "clone");
    spawnSync("git", ["init", "-q", "--bare", remote]);
    spawnSync("git", ["clone", "-q", remote, clone]);
    git(
      clone,
      "-c",
      "user.name=t",
      "-c",
      "user.email=t@t",
      "commit",
      "-q",
      "--allow-empty",
      "-m",
      "a",
    );
    git(clone, "checkout", "-q", "-b", "agent/x");
    git(clone, "push", "-q", "-u", "origin", "agent/x");
    assert.equal(cloneKeepReason(clone, "agent/x"), null);
    assert.match(cloneKeepReason(clone, "agent/y"), /not PR branch agent\/y/);
    assert.equal(cloneKeepReason(directory, "agent/x"), "not a git checkout");
    writeFileSync(join(clone, "f"), "x");
    assert.equal(cloneKeepReason(clone, "agent/x"), "uncommitted changes");
    git(clone, "add", "f");
    git(clone, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "b");
    assert.equal(cloneKeepReason(clone, "agent/x"), "unpushed commits");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("wait pr reads tab-separated checks from a gh without pr checks --json", async () => {
  const noJson = { status: 1, stdout: "", stderr: "unknown flag: --json\n\nUsage: gh pr checks" };
  const gh = fakeGh([
    noJson,
    { status: 8, stdout: "merge-ready\tpending\t0\thttps://x", stderr: "" },
    noJson,
    {
      status: 0,
      stdout: "merge-ready\tpass\t1m\thttps://x\nlint\tskipping\t0\thttps://y",
      stderr: "",
    },
  ]);
  const result = await wait(parseWait(["pr", "dotfiles#65"]), { run: gh.run, ...clock() });
  assert.deepEqual([result.exitCode, result.state], [0, "green"]);
  assert.deepEqual(gh.calls[1], [
    "pr",
    "checks",
    "65",
    "-R",
    "moritzbrantner/dotfiles",
    "--required",
  ]);
});

test("paginated output without --slurp splits into one value per page", () => {
  assert.deepEqual(concatenatedJson('[{"a":"]}["}]\n[{"b":"\\"["}]{"c":1}'), [
    [{ a: "]}[" }],
    [{ b: '"[' }],
    { c: 1 },
  ]);
  assert.deepEqual(concatenatedJson(""), []);
});
