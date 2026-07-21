import { CyclePhase } from '@/lib/types';
import { PHASE_DEFINITIONS } from '@/lib/cycle-phases';
import { ShieldAlert, Info, Activity } from 'lucide-react';

export default function FeedbackBanner({ phase }: { phase: CyclePhase }) {
  const definition = PHASE_DEFINITIONS[phase];

  return (
    <div 
      className="rounded-2xl p-6 md:p-8 relative overflow-hidden glass-card transition-all duration-500"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, ${definition.glowColor} 100%)`,
        borderColor: `${definition.color}40`,
      }}
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <span className="text-9xl">{definition.emoji}</span>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-8">
        
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{definition.emoji}</span>
            <h2 className="font-display text-2xl font-semibold" style={{ color: definition.color }}>
              Aktuelle Phase: {definition.labelDE}
            </h2>
          </div>
          
          <p className="text-cream/90 text-lg leading-relaxed font-light">
            {definition.feedback}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {definition.tips.map((tip, idx) => (
              <span 
                key={idx}
                className="text-xs px-3 py-1.5 rounded-full bg-navy/40 border border-white/10 text-cream/90 backdrop-blur-md"
              >
                {tip}
              </span>
            ))}
          </div>
        </div>

        <div className="md:w-1/3 bg-navy/40 backdrop-blur-md rounded-xl p-5 border border-white/5 h-fit">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5" style={{ color: definition.color }} />
            <h3 className="font-medium text-sm text-cream/90 uppercase tracking-wider">Training Advice</h3>
          </div>
          <p className="text-sm text-cream/80 leading-relaxed">
            {definition.trainingAdvice}
          </p>
          
          {phase === 'ovulation' && (
            <div className="mt-4 flex items-start gap-2 bg-rose-gold/10 p-3 rounded-lg border border-rose-gold/20">
              <ShieldAlert className="w-4 h-4 text-rose-gold shrink-0 mt-0.5" />
              <p className="text-xs text-rose-gold/90 font-medium">
                Besondere Vorsicht bei Richtungswechseln und Landungen empfohlen.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
