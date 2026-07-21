import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function hashIp(ip: string): string {
  const salt = process.env.CONSENT_IP_SALT ?? 'cyclesguard-consent-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip');
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = clientIp(request);
    const ipHash = ip ? hashIp(ip) : null;

    const now = new Date().toISOString();
    const { error: dbError } = await supabase.from('player_consents').upsert(
      {
        user_id: user.id,
        health_data_consent_at: now,
        terms_accepted_at: now,
        ip_address_hashed: ipHash,
      },
      { onConflict: 'user_id' }
    );

    if (dbError) {
      console.error('Failed to log consent:', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: { has_consented: true },
    });

    if (authError) {
      console.error('Failed to update metadata:', authError);
      return NextResponse.json({ error: 'Auth error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Consent error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
