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
  parseTarget,
  selectMergeMethod,
  unansweredCodexFindings,
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
  assert.deepEqual(parseTarget("x/y#12"), { owner: "x", repo: "y", number: 12 });
  assert.deepEqual(parseTarget("https://github.com/x/y/pull/12"), {
    owner: "x",
    repo: "y",
    number: 12,
  });
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

test("Codex review must complete on current head without a round-limit escape hatch", () => {
  const user = { login: "chatgpt-codex-connector[bot]", id: 199175422 };
  const completed = {
    user,
    body:
      "<!-- codex-pull-request-review-summary -->\n" +
      "| 📝 **Code Review** | ✅ **Completed** now | `ef9ecb8` | Manual |",
  };

  assert.equal(codexReview([completed], "ef9ecb8b76ff").state, "complete");
  assert.deepEqual(codexReview([completed], "aaaaaaaa"), {
    state: "pending",
    reason: "Codex reviewed stale commit ef9ecb8",
  });
  assert.equal(
    codexReview(
      [{ ...completed, body: completed.body.replace("Completed", "Running") }],
      "ef9ecb8b76ff",
    ).state,
    "pending",
  );
  assert.equal(
    codexReview([{ ...completed, user: { login: "fake-codex-user", id: 123 } }], "ef9ecb8b76ff")
      .state,
    "pending",
  );
});

test("Codex finding is answered by a non-Codex reply", () => {
  const codex = { login: "chatgpt-codex-connector[bot]", id: 199175422 };
  assert.equal(unansweredCodexFindings([{ id: 1, in_reply_to_id: null, user: codex }]), 1);
  assert.equal(
    unansweredCodexFindings([
      { id: 1, in_reply_to_id: null, user: codex },
      {
        id: 2,
        in_reply_to_id: 1,
        user: { login: "owner" },
        author_association: "OWNER",
      },
    ]),
    0,
  );
  assert.equal(
    unansweredCodexFindings([
      { id: 1, in_reply_to_id: null, user: codex },
      {
        id: 2,
        in_reply_to_id: 1,
        user: { login: "random-user" },
        author_association: "NONE",
      },
    ]),
    1,
  );
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
    unanswered: 0,
  };

  assert.equal(classify(ready).state, "ready");
  assert.equal(
    classify({
      ...ready,
      checks: { state: "pending", failed: [], pending: ["ci"] },
    }).state,
    "waiting",
  );
  assert.equal(classify({ ...ready, unanswered: 1 }).state, "broken");
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
    { method: "--merge", deleteBranch: false },
  );
});

test("scan groups open PRs and leaves stacked PRs waiting without inspecting their gates", () => {
  const directory = mkdtempSync(join(tmpdir(), "workctl-scan-"));
  const executable = join(directory, "gh.mjs");
  writeFileSync(
    executable,
    `#!/usr/bin/env node
const fixture = JSON.parse(process.env.WORKCTL_FIXTURE);
const endpoint = process.argv[3];
const value = fixture[endpoint];
if (value === undefined) throw new Error("Unexpected endpoint: " + endpoint);
process.stdout.write(JSON.stringify(value));
`,
    { mode: 0o755 },
  );
  const codex = { login: "chatgpt-codex-connector[bot]", id: 199175422 };
  const search =
    "search/issues?q=" +
    encodeURIComponent("is:pr is:open user:moritzbrantner") +
    "&sort=updated&order=desc&per_page=100";
  const fixture = {
    [search]: [
      {
        items: [
          {
            number: 21,
            repository_url: "https://api.github.com/repos/moritzbrantner/dotfiles",
          },
          {
            number: 22,
            repository_url: "https://api.github.com/repos/moritzbrantner/dotfiles",
          },
        ],
      },
    ],
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
    "repos/moritzbrantner/dotfiles/pulls/21/reviews?per_page=100": [[]],
    "repos/moritzbrantner/dotfiles/pulls/22": {
      state: "open",
      draft: false,
      head: { sha: "2222222bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
      base: { ref: "agent/parent" },
      mergeable: true,
      mergeable_state: "clean",
    },
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
    assert.deepEqual(output.summary, { total: 2, ready: 1, broken: 0, waiting: 1 });
    assert.equal(output.ready[0].pr, "moritzbrantner/dotfiles#21");
    assert.deepEqual(output.waiting[0].reasons, [
      "base agent/parent is not default branch main",
    ]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
