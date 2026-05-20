import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CmsService } from './cms.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import { CreateTalentDto } from './dto/cms.dto';

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  // ─── Pages ────────────────────────────────────────────────────────────────────

  @Public()
  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) {
    return this.cmsService.getPage(slug, true);
  }

  // ─── Board Members ────────────────────────────────────────────────────────────

  @Public()
  @Get('board-members')
  listBoardMembers() {
    return this.cmsService.listBoardMembers(true);
  }

  // ─── Events ───────────────────────────────────────────────────────────────────

  @Public()
  @Get('events')
  listEvents(@Query('type') type?: string) {
    return this.cmsService.listEvents({ publishedOnly: true, ...(type ? { type } : {}) });
  }

  @Public()
  @Get('events/:slug')
  getEvent(@Param('slug') slug: string) {
    return this.cmsService.getEvent(slug, true);
  }

  // ─── Event RSVP ───────────────────────────────────────────────────────────────

  @Get('events-rsvp/mine')
  @RequirePermission('feed.read')
  getMyRsvps(@CurrentUser() user: RequestUser) {
    return this.cmsService.getMyRsvps(user.id);
  }

  @Post('events/:id/rsvp')
  @RequirePermission('feed.read')
  rsvp(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cmsService.rsvp(user.id, id);
  }

  @Delete('events/:id/rsvp')
  @RequirePermission('feed.read')
  @HttpCode(HttpStatus.OK)
  cancelRsvp(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cmsService.cancelRsvp(user.id, id);
  }

  @Get('events/:id/attendees')
  @RequirePermission('feed.read')
  listAttendees(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cmsService.listEventAttendees(id);
  }

  // ─── Projects ─────────────────────────────────────────────────────────────────

  @Public()
  @Get('projects')
  listProjects(@Query('status') status?: string) {
    return this.cmsService.listProjects({ publishedOnly: true, ...(status ? { status } : {}) });
  }

  @Public()
  @Get('projects/:slug')
  getProject(@Param('slug') slug: string) {
    return this.cmsService.getProject(slug, true);
  }

  // ─── Search ───────────────────────────────────────────────────────────────────

  @Public()
  @Get('search')
  search(@Query('q') q?: string) {
    if (!q || q.trim().length < 2) throw new BadRequestException('En az 2 karakter girin.');
    return this.cmsService.search(q.trim());
  }

  // ─── Trainings ────────────────────────────────────────────────────────────────

  @Public()
  @Get('trainings')
  listTrainings() {
    return this.cmsService.listTrainings(true);
  }

  // ─── Exam Resources ───────────────────────────────────────────────────────────

  @Public()
  @Get('exam-resources')
  listExamResources(
    @Query('exam') exam?: string,
    @Query('type') type?: string,
  ) {
    return this.cmsService.listExamResources(exam, type);
  }

  // ─── Member City Distribution ─────────────────────────────────────────────────

  @Public()
  @Get('member-cities')
  getMemberCities() {
    return this.cmsService.getMemberCityStats();
  }

  // ─── Site Settings ────────────────────────────────────────────────────────────

  @Public()
  @Get('settings/:key')
  async getSetting(@Param('key') key: string) {
    const setting = await this.cmsService.getSetting(key);
    if (!setting) throw new NotFoundException(`Ayar bulunamadı: ${key}`);
    return setting;
  }

  // ─── Talents ──────────────────────────────────────────────────────────────────

  @Public()
  @Get('talents')
  listTalents(@Query('category') category?: string) {
    return this.cmsService.listTalents({ approvedOnly: true, ...(category ? { category } : {}) });
  }

  @Post('talents')
  @RequirePermission('user.profile.read')
  submitTalent(
    @Body() dto: CreateTalentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.cmsService.createTalent(dto, user.id, user.membershipTier);
  }
}
