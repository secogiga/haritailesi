import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MentorshipService, EXPERTISE_AREAS } from './mentorship.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import { Public } from '../auth/decorators/public.decorator';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class UpsertMentorProfileDto {
  @IsArray()
  @IsString({ each: true })
  expertiseAreas!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsIn(['online', 'in_person', 'both'])
  sessionFormat!: 'online' | 'in_person' | 'both';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsInt()
  @Min(30)
  @Max(90)
  sessionDurationMin!: number;

  @IsInt()
  @Min(30)
  @Max(90)
  sessionDurationMax!: number;

  @IsIn(['monthly', 'periodic', 'both'])
  capacityType!: 'monthly' | 'periodic' | 'both';

  @IsInt()
  @Min(1)
  @Max(10)
  monthlyCapacity!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  periodicCapacity!: number;

  @IsBoolean()
  isAcceptingRequests!: boolean;
}

class CreateRequestDto {
  @IsUUID()
  mentorId!: string;

  @IsString()
  @MaxLength(200)
  topic!: string;

  @IsString()
  @MaxLength(500)
  goal!: string;

  @IsIn(['online', 'in_person'])
  preferredFormat!: 'online' | 'in_person';
}

class CreateMenteeApplicationDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(200)
  email!: string;

  @IsString()
  @MaxLength(200)
  topic!: string;

  @IsString()
  @MaxLength(500)
  goal!: string;

  @IsIn(['online', 'in_person', 'both'])
  preferredFormat!: string;

  @IsIn(['single_session', 'periodic'])
  engagementType!: 'single_session' | 'periodic';

  @IsOptional()
  @IsIn(['sahne', 'mutfak', 'kutu'])
  source?: string;
}

class AdminReviewMentorDto {
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(400)
  note?: string;
}

class AdminCreateMatchDto {
  @IsUUID()
  mentorUserId!: string;

  @IsUUID()
  menteeApplicationId!: string;

  @IsIn(['single_session', 'periodic'])
  engagementType!: 'single_session' | 'periodic';
}

class RespondDto {
  @IsIn(['accept', 'reject'])
  action!: 'accept' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(400)
  mentorNote?: string;
}

class ProposeRescheduleDto {
  @IsString()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  rescheduleNote?: string;
}

class RescheduleRespondDto {
  @IsIn(['accept', 'reject'])
  action!: 'accept' | 'reject';
}

class FeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  feedbackComment?: string;
}

class ScheduleSessionDto {
  @IsString()
  scheduledAt!: string;
}

class SessionNoteDto {
  @IsString()
  @MaxLength(1000)
  note!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

class FinalEvaluationDto {
  @IsString()
  @MaxLength(1000)
  comment!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('mentorship')
@ApiBearerAuth('access-token')
@Controller('mentorship')
export class MentorshipController {
  constructor(private readonly mentorshipService: MentorshipService) {}

  // ─── Uzmanlık Alanları (public) ───────────────────────────────────────────

  @Public()
  @Get('expertise-areas')
  getExpertiseAreas() {
    return EXPERTISE_AREAS;
  }

  // ─── Mentor Rehberi (public) ──────────────────────────────────────────────

  @Public()
  @Get('public/mentors')
  listPublicMentors(
    @Query('expertise') expertise?: string,
    @Query('format') format?: string,
    @Query('type') type?: string,
  ) {
    return this.mentorshipService.listMentors({
      ...(expertise ? { expertise } : {}),
      ...(format ? { format } : {}),
      ...(type ? { type } : {}),
    });
  }

  @Get('mentors')
  @RequirePermission('user.profile.read')
  listMentors(
    @Query('expertise') expertise?: string,
    @Query('format') format?: string,
    @Query('type') type?: string,
  ) {
    return this.mentorshipService.listMentors({
      ...(expertise ? { expertise } : {}),
      ...(format ? { format } : {}),
      ...(type ? { type } : {}),
    });
  }

  @Get('mentors/:userId')
  @RequirePermission('user.profile.read')
  getMentor(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.mentorshipService.getMentor(userId);
  }

  // ─── Mentor Profil Yönetimi ───────────────────────────────────────────────

  @Get('my-profile')
  @RequirePermission('mentor.accept')
  getMyProfile(@CurrentUser() user: RequestUser) {
    return this.mentorshipService.getMyMentorProfile(user.id);
  }

  @Put('my-profile')
  @RequirePermission('mentor.accept')
  upsertMyProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpsertMentorProfileDto,
  ) {
    return this.mentorshipService.upsertMentorProfile(user.id, dto);
  }

  // ─── Mentee: Doğrudan İstek (single_session hızlı yol) ───────────────────

  @Post('requests')
  @RequirePermission('mentor.request')
  createRequest(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateRequestDto,
  ) {
    return this.mentorshipService.createRequest(user.id, dto);
  }

  @Get('my-requests')
  @RequirePermission('mentor.request')
  getMyRequestsAsMentee(@CurrentUser() user: RequestUser) {
    return this.mentorshipService.getMyRequestsAsMentee(user.id);
  }

  @Get('my-history')
  @RequirePermission('mentor.request')
  getMyHistory(@CurrentUser() user: RequestUser) {
    return this.mentorshipService.getMyHistory(user.id);
  }

