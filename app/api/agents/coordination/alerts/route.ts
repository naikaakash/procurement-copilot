import { NextRequest } from 'next/server';
import { getCoordinationAlerts } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { active, history } = await getCoordinationAlerts();
    return Response.json({ success: true, active, history });
  } catch (e: any) {
    console.error('Failed to get coordination alerts:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
