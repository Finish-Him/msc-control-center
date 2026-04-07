import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { admins, gradioApps, vpsInstances } from "../../drizzle/schema.js";
import { env } from "../_core/env.js";

const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const hash = await bcrypt.hash(adminPassword, 12);

// Create admin user
await db
  .insert(admins)
  .values({ username: "admin", passwordHash: hash })
  .onConflictDoNothing();
console.log(`[Seed] Admin criado: admin / ${adminPassword}`);

// Create default VPS
if (env.VPS_HOST) {
  await db
    .insert(vpsInstances)
    .values({
      name: "Hostinger VPS",
      host: env.VPS_HOST,
      port: env.VPS_PORT,
      username: env.VPS_USER,
      authType: "password",
      isDefault: true,
    })
    .onConflictDoNothing();
  console.log(`[Seed] VPS criada: ${env.VPS_HOST}`);
}

// Create default Gradio apps
await db
  .insert(gradioApps)
  .values([
    {
      name: "Gradio App v1",
      url: env.GRADIO_V1_URL,
      healthHistory: [],
    },
    {
      name: "Gradio App v2",
      url: env.GRADIO_V2_URL,
      healthHistory: [],
    },
  ])
  .onConflictDoNothing();
console.log("[Seed] Gradio apps criados");

console.log("[Seed] Concluído!");
process.exit(0);
