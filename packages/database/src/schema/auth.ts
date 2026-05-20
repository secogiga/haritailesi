import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// ─── Refresh Tokens ───────────────────────────────────────────────────────────
// Her cihaz/oturum için ayrı refresh token — logout all devices mümkün

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Token'ın hash'i saklanır, plaintext asla
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
  },
  (t) => [
    index('refresh_tokens_user_id_idx').on(t.userId),
    index('refresh_tokens_expires_at_idx').on(t.expiresAt),
  ],
);

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

// ─── Setup Tokens ─────────────────────────────────────────────────────────────
// İlk şifre belirleme akışı için tek kullanımlık tokenlar (24 saat geçerli)

export const setupTokens = pgTable(
  'setup_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('setup_tokens_user_id_idx').on(t.userId),
    index('setup_tokens_expires_at_idx').on(t.expiresAt),
  ],
);

export const setupTokensRelations = relations(setupTokens, ({ one }) => ({
  user: one(users, { fields: [setupTokens.userId], references: [users.id] }),
}));
