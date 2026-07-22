import { Activity } from 'lucide-react';

export interface SessionSummaryCardProps {
  startedAt: string;
  durationMinutes: number | null;
  distanceKm: number | null;
  avgHeartRate: number | null;
  loadScore: number | null;
}

/** Player-private GPS session card — aggregates only, no coordinates. */
export default function SessionSummaryCard({
  startedAt,
  durationMinutes,
  distanceKm,
  avgHeartRate,
  loadScore,
}: SessionSummaryCardProps) {
  const dateLabel = new Date(startedAt).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <section className="glass-card p-6 animate-slideUp">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-rose-gold" />
        <h2 className="font-semibold text-sm">Letzte Einheit</h2>
      </div>
      <p className="text-xs text-cream/50 mb-3">{dateLabel}</p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-cream/40 text-xs">Dauer</dt>
          <dd className="text-cream/90">{durationMinutes != null ? `${durationMinutes} min` : '—'}</dd>
        </div>
        <div>
          <dt className="text-cream/40 text-xs">Distanz</dt>
          <dd className="text-cream/90">
            {distanceKm != null ? `${distanceKm.toFixed(1)} km` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-cream/40 text-xs">Ø HF</dt>
          <dd className="text-cream/90">{avgHeartRate != null ? `${avgHeartRate}` : '—'}</dd>
        </div>
        <div>
          <dt className="text-cream/40 text-xs">Load</dt>
          <dd className="text-cream/90">{loadScore != null ? loadScore.toFixed(0) : '—'}</dd>
        </div>
      </dl>
      <p className="text-[11px] text-cream/35 mt-4">Nur für dich — Trainer sehen nur Load-Ampel.</p>
    </section>
  );
}
