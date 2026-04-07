import { Router, Request, Response } from "express";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { spawn, ChildProcess } from "child_process";
import { createHash } from "crypto";
import { env } from "../_core/env.js";
import type { LocalProject, ProjectStack } from "../../shared/types.js";

const router = Router();

// ─── Process Registry ────────────────────────────────────────────────────────
interface RunningProcess {
  child: ChildProcess;
  pid: number;
  logs: string[];
  logListeners: Set<(line: string) => void>;
}
const processes = new Map<string, RunningProcess>();

// ─── Stack Detection ─────────────────────────────────────────────────────────
function detectStack(projectPath: string): { stack: ProjectStack; devCommand: string } {
  if (existsSync(join(projectPath, "package.json"))) {
    return { stack: "node", devCommand: "npm run dev" };
  }
  if (existsSync(join(projectPath, "requirements.txt")) || existsSync(join(projectPath, "pyproject.toml"))) {
    // Check for FastAPI/uvicorn
    try {
      const req = existsSync(join(projectPath, "requirements.txt"))
        ? readFileSync(join(projectPath, "requirements.txt"), "utf8")
        : "";
      if (req.includes("fastapi") || req.includes("uvicorn")) {
        return { stack: "python", devCommand: "uvicorn main:app --reload" };
      }
    } catch {}
    return { stack: "python", devCommand: "python app.py" };
  }
  if (existsSync(join(projectPath, "Cargo.toml"))) {
    return { stack: "rust", devCommand: "cargo run" };
  }
  if (existsSync(join(projectPath, "go.mod"))) {
    return { stack: "go", devCommand: "go run ." };
  }
  return { stack: "unknown", devCommand: "" };
}

function projectId(projectPath: string): string {
  return createHash("sha256").update(projectPath).digest("hex").slice(0, 12);
}

function scanProjects(): LocalProject[] {
  const root = env.LOCAL_PROJECTS_PATH;
  if (!existsSync(root)) return [];

  const results: LocalProject[] = [];

  function scanDir(dir: string, depth = 0) {
    if (depth > 1) return; // max 1 level deep (Projetos/Moises/project)
    let entries: string[];
    try {
      entries = readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !e.name.startsWith("."))
        .map((e) => e.name);
    } catch {
      return;
    }

    for (const name of entries) {
      if (["node_modules", ".git", "dist", "build", ".next", "__pycache__"].includes(name)) continue;
      const full = join(dir, name);
      const { stack, devCommand } = detectStack(full);
      if (stack !== "unknown") {
        const id = projectId(full);
        const running = processes.get(id);
        results.push({
          id,
          name,
          path: full,
          stack,
          devCommand,
          isRunning: !!running,
          pid: running?.pid,
        });
      } else if (depth < 1) {
        // recurse one level to catch Projetos/Moises/*
        scanDir(full, depth + 1);
      }
    }
  }

  scanDir(root);
  return results;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/local — list all projects
router.get("/", (_req, res) => {
  res.json(scanProjects());
});

// GET /api/local/running — list running PIDs
router.get("/running", (_req, res) => {
  const running: { id: string; pid: number }[] = [];
  for (const [id, p] of processes.entries()) {
    running.push({ id, pid: p.pid });
  }
  res.json(running);
});

// POST /api/local/:id/start — start dev server
router.post("/:id/start", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  if (processes.has(id)) {
    res.status(409).json({ error: "Already running" });
    return;
  }

  const projects = scanProjects();
  const project = projects.find((p) => p.id === id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (!project.devCommand) {
    res.status(422).json({ error: "No dev command detected" });
    return;
  }

  const [cmd, ...args] = project.devCommand.split(" ");
  const child = spawn(cmd, args, {
    cwd: project.path,
    shell: true,
    env: { ...process.env },
    detached: false,
  });

  if (!child.pid) {
    res.status(500).json({ error: "Failed to spawn process" });
    return;
  }

  const entry: RunningProcess = { child, pid: child.pid, logs: [], logListeners: new Set() };

  function pushLog(data: Buffer) {
    const line = data.toString();
    entry.logs = [...entry.logs.slice(-499), line]; // keep last 500
    for (const cb of entry.logListeners) cb(line);
  }

  child.stdout?.on("data", pushLog);
  child.stderr?.on("data", pushLog);
  child.on("exit", () => processes.delete(id));

  processes.set(id, entry);

  res.json({ id, pid: child.pid, command: project.devCommand });
});

// POST /api/local/:id/stop — kill process
router.post("/:id/stop", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const entry = processes.get(id);
  if (!entry) {
    res.status(404).json({ error: "Not running" });
    return;
  }

  try {
    entry.child.kill("SIGTERM");
    setTimeout(() => {
      if (processes.has(id)) entry.child.kill("SIGKILL");
    }, 3000);
  } catch {}

  processes.delete(id);
  res.json({ id, stopped: true });
});

// GET /api/local/:id/logs — SSE log stream
router.get("/:id/logs", (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const entry = processes.get(id);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  if (!entry) {
    res.write("data: [Process not running]\n\n");
    res.end();
    return;
  }

  // Send buffered logs first
  for (const line of entry.logs) {
    res.write(`data: ${line.replace(/\n/g, "\ndata: ")}\n\n`);
  }

  const cb = (line: string) => res.write(`data: ${line.replace(/\n/g, "\ndata: ")}\n\n`);
  entry.logListeners.add(cb);

  req.on("close", () => {
    entry.logListeners.delete(cb);
    res.end();
  });
});

export default router;
