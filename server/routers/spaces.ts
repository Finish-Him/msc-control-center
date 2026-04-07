import { Router } from "express";
import { HF_SPACES } from "../../shared/const.js";
import type { SpaceStatus, SpaceWithStatus } from "../../shared/types.js";

const router = Router();

// In-memory status cache — no DB needed (catalog is static)
const statusCache = new Map<string, { status: SpaceStatus; latencyMs?: number; checkedAt: string }>();

async function pingSpace(appUrl: string): Promise<{ status: SpaceStatus; latencyMs: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const t0 = Date.now();
  try {
    const res = await fetch(appUrl, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    const latencyMs = Date.now() - t0;
    clearTimeout(timeout);
    if (!res.ok && res.status >= 500) return { status: "fail", latencyMs };
    const status: SpaceStatus = latencyMs > 3000 ? "sleeping" : "ok";
    return { status, latencyMs };
  } catch {
    clearTimeout(timeout);
    const latencyMs = Date.now() - t0;
    return { status: "fail", latencyMs };
  }
}

// GET /api/spaces — list all spaces with cached status
router.get("/", (_req, res) => {
  const result: SpaceWithStatus[] = (HF_SPACES as unknown as SpaceWithStatus[]).map((space) => {
    const cached = statusCache.get(space.id);
    return {
      ...space,
      status: cached?.status ?? "unknown",
      latencyMs: cached?.latencyMs,
      checkedAt: cached?.checkedAt,
    };
  });
  res.json(result);
});

// POST /api/spaces/:id/check — ping a single space
router.post("/:id/check", async (req, res) => {
  const { id } = req.params;
  const space = (HF_SPACES as readonly { id: string; appUrl: string }[]).find((s) => s.id === id);
  if (!space) {
    res.status(404).json({ error: "Space not found" });
    return;
  }
  const { status, latencyMs } = await pingSpace(space.appUrl);
  const checkedAt = new Date().toISOString();
  statusCache.set(id, { status, latencyMs, checkedAt });
  res.json({ id, status, latencyMs, checkedAt });
});

// POST /api/spaces/check-all — ping all spaces (background, returns immediately)
router.post("/check-all", async (_req, res) => {
  res.json({ message: "Check started", count: HF_SPACES.length });
  // fire-and-forget
  void Promise.all(
    (HF_SPACES as readonly { id: string; appUrl: string }[]).map(async (space) => {
      const { status, latencyMs } = await pingSpace(space.appUrl);
      statusCache.set(space.id, { status, latencyMs, checkedAt: new Date().toISOString() });
    }),
  );
});

export default router;
