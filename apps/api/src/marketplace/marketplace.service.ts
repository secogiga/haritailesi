import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, and, sql, type SQL } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { contentRequests, jobListings } from '@haritailesi/database';

@Injectable()
export class MarketplaceService {
  constructor(@InjectDb() private readonly db: Database) {}

  // ─── Content Requests ─────────────────────────────────────────────────────────

  async createContentRequest(dto: {
    userId?: string | undefined;
    email: string;
    displayName: string;
    source: 'sahne' | 'mutfak';
    type: 'magaza' | 'etkinlik' | 'egitim' | 'ilan';
    title: string;
    description: string;
    contactInfo?: string | undefined;
    attachmentUrl?: string | undefined;
  }) {
    const [row] = await this.db
      .insert(contentRequests)
      .values({
        userId: dto.userId ?? null,
        email: dto.email,
        displayName: dto.displayName,
        source: dto.source,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        contactInfo: dto.contactInfo ?? null,
        attachmentUrl: dto.attachmentUrl ?? null,
      })
      .returning({ id: contentRequests.id });

    return { id: row!.id };
  }

  async listContentRequests(params: { status?: string | undefined; type?: string | undefined; source?: string | undefined; limit?: number | undefined; cursor?: string | undefined }) {
    const limit = Math.min(params.limit ?? 30, 100);
    const conditions: SQL[] = [];
    if (params.status) conditions.push(eq(contentRequests.status, params.status as 'pending' | 'approved' | 'rejected'));
    if (params.type) conditions.push(eq(contentRequests.type, params.type as 'magaza' | 'etkinlik' | 'egitim' | 'ilan'));
    if (params.source) conditions.push(eq(contentRequests.source, params.source as 'sahne' | 'mutfak'));
    if (params.cursor) {
      conditions.push(sql`${contentRequests.createdAt} < (SELECT created_at FROM content_requests WHERE id = ${params.cursor})`);
    }

    const rows = await this.db
      .select()
      .from(contentRequests)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(contentRequests.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);
    return { data, next_cursor: hasMore ? (data[data.length - 1]?.id ?? null) : null, has_more: hasMore };
  }

