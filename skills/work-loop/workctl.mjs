#!/usr/bin/env node

import { execFile, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const DEFAULT_OWNER = "moritzbrantner";
// Repos that moved to the moenarch-games org; everything else stays under DEFAULT_OWNER.
const ORG = "moenarch-games";
const REPO_OWNERS = {
  mmorpg: ORG,
  arpg: ORG,
  zoo: ORG,
  "my-farm": ORG,
  "battle-royale": ORG,
  "raid-defense": ORG,
};
const SCAN_OWNERS = [DEFAULT_OWNER, ORG];

export function ownerFor(repo) {
  return REPO_OWNERS[repo] ?? DEFAULT_OWNER;
}
const CODEX_BOT_ID = 199175422;
const CODEX_BOT_LOGIN = "chatgpt-codex-connector[bot]";
const RENOVATE_BOT_LOGIN = "renovate[bot]";
const PASS = new Set(["success", "skipped", "neutral"]);
const TRUSTED_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

export function parseTarget(value) {
  const url = value.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:pull|issues)\/(\d+)\/?$/);
  if (url) {
    return { owner: url[1], repo: url[2], number: Number(url[3]) };
  }
  const short = value.match(/^(?:(?<owner>[^/#]+)\/)?(?<repo>[^/#]+)#(?<number>\d+)$/);
  if (!short) {
    throw new Error(`invalid target: ${value}`);
  }
  return {
    owner: short.groups.owner ?? ownerFor(short.groups.repo),
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

export function scanQuery(owners = SCAN_OWNERS, repo = null) {
  const scope = repo
    ? `repo:${repo.includes("/") ? repo : `${ownerFor(repo)}/${repo}`}`
    : [owners]
        .flat()
        .map((owner) => `user:${owner}`)
        .join(" ");
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

export async function scan(owners = SCAN_OWNERS, repo = null) {
  const groups = { ready: [], broken: [], waiting: [] };
  for (const node of await graphqlPullRequests(scanQuery(owners, repo))) {
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
  const queue = rules.some((rule) => rule.type === "merge_queue");
  return {
    method: selectMergeMethod(repository, rules, protection),
    deleteBranch: !queue,
    queue,
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
    // A merge queue sets the method itself; gh then enqueues the PR instead of merging it.
    ...(policy.queue ? [] : [policy.method]),
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
      state: merged.merged ? "merged" : policy.queue ? "queued" : "waiting",
      head: status.head,
      merged: Boolean(merged.merged),
      ...(!merged.merged && !policy.queue ? { reason: "merge accepted but not completed" } : {}),
    })}\n`,
  );
}

const ISSUE_QUERY = `query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    issue(number: $number) {
      title state stateReason
      labels(first: 50) { nodes { name } }
      blockedBy(first: 50) { nodes { number state repository { nameWithOwner } } }
      closedByPullRequestsReferences(first: 20, includeClosedPrs: true) { nodes { number state } }
      body
      comments(last: 100) { totalCount nodes { author { login } createdAt isMinimized body } }
    }
  }
}`;

// Shrinks issue Markdown for agents: drops HTML comments and, unless full, collapses <details>.
export function condenseMarkdown(text, full = false) {
  let result = (text ?? "").replace(/\r\n/g, "\n").replace(/<!--[\s\S]*?-->/g, "");
  if (!full) {
    result = result.replace(/<details[^>]*>([\s\S]*?)<\/details>/gi, (block, inner) => {
      const summary = inner.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1].trim() || "details";
      return `[${summary}: ${block.split("\n").length} lines hidden, --full shows them]`;
    });
  }
  return result.replace(/\n{3,}/g, "\n\n").trim();
}

// Bodies above this size print as a heading outline unless --full or --section asks for text.
const OUTLINE_THRESHOLD = 8000;

export function markdownSections(text) {
  const lines = text.split("\n");
  const sections = [];
  let fence = false;
  lines.forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    const heading = !fence && line.match(/^(#{1,6})\s+(.*)$/);
    if (heading)
      sections.push({ level: heading[1].length, title: heading[2].trim(), start: index });
  });
  return sections.map((section, index) => {
    const next = sections.slice(index + 1).find((later) => later.level <= section.level);
    const end = next ? next.start : lines.length;
    return {
      ...section,
      text: lines.slice(section.start, end).join("\n").trim(),
      lines: end - section.start,
    };
  });
}

function renderBody(body, { full, sections }) {
  if (sections.length) {
    const wanted = sections.map((section) => section.toLowerCase());
    const matches = markdownSections(body).filter((section) =>
      wanted.some((needle) => section.title.toLowerCase().includes(needle)),
    );
    return matches.length
      ? matches.map((section) => section.text).join("\n\n")
      : `(no heading matches ${sections.join(", ")}; drop --section to see the outline)`;
  }
  if (full || body.length <= OUTLINE_THRESHOLD) return body || "(no body)";
  const outline = markdownSections(body).map(
    (section) => `${"  ".repeat(section.level - 1)}${section.title} (${section.lines} lines)`,
  );
  const preface = body.split(/\n#{1,6}\s/, 1)[0].trim();
  return [
    `[body is ${body.length} chars; outline below. --section <heading text> prints a section, --full prints all]`,
    ...(preface ? ["", preface.length > 1500 ? `${preface.slice(0, 1500)}…` : preface] : []),
    "",
    ...outline,
  ].join("\n");
}

export function renderIssue(target, issue, { full = false, since = null, sections = [] } = {}) {
  const state = issue.stateReason
    ? `${issue.state} (${issue.stateReason.toLowerCase()})`
    : issue.state;
  const facts = [
    issue.labels.nodes.length &&
      `labels: ${issue.labels.nodes.map((label) => label.name).join(", ")}`,
    issue.blockedBy.nodes.length &&
      `blocked by: ${issue.blockedBy.nodes
        .map((dep) => `${dep.repository.nameWithOwner}#${dep.number} ${dep.state}`)
        .join(", ")}`,
    issue.closedByPullRequestsReferences.nodes.length &&
      `closing PRs: ${issue.closedByPullRequestsReferences.nodes
        .map((pr) => `#${pr.number} ${pr.state}`)
        .join(", ")}`,
  ].filter(Boolean);
  const all = issue.comments.nodes;
  const visible = all.filter((comment) => !comment.isMinimized);
  const shown = since ? visible.filter((comment) => comment.createdAt > since) : visible;
  const notes = [
    issue.comments.totalCount > all.length &&
      `${issue.comments.totalCount - all.length} older not fetched`,
    all.length > visible.length && `${all.length - visible.length} minimized hidden`,
    since && `${visible.length - shown.length} before ${since} hidden`,
  ].filter(Boolean);
  const lines = [`${target} ${state}: ${issue.title}`];
  if (facts.length) lines.push(facts.join(" | "));
  if (!since || sections.length)
    lines.push("", renderBody(condenseMarkdown(issue.body, full), { full, sections }));
  lines.push("", `--- ${shown.length} comments${notes.length ? ` (${notes.join(", ")})` : ""}`);
  for (const comment of shown) {
    lines.push(
      "",
      `@${comment.author?.login ?? "ghost"} ${comment.createdAt.slice(0, 16).replace("T", " ")}:`,
      condenseMarkdown(comment.body, full),
    );
  }
  return `${lines.join("\n")}\n`;
}

function issue(target, options) {
  const { owner, repo, number } = parseTarget(target);
  const data = ghJson([
    "api",
    "graphql",
    "-f",
    `query=${ISSUE_QUERY}`,
    "-F",
    `owner=${owner}`,
    "-F",
    `repo=${repo}`,
    "-F",
    `number=${number}`,
  ]);
  const found = data?.data?.repository?.issue;
  if (!found) throw new Error(`issue not found: ${owner}/${repo}#${number}`);
  process.stdout.write(renderIssue(`${owner}/${repo}#${number}`, found, options));
}

const WAIT_USAGE =
  "workctl wait pr <repo#number> | wait run <repo> <run-id> | wait pid <pid> | wait file <path> [--contains <text>] (all take [--timeout <seconds>], default 3600)";

function ghRaw(args) {
  const result = spawnSync(process.env.WORKCTL_GH ?? "gh", args, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  return { status: result.status, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Checks of a PR as `{ name: bucket }`: required checks, or all checks when none are required. */
function prChecks(owner, repo, number, run = ghRaw) {
  for (const extra of [["--required"], []]) {
    const result = run([
      "pr",
      "checks",
      String(number),
      "-R",
      `${owner}/${repo}`,
      ...extra,
      "--json",
      "name,bucket",
    ]);
    if (result.stdout.startsWith("[")) {
      const checks = JSON.parse(result.stdout);
      if (checks.length) return Object.fromEntries(checks.map((c) => [c.name, c.bucket]));
    } else if (result.status !== 0 && !/no (required )?checks reported/i.test(result.stderr)) {
      throw new Error(result.stderr || `gh pr checks exited ${result.status}`);
    }
  }
  return {};
}

function processAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

function fileMatches(path, text, read = readFileSync) {
  try {
    const content = read(path, "utf8");
    return text === null || content.includes(text);
  } catch {
    return false;
  }
}

/**
 * One wait probe: `{ done: false }` while waiting, else `{ done: true, exitCode, ...details }`.
 * `elapsedMs` lets probes give up on PRs whose checks never appear.
 */
export function waitProbe(
  spec,
  { run = ghRaw, alive = processAlive, read = readFileSync, elapsedMs = 0 } = {},
) {
  if (spec.kind === "pr") {
    const checks = prChecks(spec.owner, spec.repo, spec.number, run);
    const buckets = Object.values(checks);
    if (!buckets.length) {
      return elapsedMs >= 120_000
        ? { done: true, exitCode: 0, state: "no-checks", checks }
        : { done: false };
    }
    if (buckets.includes("pending")) return { done: false };
    const failing = Object.keys(checks).filter((name) => ["fail", "cancel"].includes(checks[name]));
    return failing.length
      ? { done: true, exitCode: 1, state: "red", failing, checks }
      : { done: true, exitCode: 0, state: "green", checks };
  }
  if (spec.kind === "run") {
    const result = run([
      "run",
      "view",
      spec.runId,
      "-R",
      `${spec.owner}/${spec.repo}`,
      "--json",
      "status,conclusion,name,url",
    ]);
    if (result.status !== 0)
      throw new Error(result.stderr || `gh run view exited ${result.status}`);
    const view = JSON.parse(result.stdout);
    if (view.status !== "completed") return { done: false };
    const green = PASS.has(view.conclusion);
    return {
      done: true,
      exitCode: green ? 0 : 1,
      state: green ? "green" : "red",
      conclusion: view.conclusion,
      name: view.name,
      url: view.url,
    };
  }
  if (spec.kind === "pid") {
    return alive(spec.pid) ? { done: false } : { done: true, exitCode: 0, state: "exited" };
  }
  return fileMatches(spec.path, spec.contains, read)
    ? { done: true, exitCode: 0, state: "matched" }
    : { done: false };
}

export function parseWait(args) {
  const [kind, ...rest] = args;
  const positional = [];
  let timeout = 3600;
  let contains = null;
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] === "--timeout" && rest[index + 1]) timeout = Number(rest[(index += 1)]);
    else if (rest[index] === "--contains" && rest[index + 1] !== undefined)
      contains = rest[(index += 1)];
    else if (rest[index].startsWith("--")) throw new Error(`usage: ${WAIT_USAGE}`);
    else positional.push(rest[index]);
  }
  if (!Number.isFinite(timeout) || timeout <= 0) throw new Error(`usage: ${WAIT_USAGE}`);
  const base = { kind, timeoutMs: timeout * 1000 };
  if (kind === "pr" && positional.length === 1) {
    return { ...base, ...parseTarget(positional[0]), target: positional[0] };
  }
  if (kind === "run" && positional.length === 2 && /^\d+$/.test(positional[1])) {
    const [owner, repo] = positional[0].includes("/")
      ? positional[0].split("/")
      : [ownerFor(positional[0]), positional[0]];
    return { ...base, owner, repo, runId: positional[1], target: `${owner}/${repo}` };
  }
  if (kind === "pid" && positional.length === 1 && /^\d+$/.test(positional[0])) {
    return { ...base, pid: Number(positional[0]), target: positional[0] };
  }
  if (kind === "file" && positional.length === 1) {
    return { ...base, path: positional[0], contains, target: positional[0] };
  }
  throw new Error(`usage: ${WAIT_USAGE}`);
}

/**
 * Block until the target settles, polling with backoff (GitHub: 5s growing to 60s; local: 1s
 * growing to 5s). Prints one JSON line; exit code 0 green/done, 1 red, 2 timeout.
 */
export async function wait(spec, { now = Date.now, pause = sleep, ...probeDeps } = {}) {
  const started = now();
  const remote = spec.kind === "pr" || spec.kind === "run";
  let delay = remote ? 5000 : 1000;
  const maxDelay = remote ? 60_000 : 5000;
  for (;;) {
    const elapsedMs = now() - started;
    const probe = waitProbe(spec, { ...probeDeps, elapsedMs });
    if (probe.done) {
      const { done: _done, ...result } = probe;
      return {
        kind: spec.kind,
        target: spec.target,
        ...result,
        waitedSeconds: Math.round(elapsedMs / 1000),
      };
    }
    if (elapsedMs >= spec.timeoutMs) {
      return {
        kind: spec.kind,
        target: spec.target,
        exitCode: 2,
        state: "timeout",
        waitedSeconds: Math.round(elapsedMs / 1000),
      };
    }
    await pause(Math.min(delay, Math.max(spec.timeoutMs - elapsedMs, 0)));
    delay = Math.min(Math.round(delay * 1.5), maxDelay);
  }
}

const USAGE = `usage: workctl scan [repo|owner/repo] | workctl <pr|merge> <repo#number|owner/repo#number> | workctl issue <repo#number> [--full] [--section <heading text>]... [--since <ISO time>] | ${WAIT_USAGE}`;

export function main(argv = process.argv.slice(2)) {
  const [command, target, ...extra] = argv;
  if (command === "scan") {
    if (extra.length || (target !== undefined && !/^(?:\w[\w.-]*\/)?[\w.][\w.-]*$/.test(target))) {
      throw new Error(USAGE);
    }
    // Async; errors are reported here so synchronous callers keep JSON errors.
    return scan(SCAN_OWNERS, target ?? null).then(
      (result) => process.stdout.write(`${JSON.stringify(result)}\n`),
      (error) => {
        process.stderr.write(`${JSON.stringify({ error: error.message })}\n`);
        process.exitCode = 1;
      },
    );
  }
  if (command === "wait") {
    const spec = parseWait(argv.slice(1));
    return wait(spec).then(
      ({ exitCode, ...result }) => {
        process.stdout.write(`${JSON.stringify(result)}\n`);
        process.exitCode = exitCode;
      },
      (error) => {
        process.stderr.write(`${JSON.stringify({ error: error.message })}\n`);
        process.exitCode = 1;
      },
    );
  }
  if (command === "issue") {
    const options = { full: false, since: null, sections: [] };
    for (let index = 0; index < extra.length; index += 1) {
      if (extra[index] === "--full") options.full = true;
      else if (extra[index] === "--since" && extra[index + 1]) options.since = extra[(index += 1)];
      else if (extra[index] === "--section" && extra[index + 1])
        options.sections.push(extra[(index += 1)]);
      else throw new Error(USAGE);
    }
    if (!target) throw new Error(USAGE);
    return issue(target, options);
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
