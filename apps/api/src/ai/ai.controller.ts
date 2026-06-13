import { Controller, Post, Get, Body, Param, Req } from '@nestjs/common';
import { IsString, IsOptional, IsUUID, MaxLength, IsIn } from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';
import { AiService } from './ai.service';
import type { Request } from 'express';

class ChatDto {
  @IsString() @MaxLength(2000)
  message!: string;

  @IsOptional() @IsUUID()
  conversationId?: string;

  @IsOptional() @IsString()
  sessionId?: string;

  @IsOptional() @IsIn(['library', 'general'])
  context?: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @Public()
  async chat(@Body() dto: ChatDto, @Req() req: Request) {
    const sessionId = dto.sessionId ?? (req.ip ?? 'anon');
    const context = dto.context ?? 'library';
    const conversationId = dto.conversationId ?? null;

    return this.aiService.chat({
      userId: null,
      sessionId,
      conversationId,
      message: dto.message,
      context,
    });
  }

  @Get('conversations/:id/messages')
  @Public()
  async getMessages(@Param('id') id: string) {
    return this.aiService.getMessages(id);
  }
}
