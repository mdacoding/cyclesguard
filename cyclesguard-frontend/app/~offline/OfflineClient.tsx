'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WifiOff, Loader2 } from 'lucide-react';
import { flushOutbox, listPending, type PendingCycleLog } from '@/lib/offline/outbox';
import { PHASE_DEFINITIONS } from '@/lib/cycle-phases';

export default function OfflineClient() {
  const [pending, setPending] = useState<PendingCycleLog[]>([]);
  const [flushing, setFlushing] = useState(false);

  const refresh = async () => {
    setPending(await listPending());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleRetry = async () => {
    setFlushing(true);
    await flushOutbox();
    await refresh();
    setFlushing(false);
    if (navigator.onLine) {
      window.location.href = '/player/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card p-10 max-w-md w-full text-center space-y-6">
        <WifiOff className="w-12 h-12 text-rose-gold mx-auto" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-gradient mb-3">
            Du bist offline
          </h1>
          <p className="text-cream/70 text-sm leading-relaxed">
            Keine Verbindung — typisch in der Kabine. Deine Einträge liegen lokal und
            werden synchronisiert, sobald Netz da ist.
          </p>
        </div>

        <p className="text-sm text-cream/50">
          Ausstehend: <strong className="text-cream">{pending.length}</strong>
        </p>

        {pending.length > 0 && (
          <ul className="text-left space-y-2 max-h-40 overflow-auto">
            {pending.map((entry) => (
              <li
                key={entry.clientLogId}
                className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-cream/70"
              >
                {PHASE_DEFINITIONS[entry.phase].labelDE}
                {entry.energyLevel != null ? ` · Energie ${entry.energyLevel}` : ''}
                <span className="block text-cream/40 mt-0.5">
                  {new Date(entry.createdAt).toLocaleString('de-DE')}
                </span>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={handleRetry}
          disabled={flushing}
          className="inline-flex items-center gap-2 min-h-12 bg-rose-gold text-navy px-6 py-3 rounded-full font-semibold text-sm hover:bg-opacity-90 transition-all disabled:opacity-50"
        >
          {flushing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Erneut versuchen
        </button>
        <div>
          <Link href="/player/dashboard" className="text-sm text-cream/50 hover:text-cream/80">
            Zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
