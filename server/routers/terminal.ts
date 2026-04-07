import type { WebSocket } from "ws";
import { Client } from "ssh2";
import { db } from "../db.js";
import { sshSessions, vpsInstances } from "../../drizzle/schema.js";
import { decrypt } from "../_core/crypto.js";
import { env } from "../_core/env.js";
import { buildConnectConfig } from "../_core/ssh.js";
import type { JwtPayload } from "@shared/types.js";

export async function handleTerminalConnection(ws: WebSocket, admin: JwtPayload) {
  let sessionId: number | null = null;
  let bytesIn = 0;
  let bytesOut = 0;

  // Determine VPS config: use default from env for now
  // Future: parse query param for vpsId
  const sshCfg = {
    host: env.VPS_HOST,
    port: env.VPS_PORT,
    username: env.VPS_USER,
    ...(env.VPS_PASSWORD ? { password: env.VPS_PASSWORD } : {}),
  };

  if (!sshCfg.host) {
    ws.send("\r\n\x1b[31m[Terminal] VPS_HOST não configurado\x1b[0m\r\n");
    ws.close();
    return;
  }

  // Log session start
  try {
    // find default vpsInstance or create placeholder
    const [vpsRow] = await db.select().from(vpsInstances).limit(1);
    if (vpsRow) {
      const [sess] = await db
        .insert(sshSessions)
        .values({ vpsId: vpsRow.id, adminId: admin.adminId })
        .returning();
      sessionId = sess.id;
    }
  } catch {
    // non-fatal
  }

  const conn = new Client();
  let shell: any = null;

  conn
    .on("ready", () => {
      conn.shell({ term: "xterm-256color" }, (err, stream) => {
        if (err) {
          ws.send(`\r\n\x1b[31m[Terminal] Erro ao abrir shell: ${err.message}\x1b[0m\r\n`);
          ws.close();
          conn.end();
          return;
        }

        shell = stream;

        // VPS → client
        stream.on("data", (data: Buffer) => {
          bytesOut += data.length;
          if (ws.readyState === ws.OPEN) {
            ws.send(data.toString("utf8"));
          }
        });

        stream.stderr.on("data", (data: Buffer) => {
          bytesOut += data.length;
          if (ws.readyState === ws.OPEN) {
            ws.send(data.toString("utf8"));
          }
        });

        stream.on("close", () => {
          endSession();
          if (ws.readyState === ws.OPEN) ws.close();
        });
      });
    })
    .on("error", (err) => {
      ws.send(`\r\n\x1b[31m[Terminal] Erro SSH: ${err.message}\x1b[0m\r\n`);
      ws.close();
    })
    .connect(buildConnectConfig(sshCfg));

  // client → VPS
  ws.on("message", (data) => {
    if (shell && shell.writable) {
      const str = data.toString();
      bytesIn += str.length;

      // Handle resize messages: {"type":"resize","cols":N,"rows":N}
      if (str.startsWith("{")) {
        try {
          const msg = JSON.parse(str);
          if (msg.type === "resize") {
            shell.setWindow(msg.rows, msg.cols, 0, 0);
            return;
          }
        } catch {
          // not JSON — treat as raw input
        }
      }
      shell.write(str);
    }
  });

  ws.on("close", () => {
    endSession();
    if (shell) shell.end();
    conn.end();
  });

  ws.on("error", () => {
    endSession();
    if (shell) shell.end();
    conn.end();
  });

  async function endSession() {
    if (sessionId !== null) {
      try {
        const { sshSessions: t } = await import("../../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        await db
          .update(t)
          .set({ endedAt: new Date(), bytesIn, bytesOut })
          .where(eq(t.id, sessionId!));
      } catch {
        // non-fatal
      }
      sessionId = null;
    }
  }
}
