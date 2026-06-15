import { NextRequest } from 'next/server';
import { getPartMrpTimeline } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const materialId = searchParams.get('material_id');
    const plant = searchParams.get('plant');

    if (!materialId || !plant) {
      return Response.json({ error: 'Missing material_id or plant parameter.' }, { status: 400 });
    }

    const mrpTimeline = await getPartMrpTimeline(materialId, plant);
    return Response.json(mrpTimeline);
  } catch (e) {
    console.error('Failed to get part MRP timeline:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
