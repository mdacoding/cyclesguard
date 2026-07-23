import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isTrainer } from '@/lib/supabase/admin';
import { getTrainerTeamIds } from '@/lib/teams';
import { getAppRole } from '@/lib/roles';
import {
  ensurePlayerAppRole,
  ensurePlayerTeamMembership,
  findAuthUserByEmail,
} from '@/lib/invite-membership';
import { inviteCallbackRedirect, sendPasswordSetupEmail } from '@/lib/auth-password-email';

const InviteSchema = z.union([
  z.object({
    email: z.string().email(),
    teamId: z.string().uuid(),
    fullName: z.string().min(1).max(100).optional(),
  }),
  z.object({
    teamId: z.string().uuid(),
    playerId: z.string().uuid(),
    resend: z.literal(true),
  }),
]);

async function auditInvite(
  admin: ReturnType<typeof createAdminClient>,
  actorId: string,
  targetUserId: string,
  teamId: string,
  email: string,
  mode: 'invite' | 'roster_add' | 'invite_resend'
) {
  const { error } = await admin.from('admin_audit_log').insert({
    actor_id: actorId,
    action:
      mode === 'invite'
        ? 'invite_player'
        : mode === 'invite_resend'
          ? 'invite_resend'
          : 'roster_add_existing',
    target_user_id: targetUserId,
    metadata: { team_id: teamId, email, mode },
  });
  if (error) {
    console.warn('Audit log insert skipped/failed:', error.message);
  }
}

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

  const { teamId } = parsed.data;
  const trainerTeams = await getTrainerTeamIds(user.id);
  if (!trainerTeams.includes(teamId)) {
    return NextResponse.json({ error: 'Team not in your scope' }, { status: 403 });
  }

  const admin = createAdminClient();

  if ('resend' in parsed.data) {
    const { playerId } = parsed.data;
    const { data: membership } = await admin
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', playerId)
      .eq('role', 'player')
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: 'Spielerin nicht in diesem Team.' }, { status: 404 });
    }

    const { data: target, error: userError } = await admin.auth.admin.getUserById(playerId);
    if (userError || !target.user?.email) {
      return NextResponse.json({ error: 'Nutzerin nicht gefunden.' }, { status: 404 });
    }

    const mail = await sendPasswordSetupEmail(target.user.email);
    if (!mail.ok) {
      return NextResponse.json(
        { error: mail.error ?? 'Setup-Mail konnte nicht gesendet werden.' },
        { status: 500 }
      );
    }

    await auditInvite(admin, user.id, playerId, teamId, target.user.email, 'invite_resend');
    return NextResponse.json({
      success: true,
      mode: 'invite_resend',
      message: 'Passwort-/Einladungs-Mail erneut gesendet.',
    });
  }

  const { email, fullName } = parsed.data;
  const existing = await findAuthUserByEmail(admin, email);

  // Pilot path: already registered → add to roster (no second invite email)
  if (existing) {
    const role = getAppRole(existing);
    if (role === 'trainer' || role === 'club_admin' || role === 'platform_admin') {
      return NextResponse.json(
        { error: 'Diese E-Mail gehört einem Trainer/Admin-Konto und kann nicht als Spielerin eingeladen werden.' },
        { status: 422 }
      );
    }

    await ensurePlayerAppRole(admin, existing);
    const membership = await ensurePlayerTeamMembership(admin, existing.id, teamId);
    if (!membership.ok) {
      return NextResponse.json({ error: 'Failed to add roster membership' }, { status: 500 });
    }

    if (fullName) {
      await admin.auth.admin.updateUserById(existing.id, {
        user_metadata: {
          ...existing.user_metadata,
          full_name: fullName,
          invited_team_id: teamId,
        },
      });
    } else {
      await admin.auth.admin.updateUserById(existing.id, {
        user_metadata: {
          ...existing.user_metadata,
          invited_team_id: teamId,
        },
      });
    }

    const needsSetupMail = !existing.email_confirmed_at || !existing.last_sign_in_at;
    let setupMailSent = false;
    if (needsSetupMail) {
      const mail = await sendPasswordSetupEmail(email);
      setupMailSent = mail.ok;
      if (!mail.ok) console.warn('Password setup mail failed:', mail.error);
    }

    await auditInvite(admin, user.id, existing.id, teamId, email, 'roster_add');

    return NextResponse.json(
      {
        success: true,
        userId: existing.id,
        mode: 'roster_add',
        message: setupMailSent
          ? 'Bestehende Nutzerin dem Team hinzugefügt. Passwort-/Einladungs-Mail erneut gesendet.'
          : 'Bestehende Nutzerin dem Team hinzugefügt.',
      },
      { status: 200 }
    );
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName ?? email.split('@')[0],
      invited_team_id: teamId,
    },
    redirectTo: inviteCallbackRedirect('player'),
  });

  if (inviteError || !invited.user) {
    console.error('Invite failed:', inviteError);
    const message = inviteError?.message ?? 'Invite failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await ensurePlayerAppRole(admin, invited.user);
  const membership = await ensurePlayerTeamMembership(admin, invited.user.id, teamId);
  if (!membership.ok) {
    console.error('Failed to add team member:', membership.error);
    return NextResponse.json({ error: 'Failed to add roster membership' }, { status: 500 });
  }

  await auditInvite(admin, user.id, invited.user.id, teamId, email, 'invite');

  return NextResponse.json(
    {
      success: true,
      userId: invited.user.id,
      mode: 'invite',
      message: 'Einladung gesendet und Roster aktualisiert.',
    },
    { status: 201 }
  );
}
