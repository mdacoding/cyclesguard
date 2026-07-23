import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin } from '@/lib/supabase/admin';
import { assertClubIdScope, getAdminClubIds } from '@/lib/admin-scope';

const CommercialStatus = z.enum([
  'pilot_free',
  'quoted',
  'signed',
  'active_paid',
  'ended',
  'churned',
]);

const CreateSeasonSchema = z.object({
  clubId: z.string().uuid(),
  name: z.string().min(1).max(120),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['planned', 'active', 'completed']).default('planned'),
  commercialStatus: CommercialStatus.optional(),
  feeCents: z.number().int().nonnegative().nullable().optional(),
  contractRef: z.string().max(200).nullable().optional(),
});

const PatchSeasonSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['planned', 'active', 'completed']).optional(),
  commercialStatus: CommercialStatus.optional(),
  feeCents: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().length(3).optional(),
  contractRef: z.string().max(200).nullable().optional(),
  signedByEmail: z.string().email().nullable().optional(),
  internalNotes: z.string().max(2000).nullable().optional(),
});

function mapSeason(s: Record<string, unknown>) {
  return {
    id: s.id,
    clubId: s.club_id,
    name: s.name,
    startsOn: s.starts_on,
    endsOn: s.ends_on,
    status: s.status,
    commercialStatus: s.commercial_status ?? 'pilot_free',
    feeCents: s.fee_cents ?? null,
    currency: s.currency ?? 'EUR',
    contractRef: s.contract_ref ?? null,
    signedAt: s.signed_at ?? null,
    signedByEmail: s.signed_by_email ?? null,
    internalNotes: s.internal_notes ?? null,
    createdAt: s.created_at,
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
    .from('seasons')
    .select(
      'id, club_id, name, starts_on, ends_on, status, commercial_status, fee_cents, currency, contract_ref, signed_at, signed_by_email, internal_notes, created_at'
    )
    .order('starts_on', { ascending: false });

  if (clubIds !== 'all') {
    if (clubIds.length === 0) return NextResponse.json([]);
    query = query.in('club_id', clubIds);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to load seasons' }, { status: 500 });

  return NextResponse.json((data ?? []).map((s) => mapSeason(s as Record<string, unknown>)));
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
      commercial_status: parsed.data.commercialStatus ?? 'pilot_free',
      fee_cents: parsed.data.feeCents ?? null,
      contract_ref: parsed.data.contractRef ?? null,
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
    .select('id, club_id, commercial_status, fee_cents, contract_ref, signed_at')
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

  const patch: Record<string, string | number | null> = {};
  if (parsed.data.name) patch.name = parsed.data.name;
  if (parsed.data.startsOn) patch.starts_on = parsed.data.startsOn;
  if (parsed.data.endsOn) patch.ends_on = parsed.data.endsOn;
  if (parsed.data.status) patch.status = parsed.data.status;
  if (parsed.data.feeCents !== undefined) patch.fee_cents = parsed.data.feeCents;
  if (parsed.data.currency) patch.currency = parsed.data.currency;
  if (parsed.data.contractRef !== undefined) patch.contract_ref = parsed.data.contractRef;
  if (parsed.data.signedByEmail !== undefined) patch.signed_by_email = parsed.data.signedByEmail;
  if (parsed.data.internalNotes !== undefined) patch.internal_notes = parsed.data.internalNotes;

  if (parsed.data.commercialStatus) {
    patch.commercial_status = parsed.data.commercialStatus;
    const nextFee =
      parsed.data.feeCents !== undefined ? parsed.data.feeCents : existing.fee_cents;
    const nextRef =
      parsed.data.contractRef !== undefined
        ? parsed.data.contractRef
        : existing.contract_ref;
    if (
      (parsed.data.commercialStatus === 'signed' ||
        parsed.data.commercialStatus === 'active_paid') &&
      nextFee == null &&
      !nextRef
    ) {
      return NextResponse.json(
        { error: 'Fee oder Contract-Ref erforderlich für signed/active_paid' },
        { status: 400 }
      );
    }
    if (
      (parsed.data.commercialStatus === 'signed' ||
        parsed.data.commercialStatus === 'active_paid') &&
      !existing.signed_at
    ) {
      patch.signed_at = new Date().toISOString();
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { error } = await admin.from('seasons').update(patch).eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'Failed to update season' }, { status: 500 });

  await admin.from('admin_audit_log').insert({
    actor_id: user.id,
    action: 'update_season',
    metadata: { season_id: parsed.data.id, ...patch },
  });

  return NextResponse.json({ ok: true });
}
