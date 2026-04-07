import type { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupVite(app: Express) {
  if (env.isDev) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      configFile: path.resolve(__dirname, "../../vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const express = await import("express");
    const staticPath = path.resolve(__dirname, "../public");
    app.use(express.default.static(staticPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }
}
