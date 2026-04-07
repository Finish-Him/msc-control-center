import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DockerContainer, DockerImage } from "@shared/types";

export function useDockerContainers() {
  return useQuery<DockerContainer[]>({
    queryKey: ["docker-containers"],
    queryFn: () => api.get("/docker/containers"),
    refetchInterval: 15_000,
    retry: false,
  });
}

export function useDockerImages() {
  return useQuery<DockerImage[]>({
    queryKey: ["docker-images"],
    queryFn: () => api.get("/docker/images"),
    retry: false,
  });
}

export function useDockerStats() {
  return useQuery<{ running: number; total: number }>({
    queryKey: ["docker-stats"],
    queryFn: () => api.get("/docker/stats"),
    refetchInterval: 15_000,
    retry: false,
  });
}

export function useContainerAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "start" | "stop" | "restart" }) =>
      api.post(`/docker/containers/${id}/${action}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["docker-containers"] });
      qc.invalidateQueries({ queryKey: ["docker-stats"] });
    },
  });
}

export function useContainerLogs(id: string | null, lines = 100) {
  return useQuery<{ logs: string }>({
    queryKey: ["docker-logs", id, lines],
    queryFn: () => api.get(`/docker/containers/${id}/logs?lines=${lines}`),
    enabled: !!id,
    retry: false,
  });
}
