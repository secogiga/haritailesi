import type { EventEmitter2 } from '@nestjs/event-emitter';
import type { FunctionalRole, MembershipTier } from '@haritailesi/types';

// ─── Event Name Registry ───────────────────────────────────────────────────────
// Naming convention: '<aggregate>.<past-tense-verb>'
// ALL domain events must be registered here. Using a string literal outside
// this map is forbidden — TypeScript will catch it via EventRegistry below.

export const DomainEvent = {
  // ── Payment lifecycle ──────────────────────────────────────────────────────────
  PAYMENT_WAIVED:           'payment.waived',
  PAYMENT_WAIVER_REVOKED:   'payment.waiver_revoked',
  PAYMENT_EXPIRED:          'payment.expired',
  PAYMENT_REMINDED:         'payment.reminded',
  PAYMENT_FAILED:           'payment.failed',
  // ── Member lifecycle ───────────────────────────────────────────────────────────
  MEMBER_ACTIVATED:         'member.activated',
  MEMBER_DEACTIVATED:       'member.deactivated',
  MEMBER_ROLE_ASSIGNED:     'member.role_assigned',
  MEMBER_ROLE_REMOVED:      'member.role_removed',
  MEMBER_TIER_CHANGED:      'member.tier_changed',
  MEMBER_PROFILE_UPDATED:   'member.profile_updated',
} as const;

export type DomainEventName = typeof DomainEvent[keyof typeof DomainEvent];

// ─── Payload Types ─────────────────────────────────────────────────────────────
// Each event has a specific payload. Add fields to metadata for uncommon extras.
// actorId/actorEmail are null for system-initiated events (cron jobs).

export interface DomainEventPayload {
  applicationId: string;
  applicantEmail: string;
  applicantUserId: string | null;
  displayName: string;
  actorId: string | null;
  actorEmail: string | null;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface MemberEventPayload {
  userId: string;
  email: string;
  displayName: string;
  actorId: string;
  actorEmail: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface MemberRoleEventPayload extends MemberEventPayload {
  role: FunctionalRole;
}

export interface MemberTierEventPayload extends MemberEventPayload {
  fromTier: MembershipTier;
  toTier: MembershipTier;
}

// ─── Event Registry ────────────────────────────────────────────────────────────
// Maps every event name to its payload type.
// domainEmit() uses this to enforce correct payload at compile time.
// Adding a new event: register it in DomainEvent + EventRegistry, then use domainEmit().

export interface EventRegistry {
  // Payment
  [DomainEvent.PAYMENT_WAIVED]:          DomainEventPayload;
  [DomainEvent.PAYMENT_WAIVER_REVOKED]:  DomainEventPayload;
  [DomainEvent.PAYMENT_EXPIRED]:         DomainEventPayload;
  [DomainEvent.PAYMENT_REMINDED]:        DomainEventPayload;
  [DomainEvent.PAYMENT_FAILED]:          DomainEventPayload;
  // Member
  [DomainEvent.MEMBER_ACTIVATED]:       MemberEventPayload;
  [DomainEvent.MEMBER_DEACTIVATED]:     MemberEventPayload;
  [DomainEvent.MEMBER_ROLE_ASSIGNED]:   MemberRoleEventPayload;
  [DomainEvent.MEMBER_ROLE_REMOVED]:    MemberRoleEventPayload;
  [DomainEvent.MEMBER_TIER_CHANGED]:    MemberTierEventPayload;
  [DomainEvent.MEMBER_PROFILE_UPDATED]: MemberEventPayload;
}

// ─── Type-safe Emit Helper ─────────────────────────────────────────────────────
// Use this instead of eventEmitter.emit() everywhere.
// TypeScript will catch wrong event names and mismatched payload shapes.
//
// Usage: domainEmit(this.eventEmitter, DomainEvent.PAYMENT_WAIVED, payload)

export function domainEmit<K extends keyof EventRegistry>(
  emitter: EventEmitter2,
  event: K,
  payload: EventRegistry[K],
): void {
  emitter.emit(event, payload);
}
