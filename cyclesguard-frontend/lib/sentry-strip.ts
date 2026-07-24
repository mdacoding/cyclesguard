/** Coach/player health fields that must never leave the browser/server via Sentry. */
const HEALTH_KEYS = ['phase', 'symptoms', 'energy_level', 'notes'] as const;

export function stripHealthFieldsFromRecord(
  data: Record<string, unknown>
): Record<string, unknown> {
  const safe: Record<string, unknown> = { ...data };
  for (const key of HEALTH_KEYS) {
    delete safe[key];
  }
  return safe;
}

/** Strip request bodies + breadcrumb health fields before Sentry send. */
export function stripSentryEventHealth<T extends {
  request?: { data?: unknown };
  breadcrumbs?: Array<{ data?: Record<string, unknown> }>;
}>(event: T): T {
  if (event.request && 'data' in event.request) {
    delete event.request.data;
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => {
      if (!b.data || typeof b.data !== 'object') return b;
      return { ...b, data: stripHealthFieldsFromRecord(b.data) };
    }) as T['breadcrumbs'];
  }
  return event;
}
