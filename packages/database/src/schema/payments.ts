import {
  pgTable,
  uuid,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { membershipTierEnum, membershipSubStatusEnum } from './enums';
import { users } from './users';
import { donations } from './donations';

// ─── Üyelik Ücret Konfigürasyonu ──────────────────────────────────────────────
// Her yıl başında admin panelden güncellenir.
// amountKurus = 0 → ücretsiz tier (haritailesi_genc, new_graduate_member)
// label: "Mesleğin Değer Ortağı Bağışı", "Mesleğe Değer Katan Marka Bağışı" vb.

export const membershipFeeConfigs = pgTable(
  'membership_fee_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    year: integer('year').notNull(),
    tier: membershipTierEnum('tier').notNull(),
    amountKurus: integer('amount_kurus').notNull().default(0),
    label: text('label').notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('mfc_year_tier_unique').on(t.year, t.tier),
    index('mfc_year_idx').on(t.year),
    index('mfc_active_idx').on(t.isActive),
  ],
);

// ─── Üye Numarası Sayaçları ────────────────────────────────────────────────────
// Format: HA-YY-KAT-SIRANO → HA-26-10-001
// Her (yıl, kategori) çifti için ayrı ardışık sayaç.
// Atomic increment: UPDATE ... SET last_seq = last_seq + 1 RETURNING last_seq

export const memberNumberSeqs = pgTable(
  'member_number_seqs',
  {
    year: smallint('year').notNull(),
    category: text('category').notNull(), // '01','10','11','12','15','30'
    lastSeq: integer('last_seq').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.year, t.category] }),
  ],
);

// ─── Üyelik Aboneliği ─────────────────────────────────────────────────────────
// Üye numarası, süre, hatırlatma durumlarını tutar.
// userId null ise misafir ödeme (guestEmail/guestFullName zorunlu).

export const membershipSubscriptions = pgTable(
  'membership_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Sahibi — kayıtlı üye veya misafir
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    donationId: uuid('donation_id').references(() => donations.id, { onDelete: 'set null' }),
    guestEmail: text('guest_email'),
    guestFullName: text('guest_full_name'),

    // Üye numarası bileşenleri
    memberNumber: text('member_number').notNull(),         // "HA-26-10-001"
    memberNumberYear: smallint('member_number_year').notNull(), // 26
    memberNumberCategory: text('member_number_category').notNull(), // "10"
    memberNumberSeq: integer('member_number_seq').notNull(),    // 1

    // Üyelik bilgileri
    membershipTier: membershipTierEnum('membership_tier').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    status: membershipSubStatusEnum('status').notNull().default('pending_payment'),

    // Hatırlatma gönderim takibi
    reminder30SentAt: timestamp('reminder_30_sent_at', { withTimezone: true }),
    reminder7SentAt: timestamp('reminder_7_sent_at', { withTimezone: true }),
    reminder1SentAt: timestamp('reminder_1_sent_at', { withTimezone: true }),
    expiredNotifiedAt: timestamp('expired_notified_at', { withTimezone: true }),

    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('ms_member_number_unique').on(t.memberNumber),
    index('ms_user_idx').on(t.userId),
    index('ms_status_idx').on(t.status),
    index('ms_expires_at_idx').on(t.expiresAt),
    index('ms_donation_idx').on(t.donationId),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const membershipFeeConfigsRelations = relations(membershipFeeConfigs, () => ({}));

export const membershipSubscriptionsRelations = relations(membershipSubscriptions, ({ one }) => ({
  user: one(users, { fields: [membershipSubscriptions.userId], references: [users.id] }),
  donation: one(donations, { fields: [membershipSubscriptions.donationId], references: [donations.id] }),
}));
