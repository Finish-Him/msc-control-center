import { Router } from "express";
import { env } from "../_core/env.js";
import { requireAuth } from "../_core/auth.js";
import { db } from "../db.js";
import { gradioApps } from "../../drizzle/schema.js";
import { sshExec } from "../_core/ssh.js";
import { defaultVpsConfig, fetchVpsStats } from "../_core/vps-helpers.js";
import { Octokit } from "@octokit/rest";
import type { DashboardSummary } from "@shared/types.js";

const router = Router();

// GET /api/dashboard/summary — aggregate data for home page
router.get("/summary", requireAuth, async (_req, res) => {
  const result: DashboardSummary = {
    vps: { online: false, host: env.VPS_HOST, stats: null },
    docker: { running: 0, total: 0 },
    github: { repos: 0, lastPush: null },
    gradio: { online: 0, total: 0 },
    services: { active: 0, total: 0 },
  };

  // Parallel fetches — non-fatal failures
  await Promise.allSettled([
    // VPS ping + basic stats
    (async () => {
      if (!env.VPS_HOST) return;
      const cfg = defaultVpsConfig();
      const stats = await fetchVpsStats(cfg, 10_000);
      result.vps = { online: true, host: env.VPS_HOST, stats };
    })(),

    // Docker containers count
    (async () => {
      if (!env.VPS_HOST) return;
      const raw = await sshExec(defaultVpsConfig(), `docker ps -q | wc -l && docker ps -a -q | wc -l`, 10_000);
      const [running, total] = raw.split("\n").map(Number);
      result.docker = { running: running || 0, total: total || 0 };
    })(),

    // GitHub repos
    (async () => {
      if (!env.GITHUB_TOKEN) return;
      const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
      const { data } = await octokit.repos.listForAuthenticatedUser({ per_page: 1, sort: "pushed" });
      const all = await octokit.repos.listForAuthenticatedUser({ per_page: 100 });
      result.github = { repos: all.data.length, lastPush: data[0]?.pushed_at ?? null };
    })(),

    // Gradio apps status from DB
    (async () => {
      const apps = await db.select().from(gradioApps);
      const online = apps.filter((a) => a.lastStatus === "ok" || a.lastStatus === "warn").length;
      result.gradio = { online, total: apps.length };
    })(),
  ]);

  res.json(result);
});

export default router;
