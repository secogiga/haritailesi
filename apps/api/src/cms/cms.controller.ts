import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, ParseUUIDPipe, Post, Query, Patch, ParseIntPipe, DefaultValuePipe, Optional } from '@nestjs/common';
import { CmsService } from './cms.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../rbac/rbac.decorator';
import type { RequestUser } from '../auth/auth.types';
import { CreateTalentDto, SubmitProjectCommentDto } from './dto/cms.dto';

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

  // ─── Sponsors (public) ────────────────────────────────────────────────────────

  @Public()
  @Get('events/:id/sponsors')
  listSponsors(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.listEventSponsors(id, true);
  }

  // ─── Speakers & Sessions (public) ─────────────────────────────────────────────

  @Public()
  @Get('events/:id/speakers')
  listSpeakers(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.listEventSpeakers(id);
  }

  @Public()
  @Get('events/:id/sessions')
  listSessions(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.listEventSessions(id);
  }

  @Public()
  @Get('events/:id/registration-questions')
  listRegistrationQuestions(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.listRegistrationQuestions(id);
  }

  // ─── Session Wishlist ─────────────────────────────────────────────────────────

  @Post('sessions/:id/favorite')
  @RequirePermission('feed.read')
  @HttpCode(HttpStatus.OK)
  toggleFavorite(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.cmsService.toggleSessionFavorite(user.id, id);
  }

  @Get('events/:id/my-favorites')
  @RequirePermission('feed.read')
  getMyFavorites(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.cmsService.getMySessionFavorites(user.id, id);
  }

  // ─── Public Event Registration (üyeliksiz) ────────────────────────────────────

  @Public()
  @Post('events/:id/register')
  @HttpCode(HttpStatus.CREATED)
  publicRegister(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      email: string;
      displayName: string;
      phone?: string;
      whatsappConsent?: boolean;
      answers?: Record<string, string>;
    },
  ) {
    return this.cmsService.publicRegister(id, body);
  }

  // ─── Ticket Verification (Public) ─────────────────────────────────────────────

  @Public()
  @Get('tickets/:code')
  getTicket(@Param('code') code: string) {
    return this.cmsService.getTicketByCode(code);
  }

  // ─── Payment Webhook (iyzico callback) ───────────────────────────────────────

  @Public()
  @Post('events/:id/payment-webhook')
  @HttpCode(HttpStatus.OK)
  paymentWebhook(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { email: string; displayName: string; phone?: string; conversationId?: string; paymentId?: string },
  ) {
    return this.cmsService.publicRegister(id, {
      email: body.email,
      displayName: body.displayName,
      ...(body.phone ? { phone: body.phone } : {}),
      ticketTier: 'vip',
    });
  }

  // ─── Discussion (Mutfak post bağlantısı) ──────────────────────────────────────

  @Public()
  @Get('discussions/:postId')
  getDiscussion(@Param('postId', ParseUUIDPipe) postId: string) {
    return this.cmsService.getDiscussion(postId);
  }

  @Post('attendances/:id/answers')
  @RequirePermission('feed.read')
  @HttpCode(HttpStatus.OK)
  submitAnswers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { answers: Array<{ questionId: string; answer: string }> },
  ) {
    return this.cmsService.saveRegistrationAnswers(id, body.answers ?? []);
  }

  // ─── Projects ─────────────────────────────────────────────────────────────────

  @Public()
  @Get('projects')
  listProjects(@Query('status') status?: string, @Query('type') type?: string) {
    return this.cmsService.listProjects({ publishedOnly: true, ...(status ? { status } : {}), ...(type ? { type } : {}) });
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
  listTrainings(
    @Query('sinavMerkezi') sinavMerkezi?: string,
    @Query('sinavKey') sinavKey?: string,
  ) {
    return this.cmsService.listTrainings(true, {
      sinavMerkezi: sinavMerkezi === 'true',
      sinavKey: sinavKey || undefined,
    });
  }

  @Public()
  @Get('trainings/leaderboard')
  getLeaderboard(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return this.cmsService.getTrainingLeaderboard(Math.min(limit, 50));
  }

  @Public()
  @Get('trainings/:slug')
  getTrainingDetail(@Param('slug') slug: string) {
    return this.cmsService.getTrainingDetail(slug, true);
  }

  @Public()
  @Get('trainings/:slug/reviews')
  listReviews(@Param('slug') slug: string) {
    return this.cmsService.getTraining(slug, true).then(t => this.cmsService.listReviews(t.id));
  }

  // ─── Enrollment ───────────────────────────────────────────────────────────────

  @Post('trainings/:id/enroll')
  @RequirePermission('feed.read')
  @HttpCode(HttpStatus.OK)
  enroll(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return this.cmsService.enrollCourse(user.id, id);
  }

  @Delete('trainings/:id/enroll')
  @RequirePermission('feed.read')
  @HttpCode(HttpStatus.OK)
  unenroll(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return this.cmsService.unenrollCourse(user.id, id);
  }

  @Get('trainings/:id/enrollment-status')
  @RequirePermission('feed.read')
  getEnrollmentStatus(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return this.cmsService.getEnrollmentStatus(user.id, id);
  }

  @Get('trainings/enrollments/mine')
  @RequirePermission('feed.read')
  getMyEnrollments(@CurrentUser() user: RequestUser) {
    return this.cmsService.getMyEnrollments(user.id);
  }

  // ─── Ders İçeriği (üye kontrolü ile) ─────────────────────────────────────────

  @Get('trainings/:slug/lessons/:lessonSlug')
  @RequirePermission('feed.read')
  getLessonContent(
    @Param('slug') slug: string,
    @Param('lessonSlug') lessonSlug: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.cmsService.getLessonContent(slug, lessonSlug, user.id, user.membershipTier);
  }

  @Public()
  @Get('trainings/:slug/lessons/:lessonSlug/preview')
  getLessonPreview(@Param('slug') slug: string, @Param('lessonSlug') lessonSlug: string) {
    return this.cmsService.getLessonContent(slug, lessonSlug); // isFree kontrolü service içinde
  }

  // ─── Ders İlerlemesi ──────────────────────────────────────────────────────────

  @Post('lessons/:id/complete')
  @RequirePermission('feed.read')
  @HttpCode(HttpStatus.OK)
  markComplete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return this.cmsService.markLessonComplete(user.id, id);
  }

  @Delete('lessons/:id/complete')
  @RequirePermission('feed.read')
  @HttpCode(HttpStatus.OK)
  unmarkComplete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return this.cmsService.unmarkLessonComplete(user.id, id);
  }

  @Get('trainings/:id/my-progress')
  @RequirePermission('feed.read')
  getMyProgress(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return this.cmsService.getMyLessonProgress(user.id, id);
  }

  // ─── Kurs Yorumları ───────────────────────────────────────────────────────────

  @Post('trainings/:id/reviews')
  @RequirePermission('feed.read')
  @HttpCode(HttpStatus.CREATED)
  addReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { rating: number; comment?: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.cmsService.addReview(user.id, id, dto);
  }

  // ─── Quiz ─────────────────────────────────────────────────────────────────────

  @Get('quizzes/:id')
  @RequirePermission('feed.read')
  getQuiz(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return this.cmsService.getQuiz(id, true, user.id);
  }

  @Public()
  @Get('quizzes/:id/preview')
  getQuizPreview(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.getQuiz(id, true);
  }

  @Post('quizzes/:id/submit')
  @RequirePermission('feed.read')
  @HttpCode(HttpStatus.OK)
  submitQuiz(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { answers: Record<string, string | string[]> },
    @CurrentUser() user: RequestUser,
  ) {
    return this.cmsService.submitQuiz(user.id, id, dto.answers);
  }

  @Get('quizzes/:id/my-attempts')
  @RequirePermission('feed.read')
  getMyAttempts(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return this.cmsService.getMyQuizAttempts(user.id, id);
  }

  @Get('quiz-attempts/mine')
  @RequirePermission('feed.read')
  getAllMyAttempts(@CurrentUser() user: RequestUser) {
    return this.cmsService.getAllMyQuizAttempts(user.id);
  }

  // ─── Kurs Ödemeleri ───────────────────────────────────────────────────────────

  @Post('trainings/:id/payment-request')
  @RequirePermission('feed.read')
  @HttpCode(HttpStatus.OK)
  requestPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { paymentRef?: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.cmsService.requestCoursePayment(user.id, id, dto.paymentRef);
  }

  @Get('payments/mine')
  @RequirePermission('feed.read')
  getMyPayments(@CurrentUser() user: RequestUser) {
    return this.cmsService.getMyPayments(user.id);
  }

  // ─── Sertifika ────────────────────────────────────────────────────────────────

  @Get('certificates/verify/:code')
  @Public()
  verifyCertificate(@Param('code') code: string) {
    return this.cmsService.verifyCertificate(code);
  }

  @Get('certificates/mine')
  @RequirePermission('feed.read')
  getMyCertificates(@CurrentUser() user: RequestUser) {
    return this.cmsService.getMyCertificates(user.id);
  }

  @Get('trainings/:id/certificate')
  @RequirePermission('feed.read')
  getMyCertificate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    return this.cmsService.getCertificate(user.id, id);
  }

  // ─── Ders Q&A ─────────────────────────────────────────────────────────────────

  @Public()
  @Get('lessons/:id/questions')
  getLessonQuestions(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.getLessonQuestions(id);
  }

  @Post('lessons/:id/questions')
  @RequirePermission('feed.read')
  @HttpCode(HttpStatus.CREATED)
  askQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { question: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.cmsService.askLessonQuestion(user.id, id, dto.question);
  }

  // ─── Kurs Duyuruları (public okuma) ───────────────────────────────────────────

  @Public()
  @Get('trainings/:id/announcements')
  getCourseAnnouncements(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmsService.getCourseAnnouncements(id);
  }

  // ─── Kullanıcı Rozetleri ──────────────────────────────────────────────────────

  @Get('badges/mine')
  @RequirePermission('feed.read')
  getMyBadges(@CurrentUser() user: RequestUser) {
    return this.cmsService.getUserBadges(user.id);
  }

  @Get('badges/definitions')
  @Public()
  getBadgeDefinitions() {
    return [...CmsService.BADGE_DEFS];
  }

  @Get('my-xp')
  @RequirePermission('feed.read')
  getMyXp(@CurrentUser() user: RequestUser) {
    return this.cmsService.getMyXp(user.id);
  }

  @Get('ranks')
  @Public()
  getRanks() {
    return [...CmsService.RANKS];
  }

  @Get('learner-stats/:userId')
  @Public()
  getLearnerStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.cmsService.getPublicLearnerStats(userId);
  }

  @Get('xp-leaderboard')
  @Public()
  getXpLeaderboard(@Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number) {
    return this.cmsService.getXpLeaderboard(Math.min(limit, 50));
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

  // ─── Project Interactions ─────────────────────────────────────────────────────

  @Post('projects/:slug/like')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('feed.read')
  toggleProjectLike(
    @Param('slug') slug: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.cmsService.toggleProjectLike(user.id, slug);
  }

  @Post('projects/:slug/favorite')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('feed.read')
  toggleProjectFavorite(
    @Param('slug') slug: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.cmsService.toggleProjectFavorite(user.id, slug);
  }

  @Public()
  @Get('projects/:slug/interactions')
  getProjectInteractions(
    @Param('slug') slug: string,
    @CurrentUser() user?: RequestUser,
  ) {
    return this.cmsService.getProjectInteractions(slug, user?.id);
  }

  @Public()
  @Get('projects/:slug/comments')
  listProjectComments(@Param('slug') slug: string) {
    return this.cmsService.listProjectComments(slug);
  }

  @Public()
  @Post('projects/:slug/comments')
  @HttpCode(HttpStatus.CREATED)
  submitProjectComment(
    @Param('slug') slug: string,
    @Body() dto: SubmitProjectCommentDto,
  ) {
    return this.cmsService.submitProjectComment(slug, dto);
  }

  @Public()
  @Get('comments/verify')
  verifyProjectComment(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token gerekli.');
    return this.cmsService.verifyProjectComment(token);
  }
}
