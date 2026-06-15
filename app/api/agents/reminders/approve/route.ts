import { NextRequest } from 'next/server';
import { approveReminder, updateEscalationStatus } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recommendationId, subject, message } = body;

    if (!recommendationId) {
      return Response.json({ error: 'Missing recommendationId parameter.' }, { status: 400 });
    }

    let success = false;
    if (recommendationId.startsWith('ESC_')) {
      success = await updateEscalationStatus(recommendationId, 'APPROVED', subject || '', message || '');
    } else {
      success = await approveReminder(recommendationId, subject || '', message || '');
    }

    if (success) {
      return Response.json({ success: true, message: `Item ${recommendationId} approved.` });
    } else {
      return Response.json({ error: 'Item not found.' }, { status: 404 });
    }
  } catch (e: any) {
    console.error('Failed to approve reminder:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
