import {
  Body, Controller, Get, HttpCode, Param, Patch, Post,
  Query, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import { CompetitionsService } from './competitions.service';

class ApplyDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) displayName!: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() source?: string;
  @IsString() emailToken!: string;
}

class CreateCompetitionDto {
  @IsString() @MinLength(2) title!: string;
  @IsString() @MinLength(2) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() deadline?: string;
  @IsOptional() @IsString() prizes?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() status?: string;
}

class UpdateCompetitionDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() deadline?: string;
  @IsOptional() @IsString() prizes?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() winnersText?: string;
}

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly service: CompetitionsService) {}

  @Public()
  @Get()
  listPublic() {
    return this.service.listPublic();
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Public()
  @Post(':id/apply')
  @HttpCode(201)
  apply(
    @Param('id') id: string,
    @Body() dto: ApplyDto,
    @CurrentUser() user?: RequestUser,
  ) {
    return this.service.apply(id, { ...dto, ...(user?.id ? { userId: user.id } : {}), source: dto.source ?? 'sahne' });
  }

  @Get('me/applications')
  myApplications(@CurrentUser() user: RequestUser) {
    return this.service.getMyApplications(user.id);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  @Get('admin/all')
  @RequirePermission('user.manage')
  listAll(@Query('status') status?: string) {
    return this.service.listAll(status);
  }

  @Post('admin/create')
  @RequirePermission('user.manage')
  @HttpCode(201)
  create(@Body() dto: CreateCompetitionDto, @CurrentUser() user: RequestUser) {
    return this.service.create({ ...dto, createdBy: user.id });
  }

  @Patch('admin/:id')
  @RequirePermission('user.manage')
  update(@Param('id') id: string, @Body() dto: UpdateCompetitionDto) {
    return this.service.update(id, dto);
  }

  @Post('admin/:id/poster')
  @RequirePermission('user.manage')
  @UseInterceptors(FileInterceptor('file'))
  uploadPoster(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadPoster(id, file);
  }

  @Public()
  @Post('applications/:appId/file')
  @UseInterceptors(FileInterceptor('file'))
  uploadApplicationFile(
    @Param('appId') appId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadApplicationFile(appId, file);
  }

  @Get('admin/:id/applications')
  @RequirePermission('user.manage')
  listApplications(@Param('id') id: string) {
    return this.service.listApplications(id);
  }

  @Patch('admin/applications/:appId/status')
  @RequirePermission('user.manage')
  updateApplicationStatus(
    @Param('appId') appId: string,
    @Body('status') status: string,
  ) {
    return this.service.updateApplicationStatus(appId, status);
  }

  @Patch('admin/applications/:appId/jury')
  @RequirePermission('user.manage')
  updateApplicationJury(
    @Param('appId') appId: string,
    @Body('juryScore') juryScore: number | null,
    @Body('juryNotes') juryNotes: string | null,
  ) {
    return this.service.updateApplicationJury(appId, juryScore, juryNotes);
  }
}
