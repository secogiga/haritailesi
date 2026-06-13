import type { EmailJobName } from '../email/email.types';
import type { EventRegistry } from '../applications/events/domain-events';

// ─── Action definitions ────────────────────────────────────────────────────────
// Each action type declares what it needs from the event payload.
// Resolver<T, R> allows static values or functions that compute from payload.

type Resolver<T, R> = R | ((payload: T) => R);

export function resolveValue<T, R>(r: Resolver<T, R>, payload: T): R {
  return typeof r === 'function' ? (r as (p: T) => R)(payload) : r;
}

export interface EmailAction<T> {
  type: 'email';
  to: (payload: T) => string;
  template: EmailJobName;
  vars: (payload: T) => Record<string, string | number | boolean>;
}

export interface PushAction<T> {
  type: 'push';
  userId: (payload: T) => string;
  title: Resolver<T, string>;
  body: Resolver<T, string>;
}

// Delayed push: enqueued immediately, delivered after delayMs
export interface DelayedPushAction<T> {
  type: 'delayed_push';
  userId: (payload: T) => string;
  title: string;
  body: string;
  delayMs: number;
}

export type AutomationAction<T> =
  | EmailAction<T>
  | PushAction<T>
  | DelayedPushAction<T>;

// ─── Rule definition ──────────────────────────────────────────────────────────

export interface AutomationRule<K extends keyof EventRegistry> {
  id: string;
  event: K;
  condition?: (payload: EventRegistry[K]) => boolean;
  actions: Array<AutomationAction<EventRegistry[K]>>;
}

// ─── Erasure type for the runtime map ─────────────────────────────────────────

export interface AnyAutomationRule {
  id: string;
  event: string;
  condition?: (payload: unknown) => boolean;
  actions: Array<AutomationAction<unknown>>;
}
