#!/usr/bin/env node

import { execFile, spawnSync } from "node:child_process";

const DEFAULT_OWNER = "moritzbrantner";
const CODEX_BOT_ID = 199175422;
const CODEX_BOT_LOGIN = "chatgpt-codex-connector[bot]";
const RENOVATE_BOT_LOGIN = "renovate[bot]";
const PASS = new Set(["success", "skipped", "neutral"]);
const TRUSTED_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

export function parseTarget(value) {
  const url = value.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/);
  if (url) {
    return { owner: url[1], repo: url[2], number: Number(url[3]) };
  }
  const short = value.match(/^(?:(?<owner>[^/#]+)\/)?(?<repo>[^/#]+)#(?<number>\d+)$/);
  if (!short) {
    throw new Error(`invalid PR target: ${value}`);
  }
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
  if (result.error) {
    throw result.error;
  }
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
  if (result.error) {
    throw result.error;
  }
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

const SCAN_SEARCH_QUERY = `query($q: String!, $after: String) {
  search(query: $q, type: ISSUE, first: 100, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes { ... on PullRequest { id } }
  }
}`;
// Detail queries are slow server-side (several seconds per batch), so small
// batches run concurrently instead of one long sequential cursor walk.
const SCAN_BATCH_SIZE = 10;
const SCAN_CONCURRENCY = 8;
const SCAN_DETAIL_QUERY = `query($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on PullRequest {
      number state isDraft headRefOid baseRefName mergeable mergeStateStatus
      author { ...actor }
      repository { name owner { login } defaultBranchRef { name } }
      commits(last: 1) {
        nodes { commit { statusCheckRollup { contexts(first: 100) {
          pageInfo { hasNextPage }
          nodes {
            __typename
            ... on CheckRun { name status conclusion }
            ... on StatusContext { context state }
          }
        } } } }
      }
      comments(first: 100) {
        pageInfo { hasNextPage }
        nodes { body createdAt updatedAt author { ...actor } }
      }
      reviewThreads(first: 50) {
        pageInfo { hasNextPage }
        nodes { comments(first: 20) {
          pageInfo { hasNextPage }
          nodes {
            databaseId body authorAssociation
            replyTo { databaseId }
            author { ...actor }
          }
        } }
      }
    }
  }
}
fragment actor on Actor { __typename login ... on Bot { databaseId } ... on User { databaseId } }`;

export function scanQuery(owner, repo = null) {
  const scope = repo ? `repo:${repo.includes("/") ? repo : `${owner}/${repo}`}` : `user:${owner}`;
  return `is:pr is:open ${scope} sort:updated-desc`;
}

function ghJsonAsync(args) {
  return new Promise((resolve, reject) => {
    execFile(
      process.env.WORKCTL_GH ?? "gh",
      args,
      { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error((stderr || stdout || error.message).trim()));
        } else {
          resolve(stdout.trim() ? JSON.parse(stdout) : null);
        }
      },
    );
  });
}

function searchPullRequestIds(query) {
  const ids = [];
  let after = null;
  do {
    const args = ["api", "graphql", "-f", `query=${SCAN_SEARCH_QUERY}`, "-f", `q=${query}`];
    if (after) {
      args.push("-f", `after=${after}`);
    }
    const search = ghJson(args)?.data?.search;
    if (!search) {
      throw new Error("GitHub GraphQL search returned no data");
    }
    ids.push(...(search.nodes ?? []).map((node) => node?.id).filter(Boolean));
    after = search.pageInfo?.hasNextPage ? search.pageInfo.endCursor : null;
  } while (after);
  return ids;
}

async function graphqlPullRequests(query) {
  const ids = searchPullRequestIds(query);
  const batches = [];
  for (let index = 0; index < ids.length; index += SCAN_BATCH_SIZE) {
    batches.push(ids.slice(index, index + SCAN_BATCH_SIZE));
  }
  const results = new Array(batches.length);
  let next = 0;
  async function worker() {
    while (next < batches.length) {
      const index = next++;
      const args = ["api", "graphql", "-f", `query=${SCAN_DETAIL_QUERY}`];
      for (const id of batches[index]) {
        args.push("-f", `ids[]=${id}`);
      }
      const nodes = (await ghJsonAsync(args))?.data?.nodes;
      if (!Array.isArray(nodes)) {
        throw new Error("GitHub GraphQL nodes returned no data");
      }
      results[index] = nodes.filter((node) => node?.number != null);
    }
  }
  await Promise.all(Array.from({ length: Math.min(SCAN_CONCURRENCY, batches.length) }, worker));
  return results.flat();
}

function restUser(actor) {
  if (!actor) {
    return null;
  }
  const bot = actor.__typename === "Bot";
  return {
    login: bot ? `${actor.login}[bot]` : actor.login,
    id: actor.databaseId ?? null,
    type: bot ? "Bot" : "User",
  };
}

const MERGEABLE = { MERGEABLE: true, CONFLICTING: false };

// Builds the same status object as inspect() from one GraphQL search node, or
// returns null when a nested connection was truncated and REST must be used.
export function statusFromGraphql(node) {
  const owner = node.repository.owner.login;
  const repo = node.repository.name;
  const number = node.number;
  const head = node.headRefOid;
  const pr = {
    state: (node.state ?? "").toLowerCase(),
    draft: Boolean(node.isDraft),
    user: restUser(node.author),
    head: { sha: head },
    base: { ref: node.baseRefName },
    mergeable: MERGEABLE[node.mergeable] ?? null,
    mergeable_state: node.mergeStateStatus ? node.mergeStateStatus.toLowerCase() : undefined,
  };
  const status = { owner, repo, number, target: `${owner}/${repo}#${number}`, pr, head };
  const defaultBranch = node.repository.defaultBranchRef?.name;
  const baseReason = nonDefaultBaseReason(pr, defaultBranch);
  if (baseReason) {
    return {
      ...status,
      checks: { state: "skipped", failed: [], pending: [] },
      review: { state: "skipped" },
      blockingFindings: 0,
      state: "waiting",
      reasons: [baseReason],
    };
  }
  const contexts = node.commits?.nodes?.[0]?.commit?.statusCheckRollup?.contexts;
  const threads = node.reviewThreads;
  if (
    contexts?.pageInfo?.hasNextPage ||
    node.comments?.pageInfo?.hasNextPage ||
    threads?.pageInfo?.hasNextPage ||
    (threads?.nodes ?? []).some((thread) => thread?.comments?.pageInfo?.hasNextPage)
  ) {
    return null;
  }
  const runs = [];
  const statuses = [];
  for (const context of contexts?.nodes ?? []) {
    if (context.__typename === "CheckRun") {
      runs.push({ name: context.name, status: context.status, conclusion: context.conclusion });
    } else if (context.__typename === "StatusContext") {
      statuses.push({ context: context.context, state: context.state });
    }
  }
  const renovate = isRenovate(pr);
  const issueComments = renovate
    ? []
    : (node.comments?.nodes ?? []).map((comment) => ({
        user: restUser(comment.author),
        body: comment.body,
        created_at: comment.createdAt,
        updated_at: comment.updatedAt,
      }));
  const reviewComments = (threads?.nodes ?? []).flatMap((thread) =>
    (thread?.comments?.nodes ?? []).map((comment) => ({
      id: comment.databaseId,
      in_reply_to_id: comment.replyTo?.databaseId ?? null,
      user: restUser(comment.author),
      author_association: comment.authorAssociation,
      body: comment.body,
    })),
  );
  const checks = checkState(runs, statuses);
  const review = renovate ? { state: "skipped" } : codexReview(issueComments, head);
  const blockingFindings = unansweredBlockingCodexFindings(reviewComments);
  return {
    ...status,
    checks,
    review,
    blockingFindings,
    ...classify({ pr, checks, blockingFindings, defaultBranch }),
  };
}

function nonDefaultBaseReason(pr, defaultBranch) {
  const base = pr.base?.ref;
  if (!base || !defaultBranch || base === defaultBranch) {
    return null;
  }
  return `base ${base} is not default branch ${defaultBranch}`;
}

function isCodex(user) {
  return user?.id === CODEX_BOT_ID && user?.login === CODEX_BOT_LOGIN;
}

function isRenovate(pr) {
  return pr.user?.type === "Bot" && pr.user?.login === RENOVATE_BOT_LOGIN;
}

function time(value) {
  return Date.parse(value?.updated_at ?? value?.created_at ?? 0) || 0;
}

export function codexReview(issueComments, head) {
  const summary = issueComments
    .filter((comment) => isCodex(comment.user))
    .filter((comment) =>
      /codex-pull-request-review-summary|Codex Review Summary/i.test(comment.body ?? ""),
    )
    .sort((a, b) => time(b) - time(a))[0];
  if (!summary) {
    return { state: "absent" };
  }

  const row = (summary.body ?? "")
    .split("\n")
    .filter((line) => /^\|/.test(line) && /Code Review/i.test(line))
    .at(-1);
  if (!row || !/Completed/i.test(row)) {
    return { state: "running" };
  }

  const commit = row.match(/`([0-9a-f]{7,40})`/i)?.[1]?.toLowerCase();
  if (!commit) {
    return { state: "unknown" };
  }
  if (!head.toLowerCase().startsWith(commit)) {
    return { state: "stale", commit };
  }
  return { state: "complete", commit };
}

function isHighPriorityCodexFinding(comment) {
  const heading = (comment.body ?? "").split("\n", 1)[0];
  return /\bP[01]\s+Badge\b|\[P[01]\]/i.test(heading);
}

export function unansweredBlockingCodexFindings(comments) {
  const replies = new Map();
  for (const comment of comments) {
    if (comment.in_reply_to_id == null) {
      continue;
    }
    replies.set(comment.in_reply_to_id, [...(replies.get(comment.in_reply_to_id) ?? []), comment]);
  }
  return comments.filter(
    (comment) =>
      comment.in_reply_to_id == null &&
      isCodex(comment.user) &&
      isHighPriorityCodexFinding(comment) &&
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
    if ((check.status ?? "").toLowerCase() !== "completed") {
      pending.push(name);
    } else if (!PASS.has((check.conclusion ?? "").toLowerCase())) {
      failed.push(name);
    }
  }
  for (const status of statuses) {
    const name = status.context ?? "unnamed status";
    const state = (status.state ?? "").toLowerCase();
    if (["failure", "error"].includes(state)) {
      failed.push(name);
    } else if (state !== "success") {
      pending.push(name);
    }
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
      if (!old || time(status) > time(old)) {
        latest.set(status.context, status);
      }
    }
  }
  return [...latest.values()];
}

export function classify({ pr, checks, blockingFindings, defaultBranch }) {
  const baseReason = nonDefaultBaseReason(pr, defaultBranch);
  if (baseReason) {
    return { state: "waiting", reasons: [baseReason] };
  }

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
    if (state !== "broken") {
      state = "waiting";
    }
    reasons.push(`mergeability ${pr.mergeable_state ?? "unknown"}`);
  }
  if (checks.state === "failed") {
    state = "broken";
    reasons.push(`failed checks: ${checks.failed.join(", ")}`);
  } else if (checks.state === "pending" && state !== "broken") {
    state = "waiting";
    reasons.push(`pending checks: ${checks.pending.join(", ")}`);
  }
  if (blockingFindings) {
    state = "broken";
    reasons.push(
      `${blockingFindings} unanswered high-priority Codex finding${blockingFindings === 1 ? "" : "s"}`,
    );
  }
  return { state, reasons };
}

