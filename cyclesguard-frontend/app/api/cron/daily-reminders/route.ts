import { NextResponse } from 'next/server';
import { sendDailyReminders } from '@/lib/push/send';
import { authorizeCron } from '@/lib/cron-auth';

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await sendDailyReminders();
    return NextResponse.json({ ok: true, ...stats });
  } catch (error) {
    console.error('Daily reminder cron failed:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
