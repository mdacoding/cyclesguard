import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CycleLogSchema } from '@/lib/validations';

function berlinDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = CycleLogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.format() },
        { status: 400 }
      );
    }

    const { phase, symptoms, notes, energyLevel, clientLogId } = result.data;

    if (clientLogId) {
      const { data: existing } = await supabase
        .from('cycle_logs')
        .select('*')
        .eq('client_log_id', clientLogId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(existing, { status: 200 });
      }
    }

    const todayBerlin = berlinDate(new Date());
    const { data: recentLogs } = await supabase
      .from('cycle_logs')
      .select('id, logged_at')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(5);

    const sameDay = (recentLogs ?? []).find((log) => berlinDate(log.logged_at) === todayBerlin);

    const payload = {
      user_id: user.id,
      phase,
      symptoms,
      notes: notes ?? null,
      energy_level: energyLevel ?? null,
      client_log_id: clientLogId ?? null,
      logged_at: new Date().toISOString(),
    };

    if (sameDay?.id) {
      const { data, error } = await supabase
        .from('cycle_logs')
        .update(payload)
        .eq('id', sameDay.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json({ error: 'Failed to save cycle log' }, { status: 500 });
      }
      return NextResponse.json(data, { status: 200 });
    }

    const { data, error } = await supabase
      .from('cycle_logs')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' && clientLogId) {
        const { data: raced } = await supabase
          .from('cycle_logs')
          .select('*')
          .eq('client_log_id', clientLogId)
          .maybeSingle();
        if (raced) return NextResponse.json(raced, { status: 200 });
      }
      console.error('Supabase insertion error:', error);
      return NextResponse.json({ error: 'Failed to save cycle log' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
