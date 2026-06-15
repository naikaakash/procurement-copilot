import { NextRequest } from 'next/server';
import { updateEscalationStatus } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escalationIds, subject, message } = body;

    if (!escalationIds || !Array.isArray(escalationIds)) {
      return Response.json({ error: 'Missing or invalid escalationIds parameter. Must be an array of strings.' }, { status: 400 });
    }

    const results = [];
    for (const id of escalationIds) {
      const passSubject = escalationIds.length === 1 ? subject : undefined;
      const passMessage = escalationIds.length === 1 ? message : undefined;

      const success = await updateEscalationStatus(id, 'ESCALATED', passSubject, passMessage);
      results.push({ id, success });
    }

    return Response.json({ success: true, results });
  } catch (e: any) {
    console.error('Failed to escalate items:', e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
