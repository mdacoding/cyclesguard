'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { mapDbCycleLog } from '@/lib/cycle-log-mapper';
import { berlinDate } from '@/lib/date';
import { PHASE_DEFINITIONS } from '@/lib/cycle-phases';
import { SYMPTOM_OPTIONS } from '@/lib/symptoms';
import { computePlayerInsights } from '@/lib/player-insights';
import { CycleLog, CyclePhase } from '@/lib/types';
import PlayerInsightsCard from './components/PlayerInsightsCard';

function symptomLabel(key: string): string {
  return SYMPTOM_OPTIONS.find((s) => s.key === key)?.labelDE ?? key;
}

function buildDayKeys(days: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(berlinDate(d));
  }
  return keys;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<CycleLog[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('cycle_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(90);

      setLogs((data ?? []).map((row) => mapDbCycleLog(row as Record<string, unknown>)));
      setLoading(false);
    };
    void load();
  }, []);

  const dayKeys = useMemo(() => buildDayKeys(28), []);
  const byDay = useMemo(() => {
    const map = new Map<string, CycleLog>();
    for (const log of logs) {
      const key = berlinDate(log.loggedAt);
      if (!map.has(key)) map.set(key, log);
    }
    return map;
  }, [logs]);

  const insights = useMemo(() => computePlayerInsights(logs, 28), [logs]);
  const selectedLog = selectedDay ? byDay.get(selectedDay) ?? null : null;
  const todayKey = berlinDate();

  return (
    <div className="min-h-screen py-10 px-4 animate-fadeIn">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Link
            href="/player/dashboard"
            className="p-3 min-h-12 min-w-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-cream" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-semibold text-gradient">Verlauf</h1>
            <p className="text-cream/60 text-sm">28 Tage — nur für dich sichtbar.</p>
          </div>
        </header>

        {loading ? (
          <div className="glass-card p-10 text-center text-cream/60">Lade Verlauf…</div>
        ) : (
          <>
            <PlayerInsightsCard insights={insights} />

            <section className="glass-card p-5">
              <p className="text-sm text-cream/60 mb-4">
                {insights.loggedDays}/28 Tage geloggt
                {insights.streak > 0 ? ` · Streak ${insights.streak}` : ''}
              </p>
              <div className="grid grid-cols-7 gap-2 mb-3 text-center text-[11px] text-cream/40">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({
                  length: (new Date(dayKeys[0] + 'T12:00:00').getDay() + 6) % 7,
                }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {dayKeys.map((day) => {
                  const log = byDay.get(day);
                  const phase = log?.phase as CyclePhase | undefined;
                  const color = phase ? PHASE_DEFINITIONS[phase].color : undefined;
                  const isSelected = selectedDay === day;
                  const energy = log?.energyLevel;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`aspect-square min-h-11 rounded-xl text-xs font-medium border transition-all relative ${
                        isSelected
                          ? 'border-rose-gold scale-105'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      style={{
                        backgroundColor: color ? `${color}33` : 'rgba(255,255,255,0.04)',
                        color: color ?? 'rgba(245,240,232,0.5)',
                      }}
                      aria-label={`${day}${phase ? `, ${PHASE_DEFINITIONS[phase].labelDE}` : ''}${energy ? `, Energie ${energy}` : ''}`}
                    >
                      {Number(day.slice(-2))}
                      {energy != null && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className="w-1 h-1 rounded-full"
                              style={{
                                backgroundColor:
                                  i < energy ? 'rgba(232,196,184,0.95)' : 'rgba(255,255,255,0.15)',
                              }}
                            />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-5 text-xs text-cream/50">
                {(Object.keys(PHASE_DEFINITIONS) as CyclePhase[]).map((phase) => (
                  <span key={phase} className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PHASE_DEFINITIONS[phase].color }}
                    />
                    {PHASE_DEFINITIONS[phase].labelDE}
                  </span>
                ))}
              </div>
            </section>

            <section className="glass-card p-6 min-h-[160px]">
              {!selectedDay && (
                <p className="text-cream/50 text-sm text-center py-8">
                  Tippe auf einen Tag, um den Eintrag zu sehen.
                </p>
              )}
              {selectedDay && !selectedLog && (
                <p className="text-cream/50 text-sm text-center py-8">
                  Kein Eintrag am {new Date(selectedDay + 'T12:00:00').toLocaleDateString('de-DE')}.
                </p>
              )}
              {selectedLog && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2
                      className="font-semibold text-lg"
                      style={{ color: PHASE_DEFINITIONS[selectedLog.phase].color }}
                    >
                      {PHASE_DEFINITIONS[selectedLog.phase].emoji}{' '}
                      {PHASE_DEFINITIONS[selectedLog.phase].labelDE}
                    </h2>
                    <time className="text-xs text-cream/50">
                      {new Date(selectedLog.loggedAt).toLocaleDateString('de-DE')}
                    </time>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-cream/60">Energie</span>
                    <div className="flex gap-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-3 h-3 rounded-full border ${
                            (selectedLog.energyLevel ?? 0) > i
                              ? 'bg-rose-gold border-rose-gold'
                              : 'border-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {selectedLog.symptoms.length > 0 && (
                    <p className="text-sm text-cream/60">
                      {selectedLog.symptoms.map(symptomLabel).join(' · ')}
                    </p>
                  )}
                  {selectedLog.notes && (
                    <p className="text-sm text-cream/80 border-t border-white/10 pt-3">
                      {selectedLog.notes}
                    </p>
                  )}
                  {selectedDay === todayKey && (
                    <Link
                      href="/player/dashboard"
                      className="inline-flex min-h-11 items-center text-sm text-rose-gold hover:underline"
                    >
                      Heutigen Eintrag anpassen →
                    </Link>
                  )}
                </div>
              )}
              {selectedDay && !selectedLog && selectedDay === todayKey && (
                <div className="text-center">
                  <Link
                    href="/player/dashboard"
                    className="inline-flex min-h-12 items-center px-6 py-3 rounded-full bg-rose-gold text-navy font-semibold text-sm"
                  >
                    Heute eintragen
                  </Link>
                </div>
              )}
            </section>

            {logs.length === 0 && (
              <div className="text-center">
                <Link
                  href="/player/dashboard"
                  className="inline-flex min-h-12 items-center px-6 py-3 rounded-full bg-rose-gold text-navy font-semibold text-sm"
                >
                  Ersten Eintrag machen
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
