/**
 * Procurement Action Types — Release 1: Supplier Commitment Core
 *
 * These types represent app-owned buyer workflow/action data.
 * They are completely separate from SAP-owned procurement data.
 *
 * Ownership boundary:
 *   - ERP/SAP owns: PO header, PO line, schedule lines, quantities, prices,
 *     delivery dates, supplier master, goods receipts, official acknowledgements.
 *   - This app owns: follow-up notes, escalation flags, supplier contacted status,
 *     review status, reminder dates, assigned owner, risk overrides, action history.
 *
 * The `sapSyncStatus` field exists for future compatibility only.
 * In Phase 7A, all actions are APP_ONLY — no SAP write-back occurs.
 *
 * See: docs/APP_OWNED_ACTION_LAYER.md
 * See: docs/ACTION_LAYER_DESIGN.md
 */

// ---------------------------------------------------------------------------
// Enums / Union types
// ---------------------------------------------------------------------------

/**
 * Type of buyer workflow action recorded against a PO line or supplier.
 */
export type ProcurementActionType =
  | 'NOTE'                       // Free-text follow-up note
  | 'SUPPLIER_CONTACTED'         // Buyer contacted the supplier directly
  | 'FOLLOW_UP_REQUIRED'         // Line flagged for follow-up attention
  | 'ESCALATION'                 // Escalated to management or procurement lead
  | 'REMINDER'                   // Timed reminder to revisit this line
  | 'REVIEW_STATUS_CHANGE'       // Buyer changed the internal review status
  | 'ACKNOWLEDGEMENT_EVIDENCE';  // Reference to supplier ack evidence (email, PDF, etc.)

/**
 * Lifecycle status of a single action record.
 */
export type ProcurementActionStatus =
  | 'OPEN'         // Recorded, action not yet resolved
  | 'IN_PROGRESS'  // Buyer is actively working on this
  | 'COMPLETED'    // Action resolved / follow-up done
  | 'CANCELLED';   // Action cancelled / no longer relevant

/**
 * Internal review status of a PO line from the buyer's perspective.
 */
export type ReviewStatus =
  | 'UNREVIEWED'  // Buyer has not yet looked at this line
  | 'REVIEWED'    // Buyer has reviewed but not acted
  | 'ACTIONED';   // Buyer has taken action

/**
 * Risk classification override — app side only.
 * This does not affect the SAP risk score or supplier master.
 */
export type RiskClassification =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'WATCH';      // Extra level: monitored but not yet high risk

/**
 * Type of evidence attached to an acknowledgement evidence action.
 */
export type EvidenceType =
  | 'EMAIL'
  | 'PORTAL_SCREENSHOT'
  | 'PHONE_LOG'
  | 'DOCUMENT_REFERENCE'
  | 'OTHER';

/**
 * Which Release 1 module originated this action.
 */
export type ActionSourceModule =
  | 'OVERDUE_WORKBENCH'
  | 'SUPPLIER_ACKNOWLEDGEMENTS'
  | 'SUPPLIER_ANALYTICS'
  | 'EXECUTIVE_OVERVIEW'
  | 'SYSTEM';   // System-generated (future: automated rules)

/**
 * SAP sync status — Phase 7A: always APP_ONLY.
 * Reserved for future phases when SAP write-back is implemented.
 */
export type SapSyncStatus =
  | 'APP_ONLY'       // App-owned action, no SAP sync ever needed
  | 'NOT_APPLICABLE' // Action type has no SAP equivalent
  | 'NOT_SYNCED'     // Future: should sync to SAP but hasn't yet
  | 'SYNCED'         // Future: successfully written to SAP
  | 'SYNC_FAILED'    // Future: SAP write attempted but failed
  | 'CONFLICT';      // Future: SAP state changed before write completed

// ---------------------------------------------------------------------------
// Core action record
// ---------------------------------------------------------------------------

/**
 * ProcurementAction — a single app-owned workflow/action record.
 *
 * Linked to a PO line via purchaseOrderNumber + purchaseOrderItem.
 * Linked to a supplier via supplierId.
 * Does NOT contain any ERP-owned quantity, price, or date fields.
 *
 * The `version` field enables optimistic concurrency:
 *   - Starts at 1 on create.
 *   - Incremented on every successful update.
 *   - Callers must supply the expected version; mismatches return 409.
 */
export interface ProcurementAction {
  // Identity
  actionId: string;                 // UUID — app-generated
  purchaseOrderNumber: string;      // ERP key reference (read-only, not an ERP update)
  purchaseOrderItem: string;        // ERP key reference (read-only, not an ERP update)
  scheduleLine?: string;            // Optional: specific schedule line (e.g. '0001')
  supplierId: string;               // ERP key reference (read-only, not an ERP update)
  supplierName: string;             // Denormalized for display; not authoritative

