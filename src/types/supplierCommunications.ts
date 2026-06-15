/**
 * Supplier Communications Types — Phase 8C
 *
 * Defines the data models for supplier reminders and supplier responses.
 * These are app-owned workflow records. They are strictly separate from:
 *   - procurement.ts  (read-only ERP/SAP source data)
 *   - procurementActions.ts  (internal buyer manual action records)
 *   - procurementRecommendations.ts  (recommendation lifecycle state)
 *
 * Communication records link to a Recommendation via recommendationId.
 * Creating a reminder → transitions recommendation to PENDING_SUPPLIER_RESPONSE.
 * Capturing a response → transitions recommendation to SUPPLIER_RESPONDED.
 *
 * DO NOT add SAP write-back logic here.
 * DO NOT add real email sending logic here.
 */

// ---------------------------------------------------------------------------
// Enums / Union Types
// ---------------------------------------------------------------------------

/**
 * Status of a supplier reminder record.
 * DRAFT → SENT is the only forward transition (mock: SENT is immediate).
 */
export type SupplierReminderStatus =
  | 'DRAFT'
  | 'SENT'
  | 'CANCELLED';

export type SupplierReminderSendMode = 'MOCK' | 'OUTLOOK_GRAPH';

export type SupplierReminderDeliveryStatus =
  | 'DRAFT'
  | 'MOCK_SENT'
  | 'LOGGED_ONLY'
  | 'SENT'
  | 'FAILED'
  | 'NOT_CONFIGURED';

/**
 * Channel via which the reminder was (conceptually) sent.
 * Real email/EDI integration is out of scope; this is a label only.
 */
export type SupplierCommunicationChannel =
  | 'EMAIL'
  | 'PHONE'
  | 'EDI'
  | 'PORTAL'
  | 'MANUAL'
  | 'OTHER';

/**
 * Status of a supplier response record.
 */
export type SupplierResponseStatus =
  | 'CAPTURED'
  | 'INTERPRETED'
  | 'ACTIONED'
  | 'DISMISSED';

/**
 * Structured interpretation category for a supplier response.
 * Mirrors SupplierResponseCategory in procurementRecommendations.ts but is
 * kept here as the authoritative type for the communication domain.
 */
export type SupplierResponseCategory =
  | 'ACCEPTED_AS_IS'
  | 'DELIVERY_DATE_CHANGED'
  | 'QUANTITY_CHANGED'
  | 'PRICE_ISSUE'
  | 'REJECTED'
  | 'PARTIAL_CONFIRMATION'
  | 'NEEDS_CLARIFICATION'
  | 'WRONG_CONTACT'
  | 'OUT_OF_OFFICE'
  | 'NO_RESPONSE'
  | 'FREE_TEXT_UNCLEAR';

// ---------------------------------------------------------------------------
// Supplier Reminder
// ---------------------------------------------------------------------------

/**
 * A logged supplier reminder linked to a recommendation.
 * Stored in data/app-supplier-reminders.json.
 */
export interface SupplierReminder {
  reminderId: string;
  recommendationId: string;
  purchaseOrderNumber: string;
  purchaseOrderItem: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  channel: SupplierCommunicationChannel;
  reminderStatus: SupplierReminderStatus;
  subject: string;
  bodyText: string;
  sentAt?: string; // ISO string — set when status transitions to SENT
  cancelledAt?: string; // ISO string — set when status transitions to CANCELLED
  cancellationReason?: string;
  createdBy: string;
  createdAt: string; // ISO string
  updatedBy: string;
  updatedAt: string; // ISO string
  version: number;
  
  // Email Metadata Fields
  scheduleLine?: string;
  ccEmails?: string[];
  sendMode?: SupplierReminderSendMode;
  deliveryStatus?: SupplierReminderDeliveryStatus;
  providerMessage?: string;
  providerMessageId?: string;
  errorMessage?: string;
  loggedAt?: string;
  sentBy?: string;
}

/**
 * Input for creating a new supplier reminder.
 */
export interface SupplierReminderInput {
  recommendationId: string;
  purchaseOrderNumber: string;
  purchaseOrderItem: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  channel?: SupplierCommunicationChannel;
  subject: string;
  bodyText: string;
  createdBy?: string;

