import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin } from '@/lib/supabase/admin';
import { assertClubIdScope } from '@/lib/admin-scope';
import { findAuthUserByEmail } from '@/lib/invite-membership';

const AssignSchema = z.object({
  email: z.string().email(),
  clubId: z.string().uuid(),
  fullName: z.string().min(1).max(100).optional(),
});

function isPlatformAdmin(user: { app_metadata?: Record<string, unknown> }) {
  return user.app_metadata?.role === 'platform_admin';
}

/** Platform admin: assign club_admin role + club_members row (email invite or existing). */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isPlatformAdmin(user) && !isClubAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = AssignSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Club admins may only add fellow admins to their own club; platform may any club
  if (!isPlatformAdmin(user)) {
    const scoped = await assertClubIdScope(
      admin,
      user.id,
      parsed.data.clubId,
      user.app_metadata?.role as string | undefined
    );
    if (!scoped) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: club } = await admin
    .from('clubs')
    .select('id, name')
    .eq('id', parsed.data.clubId)
    .maybeSingle();
  if (!club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

  const email = parsed.data.email.trim().toLowerCase();
  let target = await findAuthUserByEmail(admin, email);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  if (!target) {
    const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: parsed.data.fullName ?? email.split('@')[0],
      },
      redirectTo: `${siteUrl}/auth/callback?next=/admin/teams`,
    });
    if (error || !invited.user) {
      return NextResponse.json({ error: error?.message ?? 'Invite failed' }, { status: 500 });
    }
    target = invited.user;
  }

  await admin.auth.admin.updateUserById(target.id, {
    app_metadata: { ...target.app_metadata, role: 'club_admin' },
    user_metadata: {
      ...target.user_metadata,
      ...(parsed.data.fullName ? { full_name: parsed.data.fullName } : {}),
    },
  });

  const { error: memberError } = await admin.from('club_members').upsert(
    {
      club_id: parsed.data.clubId,
      user_id: target.id,
      role: 'club_admin',
    },
    { onConflict: 'club_id,user_id' }
  );

  if (memberError) {
    return NextResponse.json({ error: 'Failed to attach club membership' }, { status: 500 });
  }

  await admin.from('admin_audit_log').insert({
    actor_id: user.id,
    action: 'assign_club_admin',
    target_user_id: target.id,
    metadata: { club_id: parsed.data.clubId, email },
  });

  return NextResponse.json({
    success: true,
    userId: target.id,
    clubId: parsed.data.clubId,
    message: 'Club-Admin zugewiesen.',
  });
}
