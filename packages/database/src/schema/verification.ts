import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// ─── Verification Documents ───────────────────────────────────────────────────
// Tier bazlı doğrulama — her üyelik seviyesine uygun belge gereksinimleri

export const verificationDocuments = pgTable(
  'verification_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 'diploma', 'transcript', 'employee_card', 'shkm_certificate', 'lihkab_certificate', 'tax_plate', vb.
    documentType: text('document_type').notNull(),
    // MinIO'daki dosya yolu — storage abstraction layer üzerinden erişilir
    fileKey: text('file_key').notNull(),
    originalFilename: text('original_filename').notNull(),
    mimeType: text('mime_type').notNull(),
    // 'pending' | 'approved' | 'rejected'
    status: text('status').notNull().default('pending'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('verification_documents_user_id_idx').on(t.userId),
    index('verification_documents_status_idx').on(t.status),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const verificationDocumentsRelations = relations(verificationDocuments, ({ one }) => ({
  user: one(users, { fields: [verificationDocuments.userId], references: [users.id] }),
}));
