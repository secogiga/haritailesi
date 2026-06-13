import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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

  @Post('events/:id/copy')
  copyEvent(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    return this.cmsService.copyEvent(id, actor.id);
  }

  // ─── Analytics ────────────────────────────────────────────────────────────────

  @Get('events/:id/stats')
  getEventStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.getEventStats(id);
  }

  // ─── Check-in ─────────────────────────────────────────────────────────────────

  @Patch('attendances/:id/checkin')
  checkinAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { registrationType: 'member' | 'public' },
  ) {
    return this.cmsService.checkinAttendance(id, dto.registrationType);
  }

  @Post('checkin/scan')
  checkinByTicket(@Body() dto: { ticketCode: string }) {
    return this.cmsService.checkinByTicketCode(dto.ticketCode);
  }

  // ─── Waitlist ─────────────────────────────────────────────────────────────────

  @Get('events/:id/waitlist')
  listWaitlist(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.listWaitlist(id);
  }

  // ─── Discussion Room ──────────────────────────────────────────────────────────

  @Post('events/:id/discussion-room')
  createDiscussionRoom(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: RequestUser) {
    return this.cmsService.createDiscussionRoom(id, actor.id);
  }

  // ─── Sponsors ─────────────────────────────────────────────────────────────────

  @Get('events/:id/sponsors')
  listSponsors(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.listEventSponsors(id, false);
  }

  @Post('events/:id/sponsors')
  createSponsor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { companyName: string; logoKey?: string; websiteUrl?: string; tier?: string; description?: string; sortOrder?: number },
  ) {
    return this.cmsService.createSponsor(id, dto);
  }

  @Patch('sponsors/:id')
  updateSponsor(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Record<string, unknown>) {
    return this.cmsService.updateSponsor(id, dto as Parameters<CmsService['updateSponsor']>[1]);
  }

  @Delete('sponsors/:id')
  deleteSponsor(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteSponsor(id);
  }

  // ─── Speakers ─────────────────────────────────────────────────────────────────

  @Get('events/:id/speakers')
  listSpeakers(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.listEventSpeakers(id);
  }

  @Post('events/:id/speakers')
  createSpeaker(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      name: string; title?: string; affiliation?: string;
      bio?: string; avatarUrl?: string; linkedinUrl?: string; sortOrder?: number;
    },
  ) {
    return this.cmsService.createSpeaker(id, dto);
  }

  @Patch('speakers/:id')
  updateSpeaker(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Record<string, unknown>,
  ) {
    return this.cmsService.updateSpeaker(id, dto as Parameters<CmsService['updateSpeaker']>[1]);
  }

  @Delete('speakers/:id')
  deleteSpeaker(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteSpeaker(id);
  }

  // ─── Sessions (Gündem) ────────────────────────────────────────────────────────

  @Get('events/:id/sessions')
  listSessions(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.listEventSessions(id);
  }

  @Post('events/:id/sessions')
  createSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      title: string; description?: string; sessionType?: string; hall?: string;
      startTime?: string; endTime?: string; speakerId?: string; sortOrder?: number;
    },
  ) {
    return this.cmsService.createSession(id, {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : null,
      endTime: dto.endTime ? new Date(dto.endTime) : null,
    });
  }

  @Patch('sessions/:id')
  updateSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Record<string, unknown>,
  ) {
    const parsed = { ...dto } as Parameters<CmsService['updateSession']>[1];
    if (dto['startTime']) parsed.startTime = new Date(dto['startTime'] as string);
    if (dto['endTime'])   parsed.endTime   = new Date(dto['endTime'] as string);
    return this.cmsService.updateSession(id, parsed);
  }

  @Delete('sessions/:id')
  deleteSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteSession(id);
  }

  // ─── Registration Questions ───────────────────────────────────────────────────

  @Get('events/:id/registration-questions')
  listRegQuestions(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.listRegistrationQuestions(id);
  }

  @Post('events/:id/registration-questions')
  createRegQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { question: string; questionType?: string; options?: string[]; isRequired?: boolean; sortOrder?: number },
  ) {
    return this.cmsService.createRegistrationQuestion(id, dto);
  }

  @Delete('registration-questions/:id')
  deleteRegQuestion(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteRegistrationQuestion(id);
  }

  @Get('events/:id/registration-answers')
  listRegAnswers(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.listRegistrationAnswers(id);
  }

  // ─── Event Invitation ─────────────────────────────────────────────────────────

  @Post('events/:id/invite')
  sendInvitations(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { segment?: 'all' | 'active'; channel?: 'email' | 'whatsapp' | 'both' },
  ) {
    return this.cmsService.sendEventInvitations(id, dto);
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

  @Patch('projects/bulk-linkedin-views')
  @HttpCode(HttpStatus.OK)
  bulkUpdateLinkedinViews(@Body() body: { items: Array<{ id: string; linkedinViewCount: number; linkedinClickCount?: number; linkedinLikeCount?: number; linkedinCommentCount?: number; linkedinPostUrl?: string }> }) {
    return this.cmsService.bulkUpdateLinkedinViews(body.items);
  }

  @Post('projects/:id/generate-kunye')
  @HttpCode(HttpStatus.OK)
  generateKunye(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.generateKunye(id);
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
    return this.cmsService.listTrainingsAdmin();
  }

  @Get('trainings/analytics')
  getTrainingAnalytics(@Query('days') days?: string) {
    const since = days ? new Date(Date.now() - Number(days) * 86400000) : undefined;
    return this.cmsService.getTrainingAnalytics(since);
  }

  @Post('trainings/:id/invite')
  @HttpCode(HttpStatus.OK)
  inviteUser(@Param('id', ParseUUIDPipe) id: string, @Body() dto: { email: string }) {
    return this.cmsService.inviteUserToCourse(id, dto.email);
  }

  @Get('trainings/:id/lesson-analytics')
  getLessonAnalytics(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.getLessonAnalytics(id);
  }

  // ─── Quiz Güvenlik Ayarları ───────────────────────────────────────────────────

  @Patch('quizzes/:id/settings')
  updateQuizSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      maxAttempts?: number; randomizeQuestions?: boolean;
      questionPoolSize?: number | null; showCorrectAnswers?: boolean;
      timeLimitMinutes?: number | null;
    },
  ) {
    return this.cmsService.updateQuizSettings(id, dto);
  }

  // ─── Ödeme Yönetimi ───────────────────────────────────────────────────────────

  @Get('course-payments')
  listPayments(@Query('status') status?: string) {
    return this.cmsService.listPendingPayments();
  }

  @Post('course-payments/:id/confirm')
  @HttpCode(HttpStatus.OK)
  confirmPayment(@Param('id', ParseUUIDPipe) id: string, @Body() dto: { adminNote?: string }) {
    return this.cmsService.confirmPayment(id, dto.adminNote);
  }

  @Post('course-payments/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectPayment(@Param('id', ParseUUIDPipe) id: string, @Body() dto: { adminNote?: string }) {
    return this.cmsService.rejectPayment(id, dto.adminNote);
  }

  // ─── Kurs Duyuruları ──────────────────────────────────────────────────────────

  @Get('trainings/:id/announcements')
  listAnnouncements(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.getCourseAnnouncements(id);
  }

  @Post('trainings/:id/announcements')
  createAnnouncement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { title: string; body: string },
  ) {
    return this.cmsService.createCourseAnnouncement(id, dto.title, dto.body);
  }

  @Delete('announcements/:id')
  deleteAnnouncement(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteCourseAnnouncement(id);
  }

  // ─── Ders Q&A Cevaplama ───────────────────────────────────────────────────────

  @Patch('lesson-questions/:id/answer')
  answerQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { answer: string },
    @CurrentUser() actor: RequestUser,
  ) {
    return this.cmsService.answerLessonQuestion(id, dto.answer, actor.id);
  }

  @Delete('lesson-questions/:id')
  deleteLessonQuestion(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteLessonQuestion(id);
  }

  @Get('trainings/:id/detail')
  getTrainingDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.getTraining(id, false).then(t =>
      this.cmsService.getTrainingDetail(t.slug, false),
    );
  }

  @Post('trainings')
  createTraining(@Body() body: Record<string, unknown>) {
    return this.cmsService.createTraining(body);
  }

  @Put('trainings/:id')
  updateTraining(@Param('id', ParseUUIDPipe) id: string, @Body() body: Record<string, unknown>) {
    return this.cmsService.updateTraining(id, body);
  }

  @Delete('trainings/:id')
  deleteTraining(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteTraining(id);
  }

  // ─── Kurs Bölümleri ───────────────────────────────────────────────────────────

  @Get('trainings/:id/sections')
  listSections(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.listSections(id);
  }

  @Post('trainings/:id/sections')
  createSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { title: string; description?: string; sortOrder?: number },
  ) {
    return this.cmsService.createSection(id, dto);
  }

  @Patch('sections/:id')
  updateSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { title?: string; description?: string; sortOrder?: number },
  ) {
    return this.cmsService.updateSection(id, dto);
  }

  @Delete('sections/:id')
  deleteSection(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteSection(id);
  }

  // ─── Kurs Dersleri ────────────────────────────────────────────────────────────

  @Post('sections/:id/lessons')
  createLesson(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: {
      slug: string; title: string; description?: string; contentType?: string;
      videoUrl?: string; videoEmbed?: string; body?: string; pdfKey?: string;
      durationMinutes?: number; sortOrder?: number; isFree?: boolean;
    },
  ) {
    return this.cmsService.createLesson(id, dto);
  }

  @Patch('lessons/:id')
  updateLesson(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Record<string, unknown>) {
    return this.cmsService.updateLesson(id, dto as Parameters<typeof this.cmsService.updateLesson>[1]);
  }

  @Delete('lessons/:id')
  deleteLesson(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteLesson(id);
  }

  // ─── Admin: Kayıtlı Üyeler ────────────────────────────────────────────────────

  @Get('trainings/:id/enrollments')
  listEnrollments(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.getMyEnrollments(id); // TODO: admin-specific list
  }

  @Delete('training-reviews/:id')
  deleteReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteReview(id);
  }

  // ─── Quiz Yönetimi ────────────────────────────────────────────────────────────

  @Get('trainings/:id/quizzes')
  listQuizzes(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.listQuizzes(id);
  }

  @Post('trainings/:id/quizzes')
  createQuiz(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { title: string; passingScore?: number; lessonId?: string },
  ) {
    return this.cmsService.createQuiz(id, dto);
  }

  @Post('quizzes/:id/questions')
  createQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { question: string; questionType?: string; options?: string[]; correctAnswers: string[]; explanation?: string; sortOrder?: number },
  ) {
    return this.cmsService.createQuestion(id, dto);
  }

  @Patch('quiz-questions/:id')
  updateQuestion(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Record<string, unknown>) {
    return this.cmsService.updateQuestion(id, dto as Parameters<typeof this.cmsService.updateQuestion>[1]);
  }

  @Delete('quiz-questions/:id')
  deleteQuestion(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.deleteQuestion(id);
  }

  // ─── Sertifika Yönetimi ───────────────────────────────────────────────────────

  @Post('trainings/:id/certificates/issue/:userId')
  issueCertificate(
    @Param('id', ParseUUIDPipe) trainingId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.cmsService.issueCertificate(userId, trainingId);
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
