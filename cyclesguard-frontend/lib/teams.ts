import { createAdminClient } from '@/lib/supabase/admin';

export async function getTrainerTeamIds(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .eq('role', 'trainer');

  if (error) {
    console.error('Failed to resolve trainer teams:', error);
    return [];
  }
  return (data ?? []).map((row) => row.team_id as string);
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
