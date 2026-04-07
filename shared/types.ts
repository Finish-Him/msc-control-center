// ─── Common ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  admin: { id: number; username: string };
}

export interface JwtPayload {
  adminId: number;
  username: string;
  iat?: number;
  exp?: number;
}

// ─── VPS ─────────────────────────────────────────────────────────────────────

export interface VpsInstance {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: "password" | "key";
  isDefault: boolean;
  createdAt: string;
}

export interface VpsStats {
  cpu: number;        // percentage
  memUsed: number;    // MB
  memTotal: number;   // MB
  diskUsed: number;   // GB
  diskTotal: number;  // GB
  uptime: string;
  loadAvg: string;
  hostname: string;
}

export interface SshSession {
  id: number;
  vpsId: number;
  startedAt: string;
  endedAt: string | null;
  bytesIn: number;
  bytesOut: number;
}

// ─── Docker ──────────────────────────────────────────────────────────────────

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;  // running | exited | paused
  ports: string;
  created: string;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
}

// ─── GitHub ──────────────────────────────────────────────────────────────────

export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  isPrivate: boolean;
  htmlUrl: string;
  pushedAt: string | null;
  defaultBranch: string;
}

export interface GithubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  htmlUrl: string;
  repoName: string;
}

export interface GithubOverview {
  totalRepos: number;
  totalPublic: number;
  totalPrivate: number;
  totalStars: number;
  mostUsedLanguages: Array<{ language: string; count: number }>;
}

// ─── Gradio ──────────────────────────────────────────────────────────────────

export type GradioStatus = "ok" | "warn" | "fail" | "unknown";

export interface GradioApp {
  id: number;
  name: string;
  url: string;
  version: string | null;
  lastCheckedAt: string | null;
  lastStatus: GradioStatus | null;
  lastMessage: string | null;
  healthHistory: Array<{ ts: string; status: string; msg: string }>;
}

export interface GradioHealthResult {
  appId: number;
  status: GradioStatus;
  version: string | null;
  message: string;
  checkedAt: string;
}

// ─── Services ────────────────────────────────────────────────────────────────

export type ServiceType =
  | "anthropic"
  | "openai"
  | "openrouter"
  | "elevenlabs"
  | "huggingface"
  | "github"
  | "trello"
  | "supabase"
  | "vercel";

export interface Service {
  id: number;
  name: string;
  type: ServiceType;
  isActive: boolean;
  hasApiKey: boolean;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Dashboard Summary ───────────────────────────────────────────────────────

export interface DashboardSummary {
  vps: { online: boolean; host: string; stats: VpsStats | null };
  docker: { running: number; total: number };
  github: { repos: number; lastPush: string | null };
  gradio: { online: number; total: number };
  services: { active: number; total: number };
}

// ─── HF Spaces ───────────────────────────────────────────────────────────────
export type SpaceCategory = "tts" | "image" | "video" | "coding" | "embedding" | "rag";
export type SpaceStatus = "ok" | "sleeping" | "fail" | "unknown";

export interface SpaceCard {
  id: string;
  name: string;
  category: SpaceCategory;
  hfUrl: string;
  appUrl: string;
  description: string;
}

export interface SpaceWithStatus extends SpaceCard {
  status: SpaceStatus;
  latencyMs?: number;
  checkedAt?: string;
}

// ─── Local Projects ──────────────────────────────────────────────────────────
export type ProjectStack = "node" | "python" | "go" | "rust" | "unknown";

export interface LocalProject {
  id: string;
  name: string;
  path: string;
  stack: ProjectStack;
  devCommand: string;
  isRunning: boolean;
  pid?: number;
}
