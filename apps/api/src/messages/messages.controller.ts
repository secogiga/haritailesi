import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Req, Sse } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { Observable } from 'rxjs';
import { MessagesService } from './messages.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import type { Request as ExpressRequest } from 'express';

class SendMessageDto {
  @IsString()
  @MaxLength(2000)
  body!: string;
}

@ApiTags('messages')
@ApiBearerAuth('access-token')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Sse('stream')
  stream(@CurrentUser() user: RequestUser, @Req() req: ExpressRequest): Observable<MessageEvent> {
    const subject = this.messagesService.getStream(user.id);
    req.on('close', () => this.messagesService.closeStream(user.id));
    return subject.asObservable();
  }

  @Get()
  getThreads(@CurrentUser() user: RequestUser) {
    return this.messagesService.getThreads(user.id);
  }

  @Get(':userId')
  getMessages(
    @CurrentUser() user: RequestUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.messagesService.getMessages(user.id, userId);
  }

  @Post(':userId')
  sendMessage(
    @CurrentUser() user: RequestUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(user.id, userId, dto.body);
  }

  @Patch(':userId/read')
  @HttpCode(HttpStatus.OK)
  markRead(
    @CurrentUser() user: RequestUser,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.messagesService.markThreadRead(user.id, userId);
  }
}
