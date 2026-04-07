import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { buildTerminalWsUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Terminal as TerminalIcon, X, Maximize2 } from "lucide-react";

export default function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  function connect() {
    if (!containerRef.current) return;
    setStatus("connecting");

    const term = new XTerm({
      theme: {
        background: "#0a0a0f",
        foreground: "#f0f0f5",
        cursor: "#a855f7",
        selectionBackground: "#a855f740",
      },
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
      fontSize: 14,
      lineHeight: 1.4,
      cursorBlink: true,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const wsUrl = buildTerminalWsUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      // Send initial resize
      const dims = { type: "resize", cols: term.cols, rows: term.rows };
      ws.send(JSON.stringify(dims));
    };

    ws.onmessage = (evt) => {
      term.write(evt.data);
    };

    ws.onclose = () => {
      setStatus("disconnected");
      term.write("\r\n\x1b[31m[Conexão encerrada]\x1b[0m\r\n");
    };

    ws.onerror = () => {
      setStatus("disconnected");
    };

    // Key input → WS
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Resize observer
    const resizeObs = new ResizeObserver(() => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      }
    });
    resizeObs.observe(containerRef.current);

    return () => {
      resizeObs.disconnect();
    };
  }

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup?.();
      wsRef.current?.close();
      termRef.current?.dispose();
    };
  }, []);

  function handleDisconnect() {
    wsRef.current?.close();
    termRef.current?.dispose();
    termRef.current = null;
    if (containerRef.current) containerRef.current.innerHTML = "";
  }

  function handleReconnect() {
    handleDisconnect();
    connect();
  }

  const statusColor = {
    connecting: "text-yellow-400",
    connected: "text-emerald-400",
    disconnected: "text-red-400",
  }[status];

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TerminalIcon className="w-6 h-6 text-purple-400" />
            Terminal SSH
          </h1>
          <p className={cn("text-sm mt-0.5", statusColor)}>
            {{
              connecting: "Conectando...",
              connected: "Conectado à VPS",
              disconnected: "Desconectado",
            }[status]}
          </p>
        </div>
        <div className="flex gap-2">
          {status === "disconnected" && (
            <button
              onClick={handleReconnect}
              className="gradient-purple-blue text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition"
            >
              Reconectar
            </button>
          )}
          {status === "connected" && (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-4 h-4" />
              Desconectar
            </button>
          )}
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 glass rounded-xl overflow-hidden min-h-0">
        <div ref={containerRef} className="w-full h-full p-2" />
      </div>
    </div>
  );
}
