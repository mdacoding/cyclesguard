import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isTrainer } from '@/lib/supabase/admin';
import { getTrainerTeamIds } from '@/lib/teams';

const InviteSchema = z.object({
  email: z.string().email(),
  teamId: z.string().uuid(),
  fullName: z.string().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isTrainer(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  const { email, teamId, fullName } = parsed.data;
  const trainerTeams = await getTrainerTeamIds(user.id);
  if (!trainerTeams.includes(teamId)) {
    return NextResponse.json({ error: 'Team not in your scope' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName ?? email.split('@')[0],
      invited_team_id: teamId,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
  });

  if (inviteError || !invited.user) {
    console.error('Invite failed:', inviteError);
    const message = inviteError?.message ?? 'Invite failed';
    if (/already|registered|exists/i.test(message)) {
      return NextResponse.json({ error: 'User already registered' }, { status: 422 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error: memberError } = await admin.from('team_members').upsert(
    {
      team_id: teamId,
      user_id: invited.user.id,
      role: 'player',
    },
    { onConflict: 'team_id,user_id' }
  );

  if (memberError) {
    console.error('Failed to add team member:', memberError);
    return NextResponse.json({ error: 'Failed to add roster membership' }, { status: 500 });
  }

  const { error: auditError } = await admin.from('admin_audit_log').insert({
    actor_id: user.id,
    action: 'invite_player',
    target_user_id: invited.user.id,
    metadata: { team_id: teamId, email },
  });
  if (auditError) {
    console.warn('Audit log insert skipped/failed:', auditError.message);
  }

  return NextResponse.json({ success: true, userId: invited.user.id }, { status: 201 });
}
