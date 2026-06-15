/**
 * GET /api/actions/po-line
 * Returns all app-owned actions for a specific PO line.
 *
 * Required query params:
 *   purchaseOrderNumber  — e.g. "4500000437"
 *   purchaseOrderItem    — e.g. "00040"
 *
 * Phase 7A: App-Owned Action Layer. No csvDataService. No SAP.
 */
import { NextRequest } from 'next/server';
import { getActionsForPurchaseOrderLine } from '@/src/services/procurementActionService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const purchaseOrderNumber = searchParams.get('purchaseOrderNumber');
    const purchaseOrderItem = searchParams.get('purchaseOrderItem');

    if (!purchaseOrderNumber || !purchaseOrderItem) {
      return Response.json(
        { error: 'Missing required query params: purchaseOrderNumber, purchaseOrderItem' },
        { status: 400 }
      );
    }

    const actions = await getActionsForPurchaseOrderLine(purchaseOrderNumber, purchaseOrderItem);
    return Response.json({ actions, total: actions.length });
  } catch (e) {
    console.error('[GET /api/actions/po-line] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
