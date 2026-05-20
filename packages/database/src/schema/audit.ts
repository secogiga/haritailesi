import { pgTable, uuid, text, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// ─── Audit Logs ───────────────────────────────────────────────────────────────
// Tüm admin aksiyonları ve state geçişleri burada kayıt altına alınır

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    // actorEmail snapshot olarak saklanır — user silinse bile log kalır
    actorEmail: text('actor_email'),
    action: text('action').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    beforeState: jsonb('before_state'),
    afterState: jsonb('after_state'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_logs_actor_id_idx').on(t.actorId),
    index('audit_logs_action_idx').on(t.action),
    index('audit_logs_entity_idx').on(t.entityType, t.entityId),
    index('audit_logs_created_at_idx').on(t.createdAt),
  ],
);

// ─── Action Logs ──────────────────────────────────────────────────────────────
// Gamification data — Faz 1'de kullanıcıya gösterilmez, sadece veri toplanır

export const actionLogs = pgTable(
  'action_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    actionType: text('action_type').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    // Gelecekteki gamification sistemi için rezerve edilmiş alan
    scoreReserved: integer('score_reserved').notNull().default(0),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('action_logs_user_id_idx').on(t.userId),
    index('action_logs_action_type_idx').on(t.actionType),
    index('action_logs_created_at_idx').on(t.createdAt),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const actionLogsRelations = relations(actionLogs, ({ one }) => ({
  user: one(users, { fields: [actionLogs.userId], references: [users.id] }),
}));
