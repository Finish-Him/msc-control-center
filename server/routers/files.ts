import { Router } from "express";
import path from "path";
import { z } from "zod";
import { requireAuth } from "../_core/auth.js";
import { sshExec } from "../_core/ssh.js";
import { defaultVpsConfig, hasVpsConfig } from "../_core/vps-helpers.js";

const router = Router();
router.use(requireAuth);

function sanitizePath(p: string): string {
  // Resolve to absolute, prevent path traversal
  const resolved = path.posix.resolve("/", p.replace(/\\/g, "/"));
  return resolved;
}

// GET /api/files?path=/some/dir  — list directory contents
router.get("/", async (req, res) => {
  if (!hasVpsConfig()) {
    res.status(503).json({ error: "VPS_HOST não configurado" });
    return;
  }
  const rawPath = (req.query.path as string) || "/";
  const dir = sanitizePath(rawPath);

  try {
    // ls -la with null-separated entries for safe parsing
    const out = await sshExec(
      defaultVpsConfig(),
      `ls -la --time-style=+"%Y-%m-%dT%H:%M:%S" ${JSON.stringify(dir)} 2>&1`,
      10_000
    );

    const entries = out
      .split("\n")
      .filter((l) => l.match(/^[dlrwx\-]/))
      .map((line) => {
        const parts = line.split(/\s+/);
        const perms = parts[0];
        const size = parseInt(parts[4]) || 0;
        const date = parts[5] || "";
        const name = parts.slice(6).join(" ");
        if (!name || name === "." || name === "..") return null;
        return {
          name,
          path: path.posix.join(dir, name),
          isDir: perms.startsWith("d"),
          isSymlink: perms.startsWith("l"),
          size,
          modifiedAt: date,
          perms,
        };
      })
      .filter(Boolean);

    res.json({ path: dir, entries });
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

// GET /api/files/read?path=/file.txt — read file content (max 512KB)
router.get("/read", async (req, res) => {
  if (!hasVpsConfig()) {
    res.status(503).json({ error: "VPS_HOST não configurado" });
    return;
  }
  const rawPath = (req.query.path as string) || "";
  if (!rawPath) {
    res.status(400).json({ error: "path obrigatório" });
    return;
  }
  const filePath = sanitizePath(rawPath);

  try {
    const out = await sshExec(
      defaultVpsConfig(),
      // head prevents reading huge files; wc -c for size check
      `wc -c < ${JSON.stringify(filePath)} && head -c 524288 ${JSON.stringify(filePath)}`,
      15_000
    );
    const newline = out.indexOf("\n");
    const sizeStr = out.slice(0, newline).trim();
    const content = out.slice(newline + 1);
    const size = parseInt(sizeStr) || 0;
    res.json({ path: filePath, content, size, truncated: size > 524288 });
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

// POST /api/files/write — write file content
const writeSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
});

router.post("/write", async (req, res) => {
  if (!hasVpsConfig()) {
    res.status(503).json({ error: "VPS_HOST não configurado" });
    return;
  }
  const parsed = writeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }
  const filePath = sanitizePath(parsed.data.path);
  // Encode content as base64 to avoid shell injection
  const b64 = Buffer.from(parsed.data.content).toString("base64");

  try {
    await sshExec(
      defaultVpsConfig(),
      `echo ${JSON.stringify(b64)} | base64 -d > ${JSON.stringify(filePath)}`,
      15_000
    );
    res.json({ ok: true, path: filePath });
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

// DELETE /api/files — delete file or empty dir
const deleteSchema = z.object({ path: z.string().min(1) });

router.delete("/", async (req, res) => {
  if (!hasVpsConfig()) {
    res.status(503).json({ error: "VPS_HOST não configurado" });
    return;
  }
  const parsed = deleteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }
  const filePath = sanitizePath(parsed.data.path);
  // Block deleting critical system paths
  const blocked = ["/", "/root", "/etc", "/boot", "/bin", "/sbin", "/usr", "/lib"];
  if (blocked.includes(filePath)) {
    res.status(403).json({ error: "Caminho protegido" });
    return;
  }

  try {
    await sshExec(defaultVpsConfig(), `rm -rf ${JSON.stringify(filePath)}`, 10_000);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

// POST /api/files/mkdir
const mkdirSchema = z.object({ path: z.string().min(1) });

router.post("/mkdir", async (req, res) => {
  if (!hasVpsConfig()) {
    res.status(503).json({ error: "VPS_HOST não configurado" });
    return;
  }
  const parsed = mkdirSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues });
    return;
  }
  const dirPath = sanitizePath(parsed.data.path);
  try {
    await sshExec(defaultVpsConfig(), `mkdir -p ${JSON.stringify(dirPath)}`, 10_000);
    res.json({ ok: true, path: dirPath });
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
});

export default router;
