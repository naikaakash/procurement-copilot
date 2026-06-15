/**
 * POST /api/supplier-communications/responses/[responseId]/action
 *
 * Marks a supplier response as ACTIONED — the buyer has taken action based on this response.
 *
 * Body: { expectedVersion: number; actionedBy?: string }
 *
 * Phase 8C: Supplier Reminder & Response Mock Capture
 */
import { NextRequest } from 'next/server';
import { markResponseActioned } from '@/src/services/supplierCommunicationService';
import {
  SupplierCommunicationConflictError,
  SupplierCommunicationStateError,
  SupplierResponseNotFoundError,
} from '@/src/types/supplierCommunications';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
) {
  try {
    const { responseId } = await params;
    if (!responseId?.trim()) {
      return Response.json({ error: 'responseId is required' }, { status: 400 });
    }

    let body: { expectedVersion?: number; actionedBy?: string };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (body.expectedVersion === undefined || body.expectedVersion === null) {
      return Response.json({ error: 'expectedVersion is required' }, { status: 400 });
    }

    const updated = await markResponseActioned(responseId, body.expectedVersion, body.actionedBy);
    return Response.json(updated);
  } catch (e) {
    if (e instanceof SupplierResponseNotFoundError) {
      return Response.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof SupplierCommunicationConflictError) {
      return Response.json({ error: e.message, expectedVersion: e.expectedVersion, currentVersion: e.currentVersion }, { status: 409 });
    }
    if (e instanceof SupplierCommunicationStateError) {
      return Response.json({ error: e.message }, { status: 409 });
    }
    console.error('[POST /api/supplier-communications/responses/[responseId]/action] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
