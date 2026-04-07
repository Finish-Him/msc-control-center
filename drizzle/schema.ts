import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => admins.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── VPS ─────────────────────────────────────────────────────────────────────

export const vpsInstances = pgTable("vps_instances", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  host: varchar("host", { length: 256 }).notNull(),
  port: integer("port").notNull().default(22),
  username: varchar("username", { length: 64 }).notNull(),
  authType: varchar("auth_type", { length: 16 }).notNull().default("password"), // password | key
  authSecretEncrypted: text("auth_secret_encrypted"), // AES-256-GCM encrypted
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sshSessions = pgTable("ssh_sessions", {
  id: serial("id").primaryKey(),
  vpsId: integer("vps_id")
    .notNull()
    .references(() => vpsInstances.id, { onDelete: "cascade" }),
  adminId: integer("admin_id")
    .notNull()
    .references(() => admins.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  bytesIn: integer("bytes_in").default(0),
  bytesOut: integer("bytes_out").default(0),
});

// ─── Services (API keys) ─────────────────────────────────────────────────────

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(), // anthropic | openai | openrouter | elevenlabs | huggingface | github | trello
  apiKeyEncrypted: text("api_key_encrypted"),
  isActive: boolean("is_active").default(true),
  meta: jsonb("meta"), // extra config (model names, org id, etc)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Gradio Apps ─────────────────────────────────────────────────────────────

export const gradioApps = pgTable("gradio_apps", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  url: text("url").notNull().unique(),
  version: varchar("version", { length: 8 }), // v1 | v2 | null
  lastCheckedAt: timestamp("last_checked_at"),
  lastStatus: varchar("last_status", { length: 16 }), // ok | warn | fail
  lastMessage: text("last_message"),
  healthHistory: jsonb("health_history").$type<Array<{ ts: string; status: string; msg: string }>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
