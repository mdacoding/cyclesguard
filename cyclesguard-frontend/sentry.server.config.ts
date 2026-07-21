import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Strip potential PII / health fields from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((b) => {
          if (b.data) {
            const { phase, symptoms, energy_level, notes, ...safe } = b.data as Record<
              string,
              unknown
            >;
            void phase;
            void symptoms;
            void energy_level;
            void notes;
            return { ...b, data: safe };
          }
          return b;
        });
      }
      return event;
    },
  });
}
