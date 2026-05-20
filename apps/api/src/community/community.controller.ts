import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import { CommunityService } from './community.service';

class CreateFeedbackDto {
  @IsOptional() @IsEmail() email?: string;
  @IsString() @MinLength(3) subject!: string;
  @IsString() @MinLength(10) body!: string;
  @IsIn(['talep', 'gorus']) type!: 'talep' | 'gorus';
  @IsIn(['sahne', 'mutfak', 'web']) source!: 'sahne' | 'mutfak' | 'web';
}

class CreateMentorApplicationDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) displayName!: string;
  @IsIn(['mentor', 'mentee']) type!: 'mentor' | 'mentee';
  @IsIn(['sahne', 'mutfak']) source!: 'sahne' | 'mutfak';
  @IsOptional() @IsString() expertise?: string;
  @IsOptional() @IsString() goals?: string;
  @IsOptional() @IsIn(['online', 'in_person', 'both']) preferredFormat?: string;
}

class UpdateFeedbackStatusDto {
  @IsIn(['open', 'in_progress', 'resolved']) status!: 'open' | 'in_progress' | 'resolved';
  @IsOptional() @IsString() adminNotes?: string;
}

class UpdateMentorApplicationStatusDto {
  @IsIn(['pending', 'reviewing', 'matched', 'rejected']) status!: 'pending' | 'reviewing' | 'matched' | 'rejected';
  @IsOptional() @IsString() adminNotes?: string;
}

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // ─── Feedback (Public — hem sahne hem mutfak, hem web) ────────────────────────

  @Public()
  @Post('feedback')
  @HttpCode(201)
  createFeedback(@Body() dto: CreateFeedbackDto, @CurrentUser() user?: RequestUser) {
    return this.communityService.createFeedback({
      userId: user?.id,
      email: dto.email,
      subject: dto.subject,
      body: dto.body,
      type: dto.type,
      source: dto.source,
    });
  }

  // ─── Mentor / Mentee Application (Public) ─────────────────────────────────────

  @Public()
  @Post('mentor-apply')
  @HttpCode(201)
  createMentorApplication(@Body() dto: CreateMentorApplicationDto, @CurrentUser() user?: RequestUser) {
    return this.communityService.createMentorApplication({
      userId: user?.id,
      email: dto.email,
      displayName: dto.displayName,
      type: dto.type,
      source: dto.source,
      expertise: dto.expertise,
      goals: dto.goals,
      preferredFormat: dto.preferredFormat,
    });
  }

  // ─── Admin: Feedback yönetimi ─────────────────────────────────────────────────

  @Get('admin/feedback')
  @RequirePermission('user.manage')
  listFeedback(
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('type') type?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.listFeedback({
      status, source, type, cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('admin/feedback/:id/status')
  @RequirePermission('user.manage')
  updateFeedbackStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeedbackStatusDto,
  ) {
    return this.communityService.updateFeedbackStatus(id, dto.status, dto.adminNotes);
  }

  // ─── Admin: Mentor Başvuruları ─────────────────────────────────────────────────

  @Get('admin/mentor-applications')
  @RequirePermission('user.manage')
  listMentorApplications(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.listMentorApplications({
      status, type, cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('admin/mentor-applications/:id/status')
  @RequirePermission('user.manage')
  updateMentorApplicationStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMentorApplicationStatusDto,
  ) {
    return this.communityService.updateMentorApplicationStatus(id, dto.status, dto.adminNotes);
  }
}
