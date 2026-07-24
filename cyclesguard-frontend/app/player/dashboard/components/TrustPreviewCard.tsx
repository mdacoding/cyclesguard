'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import {
  getStatusColor,
  getStatusLabel,
  mapCycleToStatus,
  buildTrainerInsight,
} from '@/lib/trainer-status';
import { CyclePhase } from '@/lib/types';

interface TrustPreviewCardProps {
  phase: CyclePhase;
  energyLevel?: number | null;
  loggedAt: string;
}

/** Shows Spielerin exactly what the trainer Ampel sees — never raw health. */
export default function TrustPreviewCard({
  phase,
  energyLevel,
  loggedAt,
}: TrustPreviewCardProps) {
  const mapped = mapCycleToStatus(phase, energyLevel);
  const hoursSince =
    (Date.now() - new Date(loggedAt).getTime()) / (1000 * 60 * 60);
  const insight = buildTrainerInsight(mapped, 'UNKNOWN', hoursSince);
  const colors = getStatusColor(insight.status);

  return (
    <section
      className={`glass-card p-5 border ${colors.border} ${colors.bg} space-y-3 animate-slideUp`}
      aria-label="Was der Trainer sieht"
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-sage shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 space-y-2">
          <h2 className="font-semibold text-base">Was der Trainer sieht</h2>
          <p className="text-sm text-cream/70 leading-relaxed">
            Nur dieses Ampel-Signal und die Empfehlung — nie Phase, Symptome oder Notizen.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${colors.border} bg-white/5`}
            >
              <span className={`w-2 h-2 rounded-full ${colors.dot}`} aria-hidden />
              {getStatusLabel(insight.status)}
            </span>
          </div>
          <p className="text-sm text-cream/80">{insight.recommendation}</p>
          <p className="text-[11px] text-cream/40">
            Mehr:{' '}
            <Link href="/privacy" className="text-cream/55 hover:text-rose-gold underline-offset-2 hover:underline">
              /privacy
            </Link>
            {' · '}
            <Link
              href="/spielerinnen-info"
              className="text-cream/55 hover:text-rose-gold underline-offset-2 hover:underline"
            >
              /spielerinnen-info
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
