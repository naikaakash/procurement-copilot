/**
 * Procurement Action Service — Phase 7A: App-Owned Action Layer
 *
 * This is the single business service for all app-owned buyer workflow/action
 * writes and reads. It is the only service API routes should call for action data.
 *
 * Architecture position:
 *   API Routes (app/api/actions/)
 *     ↓ import procurementActionService
 *   procurementActionService     ← THIS FILE — business logic
 *     ↓ import mockActionStore
 *   mockActionStore              ← local JSON persistence (replaceable)
 *     ↓
 *   data/app-actions.json        ← local file store
 *
 * Rules (enforced):
 *   - MUST NOT import csvDataService.
 *   - MUST NOT import procurementDataService.
 *   - MUST NOT update SAP-owned PO data (quantities, prices, dates, status).
 *   - MUST NOT call SAP write APIs.
 *   - MUST NOT mutate source CSV procurement data.
 *   - Owns ONLY app workflow/action data.
 *
 * Concurrency:
 *   All update operations require `expectedVersion`.
 *   Mismatches throw ActionConflictError — API routes convert this to HTTP 409.
 *
 * Phase 7A persistence: local JSON file (mockActionStore).
 * Phase 8 replacement: swap mockActionStore import for a database adapter.
 *
 * See: docs/APP_OWNED_ACTION_LAYER.md
 */

import * as store from '@/src/services/mockActionStore';
import type {
  ProcurementAction,
  ProcurementActionInput,
  ProcurementActionUpdateInput,
  ActionListFilters,
  ActionSourceModule,
} from '@/src/types/procurementActions';
import {
  ActionValidationError,
} from '@/src/types/procurementActions';

// Re-export error types so API routes only need to import from this service
export {
  ActionConflictError,
  ActionNotFoundError,
  ActionValidationError,
} from '@/src/types/procurementActions';

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

/**
 * Returns all app-owned actions for a specific PO line.
 * Ordered newest first.
 *
 * Used by: Overdue PO Workbench drawer panel.
 */
export async function getActionsForPurchaseOrderLine(
  purchaseOrderNumber: string,
  purchaseOrderItem: string
): Promise<ProcurementAction[]> {
  return store.getActionsForPurchaseOrderLine(purchaseOrderNumber, purchaseOrderItem);
}

/**
 * Returns all app-owned actions for a specific supplier.
 * Ordered newest first.
 *
 * Used by: Supplier Analytics drawer panel.
 */
export async function getActionsForSupplier(supplierId: string): Promise<ProcurementAction[]> {
  return store.getActionsForSupplier(supplierId);
}

/**
 * Returns a single action by ID, or null if not found.
 */
export async function getActionById(actionId: string): Promise<ProcurementAction | null> {
  return store.getActionById(actionId);
}

/**
 * Returns open (OPEN + IN_PROGRESS) actions, with optional filters.
 *
 * Used by: future buyer workqueue / reminder list.
 */
export async function listOpenActions(
  filters?: Omit<ActionListFilters, 'actionStatus'>
): Promise<ProcurementAction[]> {
  return store.listOpenActions(filters);
}

/**
 * Returns all actions originating from a specific source module.
 */
