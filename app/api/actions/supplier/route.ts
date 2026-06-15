/**
 * GET /api/actions/supplier
 * Returns all app-owned actions for a specific supplier.
 *
 * Required query params:
 *   supplierId  — e.g. "VEND-001"
 *
 * Phase 7A: App-Owned Action Layer. No csvDataService. No SAP.
 */
import { NextRequest } from 'next/server';
import { getActionsForSupplier } from '@/src/services/procurementActionService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const supplierId = searchParams.get('supplierId');

    if (!supplierId) {
      return Response.json(
        { error: 'Missing required query param: supplierId' },
        { status: 400 }
      );
    }

    const actions = await getActionsForSupplier(supplierId);
    return Response.json({ actions, total: actions.length });
  } catch (e) {
    console.error('[GET /api/actions/supplier] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
