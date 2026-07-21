export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface CycleLog {
  id: string;
  userId: string;
  loggedAt: string;
  phase: CyclePhase;
  symptoms: string[];
  notes?: string;
  energyLevel?: number;
  createdAt: string;
}

export interface PhaseDefinition {
  phase: CyclePhase;
  labelDE: string;
  emoji: string;
  color: string;
  glowColor: string;
  description: string;
  feedback: string;
  tips: string[];
  trainingAdvice: string;
}
