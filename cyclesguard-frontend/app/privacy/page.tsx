import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutz & DOSB — CyclesGuard',
  description:
    'Privacy-first Readiness für Frauenfußball: Trainer sehen nur Ampel-Signale, nie Zyklus-Rohdaten. Art. 9 DSGVO, EU-Hosting.',
};

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 80% 10%, rgba(123,158,135,0.12) 0%, transparent 50%),
            linear-gradient(160deg, #0A0F1E 0%, #14102A 50%, #0D1F2D 100%)
          `,
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6 max-w-3xl mx-auto print:hidden">
        <Link href="/" className="font-display text-xl font-semibold text-gradient">
          CyclesGuard
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <a href="/pilot" className="text-cream/70 hover:text-cream min-h-11 px-2 inline-flex items-center">
            Soft-Pilot
          </a>
          <Link href="/login" className="text-cream/70 hover:text-cream min-h-11 px-2 inline-flex items-center">
            Anmelden
          </Link>
          <span className="text-cream/40 text-xs hidden sm:inline">Ctrl/Cmd+P → PDF</span>
        </nav>
      </header>

      <article className="relative z-10 max-w-3xl mx-auto px-6 md:px-10 pb-20 pt-4 space-y-10 animate-fadeIn print:pt-0">
        <header className="space-y-3">
          <p className="text-sm text-sage">1-Pager für Athletik · Medizin · DSB</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-gradient leading-tight">
            Datenschutz &amp; DOSB
          </h1>
          <p className="text-cream/60 text-sm">
            Stand Soft-Pilot ·{' '}
            <a href="https://cyclesguard.vercel.app" className="text-cream/80 underline-offset-2 hover:underline">
              cyclesguard.vercel.app
            </a>
            {' · '}
            <a href="mailto:cyclesguard@proton.me" className="text-cream/80 underline-offset-2 hover:underline">
              cyclesguard@proton.me
            </a>
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Was ist CyclesGuard?</h2>
          <p className="text-cream/70 leading-relaxed">
            Eine privacy-first Web-App für Spielerinnen im Leistungssport: freiwillige Tages-Rückmeldung —
            übersetzt in trainingsrelevante Ampel-Signale für Athletik. Keine medizinische Diagnostik.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold">Kernversprechen</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-cream/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Wer</th>
                  <th className="px-4 py-3 font-medium">Sieht was</th>
                </tr>
              </thead>
              <tbody className="text-cream/75 divide-y divide-white/10">
                <tr>
                  <td className="px-4 py-3 font-medium text-cream">Spielerin</td>
                  <td className="px-4 py-3">Eigene Logs, Historie, Export, Löschung</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-cream">Trainer</td>
                  <td className="px-4 py-3">
                    Nur Ampel: Einsatzbereit · Angepasst · Regeneration · Keine Daten
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-cream">Club-Admin</td>
                  <td className="px-4 py-3">Roster &amp; Adherence — keine Gesundheits-Rohdaten</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-cream/55 leading-relaxed">
            Trainer haben auf Datenbankebene keinen Zugriff auf Zyklus-Rohdaten (PostgreSQL RLS).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">DSGVO</h2>
          <ul className="space-y-2 text-cream/70 text-sm leading-relaxed list-disc pl-5">
            <li>
              <strong className="text-cream">Art. 9:</strong> explizite Einwilligung vor Nutzung
            </li>
            <li>
              <strong className="text-cream">Art. 15 / 20:</strong> Datenexport in den Einstellungen
            </li>
            <li>
              <strong className="text-cream">Art. 17:</strong> Account-Löschung inkl. verknüpfter Logs
            </li>
            <li>
              <strong className="text-cream">Zweckbindung:</strong> Readiness für Training — kein Marketing-Verkauf
            </li>
            <li>
              <strong className="text-cream">Hosting:</strong> EU (Supabase Frankfurt, Vercel EU)
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">DOSB / Sportpraxis</h2>
          <ul className="space-y-2 text-cream/70 text-sm leading-relaxed list-disc pl-5">
            <li>Keine Diagnose — aggregierte Trainingshinweise</li>
            <li>Keine Pflicht zur Offenlegung gegenüber Trainer</li>
            <li>NO_DATA statt Raten, wenn keine aktuelle Meldung (&gt;48h → veraltet)</li>
            <li>Empfehlungen sportlich formuliert (Belastung, Plyometrie, Regeneration)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold">Soft-Pilot mit eurem Verein</h2>
          <p className="text-cream/70 text-sm leading-relaxed">
            8–12 Wochen kostenlos, 5–10 Freiwillige, wöchentliches Feedback. AVV/TOM vor Echtdaten —
            Entwurf liegt bereit. Details:{' '}
            <a href="/pilot" className="text-rose-gold hover:underline underline-offset-2">
              Soft-Pilot Angebot
            </a>
            · Einwilligungs-Vorlage:{' '}
            <a href="/spielerinnen-info" className="text-rose-gold hover:underline underline-offset-2">
              /spielerinnen-info
            </a>
            .
          </p>
        </section>

        <p className="text-xs text-cream/40 leading-relaxed print:text-black/60">
          Ersetzt keine Rechtsberatung. Abstimmung mit dem Datenschutzbeauftragten des Vereins empfohlen.
        </p>

        <div className="flex flex-wrap gap-3 print:hidden pt-4">
          <a
            href="/pilot"
            className="inline-flex items-center justify-center min-h-12 px-6 rounded-full bg-rose-gold text-navy font-semibold"
          >
            Soft-Pilot ansehen
          </a>
          <a
            href="/spielerinnen-info"
            className="inline-flex items-center justify-center min-h-12 px-6 rounded-full border border-cream/20 text-cream/90"
          >
            Spielerinnen-Vorlage
          </a>
          <a
            href="mailto:cyclesguard@proton.me?subject=CyclesGuard%20Datenschutz%20/%20DSB"
            className="inline-flex items-center justify-center min-h-12 px-6 rounded-full border border-cream/20 text-cream/90"
          >
            DSB kontaktieren
          </a>
        </div>
      </article>
    </div>
  );
}
