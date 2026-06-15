/**
 * GET  /api/actions       — List open (OPEN + IN_PROGRESS) actions
 * POST /api/actions       — Create a new app-owned action
 *
 * Phase 7A: App-Owned Action Layer (local/mock persistence).
 * Does NOT touch csvDataService, SAP, or any ERP system.
 * Does NOT alter existing Release 1 read API routes.
 */
import { NextRequest } from 'next/server';
import {
  listOpenActions,
  createFollowUpAction,
  ActionConflictError,
  ActionNotFoundError,
  ActionValidationError,
} from '@/src/services/procurementActionService';
import type { ProcurementActionInput, ActionListFilters } from '@/src/types/procurementActions';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/actions
// Query params (all optional):
//   supplierId, purchaseOrderNumber, purchaseOrderItem, assignedTo, sourceModule
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const filters: Omit<ActionListFilters, 'actionStatus'> = {
      supplierId: searchParams.get('supplierId') || undefined,
      purchaseOrderNumber: searchParams.get('purchaseOrderNumber') || undefined,
      purchaseOrderItem: searchParams.get('purchaseOrderItem') || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
    };

    const actions = await listOpenActions(filters);
    return Response.json({ actions, total: actions.length });
  } catch (e) {
    console.error('[GET /api/actions] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/actions
// Body (JSON): ProcurementActionInput
// Required: purchaseOrderNumber, purchaseOrderItem, supplierId, supplierName, actionType
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    let body: Partial<ProcurementActionInput>;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Required field guard
    const required = ['purchaseOrderNumber', 'purchaseOrderItem', 'supplierId', 'supplierName', 'actionType'] as const;
    for (const field of required) {
      if (!body[field]) {
        return Response.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const action = await createFollowUpAction(body as ProcurementActionInput);
    return Response.json(action, { status: 201 });

  } catch (e) {
    if (e instanceof ActionValidationError) {
      return Response.json({ error: e.message, field: e.field }, { status: 400 });
    }
    console.error('[POST /api/actions] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
