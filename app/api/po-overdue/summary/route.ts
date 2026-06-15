/**
 * GET /api/po-overdue/summary
 *
 * Returns overdue PO tile metrics (KPI summary).
 *
 * Phase 5 migration: now calls procurementDataService instead of importing
 * csvDataService directly. This validates the full service chain:
 *   API Route → procurementDataService → mockErpService → csvDataService → CSV
 *
 * Response shape is identical to pre-Phase 5 (OverdueSummary from csvDataService).
 */
import { NextRequest } from 'next/server';
import { getOverdueSummaryMetrics } from '@/src/services/procurementDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const summary = await getOverdueSummaryMetrics();
    return Response.json(summary);
  } catch (e) {
    console.error('Failed to get overdue summary:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
