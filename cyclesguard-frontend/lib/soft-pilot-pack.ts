/** Soft-Pilot WhatsApp / clipboard packs — coach-safe, no Art.-9 fields. */

const APP_ORIGIN = 'https://cyclesguard.vercel.app';

export function buildPlayerSharePack(opts?: { origin?: string }): string {
  const origin = opts?.origin ?? APP_ORIGIN;
  return [
    'CyclesGuard Soft-Pilot — für Spielerinnen',
    '',
    'Kurz: Readiness in unter 30 Sekunden loggen.',
    'Dein Trainer sieht nur die Ampel (Einsatzbereit / Angepasst / Regeneration) — nie Phase, Details oder Notizen.',
    '',
    `Info: ${origin}/spielerinnen-info`,
    `Login: ${origin}/login`,
    `Privacy: ${origin}/privacy`,
    '',
    'Tipp: App zum Homescreen hinzufügen für tägliche Erinnerung.',
  ].join('\n');
}

export function buildStaffSharePack(opts?: { origin?: string; clubLabel?: string }): string {
  const origin = opts?.origin ?? APP_ORIGIN;
  const club = opts?.clubLabel ? ` · ${opts.clubLabel}` : '';
  return [
    `CyclesGuard Soft-Pilot — Stab / Athletik${club}`,
    '',
    'Kabine: Ampel steuern, Einheitsblatt teilen, fehlende Logs erinnern.',
    'KPI Soft-Pilot: Adherence ≥70% · Trainer öffnet Kabine ≥3×/Woche · Feedback ≥4.',
    '',
    `Kabine: ${origin}/trainer/dashboard`,
    `Onboarding: ${origin}/trainer/onboarding`,
    `Pilot-Info: ${origin}/pilot`,
    `Privacy / Trust: ${origin}/privacy`,
    `Spielerinnen-Info zum Teilen: ${origin}/spielerinnen-info`,
    '',
    'Support: hello@cyclesguard.de',
  ].join('\n');
}

export function buildInvitePendingPack(opts: {
  names: string[];
  origin?: string;
}): string {
  const origin = opts.origin ?? APP_ORIGIN;
  const list =
    opts.names.length === 0
      ? '(keine offenen Einladungen)'
      : opts.names.map((n) => `· ${n}`).join('\n');
  return [
    'CyclesGuard — offene Einladungen',
    '',
    'Bitte Passwort setzen und einmal einloggen:',
    list,
    '',
    `Login: ${origin}/login`,
    `Was der Trainer sieht: ${origin}/spielerinnen-info`,
    '',
    'Nur Namen — keine Gesundheitsdaten.',
  ].join('\n');
}
