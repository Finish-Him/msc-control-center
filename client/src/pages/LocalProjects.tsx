import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Monitor, Play, Square, Terminal, RefreshCw, Loader2, FolderCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalProjects, useStartProject, useStopProject, useProjectLogs } from "@/hooks/useLocalProjects";
import type { LocalProject, ProjectStack } from "../../../shared/types.js";

const STACK_BADGE: Record<ProjectStack, { label: string; color: string }> = {
  node:    { label: "Node.js",  color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  python:  { label: "Python",   color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  go:      { label: "Go",       color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
  rust:    { label: "Rust",     color: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
  unknown: { label: "?",        color: "text-gray-400 bg-gray-500/10 border-gray-500/30" },
};

function LogPanel({ projectId }: { projectId: string }) {
  const lines = useProjectLogs(projectId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="mt-3 rounded-lg bg-black/60 border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 text-xs text-muted-foreground">
        <Terminal className="w-3 h-3" />
        Logs
      </div>
      <pre className="h-40 overflow-y-auto p-3 text-xs font-mono text-green-400 leading-relaxed whitespace-pre-wrap">
        {lines.length > 0 ? lines.join("") : "Aguardando saída…"}
        <div ref={bottomRef} />
      </pre>
    </div>
  );
}

function ProjectCard({ project }: { project: LocalProject }) {
  const start = useStartProject();
  const stop = useStopProject();
  const [showLogs, setShowLogs] = useState(false);

  const badge = STACK_BADGE[project.stack];
  const isStarting = start.isPending && start.variables === project.id;
  const isStopping = stop.isPending && stop.variables === project.id;

  return (
    <div
      className={cn(
        "glass rounded-xl border p-4 flex flex-col gap-3 transition-colors",
        project.isRunning ? "border-emerald-500/30" : "border-white/5 hover:border-white/10",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate flex items-center gap-1.5">
            <FolderCode className="w-4 h-4 shrink-0 text-muted-foreground" />
            {project.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate" title={project.path}>
            {project.path}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn("text-xs px-2 py-0.5 rounded-full border", badge.color)}>{badge.label}</span>
          {project.isRunning && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
              ● Running
            </span>
          )}
        </div>
      </div>

      <div className="text-xs font-mono text-muted-foreground bg-black/30 rounded px-2 py-1.5 truncate">
        $ {project.devCommand || "sem comando detectado"}
      </div>

      {project.isRunning && project.pid && (
        <p className="text-xs text-muted-foreground">PID: {project.pid}</p>
      )}

      <div className="flex items-center gap-2 mt-auto">
        {project.isRunning ? (
          <>
            <button
              onClick={() => setShowLogs((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg glass border border-white/10 hover:border-white/20 transition-colors"
            >
              <Terminal className="w-3 h-3" />
              {showLogs ? "Ocultar" : "Logs"}
            </button>
            <button
              onClick={async () => {
                try {
                  await stop.mutateAsync(project.id);
                  toast.success(`${project.name} parado`);
                  setShowLogs(false);
                } catch {
                  toast.error("Erro ao parar projeto");
                }
              }}
              disabled={isStopping}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-60"
            >
              {isStopping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
              Parar
            </button>
          </>
        ) : (
          <button
            onClick={async () => {
              try {
                const r = await start.mutateAsync(project.id);
                toast.success(`${project.name} iniciado (PID ${r.pid})`);
                setShowLogs(true);
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Erro ao iniciar";
                toast.error(msg);
              }
            }}
            disabled={isStarting || !project.devCommand}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg gradient-purple-blue text-white font-medium disabled:opacity-60"
          >
            {isStarting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Iniciar
          </button>
        )}
      </div>

      {showLogs && project.isRunning && <LogPanel projectId={project.id} />}
    </div>
  );
}

export default function LocalProjects() {
  const { data: projects = [], isLoading, refetch } = useLocalProjects();

  const running = projects.filter((p) => p.isRunning).length;
  const stackCounts = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.stack] = (acc[p.stack] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6Space-y-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Monitor className="w-6 h-6" />
            Dev Local
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projects.length} projetos encontrados
            {running > 0 && ` — ${running} em execução`}
            {Object.entries(stackCounts)
              .filter(([k]) => k !== "unknown")
              .map(([k, v]) => ` · ${v} ${k}`)
              .join("")}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg glass border border-white/10 hover:border-white/20 text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
          <FolderCode className="w-8 h-8" />
          <p className="text-sm">Nenhum projeto detectado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
