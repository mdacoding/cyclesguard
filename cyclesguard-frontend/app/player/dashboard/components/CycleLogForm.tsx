'use client';

import { useEffect, useState } from 'react';
import { CycleLog, CyclePhase } from '@/lib/types';
import { PHASE_DEFINITIONS } from '@/lib/cycle-phases';
import { SYMPTOM_OPTIONS } from '@/lib/symptoms';
import PhaseCard from './PhaseCard';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { enqueueLog, flushOutbox, isOffline, listPending } from '@/lib/offline/outbox';

interface CycleLogFormProps {
  todayLog?: CycleLog | null;
}

export default function CycleLogForm({ todayLog = null }: CycleLogFormProps) {
  const router = useRouter();
  const isUpdate = !!todayLog;

  const [selectedPhase, setSelectedPhase] = useState<CyclePhase | null>(todayLog?.phase ?? null);
  const [energyLevel, setEnergyLevel] = useState<number>(todayLog?.energyLevel ?? 3);
  const [symptoms, setSymptoms] = useState<string[]>(todayLog?.symptoms ?? []);
  const [notes, setNotes] = useState(todayLog?.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPending = async () => {
    const pending = await listPending();
    setPendingCount(pending.length);
  };

  useEffect(() => {
    setSelectedPhase(todayLog?.phase ?? null);
    setEnergyLevel(todayLog?.energyLevel ?? 3);
    setSymptoms(todayLog?.symptoms ?? []);
    setNotes(todayLog?.notes ?? '');
  }, [todayLog]);

  useEffect(() => {
    const sync = () => setOffline(isOffline());
    sync();
    void refreshPending();

    const onOnline = () => {
      setOffline(false);
      void flushOutbox().then(() => {
        void refreshPending();
        router.refresh();
      });
    };
    const onOffline = () => setOffline(true);
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void flushOutbox().then(() => {
        void refreshPending();
        router.refresh();
      });
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    void flushOutbox().then(() => refreshPending());

    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OUTBOX_FLUSHED') {
        void refreshPending();
        router.refresh();
      }
    };
    navigator.serviceWorker?.addEventListener('message', onSwMessage);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
      navigator.serviceWorker?.removeEventListener('message', onSwMessage);
    };
  }, [router]);

  const toggleSymptom = (key: string) => {
    setSymptoms((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : prev.length < 8 ? [...prev, key] : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhase) return;

    setIsSubmitting(true);
    setError(null);
    setOfflineSaved(false);

    try {
      const entry = await enqueueLog({
        phase: selectedPhase,
        energyLevel,
        symptoms,
        notes: notes.trim() || undefined,
      });

      if (isOffline()) {
        setOfflineSaved(true);
        setSuccess(true);
        await refreshPending();
      } else {
        const result = await flushOutbox();
        if (result.failed > 0 && result.synced === 0) {
          const response = await fetch('/api/player/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientLogId: entry.clientLogId,
              phase: selectedPhase,
              energyLevel,
              symptoms,
              notes: notes.trim() || undefined,
            }),
          });
          if (!response.ok) throw new Error('Failed to save log');
        }
        setSuccess(true);
        await refreshPending();
        router.refresh();
      }

      setTimeout(() => {
        setSuccess(false);
        setOfflineSaved(false);
      }, 3000);
    } catch {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" aria-label="Zyklus-Phase loggen">
      {isUpdate && (
        <p className="text-sm text-center text-cream/60 bg-white/5 rounded-lg p-3">
          Du hast heute bereits eingetragen — Änderungen überschreiben den heutigen Eintrag.
        </p>
      )}

      {(offline || pendingCount > 0) && (
        <div className="text-sm text-center bg-ovulation/10 border border-ovulation/30 text-ovulation p-3 rounded-lg">
          {offline
            ? `Offline — ${pendingCount} Eintrag${pendingCount === 1 ? '' : 'e'} warten auf Sync.`
            : `${pendingCount} Eintrag${pendingCount === 1 ? '' : 'e'} werden synchronisiert…`}
        </div>
      )}

      <div
        className="grid grid-cols-2 gap-3 sm:gap-4"
        role="radiogroup"
        aria-label="Wähle deine aktuelle Zyklusphase"
      >
        {(Object.keys(PHASE_DEFINITIONS) as CyclePhase[]).map((phase) => (
          <PhaseCard
            key={phase}
            definition={PHASE_DEFINITIONS[phase]}
            isSelected={selectedPhase === phase}
            onSelect={setSelectedPhase}
          />
        ))}
      </div>

      <div className="space-y-4 pt-4 border-t border-white/10">
        <label className="block text-sm font-medium text-cream/90 text-center">
          Energielevel (1-5)
        </label>
        <div className="flex justify-center gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setEnergyLevel(level)}
              className={`w-12 h-12 min-w-12 min-h-12 rounded-full flex items-center justify-center text-lg font-medium transition-all duration-300 ${
                energyLevel === level
                  ? 'bg-rose-gold text-navy scale-110 shadow-[0_0_15px_rgba(232,196,184,0.4)]'
                  : 'bg-white/5 text-cream/70 hover:bg-white/10 hover:scale-105'
              }`}
              aria-label={`Energielevel ${level}`}
              aria-pressed={energyLevel === level}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-white/10">
        <p className="text-sm font-medium text-cream/90 text-center">Symptome (optional)</p>
        <div className="flex flex-wrap justify-center gap-2">
          {SYMPTOM_OPTIONS.map((symptom) => {
            const active = symptoms.includes(symptom.key);
            return (
              <button
                key={symptom.key}
                type="button"
                onClick={() => toggleSymptom(symptom.key)}
                className={`px-3 py-2.5 rounded-lg text-sm transition-colors min-h-11 ${
                  active
                    ? 'bg-rose-gold/20 border border-rose-gold/40 text-cream'
                    : 'bg-white/5 border border-white/10 text-cream/70'
                }`}
                aria-pressed={active}
              >
                {symptom.labelDE}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="block text-sm font-medium text-cream/90">
          Notiz (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Kurz notieren, was heute wichtig ist…"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-rose-gold/50"
        />
      </div>

      {error && (
        <div className="text-menstrual text-sm text-center bg-menstrual/10 p-3 rounded-lg border border-menstrual/20">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center justify-center gap-2 text-sage bg-sage/10 p-4 rounded-lg border border-sage/20 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5" />
          <span>
            {offlineSaved
              ? 'Gespeichert — Sync ausstehend'
              : isUpdate
                ? 'Eintrag aktualisiert!'
                : 'Erfolgreich gespeichert!'}
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={!selectedPhase || isSubmitting || success}
        className={`w-full min-h-14 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex justify-center items-center gap-2 ${
          !selectedPhase
            ? 'bg-white/5 text-cream/40 cursor-not-allowed'
            : 'bg-rose-gold text-navy hover:bg-opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(232,196,184,0.2)]'
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Speichern...
          </>
        ) : isUpdate ? (
          'Eintrag aktualisieren'
        ) : (
          'Tagebucheintrag speichern'
        )}
      </button>
    </form>
  );
}
