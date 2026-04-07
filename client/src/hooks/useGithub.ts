import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GithubRepo, GithubCommit, GithubOverview } from "@shared/types";

export function useGithubRepos() {
  return useQuery<GithubRepo[]>({
    queryKey: ["github-repos"],
    queryFn: () => api.get("/github/repos"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useGithubCommits(repo: string | null, limit = 20) {
  return useQuery<GithubCommit[]>({
    queryKey: ["github-commits", repo, limit],
    queryFn: () => api.get(`/github/commits?repo=${repo}&limit=${limit}`),
    enabled: !!repo,
    retry: false,
  });
}

export function useGithubOverview() {
  return useQuery<GithubOverview>({
    queryKey: ["github-overview"],
    queryFn: () => api.get("/github/overview"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
