import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin } from '@/lib/supabase/admin';
import { getAppRole } from '@/lib/roles';
import { assertClubScope } from '@/lib/admin-scope';
import {
  ensurePlayerAppRole,
  ensurePlayerTeamMembership,
  findAuthUserByEmail,
} from '@/lib/invite-membership';

const InviteSchema = z.object({
  email: z.string().email(),
  teamId: z.string().uuid(),
  fullName: z.string().min(1).max(100).optional(),
  role: z.enum(['player', 'trainer']).default('player'),
});

async function ensureTrainerAppRole(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
) {
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: 'trainer' },
  });
}

async function ensureTeamMembership(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  teamId: string,
  role: 'player' | 'trainer'
) {
  const { error } = await admin.from('team_members').upsert(
    { team_id: teamId, user_id: userId, role },
    { onConflict: 'team_id,user_id' }
  );
  return !error;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = InviteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  const { email, teamId, fullName, role } = parsed.data;
  const admin = createAdminClient();
  const scoped = await assertClubScope(
    admin,
    user.id,
    teamId,
    user.app_metadata?.role as string | undefined
  );
  if (!scoped) return NextResponse.json({ error: 'Team not in your scope' }, { status: 403 });

  const existing = await findAuthUserByEmail(admin, email);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  if (existing) {
    const existingRole = getAppRole(existing);
    if (role === 'player' && (existingRole === 'trainer' || existingRole === 'club_admin' || existingRole === 'platform_admin')) {
      return NextResponse.json(
        { error: 'Diese E-Mail gehört einem Trainer/Admin-Konto.' },
        { status: 422 }
      );
    }

    if (role === 'player') {
      await ensurePlayerAppRole(admin, existing);
      const membership = await ensurePlayerTeamMembership(admin, existing.id, teamId);
      if (!membership.ok) {
        return NextResponse.json({ error: 'Failed to add roster membership' }, { status: 500 });
      }
    } else {
      await ensureTrainerAppRole(admin, existing.id);
      const ok = await ensureTeamMembership(admin, existing.id, teamId, 'trainer');
      if (!ok) return NextResponse.json({ error: 'Failed to add trainer membership' }, { status: 500 });
    }

    await admin.auth.admin.updateUserById(existing.id, {
      user_metadata: {
        ...existing.user_metadata,
        ...(fullName ? { full_name: fullName } : {}),
        invited_team_id: teamId,
      },
    });

    await admin.from('admin_audit_log').insert({
      actor_id: user.id,
      action: 'admin_roster_add',
      target_user_id: existing.id,
      metadata: { team_id: teamId, email, role, mode: 'roster_add' },
    });

    return NextResponse.json({
      success: true,
      userId: existing.id,
      mode: 'roster_add',
      message: 'Bestehende Nutzerin dem Team hinzugefügt.',
    });
  }

  const redirectNext = role === 'trainer' ? '/trainer/dashboard' : '/player/onboarding';
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName ?? email.split('@')[0],
      invited_team_id: teamId,
    },
    redirectTo: `${siteUrl}/auth/callback?next=${redirectNext}`,
  });

  if (inviteError || !invited.user) {
    return NextResponse.json({ error: inviteError?.message ?? 'Invite failed' }, { status: 500 });
  }

  if (role === 'player') {
    await ensurePlayerAppRole(admin, invited.user);
    const membership = await ensurePlayerTeamMembership(admin, invited.user.id, teamId);
    if (!membership.ok) {
      return NextResponse.json({ error: 'Failed to add roster membership' }, { status: 500 });
    }
  } else {
    await ensureTrainerAppRole(admin, invited.user.id);
    const ok = await ensureTeamMembership(admin, invited.user.id, teamId, 'trainer');
    if (!ok) return NextResponse.json({ error: 'Failed to add trainer membership' }, { status: 500 });
  }

  await admin.from('admin_audit_log').insert({
    actor_id: user.id,
    action: 'admin_invite',
    target_user_id: invited.user.id,
    metadata: { team_id: teamId, email, role, mode: 'invite' },
  });

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
