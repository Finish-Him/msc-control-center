import { env } from "./env.js";
import { sshExec } from "./ssh.js";
import type { VpsStats } from "@shared/types.js";

export type VpsConnectConfig = {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
};

/** Build the default VPS config from environment variables. */
export function defaultVpsConfig(): VpsConnectConfig {
  return {
    host: env.VPS_HOST,
    port: env.VPS_PORT,
    username: env.VPS_USER,
    password: env.VPS_PASSWORD,
  };
}

/** Returns true when VPS_HOST is set in the environment. */
export function hasVpsConfig(): boolean {
  return !!env.VPS_HOST;
}

const VPS_STATS_CMD =
  `echo "---HOSTNAME---" && hostname && ` +
  `echo "---UPTIME---" && uptime -p && ` +
  `echo "---LOAD---" && cat /proc/loadavg && ` +
  `echo "---MEM---" && free -m | awk 'NR==2{print $2,$3}' && ` +
  `echo "---DISK---" && df -BG / | awk 'NR==2{gsub("G",""); print $2,$3}' && ` +
  `echo "---CPU---" && top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d. -f1`;

function parseSection(out: string, tag: string): string {
  const m = out.match(new RegExp(`---${tag}---\\n([\\s\\S]*?)(?=---|$)`));
  return m ? m[1].trim() : "";
}

/** Fetch VPS statistics over SSH using a single compound command. */
export async function fetchVpsStats(
  cfg: VpsConnectConfig,
  timeout = 15_000
): Promise<VpsStats> {
  const out = await sshExec(cfg, VPS_STATS_CMD, timeout);

  const [memTotal, memUsed] = parseSection(out, "MEM").split(" ").map(Number);
  const [diskTotal, diskUsed] = parseSection(out, "DISK").split(" ").map(Number);

  return {
    hostname: parseSection(out, "HOSTNAME"),
    uptime: parseSection(out, "UPTIME"),
    loadAvg: parseSection(out, "LOAD").split(" ").slice(0, 3).join(" "),
    cpu: parseInt(parseSection(out, "CPU")) || 0,
    memUsed: memUsed || 0,
    memTotal: memTotal || 0,
    diskUsed: diskUsed || 0,
    diskTotal: diskTotal || 0,
  };
}
