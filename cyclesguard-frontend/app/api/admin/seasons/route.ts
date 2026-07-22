import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin } from '@/lib/supabase/admin';
import { assertClubIdScope, getAdminClubIds } from '@/lib/admin-scope';

const CreateSeasonSchema = z.object({
  clubId: z.string().uuid(),
  name: z.string().min(1).max(120),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['planned', 'active', 'completed']).default('planned'),
});

const PatchSeasonSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['planned', 'active', 'completed']).optional(),
});

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const clubIds = await getAdminClubIds(admin, user.id, user.app_metadata?.role as string | undefined);

  let query = admin
    .from('seasons')
    .select('id, club_id, name, starts_on, ends_on, status, created_at')
    .order('starts_on', { ascending: false });

  if (clubIds !== 'all') {
    if (clubIds.length === 0) return NextResponse.json([]);
    query = query.in('club_id', clubIds);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to load seasons' }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((s) => ({
      id: s.id,
      clubId: s.club_id,
      name: s.name,
      startsOn: s.starts_on,
      endsOn: s.ends_on,
      status: s.status,
      createdAt: s.created_at,
    }))
  );
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = CreateSeasonSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const admin = createAdminClient();
  const scoped = await assertClubIdScope(
    admin,
    user.id,
    parsed.data.clubId,
    user.app_metadata?.role as string | undefined
  );
  if (!scoped) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (parsed.data.endsOn < parsed.data.startsOn) {
    return NextResponse.json({ error: 'endsOn must be >= startsOn' }, { status: 400 });
  }

  if (parsed.data.status === 'active') {
    await admin
      .from('seasons')
      .update({ status: 'completed' })
      .eq('club_id', parsed.data.clubId)
      .eq('status', 'active');
  }

  const { data: season, error } = await admin
    .from('seasons')
    .insert({
      club_id: parsed.data.clubId,
      name: parsed.data.name,
      starts_on: parsed.data.startsOn,
      ends_on: parsed.data.endsOn,
      status: parsed.data.status,
    })
    .select('id')
    .single();

  if (error || !season) {
    return NextResponse.json({ error: 'Failed to create season' }, { status: 500 });
  }

  await admin.from('admin_audit_log').insert({
    actor_id: user.id,
    action: 'create_season',
    metadata: { season_id: season.id, club_id: parsed.data.clubId, name: parsed.data.name },
  });

  return NextResponse.json({ id: season.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = PatchSeasonSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('seasons')
    .select('id, club_id')
    .eq('id', parsed.data.id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const scoped = await assertClubIdScope(
    admin,
    user.id,
    existing.club_id,
    user.app_metadata?.role as string | undefined
  );
  if (!scoped) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (parsed.data.status === 'active') {
    await admin
      .from('seasons')
      .update({ status: 'completed' })
      .eq('club_id', existing.club_id)
      .eq('status', 'active')
      .neq('id', parsed.data.id);
  }

  const patch: Record<string, string> = {};
  if (parsed.data.name) patch.name = parsed.data.name;
  if (parsed.data.startsOn) patch.starts_on = parsed.data.startsOn;
  if (parsed.data.endsOn) patch.ends_on = parsed.data.endsOn;
  if (parsed.data.status) patch.status = parsed.data.status;

  const { error } = await admin.from('seasons').update(patch).eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'Failed to update season' }, { status: 500 });

  await admin.from('admin_audit_log').insert({
    actor_id: user.id,
    action: 'update_season',
    metadata: { season_id: parsed.data.id, ...patch },
  });

  return NextResponse.json({ ok: true });
}
