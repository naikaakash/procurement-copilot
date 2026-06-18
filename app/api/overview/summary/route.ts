/**
 * GET /api/overview/summary
 * Returns global portfolio KPI snapshot.
 * Phase 6A: migrated from csvDataService → procurementDataService.
 */
import { getGlobalOverviewSummaryRaw } from '@/src/services/procurementDataService';
import { clearCache } from '@/src/services/data/csvDataService';
import { reloadFromDisk as reloadRecs } from '@/src/services/mockRecommendationStore';
import { reloadFromDisk as reloadActions } from '@/src/services/mockActionStore';
import { reloadFromDisk as reloadComms } from '@/src/services/mockSupplierCommunicationStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Invalidate in-memory caches and reload JSON stores from disk on refresh
    clearCache();
    reloadRecs();
    reloadActions();
    reloadComms();

    const data = await getGlobalOverviewSummaryRaw();
    return Response.json(data);
  } catch (error: any) {
    console.error('Failed to get global overview summary:', error);
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