function inspect(target, repository = null) {
  const { owner, repo, number } = parseTarget(target);
  const prefix = `repos/${owner}/${repo}`;
  const repoInfo = repository ?? api(prefix);
  const pr = api(`${prefix}/pulls/${number}`);
  const head = pr.head.sha;
  const baseReason = nonDefaultBaseReason(pr, repoInfo.default_branch);
  if (baseReason) {
    return {
      owner,
      repo,
      number,
      target: `${owner}/${repo}#${number}`,
      pr,
      head,
      checks: { state: "skipped", failed: [], pending: [] },
      review: { state: "skipped" },
      blockingFindings: 0,
      state: "waiting",
      reasons: [baseReason],
    };
  }
  const renovate = isRenovate(pr);
  const runs = pages(`${prefix}/commits/${head}/check-runs?filter=latest&per_page=100`).flatMap(
    (page) => page?.check_runs ?? [],
  );
  const statuses = latestStatuses(pages(`${prefix}/commits/${head}/status?per_page=100`));
  const issueComments = renovate
    ? []
    : pageArrays(`${prefix}/issues/${number}/comments?per_page=100`);
  const reviewComments = pageArrays(`${prefix}/pulls/${number}/comments?per_page=100`);
  const checks = checkState(runs, statuses);
  const review = renovate ? { state: "skipped" } : codexReview(issueComments, head);
  const blockingFindings = unansweredBlockingCodexFindings(reviewComments);
  return {
    owner,
    repo,
    number,
    target: `${owner}/${repo}#${number}`,
    pr,
    head,
    checks,
    review,
    blockingFindings,
    ...classify({
      pr,
      checks,
      blockingFindings,
      defaultBranch: repoInfo.default_branch,
    }),
  };
}

