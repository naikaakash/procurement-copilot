import { NextRequest } from 'next/server';
import { getPendingReminders, getSentReminders } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const pending = await getPendingReminders();
    const sent = await getSentReminders();
    return Response.json({ success: true, pending, sent });
  } catch (e: any) {
    console.error('Failed to get pending reminders:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
