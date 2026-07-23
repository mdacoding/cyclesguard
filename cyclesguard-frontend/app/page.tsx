import Link from 'next/link';
import { Shield, Activity, Lock } from 'lucide-react';

const PILOT_MAIL =
  'mailto:hello@cyclesguard.de' +
  '?subject=' +
  encodeURIComponent('CyclesGuard Soft-Pilot anfragen') +
  '&body=' +
  encodeURIComponent(
    [
      'Hallo CyclesGuard-Team,',
      '',
      'wir interessieren uns für einen kostenlosen Soft-Pilot (ca. 8–12 Wochen, 5–10 Freiwillige).',
      '',
      'Wichtig für uns: Trainer sehen nur Ampel-Signale — keine Zyklus-/Gesundheits-Rohdaten.',
      '',
      'Nächster Schritt: kurzer Call / Demo.',
      '',
      'Verein / Liga / Rolle:',
      'Name:',
    ].join('\n')
  );

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 70% 20%, rgba(232,196,184,0.14) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 15% 80%, rgba(123,158,135,0.12) 0%, transparent 50%),
            linear-gradient(160deg, #0A0F1E 0%, #14102A 45%, #0D1F2D 100%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E8C4B8' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6 max-w-6xl mx-auto animate-fadeIn">
        <span className="font-display text-xl font-semibold text-gradient">CyclesGuard</span>
        <nav className="flex items-center gap-2 sm:gap-3">
          <a
            href="/privacy"
            className="text-sm text-cream/70 hover:text-cream transition-colors min-h-11 px-2 sm:px-3 inline-flex items-center"
          >
            Datenschutz
          </a>
          <a
            href="/pilot"
            className="text-sm text-cream/70 hover:text-cream transition-colors min-h-11 px-2 sm:px-3 inline-flex items-center"
          >
            Soft-Pilot
          </a>
          <Link
            href="/login"
            className="text-sm text-rose-gold/90 hover:text-rose-gold transition-colors min-h-11 px-2 sm:px-3 inline-flex items-center"
          >
            Demo
          </Link>
        </nav>
      </header>

      <main className="relative z-10 px-6 md:px-10 pb-16 max-w-6xl mx-auto">
        <div className="flex flex-col justify-center min-h-[calc(100vh-5.5rem)]">
          <div className="max-w-2xl animate-slideUp">
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold text-gradient leading-[1.05] mb-6">
              CyclesGuard
            </h1>
            <p className="text-xl md:text-2xl text-cream/85 font-light leading-relaxed mb-4 max-w-xl">
              Privacy-first Readiness für Frauenfußball.
            </p>
            <p className="text-base md:text-lg text-cream/55 leading-relaxed mb-10 max-w-lg">
              Spielerinnen loggen privat. Trainer sehen nur Ampel — nie Rohdaten.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <a
                href={PILOT_MAIL}
                className="inline-flex items-center justify-center min-h-14 px-8 rounded-full bg-rose-gold text-navy font-semibold text-lg hover:bg-opacity-90 transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                Soft-Pilot anfragen
              </a>
              <Link
                href="/login"
                className="inline-flex items-center justify-center min-h-14 px-8 rounded-full border border-cream/20 text-cream/90 font-medium text-lg hover:bg-white/5 transition-colors"
              >
                Live-Demo öffnen
              </Link>
            </div>
            <p className="text-sm text-cream/45 mb-16 max-w-md">
              Kostenloser Soft-Pilot für jeden Verein · Art. 9 by Design · Antwort = nächster Schritt
            </p>
          </div>

          <section className="grid sm:grid-cols-3 gap-6 md:gap-8 border-t border-white/10 pt-10 animate-fadeIn">
            <div className="space-y-2">
              <Lock className="w-5 h-5 text-sage mb-3" />
              <h2 className="font-display text-lg font-semibold text-cream">Art. 9 by Design</h2>
              <p className="text-sm text-cream/50 leading-relaxed">
                RLS &amp; serverseitige Maskierung — Trainer sehen FIT / MODIFIED / REST, nichts Intimes.
              </p>
            </div>
            <div className="space-y-2">
              <Activity className="w-5 h-5 text-rose-gold mb-3" />
              <h2 className="font-display text-lg font-semibold text-cream">Ampel für die Kabine</h2>
              <p className="text-sm text-cream/50 leading-relaxed">
                Belastungssteuerung ohne medizinische Sprache — klar, schnell, DOSB-konform gedacht.
              </p>
            </div>
            <div className="space-y-2">
              <Shield className="w-5 h-5 text-cream/70 mb-3" />
              <h2 className="font-display text-lg font-semibold text-cream">Club-ready PWA</h2>
              <p className="text-sm text-cream/50 leading-relaxed">
                Offline-Logging, Push-Erinnerungen, Export &amp; Löschen — für den Alltag im Frauenfußball.
              </p>
            </div>
          </section>
        </div>

        <section className="mt-20 md:mt-28 border-t border-white/10 pt-14 max-w-2xl space-y-6 animate-fadeIn">
          <h2 className="font-display text-3xl font-semibold text-gradient">Für Vereine</h2>
          <p className="text-cream/65 leading-relaxed">
            Soft-Pilot in 48h startklar: Roster einladen, Ampel in der Kabine, Adherence &amp; Feedback
            für den Wochen-Call — ohne Stripe, ohne GPS-Zwang.
          </p>
          <ul className="space-y-3 text-sm text-cream/55">
            <li>
              <a href="/pilot" className="text-cream/85 hover:text-rose-gold underline-offset-2 hover:underline">
                Soft-Pilot Angebot
              </a>
              {' — '}8–12 Wochen, 5–10 Freiwillige
            </li>
            <li>
              <a href="/privacy" className="text-cream/85 hover:text-rose-gold underline-offset-2 hover:underline">
                Datenschutz 1-Pager
              </a>
              {' — '}auch unter{' '}
              <a href="/datenschutz" className="text-cream/70 hover:text-rose-gold underline-offset-2 hover:underline">
                /datenschutz
              </a>
            </li>
            <li>
              <Link href="/login" className="text-cream/85 hover:text-rose-gold underline-offset-2 hover:underline">
                Live-Demo
              </Link>
              {' — '}Trainer-Ampel &amp; Spielerinnen-Log in unter 5 Minuten
            </li>
          </ul>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-6 md:px-10 py-8 max-w-6xl mx-auto flex flex-wrap gap-4 text-xs text-cream/35">
        <a href="/privacy" className="hover:text-cream/60">
          Datenschutz
        </a>
        <a href="/datenschutz" className="hover:text-cream/60">
          /datenschutz
        </a>
        <a href="/pilot" className="hover:text-cream/60">
          Soft-Pilot
        </a>
        <a href="/impressum" className="hover:text-cream/60">
          Impressum
        </a>
        <a href="mailto:hello@cyclesguard.de" className="hover:text-cream/60">
          hello@cyclesguard.de
        </a>
      </footer>
    </div>
  );
}
