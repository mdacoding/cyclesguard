import { z } from 'zod';

/**
 * Roster CSV importer (athlete onboarding) — parses first_name, last_name, email,
 * jersey_number (optional), position (optional). Coach-safe: no health data columns
 * exist in this schema, so there is nothing to mask here.
 */

export const ROSTER_CSV_MAX_ROWS = 200;

const KNOWN_HEADERS = ['first_name', 'last_name', 'email', 'jersey_number', 'position'] as const;
type KnownHeader = (typeof KNOWN_HEADERS)[number];

const RosterRowSchema = z.object({
  firstName: z.string().trim().min(1, 'Vorname fehlt').max(60),
  lastName: z.string().trim().min(1, 'Nachname fehlt').max(60),
  email: z.string().trim().toLowerCase().email('Ungültige E-Mail'),
  jerseyNumber: z
    .number()
    .int('Trikotnummer muss ganzzahlig sein')
    .min(0, 'Trikotnummer muss ≥ 0 sein')
    .max(199, 'Trikotnummer muss ≤ 199 sein')
    .nullable(),
  position: z.string().trim().max(40, 'Position max. 40 Zeichen').nullable(),
});

export type RosterCsvRow = z.infer<typeof RosterRowSchema> & {
  line: number;
  fullName: string;
};

export interface RosterCsvInvalidRow {
  line: number;
  raw: string;
  errors: string[];
}

export interface RosterCsvParseResult {
  rows: RosterCsvRow[];
  invalidRows: RosterCsvInvalidRow[];
  headerDetected: boolean;
  truncated: boolean;
}

function splitCsvLine(line: string): string[] {
  return line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
}

function detectHeaderMap(cells: string[]): Map<KnownHeader, number> | null {
  const map = new Map<KnownHeader, number>();
  cells.forEach((cell, idx) => {
    const norm = cell.trim().toLowerCase().replace(/\s+/g, '_');
    if ((KNOWN_HEADERS as readonly string[]).includes(norm)) {
      map.set(norm as KnownHeader, idx);
    }
  });
  // Require at minimum email + one of first/last name to treat as a real header row.
  return map.has('email') && (map.has('first_name') || map.has('last_name')) ? map : null;
}

/** Parses roster CSV text into valid/invalid rows with per-row Zod errors + duplicate-email detection. */
export function parseRosterCsv(text: string): RosterCsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], invalidRows: [], headerDetected: false, truncated: false };
  }

  const firstCells = splitCsvLine(lines[0]);
  const headerMap = detectHeaderMap(firstCells);
  const headerDetected = headerMap !== null;
  const columnMap: Map<KnownHeader, number> =
    headerMap ??
    new Map<KnownHeader, number>([
      ['first_name', 0],
      ['last_name', 1],
      ['email', 2],
      ['jersey_number', 3],
      ['position', 4],
    ]);

  const dataLines = headerDetected ? lines.slice(1) : lines;
  const truncated = dataLines.length > ROSTER_CSV_MAX_ROWS;
  const slice = dataLines.slice(0, ROSTER_CSV_MAX_ROWS);

  const rows: RosterCsvRow[] = [];
  const invalidRows: RosterCsvInvalidRow[] = [];
  const seenEmails = new Set<string>();

  slice.forEach((raw, idx) => {
    const lineNo = idx + (headerDetected ? 2 : 1);
    const cells = splitCsvLine(raw);
    const get = (key: KnownHeader) => {
      const i = columnMap.get(key);
      return i === undefined ? undefined : cells[i];
    };

    const jerseyRaw = get('jersey_number')?.trim();
    if (jerseyRaw && Number.isNaN(Number(jerseyRaw))) {
      invalidRows.push({
        line: lineNo,
        raw,
        errors: [`Trikotnummer „${jerseyRaw}“ ist keine Zahl`],
      });
      return;
    }
    const jerseyNumber = jerseyRaw ? Number(jerseyRaw) : null;
    const positionRaw = get('position')?.trim();

    const candidate = {
      firstName: get('first_name') ?? '',
      lastName: get('last_name') ?? '',
      email: (get('email') ?? '').toLowerCase(),
      jerseyNumber,
      position: positionRaw ? positionRaw : null,
    };

    const parsed = RosterRowSchema.safeParse(candidate);
    if (!parsed.success) {
      invalidRows.push({
        line: lineNo,
        raw,
        errors: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const emailKey = parsed.data.email;
    if (seenEmails.has(emailKey)) {
      invalidRows.push({
        line: lineNo,
        raw,
        errors: [`Doppelte E-Mail „${emailKey}“ — bereits weiter oben in der CSV`],
      });
      return;
    }
    seenEmails.add(emailKey);

    rows.push({
      ...parsed.data,
      line: lineNo,
      fullName: `${parsed.data.firstName} ${parsed.data.lastName}`.trim(),
    });
  });

  return { rows, invalidRows, headerDetected, truncated };
}
