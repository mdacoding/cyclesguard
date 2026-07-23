import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin } from '@/lib/supabase/admin';
import { assertClubScope } from '@/lib/admin-scope';

const AssignSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['player', 'trainer']),
});

const RemoveSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const teamId = new URL(request.url).searchParams.get('teamId');
  if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 });

  const admin = createAdminClient();
  const ok = await assertClubScope(admin, user.id, teamId, user.app_metadata?.role as string | undefined);
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: members, error } = await admin
    .from('team_members')
    .select('user_id, role, joined_at')
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });

  const playerIds = (members ?? []).filter((m) => m.role === 'player').map((m) => m.user_id);
  const activeLast7Days = new Set<string>();
  if (playerIds.length > 0) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: logs } = await admin
      .from('cycle_logs')
      .select('user_id')
      .in('user_id', playerIds)
      .gte('logged_at', sevenDaysAgo.toISOString());
    for (const l of logs ?? []) {
      activeLast7Days.add(l.user_id);
    }
  }

  const result = [];
  for (const m of members ?? []) {
    const { data: authUser } = await admin.auth.admin.getUserById(m.user_id);
    result.push({
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      name:
        (authUser.user?.user_metadata?.full_name as string | undefined) ??
        authUser.user?.email?.split('@')[0] ??
        'Unbekannt',
      email: authUser.user?.email ?? null,
      invitePending: !authUser.user?.last_sign_in_at,
      /** Player only: ≥1 coach-safe log in last 7d (no phase/symptoms). */
      activeLast7Days: m.role === 'player' ? activeLast7Days.has(m.user_id) : null,
    });
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = AssignSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const admin = createAdminClient();
  const ok = await assertClubScope(admin, user.id, parsed.data.teamId, user.app_metadata?.role as string | undefined);
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await admin.from('team_members').upsert(
    {
      team_id: parsed.data.teamId,
      user_id: parsed.data.userId,
      role: parsed.data.role,
    },
    { onConflict: 'team_id,user_id' }
  );

  if (error) return NextResponse.json({ error: 'Failed to assign member' }, { status: 500 });

  await admin.from('admin_audit_log').insert({
    actor_id: user.id,
    action: 'assign_member',
    target_user_id: parsed.data.userId,
    metadata: { team_id: parsed.data.teamId, role: parsed.data.role },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = RemoveSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const admin = createAdminClient();
  const ok = await assertClubScope(admin, user.id, parsed.data.teamId, user.app_metadata?.role as string | undefined);
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await admin
    .from('team_members')
    .delete()
    .eq('team_id', parsed.data.teamId)
    .eq('user_id', parsed.data.userId);

  if (error) return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });

  await admin.from('admin_audit_log').insert({
    actor_id: user.id,
    action: 'remove_member',
    target_user_id: parsed.data.userId,
    metadata: { team_id: parsed.data.teamId },
  });

  return NextResponse.json({ success: true });
}
