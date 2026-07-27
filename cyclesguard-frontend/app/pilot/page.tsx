import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Soft-Pilot Angebot — CyclesGuard',
  description:
    '8–12 Wochen kostenloser Soft-Pilot für Frauenfußball-Vereine: Ampel für Athletik, Privacy by Design, 5–10 Freiwillige.',
};

const PILOT_MAIL =
  'mailto:cyclesguard@proton.me' +
  '?subject=' +
  encodeURIComponent('CyclesGuard Soft-Pilot anfragen') +
  '&body=' +
  encodeURIComponent(
    [
      'Hallo CyclesGuard-Team,',
      '',
      'wir interessieren uns für einen kostenlosen Soft-Pilot (ca. 8–12 Wochen, 5–10 Freiwillige).',
      '',
      'Verein / Liga:',
      'Rolle (Athletik / Medizin / Admin):',
      'Name:',
      'Bevorzugter Terminrahmen:',
      '',
      'Demo angesehen: https://cyclesguard.vercel.app',
    ].join('\n')
  );

export default function PilotOfferPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 20% 0%, rgba(232,196,184,0.12) 0%, transparent 50%),
            linear-gradient(160deg, #0A0F1E 0%, #14102A 50%, #0D1F2D 100%)
          `,
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6 max-w-3xl mx-auto print:hidden">
        <Link href="/" className="font-display text-xl font-semibold text-gradient">
          CyclesGuard
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <a href="/privacy" className="text-cream/70 hover:text-cream min-h-11 px-2 inline-flex items-center">
            Datenschutz
          </a>
          <Link href="/login" className="text-cream/70 hover:text-cream min-h-11 px-2 inline-flex items-center">
            Demo-Login
          </Link>
        </nav>
      </header>

      <article className="relative z-10 max-w-3xl mx-auto px-6 md:px-10 pb-20 pt-4 space-y-10 animate-fadeIn">
        <header className="space-y-3">
          <p className="text-sm text-rose-gold/90">Für Athletik · Sportmedizin · Club-Admin</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-gradient leading-tight">
            Soft-Pilot Angebot
          </h1>
          <p className="text-cream/70 text-lg leading-relaxed max-w-xl">
            8–12 Wochen kostenlos testen, ob die Kabinen-Ampel im Alltag hilft — ohne dass
            Spielerinnen Intimdaten preisgeben.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Was ihr bekommt</h2>
          <ul className="space-y-2 text-sm text-cream/70 leading-relaxed list-disc pl-5">
            <li>Gehostete App (Spielerinnen-PWA + Trainer-Kabine + Club-Admin) · EU</li>
            <li>Onboarding DE · Invite per E-Mail · Passwort setzen · Consent</li>
            <li>Support werktags · wöchentlicher 20-Min-Feedback-Call</li>
            <li>Datenschutz-1-Pager für euren DSB · AVV-Entwurf vor Echtdaten</li>
            <li>Roadmap-Einfluss aus eurem Feedback</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Was wir brauchen</h2>
          <ul className="space-y-2 text-sm text-cream/70 leading-relaxed list-disc pl-5">
            <li>5–10 freiwillige Spielerinnen</li>
            <li>
              Schriftliche Info + Einwilligung — Vorlage:{' '}
              <a href="/spielerinnen-info" className="text-rose-gold hover:underline">
                /spielerinnen-info
              </a>
            </li>
            <li>1 feste Ansprechperson (Athletik oder Medizin)</li>
            <li>Ehrliches Feedback — was hilft / was stört</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Erfolg nach 8 Wochen (Beispiele)</h2>
          <ul className="space-y-2 text-sm text-cream/70 leading-relaxed list-disc pl-5">
            <li>≥70 % der Freiwilligen mit ≥1 Log / Woche</li>
            <li>Athletik öffnet die Ampel ≥3× / Trainingswoche</li>
            <li>Kein Vorfall „Trainer hat Rohdaten gesehen“</li>
            <li>Weiterempfehlung ≥4/5</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Nicht im Soft-Pilot</h2>
          <p className="text-sm text-cream/60 leading-relaxed">
            Keine Abrechnungspflicht, kein Live-GPS (optional später), keine medizinische Diagnostik.
            Paid Season erst nach erfolgreichem Pilot — manuell, ohne Self-Serve-Zwang.
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold">15-Minuten Demo</h2>
          <ol className="space-y-2 text-sm text-cream/70 list-decimal pl-5 leading-relaxed">
            <li>
              Live:{' '}
              <a href="https://cyclesguard.vercel.app" className="text-rose-gold hover:underline">
                cyclesguard.vercel.app
              </a>
            </li>
            <li>Login → Pitch-Demo-Accounts (wenn Demo-Mode an) oder eure Invites</li>
            <li>
              Privacy-1-Pager:{' '}
              <a href="/privacy" className="text-rose-gold hover:underline">
                /privacy
              </a>
            </li>
          </ol>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
          <a
            href={PILOT_MAIL}
            className="inline-flex items-center justify-center min-h-14 px-8 rounded-full bg-rose-gold text-navy font-semibold text-lg"
          >
            Soft-Pilot anfragen
          </a>
          <a
            href="/privacy"
            className="inline-flex items-center justify-center min-h-14 px-8 rounded-full border border-cream/20 text-cream/90"
          >
            Datenschutz lesen
          </a>
        </div>
        <p className="text-xs text-cream/40">Antwort = nächster Schritt · cyclesguard@proton.me</p>
      </article>
    </div>
  );
}
