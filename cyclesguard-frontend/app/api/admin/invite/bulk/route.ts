import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient, isClubAdmin } from '@/lib/supabase/admin';
import { assertClubScope } from '@/lib/admin-scope';
import { adminInviteOrRosterAdd, parseInviteCsv } from '@/lib/admin-invite';

const BulkJsonSchema = z.object({
  teamId: z.string().uuid(),
  rows: z
    .array(
      z.object({
        email: z.string().email(),
        fullName: z.string().min(1).max(100).optional(),
        role: z.enum(['player', 'trainer']).default('player'),
      })
    )
    .min(1)
    .max(100),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isClubAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const contentType = request.headers.get('content-type') ?? '';
  let teamId: string;
  let rows: { email: string; fullName?: string; role: 'player' | 'trainer' }[];
  let parseErrors: string[] = [];

  if (contentType.includes('multipart/form-data') || contentType.includes('text/csv')) {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const team = form.get('teamId');
      const file = form.get('file');
      if (typeof team !== 'string') {
        return NextResponse.json({ error: 'teamId required' }, { status: 400 });
      }
      teamId = team;
      const text =
        typeof file === 'string'
          ? file
          : file && typeof (file as Blob).text === 'function'
            ? await (file as Blob).text()
            : '';
      const parsed = parseInviteCsv(text);
      rows = parsed.rows;
      parseErrors = parsed.errors;
    } else {
      teamId = new URL(request.url).searchParams.get('teamId') ?? '';
      if (!teamId) return NextResponse.json({ error: 'teamId query required' }, { status: 400 });
      const parsed = parseInviteCsv(await request.text());
      rows = parsed.rows;
      parseErrors = parsed.errors;
    }
  } else {
    const parsed = BulkJsonSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    teamId = parsed.data.teamId;
    rows = parsed.data.rows;
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'Keine gültigen Zeilen', parseErrors },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const scoped = await assertClubScope(
    admin,
    user.id,
    teamId,
    user.app_metadata?.role as string | undefined
  );
  if (!scoped) return NextResponse.json({ error: 'Team not in your scope' }, { status: 403 });

  const results = [];
  let okCount = 0;
  for (const row of rows) {
    const result = await adminInviteOrRosterAdd(admin, {
      email: row.email,
      teamId,
      fullName: row.fullName,
      role: row.role,
      actorId: user.id,
    });
    if (result.ok) okCount += 1;
    results.push(result);
  }

  await admin.from('admin_audit_log').insert({
    actor_id: user.id,
    action: 'admin_bulk_invite',
    metadata: {
      team_id: teamId,
      total: rows.length,
      ok: okCount,
      parse_errors: parseErrors.length,
    },
  });

  return NextResponse.json({
    ok: okCount,
    failed: results.length - okCount,
    parseErrors,
    results,
  });
}
