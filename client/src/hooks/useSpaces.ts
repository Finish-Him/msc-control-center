import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SpaceWithStatus } from "../../../shared/types.js";

export function useSpaces() {
  return useQuery<SpaceWithStatus[]>({
    queryKey: ["spaces"],
    queryFn: () => api.get<SpaceWithStatus[]>("/spaces"),
    staleTime: 60_000,
  });
}

export function useCheckSpace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ id: string; status: string; latencyMs: number; checkedAt: string }>(`/spaces/${id}/check`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spaces"] }),
  });
}

export function useCheckAllSpaces() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ message: string; count: number }>("/spaces/check-all", {}),
    onSuccess: () => {
      // refresh after a short delay to pick up results
      setTimeout(() => qc.invalidateQueries({ queryKey: ["spaces"] }), 10_000);
    },
  });
}
