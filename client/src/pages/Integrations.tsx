import { useState } from "react";
import { ExternalLink, HardDrive, BookOpen, Brain, RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface IntegrationCard {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  url: string;
  pingUrl?: string;
  links: { label: string; url: string }[];
}

const INTEGRATIONS: IntegrationCard[] = [
  {
    id: "gdrive",
    label: "Google Drive",
    description: "Arquivos, pastas e documentos na nuvem Google",
    icon: HardDrive,
    iconColor: "text-yellow-400",
    url: "https://drive.google.com",
    pingUrl: "https://drive.google.com/favicon.ico",
    links: [
      { label: "Meu Drive", url: "https://drive.google.com/drive/my-drive" },
      { label: "Compartilhados", url: "https://drive.google.com/drive/shared-with-me" },
      { label: "Recentes", url: "https://drive.google.com/drive/recent" },
      { label: "Google Docs", url: "https://docs.google.com" },
      { label: "Google Sheets", url: "https://sheets.google.com" },
    ],
  },
  {
    id: "colab",
    label: "Google Colab",
    description: "Notebooks Python na nuvem com GPU gratuita",
    icon: BookOpen,
    iconColor: "text-orange-400",
    url: "https://colab.research.google.com",
    pingUrl: "https://colab.research.google.com/favicon.ico",
    links: [
      { label: "Meus Notebooks", url: "https://colab.research.google.com/#recent" },
      { label: "Novo Notebook", url: "https://colab.research.google.com/#create=true" },
      { label: "Exemplos", url: "https://colab.research.google.com/#scrollTo=examples" },
      { label: "GitHub Notebooks", url: "https://colab.research.google.com/#github" },
    ],
  },
  {
    id: "huggingface",
    label: "Hugging Face",
    description: "Modelos, datasets e Spaces de ML/IA",
    icon: Brain,
    iconColor: "text-yellow-300",
    url: "https://huggingface.co",
    pingUrl: "https://huggingface.co/favicon.ico",
    links: [
      { label: "Meu Perfil", url: "https://huggingface.co/Finish-him" },
      { label: "Meus Modelos", url: "https://huggingface.co/Finish-him?type=model" },
      { label: "Meus Spaces", url: "https://huggingface.co/Finish-him?type=space" },
      { label: "Meus Datasets", url: "https://huggingface.co/Finish-him?type=dataset" },
      { label: "Hub", url: "https://huggingface.co/models" },
      { label: "Inference API", url: "https://huggingface.co/inference-api" },
    ],
  },
];

type PingState = "idle" | "loading" | "ok" | "fail";

export default function IntegrationsPage() {
  const [pings, setPings] = useState<Record<string, PingState>>({});

  async function pingIntegration(item: IntegrationCard) {
    if (!item.pingUrl) return;
    setPings((p) => ({ ...p, [item.id]: "loading" }));
    try {
      const res = await fetch(item.pingUrl, { mode: "no-cors", cache: "no-store" });
      // no-cors: we can't read status, but if it doesn't throw the host is reachable
      setPings((p) => ({ ...p, [item.id]: "ok" }));
    } catch {
      setPings((p) => ({ ...p, [item.id]: "fail" }));
    }
  }

  function pingAll() {
    INTEGRATIONS.forEach((item) => pingIntegration(item));
    toast.info("Verificando conectividade…");
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrações</h1>
          <p className="text-muted-foreground text-sm mt-1">Google Drive · Colab · Hugging Face</p>
        </div>
        <button
          onClick={pingAll}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white/5 hover:bg-white/10 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Verificar conexão
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {INTEGRATIONS.map((item) => {
          const ping = pings[item.id] ?? "idle";
          return (
            <div key={item.id} className="glass rounded-xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5 shrink-0", item.iconColor)} />
                  <div>
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ping === "loading" && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                  {ping === "ok"      && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {ping === "fail"    && <XCircle className="w-4 h-4 text-red-400" />}
                  <button
                    onClick={() => pingIntegration(item)}
                    className="p-1.5 rounded hover:bg-white/10 transition"
                    title="Verificar"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Links */}
              <div className="flex-1 divide-y divide-white/5">
                {item.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-5 py-2.5 hover:bg-white/3 transition group"
                  >
                    <span className="text-sm text-foreground">{link.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                  </a>
                ))}
              </div>

              {/* Open button */}
              <div className="px-5 py-3 border-t border-white/5">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium transition",
                    "gradient-purple-blue text-white hover:opacity-90"
                  )}
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir {item.label}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
