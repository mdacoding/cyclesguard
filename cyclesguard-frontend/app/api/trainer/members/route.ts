import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isTrainer } from '@/lib/supabase/admin';
import { getTrainerTeamIds } from '@/lib/teams';

const RemoveSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
});

/** Trainer may remove a player from their own team's roster (wrong invite / Soft-Pilot). */
export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isTrainer(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = RemoveSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { teamId, userId } = parsed.data;
  const trainerTeams = await getTrainerTeamIds(user.id);
  if (!trainerTeams.includes(teamId)) {
    return NextResponse.json({ error: 'Team not in your scope' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from('team_members')
    .select('id, role')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Mitglied nicht in diesem Team.' }, { status: 404 });
  }
  if (membership.role !== 'player') {
    return NextResponse.json(
      { error: 'Nur Spielerinnen können hier entfernt werden.' },
      { status: 422 }
    );
  }

  const { error } = await admin
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('role', 'player');

  if (error) {
    return NextResponse.json({ error: 'Entfernen fehlgeschlagen.' }, { status: 500 });
  }

  await admin.from('admin_audit_log').insert({
    actor_id: user.id,
    action: 'trainer_remove_player',
    target_user_id: userId,
    metadata: { team_id: teamId },
  });

  return NextResponse.json({ success: true });
}
