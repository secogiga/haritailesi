import { pgTable, uuid, text, boolean, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

// ─── CMS Eğitimler ────────────────────────────────────────────────────────────
// Yönetici tarafından oluşturulan eğitim/kurs kayıtları

export const trainings = pgTable(
  'cms_trainings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    instructor: text('instructor'),
    instructorTitle: text('instructor_title'),
    format: text('format'),        // Online | Yüz Yüze | Hibrit
    level: text('level'),          // Başlangıç | Orta | İleri
    duration: text('duration'),    // "12 saat · 6 oturum"
    price: text('price'),          // null = ücretsiz
    memberPrice: text('member_price'),
    description: text('description'),
    tags: jsonb('tags').$type<string[]>().default([]),
    viewCount: integer('view_count').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(false),
    registrationUrl: text('registration_url'),
    startDate: timestamp('start_date', { withTimezone: true }),
    source: text('source'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('trainings_slug_idx').on(t.slug),
    index('trainings_published_idx').on(t.isPublished),
  ],
);
