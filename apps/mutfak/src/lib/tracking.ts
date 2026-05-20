'use client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventCategory =
  | 'onboarding'
  | 'engagement'
  | 'mentorship'
  | 'content'
  | 'events'
  | 'community'
  | 'retention';

export type EventAction =
  | 'started'
  | 'completed'
  | 'clicked'
  | 'viewed'
  | 'abandoned'
  | 'returned'
  | 'shared'
  | 'matched';

export type TrackableEvent = {
  category: EventCategory;
  action: EventAction;
  metadata?: {
    source?: string;
    userType?: string;
    onboardingStep?: string;
    contentType?: string;
    mentorId?: string;
    eventId?: string;
    sessionDuration?: number;
    [key: string]: unknown;
  };
};

type QueuedEvent = TrackableEvent & { queuedAt: number; attempts: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const BATCH_SIZE   = 10;
const FLUSH_MS     = 2000;
const MAX_RETRY    = 3;
const QUEUE_KEY    = 'hi_track_queue';
const BATCH_PATH   = '/api/v1/users/me/events/batch';

// ─── TrackingBus ──────────────────────────────────────────────────────────────

class TrackingBus {
  private queue: QueuedEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flushing = false;

  constructor(private token: string, private apiBase: string) {
    this.hydrate();
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => { void this.flush(); });
      window.addEventListener('online',       () => { void this.flush(); });
    }
  }

  track(event: TrackableEvent): void {
    this.queue.push({ ...event, queuedAt: Date.now(), attempts: 0 });
    this.persist();
    this.schedule();
  }

  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    this.flushing = true;
    const batch = this.queue.splice(0, BATCH_SIZE);
    this.persist();

    try {
      const res = await fetch(`${this.apiBase}${BATCH_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${this.token}`,
        },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      const retryable = batch
        .map(e => ({ ...e, attempts: e.attempts + 1 }))
        .filter(e => e.attempts < MAX_RETRY);
      this.queue = [...retryable, ...this.queue];
      this.persist();
    } finally {
      this.flushing = false;
      // If more events queued while flushing, schedule again
      if (this.queue.length > 0) this.schedule();
    }
  }

  updateToken(token: string): void {
    this.token = token;
  }

  destroy(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.queue.length >= BATCH_SIZE) {
      void this.flush();
    } else {
      this.timer = setTimeout(() => { void this.flush(); }, FLUSH_MS);
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue.slice(0, 100)));
    } catch { /* storage full or unavailable */ }
  }

  private hydrate(): void {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (raw) this.queue = JSON.parse(raw) as QueuedEvent[];
    } catch {
      this.queue = [];
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let bus: TrackingBus | null = null;

export function initTracker(token: string, apiBase = ''): void {
  if (bus) {
    bus.updateToken(token);
  } else {
    bus = new TrackingBus(token, apiBase);
  }
}

export function track(event: TrackableEvent): void {
  bus?.track(event);
}

export function flushTracker(): Promise<void> {
  return bus?.flush() ?? Promise.resolve();
}

// ─── Typed event helpers ──────────────────────────────────────────────────────

export const T = {
  onboarding: {
    started:   (step?: string) => track({ category: 'onboarding', action: 'started',   ...(step ? { metadata: { onboardingStep: step } } : {}) }),
    completed: (step?: string) => track({ category: 'onboarding', action: 'completed', ...(step ? { metadata: { onboardingStep: step } } : {}) }),
    abandoned: (step?: string) => track({ category: 'onboarding', action: 'abandoned', ...(step ? { metadata: { onboardingStep: step } } : {}) }),
  },
  engagement: {
    viewed:  (source?: string) => track({ category: 'engagement', action: 'viewed',  ...(source ? { metadata: { source } } : {}) }),
    clicked: (source?: string) => track({ category: 'engagement', action: 'clicked', ...(source ? { metadata: { source } } : {}) }),
  },
  mentorship: {
    started: (mentorId?: string) => track({ category: 'mentorship', action: 'started', ...(mentorId ? { metadata: { mentorId } } : {}) }),
    matched: (mentorId?: string) => track({ category: 'mentorship', action: 'matched', ...(mentorId ? { metadata: { mentorId } } : {}) }),
  },
  content: {
    created: (contentType?: string) => track({ category: 'content', action: 'completed', ...(contentType ? { metadata: { contentType } } : {}) }),
    shared:  (contentType?: string) => track({ category: 'content', action: 'shared',    ...(contentType ? { metadata: { contentType } } : {}) }),
  },
  events: {
    viewed: (eventId?: string) => track({ category: 'events', action: 'viewed',    ...(eventId ? { metadata: { eventId } } : {}) }),
    joined: (eventId?: string) => track({ category: 'events', action: 'completed', ...(eventId ? { metadata: { eventId } } : {}) }),
  },
  community: {
    contributed: () => track({ category: 'community', action: 'completed' }),
    shared:      () => track({ category: 'community', action: 'shared'    }),
  },
  retention: {
    returned: (days: 7 | 30) => track({ category: 'retention', action: 'returned', metadata: { sessionDuration: days } }),
  },
} as const;

// ─── React hook ───────────────────────────────────────────────────────────────
// Usage: const { T, track } = useTracker();

import { useEffect } from 'react';

export function useTracker(token: string) {
  const apiBase =
    typeof window !== 'undefined'
      ? (process.env['NEXT_PUBLIC_API_URL'] ?? '')
      : '';

  useEffect(() => {
    if (!token) return;
    initTracker(token, apiBase);
  }, [token, apiBase]);

  return { T, track };
}
