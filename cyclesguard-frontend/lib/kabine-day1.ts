export type KabineDay1State =
  | 'no_team'
  | 'empty_roster'
  | 'all_invite_pending'
  | 'zero_logs_today'
  | 'ready';

export interface KabineDay1ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  href?: string;
}

export function resolveKabineDay1State(opts: {
  teamCount: number;
  rosterCount: number;
  invitePendingCount: number;
  loggedTodayCount: number;
}): KabineDay1State {
  if (opts.teamCount === 0) return 'no_team';
  if (opts.rosterCount === 0) return 'empty_roster';
  if (opts.invitePendingCount === opts.rosterCount) return 'all_invite_pending';
  if (opts.loggedTodayCount === 0) return 'zero_logs_today';
  return 'ready';
}

/** Ordered Day-1 activation steps for Soft-Pilot Kabine. */
export function buildKabineDay1Checklist(opts: {
  state: KabineDay1State;
  hasSessionWindow: boolean;
  sessionMode: boolean;
}): KabineDay1ChecklistItem[] {
  const inviteDone =
    opts.state !== 'no_team' &&
    opts.state !== 'empty_roster' &&
    opts.state !== 'all_invite_pending';
  return [
    {
      id: 'invite',
      label: 'Spielerinnen einladen',
      done: inviteDone || opts.state === 'zero_logs_today' || opts.state === 'ready',
      href: '#invite-section',
    },
    {
      id: 'info',
      label: 'Spielerinnen-Info teilen',
      done: inviteDone || opts.state === 'zero_logs_today' || opts.state === 'ready',
      href: '/spielerinnen-info',
    },
    {
      id: 'session_time',
      label: 'Einheit-Uhrzeit setzen',
      done: opts.hasSessionWindow,
    },
    {
      id: 'freeze',
      label: 'Session-Freeze vor der Einheit',
      done: opts.sessionMode,
    },
  ];
}
