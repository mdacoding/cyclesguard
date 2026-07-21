import { CyclePhase, PhaseDefinition } from './types';

export const PHASE_DEFINITIONS: Record<CyclePhase, PhaseDefinition> = {
  menstrual: {
    phase: 'menstrual',
    labelDE: 'Menstruation',
    emoji: '🌙',
    color: '#C67B7B',
    glowColor: 'rgba(198,123,123,0.3)',
    description: 'Dein Körper regeneriert sich.',
    feedback: 'Dein Körper vollbringt gerade Außerordentliches. Gönn dir heute Ruhe — leichte Bewegung und Wärme sind deine besten Verbündeten.',
    tips: ['Viel Wasser trinken', 'Eisenreiche Ernährung', 'Leichtes Stretching'],
    trainingAdvice: 'Belastungsreduktion empfohlen. Technikübungen statt Hochintensitätstraining.'
  },
  follicular: {
    phase: 'follicular',
    labelDE: 'Follikelphase',
    emoji: '🌱',
    color: '#7BA8C6',
    glowColor: 'rgba(123,168,198,0.3)',
    description: 'Deine Energie kehrt zurück!',
    feedback: 'Deine Energie kehrt zurück! Östrogen steigt — das ist die beste Zeit für neue Herausforderungen und technische Lerneinheiten.',
    tips: ['Kraft- und Speedtraining optimal', 'Neue Bewegungsabläufe lernen', 'Vollgas geben'],
    trainingAdvice: 'Optimale Phase für intensive Trainingseinheiten und Kraft-Peaks.'
  },
  ovulation: {
    phase: 'ovulation',
    labelDE: 'Eisprung',
    emoji: '✨',
    color: '#C6B87B',
    glowColor: 'rgba(198,184,123,0.3)',
    description: 'Du bist auf deinem Hochpunkt!',
    feedback: 'Du bist auf deinem Hochpunkt! Deine Koordination und Kraft sind maximal — gleichzeitig ist das Verletzungsrisiko (ACL!) leicht erhöht. Wärme dich gründlich auf.',
    tips: ['Gründliches Aufwärmen', 'Auf Kniestellung achten', 'Gelenke schützen'],
    trainingAdvice: '⚠️ ACL-Risiko leicht erhöht. Landesicherheit und Kniestabilisierung priorisieren.'
  },
  luteal: {
    phase: 'luteal',
    labelDE: 'Lutealphase',
    emoji: '🍂',
    color: '#9B7BC6',
    glowColor: 'rgba(155,123,198,0.3)',
    description: 'Zeit für Regeneration.',
    feedback: 'In der Lutealphase benötigt dein Körper oft mehr Regeneration — achte heute besonders auf deinen Schlaf und deine Ernährung. Das ist keine Schwäche, das ist Intelligenz.',
    tips: ['Mehr Schlaf priorisieren', 'Magnesium-reiche Ernährung', 'Regenerationseinheiten'],
    trainingAdvice: 'Moderate Intensität. Regeneration und mentale Stärke trainieren.'
  }
};
