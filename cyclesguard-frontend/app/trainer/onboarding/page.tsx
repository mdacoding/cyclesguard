'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Users, Activity } from 'lucide-react';

const STEPS = [
  {
    icon: ShieldCheck,
    title: 'Nur Ampel — nie Rohdaten',
    body: 'Du siehst FIT / ANGEPASST / REGEN / KEINE DATEN. Keine Phasen, Symptome oder Notizen.',
  },
  {
    icon: Activity,
    title: 'Vor der Einheit aktualisieren',
    body: '„Aktualisieren“ holt den aktuellen Stand. Filtere auf Handlungsbedarf oder heute fehlend.',
  },
  {
    icon: Users,
    title: 'Roster per E-Mail',
    body: 'Lade Spielerinnen ein. Passwort per Link; „Einladung erneut“ bei offenen Invites. Passwort vergessen: /login → Passwort vergessen.',
  },
];

export default function TrainerOnboardingPage() {
  useEffect(() => {
    try {
      localStorage.setItem('cg_trainer_onboarded', '1');
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="min-h-screen py-10 px-4 animate-fadeIn">
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <p className="text-sage text-sm mb-2">Trainer Onboarding</p>
          <h1 className="font-display text-4xl font-semibold text-gradient mb-3">
            So steuerst du die Kabine
          </h1>
          <p className="text-cream/70">
            Drei Schritte — Privacy first, Ampel klar, Roster schnell.
          </p>
        </header>

        <div className="space-y-4">
          {STEPS.map((step) => (
            <section key={step.title} className="glass-card p-5 flex gap-4">
              <step.icon className="w-6 h-6 text-rose-gold shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold mb-1">{step.title}</h2>
                <p className="text-sm text-cream/65 leading-relaxed">{step.body}</p>
              </div>
            </section>
          ))}
        </div>

        <Link
          href="/trainer/dashboard"
          className="inline-flex items-center justify-center gap-2 min-h-14 px-8 rounded-full bg-rose-gold text-navy font-semibold"
        >
          Zur Team-Ampel
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
