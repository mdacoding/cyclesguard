'use client';

import { CyclePhase } from '@/lib/types';
import { PHASE_DEFINITIONS } from '@/lib/cycle-phases';
import type { PlayerInsights } from '@/lib/player-insights';
import { Sparkles } from 'lucide-react';

export default function PlayerInsightsCard({ insights }: { insights: PlayerInsights }) {
  const phases = Object.keys(PHASE_DEFINITIONS) as CyclePhase[];
  const hasEnergy = phases.some((p) => insights.avgEnergyByPhase[p] != null);

  if (insights.loggedDays === 0) return null;

  return (
    <section className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-rose-gold" />
        <h2 className="font-semibold">Deine Muster</h2>
      </div>
      <p className="text-sm text-cream/60">
        {insights.loggedDays}/{insights.windowDays} Tage geloggt
        {insights.streak > 0 ? ` · Streak ${insights.streak} Tag${insights.streak === 1 ? '' : 'e'}` : ''}
        — nur für dich.
      </p>

      {insights.phaseSequence.length > 0 && (
        <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
          {insights.phaseSequence.map((phase, i) => (
            <div
              key={`${phase}-${i}`}
              className="flex-1 min-w-[3px]"
              style={{ backgroundColor: PHASE_DEFINITIONS[phase].color }}
              title={PHASE_DEFINITIONS[phase].labelDE}
            />
          ))}
        </div>
      )}

      {hasEnergy && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-cream/40">Ø Energie nach Phase</p>
          {phases.map((phase) => {
            const avg = insights.avgEnergyByPhase[phase];
            if (avg == null) return null;
            return (
              <div key={phase} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-cream/60 truncate">{PHASE_DEFINITIONS[phase].labelDE}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(avg / 5) * 100}%`,
                      backgroundColor: PHASE_DEFINITIONS[phase].color,
                    }}
                  />
                </div>
                <span className="w-8 text-right text-cream/80 tabular-nums">{avg}</span>
              </div>
            );
          })}
        </div>
      )}

      {insights.topSymptoms.length > 0 && (
        <p className="text-sm text-cream/60">
          Häufig:{' '}
          {insights.topSymptoms.map((s) => s.label).join(' · ')}
        </p>
      )}
    </section>
  );
}
