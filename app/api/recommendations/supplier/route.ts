/**
 * GET /api/recommendations/supplier — Query recommendations by supplierId
 *
 * Phase 8B: Backend Setup
 * Query parameter (required): supplierId
 * Does NOT import csvDataService, SAP, or touch any ERP system.
 */
import { NextRequest } from 'next/server';
import {
  getRecommendationsForSupplier,
} from '@/src/services/recommendationService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const supplierId = searchParams.get('supplierId');

    if (!supplierId?.trim()) {
      return Response.json({ error: 'Missing required query parameter: supplierId' }, { status: 400 });
    }

    const recommendations = await getRecommendationsForSupplier(supplierId);

    return Response.json({ recommendations, total: recommendations.length });
  } catch (e) {
    console.error('[GET /api/recommendations/supplier] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
