import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin } from '@/lib/supabase/admin';
import { assertClubScope } from '@/lib/admin-scope';
import { adminInviteOrRosterAdd } from '@/lib/admin-invite';

const InviteSchema = z.object({
  email: z.string().email(),
  teamId: z.string().uuid(),
  fullName: z.string().min(1).max(100).optional(),
  role: z.enum(['player', 'trainer']).default('player'),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = InviteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
  }

  const admin = createAdminClient();
  const scoped = await assertClubScope(
    admin,
    user.id,
    parsed.data.teamId,
    user.app_metadata?.role as string | undefined
  );
  if (!scoped) return NextResponse.json({ error: 'Team not in your scope' }, { status: 403 });

  const result = await adminInviteOrRosterAdd(admin, {
    email: parsed.data.email,
    teamId: parsed.data.teamId,
    fullName: parsed.data.fullName,
    role: parsed.data.role,
    actorId: user.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      success: true,
      userId: result.userId,
      mode: result.mode,
      message: result.message,
    },
    { status: result.status }
  );
}
