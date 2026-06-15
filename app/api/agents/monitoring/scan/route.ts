import { NextRequest } from 'next/server';
import { runSupervisorScan } from '@/src/services/data/autonomousMonitoringService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const anomalies = await runSupervisorScan();
    return Response.json({ success: true, anomalies });
  } catch (e: any) {
    console.error('Failed to trigger supervisor scan:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
