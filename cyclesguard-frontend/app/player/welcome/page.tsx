'use client';

import { useEffect } from 'react';
import { Clock, Bell, Lock, ArrowRight } from 'lucide-react';

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

/** Post-consent first-run tips (L2) — separate from consent so middleware stays correct. */
export default function PlayerWelcomePage() {
  useEffect(() => {
    try {
      localStorage.setItem('cg_player_onboarded', '1');
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 animate-fadeIn">
      <div className="max-w-xl w-full space-y-8">
        <div className="text-center">
          <p className="text-sage text-sm mb-2">Schritt bereit</p>
          <h1 className="font-display text-4xl font-semibold text-gradient mb-3">So startest du</h1>
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

        <a
          href="/player/dashboard"
          className="w-full min-h-14 py-4 rounded-xl font-semibold text-navy bg-rose-gold hover:bg-rose-gold/90 transition-all duration-300 inline-flex items-center justify-center gap-2"
        >
          Zum Dashboard
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
