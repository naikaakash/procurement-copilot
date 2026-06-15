import { NextRequest } from 'next/server';
import { runMultiAgentSweep } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const plant = body.plant || undefined;
    const buyer = body.buyer || undefined;
    const autoSend = !!body.autoSend;

    await runMultiAgentSweep({ plant, buyer, autoSend });
    return Response.json({ success: true });
  } catch (e: any) {
    console.error('Failed to run multi-agent sweep:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