export async function listActionsByModule(
  sourceModule: ActionSourceModule,
  filters?: Omit<ActionListFilters, 'sourceModule'>
): Promise<ProcurementAction[]> {
  return store.listActionsByModule(sourceModule, filters);
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

/**
 * Creates a new follow-up action for a PO line.
 *
 * The service layer validates required business fields, then delegates to
 * the store. Version starts at 1.
 *
 * Throws ActionValidationError (400) for missing required fields.
 */
export async function createFollowUpAction(
  input: ProcurementActionInput
): Promise<ProcurementAction> {
  // Business validation: note is required for NOTE type
  if (input.actionType === 'NOTE' && !input.note?.trim()) {
    throw new ActionValidationError('note', 'is required when actionType is NOTE');
  }

  // Business validation: evidenceReference is required for ACKNOWLEDGEMENT_EVIDENCE
  if (input.actionType === 'ACKNOWLEDGEMENT_EVIDENCE' && !input.evidenceReference?.trim()) {
    throw new ActionValidationError(
      'evidenceReference',
      'is required when actionType is ACKNOWLEDGEMENT_EVIDENCE'
    );
  }

  return store.createAction(input);
}

/**
 * Updates an existing follow-up action.
 * Requires `expectedVersion` for optimistic concurrency.
 *
 * Throws ActionNotFoundError (404) if actionId doesn't exist.
 * Throws ActionConflictError (409) if expectedVersion doesn't match.
 */
export async function updateFollowUpAction(
  actionId: string,
  input: ProcurementActionUpdateInput
): Promise<ProcurementAction> {
  if (!actionId?.trim()) {
    throw new ActionValidationError('actionId', 'is required');
  }
  if (typeof input.expectedVersion !== 'number' || input.expectedVersion < 1) {
    throw new ActionValidationError('expectedVersion', 'must be a positive integer');
  }
  return store.updateAction(actionId, input);
}

/**
 * Convenience: marks a PO line as "supplier contacted" by the buyer.
 * Creates a SUPPLIER_CONTACTED action with supplierContacted=true.
 *
 * If a note is provided, includes it in the action.
 */
export async function markSupplierContacted(
  purchaseOrderNumber: string,
  purchaseOrderItem: string,
  supplierId: string,
  supplierName: string,
  userId: string,
  note?: string
): Promise<ProcurementAction> {
  return store.createAction({
    purchaseOrderNumber,
    purchaseOrderItem,
    supplierId,
    supplierName,
    actionType: 'SUPPLIER_CONTACTED',
    sourceModule: 'OVERDUE_WORKBENCH',
    supplierContacted: true,
    note: note ?? 'Supplier contacted.',
    createdBy: userId,
  });
}

/**
 * Convenience: marks an existing action as COMPLETED.
 * Requires expectedVersion for optimistic concurrency.
 *
 * Throws ActionNotFoundError (404) or ActionConflictError (409) accordingly.
 */
export async function markActionComplete(
  actionId: string,
  userId: string,
  expectedVersion: number
): Promise<ProcurementAction> {
  return store.updateAction(actionId, {
    expectedVersion,
    actionStatus: 'COMPLETED',
    reviewStatus: 'ACTIONED',
    updatedBy: userId,
  });
}

/**
 * Convenience: escalates an existing action.
 * Sets escalationFlag=true and actionStatus=IN_PROGRESS.
 * Requires expectedVersion for optimistic concurrency.
 */
export async function escalateAction(
  actionId: string,
  userId: string,
  expectedVersion: number,
  note?: string
): Promise<ProcurementAction> {
  const existing = store.getActionById(actionId);
  const updateInput: ProcurementActionUpdateInput = {
    expectedVersion,
    escalationFlag: true,
    actionStatus: 'IN_PROGRESS',
    updatedBy: userId,
  };
  if (note?.trim()) {
    updateInput.note = note.trim();
  }
  return store.updateAction(actionId, updateInput);
}

/**
 * Convenience: sets a reminder date on an existing action.
 * Creates a REMINDER action for the PO line.
 */
export async function setReminder(
  purchaseOrderNumber: string,
  purchaseOrderItem: string,
  supplierId: string,
  supplierName: string,
  reminderDate: string,
  userId: string,
  note?: string
): Promise<ProcurementAction> {
  // Basic date format validation (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reminderDate)) {
    throw new ActionValidationError('reminderDate', 'must be in YYYY-MM-DD format');
  }
  return store.createAction({
    purchaseOrderNumber,
    purchaseOrderItem,
    supplierId,
    supplierName,
    actionType: 'REMINDER',
    sourceModule: 'OVERDUE_WORKBENCH',
    reminderDate,
    note: note ?? `Reminder set for ${reminderDate}`,
    createdBy: userId,
  });
}
