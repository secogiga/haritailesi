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
import { CmsService } from './cms.service';
import { RequirePermission } from '../rbac/rbac.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import {
  UpsertPageDto,
  CreateBoardMemberDto,
  UpdateBoardMemberDto,
  CreateEventDto,
  UpdateEventDto,
  CreateProjectDto,
  UpdateProjectDto,
  AdminUpdateTalentDto,
  AdminCreateTalentDto,
} from './dto/cms.dto';

@Controller('admin/cms')
@RequirePermission('content.publish')
export class AdminCmsController {
  constructor(private readonly cmsService: CmsService) {}

  // ─── Pages ────────────────────────────────────────────────────────────────────

  @Get('pages')
  listPages() {
    return this.cmsService.listPages();
  }

  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) {
    return this.cmsService.getPage(slug, false);
  }

  @Put('pages/:slug')
  upsertPage(
    @Param('slug') slug: string,
    @Body() dto: UpsertPageDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.cmsService.upsertPage(slug, dto, actor.id);
  }

  @Delete('pages/:slug')
  deletePage(@Param('slug') slug: string) {
    return this.cmsService.deletePage(slug);
  }

  // ─── Board Members ────────────────────────────────────────────────────────────

  @Get('board-members')
  listBoardMembers() {
    return this.cmsService.listBoardMembers(false);
  }

  @Get('board-members/:id')
  getBoardMember(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.getBoardMember(id);
  }

  @Post('board-members')
  createBoardMember(@Body() dto: CreateBoardMemberDto) {
    return this.cmsService.createBoardMember(dto);
  }

  @Put('board-members/:id')
  updateBoardMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBoardMemberDto,
  ) {
    return this.cmsService.updateBoardMember(id, dto);
  }

  @Delete('board-members/:id')
  deleteBoardMember(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteBoardMember(id);
  }

  // ─── Events ───────────────────────────────────────────────────────────────────

  @Get('events')
  listEvents(@Query('type') type?: string) {
    return this.cmsService.listEvents({ ...(type ? { type } : {}) });
  }

  @Get('events/:id')
  getEvent(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.getEventById(id);
  }

  @Post('events')
  createEvent(@Body() dto: CreateEventDto, @CurrentUser() actor: RequestUser) {
    return this.cmsService.createEvent(dto, actor.id);
  }

  @Put('events/:id')
  updateEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.cmsService.updateEvent(id, dto);
  }

  @Get('events/:id/attendees')
  listEventAttendees(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.listEventAttendees(id);
  }

  @Delete('events/:id')
  deleteEvent(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteEvent(id);
  }

  // ─── Projects ─────────────────────────────────────────────────────────────────

  @Get('projects')
  listProjects(@Query('status') status?: string) {
    return this.cmsService.listProjects({ ...(status ? { status } : {}) });
  }

  @Get('projects/:id')
  getProject(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.getProjectById(id);
  }

  @Post('projects')
  createProject(@Body() dto: CreateProjectDto, @CurrentUser() actor: RequestUser) {
    return this.cmsService.createProject(dto, actor.id);
  }

  @Put('projects/:id')
  updateProject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.cmsService.updateProject(id, dto);
  }

  @Delete('projects/:id')
  deleteProject(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteProject(id);
  }

  // ─── Site Settings ────────────────────────────────────────────────────────────

  @Get('settings/:key')
  getSetting(@Param('key') key: string) {
    return this.cmsService.getSetting(key);
  }

  @Put('settings/:key')
  upsertSetting(
    @Param('key') key: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.cmsService.upsertSetting(key, body, actor.id);
  }

  // ─── Trainings ────────────────────────────────────────────────────────────────

  @Get('trainings')
  listTrainings() {
    return this.cmsService.listTrainings(false);
  }

  @Post('trainings')
  createTraining(@Body() body: Record<string, unknown>) {
    return this.cmsService.createTraining(body as Parameters<typeof this.cmsService.createTraining>[0]);
  }

  @Put('trainings/:id')
  updateTraining(@Param('id', ParseUUIDPipe) id: string, @Body() body: Record<string, unknown>) {
    return this.cmsService.updateTraining(id, body as Parameters<typeof this.cmsService.updateTraining>[1]);
  }

  @Delete('trainings/:id')
  deleteTraining(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteTraining(id);
  }

  // ─── Exam Resources ───────────────────────────────────────────────────────────

  @Get('exam-resources')
  listAllExamResources(@Query('exam') exam?: string, @Query('type') type?: string) {
    return this.cmsService.listAllExamResources(exam, type);
  }

  @Post('exam-resources')
  createExamResource(@Body() body: Record<string, unknown>) {
    return this.cmsService.createExamResource(body as Parameters<typeof this.cmsService.createExamResource>[0]);
  }

  @Put('exam-resources/:id')
  updateExamResource(@Param('id', ParseUUIDPipe) id: string, @Body() body: Record<string, unknown>) {
    return this.cmsService.updateExamResource(id, body as Parameters<typeof this.cmsService.updateExamResource>[1]);
  }

  @Delete('exam-resources/:id')
  deleteExamResource(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteExamResource(id);
  }

  // ─── Talents ──────────────────────────────────────────────────────────────────

  @Get('talents')
  listTalents(@Query('status') status?: string, @Query('category') category?: string) {
    return this.cmsService.listTalents({ ...(category ? { category } : {}) });
  }

  @Post('talents')
  createTalent(@Body() dto: AdminCreateTalentDto) {
    return this.cmsService.adminCreateTalent(dto);
  }

  @Get('talents/:id')
  getTalent(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.getTalent(id);
  }

  @Patch('talents/:id')
  updateTalent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateTalentDto,
  ) {
    return this.cmsService.adminUpdateTalent(id, dto);
  }

  @Delete('talents/:id')
  deleteTalent(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteTalent(id);
  }
}
