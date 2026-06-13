import type { StateTransition } from '../state-machine';
import type { RequestUser } from '../../auth/auth.types';

export const APPLICATION_STATE_CHANGED = 'application.state_changed';

// Re-export domain events as a convenience — consumers import from one place
export { DomainEvent } from './domain-events';
export type { DomainEventName, DomainEventPayload } from './domain-events';

export class ApplicationStateChangedEvent {
  constructor(
    public readonly applicationId: string,
    public readonly applicantEmail: string,
    public readonly applicantUserId: string | null,
    public readonly fromState: string,
    public readonly toState: string,
    public readonly displayName: string,
    public readonly applicationType: string,
    public readonly transition: StateTransition,
    /** Existing user account or newly created userId on active transition */
    public readonly notifyUserId: string | null,
    /** Newly created userId on active transition — account setup email target */
    public readonly newUserId: string | null,
    public readonly actor: RequestUser,
    public readonly paymentAmountKurus?: number,
    public readonly applicantPhone?: string | null,
  ) {}
}
