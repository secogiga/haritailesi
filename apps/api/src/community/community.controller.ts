import { BadRequestException, Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import { CommunityService } from './community.service';

const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const s3 = new S3Client({
  region: process.env['AWS_REGION'] ?? 'eu-central-1',
  credentials: {
    accessKeyId: process.env['AWS_ACCESS_KEY_ID'] ?? '',
    secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] ?? '',
  },
});

type FeedbackStatus =
  | 'open' | 'reviewing' | 'awaiting_info' | 'in_progress' | 'mentoring'
  | 'expert_review' | 'partner_referred' | 'offer_pending' | 'education_suggested' | 'gpt_responded'
  | 'suggested' | 'resolved' | 'archived';

const VALID_STATUSES: FeedbackStatus[] = [
  'open', 'reviewing', 'awaiting_info', 'in_progress', 'mentoring',
  'expert_review', 'partner_referred', 'offer_pending', 'education_suggested', 'gpt_responded',
  'suggested', 'resolved', 'archived',
];

class SendOtpDto {
  @IsString() @MinLength(5) contact!: string;
  @IsIn(['email', 'phone']) type!: 'email' | 'phone';
}

class VerifyOtpDto {
  @IsString() @MinLength(5) contact!: string;
  @IsIn(['email', 'phone']) type!: 'email' | 'phone';
  @IsString() @MinLength(6) code!: string;
}

class CreateFeedbackDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() isAnonymous?: boolean;
  @IsOptional() @IsString() verificationToken?: string;
  @IsString() @MinLength(3) subject!: string;
  @IsString() @MinLength(10) body!: string;
  @IsIn(['talep', 'gorus', 'hikaye', 'reklam']) type!: 'talep' | 'gorus' | 'hikaye' | 'reklam';
  @IsIn(['sahne', 'mutfak', 'web', 'isbirligi']) source!: 'sahne' | 'mutfak' | 'web' | 'isbirligi';
  @IsOptional() @IsIn(['dusuk', 'normal', 'yuksek', 'kritik']) urgency?: 'dusuk' | 'normal' | 'yuksek' | 'kritik';
  @IsOptional() @IsString() subCategory?: string;
  @IsOptional() @IsString() expectation?: string;
  @IsOptional() @IsString() userType?: string;
  @IsOptional() attachmentUrls?: string[];
}

class GptChatDto {
  @IsString() @MinLength(2) message!: string;
  @IsOptional() history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

class ClassifyIntentDto {
  @IsString() @MinLength(5) text!: string;
  @IsOptional() regexSignals?: { topCategory: string; topScore: number; scoreDiff: number };
}

class CategoryCorrectionDto {
  @IsString() text!: string;
  @IsString() detected!: string;
  @IsString() corrected!: string;
}

class CategoryConfirmDto {
  @IsString() text!: string;
  @IsString() categoryId!: string;
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
  @IsIn(VALID_STATUSES) status!: FeedbackStatus;
  @IsOptional() @IsString() adminNotes?: string;
  @IsOptional() @IsString() adminReply?: string;
  @IsOptional() @IsString() assignedTo?: string;
  @IsOptional() @IsString() changedBy?: string;
}

class SubmitSatisfactionDto {
  @IsInt() @Min(1) @Max(5) score!: number;
}

class UpdateMentorApplicationStatusDto {
  @IsIn(['pending', 'reviewing', 'matched', 'rejected']) status!: 'pending' | 'reviewing' | 'matched' | 'rejected';
  @IsOptional() @IsString() adminNotes?: string;
}

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // ─── Feedback (Public) ────────────────────────────────────────────────────────

  @Public()
  @Post('feedback')
  @HttpCode(201)
  createFeedback(@Body() dto: CreateFeedbackDto, @CurrentUser() user?: RequestUser) {
    return this.communityService.createFeedback({
      userId: user?.id,
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      isAnonymous: dto.isAnonymous ?? false,
      verificationToken: dto.verificationToken,
      subject: dto.subject,
      body: dto.body,
      type: dto.type,
      source: dto.source,
      urgency: dto.urgency,
      subCategory: dto.subCategory,
      expectation: dto.expectation,
      userType: dto.userType,
      attachmentUrls: dto.attachmentUrls,
    });
  }

  // ─── OTP (Public) ────────────────────────────────────────────────────────────

  @Public()
  @Post('otp/send')
  @HttpCode(200)
  sendOtp(@Body() dto: SendOtpDto) {
    return this.communityService.sendOtp(dto.contact, dto.type);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(200)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const token = await this.communityService.verifyOtp(dto.contact, dto.type, dto.code);
    return { token };
  }

  // ─── Category Intelligence (Public) ─────────────────────────────────────────

  @Public()
  @Post('classify-intent')
  @HttpCode(200)
  classifyIntent(@Body() dto: ClassifyIntentDto) {
    return this.communityService.classifyIntent(dto.text, dto.regexSignals);
  }

  @Public()
  @Get('category-bias')
  getCategoryBias() {
    return this.communityService.getCategoryBias();
  }

