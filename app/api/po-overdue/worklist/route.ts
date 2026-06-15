/**
 * GET /api/po-overdue/worklist
 * Returns paginated, filtered overdue PO schedule-line worklist.
 * Phase 6A: migrated from csvDataService → procurementDataService.
 */
import { NextRequest } from 'next/server';
import { getOverdueWorklistRaw } from '@/src/services/procurementDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const plant = searchParams.get('plant') || undefined;
    const supplier = searchParams.get('supplier') || undefined;
    const purchasingGroup = searchParams.get('purchasingGroup') || undefined;
    const materialGroup = searchParams.get('materialGroup') || undefined;
    const delayCategory = searchParams.get('delayCategory') || undefined;
    const dateMin = searchParams.get('dateMin') || undefined;
    const dateMax = searchParams.get('dateMax') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;

    const overdueDaysMinStr = searchParams.get('overdueDaysMin');
    const overdueDaysMin = overdueDaysMinStr ? parseInt(overdueDaysMinStr, 10) : undefined;

    const overdueDaysMaxStr = searchParams.get('overdueDaysMax');
    const overdueDaysMax = overdueDaysMaxStr ? parseInt(overdueDaysMaxStr, 10) : undefined;

    const limitStr = searchParams.get('limit');
    const limit = limitStr ? parseInt(limitStr, 10) : 50;

    const offsetStr = searchParams.get('offset');
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    const worklist = await getOverdueWorklistRaw({
      plant,
      supplier,
      purchasingGroup,
      materialGroup,
      delayCategory,
      overdueDaysMin,
      overdueDaysMax,
      dateMin,
      dateMax,
      search,
      limit,
      offset,
      sortBy
    });

    return Response.json(worklist);
  } catch (e) {
    console.error('Failed to get overdue worklist:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
