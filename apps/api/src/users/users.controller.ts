import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { VALID_ACTION_IDS } from './level.utils';
import { REDIS_TOKEN } from '../redis/redis.constants';
import type Redis from 'ioredis';
import { StorageService } from '../storage/storage.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import type { Express } from 'express';
import { InjectDb } from '../database/inject-db.decorator';
import {
  userEvents,
  userEngagementScores,
  notifications,
  USER_EVENT_TYPES,
  EVENT_CATEGORIES,
  EVENT_ACTIONS,
  type Database,
  type EventCategory,
  type EventAction,
} from '@haritailesi/database';
import { eq, sql as drizzleSql } from 'drizzle-orm';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(100) displayName?: string;
  @IsOptional() @IsString() @MaxLength(300) bio?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(100) profession?: string;
  @IsOptional() @IsString() @MaxLength(200) linkedinUrl?: string;
  @IsOptional() @IsString() @MaxLength(200) websiteUrl?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(50, { each: true }) skillTags?: string[];
  @IsOptional() @IsString() @MaxLength(300) portfolioUrl?: string;
  avatarUrl?: string;
}

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
    @InjectDb() private readonly db: Database,
  ) {}

  @Post('me/heartbeat')
  @HttpCode(HttpStatus.NO_CONTENT)
  async heartbeat(@CurrentUser() user: RequestUser) {
    await this.redis.set(`presence:${user.id}`, '1', 'EX', 90);
  }

  @Throttle({ short: { ttl: 60_000, limit: 120 }, medium: { ttl: 600_000, limit: 500 } })
  @Post('me/actions')
  async recordAction(
    @CurrentUser() user: RequestUser,
    @Body() body: { actionId: string },
  ) {
    if (!body.actionId || typeof body.actionId !== 'string') return { completedActionIds: [] };
    if (!VALID_ACTION_IDS.has(body.actionId)) return { completedActionIds: [] };
    const completedActionIds = await this.usersService.recordLevelAction(user.id, body.actionId);
    return { completedActionIds };
  }

  @Throttle({ short: { ttl: 60_000, limit: 10 }, medium: { ttl: 600_000, limit: 30 } })
  @Post('me/actions/sync')
  async syncActions(
    @CurrentUser() user: RequestUser,
    @Body() body: { actionIds: string[] },
  ) {
    const ids = Array.isArray(body.actionIds)
      ? body.actionIds.filter((id): id is string => typeof id === 'string' && VALID_ACTION_IDS.has(id))
      : [];
    const completedActionIds = await this.usersService.syncLevelActions(user.id, ids);
    return { completedActionIds };
  }

  @Post('me/events')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackEvent(
    @CurrentUser() user: RequestUser,
    @Body() body: { eventType?: string; category?: string; action?: string; metadata?: Record<string, unknown> },
  ) {
    const record = this.buildEventRecord(body);
    if (!record) return;
    await this.db.insert(userEvents).values({ userId: user.id, ...record });
    await this.processEvents(user.id, [record]).catch(() => undefined);
  }

  @Post('me/events/batch')
  @HttpCode(HttpStatus.NO_CONTENT)
  async trackEventBatch(
    @CurrentUser() user: RequestUser,
    @Body() body: { events: Array<{ eventType?: string; category?: string; action?: string; metadata?: Record<string, unknown> }> },
  ) {
    if (!Array.isArray(body.events) || body.events.length === 0) return;
    const records = body.events.slice(0, 50).map(e => this.buildEventRecord(e)).filter((r): r is NonNullable<typeof r> => r !== null);
    if (records.length === 0) return;
    try {
      await this.db.insert(userEvents).values(records.map(r => ({ userId: user.id, ...r })));
    } catch (err) {
      this.logger.error(`events_batch_insert_failed user=${user.id} count=${records.length} err=${(err as Error).message}`);
      throw err;
    }
    await this.processEvents(user.id, records).catch((err) => {
      this.logger.warn(`events_batch_process_failed user=${user.id} err=${(err as Error).message}`);
    });
  }

  // ─── Aha score point table ─────────────────────────────────────────────────

  private readonly AHA_POINTS: Array<{ match: (cat?: string, act?: string, type?: string) => boolean; pts: number }> = [
    { match: (c, a) => c === 'onboarding'  && a === 'completed',  pts: 10 },
    { match: (c, a) => c === 'events'      && a === 'completed',  pts: 10 },
    { match: (c, a) => c === 'mentorship'  && a === 'matched',    pts: 15 },
    { match: (c, a) => c === 'retention'   && a === 'returned',   pts: 20 },
    { match: (c, a) => c === 'content'     && a === 'completed',  pts:  5 },
    { match: (c, a) => c === 'community'   && a === 'completed',  pts:  5 },
    { match: (_, __, t) => t === 'first_event_joined',            pts: 10 },
    { match: (_, __, t) => t === 'mentor_request_sent',           pts: 15 },
    { match: (_, __, t) => t === 'first_post_created',            pts:  5 },
    { match: (_, __, t) => t === '7_day_return',                  pts: 20 },
    { match: (_, __, t) => t === '30_day_return',                 pts: 30 },
    { match: (_, __, t) => t === 'onboarding_step_completed',     pts:  3 },
  ];

  // Behavioral automation rules: (category, action, eventType) → notification
  private readonly AUTOMATION_RULES: Array<{
    match: (cat?: string, act?: string, type?: string) => boolean;
    notification: { type: string; title: string; body: string };
  }> = [
    {
      match: (c, a) => c === 'onboarding' && a === 'abandoned',
      notification: {
        type:  'reactivation_prompt',
        title: "Haritailesi'ni kesfetmeye devam et",
        body:  'Profilini tamamlayip topluluğa katilmak için hazır misin?',
      },
    },
    {
      match: (c, a) => c === 'content' && a === 'completed',
      notification: {
        type:  'celebrate_first_post',
        title: 'İlk gönderini paylaştın!',
        body:  'Haritailesi topluluğuna katkıda bulunduğun için teşekkürler.',
      },
    },
    {
      match: (c, a) => c === 'mentorship' && a === 'matched',
      notification: {
        type:  'mentor_match_levelup',
        title: 'Mentörünle tanıştın!',
        body:  "Bu baglanti kariyerinde onemli bir adim. Haritailesi'nde yeni bir seviyeye gectin!",
      },
    },
  ];

  private buildEventRecord(raw: { eventType?: string; category?: string; action?: string; metadata?: Record<string, unknown> }): {
    eventType: string;
    category?: EventCategory;
    action?: EventAction;
    metadata?: Record<string, unknown>;
  } | null {
    const validTypes = new Set<string>(USER_EVENT_TYPES);
    const validCats  = new Set<string>(EVENT_CATEGORIES);
    const validActs  = new Set<string>(EVENT_ACTIONS);

    const hasStructured = raw.category && raw.action && validCats.has(raw.category) && validActs.has(raw.action);
    const hasLegacy     = raw.eventType && validTypes.has(raw.eventType);

    if (!hasStructured && !hasLegacy) return null;

    return {
      eventType: hasStructured ? `${raw.category}:${raw.action}` : (raw.eventType as string),
      ...(hasStructured ? { category: raw.category as EventCategory, action: raw.action as EventAction } : {}),
      ...(raw.metadata ? { metadata: raw.metadata } : {}),
    };
  }

  private async processEvents(
    userId: string,
    records: Array<{ eventType: string; category?: EventCategory; action?: EventAction; metadata?: Record<string, unknown> }>,
  ) {
    // ── Aha score update ──────────────────────────────────────────────────
    let delta = 0;
    for (const r of records) {
      for (const rule of this.AHA_POINTS) {
        if (rule.match(r.category, r.action, r.eventType)) {
          delta += rule.pts;
          break; // one rule per event
        }
      }
    }

    if (delta > 0) {
      await this.db
        .insert(userEngagementScores)
        .values({ userId, ahaScore: delta, lastComputedAt: new Date() })
        .onConflictDoUpdate({
          target: userEngagementScores.userId,
          set: {
            ahaScore:       drizzleSql`${userEngagementScores.ahaScore} + ${delta}`,
            lastComputedAt: drizzleSql`now()`,
          },
        });

      // Check if aha threshold reached
      const [score] = await this.db
        .select({ ahaScore: userEngagementScores.ahaScore, ahaReached: userEngagementScores.ahaReached })
        .from(userEngagementScores)
        .where(eq(userEngagementScores.userId, userId));

      if (score && score.ahaScore >= 30 && !score.ahaReached) {
        await this.db
          .update(userEngagementScores)
          .set({ ahaReached: true })
          .where(eq(userEngagementScores.userId, userId));
        await this.db.insert(userEvents).values({
          userId,
          eventType: 'aha_moment_triggered',
          category:  'engagement',
          action:    'completed',
          metadata:  { source: 'auto_score', score: score.ahaScore },
        });
      }
    }

    // ── Behavioral automations ────────────────────────────────────────────
    for (const r of records) {
      for (const rule of this.AUTOMATION_RULES) {
        if (rule.match(r.category, r.action, r.eventType)) {
          await this.db.insert(notifications).values({
            userId,
            type:  rule.notification.type,
            title: rule.notification.title,
            body:  rule.notification.body,
          }).catch(() => undefined); // never fail on notification insert
          break;
        }
      }
    }
  }

  @Get('me')
  getMe(@CurrentUser() user: RequestUser) {
    return this.usersService.getMe(user.id);
  }

  @Get('me/stats')
  getMyStats(@CurrentUser() user: RequestUser) {
    return this.usersService.getMyStats(user.id);
  }

  @Get('me/suggested')
  @RequirePermission('feed.read')
  getSuggestedMembers(@CurrentUser() user: RequestUser) {
    return this.usersService.getSuggestedMembers(user.id);
  }

  @Patch('me/profile')
  @RequirePermission('user.profile.update_own')
  updateProfile(@CurrentUser() user: RequestUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/snd-subscribe')
  @HttpCode(HttpStatus.OK)
  toggleSndSubscribe(
    @CurrentUser() user: RequestUser,
    @Body('subscribed') subscribed: boolean,
  ) {
    return this.usersService.setSndSubscribed(user.id, !!subscribed);
  }

  @Post('me/avatar')
  @RequirePermission('user.profile.update_own')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async uploadAvatar(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Dosya gereklidir.');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Sadece JPEG, PNG, WebP veya GIF yüklenebilir.');
    }

    const { url } = await this.storageService.upload(file.buffer, {
      folder: 'avatars',
      originalFilename: file.originalname,
      mimeType: file.mimetype,
    });

    await this.usersService.updateProfile(user.id, { avatarUrl: url });
    return { avatarUrl: url };
  }

  @Public()
  @Get('public/:id')
  getPublicMember(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getSndPublicProfile(id);
  }

  @Get('members')
  listMembers(@Query('q') q?: string) {
    return this.usersService.listMembers(q);
  }

  @Get(':id')
  @RequirePermission('user.profile.read')
  getMember(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.getPublicProfile(id, user.id);
  }

  @Post(':id/follow')
  @RequirePermission('user.profile.read')
  follow(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.follow(user.id, id);
  }

  @Delete(':id/follow')
  @RequirePermission('user.profile.read')
  @HttpCode(HttpStatus.OK)
  unfollow(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.unfollow(user.id, id);
  }

  @Get(':id/followers')
  @RequirePermission('user.profile.read')
  getFollowers(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getFollowers(id);
  }

  @Get(':id/following')
  @RequirePermission('user.profile.read')
  getFollowing(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getFollowing(id);
  }
}
