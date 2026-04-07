import { relations } from "drizzle-orm";
import {
  admins,
  refreshTokens,
  vpsInstances,
  sshSessions,
} from "./schema.js";

export const adminsRelations = relations(admins, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  sshSessions: many(sshSessions),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  admin: one(admins, {
    fields: [refreshTokens.adminId],
    references: [admins.id],
  }),
}));

export const vpsInstancesRelations = relations(vpsInstances, ({ many }) => ({
  sshSessions: many(sshSessions),
}));

export const sshSessionsRelations = relations(sshSessions, ({ one }) => ({
  vps: one(vpsInstances, {
    fields: [sshSessions.vpsId],
    references: [vpsInstances.id],
  }),
  admin: one(admins, {
    fields: [sshSessions.adminId],
    references: [admins.id],
  }),
}));
