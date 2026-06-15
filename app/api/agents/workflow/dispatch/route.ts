import { NextRequest } from 'next/server';
import { batchDispatchPipeline } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ids = body.ids || [];
    if (!Array.isArray(ids)) {
      return Response.json({ error: 'ids must be an array of strings' }, { status: 400 });
    }

    const success = await batchDispatchPipeline(ids);
    return Response.json({ success });
  } catch (e: any) {
    console.error('Failed to dispatch pipeline items:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
