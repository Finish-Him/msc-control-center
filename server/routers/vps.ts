import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.js";
import { vpsInstances } from "../../drizzle/schema.js";
import { requireAuth } from "../_core/auth.js";
import { encrypt, decrypt } from "../_core/crypto.js";
import { sshExec } from "../_core/ssh.js";
import { defaultVpsConfig, fetchVpsStats } from "../_core/vps-helpers.js";
import type { VpsStats } from "@shared/types.js";

const router = Router();
router.use(requireAuth);

// GET /api/vps — list instances
router.get("/", async (_req, res) => {
  const rows = await db.select().from(vpsInstances);
  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      host: r.host,
      port: r.port,
      username: r.username,
      authType: r.authType,
      isDefault: r.isDefault,
      createdAt: r.createdAt,
    }))
  );
});

// GET /api/vps/stats — quick stats from default VPS
router.get("/stats", async (_req, res) => {
  const cfg = defaultVpsConfig();
  if (!cfg.host) {
    res.status(503).json({ error: "VPS_HOST não configurado" });
    return;
  }

  try {
    const stats: VpsStats = await fetchVpsStats(cfg);
    res.json(stats);
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

// POST /api/vps — add instance
const addSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().default(22),
  username: z.string().min(1),
  authType: z.enum(["password", "key"]),
  authSecret: z.string().optional(),
  isDefault: z.boolean().optional(),
});

router.post("/", async (req, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }
  const { authSecret, ...rest } = parsed.data;
  const authSecretEncrypted = authSecret ? encrypt(authSecret) : null;

  const [row] = await db
    .insert(vpsInstances)
    .values({ ...rest, authSecretEncrypted })
    .returning();
  res.status(201).json({ id: row.id });
});

// DELETE /api/vps/:id
router.delete("/:id", async (req, res) => {
  await db.delete(vpsInstances).where(eq(vpsInstances.id, Number(req.params.id)));
  res.json({ ok: true });
});

// GET /api/vps/:id/test — ping SSH
router.get("/:id/test", async (req, res) => {
  let cfg: { host: string; port: number; username: string; password?: string; privateKey?: string };

  if (req.params.id === "default") {
    cfg = defaultVpsConfig();
  } else {
    const [row] = await db
      .select()
      .from(vpsInstances)
      .where(eq(vpsInstances.id, Number(req.params.id)))
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "VPS não encontrada" });
      return;
    }
    const secret = row.authSecretEncrypted ? decrypt(row.authSecretEncrypted) : "";
    cfg = {
      host: row.host,
      port: row.port,
      username: row.username,
      ...(row.authType === "password" ? { password: secret } : { privateKey: secret }),
    };
  }

  try {
    const out = await sshExec(cfg, "echo pong", 8000);
    res.json({ ok: true, response: out });
  } catch (err: any) {
    res.json({ ok: false, error: err.message });
  }
});

export default router;
