/**
 * GET /api/po-acknowledgement/worklist
 * Returns paginated, filtered supplier acknowledgement worklist.
 * Phase 6A: migrated from csvDataService → procurementDataService.
 */
import { NextRequest } from 'next/server';
import { getAcknowledgementWorklistRaw } from '@/src/services/procurementDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const plant = searchParams.get('plant') || undefined;
    const supplier = searchParams.get('supplier') || undefined;
    const purchasingGroup = searchParams.get('purchasingGroup') || undefined;
    const acknowledgementStatus = searchParams.get('acknowledgementStatus') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;

    const limitStr = searchParams.get('limit');
    const limit = limitStr ? parseInt(limitStr, 10) : 50;

    const offsetStr = searchParams.get('offset');
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    const worklist = await getAcknowledgementWorklistRaw({
      plant,
      supplier,
      purchasingGroup,
      acknowledgementStatus,
      search,
      limit,
      offset,
      sortBy
    });

    return Response.json(worklist);
  } catch (e) {
    console.error('Failed to get acknowledgement worklist:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
