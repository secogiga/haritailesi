import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { eq, asc, desc, and, sql, or, ilike, count, isNotNull, ne } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { pages, boardMembers, events, eventAttendances, projects, siteSettings, userProfiles, trainings, examResources, users, talents } from '@haritailesi/database';
import type {
  UpsertPageDto,
  CreateBoardMemberDto,
  UpdateBoardMemberDto,
  CreateEventDto,
  UpdateEventDto,
  CreateProjectDto,
  UpdateProjectDto,
  CreateTalentDto,
  AdminUpdateTalentDto,
} from './dto/cms.dto';

@Injectable()
export class CmsService {
  constructor(@InjectDb() private readonly db: Database) {}

  // ─── Pages ───────────────────────────────────────────────────────────────────

  async listPages() {
    return this.db.select().from(pages).orderBy(asc(pages.slug));
  }

  async getPage(slug: string, publishedOnly = true) {
    const [page] = await this.db
      .select()
      .from(pages)
      .where(
        publishedOnly
          ? and(eq(pages.slug, slug), eq(pages.isPublished, true))
          : eq(pages.slug, slug),
      )
      .limit(1);
    if (!page) throw new NotFoundException(`Sayfa bulunamadı: ${slug}`);
    return page;
  }

  async upsertPage(slug: string, dto: UpsertPageDto, updatedById: string) {
    const [existing] = await this.db.select({ id: pages.id }).from(pages).where(eq(pages.slug, slug)).limit(1);
    const now = new Date();

    if (existing) {
      const [updated] = await this.db
        .update(pages)
        .set({
          title: dto.title,
          ...(dto.body !== undefined ? { body: dto.body } : {}),
          ...(dto.metaDescription !== undefined ? { metaDescription: dto.metaDescription } : {}),
          isPublished: dto.isPublished,
          updatedBy: updatedById,
          updatedAt: now,
        })
        .where(eq(pages.slug, slug))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(pages)
      .values({
        slug,
        title: dto.title,
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.metaDescription !== undefined ? { metaDescription: dto.metaDescription } : {}),
        isPublished: dto.isPublished,
        updatedBy: updatedById,
      })
      .returning();
    return created;
  }

  async deletePage(slug: string) {
    const [deleted] = await this.db.delete(pages).where(eq(pages.slug, slug)).returning({ id: pages.id });
    if (!deleted) throw new NotFoundException(`Sayfa bulunamadı: ${slug}`);
    return { deleted: true };
  }

  // ─── Board Members ────────────────────────────────────────────────────────────

  async listBoardMembers(activeOnly = true) {
    return this.db
      .select()
      .from(boardMembers)
      .where(activeOnly ? eq(boardMembers.isActive, true) : undefined)
      .orderBy(asc(boardMembers.sortOrder), asc(boardMembers.name));
  }

  async getBoardMember(id: string) {
    const [member] = await this.db.select().from(boardMembers).where(eq(boardMembers.id, id)).limit(1);
    if (!member) throw new NotFoundException('Üye bulunamadı');
    return member;
  }

