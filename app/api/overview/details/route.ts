/**
 * GET /api/overview/details
 * Returns dashboard chart data (spend by supplier/plant/category, risk, recent POs).
 * Phase 6A: migrated from csvDataService → procurementDataService.
 */
import { getDashboardOverviewDetailsRaw } from '@/src/services/procurementDataService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getDashboardOverviewDetailsRaw();
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to aggregate procurement overview.' }, { status: 500 });
  }
}
