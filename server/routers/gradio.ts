import { Router } from "express";
import { eq } from "drizzle-orm";
import cron from "node-cron";
import { db } from "../db.js";
import { gradioApps } from "../../drizzle/schema.js";
import { requireAuth } from "../_core/auth.js";
import { env } from "../_core/env.js";
import type { GradioStatus, GradioHealthResult } from "@shared/types.js";

const router = Router();
router.use(requireAuth);

// ─── Health check logic (ported from test_live_app.py) ───────────────────────

interface CheckResult {
  status: GradioStatus;
  version: string | null;
  message: string;
}

async function checkGradioApp(url: string): Promise<CheckResult> {
  const TIMEOUT = 12_000;

  // 1. Reachability
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { status: "fail", version: null, message: `HTTP ${r.status}` };
  } catch (e: any) {
    return { status: "fail", version: null, message: e.message ?? "unreachable" };
  }

  // 2. Config check
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT);
    const r = await fetch(`${url}/config`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { status: "warn", version: null, message: `/config HTTP ${r.status}` };
  } catch {
    return { status: "warn", version: null, message: "config endpoint unreachable" };
  }

  // 3. Detect version via /gradio_api/info
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT);
    const r = await fetch(`${url}/gradio_api/info`, { signal: ctrl.signal });
    clearTimeout(t);

    if (r.ok) {
      const info = (await r.json()) as any;
      const endpoints = info?.named_endpoints ?? {};
      const firstEndpoint = Object.values(endpoints)[0] as any;
      const choices: unknown[] =
        firstEndpoint?.parameters?.[0]?.component_props?.choices ?? [];
      const isV2 = choices.some(
        (c) => typeof c === "string" && c.includes("Avançado")
      );
      return { status: "ok", version: isV2 ? "v2" : "v1", message: "online" };
    }
  } catch {
    // info not available — still reachable
  }

  return { status: "ok", version: null, message: "online (version unknown)" };
}

// ─── Cron ────────────────────────────────────────────────────────────────────

export async function runGradioHealthChecks() {
  const apps = await db.select().from(gradioApps);
  for (const app of apps) {
    const result = await checkGradioApp(app.url);
    const now = new Date();
    const entry = { ts: now.toISOString(), status: result.status, msg: result.message };

    const prevHistory: Array<{ ts: string; status: string; msg: string }> =
      (app.healthHistory as any) ?? [];
    const history = [entry, ...prevHistory].slice(0, 48); // keep last 48 checks

    await db
      .update(gradioApps)
      .set({
        lastCheckedAt: now,
        lastStatus: result.status,
        lastMessage: result.message,
        version: result.version ?? app.version,
        healthHistory: history,
      })
      .where(eq(gradioApps.id, app.id));
  }
}

export function startGradioHealthCron() {
  const interval = env.GRADIO_CHECK_INTERVAL;
  const cronExpr = `*/${interval} * * * *`;
  cron.schedule(cronExpr, () => {
    runGradioHealthChecks().catch((e) =>
      console.error("[Gradio cron] error:", e.message)
    );
  });
  console.log(`[Gradio] Health check cron every ${interval}min`);
  // Run once immediately on startup
  runGradioHealthChecks().catch(() => {});
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/gradio
router.get("/", async (_req, res) => {
  const apps = await db.select().from(gradioApps);
  res.json(apps);
});

// POST /api/gradio/:id/check — manual trigger
router.post("/:id/check", async (req, res) => {
  const [app] = await db
    .select()
    .from(gradioApps)
    .where(eq(gradioApps.id, Number(req.params.id)))
    .limit(1);
  if (!app) {
    res.status(404).json({ error: "App not found" });
    return;
  }
  const result = await checkGradioApp(app.url);
  const now = new Date();
  const entry = { ts: now.toISOString(), status: result.status, msg: result.message };
  const prevHistory: Array<{ ts: string; status: string; msg: string }> =
    (app.healthHistory as any) ?? [];
  const history = [entry, ...prevHistory].slice(0, 48);

  await db
    .update(gradioApps)
    .set({
      lastCheckedAt: now,
      lastStatus: result.status,
      lastMessage: result.message,
      version: result.version ?? app.version,
      healthHistory: history,
    })
    .where(eq(gradioApps.id, app.id));

  const response: GradioHealthResult = {
    appId: app.id,
    status: result.status,
    version: result.version,
    message: result.message,
    checkedAt: now.toISOString(),
  };
  res.json(response);
});

// POST /api/gradio — add app
router.post("/", async (req, res) => {
  const { name, url } = req.body;
  if (!name || !url) {
    res.status(400).json({ error: "name e url são obrigatórios" });
    return;
  }
  const [row] = await db
    .insert(gradioApps)
    .values({ name, url, healthHistory: [] })
    .returning();
  res.status(201).json({ id: row.id });
});

// DELETE /api/gradio/:id
router.delete("/:id", async (req, res) => {
  await db.delete(gradioApps).where(eq(gradioApps.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;
