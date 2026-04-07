import { useState } from "react";
import { useGithubRepos, useGithubOverview, useGithubCommits } from "@/hooks/useGithub";
import { PageLoader } from "@/components/LoadingSpinner";
import StatsCard from "@/components/StatsCard";
import { cn, formatRelativeDate } from "@/lib/utils";
import { Github, Star, GitFork, Lock, Circle, GitCommit } from "lucide-react";
import type { GithubRepo } from "@shared/types";
import { LANGUAGE_COLORS } from "@shared/const";

export default function GithubPage() {
  const { data: repos, isLoading } = useGithubRepos();
  const { data: overview } = useGithubOverview();
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const { data: commits } = useGithubCommits(selectedRepo, 20);

  if (isLoading) return <PageLoader />;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Github className="w-6 h-6" /> GitHub
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Repositórios e atividade</p>
      </div>

      {/* Overview stats */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Repos" value={overview.totalRepos} icon={Github} />
          <StatsCard label="Públicos" value={overview.totalPublic} icon={Circle} iconColor="text-emerald-400" />
          <StatsCard label="Privados" value={overview.totalPrivate} icon={Lock} iconColor="text-yellow-400" />
          <StatsCard label="Stars" value={overview.totalStars} icon={Star} iconColor="text-yellow-400" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repos list */}
        <div className="lg:col-span-2 glass rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 text-sm font-semibold">
            Repositórios
          </div>
          <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
            {repos?.map((repo: GithubRepo) => (
              <div
                key={repo.id}
                onClick={() => setSelectedRepo(selectedRepo === repo.fullName ? null : repo.fullName)}
                className={cn(
                  "px-4 py-3 cursor-pointer hover:bg-white/3 transition",
                  selectedRepo === repo.fullName && "bg-white/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {repo.isPrivate && <Lock className="w-3 h-3 text-yellow-400 shrink-0" />}
                      <span className="text-sm font-medium truncate">{repo.name}</span>
                    </div>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{repo.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: LANGUAGE_COLORS[repo.language] ?? "#ccc" }}
                        />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" /> {repo.stars}
                    </span>
                    <span className="hidden sm:block">{formatRelativeDate(repo.pushedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commits panel */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 text-sm font-semibold">
            {selectedRepo ? `Commits — ${selectedRepo.split("/")[1]}` : "Selecione um repo"}
          </div>
          <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
            {!selectedRepo && (
              <p className="text-center py-8 text-muted-foreground text-sm">
                Clique em um repositório para ver os commits
              </p>
            )}
            {commits?.map((c) => (
              <a
                key={c.sha}
                href={c.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 hover:bg-white/3 transition"
              >
                <p className="text-xs font-mono text-purple-400">{c.sha.slice(0, 7)}</p>
                <p className="text-sm mt-0.5 line-clamp-2">{c.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {c.author} · {formatRelativeDate(c.date)}
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
