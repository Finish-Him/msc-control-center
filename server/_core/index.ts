import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import cron from "node-cron";
import { env } from "./env.js";
import { setupVite } from "./vite.js";
import apiRouter from "../routers/index.js";
import { handleTerminalConnection } from "../routers/terminal.js";
import { startGradioHealthCron } from "../routers/gradio.js";
import { cleanExpiredTokens } from "../routers/auth.js";
import { verifyTokenFromQuery } from "./auth.js";

async function main() {
  const app = express();
  const server = createServer(app);

  // ── Security middlewares ──────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: false, // disabled for Vite HMR in dev
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(
    cors({
      origin: env.isDev ? ["http://localhost:5173"] : false,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", globalLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/auth/login", authLimiter);

  // ── API routes ────────────────────────────────────────────────────────────
  app.use("/api", apiRouter);

  // ── Vite / static ─────────────────────────────────────────────────────────
  await setupVite(app);

  // ── WebSocket SSH terminal ────────────────────────────────────────────────
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    if (!req.url?.startsWith("/ws/terminal")) {
      socket.destroy();
      return;
    }
    const admin = verifyTokenFromQuery(req.url);
    if (!admin) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      handleTerminalConnection(ws, admin);
    });
  });

  // ── Start ─────────────────────────────────────────────────────────────────
  server.listen(env.PORT, () => {
    console.log(`[Server] Running at http://localhost:${env.PORT}`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
  });

  // ── Cron jobs ─────────────────────────────────────────────────────────────
  startGradioHealthCron();
  cron.schedule("0 3 * * *", () => {
    cleanExpiredTokens().catch((err) =>
      console.error("[cron] cleanExpiredTokens:", err)
    );
  });
}

main().catch((err) => {
  console.error("[Server] Failed to start:", err);
  process.exit(1);
});
