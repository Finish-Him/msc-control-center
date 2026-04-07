import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  isSymlink: boolean;
  size: number;
  modifiedAt: string;
  perms: string;
}

export interface DirListing {
  path: string;
  entries: FileEntry[];
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  truncated: boolean;
}

export function useFileList(dirPath: string) {
  return useQuery<DirListing>({
    queryKey: ["files", dirPath],
    queryFn: () => api.get<DirListing>(`/files?path=${encodeURIComponent(dirPath)}`),
    retry: false,
  });
}

export function useFileContent(filePath: string | null) {
  return useQuery<FileContent>({
    queryKey: ["file-content", filePath],
    queryFn: () => api.get<FileContent>(`/files/read?path=${encodeURIComponent(filePath!)}`),
    enabled: !!filePath,
    retry: false,
  });
}

export function useWriteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ path, content }: { path: string; content: string }) =>
      api.post("/files/write", { path, content }),
    onSuccess: (_d, vars) => {
      const dir = vars.path.split("/").slice(0, -1).join("/") || "/";
      qc.invalidateQueries({ queryKey: ["files", dir] });
      qc.invalidateQueries({ queryKey: ["file-content", vars.path] });
    },
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (filePath: string) =>
      api.delete("/files", { path: filePath }),
    onSuccess: (_d, filePath) => {
      const dir = filePath.split("/").slice(0, -1).join("/") || "/";
      qc.invalidateQueries({ queryKey: ["files", dir] });
    },
  });
}

export function useMkdir() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dirPath: string) => api.post("/files/mkdir", { path: dirPath }),
    onSuccess: (_d, dirPath) => {
      const parent = dirPath.split("/").slice(0, -1).join("/") || "/";
      qc.invalidateQueries({ queryKey: ["files", parent] });
    },
  });
}
