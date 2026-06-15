/**
 * GET /api/po-acknowledgement/summary
 * Returns supplier acknowledgement tile KPIs.
 * Phase 6A: migrated from csvDataService → procurementDataService.
 */
import { getAcknowledgementSummaryRaw } from '@/src/services/procurementDataService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getAcknowledgementSummaryRaw();
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to aggregate acknowledgement summary.' }, { status: 500 });
  }
}
