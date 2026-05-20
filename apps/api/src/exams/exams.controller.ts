import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { IsIn, IsNumber, IsObject, IsOptional, IsString, MinLength, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import { ExamsService } from './exams.service';

class SubmitAttemptDto {
  @IsString() categorySlug!: string;
  @IsObject() answers!: Record<string, string>;
  @IsOptional() @IsNumber() @IsPositive() timeTakenSeconds?: number;
}

class CreateCategoryDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsIn(['kpss', 'uzmanlik', 'deger', 'cbs', 'diger']) examType!: string;
  @IsOptional() @IsString() iconEmoji?: string;
  @IsOptional() @IsNumber() @Type(() => Number) sortOrder?: number;
}

class CreateQuestionDto {
  @IsString() categoryId!: string;
  @IsString() @MinLength(5) questionText!: string;
  @IsString() optionA!: string;
  @IsString() optionB!: string;
  @IsString() optionC!: string;
  @IsString() optionD!: string;
  @IsOptional() @IsString() optionE?: string;
  @IsIn(['a', 'b', 'c', 'd', 'e']) correctOption!: string;
  @IsOptional() @IsString() explanation?: string;
  @IsOptional() @IsIn(['easy', 'medium', 'hard']) difficulty?: string;
  @IsOptional() @IsString() source?: string;
}

@Controller('exams')
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  @Public()
  @Get('categories')
  listCategories() {
    return this.service.listCategories();
  }

  @Public()
  @Get('categories/:slug')
  getCategory(@Param('slug') slug: string) {
    return this.service.getCategoryBySlug(slug);
  }

  @Public()
  @Get('categories/:slug/questions')
  getQuestions(
    @Param('slug') slug: string,
    @Query('count') count?: string,
  ) {
    return this.service.getExamQuestions(slug, count ? parseInt(count, 10) : undefined);
  }

  @Public()
  @Get('categories/:slug/stats')
  getCategoryStats(@Param('slug') slug: string) {
    return this.service.getCategoryStats(slug);
  }

  @Public()
  @Post('attempts')
  @HttpCode(200)
  submitAttempt(@Body() dto: SubmitAttemptDto, @CurrentUser() user?: RequestUser) {
    return this.service.submitAttempt({ ...dto, ...(user?.id ? { userId: user.id } : {}) });
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  @Get('admin/stats')
  @RequirePermission('admin.dashboard.read')
  adminStats() {
    return this.service.getAdminStats();
  }

  @Post('admin/categories')
  @RequirePermission('user.manage')
  @HttpCode(201)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.service.createCategory(dto);
  }

  @Patch('admin/categories/:id')
  @RequirePermission('user.manage')
  updateCategory(@Param('id') id: string, @Body() dto: Partial<CreateCategoryDto>) {
    return this.service.updateCategory(id, dto);
  }

  @Get('admin/categories/:id/questions')
  @RequirePermission('user.manage')
  listQuestions(@Param('id') id: string) {
    return this.service.listQuestions(id);
  }

  @Post('admin/questions')
  @RequirePermission('user.manage')
  @HttpCode(201)
  createQuestion(@Body() dto: CreateQuestionDto) {
    return this.service.createQuestion(dto);
  }

  @Patch('admin/questions/:id')
  @RequirePermission('user.manage')
  updateQuestion(@Param('id') id: string, @Body() dto: Partial<CreateQuestionDto>) {
    return this.service.updateQuestion(id, dto);
  }
}
