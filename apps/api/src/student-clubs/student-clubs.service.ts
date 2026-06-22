import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { eq, desc, and, asc } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { studentClubs, clubNews, clubEvents } from '@haritailesi/database';

@Injectable()
export class StudentClubsService {
  constructor(@InjectDb() private readonly db: Database) {}

  listPublic() {
    return this.db
      .select()
      .from(studentClubs)
      .where(eq(studentClubs.status, 'active'))
      .orderBy(desc(studentClubs.createdAt));
  }

  listAdmin(status?: string) {
    const where = status ? eq(studentClubs.status, status) : undefined;
    return this.db.select().from(studentClubs).where(where).orderBy(desc(studentClubs.createdAt));
  }

  async create(dto: {
    name: string; slug: string; university: string; city: string;
    contactName: string; contactEmail: string; contactPhone?: string;
    website?: string; memberCount?: number; description?: string;
    activities?: string; coverImageUrl?: string;
  }) {
    const [row] = await this.db.insert(studentClubs).values({
      ...dto,
      contactPhone: dto.contactPhone ?? null,
      website: dto.website ?? null,
      description: dto.description ?? null,
      activities: dto.activities ?? null,
      coverImageUrl: dto.coverImageUrl ?? null,
      memberCount: dto.memberCount ?? 0,
      status: 'pending',
    }).returning({ id: studentClubs.id });
    return { id: row!.id };
  }

  async update(id: string, dto: Partial<{
    name: string; university: string; city: string; contactName: string;
    contactEmail: string; contactPhone: string; website: string;
    memberCount: number; description: string; activities: string; adminNotes: string;
  }>) {
    const [row] = await this.db
      .update(studentClubs)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(studentClubs.id, id))
      .returning({ id: studentClubs.id });
    if (!row) throw new NotFoundException('Kulüp bulunamadı.');
    return row;
  }

  async updateStatus(id: string, status: 'pending' | 'active' | 'suspended', adminNotes?: string) {
    const [row] = await this.db
      .update(studentClubs)
      .set({ status, ...(adminNotes !== undefined ? { adminNotes } : {}), updatedAt: new Date() })
      .where(eq(studentClubs.id, id))
      .returning({ id: studentClubs.id });
    if (!row) throw new NotFoundException('Kulüp bulunamadı.');
    return row;
  }

  async remove(id: string) {
    await this.db.delete(studentClubs).where(eq(studentClubs.id, id));
    return { deleted: true };
  }

  async findBySlug(slug: string) {
    const [row] = await this.db.select().from(studentClubs)
      .where(eq(studentClubs.slug, slug));
    if (!row) throw new NotFoundException('Kulüp bulunamadı.');
    return row;
  }

  async setRepresentative(id: string, representativeId: string | null) {
    const [row] = await this.db
      .update(studentClubs)
      .set({ representativeId, updatedAt: new Date() })
      .where(eq(studentClubs.id, id))
      .returning({ id: studentClubs.id });
    if (!row) throw new NotFoundException('Kulüp bulunamadı.');
    return row;
  }

  async findByRep(userId: string) {
    const [row] = await this.db.select().from(studentClubs)
      .where(eq(studentClubs.representativeId, userId));
    return row ?? null;
  }

  async updateByRep(userId: string, dto: Partial<{
    description: string; activities: string; contactPhone: string;
    website: string; memberCount: number;
  }>) {
    const club = await this.findByRep(userId);
    if (!club) throw new ForbiddenException('Bu işlem için kulüp temsilcisi olmalısınız.');
    const [row] = await this.db
      .update(studentClubs)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(studentClubs.id, club.id))
      .returning({ id: studentClubs.id });
    return row;
  }

  // ─── News ─────────────────────────────────────────────────────────────────────

  listAllNews() {
    return this.db
      .select({
        id: clubNews.id,
        clubId: clubNews.clubId,
        clubName: studentClubs.name,
        clubSlug: studentClubs.slug,
        title: clubNews.title,
        summary: clubNews.summary,
        body: clubNews.body,
        publishedAt: clubNews.publishedAt,
        createdAt: clubNews.createdAt,
      })
      .from(clubNews)
      .innerJoin(studentClubs, eq(clubNews.clubId, studentClubs.id))
      .where(and(eq(clubNews.isPublished, true), eq(studentClubs.status, 'active')))
      .orderBy(desc(clubNews.publishedAt));
  }

  listClubNews(clubId: string) {
    return this.db
      .select()
      .from(clubNews)
      .where(and(eq(clubNews.clubId, clubId), eq(clubNews.isPublished, true)))
      .orderBy(desc(clubNews.publishedAt));
  }

  async createNews(clubId: string, dto: { title: string; summary?: string; body?: string; publishedAt?: string }) {
    const [row] = await this.db.insert(clubNews).values({
      clubId,
      title: dto.title,
      ...(dto.summary ? { summary: dto.summary } : {}),
      ...(dto.body ? { body: dto.body } : {}),
      ...(dto.publishedAt ? { publishedAt: new Date(dto.publishedAt) } : {}),
      isPublished: true,
    }).returning({ id: clubNews.id });
    return { id: row!.id };
  }

  async deleteNews(id: string) {
    await this.db.delete(clubNews).where(eq(clubNews.id, id));
    return { deleted: true };
  }

  // ─── Events ───────────────────────────────────────────────────────────────────

  listAllClubEvents() {
    return this.db
      .select({
        id: clubEvents.id,
        clubId: clubEvents.clubId,
        clubName: studentClubs.name,
        clubSlug: studentClubs.slug,
        title: clubEvents.title,
        description: clubEvents.description,
        eventDate: clubEvents.eventDate,
        location: clubEvents.location,
        registrationUrl: clubEvents.registrationUrl,
        createdAt: clubEvents.createdAt,
      })
      .from(clubEvents)
      .innerJoin(studentClubs, eq(clubEvents.clubId, studentClubs.id))
      .where(and(eq(clubEvents.isPublished, true), eq(studentClubs.status, 'active')))
      .orderBy(asc(clubEvents.eventDate));
  }

  listClubEvents(clubId: string) {
    return this.db
      .select()
      .from(clubEvents)
      .where(and(eq(clubEvents.clubId, clubId), eq(clubEvents.isPublished, true)))
      .orderBy(asc(clubEvents.eventDate));
  }

  async createClubEvent(clubId: string, dto: {
    title: string; description?: string; eventDate: string;
    location?: string; registrationUrl?: string;
  }) {
    const [row] = await this.db.insert(clubEvents).values({
      clubId,
      title: dto.title,
      ...(dto.description ? { description: dto.description } : {}),
      eventDate: new Date(dto.eventDate),
      ...(dto.location ? { location: dto.location } : {}),
      ...(dto.registrationUrl ? { registrationUrl: dto.registrationUrl } : {}),
      isPublished: true,
    }).returning({ id: clubEvents.id });
    return { id: row!.id };
  }

  async deleteClubEvent(id: string) {
    await this.db.delete(clubEvents).where(eq(clubEvents.id, id));
    return { deleted: true };
  }
}
