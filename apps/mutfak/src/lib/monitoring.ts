import * as Sentry from '@sentry/browser';

let initialized = false;

export function initMonitoring() {
  if (initialized) return;
  const dsn = process.env.NEXT_PUBLIC_GLITCHTIP_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
  initialized = true;
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[monitoring]', error, context);
  }
  if (!initialized) return;
  Sentry.withScope((scope: Sentry.Scope) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
}
