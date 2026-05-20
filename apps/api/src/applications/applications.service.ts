import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { applications, applicationStateLogs, users, userFunctionalRoles } from '@haritailesi/database';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { getTransition, getValidNextStates } from './state-machine';
import type { CreateApplicationDto, TransitionStateDto } from './dto/create-application.dto';
import type { RequestUser } from '../auth/auth.types';
import type { CursorPage } from '@haritailesi/types';
import { can } from '../rbac/permissions';

const PAGE_SIZE = 20;

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Public: Submit Application ─────────────────────────────────────────────

  async submit(dto: CreateApplicationDto): Promise<{ id: string; state: string }> {
    const [app] = await this.db
      .insert(applications)
      .values({
        type: dto.type,
        applicantEmail: dto.applicantEmail.toLowerCase(),
        state: 'submitted',
        formData: dto.formData,
      })
      .returning({ id: applications.id, state: applications.state });

    if (!app) throw new Error('Application creation failed');

    // State log
    await this.db.insert(applicationStateLogs).values({
      applicationId: app.id,
      fromState: null,
      toState: 'submitted',
      reason: 'Initial submission',
    });

    // Email confirmation
    const displayName = this.extractDisplayName(dto.formData);
    await this.emailService.sendApplicationSubmitted(dto.applicantEmail, displayName);

    // Provisionary follow-up emails (T+2, T+5, T+10 gün)
    const DAY = 24 * 60 * 60 * 1000;
    await this.emailService.sendProvisionaryFollowup(dto.applicantEmail, displayName, 2, 2 * DAY);
    await this.emailService.sendProvisionaryFollowup(dto.applicantEmail, displayName, 5, 5 * DAY);
    await this.emailService.sendProvisionaryFollowup(dto.applicantEmail, displayName, 10, 10 * DAY);

    await this.auditService.log({
      action: 'application.submitted',
      entityType: 'application',
      entityId: app.id,
      afterState: { type: dto.type, email: dto.applicantEmail, state: 'submitted' },
    });

    return app;
  }

  // ─── Public: Get Own Application Status ─────────────────────────────────────

  async getStatusByEmail(email: string) {
    return this.db.query.applications.findMany({
      where: eq(applications.applicantEmail, email.toLowerCase()),
      columns: {
        id: true,
        type: true,
        state: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [desc(applications.createdAt)],
    });
  }

  // ─── Admin: List Applications ────────────────────────────────────────────────

  async list(params: {
    type?: string;
    state?: string;
    cursor?: string;
    limit?: number;
  }): Promise<CursorPage<typeof applications.$inferSelect>> {
    const limit = Math.min(params.limit ?? PAGE_SIZE, 100);

    const conditions = [];
    if (params.type) conditions.push(sql`${applications.type} = ${params.type}`);
    if (params.state) conditions.push(eq(applications.state, params.state));
    if (params.cursor) conditions.push(sql`${applications.createdAt} < (SELECT created_at FROM applications WHERE id = ${params.cursor})`);

    const rows = await this.db.query.applications.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(applications.createdAt)],
      limit: limit + 1,
    });

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);

    return {
      data,
      next_cursor: hasMore ? (data[data.length - 1]?.id ?? null) : null,
      has_more: hasMore,
    };
  }

  // ─── Admin: Get Application Detail ──────────────────────────────────────────

  async findById(id: string) {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
    });

    if (!app) throw new NotFoundException('Başvuru bulunamadı.');

    const stateLogs = await this.db.query.applicationStateLogs.findMany({
      where: eq(applicationStateLogs.applicationId, id),
      orderBy: [desc(applicationStateLogs.createdAt)],
    });

    const validNextStates = getValidNextStates(app.type, app.state);

    return { ...app, stateLogs, validNextStates };
  }

  // ─── Admin: Transition State ─────────────────────────────────────────────────

  async transitionState(
    id: string,
    dto: TransitionStateDto,
    actor: RequestUser,
  ): Promise<typeof applications.$inferSelect> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
    });

    if (!app) throw new NotFoundException('Başvuru bulunamadı.');

    const transition = getTransition(app.type, app.state, dto.toState);

    if (!transition) {
      throw new BadRequestException(
        `'${app.state}' → '${dto.toState}' geçişi bu başvuru tipi için geçerli değil.`,
      );
    }

    if (!can(actor, transition.requiredPermission)) {
      throw new ForbiddenException('Bu state geçişi için yetkiniz yok.');
    }

    const [updated] = await this.db
      .update(applications)
      .set({ state: dto.toState, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();

    if (!updated) throw new Error('Update failed');

    // State log
    await this.db.insert(applicationStateLogs).values({
      applicationId: id,
      fromState: app.state,
      toState: dto.toState,
      triggeredBy: actor.id,
      reason: dto.reason ?? null,
      metadata: dto.metadata ?? null,
    });

    // Email trigger
    if (transition.emailTrigger) {
      const displayName = this.extractDisplayName(app.formData as Record<string, unknown>);
      try {
        await this.emailService.send(app.applicantEmail, transition.emailTrigger, { displayName });
        this.logger.log(`email_queued template=${transition.emailTrigger} to=${app.applicantEmail} app=${id} transition=${app.state}→${dto.toState}`);
      } catch (err) {
        // Email kuyruğa eklenemedi — transition'ı bloklamıyoruz, log yeterli
        this.logger.error(`email_queue_failed template=${transition.emailTrigger} to=${app.applicantEmail} app=${id} err=${(err as Error).message}`);
      }
    }

    // Push / SSE notification — mevcut kullanıcı hesabı varsa gönder
    if (transition.push && app.applicantUserId) {
      await this.notificationsService.create(app.applicantUserId, {
        type: 'application_state_changed',
        title: transition.push.title,
        body: transition.push.body,
        data: { applicationId: id, toState: dto.toState },
      });
    }

    // Hesap oluşturma — active'e geçişte kullanıcı kaydı ve şifre kurulum e-postası
    if (dto.toState === 'active' && (app.type === 'individual' || app.type === 'corporate' || app.type === 'haritailesi_genc')) {
      const formData = app.formData as Record<string, unknown>;
      const displayName = this.extractDisplayName(formData);

      let userId: string;
      try {
        userId = await this.usersService.createFromApplication({
          type: app.type,
          applicantEmail: app.applicantEmail,
          formData,
        });
      } catch (err) {
        // Aynı e-posta ile kayıt varsa mevcut kullanıcıyı al
        const existing = await this.db.query.users.findFirst({
          where: eq(users.email, app.applicantEmail.toLowerCase()),
          columns: { id: true },
        });
        if (!existing) throw err;
        userId = existing.id;
        this.logger.warn(`account_setup_existing_user email=${app.applicantEmail} userId=${userId} app=${id}`);
      }

      // Setup token + e-posta
      try {
        const setupToken = await this.authService.createSetupToken(userId);
        const webUrl = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';
        const setupUrl = `${webUrl}/sifre-belirle?token=${setupToken}`;
        await this.emailService.sendAccountSetup(app.applicantEmail, displayName, setupToken, setupUrl);
        this.logger.log(`account_setup_queued userId=${userId} email=${app.applicantEmail} app=${id}`);
      } catch (err) {
        this.logger.error(`account_setup_failed userId=${userId} email=${app.applicantEmail} app=${id} err=${(err as Error).message}`);
      }

      // Başvuruyu kullanıcıya bağla
      await this.db
        .update(applications)
        .set({ applicantUserId: userId })
        .where(eq(applications.id, id));
    }

    // Audit log
    await this.auditService.log({
      actor,
      action: 'application.state_transition',
      entityType: 'application',
      entityId: id,
      beforeState: { state: app.state },
      afterState: { state: dto.toState },
    });

    return updated;
  }

  // ─── Admin: Update Notes ─────────────────────────────────────────────────────

  async updateNotes(id: string, adminNotes: string, actor: RequestUser): Promise<void> {
    const exists = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
      columns: { id: true },
    });

    if (!exists) throw new NotFoundException('Başvuru bulunamadı.');

    await this.db
      .update(applications)
      .set({ adminNotes, updatedAt: new Date() })
      .where(eq(applications.id, id));

    await this.auditService.log({
      actor,
      action: 'application.notes_updated',
      entityType: 'application',
      entityId: id,
    });
  }

  // ─── Admin: Resend Account Setup Email ──────────────────────────────────────

  async resendAccountSetup(id: string): Promise<void> {
    const app = await this.db.query.applications.findFirst({
      where: eq(applications.id, id),
    });
    if (!app) throw new NotFoundException('Başvuru bulunamadı.');
    if (app.state !== 'active') {
      throw new BadRequestException('Hesap kurulum e-postası yalnızca aktif başvurular için gönderilebilir.');
    }

    const existing = await this.db.query.users.findFirst({
      where: eq(users.email, app.applicantEmail.toLowerCase()),
      columns: { id: true },
    });
    if (!existing) {
      throw new BadRequestException('Bu başvuruya ait kullanıcı hesabı bulunamadı. Önce başvuruyu aktif yapın.');
    }

    const displayName = this.extractDisplayName(app.formData as Record<string, unknown>);
    const setupToken = await this.authService.createSetupToken(existing.id);
    const webUrl = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';
    const setupUrl = `${webUrl}/sifre-belirle?token=${setupToken}`;
    await this.emailService.sendAccountSetup(app.applicantEmail, displayName, setupToken, setupUrl);
    this.logger.log(`account_setup_resent userId=${existing.id} email=${app.applicantEmail} app=${id}`);
  }

  // ─── SLA: Hareketsiz Başvurular ───────────────────────────────────────────────

  async getStuckApplications(): Promise<Array<{
    id: string; type: string; state: string; applicantEmail: string;
    formData: Record<string, unknown>; updatedAt: Date; daysStuck: number;
  }>> {
    const rows = await this.db.execute<{
      id: string; type: string; state: string; applicant_email: string;
      form_data: Record<string, unknown>; updated_at: Date;
    }>(sql`
      SELECT id, type, state, applicant_email, form_data, updated_at
      FROM applications
      WHERE deleted_at IS NULL
        AND state NOT IN ('rejected', 'active', 'passive', 'program_completed')
        AND (
          (state = 'submitted'        AND updated_at < NOW() - INTERVAL '2 days')  OR
          (state = 'under_review'     AND updated_at < NOW() - INTERVAL '5 days')  OR
          (state = 'interview_needed' AND updated_at < NOW() - INTERVAL '5 days')  OR
          (state = 'waiting_payment'  AND updated_at < NOW() - INTERVAL '3 days')  OR
          (state = 'approved'         AND updated_at < NOW() - INTERVAL '2 days')
        )
      ORDER BY updated_at ASC
    `);

    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      state: r.state,
      applicantEmail: r.applicant_email,
      formData: r.form_data as Record<string, unknown>,
      updatedAt: new Date(r.updated_at),
      daysStuck: Math.floor((Date.now() - new Date(r.updated_at).getTime()) / 86_400_000),
    }));
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private extractDisplayName(formData: Record<string, unknown>): string {
    const name = formData['adSoyad'] ?? formData['ad_soyad'] ?? formData['displayName'];
    return typeof name === 'string' ? name : 'Başvuran';
  }
}
