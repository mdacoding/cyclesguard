import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin, isTrainer } from '@/lib/supabase/admin';
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

  const role = resolveRole(user);
  const { error } = await supabase.from('pilot_feedback').insert({
    user_id: user.id,
    role,
    score: parsed.data.score,
    message: parsed.data.message?.trim() || null,
    context: parsed.data.context?.trim() || null,
  });

  if (error) {
    console.error('Feedback insert failed:', error.message);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

/** Club admins: recent feedback scores (no emails — privacy-safe ops view). */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('pilot_feedback')
    .select('id, role, score, message, context, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Feedback list failed:', error.message);
    return NextResponse.json({ error: 'Failed to load feedback' }, { status: 500 });
  }

  const rows = data ?? [];
  const avg =
    rows.length === 0
      ? null
      : Math.round((rows.reduce((s, r) => s + (r.score as number), 0) / rows.length) * 10) / 10;

  return NextResponse.json({
    avgScore: avg,
    count: rows.length,
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
