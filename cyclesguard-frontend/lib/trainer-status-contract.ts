import { z } from 'zod';

/** Coach-safe readiness enums — never Art.-9 raw fields. */
export const ReadinessStatusSchema = z.enum([
  'FIT',
  'MODIFIED_TRAINING',
  'REST',
  'NO_DATA',
]);

export const LoadFlagSchema = z.enum(['HIGH', 'NORMAL', 'UNKNOWN']);

export const TeamStatusEntrySchema = z
  .object({
    playerId: z.string().min(1),
    name: z.string(),
    status: ReadinessStatusSchema,
    loadFlag: LoadFlagSchema,
    recommendation: z.string(),
    loggedToday: z.boolean(),
    daysSinceLog: z.number().int().nullable(),
    invitePending: z.boolean(),
    /** Coach-safe: at least one Web Push subscription. */
    hasPush: z.boolean(),
  })
  .strict();

export const ReadinessTrend7dSchema = z
  .object({
    FIT: z.number().int().nonnegative(),
    MODIFIED_TRAINING: z.number().int().nonnegative(),
    REST: z.number().int().nonnegative(),
    NO_DATA: z.number().int().nonnegative(),
    playerDays: z.number().int().nonnegative(),
  })
  .strict();

export const TeamStatusResponseSchema = z
  .object({
    players: z.array(TeamStatusEntrySchema),
    trend7d: ReadinessTrend7dSchema,
  })
  .strict();

const FORBIDDEN_KEYS = [
  'phase',
  'symptoms',
  'energy_level',
  'energyLevel',
  'notes',
  'cycle',
  'menstrual',
] as const;

/** Parse + strip — throws if unexpected keys / Art.-9 fields slip into the payload. */
export function assertCoachSafeTeamStatus<T>(payload: T): z.infer<typeof TeamStatusResponseSchema> {
  const parsed = TeamStatusResponseSchema.parse(payload);
  const blob = JSON.stringify(parsed);
  for (const key of FORBIDDEN_KEYS) {
    if (new RegExp(`"${key}"\\s*:`, 'i').test(blob)) {
      throw new Error(`Art.-9 field leaked into team-status: ${key}`);
    }
  }
  return parsed;
}

export const TEAM_STATUS_ENTRY_KEYS = [
  'playerId',
  'name',
  'status',
  'loadFlag',
  'recommendation',
  'loggedToday',
  'daysSinceLog',
  'invitePending',
  'hasPush',
] as const;
