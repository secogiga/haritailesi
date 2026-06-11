import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Sse, MessageEvent, Res } from '@nestjs/common';
import { IsArray, IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, MinLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Observable, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import { SurveysService } from './surveys.service';

class RespondDto {
  @IsObject() answers!: Record<string, string | string[]>;
  @IsOptional() @IsString() respondentEmail?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsInt() @Type(() => Number) timeTaken?: number;
}

class CreateSurveyDto {
  @IsString() @MinLength(2) title!: string;
  @IsOptional() @IsIn(['anket', 'test']) type?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() endsAt?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsBoolean() allowAnonymous?: boolean;
  @IsOptional() @IsBoolean() showResults?: boolean;
  @IsOptional() @IsInt() @Min(10) @Type(() => Number) timeLimit?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) @Type(() => Number) passingScore?: number;
  @IsOptional() @IsString() companySlug?: string;
}

class UpdateSurveyDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsIn(['anket', 'test']) type?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsIn(['draft', 'active', 'ended', 'archived']) status?: string;
  @IsOptional() @IsString() endsAt?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsBoolean() allowAnonymous?: boolean;
  @IsOptional() @IsBoolean() showResults?: boolean;
  @IsOptional() @IsInt() @Min(10) @Type(() => Number) timeLimit?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100) @Type(() => Number) passingScore?: number;
  @IsOptional() @IsString() companySlug?: string;
}

class AddQuestionDto {
  @IsString() surveyId!: string;
  @IsString() @MinLength(5) questionText!: string;
  @IsIn(['single', 'multiple', 'text', 'rating', 'truefalse']) type!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) options?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) correctOptions?: string[];
  @IsOptional() @IsInt() @Min(1) @Type(() => Number) points?: number;
  @IsOptional() @IsString() explanation?: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsInt() @Type(() => Number) sortOrder?: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() conditionQuestionId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) conditionValues?: string[];
  @IsOptional() @IsString() scenarioText?: string;
  @IsOptional() @IsIn(['easy', 'medium', 'hard']) difficulty?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) topicTags?: string[];
}

class UpdateQuestionDto {
  @IsOptional() @IsString() questionText?: string;
  @IsOptional() @IsIn(['single', 'multiple', 'text', 'rating', 'truefalse']) type?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) options?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) correctOptions?: string[];
  @IsOptional() @IsInt() @Min(1) @Type(() => Number) points?: number;
  @IsOptional() @IsString() explanation?: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsInt() @Type(() => Number) sortOrder?: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() conditionQuestionId?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) conditionValues?: string[];
  @IsOptional() @IsString() scenarioText?: string;
  @IsOptional() @IsIn(['easy', 'medium', 'hard']) difficulty?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) topicTags?: string[];
}

class CompanyRequestDto {
  @IsString() @MinLength(2) companyName!: string;
  @IsString() contactEmail!: string;
  @IsString() @MinLength(3) testTitle!: string;
  @IsOptional() @IsString() notes?: string;
}

class LiveRespondDto {
  @IsString() participantId!: string;
  @IsOptional() @IsString() participantName?: string;
  @IsArray() @IsString({ each: true }) answer!: string[];
}

class JoinSessionDto {
  @IsString() participantId!: string;
  @IsOptional() @IsString() participantName?: string;
}

@Controller('surveys')
export class SurveysController {
  constructor(private readonly service: SurveysService) {}

  // ── Public endpoints ──────────────────────────────────────────────────────

  @Public()
  @Get('hub')
  async getHub() {
    try {
      return await this.service.getHub();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[HUB ERROR]', msg);
      return { anketler: [], testler: [], yarismalar: [], _error: msg };
    }
  }

  @Public()
  @Get('sector-report')
  getSectorReport(@Query('year') year?: string) {
    return this.service.getSectorReport(year ? parseInt(year) : undefined);
  }

  @Public()
  @Post('company-request')
  @HttpCode(201)
  companyRequest(@Body() dto: CompanyRequestDto) {
    return this.service.companyRequest(dto);
  }

  @Public()
  @Get()
  listActive(@Query('type') type?: string) {
    if (type === 'anket' || type === 'test') return this.service.listByType(type);
    return this.service.listActive();
  }

  // ── Canlı Oturumlar (public) ──────────────────────────────────────────────

  @Public()
  @Get('live/:code')
  getLiveSession(@Param('code') code: string) {
    return this.service.getLiveSession(code);
  }

  @Public()
  @Post('live/:code/join')
  @HttpCode(200)
  joinLiveSession(@Param('code') code: string, @Body() dto: JoinSessionDto) {
    return this.service.joinLiveSession(code, dto.participantId, dto.participantName);
  }

  @Public()
  @Post('live/:code/respond/:questionId')
  @HttpCode(201)
  submitLiveResponse(
    @Param('code') code: string,
    @Param('questionId') questionId: string,
    @Body() dto: LiveRespondDto,
  ) {
    return this.service.submitLiveResponse(code, questionId, dto.participantId, dto.answer, dto.participantName);
  }

