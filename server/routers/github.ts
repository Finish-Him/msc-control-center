import { Router } from "express";
import { Octokit } from "@octokit/rest";
import { requireAuth } from "../_core/auth.js";
import { env } from "../_core/env.js";
import type { GithubRepo, GithubCommit, GithubOverview } from "@shared/types.js";

const router = Router();
router.use(requireAuth);

function getOctokit() {
  if (!env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN não configurado");
  return new Octokit({ auth: env.GITHUB_TOKEN });
}

// GET /api/github/repos
router.get("/repos", async (_req, res) => {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: "pushed",
      direction: "desc",
    });
    const repos: GithubRepo[] = data.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description ?? null,
      language: r.language ?? null,
      stars: r.stargazers_count ?? 0,
      forks: r.forks_count ?? 0,
      openIssues: r.open_issues_count ?? 0,
      isPrivate: r.private,
      htmlUrl: r.html_url,
      pushedAt: r.pushed_at ?? null,
      defaultBranch: r.default_branch,
    }));
    res.json(repos);
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

// GET /api/github/commits?repo=owner/name&limit=20
router.get("/commits", async (req, res) => {
  const repo = req.query.repo as string;
  const limit = Math.min(parseInt((req.query.limit as string) || "20"), 100);

  if (!repo || !repo.includes("/")) {
    res.status(400).json({ error: "repo param obrigatório (owner/name)" });
    return;
  }
  const [owner, name] = repo.split("/");

  try {
    const octokit = getOctokit();
    const { data } = await octokit.repos.listCommits({
      owner,
      repo: name,
      per_page: limit,
    });
    const commits: GithubCommit[] = data.map((c) => ({
      sha: c.sha,
      message: c.commit.message.split("\n")[0],
      author: c.commit.author?.name ?? c.author?.login ?? "unknown",
      date: c.commit.author?.date ?? "",
      htmlUrl: c.html_url,
      repoName: name,
    }));
    res.json(commits);
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

// GET /api/github/overview
router.get("/overview", async (_req, res) => {
  try {
    const octokit = getOctokit();
    const { data } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
    });

    const langCount: Record<string, number> = {};
    let totalStars = 0;
    let pub = 0;
    let priv = 0;

    for (const r of data) {
      totalStars += r.stargazers_count ?? 0;
      if (r.private) priv++;
      else pub++;
      if (r.language) langCount[r.language] = (langCount[r.language] ?? 0) + 1;
    }

    const mostUsedLanguages = Object.entries(langCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([language, count]) => ({ language, count }));

    const overview: GithubOverview = {
      totalRepos: data.length,
      totalPublic: pub,
      totalPrivate: priv,
      totalStars,
      mostUsedLanguages,
    };
    res.json(overview);
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

export default router;
