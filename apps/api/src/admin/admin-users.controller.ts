import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength, IsEmail } from 'class-validator';
import { eq, desc, asc } from 'drizzle-orm';
import { UsersService } from '../users/users.service';
import { MembershipService } from '../membership/membership.service';
import { MemberProfileService } from '../member-profile/member-profile.service';
import { RequirePermission } from '../rbac/rbac.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { REDIS_TOKEN } from '../redis/redis.constants';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import { surveyResponses, surveys, surveyQuestions } from '@haritailesi/database';
import type { RequestUser } from '../auth/auth.types';
import type { FunctionalRole, MembershipTier } from '@haritailesi/types';
import type Redis from 'ioredis';

const FUNCTIONAL_ROLES: FunctionalRole[] = [
  'mentor', 'moderator', 'editor', 'meslegin_gelecekleri_participant',
  'corporate_rep', 'viewer', 'finance', 'admin', 'super_admin',
];

const MEMBERSHIP_TIERS: MembershipTier[] = [
  'registered_user', 'haritailesi_genc', 'new_graduate_member',
  'individual_member', 'corporate_member',
];

class ListUsersQuery {
  @IsOptional() @IsString() tier?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() workStatus?: string;
  @IsOptional() @IsString() minAge?: string;
  @IsOptional() @IsString() maxAge?: string;
  @IsOptional() @IsString() minExperience?: string;
  @IsOptional() @IsString() maxExperience?: string;
  @IsOptional() @IsString() verificationStatus?: string;
  @IsOptional() @IsString() joinedAfter?: string;
  @IsOptional() @IsString() joinedBefore?: string;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsString() memberOnly?: string;
  @IsOptional() @IsString() registeredOnly?: string;
}

class UpdateRoleDto {
  @IsIn(FUNCTIONAL_ROLES)
  role!: FunctionalRole;

  @IsIn(['assign', 'revoke'])
  action!: 'assign' | 'revoke';
}

class UpdateTierDto {
  @IsIn(MEMBERSHIP_TIERS)
  tier!: MembershipTier;
}

class UpdateStatusDto {
  @IsIn(['active', 'passive', 'suspended', 'pending'])
  status!: string;
}

class UpdateVerificationStatusDto {
  @IsIn(['unverified', 'verification_requested', 'verification_submitted', 'verified', 'verification_rejected'])
  status!: string;
}

class CreateCorporateRepDto {
  @IsEmail()
  email!: string;

  @IsString() @MinLength(2)
  displayName!: string;

  @IsString() @MinLength(2)
  corporateName!: string;

  @IsString() @MinLength(2)
  corporateRole!: string;
}

