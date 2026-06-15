/**
 * GET /api/actions/open
 * Returns all open (OPEN + IN_PROGRESS) app-owned actions.
 *
 * Optional query params:
 *   supplierId           — filter by supplier
 *   purchaseOrderNumber  — filter by PO number
 *   assignedTo           — filter by assigned buyer user ID
 *   sourceModule         — filter by originating module
 *   limit                — max records to return (default 100)
 *   offset               — pagination offset (default 0)
 *
 * Phase 7A: App-Owned Action Layer. No csvDataService. No SAP.
 */
import { NextRequest } from 'next/server';
import { listOpenActions } from '@/src/services/procurementActionService';
import type { ActionListFilters } from '@/src/types/procurementActions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const limitStr = searchParams.get('limit');
    const offsetStr = searchParams.get('offset');

    const filters: Omit<ActionListFilters, 'actionStatus'> = {
      supplierId: searchParams.get('supplierId') || undefined,
      purchaseOrderNumber: searchParams.get('purchaseOrderNumber') || undefined,
      purchaseOrderItem: searchParams.get('purchaseOrderItem') || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      limit: limitStr ? parseInt(limitStr, 10) : 100,
      offset: offsetStr ? parseInt(offsetStr, 10) : 0,
    };

    const actions = await listOpenActions(filters);
    return Response.json({ actions, total: actions.length });
  } catch (e) {
    console.error('[GET /api/actions/open] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
