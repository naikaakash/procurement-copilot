import { NextRequest } from 'next/server';
import { startMonitoringSupervisor, stopMonitoringSupervisor } from '@/src/services/data/autonomousMonitoringService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const active = !!body.active;
    const interval = body.scanInterval ? parseInt(body.scanInterval, 10) : 30;

    if (active) {
      await startMonitoringSupervisor(interval);
    } else {
      await stopMonitoringSupervisor();
    }

    return Response.json({ success: true });
  } catch (e: any) {
    console.error('Failed to toggle supervisor:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
