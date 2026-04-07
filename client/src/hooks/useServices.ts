import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Service, DashboardSummary } from "@shared/types";

export function useServices() {
  return useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: () => api.get("/services"),
  });
}

export function useAddService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; type: string; apiKey?: string; isActive?: boolean }) =>
      api.post("/services", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [k: string]: unknown }) =>
      api.put(`/services/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/services/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: () => api.get("/dashboard/summary"),
    refetchInterval: 60_000,
    retry: false,
  });
}
