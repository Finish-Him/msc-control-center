import { useState } from "react";
import { useDockerContainers, useDockerImages, useDockerStats, useContainerAction, useContainerLogs } from "@/hooks/useDocker";
import { PageLoader } from "@/components/LoadingSpinner";
import StatsCard from "@/components/StatsCard";
import { cn } from "@/lib/utils";
import { Container, Play, Square, RefreshCw, FileText, X } from "lucide-react";
import { toast } from "sonner";
import type { DockerContainer } from "@shared/types";

function stateBadge(state: string) {
  const colors: Record<string, string> = {
    running: "bg-emerald-500/20 text-emerald-400",
    exited:  "bg-red-500/20 text-red-400",
    paused:  "bg-yellow-500/20 text-yellow-400",
    created: "bg-blue-500/20 text-blue-400",
  };
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", colors[state] ?? "bg-white/10 text-white/60")}>
      {state}
    </span>
  );
}

function LogsModal({ containerId, onClose }: { containerId: string; onClose: () => void }) {
  const { data, isLoading } = useContainerLogs(containerId, 200);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="font-semibold text-sm">Logs — {containerId}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <PageLoader />
          ) : (
            <pre className="text-xs font-mono text-green-300 whitespace-pre-wrap">
              {data?.logs ?? "Sem logs"}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DockerPage() {
  const { data: containers, isLoading, refetch } = useDockerContainers();
  const { data: stats } = useDockerStats();
  const { mutate: containerAction, isPending } = useContainerAction();
  const [logsId, setLogsId] = useState<string | null>(null);

  function act(id: string, action: "start" | "stop" | "restart") {
    containerAction(
      { id, action },
      {
        onSuccess: () => toast.success(`Container ${action} executado`),
        onError: (e: any) => toast.error(e.message),
      }
    );
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Docker</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerenciar containers na VPS</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatsCard label="Em execução" value={stats?.running ?? 0} icon={Container} iconColor="text-emerald-400" />
        <StatsCard label="Total" value={stats?.total ?? 0} icon={Container} iconColor="text-blue-400" />
      </div>

      {/* Containers table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h2 className="font-semibold text-sm">Containers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-muted-foreground text-xs">
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Imagem</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Portas</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!containers?.length && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum container encontrado
                  </td>
                </tr>
              )}
              {containers?.map((c: DockerContainer) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/2 transition">
                  <td className="px-4 py-3 font-mono text-xs">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-48 truncate">{c.image}</td>
                  <td className="px-4 py-3">{stateBadge(c.state)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-32 truncate">{c.ports || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => act(c.id, "start")}
                        disabled={isPending || c.state === "running"}
                        title="Iniciar"
                        className="p-1.5 rounded hover:bg-white/5 text-emerald-400 disabled:opacity-30 transition"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => act(c.id, "stop")}
                        disabled={isPending || c.state !== "running"}
                        title="Parar"
                        className="p-1.5 rounded hover:bg-white/5 text-red-400 disabled:opacity-30 transition"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => act(c.id, "restart")}
                        disabled={isPending}
                        title="Reiniciar"
                        className="p-1.5 rounded hover:bg-white/5 text-yellow-400 disabled:opacity-30 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setLogsId(c.id)}
                        title="Logs"
                        className="p-1.5 rounded hover:bg-white/5 text-blue-400 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {logsId && <LogsModal containerId={logsId} onClose={() => setLogsId(null)} />}
    </div>
  );
}
