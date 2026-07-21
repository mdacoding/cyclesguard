import { NextResponse } from 'next/server';
import { sendDailyReminders } from '@/lib/push/send';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
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
