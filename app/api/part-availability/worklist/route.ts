import { NextRequest } from 'next/server';
import { getPartWorklist } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    
    const plant = searchParams.get('plant') || undefined;
    const riskBucket = searchParams.get('riskBucket') || undefined;
    
    const horizonStr = searchParams.get('horizon');
    const horizon = horizonStr ? parseInt(horizonStr, 10) : undefined;
    
    const search = searchParams.get('search') || undefined;
    
    const limitStr = searchParams.get('limit');
    const limit = limitStr ? parseInt(limitStr, 10) : 50;

    const offsetStr = searchParams.get('offset');
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    const worklist = await getPartWorklist({
      plant,
      riskBucket,
      horizon,
      search,
      limit,
      offset
    });

    return Response.json(worklist);
  } catch (e) {
    console.error('Failed to get part availability worklist:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
