import { useState } from "react";
import { useServices, useAddService, useUpdateService, useDeleteService } from "@/hooks/useServices";
import { PageLoader } from "@/components/LoadingSpinner";
import { cn } from "@/lib/utils";
import { KeyRound, Plus, Trash2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SERVICE_TYPES } from "@shared/const";
import type { Service, ServiceType } from "@shared/types";

function ServiceBadge({ type }: { type: string }) {
  const cfg = SERVICE_TYPES[type as ServiceType];
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full border border-white/10 font-medium"
      style={cfg ? { color: cfg.color, borderColor: `${cfg.color}30` } : {}}
    >
      {cfg?.label ?? type}
    </span>
  );
}

function AddServiceModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ServiceType>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const { mutate, isPending } = useAddService();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutate({ name, type, apiKey: apiKey || undefined }, {
      onSuccess: () => { toast.success("Serviço adicionado"); onClose(); },
      onError: (e: any) => toast.error(e.message),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl w-full max-w-md p-6">
        <h3 className="font-semibold mb-4">Adicionar Serviço</h3>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="text" placeholder="Nome (ex: Anthropic Principal)" value={name}
            onChange={e => setName(e.target.value)} required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <select
            value={type} onChange={e => setType(e.target.value as ServiceType)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {Object.entries(SERVICE_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              placeholder="API Key (opcional)"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button type="button" onClick={() => setShowKey(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 text-sm px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 gradient-purple-blue text-white text-sm px-4 py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50">
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const { data: services, isLoading } = useServices();
  const { mutate: update } = useUpdateService();
  const { mutate: del } = useDeleteService();
  const [showAdd, setShowAdd] = useState(false);

  if (isLoading) return <PageLoader />;

  function toggleActive(s: Service) {
    update({ id: s.id, isActive: !s.isActive }, {
      onSuccess: () => toast.success("Atualizado"),
      onError: (e: any) => toast.error(e.message),
    });
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-emerald-400" /> Serviços
          </h1>
          <p className="text-muted-foreground text-sm mt-1">APIs e integrações (chaves encriptadas AES-256)</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 gradient-purple-blue text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-muted-foreground text-xs">
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3">Tipo</th>
              <th className="text-left px-4 py-3">API Key</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!services?.length && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  <KeyRound className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Nenhum serviço configurado</p>
                </td>
              </tr>
            )}
            {services?.map((s: Service) => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/2 transition">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3"><ServiceBadge type={s.type} /></td>
                <td className="px-4 py-3">
                  {s.hasApiKey ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Configurada
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Não configurada
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(s)}
                    className={cn("text-xs px-2 py-0.5 rounded-full font-medium transition",
                      s.isActive
                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                    )}
                  >
                    {s.isActive ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={SERVICE_TYPES[s.type as ServiceType]?.docsUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-white transition"
                    >
                      Docs
                    </a>
                    <button
                      onClick={() => del(s.id, { onSuccess: () => toast.success("Removido"), onError: (e: any) => toast.error(e.message) })}
                      className="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <AddServiceModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
