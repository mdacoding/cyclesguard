import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin, isTrainer } from '@/lib/supabase/admin';
import { getAdminClubIds } from '@/lib/admin-scope';
import { checkRateLimit } from '@/lib/rate-limit';

const FeedbackSchema = z.object({
  score: z.number().int().min(1).max(5),
  message: z.string().max(1000).optional(),
  context: z.string().max(80).optional(),
});

function resolveRole(user: {
  app_metadata?: Record<string, unknown>;
}): 'player' | 'trainer' | 'club_admin' | 'other' {
  if (isClubAdmin(user)) return 'club_admin';
  if (isTrainer(user)) return 'trainer';
  const role = user.app_metadata?.role;
  if (role === 'player') return 'player';
  return 'other';
}

async function resolveUserClubId(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string | null> {
  const { data: clubMember } = await admin
    .from('club_members')
    .select('club_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (clubMember?.club_id) return clubMember.club_id as string;

  const { data: membership } = await admin
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (!membership?.team_id) return null;

  const { data: team } = await admin
    .from('teams')
    .select('club_id')
    .eq('id', membership.team_id)
    .maybeSingle();
  return (team?.club_id as string | null) ?? null;
}

/** Authenticated users submit product feedback (no health fields). */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = checkRateLimit(`feedback:${user.id}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Zu viele Feedbacks. Bitte später erneut versuchen.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const parsed = FeedbackSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const admin = createAdminClient();
  const role = resolveRole(user);
  const clubId = await resolveUserClubId(admin, user.id);

  const { error } = await admin.from('pilot_feedback').insert({
    user_id: user.id,
    role,
    score: parsed.data.score,
    message: parsed.data.message?.trim() || null,
    context: parsed.data.context?.trim() || null,
    club_id: clubId,
  });

  if (error) {
    console.error('Feedback insert failed:', error.message);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

/** Club admins: recent feedback scores scoped to their clubs (no emails). */
export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const clubIds = await getAdminClubIds(
    admin,
    user.id,
    user.app_metadata?.role as string | undefined
  );

  let query = admin
    .from('pilot_feedback')
    .select('id, role, score, message, context, club_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (clubIds !== 'all') {
    if (clubIds.length === 0) {
      if (new URL(request.url).searchParams.get('format') === 'csv') {
        return new NextResponse('created_at,role,score,context,message\n', {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="cyclesguard-feedback.csv"',
          },
        });
      }
      return NextResponse.json({
        avgScore: null,
        count: 0,
        avgByRole: {},
        items: [],
      });
    }
    query = query.in('club_id', clubIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Feedback list failed:', error.message);
    return NextResponse.json({ error: 'Failed to load feedback' }, { status: 500 });
  }

  const rows = data ?? [];
  const avg =
    rows.length === 0
      ? null
      : Math.round((rows.reduce((s, r) => s + (r.score as number), 0) / rows.length) * 10) / 10;

  const roleBuckets = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const role = String(r.role ?? 'other');
    const prev = roleBuckets.get(role) ?? { sum: 0, n: 0 };
    prev.sum += r.score as number;
    prev.n += 1;
    roleBuckets.set(role, prev);
  }
  const avgByRole: Record<string, number> = {};
  for (const [role, b] of roleBuckets) {
    avgByRole[role] = Math.round((b.sum / b.n) * 10) / 10;
  }

  if (new URL(request.url).searchParams.get('format') === 'csv') {
    const esc = (v: string) => `"${v.replaceAll('"', '""')}"`;
    const header = 'created_at,role,score,context,message\n';
    const body = rows
      .map((r) =>
        [
          r.created_at ?? '',
          r.role ?? '',
          String(r.score ?? ''),
          (r.context as string | null) ?? '',
          (r.message as string | null) ?? '',
        ]
          .map((c) => esc(String(c)))
          .join(',')
      )
      .join('\n');
    return new NextResponse(header + body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="cyclesguard-feedback.csv"',
      },
    });
  }

  return NextResponse.json({
    avgScore: avg,
    count: rows.length,
    avgByRole,
    items: rows.map((r) => ({
      id: r.id,
      role: r.role,
      score: r.score,
      message: r.message,
      context: r.context,
      createdAt: r.created_at,
    })),
  });
}
