export function berlinDate(iso: string | Date = new Date()): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
}

export function isSameBerlinDay(a: string | Date, b: string | Date = new Date()): boolean {
  return berlinDate(a) === berlinDate(b);
}
