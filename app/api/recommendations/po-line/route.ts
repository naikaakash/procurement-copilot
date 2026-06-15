/**
 * GET /api/recommendations/po-line — Query recommendations by PO line
 *
 * Phase 8B: Backend Setup
 * Query parameters (required): purchaseOrderNumber, purchaseOrderItem
 * Does NOT import csvDataService, SAP, or touch any ERP system.
 */
import { NextRequest } from 'next/server';
import {
  getRecommendationsForPurchaseOrderLine,
} from '@/src/services/recommendationService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const purchaseOrderNumber = searchParams.get('purchaseOrderNumber');
    const purchaseOrderItem = searchParams.get('purchaseOrderItem');

    if (!purchaseOrderNumber?.trim()) {
      return Response.json({ error: 'Missing required query parameter: purchaseOrderNumber' }, { status: 400 });
    }
    if (!purchaseOrderItem?.trim()) {
      return Response.json({ error: 'Missing required query parameter: purchaseOrderItem' }, { status: 400 });
    }

    const recommendations = await getRecommendationsForPurchaseOrderLine(
      purchaseOrderNumber,
      purchaseOrderItem
    );

    return Response.json({ recommendations, total: recommendations.length });
  } catch (e) {
    console.error('[GET /api/recommendations/po-line] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
