'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang="de">
      <body style={{ fontFamily: 'system-ui', padding: 40, background: '#0b1220', color: '#f5f0e8' }}>
        <h2>Etwas ist schiefgelaufen</h2>
        <p>Bitte Seite neu laden. Deine Daten sind davon nicht betroffen.</p>
        <button type="button" onClick={() => reset()}>
          Erneut versuchen
        </button>
      </body>
    </html>
  );
}
