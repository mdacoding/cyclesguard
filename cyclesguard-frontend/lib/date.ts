export function berlinDate(iso: string | Date = new Date()): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
}

export function isSameBerlinDay(a: string | Date, b: string | Date = new Date()): boolean {
  return berlinDate(a) === berlinDate(b);
}

/** Approximate UTC instant for start of a Berlin calendar day (YYYY-MM-DD). */
export function startOfBerlinDayUtc(day: string = berlinDate()): Date {
  for (let h = 0; h < 48; h++) {
    const candidate = new Date(`${day}T${String(Math.floor(h / 2)).padStart(2, '0')}:${h % 2 === 0 ? '00' : '30'}:00.000Z`);
    if (berlinDate(candidate) === day && berlinDate(new Date(candidate.getTime() - 60_000)) !== day) {
      return candidate;
    }
  }
  return new Date(`${day}T00:00:00.000Z`);
}

/** Berlin weekday: 0 = Sunday … 6 = Saturday (Date.getDay semantics). */
export function berlinWeekday(iso: string | Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    weekday: 'short',
  }).formatToParts(new Date(iso));
  const wd = parts.find((p) => p.type === 'weekday')?.value;
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd ?? ''] ?? new Date(iso).getDay();
}
