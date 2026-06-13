import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { RequirePermission } from '../rbac/rbac.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { users, userProfiles, adminBroadcasts } from '@haritailesi/database';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { MessagesService } from '../messages/messages.service';
import type { RequestUser } from '../auth/auth.types';

const VALID_TIERS = [
  'registered_user',
  'haritailesi_genc',
  'new_graduate_member',
  'individual_member',
  'corporate_member',
] as const;

class SendBroadcastDto {
  @IsIn(['user', 'tier', 'all'])
  target!: 'user' | 'tier' | 'all';

  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @IsOptional()
  @IsIn(VALID_TIERS)
  targetTier?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  subject!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  sendEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  sendNotification?: boolean;
}

class SendInboxMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}

@Controller('admin/messages')
export class AdminMessagesController {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly messagesService: MessagesService,
  ) {}

  // ─── Broadcast ────────────────────────────────────────────────────────────────

  @Post('send')
  @RequirePermission('user.manage')
  async sendBroadcast(@CurrentUser() admin: RequestUser, @Body() dto: SendBroadcastDto) {
    const sendEmail = dto.sendEmail ?? true;
    const sendNotification = dto.sendNotification ?? true;

    // Resolve target users
    let targets: Array<{ id: string; email: string; displayName: string }> = [];

    if (dto.target === 'user' && dto.targetUserId) {
      const rows = await this.db
        .select({ id: users.id, email: users.email, displayName: userProfiles.displayName })
        .from(users)
        .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(and(eq(users.id, dto.targetUserId), isNull(users.deletedAt)));
      targets = rows.map((r) => ({ ...r, displayName: r.displayName ?? 'Değerli Üye' }));
    } else if (dto.target === 'tier' && dto.targetTier) {
      const rows = await this.db
        .select({ id: users.id, email: users.email, displayName: userProfiles.displayName })
        .from(users)
        .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(
          and(
            eq(users.membershipTier, dto.targetTier as typeof VALID_TIERS[number]),
            eq(users.status, 'active'),
            isNull(users.deletedAt),
          ),
        );
      targets = rows.map((r) => ({ ...r, displayName: r.displayName ?? 'Değerli Üye' }));
    } else if (dto.target === 'all') {
      const rows = await this.db
        .select({ id: users.id, email: users.email, displayName: userProfiles.displayName })
        .from(users)
        .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(and(eq(users.status, 'active'), isNull(users.deletedAt)));
      targets = rows.map((r) => ({ ...r, displayName: r.displayName ?? 'Değerli Üye' }));
    }

    // Fan out — fire and forget for performance
    await Promise.all(
      targets.map(async (t) => {
        if (sendNotification) {
          void this.notificationsService.create(t.id, {
            type: 'admin_message',
            title: dto.subject,
            body: dto.body.length > 120 ? dto.body.slice(0, 120) + '…' : dto.body,
          });
        }
        if (sendEmail) {
          void this.emailService.sendAdminBroadcast(t.email, t.displayName, dto.subject, dto.body);
        }
      }),
    );

    // Persist broadcast log
    await this.db.insert(adminBroadcasts).values({
      adminId: admin.id,
      target: dto.target,
      targetTier: dto.target === 'tier' ? (dto.targetTier ?? null) : null,
      targetUserId: dto.target === 'user' ? (dto.targetUserId ?? null) : null,
      subject: dto.subject,
      body: dto.body,
      sentCount: targets.length,
      sentEmail: sendEmail,
      sentNotification: sendNotification,
    });

    return { sent: targets.length };
  }

  @Get('history')
  @RequirePermission('user.manage')
  async getHistory() {
    const rows = await this.db
      .select({
        id: adminBroadcasts.id,
        target: adminBroadcasts.target,
        targetTier: adminBroadcasts.targetTier,
        subject: adminBroadcasts.subject,
        body: adminBroadcasts.body,
        sentCount: adminBroadcasts.sentCount,
        sentEmail: adminBroadcasts.sentEmail,
        sentNotification: adminBroadcasts.sentNotification,
        createdAt: adminBroadcasts.createdAt,
        adminDisplayName: userProfiles.displayName,
      })
      .from(adminBroadcasts)
      .leftJoin(userProfiles, eq(userProfiles.userId, adminBroadcasts.adminId))
      .orderBy(desc(adminBroadcasts.createdAt))
      .limit(50);

    return rows;
  }

  @Get('preview-count')
  @RequirePermission('user.manage')
  async previewCount(
    @Query('target') target: string,
    @Query('targetTier') targetTier?: string,
    @Query('targetUserId') targetUserId?: string,
  ): Promise<{ count: number }> {
    if (target === 'user' && targetUserId) {
      const rows = await this.db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, targetUserId), isNull(users.deletedAt)));
      return { count: rows.length };
    }
    if (target === 'tier' && targetTier) {
      const rows = await this.db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.membershipTier, targetTier as typeof VALID_TIERS[number]),
            eq(users.status, 'active'),
            isNull(users.deletedAt),
          ),
        );
      return { count: rows.length };
    }
    if (target === 'all') {
      const rows = await this.db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.status, 'active'), isNull(users.deletedAt)));
      return { count: rows.length };
    }
    return { count: 0 };
  }

  // ─── Direct Message Inbox ─────────────────────────────────────────────────────

  @Get('inbox')
  @RequirePermission('user.manage')
  async getInboxThreads(@CurrentUser() admin: RequestUser) {
    return this.messagesService.getThreads(admin.id);
  }

  @Get('inbox/:userId')
  @RequirePermission('user.manage')
  async getInboxMessages(
    @CurrentUser() admin: RequestUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.messagesService.getMessages(admin.id, userId, {
      ...(limit ? { limit: parseInt(limit, 10) } : {}),
      ...(before ? { before } : {}),
    });
  }

  @Post('inbox/:userId')
  @RequirePermission('user.manage')
  async sendInboxMessage(
    @CurrentUser() admin: RequestUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SendInboxMessageDto,
  ) {
    return this.messagesService.sendMessage(admin.id, userId, dto.body);
  }

  @Delete('inbox/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('user.manage')
  async deleteInboxThread(
    @CurrentUser() admin: RequestUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.messagesService.deleteThread(admin.id, userId);
  }
}
