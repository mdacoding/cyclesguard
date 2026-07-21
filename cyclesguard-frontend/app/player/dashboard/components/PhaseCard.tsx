'use client';

import { CyclePhase, PhaseDefinition } from '@/lib/types';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface PhaseCardProps {
  definition: PhaseDefinition;
  isSelected: boolean;
  onSelect: (phase: CyclePhase) => void;
}

export default function PhaseCard({ definition, isSelected, onSelect }: PhaseCardProps) {
  return (
    <motion.div
      whileHover={{ scale: isSelected ? 1.02 : 1.04 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(definition.phase)}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(definition.phase);
        }
      }}
      className={`relative cursor-pointer glass-card p-5 flex flex-col items-center text-center transition-all duration-300 ${
        isSelected ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
      style={{
        borderColor: isSelected ? definition.color : 'rgba(255, 255, 255, 0.12)',
        boxShadow: isSelected ? `0 0 20px ${definition.glowColor}` : 'none',
      }}
    >
      {isSelected && (
        <div 
          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center animate-fadeIn"
          style={{ backgroundColor: definition.color }}
        >
          <Check className="w-4 h-4 text-navy" strokeWidth={3} />
        </div>
      )}
      
      <span className="text-4xl mb-3 block" aria-hidden="true">{definition.emoji}</span>
      <h3 className="font-display font-medium text-lg mb-1" style={{ color: isSelected ? definition.color : 'inherit' }}>
        {definition.labelDE}
      </h3>
      <p className="text-xs text-cream/60 leading-relaxed">
        {definition.description}
      </p>
    </motion.div>
  );
}