  @Public()
  @Get('live/:code/results')
  getLiveResults(@Param('code') code: string) {
    return this.service.getLiveResults(code);
  }

  @Public()
  @Get('live/:code/leaderboard')
  async getLiveLeaderboard(@Param('code') code: string) {
    const session = await this.service.getLiveSession(code);
    return this.service.computeLeaderboard(session.id);
  }

  @Public()
  @Sse('live/:code/events')
  liveEvents(@Param('code') code: string): Observable<MessageEvent> {
    const subject = this.service['getOrCreateSubject'](code);
    return subject.asObservable().pipe(
      map((event) => ({ data: event }) as MessageEvent),
    );
  }

  // ── Admin live ────────────────────────────────────────────────────────────

  @Post('admin/live')
  @RequirePermission('user.manage')
  @HttpCode(201)
  createLiveSession(@Body() body: { surveyId: string }, @CurrentUser() user: RequestUser) {
    return this.service.createLiveSession(body.surveyId, user.id);
  }

  @Post('admin/live/:code/advance')
  @RequirePermission('user.manage')
  @HttpCode(200)
  advanceLiveQuestion(@Param('code') code: string) {
    return this.service.advanceLiveQuestion(code);
  }

  @Post('admin/live/:code/end')
  @RequirePermission('user.manage')
  @HttpCode(200)
  endLiveSession(@Param('code') code: string) {
    return this.service.endLiveSession(code);
  }

  // ── Survey detail & respond ───────────────────────────────────────────────

  @Public()
  @Get(':id/results/segmented')
  getSegmentedResults(@Param('id') id: string) {
    return this.service.getSegmentedResults(id);
  }

  @Public()
  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string) {
    return this.service.getTestLeaderboard(id);
  }

  @Public()
  @Get(':id')
  getSurvey(@Param('id') id: string) {
    return this.service.getSurveyWithQuestions(id);
  }

  @Public()
  @Post(':id/respond')
  @HttpCode(201)
  respond(
    @Param('id') id: string,
    @Body() dto: RespondDto,
    @CurrentUser() user?: RequestUser,
  ) {
    return this.service.respond(id, { ...dto, userId: user?.id });
  }

  @Public()
  @Get(':id/results')
  getResults(@Param('id') id: string) {
    return this.service.getResults(id);
  }

  @Get('me/history')
  getMyHistory(@CurrentUser() user: RequestUser) {
    return this.service.getUserHistory(user.id);
  }

  @Get('me/topic-analysis')
  getTopicAnalysis(@CurrentUser() user: RequestUser) {
    return this.service.getTopicAnalysis(user.id);
  }

  @Get('me/talent-pool')
  getMyTalentPool(@CurrentUser() user: RequestUser) {
    return this.service.getMyTalentPool(user.id);
  }

  @Post(':id/join-pool')
  @HttpCode(200)
  joinTalentPool(
    @Param('id') id: string,
    @Body() body: { companySlug: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.joinTalentPool(user.id, id, body.companySlug);
  }

  @Public()
  @Get('cert/:code')
  getCert(@Param('code') code: string) {
    return this.service.getCertByCode(code);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  @Get('admin/all')
  @RequirePermission('user.manage')
  listAll(@Query('type') type?: string) {
    return this.service.listAll(type);
  }

  @Get('admin/:id/responses')
  @RequirePermission('user.manage')
  getAdminResponses(@Param('id') id: string) {
    return this.service.getAdminResponses(id);
  }

  @Get('admin/:id/stats')
  @RequirePermission('user.manage')
  getAdminStats(@Param('id') id: string) {
    return this.service.getAdminStats(id);
  }

  @Get('admin/:id')
  @RequirePermission('user.manage')
  adminDetail(@Param('id') id: string) {
    return this.service.getAdminDetail(id);
  }

  @Post('admin/create')
  @RequirePermission('user.manage')
  @HttpCode(201)
  create(@Body() dto: CreateSurveyDto, @CurrentUser() user: RequestUser) {
    return this.service.create({ ...dto, createdBy: user.id });
  }

  @Patch('admin/:id')
  @RequirePermission('user.manage')
  update(@Param('id') id: string, @Body() dto: UpdateSurveyDto) {
    return this.service.update(id, dto);
  }

  @Post('admin/questions')
  @RequirePermission('user.manage')
  @HttpCode(201)
  addQuestion(@Body() dto: AddQuestionDto) {
    return this.service.addQuestion(dto);
  }

  @Patch('admin/questions/:id')
  @RequirePermission('user.manage')
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.service.updateQuestion(id, dto as never);
  }

  @Delete('admin/questions/:id')
  @RequirePermission('user.manage')
  deleteQuestion(@Param('id') id: string) {
    return this.service.deleteQuestion(id);
  }
}
