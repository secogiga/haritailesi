import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { CreateSlotDto, CreateInterviewRequestDto, ConfirmInterviewDto } from './dto/scheduling.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { RequestUser } from '../auth/auth.types';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

class ListSlotsQuery {
  @IsOptional()
  @IsEnum(['membership', 'mentorship'])
  slotType?: 'membership' | 'mentorship';

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  onlyAvailable?: string;
}

class BookMentorshipSlotDto {
  @IsString()
  slotId!: string;

  @IsOptional()
  @IsUrl()
  meetUrl?: string;
}

@Controller()
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  // ─── Admin: Slot Yönetimi ─────────────────────────────────────────────────────

  @Post('admin/scheduling/slots')
  @RequirePermission('application.review')
  createSlot(@Body() dto: CreateSlotDto, @CurrentUser() actor: RequestUser) {
    return this.schedulingService.createSlot(dto, actor);
  }

  @Get('admin/scheduling/slots')
  @RequirePermission('application.review')
  listSlots(@Query() query: ListSlotsQuery, @CurrentUser() actor: RequestUser) {
    return this.schedulingService.listSlots({
      ...(query.slotType ? { slotType: query.slotType } : {}),
      ...(query.from ? { from: query.from } : {}),
      ...(query.to ? { to: query.to } : {}),
      onlyAvailable: query.onlyAvailable === 'true',
    });
  }

  @Delete('admin/scheduling/slots/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('application.review')
  deleteSlot(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    return this.schedulingService.deleteSlot(id, actor);
  }

  // ─── Admin: Başvuru için Görüşme Talebi ─────────────────────────────────────

  @Post('admin/applications/:id/request-interview')
  @RequirePermission('application.review')
  requestInterview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateInterviewRequestDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.schedulingService.createInterviewRequest(id, dto, actor);
  }

  @Get('admin/applications/:id/interview-request')
  @RequirePermission('application.review')
  getInterviewRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.schedulingService.getInterviewRequestByApplication(id);
  }

  // ─── Mentörlük: Mentor Slot Yönetimi ─────────────────────────────────────────

  @Post('mentorship/slots')
  createMentorSlot(@Body() dto: CreateSlotDto, @CurrentUser() actor: RequestUser) {
    return this.schedulingService.createMentorSlot(dto, actor);
  }

  @Get('mentorship/slots/my')
  getMyMentorSlots(@CurrentUser() actor: RequestUser) {
    return this.schedulingService.getMentorSlots(actor.id);
  }

  @Delete('mentorship/slots/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMentorSlot(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    return this.schedulingService.deleteMentorSlot(id, actor);
  }

  // ─── Mentörlük: Mentee görür ve seans planlar ─────────────────────────────────

  @Get('mentorship/users/:userId/slots')
  getMentorAvailableSlots(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.schedulingService.getAvailableMentorshipSlots(userId);
  }

  @Post('mentorship/requests/:id/book-slot')
  bookMentorshipSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BookMentorshipSlotDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.schedulingService.bookMentorshipSlot(id, dto.slotId, dto.meetUrl, actor);
  }

  // ─── Aday: Token Tabanlı Onay (Giriş Gerektirmez) ───────────────────────────

  @Public()
  @Get('scheduling/confirm/:token')
  getByToken(@Param('token') token: string) {
    return this.schedulingService.getRequestByToken(token);
  }

  @Public()
  @Post('scheduling/confirm/:token')
  confirmOrReschedule(
    @Param('token') token: string,
    @Body() dto: ConfirmInterviewDto,
  ) {
    return this.schedulingService.confirmOrReschedule(token, dto);
  }

  // ─── Aday: Calendly modu — müsait slotları listele ve seç ────────────────────

  @Public()
  @Get('scheduling/pick-slot/:token')
  getAvailableSlotsForToken(@Param('token') token: string) {
    return this.schedulingService.getAvailableSlotsForToken(token);
  }
}
