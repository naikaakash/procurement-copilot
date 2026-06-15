import { NextRequest } from 'next/server';
import { markReminderSent } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recommendationIds } = body;

    if (!recommendationIds || !Array.isArray(recommendationIds)) {
      return Response.json({ error: 'Missing or invalid recommendationIds parameter. Must be an array of strings.' }, { status: 400 });
    }

    const results = [];
    for (const id of recommendationIds) {
      const success = await markReminderSent(id);
      results.push({ id, success });
    }

    return Response.json({ success: true, results });
  } catch (e: any) {
    console.error('Failed to send reminders:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
