import { z } from 'zod';
import { SYMPTOM_KEYS } from './symptoms';

export const CycleLogSchema = z.object({
  phase: z.enum(['menstrual', 'follicular', 'ovulation', 'luteal']),
  symptoms: z
    .array(z.enum(SYMPTOM_KEYS as [string, ...string[]]))
    .max(8)
    .default([]),
  notes: z.string().max(500).optional(),
  energyLevel: z.number().int().min(1).max(5).optional(),
  clientLogId: z.string().uuid().optional(),
});

export type CycleLogInput = z.infer<typeof CycleLogSchema>;
