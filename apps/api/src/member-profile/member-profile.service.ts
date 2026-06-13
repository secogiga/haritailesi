import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { InjectDb } from '../database/inject-db.decorator';
import type { Database } from '@haritailesi/database';
import {
  users,
  userProfiles,
  userFunctionalRoles,
  applications,
  membershipSubscriptions,
} from '@haritailesi/database';
import { AuditService } from '../audit/audit.service';
import { DomainEvent, domainEmit } from '../applications/events/domain-events';
import type { RequestUser } from '../auth/auth.types';
import type { FunctionalRole, MembershipTier } from '@haritailesi/types';

// ─── Member Profile — Identity Aggregate ──────────────────────────────────────
// Single service owning all member identity mutations that require:
//   - Audit trail
//   - Domain event emission
//   - Cross-table consistency (users + userProfiles + roles + subscriptions)
//
// Read-only queries live in UsersService (getMe, getPublicProfile, getUserForAdmin).
// This service owns: activate, deactivate, assignRole, removeRole, updateTier.

@Injectable()
export class MemberProfileService {
  private readonly logger = new Logger(MemberProfileService.name);

  constructor(
    @InjectDb() private readonly db: Database,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditService: AuditService,
  ) {}

  // ─── Full Aggregate View (admin) ──────────────────────────────────────────────
  // Returns everything admin needs in one call: identity + profile + roles +
  // application history + active membership subscription.

  async getAggregate(userId: string) {
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
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        bio: userProfiles.bio,
        city: userProfiles.city,
        profession: userProfiles.profession,
        birthDate: userProfiles.birthDate,
        graduationYear: userProfiles.graduationYear,
        workStatus: userProfiles.workStatus,
        experienceYears: userProfiles.professionalExperienceYears,
        linkedinUrl: userProfiles.linkedinUrl,
        websiteUrl: userProfiles.websiteUrl,
        skillTags: userProfiles.skillTags,
        portfolioUrl: userProfiles.portfolioUrl,
        corporateName: userProfiles.corporateName,
        corporateRole: userProfiles.corporateRole,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(and(eq(users.id, userId), isNull(users.deletedAt)));

    if (!row) throw new NotFoundException('Üye bulunamadı.');

    const [roles, memberApplications, subscription] = await Promise.all([
      this.db
        .select({ role: userFunctionalRoles.role, grantedAt: userFunctionalRoles.grantedAt })
        .from(userFunctionalRoles)
        .where(and(eq(userFunctionalRoles.userId, userId), eq(userFunctionalRoles.isActive, true))),

      this.db
        .select({
          id: applications.id,
          type: applications.type,
          state: applications.state,
          paymentStatus: applications.paymentStatus,
          formData: applications.formData,
          createdAt: applications.createdAt,
        })
        .from(applications)
        .where(eq(applications.applicantEmail, row.email))
        .orderBy(desc(applications.createdAt))
        .limit(5),

      this.db.query.membershipSubscriptions.findFirst({
        where: eq(membershipSubscriptions.userId, userId),
        orderBy: [desc(membershipSubscriptions.createdAt)],
      }),
    ]);

    return {
      id: row.id,
      email: row.email,
      membershipTier: row.membershipTier,
      status: row.status,
      verificationStatus: row.verificationStatus,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      profile: row.displayName !== null ? {
        displayName: row.displayName,
        avatarUrl: row.avatarUrl,
        bio: row.bio,
        city: row.city,
        profession: row.profession,
        birthDate: row.birthDate,
        graduationYear: row.graduationYear,
        workStatus: row.workStatus,
        experienceYears: row.experienceYears,
        linkedinUrl: row.linkedinUrl,
        websiteUrl: row.websiteUrl,
        skillTags: row.skillTags,
        portfolioUrl: row.portfolioUrl,
        corporateName: row.corporateName,
        corporateRole: row.corporateRole,
      } : null,
      functionalRoles: roles.map((r) => ({ role: r.role, grantedAt: r.grantedAt })),
      applications: memberApplications,
      subscription: subscription ?? null,
    };
  }

  // ─── Activate ─────────────────────────────────────────────────────────────────

  async activateMember(userId: string, actor: RequestUser): Promise<void> {
    const user = await this.requireUser(userId);
    if (user.status === 'active') return;

    await this.db
      .update(users)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(users.id, userId));

    await this.audit(actor, 'member.activated', userId, {
      before: { status: user.status },
      after: { status: 'active' },
    });

    domainEmit(this.eventEmitter, DomainEvent.MEMBER_ACTIVATED, {
      userId,
      email: user.email,
      displayName: await this.resolveDisplayName(userId),
      actorId: actor.id,
      actorEmail: actor.email,
      timestamp: new Date(),
    });