  // Classification
  actionType: ProcurementActionType;
  actionStatus: ProcurementActionStatus;
  sourceModule: ActionSourceModule;

  // Content (all app-owned fields — safe to modify without SAP)
  note: string;                     // Free-text note from buyer
  assignedTo?: string;              // User ID of assigned buyer/planner
  reminderDate?: string;            // ISO date: when to resurface (YYYY-MM-DD)
  supplierContacted: boolean;       // Has buyer contacted the supplier?
  escalationFlag: boolean;          // Has this been escalated?
  riskClassification?: RiskClassification;   // App-side risk override (not SAP risk score)
  reviewStatus: ReviewStatus;       // Buyer's internal review status
  evidenceType?: EvidenceType;      // If type === 'ACKNOWLEDGEMENT_EVIDENCE'
  evidenceReference?: string;       // Email subject, document ID, URL, etc.

  // Audit fields
  createdBy: string;                // User ID of creator
  createdAt: string;                // ISO 8601 timestamp
  updatedBy: string;                // User ID of last updater
  updatedAt: string;                // ISO 8601 timestamp

  // Optimistic concurrency
  version: number;                  // Starts at 1; incremented on each update

  // System
  sourceSystem: 'APP';              // Always 'APP' — app-generated actions only (the SAP-sourced equivalent uses sapSyncStatus)
  sapSyncStatus: SapSyncStatus;     // Phase 7A: always APP_ONLY or NOT_APPLICABLE
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

/**
 * Input for creating a new ProcurementAction.
 * Server assigns: actionId, createdAt, updatedAt, version, sourceSystem.
 */
export interface ProcurementActionInput {
  purchaseOrderNumber: string;
  purchaseOrderItem: string;
  scheduleLine?: string;
  supplierId: string;
  supplierName: string;
  actionType: ProcurementActionType;
  sourceModule: ActionSourceModule;

  // Optional content — defaults provided by service
  note?: string;
  assignedTo?: string;
  reminderDate?: string;
  supplierContacted?: boolean;
  escalationFlag?: boolean;
  riskClassification?: RiskClassification;
  reviewStatus?: ReviewStatus;
  evidenceType?: EvidenceType;
  evidenceReference?: string;
  createdBy?: string;   // Defaults to 'SYSTEM' if not provided
}

/**
 * Input for updating an existing ProcurementAction.
 * All fields are optional — only provided fields are updated.
 * `expectedVersion` is REQUIRED for optimistic concurrency.
 */
export interface ProcurementActionUpdateInput {
  expectedVersion: number;          // Must match current action.version

  // Updatable fields (all optional)
  actionStatus?: ProcurementActionStatus;
  note?: string;
  assignedTo?: string;
  reminderDate?: string;
  supplierContacted?: boolean;
  escalationFlag?: boolean;
  riskClassification?: RiskClassification;
  reviewStatus?: ReviewStatus;
  evidenceType?: EvidenceType;
  evidenceReference?: string;
  updatedBy?: string;               // Defaults to 'SYSTEM' if not provided
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

/**
 * Filters for listing open or filtered actions.
 */
export interface ActionListFilters {
  purchaseOrderNumber?: string;
  purchaseOrderItem?: string;
  supplierId?: string;
  actionType?: ProcurementActionType;
  actionStatus?: ProcurementActionStatus;
  sourceModule?: ActionSourceModule;
  assignedTo?: string;
  escalationFlag?: boolean;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Thrown or returned when an optimistic concurrency check fails.
 * API routes should convert this to HTTP 409 Conflict.
 */
export class ActionConflictError extends Error {
  public readonly actionId: string;
  public readonly expectedVersion: number;
  public readonly currentVersion: number;

  constructor(actionId: string, expectedVersion: number, currentVersion: number) {
    super(
      `Optimistic concurrency conflict on action "${actionId}". ` +
      `Expected version ${expectedVersion}, found version ${currentVersion}. ` +
      `Refresh the record and resubmit.`
    );
    this.name = 'ActionConflictError';
    this.actionId = actionId;
    this.expectedVersion = expectedVersion;
    this.currentVersion = currentVersion;
  }
}

/**
 * Thrown or returned when an action is not found by ID.
 * API routes should convert this to HTTP 404.
 */
export class ActionNotFoundError extends Error {
  public readonly actionId: string;

  constructor(actionId: string) {
    super(`Action "${actionId}" not found.`);
    this.name = 'ActionNotFoundError';
    this.actionId = actionId;
  }
}

/**
 * Thrown when required fields are missing in an input.
 * API routes should convert this to HTTP 400.
 */
export class ActionValidationError extends Error {
  public readonly field: string;

  constructor(field: string, reason: string) {
    super(`Validation error on field "${field}": ${reason}`);
    this.name = 'ActionValidationError';
    this.field = field;
  }
}
