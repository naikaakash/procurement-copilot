import { NextRequest } from 'next/server';
import { syncErpScheduleLine } from '@/src/services/data/csvDataService';
import { verifyOpenRecommendationsAfterSync } from '@/src/services/recommendationVerificationService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { po_number, item_number } = body;

    if (!po_number || !item_number) {
      return Response.json({ error: 'Missing po_number or item_number parameter.' }, { status: 400 });
    }

    const success = await syncErpScheduleLine(po_number, item_number);
    if (success) {
      // Run verification checks on pending recommendations after successful sync
      try {
        await verifyOpenRecommendationsAfterSync();
      } catch (verifError) {
        console.error('[sync-erp] Post-sync verification hook failed:', verifError);
      }
      
      return Response.json({ success: true, message: `Successfully synchronized ERP schedule line for PO ${po_number} Line ${item_number}.` });
    } else {
      return Response.json({ error: 'Failed to synchronize ERP schedule line.' }, { status: 500 });
    }
  } catch (e: any) {
    console.error('Failed to sync ERP:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
