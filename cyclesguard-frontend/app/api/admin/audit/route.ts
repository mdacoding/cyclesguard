import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin } from '@/lib/supabase/admin';
import { getAdminClubIds } from '@/lib/admin-scope';

/** Export recent admin audit events for compliance (no health raw data). */
export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const clubIds = await getAdminClubIds(admin, user.id, user.app_metadata?.role as string | undefined);
  const limit = Math.min(Number(new URL(request.url).searchParams.get('limit') ?? 200), 500);

  const { data, error } = await admin
    .from('admin_audit_log')
    .select('id, actor_id, action, target_user_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: 'Failed to load audit log' }, { status: 500 });

  const rows = (data ?? []).filter((row) => {
    if (clubIds === 'all') return true;
    const meta = row.metadata as { club_id?: string; team_id?: string } | null;
    if (meta?.club_id && clubIds.includes(meta.club_id)) return true;
    // Include actor's own actions when club_id missing (team-scoped invites)
    return row.actor_id === user.id;
  });

  const format = new URL(request.url).searchParams.get('format');
  if (format === 'csv') {
    const header = 'id,created_at,actor_id,action,target_user_id,metadata\n';
    const body = rows
      .map((r) =>
        [
          r.id,
          r.created_at,
          r.actor_id ?? '',
          r.action,
          r.target_user_id ?? '',
          JSON.stringify(r.metadata ?? {}).replaceAll('"', '""'),
        ]
          .map((c) => `"${c}"`)
          .join(',')
      )
      .join('\n');
    return new NextResponse(header + body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="cyclesguard-audit.csv"',
      },
    });
  }

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      actorId: r.actor_id,
      action: r.action,
      targetUserId: r.target_user_id,
      metadata: r.metadata,
      createdAt: r.created_at,
    }))
  );
}
