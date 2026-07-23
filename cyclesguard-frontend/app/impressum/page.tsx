import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum — CyclesGuard',
  description: 'Anbieterkennzeichnung CyclesGuard.',
};

export default function ImpressumPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: 'linear-gradient(160deg, #0A0F1E 0%, #14102A 50%, #0D1F2D 100%)',
        }}
      />
      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6 max-w-3xl mx-auto">
        <Link href="/" className="font-display text-xl font-semibold text-gradient">
          CyclesGuard
        </Link>
        <nav className="flex gap-3 text-sm">
          <a href="/privacy" className="text-cream/70 hover:text-cream min-h-11 px-2 inline-flex items-center">
            Datenschutz
          </a>
          <Link href="/login" className="text-cream/70 hover:text-cream min-h-11 px-2 inline-flex items-center">
            Anmelden
          </Link>
        </nav>
      </header>

      <article className="relative z-10 max-w-3xl mx-auto px-6 md:px-10 pb-20 pt-4 space-y-8 animate-fadeIn">
        <h1 className="font-display text-4xl font-semibold text-gradient">Impressum</h1>
        <p className="text-sm text-cream/50">
          Angaben gemäß § 5 TMG / Anbieterkennzeichnung. Platzhalter bis Rechtsträger final eingetragen.
        </p>

        <section className="space-y-2 text-sm text-cream/75 leading-relaxed">
          <h2 className="font-semibold text-cream text-base">Diensteanbieter</h2>
          <p>
            CyclesGuard
            <br />
            [Vor- und Nachname / Firma]
            <br />
            [Straße, PLZ Ort]
            <br />
            Deutschland
          </p>
        </section>

        <section className="space-y-2 text-sm text-cream/75 leading-relaxed">
          <h2 className="font-semibold text-cream text-base">Kontakt</h2>
          <p>
            E-Mail:{' '}
            <a href="mailto:hello@cyclesguard.de" className="text-rose-gold hover:underline">
              hello@cyclesguard.de
            </a>
            <br />
            Web:{' '}
            <a href="https://cyclesguard.vercel.app" className="text-rose-gold hover:underline">
              cyclesguard.vercel.app
            </a>
          </p>
        </section>

        <section className="space-y-2 text-sm text-cream/75 leading-relaxed">
          <h2 className="font-semibold text-cream text-base">Verantwortlich für den Inhalt</h2>
          <p>[Name], Anschrift wie oben</p>
        </section>

        <section className="space-y-2 text-sm text-cream/55 leading-relaxed">
          <h2 className="font-semibold text-cream text-base">Hinweis Soft-Pilot</h2>
          <p>
            CyclesGuard befindet sich im Soft-Pilot / Early-Access. Produktinformationen unter{' '}
            <a href="/pilot" className="text-cream/80 hover:text-rose-gold underline-offset-2 hover:underline">
              /pilot
            </a>
            · Datenschutz unter{' '}
            <a href="/privacy" className="text-cream/80 hover:text-rose-gold underline-offset-2 hover:underline">
              /privacy
            </a>
            .
          </p>
        </section>

        <p className="text-xs text-cream/35">
          Founder: Platzhalter in eckigen Klammern vor öffentlichem Club-Pitch mit Echtdaten ersetzen.
        </p>
      </article>
    </div>
  );
}
