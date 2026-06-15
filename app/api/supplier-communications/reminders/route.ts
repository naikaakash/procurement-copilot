/**
 * GET  /api/supplier-communications/reminders       — List reminders with optional filters
 * POST /api/supplier-communications/reminders       — Create and send a new supplier reminder
 *
 * Phase 8C: Supplier Reminder & Response Mock Capture
 * Does NOT import csvDataService, SAP, or touch any ERP system.
 * Does NOT send real emails.
 */
import { NextRequest } from 'next/server';
import {
  listReminders,
  createReminder,
} from '@/src/services/supplierCommunicationService';
import {
  SupplierCommunicationValidationError,
} from '@/src/types/supplierCommunications';
import type {
  SupplierReminderInput,
  SupplierReminderStatus,
} from '@/src/types/supplierCommunications';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/supplier-communications/reminders
// Optional filters: status, supplierId, purchaseOrderNumber, recommendationId, limit, offset
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const filters = {
      status: (searchParams.get('status') as SupplierReminderStatus) || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
      purchaseOrderNumber: searchParams.get('purchaseOrderNumber') || undefined,
      recommendationId: searchParams.get('recommendationId') || undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
    };

    const reminders = await listReminders(filters);
    return Response.json({ reminders, total: reminders.length });
  } catch (e) {
    console.error('[GET /api/supplier-communications/reminders] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/supplier-communications/reminders
// Body (JSON): SupplierReminderInput
// Side effect: transitions linked recommendation to PENDING_SUPPLIER_RESPONSE
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    let body: Partial<SupplierReminderInput>;
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
      'subject',
      'bodyText',
    ] as const;

    for (const field of required) {
      if (!body[field]) {
        return Response.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const result = await createReminder(body as SupplierReminderInput);
    return Response.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof SupplierCommunicationValidationError) {
      return Response.json({ error: e.message, field: e.field }, { status: 400 });
    }
    console.error('[POST /api/supplier-communications/reminders] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
