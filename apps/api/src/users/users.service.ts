import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { eq, ne, isNull, isNotNull, and, desc, asc, ilike, or, sql, gte, lte, notInArray, type SQL } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { users, userProfiles, applications, userFunctionalRoles, userFollows, userBadges, posts, postReactions, comments, userStatusEnum, mentorshipRequests, verificationDocuments } from '@haritailesi/database';
import type Redis from 'ioredis';
import { REDIS_TOKEN } from '../redis/redis.constants';

const BCRYPT_ROUNDS = 12;

type UserStatus = (typeof userStatusEnum.enumValues)[number];
import type { MembershipTier, FunctionalRole } from '@haritailesi/types';

const ADMIN_PAGE_SIZE = 25;
const MEMBERS_CACHE_TTL = 5 * 60; // 5 minutes

@Injectable()
export class UsersService {
  constructor(
    @InjectDb() private readonly db: Database,
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
  ) {}

  async createFromApplication(app: {
    type: string;
    applicantEmail: string;
    formData: Record<string, unknown>;
  }): Promise<string> {
    const membershipTier = this.resolveMembershipTier(app.type, app.formData);
    const displayName = this.extractDisplayName(app.formData);

    const [user] = await this.db
      .insert(users)
      .values({
        email: app.applicantEmail.toLowerCase(),
        // Placeholder — setupPassword akışında gerçek hash set edilir
        passwordHash: '!',
        membershipTier,
        status: 'pending',
      })
      .returning({ id: users.id });

    if (!user) throw new Error('User creation failed');

    await this.db.insert(userProfiles).values({ userId: user.id, displayName });

    return user.id;
  }

