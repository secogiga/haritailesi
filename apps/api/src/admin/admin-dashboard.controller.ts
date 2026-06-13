import { Controller, Get } from '@nestjs/common';
import { RequirePermission } from '../rbac/rbac.decorator';
import { calculateLevel } from '../users/level.utils';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import {
  users,
  userProfiles,
  applications,
  mentorshipRequests,
  posts,
  postReactions,
  comments,
  mentorProfiles,
  events,
  eventAttendances,
  projects,
  trainings,
  competitions,
  surveys,
  surveyResponses,
  examResources,
  meetingSessions,
  meetingParticipants,
  contentRequests,
  jobListings,
  studentClubs,
  communityQuestions,
  communityAnswers,
  userEvents,
  userLevelActions,
} from '@haritailesi/database';
import { eq, isNull, isNotNull, and, ne, sql, count, gte, gt, lte, sum } from 'drizzle-orm';

@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(@InjectDb() private readonly db: Database) {}

  @Get()
  @RequirePermission('admin.dashboard.read')
  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(startOfMonth.getTime() - 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const activeUserCondition = and(isNull(users.deletedAt), ne(users.status, 'deleted'));

    const [
      userCounts,
      newUsersThisMonth,
      usersByStatus,
      pendingApplications,
      applicationsByState,
      pendingMentorship,
      acceptedMentorship,
      completedMentorship,
      activeMentors,
      totalMeetingSessions,
      totalMeetingParticipants,
      publishedPosts,
      newPostsThisMonth,
      totalComments,
      totalReactions,
      postsByType,
      postsByCategory,
      totalEvents,
      publishedEvents,
      upcomingEvents,
      totalEventViews,
      eventsByType,
      totalProjects,
      projectsByStatus,
      contentRequestsByType,
      contentRequestsPending,
      publishedJobListings,
      activeClubs,
      pendingClubs,
      memberTopCities,
      memberByWorkStatus,
      memberByExperienceBand,
      memberByAgeBand,
      memberByVerificationStatus,
      memberRecentlyActive,
      memberByJoinMonth,
      trainingsViewTotal,
      trainingsCount,
      projectsViewTotal,
      publishedProjectsCount,
      competitionsViewTotal,
      activeCompetitionsCount,
      surveysViewTotal,
      activeSurveysCount,
      examResourcesViewTotal,
      publishedExamResourcesCount,
      newUsersLastMonth,
      newPostsLastMonth,
    ] = await Promise.all([
      // ── Users ──────────────────────────────────────────────────────────────────

      this.db
        .select({ tier: users.membershipTier, count: count() })
        .from(users)
        .where(activeUserCondition)
        .groupBy(users.membershipTier),

      this.db
        .select({ count: count() })
        .from(users)
        .where(and(activeUserCondition, gte(users.createdAt, startOfMonth))),

      this.db
        .select({ status: users.status, count: count() })
        .from(users)
        .where(isNull(users.deletedAt))
        .groupBy(users.status),

      // ── Applications ───────────────────────────────────────────────────────────

      this.db
        .select({ count: count() })
        .from(applications)
        .where(eq(applications.state, 'submitted')),

      this.db
        .select({ state: applications.state, count: count() })
        .from(applications)
        .groupBy(applications.state),

      // ── Mentorship ─────────────────────────────────────────────────────────────

      this.db
        .select({ count: count() })
        .from(mentorshipRequests)
        .where(eq(mentorshipRequests.status, 'pending')),

      this.db
        .select({ count: count() })
        .from(mentorshipRequests)
        .where(eq(mentorshipRequests.status, 'accepted')),

      this.db
        .select({ count: count() })
        .from(mentorshipRequests)
        .where(eq(mentorshipRequests.status, 'completed')),

      this.db
        .select({ count: count() })
        .from(mentorProfiles)
        .where(eq(mentorProfiles.isAcceptingRequests, true)),

      this.db
        .select({ count: count() })
        .from(meetingSessions),

      this.db
        .select({ count: count() })
        .from(meetingParticipants),

      // ── Feed ───────────────────────────────────────────────────────────────────

      this.db
        .select({ count: count() })
        .from(posts)
        .where(eq(posts.status, 'published')),

      this.db
        .select({ count: count() })
        .from(posts)
        .where(and(eq(posts.status, 'published'), gte(posts.createdAt, startOfMonth))),

      this.db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.isDeleted, false)),

      this.db
        .select({ count: count() })
        .from(postReactions),

      this.db
        .select({ type: posts.type, count: count() })
        .from(posts)
        .where(eq(posts.status, 'published'))
        .groupBy(posts.type)
        .orderBy(sql`count(*) desc`),

      this.db
        .select({ category: posts.category, count: count() })
        .from(posts)
        .where(eq(posts.status, 'published'))
        .groupBy(posts.category)
        .orderBy(sql`count(*) desc`)
        .limit(5),

      // ── Events ─────────────────────────────────────────────────────────────────

      this.db.select({ count: count() }).from(events),

      this.db
        .select({ count: count() })
        .from(events)
        .where(eq(events.isPublished, true)),

      this.db
        .select({ count: count() })
        .from(events)
        .where(and(eq(events.isPublished, true), gt(events.dateStart, now))),

      this.db
        .select({ total: sum(events.viewCount) })
        .from(events),

      this.db
        .select({
          type: events.type,
          count: count(),
          views: sum(events.viewCount),
        })
        .from(events)
        .where(eq(events.isPublished, true))
        .groupBy(events.type)
        .orderBy(sql`count(*) desc`),

      // ── Projects ───────────────────────────────────────────────────────────────

      this.db.select({ count: count() }).from(projects),

      this.db
        .select({ status: projects.status, count: count() })
        .from(projects)
        .groupBy(projects.status),

      // ── Content Requests ───────────────────────────────────────────────────────

      this.db
        .select({ type: contentRequests.type, count: count() })
        .from(contentRequests)
        .groupBy(contentRequests.type),

      this.db
        .select({ count: count() })
        .from(contentRequests)
        .where(eq(contentRequests.status, 'pending')),

      // ── Marketplace ────────────────────────────────────────────────────────────

      this.db
        .select({ count: count() })
        .from(jobListings)
        .where(eq(jobListings.status, 'published')),

      // ── Student Clubs ──────────────────────────────────────────────────────────

      this.db
        .select({ count: count() })
        .from(studentClubs)
        .where(eq(studentClubs.status, 'active')),

      this.db
        .select({ count: count() })
        .from(studentClubs)
        .where(eq(studentClubs.status, 'pending')),

      // ── Member Details ─────────────────────────────────────────────────────────

      this.db
        .select({ city: userProfiles.city, count: count() })
        .from(users)
        .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(and(activeUserCondition, isNotNull(userProfiles.city)))
        .groupBy(userProfiles.city)
        .orderBy(sql`count(*) desc`)
        .limit(10),

      this.db
        .select({ workStatus: userProfiles.workStatus, count: count() })
        .from(users)
        .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(and(activeUserCondition, isNotNull(userProfiles.workStatus)))
        .groupBy(userProfiles.workStatus)
        .orderBy(sql`count(*) desc`),

      this.db
        .select({
          band: sql<string>`CASE
            WHEN ${userProfiles.professionalExperienceYears} <= 2 THEN '0-2 yıl'
            WHEN ${userProfiles.professionalExperienceYears} <= 5 THEN '3-5 yıl'
            WHEN ${userProfiles.professionalExperienceYears} <= 10 THEN '6-10 yıl'
            ELSE '10+ yıl'
          END`,
          count: count(),
        })
        .from(users)
        .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(and(activeUserCondition, isNotNull(userProfiles.professionalExperienceYears)))
        .groupBy(sql`1`),

      this.db
        .select({
          band: sql<string>`CASE
            WHEN DATE_PART('year', AGE(CURRENT_DATE, ${userProfiles.birthDate}::date)) < 26 THEN '18-25'
            WHEN DATE_PART('year', AGE(CURRENT_DATE, ${userProfiles.birthDate}::date)) < 36 THEN '26-35'
            WHEN DATE_PART('year', AGE(CURRENT_DATE, ${userProfiles.birthDate}::date)) < 46 THEN '36-45'
            ELSE '46+'
          END`,
          count: count(),
        })
        .from(users)
        .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(and(activeUserCondition, isNotNull(userProfiles.birthDate)))
        .groupBy(sql`1`),

      this.db
        .select({ status: users.verificationStatus, count: count() })
        .from(users)
        .where(activeUserCondition)
        .groupBy(users.verificationStatus)
        .orderBy(sql`count(*) desc`),

      this.db
        .select({ count: count() })
        .from(users)
        .where(and(activeUserCondition, gte(users.lastLoginAt, thirtyDaysAgo))),

      this.db
        .select({
          month: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM')`,
          count: count(),
        })
        .from(users)
        .where(and(activeUserCondition, gte(users.createdAt, twelveMonthsAgo)))
        .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`),

      // ── Sahne — Trainings ──────────────────────────────────────────────────────

      this.db.select({ total: sum(trainings.viewCount) }).from(trainings),

      this.db.select({ count: count() }).from(trainings).where(eq(trainings.isPublished, true)),

      // ── Sahne — Projects ───────────────────────────────────────────────────────

      this.db.select({ total: sum(projects.viewCount) }).from(projects),

      this.db.select({ count: count() }).from(projects).where(eq(projects.isPublished, true)),

      // ── Sahne — Competitions ───────────────────────────────────────────────────

      this.db.select({ total: sum(competitions.viewCount) }).from(competitions),

      this.db.select({ count: count() }).from(competitions).where(eq(competitions.status, 'active')),

      // ── Sahne — Surveys ────────────────────────────────────────────────────────

      this.db.select({ total: sum(surveys.viewCount) }).from(surveys),

      this.db.select({ count: count() }).from(surveys).where(eq(surveys.status, 'active')),

      // ── Sahne — Exam Resources ─────────────────────────────────────────────────

      this.db.select({ total: sum(examResources.viewCount) }).from(examResources),

      this.db.select({ count: count() }).from(examResources).where(eq(examResources.isPublished, true)),

      // ── Month-over-Month ────────────────────────────────────────────────────────

      this.db
        .select({ count: count() })
        .from(users)
        .where(and(activeUserCondition, gte(users.createdAt, startOfLastMonth), lte(users.createdAt, endOfLastMonth))),

      this.db
        .select({ count: count() })
        .from(posts)
        .where(and(eq(posts.status, 'published'), gte(posts.createdAt, startOfLastMonth), lte(posts.createdAt, endOfLastMonth))),
    ]);

    const totalActiveUsers = userCounts.reduce((s, r) => s + Number(r.count), 0);

    return {
      users: {
        total: totalActiveUsers,
        newThisMonth: Number(newUsersThisMonth[0]?.count ?? 0),
        newLastMonth: Number(newUsersLastMonth[0]?.count ?? 0),
        byTier: Object.fromEntries(userCounts.map((r) => [r.tier, Number(r.count)])),
        byStatus: Object.fromEntries(usersByStatus.map((r) => [r.status, Number(r.count)])),
      },
      applications: {
        pending: Number(pendingApplications[0]?.count ?? 0),
        byState: Object.fromEntries(applicationsByState.map((r) => [r.state, Number(r.count)])),
      },
      events: {
        total: Number(totalEvents[0]?.count ?? 0),
        published: Number(publishedEvents[0]?.count ?? 0),
        upcoming: Number(upcomingEvents[0]?.count ?? 0),
        totalViews: Number(totalEventViews[0]?.total ?? 0),
        byType: eventsByType.map((r) => ({
          type: r.type,
          count: Number(r.count),
          views: Number(r.views ?? 0),
        })),
      },
      projects: {
        total: Number(totalProjects[0]?.count ?? 0),
        byStatus: Object.fromEntries(projectsByStatus.map((r) => [r.status, Number(r.count)])),
      },
      contentRequests: {
        pending: Number(contentRequestsPending[0]?.count ?? 0),
        byType: Object.fromEntries(contentRequestsByType.map((r) => [r.type, Number(r.count)])),
      },
      marketplace: {
        publishedListings: Number(publishedJobListings[0]?.count ?? 0),
      },
      studentClubs: {
        active: Number(activeClubs[0]?.count ?? 0),
        pending: Number(pendingClubs[0]?.count ?? 0),
      },
      mentorship: {
        pending: Number(pendingMentorship[0]?.count ?? 0),
        accepted: Number(acceptedMentorship[0]?.count ?? 0),
        completed: Number(completedMentorship[0]?.count ?? 0),
        activeMentors: Number(activeMentors[0]?.count ?? 0),
        totalSessions: Number(totalMeetingSessions[0]?.count ?? 0),
        totalSessionParticipants: Number(totalMeetingParticipants[0]?.count ?? 0),
      },
      feed: {
        publishedPosts: Number(publishedPosts[0]?.count ?? 0),
        newPostsThisMonth: Number(newPostsThisMonth[0]?.count ?? 0),
        newPostsLastMonth: Number(newPostsLastMonth[0]?.count ?? 0),
        totalComments: Number(totalComments[0]?.count ?? 0),
        totalReactions: Number(totalReactions[0]?.count ?? 0),
        byType: postsByType.map((r) => ({ type: r.type, count: Number(r.count) })),
        topCategories: postsByCategory.map((r) => ({ category: r.category, count: Number(r.count) })),
      },
      memberDetails: {
        topCities: memberTopCities
          .filter((r) => r.city !== null)
          .map((r) => ({ city: r.city!, count: Number(r.count) })),
        byWorkStatus: memberByWorkStatus
          .filter((r) => r.workStatus !== null)
          .map((r) => ({ workStatus: r.workStatus!, count: Number(r.count) })),
        byExperienceBand: memberByExperienceBand.map((r) => ({ band: r.band, count: Number(r.count) })),
        byAgeBand: memberByAgeBand.map((r) => ({ band: r.band, count: Number(r.count) })),
        byVerificationStatus: Object.fromEntries(memberByVerificationStatus.map((r) => [r.status, Number(r.count)])),
        recentlyActive: Number(memberRecentlyActive[0]?.count ?? 0),
        byJoinMonth: memberByJoinMonth.map((r) => ({ month: r.month, count: Number(r.count) })),
      },
      sahne: (() => {
        const byContentType = [
          { type: 'events',        views: Number(totalEventViews[0]?.total ?? 0), count: Number(totalEvents[0]?.count ?? 0) },
          { type: 'trainings',     views: Number(trainingsViewTotal[0]?.total ?? 0), count: Number(trainingsCount[0]?.count ?? 0) },
          { type: 'projects',      views: Number(projectsViewTotal[0]?.total ?? 0), count: Number(publishedProjectsCount[0]?.count ?? 0) },
          { type: 'competitions',  views: Number(competitionsViewTotal[0]?.total ?? 0), count: Number(activeCompetitionsCount[0]?.count ?? 0) },
          { type: 'surveys',       views: Number(surveysViewTotal[0]?.total ?? 0), count: Number(activeSurveysCount[0]?.count ?? 0) },
          { type: 'examResources', views: Number(examResourcesViewTotal[0]?.total ?? 0), count: Number(publishedExamResourcesCount[0]?.count ?? 0) },
        ];
        return {
          totalViews: byContentType.reduce((s, r) => s + r.views, 0),
          byContentType,
        };
      })(),
    };
  }

  // ── Sahne Dedicated Stats ──────────────────────────────────────────────────

  @Get('sahne-stats')
  @RequirePermission('admin.dashboard.read')
  async getSahneStats() {
    const now = new Date();

    const [
      // Events
      eventsTotal,
      eventsPublished,
      eventsUpcoming,
      eventsTotalViews,
      eventsByType,

      // Trainings
      trainingsTotal,
      trainingsPublished,
      trainingsTotalViews,
      trainingsByFormat,
      trainingsByLevel,

      // Projects
      projectsTotal,
      projectsPublished,
      projectsTotalViews,
      projectsByStatus,

      // Competitions
      competitionsTotal,
      competitionsActive,
      competitionsEnded,
      competitionsTotalViews,

      // Surveys
      surveysTotal,
      surveysActive,
      surveysEnded,
      surveysTotalViews,
      surveysTotalResponses,

      // ExamResources
      examResourcesTotal,
      examResourcesPublished,
      examResourcesTotalViews,
      examResourcesByKey,

      // Q&A
      qaPublishedQuestions,
      qaPublishedAnswers,
      qaPendingQuestions,
    ] = await Promise.all([

      // ── Events ──────────────────────────────────────────────────────────────
      this.db.select({ count: count() }).from(events),
      this.db.select({ count: count() }).from(events).where(eq(events.isPublished, true)),
      this.db.select({ count: count() }).from(events).where(and(eq(events.isPublished, true), gt(events.dateStart, now))),
      this.db.select({ total: sum(events.viewCount) }).from(events),
      this.db.select({ type: events.type, count: count(), views: sum(events.viewCount) })
        .from(events).where(eq(events.isPublished, true))
        .groupBy(events.type).orderBy(sql`SUM(${events.viewCount}) DESC`),

      // ── Trainings ───────────────────────────────────────────────────────────
      this.db.select({ count: count() }).from(trainings),
      this.db.select({ count: count() }).from(trainings).where(eq(trainings.isPublished, true)),
      this.db.select({ total: sum(trainings.viewCount) }).from(trainings),
      this.db.select({ format: trainings.format, count: count(), views: sum(trainings.viewCount) })
        .from(trainings).where(eq(trainings.isPublished, true))
        .groupBy(trainings.format).orderBy(sql`count(*) DESC`),
      this.db.select({ level: trainings.level, count: count() })
        .from(trainings).where(eq(trainings.isPublished, true))
        .groupBy(trainings.level).orderBy(sql`count(*) DESC`),

      // ── Projects ────────────────────────────────────────────────────────────
      this.db.select({ count: count() }).from(projects),
      this.db.select({ count: count() }).from(projects).where(eq(projects.isPublished, true)),
      this.db.select({ total: sum(projects.viewCount) }).from(projects),
      this.db.select({ status: projects.status, count: count() })
        .from(projects).groupBy(projects.status).orderBy(sql`count(*) DESC`),

      // ── Competitions ─────────────────────────────────────────────────────────
      this.db.select({ count: count() }).from(competitions),
      this.db.select({ count: count() }).from(competitions).where(eq(competitions.status, 'active')),
      this.db.select({ count: count() }).from(competitions).where(eq(competitions.status, 'ended')),
      this.db.select({ total: sum(competitions.viewCount) }).from(competitions),

      // ── Surveys ─────────────────────────────────────────────────────────────
      this.db.select({ count: count() }).from(surveys),
      this.db.select({ count: count() }).from(surveys).where(eq(surveys.status, 'active')),
      this.db.select({ count: count() }).from(surveys).where(eq(surveys.status, 'ended')),
      this.db.select({ total: sum(surveys.viewCount) }).from(surveys),
      this.db.select({ count: count() }).from(surveyResponses),

      // ── ExamResources ────────────────────────────────────────────────────────
      this.db.select({ count: count() }).from(examResources),
      this.db.select({ count: count() }).from(examResources).where(eq(examResources.isPublished, true)),
      this.db.select({ total: sum(examResources.viewCount) }).from(examResources),
      this.db.select({ examKey: examResources.examKey, count: count(), views: sum(examResources.viewCount) })
        .from(examResources).where(eq(examResources.isPublished, true))
        .groupBy(examResources.examKey).orderBy(sql`count(*) DESC`),

      // ── Q&A ─────────────────────────────────────────────────────────────────
      this.db.select({ count: count() }).from(communityQuestions)
        .where(sql`${communityQuestions.isSahnePublished} = true OR ${communityQuestions.isMutfakPublished} = true`),
      this.db.select({ count: count() }).from(communityAnswers).where(eq(communityAnswers.isPublished, true)),
      this.db.select({ count: count() }).from(communityQuestions).where(eq(communityQuestions.status, 'pending')),
    ]);

    const eventViews = Number(eventsTotalViews[0]?.total ?? 0);

    const trainingViews = Number(trainingsTotalViews[0]?.total ?? 0);
    const projectViews = Number(projectsTotalViews[0]?.total ?? 0);
    const competitionViews = Number(competitionsTotalViews[0]?.total ?? 0);
    const surveyViews = Number(surveysTotalViews[0]?.total ?? 0);
    const examViews = Number(examResourcesTotalViews[0]?.total ?? 0);
    const totalViews = eventViews + trainingViews + projectViews + competitionViews + surveyViews + examViews;

    const eventsPublishedCount = Number(eventsPublished[0]?.count ?? 0);
    const trainingsPublishedCount = Number(trainingsPublished[0]?.count ?? 0);
    const projectsPublishedCount = Number(projectsPublished[0]?.count ?? 0);
    const competitionsActiveCount = Number(competitionsActive[0]?.count ?? 0);
    const surveysActiveCount = Number(surveysActive[0]?.count ?? 0);
    const examPublishedCount = Number(examResourcesPublished[0]?.count ?? 0);
    const totalPublished = eventsPublishedCount + trainingsPublishedCount + projectsPublishedCount + competitionsActiveCount + surveysActiveCount + examPublishedCount;

    return {
      summary: {
        totalViews,
        totalPublished,
        avgViewsPerContent: totalPublished > 0 ? Math.round(totalViews / totalPublished) : 0,
      },
      events: {
        total: Number(eventsTotal[0]?.count ?? 0),
        published: eventsPublishedCount,
        upcoming: Number(eventsUpcoming[0]?.count ?? 0),
        past: eventsPublishedCount - Number(eventsUpcoming[0]?.count ?? 0),
        totalViews: eventViews,
        byType: eventsByType.map(r => ({ type: r.type, count: Number(r.count), views: Number(r.views ?? 0) })),
      },
      trainings: {
        total: Number(trainingsTotal[0]?.count ?? 0),
        published: trainingsPublishedCount,
        totalViews: trainingViews,
        byFormat: trainingsByFormat.filter(r => r.format).map(r => ({ format: r.format!, count: Number(r.count), views: Number(r.views ?? 0) })),
        byLevel: trainingsByLevel.filter(r => r.level).map(r => ({ level: r.level!, count: Number(r.count) })),
      },
      projects: {
        total: Number(projectsTotal[0]?.count ?? 0),
        published: projectsPublishedCount,
        totalViews: projectViews,
        byStatus: projectsByStatus.map(r => ({ status: r.status, count: Number(r.count) })),
      },
      competitions: {
        total: Number(competitionsTotal[0]?.count ?? 0),
        active: competitionsActiveCount,
        ended: Number(competitionsEnded[0]?.count ?? 0),
        totalViews: competitionViews,
      },
      surveys: {
        total: Number(surveysTotal[0]?.count ?? 0),
        active: surveysActiveCount,
        ended: Number(surveysEnded[0]?.count ?? 0),
        totalViews: surveyViews,
        totalResponses: Number(surveysTotalResponses[0]?.count ?? 0),
      },
      examResources: {
        total: Number(examResourcesTotal[0]?.count ?? 0),
        published: examPublishedCount,
        totalViews: examViews,
        byKey: examResourcesByKey.map(r => ({ examKey: r.examKey, count: Number(r.count), views: Number(r.views ?? 0) })),
      },
      qa: {
        publishedQuestions: Number(qaPublishedQuestions[0]?.count ?? 0),
        publishedAnswers: Number(qaPublishedAnswers[0]?.count ?? 0),
        pendingQuestions: Number(qaPendingQuestions[0]?.count ?? 0),
      },
      contentTable: [
        { type: 'events',        label: 'Etkinlikler',       count: eventsPublishedCount,      views: eventViews },
        { type: 'trainings',     label: 'Eğitimler',         count: trainingsPublishedCount,   views: trainingViews },
        { type: 'projects',      label: 'Projeler',          count: projectsPublishedCount,    views: projectViews },
        { type: 'competitions',  label: 'Yarışmalar',        count: competitionsActiveCount,   views: competitionViews },
        { type: 'surveys',       label: 'Anketler',          count: surveysActiveCount,        views: surveyViews },
        { type: 'examResources', label: 'Sınav Kaynakları', count: examPublishedCount,        views: examViews },
      ].sort((a, b) => b.views - a.views),
    };
  }

  // ── Onboarding Metrics ───────────────────────────────────────────────────────

  @Get('onboarding-metrics')
  @RequirePermission('admin.dashboard.read')
  async getOnboardingMetrics() {
    const activeUserCondition = and(isNull(users.deletedAt), ne(users.status, 'deleted'));

    const [
      totalApplications,
      approvedApplications,
      activatedUsers,
      profileCompleteUsers,
    ] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(applications)
        .where(isNull(applications.deletedAt)),

      this.db
        .select({ count: count() })
        .from(applications)
        .where(
          and(
            isNull(applications.deletedAt),
            sql`${applications.state} NOT IN ('submitted','under_review','rejected','interview_scheduled','interview_needed')`,
          ),
        ),

      this.db
        .select({ count: count() })
        .from(users)
        .where(and(activeUserCondition, isNotNull(users.lastLoginAt))),

      this.db
        .select({ count: count() })
        .from(users)
        .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
        .where(
          and(
            activeUserCondition,
            isNotNull(userProfiles.displayName),
            isNotNull(userProfiles.profession),
            isNotNull(userProfiles.city),
          ),
        ),
    ]);

    const [ahaTotal, eventAha, mentorAha, postAha, contentAha, avgDaysRow, retentionRows] =
      await Promise.all([
        this.db.execute<{ count: number }>(sql`
          SELECT COUNT(DISTINCT user_id)::int AS count
          FROM (
            SELECT user_id FROM event_attendances
            UNION
            SELECT mentee_id AS user_id FROM mentorship_requests
              WHERE status IN ('accepted','completed')
            UNION
            SELECT author_id AS user_id FROM posts WHERE status = 'published'
          ) aha_users
        `),

        this.db.execute<{ count: number }>(sql`
          SELECT COUNT(DISTINCT user_id)::int AS count FROM event_attendances
        `),

        this.db.execute<{ count: number }>(sql`
          SELECT COUNT(DISTINCT mentee_id)::int AS count FROM mentorship_requests
          WHERE status IN ('accepted','completed')
        `),

        this.db.execute<{ count: number }>(sql`
          SELECT COUNT(DISTINCT author_id)::int AS count FROM posts WHERE status = 'published'
        `),

        this.db.execute<{ count: number }>(sql`
          SELECT COUNT(DISTINCT user_id)::int AS count FROM content_requests WHERE user_id IS NOT NULL
        `),

        this.db.execute<{ avg_days: number }>(sql`
          SELECT COALESCE(
            AVG(EXTRACT(EPOCH FROM (first_aha - user_created)) / 86400)::int,
            0
          ) AS avg_days
          FROM (
            SELECT
              u.created_at AS user_created,
              LEAST(
                MIN(ea.first_joined_at),
                MIN(mr.created_at) FILTER (WHERE mr.status IN ('accepted','completed')),
                MIN(p.created_at) FILTER (WHERE p.status = 'published')
              ) AS first_aha
            FROM users u
            LEFT JOIN event_attendances ea ON ea.user_id = u.id
            LEFT JOIN mentorship_requests mr ON mr.mentee_id = u.id
            LEFT JOIN posts p ON p.author_id = u.id
            WHERE u.deleted_at IS NULL AND u.status != 'deleted'
            GROUP BY u.id, u.created_at
          ) subq
          WHERE first_aha IS NOT NULL
        `),

        this.db.execute<{ month: string; cohort_size: number; retained: number }>(sql`
          SELECT
            TO_CHAR(cohort_month, 'YYYY-MM') AS month,
            COUNT(u.id)::int                 AS cohort_size,
            COUNT(u.id) FILTER (
              WHERE u.last_login_at > cohort_month + INTERVAL '1 month'
            )::int                           AS retained
          FROM (
            SELECT DATE_TRUNC('month', created_at) AS cohort_month
            FROM users
            WHERE deleted_at IS NULL AND status != 'deleted'
              AND created_at >= NOW() - INTERVAL '12 months'
            GROUP BY 1
          ) months
          JOIN users u
            ON  DATE_TRUNC('month', u.created_at) = months.cohort_month
            AND u.deleted_at IS NULL
            AND u.status != 'deleted'
          GROUP BY cohort_month
          ORDER BY cohort_month
        `),
      ]);

    const applied        = Number(totalApplications[0]?.count ?? 0);
    const approved       = Number(approvedApplications[0]?.count ?? 0);
    const activated      = Number(activatedUsers[0]?.count ?? 0);
    const profileComplete = Number(profileCompleteUsers[0]?.count ?? 0);
    const ahaMoment      = Number(ahaTotal[0]?.count ?? 0);

    return {
      funnel: { applied, approved, activated, profileComplete, ahaMoment },
      ahaBreakdown: {
        firstEventAttended: Number(eventAha[0]?.count ?? 0),
        firstMentorMatch:   Number(mentorAha[0]?.count ?? 0),
        firstPostCreated:   Number(postAha[0]?.count ?? 0),
        firstProjectShared: Number(contentAha[0]?.count ?? 0),
      },
      avgDaysToAha: Number(avgDaysRow[0]?.avg_days ?? 0),
      dropoffByStep: {
        afterApproval:    Math.max(0, approved - activated),
        afterActivation:  Math.max(0, activated - profileComplete),
        afterProfile:     Math.max(0, profileComplete - ahaMoment),
      },
      retentionByMonth: retentionRows.map((r) => ({
        month:       r.month,
        cohortSize:  Number(r.cohort_size),
        retained:    Number(r.retained),
        rate:        Number(r.cohort_size) > 0
          ? Math.round((Number(r.retained) / Number(r.cohort_size)) * 100)
          : 0,
      })),
    };
  }

  // ── Onboarding Insights (Insight Engine) ────────────────────────────────────

  @Get('onboarding-insights')
  @RequirePermission('admin.dashboard.read')
  async getOnboardingInsights() {
    const [
      // ── Retention correlation: aha vs non-aha users, 30-day activity ──────
      retentionCorrelationRow,

      // ── Segment funnel: by membership tier ──────────────────────────────
      segmentFunnelRows,

      // ── Mentor segment ───────────────────────────────────────────────────
      mentorSegmentRow,

      // ── Content creator segment ──────────────────────────────────────────
      contentCreatorSegmentRow,

      // ── Score distribution (onboarding) ──────────────────────────────────
      onboardingScoreDistRow,

      // ── Score distribution (engagement) ──────────────────────────────────
      engagementScoreDistRow,

      // ── Score distribution (community health) ────────────────────────────
      communityScoreDistRow,

      // ── Anomaly: last 7 days vs previous 7 days ───────────────────────────
      anomalyRow,

      // ── Event tracking summary ────────────────────────────────────────────
      eventSummaryRows,

      // ── Aha action individual retention rates ─────────────────────────────
      ahaActionRetentionRow,
    ] = await Promise.all([

      // Retention: aha users vs non-aha (30-day active rate)
      this.db.execute<{
        total: number; aha_count: number; aha_active: number;
        non_aha_count: number; non_aha_active: number;
      }>(sql`
        WITH aha_set AS (
          SELECT DISTINCT user_id FROM (
            SELECT user_id FROM event_attendances
            UNION ALL SELECT mentee_id FROM mentorship_requests WHERE status IN ('accepted','completed')
            UNION ALL SELECT author_id FROM posts WHERE status = 'published'
          ) t
        )
        SELECT
          COUNT(u.id)::int AS total,
          COUNT(u.id) FILTER (WHERE a.user_id IS NOT NULL)::int AS aha_count,
          COUNT(u.id) FILTER (WHERE a.user_id IS NOT NULL AND u.last_login_at >= NOW() - INTERVAL '30 days')::int AS aha_active,
          COUNT(u.id) FILTER (WHERE a.user_id IS NULL)::int AS non_aha_count,
          COUNT(u.id) FILTER (WHERE a.user_id IS NULL AND u.last_login_at >= NOW() - INTERVAL '30 days')::int AS non_aha_active
        FROM users u
        LEFT JOIN aha_set a ON a.user_id = u.id
        WHERE u.deleted_at IS NULL AND u.status != 'deleted' AND u.last_login_at IS NOT NULL
      `),

      // Segment funnel by membership tier
      this.db.execute<{
        tier: string; total: number; profile_complete: number;
        aha_count: number; active_30d: number;
      }>(sql`
        WITH aha_set AS (
          SELECT DISTINCT user_id FROM (
            SELECT user_id FROM event_attendances
            UNION ALL SELECT mentee_id FROM mentorship_requests WHERE status IN ('accepted','completed')
            UNION ALL SELECT author_id FROM posts WHERE status = 'published'
          ) t
        )
        SELECT
          u.membership_tier AS tier,
          COUNT(u.id)::int AS total,
          COUNT(u.id) FILTER (
            WHERE up.display_name IS NOT NULL AND up.profession IS NOT NULL AND up.city IS NOT NULL
          )::int AS profile_complete,
          COUNT(u.id) FILTER (WHERE a.user_id IS NOT NULL)::int AS aha_count,
          COUNT(u.id) FILTER (WHERE u.last_login_at >= NOW() - INTERVAL '30 days')::int AS active_30d
        FROM users u
        LEFT JOIN user_profiles up ON up.user_id = u.id
        LEFT JOIN aha_set a ON a.user_id = u.id
        WHERE u.deleted_at IS NULL AND u.status != 'deleted'
          AND u.membership_tier IN ('haritailesi_genc','new_graduate_member','individual_member','corporate_member')
        GROUP BY u.membership_tier
        ORDER BY COUNT(u.id) DESC
      `),

      // Mentor segment
      this.db.execute<{
        total: number; profile_complete: number; aha_count: number; active_30d: number;
      }>(sql`
        WITH aha_set AS (
          SELECT DISTINCT user_id FROM (
            SELECT user_id FROM event_attendances
            UNION ALL SELECT mentee_id FROM mentorship_requests WHERE status IN ('accepted','completed')
            UNION ALL SELECT author_id FROM posts WHERE status = 'published'
          ) t
        )
        SELECT
          COUNT(DISTINCT u.id)::int AS total,
          COUNT(DISTINCT u.id) FILTER (
            WHERE up.display_name IS NOT NULL AND up.profession IS NOT NULL AND up.city IS NOT NULL
          )::int AS profile_complete,
          COUNT(DISTINCT u.id) FILTER (WHERE a.user_id IS NOT NULL)::int AS aha_count,
          COUNT(DISTINCT u.id) FILTER (WHERE u.last_login_at >= NOW() - INTERVAL '30 days')::int AS active_30d
        FROM mentor_profiles mp
        JOIN users u ON u.id = mp.user_id
        LEFT JOIN user_profiles up ON up.user_id = u.id
        LEFT JOIN aha_set a ON a.user_id = u.id
        WHERE u.deleted_at IS NULL AND u.status != 'deleted'
          AND mp.admin_status = 'approved'
      `),

      // Content creator segment (has published post)
      this.db.execute<{
        total: number; profile_complete: number; aha_count: number; active_30d: number;
      }>(sql`
        WITH creators AS (
          SELECT DISTINCT author_id AS user_id FROM posts WHERE status = 'published'
        ),
        aha_set AS (
          SELECT DISTINCT user_id FROM (
            SELECT user_id FROM event_attendances
            UNION ALL SELECT mentee_id FROM mentorship_requests WHERE status IN ('accepted','completed')
            UNION ALL SELECT author_id FROM posts WHERE status = 'published'
          ) t
        )
        SELECT
          COUNT(DISTINCT u.id)::int AS total,
          COUNT(DISTINCT u.id) FILTER (
            WHERE up.display_name IS NOT NULL AND up.profession IS NOT NULL AND up.city IS NOT NULL
          )::int AS profile_complete,
          COUNT(DISTINCT u.id) FILTER (WHERE a.user_id IS NOT NULL)::int AS aha_count,
          COUNT(DISTINCT u.id) FILTER (WHERE u.last_login_at >= NOW() - INTERVAL '30 days')::int AS active_30d
        FROM creators c
        JOIN users u ON u.id = c.user_id
        LEFT JOIN user_profiles up ON up.user_id = u.id
        LEFT JOIN aha_set a ON a.user_id = u.id
        WHERE u.deleted_at IS NULL AND u.status != 'deleted'
      `),

      // Onboarding score distribution
      this.db.execute<{ bucket: string; count: number }>(sql`
        SELECT
          CASE
            WHEN score <= 25 THEN '0-25'
            WHEN score <= 50 THEN '26-50'
            WHEN score <= 75 THEN '51-75'
            ELSE '76-100'
          END AS bucket,
          COUNT(*)::int AS count
        FROM (
          SELECT
            (
              CASE WHEN u.last_login_at IS NOT NULL THEN 10 ELSE 0 END +
              CASE WHEN up.display_name IS NOT NULL THEN 20 ELSE 0 END +
              CASE WHEN up.profession IS NOT NULL THEN 15 ELSE 0 END +
              CASE WHEN up.city IS NOT NULL THEN 10 ELSE 0 END +
              CASE WHEN up.bio IS NOT NULL THEN 5 ELSE 0 END +
              CASE WHEN ea.user_id IS NOT NULL THEN 15 ELSE 0 END +
              CASE WHEN mr.mentee_id IS NOT NULL THEN 15 ELSE 0 END +
              CASE WHEN p.author_id IS NOT NULL THEN 10 ELSE 0 END
            ) AS score
          FROM users u
          LEFT JOIN user_profiles up ON up.user_id = u.id
          LEFT JOIN LATERAL (SELECT user_id FROM event_attendances WHERE user_id = u.id LIMIT 1) ea ON true
          LEFT JOIN LATERAL (SELECT mentee_id FROM mentorship_requests WHERE mentee_id = u.id AND status IN ('accepted','completed') LIMIT 1) mr ON true
          LEFT JOIN LATERAL (SELECT author_id FROM posts WHERE author_id = u.id AND status = 'published' LIMIT 1) p ON true
          WHERE u.deleted_at IS NULL AND u.status != 'deleted'
        ) scores
        GROUP BY bucket
        ORDER BY bucket
      `),

      // Engagement score distribution
      this.db.execute<{ bucket: string; count: number }>(sql`
        SELECT
          CASE
            WHEN score <= 25 THEN '0-25'
            WHEN score <= 50 THEN '26-50'
            WHEN score <= 75 THEN '51-75'
            ELSE '76-100'
          END AS bucket,
          COUNT(*)::int AS count
        FROM (
          SELECT
            LEAST(
              COALESCE(post_count, 0) * 8 +
              COALESCE(ea_count, 0) * 12 +
              COALESCE(mr_count, 0) * 20 +
              COALESCE(comment_count, 0) * 4,
              100
            ) AS score
          FROM users u
          LEFT JOIN (SELECT author_id, COUNT(*)::int AS post_count FROM posts WHERE status = 'published' GROUP BY author_id) pc ON pc.author_id = u.id
          LEFT JOIN (SELECT user_id, COUNT(*)::int AS ea_count FROM event_attendances GROUP BY user_id) ea ON ea.user_id = u.id
          LEFT JOIN (SELECT mentee_id, COUNT(*)::int AS mr_count FROM mentorship_requests GROUP BY mentee_id) mr ON mr.mentee_id = u.id
          LEFT JOIN (SELECT author_id, COUNT(*)::int AS comment_count FROM comments WHERE is_deleted = false GROUP BY author_id) cc ON cc.author_id = u.id
          WHERE u.deleted_at IS NULL AND u.status != 'deleted'
        ) scores
        GROUP BY bucket
        ORDER BY bucket
      `),

      // Community health score distribution
      this.db.execute<{ bucket: string; count: number }>(sql`
        SELECT
          CASE
            WHEN score <= 25 THEN '0-25'
            WHEN score <= 50 THEN '26-50'
            WHEN score <= 75 THEN '51-75'
            ELSE '76-100'
          END AS bucket,
          COUNT(*)::int AS count
        FROM (
          SELECT
            LEAST(
              COALESCE(reaction_count, 0) * 2 +
              COALESCE(follower_count, 0) * 5 +
              COALESCE(session_count, 0) * 15,
              100
            ) AS score
          FROM users u
          LEFT JOIN (
            SELECT p.author_id, COUNT(pr.id)::int AS reaction_count
            FROM posts p
            JOIN post_reactions pr ON pr.post_id = p.id
            WHERE p.status = 'published'
            GROUP BY p.author_id
          ) rc ON rc.author_id = u.id
          LEFT JOIN (SELECT followee_id, COUNT(*)::int AS follower_count FROM user_follows GROUP BY followee_id) fc ON fc.followee_id = u.id
          LEFT JOIN (SELECT mp.user_id, COUNT(ms.id)::int AS session_count FROM mentor_profiles mp JOIN meeting_sessions ms ON ms.mentorship_request_id IN (SELECT id FROM mentorship_requests WHERE mentor_id = mp.user_id) GROUP BY mp.user_id) sc ON sc.user_id = u.id
          WHERE u.deleted_at IS NULL AND u.status != 'deleted'
        ) scores
        GROUP BY bucket
        ORDER BY bucket
      `),

      // Anomaly detection: last 7 days vs previous 7 days
      this.db.execute<{
        logins_7d: number; logins_prev: number;
        posts_7d: number; posts_prev: number;
        mentor_req_7d: number; mentor_req_prev: number;
      }>(sql`
        SELECT
          COUNT(DISTINCT u.id) FILTER (WHERE u.last_login_at >= NOW() - INTERVAL '7 days')::int AS logins_7d,
          COUNT(DISTINCT u.id) FILTER (WHERE u.last_login_at >= NOW() - INTERVAL '14 days' AND u.last_login_at < NOW() - INTERVAL '7 days')::int AS logins_prev,
          (SELECT COUNT(*)::int FROM posts WHERE status = 'published' AND created_at >= NOW() - INTERVAL '7 days') AS posts_7d,
          (SELECT COUNT(*)::int FROM posts WHERE status = 'published' AND created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days') AS posts_prev,
          (SELECT COUNT(*)::int FROM mentorship_requests WHERE created_at >= NOW() - INTERVAL '7 days') AS mentor_req_7d,
          (SELECT COUNT(*)::int FROM mentorship_requests WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days') AS mentor_req_prev
        FROM users u
        WHERE u.deleted_at IS NULL AND u.status != 'deleted'
      `),

      // Event tracking summary (last 30 days)
      this.db.execute<{ event_type: string; count: number }>(sql`
        SELECT event_type, COUNT(*)::int AS count
        FROM user_events
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY event_type
        ORDER BY count DESC
      `),

      // Aha action individual retention rates
      this.db.execute<{
        event_ret: number; mentor_ret: number; post_ret: number;
        event_count: number; mentor_count: number; post_count: number;
      }>(sql`
        SELECT
          ROUND(
            100.0 * COUNT(DISTINCT ea.user_id) FILTER (WHERE u.last_login_at >= NOW() - INTERVAL '30 days') /
            NULLIF(COUNT(DISTINCT ea.user_id), 0)
          )::int AS event_ret,
          ROUND(
            100.0 * COUNT(DISTINCT mr.mentee_id) FILTER (WHERE u2.last_login_at >= NOW() - INTERVAL '30 days') /
            NULLIF(COUNT(DISTINCT mr.mentee_id), 0)
          )::int AS mentor_ret,
          ROUND(
            100.0 * COUNT(DISTINCT p.author_id) FILTER (WHERE u3.last_login_at >= NOW() - INTERVAL '30 days') /
            NULLIF(COUNT(DISTINCT p.author_id), 0)
          )::int AS post_ret,
          COUNT(DISTINCT ea.user_id)::int AS event_count,
          COUNT(DISTINCT mr.mentee_id)::int AS mentor_count,
          COUNT(DISTINCT p.author_id)::int AS post_count
        FROM
          (SELECT DISTINCT user_id FROM event_attendances) ea
          LEFT JOIN users u ON u.id = ea.user_id AND u.deleted_at IS NULL,
          (SELECT DISTINCT mentee_id FROM mentorship_requests WHERE status IN ('accepted','completed')) mr
          LEFT JOIN users u2 ON u2.id = mr.mentee_id AND u2.deleted_at IS NULL,
          (SELECT DISTINCT author_id FROM posts WHERE status = 'published') p
          LEFT JOIN users u3 ON u3.id = p.author_id AND u3.deleted_at IS NULL
      `),
    ]);

    // ── Compute derived values ──────────────────────────────────────────────

    const rc = retentionCorrelationRow[0];
    const ahaRetRate   = rc && rc.aha_count   > 0 ? Math.round(Number(rc.aha_active)   / Number(rc.aha_count)   * 100) : 0;
    const nonAhaRetRate = rc && rc.non_aha_count > 0 ? Math.round(Number(rc.non_aha_active) / Number(rc.non_aha_count) * 100) : 0;
    const ahaMultiplier = nonAhaRetRate > 0 ? Math.round((ahaRetRate / nonAhaRetRate) * 10) / 10 : 0;

    // ── Segment funnel ──────────────────────────────────────────────────────

    const TIER_LABELS: Record<string, string> = {
      haritailesi_genc:  'Haritailesi Genç',
      new_graduate_member: 'Yeni Mezun',
      individual_member: 'Profesyonel',
      corporate_member:  'Şirket',
    };

    const mentorRow = mentorSegmentRow[0];
    const contentRow = contentCreatorSegmentRow[0];

    const segmentFunnel = [
      ...segmentFunnelRows.map((r) => ({
        segment:  TIER_LABELS[r.tier] ?? r.tier,
        key:      r.tier,
        total:    Number(r.total),
        profilePct: Number(r.total) > 0 ? Math.round(Number(r.profile_complete) / Number(r.total) * 100) : 0,
        ahaPct:   Number(r.total) > 0 ? Math.round(Number(r.aha_count) / Number(r.total) * 100) : 0,
        active30dPct: Number(r.total) > 0 ? Math.round(Number(r.active_30d) / Number(r.total) * 100) : 0,
      })),
      ...(mentorRow && Number(mentorRow.total) > 0 ? [{
        segment: 'Mentor',
        key: 'mentor',
        total: Number(mentorRow.total),
        profilePct: Math.round(Number(mentorRow.profile_complete) / Number(mentorRow.total) * 100),
        ahaPct:     Math.round(Number(mentorRow.aha_count) / Number(mentorRow.total) * 100),
        active30dPct: Math.round(Number(mentorRow.active_30d) / Number(mentorRow.total) * 100),
      }] : []),
      ...(contentRow && Number(contentRow.total) > 0 ? [{
        segment: 'İçerik Üreticisi',
        key: 'content_creator',
        total: Number(contentRow.total),
        profilePct: Math.round(Number(contentRow.profile_complete) / Number(contentRow.total) * 100),
        ahaPct:     Math.round(Number(contentRow.aha_count) / Number(contentRow.total) * 100),
        active30dPct: Math.round(Number(contentRow.active_30d) / Number(contentRow.total) * 100),
      }] : []),
    ];

    // ── Score distributions ─────────────────────────────────────────────────

    const toBuckets = (rows: { bucket: string; count: number }[]) =>
      Object.fromEntries(rows.map((r) => [r.bucket, Number(r.count)]));

    // ── Anomaly detection ───────────────────────────────────────────────────

    const anom = anomalyRow[0];
    const anomalies: Array<{ metric: string; label: string; current: number; previous: number; changePct: number; severity: 'low' | 'medium' | 'high' }> = [];

    const addAnomaly = (metric: string, label: string, current: number, previous: number) => {
      if (previous === 0) return;
      const changePct = Math.round(((current - previous) / previous) * 100);
      const abs = Math.abs(changePct);
      const severity: 'low' | 'medium' | 'high' = abs >= 40 ? 'high' : abs >= 20 ? 'medium' : 'low';
      if (abs >= 15) anomalies.push({ metric, label, current, previous, changePct, severity });
    };

    if (anom) {
      addAnomaly('logins',    'Aktif giriş',      Number(anom.logins_7d),     Number(anom.logins_prev));
      addAnomaly('posts',     'Yeni gönderi',     Number(anom.posts_7d),      Number(anom.posts_prev));
      addAnomaly('mentorship','Mentör talebi',    Number(anom.mentor_req_7d), Number(anom.mentor_req_prev));
    }

    // ── Insight generation ──────────────────────────────────────────────────

    const insights: Array<{
      id: string; type: string; severity: 'info' | 'warning' | 'critical';
      title: string; body: string; metric?: number; unit?: string;
      recommendation: string;
    }> = [];

    // Insight 1: Aha retention multiplier
    if (ahaMultiplier >= 1.2) {
      insights.push({
        id: 'aha_retention',
        type: 'retention_correlation',
        severity: ahaMultiplier >= 2 ? 'critical' : 'warning',
        title: `Farkındalık Anı yaşayanların tutunması ${ahaMultiplier}× daha yüksek`,
        body: `Farkındalık Anı yaşayan kullanıcıların %${ahaRetRate}'i 30 gün sonra hâlâ aktif. Yaşamayanlar için bu oran %${nonAhaRetRate}.`,
        metric: ahaMultiplier,
        unit: '×',
        recommendation: 'Profil tamamlama adımından sonra doğrudan etkinlik veya mentor öner. Farkındalık Anına giden yolu kısalt.',
      });
    }

    // Insight 2: Biggest segment gap
    const sortedByAha = [...segmentFunnel].filter(s => s.total > 5).sort((a, b) => b.ahaPct - a.ahaPct);
    if (sortedByAha.length >= 2) {
      const best  = sortedByAha[0]!;
      const worst = sortedByAha[sortedByAha.length - 1]!;
      const gap   = best.ahaPct - worst.ahaPct;
      if (gap >= 15) {
        insights.push({
          id: 'segment_gap',
          type: 'segment_comparison',
          severity: gap >= 30 ? 'critical' : 'warning',
          title: `${best.segment} - ${worst.segment} arasında ${gap} puan fark`,
          body: `${best.segment} üyelerinin %${best.ahaPct}'i farkındalık anı yaşıyor. ${worst.segment} üyelerinde bu oran yalnızca %${worst.ahaPct}.`,
          metric: gap,
          unit: '%',
          recommendation: `${worst.segment} segmentine özel onboarding içeriği hazırla. Başlangıç adımlarını segmente göre kişiselleştir.`,
        });
      }
    }

    // Insight 3: Aha action with highest retention
    const ahaAct = ahaActionRetentionRow[0];
    if (ahaAct) {
      const actions = [
        { action: 'Etkinliğe katılma', ret: Number(ahaAct.event_ret), count: Number(ahaAct.event_count) },
        { action: 'Mentör eşleşmesi', ret: Number(ahaAct.mentor_ret), count: Number(ahaAct.mentor_count) },
        { action: 'İçerik paylaşma',  ret: Number(ahaAct.post_ret),   count: Number(ahaAct.post_count) },
      ].filter(a => a.count > 3);
      const topAction = actions.sort((a, b) => b.ret - a.ret)[0];
      if (topAction) {
        insights.push({
          id: 'top_aha_action',
          type: 'aha_impact',
          severity: 'info',
          title: `En güçlü farkındalık anı: ${topAction.action} (%${topAction.ret} retention)`,
          body: `Bu eylemi gerçekleştiren ${topAction.count} kullanıcının %${topAction.ret}'i 30 günde aktif kalıyor.`,
          metric: topAction.ret,
          unit: '%',
          recommendation: `${topAction.action} adımını onboarding akışında öne çıkar. Profil tamamlanınca bunu hemen öner.`,
        });
      }
    }

    // Insight 4: Anomalies → insights
    for (const anomaly of anomalies.filter(a => a.severity !== 'low')) {
      insights.push({
        id: `anomaly_${anomaly.metric}`,
        type: 'anomaly',
        severity: anomaly.severity === 'high' ? 'critical' : 'warning',
        title: `${anomaly.label}: ${anomaly.changePct > 0 ? '+' : ''}${anomaly.changePct}% son 7 günde`,
        body: `Geçen hafta: ${anomaly.previous}, bu hafta: ${anomaly.current}.`,
        metric: Math.abs(anomaly.changePct),
        unit: '%',
        recommendation: anomaly.changePct < 0
          ? `${anomaly.label} düşüşünü incele. Push bildirim veya e-posta ile kullanıcıları geri çek.`
          : `${anomaly.label} artışını değerlendir. Bu dönemde ne değişti?`,
      });
    }

    // ── Retention correlations ──────────────────────────────────────────────

    const retentionCorrelations = ahaAct ? [
      { action: 'first_event_attended', label: 'Etkinliğe katılma', retentionRate: Number(ahaAct.event_ret), sampleSize: Number(ahaAct.event_count) },
      { action: 'mentor_matched',       label: 'Mentör eşleşmesi', retentionRate: Number(ahaAct.mentor_ret), sampleSize: Number(ahaAct.mentor_count) },
      { action: 'first_post_created',   label: 'İçerik paylaşma',  retentionRate: Number(ahaAct.post_ret),   sampleSize: Number(ahaAct.post_count) },
    ] : [];

    // ── Event tracking summary ──────────────────────────────────────────────

    const eventTracking = Object.fromEntries(
      eventSummaryRows.map((r) => [r.event_type, Number(r.count)])
    );

    return {
      insights: insights.sort((a, b) => {
        const order = { critical: 0, warning: 1, info: 2 };
        return order[a.severity] - order[b.severity];
      }),
      segmentFunnel,
      scoreDistribution: {
        onboarding:      toBuckets(onboardingScoreDistRow),
        engagement:      toBuckets(engagementScoreDistRow),
        communityHealth: toBuckets(communityScoreDistRow),
      },
      retentionCorrelations,
      anomalies,
      eventTracking,
      meta: {
        ahaRetentionRate:    ahaRetRate,
        nonAhaRetentionRate: nonAhaRetRate,
        ahaRetentionMultiplier: ahaMultiplier,
      },
    };
  }

  // ─── Community Health ─────────────────────────────────────────────────────

  @Get('community-health')
  @RequirePermission('admin.dashboard.read')
  async getCommunityHealth() {
    const now = new Date();
    const ago7d   = new Date(now.getTime() - 7  * 86400_000);
    const ago14d  = new Date(now.getTime() - 14 * 86400_000);
    const ago10d  = new Date(now.getTime() - 10 * 86400_000);
    const ago3d   = new Date(now.getTime() - 3  * 86400_000);
    const ago7dMr = new Date(now.getTime() - 7  * 86400_000);

    // ── At-risk users ──────────────────────────────────────────────────────
    const atRiskRows = await this.db.execute<{
      id:                  string;
      display_name:        string | null;
      email:               string;
      membership_tier:     string;
      days_since_login:    number | null;
      onboarding_complete: boolean;
      inactive_10d:        boolean;
      abandoned_onboarding:boolean;
      mentor_no_response:  boolean;
    }>(sql`
      SELECT
        u.id,
        up.display_name,
        u.email,
        u.membership_tier::text,
        CASE
          WHEN u.last_login_at IS NULL THEN NULL
          ELSE EXTRACT(EPOCH FROM (NOW() - u.last_login_at)) / 86400
        END::float AS days_since_login,
        (up.display_name IS NOT NULL AND up.profession IS NOT NULL AND up.city IS NOT NULL) AS onboarding_complete,
        (u.last_login_at IS NOT NULL AND u.last_login_at < ${ago10d}) AS inactive_10d,
        (
          (up.display_name IS NULL OR up.profession IS NULL)
          AND u.created_at < ${ago3d}
        ) AS abandoned_onboarding,
        EXISTS (
          SELECT 1 FROM mentorship_requests mr
          WHERE mr.mentee_id = u.id
            AND mr.status = 'pending'
            AND mr.created_at < ${ago7dMr}
        ) AS mentor_no_response
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE u.deleted_at IS NULL
        AND u.status != 'deleted'
        AND u.membership_tier NOT IN ('visitor','registered_user')
        AND (
          (u.last_login_at IS NOT NULL AND u.last_login_at < ${ago10d})
          OR (
            (up.display_name IS NULL OR up.profession IS NULL)
            AND u.created_at < ${ago3d}
          )
          OR EXISTS (
            SELECT 1 FROM mentorship_requests mr2
            WHERE mr2.mentee_id = u.id
              AND mr2.status = 'pending'
              AND mr2.created_at < ${ago7dMr}
          )
        )
      ORDER BY days_since_login DESC NULLS FIRST
      LIMIT 60
    `);

    const atRisk = atRiskRows.map((r) => ({
      userId:              r.id,
      displayName:         r.display_name,
      email:               r.email,
      membershipTier:      r.membership_tier,
      daysSinceLogin:      r.days_since_login !== null ? Math.round(Number(r.days_since_login)) : null,
      onboardingComplete:  Boolean(r.onboarding_complete),
      riskReasons: [
        r.inactive_10d         ? 'inactive_10d'          : null,
        r.abandoned_onboarding ? 'abandoned_onboarding'  : null,
        r.mentor_no_response   ? 'mentor_no_response'    : null,
      ].filter((x): x is string => x !== null),
    }));

    // ── Health summary ─────────────────────────────────────────────────────
    const [summaryRow] = await this.db.execute<{
      total_active:      number;
      aha_reached_count: number;
      avg_aha_score:     number;
    }>(sql`
      SELECT
        COUNT(*) FILTER (WHERE u.last_login_at > ${ago7d}) AS total_active,
        COUNT(ues.user_id) FILTER (WHERE ues.aha_reached = true) AS aha_reached_count,
        COALESCE(AVG(ues.aha_score), 0) AS avg_aha_score
      FROM users u
      LEFT JOIN user_engagement_scores ues ON ues.user_id = u.id
      WHERE u.deleted_at IS NULL AND u.status != 'deleted'
        AND u.membership_tier NOT IN ('visitor','registered_user')
    `);

    const totalMembers = await this.db.execute<{ n: number }>(sql`
      SELECT COUNT(*) AS n FROM users
      WHERE deleted_at IS NULL AND status != 'deleted'
        AND membership_tier NOT IN ('visitor','registered_user')
    `);
    const total = Number(totalMembers[0]?.n ?? 0);

    // ── Weekly trends ──────────────────────────────────────────────────────
    const [trendRow] = await this.db.execute<{
      logins_this:     number;
      logins_prev:     number;
      posts_this:      number;
      posts_prev:      number;
      mentors_this:    number;
      mentors_prev:    number;
      onboarding_this: number;
      onboarding_prev: number;
    }>(sql`
      SELECT
        COUNT(*) FILTER (WHERE last_login_at BETWEEN ${ago7d} AND ${now})       AS logins_this,
        COUNT(*) FILTER (WHERE last_login_at BETWEEN ${ago14d} AND ${ago7d})    AS logins_prev,
        (SELECT COUNT(*) FROM posts WHERE created_at BETWEEN ${ago7d} AND ${now}
          AND status='published')                                                AS posts_this,
        (SELECT COUNT(*) FROM posts WHERE created_at BETWEEN ${ago14d} AND ${ago7d}
          AND status='published')                                                AS posts_prev,
        (SELECT COUNT(*) FROM mentorship_requests WHERE created_at BETWEEN ${ago7d} AND ${now})
                                                                                AS mentors_this,
        (SELECT COUNT(*) FROM mentorship_requests WHERE created_at BETWEEN ${ago14d} AND ${ago7d})
                                                                                AS mentors_prev,
        (SELECT COUNT(*) FROM user_events WHERE event_type = 'onboarding_step_completed'
          AND created_at BETWEEN ${ago7d} AND ${now})                           AS onboarding_this,
        (SELECT COUNT(*) FROM user_events WHERE event_type = 'onboarding_step_completed'
          AND created_at BETWEEN ${ago14d} AND ${ago7d})                        AS onboarding_prev
      FROM users WHERE deleted_at IS NULL AND status != 'deleted'
    `);

    const mkTrend = (label: string, metric: string, curr: number, prev: number) => {
      const changePct = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
      return { metric, label, thisWeek: curr, lastWeek: prev, changePct };
    };

    const trends = trendRow ? [
      mkTrend('Aktif giriş',        'logins',     Number(trendRow.logins_this),     Number(trendRow.logins_prev)),
      mkTrend('Yeni gönderi',       'posts',      Number(trendRow.posts_this),      Number(trendRow.posts_prev)),
      mkTrend('Mentör talebi',      'mentors',    Number(trendRow.mentors_this),    Number(trendRow.mentors_prev)),
      mkTrend('Onboarding adımı',   'onboarding', Number(trendRow.onboarding_this), Number(trendRow.onboarding_prev)),
    ] : [];

    // ── Product intelligence auto-insights ─────────────────────────────────
    const productInsights: Array<{ id: string; title: string; body: string; type: 'trend' | 'opportunity' | 'warning' }> = [];

    const ahaReachedPct = total > 0 ? Math.round((Number(summaryRow?.aha_reached_count ?? 0) / total) * 100) : 0;
    if (ahaReachedPct < 30) {
      productInsights.push({
        id: 'low_aha_rate', type: 'warning',
        title: `Kullanıcıların yalnizca %${ahaReachedPct}'i farkındalık anına ulaştı`,
        body:  'Farkındalık anına ulaşan kullanıcıların tutunma oranı 2x+ daha yüksek. Onboarding akışını kısaltarak ilk etkinlik veya mentor önerisi öne alın.',
      });
    }

    const activeRatio = total > 0 ? Math.round((Number(summaryRow?.total_active ?? 0) / total) * 100) : 0;
    if (trendRow && Number(trendRow.logins_this) < Number(trendRow.logins_prev) * 0.8) {
      productInsights.push({
        id: 'login_drop', type: 'warning',
        title: 'Haftalik giris sayisi belirgin sekilde düstü',
        body:  `Bu hafta gecen haftaya göre %${Math.abs(Math.round(((Number(trendRow.logins_this) - Number(trendRow.logins_prev)) / Math.max(Number(trendRow.logins_prev), 1)) * 100))} daha az giris. Yeniden aktivasyon kampanyasi zamanlama acisindan yerinde olabilir.`,
      });
    }

    if (trendRow && Number(trendRow.posts_this) > Number(trendRow.posts_prev) * 1.3) {
      productInsights.push({
        id: 'content_surge', type: 'trend',
        title: 'Icerik paylasimlari hizlaniyor',
        body:  `Bu hafta icerik paylasimlari %${Math.round(((Number(trendRow.posts_this) - Number(trendRow.posts_prev)) / Math.max(Number(trendRow.posts_prev), 1)) * 100)} artti. Bu momentumu yakalamak icin icerik öne cikarma degerlendir.`,
      });
    }

    if (atRisk.filter(u => u.riskReasons.includes('abandoned_onboarding')).length > 5) {
      productInsights.push({
        id: 'onboarding_abandonment', type: 'opportunity',
        title: 'Onboarding terki artmakta',
        body:  `${atRisk.filter(u => u.riskReasons.includes('abandoned_onboarding')).length} kullanici onboarding'i yarim birakti. Ilk 3 günde hedef secimi adimi devreye almak terk oranini dusurür.`,
      });
    }

    return {
      atRisk,
      healthSummary: {
        totalActive:        Number(summaryRow?.total_active ?? 0),
        atRiskCount:        atRisk.length,
        ahaReachedPct,
        activeRatioPct:     activeRatio,
        avgAhaScore:        Math.round(Number(summaryRow?.avg_aha_score ?? 0)),
      },
      trends,
      productInsights,
    };
  }

  // ── Sen Ne Dersin? İstatistikleri ────────────────────────────────────────────

  @Get('sen-ne-dersin-stats')
  @RequirePermission('admin.dashboard.read')
  async getSenNeDersinStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      countByType,
      countByStatus,
      totalResponses,
      responsesThisMonth,
      topContent,
      testPassStats,
    ] = await Promise.all([
      this.db
        .select({ type: surveys.type, count: count() })
        .from(surveys)
        .groupBy(surveys.type),

      this.db
        .select({ status: surveys.status, count: count() })
        .from(surveys)
        .groupBy(surveys.status),

      this.db.select({ count: count() }).from(surveyResponses),

      this.db
        .select({ count: count() })
        .from(surveyResponses)
        .where(gte(surveyResponses.createdAt, startOfMonth)),

      this.db
        .select({
          id: surveys.id,
          title: surveys.title,
          type: surveys.type,
          slug: surveys.slug,
          responseCount: surveys.responseCount,
          viewCount: surveys.viewCount,
        })
        .from(surveys)
        .where(ne(surveys.status, 'draft'))
        .orderBy(sql`${surveys.responseCount} DESC`)
        .limit(5),

      this.db.execute<{ total: number; passed: number }>(sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (
            WHERE sr.score IS NOT NULL
              AND sr.max_score IS NOT NULL
              AND sr.max_score > 0
              AND s.passing_score IS NOT NULL
              AND ROUND(sr.score * 100.0 / sr.max_score) >= s.passing_score
          )::int AS passed
        FROM survey_responses sr
        JOIN surveys s ON s.id = sr.survey_id
        WHERE s.type = 'test'
      `),
    ]);

    const dailyRows = await this.db.execute<{ day: string; count: number }>(sql`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS count
      FROM survey_responses
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY day
      ORDER BY day
    `);

    const byType = Object.fromEntries(countByType.map((r) => [r.type, Number(r.count)]));
    const byStatus = Object.fromEntries(countByStatus.map((r) => [r.status, Number(r.count)]));
    const passStats = testPassStats[0];
    const testPassRate =
      passStats && Number(passStats.total) > 0
        ? Math.round((Number(passStats.passed) / Number(passStats.total)) * 100)
        : null;

    return {
      summary: {
        totalSurveys: byType['anket'] ?? 0,
        totalTests: byType['test'] ?? 0,
        totalResponses: Number(totalResponses[0]?.count ?? 0),
        responsesThisMonth: Number(responsesThisMonth[0]?.count ?? 0),
        testPassRate,
        testAttempts: passStats ? Number(passStats.total) : 0,
      },
      byType,
      byStatus,
      topContent: topContent.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        slug: r.slug,
        responseCount: r.responseCount,
        viewCount: r.viewCount,
      })),
      dailyResponses: dailyRows.map((r) => ({ day: String(r.day), count: Number(r.count) })),
    };
  }

  // ── Kademe Dağılımı ──────────────────────────────────────────────────────────

  @Get('level-stats')
  @RequirePermission('admin.dashboard.read')
  async getLevelStats() {
    const actionRows = await this.db.execute<{ user_id: string; action_id: string }>(sql`
      SELECT user_id, action_id FROM user_level_actions
    `);

    const byUser = new Map<string, string[]>();
    for (const row of actionRows) {
      const list = byUser.get(row.user_id) ?? [];
      list.push(row.action_id);
      byUser.set(row.user_id, list);
    }

    const dist = { izleyici: 0, katilimci: 0, katki_sunan: 0, etki_yaratan: 0 };
    const actionPopularity = new Map<string, number>();

    for (const [, ids] of byUser) {
      for (const id of ids) {
        actionPopularity.set(id, (actionPopularity.get(id) ?? 0) + 1);
      }
      dist[calculateLevel(ids)]++;
    }

    const totalTracked = byUser.size;

    const topActions = [...actionPopularity.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([actionId, cnt]) => ({ actionId, count: cnt }));

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(users)
      .where(and(isNull(users.deletedAt), ne(users.status, 'deleted')));
    const totalUsers = Number(totalRow?.count ?? 0);
    const untrackedCount = Math.max(0, totalUsers - totalTracked);

    return {
      distribution: {
        izleyici:     dist.izleyici + untrackedCount,
        katilimci:    dist.katilimci,
        katki_sunan:  dist.katki_sunan,
        etki_yaratan: dist.etki_yaratan,
        total:        totalUsers,
      },
      topActions,
      trackedUsers: totalTracked,
    };
  }
}
