import {
  Controller, Get, Post, Patch, Delete, Put,
  Body, Param, Query,
  ParseUUIDPipe, NotFoundException, BadRequestException,
} from '@nestjs/common';
import {
  IsString, IsOptional, IsIn, IsBoolean, MaxLength, IsNotEmpty, IsInt, IsUrl, Min,
  IsArray, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { RequirePermission } from '../rbac/rbac.decorator';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import {
  libraryTerms, libraryGuides, libraryDocuments, libraryRegulations, libraryPaths,
} from '@haritailesi/database';
import { userBadges } from '@haritailesi/database';
import { examQuestions, examCategories } from '@haritailesi/database';
import { users, userProfiles } from '@haritailesi/database';
import { eq, and, ilike, or, type SQL, desc, asc, count, sql } from 'drizzle-orm';
import { EmailService } from '../email/email.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

// ─── Field values ─────────────────────────────────────────────────────────────

const FIELDS = [
  'klasik_haritacilik', 'cbs', 'fotogrametri', 'kadastro', 'uzaktan_algilama',
  'gayrimenkul_degerleme', 'yazilim', 'kariyer', 'egitim', 'kamu',
  'ozel_sektor', 'insaat', 'genel',
] as const;
type LibraryField = (typeof FIELDS)[number];

const GUIDE_TYPES = ['guide', 'article', 'roadmap', 'technical_doc', 'career_guide'] as const;
const DOC_TYPES = ['pdf', 'technical_spec', 'academic', 'report', 'standard', 'guide_doc'] as const;
const REG_TYPES = ['kanun', 'yonetmelik', 'genelge', 'teknik_teblig', 'kurum_yazisi'] as const;

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class CreateTermDto {
  @IsNotEmpty() @IsString() @MaxLength(120)
  term!: string;

  @IsOptional() @IsString() @MaxLength(200)
  fullForm?: string;

  @IsNotEmpty() @IsString() @MaxLength(2000)
  definition!: string;

  @IsOptional()
  fields?: string[];

  @IsOptional()
  tags?: string[];

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;
}

class UpdateTermDto {
  @IsOptional() @IsString() @MaxLength(120)
  term?: string;

  @IsOptional() @IsString() @MaxLength(120)
  slug?: string;

  @IsOptional() @IsString() @MaxLength(200)
  fullForm?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  definition?: string;

  @IsOptional()
  fields?: string[];

  @IsOptional()
  tags?: string[];

  @IsOptional() @IsIn(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;

  @IsOptional() @IsIn(['beginner', 'intermediate', 'advanced'])
  level?: string;

  @IsOptional() @IsString()
  sourceLevel?: string;

  @IsOptional()
  contributors?: Array<{ name: string; role?: string; userId?: string }>;
}

class CreateGuideDto {
  @IsNotEmpty() @IsString() @MaxLength(120)
  slug!: string;

  @IsNotEmpty() @IsString() @MaxLength(200)
  title!: string;

  @IsNotEmpty() @IsString() @MaxLength(500)
  summary!: string;

  @IsOptional() @IsString()
  body?: string;

  @IsOptional() @IsIn(GUIDE_TYPES)
  type?: string;

  @IsOptional()
  fields?: string[];

  @IsOptional()
  tags?: string[];

  @IsOptional() @IsString() @MaxLength(100)
  authorName?: string;

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  readingTimeMinutes?: number;
}

class UpdateGuideDto {
  @IsOptional() @IsString() @MaxLength(200)
  title?: string;

  @IsOptional() @IsString() @MaxLength(500)
  summary?: string;

  @IsOptional() @IsString()
  body?: string;

  @IsOptional() @IsIn(GUIDE_TYPES)
  type?: string;

  @IsOptional()
  fields?: string[];

  @IsOptional()
  tags?: string[];

  @IsOptional() @IsString() @MaxLength(100)
  authorName?: string;

  @IsOptional() @IsIn(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  readingTimeMinutes?: number;

  @IsOptional() @IsIn(['beginner', 'intermediate', 'advanced'])
  level?: string;

  @IsOptional() @IsString()
  sourceLevel?: string;

  @IsOptional()
  prerequisites?: Array<{ termSlug: string; termTitle: string }>;

  @IsOptional()
  contributors?: Array<{ name: string; role?: string; userId?: string }>;
}

class CreateDocumentDto {
  @IsNotEmpty() @IsString() @MaxLength(200)
  title!: string;

  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @IsOptional() @IsIn(DOC_TYPES)
  type?: string;

  @IsOptional()
  fields?: string[];

  @IsOptional()
  tags?: string[];

  @IsOptional() @IsString() @MaxLength(200)
  authorName?: string;

  @IsOptional() @IsInt() @Type(() => Number)
  publishYear?: number;

  @IsOptional() @IsString()
  fileUrl?: string;

  @IsOptional() @IsString()
  externalUrl?: string;
}

class UpdateDocumentDto {
  @IsOptional() @IsString() @MaxLength(200)
  title?: string;

  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @IsOptional() @IsIn(DOC_TYPES)
  type?: string;

  @IsOptional()
  fields?: string[];

  @IsOptional()
  tags?: string[];

  @IsOptional() @IsString() @MaxLength(200)
  authorName?: string;

  @IsOptional() @IsInt() @Type(() => Number)
  publishYear?: number;

  @IsOptional() @IsString()
  fileUrl?: string;

  @IsOptional() @IsString()
  externalUrl?: string;

  @IsOptional() @IsIn(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;

  @IsOptional() @IsString()
  sourceLevel?: string;
}

class CreateRegulationDto {
  @IsNotEmpty() @IsString() @MaxLength(120)
  slug!: string;

  @IsNotEmpty() @IsString() @MaxLength(300)
  title!: string;

  @IsOptional() @IsString() @MaxLength(100)
  shortTitle?: string;

  @IsOptional() @IsIn(REG_TYPES)
  type?: string;

  @IsOptional()
  fields?: string[];

  @IsOptional() @IsString() @MaxLength(100)
  issuingBody?: string;

  @IsOptional() @IsString() @MaxLength(50)
  referenceNumber?: string;

  @IsOptional() @IsString()
  publishDate?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  summary?: string;

  @IsOptional() @IsString()
  fullText?: string;

  @IsOptional() @IsString()
  externalUrl?: string;
}

class SuggestTermDto {
  @IsNotEmpty() @IsString() @MaxLength(120)
  term!: string;

  @IsNotEmpty() @IsString() @MaxLength(2000)
  definition!: string;

  @IsOptional() @IsString() @MaxLength(200)
  fullForm?: string;

  @IsOptional() @IsString() @MaxLength(100)
  submitterName?: string;

  @IsOptional() @IsString() @MaxLength(200)
  submitterEmail?: string;
}

class UpdateRegulationDto {
  @IsOptional() @IsString() @MaxLength(300)
  title?: string;

  @IsOptional() @IsString() @MaxLength(100)
  shortTitle?: string;

  @IsOptional() @IsIn(REG_TYPES)
  type?: string;

  @IsOptional()
  fields?: string[];

  @IsOptional() @IsString() @MaxLength(100)
  issuingBody?: string;

  @IsOptional() @IsString() @MaxLength(50)
  referenceNumber?: string;

  @IsOptional() @IsString()
  publishDate?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  summary?: string;

  @IsOptional() @IsString()
  fullText?: string;

  @IsOptional() @IsString()
  aiSummary?: string;

  @IsOptional() @IsString()
  externalUrl?: string;

  @IsOptional() @IsIn(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;

  @IsOptional() @IsString()
  sourceLevel?: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller('library')
export class LibraryController {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly email: EmailService,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // COUNTS (public)
  // ═══════════════════════════════════════════════════════════════

  @Get('counts')
  @Public()
  async getCounts() {
    const [[terms], [guides], [documents], [regulations]] = await Promise.all([
      this.db.select({ total: count() }).from(libraryTerms).where(eq(libraryTerms.status, 'published')),
      this.db.select({ total: count() }).from(libraryGuides).where(eq(libraryGuides.status, 'published')),
      this.db.select({ total: count() }).from(libraryDocuments).where(eq(libraryDocuments.status, 'published')),
      this.db.select({ total: count() }).from(libraryRegulations).where(eq(libraryRegulations.status, 'published')),
    ]);
    return {
      terms: terms?.total ?? 0,
      guides: guides?.total ?? 0,
      documents: documents?.total ?? 0,
      regulations: regulations?.total ?? 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // GLOBAL SEARCH
  // ═══════════════════════════════════════════════════════════════

  @Get('search')
  @Public()
  async search(@Query('q') q?: string, @Query('limit') limitStr?: string) {
    const query = q?.trim();
    if (!query || query.length < 2) return { terms: [], guides: [], documents: [], regulations: [] };
    const limit = Math.min(parseInt(limitStr ?? '5', 10) || 5, 20);

    // FTS ile ILIKE'ı birleştir: stem eşleşmesi (fotogrametrik→fotogrametri)
    // + prefix/substring eşleşmesi (kısa/kısmi sorgular için)
    const termSearch = and(
      eq(libraryTerms.status, 'published'),
      or(
        sql`to_tsvector('turkish', coalesce(${libraryTerms.term},'') || ' ' || coalesce(${libraryTerms.fullForm},'') || ' ' || coalesce(${libraryTerms.definition},'')) @@ plainto_tsquery('turkish', ${query})`,
        ilike(libraryTerms.term, `%${query}%`),
        ilike(libraryTerms.definition, `%${query}%`),
      )!,
    );
    const guideSearch = and(
      eq(libraryGuides.status, 'published'),
      or(
        sql`to_tsvector('turkish', coalesce(${libraryGuides.title},'') || ' ' || coalesce(${libraryGuides.summary},'')) @@ plainto_tsquery('turkish', ${query})`,
        ilike(libraryGuides.title, `%${query}%`),
        ilike(libraryGuides.summary, `%${query}%`),
      )!,
    );
    const docSearch = and(
      eq(libraryDocuments.status, 'published'),
      or(
        sql`to_tsvector('turkish', coalesce(${libraryDocuments.title},'') || ' ' || coalesce(${libraryDocuments.description},'')) @@ plainto_tsquery('turkish', ${query})`,
        ilike(libraryDocuments.title, `%${query}%`),
        ilike(libraryDocuments.description, `%${query}%`),
      )!,
    );
    const regSearch = and(
      eq(libraryRegulations.status, 'published'),
      or(
        sql`to_tsvector('turkish', coalesce(${libraryRegulations.title},'') || ' ' || coalesce(${libraryRegulations.shortTitle},'') || ' ' || coalesce(${libraryRegulations.aiSummary},'') || ' ' || coalesce(${libraryRegulations.summary},'')) @@ plainto_tsquery('turkish', ${query})`,
        ilike(libraryRegulations.title, `%${query}%`),
        ilike(libraryRegulations.summary, `%${query}%`),
      )!,
    );

    const [terms, guides, documents, regulations] = await Promise.all([
      this.db.select({
        id: libraryTerms.id, term: libraryTerms.term, fullForm: libraryTerms.fullForm,
        excerpt: libraryTerms.definition, fields: libraryTerms.fields, isFeatured: libraryTerms.isFeatured,
        slug: libraryTerms.slug,
      }).from(libraryTerms).where(termSearch).limit(limit),

      this.db.select({
        id: libraryGuides.id, slug: libraryGuides.slug, title: libraryGuides.title,
        excerpt: libraryGuides.summary, type: libraryGuides.type, fields: libraryGuides.fields,
        readingTimeMinutes: libraryGuides.readingTimeMinutes,
      }).from(libraryGuides).where(guideSearch).limit(limit),

      this.db.select({
        id: libraryDocuments.id, title: libraryDocuments.title, excerpt: libraryDocuments.description,
        type: libraryDocuments.type, fields: libraryDocuments.fields,
      }).from(libraryDocuments).where(docSearch).limit(limit),

      this.db.select({
        id: libraryRegulations.id, slug: libraryRegulations.slug, title: libraryRegulations.title,
        shortTitle: libraryRegulations.shortTitle, excerpt: libraryRegulations.summary,
        type: libraryRegulations.type, fields: libraryRegulations.fields,
      }).from(libraryRegulations).where(regSearch).limit(limit),
    ]);

    return { terms, guides, documents, regulations };
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTOCOMPLETE — prefix match on title/term only
  // ═══════════════════════════════════════════════════════════════

  @Get('autocomplete')
  @Public()
  async autocomplete(@Query('q') q?: string) {
    const query = q?.trim();
    if (!query || query.length < 2) return { terms: [], guides: [], regulations: [], documents: [] };

    const [terms, guides, regulations, documents] = await Promise.all([
      this.db.select({ id: libraryTerms.id, slug: libraryTerms.slug, term: libraryTerms.term })
        .from(libraryTerms)
        .where(and(eq(libraryTerms.status, 'published'), ilike(libraryTerms.term, `${query}%`)))
        .limit(5),

      this.db.select({ id: libraryGuides.id, slug: libraryGuides.slug, title: libraryGuides.title })
        .from(libraryGuides)
        .where(and(eq(libraryGuides.status, 'published'), ilike(libraryGuides.title, `${query}%`)))
        .limit(3),

      this.db.select({ id: libraryRegulations.id, slug: libraryRegulations.slug, title: libraryRegulations.title, shortTitle: libraryRegulations.shortTitle })
        .from(libraryRegulations)
        .where(and(eq(libraryRegulations.status, 'published'), ilike(libraryRegulations.title, `${query}%`)))
        .limit(2),

      this.db.select({ id: libraryDocuments.id, title: libraryDocuments.title })
        .from(libraryDocuments)
        .where(and(eq(libraryDocuments.status, 'published'), ilike(libraryDocuments.title, `${query}%`)))
        .limit(2),
    ]);

    return { terms, guides, regulations, documents };
  }

  // ═══════════════════════════════════════════════════════════════
  // TERM SUGGESTION (community)
  // ═══════════════════════════════════════════════════════════════

  @Post('terms/suggest')
  @Public()
  async suggestTerm(@Body() dto: SuggestTermDto) {
    const tags: string[] = [];
    if (dto.submitterEmail) tags.push(`__submitted_by:${dto.submitterEmail}`);
    if (dto.submitterName) tags.push(`__submitted_name:${dto.submitterName}`);
    const [created] = await this.db.insert(libraryTerms).values({
      slug: toSlug(dto.term),
      term: dto.term,
      fullForm: dto.fullForm ?? null,
      definition: dto.definition,
      fields: [],
      tags,
      status: 'draft',
    }).returning({ id: libraryTerms.id });
    return { success: true, id: created?.id };
  }

  // ═══════════════════════════════════════════════════════════════
  // ADMIN LIST ENDPOINTS
  // ═══════════════════════════════════════════════════════════════

  @Get('admin/terms')
  @RequirePermission('feed.post.delete_any')
  async adminListTerms(@Query('status') status?: string, @Query('q') q?: string) {
    const conditions: SQL[] = [];
    if (status) conditions.push(eq(libraryTerms.status, status as 'draft' | 'published' | 'archived'));
    if (q?.trim()) {
      conditions.push(or(ilike(libraryTerms.term, `%${q.trim()}%`), ilike(libraryTerms.definition, `%${q.trim()}%`))!);
    }
    return this.db.select().from(libraryTerms)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(libraryTerms.term));
  }

  @Get('admin/guides')
  @RequirePermission('feed.post.delete_any')
  async adminListGuides(@Query('status') status?: string) {
    const conditions: SQL[] = [];
    if (status) conditions.push(eq(libraryGuides.status, status as 'draft' | 'published' | 'archived'));
    return this.db.select().from(libraryGuides)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(libraryGuides.createdAt));
  }

  @Get('admin/documents')
  @RequirePermission('feed.post.delete_any')
  async adminListDocuments(@Query('status') status?: string) {
    const conditions: SQL[] = [];
    if (status) conditions.push(eq(libraryDocuments.status, status as 'draft' | 'published' | 'archived'));
    return this.db.select().from(libraryDocuments)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(libraryDocuments.createdAt));
  }

  @Get('admin/regulations')
  @RequirePermission('feed.post.delete_any')
  async adminListRegulations(@Query('status') status?: string) {
    const conditions: SQL[] = [];
    if (status) conditions.push(eq(libraryRegulations.status, status as 'draft' | 'published' | 'archived'));
    return this.db.select().from(libraryRegulations)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(libraryRegulations.createdAt));
  }

  // ═══════════════════════════════════════════════════════════════
  // TERMS (Sözlük)
  // ═══════════════════════════════════════════════════════════════

  @Get('terms/slug/:slug')
  @Public()
  async getTermBySlug(@Param('slug') slug: string) {
    const term = await this.db.query.libraryTerms.findFirst({
      where: and(eq(libraryTerms.slug, slug), eq(libraryTerms.status, 'published')),
    });
    if (!term) throw new NotFoundException();
    await this.db.update(libraryTerms).set({ viewCount: term.viewCount + 1 }).where(eq(libraryTerms.id, term.id));
    return term;
  }

  @Get('terms')
  @Public()
  async listTerms(
    @Query('q') q?: string,
    @Query('letter') letter?: string,
    @Query('field') field?: string,
    @Query('featured') featured?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const conditions: SQL[] = [eq(libraryTerms.status, 'published')];

    if (q?.trim()) {
      conditions.push(or(
        ilike(libraryTerms.term, `%${q.trim()}%`),
        ilike(libraryTerms.definition, `%${q.trim()}%`),
      )!);
    }
    if (letter?.trim()) {
      conditions.push(ilike(libraryTerms.term, `${letter.trim().charAt(0)}%`));
    }
    if (field?.trim() && (FIELDS as readonly string[]).includes(field.trim())) {
      conditions.push(sql`${field.trim()} = ANY(${libraryTerms.fields}::text[])`);
    }
    if (featured === 'true') {
      conditions.push(eq(libraryTerms.isFeatured, true));
    }

    const limit = Math.min(Math.max(parseInt(limitStr ?? '50', 10) || 50, 1), 500);
    const offset = Math.max(parseInt(offsetStr ?? '0', 10) || 0, 0);

    return this.db
      .select()
      .from(libraryTerms)
      .where(and(...conditions))
      .orderBy(asc(libraryTerms.term))
      .limit(limit)
      .offset(offset);
  }

  @Get('terms/:id')
  @Public()
  async getTerm(@Param('id', ParseUUIDPipe) id: string) {
    const term = await this.db.query.libraryTerms.findFirst({
      where: and(eq(libraryTerms.id, id), eq(libraryTerms.status, 'published')),
    });
    if (!term) throw new NotFoundException();
    await this.db.update(libraryTerms).set({ viewCount: term.viewCount + 1 }).where(eq(libraryTerms.id, id));
    return term;
  }

  @Post('admin/terms')
  @RequirePermission('feed.post.delete_any')
  async createTerm(@Body() dto: CreateTermDto) {
    const [created] = await this.db.insert(libraryTerms).values({
      slug: toSlug(dto.term),
      term: dto.term,
      fullForm: dto.fullForm ?? null,
      definition: dto.definition,
      fields: (dto.fields as LibraryField[]) ?? [],
      tags: dto.tags ?? [],
      isFeatured: dto.isFeatured ?? false,
    }).returning();
    return created;
  }

  @Patch('admin/terms/:id')
  @RequirePermission('feed.post.delete_any')
  async updateTerm(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTermDto) {
    const [updated] = await this.db.update(libraryTerms).set({
      ...(dto.term !== undefined ? { term: dto.term } : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      ...(dto.fullForm !== undefined ? { fullForm: dto.fullForm } : {}),
      ...(dto.definition !== undefined ? { definition: dto.definition } : {}),
      ...(dto.fields !== undefined ? { fields: dto.fields as LibraryField[] } : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
      ...(dto.level !== undefined ? { level: dto.level } : {}),
      ...(dto.sourceLevel !== undefined ? { sourceLevel: dto.sourceLevel } : {}),
      ...(dto.contributors !== undefined ? { contributors: dto.contributors } : {}),
      updatedAt: new Date(),
    }).where(eq(libraryTerms.id, id)).returning();
    if (!updated) throw new NotFoundException();
    return updated;
  }

  @Delete('admin/terms/:id')
  @RequirePermission('feed.post.delete_any')
  async deleteTerm(@Param('id', ParseUUIDPipe) id: string) {
    await this.db.delete(libraryTerms).where(eq(libraryTerms.id, id));
    return { deleted: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // GUIDES (Rehberler)
  // ═══════════════════════════════════════════════════════════════

  @Get('guides')
  @Public()
  async listGuides(
    @Query('type') type?: string,
    @Query('field') field?: string,
    @Query('featured') featured?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const conditions: SQL[] = [eq(libraryGuides.status, 'published')];

    if (type && (GUIDE_TYPES as readonly string[]).includes(type)) {
      conditions.push(eq(libraryGuides.type, type as (typeof GUIDE_TYPES)[number]));
    }
    if (field?.trim() && (FIELDS as readonly string[]).includes(field.trim())) {
      conditions.push(sql`${field.trim()} = ANY(${libraryGuides.fields}::text[])`);
    }
    if (featured === 'true') {
      conditions.push(eq(libraryGuides.isFeatured, true));
    }

    const limit = Math.min(Math.max(parseInt(limitStr ?? '50', 10) || 50, 1), 500);
    const offset = Math.max(parseInt(offsetStr ?? '0', 10) || 0, 0);

    return this.db
      .select({
        id: libraryGuides.id,
        slug: libraryGuides.slug,
        title: libraryGuides.title,
        summary: libraryGuides.summary,
        type: libraryGuides.type,
        fields: libraryGuides.fields,
        tags: libraryGuides.tags,
        authorName: libraryGuides.authorName,
        isFeatured: libraryGuides.isFeatured,
        readingTimeMinutes: libraryGuides.readingTimeMinutes,
        viewCount: libraryGuides.viewCount,
        publishedAt: libraryGuides.publishedAt,
        createdAt: libraryGuides.createdAt,
        seriesSlug: libraryGuides.seriesSlug,
        seriesOrder: libraryGuides.seriesOrder,
        level: libraryGuides.level,
        sourceLevel: libraryGuides.sourceLevel,
      })
      .from(libraryGuides)
      .where(and(...conditions))
      .orderBy(desc(libraryGuides.isFeatured), desc(libraryGuides.publishedAt))
      .limit(limit)
      .offset(offset);
  }

  @Post('guides/suggest')
  @Public()
  async suggestGuide(@Body() dto: {
    title: string; summary?: string; type?: string; fields?: string[];
    submitterName?: string; submitterEmail?: string;
  }) {
    if (!dto.title?.trim()) throw new BadRequestException('Başlık gerekli');
    const tags: string[] = [];
    if (dto.submitterEmail) tags.push(`__submitted_by:${dto.submitterEmail}`);
    if (dto.submitterName) tags.push(`__submitted_name:${dto.submitterName}`);
    const [created] = await this.db.insert(libraryGuides).values({
      slug: `oneri-${toSlug(dto.title)}-${Date.now()}`,
      title: dto.title.trim(),
      summary: dto.summary?.trim() ?? 'Kullanıcı önerisi — inceleme bekliyor',
      type: (dto.type as (typeof GUIDE_TYPES)[number]) ?? 'guide',
      fields: (dto.fields as LibraryField[]) ?? [],
      tags,
      status: 'draft',
    }).returning({ id: libraryGuides.id });
    return { id: created!.id, message: 'Rehber öneriniz alındı, inceleme sürecinde.' };
  }

  @Get('guides/:slug')
  @Public()
  async getGuide(@Param('slug') slug: string) {
    const guide = await this.db.query.libraryGuides.findFirst({
      where: and(eq(libraryGuides.slug, slug), eq(libraryGuides.status, 'published')),
    });
    if (!guide) throw new NotFoundException();
    await this.db.update(libraryGuides).set({ viewCount: guide.viewCount + 1 }).where(eq(libraryGuides.id, guide.id));

    // Cross-link: related regulations
    let relatedRegulations: { slug: string; title: string; shortTitle: string | null; type: string }[] = [];
    const regSlugs = (guide as unknown as { relatedRegulationSlugs?: string[] }).relatedRegulationSlugs ?? [];
    if (regSlugs.length > 0) {
      relatedRegulations = await this.db.select({
        slug: libraryRegulations.slug, title: libraryRegulations.title,
        shortTitle: libraryRegulations.shortTitle, type: libraryRegulations.type,
      }).from(libraryRegulations)
        .where(and(eq(libraryRegulations.status, 'published'), sql`${libraryRegulations.slug} = ANY(${sql.raw(`ARRAY[${regSlugs.map(s => `'${s}'`).join(',')}]::text[]`)})`));
    }

    return { ...guide, relatedRegulations };
  }

  @Post('admin/guides')
  @RequirePermission('feed.post.delete_any')
  async createGuide(@Body() dto: CreateGuideDto) {
    const [created] = await this.db.insert(libraryGuides).values({
      slug: dto.slug,
      title: dto.title,
      summary: dto.summary,
      body: dto.body ?? null,
      type: (dto.type as (typeof GUIDE_TYPES)[number]) ?? 'guide',
      fields: (dto.fields as LibraryField[]) ?? [],
      tags: dto.tags ?? [],
      authorName: dto.authorName ?? null,
      readingTimeMinutes: dto.readingTimeMinutes ?? null,
    }).returning();
    return created;
  }

  @Patch('admin/guides/:id')
  @RequirePermission('feed.post.delete_any')
  async updateGuide(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGuideDto) {
    const [updated] = await this.db.update(libraryGuides).set({
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
      ...(dto.body !== undefined ? { body: dto.body } : {}),
      ...(dto.type !== undefined ? { type: dto.type as (typeof GUIDE_TYPES)[number] } : {}),
      ...(dto.fields !== undefined ? { fields: dto.fields as LibraryField[] } : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      ...(dto.authorName !== undefined ? { authorName: dto.authorName } : {}),
      ...(dto.status !== undefined ? {
        status: dto.status,
        publishedAt: dto.status === 'published' ? new Date() : undefined,
      } : {}),
      ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
      ...(dto.readingTimeMinutes !== undefined ? { readingTimeMinutes: dto.readingTimeMinutes } : {}),
      ...(dto.level !== undefined ? { level: dto.level } : {}),
      ...(dto.sourceLevel !== undefined ? { sourceLevel: dto.sourceLevel } : {}),
      ...(dto.prerequisites !== undefined ? { prerequisites: dto.prerequisites } : {}),
      ...(dto.contributors !== undefined ? { contributors: dto.contributors } : {}),
      updatedAt: new Date(),
    }).where(eq(libraryGuides.id, id)).returning();
    if (!updated) throw new NotFoundException();
    return updated;
  }

  @Delete('admin/guides/:id')
  @RequirePermission('feed.post.delete_any')
  async deleteGuide(@Param('id', ParseUUIDPipe) id: string) {
    await this.db.delete(libraryGuides).where(eq(libraryGuides.id, id));
    return { deleted: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // DOCUMENTS (Dokümanlar)
  // ═══════════════════════════════════════════════════════════════

  @Get('documents')
  @Public()
  async listDocuments(
    @Query('type') type?: string,
    @Query('field') field?: string,
    @Query('featured') featured?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const conditions: SQL[] = [eq(libraryDocuments.status, 'published')];

    if (type && (DOC_TYPES as readonly string[]).includes(type)) {
      conditions.push(eq(libraryDocuments.type, type as (typeof DOC_TYPES)[number]));
    }
    if (field?.trim() && (FIELDS as readonly string[]).includes(field.trim())) {
      conditions.push(sql`${field.trim()} = ANY(${libraryDocuments.fields}::text[])`);
    }
    if (featured === 'true') {
      conditions.push(eq(libraryDocuments.isFeatured, true));
    }

    const limit = Math.min(Math.max(parseInt(limitStr ?? '50', 10) || 50, 1), 500);
    const offset = Math.max(parseInt(offsetStr ?? '0', 10) || 0, 0);

    return this.db
      .select()
      .from(libraryDocuments)
      .where(and(...conditions))
      .orderBy(desc(libraryDocuments.isFeatured), desc(libraryDocuments.createdAt))
      .limit(limit)
      .offset(offset);
  }

  @Get('documents/:id')
  @Public()
  async getDocument(@Param('id', ParseUUIDPipe) id: string) {
    const doc = await this.db.query.libraryDocuments.findFirst({
      where: and(eq(libraryDocuments.id, id), eq(libraryDocuments.status, 'published')),
    });
    if (!doc) throw new NotFoundException();
    return doc;
  }

  @Post('admin/documents')
  @RequirePermission('feed.post.delete_any')
  async createDocument(@Body() dto: CreateDocumentDto) {
    const [created] = await this.db.insert(libraryDocuments).values({
      title: dto.title,
      description: dto.description ?? null,
      type: (dto.type as (typeof DOC_TYPES)[number]) ?? 'pdf',
      fields: (dto.fields as LibraryField[]) ?? [],
      tags: dto.tags ?? [],
      authorName: dto.authorName ?? null,
      publishYear: dto.publishYear ?? null,
      fileUrl: dto.fileUrl ?? null,
      externalUrl: dto.externalUrl ?? null,
    }).returning();
    return created;
  }

  @Patch('admin/documents/:id')
  @RequirePermission('feed.post.delete_any')
  async updateDocument(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDocumentDto) {
    const [updated] = await this.db.update(libraryDocuments).set({
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.type !== undefined ? { type: dto.type as (typeof DOC_TYPES)[number] } : {}),
      ...(dto.fields !== undefined ? { fields: dto.fields as LibraryField[] } : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      ...(dto.authorName !== undefined ? { authorName: dto.authorName } : {}),
      ...(dto.publishYear !== undefined ? { publishYear: dto.publishYear } : {}),
      ...(dto.fileUrl !== undefined ? { fileUrl: dto.fileUrl } : {}),
      ...(dto.externalUrl !== undefined ? { externalUrl: dto.externalUrl } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
      updatedAt: new Date(),
    }).where(eq(libraryDocuments.id, id)).returning();
    if (!updated) throw new NotFoundException();
    return updated;
  }

  @Delete('admin/documents/:id')
  @RequirePermission('feed.post.delete_any')
  async deleteDocument(@Param('id', ParseUUIDPipe) id: string) {
    await this.db.delete(libraryDocuments).where(eq(libraryDocuments.id, id));
    return { deleted: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // REGULATIONS (Mevzuat)
  // ═══════════════════════════════════════════════════════════════

  @Get('regulations')
  @Public()
  async listRegulations(
    @Query('type') type?: string,
    @Query('field') field?: string,
    @Query('featured') featured?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const conditions: SQL[] = [eq(libraryRegulations.status, 'published')];

    if (type && (REG_TYPES as readonly string[]).includes(type)) {
      conditions.push(eq(libraryRegulations.type, type as (typeof REG_TYPES)[number]));
    }
    if (field?.trim() && (FIELDS as readonly string[]).includes(field.trim())) {
      conditions.push(sql`${field.trim()} = ANY(${libraryRegulations.fields}::text[])`);
    }
    if (featured === 'true') {
      conditions.push(eq(libraryRegulations.isFeatured, true));
    }

    const limit = Math.min(Math.max(parseInt(limitStr ?? '50', 10) || 50, 1), 500);
    const offset = Math.max(parseInt(offsetStr ?? '0', 10) || 0, 0);

    return this.db
      .select({
        id: libraryRegulations.id,
        slug: libraryRegulations.slug,
        title: libraryRegulations.title,
        shortTitle: libraryRegulations.shortTitle,
        type: libraryRegulations.type,
        fields: libraryRegulations.fields,
        issuingBody: libraryRegulations.issuingBody,
        referenceNumber: libraryRegulations.referenceNumber,
        publishDate: libraryRegulations.publishDate,
        summary: libraryRegulations.summary,
        aiSummary: libraryRegulations.aiSummary,
        externalUrl: libraryRegulations.externalUrl,
        isFeatured: libraryRegulations.isFeatured,
        validityStatus: libraryRegulations.validityStatus,
        sourceLevel: libraryRegulations.sourceLevel,
        viewCount: libraryRegulations.viewCount,
        createdAt: libraryRegulations.createdAt,
      })
      .from(libraryRegulations)
      .where(and(...conditions))
      .orderBy(desc(libraryRegulations.isFeatured), desc(libraryRegulations.createdAt))
      .limit(limit)
      .offset(offset);
  }

  @Get('regulations/:slug')
  @Public()
  async getRegulation(@Param('slug') slug: string) {
    const reg = await this.db.query.libraryRegulations.findFirst({
      where: and(eq(libraryRegulations.slug, slug), eq(libraryRegulations.status, 'published')),
    });
    if (!reg) throw new NotFoundException();
    await this.db.update(libraryRegulations).set({ viewCount: reg.viewCount + 1 }).where(eq(libraryRegulations.id, reg.id));

    // Cross-link: related terms
    let relatedTerms: { slug: string | null; term: string; definition: string }[] = [];
    const slugs = (reg as unknown as { relatedTermSlugs?: string[] }).relatedTermSlugs ?? [];
    if (slugs.length > 0) {
      relatedTerms = await this.db.select({
        slug: libraryTerms.slug, term: libraryTerms.term, definition: libraryTerms.definition,
      }).from(libraryTerms)
        .where(and(eq(libraryTerms.status, 'published'), sql`${libraryTerms.slug} = ANY(${sql.raw(`ARRAY[${slugs.map(s => `'${s}'`).join(',')}]::text[]`)})` ));
    }

    return { ...reg, relatedTerms };
  }

  // Mevzuat takip
  @Post('regulations/:slug/follow')
  async followRegulation(@Param('slug') slug: string, @CurrentUser() user: RequestUser) {
    await this.db.execute(sql`
      INSERT INTO library_regulation_follows (user_id, regulation_slug)
      VALUES (${user.id}, ${slug})
      ON CONFLICT (user_id, regulation_slug) DO NOTHING
    `);
    return { following: true };
  }

  @Delete('regulations/:slug/follow')
  async unfollowRegulation(@Param('slug') slug: string, @CurrentUser() user: RequestUser) {
    await this.db.execute(sql`
      DELETE FROM library_regulation_follows WHERE user_id = ${user.id} AND regulation_slug = ${slug}
    `);
    return { following: false };
  }

  @Get('me/follows')
  async getMyFollows(@CurrentUser() user: RequestUser) {
    const rows = await this.db.execute(sql`
      SELECT regulation_slug FROM library_regulation_follows WHERE user_id = ${user.id}
    `) as unknown as { regulation_slug: string }[];
    return { follows: rows.map(r => r.regulation_slug) };
  }

  @Post('admin/regulations')
  @RequirePermission('feed.post.delete_any')
  async createRegulation(@Body() dto: CreateRegulationDto) {
    const [created] = await this.db.insert(libraryRegulations).values({
      slug: dto.slug,
      title: dto.title,
      shortTitle: dto.shortTitle ?? null,
      type: (dto.type as (typeof REG_TYPES)[number]) ?? 'yonetmelik',
      fields: (dto.fields as LibraryField[]) ?? [],
      issuingBody: dto.issuingBody ?? null,
      referenceNumber: dto.referenceNumber ?? null,
      publishDate: dto.publishDate ?? null,
      summary: dto.summary ?? null,
      fullText: dto.fullText ?? null,
      externalUrl: dto.externalUrl ?? null,
    }).returning();
    return created;
  }

  @Patch('admin/regulations/:id')
  @RequirePermission('feed.post.delete_any')
  async updateRegulation(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRegulationDto) {
    const [updated] = await this.db.update(libraryRegulations).set({
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.shortTitle !== undefined ? { shortTitle: dto.shortTitle } : {}),
      ...(dto.type !== undefined ? { type: dto.type as (typeof REG_TYPES)[number] } : {}),
      ...(dto.fields !== undefined ? { fields: dto.fields as LibraryField[] } : {}),
      ...(dto.issuingBody !== undefined ? { issuingBody: dto.issuingBody } : {}),
      ...(dto.referenceNumber !== undefined ? { referenceNumber: dto.referenceNumber } : {}),
      ...(dto.publishDate !== undefined ? { publishDate: dto.publishDate } : {}),
      ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
      ...(dto.fullText !== undefined ? { fullText: dto.fullText } : {}),
      ...(dto.aiSummary !== undefined ? { aiSummary: dto.aiSummary } : {}),
      ...(dto.externalUrl !== undefined ? { externalUrl: dto.externalUrl } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
      ...(dto.sourceLevel !== undefined ? { sourceLevel: dto.sourceLevel } : {}),
      updatedAt: new Date(),
    }).where(eq(libraryRegulations.id, id)).returning();
    if (!updated) throw new NotFoundException();

    // Changelog + e-posta bildirimi
    const changeNote = (dto as Record<string, unknown>).changeNote as string | undefined;
    if (changeNote) {
      await this.db.execute(sql`
        UPDATE library_regulations
        SET changelog_entries = changelog_entries || ${JSON.stringify([{
          date: new Date().toISOString().slice(0, 10),
          note: changeNote,
        }])}::jsonb
        WHERE id = ${id}
      `);
      // Takipçilere e-posta gönder
      const followers = await this.db.execute(sql`
        SELECT u.email, u.display_name, f.regulation_slug
        FROM library_regulation_follows f
        JOIN users u ON u.id = f.user_id
        WHERE f.regulation_slug = ${updated.slug}
      `) as unknown as { email: string; display_name: string; regulation_slug: string }[];
      for (const f of followers) {
        await this.email.sendLibraryRegulationUpdate(
          f.email,
          f.display_name ?? 'Değerli Üye',
          updated.slug,
          updated.title,
          updated.shortTitle ?? updated.title,
          changeNote,
        ).catch(() => { /* best-effort */ });
      }
    }

    return updated;
  }

  @Delete('admin/regulations/:id')
  @RequirePermission('feed.post.delete_any')
  async deleteRegulation(@Param('id', ParseUUIDPipe) id: string) {
    await this.db.delete(libraryRegulations).where(eq(libraryRegulations.id, id));
    return { deleted: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // ADMIN — SINAV KATEGORİLERİ + SORULAR
  // ═══════════════════════════════════════════════════════════════

  @Get('admin/exam-categories')
  @RequirePermission('feed.post.delete_any')
  async getAdminExamCategories() {
    return this.db
      .select({ id: examCategories.id, name: examCategories.name, slug: examCategories.slug, examType: examCategories.examType })
      .from(examCategories)
      .where(eq(examCategories.isActive, true))
      .orderBy(examCategories.name);
  }

  @Get('admin/exam-questions')
  @RequirePermission('feed.post.delete_any')
  async getAdminExamQuestions(@Query('categoryId') categoryId?: string) {
    const conditions = categoryId ? eq(examQuestions.categoryId, categoryId) : undefined;
    return this.db
      .select({
        id: examQuestions.id,
        categoryId: examQuestions.categoryId,
        questionText: examQuestions.questionText,
        optionA: examQuestions.optionA, optionB: examQuestions.optionB,
        optionC: examQuestions.optionC, optionD: examQuestions.optionD, optionE: examQuestions.optionE,
        correctOption: examQuestions.correctOption,
        explanation: examQuestions.explanation,
        difficulty: examQuestions.difficulty,
        source: examQuestions.source,
        relatedTermSlugs: examQuestions.relatedTermSlugs,
        isActive: examQuestions.isActive,
        createdAt: examQuestions.createdAt,
        categoryName: examCategories.name,
        examType: examCategories.examType,
      })
      .from(examQuestions)
      .innerJoin(examCategories, eq(examQuestions.categoryId, examCategories.id))
      .where(conditions)
      .orderBy(desc(examQuestions.createdAt))
      .limit(200);
  }

  @Post('admin/exam-questions')
  @RequirePermission('feed.post.delete_any')
  async createAdminExamQuestion(
    @Body() body: {
      categoryId: string; questionText: string;
      optionA: string; optionB: string; optionC: string; optionD: string; optionE?: string;
      correctOption: string; explanation?: string; difficulty?: string; source?: string;
      relatedTermSlugs?: string[];
    },
  ) {
    if (!body.categoryId || !body.questionText || !body.optionA || !body.optionB || !body.optionC || !body.optionD || !body.correctOption) {
      throw new BadRequestException('Zorunlu alanlar eksik');
    }
    const rows = await this.db
      .insert(examQuestions)
      .values({
        categoryId: body.categoryId,
        questionText: body.questionText,
        optionA: body.optionA, optionB: body.optionB, optionC: body.optionC, optionD: body.optionD,
        ...(body.optionE ? { optionE: body.optionE } : {}),
        correctOption: body.correctOption,
        ...(body.explanation ? { explanation: body.explanation } : {}),
        difficulty: body.difficulty ?? 'medium',
        ...(body.source ? { source: body.source } : {}),
        relatedTermSlugs: body.relatedTermSlugs ?? [],
      })
      .returning({ id: examQuestions.id });
    return rows[0];
  }

  @Delete('admin/exam-questions/:id')
  @RequirePermission('feed.post.delete_any')
  async deleteAdminExamQuestion(@Param('id', ParseUUIDPipe) id: string) {
    await this.db.delete(examQuestions).where(eq(examQuestions.id, id));
    return { deleted: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // USER PREFS (kimlik doğrulamalı kullanıcıya özel — bookmark + alan tercihi)
  // ═══════════════════════════════════════════════════════════════

  @Get('me/prefs')
  async getMyPrefs(@CurrentUser() user: RequestUser) {
    const rows = await this.db.execute(
      sql`SELECT field_pref, bookmarks FROM library_user_prefs WHERE user_id = ${user.id}`,
    );
    const row = (rows as unknown as { field_pref: string | null; bookmarks: unknown[] }[])[0];
    return {
      fieldPref: row?.field_pref ?? null,
      bookmarks: row?.bookmarks ?? [],
    };
  }

  @Put('me/prefs')
  async updateMyPrefs(
    @CurrentUser() user: RequestUser,
    @Body() body: { fieldPref?: string | null; bookmarks?: unknown[] },
  ) {
    const fieldPref = body.fieldPref !== undefined ? body.fieldPref : undefined;
    const bookmarks = body.bookmarks !== undefined ? JSON.stringify(body.bookmarks) : undefined;

    await this.db.execute(sql`
      INSERT INTO library_user_prefs (user_id, field_pref, bookmarks, updated_at)
      VALUES (
        ${user.id},
        ${fieldPref !== undefined ? fieldPref : null},
        ${bookmarks !== undefined ? bookmarks : '[]'},
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        field_pref  = COALESCE(EXCLUDED.field_pref,  library_user_prefs.field_pref),
        bookmarks   = CASE WHEN ${bookmarks !== undefined ? sql`TRUE` : sql`FALSE`}
                          THEN EXCLUDED.bookmarks
                          ELSE library_user_prefs.bookmarks END,
        updated_at  = NOW()
    `);
    return { ok: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // YORUMLAR
  // ═══════════════════════════════════════════════════════════════

  @Get('comments')
  @Public()
  async getComments(
    @Query('contentType') contentType: string,
    @Query('contentId') contentId: string,
  ) {
    if (!contentType || !contentId) throw new BadRequestException('contentType ve contentId gerekli');
    const rows = await this.db.execute(sql`
      SELECT c.id, c.body, c.is_pinned, c.parent_id, c.created_at,
             u.display_name, u.avatar_url
      FROM library_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.content_type = ${contentType} AND c.content_id = ${contentId}::uuid
      ORDER BY c.is_pinned DESC, c.created_at ASC
    `);
    return rows;
  }

  @Post('comments')
  async addComment(
    @CurrentUser() user: RequestUser,
    @Body() body: { contentType: string; contentId: string; text: string; parentId?: string },
  ) {
    if (!body.contentType || !body.contentId || !body.text?.trim()) {
      throw new BadRequestException('Eksik alan');
    }
    if (body.text.trim().length > 2000) throw new BadRequestException('Yorum çok uzun');
    const [row] = await this.db.execute(sql`
      INSERT INTO library_comments (user_id, content_type, content_id, body, parent_id)
      VALUES (
        ${user.id},
        ${body.contentType},
        ${body.contentId}::uuid,
        ${body.text.trim()},
        ${body.parentId ? sql`${body.parentId}::uuid` : sql`NULL`}
      )
      RETURNING id, body, is_pinned, parent_id, created_at
    `) as unknown as { id: string; body: string; is_pinned: boolean; parent_id: string | null; created_at: string }[];
    return row;
  }

  @Delete('comments/:id')
  async deleteComment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    const rows = await this.db.execute(sql`
      SELECT user_id FROM library_comments WHERE id = ${id}::uuid
    `) as unknown as { user_id: string }[];
    if (!rows[0]) throw new NotFoundException();
    if (rows[0].user_id !== user.id) throw new BadRequestException('Yetki yok');
    await this.db.execute(sql`DELETE FROM library_comments WHERE id = ${id}::uuid`);
    return { deleted: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // OKUMA LİSTESİ
  // ═══════════════════════════════════════════════════════════════

  @Get('me/reading-list')
  async getReadingList(@CurrentUser() user: RequestUser) {
    const rows = await this.db.execute(sql`
      SELECT id, content_type, content_id, created_at
      FROM library_reading_list
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `);
    return rows;
  }

  @Post('me/reading-list')
  async addToReadingList(
    @CurrentUser() user: RequestUser,
    @Body() body: { contentType: string; contentId: string },
  ) {
    if (!body.contentType || !body.contentId) throw new BadRequestException('Eksik alan');
    await this.db.execute(sql`
      INSERT INTO library_reading_list (user_id, content_type, content_id)
      VALUES (${user.id}, ${body.contentType}, ${body.contentId}::uuid)
      ON CONFLICT (user_id, content_type, content_id) DO NOTHING
    `);
    return { saved: true };
  }

  @Delete('me/reading-list/:contentType/:contentId')
  async removeFromReadingList(
    @CurrentUser() user: RequestUser,
    @Param('contentType') contentType: string,
    @Param('contentId') contentId: string,
  ) {
    await this.db.execute(sql`
      DELETE FROM library_reading_list
      WHERE user_id = ${user.id} AND content_type = ${contentType} AND content_id = ${contentId}::uuid
    `);
    return { removed: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // TERS CROSS-LİNK — terim hangi mevzuatlarda tanımlanmış?
  // ═══════════════════════════════════════════════════════════════

  @Get('terms/slug/:slug/regulations')
  @Public()
  async getTermRegulations(@Param('slug') slug: string) {
    const rows = await this.db.execute(sql`
      SELECT id, slug, title, short_title, type, issuing_body, publish_date
      FROM library_regulations
      WHERE status = 'published'
        AND related_term_slugs @> ARRAY[${slug}]::text[]
      ORDER BY title
    `) as unknown as { id: string; slug: string; title: string; short_title: string | null; type: string; issuing_body: string | null; publish_date: string | null }[];
    return rows;
  }

  // ═══════════════════════════════════════════════════════════════
  // ÖNE ÇIKAN / EDİTÖRÜN SEÇİMİ
  // ═══════════════════════════════════════════════════════════════

  @Get('featured')
  @Public()
  async getFeatured() {
    const [terms, guides, regulations] = await Promise.all([
      this.db.select({
        id: libraryTerms.id, slug: libraryTerms.slug, term: libraryTerms.term,
        definition: libraryTerms.definition, fields: libraryTerms.fields,
      }).from(libraryTerms)
        .where(and(eq(libraryTerms.status, 'published'), eq(libraryTerms.isFeatured, true)))
        .orderBy(desc(libraryTerms.viewCount))
        .limit(4),
      this.db.select({
        id: libraryGuides.id, slug: libraryGuides.slug, title: libraryGuides.title,
        summary: libraryGuides.summary, type: libraryGuides.type,
        fields: libraryGuides.fields, readingTimeMinutes: libraryGuides.readingTimeMinutes,
      }).from(libraryGuides)
        .where(and(eq(libraryGuides.status, 'published'), eq(libraryGuides.isFeatured, true)))
        .orderBy(desc(libraryGuides.viewCount))
        .limit(3),
      this.db.select({
        id: libraryRegulations.id, slug: libraryRegulations.slug,
        title: libraryRegulations.title, shortTitle: libraryRegulations.shortTitle,
        type: libraryRegulations.type,
      }).from(libraryRegulations)
        .where(and(eq(libraryRegulations.status, 'published'), eq(libraryRegulations.isFeatured, true)))
        .limit(3),
    ]);
    return { terms, guides, regulations };
  }

  // ═══════════════════════════════════════════════════════════════
  // İLERLEME TAKİBİ
  // ═══════════════════════════════════════════════════════════════

  @Get('me/progress')
  async getMyProgress(@CurrentUser() user: RequestUser) {
    const rows = await this.db.execute(sql`
      SELECT content_type, content_id, marked_at FROM library_progress WHERE user_id = ${user.id}
    `);
    return rows;
  }

  @Post('me/progress')
  async markProgress(
    @CurrentUser() user: RequestUser,
    @Body() body: { contentType: string; contentId: string },
  ) {
    if (!body.contentType || !body.contentId) throw new BadRequestException('Eksik alan');
    await this.db.execute(sql`
      INSERT INTO library_progress (user_id, content_type, content_id)
      VALUES (${user.id}, ${body.contentType}, ${body.contentId}::uuid)
      ON CONFLICT (user_id, content_type, content_id) DO NOTHING
    `);
    return { marked: true };
  }

  @Delete('me/progress/:contentType/:contentId')
  async unmarkProgress(
    @CurrentUser() user: RequestUser,
    @Param('contentType') contentType: string,
    @Param('contentId') contentId: string,
  ) {
    await this.db.execute(sql`
      DELETE FROM library_progress WHERE user_id = ${user.id} AND content_type = ${contentType} AND content_id = ${contentId}::uuid
    `);
    return { unmarked: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // TOPLULUK KATKI — Düzenleme / Yeni İçerik Önerisi
  // ═══════════════════════════════════════════════════════════════

  @Get('me/suggestions')
  async getMySubmissions(@CurrentUser() user: RequestUser) {
    const rows = await this.db.execute(sql`
      SELECT id, content_type, content_id, body, status, admin_note, created_at
      FROM library_suggestions
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `);
    return rows;
  }

  @Post('suggestions')
  async submitSuggestion(
    @CurrentUser() user: RequestUser,
    @Body() body: { contentType: string; contentId?: string; body: string },
  ) {
    if (!body.contentType || !body.body?.trim()) throw new BadRequestException('Eksik alan');
    if (body.body.trim().length < 10) throw new BadRequestException('Öneri en az 10 karakter olmalı');
    await this.db.execute(sql`
      INSERT INTO library_suggestions (user_id, content_type, content_id, body)
      VALUES (
        ${user.id},
        ${body.contentType},
        ${body.contentId ? sql`${body.contentId}::uuid` : sql`NULL`},
        ${body.body.trim()}
      )
    `);
    return { submitted: true };
  }

  @Get('admin/suggestions')
  @RequirePermission('feed.post.delete_any')
  async getAdminSuggestions(@Query('status') status = 'pending') {
    const rows = await this.db.execute(sql`
      SELECT s.id, s.content_type, s.content_id, s.body, s.status, s.admin_note, s.created_at,
             u.display_name, u.email
      FROM library_suggestions s
      JOIN users u ON u.id = s.user_id
      WHERE s.status = ${status}
      ORDER BY s.created_at DESC
      LIMIT 50
    `);
    return rows;
  }

  @Patch('admin/suggestions/:id')
  @RequirePermission('feed.post.delete_any')
  async reviewSuggestion(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected'; adminNote?: string },
    @CurrentUser() user: RequestUser,
  ) {
    if (!['approved', 'rejected'].includes(body.status)) throw new BadRequestException();
    await this.db.execute(sql`
      UPDATE library_suggestions
      SET status = ${body.status}, admin_note = ${body.adminNote ?? null}, reviewed_by = ${user.id}, updated_at = now()
      WHERE id = ${id}::uuid
    `);
    return { updated: true };
  }

  // ── Günün Terimi ──────────────────────────────────────────────────────────────

  @Get('daily-term')
  @Public()
  async getDailyTerm() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const total = await this.db
      .select({ c: count() })
      .from(libraryTerms)
      .where(eq(libraryTerms.status, 'published'));
    const totalCount = Number(total[0]?.c ?? 0);
    if (totalCount === 0) return null;
    const offset = dayOfYear % totalCount;
    const rows = await this.db
      .select({
        id: libraryTerms.id,
        slug: libraryTerms.slug,
        term: libraryTerms.term,
        fullForm: libraryTerms.fullForm,
        definition: libraryTerms.definition,
        fields: libraryTerms.fields,
        tags: libraryTerms.tags,
      })
      .from(libraryTerms)
      .where(eq(libraryTerms.status, 'published'))
      .orderBy(asc(libraryTerms.createdAt))
      .limit(1)
      .offset(offset);
    return rows[0] ?? null;
  }

  // ── Terim sınav soruları ──────────────────────────────────────────────────────

  @Get('terms/slug/:slug/exam-questions')
  @Public()
  async getTermExamQuestions(@Param('slug') slug: string) {
    const rows = await this.db
      .select({
        id: examQuestions.id,
        questionText: examQuestions.questionText,
        optionA: examQuestions.optionA,
        optionB: examQuestions.optionB,
        optionC: examQuestions.optionC,
        optionD: examQuestions.optionD,
        optionE: examQuestions.optionE,
        correctOption: examQuestions.correctOption,
        explanation: examQuestions.explanation,
        difficulty: examQuestions.difficulty,
        source: examQuestions.source,
        categoryName: examCategories.name,
        categorySlug: examCategories.slug,
        examType: examCategories.examType,
      })
      .from(examQuestions)
      .innerJoin(examCategories, eq(examQuestions.categoryId, examCategories.id))
      .where(
        and(
          eq(examQuestions.isActive, true),
          sql`${slug} = ANY(${examQuestions.relatedTermSlugs}::text[])`,
        )
      )
      .limit(10);
    return rows;
  }

  // ── Rehber serisi ──────────────────────────────────────────────────────────────

  @Get('guides/series/:seriesSlug')
  @Public()
  async getGuideSeries(@Param('seriesSlug') seriesSlug: string) {
    return this.db
      .select({
        id: libraryGuides.id,
        slug: libraryGuides.slug,
        title: libraryGuides.title,
        summary: libraryGuides.summary,
        type: libraryGuides.type,
        seriesOrder: libraryGuides.seriesOrder,
        readingTimeMinutes: libraryGuides.readingTimeMinutes,
        status: libraryGuides.status,
      })
      .from(libraryGuides)
      .where(
        and(
          eq(libraryGuides.seriesSlug, seriesSlug),
          eq(libraryGuides.status, 'published'),
        )
      )
      .orderBy(asc(libraryGuides.seriesOrder));
  }

  // ═══════════════════════════════════════════════════════════════
  // YAZAR PROFİLİ (public — rehber detay sayfası için)
  // ═══════════════════════════════════════════════════════════════

  @Get('guides/:slug/author')
  @Public()
  async getGuideAuthor(@Param('slug') slug: string) {
    const guide = await this.db.query.libraryGuides.findFirst({
      where: and(eq(libraryGuides.slug, slug), eq(libraryGuides.status, 'published')),
      columns: { authorUserId: true, authorName: true },
    });
    if (!guide?.authorUserId) return null;
    const [u] = await this.db.select({
      id: users.id,
      displayName: userProfiles.displayName,
      avatarUrl: userProfiles.avatarUrl,
      bio: userProfiles.bio,
      city: userProfiles.city,
      profession: userProfiles.profession,
    }).from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.id, guide.authorUserId));
    return u ?? null;
  }

  // ═══════════════════════════════════════════════════════════════
  // ÖĞRENME YOLLARI (paths)
  // ═══════════════════════════════════════════════════════════════

  @Get('paths')
  @Public()
  async listPaths(@Query('field') field?: string) {
    const conditions = [eq(libraryPaths.status, 'published')];
    if (field?.trim() && (FIELDS as readonly string[]).includes(field.trim())) {
      conditions.push(eq(libraryPaths.field, field.trim() as LibraryField));
    }
    return this.db.select({
      id: libraryPaths.id,
      slug: libraryPaths.slug,
      title: libraryPaths.title,
      description: libraryPaths.description,
      field: libraryPaths.field,
      difficulty: libraryPaths.difficulty,
      estimatedMinutes: libraryPaths.estimatedMinutes,
      coverEmoji: libraryPaths.coverEmoji,
      itemCount: sql<number>`jsonb_array_length(${libraryPaths.items})`,
      createdAt: libraryPaths.createdAt,
    }).from(libraryPaths)
      .where(and(...conditions))
      .orderBy(asc(libraryPaths.difficulty), asc(libraryPaths.title));
  }

  @Get('paths/:slug')
  @Public()
  async getPath(@Param('slug') slug: string) {
    const path = await this.db.query.libraryPaths.findFirst({
      where: and(eq(libraryPaths.slug, slug), eq(libraryPaths.status, 'published')),
    });
    if (!path) throw new NotFoundException();
    return path;
  }

  @Post('admin/paths')
  @RequirePermission('feed.post.delete_any')
  async createPath(@Body() body: {
    slug: string; title: string; description?: string; field?: string;
    difficulty?: string; estimatedMinutes?: number; coverEmoji?: string;
    items?: Array<{ contentType: string; contentId: string; slug: string; title: string; order: number }>;
    status?: string;
  }) {
    if (!body.slug?.trim() || !body.title?.trim()) throw new BadRequestException('slug ve title zorunlu');
    const [created] = await this.db.insert(libraryPaths).values({
      slug: body.slug.trim(),
      title: body.title.trim(),
      description: body.description ?? null,
      field: (body.field as LibraryField) ?? null,
      difficulty: body.difficulty ?? 'beginner',
      estimatedMinutes: body.estimatedMinutes ?? null,
      coverEmoji: body.coverEmoji ?? '📚',
      items: (body.items ?? []) as typeof libraryPaths.$inferInsert['items'],
      status: (body.status as 'draft' | 'published' | 'archived') ?? 'draft',
    }).returning();
    return created;
  }

  @Patch('admin/paths/:id')
  @RequirePermission('feed.post.delete_any')
  async updatePath(@Param('id', ParseUUIDPipe) id: string, @Body() body: {
    title?: string; description?: string; field?: string; difficulty?: string;
    estimatedMinutes?: number; coverEmoji?: string; status?: string;
    items?: Array<{ contentType: string; contentId: string; slug: string; title: string; order: number }>;
  }) {
    const [updated] = await this.db.update(libraryPaths).set({
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.field !== undefined ? { field: body.field as LibraryField } : {}),
      ...(body.difficulty !== undefined ? { difficulty: body.difficulty } : {}),
      ...(body.estimatedMinutes !== undefined ? { estimatedMinutes: body.estimatedMinutes } : {}),
      ...(body.coverEmoji !== undefined ? { coverEmoji: body.coverEmoji } : {}),
      ...(body.status !== undefined ? { status: body.status as 'draft' | 'published' | 'archived' } : {}),
      ...(body.items !== undefined ? { items: body.items as typeof libraryPaths.$inferInsert['items'] } : {}),
      updatedAt: new Date(),
    }).where(eq(libraryPaths.id, id)).returning();
    if (!updated) throw new NotFoundException();
    return updated;
  }

  @Delete('admin/paths/:id')
  @RequirePermission('feed.post.delete_any')
  async deletePath(@Param('id', ParseUUIDPipe) id: string) {
    await this.db.delete(libraryPaths).where(eq(libraryPaths.id, id));
    return { deleted: true };
  }

  // ── Path progress (kullanıcıya özel adım tamamlama) ───────────────────────────

  @Get('me/path-progress/:pathSlug')
  async getPathProgress(
    @Param('pathSlug') pathSlug: string,
    @CurrentUser() user: RequestUser,
  ) {
    const rows = await this.db.execute(sql`
      SELECT step_index FROM library_path_progress
      WHERE user_id = ${user.id} AND path_slug = ${pathSlug}
    `) as unknown as { step_index: number }[];
    return { completed: rows.map(r => r.step_index) };
  }

  @Post('me/path-progress/:pathSlug/:stepIndex')
  async markPathStep(
    @Param('pathSlug') pathSlug: string,
    @Param('stepIndex') stepIndexStr: string,
    @CurrentUser() user: RequestUser,
  ) {
    const stepIndex = parseInt(stepIndexStr, 10);
    if (isNaN(stepIndex)) throw new BadRequestException('Geçersiz adım');
    await this.db.execute(sql`
      INSERT INTO library_path_progress (user_id, path_slug, step_index)
      VALUES (${user.id}, ${pathSlug}, ${stepIndex})
      ON CONFLICT (user_id, path_slug, step_index) DO NOTHING
    `);
    return { marked: true };
  }

  @Delete('me/path-progress/:pathSlug/:stepIndex')
  async unmarkPathStep(
    @Param('pathSlug') pathSlug: string,
    @Param('stepIndex') stepIndexStr: string,
    @CurrentUser() user: RequestUser,
  ) {
    const stepIndex = parseInt(stepIndexStr, 10);
    await this.db.execute(sql`
      DELETE FROM library_path_progress
      WHERE user_id = ${user.id} AND path_slug = ${pathSlug} AND step_index = ${stepIndex}
    `);
    return { unmarked: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // ROZETLER (Badges)
  // ═══════════════════════════════════════════════════════════════

  @Get('me/badges')
  async getMyBadges(@CurrentUser() user: RequestUser) {
    return this.db.select().from(userBadges)
      .where(eq(userBadges.userId, user.id))
      .orderBy(desc(userBadges.awardedAt));
  }

  @Post('me/badges/check')
  async checkAndAwardBadges(@CurrentUser() user: RequestUser) {
    const awarded: string[] = [];

    const [progressRow] = await this.db.execute(sql`
      SELECT count(*)::int AS c FROM library_progress WHERE user_id = ${user.id}
    `) as unknown as [{ c: number }];
    const viewedCount = Number(progressRow?.c ?? 0);

    const milestones = [
      { key: 'library_reader_10', threshold: 10 },
      { key: 'library_reader_50', threshold: 50 },
      { key: 'library_reader_100', threshold: 100 },
    ];
    for (const m of milestones) {
      if (viewedCount >= m.threshold) {
        await this.db.execute(sql`
          INSERT INTO user_badges (user_id, badge_type)
          VALUES (${user.id}, ${m.key})
          ON CONFLICT (user_id, badge_type) DO NOTHING
        `);
        awarded.push(m.key);
      }
    }

    const [examRow] = await this.db.execute(sql`
      SELECT count(*)::int AS c FROM exam_attempts WHERE user_id = ${user.id}
    `) as unknown as [{ c: number }];
    if (Number(examRow?.c ?? 0) >= 1) {
      await this.db.execute(sql`
        INSERT INTO user_badges (user_id, badge_type)
        VALUES (${user.id}, 'exam_first_attempt')
        ON CONFLICT (user_id, badge_type) DO NOTHING
      `);
      awarded.push('exam_first_attempt');
    }

    return { awarded };
  }

  // ═══════════════════════════════════════════════════════════════
  // BİLGİ HARİTASI — terim cross-link graph
  // ═══════════════════════════════════════════════════════════════

  @Get('terms/slug/:slug/graph')
  @Public()
  async getTermGraph(@Param('slug') slug: string) {
    const term = await this.db.query.libraryTerms.findFirst({
      where: and(eq(libraryTerms.slug, slug), eq(libraryTerms.status, 'published')),
      columns: { id: true, slug: true, term: true, relatedTermIds: true, fields: true },
    });
    if (!term) throw new NotFoundException();

    const relatedTerms = term.relatedTermIds.length > 0
      ? await this.db.select({
          id: libraryTerms.id,
          slug: libraryTerms.slug,
          term: libraryTerms.term,
          fields: libraryTerms.fields,
        }).from(libraryTerms)
          .where(and(
            eq(libraryTerms.status, 'published'),
            sql`${libraryTerms.id} = ANY(${sql.raw(`ARRAY[${term.relatedTermIds.map(id => `'${id}'::uuid`).join(',')}]`)})`,
          ))
      : [];

    const relatedRegulations = await this.db.execute(sql`
      SELECT id, slug, title, short_title, type
      FROM library_regulations
      WHERE status = 'published'
        AND related_term_slugs @> ARRAY[${slug}]::text[]
      LIMIT 5
    `) as unknown as { id: string; slug: string; title: string; short_title: string | null; type: string }[];

    return {
      center: { id: term.id, slug: term.slug, term: term.term, fields: term.fields },
      relatedTerms,
      relatedRegulations,
    };
  }
}
