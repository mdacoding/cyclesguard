'use client';

import { useState } from 'react';
import { ShieldAlert, Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConsent = async () => {
    if (!agreed) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/player/consent', {
        method: 'POST',
      });

      if (response.ok) {
        const supabase = createClient();
        await supabase.auth.refreshSession();
        window.location.assign('/player/welcome');
      } else {
        alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      }
    } catch (e) {
      console.error(e);
      alert('Netzwerkfehler.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 animate-fadeIn">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-semibold text-gradient mb-3">
            Willkommen bei CyclesGuard
          </h1>
          <p className="text-cream/60 leading-relaxed">
            Bevor wir starten, benötigen wir deine ausdrückliche Zustimmung
            (auch nach einer Team-Einladung). Danach kannst du in unter 30&nbsp;Sekunden
            deinen ersten Eintrag machen.
          </p>
        </div>

        <div className="glass-card p-8 md:p-10">
          <div className="flex items-start gap-4 mb-8 bg-white/5 p-5 rounded-xl border border-white/10">
            <ShieldAlert className="w-8 h-8 text-rose-gold shrink-0 mt-1" />
            <div>
              <h2 className="font-semibold text-lg text-cream mb-2">Datenschutz (Art. 9 DSGVO)</h2>
              <p className="text-sm text-cream/70 leading-relaxed">
                Diese App verarbeitet sensible Gesundheitsdaten (Menstruationszyklus).
                Deine Daten sind streng vertraulich. Trainer oder Vereinsverantwortliche
                haben <strong>keinen Zugriff</strong> auf deine persönlichen Zyklus-Einträge.
                Du kannst deine Daten jederzeit exportieren oder restlos löschen.
              </p>
            </div>
          </div>

          <label className="flex items-start gap-4 cursor-pointer group mb-8 p-4 rounded-xl hover:bg-white/5 transition-colors">
            <div className="relative flex items-center justify-center w-6 h-6 shrink-0 mt-0.5">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <div className="w-6 h-6 border-2 border-cream/30 rounded flex items-center justify-center peer-checked:bg-rose-gold peer-checked:border-rose-gold transition-colors">
                <Check
                  className={`w-4 h-4 text-navy transition-opacity ${agreed ? 'opacity-100' : 'opacity-0'}`}
                  strokeWidth={3}
                />
              </div>
            </div>
            <span className="text-sm text-cream/90 leading-relaxed select-none">
              Ich stimme der Verarbeitung meiner Gesundheitsdaten zur Verletzungsprävention
              ausdrücklich zu. Ich habe verstanden, dass die Nutzung freiwillig ist und ich
              diese Einwilligung jederzeit durch Löschung des Kontos widerrufen kann.
            </span>
          </label>

          <button
            onClick={handleConsent}
            disabled={!agreed || isLoading}
            className="w-full min-h-14 py-4 rounded-xl font-semibold text-navy bg-rose-gold hover:bg-rose-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(232,196,184,0.15)] mt-4"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>Zustimmen & weiter</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
