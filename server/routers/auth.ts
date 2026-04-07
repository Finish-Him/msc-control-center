import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.js";
import { admins, refreshTokens } from "../../drizzle/schema.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  requireAuth,
} from "../_core/auth.js";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "username e password são obrigatórios" });
    return;
  }
  const { username, password } = parsed.data;

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.username, username))
    .limit(1);

  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const payload = { adminId: admin.id, username: admin.username };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Store hashed refresh token
  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokens).values({
    adminId: admin.id,
    tokenHash,
    expiresAt,
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });

  res.json({
    accessToken,
    admin: { id: admin.id, username: admin.username },
  });
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  const cookie = req.cookies?.refresh_token;
  if (!cookie) {
    res.status(401).json({ error: "Sem refresh token" });
    return;
  }

  let payload;
  try {
    payload = verifyRefreshToken(cookie);
  } catch {
    res.status(401).json({ error: "Refresh token inválido ou expirado" });
    return;
  }

  const tokenHash = crypto.createHash("sha256").update(cookie).digest("hex");
  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  if (!stored || stored.expiresAt < new Date()) {
    res.status(401).json({ error: "Token revogado ou expirado" });
    return;
  }

  // Rotate: delete old, issue new
  await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));

  const newPayload = { adminId: payload.adminId, username: payload.username };
  const accessToken = signAccessToken(newPayload);
  const newRefresh = signRefreshToken(newPayload);
  const newHash = crypto.createHash("sha256").update(newRefresh).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokens).values({
    adminId: payload.adminId,
    tokenHash: newHash,
    expiresAt,
  });

  res.cookie("refresh_token", newRefresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });

  res.json({ accessToken });
});

// POST /api/auth/logout
router.post("/logout", requireAuth, async (req, res) => {
  const cookie = req.cookies?.refresh_token;
  if (cookie) {
    const tokenHash = crypto.createHash("sha256").update(cookie).digest("hex");
    await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }
  res.clearCookie("refresh_token", { path: "/api/auth" });
  res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  res.json({ admin: (req as any).admin });
});

// Cleanup expired tokens (called periodically)
export async function cleanExpiredTokens() {
  await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date()));
}

export default router;
