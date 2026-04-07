import { useState } from "react";
import { toast } from "sonner";
import { Brain, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpaces, useCheckSpace, useCheckAllSpaces } from "@/hooks/useSpaces";
import type { SpaceCategory, SpaceWithStatus } from "../../../shared/types.js";

const CATEGORIES: { id: SpaceCategory; label: string; emoji: string }[] = [
  { id: "tts",       label: "Text-to-Speech", emoji: "🎙️" },
  { id: "image",     label: "Imagem",          emoji: "🖼️" },
  { id: "video",     label: "Vídeo",           emoji: "🎬" },
  { id: "coding",    label: "Código",          emoji: "💻" },
  { id: "embedding", label: "Embeddings",      emoji: "🧮" },
  { id: "rag",       label: "RAG",             emoji: "📚" },
];

const STATUS_STYLES: Record<string, string> = {
  ok:      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  sleeping:"bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  fail:    "bg-red-500/20 text-red-400 border-red-500/30",
  unknown: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const STATUS_LABEL: Record<string, string> = {
  ok: "Online", sleeping: "Sleeping", fail: "Offline", unknown: "—",
};

function SpaceCardItem({ space }: { space: SpaceWithStatus }) {
  const check = useCheckSpace();
  const isChecking = check.isPending && check.variables === space.id;

  return (
    <div className="glass rounded-xl border border-white/5 p-4 flex flex-col gap-3 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{space.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{space.description}</p>
        </div>
        <span className={cn("shrink-0 text-xs px-2 py-0.5 rounded-full border", STATUS_STYLES[space.status])}>
          {STATUS_LABEL[space.status]}
        </span>
      </div>

      {space.latencyMs !== undefined && space.status !== "unknown" && (
        <p className="text-xs text-muted-foreground">{space.latencyMs}ms</p>
      )}

      <div className="flex items-center gap-2 mt-auto pt-1">
        <a
          href={space.hfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Brain className="w-3 h-3" />
          HF Page
        </a>
        <a
          href={space.appUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Abrir App
        </a>
        <button
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          disabled={isChecking}
          onClick={async () => {
            try {
              await check.mutateAsync(space.id);
            } catch {
              toast.error("Falha ao verificar space");
            }
          }}
        >
          {isChecking ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Check
        </button>
      </div>
    </div>
  );
}

export default function HFSpaces() {
  const { data: spaces = [], isLoading } = useSpaces();
  const checkAll = useCheckAllSpaces();
  const [activeCategory, setActiveCategory] = useState<SpaceCategory | "all">("all");

  const filtered =
    activeCategory === "all" ? spaces : spaces.filter((s) => s.category === activeCategory);

  const stats = {
    ok:      spaces.filter((s) => s.status === "ok").length,
    sleeping:spaces.filter((s) => s.status === "sleeping").length,
    fail:    spaces.filter((s) => s.status === "fail").length,
    unknown: spaces.filter((s) => s.status === "unknown").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Brain className="w-6 h-6" />
            HF Spaces Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {spaces.length} spaces catalogados — {stats.ok} online · {stats.sleeping} sleeping · {stats.fail} offline
          </p>
        </div>
        <button
          onClick={async () => {
            toast.info("Verificando todos os spaces…");
            try {
              await checkAll.mutateAsync();
              toast.success("Verificação iniciada — resultados em ~10s");
            } catch {
              toast.error("Erro ao iniciar verificação");
            }
          }}
          disabled={checkAll.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-purple-blue text-white text-sm font-medium disabled:opacity-60"
        >
          {checkAll.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Verificar Todos
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm transition-colors",
            activeCategory === "all"
              ? "gradient-purple-blue text-white font-medium"
              : "glass text-muted-foreground hover:text-foreground",
          )}
        >
          Todos ({spaces.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = spaces.filter((s) => s.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                activeCategory === cat.id
                  ? "gradient-purple-blue text-white font-medium"
                  : "glass text-muted-foreground hover:text-foreground",
              )}
            >
              {cat.emoji} {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((space) => (
            <SpaceCardItem key={space.id} space={space} />
          ))}
        </div>
      )}
    </div>
  );
}