  async updateContentRequest(id: string, dto: { title?: string; description?: string; contactInfo?: string }) {
    const [row] = await this.db
      .update(contentRequests)
      .set({
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.contactInfo !== undefined ? { contactInfo: dto.contactInfo ?? null } : {}),
      })
      .where(eq(contentRequests.id, id))
      .returning();
    if (!row) throw new NotFoundException('Talep bulunamadı.');
    return row;
  }

  async reviewContentRequest(
    id: string,
    adminId: string,
    status: 'approved' | 'rejected',
    adminNotes?: string,
  ) {
    const req = await this.db.query.contentRequests.findFirst({ where: eq(contentRequests.id, id) });
    if (!req) throw new NotFoundException('Talep bulunamadı.');

    const [row] = await this.db
      .update(contentRequests)
      .set({ status, adminNotes: adminNotes ?? null, reviewedAt: new Date(), reviewedBy: adminId })
      .where(eq(contentRequests.id, id))
      .returning();

    // İlan tipi onaylandıysa otomatik classifieds listing oluştur
    if (status === 'approved' && req.type === 'ilan') {
      await this.db.insert(jobListings).values({
        title: req.title,
        company: req.displayName,
        description: req.description,
        type: 'diger',
        status: 'published',
        source: req.source,
        submittedBy: req.userId ?? undefined,
        contentRequestId: id,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 gün
      });
    }

    return row;
  }

  // ─── Job Listings (İlan Panosu) ───────────────────────────────────────────────

  async listJobListings(params: { type?: string | undefined; tags?: string | undefined; limit?: number | undefined; cursor?: string | undefined }) {
    const limit = Math.min(params.limit ?? 20, 50);
    const conditions: SQL[] = [eq(jobListings.status, 'published')];

    if (params.type) conditions.push(eq(jobListings.type, params.type as 'isbirligi' | 'proje' | 'teknik_destek' | 'freelancer' | 'teknoloji_ekipman' | 'ikinci_el' | 'mesleki_arac' | 'firsat' | 'duyuru' | 'satilik' | 'kiralik' | 'aranan' | 'hizmet' | 'diger' | 'full_time' | 'part_time' | 'freelance' | 'internship'));
    if (params.cursor) {
      conditions.push(sql`${jobListings.publishedAt} < (SELECT published_at FROM job_listings WHERE id = ${params.cursor})`);
    }

    const rows = await this.db
      .select()
      .from(jobListings)
      .where(and(...conditions))
      .orderBy(desc(jobListings.publishedAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);
    return { data, next_cursor: hasMore ? (data[data.length - 1]?.id ?? null) : null, has_more: hasMore };
  }

  async createJobListing(adminId: string, dto: {
    title: string;
    company: string;
    location?: string;
    type: 'isbirligi' | 'proje' | 'teknik_destek' | 'freelancer' | 'teknoloji_ekipman' | 'ikinci_el' | 'mesleki_arac' | 'firsat' | 'duyuru' | 'satilik' | 'kiralik' | 'aranan' | 'hizmet' | 'diger' | 'full_time' | 'part_time' | 'freelance' | 'internship';
    description: string;
    applyUrl?: string;
    applyEmail?: string;
    contactPhone?: string;
    price?: string;
    tags?: string[];
    expiresAt?: Date;
  }) {
    const [row] = await this.db
      .insert(jobListings)
      .values({
        title: dto.title,
        company: dto.company,
        description: dto.description,
        type: dto.type,
        tags: dto.tags ?? [],
        status: 'published' as const,
        submittedBy: adminId,
        publishedAt: new Date(),
        expiresAt: dto.expiresAt ?? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        ...(dto.location ? { location: dto.location } : {}),
        ...(dto.applyUrl ? { applyUrl: dto.applyUrl } : {}),
        ...(dto.applyEmail ? { applyEmail: dto.applyEmail } : {}),
        ...(dto.contactPhone ? { contactPhone: dto.contactPhone } : {}),
        ...(dto.price ? { price: dto.price } : {}),
      })
      .returning({ id: jobListings.id });

    return { id: row!.id };
  }

  async listAdminJobListings(params: { status?: string; type?: string } = {}) {
    const conditions: SQL[] = [];
    if (params.status) conditions.push(eq(jobListings.status, params.status as 'draft' | 'published' | 'closed'));
    if (params.type) conditions.push(eq(jobListings.type, params.type as 'isbirligi' | 'proje' | 'teknik_destek' | 'freelancer' | 'teknoloji_ekipman' | 'ikinci_el' | 'mesleki_arac' | 'firsat' | 'duyuru' | 'satilik' | 'kiralik' | 'aranan' | 'hizmet' | 'diger' | 'full_time' | 'part_time' | 'freelance' | 'internship'));
    return this.db.select().from(jobListings)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(jobListings.createdAt))
      .limit(200);
  }

  async updateJobListing(id: string, dto: Partial<{
    title: string; company: string; location: string;
    type: 'isbirligi' | 'proje' | 'teknik_destek' | 'freelancer' | 'teknoloji_ekipman' | 'ikinci_el' | 'mesleki_arac' | 'firsat' | 'duyuru' | 'satilik' | 'kiralik' | 'aranan' | 'hizmet' | 'diger' | 'full_time' | 'part_time' | 'freelance' | 'internship';
    description: string; applyUrl: string; applyEmail: string;
    contactPhone: string; price: string; tags: string[];
  }>) {
    const { type, location, applyUrl, applyEmail, contactPhone, price, ...rest } = dto;
    const setValues = {
      ...rest,
      updatedAt: new Date(),
      ...(type ? { type } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(applyUrl !== undefined ? { applyUrl } : {}),
      ...(applyEmail !== undefined ? { applyEmail } : {}),
      ...(contactPhone !== undefined ? { contactPhone } : {}),
      ...(price !== undefined ? { price } : {}),
    };
    const [row] = await this.db.update(jobListings)
      .set(setValues)
      .where(eq(jobListings.id, id))
      .returning();
    if (!row) throw new NotFoundException('İlan bulunamadı.');
    return row;
  }

  async deleteJobListing(id: string) {
    await this.db.delete(jobListings).where(eq(jobListings.id, id));
    return { deleted: true };
  }

  async updateJobListingStatus(id: string, status: 'published' | 'closed') {
    const [row] = await this.db
      .update(jobListings)
      .set({ status, updatedAt: new Date() })
      .where(eq(jobListings.id, id))
      .returning({ id: jobListings.id });

    if (!row) throw new NotFoundException('İlan bulunamadı.');
    return row;
  }
}
