const BASE = "/api";

let _accessToken: string | null = null;

export function setToken(t: string | null) {
  _accessToken = t;
}
export function getToken() {
  return _accessToken;
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (_accessToken) headers["Authorization"] = `Bearer ${_accessToken}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers, credentials: "include" });

  if (res.status === 401) {
    // Try refresh once
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${_accessToken}`;
      const retry = await fetch(`${BASE}${path}`, { ...opts, headers, credentials: "include" });
      if (!retry.ok) throw new Error(await retry.text());
      return retry.json();
    }
    // Refresh failed — clear token and let UI handle redirect
    setToken(null);
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.text();
    let msg = body;
    try {
      const j = JSON.parse(body);
      msg = j.error ?? body;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    setToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
};

// Build WebSocket URL for the SSH terminal
export function buildTerminalWsUrl(): string {
  const token = _accessToken ?? "";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws/terminal?token=${encodeURIComponent(token)}`;
}
