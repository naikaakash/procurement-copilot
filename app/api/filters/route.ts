/**
 * GET /api/filters
 * Returns plant/supplier/purchasing group/material group dropdown options.
 * Phase 6A: migrated from csvDataService → procurementDataService.
 */
import { NextRequest } from 'next/server';
import { getFilterOptionsRaw } from '@/src/services/procurementDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const filters = await getFilterOptionsRaw();
    return Response.json(filters);
  } catch (e) {
    console.error('Failed to get filter options:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
