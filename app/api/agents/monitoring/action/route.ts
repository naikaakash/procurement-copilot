import { NextRequest } from 'next/server';
import { resolveAnomaly } from '@/src/services/data/autonomousMonitoringService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = body.id;
    const action = body.action; // 'resolve'

    if (!id) {
      return Response.json({ error: 'Missing anomaly id parameter.' }, { status: 400 });
    }

    let success = false;
    if (action === 'resolve') {
      success = await resolveAnomaly(id);
    }

    return Response.json({ success });
  } catch (e: any) {
    console.error('Failed to update anomaly action:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
