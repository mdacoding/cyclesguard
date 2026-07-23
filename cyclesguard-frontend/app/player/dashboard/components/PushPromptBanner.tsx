'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import { isPushSupported } from '@/lib/push-client';

const DISMISS_KEY = 'cg_push_prompt_dismissed';

/** Soft nudge after the player has logged at least once and push is still off. */
export default function PushPromptBanner({ hasLogged }: { hasLogged: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasLogged || !isPushSupported()) return;
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    let cancelled = false;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (!cancelled && !sub) setVisible(true);
      })
      .catch(() => {
        /* ignore */
      });

    return () => {
      cancelled = true;
    };
  }, [hasLogged]);

  if (!visible) return null;

  return (
    <section className="glass-card p-4 border border-rose-gold/25 bg-rose-gold/5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between animate-slideUp">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-rose-gold shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm">Tägliche Erinnerung?</p>
          <p className="text-xs text-cream/60 mt-0.5">
            Optional — ohne medizinische Inhalte. Aktivieren unter Einstellungen.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Link
          href="/player/settings#reminders"
          className="min-h-11 px-4 inline-flex items-center rounded-lg bg-rose-gold text-navy text-sm font-medium"
        >
          Zu Erinnerungen
        </Link>
        <button
          type="button"
          aria-label="Hinweis schließen"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, '1');
            setVisible(false);
          }}
          className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
