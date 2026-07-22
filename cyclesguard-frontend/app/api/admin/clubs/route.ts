import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin } from '@/lib/supabase/admin';
import { assertClubIdScope, getAdminClubIds } from '@/lib/admin-scope';

function mapClub(c: Record<string, unknown>) {
  return {
    id: c.id,
    name: c.name,
    legalName: c.legal_name ?? null,
    billingEmail: c.billing_email ?? null,
    maxTeams: c.max_teams ?? null,
    maxPlayers: c.max_players ?? null,
    createdAt: c.created_at,
  };
}

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
    .from('clubs')
    .select('id, name, legal_name, billing_email, max_teams, max_players, created_at')
    .order('name');
  if (clubIds !== 'all') {
    if (clubIds.length === 0) return NextResponse.json([]);
    query = query.in('id', clubIds);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to load clubs' }, { status: 500 });

  return NextResponse.json((data ?? []).map((c) => mapClub(c as Record<string, unknown>)));
}

const CreateClubSchema = z.object({
  name: z.string().min(1).max(120),
});

const PatchClubSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
  legalName: z.string().max(200).nullable().optional(),
  billingEmail: z.string().email().nullable().optional(),
  maxTeams: z.number().int().positive().nullable().optional(),
  maxPlayers: z.number().int().positive().nullable().optional(),
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

/** Club admin (scoped) or platform — update billing / legal contact for paid path. */
export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = PatchClubSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const admin = createAdminClient();
  const scoped = await assertClubIdScope(
    admin,
    user.id,
    parsed.data.id,
    user.app_metadata?.role as string | undefined
  );
  if (!scoped) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const patch: Record<string, string | number | null> = {};
  if (parsed.data.name) patch.name = parsed.data.name;
  if (parsed.data.legalName !== undefined) patch.legal_name = parsed.data.legalName;
  if (parsed.data.billingEmail !== undefined) patch.billing_email = parsed.data.billingEmail;
  if (parsed.data.maxTeams !== undefined) patch.max_teams = parsed.data.maxTeams;
  if (parsed.data.maxPlayers !== undefined) patch.max_players = parsed.data.maxPlayers;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { error } = await admin.from('clubs').update(patch).eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'Failed to update club' }, { status: 500 });

  await admin.from('admin_audit_log').insert({
    actor_id: user.id,
    action: 'update_club',
    metadata: { club_id: parsed.data.id, ...patch },
  });

  return NextResponse.json({ ok: true });
}
