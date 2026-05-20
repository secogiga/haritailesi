import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { IsArray, IsIn, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import { SurveysService } from './surveys.service';

class RespondDto {
  @IsObject() answers!: Record<string, string | string[]>;
  @IsOptional() @IsString() respondentEmail?: string;
  @IsOptional() @IsString() source?: string;
}

class CreateSurveyDto {
  @IsString() @MinLength(2) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() endsAt?: string;
}

class UpdateSurveyDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(['draft', 'active', 'ended']) status?: string;
  @IsOptional() @IsString() endsAt?: string;
}

class AddQuestionDto {
  @IsString() surveyId!: string;
  @IsString() @MinLength(5) questionText!: string;
  @IsIn(['single', 'multiple', 'text']) type!: string;
  @IsOptional() @IsArray() options?: string[];
  @IsOptional() sortOrder?: number;
}

@Controller('surveys')
export class SurveysController {
  constructor(private readonly service: SurveysService) {}

  @Public()
  @Get()
  listActive() {
    return this.service.listActive();
  }

  @Public()
  @Get(':id')
  getSurvey(@Param('id') id: string) {
    return this.service.getSurveyWithQuestions(id);
  }

  @Public()
  @Post(':id/respond')
  @HttpCode(201)
  respond(@Param('id') id: string, @Body() dto: RespondDto) {
    return this.service.respond(id, dto);
  }

  @Public()
  @Get(':id/results')
  getResults(@Param('id') id: string) {
    return this.service.getResults(id);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  @Get('admin/all')
  @RequirePermission('user.manage')
  listAll() {
    return this.service.listAll();
  }

  @Get('admin/:id/responses')
  @RequirePermission('user.manage')
  getAdminResponses(@Param('id') id: string) {
    return this.service.getAdminResponses(id);
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
  updateQuestion(@Param('id') id: string, @Body() dto: Partial<AddQuestionDto>) {
    return this.service.updateQuestion(id, dto as never);
  }

  @Delete('admin/questions/:id')
  @RequirePermission('user.manage')
  deleteQuestion(@Param('id') id: string) {
    return this.service.deleteQuestion(id);
  }
}
