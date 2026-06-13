import {
  pgTable, pgEnum, uuid, text, boolean, integer, timestamp, index, jsonb, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// ─── Shared enums ─────────────────────────────────────────────────────────────

export const libraryStatusEnum = pgEnum('library_status', [
  'draft',
  'published',
  'archived',
]);

export const libraryGuideTypeEnum = pgEnum('library_guide_type', [
  'guide',           // Rehber
  'article',         // Makale
  'roadmap',         // Yol Haritası
  'technical_doc',   // Teknik Doküman
  'career_guide',    // Kariyer Rehberi
]);

export const libraryDocumentTypeEnum = pgEnum('library_document_type', [
  'pdf',
  'technical_spec',  // Teknik Şartname
  'academic',        // Akademik Yayın
  'report',          // Rapor
  'standard',        // Standart
  'guide_doc',       // Kılavuz
]);

export const libraryRegulationTypeEnum = pgEnum('library_regulation_type', [
  'kanun',
  'yonetmelik',
  'genelge',
  'teknik_teblig',
  'kurum_yazisi',
]);

// Meslek alanı kategorisi (tüm bölümler için ortak)
export const libraryFieldEnum = pgEnum('library_field', [
  'klasik_haritacilik',
  'cbs',
  'fotogrametri',
  'kadastro',
  'uzaktan_algilama',
  'gayrimenkul_degerleme',
  'yazilim',
  'kariyer',
  'egitim',
  'kamu',
  'ozel_sektor',
  'insaat',
  'genel',
]);

// ─── Sözlük Terimleri ─────────────────────────────────────────────────────────

export const libraryTerms = pgTable(
  'library_terms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').unique(),
    term: text('term').notNull(),
    fullForm: text('full_form'),                  // Açık adı / İngilizce karşılığı
    definition: text('definition').notNull(),
    fields: libraryFieldEnum('field').array().notNull().default([]),
    tags: text('tags').array().notNull().default([]),
    relatedTermIds: uuid('related_term_ids').array().notNull().default([]),
    seeAlso: text('see_also').array().notNull().default([]),
    status: libraryStatusEnum('status').notNull().default('draft'),
    isFeatured: boolean('is_featured').notNull().default(false),
    viewCount: integer('view_count').notNull().default(0),
    dailyOrder: integer('daily_order'),
    level: text('level').default('beginner'),      // 'beginner' | 'intermediate' | 'advanced'
    sourceLevel: text('source_level'),             // 'resmi' | 'akademik' | 'uzman' | 'topluluk'
    contributors: jsonb('contributors').$type<Array<{ name: string; role?: string; userId?: string }>>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('lt_status_idx').on(t.status),
    index('lt_term_idx').on(t.term),
    index('lt_featured_idx').on(t.isFeatured),
  ],
);

// ─── Rehberler & Makaleler ────────────────────────────────────────────────────

export const libraryGuides = pgTable(
  'library_guides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    body: text('body'),                           // Markdown içerik
    type: libraryGuideTypeEnum('type').notNull().default('guide'),
    fields: libraryFieldEnum('field').array().notNull().default([]),
    tags: text('tags').array().notNull().default([]),
    authorName: text('author_name'),
    authorUserId: uuid('author_user_id').references(() => users.id, { onDelete: 'set null' }),
    status: libraryStatusEnum('status').notNull().default('draft'),
    isFeatured: boolean('is_featured').notNull().default(false),
    readingTimeMinutes: integer('reading_time_minutes'),
    viewCount: integer('view_count').notNull().default(0),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    seriesSlug: text('series_slug'),
    seriesOrder: integer('series_order'),
    relatedRegulationSlugs: text('related_regulation_slugs').array().notNull().default([]),
    level: text('level').default('beginner'),
    sourceLevel: text('source_level'),
    prerequisites: jsonb('prerequisites').$type<Array<{ termSlug: string; termTitle: string }>>().notNull().default([]),
    contributors: jsonb('contributors').$type<Array<{ name: string; role?: string; userId?: string }>>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('lg_status_idx').on(t.status),
    index('lg_slug_idx').on(t.slug),
    index('lg_type_idx').on(t.type),
    index('lg_featured_idx').on(t.isFeatured),
  ],
);

