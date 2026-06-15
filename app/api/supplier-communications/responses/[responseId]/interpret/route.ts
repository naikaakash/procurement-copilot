/**
 * POST /api/supplier-communications/responses/[responseId]/interpret
 *
 * Adds structured interpretation to an existing supplier response.
 * Transitions the response status to INTERPRETED.
 *
 * Body: SupplierResponseInterpretationInput & { expectedVersion: number }
 *
 * Phase 8C: Supplier Reminder & Response Mock Capture
 */
import { NextRequest } from 'next/server';
import { interpretResponse } from '@/src/services/supplierCommunicationService';
import {
  SupplierCommunicationValidationError,
  SupplierCommunicationConflictError,
  SupplierCommunicationStateError,
  SupplierResponseNotFoundError,
} from '@/src/types/supplierCommunications';
import type { SupplierResponseInterpretationInput } from '@/src/types/supplierCommunications';

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

    let body: Partial<SupplierResponseInterpretationInput> & { expectedVersion?: number };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (body.expectedVersion === undefined || body.expectedVersion === null) {
      return Response.json({ error: 'expectedVersion is required' }, { status: 400 });
    }
    if (!body.responseCategory) {
      return Response.json({ error: 'Missing required field: responseCategory' }, { status: 400 });
    }
    if (!body.interpretedSummary?.trim()) {
      return Response.json({ error: 'Missing required field: interpretedSummary' }, { status: 400 });
    }

    const updated = await interpretResponse(
      responseId,
      body as SupplierResponseInterpretationInput,
      body.expectedVersion
    );
    return Response.json(updated);
  } catch (e) {
    if (e instanceof SupplierResponseNotFoundError) {
      return Response.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof SupplierCommunicationConflictError) {
      return Response.json({ error: e.message, expectedVersion: e.expectedVersion, currentVersion: e.currentVersion }, { status: 409 });
    }
    if (e instanceof SupplierCommunicationValidationError) {
      return Response.json({ error: e.message, field: e.field }, { status: 400 });
    }
    if (e instanceof SupplierCommunicationStateError) {
      return Response.json({ error: e.message }, { status: 409 });
    }
    console.error('[POST /api/supplier-communications/responses/[responseId]/interpret] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
