/**
 * GET /api/po-overdue/detail
 * Returns full detail context for a single PO schedule line (drawer panel).
 * Phase 6A: migrated from csvDataService → procurementDataService.
 * Phase 7A: extended with optional `actions` field (app-owned workflow actions).
 *           All existing response fields are unchanged. `actions` is additive only.
 */
import { NextRequest } from 'next/server';
import { getPurchaseOrderLineDetailRaw } from '@/src/services/procurementDataService';
import { getActionsForPurchaseOrderLine } from '@/src/services/procurementActionService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const poNumber = searchParams.get('po_number');
    const itemNumber = searchParams.get('item_number');
    const scheduleLine = searchParams.get('schedule_line') || '0001';

    if (!poNumber || !itemNumber) {
      return Response.json(
        { error: 'Missing required parameters: po_number, item_number' },
        { status: 400 }
      );
    }

    // Run ERP detail read and app-owned action read concurrently
    const [detail, actions] = await Promise.all([
      getPurchaseOrderLineDetailRaw(poNumber, itemNumber, scheduleLine),
      getActionsForPurchaseOrderLine(poNumber, itemNumber),
    ]);

    if (!detail) {
      return Response.json(
        { error: `PO Line ${poNumber}/${itemNumber} detail not found` },
        { status: 404 }
      );
    }

    // Merge: all existing ERP fields preserved, `actions` appended as new field.
    // Frontend components that don't read `actions` are unaffected.
    return Response.json({ ...detail, actions });
  } catch (e) {
    console.error('Failed to get overdue line detail:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
