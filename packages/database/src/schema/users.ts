import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  integer,
  boolean,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  membershipTierEnum,
  functionalRoleEnum,
  userStatusEnum,
  verificationStatusEnum,
} from './enums';

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    membershipTier: membershipTierEnum('membership_tier').notNull().default('registered_user'),
    status: userStatusEnum('status').notNull().default('pending'),
    verificationStatus: verificationStatusEnum('verification_status')
      .notNull()
      .default('unverified'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    // Denormalize — üyelik sorgu kolaylığı için (gerçek kaynak: membership_subscriptions)
    membershipExpiresAt: timestamp('membership_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('users_email_unique').on(t.email),
    index('users_status_idx').on(t.status),
    index('users_membership_tier_idx').on(t.membershipTier),
    index('users_deleted_at_idx').on(t.deletedAt),
  ],
);

// ─── User Profiles ────────────────────────────────────────────────────────────

export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    city: text('city'),
    profession: text('profession'),
    birthDate: date('birth_date'),
    graduationYear: integer('graduation_year'),
    workStatus: text('work_status'),
    professionalExperienceYears: integer('professional_experience_years'),
    linkedinUrl: text('linkedin_url'),
    websiteUrl: text('website_url'),
    skillTags: text('skill_tags').array().notNull().default([]),
    portfolioUrl: text('portfolio_url'),
    corporateName: text('corporate_name'),
    corporateRole: text('corporate_role'),
    // İletişim kanalı — SMS ve WhatsApp için
    phone: text('phone'),
    whatsappConsent: boolean('whatsapp_consent').notNull().default(false),
    smsConsent: boolean('sms_consent').notNull().default(false),
    // Admin'in üye hakkındaki dahili notları — uygulamadan taşınır, kullanıcıya gösterilmez
    internalNotes: text('internal_notes'),
    sndSubscribed: boolean('snd_subscribed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('user_profiles_user_id_unique').on(t.userId),
    index('user_profiles_city_idx').on(t.city),
    index('user_profiles_profession_idx').on(t.profession),
    index('user_profiles_name_trgm_idx').using('gin', t.displayName.op('gin_trgm_ops')),
    index('user_profiles_prof_trgm_idx').using('gin', t.profession.op('gin_trgm_ops')),
  ],
);

// ─── User Functional Roles ────────────────────────────────────────────────────

export const userFunctionalRoles = pgTable(
  'user_functional_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: functionalRoleEnum('role').notNull(),
    grantedBy: uuid('granted_by').references(() => users.id, { onDelete: 'set null' }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
  },
  (t) => [
    uniqueIndex('user_functional_roles_user_role_unique').on(t.userId, t.role),
    index('user_functional_roles_user_id_idx').on(t.userId),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, { fields: [users.id], references: [userProfiles.userId] }),
  functionalRoles: many(userFunctionalRoles),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
}));

export const userFunctionalRolesRelations = relations(userFunctionalRoles, ({ one }) => ({
  user: one(users, { fields: [userFunctionalRoles.userId], references: [users.id] }),
}));