  async createBoardMember(dto: CreateBoardMemberDto) {
    const [created] = await this.db
      .insert(boardMembers)
      .values({
        name: dto.name,
        title: dto.title,
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.photoKey !== undefined ? { photoKey: dto.photoKey } : {}),
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      })
      .returning();
    return created;
  }

  async updateBoardMember(id: string, dto: UpdateBoardMemberDto) {
    const [updated] = await this.db
      .update(boardMembers)
      .set({
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.photoKey !== undefined ? { photoKey: dto.photoKey } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        updatedAt: new Date(),
      })
      .where(eq(boardMembers.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Üye bulunamadı');
    return updated;
  }

  async deleteBoardMember(id: string) {
    const [deleted] = await this.db.delete(boardMembers).where(eq(boardMembers.id, id)).returning({ id: boardMembers.id });
    if (!deleted) throw new NotFoundException('Üye bulunamadı');
    return { deleted: true };
  }

  // ─── Events ───────────────────────────────────────────────────────────────────

  async listEvents(opts: { type?: string; publishedOnly?: boolean } = {}) {
    const conditions = [];
    if (opts.publishedOnly) conditions.push(eq(events.isPublished, true));
    if (opts.type) conditions.push(eq(events.type, opts.type as 'kongre' | 'networking' | 'odul' | 'diger'));

    const rows = await this.db
      .select({
        id: events.id,
        slug: events.slug,
        title: events.title,
        type: events.type,
        dateStart: events.dateStart,
        dateEnd: events.dateEnd,
        location: events.location,
        description: events.description,
        registrationUrl: events.registrationUrl,
        meetingUrl: events.meetingUrl,
        coverImageKey: events.coverImageKey,
        maxCapacity: events.maxCapacity,
        isCancelled: events.isCancelled,
        isPublished: events.isPublished,
        viewCount: events.viewCount,
        createdAt: events.createdAt,
        attendeeCount: sql<number>`(SELECT COUNT(*) FROM event_attendances WHERE event_id = ${events.id})`.as('attendee_count'),
      })
      .from(events)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(events.dateStart));

    return rows;
  }

  async getEvent(slug: string, publishedOnly = true) {
    const [event] = await this.db
      .select()
      .from(events)
      .where(
        publishedOnly
          ? and(eq(events.slug, slug), eq(events.isPublished, true))
          : eq(events.slug, slug),
      )
      .limit(1);
    if (!event) throw new NotFoundException(`Etkinlik bulunamadı: ${slug}`);
    if (publishedOnly) {
      void this.db
        .update(events)
        .set({ viewCount: sql`${events.viewCount} + 1` })
        .where(eq(events.slug, slug))
        .catch(() => {});
    }
    return event;
  }

  async getEventById(id: string) {
    const [event] = await this.db.select().from(events).where(eq(events.id, id)).limit(1);
    if (!event) throw new NotFoundException('Etkinlik bulunamadı');
    return event;
  }

  async createEvent(dto: CreateEventDto, createdById: string) {
    const [created] = await this.db
      .insert(events)
      .values({
        slug: dto.slug,
        title: dto.title,
        type: dto.type,
        dateStart: new Date(dto.dateStart),
        ...(dto.dateEnd ? { dateEnd: new Date(dto.dateEnd) } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.registrationUrl !== undefined ? { registrationUrl: dto.registrationUrl } : {}),
        ...(dto.meetingUrl !== undefined ? { meetingUrl: dto.meetingUrl } : {}),
        ...(dto.coverImageKey !== undefined ? { coverImageKey: dto.coverImageKey } : {}),
        ...(dto.maxCapacity !== undefined ? { maxCapacity: dto.maxCapacity } : {}),
        ...(dto.isCancelled !== undefined ? { isCancelled: dto.isCancelled } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        isPublished: dto.isPublished,
        createdBy: createdById,
      })
      .returning();
    return created;
  }

  async updateEvent(id: string, dto: UpdateEventDto) {
    const [updated] = await this.db
      .update(events)
      .set({
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.dateStart !== undefined ? { dateStart: new Date(dto.dateStart) } : {}),
        ...(dto.dateEnd !== undefined ? { dateEnd: new Date(dto.dateEnd) } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.registrationUrl !== undefined ? { registrationUrl: dto.registrationUrl } : {}),
        ...(dto.meetingUrl !== undefined ? { meetingUrl: dto.meetingUrl } : {}),
        ...(dto.coverImageKey !== undefined ? { coverImageKey: dto.coverImageKey } : {}),
        ...(dto.maxCapacity !== undefined ? { maxCapacity: dto.maxCapacity } : {}),
        ...(dto.isCancelled !== undefined ? { isCancelled: dto.isCancelled } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Etkinlik bulunamadı');
    return updated;
  }

  async deleteEvent(id: string) {
    const [deleted] = await this.db.delete(events).where(eq(events.id, id)).returning({ id: events.id });
    if (!deleted) throw new NotFoundException('Etkinlik bulunamadı');
    return { deleted: true };
  }

  // ─── Event RSVP ───────────────────────────────────────────────────────────────

  async rsvp(userId: string, eventId: string) {
    const event = await this.getEventById(eventId);
    if (event.isCancelled) throw new BadRequestException('Bu etkinlik iptal edilmiştir.');
    if (event.maxCapacity != null) {
      const rows = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(eventAttendances)
        .where(eq(eventAttendances.eventId, eventId));
      if (Number(rows[0]?.count ?? 0) >= event.maxCapacity) throw new BadRequestException('Etkinlik kapasitesi dolmuştur.');
    }
    await this.db
      .insert(eventAttendances)
      .values({ eventId, userId })
      .onConflictDoUpdate({
        target: [eventAttendances.eventId, eventAttendances.userId],
        set: { joinCount: sql`${eventAttendances.joinCount} + 1` },
      });
    return { rsvp: true };
  }

  async cancelRsvp(userId: string, eventId: string) {
    await this.db
      .delete(eventAttendances)
      .where(and(eq(eventAttendances.eventId, eventId), eq(eventAttendances.userId, userId)));
    return { rsvp: false };
  }

  async getMyRsvps(userId: string) {
    const rows = await this.db
      .select({ eventId: eventAttendances.eventId })
      .from(eventAttendances)
      .where(eq(eventAttendances.userId, userId));
    return rows.map((r) => r.eventId);
  }

  async listEventAttendees(eventId: string) {
    const rows = await this.db
      .select({
        userId: eventAttendances.userId,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        profession: userProfiles.profession,
        joinedAt: eventAttendances.firstJoinedAt,
      })
      .from(eventAttendances)
      .innerJoin(userProfiles, eq(userProfiles.userId, eventAttendances.userId))
      .where(eq(eventAttendances.eventId, eventId))
      .orderBy(asc(eventAttendances.firstJoinedAt))
      .limit(100);
    return { count: rows.length, attendees: rows };
  }

  // ─── Projects ─────────────────────────────────────────────────────────────────

  async listProjects(opts: { status?: string; publishedOnly?: boolean } = {}) {
    const conditions = [];
    if (opts.publishedOnly) conditions.push(eq(projects.isPublished, true));
    if (opts.status) conditions.push(eq(projects.status, opts.status as 'active' | 'completed' | 'archived'));

    return this.db
      .select()
      .from(projects)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(projects.createdAt));
  }

  async getProject(slug: string, publishedOnly = true) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(
        publishedOnly
          ? and(eq(projects.slug, slug), eq(projects.isPublished, true))
          : eq(projects.slug, slug),
      )
      .limit(1);
    if (!project) throw new NotFoundException(`Proje bulunamadı: ${slug}`);
    if (publishedOnly) {
      void this.db
        .update(projects)
        .set({ viewCount: sql`${projects.viewCount} + 1` })
        .where(eq(projects.slug, slug))
        .catch(() => {});
    }
    return project;
  }

  async getProjectById(id: string) {
    const [project] = await this.db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!project) throw new NotFoundException('Proje bulunamadı');
    return project;
  }

  async createProject(dto: CreateProjectDto, createdById: string) {
    const [created] = await this.db
      .insert(projects)
      .values({
        slug: dto.slug,
        title: dto.title,
        ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        status: dto.status,
        ...(dto.coverImageKey !== undefined ? { coverImageKey: dto.coverImageKey } : {}),
        isPublished: dto.isPublished,
        type: dto.type ?? 'sahne',
        ...(dto.authorName !== undefined ? { authorName: dto.authorName } : {}),
        ...(dto.authorInitials !== undefined ? { authorInitials: dto.authorInitials } : {}),
        ...(dto.authorAvatarColor !== undefined ? { authorAvatarColor: dto.authorAvatarColor } : {}),
        ...(dto.authorTag !== undefined ? { authorTag: dto.authorTag } : {}),
        ...(dto.authorTagColor !== undefined ? { authorTagColor: dto.authorTagColor } : {}),
        ...(dto.accentGradient !== undefined ? { accentGradient: dto.accentGradient } : {}),
        ...(dto.linkedinUrl !== undefined ? { linkedinUrl: dto.linkedinUrl } : {}),
        ...(dto.hashtags !== undefined ? { hashtags: dto.hashtags } : {}),
        ...(dto.externalLinks !== undefined ? { externalLinks: dto.externalLinks } : {}),
        ...(dto.imageKeys !== undefined ? { imageKeys: dto.imageKeys } : {}),
        createdBy: createdById,
      })
      .returning();
    return created;
  }

  async updateProject(id: string, dto: UpdateProjectDto) {
    const [updated] = await this.db
      .update(projects)
      .set({
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.coverImageKey !== undefined ? { coverImageKey: dto.coverImageKey } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.authorName !== undefined ? { authorName: dto.authorName } : {}),
        ...(dto.authorInitials !== undefined ? { authorInitials: dto.authorInitials } : {}),
        ...(dto.authorAvatarColor !== undefined ? { authorAvatarColor: dto.authorAvatarColor } : {}),
        ...(dto.authorTag !== undefined ? { authorTag: dto.authorTag } : {}),
        ...(dto.authorTagColor !== undefined ? { authorTagColor: dto.authorTagColor } : {}),
        ...(dto.accentGradient !== undefined ? { accentGradient: dto.accentGradient } : {}),
        ...(dto.linkedinUrl !== undefined ? { linkedinUrl: dto.linkedinUrl } : {}),
        ...(dto.hashtags !== undefined ? { hashtags: dto.hashtags } : {}),
        ...(dto.externalLinks !== undefined ? { externalLinks: dto.externalLinks } : {}),
        ...(dto.imageKeys !== undefined ? { imageKeys: dto.imageKeys } : {}),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Proje bulunamadı');
    return updated;
  }

  async deleteProject(id: string) {
    const [deleted] = await this.db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id });
    if (!deleted) throw new NotFoundException('Proje bulunamadı');
    return { deleted: true };
  }

  // ─── Search ───────────────────────────────────────────────────────────────────

  async search(q: string) {
    const term = `%${q}%`;
    const [matchedEvents, matchedProjects] = await Promise.all([
      this.db
        .select({
          id: events.id,
          slug: events.slug,
          title: events.title,
          description: events.description,
          dateStart: events.dateStart,
          type: events.type,
        })
        .from(events)
        .where(
          and(
            eq(events.isPublished, true),
            or(ilike(events.title, term), ilike(events.description, term), ilike(events.location, term)),
          ),
        )
        .orderBy(desc(events.dateStart))
        .limit(5),
      this.db
        .select({
          id: projects.id,
          slug: projects.slug,
          title: projects.title,
          summary: projects.summary,
          status: projects.status,
        })
        .from(projects)
        .where(
          and(
            eq(projects.isPublished, true),
            or(ilike(projects.title, term), ilike(projects.summary, term)),
          ),
        )
        .orderBy(desc(projects.createdAt))
        .limit(5),
    ]);

    return { events: matchedEvents, projects: matchedProjects };
  }

  // ─── Trainings ────────────────────────────────────────────────────────────────

  async listTrainings(publishedOnly = true) {
    return this.db
      .select()
      .from(trainings)
      .where(publishedOnly ? eq(trainings.isPublished, true) : undefined)
      .orderBy(desc(trainings.createdAt));
  }

  async getTraining(slug: string, publishedOnly = true) {
    const [row] = await this.db
      .select()
      .from(trainings)
      .where(
        publishedOnly
          ? and(eq(trainings.slug, slug), eq(trainings.isPublished, true))
          : eq(trainings.slug, slug),
      )
      .limit(1);
    if (!row) throw new NotFoundException(`Eğitim bulunamadı: ${slug}`);
    if (publishedOnly) {
      void this.db
        .update(trainings)
        .set({ viewCount: sql`${trainings.viewCount} + 1` })
        .where(eq(trainings.slug, slug))
        .catch(() => {});
    }
    return row;
  }

  async createTraining(dto: {
    slug: string; title: string; instructor?: string; instructorTitle?: string;
    format?: string; level?: string; duration?: string; price?: string; memberPrice?: string;
    description?: string; tags?: string[]; isPublished?: boolean;
    registrationUrl?: string; startDate?: string; source?: string;
  }) {
    const [row] = await this.db.insert(trainings).values({
      slug: dto.slug,
      title: dto.title,
      ...(dto.instructor ? { instructor: dto.instructor } : {}),
      ...(dto.instructorTitle ? { instructorTitle: dto.instructorTitle } : {}),
      ...(dto.format ? { format: dto.format } : {}),
      ...(dto.level ? { level: dto.level } : {}),
      ...(dto.duration ? { duration: dto.duration } : {}),
      ...(dto.price ? { price: dto.price } : {}),
      ...(dto.memberPrice ? { memberPrice: dto.memberPrice } : {}),
      ...(dto.description ? { description: dto.description } : {}),
      tags: dto.tags ?? [],
      isPublished: dto.isPublished ?? false,
      ...(dto.registrationUrl ? { registrationUrl: dto.registrationUrl } : {}),
      ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
      ...(dto.source ? { source: dto.source } : {}),
    }).returning();
    return row;
  }

  async updateTraining(id: string, dto: Partial<{
    slug: string; title: string; instructor: string; instructorTitle: string;
    format: string; level: string; duration: string; price: string; memberPrice: string;
    description: string; tags: string[]; isPublished: boolean;
    registrationUrl: string; startDate: string; source: string;
  }>) {
    const [row] = await this.db.update(trainings).set({
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.instructor !== undefined ? { instructor: dto.instructor } : {}),
      ...(dto.instructorTitle !== undefined ? { instructorTitle: dto.instructorTitle } : {}),
      ...(dto.format !== undefined ? { format: dto.format } : {}),
      ...(dto.level !== undefined ? { level: dto.level } : {}),
      ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.memberPrice !== undefined ? { memberPrice: dto.memberPrice } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
      ...(dto.registrationUrl !== undefined ? { registrationUrl: dto.registrationUrl } : {}),
      ...(dto.startDate !== undefined ? { startDate: new Date(dto.startDate) } : {}),
      ...(dto.source !== undefined ? { source: dto.source } : {}),
      updatedAt: new Date(),
    }).where(eq(trainings.id, id)).returning();
    if (!row) throw new NotFoundException('Eğitim bulunamadı');
    return row;
  }

  async deleteTraining(id: string) {
    await this.db.delete(trainings).where(eq(trainings.id, id));
    return { deleted: true };
  }

  // ─── Exam Resources ───────────────────────────────────────────────────────────

  async listExamResources(examKey?: string, resourceType?: string) {
    const conditions = [eq(examResources.isPublished, true)];
    if (examKey) conditions.push(eq(examResources.examKey, examKey));
    if (resourceType) conditions.push(eq(examResources.resourceType, resourceType));
    const rows = await this.db
      .select()
      .from(examResources)
      .where(and(...conditions))
      .orderBy(asc(examResources.sortOrder), asc(examResources.createdAt));
    if (examKey) {
      void this.db
        .update(examResources)
        .set({ viewCount: sql`${examResources.viewCount} + 1` })
        .where(and(eq(examResources.examKey, examKey), eq(examResources.isPublished, true)))
        .catch(() => {});
    }
    return rows;
  }

  async listAllExamResources(examKey?: string, resourceType?: string) {
    const conditions = [];
    if (examKey) conditions.push(eq(examResources.examKey, examKey));
    if (resourceType) conditions.push(eq(examResources.resourceType, resourceType));
    return this.db
      .select()
      .from(examResources)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(examResources.examKey), asc(examResources.sortOrder));
  }

  async createExamResource(dto: {
    examKey: string; resourceType: string; title: string;
    content?: string; resourceUrl?: string; eventDate?: string;
    isPublished?: boolean; sortOrder?: number;
  }) {
    const [row] = await this.db.insert(examResources).values({
      examKey: dto.examKey,
      resourceType: dto.resourceType,
      title: dto.title,
      ...(dto.content ? { content: dto.content } : {}),
      ...(dto.resourceUrl ? { resourceUrl: dto.resourceUrl } : {}),
      ...(dto.eventDate ? { eventDate: new Date(dto.eventDate) } : {}),
      isPublished: dto.isPublished ?? true,
      sortOrder: dto.sortOrder ?? 0,
    }).returning();
    return row;
  }

  async updateExamResource(id: string, dto: Partial<{
    examKey: string; resourceType: string; title: string;
    content: string; resourceUrl: string; eventDate: string;
    isPublished: boolean; sortOrder: number;
  }>) {
    const [row] = await this.db.update(examResources).set({
      ...(dto.examKey !== undefined ? { examKey: dto.examKey } : {}),
      ...(dto.resourceType !== undefined ? { resourceType: dto.resourceType } : {}),
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.content !== undefined ? { content: dto.content } : {}),
      ...(dto.resourceUrl !== undefined ? { resourceUrl: dto.resourceUrl } : {}),
      ...(dto.eventDate !== undefined ? { eventDate: new Date(dto.eventDate) } : {}),
      ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      updatedAt: new Date(),
    }).where(eq(examResources.id, id)).returning();
    if (!row) throw new NotFoundException('Kaynak bulunamadı');
    return row;
  }

  async deleteExamResource(id: string) {
    await this.db.delete(examResources).where(eq(examResources.id, id));
    return { deleted: true };
  }

  // ─── Site Settings ────────────────────────────────────────────────────────────

  async getSetting(key: string): Promise<Record<string, unknown> | null> {
    const [row] = await this.db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);
    if (!row) return null;
    try {
      return JSON.parse(row.value) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  // ─── Member City Distribution ─────────────────────────────────────────────────

  async getMemberCityStats(): Promise<{ city: string; count: number }[]> {
    const rows = await this.db
      .select({ city: userProfiles.city, count: count() })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(and(isNotNull(userProfiles.city), ne(userProfiles.city, '')))
      .groupBy(userProfiles.city)
      .orderBy(desc(count()));

    return rows
      .filter((r) => r.city !== null)
      .map((r) => ({ city: r.city!, count: Number(r.count) }));
  }

  async upsertSetting(key: string, value: Record<string, unknown>, updatedById: string) {
    const serialized = JSON.stringify(value);
    await this.db
      .insert(siteSettings)
      .values({ key, value: serialized, label: key, updatedBy: updatedById })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: serialized, updatedBy: updatedById, updatedAt: new Date() },
      });
    return { ok: true };
  }

  // ─── Talents ──────────────────────────────────────────────────────────────────

  async listTalents(opts: { approvedOnly?: boolean; category?: string } = {}) {
    const conditions = [];
    if (opts.approvedOnly) {
      conditions.push(eq(talents.status, 'approved'));
      conditions.push(eq(talents.isPublished, true));
    }
    if (opts.category) conditions.push(eq(talents.category, opts.category));

    return this.db
      .select()
      .from(talents)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(talents.createdAt));
  }

  async getTalent(id: string) {
    const [row] = await this.db.select().from(talents).where(eq(talents.id, id)).limit(1);
    if (!row) throw new NotFoundException('Yetenek bulunamadı');
    return row;
  }

  async createTalent(dto: CreateTalentDto, userId: string, membershipTier: string) {
    if (membershipTier === 'corporate_member') {
      throw new ForbiddenException('Kurumsal üyeler yetenek paylaşamaz.');
    }
    const [created] = await this.db
      .insert(talents)
      .values({
        userId,
        displayName: dto.displayName,
        category: dto.category,
        title: dto.title,
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.mediaUrl ? { mediaUrl: dto.mediaUrl } : {}),
        status: 'pending',
        isPublished: false,
      })
      .returning();
    return created;
  }

  async adminCreateTalent(dto: import('./dto/cms.dto').AdminCreateTalentDto) {
    const [created] = await this.db
      .insert(talents)
      .values({
        displayName: dto.displayName,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        mediaUrl: dto.mediaUrl,
        status: dto.status ?? 'approved',
        isPublished: dto.isPublished ?? false,
        adminNotes: dto.adminNotes,
      })
      .returning();
    return created;
  }

  async adminUpdateTalent(id: string, dto: AdminUpdateTalentDto) {
    const [updated] = await this.db
      .update(talents)
      .set({
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.adminNotes !== undefined ? { adminNotes: dto.adminNotes } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.mediaUrl !== undefined ? { mediaUrl: dto.mediaUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(talents.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Yetenek bulunamadı');
    return updated;
  }

  async deleteTalent(id: string) {
    const [deleted] = await this.db.delete(talents).where(eq(talents.id, id)).returning({ id: talents.id });
    if (!deleted) throw new NotFoundException('Yetenek bulunamadı');
    return { deleted: true };
  }
}
