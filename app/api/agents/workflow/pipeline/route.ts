import { NextRequest } from 'next/server';
import { getMultiAgentPipeline } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const plant = searchParams.get('plant') || undefined;
    const buyer = searchParams.get('buyer') || undefined;

    const result = await getMultiAgentPipeline({ plant, buyer });
    return Response.json({ success: true, ...result });
  } catch (e: any) {
    console.error('Failed to get multi-agent pipeline:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