@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly membershipService: MembershipService,
    private readonly memberProfileService: MemberProfileService,
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
    @InjectDb() private readonly db: Database,
  ) {}

  @Get('online')
  @RequirePermission('user.manage')
  async getOnlineUsers() {
    const keys = await this.redis.keys('presence:*');
    const userIds = keys.map(k => k.slice('presence:'.length));
    return { userIds, count: userIds.length };
  }

  @Get()
  @RequirePermission('user.manage')
  list(@Query() query: ListUsersQuery) {
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    const toInt = (v?: string): number | undefined => (v !== undefined && v !== '' ? parseInt(v, 10) : undefined);
    const p: Parameters<typeof this.usersService.listUsersForAdmin>[0] = {};
    if (query.tier) p.tier = query.tier;
    if (query.status) p.status = query.status;
    if (query.search) p.search = query.search;
    if (query.cursor) p.cursor = query.cursor;
    if (limit !== undefined) p.limit = limit;
    if (query.city) p.city = query.city;
    if (query.workStatus) p.workStatus = query.workStatus;
    if (query.verificationStatus) p.verificationStatus = query.verificationStatus;
    if (query.joinedAfter) p.joinedAfter = query.joinedAfter;
    if (query.joinedBefore) p.joinedBefore = query.joinedBefore;
    if (query.sortBy) p.sortBy = query.sortBy;
    if (query.memberOnly === 'true') p.memberOnly = true;
    if (query.registeredOnly === 'true') p.registeredOnly = true;
    const minAge = toInt(query.minAge); if (minAge !== undefined) p.minAge = minAge;
    const maxAge = toInt(query.maxAge); if (maxAge !== undefined) p.maxAge = maxAge;
    const minExp = toInt(query.minExperience); if (minExp !== undefined) p.minExperience = minExp;
    const maxExp = toInt(query.maxExperience); if (maxExp !== undefined) p.maxExperience = maxExp;
    return this.usersService.listUsersForAdmin(p);
  }

  // Returns full member aggregate: identity + profile + roles + applications + subscription
  @Get(':id')
  @RequirePermission('user.manage')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.memberProfileService.getAggregate(id);
  }

  @Patch(':id/role')
  @RequirePermission('user.roles.manage')
  updateRole(
    @CurrentUser() actor: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    if (dto.action === 'assign') {
      return this.memberProfileService.assignRole(id, dto.role, actor);
    }
    return this.memberProfileService.removeRole(id, dto.role, actor);
  }

  @Patch(':id/tier')
  @RequirePermission('member.edit')
  updateTier(
    @CurrentUser() actor: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTierDto,
  ) {
    return this.memberProfileService.updateTier(id, dto.tier, actor);
  }

  @Patch(':id/status')
  @RequirePermission('member.activate')
  updateStatus(
    @CurrentUser() actor: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    if (dto.status === 'active') return this.memberProfileService.activateMember(id, actor);
    if (dto.status === 'passive') return this.memberProfileService.deactivateMember(id, actor);
    // suspended / pending — direct update without a specific domain event
    return this.usersService.updateStatus(id, dto.status);
  }

  @Patch(':id/verification-status')
  @RequirePermission('verification.review')
  setVerificationStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVerificationStatusDto,
  ) {
    return this.usersService.setVerificationStatus(id, dto.status);
  }

  @Delete(':id')
  @RequirePermission('user.delete')
  deleteUser(
    @CurrentUser() admin: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.deleteUser(admin.id, id);
  }

  @Post('corporate-rep')
  @RequirePermission('user.roles.manage')
  async createCorporateRep(
    @CurrentUser() admin: RequestUser,
    @Body() dto: CreateCorporateRepDto,
  ) {
    const rep = await this.usersService.createCorporateRep(admin.id, dto);
    await this.membershipService.sendInviteToUser(rep.id);
    return { id: rep.id, email: rep.email, inviteSent: true };
  }

  @Post(':id/send-invite')
  @HttpCode(200)
  @RequirePermission('user.manage')
  async sendInvite(@Param('id', ParseUUIDPipe) id: string) {
    await this.membershipService.sendInviteToUser(id);
    return { sent: true };
  }

  @Get(':id/surveys')
  @RequirePermission('user.manage')
  async getUserSurveys(@Param('id', ParseUUIDPipe) id: string) {
    const responses = await this.db
      .select({
        id: surveyResponses.id,
        surveyId: surveyResponses.surveyId,
        score: surveyResponses.score,
        maxScore: surveyResponses.maxScore,
        timeTaken: surveyResponses.timeTaken,
        createdAt: surveyResponses.createdAt,
        surveyTitle: surveys.title,
        surveyType: surveys.type,
        surveyPassingScore: surveys.passingScore,
      })
      .from(surveyResponses)
      .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
      .where(eq(surveyResponses.userId, id))
      .orderBy(desc(surveyResponses.createdAt))
      .limit(50);

    return responses.map(r => ({
      ...r,
      percent: r.maxScore && r.score != null ? Math.round((r.score / r.maxScore) * 100) : null,
      passed: r.surveyType === 'test' && r.surveyPassingScore != null && r.maxScore && r.score != null
        ? Math.round((r.score / r.maxScore) * 100) >= r.surveyPassingScore
        : null,
    }));
  }
}
