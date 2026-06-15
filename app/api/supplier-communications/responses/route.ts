/**
 * GET  /api/supplier-communications/responses       — List responses with optional filters
 * POST /api/supplier-communications/responses       — Capture a new supplier response
 *
 * Phase 8C: Supplier Reminder & Response Mock Capture
 * Does NOT import csvDataService, SAP, or touch any ERP system.
 */
import { NextRequest } from 'next/server';
import {
  listResponses,
  captureResponse,
} from '@/src/services/supplierCommunicationService';
import {
  SupplierCommunicationValidationError,
} from '@/src/types/supplierCommunications';
import type {
  SupplierResponseInput,
  SupplierResponseStatus,
} from '@/src/types/supplierCommunications';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/supplier-communications/responses
// Optional filters: status, supplierId, purchaseOrderNumber, recommendationId, reminderId, limit, offset
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const filters = {
      status: (searchParams.get('status') as SupplierResponseStatus) || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
      purchaseOrderNumber: searchParams.get('purchaseOrderNumber') || undefined,
      recommendationId: searchParams.get('recommendationId') || undefined,
      reminderId: searchParams.get('reminderId') || undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
    };

    const responses = await listResponses(filters);
    return Response.json({ responses, total: responses.length });
  } catch (e) {
    console.error('[GET /api/supplier-communications/responses] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/supplier-communications/responses
// Body (JSON): SupplierResponseInput
// Side effect: transitions linked recommendation to SUPPLIER_RESPONDED
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    let body: Partial<SupplierResponseInput>;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const required = [
      'recommendationId',
      'purchaseOrderNumber',
      'purchaseOrderItem',
      'supplierId',
      'supplierName',
      'rawResponseText',
    ] as const;

    for (const field of required) {
      if (!body[field]) {
        return Response.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const result = await captureResponse(body as SupplierResponseInput);
    return Response.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof SupplierCommunicationValidationError) {
      return Response.json({ error: e.message, field: e.field }, { status: 400 });
    }
    console.error('[POST /api/supplier-communications/responses] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
