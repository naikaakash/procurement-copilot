/**
 * GET /api/supplier-performance/detail
 * Returns full supplier scorecard detail for drawer panel.
 * Phase 6A: migrated from csvDataService → procurementDataService.
 */
import { NextRequest } from 'next/server';
import { getSupplierDetailRaw } from '@/src/services/procurementDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const supplierId = searchParams.get('supplier_id') || '';

    if (!supplierId) {
      return Response.json({ error: 'Missing supplier_id parameter.' }, { status: 400 });
    }

    const detail = await getSupplierDetailRaw(supplierId);

    if (!detail) {
      return Response.json({ error: 'Supplier not found.' }, { status: 404 });
    }

    return Response.json(detail);
  } catch (e: any) {
    console.error('Failed to get supplier performance detail:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
