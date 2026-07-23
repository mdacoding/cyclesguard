'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CycleLog } from '@/lib/types';
import { PHASE_DEFINITIONS } from '@/lib/cycle-phases';
import { SYMPTOM_OPTIONS } from '@/lib/symptoms';
import { listPending, type PendingCycleLog } from '@/lib/offline/outbox';

function symptomLabel(key: string): string {
  return SYMPTOM_OPTIONS.find((s) => s.key === key)?.labelDE ?? key;
}

export default function RecentLogsCard({ logs }: { logs: CycleLog[] }) {
  const [pending, setPending] = useState<PendingCycleLog[]>([]);

  useEffect(() => {
    const refresh = () => {
      void listPending().then(setPending).catch(() => setPending([]));
    };
    refresh();
    const onVis = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', onVis);
    const onSw = (event: MessageEvent) => {
      if (event.data?.type === 'OUTBOX_FLUSHED') refresh();
    };
    navigator.serviceWorker?.addEventListener('message', onSw);
    return () => {
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', onVis);
      navigator.serviceWorker?.removeEventListener('message', onSw);
    };
  }, []);

  if ((!logs || logs.length === 0) && pending.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <h2 className="font-display text-xl font-semibold">Verlauf</h2>
        <p className="text-sm text-cream/60">Noch keine Einträge vorhanden.</p>
        <p className="text-xs text-cream/40">Starte mit deinem ersten Log links.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold flex items-center justify-between gap-2">
        <span>Letzte Logs</span>
        <Link
          href="/player/history"
          className="text-xs font-normal text-rose-gold hover:underline min-h-11 inline-flex items-center"
        >
          Kalender
        </Link>
      </h2>

      {pending.length > 0 && (
        <div className="rounded-xl border border-ovulation/30 bg-ovulation/10 p-3 space-y-2">
          <p className="text-xs font-medium text-cream/80">
            Offline ausstehend ({pending.length}) — Sync bei Netz
          </p>
          <ul className="space-y-1.5">
            {pending.slice(0, 3).map((entry) => (
              <li key={entry.clientLogId} className="text-xs text-cream/60">
                {PHASE_DEFINITIONS[entry.phase].labelDE}
                {entry.energyLevel != null ? ` · Energie ${entry.energyLevel}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="relative pl-4 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
        {logs.map((log) => {
          const definition = PHASE_DEFINITIONS[log.phase];
          const date = new Date(log.loggedAt || log.createdAt);

          return (
            <div key={log.id} className="relative pl-6">
              <div
                className="absolute left-[-21px] top-1 w-3 h-3 rounded-full border-2 border-navy z-10"
                style={{ backgroundColor: definition.color }}
              />
              <div className="bg-white/5 rounded-lg p-4 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-xs text-cream/50 font-medium">
                    {date.toLocaleDateString('de-DE', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                  {log.energyLevel != null && (
                    <span className="text-xs text-cream/50">Energie: {log.energyLevel}/5</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>
                    {definition.emoji}
                  </span>
                  <span className="font-medium text-sm" style={{ color: definition.color }}>
                    {definition.labelDE}
                  </span>
                </div>
                {log.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {log.symptoms.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="text-[11px] px-2 py-1 rounded-md bg-white/5 text-cream/60 border border-white/5"
                      >
                        {symptomLabel(s)}
                      </span>
                    ))}
                    {log.symptoms.length > 4 && (
                      <span className="text-[11px] text-cream/40">+{log.symptoms.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
