"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listingAlertSubscriptions = exports.jobListingsRelations = exports.jobListings = exports.contentRequestsRelations = exports.contentRequests = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var enums_1 = require("./enums");
var users_1 = require("./users");
// ─── Content Requests (Mağaza / Etkinlik / Eğitim / İlan talepleri) ───────────
exports.contentRequests = (0, pg_core_1.pgTable)('content_requests', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    email: (0, pg_core_1.text)('email').notNull(),
    displayName: (0, pg_core_1.text)('display_name').notNull(),
    source: (0, enums_1.feedbackSourceEnum)('source').notNull().default('mutfak'),
    type: (0, enums_1.contentRequestTypeEnum)('type').notNull(),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description').notNull(),
    contactInfo: (0, pg_core_1.text)('contact_info'),
    attachmentUrl: (0, pg_core_1.text)('attachment_url'),
    status: (0, enums_1.contentRequestStatusEnum)('status').notNull().default('pending'),
    adminNotes: (0, pg_core_1.text)('admin_notes'),
    publishedContentId: (0, pg_core_1.uuid)('published_content_id'),
    reviewedAt: (0, pg_core_1.timestamp)('reviewed_at', { withTimezone: true }),
    reviewedBy: (0, pg_core_1.uuid)('reviewed_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('content_requests_status_idx').on(t.status),
    (0, pg_core_1.index)('content_requests_type_idx').on(t.type),
    (0, pg_core_1.index)('content_requests_user_idx').on(t.userId),
]; });
exports.contentRequestsRelations = (0, drizzle_orm_1.relations)(exports.contentRequests, function (_a) {
    var one = _a.one;
    return ({
        user: one(users_1.users, { fields: [exports.contentRequests.userId], references: [users_1.users.id] }),
        reviewer: one(users_1.users, { fields: [exports.contentRequests.reviewedBy], references: [users_1.users.id] }),
    });
});
// ─── Job Listings (İlan Panosu) ───────────────────────────────────────────────
exports.jobListings = (0, pg_core_1.pgTable)('job_listings', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    title: (0, pg_core_1.text)('title').notNull(),
    company: (0, pg_core_1.text)('company').notNull(),
    location: (0, pg_core_1.text)('location'),
    type: (0, enums_1.jobTypeEnum)('type').notNull().default('full_time'),
    description: (0, pg_core_1.text)('description').notNull(),
    applyUrl: (0, pg_core_1.text)('apply_url'),
    applyEmail: (0, pg_core_1.text)('apply_email'),
    contactPhone: (0, pg_core_1.text)('contact_phone'),
    price: (0, pg_core_1.text)('price'),
    tags: (0, pg_core_1.text)('tags').array().notNull().default([]),
    status: (0, enums_1.jobStatusEnum)('status').notNull().default('draft'),
    source: (0, pg_core_1.text)('source'),
    submittedBy: (0, pg_core_1.uuid)('submitted_by').references(function () { return users_1.users.id; }, { onDelete: 'set null' }),
    contentRequestId: (0, pg_core_1.uuid)('content_request_id').references(function () { return exports.contentRequests.id; }, { onDelete: 'set null' }),
    publishedAt: (0, pg_core_1.timestamp)('published_at', { withTimezone: true }),
    expiresAt: (0, pg_core_1.timestamp)('expires_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('job_listings_status_idx').on(t.status),
    (0, pg_core_1.index)('job_listings_type_idx').on(t.type),
]; });
exports.jobListingsRelations = (0, drizzle_orm_1.relations)(exports.jobListings, function (_a) {
    var one = _a.one;
    return ({
        submitter: one(users_1.users, { fields: [exports.jobListings.submittedBy], references: [users_1.users.id] }),
        contentRequest: one(exports.contentRequests, { fields: [exports.jobListings.contentRequestId], references: [exports.contentRequests.id] }),
    });
});
// ─── Listing Alert Subscriptions (Yeni ilan bildirimi) ────────────────────────
exports.listingAlertSubscriptions = (0, pg_core_1.pgTable)('listing_alert_subscriptions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.text)('email').notNull(),
    type: (0, pg_core_1.text)('type').notNull(), // kategori (isbirligi, proje, …) veya 'all'
    token: (0, pg_core_1.text)('token').notNull().unique(), // unsubscribe token
    confirmed: (0, pg_core_1.boolean)('confirmed').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.index)('listing_alert_email_type_idx').on(t.email, t.type),
    (0, pg_core_1.index)('listing_alert_token_idx').on(t.token),
]; });
