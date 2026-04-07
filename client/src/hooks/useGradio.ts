import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GradioApp, GradioHealthResult } from "@shared/types";

export function useGradioApps() {
  return useQuery<GradioApp[]>({
    queryKey: ["gradio-apps"],
    queryFn: () => api.get("/gradio"),
    refetchInterval: 60_000,
  });
}

export function useCheckGradioApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<GradioHealthResult>(`/gradio/${id}/check`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gradio-apps"] }),
  });
}

export function useAddGradioApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; url: string }) => api.post("/gradio", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gradio-apps"] }),
  });
}

export function useDeleteGradioApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/gradio/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gradio-apps"] }),
  });
}
