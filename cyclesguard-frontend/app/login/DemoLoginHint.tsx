'use client';

const DEMO_PASSWORD = 'CyclesGuard2026!';

const ACCOUNTS = [
  { label: 'Trainer', email: 'trainer@eintracht-demo.de' },
  { label: 'Spielerin (Live-Log)', email: 'lisa.weber@eintracht-demo.de' },
  { label: 'Spielerin (FIT)', email: 'anna.mueller@eintracht-demo.de' },
];

export default function DemoLoginHint() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return null;

  return (
    <div className="glass-card p-5 mb-6 border border-rose-gold/20 bg-rose-gold/5">
      <p className="text-xs uppercase tracking-wider text-rose-gold/80 mb-2">Pitch-Demo</p>
      <p className="text-sm text-cream/70 mb-3">
        Passwort für alle Demo-Accounts:{' '}
        <code className="text-cream/90 bg-white/5 px-1.5 py-0.5 rounded">{DEMO_PASSWORD}</code>
      </p>
      <ul className="space-y-2 text-sm">
        {ACCOUNTS.map((a) => (
          <li key={a.email} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-cream/60">{a.label}</span>
            <code className="text-cream/80 text-xs">{a.email}</code>
          </li>
        ))}
      </ul>
      <p className="text-xs text-cream/40 mt-4">Demo-Ablauf: siehe docs/pitch/DEMO-SCRIPT.md</p>
    </div>
  );
}
