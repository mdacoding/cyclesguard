import { getStatusLabel, getLoadLabel, ReadinessStatus, LoadFlag } from '@/lib/trainer-status';

export interface KabineShareMember {
  name: string;
  status: ReadinessStatus;
  loadFlag: LoadFlag;
  loggedToday: boolean;
  daysSinceLog: number | null;
}

function logAgeLabel(m: Pick<KabineShareMember, 'loggedToday' | 'daysSinceLog'>): string {
  if (m.loggedToday) return 'heute geloggt';
  if (m.daysSinceLog == null) return 'nie geloggt';
  if (m.daysSinceLog === 1) return 'vor 1 Tag';
  return `vor ${m.daysSinceLog} Tagen`;
}

const STATUS_ORDER: ReadinessStatus[] = ['REST', 'MODIFIED_TRAINING', 'NO_DATA', 'FIT'];

/** Coach-safe Kabine pack: Ampel groups for share / clipboard / print prep. */
export function buildGroupedAmpelShareText(opts: {
  teamName: string;
  members: KabineShareMember[];
  loggedTodayCount: number;
  sessionMode?: boolean;
  when?: Date;
}): string {
  const when = opts.when ?? new Date();
  const byStatus = new Map<ReadinessStatus, KabineShareMember[]>();
  for (const status of STATUS_ORDER) byStatus.set(status, []);
  for (const m of opts.members) {
    const list = byStatus.get(m.status) ?? [];
    list.push(m);
    byStatus.set(m.status, list);
  }

  const blocks: string[] = [];
  for (const status of STATUS_ORDER) {
    const list = byStatus.get(status) ?? [];
    if (list.length === 0) continue;
    blocks.push(`${getStatusLabel(status)} (${list.length})`);
    for (const m of list) {
      blocks.push(
        `· ${m.name}${
          m.loadFlag !== 'UNKNOWN' ? ` · ${getLoadLabel(m.loadFlag)}` : ''
        } · ${logAgeLabel(m)}`
      );
    }
    blocks.push('');
  }

  return [
    `CyclesGuard · ${opts.teamName}${opts.sessionMode ? ' · Session-Freeze' : ''}`,
    when.toLocaleString('de-DE'),
    `Geloggt heute: ${opts.loggedTodayCount}/${opts.members.length}`,
    '',
    ...blocks,
    'Nur Ampel-Signale — keine Gesundheitsrohdaten.',
  ].join('\n');
}

export const SESSION_FREEZE_STORAGE_KEY = 'cg_trainer_session_freeze';

export interface SessionFreezeSnapshot<TPlayer, TTrend> {
  teamId: string;
  frozenAt: string;
  team: TPlayer[];
  trend7d: TTrend;
}

export function readSessionFreeze<TPlayer, TTrend>(
  teamId: string
): SessionFreezeSnapshot<TPlayer, TTrend> | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_FREEZE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionFreezeSnapshot<TPlayer, TTrend>;
    if (!parsed || parsed.teamId !== teamId || !Array.isArray(parsed.team)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSessionFreeze<TPlayer, TTrend>(
  snapshot: SessionFreezeSnapshot<TPlayer, TTrend>
): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_FREEZE_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota / private mode */
  }
}

export function clearSessionFreeze(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_FREEZE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
