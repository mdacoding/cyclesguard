/** Soccer-relevant symptom catalogue — max 8 for completion rate (CTO decision Sprint 7). */
export const SYMPTOM_OPTIONS = [
  { key: 'cramps', labelDE: 'Krämpfe' },
  { key: 'fatigue', labelDE: 'Müdigkeit' },
  { key: 'headache', labelDE: 'Kopfschmerz' },
  { key: 'mood', labelDE: 'Stimmungsschwankung' },
  { key: 'bloating', labelDE: 'Blähungen' },
  { key: 'breast_tenderness', labelDE: 'Brustspannen' },
  { key: 'joint_pain', labelDE: 'Gelenkschmerz' },
  { key: 'sleep_issues', labelDE: 'Schlafstörung' },
] as const;

export type SymptomKey = (typeof SYMPTOM_OPTIONS)[number]['key'];

export const SYMPTOM_KEYS = SYMPTOM_OPTIONS.map((s) => s.key) as SymptomKey[];