function compact(status) {
  return {
    pr: status.target,
    state: status.state,
    head: status.head,
    checks: status.checks.state,
    review: status.review.state,
    ...(status.blockingFindings ? { blockingFindings: status.blockingFindings } : {}),
    merge:
      status.pr.mergeable === false
        ? "conflict"
        : status.pr.mergeable == null
          ? "unknown"
          : "mergeable",
    ...(status.reasons.length ? { reasons: status.reasons } : {}),
  };
}

export async function scan(owner = DEFAULT_OWNER, repo = null) {
  const groups = { ready: [], broken: [], waiting: [] };
  for (const node of await graphqlPullRequests(scanQuery(owner, repo))) {
    const status =
      statusFromGraphql(node) ??
      inspect(`${node.repository.owner.login}/${node.repository.name}#${node.number}`);
    groups[status.state].push(compact(status));
  }
  return {
    summary: {
      total: groups.ready.length + groups.broken.length + groups.waiting.length,
      ready: groups.ready.length,
      broken: groups.broken.length,
      waiting: groups.waiting.length,
    },
    ...groups,
  };
}

export function selectMergeMethod(repository, rules = [], protection = null) {
  let allowed = new Set();
  if (repository.allow_merge_commit) {
    allowed.add("merge");
  }
  if (repository.allow_squash_merge) {
    allowed.add("squash");
  }
  if (repository.allow_rebase_merge) {
    allowed.add("rebase");
  }

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
    if (allowed.has(method)) {
      return `--${method}`;
    }
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

const USAGE =
  "usage: workctl scan [repo|owner/repo] | workctl <pr|merge> <repo#number|owner/repo#number>";

export function main(argv = process.argv.slice(2)) {
  const [command, target, ...extra] = argv;
  if (command === "scan") {
    if (extra.length || target?.startsWith("-")) {
      throw new Error(USAGE);
    }
    // Async; errors are reported here so synchronous callers keep JSON errors.
    return scan(DEFAULT_OWNER, target ?? null).then(
      (result) => process.stdout.write(`${JSON.stringify(result)}\n`),
      (error) => {
        process.stderr.write(`${JSON.stringify({ error: error.message })}\n`);
        process.exitCode = 1;
      },
    );
  }
  if (extra.length || !target || !["pr", "merge"].includes(command)) {
    throw new Error(USAGE);
  }
  if (command === "pr") {
    process.stdout.write(`${JSON.stringify(compact(inspect(target)))}\n`);
  } else {
    merge(target);
  }
}

if (typeof import.meta.main !== "boolean") {
  throw new Error("workctl requires Node.js 22.18+ or 24.2+ with import.meta.main support");
}

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ error: error.message })}\n`);
    process.exitCode = 1;
  }
}