  @Delete('requests/:id')
  @RequirePermission('mentor.request')
  cancelRequest(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mentorshipService.cancelRequest(user.id, id);
  }

  @Post('requests/:id/feedback')
  @RequirePermission('mentor.request')
  submitFeedback(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FeedbackDto,
  ) {
    return this.mentorshipService.submitFeedback(user.id, id, dto);
  }

  // ─── Engagement Sessions ──────────────────────────────────────────────────

  @Get('engagements/:id/sessions')
  @RequirePermission('mentor.request')
  getEngagementSessions(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mentorshipService.getEngagementSessions(user.id, id);
  }

  @Post('engagements/:id/final-evaluation')
  @RequirePermission('mentor.request')
  submitFinalEvaluation(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FinalEvaluationDto,
  ) {
    return this.mentorshipService.submitFinalEvaluation(user.id, id, {
      comment: dto.comment,
      ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
    });
  }

  // ─── Session Yönetimi ─────────────────────────────────────────────────────

  @Patch('sessions/:sessionId/schedule')
  @RequirePermission('mentor.accept')
  scheduleSession(
    @CurrentUser() user: RequestUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: ScheduleSessionDto,
  ) {
    return this.mentorshipService.scheduleSession(user.id, sessionId, dto.scheduledAt);
  }

  @Post('sessions/:sessionId/note')
  @RequirePermission('mentor.request')
  submitSessionNote(
    @CurrentUser() user: RequestUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SessionNoteDto,
  ) {
    return this.mentorshipService.submitSessionNote(user.id, sessionId, {
      note: dto.note,
      ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
    });
  }

  @Patch('sessions/:sessionId/complete')
  @RequirePermission('mentor.accept')
  completeSessionById(
    @CurrentUser() user: RequestUser,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.mentorshipService.completeSessionById(user.id, sessionId);
  }

  // ─── Mentor: Gelen İstekler ───────────────────────────────────────────────

  @Get('incoming-requests')
  @RequirePermission('mentor.accept')
  getIncomingRequests(@CurrentUser() user: RequestUser) {
    return this.mentorshipService.getMyRequestsAsMentor(user.id);
  }

  @Patch('requests/:id/respond')
  @RequirePermission('mentor.accept')
  respond(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondDto,
  ) {
    return this.mentorshipService.respondToRequest(user.id, id, {
      action: dto.action,
      ...(dto.mentorNote !== undefined ? { mentorNote: dto.mentorNote } : {}),
    });
  }

  @Patch('requests/:id/reschedule')
  @RequirePermission('mentor.accept')
  proposeReschedule(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProposeRescheduleDto,
  ) {
    return this.mentorshipService.proposeReschedule(user.id, id, {
      proposedScheduledAt: dto.scheduledAt,
      ...(dto.rescheduleNote !== undefined ? { rescheduleNote: dto.rescheduleNote } : {}),
    });
  }

  @Patch('requests/:id/reschedule/respond')
  @RequirePermission('mentor.request')
  respondToReschedule(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleRespondDto,
  ) {
    return this.mentorshipService.respondToReschedule(user.id, id, dto.action);
  }

  @Patch('requests/:id/complete')
  @RequirePermission('mentor.accept')
  complete(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mentorshipService.completeSession(user.id, id);
  }

  // ─── Mentee Başvurusu (sahne / mutfak / kutu'dan) ────────────────────────

  @Public()
  @Post('mentee-applications')
  createMenteeApplication(@Body() dto: CreateMenteeApplicationDto) {
    return this.mentorshipService.createMenteeApplication({
      ...(dto.userId ? { userId: dto.userId } : {}),
      name: dto.name,
      email: dto.email,
      topic: dto.topic,
      goal: dto.goal,
      preferredFormat: dto.preferredFormat,
      engagementType: dto.engagementType,
      source: dto.source ?? 'sahne',
    });
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  @Get('admin/requests')
  @RequirePermission('mentor.manage')
  listAll(
    @Query('status') status?: string,
    @Query('engagementType') engagementType?: string,
  ) {
    return this.mentorshipService.listAllRequests({
      ...(status ? { status } : {}),
      ...(engagementType ? { engagementType } : {}),
    });
  }

  @Get('admin/mentor-pool')
  @RequirePermission('mentor.manage')
  adminMentorPool(@Query('status') status?: string) {
    return this.mentorshipService.adminListMentorPool(status);
  }

  @Patch('admin/mentor-pool/:id/review')
  @RequirePermission('mentor.manage')
  adminReviewMentor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminReviewMentorDto,
  ) {
    return this.mentorshipService.adminReviewMentor(id, dto.status, dto.note);
  }

  @Get('admin/mentee-pool')
  @RequirePermission('mentor.manage')
  adminMenteePool(
    @Query('status') status?: string,
    @Query('engagementType') engagementType?: string,
  ) {
    return this.mentorshipService.adminListMenteeApplications(status, engagementType);
  }

  @Post('admin/match')
  @RequirePermission('mentor.manage')
  adminCreateMatch(@Body() dto: AdminCreateMatchDto) {
    return this.mentorshipService.adminCreateMatch({
      mentorUserId: dto.mentorUserId,
      menteeApplicationId: dto.menteeApplicationId,
      engagementType: dto.engagementType,
    });
  }
}