  async getMe(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, userId), isNull(users.deletedAt)),
      with: {
        profile: true,
        functionalRoles: { where: (r, { eq: eqFn }) => eqFn(r.isActive, true) },
      },
      columns: {
        id: true,
        email: true,
        membershipTier: true,
        status: true,
        verificationStatus: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const badges = await this.db.query.userBadges.findMany({
      where: eq(userBadges.userId, userId),
    });

    return {
      ...user,
      functionalRoles: user.functionalRoles.map((r) => r.role),
      badges: badges.map((b) => b.badgeType),
    };
  }

  async getMyStats(userId: string) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [reactionsRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(postReactions)
      .innerJoin(posts, eq(posts.id, postReactions.postId))
      .where(and(eq(posts.authorId, userId), gte(postReactions.createdAt, weekAgo)));

    const [followersRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(userFollows)
      .where(and(eq(userFollows.followeeId, userId), gte(userFollows.createdAt, weekAgo)));

    const [commentsRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(comments)
      .where(and(eq(comments.authorId, userId), gte(comments.createdAt, weekAgo)));

    const [postsRow] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(posts)
      .where(and(eq(posts.authorId, userId), gte(posts.createdAt, weekAgo), eq(posts.status, 'published')));

    return {
      reactionsThisWeek: Number(reactionsRow?.count ?? 0),
      newFollowersThisWeek: Number(followersRow?.count ?? 0),
      commentsThisWeek: Number(commentsRow?.count ?? 0),
      postsThisWeek: Number(postsRow?.count ?? 0),
    };
  }

  async findById(id: string) {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, id), isNull(users.deletedAt)),
      with: {
        profile: true,
        functionalRoles: { where: (r, { eq: eqFn }) => eqFn(r.isActive, true) },
      },
    });

    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    return this.sanitize(user);
  }

  private async refreshBadges(userId: string): Promise<void> {
    const [postCount, followerCount, completedSessionCount, approvedVerification, user] =
      await Promise.all([
        this.db
          .select({ count: sql<number>`COUNT(*)` })
          .from(posts)
          .where(and(eq(posts.authorId, userId), eq(posts.status, 'published')))
          .then((r) => Number(r[0]?.count ?? 0)),
        this.db
          .select({ count: sql<number>`COUNT(*)` })
          .from(userFollows)
          .where(eq(userFollows.followeeId, userId))
          .then((r) => Number(r[0]?.count ?? 0)),
        this.db
          .select({ count: sql<number>`COUNT(*)` })
          .from(mentorshipRequests)
          .where(and(eq(mentorshipRequests.mentorId, userId), eq(mentorshipRequests.status, 'completed')))
          .then((r) => Number(r[0]?.count ?? 0)),
        this.db.query.verificationDocuments.findFirst({
          where: and(eq(verificationDocuments.userId, userId), eq(verificationDocuments.status, 'approved')),
        }),
        this.db.query.users.findFirst({ where: eq(users.id, userId) }),
      ]);

    const earned: string[] = [];
    if (postCount >= 20) earned.push('contributor');
    if (followerCount >= 10) earned.push('connector');
    if (completedSessionCount >= 5) earned.push('mentor_star');
    if (approvedVerification) earned.push('verified');
    // founding_member: first 50 users (by createdAt ordering)
    if (user) {
      const rank = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(and(isNull(users.deletedAt), sql`users.created_at <= ${user.createdAt}`))
        .then((r) => Number(r[0]?.count ?? 0));
      if (rank <= 50) earned.push('founding_member');
    }

    for (const badgeType of earned) {
      await this.db
        .insert(userBadges)
        .values({ userId, badgeType })
        .onConflictDoNothing();
    }
  }

  async getPublicProfile(id: string, viewerId?: string) {
    const row = await this.db
      .select({
        id: users.id,
        membershipTier: users.membershipTier,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        bio: userProfiles.bio,
        city: userProfiles.city,
        profession: userProfiles.profession,
        linkedinUrl: userProfiles.linkedinUrl,
        websiteUrl: userProfiles.websiteUrl,
        skillTags: userProfiles.skillTags,
        portfolioUrl: userProfiles.portfolioUrl,
        corporateName: userProfiles.corporateName,
        corporateRole: userProfiles.corporateRole,
        followerCount: sql<number>`(SELECT COUNT(*) FROM user_follows WHERE followee_id = ${users.id})`.as('follower_count'),
        followingCount: sql<number>`(SELECT COUNT(*) FROM user_follows WHERE follower_id = ${users.id})`.as('following_count'),
        postCount: sql<number>`(SELECT COUNT(*) FROM posts WHERE author_id = ${users.id} AND status = 'published')`.as('post_count'),
        completedSessionCount: sql<number>`(SELECT COUNT(*) FROM mentorship_requests WHERE mentor_id = ${users.id} AND status = 'completed')`.as('completed_session_count'),
        isFollowing: viewerId
          ? sql<boolean>`EXISTS(SELECT 1 FROM user_follows WHERE follower_id = ${viewerId} AND followee_id = ${users.id})`.as('is_following')
          : sql<boolean>`false`.as('is_following'),
      })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(and(eq(users.id, id), eq(users.status, 'active'), isNull(users.deletedAt)))
      .limit(1);

    if (!row[0]) throw new NotFoundException('Üye bulunamadı.');

    void this.refreshBadges(id);

    const badges = await this.db.query.userBadges.findMany({
      where: eq(userBadges.userId, id),
    });

    return { ...row[0], badges: badges.map((b) => b.badgeType) };
  }

  async listMembers(q?: string) {
    const cacheKey = `members:list:${q?.trim() ?? ''}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as Awaited<ReturnType<typeof this._queryListMembers>>;
    } catch { /* redis unavailable */ }

    const rows = await this._queryListMembers(q);
    try {
      await this.redis.setex(cacheKey, MEMBERS_CACHE_TTL, JSON.stringify(rows));
    } catch { /* ignore redis write errors */ }
    return rows;
  }

  private async _queryListMembers(q?: string) {
    const conditions = [eq(users.status, 'active'), isNull(users.deletedAt)];
    if (q?.trim()) {
      const like = `%${q.trim()}%`;
      conditions.push(
        or(
          ilike(userProfiles.displayName, like),
          ilike(userProfiles.city, like),
          ilike(userProfiles.profession, like),
        )!,
      );
    }

    const rows = await this.db
      .select({
        id: users.id,
        membershipTier: users.membershipTier,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        bio: userProfiles.bio,
        city: userProfiles.city,
        profession: userProfiles.profession,
      })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(users.createdAt));

    return rows;
  }

  async getSuggestedMembers(viewerId: string) {
    const profile = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, viewerId),
    });

    const rows = await this.db
      .select({
        id: users.id,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        profession: userProfiles.profession,
        city: userProfiles.city,
        skillTags: userProfiles.skillTags,
      })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(and(eq(users.status, 'active'), isNull(users.deletedAt), sql`${users.id} != ${viewerId}`))
      .limit(50);

    const viewerTags: string[] = profile?.skillTags ?? [];
    const viewerProfession = profile?.profession ?? '';

    // Score by shared skill tags + same profession
    const scored = rows.map((r) => {
      const tags: string[] = r.skillTags ?? [];
      const sharedTags = tags.filter((t) => viewerTags.includes(t)).length;
      const sameProfession = viewerProfession && r.profession === viewerProfession ? 1 : 0;
      return { ...r, _score: sharedTags * 2 + sameProfession };
    });

    return scored
      .filter((r) => r._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 5)
      .map(({ _score: _, ...r }) => r);
  }

  async listUsersForAdmin(params: {
    tier?: string;
    status?: string;
    search?: string;
    cursor?: string;
    limit?: number;
    city?: string;
    workStatus?: string;
    minAge?: number;
    maxAge?: number;
    minExperience?: number;
    maxExperience?: number;
    verificationStatus?: string;
    joinedAfter?: string;
    joinedBefore?: string;
    sortBy?: string;
    memberOnly?: boolean;
    registeredOnly?: boolean;
  }) {
    const limit = Math.min(params.limit ?? ADMIN_PAGE_SIZE, 100);

    const conditions: SQL[] = [isNull(users.deletedAt), ne(users.email, 'admin@haritailesi.org')];
    if (params.memberOnly) conditions.push(notInArray(users.membershipTier, ['registered_user', 'visitor']));
    if (params.registeredOnly) conditions.push(sql`${users.membershipTier} = 'registered_user'`);
    if (params.tier) conditions.push(sql`${users.membershipTier} = ${params.tier}`);
    if (params.status) conditions.push(sql`${users.status} = ${params.status}`);
    if (params.verificationStatus) conditions.push(sql`${users.verificationStatus} = ${params.verificationStatus}`);
    if (params.search) {
      conditions.push(
        or(
          ilike(users.email, `%${params.search}%`),
          ilike(userProfiles.displayName, `%${params.search}%`),
          ilike(userProfiles.profession, `%${params.search}%`),
        )!,
      );
    }
    if (params.city) conditions.push(ilike(userProfiles.city, `%${params.city}%`));
    if (params.workStatus) conditions.push(sql`${userProfiles.workStatus} = ${params.workStatus}`);
    if (params.minExperience !== undefined) {
      conditions.push(
        and(isNotNull(userProfiles.professionalExperienceYears), gte(userProfiles.professionalExperienceYears, params.minExperience))!,
      );
    }
    if (params.maxExperience !== undefined) {
      conditions.push(
        and(isNotNull(userProfiles.professionalExperienceYears), lte(userProfiles.professionalExperienceYears, params.maxExperience))!,
      );
    }
    if (params.minAge !== undefined) {
      conditions.push(
        and(
          isNotNull(userProfiles.birthDate),
          sql`DATE_PART('year', AGE(CURRENT_DATE, ${userProfiles.birthDate}::date)) >= ${params.minAge}`,
        )!,
      );
    }
    if (params.maxAge !== undefined) {
      conditions.push(
        and(
          isNotNull(userProfiles.birthDate),
          sql`DATE_PART('year', AGE(CURRENT_DATE, ${userProfiles.birthDate}::date)) <= ${params.maxAge}`,
        )!,
      );
    }
    if (params.joinedAfter) conditions.push(gte(users.createdAt, new Date(params.joinedAfter)));
    if (params.joinedBefore) conditions.push(lte(users.createdAt, new Date(params.joinedBefore)));
    if (params.cursor) {
      conditions.push(
        sql`${users.createdAt} < (SELECT created_at FROM users WHERE id = ${params.cursor})`,
      );
    }

    const orderBy = (() => {
      switch (params.sortBy) {
        case 'oldest':    return asc(users.createdAt);
        case 'name':      return asc(userProfiles.displayName);
        case 'lastLogin': return desc(users.lastLoginAt);
        default:          return desc(users.createdAt);
      }
    })();

    const rows = await this.db
      .select({
        id: users.id,
        email: users.email,
        membershipTier: users.membershipTier,
        status: users.status,
        verificationStatus: users.verificationStatus,
        createdAt: users.createdAt,
        displayName: userProfiles.displayName,
        city: userProfiles.city,
        profession: userProfiles.profession,
        workStatus: userProfiles.workStatus,
        experienceYears: userProfiles.professionalExperienceYears,
        skillTags: userProfiles.skillTags,
        corporateName: userProfiles.corporateName,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);

    return {
      data,
      next_cursor: hasMore ? (data[data.length - 1]?.id ?? null) : null,
      has_more: hasMore,
    };
  }

  async getUserForAdmin(id: string) {
    const [row] = await this.db
      .select({
        id: users.id,
        email: users.email,
        membershipTier: users.membershipTier,
        status: users.status,
        verificationStatus: users.verificationStatus,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        profileDisplayName: userProfiles.displayName,
        profileAvatarUrl: userProfiles.avatarUrl,
        profileBio: userProfiles.bio,
        profileCity: userProfiles.city,
        profileProfession: userProfiles.profession,
        profileBirthDate: userProfiles.birthDate,
        profileGraduationYear: userProfiles.graduationYear,
        profileWorkStatus: userProfiles.workStatus,
        profileExperienceYears: userProfiles.professionalExperienceYears,
        profileLinkedinUrl: userProfiles.linkedinUrl,
        profileWebsiteUrl: userProfiles.websiteUrl,
        profileSkillTags: userProfiles.skillTags,
        profilePortfolioUrl: userProfiles.portfolioUrl,
        profileCorporateName: userProfiles.corporateName,
        profileCorporateRole: userProfiles.corporateRole,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(and(eq(users.id, id), isNull(users.deletedAt)));

    if (!row) throw new NotFoundException('Kullanıcı bulunamadı.');

    const [roles, userApplications] = await Promise.all([
      this.db
        .select({ role: userFunctionalRoles.role })
        .from(userFunctionalRoles)
        .where(and(eq(userFunctionalRoles.userId, id), eq(userFunctionalRoles.isActive, true))),
      this.db
        .select({
          id: applications.id,
          type: applications.type,
          state: applications.state,
          createdAt: applications.createdAt,
          formData: applications.formData,
        })
        .from(applications)
        .where(eq(applications.applicantEmail, row.email))
        .orderBy(desc(applications.createdAt)),
    ]);

    const profile = row.profileDisplayName !== null
      ? {
          displayName: row.profileDisplayName,
          avatarUrl: row.profileAvatarUrl,
          bio: row.profileBio,
          city: row.profileCity,
          profession: row.profileProfession,
          birthDate: row.profileBirthDate,
          graduationYear: row.profileGraduationYear,
          workStatus: row.profileWorkStatus,
          experienceYears: row.profileExperienceYears,
          linkedinUrl: row.profileLinkedinUrl,
          websiteUrl: row.profileWebsiteUrl,
          skillTags: row.profileSkillTags,
          portfolioUrl: row.profilePortfolioUrl,
          corporateName: row.profileCorporateName,
          corporateRole: row.profileCorporateRole,
        }
      : null;

    return {
      id: row.id,
      email: row.email,
      membershipTier: row.membershipTier,
      status: row.status,
      verificationStatus: row.verificationStatus,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      profile,
      functionalRoles: roles.map((r) => r.role),
      applications: userApplications,
    };
  }

  async findByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)),
      with: {
        profile: true,
        functionalRoles: { where: (r, { eq: eqFn }) => eqFn(r.isActive, true) },
      },
    });
  }

  async updateProfile(
    userId: string,
    data: Partial<{
      displayName: string;
      bio: string;
      city: string;
      profession: string;
      linkedinUrl: string;
      websiteUrl: string;
      avatarUrl: string;
      skillTags: string[];
      portfolioUrl: string;
    }>,
  ) {
    const [updated] = await this.db
      .update(userProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();

    await this.invalidateMembersCache();
    return updated;
  }

  private async invalidateMembersCache() {
    try {
      const keys = await this.redis.keys('members:list:*');
      if (keys.length) await this.redis.del(...keys);
    } catch { /* redis unavailable */ }
  }

  // ─── Admin: Rol & Tier & Durum Yönetimi ──────────────────────────────────────

  async assignRole(adminId: string, userId: string, role: FunctionalRole) {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, userId), isNull(users.deletedAt)),
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const existing = await this.db.query.userFunctionalRoles.findFirst({
      where: and(eq(userFunctionalRoles.userId, userId), eq(userFunctionalRoles.role, role)),
    });

    if (existing) {
      if (existing.isActive) return { userId, role, action: 'already_active' };
      await this.db
        .update(userFunctionalRoles)
        .set({ isActive: true, revokedAt: null, grantedBy: adminId, grantedAt: new Date() })
        .where(eq(userFunctionalRoles.id, existing.id));
    } else {
      await this.db
        .insert(userFunctionalRoles)
        .values({ userId, role, grantedBy: adminId });
    }

    return { userId, role, action: 'assigned' };
  }

  async revokeRole(adminId: string, userId: string, role: FunctionalRole) {
    const existing = await this.db.query.userFunctionalRoles.findFirst({
      where: and(
        eq(userFunctionalRoles.userId, userId),
        eq(userFunctionalRoles.role, role),
        eq(userFunctionalRoles.isActive, true),
      ),
    });
    if (!existing) throw new NotFoundException('Aktif rol bulunamadı.');

    await this.db
      .update(userFunctionalRoles)
      .set({ isActive: false, revokedAt: new Date() })
      .where(eq(userFunctionalRoles.id, existing.id));

    return { userId, role, action: 'revoked' };
  }

  async updateTier(userId: string, tier: MembershipTier) {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, userId), isNull(users.deletedAt)),
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const [updated] = await this.db
      .update(users)
      .set({ membershipTier: tier, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id, membershipTier: users.membershipTier });

    return updated;
  }

  async updateStatus(userId: string, status: string) {
    const ALLOWED = ['active', 'passive', 'suspended', 'pending'];
    if (!ALLOWED.includes(status)) throw new BadRequestException('Geçersiz durum.');

    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, userId), isNull(users.deletedAt)),
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const [updated] = await this.db
      .update(users)
      .set({ status: status as UserStatus, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id, status: users.status });

    return updated;
  }

  async setVerificationStatus(userId: string, status: string) {
    const ALLOWED = ['unverified', 'verification_requested', 'verification_submitted', 'verified', 'verification_rejected'] as const;
    type VerifyStatus = (typeof ALLOWED)[number];
    if (!(ALLOWED as readonly string[]).includes(status)) throw new BadRequestException('Geçersiz doğrulama durumu.');
    const [updated] = await this.db
      .update(users)
      .set({ verificationStatus: status as VerifyStatus, updatedAt: new Date() })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .returning({ id: users.id, verificationStatus: users.verificationStatus });
    if (!updated) throw new NotFoundException('Kullanıcı bulunamadı.');
    return updated;
  }

  // ─── Delete User ──────────────────────────────────────────────────────────────

  async deleteUser(adminId: string, targetId: string) {
    if (adminId === targetId) throw new BadRequestException('Kendi hesabınızı silemezsiniz.');

    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, targetId), isNull(users.deletedAt)),
      with: { functionalRoles: true },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const isSuperAdmin = (user as typeof user & { functionalRoles: Array<{ role: string }> })
      .functionalRoles.some((r) => r.role === 'super_admin');
    if (isSuperAdmin) throw new BadRequestException('Süper admin hesabı silinemez.');

    await this.db
      .update(users)
      .set({ status: 'deleted', deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, targetId));

    return { id: targetId, deleted: true };
  }

  // ─── Corporate Representative ─────────────────────────────────────────────────

  async createCorporateRep(
    adminId: string,
    dto: {
      email: string;
      displayName: string;
      corporateName: string;
      corporateRole: string;
    },
  ) {
    const existing = await this.db.query.users.findFirst({
      where: and(eq(users.email, dto.email.toLowerCase()), isNull(users.deletedAt)),
    });
    if (existing) throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');

    const [user] = await this.db
      .insert(users)
      .values({
        email: dto.email.toLowerCase(),
        passwordHash: '!', // setup e-postasıyla temsilci kendi şifresini belirler
        membershipTier: 'corporate_member',
        status: 'active',
        verificationStatus: 'verified',
      })
      .returning({ id: users.id });

    if (!user) throw new Error('Kullanıcı oluşturulamadı.');

    await this.db.insert(userProfiles).values({
      userId: user.id,
      displayName: dto.displayName,
      corporateName: dto.corporateName,
      corporateRole: dto.corporateRole,
    });

    await this.db.insert(userFunctionalRoles).values({
      userId: user.id,
      role: 'corporate_rep',
      grantedBy: adminId,
    });

    return { id: user.id, email: dto.email.toLowerCase() };
  }

  // ─── Follow System ────────────────────────────────────────────────────────────

  async follow(followerId: string, followeeId: string): Promise<{ following: boolean }> {
    if (followerId === followeeId) throw new BadRequestException('Kendinizi takip edemezsiniz.');

    const followee = await this.db.query.users.findFirst({
      where: and(eq(users.id, followeeId), eq(users.status, 'active'), isNull(users.deletedAt)),
    });
    if (!followee) throw new NotFoundException('Üye bulunamadı.');

    await this.db
      .insert(userFollows)
      .values({ followerId, followeeId })
      .onConflictDoNothing();

    return { following: true };
  }

  async unfollow(followerId: string, followeeId: string): Promise<{ following: boolean }> {
    await this.db
      .delete(userFollows)
      .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followeeId, followeeId)));

    return { following: false };
  }

  async getFollowers(userId: string) {
    const rows = await this.db
      .select({
        id: users.id,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        profession: userProfiles.profession,
        membershipTier: users.membershipTier,
        followedAt: userFollows.createdAt,
      })
      .from(userFollows)
      .innerJoin(users, eq(users.id, userFollows.followerId))
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(and(eq(userFollows.followeeId, userId), eq(users.status, 'active'), isNull(users.deletedAt)))
      .orderBy(desc(userFollows.createdAt));

    return rows;
  }

  async getFollowing(userId: string) {
    const rows = await this.db
      .select({
        id: users.id,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        profession: userProfiles.profession,
        membershipTier: users.membershipTier,
        followedAt: userFollows.createdAt,
      })
      .from(userFollows)
      .innerJoin(users, eq(users.id, userFollows.followeeId))
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(and(eq(userFollows.followerId, userId), eq(users.status, 'active'), isNull(users.deletedAt)))
      .orderBy(desc(userFollows.createdAt));

    return rows;
  }

  private resolveMembershipTier(
    appType: string,
    formData: Record<string, unknown>,
  ): MembershipTier {
    if (appType === 'corporate') return 'corporate_member';

    // Genç başvuruları formData.membershipType ile ayırt edilir
    const membershipType = formData['membershipType'];
    if (membershipType === 'ogrenci') return 'haritailesi_genc';
    if (membershipType === 'yeni_mezun') return 'new_graduate_member';

    return 'individual_member';
  }

  private extractDisplayName(formData: Record<string, unknown>): string {
    const name = formData['adSoyad'] ?? formData['ad_soyad'] ?? formData['displayName'];
    return typeof name === 'string' && name.trim() ? name.trim() : 'Üye';
  }

  private sanitize(user: typeof users.$inferSelect & { profile: unknown; functionalRoles: unknown }) {
    // passwordHash asla response'a girmez
    const { passwordHash: _, ...safe } = user;
    return safe;
  }
}

