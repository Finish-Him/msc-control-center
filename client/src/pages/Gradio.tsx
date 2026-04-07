import { useState } from "react";
import { useGradioApps, useCheckGradioApp, useAddGradioApp, useDeleteGradioApp } from "@/hooks/useGradio";
import { PageLoader } from "@/components/LoadingSpinner";
import { cn, formatRelativeDate } from "@/lib/utils";
import { Radio, RefreshCw, Plus, Trash2, ExternalLink, CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import type { GradioApp, GradioStatus } from "@shared/types";
import { GRADIO_STATUS_COLORS } from "@shared/const";

function StatusIcon({ status }: { status: GradioStatus | null }) {
  const s = status ?? "unknown";
  const icons = {
    ok: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    warn: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
    fail: <XCircle className="w-4 h-4 text-red-400" />,
    unknown: <HelpCircle className="w-4 h-4 text-gray-400" />,
  };
  return icons[s] ?? icons.unknown;
}

function AddAppModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const { mutate, isPending } = useAddGradioApp();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutate({ name, url }, {
      onSuccess: () => { toast.success("App adicionado"); onClose(); },
      onError: (e: any) => toast.error(e.message),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl w-full max-w-md p-6">
        <h3 className="font-semibold mb-4">Adicionar Gradio App</h3>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="url" placeholder="https://xxxx.gradio.live" value={url} onChange={e => setUrl(e.target.value)} required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 text-sm px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="flex-1 gradient-purple-blue text-white text-sm px-4 py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50">
              {isPending ? "Salvando..." : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GradioPage() {
  const { data: apps, isLoading } = useGradioApps();
  const { mutate: check, isPending: checking } = useCheckGradioApp();
  const { mutate: del } = useDeleteGradioApp();
  const [showAdd, setShowAdd] = useState(false);

  if (isLoading) return <PageLoader />;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="w-6 h-6 text-yellow-400" /> Gradio Apps
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Health check dos apps Gradio live</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 gradient-purple-blue text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!apps?.length && (
          <div className="col-span-3 glass rounded-xl p-12 text-center text-muted-foreground">
            <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum app Gradio configurado</p>
          </div>
        )}
        {apps?.map((app: GradioApp) => (
          <div key={app.id} className="glass rounded-xl p-5 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <StatusIcon status={app.lastStatus as GradioStatus} />
                  <h3 className="font-semibold text-sm truncate">{app.name}</h3>
                </div>
                {app.version && (
                  <span className="text-xs text-purple-400 mt-0.5 block">Versão: {app.version}</span>
                )}
              </div>
              <a href={app.url} target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground hover:text-white transition shrink-0 ml-2">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Message */}
            <p className={cn("text-xs", GRADIO_STATUS_COLORS[app.lastStatus as GradioStatus ?? "unknown"])}>
              {app.lastMessage ?? "Sem dados"}
            </p>

            {/* Last check */}
            <p className="text-xs text-muted-foreground">
              Verificado: {formatRelativeDate(app.lastCheckedAt)}
            </p>

            {/* History mini-chart */}
            {app.healthHistory?.length > 0 && (
              <div className="flex gap-0.5 h-3 items-end">
                {app.healthHistory.slice(0, 24).reverse().map((h, i) => (
                  <div
                    key={i}
                    className={cn("flex-1 rounded-sm", {
                      "bg-emerald-400": h.status === "ok",
                      "bg-yellow-400": h.status === "warn",
                      "bg-red-400": h.status === "fail",
                      "bg-gray-600": h.status === "unknown",
                    })}
                    style={{ height: "100%" }}
                    title={`${h.ts}: ${h.status}`}
                  />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => check(app.id, { onSuccess: () => toast.success("Check concluído"), onError: (e: any) => toast.error(e.message) })}
                disabled={checking}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3 h-3", checking && "animate-spin")} />
                Checar
              </button>
              <button
                onClick={() => del(app.id, { onSuccess: () => toast.success("App removido"), onError: (e: any) => toast.error(e.message) })}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && <AddAppModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
