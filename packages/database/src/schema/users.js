"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userFunctionalRolesRelations = exports.userProfilesRelations = exports.usersRelations = exports.userFunctionalRoles = exports.userProfiles = exports.users = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
var enums_1 = require("./enums");
// ─── Users ────────────────────────────────────────────────────────────────────
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.text)('email').notNull(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    membershipTier: (0, enums_1.membershipTierEnum)('membership_tier').notNull().default('registered_user'),
    status: (0, enums_1.userStatusEnum)('status').notNull().default('pending'),
    verificationStatus: (0, enums_1.verificationStatusEnum)('verification_status')
        .notNull()
        .default('unverified'),
    lastLoginAt: (0, pg_core_1.timestamp)('last_login_at', { withTimezone: true }),
    // Denormalize — üyelik sorgu kolaylığı için (gerçek kaynak: membership_subscriptions)
    membershipExpiresAt: (0, pg_core_1.timestamp)('membership_expires_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at', { withTimezone: true }),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('users_email_unique').on(t.email),
    (0, pg_core_1.index)('users_status_idx').on(t.status),
    (0, pg_core_1.index)('users_membership_tier_idx').on(t.membershipTier),
    (0, pg_core_1.index)('users_deleted_at_idx').on(t.deletedAt),
]; });
// ─── User Profiles ────────────────────────────────────────────────────────────
exports.userProfiles = (0, pg_core_1.pgTable)('user_profiles', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    displayName: (0, pg_core_1.text)('display_name').notNull(),
    avatarUrl: (0, pg_core_1.text)('avatar_url'),
    bio: (0, pg_core_1.text)('bio'),
    city: (0, pg_core_1.text)('city'),
    profession: (0, pg_core_1.text)('profession'),
    birthDate: (0, pg_core_1.date)('birth_date'),
    graduationYear: (0, pg_core_1.integer)('graduation_year'),
    workStatus: (0, pg_core_1.text)('work_status'),
    professionalExperienceYears: (0, pg_core_1.integer)('professional_experience_years'),
    linkedinUrl: (0, pg_core_1.text)('linkedin_url'),
    websiteUrl: (0, pg_core_1.text)('website_url'),
    skillTags: (0, pg_core_1.text)('skill_tags').array().notNull().default([]),
    portfolioUrl: (0, pg_core_1.text)('portfolio_url'),
    corporateName: (0, pg_core_1.text)('corporate_name'),
    corporateRole: (0, pg_core_1.text)('corporate_role'),
    // İletişim kanalı — SMS ve WhatsApp için
    phone: (0, pg_core_1.text)('phone'),
    whatsappConsent: (0, pg_core_1.boolean)('whatsapp_consent').notNull().default(false),
    smsConsent: (0, pg_core_1.boolean)('sms_consent').notNull().default(false),
    // Admin'in üye hakkındaki dahili notları — uygulamadan taşınır, kullanıcıya gösterilmez
    internalNotes: (0, pg_core_1.text)('internal_notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('user_profiles_user_id_unique').on(t.userId),
    (0, pg_core_1.index)('user_profiles_city_idx').on(t.city),
    (0, pg_core_1.index)('user_profiles_profession_idx').on(t.profession),
    (0, pg_core_1.index)('user_profiles_name_trgm_idx').using('gin', t.displayName.op('gin_trgm_ops')),
    (0, pg_core_1.index)('user_profiles_prof_trgm_idx').using('gin', t.profession.op('gin_trgm_ops')),
]; });
// ─── User Functional Roles ────────────────────────────────────────────────────
exports.userFunctionalRoles = (0, pg_core_1.pgTable)('user_functional_roles', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' }),
    role: (0, enums_1.functionalRoleEnum)('role').notNull(),
    grantedBy: (0, pg_core_1.uuid)('granted_by').references(function () { return exports.users.id; }, { onDelete: 'set null' }),
    grantedAt: (0, pg_core_1.timestamp)('granted_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: (0, pg_core_1.timestamp)('revoked_at', { withTimezone: true }),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
}, function (t) { return [
    (0, pg_core_1.uniqueIndex)('user_functional_roles_user_role_unique').on(t.userId, t.role),
    (0, pg_core_1.index)('user_functional_roles_user_id_idx').on(t.userId),
]; });
// ─── Relations ────────────────────────────────────────────────────────────────
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        profile: one(exports.userProfiles, { fields: [exports.users.id], references: [exports.userProfiles.userId] }),
        functionalRoles: many(exports.userFunctionalRoles),
    });
});
exports.userProfilesRelations = (0, drizzle_orm_1.relations)(exports.userProfiles, function (_a) {
    var one = _a.one;
    return ({
        user: one(exports.users, { fields: [exports.userProfiles.userId], references: [exports.users.id] }),
    });
});
exports.userFunctionalRolesRelations = (0, drizzle_orm_1.relations)(exports.userFunctionalRoles, function (_a) {
    var one = _a.one;
    return ({
        user: one(exports.users, { fields: [exports.userFunctionalRoles.userId], references: [exports.users.id] }),
    });
});
