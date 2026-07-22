import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin } from '@/lib/supabase/admin';
import { getAdminClubIds } from '@/lib/admin-scope';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const clubIds = await getAdminClubIds(admin, user.id, user.app_metadata?.role as string | undefined);

  let query = admin.from('clubs').select('id, name, created_at').order('name');
  if (clubIds !== 'all') {
    if (clubIds.length === 0) return NextResponse.json([]);
    query = query.in('id', clubIds);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to load clubs' }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((c) => ({ id: c.id, name: c.name, createdAt: c.created_at }))
  );
}

const CreateClubSchema = z.object({
  name: z.string().min(1).max(120),
});

/** Platform admin only — create a club org unit. */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.app_metadata?.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = CreateClubSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const admin = createAdminClient();
  const { data: club, error } = await admin
    .from('clubs')
    .insert({ name: parsed.data.name })
    .select('id')
    .single();

  if (error || !club) return NextResponse.json({ error: 'Failed to create club' }, { status: 500 });

  await admin.from('admin_audit_log').insert({
    actor_id: user.id,
    action: 'create_club',
    metadata: { club_id: club.id, name: parsed.data.name },
  });

  return NextResponse.json({ id: club.id }, { status: 201 });
}
