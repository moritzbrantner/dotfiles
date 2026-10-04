import assert from "node:assert/strict";
import test from "node:test";

import {
  checkState,
  classify,
  codexReview,
  mergePolicy,
  parseTarget,
  selectMergeMethod,
  unansweredCodexFindings,
} from "./workctl.mjs";

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

test("Codex review must complete on current head", () => {
  const user = { login: "chatgpt-codex-connector[bot]", id: 199175422 };
  const completed = {
    user,
    body:
      "<!-- codex-pull-request-review-summary -->\n" +
      "| 📝 **Code Review** | ✅ **Completed** now | `ef9ecb8` | Manual |",
  };

  assert.equal(codexReview([completed], "ef9ecb8b76ff").state, "complete");
  assert.equal(codexReview([completed], "aaaaaaaa").state, "pending");
  assert.equal(
    codexReview(
      [{ ...completed, body: completed.body.replace("Completed", "Running") }],
      "ef9ecb8b76ff",
    ).state,
    "pending",
  );
  assert.equal(
    codexReview(
      [{ ...completed, user: { login: "fake-codex-user", id: 123 } }],
      "ef9ecb8b76ff",
    ).state,
    "pending",
  );
});

test("Codex finding is answered by a non-Codex reply", () => {
  const codex = { login: "chatgpt-codex-connector[bot]", id: 199175422 };
  assert.equal(
    unansweredCodexFindings([{ id: 1, in_reply_to_id: null, user: codex }]),
    1,
  );
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


test("final permitted review allows a later fix only after trusted completed rounds", () => {
  const user = { login: "chatgpt-codex-connector[bot]", id: 199175422 };
  const date = (n) => `2026-10-03T18:${String(n).padStart(2, "0")}:00Z`;
  const reviews = [0, 1, 2, 3].map((n) => ({
    user, commit_id: String(n + 1).repeat(40), submitted_at: date(n * 2),
    state: "COMMENTED",
  }));
  const requests = [1, 3, 5].map((n) => ({
    user: { login: "owner" }, author_association: "OWNER",
    body: "@codex review", created_at: date(n),
  }));
  const summary = {
    user, updated_at: date(6),
    body: "<!-- codex-pull-request-review-summary -->\n" +
      "| Code Review | Completed | `4444444` | Manual request |",
  };
  const comments = [...requests, summary];
  assert.equal(codexReview(comments, "5555555", reviews).state, "complete");
  assert.equal(codexReview(comments.slice(1), "5555555", reviews).state, "pending");
  assert.equal(codexReview(comments, "5555555", reviews.slice(1)).state, "pending");
  assert.equal(codexReview(comments.map((c) => c === summary ? c : {
    ...c, author_association: "NONE",
  }), "5555555", reviews).state, "pending");
  assert.equal(codexReview(comments, "5555555", reviews.map((r) => ({
    ...r, user: { login: user.login, id: 123 },
  }))).state, "pending");
  assert.equal(codexReview([...requests, {
    ...summary, body: summary.body.replace("Completed", "Running"),
  }], "5555555", reviews).state, "pending");
  assert.equal(codexReview(comments, "5555555", reviews.map((r) => ({
    ...r, commit_id: "4444444",
  }))).state, "pending");
  assert.equal(classify({
    pr: { state: "open", mergeable: true, mergeable_state: "clean" },
    checks: { state: "green" }, review: codexReview(comments, "5555555", reviews),
    unanswered: 1,
  }).state, "broken");
});