// ─── Doküman Merkezi ─────────────────────────────────────────────────────────

export const libraryDocuments = pgTable(
  'library_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    type: libraryDocumentTypeEnum('type').notNull().default('pdf'),
    fields: libraryFieldEnum('field').array().notNull().default([]),
    tags: text('tags').array().notNull().default([]),
    fileUrl: text('file_url'),
    externalUrl: text('external_url'),
    authorName: text('author_name'),
    publishYear: integer('publish_year'),
    fileSizeBytes: integer('file_size_bytes'),
    status: libraryStatusEnum('status').notNull().default('draft'),
    isFeatured: boolean('is_featured').notNull().default(false),
    downloadCount: integer('download_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('ld_status_idx').on(t.status),
    index('ld_type_idx').on(t.type),
    index('ld_featured_idx').on(t.isFeatured),
  ],
);

// ─── Mevzuat Merkezi ─────────────────────────────────────────────────────────

export const libraryRegulations = pgTable(
  'library_regulations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    shortTitle: text('short_title'),
    type: libraryRegulationTypeEnum('type').notNull().default('yonetmelik'),
    fields: libraryFieldEnum('field').array().notNull().default([]),
    issuingBody: text('issuing_body'),            // Yayımlayan kurum (TKGM, Resmî Gazete vb.)
    referenceNumber: text('reference_number'),    // Kanun no / tebliğ no
    publishDate: text('publish_date'),            // YYYY-MM-DD metin olarak (tam tarih bilinmeyebilir)
    summary: text('summary'),
    fullText: text('full_text'),
    aiSummary: text('ai_summary'),               // AI ile üretilen Türkçe özet
    externalUrl: text('external_url'),           // Resmî Gazete linki
    status: libraryStatusEnum('status').notNull().default('draft'),
    isFeatured: boolean('is_featured').notNull().default(false),
    relatedRegulationIds: uuid('related_regulation_ids').array().notNull().default([]),
    relatedTermSlugs: text('related_term_slugs').array().notNull().default([]),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    changelogEntries: jsonb('changelog_entries').$type<{ date: string; note: string }[]>().notNull().default([]),
    validityStatus: text('validity_status').notNull().default('yururlukte'),
    sourceLevel: text('source_level'),
    viewCount: integer('view_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('lr_status_idx').on(t.status),
    index('lr_slug_idx').on(t.slug),
    index('lr_type_idx').on(t.type),
    index('lr_featured_idx').on(t.isFeatured),
  ],
);

// ─── Öğrenme Yolları ─────────────────────────────────────────────────────────

export const libraryPaths = pgTable(
  'library_paths',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    field: libraryFieldEnum('field'),
    difficulty: text('difficulty').notNull().default('beginner'),
    estimatedMinutes: integer('estimated_minutes'),
    coverEmoji: text('cover_emoji').default('📚'),
    items: jsonb('items').$type<Array<{
      contentType: 'term' | 'guide' | 'regulation' | 'document';
      contentId: string;
      slug: string;
      title: string;
      order: number;
    }>>().notNull().default([]),
    status: libraryStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('lpath_status_idx').on(t.status),
    index('lpath_slug_idx').on(t.slug),
  ],
);

// ─── Library Progress ─────────────────────────────────────────────────────────
export const libraryProgress = pgTable(
  'library_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    contentType: text('content_type').notNull(),
    contentId: uuid('content_id').notNull(),
    markedAt: timestamp('marked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('lp_user_content_unique').on(t.userId, t.contentType, t.contentId),
    index('lp_user_idx').on(t.userId),
  ],
);

// ─── Library Suggestions ──────────────────────────────────────────────────────
export const librarySuggestions = pgTable(
  'library_suggestions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    contentType: text('content_type').notNull(),
    contentId: uuid('content_id'),
    body: text('body').notNull(),
    status: text('status').notNull().default('pending'),
    adminNote: text('admin_note'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('ls_status_idx').on(t.status),
    index('ls_user_idx').on(t.userId),
  ],
);

