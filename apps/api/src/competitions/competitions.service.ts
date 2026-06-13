import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { competitions, competitionApplications, users } from '@haritailesi/database';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly storage: StorageService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
  ) {}

  async listPublic() {
    const rows = await this.db
      .select()
      .from(competitions)
      .where(inArray(competitions.status, ['active', 'ended']))
      .orderBy(desc(competitions.deadline));

    return this.attachPosterUrls(rows);
  }

  async listAll(status?: string) {
    const where = status ? eq(competitions.status, status) : undefined;
    const rows = await this.db
      .select()
      .from(competitions)
      .where(where)
      .orderBy(desc(competitions.createdAt));
    return this.attachPosterUrls(rows);
  }

  async findBySlug(slug: string) {
    const [row] = await this.db.select().from(competitions).where(eq(competitions.slug, slug));
    if (!row) throw new NotFoundException('Yarışma bulunamadı.');
    if (row.status === 'active') {
      void this.db
        .update(competitions)
        .set({ viewCount: sql`${competitions.viewCount} + 1` })
        .where(eq(competitions.slug, slug))
        .catch(() => {});
    }
    return this.attachPosterUrl(row);
  }

  async findById(id: string) {
    const [row] = await this.db.select().from(competitions).where(eq(competitions.id, id));
    if (!row) throw new NotFoundException('Yarışma bulunamadı.');
    return this.attachPosterUrl(row);
  }

  async create(data: {
    title: string; slug: string; description?: string; deadline?: string;
    prizes?: string; category?: string; status?: string; createdBy?: string;
  }) {
    const existing = await this.db.select({ id: competitions.id })
      .from(competitions).where(eq(competitions.slug, data.slug));
    if (existing.length) throw new BadRequestException('Bu slug zaten kullanımda.');

    const [created] = await this.db.insert(competitions).values({
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    }).returning();
    return this.attachPosterUrl(created!);
  }

  async update(id: string, data: {
    title?: string; description?: string; deadline?: string; prizes?: string;
    category?: string; status?: string; winnersText?: string;
  }) {
    const [updated] = await this.db
      .update(competitions)
      .set({ ...data, deadline: data.deadline ? new Date(data.deadline) : undefined, updatedAt: new Date() })
      .where(eq(competitions.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Yarışma bulunamadı.');
    return this.attachPosterUrl(updated);
  }

  async uploadPoster(id: string, file: Express.Multer.File) {
    const competition = await this.findById(id);

    // Delete old poster if exists
    if (competition.posterKey) {
      await this.storage.delete(competition.posterKey).catch(() => {});
    }

    const { key } = await this.storage.upload(file.buffer, {
      folder: 'competition-posters',
      originalFilename: file.originalname,
      mimeType: file.mimetype,
    });

    await this.db.update(competitions)
      .set({ posterKey: key, updatedAt: new Date() })
      .where(eq(competitions.id, id));

    return { key, url: await this.storage.getSignedUrl(key) };
  }

  async apply(competitionId: string, data: {
    email: string; displayName: string; notes?: string; source?: string; userId?: string; emailToken?: string;
  }) {
    await this.otpService.consumeToken(data.emailToken, data.email);

    const competition = await this.findById(competitionId);
    if (competition.status !== 'active') {
      throw new BadRequestException('Bu yarışma başvuruya açık değil.');
    }
    if (competition.deadline && new Date(competition.deadline) < new Date()) {
      throw new BadRequestException('Başvuru süresi dolmuş.');
    }

    const [app] = await this.db.insert(competitionApplications).values({
      competitionId,
      email: data.email,
      displayName: data.displayName,
      notes: data.notes,
      source: data.source ?? 'sahne',
      userId: data.userId,
    }).returning();

    // Increment cached count
    await this.db.update(competitions)
      .set({ applicationCount: sql`CAST(CAST(application_count AS INTEGER) + 1 AS TEXT)`, updatedAt: new Date() })
      .where(eq(competitions.id, competitionId));

    return app;
  }

  async uploadApplicationFile(appId: string, file: Express.Multer.File) {
    const [app] = await this.db.select().from(competitionApplications).where(eq(competitionApplications.id, appId));
    if (!app) throw new NotFoundException('Başvuru bulunamadı.');

    if (app.fileKey) {
      await this.storage.delete(app.fileKey).catch(() => {});
    }

    const { key } = await this.storage.upload(file.buffer, {
      folder: 'competition-files',
      originalFilename: file.originalname,
      mimeType: file.mimetype,
    });

    await this.db.update(competitionApplications)
      .set({ fileKey: key, fileName: file.originalname })
      .where(eq(competitionApplications.id, appId));

    return { key, url: await this.storage.getSignedUrl(key) };
  }

  async listApplications(competitionId: string) {
    const rows = await this.db.select().from(competitionApplications)
      .where(eq(competitionApplications.competitionId, competitionId))
      .orderBy(desc(competitionApplications.createdAt));

    return Promise.all(rows.map(async (app) => ({
      ...app,
      fileUrl: app.fileKey ? await this.storage.getSignedUrl(app.fileKey).catch(() => null) : null,
    })));
  }

  async updateApplicationStatus(appId: string, status: string) {
    const [updated] = await this.db.update(competitionApplications)
      .set({ status })
      .where(eq(competitionApplications.id, appId))
      .returning();
    if (!updated) throw new NotFoundException('Başvuru bulunamadı.');

    if (status === 'winner') {
      const [comp] = await this.db.select({ title: competitions.title })
        .from(competitions).where(eq(competitions.id, updated.competitionId));
      if (comp) {
        void this.emailService.sendCompetitionResultWinner(
          updated.email,
          updated.displayName,
          comp.title,
        ).catch(() => {});
      }

      // Tier upgrade — winner'ı en az individual_member seviyesine çek
      if (updated.userId) {
        const [currentUser] = await this.db.select({ membershipTier: users.membershipTier })
          .from(users).where(eq(users.id, updated.userId));

        const TIER_RANK: Record<string, number> = {
          registered_user: 0, new_graduate_member: 1, individual_member: 2, corporate_member: 3,
        };
        const current = currentUser?.membershipTier ?? 'registered_user';
        const targetTier = 'individual_member';

        if ((TIER_RANK[current] ?? 0) < (TIER_RANK[targetTier] ?? 0)) {
          const oneYear = new Date();
          oneYear.setFullYear(oneYear.getFullYear() + 1);
          await this.db.update(users)
            .set({ membershipTier: targetTier, membershipExpiresAt: oneYear, updatedAt: new Date() })
            .where(eq(users.id, updated.userId));
        }
      }
    }

    return updated;
  }

  async updateApplicationJury(appId: string, juryScore: number | null, juryNotes: string | null) {
    const [updated] = await this.db.update(competitionApplications)
      .set({ juryScore, juryNotes })
      .where(eq(competitionApplications.id, appId))
      .returning();
    if (!updated) throw new NotFoundException('Başvuru bulunamadı.');
    return updated;
  }

  async getMyApplications(userId: string) {
    const rows = await this.db
      .select({
        applicationId: competitionApplications.id,
        competitionId: competitions.id,
        title: competitions.title,
        slug: competitions.slug,
        deadline: competitions.deadline,
        status: competitionApplications.status,
        juryScore: competitionApplications.juryScore,
        appliedAt: competitionApplications.createdAt,
      })
      .from(competitionApplications)
      .innerJoin(competitions, eq(competitionApplications.competitionId, competitions.id))
      .where(eq(competitionApplications.userId, userId))
      .orderBy(desc(competitionApplications.createdAt));
    return rows;
  }

  private async attachPosterUrl(c: typeof competitions.$inferSelect) {
    return {
      ...c,
      posterUrl: c.posterKey ? await this.storage.getSignedUrl(c.posterKey).catch(() => null) : null,
    };
  }

  private async attachPosterUrls(rows: (typeof competitions.$inferSelect)[]) {
    return Promise.all(rows.map((c) => this.attachPosterUrl(c)));
  }
}
