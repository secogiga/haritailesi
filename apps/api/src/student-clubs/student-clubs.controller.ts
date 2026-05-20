import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Request } from '@nestjs/common';
import { IsBoolean, IsDateString, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import { StudentClubsService } from './student-clubs.service';

class CreateStudentClubDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) slug!: string;
  @IsString() @MinLength(2) university!: string;
  @IsString() @MinLength(2) city!: string;
  @IsString() @MinLength(2) contactName!: string;
  @IsEmail() contactEmail!: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) memberCount?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() activities?: string;
}

class UpdateStudentClubStatusDto {
  @IsIn(['pending', 'active', 'suspended']) status!: 'pending' | 'active' | 'suspended';
  @IsOptional() @IsString() adminNotes?: string;
}

class SetRepresentativeDto {
  @IsOptional() @IsUUID() representativeId?: string | null;
}

class UpdateMyClubDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() activities?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) memberCount?: number;
}

class CreateClubNewsDto {
  @IsString() @MinLength(2) title!: string;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsDateString() publishedAt?: string;
}

class CreateClubEventDto {
  @IsString() @MinLength(2) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsDateString() eventDate!: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() registrationUrl?: string;
}

@Controller('student-clubs')
export class StudentClubsController {
  constructor(private readonly service: StudentClubsService) {}

  // ─── Public list ──────────────────────────────────────────────────────────────

  @Public()
  @Get()
  listPublic() {
    return this.service.listPublic();
  }

  @Public()
  @Post('apply')
  apply(@Body() dto: CreateStudentClubDto) {
    return this.service.create(dto);
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Public()
  @Get('news')
  listAllNews() {
    return this.service.listAllNews();
  }

  @Public()
  @Get('club-events')
  listAllClubEvents() {
    return this.service.listAllClubEvents();
  }

  // ─── Club rep portal ─────────────────────────────────────────────────────────

  @Get('mine')
  getMyClub(@Request() req: { user: { sub: string } }) {
    return this.service.findByRep(req.user.sub);
  }

  @Patch('mine')
  updateMyClub(@Request() req: { user: { sub: string } }, @Body() dto: UpdateMyClubDto) {
    return this.service.updateByRep(req.user.sub, dto);
  }

  // ─── Per-club news/events ─────────────────────────────────────────────────────

  @Public()
  @Get(':id/news')
  listClubNews(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.listClubNews(id);
  }

  @Public()
  @Get(':id/club-events')
  listClubEvents(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.listClubEvents(id);
  }

  // ─── Admin ───────────────────────────────────────────────────────────────────

  @Get('admin')
  @RequirePermission('user.manage')
  listAdmin(@Query('status') status?: string) {
    return this.service.listAdmin(status);
  }

  @Post('admin')
  @RequirePermission('user.manage')
  create(@Body() dto: CreateStudentClubDto) {
    return this.service.create(dto);
  }

  @Patch('admin/:id')
  @RequirePermission('user.manage')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<CreateStudentClubDto>) {
    return this.service.update(id, dto);
  }

  @Patch('admin/:id/status')
  @RequirePermission('user.manage')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStudentClubStatusDto) {
    return this.service.updateStatus(id, dto.status, dto.adminNotes);
  }

  @Delete('admin/:id')
  @RequirePermission('user.manage')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Patch('admin/:id/representative')
  @RequirePermission('user.manage')
  setRepresentative(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetRepresentativeDto,
  ) {
    return this.service.setRepresentative(id, dto.representativeId ?? null);
  }

  @Post('admin/:id/news')
  @RequirePermission('user.manage')
  createNews(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateClubNewsDto) {
    return this.service.createNews(id, dto);
  }

  @Delete('admin/news/:newsId')
  @RequirePermission('user.manage')
  deleteNews(@Param('newsId', ParseUUIDPipe) newsId: string) {
    return this.service.deleteNews(newsId);
  }

  @Post('admin/:id/club-events')
  @RequirePermission('user.manage')
  createClubEvent(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateClubEventDto) {
    return this.service.createClubEvent(id, dto);
  }

  @Delete('admin/club-events/:eventId')
  @RequirePermission('user.manage')
  deleteClubEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.service.deleteClubEvent(eventId);
  }
}
