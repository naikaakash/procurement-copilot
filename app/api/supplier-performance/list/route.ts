/**
 * GET /api/supplier-performance/list
 * Returns supplier analytics scorecard list.
 * Phase 6A: migrated from csvDataService → procurementDataService.
 */
import { NextRequest } from 'next/server';
import { getSupplierAnalyticsRaw } from '@/src/services/procurementDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') || '';
    const tier = searchParams.get('tier') || '';
    const riskLevel = searchParams.get('riskLevel') || '';
    const blocked = searchParams.get('blocked') || '';
    const sortBy = searchParams.get('sortBy') || '';

    const list = await getSupplierAnalyticsRaw({
      search,
      tier,
      riskLevel,
      blocked,
      sortBy
    });

    return Response.json(list);
  } catch (e: any) {
    console.error('Failed to get supplier performance list:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
