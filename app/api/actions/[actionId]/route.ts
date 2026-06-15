/**
 * GET   /api/actions/[actionId]  — Returns one action by ID
 * PATCH /api/actions/[actionId]  — Updates an action (optimistic concurrency)
 *
 * PATCH body (JSON): ProcurementActionUpdateInput
 * Required: expectedVersion (number)
 * Optional: all other updatable fields
 *
 * HTTP status codes:
 *   200 — success
 *   400 — missing/invalid fields
 *   404 — action not found
 *   409 — version conflict (optimistic concurrency mismatch)
 *   500 — unexpected server error
 *
 * Phase 7A: App-Owned Action Layer. No csvDataService. No SAP.
 */
import { NextRequest } from 'next/server';
import {
  getActionById,
  updateFollowUpAction,
  ActionConflictError,
  ActionNotFoundError,
  ActionValidationError,
} from '@/src/services/procurementActionService';
import type { ProcurementActionUpdateInput } from '@/src/types/procurementActions';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/actions/[actionId]
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    const { actionId } = await params;

    if (!actionId) {
      return Response.json({ error: 'Missing actionId' }, { status: 400 });
    }

    const action = await getActionById(actionId);
    if (!action) {
      return Response.json({ error: `Action "${actionId}" not found` }, { status: 404 });
    }

    return Response.json(action);
  } catch (e) {
    console.error('[GET /api/actions/[actionId]] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/actions/[actionId]
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    const { actionId } = await params;

    if (!actionId) {
      return Response.json({ error: 'Missing actionId' }, { status: 400 });
    }

    let body: Partial<ProcurementActionUpdateInput>;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // expectedVersion is required for optimistic concurrency
    if (typeof body.expectedVersion !== 'number' || body.expectedVersion < 1) {
      return Response.json(
        { error: 'Missing or invalid field: expectedVersion (must be a positive integer)' },
        { status: 400 }
      );
    }

    const updated = await updateFollowUpAction(actionId, body as ProcurementActionUpdateInput);
    return Response.json(updated);

  } catch (e) {
    if (e instanceof ActionValidationError) {
      return Response.json({ error: e.message, field: e.field }, { status: 400 });
    }
    if (e instanceof ActionNotFoundError) {
      return Response.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof ActionConflictError) {
      return Response.json(
        {
          error: e.message,
          conflict: {
            actionId: e.actionId,
            expectedVersion: e.expectedVersion,
            currentVersion: e.currentVersion,
          },
        },
        { status: 409 }
      );
    }
    console.error('[PATCH /api/actions/[actionId]] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
