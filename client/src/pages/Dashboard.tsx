import { useDashboardSummary } from "@/hooks/useServices";
import StatsCard from "@/components/StatsCard";
import { PageLoader } from "@/components/LoadingSpinner";
import { Server, Container, Github, Radio, KeyRound, Cpu, HardDrive, MemoryStick } from "lucide-react";
import { cn, percentBar, formatRelativeDate } from "@/lib/utils";

function StatusBadge({ online }: { online: boolean }) {
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
      online ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
    )}>
      {online ? "Online" : "Offline"}
    </span>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const color = value > 85 ? "bg-red-500" : value > 60 ? "bg-yellow-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading) return <PageLoader />;

  const stats = data?.vps.stats;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Painel</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral de todos os sistemas</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="VPS"
          value={data?.vps.online ? "Online" : "Offline"}
          sub={data?.vps.host}
          icon={Server}
          iconColor={data?.vps.online ? "text-emerald-400" : "text-red-400"}
        />
        <StatsCard
          label="Containers"
          value={`${data?.docker.running ?? 0} / ${data?.docker.total ?? 0}`}
          sub="em execução"
          icon={Container}
          iconColor="text-blue-400"
        />
        <StatsCard
          label="Repos GitHub"
          value={data?.github.repos ?? 0}
          sub={data?.github.lastPush ? `Push ${formatRelativeDate(data.github.lastPush)}` : "—"}
          icon={Github}
        />
        <StatsCard
          label="Gradio Apps"
          value={`${data?.gradio.online ?? 0} / ${data?.gradio.total ?? 0}`}
          sub="online"
          icon={Radio}
          iconColor="text-yellow-400"
        />
      </div>

      {/* VPS details */}
      {data?.vps.online && stats && (
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              {stats.hostname}
            </h2>
            <StatusBadge online={true} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ProgressBar
              label={`CPU — ${stats.cpu}%`}
              value={stats.cpu}
            />
            <ProgressBar
              label={`RAM — ${stats.memUsed} / ${stats.memTotal} MB`}
              value={percentBar(stats.memUsed, stats.memTotal)}
            />
            <ProgressBar
              label={`Disco — ${stats.diskUsed} / ${stats.diskTotal} GB`}
              value={percentBar(stats.diskUsed, stats.diskTotal)}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Uptime: {stats.uptime}</span>
            <span>Load: {stats.loadAvg}</span>
          </div>
        </div>
      )}

      {!data?.vps.online && (
        <div className="glass rounded-xl p-5 text-center text-muted-foreground">
          <Server className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">VPS offline ou VPS_HOST não configurado</p>
        </div>
      )}
    </div>
  );
}
