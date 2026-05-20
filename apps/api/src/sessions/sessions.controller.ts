import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { IsIn, IsUUID } from 'class-validator';
import { SessionsService } from './sessions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';

const REFERENCE_TYPES = ['mentorship'] as const;

class StartSessionDto {
  @IsIn(REFERENCE_TYPES)
  referenceType!: 'mentorship';

  @IsUUID()
  referenceId!: string;
}

class SessionEventDto {
  @IsIn(['join', 'leave'])
  type!: 'join' | 'leave';
}

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  // Seans başlat veya mevcut seansı getir
  @Post('start')
  @RequirePermission('feed.read') // giriş yapmış herhangi bir üye
  async startSession(
    @CurrentUser() user: RequestUser,
    @Body() dto: StartSessionDto,
  ) {
    return this.sessionsService.startOrGetSession(user.id, dto.referenceType, dto.referenceId);
  }

  // Jitsi IFrame'den gelen join/leave event'ı kaydet
  @Post(':id/events')
  @RequirePermission('feed.read')
  async recordEvent(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() dto: SessionEventDto,
  ) {
    if (dto.type === 'join') {
      await this.sessionsService.recordJoin(sessionId, user.id);
    } else {
      await this.sessionsService.recordLeave(sessionId, user.id);
    }
    return { ok: true };
  }

  // Kullanıcının yaklaşan mentörlük seansları (Seanslarım sayfası)
  @Get('my-upcoming')
  @RequirePermission('mentor.request')
  async myUpcoming(@CurrentUser() user: RequestUser) {
    return this.sessionsService.getMyUpcomingMentorshipSessions(user.id);
  }

  // Tamamlanmış ama değerlendirilmemiş seanslar
  @Get('my-to-rate')
  @RequirePermission('mentor.request')
  async myToRate(@CurrentUser() user: RequestUser) {
    return this.sessionsService.getMyUnratedSessions(user.id);
  }

  // Seans bilgisi (room_name dahil)
  @Get()
  @RequirePermission('feed.read')
  async getSession(
    @Query('type') referenceType: string,
    @Query('ref') referenceId: string,
  ) {
    return this.sessionsService.getSession(referenceType, referenceId);
  }
}
