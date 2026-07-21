import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Never send health/cycle payloads from the browser
    beforeSend(event) {
      if (event.request?.data && typeof event.request.data === 'object') {
        delete (event.request as { data?: unknown }).data;
      }
      return event;
    },
  });
}
