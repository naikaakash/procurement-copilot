import { NextRequest } from 'next/server';
import { getSupervisorState, getAnomalies, getMonitoringLogs } from '@/src/services/data/autonomousMonitoringService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supervisor = await getSupervisorState();
    const anomalies = await getAnomalies();
    const logs = await getMonitoringLogs();

    return Response.json({
      success: true,
      supervisor,
      anomalies,
      logs
    });
  } catch (e: any) {
    console.error('Failed to get monitoring state:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
