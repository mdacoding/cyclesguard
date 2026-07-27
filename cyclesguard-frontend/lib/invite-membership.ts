import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getAppRole } from '@/lib/roles';

export interface RosterMeta {
  jerseyNumber?: number | null;
  position?: string | null;
}

/**
 * Ensures an invited player is on the team roster.
 * Idempotent — safe to call from invite API and auth callback.
 * Roster metadata (jersey/position) is optional and never health data.
 */
export async function ensurePlayerTeamMembership(
  admin: SupabaseClient,
  userId: string,
  teamId: string,
  meta?: RosterMeta
): Promise<{ ok: boolean; error?: string }> {
  const row: Record<string, unknown> = {
    team_id: teamId,
    user_id: userId,
    role: 'player',
  };
  if (meta?.jerseyNumber !== undefined) row.jersey_number = meta.jerseyNumber;
  if (meta?.position !== undefined) row.position = meta.position;

  const { error } = await admin.from('team_members').upsert(row, {
    onConflict: 'team_id,user_id',
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Sets app_metadata.role = player only when the user has no elevated role yet.
 */
export async function ensurePlayerAppRole(
  admin: SupabaseClient,
  user: User
): Promise<void> {
  const role = getAppRole(user);
  if (role !== 'player') return;

  const current = user.app_metadata?.role;
  if (current === 'player') return;

  await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, role: 'player' },
  });
}

/**
 * After invite-link / magic-link login: attach roster membership from user_metadata.
 */
export async function finalizeInviteIfNeeded(
  admin: SupabaseClient,
  user: User
): Promise<{ attached: boolean; teamId?: string }> {
  const teamId = user.user_metadata?.invited_team_id;
  if (typeof teamId !== 'string' || !teamId) {
    return { attached: false };
  }

  await ensurePlayerAppRole(admin, user);
  const membership = await ensurePlayerTeamMembership(admin, user.id, teamId);
  if (!membership.ok) {
    console.error('finalizeInvite membership failed:', membership.error);
    return { attached: false, teamId };
  }

  // Clear one-shot invite marker so callback is idempotent without re-writes
  const { invited_team_id: _removed, ...rest } = user.user_metadata ?? {};
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...rest, invite_completed: true },
  });

  return { attached: true, teamId };
}

export async function findAuthUserByEmail(
  admin: SupabaseClient,
  email: string
): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('listUsers failed:', error);
      return null;
    }
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
    if (page > 20) return null;
  }
}
