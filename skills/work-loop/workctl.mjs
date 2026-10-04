#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const DEFAULT_OWNER = "moritzbrantner";
const CODEX_BOT_ID = 199175422;
const CODEX_BOT_LOGIN = "chatgpt-codex-connector[bot]";
const PASS = new Set(["success", "skipped", "neutral"]);
const TRUSTED_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

export function parseTarget(value) {
  const url = value.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/);
  if (url) return { owner: url[1], repo: url[2], number: Number(url[3]) };
  const short = value.match(/^(?:(?<owner>[^/#]+)\/)?(?<repo>[^/#]+)#(?<number>\d+)$/);
  if (!short) throw new Error(`invalid PR target: ${value}`);
  return {
    owner: short.groups.owner ?? DEFAULT_OWNER,
    repo: short.groups.repo,
    number: Number(short.groups.number),
  };
}

function gh(args) {
  const result = spawnSync(process.env.WORKCTL_GH ?? "gh", args, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `gh exited ${result.status}`).trim());
  }
  return result.stdout.trim();
}

function ghJson(args) {
  const output = gh(args);
  return output ? JSON.parse(output) : null;
}

function api(endpoint, args = []) {
  return ghJson(["api", endpoint, ...args]);
}

function optionalApi(endpoint) {
  const result = spawnSync(process.env.WORKCTL_GH ?? "gh", ["api", endpoint], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status === 0) {
    return result.stdout.trim() ? JSON.parse(result.stdout) : null;
  }
  if (/HTTP 404/i.test(result.stderr ?? "")) {
    return null;
  }
  throw new Error((result.stderr || result.stdout || `gh exited ${result.status}`).trim());
}

function pages(endpoint) {
  const result = api(endpoint, ["--paginate", "--slurp"]);
  return Array.isArray(result) ? result : [];
}

function pageArrays(endpoint) {
  return pages(endpoint).flatMap((page) => (Array.isArray(page) ? page : []));
}

function isCodex(user) {
  return user?.id === CODEX_BOT_ID && user?.login === CODEX_BOT_LOGIN;
}

function time(value) {
  return Date.parse(value?.updated_at ?? value?.created_at ?? 0) || 0;
}

function reviewLimitExhausted(issueComments, reviews, commit) {
  const rounds = [
    ...reviews
      .filter(
        (review) =>
          isCodex(review.user) &&
          ["COMMENTED", "APPROVED", "CHANGES_REQUESTED"].includes(review.state),
      )
      .map((review) => ({ commit: review.commit_id, completed: Date.parse(review.submitted_at) })),
    ...issueComments
      .filter(
        (comment) =>
          isCodex(comment.user) &&
          /Codex Review: Didn't find any major issues/i.test(comment.body ?? ""),
      )
      .map((comment) => ({
        commit: comment.body.match(/Reviewed commit:\*\*\s*`([0-9a-f]{7,40})`/i)?.[1],
        completed: Date.parse(comment.created_at),
      })),
  ]
    .filter(
      (round) => /^[0-9a-f]{7,40}$/i.test(round.commit ?? "") && Number.isFinite(round.completed),
    )
    .sort((a, b) => a.completed - b.completed);
  const distinct = [];
  for (const round of rounds) {
    if (
      !distinct.some(
        (old) => old.commit.startsWith(round.commit) || round.commit.startsWith(old.commit),
      )
    ) {
      distinct.push(round);
    }
  }
  const requests = issueComments
    .filter(
      (comment) =>
        !isCodex(comment.user) &&
        TRUSTED_ASSOCIATIONS.has(comment.author_association) &&
        /^@codex review\s*$/i.test((comment.body ?? "").trim()),
    )
    .map((comment) => Date.parse(comment.created_at))
    .filter(Number.isFinite);
  let completedRequests = 0;
  for (let i = 1; i < distinct.length; i++) {
    if (
      requests.some(
        (requested) => requested > distinct[i - 1].completed && requested < distinct[i].completed,
      )
    ) {
      completedRequests++;
    }
  }
  const last = distinct.at(-1);
  return completedRequests >= 3 && last?.commit.startsWith(commit);
}

export function codexReview(issueComments, head, reviews = []) {
  const summary = issueComments
    .filter((comment) => isCodex(comment.user))
    .filter((comment) =>
      /codex-pull-request-review-summary|Codex Review Summary/i.test(comment.body ?? ""),
    )
    .sort((a, b) => time(b) - time(a))[0];
  if (!summary) return { state: "pending", reason: "no Codex review" };

  const row = (summary.body ?? "")
    .split("\n")
    .filter((line) => /^\|/.test(line) && /Code Review/i.test(line))
    .at(-1);
  if (!row || !/Completed/i.test(row)) {
    return { state: "pending", reason: "Codex review running" };
  }

  const commit = row.match(/`([0-9a-f]{7,40})`/i)?.[1]?.toLowerCase();
  if (!commit || !head.toLowerCase().startsWith(commit)) {
    if (commit && reviewLimitExhausted(issueComments, reviews, commit)) {
      return { state: "complete", commit, limitExhausted: true };
    }
    return {
      state: "pending",
      reason: commit ? `Codex reviewed stale commit ${commit}` : "Codex review commit unknown",
    };
  }
  return { state: "complete", commit };
}

export function unansweredCodexFindings(comments) {
  const replies = new Map();
  for (const comment of comments) {
    if (comment.in_reply_to_id == null) continue;
    replies.set(comment.in_reply_to_id, [...(replies.get(comment.in_reply_to_id) ?? []), comment]);
  }
  return comments.filter(
    (comment) =>
      comment.in_reply_to_id == null &&
      isCodex(comment.user) &&
      !(replies.get(comment.id) ?? []).some(
        (reply) => !isCodex(reply.user) && TRUSTED_ASSOCIATIONS.has(reply.author_association),
      ),
  ).length;
}

export function checkState(checkRuns, statuses) {
  const failed = [];
  const pending = [];
  for (const check of checkRuns) {
    const name = check.name ?? "unnamed check";
    if ((check.status ?? "").toLowerCase() !== "completed") pending.push(name);
    else if (!PASS.has((check.conclusion ?? "").toLowerCase())) failed.push(name);
  }
  for (const status of statuses) {
    const name = status.context ?? "unnamed status";
    const state = (status.state ?? "").toLowerCase();
    if (["failure", "error"].includes(state)) failed.push(name);
    else if (state !== "success") pending.push(name);
  }
  return failed.length
    ? { state: "failed", failed, pending }
    : pending.length
      ? { state: "pending", failed, pending }
      : { state: "green", failed, pending };
}

function latestStatuses(statusPages) {
  const latest = new Map();
  for (const page of statusPages) {
    for (const status of page?.statuses ?? []) {
      const old = latest.get(status.context);
      if (!old || time(status) > time(old)) latest.set(status.context, status);
    }
  }
  return [...latest.values()];
}

export function classify({ pr, checks, review, unanswered }) {
  const reasons = [];
  let state = "ready";
  if (pr.state !== "open" || pr.draft) {
    state = "waiting";
    reasons.push(pr.draft ? "PR is draft" : `PR is ${pr.state}`);
  }
  if (pr.mergeable === false || pr.mergeable_state === "dirty") {
    state = "broken";
    reasons.push("merge conflict");
  } else if (pr.mergeable !== true || pr.mergeable_state !== "clean") {
    if (state !== "broken") state = "waiting";
    reasons.push(`mergeability ${pr.mergeable_state ?? "unknown"}`);
  }
  if (checks.state === "failed") {
    state = "broken";
    reasons.push(`failed checks: ${checks.failed.join(", ")}`);
  } else if (checks.state === "pending" && state !== "broken") {
    state = "waiting";
    reasons.push(`pending checks: ${checks.pending.join(", ")}`);
  }
  if (unanswered) {
    state = "broken";
    reasons.push(`${unanswered} unanswered Codex finding${unanswered === 1 ? "" : "s"}`);
  } else if (review.state !== "complete" && state !== "broken") {
    state = "waiting";
    reasons.push(review.reason);
  }
  return { state, reasons };
}

function inspect(target) {
  const { owner, repo, number } = parseTarget(target);
  const prefix = `repos/${owner}/${repo}`;
  const pr = api(`${prefix}/pulls/${number}`);
  const head = pr.head.sha;
  const runs = pages(`${prefix}/commits/${head}/check-runs?filter=latest&per_page=100`).flatMap(
    (page) => page?.check_runs ?? [],
  );
  const statuses = latestStatuses(pages(`${prefix}/commits/${head}/status?per_page=100`));
  const issueComments = pageArrays(`${prefix}/issues/${number}/comments?per_page=100`);
  const reviewComments = pageArrays(`${prefix}/pulls/${number}/comments?per_page=100`);
  const checks = checkState(runs, statuses);
  const reviews = pageArrays(`${prefix}/pulls/${number}/reviews?per_page=100`);
  let review = codexReview(issueComments, head, reviews);
  if (review.limitExhausted) {
    const comparison = api(`${prefix}/compare/${review.commit}...${head}`);
    if (!["ahead", "identical"].includes(comparison.status)) {
      review = { state: "pending", reason: "last reviewed commit is not an ancestor of head" };
    }
  }
  const unanswered = unansweredCodexFindings(reviewComments);
  return {
    owner,
    repo,
    number,
    target: `${owner}/${repo}#${number}`,
    pr,
    head,
    checks,
    review,
    unanswered,
    ...classify({ pr, checks, review, unanswered }),
  };
}

function compact(status) {
  return {
    pr: status.target,
    state: status.state,
    head: status.head,
    checks: status.checks.state,
    review: status.unanswered ? "unanswered" : status.review.state,
    merge:
      status.pr.mergeable === false
        ? "conflict"
        : status.pr.mergeable == null
          ? "unknown"
          : "mergeable",
    ...(status.reasons.length ? { reasons: status.reasons } : {}),
  };
}

export function selectMergeMethod(repository, rules = [], protection = null) {
  let allowed = new Set();
  if (repository.allow_merge_commit) allowed.add("merge");
  if (repository.allow_squash_merge) allowed.add("squash");
  if (repository.allow_rebase_merge) allowed.add("rebase");

  if (protection?.required_linear_history?.enabled) {
    allowed.delete("merge");
  }

  for (const rule of rules) {
    if (rule.type === "required_linear_history") {
      allowed.delete("merge");
    }
    if (rule.type === "pull_request" && Array.isArray(rule.parameters?.allowed_merge_methods)) {
      const branchAllowed = new Set(rule.parameters.allowed_merge_methods);
      allowed = new Set([...allowed].filter((method) => branchAllowed.has(method)));
    }
  }

  for (const method of ["merge", "squash", "rebase"]) {
    if (allowed.has(method)) return `--${method}`;
  }
  throw new Error("repository and target-branch rules allow no supported PR merge method");
}

export function mergePolicy(repository, rules = [], protection = null) {
  return {
    method: selectMergeMethod(repository, rules, protection),
    deleteBranch: !rules.some((rule) => rule.type === "merge_queue"),
  };
}

function remoteMergePolicy(owner, repo, base) {
  const repository = api(`repos/${owner}/${repo}`);
  const encodedBase = encodeURIComponent(base);
  const rules = pageArrays(`repos/${owner}/${repo}/rules/branches/${encodedBase}?per_page=100`);
  const protection = optionalApi(`repos/${owner}/${repo}/branches/${encodedBase}/protection`);
  return mergePolicy(repository, rules, protection);
}

function merge(target) {
  const status = inspect(target);
  if (status.state !== "ready") {
    process.stdout.write(`${JSON.stringify({ ...compact(status), merged: false })}\n`);
    process.exitCode = 2;
    return;
  }

  const policy = remoteMergePolicy(status.owner, status.repo, status.pr.base.ref);
  const args = [
    "pr",
    "merge",
    String(status.number),
    "-R",
    `${status.owner}/${status.repo}`,
    policy.method,
    "--match-head-commit",
    status.head,
  ];
  if (policy.deleteBranch) {
    args.push("--delete-branch");
  }
  gh(args);
  const merged = api(`repos/${status.owner}/${status.repo}/pulls/${status.number}`);
  process.stdout.write(
    `${JSON.stringify({
      pr: status.target,
      state: merged.merged ? "merged" : "waiting",
      head: status.head,
      merged: Boolean(merged.merged),
      ...(!merged.merged ? { reason: "merge accepted but not completed" } : {}),
    })}\n`,
  );
}

export function main(argv = process.argv.slice(2)) {
  const [command, target, ...extra] = argv;
  if (extra.length || !target || !["pr", "merge"].includes(command)) {
    throw new Error("usage: workctl <pr|merge> <repo#number|owner/repo#number>");
  }
  if (command === "pr") {
    process.stdout.write(`${JSON.stringify(compact(inspect(target)))}\n`);
  } else {
    merge(target);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ error: error.message })}\n`);
    process.exitCode = 1;
  }
}
