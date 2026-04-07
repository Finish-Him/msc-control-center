import { Router } from "express";
import { eq, and, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.js";
import { services } from "../../drizzle/schema.js";
import { requireAuth } from "../_core/auth.js";
import { encrypt, decrypt } from "../_core/crypto.js";

const router = Router();
router.use(requireAuth);

// GET /api/services
router.get("/", async (_req, res) => {
  const rows = await db.select().from(services);
  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      isActive: r.isActive,
      hasApiKey: !!r.apiKeyEncrypted,
      meta: r.meta,
      createdAt: r.createdAt,
    }))
  );
});

const upsertSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  apiKey: z.string().optional(),
  isActive: z.boolean().optional(),
  meta: z.record(z.unknown()).optional(),
});

// POST /api/services
router.post("/", async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }
  const { apiKey, meta, ...rest } = parsed.data;
  const apiKeyEncrypted = apiKey ? encrypt(apiKey) : null;
  const [row] = await db
    .insert(services)
    .values({ ...rest, apiKeyEncrypted, meta: meta ?? null })
    .returning();
  res.status(201).json({ id: row.id });
});

// PUT /api/services/:id
router.put("/:id", async (req, res) => {
  const parsed = upsertSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }
  const { apiKey, meta, ...rest } = parsed.data;
  const updates: Record<string, unknown> = {
    ...rest,
    updatedAt: new Date(),
  };
  if (apiKey !== undefined) {
    updates.apiKeyEncrypted = apiKey ? encrypt(apiKey) : null;
  }
  if (meta !== undefined) updates.meta = meta;

  await db.update(services).set(updates).where(eq(services.id, Number(req.params.id)));
  res.json({ ok: true });
});

// DELETE /api/services/:id
router.delete("/:id", async (req, res) => {
  await db.delete(services).where(eq(services.id, Number(req.params.id)));
  res.json({ ok: true });
});

// GET /api/services/:id/key — returns decrypted key (admin only)
router.get("/:id/key", async (req, res) => {
  const [row] = await db
    .select()
    .from(services)
    .where(eq(services.id, Number(req.params.id)))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  if (!row.apiKeyEncrypted) {
    res.json({ key: null });
    return;
  }
  try {
    res.json({ key: decrypt(row.apiKeyEncrypted) });
  } catch {
    res.status(500).json({ error: "Falha ao descriptografar" });
  }
});

export default router;
