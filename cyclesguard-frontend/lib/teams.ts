import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Active trainer team IDs only.
 * Two-step query avoids silent fallback that re-includes archived teams.
 */
export async function getTrainerTeamIds(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data: memberships, error } = await admin
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .eq('role', 'trainer');

  if (error) {
    console.error('Failed to resolve trainer memberships:', error);
    return [];
  }

  const ids = (memberships ?? []).map((row) => row.team_id as string);
  if (ids.length === 0) return [];

  const { data: teams, error: teamsError } = await admin
    .from('teams')
    .select('id, status')
    .in('id', ids);

  if (teamsError) {
    console.error('Failed to resolve team status:', teamsError);
    return [];
  }

  return (teams ?? [])
    .filter((t) => (t.status ?? 'active') === 'active')
    .map((t) => t.id as string);
}

export async function getTeamPlayerIds(teamIds: string[]): Promise<string[]> {
  if (teamIds.length === 0) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('team_members')
    .select('user_id')
    .in('team_id', teamIds)
    .eq('role', 'player');

  if (error) {
    console.error('Failed to resolve team players:', error);
    return [];
  }

  return Array.from(new Set((data ?? []).map((row) => row.user_id as string)));
}
