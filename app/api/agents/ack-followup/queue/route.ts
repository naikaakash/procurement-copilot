import { NextRequest } from 'next/server';
import { getAckFollowUpQueue } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const daysStr = searchParams.get('days');
    const days = daysStr ? parseInt(daysStr, 10) : 3;

    const { queue, sent } = await getAckFollowUpQueue(days);
    return Response.json({ success: true, queue, sent });
  } catch (e: any) {
    console.error('Failed to get ack follow-up queue:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
