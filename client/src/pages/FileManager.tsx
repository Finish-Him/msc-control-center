import { useState, useEffect } from "react";
import {
  Folder, File, ArrowLeft, RefreshCw, Plus, Trash2, Save,
  FolderPlus, Home, ChevronRight, Loader2, AlertCircle, Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useFileList, useFileContent, useWriteFile, useDeleteFile, useMkdir,
  type FileEntry,
} from "@/hooks/useFiles";

function Breadcrumb({ path, onNavigate }: { path: string; onNavigate: (p: string) => void }) {
  const parts = path.split("/").filter(Boolean);
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
      <button onClick={() => onNavigate("/")} className="hover:text-foreground transition p-1 rounded hover:bg-white/5">
        <Home className="w-3.5 h-3.5" />
      </button>
      {parts.map((part, i) => {
        const partPath = "/" + parts.slice(0, i + 1).join("/");
        return (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            <button
              onClick={() => onNavigate(partPath)}
              className="hover:text-foreground transition px-1 py-0.5 rounded hover:bg-white/5"
            >
              {part}
            </button>
          </span>
        );
      })}
    </nav>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileManagerPage() {
  const [currentPath, setCurrentPath] = useState("/root");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newDirName, setNewDirName] = useState("");
  const [showMkdir, setShowMkdir] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: listing, isLoading, error, refetch } = useFileList(currentPath);
  const { data: fileContent, isLoading: loadingContent } = useFileContent(selectedFile);
  const writeFile = useWriteFile();
  const deleteFile = useDeleteFile();
  const mkdir = useMkdir();

  // When file content loads, populate editor
  useEffect(() => {
    if (fileContent && !isEditing) {
      setEditContent(fileContent.content);
    }
  }, [fileContent]);

  function navigate(p: string) {
    setCurrentPath(p);
    setSelectedFile(null);
    setEditContent(null);
    setIsEditing(false);
  }

  function openEntry(entry: FileEntry) {
    if (entry.isDir) {
      navigate(entry.path);
    } else {
      setSelectedFile(entry.path);
      setEditContent(null);
      setIsEditing(false);
    }
  }

  async function handleSave() {
    if (!selectedFile || editContent === null) return;
    try {
      await writeFile.mutateAsync({ path: selectedFile, content: editContent });
      toast.success("Arquivo salvo");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleDelete(filePath: string) {
    try {
      await deleteFile.mutateAsync(filePath);
      toast.success("Deletado");
      setDeleteConfirm(null);
      if (selectedFile === filePath) {
        setSelectedFile(null);
        setEditContent(null);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleMkdir() {
    if (!newDirName.trim()) return;
    const newPath = currentPath.replace(/\/$/, "") + "/" + newDirName.trim();
    try {
      await mkdir.mutateAsync(newPath);
      toast.success("Pasta criada");
      setNewDirName("");
      setShowMkdir(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const entries = listing?.entries ?? [];
  const dirs = entries.filter((e) => e.isDir).sort((a, b) => a.name.localeCompare(b.name));
  const files = entries.filter((e) => !e.isDir).sort((a, b) => a.name.localeCompare(b.name));
  const sorted = [...dirs, ...files];

  return (
    <div className="p-6 space-y-4 animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Folder className="w-6 h-6" /> Gerenciador de Arquivos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Arquivos do VPS via SSH</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMkdir((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-white/5 hover:bg-white/10 transition"
          >
            <FolderPlus className="w-4 h-4" /> Nova pasta
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-white/5 hover:bg-white/10 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="glass rounded-lg px-4 py-2 flex-shrink-0">
        <Breadcrumb path={currentPath} onNavigate={navigate} />
      </div>

      {/* New folder input */}
      {showMkdir && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            autoFocus
            value={newDirName}
            onChange={(e) => setNewDirName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleMkdir(); if (e.key === "Escape") setShowMkdir(false); }}
            placeholder="Nome da pasta…"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-purple-500"
          />
          <button
            onClick={handleMkdir}
            disabled={mkdir.isPending}
            className="px-3 py-1.5 rounded-lg text-sm gradient-purple-blue text-white disabled:opacity-50"
          >
            {mkdir.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
          </button>
          <button onClick={() => setShowMkdir(false)} className="px-3 py-1.5 rounded-lg text-sm bg-white/5 hover:bg-white/10">Cancelar</button>
        </div>
      )}

      {/* Main pane */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
        {/* File list */}
        <div className="glass rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-white/5 text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>{sorted.length} itens em {currentPath}</span>
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {(error as any).message}
            </div>
          )}

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {/* Parent dir */}
            {currentPath !== "/" && (
              <button
                onClick={() => navigate(currentPath.split("/").slice(0, -1).join("/") || "/")}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/3 transition text-left"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">..</span>
              </button>
            )}
            {sorted.map((entry) => (
              <div
                key={entry.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/3 transition group",
                  selectedFile === entry.path && "bg-white/5"
                )}
                onClick={() => openEntry(entry)}
              >
                {entry.isDir
                  ? <Folder className="w-4 h-4 text-yellow-400 shrink-0" />
                  : <File className="w-4 h-4 text-blue-400 shrink-0" />
                }
                <span className="text-sm flex-1 truncate">{entry.name}</span>
                <span className="text-xs text-muted-foreground hidden sm:block">{formatSize(entry.size)}</span>
                <span className="text-xs text-muted-foreground hidden lg:block font-mono">{entry.perms}</span>
                {deleteConfirm === entry.path ? (
                  <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(entry.path)}
                      className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      {deleteFile.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirmar"}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-0.5 rounded text-xs bg-white/5 hover:bg-white/10"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(entry.path); }}
                    className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* File viewer / editor */}
        <div className="glass rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground truncate">
              {selectedFile ?? "Selecione um arquivo"}
            </span>
            {selectedFile && (
              <div className="flex items-center gap-2 shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={writeFile.isPending}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs gradient-purple-blue text-white disabled:opacity-50"
                    >
                      {writeFile.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Salvar
                    </button>
                    <button
                      onClick={() => { setIsEditing(false); setEditContent(fileContent?.content ?? ""); }}
                      className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10"
                  >
                    <Edit3 className="w-3 h-3" /> Editar
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {!selectedFile && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Clique em um arquivo para visualizar
              </div>
            )}
            {selectedFile && loadingContent && (
              <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
              </div>
            )}
            {selectedFile && !loadingContent && isEditing && (
              <textarea
                className="w-full h-full bg-transparent resize-none font-mono text-xs p-4 outline-none"
                value={editContent ?? ""}
                onChange={(e) => setEditContent(e.target.value)}
                spellCheck={false}
              />
            )}
            {selectedFile && !loadingContent && !isEditing && (
              <pre className="w-full h-full overflow-auto font-mono text-xs p-4 whitespace-pre-wrap break-words">
                {fileContent?.content ?? ""}
                {fileContent?.truncated && (
                  <span className="block mt-2 text-yellow-400">⚠ Arquivo truncado (máx 512KB exibidos)</span>
                )}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
