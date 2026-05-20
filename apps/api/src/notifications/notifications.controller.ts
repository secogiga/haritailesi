import { Body, Controller, Delete, Get, OnModuleDestroy, Patch, Post, Req, Sse } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Observable, fromEvent } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController implements OnModuleDestroy {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('my')
  getMyNotifications(@CurrentUser() user: RequestUser) {
    return this.notificationsService.getForUser(user.id);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: RequestUser) {
    return this.notificationsService.unreadCount(user.id);
  }

  @Patch('mark-read')
  markAllRead(@CurrentUser() user: RequestUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Get('preferences')
  getPreferences(@CurrentUser() user: RequestUser) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: RequestUser,
    @Body() body: Record<string, boolean>,
  ) {
    return this.notificationsService.updatePreferences(user.id, body);
  }

  @Post('push-subscribe')
  subscribePush(
    @CurrentUser() user: RequestUser,
    @Body() body: { endpoint: string; p256dh: string; auth: string },
  ) {
    return this.notificationsService.savePushSubscription(user.id, body);
  }

  @Delete('push-subscribe')
  unsubscribePush(
    @CurrentUser() user: RequestUser,
    @Body() body: { endpoint: string },
  ) {
    return this.notificationsService.deletePushSubscription(user.id, body.endpoint);
  }

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: process.env.VAPID_PUBLIC_KEY ?? '' };
  }

  @Sse('stream')
  stream(@CurrentUser() user: RequestUser, @Req() req: Request): Observable<MessageEvent> {
    const subject = this.notificationsService.getStream(user.id);

    // Close stream when client disconnects
    req.on('close', () => this.notificationsService.closeStream(user.id));

    return subject.asObservable();
  }

  onModuleDestroy(): void {
    // Cleanup handled per-connection
  }
}
