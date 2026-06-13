import { DomainEvent } from '../../applications/events/domain-events';
import type { AutomationRule, AnyAutomationRule } from '../automation.types';
import type { EventRegistry, MemberEventPayload, MemberRoleEventPayload, MemberTierEventPayload } from '../../applications/events/domain-events';

// ─── Rule: Mentor profile approved email ──────────────────────────────────────
// When a user is assigned the 'mentor' role → send mentor_profile_approved email.
// Orchestrator only sends a generic "role assigned" push; this adds a targeted email.

const mentorProfileApproved: AutomationRule<typeof DomainEvent.MEMBER_ROLE_ASSIGNED> = {
  id: 'mentor_profile_approved',
  event: DomainEvent.MEMBER_ROLE_ASSIGNED,
  condition: (p: MemberRoleEventPayload) => p.role === 'mentor',
  actions: [
    {
      type: 'email',
      to: (p) => p.email,
      template: 'mentor_profile_approved',
      vars: (p) => ({ displayName: p.displayName }),
    },
  ],
};

// ─── Rule: Tier upgrade congratulations push ──────────────────────────────────
// When a member tier is upgraded (not downgraded) → send a congratulatory push.
// The orchestrator has no handler for member.tier_changed; this fills the gap.

const TIER_ORDER: Record<string, number> = {
  registered_user: 0,
  haritailesi_genc: 1,
  new_graduate_member: 2,
  individual_member: 3,
  corporate_member: 3,
};

const tierUpgradePush: AutomationRule<typeof DomainEvent.MEMBER_TIER_CHANGED> = {
  id: 'tier_upgrade_congrats',
  event: DomainEvent.MEMBER_TIER_CHANGED,
  condition: (p: MemberTierEventPayload) =>
    (TIER_ORDER[p.toTier] ?? -1) > (TIER_ORDER[p.fromTier] ?? -1),
  actions: [
    {
      type: 'push',
      userId: (p) => p.userId,
      title: 'Üyelik Tipin Güncellendi 🎉',
      body: (p: MemberTierEventPayload) => `Tebrikler! Üyelik tipiniz güncellendi.`,
    },
  ],
};

// ─── Rule: Profile completion nudge (7 days after activation) ─────────────────
// New members often skip profile setup. Remind them 7 days after activation.
// The push fires regardless of whether the profile was completed (v1 simplification).

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const profileCompletionNudge: AutomationRule<typeof DomainEvent.MEMBER_ACTIVATED> = {
  id: 'profile_completion_nudge_7d',
  event: DomainEvent.MEMBER_ACTIVATED,
  actions: [
    {
      type: 'delayed_push',
      userId: (p: MemberEventPayload) => p.userId,
      title: 'Profilini Tamamla',
      body: 'Haritailesi topluluğundan daha fazla yararlanmak için profilini güncelleyebilirsin.',
      delayMs: SEVEN_DAYS_MS,
    },
  ],
};

// ─── Rule: Moderator welcome push ─────────────────────────────────────────────
// When a moderator role is assigned → send a welcome push explaining responsibilities.

const moderatorWelcome: AutomationRule<typeof DomainEvent.MEMBER_ROLE_ASSIGNED> = {
  id: 'moderator_welcome',
  event: DomainEvent.MEMBER_ROLE_ASSIGNED,
  condition: (p: MemberRoleEventPayload) => p.role === 'moderator',
  actions: [
    {
      type: 'push',
      userId: (p) => p.userId,
      title: 'Moderatör Olarak Atandın',
      body: 'Topluluk kurallarına göre içerikleri yönetme yetkisine sahipsin. İyi moderasyon!',
    },
  ],
};

// ─── Rule: Deactivated member email ───────────────────────────────────────────
// When a member is deactivated (membership paused) → the state machine already
// sends 'membership_paused' email via APPLICATION_STATE_CHANGED.
// Here we add an in-app push since the orchestrator doesn't handle MEMBER_DEACTIVATED.

const memberDeactivatedPush: AutomationRule<typeof DomainEvent.MEMBER_DEACTIVATED> = {
  id: 'member_deactivated_push',
  event: DomainEvent.MEMBER_DEACTIVATED,
  actions: [
    {
      type: 'push',
      userId: (p: MemberEventPayload) => p.userId,
      title: 'Üyeliğin Pasife Alındı',
      body: 'Üyeliğin geçici olarak pasif duruma alındı. Destek için bize ulaşabilirsin.',
    },
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────
// All rules in a flat list; indexed by event name at service startup.

export const AUTOMATION_RULES: AnyAutomationRule[] = [
  mentorProfileApproved as unknown as AnyAutomationRule,
  tierUpgradePush as unknown as AnyAutomationRule,
  profileCompletionNudge as unknown as AnyAutomationRule,
  moderatorWelcome as unknown as AnyAutomationRule,
  memberDeactivatedPush as unknown as AnyAutomationRule,
];
