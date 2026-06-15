/**
 * GET /api/supplier-communications/responses/[responseId]  — Get a single response by ID
 *
 * Sub-actions (interpret, action, dismiss) are handled in nested route files:
 *   app/api/supplier-communications/responses/[responseId]/interpret/route.ts
 *   app/api/supplier-communications/responses/[responseId]/action/route.ts
 *   app/api/supplier-communications/responses/[responseId]/dismiss/route.ts
 *
 * Phase 8C: Supplier Reminder & Response Mock Capture
 */
import { NextRequest } from 'next/server';
import { getResponseById } from '@/src/services/supplierCommunicationService';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/supplier-communications/responses/[responseId]
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
) {
  try {
    const { responseId } = await params;
    if (!responseId?.trim()) {
      return Response.json({ error: 'responseId is required' }, { status: 400 });
    }
    const response = await getResponseById(responseId);
    if (!response) {
      return Response.json({ error: `Response "${responseId}" not found` }, { status: 404 });
    }
    return Response.json(response);
  } catch (e) {
    console.error('[GET /api/supplier-communications/responses/[responseId]] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
