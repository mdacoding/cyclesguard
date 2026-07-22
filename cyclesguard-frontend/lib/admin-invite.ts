import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getAppRole } from '@/lib/roles';
import {
  ensurePlayerAppRole,
  ensurePlayerTeamMembership,
  findAuthUserByEmail,
} from '@/lib/invite-membership';

export type InviteRole = 'player' | 'trainer';

export interface AdminInviteInput {
  email: string;
  teamId: string;
  fullName?: string;
  role: InviteRole;
  actorId: string;
}

export interface AdminInviteResult {
  ok: boolean;
  email: string;
  status: number;
  userId?: string;
  mode?: 'invite' | 'roster_add';
  message?: string;
  error?: string;
}

async function ensureTrainerAppRole(admin: SupabaseClient, userId: string) {
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: 'trainer' },
  });
}

async function ensureTeamMembership(
  admin: SupabaseClient,
  userId: string,
  teamId: string,
  role: InviteRole
) {
  const { error } = await admin.from('team_members').upsert(
    { team_id: teamId, user_id: userId, role },
    { onConflict: 'team_id,user_id' }
  );
  return !error;
}

/** Shared invite/roster-add used by single + bulk admin invite APIs. */
export async function adminInviteOrRosterAdd(
  admin: SupabaseClient,
  input: AdminInviteInput
): Promise<AdminInviteResult> {
  const email = input.email.trim().toLowerCase();
  const { teamId, fullName, role, actorId } = input;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const existing = await findAuthUserByEmail(admin, email);

  if (existing) {
    const existingRole = getAppRole(existing);
    if (
      role === 'player' &&
      (existingRole === 'trainer' || existingRole === 'club_admin' || existingRole === 'platform_admin')
    ) {
      return {
        ok: false,
        email,
        status: 422,
        error: 'Diese E-Mail gehört einem Trainer/Admin-Konto.',
      };
    }

    if (role === 'player') {
      await ensurePlayerAppRole(admin, existing);
      const membership = await ensurePlayerTeamMembership(admin, existing.id, teamId);
      if (!membership.ok) {
        return { ok: false, email, status: 500, error: 'Failed to add roster membership' };
      }
    } else {
      await ensureTrainerAppRole(admin, existing.id);
      const ok = await ensureTeamMembership(admin, existing.id, teamId, 'trainer');
      if (!ok) {
        return { ok: false, email, status: 500, error: 'Failed to add trainer membership' };
      }
    }

    await admin.auth.admin.updateUserById(existing.id, {
      user_metadata: {
        ...existing.user_metadata,
        ...(fullName ? { full_name: fullName } : {}),
        invited_team_id: teamId,
      },
    });

    await admin.from('admin_audit_log').insert({
      actor_id: actorId,
      action: 'admin_roster_add',
      target_user_id: existing.id,
      metadata: { team_id: teamId, email, role, mode: 'roster_add' },
    });

    return {
      ok: true,
      email,
      status: 200,
      userId: existing.id,
      mode: 'roster_add',
      message: 'Bestehende Nutzerin dem Team hinzugefügt.',
    };
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
    return {
      ok: false,
      email,
      status: 500,
      error: inviteError?.message ?? 'Invite failed',
    };
  }

  if (role === 'player') {
    await ensurePlayerAppRole(admin, invited.user as User);
    const membership = await ensurePlayerTeamMembership(admin, invited.user.id, teamId);
    if (!membership.ok) {
      return { ok: false, email, status: 500, error: 'Failed to add roster membership' };
    }
  } else {
    await ensureTrainerAppRole(admin, invited.user.id);
    const ok = await ensureTeamMembership(admin, invited.user.id, teamId, 'trainer');
    if (!ok) {
      return { ok: false, email, status: 500, error: 'Failed to add trainer membership' };
    }
  }

  await admin.from('admin_audit_log').insert({
    actor_id: actorId,
    action: 'admin_invite',
    target_user_id: invited.user.id,
    metadata: { team_id: teamId, email, role, mode: 'invite' },
  });

  return {
    ok: true,
    email,
    status: 201,
    userId: invited.user.id,
    mode: 'invite',
    message: 'Einladung gesendet und Roster aktualisiert.',
  };
}

/** Parse CSV: email,fullName?,role? — header optional. */
export function parseInviteCsv(text: string): {
  rows: { email: string; fullName?: string; role: InviteRole }[];
  errors: string[];
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const errors: string[] = [];
  const rows: { email: string; fullName?: string; role: InviteRole }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
    if (i === 0 && /^email$/i.test(parts[0] ?? '')) continue;

    const email = parts[0] ?? '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Zeile ${i + 1}: ungültige E-Mail „${email}“`);
      continue;
    }
    const fullName = parts[1] || undefined;
    const roleRaw = (parts[2] ?? 'player').toLowerCase();
    if (roleRaw !== 'player' && roleRaw !== 'trainer') {
      errors.push(`Zeile ${i + 1}: Rolle muss player oder trainer sein`);
      continue;
    }
    rows.push({ email, fullName, role: roleRaw });
  }

  return { rows, errors };
}