  @Public()
  @Post('category-correction')
  @HttpCode(204)
  logCategoryCorrection(@Body() dto: CategoryCorrectionDto) {
    return this.communityService.logCategoryCorrection(dto.text, dto.detected, dto.corrected);
  }

  @Public()
  @Post('category-confirm')
  @HttpCode(204)
  logCategoryConfirm(@Body() dto: CategoryConfirmDto) {
    return this.communityService.logCategoryConfirm(dto.text, dto.categoryId);
  }

  // ─── HaritailesiGPT Chat (Public) ───────────────────────────────────────────

  @Public()
  @Post('gpt-chat')
  @HttpCode(200)
  gptChat(@Body() dto: GptChatDto) {
    return this.communityService.gptChat(dto.message, dto.history ?? []);
  }

  // ─── File Upload (Public — max 5 MB, whitelisted mime types → S3) ──────────

  @Public()
  @Post('upload')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
      else cb(new BadRequestException('Desteklenmeyen dosya türü'), false);
    },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Dosya bulunamadı');
    const bucket = process.env['AWS_S3_BUCKET'];
    if (!bucket) throw new BadRequestException('S3 yapılandırması eksik');
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const key = `destek-ekleri/${unique}${extname(file.originalname)}`;
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: 'inline',
    }));
    const region = process.env['AWS_REGION'] ?? 'eu-central-1';
    return { url: `https://${bucket}.s3.${region}.amazonaws.com/${key}` };
  }

  @Public()
  @Get('feedback/lookup')
  lookupTicket(@Query('no') ticketNo: string) {
    const no = parseInt(ticketNo, 10);
    if (!no || no < 1) throw new Error('Geçersiz ticket numarası');
    return this.communityService.lookupFeedbackByTicketNo(no);
  }

  // ─── Satisfaction (Public — token-based via email link) ───────────────────────

  @Public()
  @Post('feedback/:id/satisfaction')
  @HttpCode(200)
  submitSatisfaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitSatisfactionDto,
  ) {
    return this.communityService.submitSatisfaction(id, dto.score);
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
    @Query('urgency') urgency?: string,
    @Query('userType') userType?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.listFeedback({
      status, source, type, urgency, userType, assignedTo, cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('admin/feedback/:id/status')
  @RequirePermission('user.manage')
  updateFeedbackStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeedbackStatusDto,
    @CurrentUser() admin: RequestUser,
  ) {
    return this.communityService.updateFeedbackStatus(
      id, dto.status, dto.adminNotes, dto.adminReply, dto.assignedTo,
      dto.changedBy ?? admin.email,
    );
  }

  @Get('admin/feedback/:id/history')
  @RequirePermission('user.manage')
  getFeedbackHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.communityService.getFeedbackStatusHistory(id);
  }

  @Get('admin/stats')
  @RequirePermission('user.manage')
  getFeedbackStats() {
    return this.communityService.getFeedbackStats();
  }

  @Get('admin/similar-resolved')
  @RequirePermission('user.manage')
  findSimilarResolved(
    @Query('q') q?: string,
    @Query('subCategory') subCategory?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.findSimilarResolved({
      q, subCategory, category,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('admin/feedback/:id/ai-draft')
  @RequirePermission('user.manage')
  generateReplyDraft(@Param('id', ParseUUIDPipe) id: string) {
    return this.communityService.generateReplyDraft(id);
  }

  // ─── My Tickets (Authenticated user) ─────────────────────────────────────────

  @Get('my-tickets')
  getMyTickets(@CurrentUser() user: RequestUser) {
    return this.communityService.listMyFeedback(user.id);
  }

  // ─── Mentor View (atanmış biletler) ──────────────────────────────────────────

  @Get('mentor/my-tickets')
  @RequirePermission('mentor.manage')
  getMentorTickets(@CurrentUser() user: RequestUser, @Query('status') status?: string) {
    // Mentörler yalnızca assignedTo alanında kendi email'leri olan biletleri görür
    return this.communityService.listFeedback({
      assignedTo: user.email,
      status: status || undefined,
      limit: 50,
    });
  }

  // ─── Partner Firma (yönlendirilmiş indirim/avantaj talepleri) ────────────────

  @Get('partner/my-tickets')
  @RequirePermission('partner.manage')
  getPartnerTickets(@CurrentUser() user: RequestUser, @Query('status') status?: string) {
    // Partner firmalar yalnızca kendilerine atanmış, partner_referred statuslü biletleri görür
    return this.communityService.listFeedback({
      assignedTo: user.email,
      status: status ?? 'partner_referred',
      limit: 50,
    });
  }

  @Patch('partner/tickets/:id/note')
  @RequirePermission('partner.manage')
  addPartnerNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { note: string },
    @CurrentUser() partner: RequestUser,
  ) {
    // Partner sadece adminReply alanına not ekleyebilir, durum değiştiremez
    return this.communityService.addPartnerNote(id, dto.note, partner.email);
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
