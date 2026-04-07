import { Client } from "ssh2";
import type { ConnectConfig } from "ssh2";

export interface SshConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export function sshExec(config: SshConfig, command: string, timeoutMs = 15_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = "";
    const timeout = setTimeout(() => {
      conn.end();
      reject(new Error("SSH command timed out"));
    }, timeoutMs);

    conn
      .on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            clearTimeout(timeout);
            conn.end();
            reject(err);
            return;
          }
          stream.on("data", (data: Buffer) => {
            output += data.toString();
          });
          stream.stderr.on("data", (data: Buffer) => {
            output += data.toString();
          });
          stream.on("close", () => {
            clearTimeout(timeout);
            conn.end();
            resolve(output.trim());
          });
        });
      })
      .on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      })
      .connect(buildConnectConfig(config));
  });
}

export function buildConnectConfig(config: SshConfig): ConnectConfig {
  return {
    host: config.host,
    port: config.port,
    username: config.username,
    ...(config.password ? { password: config.password } : {}),
    ...(config.privateKey ? { privateKey: config.privateKey } : {}),
    readyTimeout: 10_000,
    keepaliveInterval: 10_000,
  };
}
