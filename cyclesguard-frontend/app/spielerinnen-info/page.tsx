import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spielerinnen-Info & Einwilligung — CyclesGuard',
  description:
    'Kurzinfo und Einwilligungsvorlage für Soft-Pilot-Teilnehmerinnen (Art. 9 DSGVO).',
};

export default function SpielerinnenInfoPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: 'linear-gradient(160deg, #0A0F1E 0%, #14102A 50%, #0D1F2D 100%)',
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6 max-w-3xl mx-auto print:hidden">
        <Link href="/" className="font-display text-xl font-semibold text-gradient">
          CyclesGuard
        </Link>
        <nav className="flex gap-3 text-sm">
          <a href="/privacy" className="text-cream/70 hover:text-cream min-h-11 px-2 inline-flex items-center">
            Datenschutz
          </a>
          <a href="/pilot" className="text-cream/70 hover:text-cream min-h-11 px-2 inline-flex items-center">
            Soft-Pilot
          </a>
          <span className="text-cream/40 text-xs hidden sm:inline self-center">Ctrl/Cmd+P → PDF</span>
        </nav>
      </header>

      <article className="relative z-10 max-w-3xl mx-auto px-6 md:px-10 pb-20 pt-4 space-y-10 animate-fadeIn print:pt-0">
        <header className="space-y-3">
          <p className="text-sm text-sage">Vorlage für Vereine · Soft-Pilot</p>
          <h1 className="font-display text-4xl font-semibold text-gradient leading-tight">
            Spielerinnen-Info &amp; Einwilligung
          </h1>
          <p className="text-cream/60 text-sm">
            Keine Rechtsberatung · Abstimmung mit Vereins-DSB empfohlen ·{' '}
            <a href="/privacy" className="text-cream/80 underline-offset-2 hover:underline">
              /privacy
            </a>
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Kurz erklärt</h2>
          <p className="text-cream/70 leading-relaxed text-sm">
            CyclesGuard hilft Athletik, Belastung besser zu steuern. Du loggst freiwillig, wie du dich
            fühlst. Deine Trainer:innen sehen <strong className="text-cream">nur eine Ampel</strong>{' '}
            (FIT / angepasst / Pause / keine Daten) — nie Zyklusphase, Symptome oder Notizen.
          </p>
          <ul className="space-y-2 text-sm text-cream/70 list-disc pl-5 leading-relaxed">
            <li>Dauer: 8–12 Wochen, kostenlos</li>
            <li>Freiwillig — Widerruf jederzeit (Konto löschen in den Einstellungen)</li>
            <li>Hosting: EU (Supabase Frankfurt, Vercel EU)</li>
            <li>Support: hello@cyclesguard.de</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Was gespeichert wird</h2>
          <p className="text-sm text-cream/70 leading-relaxed">
            E-Mail, Name, Einwilligungszeitpunkt, Readiness-Logs (nur für dich), optional Push-Gerät.
            Trainer:innen sehen Ampel + Empfehlungstext ohne Intimdaten.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 print:border-black/20 print:bg-transparent">
          <h2 className="font-display text-xl font-semibold">Einwilligung</h2>
          <p className="text-sm text-cream/65 leading-relaxed">
            Vorname / Name: _______________________________
            <br />
            Team / Verein: ________________________________
            <br />
            Datum: ______________
          </p>
          <ul className="space-y-2 text-sm text-cream/70 list-none leading-relaxed">
            <li>☐ Ich willige freiwillig in die Verarbeitung meiner Gesundheitsdaten (Art. 9 DSGVO) für den Soft-Pilot ein.</li>
            <li>☐ Ich weiß, dass Trainer:innen keine Roh-Zyklusdaten sehen.</li>
            <li>☐ Ich kann die Einwilligung jederzeit widerrufen (Kontolöschung).</li>
            <li>☐ Ich bin mindestens 16 Jahre alt (bzw. Erziehungsberechtigte haben zugestimmt).</li>
          </ul>
          <p className="text-sm text-cream/65 pt-2">
            Unterschrift Spielerin: _________________________
            <br />
            Unterschrift Verein (Kenntnis): _________________
          </p>
        </section>

        <p className="text-xs text-cream/40 leading-relaxed">
          Vollständige Vorlage im Repo: docs/pitch/SPIELERINNEN-INFO.md
        </p>

        <div className="flex flex-wrap gap-3 print:hidden">
          <a
            href="/pilot"
            className="inline-flex items-center justify-center min-h-12 px-6 rounded-full bg-rose-gold text-navy font-semibold"
          >
            Soft-Pilot Angebot
          </a>
          <a
            href="/privacy"
            className="inline-flex items-center justify-center min-h-12 px-6 rounded-full border border-cream/20 text-cream/90"
          >
            Datenschutz
          </a>
        </div>
      </article>
    </div>
  );
}
