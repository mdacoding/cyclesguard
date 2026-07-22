import type { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

/** Club admin may only act on teams belonging to their club (platform_admin: all). */
export async function assertClubScope(
  admin: AdminClient,
  userId: string,
  teamId: string,
  role: string | undefined
): Promise<boolean> {
  if (role === 'platform_admin') return true;
  const { data: team } = await admin.from('teams').select('club_id').eq('id', teamId).maybeSingle();
  if (!team?.club_id) return false;
  const { data: membership } = await admin
    .from('club_members')
    .select('id')
    .eq('club_id', team.club_id)
    .eq('user_id', userId)
    .eq('role', 'club_admin')
    .maybeSingle();
  return !!membership;
}

export async function assertClubIdScope(
  admin: AdminClient,
  userId: string,
  clubId: string,
  role: string | undefined
): Promise<boolean> {
  if (role === 'platform_admin') return true;
  const { data: membership } = await admin
    .from('club_members')
    .select('id')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .eq('role', 'club_admin')
    .maybeSingle();
  return !!membership;
}

export async function getAdminClubIds(
  admin: AdminClient,
  userId: string,
  role: string | undefined
): Promise<string[] | 'all'> {
  if (role === 'platform_admin') return 'all';
  const { data } = await admin
    .from('club_members')
    .select('club_id')
    .eq('user_id', userId)
    .eq('role', 'club_admin');
  return (data ?? []).map((r) => r.club_id);
}
