'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Upload, XCircle } from 'lucide-react';
import { parseRosterCsv, type RosterCsvInvalidRow, type RosterCsvRow } from '@/lib/roster-csv';

interface RosterCsvImporterProps {
  teamId: string;
  onImported?: () => void | Promise<void>;
}

type RowOutcome = 'pending' | 'ok' | 'failed';

/**
 * Interactive CSV roster importer with a valid/invalid preview table and live
 * "X / Y invited" progress. Coach-safe: the schema has no health-data columns.
 */
export default function RosterCsvImporter({ teamId, onImported }: RosterCsvImporterProps) {
  const [rawText, setRawText] = useState('');
  const [validRows, setValidRows] = useState<RosterCsvRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<RosterCsvInvalidRow[]>([]);
  const [headerDetected, setHeaderDetected] = useState(true);
  const [truncated, setTruncated] = useState(false);
  const [parsed, setParsed] = useState(false);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [outcomes, setOutcomes] = useState<Record<number, { status: RowOutcome; message?: string }>>(
    {}
  );
  const [summary, setSummary] = useState<string | null>(null);

  const runParse = (text: string) => {
    setRawText(text);
    const result = parseRosterCsv(text);
    setValidRows(result.rows);
    setInvalidRows(result.invalidRows);
    setHeaderDetected(result.headerDetected);
    setTruncated(result.truncated);
    setParsed(text.trim().length > 0);
    setOutcomes({});
    setSummary(null);
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    runParse(text);
  };

  const startImport = async () => {
    if (validRows.length === 0 || !teamId) return;
    setImporting(true);
    setSummary(null);
    setProgress({ done: 0, total: validRows.length });
    const nextOutcomes: Record<number, { status: RowOutcome; message?: string }> = {};
    let ok = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const res = await fetch('/api/admin/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: row.email,
            teamId,
            fullName: row.fullName,
            role: 'player',
            jerseyNumber: row.jerseyNumber,
            position: row.position,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
        if (res.ok) {
          ok += 1;
          nextOutcomes[row.line] = { status: 'ok', message: data.message ?? 'OK' };
        } else {
          nextOutcomes[row.line] = { status: 'failed', message: data.error ?? `Fehler ${res.status}` };
        }
      } catch {
        nextOutcomes[row.line] = { status: 'failed', message: 'Netzwerkfehler' };
      }
      setOutcomes({ ...nextOutcomes });
      setProgress({ done: i + 1, total: validRows.length });
    }

    setImporting(false);
    setSummary(`${ok} / ${validRows.length} eingeladen`);
    if (ok > 0 && onImported) await onImported();
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={importing}
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-cream/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-rose-gold file:text-navy file:font-medium"
          />
          <p className="text-xs text-cream/40">
            Spalten: <code>first_name,last_name,email,jersey_number,position</code> · jersey_number
            & position optional. Ohne Header wird diese Reihenfolge angenommen.
          </p>
        </div>
        <textarea
          value={rawText}
          onChange={(e) => runParse(e.target.value)}
          disabled={importing}
          placeholder={'first_name,last_name,email,jersey_number,position\nAnna,Müller,anna@verein.de,7,Stürmerin'}
          rows={4}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-cream/80"
        />
      </div>

      {parsed && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-cream/50">
            <span>{headerDetected ? 'Header erkannt' : 'Keine Header-Zeile — positionell gelesen'}</span>
            <span className="text-sage">{validRows.length} gültig</span>
            {invalidRows.length > 0 && (
              <span className="text-menstrual">{invalidRows.length} ungültig</span>
            )}
            {truncated && (
              <span className="text-rose-gold">Nur die ersten 200 Zeilen werden importiert</span>
            )}
          </div>

          {(validRows.length > 0 || invalidRows.length > 0) && (
            <div className="max-h-64 overflow-y-auto rounded-xl border border-white/10">
              <table className="w-full text-xs">
                <thead className="bg-white/5 text-cream/50">
                  <tr>
                    <th className="text-left px-3 py-2">Zeile</th>
                    <th className="text-left px-3 py-2">Name / E-Mail</th>
                    <th className="text-left px-3 py-2">Trikot</th>
                    <th className="text-left px-3 py-2">Position</th>
                    <th className="text-left px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {validRows.map((row) => {
                    const outcome = outcomes[row.line];
                    return (
                      <tr key={`v-${row.line}`} className="border-t border-white/5">
                        <td className="px-3 py-2 text-cream/40">{row.line}</td>
                        <td className="px-3 py-2 text-cream/80">
                          {row.fullName}
                          <br />
                          <span className="text-cream/40">{row.email}</span>
                        </td>
                        <td className="px-3 py-2 text-cream/60">{row.jerseyNumber ?? '—'}</td>
                        <td className="px-3 py-2 text-cream/60">{row.position ?? '—'}</td>
                        <td className="px-3 py-2">
                          {!outcome && (
                            <span className="text-sage inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              bereit
                            </span>
                          )}
                          {outcome?.status === 'ok' && (
                            <span className="text-sage inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              eingeladen
                            </span>
                          )}
                          {outcome?.status === 'failed' && (
                            <span className="text-menstrual inline-flex items-center gap-1" title={outcome.message}>
                              <XCircle className="w-3.5 h-3.5" />
                              {outcome.message ?? 'Fehler'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {invalidRows.map((row) => (
                    <tr key={`i-${row.line}`} className="border-t border-white/5 bg-menstrual/5">
                      <td className="px-3 py-2 text-cream/40">{row.line}</td>
                      <td className="px-3 py-2 text-cream/50 font-mono">{row.raw}</td>
                      <td className="px-3 py-2" colSpan={2} />
                      <td className="px-3 py-2 text-menstrual">
                        <span className="inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          {row.errors.join(' · ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void startImport()}
              disabled={importing || validRows.length === 0}
              className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-rose-gold text-navy font-medium text-sm disabled:opacity-40"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing
                ? `Importiere ${progress.done}/${progress.total}…`
                : `${validRows.length} Spielerin(nen) importieren`}
            </button>
            {summary && <p className="text-sm text-sage">{summary}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