    this.logger.log(`member_activated userId=${userId} by=${actor.id}`);
  }

  // ─── Deactivate ───────────────────────────────────────────────────────────────

  async deactivateMember(userId: string, actor: RequestUser): Promise<void> {
    const user = await this.requireUser(userId);
    if (user.status === 'passive') return;

    await this.db
      .update(users)
      .set({ status: 'passive', updatedAt: new Date() })
      .where(eq(users.id, userId));

    await this.audit(actor, 'member.deactivated', userId, {
      before: { status: user.status },
      after: { status: 'passive' },
    });

    domainEmit(this.eventEmitter, DomainEvent.MEMBER_DEACTIVATED, {
      userId,
      email: user.email,
      displayName: await this.resolveDisplayName(userId),
      actorId: actor.id,
      actorEmail: actor.email,
      timestamp: new Date(),
    });

    this.logger.log(`member_deactivated userId=${userId} by=${actor.id}`);
  }

  // ─── Assign Role ──────────────────────────────────────────────────────────────

  async assignRole(userId: string, role: FunctionalRole, actor: RequestUser) {
    const user = await this.requireUser(userId);

    const existing = await this.db.query.userFunctionalRoles.findFirst({
      where: and(eq(userFunctionalRoles.userId, userId), eq(userFunctionalRoles.role, role)),
    });

    if (existing?.isActive) return { userId, role, action: 'already_active' as const };

    if (existing) {
      await this.db
        .update(userFunctionalRoles)
        .set({ isActive: true, revokedAt: null, grantedBy: actor.id, grantedAt: new Date() })
        .where(eq(userFunctionalRoles.id, existing.id));
    } else {
      await this.db
        .insert(userFunctionalRoles)
        .values({ userId, role, grantedBy: actor.id });
    }

    await this.audit(actor, 'member.role_assigned', userId, { role });

    domainEmit(this.eventEmitter, DomainEvent.MEMBER_ROLE_ASSIGNED, {
      userId,
      email: user.email,
      displayName: await this.resolveDisplayName(userId),
      role,
      actorId: actor.id,
      actorEmail: actor.email,
      timestamp: new Date(),
    });

    this.logger.log(`role_assigned userId=${userId} role=${role} by=${actor.id}`);
    return { userId, role, action: 'assigned' as const };
  }

  // ─── Remove Role ──────────────────────────────────────────────────────────────

  async removeRole(userId: string, role: FunctionalRole, actor: RequestUser) {
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

    const user = await this.requireUser(userId);

    await this.audit(actor, 'member.role_removed', userId, { role });

    domainEmit(this.eventEmitter, DomainEvent.MEMBER_ROLE_REMOVED, {
      userId,
      email: user.email,
      displayName: await this.resolveDisplayName(userId),
      role,
      actorId: actor.id,
      actorEmail: actor.email,
      timestamp: new Date(),
    });

    this.logger.log(`role_removed userId=${userId} role=${role} by=${actor.id}`);
    return { userId, role, action: 'removed' as const };
  }

  // ─── Update Tier ──────────────────────────────────────────────────────────────

  async updateTier(userId: string, toTier: MembershipTier, actor: RequestUser) {
    const user = await this.requireUser(userId);
    const fromTier = user.membershipTier;

    if (fromTier === toTier) throw new BadRequestException('Kullanıcı zaten bu tier\'da.');

    await this.db
      .update(users)
      .set({ membershipTier: toTier, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await this.audit(actor, 'member.tier_changed', userId, { fromTier, toTier });

    domainEmit(this.eventEmitter, DomainEvent.MEMBER_TIER_CHANGED, {
      userId,
      email: user.email,
      displayName: await this.resolveDisplayName(userId),
      fromTier,
      toTier,
      actorId: actor.id,
      actorEmail: actor.email,
      timestamp: new Date(),
    });

    this.logger.log(`tier_changed userId=${userId} ${fromTier} → ${toTier} by=${actor.id}`);
    return { userId, fromTier, toTier };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private async requireUser(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, userId), isNull(users.deletedAt)),
    });
    if (!user) throw new NotFoundException('Üye bulunamadı.');
    return user;
  }

  private async resolveDisplayName(userId: string): Promise<string> {
    const profile = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
      columns: { displayName: true },
    });
    return profile?.displayName ?? '';
  }

  private async audit(
    actor: RequestUser,
    action: string,
    userId: string,
    afterState: Record<string, unknown>,
  ) {
    await this.auditService.log({
      actor,
      action,
      entityType: 'user',
      entityId: userId,
      afterState,
    });
  }
}
