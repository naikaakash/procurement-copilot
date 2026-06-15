import { NextRequest } from 'next/server';
import { updateCoordinationAlert } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { alertId, status, notes, action } = body;

    if (!alertId) {
      return Response.json({ error: 'Missing alertId parameter.' }, { status: 400 });
    }

    const success = await updateCoordinationAlert(
      alertId,
      status || 'UNRESOLVED',
      notes || '',
      action || 'NONE'
    );

    return Response.json({ success });
  } catch (e: any) {
    console.error('Failed to update coordination alert:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
