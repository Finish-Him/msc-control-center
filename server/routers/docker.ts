import { Router } from "express";
import { requireAuth } from "../_core/auth.js";
import { sshExec } from "../_core/ssh.js";
import { env } from "../_core/env.js";
import { defaultVpsConfig } from "../_core/vps-helpers.js";
import type { DockerContainer, DockerImage } from "@shared/types.js";

const router = Router();
router.use(requireAuth);

function requireVps(res: any): boolean {
  if (!env.VPS_HOST) {
    res.status(503).json({ error: "VPS_HOST não configurado" });
    return false;
  }
  return true;
}

// GET /api/docker/containers
router.get("/containers", async (_req, res) => {
  if (!requireVps(res)) return;
  try {
    const raw = await sshExec(
      defaultVpsConfig(),
      // docker inspect-format gives us structured output
      `docker ps -a --format '{"id":"{{.ID}}","name":"{{.Names}}","image":"{{.Image}}","status":"{{.Status}}","state":"{{.State}}","ports":"{{.Ports}}","created":"{{.CreatedAt}}"}'`
    );
    const containers: DockerContainer[] = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    res.json(containers);
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

// GET /api/docker/images
router.get("/images", async (_req, res) => {
  if (!requireVps(res)) return;
  try {
    const raw = await sshExec(
      defaultVpsConfig(),
      `docker images --format '{"id":"{{.ID}}","repository":"{{.Repository}}","tag":"{{.Tag}}","size":"{{.Size}}","created":"{{.CreatedAt}}"}'`
    );
    const images: DockerImage[] = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    res.json(images);
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

// POST /api/docker/containers/:id/start
router.post("/containers/:id/start", async (req, res) => {
  if (!requireVps(res)) return;
  const { id } = req.params;
  // Validate: only alphanumeric + dashes (container id/name)
  if (!/^[a-zA-Z0-9_\-]+$/.test(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  try {
    await sshExec(defaultVpsConfig(), `docker start ${id}`);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

// POST /api/docker/containers/:id/stop
router.post("/containers/:id/stop", async (req, res) => {
  if (!requireVps(res)) return;
  const { id } = req.params;
  if (!/^[a-zA-Z0-9_\-]+$/.test(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  try {
    await sshExec(defaultVpsConfig(), `docker stop ${id}`);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

// POST /api/docker/containers/:id/restart
router.post("/containers/:id/restart", async (req, res) => {
  if (!requireVps(res)) return;
  const { id } = req.params;
  if (!/^[a-zA-Z0-9_\-]+$/.test(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  try {
    await sshExec(defaultVpsConfig(), `docker restart ${id}`);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

// GET /api/docker/containers/:id/logs
router.get("/containers/:id/logs", async (req, res) => {
  if (!requireVps(res)) return;
  const { id } = req.params;
  if (!/^[a-zA-Z0-9_\-]+$/.test(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const lines = parseInt((req.query.lines as string) || "100");
  const tail = Math.min(Math.max(lines, 10), 1000);
  try {
    const logs = await sshExec(defaultVpsConfig(), `docker logs --tail ${tail} ${id} 2>&1`);
    res.json({ logs });
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

// GET /api/docker/stats
router.get("/stats", async (_req, res) => {
  if (!requireVps(res)) return;
  try {
    const raw = await sshExec(
      defaultVpsConfig(),
      `docker ps -q | wc -l && docker ps -a -q | wc -l`
    );
    const [running, total] = raw.split("\n").map(Number);
    res.json({ running: running || 0, total: total || 0 });
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

export default router;
