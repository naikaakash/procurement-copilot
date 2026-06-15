import { NextRequest } from 'next/server';
import { getEscalationTriggers } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { triggers, history } = await getEscalationTriggers();
    return Response.json({ success: true, triggers, history });
  } catch (e: any) {
    console.error('Failed to get escalation triggers:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
