import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { VpsInstance, VpsStats } from "@shared/types";

export function useVpsInstances() {
  return useQuery<VpsInstance[]>({
    queryKey: ["vps"],
    queryFn: () => api.get("/vps"),
  });
}

export function useVpsStats() {
  return useQuery<VpsStats>({
    queryKey: ["vps-stats"],
    queryFn: () => api.get("/vps/stats"),
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useVpsTest(id: string | number) {
  return useQuery<{ ok: boolean; error?: string }>({
    queryKey: ["vps-test", id],
    queryFn: () => api.get(`/vps/${id}/test`),
    enabled: false,
    retry: false,
  });
}
