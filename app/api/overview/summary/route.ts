/**
 * GET /api/overview/summary
 * Returns global portfolio KPI snapshot.
 * Phase 6A: migrated from csvDataService → procurementDataService.
 */
import { getGlobalOverviewSummaryRaw } from '@/src/services/procurementDataService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getGlobalOverviewSummaryRaw();
    return Response.json(data);
  } catch (error: any) {
    console.error('Failed to get global overview summary:', error);
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
