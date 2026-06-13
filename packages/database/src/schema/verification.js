"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationDocumentsRelations = exports.verificationDocuments = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var users_1 = require("./users");
// ─── Verification Documents ───────────────────────────────────────────────────
// Tier bazlı doğrulama — her üyelik seviyesine uygun belge gereksinimleri
exports.verificationDocuments = (0, pg_core_1.pgTable)('verification_documents', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(function () { return users_1.users.id; }, { onDelete: 'cascade' }),
    // 'diploma', 'transcript', 'employee_card', 'shkm_certificate', 'lihkab_certificate', 'tax_plate', vb.
    documentType: (0, pg_core_1.text)('document_type').notNull(),
    // MinIO'daki dosya yolu — storage abstraction layer üzerinden erişilir
    fileKey: (0, pg_core_1.text)('file_key').notNull(),
    originalFilename: (0, pg_core_1.text)('original_filename').notNull(),
    mimeType: (0, pg_core_1.text)('mime_type').notNull(),
    // 'pending' | 'approved' | 'rejected'
    status: (0, pg_core_1.text)('status').notNull().default('pending'),
    reviewedBy: (0, pg_core_1.uuid)('reviewed_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    reviewedAt: (0, pg_core_1.timestamp)('reviewed_at', { withTimezone: true }),
    notes: (0, pg_core_1.text)('notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('verification_documents_user_id_idx').on(t.userId),
    (0, pg_core_1.index)('verification_documents_status_idx').on(t.status),
]; });
// ─── Relations ────────────────────────────────────────────────────────────────
exports.verificationDocumentsRelations = (0, drizzle_orm_1.relations)(exports.verificationDocuments, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.verificationDocuments.userId], references: [users_1.users.id] }),
    });
});
