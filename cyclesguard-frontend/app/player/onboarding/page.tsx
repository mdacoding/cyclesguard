'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Loader2,
  Check,
  Clock,
  Bell,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const TIPS = [
  {
    icon: Lock,
    title: 'Privat bleibt privat',
    body: 'Trainer sehen nur Ampel-Signale — nie Phase, Symptome oder Notizen.',
  },
  {
    icon: Clock,
    title: 'Unter 30 Sekunden',
    body: 'Phase + Energie wählen, speichern — fertig. Heute kannst du den Eintrag später anpassen.',
  },
  {
    icon: Bell,
    title: 'Erinnerungen optional',
    body: 'Unter Einstellungen kannst du Push aktivieren. Ohne medizinische Inhalte in der Vorschau.',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState<'consent' | 'tips'>('consent');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
        try {
          localStorage.setItem('cg_player_onboarded', '1');
        } catch {
          /* ignore */
        }
        setStep('tips');
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

  const goDashboard = () => {
    router.push('/player/dashboard');
    router.refresh();
  };

  if (step === 'tips') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16 animate-fadeIn">
        <div className="max-w-xl w-full space-y-8">
          <div className="text-center">
            <p className="text-sage text-sm mb-2">Schritt bereit</p>
            <h1 className="font-display text-4xl font-semibold text-gradient mb-3">
              So startest du
            </h1>
            <p className="text-cream/60 leading-relaxed">
              Drei Punkte — dann dein erster Log auf dem Dashboard.
            </p>
          </div>

          <div className="space-y-3">
            {TIPS.map((tip) => (
              <section key={tip.title} className="glass-card p-5 flex gap-4">
                <tip.icon className="w-6 h-6 text-rose-gold shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold mb-1">{tip.title}</h2>
                  <p className="text-sm text-cream/65 leading-relaxed">{tip.body}</p>
                </div>
              </section>
            ))}
          </div>

          <button
            type="button"
            onClick={goDashboard}
            className="w-full min-h-14 py-4 rounded-xl font-semibold text-navy bg-rose-gold hover:bg-rose-gold/90 transition-all duration-300 inline-flex items-center justify-center gap-2"
          >
            Zum Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

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
