'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquareHeart } from 'lucide-react';

const DISMISS_KEY = 'cg_feedback_dismissed_until';
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

type Props = {
  context: string;
  /** Soft nudge after first meaningful use */
  enabled?: boolean;
};

export default function PilotFeedbackCapture({ context, enabled = true }: Props) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
      if (until > Date.now()) return;
      setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [enabled]);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + COOLDOWN_MS));
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const submit = async () => {
    if (!score) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          message: message.trim() || undefined,
          context,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'Senden fehlgeschlagen.');
        return;
      }
      setDone(true);
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now() + COOLDOWN_MS));
      } catch {
        /* ignore */
      }
      setTimeout(() => setOpen(false), 1600);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <section className="glass-card p-5 border border-sage/25 bg-sage/5 space-y-3 print:hidden">
      <div className="flex items-start gap-3">
        <MessageSquareHeart className="w-5 h-5 text-sage shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm mb-1">Kurzes Pilot-Feedback</h2>
          <p className="text-xs text-cream/60 leading-relaxed">
            Nur Produkt-UX — keine Gesundheitsdaten. Hilft uns, CyclesGuard für den Club zu schärfen.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-xs text-cream/40 hover:text-cream/70 min-h-11 px-2"
        >
          Später
        </button>
      </div>

      {done ? (
        <p className="text-sm text-sage">Danke — Feedback gespeichert.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setScore(n)}
                className={`min-h-11 min-w-11 rounded-xl text-sm font-medium border transition-colors ${
                  score === n
                    ? 'bg-sage text-navy border-sage'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                aria-label={`Bewertung ${n} von 5`}
              >
                {n}
              </button>
            ))}
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="Was würde den Alltag in der Kabine besser machen? (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none"
          />
          {error && <p className="text-sm text-menstrual">{error}</p>}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!score || busy}
            className="inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl bg-sage text-navy font-medium text-sm disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Senden
          </button>
        </>
      )}
    </section>
  );
}