  // Email Metadata Fields
  scheduleLine?: string;
  ccEmails?: string[];
  sendMode?: SupplierReminderSendMode;
  deliveryStatus?: SupplierReminderDeliveryStatus;
  providerMessage?: string;
  providerMessageId?: string;
  errorMessage?: string;
  loggedAt?: string;
  sentBy?: string;
}

/**
 * Input for updating an existing supplier reminder (before SENT).
 */
export interface SupplierReminderUpdateInput {
  supplierEmail?: string;
  channel?: SupplierCommunicationChannel;
  subject?: string;
  bodyText?: string;
  updatedBy?: string;
}

// ---------------------------------------------------------------------------
// Supplier Response
// ---------------------------------------------------------------------------

/**
 * A captured supplier response, linked to a reminder or directly to a recommendation.
 * Stored in data/app-supplier-responses.json.
 */
export interface SupplierResponse {
  responseId: string;
  reminderId?: string; // May be null if response arrives without a prior reminder
  recommendationId: string;
  purchaseOrderNumber: string;
  purchaseOrderItem: string;
  supplierId: string;
  supplierName: string;
  channel: SupplierCommunicationChannel;
  responseStatus: SupplierResponseStatus;
  responseCategory?: SupplierResponseCategory;
  rawResponseText: string; // The unprocessed supplier message text
  interpretedSummary?: string; // Buyer or system interpretation of the response
  proposedNewDeliveryDate?: string; // ISO date string — if supplier proposes date change
  proposedNewQuantity?: number; // If supplier proposes quantity change
  proposedNewPrice?: number; // If supplier proposes price change
  respondedAt: string; // ISO string — when the response was (conceptually) received
  capturedAt: string; // ISO string — when it was recorded in this system
  capturedBy: string;
  interpretedBy?: string;
  interpretedAt?: string; // ISO string
  createdBy: string;
  createdAt: string; // ISO string
  updatedBy: string;
  updatedAt: string; // ISO string
  version: number;
}

/**
 * Input for capturing a new supplier response.
 */
export interface SupplierResponseInput {
  reminderId?: string;
  recommendationId: string;
  purchaseOrderNumber: string;
  purchaseOrderItem: string;
  supplierId: string;
  supplierName: string;
  channel?: SupplierCommunicationChannel;
  responseCategory?: SupplierResponseCategory;
  rawResponseText: string;
  interpretedSummary?: string;
  proposedNewDeliveryDate?: string;
  proposedNewQuantity?: number;
  proposedNewPrice?: number;
  respondedAt?: string; // Defaults to now if omitted
  createdBy?: string;
}

/**
 * Input for interpreting/annotating an existing supplier response.
 */
export interface SupplierResponseInterpretationInput {
  responseCategory: SupplierResponseCategory;
  interpretedSummary: string;
  proposedNewDeliveryDate?: string;
  proposedNewQuantity?: number;
  proposedNewPrice?: number;
  interpretedBy?: string;
}

// ---------------------------------------------------------------------------
// Custom Errors
// ---------------------------------------------------------------------------

export class SupplierReminderNotFoundError extends Error {
  constructor(public reminderId: string) {
    super(`Supplier reminder "${reminderId}" not found`);
    this.name = 'SupplierReminderNotFoundError';
  }
}

export class SupplierResponseNotFoundError extends Error {
  constructor(public responseId: string) {
    super(`Supplier response "${responseId}" not found`);
    this.name = 'SupplierResponseNotFoundError';
  }
}

export class SupplierCommunicationConflictError extends Error {
  constructor(
    public entityType: 'reminder' | 'response',
    public entityId: string,
    public expectedVersion: number,
    public currentVersion: number
  ) {
    super(
      `Optimistic concurrency conflict on ${entityType} "${entityId}". ` +
      `Expected version ${expectedVersion}, found version ${currentVersion}. Refresh and resubmit.`
    );
    this.name = 'SupplierCommunicationConflictError';
  }
}

export class SupplierCommunicationValidationError extends Error {
  constructor(public field: string, message: string) {
    super(`Validation error on field "${field}": ${message}`);
    this.name = 'SupplierCommunicationValidationError';
  }
}

export class SupplierCommunicationStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupplierCommunicationStateError';
  }
}
