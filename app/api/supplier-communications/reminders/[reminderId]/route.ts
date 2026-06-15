/**
 * GET    /api/supplier-communications/reminders/[reminderId]         — Get reminder by ID
 * PATCH  /api/supplier-communications/reminders/[reminderId]         — Update reminder fields
 * DELETE /api/supplier-communications/reminders/[reminderId]         — Cancel a reminder
 *
 * Phase 8C: Supplier Reminder & Response Mock Capture
 */
import { NextRequest } from 'next/server';
import {
  getReminderById,
  updateReminder,
  cancelReminder,
} from '@/src/services/supplierCommunicationService';
import {
  SupplierCommunicationValidationError,
  SupplierCommunicationConflictError,
  SupplierCommunicationStateError,
  SupplierReminderNotFoundError,
} from '@/src/types/supplierCommunications';
import type { SupplierReminderUpdateInput } from '@/src/types/supplierCommunications';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/supplier-communications/reminders/[reminderId]
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reminderId: string }> }
) {
  try {
    const { reminderId } = await params;
    if (!reminderId?.trim()) {
      return Response.json({ error: 'reminderId is required' }, { status: 400 });
    }
    const reminder = await getReminderById(reminderId);
    if (!reminder) {
      return Response.json({ error: `Reminder "${reminderId}" not found` }, { status: 404 });
    }
    return Response.json(reminder);
  } catch (e) {
    console.error('[GET /api/supplier-communications/reminders/[reminderId]] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/supplier-communications/reminders/[reminderId]
// Body: SupplierReminderUpdateInput & { expectedVersion: number }
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reminderId: string }> }
) {
  try {
    const { reminderId } = await params;
    if (!reminderId?.trim()) {
      return Response.json({ error: 'reminderId is required' }, { status: 400 });
    }

    let body: Partial<SupplierReminderUpdateInput> & { expectedVersion?: number };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (body.expectedVersion === undefined || body.expectedVersion === null) {
      return Response.json({ error: 'expectedVersion is required for PATCH' }, { status: 400 });
    }

    const updated = await updateReminder(reminderId, body as SupplierReminderUpdateInput, body.expectedVersion);
    return Response.json(updated);
  } catch (e) {
    if (e instanceof SupplierReminderNotFoundError) {
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
    console.error('[PATCH /api/supplier-communications/reminders/[reminderId]] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/supplier-communications/reminders/[reminderId]
// Body: { expectedVersion: number; cancellationReason: string; cancelledBy?: string }
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ reminderId: string }> }
) {
  try {
    const { reminderId } = await params;
    if (!reminderId?.trim()) {
      return Response.json({ error: 'reminderId is required' }, { status: 400 });
    }

    let body: { expectedVersion?: number; cancellationReason?: string; cancelledBy?: string };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (body.expectedVersion === undefined || body.expectedVersion === null) {
      return Response.json({ error: 'expectedVersion is required' }, { status: 400 });
    }
    if (!body.cancellationReason?.trim()) {
      return Response.json({ error: 'cancellationReason is required' }, { status: 400 });
    }

    const cancelled = await cancelReminder(reminderId, body.cancellationReason, body.expectedVersion, body.cancelledBy);
    return Response.json(cancelled);
  } catch (e) {
    if (e instanceof SupplierReminderNotFoundError) {
      return Response.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof SupplierCommunicationConflictError) {
      return Response.json({ error: e.message, expectedVersion: e.expectedVersion, currentVersion: e.currentVersion }, { status: 409 });
    }
    if (e instanceof SupplierCommunicationStateError) {
      return Response.json({ error: e.message }, { status: 409 });
    }
    console.error('[DELETE /api/supplier-communications/reminders/[reminderId]] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
