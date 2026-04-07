import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { LocalProject } from "../../../shared/types.js";

export function useLocalProjects() {
  return useQuery<LocalProject[]>({
    queryKey: ["local-projects"],
    queryFn: () => api.get<LocalProject[]>("/local"),
    refetchInterval: 5000,
  });
}

export function useStartProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ id: string; pid: number; command: string }>(`/local/${id}/start`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["local-projects"] }),
  });
}

export function useStopProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ id: string; stopped: boolean }>(`/local/${id}/stop`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["local-projects"] }),
  });
}

/** Streams SSE logs for a running project. Returns an array of log lines. */
export function useProjectLogs(id: string | null) {
  const [lines, setLines] = useState<string[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!id) {
      setLines([]);
      return;
    }
    setLines([]);
    const token = localStorage.getItem("access_token");
    const url = `/api/local/${id}/logs${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      setLines((prev) => [...prev.slice(-999), e.data]);
    };
    es.onerror = () => es.close();

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [id]);

  return lines;
}
