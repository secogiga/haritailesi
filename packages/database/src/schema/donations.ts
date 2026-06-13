import { pgTable, uuid, text, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  donationTypeEnum,
  donationMethodEnum,
  donationStatusEnum,
  paymentAccountEnum,
} from './enums';
import { users } from './users';
import { applications } from './applications';

// ─── Donations ────────────────────────────────────────────────────────────────

export const donations = pgTable(
  'donations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    // Başvuruya bağlı üyelik ödemeleri için FK — duplicate donation'ı önler
    applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    fullName: text('full_name').notNull(),
    // Kuruş cinsinden (TL için: 1 TL = 100 kuruş)
    amount: integer('amount').notNull(),
    currency: text('currency').notNull().default('TRY'),
    type: donationTypeEnum('type').notNull().default('one_time'),
    method: donationMethodEnum('method').notNull().default('bank_transfer'),
    status: donationStatusEnum('status').notNull().default('pending'),
    // iyzico ödeme bilgileri
    paymentAccount: paymentAccountEnum('payment_account').notNull().default('vakif'),
    iyzicoToken: text('iyzico_token'),
    iyzicoPaymentId: text('iyzico_payment_id'),
    iyzicoConversationId: text('iyzico_conversation_id'),
    referenceCode: text('reference_code'),
    notes: text('notes'),
    // Annual donation fields
    donationCategory: text('donation_category').default('genel'), // 'kurumsal' | 'bireysel' | 'genel'
    companyName: text('company_name'),
    packageTier: text('package_tier'),   // 'bronz' | 'gumus' | 'altin' (kurumsal için)
    renewalDue: timestamp('renewal_due', { withTimezone: true }),
    // Ödeme belgesi / dekont (MinIO key) — özellikle banka havalesi için
    proofKey: text('proof_key'),
    proofUploadedAt: timestamp('proof_uploaded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('donations_reference_unique').on(t.referenceCode),
    index('donations_user_idx').on(t.userId),
    index('donations_status_idx').on(t.status),
    index('donations_created_idx').on(t.createdAt),
  ],
);

export const donationsRelations = relations(donations, ({ one }) => ({
  user: one(users, { fields: [donations.userId], references: [users.id] }),
  application: one(applications, { fields: [donations.applicationId], references: [applications.id] }),
}));
