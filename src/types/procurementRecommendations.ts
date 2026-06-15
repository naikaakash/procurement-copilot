/**
 * Procurement Recommendations Types
 *
 * Enforces architectural separation of app-owned recommendation workflow data
 * from read-only ERP data (procurement.ts) and manual buyer actions (procurementActions.ts).
 */

export type RecommendationLifecycleStatus =
  | 'RECOMMENDED'
  | 'PENDING_BUYER_ACTION'
  | 'PENDING_SUPPLIER_RESPONSE'
  | 'SUPPLIER_RESPONDED'
  | 'PENDING_BUYER_SAP_UPDATE'
  | 'VERIFICATION_PENDING'
  | 'CONFIRMED_RESOLVED'
  | 'CLOSED_NO_ACTION'
  | 'ESCALATED'
  | 'BLOCKED';

export type RecommendationType =
  | 'SEND_SUPPLIER_REMINDER'
  | 'REQUEST_ACKNOWLEDGEMENT'
  | 'REQUEST_DELIVERY_CONFIRMATION'
  | 'REVIEW_SUPPLIER_DATE_CHANGE'
  | 'REVIEW_SUPPLIER_QTY_CHANGE'
  | 'REVIEW_SUPPLIER_PRICE_ISSUE'
  | 'UPDATE_SAP_DELIVERY_DATE_MANUALLY'
  | 'UPDATE_SAP_QUANTITY_MANUALLY'
  | 'ESCALATE_SUPPLIER'
  | 'NO_ACTION_REQUIRED';

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

export type VerificationStatus =
  | 'NOT_READY'
  | 'PENDING_NEXT_SYNC'
  | 'PASSED'
  | 'FAILED'
  | 'MANUALLY_CLOSED';

export type RecommendationCurrentOwner =
  | 'APP'
  | 'BUYER'
  | 'SUPPLIER'
  | 'SOURCE_SYSTEM'
  | 'NONE';

export type RecommendationSourceModule =
  | 'OVERDUE_PO'
  | 'PO_ACKNOWLEDGEMENT'
  | 'SUPPLIER_PERFORMANCE'
  | 'MANUAL';

export interface Recommendation {
  recommendationId: string;
  sourceModule: RecommendationSourceModule;
  purchaseOrderNumber: string;
  purchaseOrderItem: string;
  supplierId: string;
  supplierName: string;
  recommendationType: RecommendationType;
  lifecycleStatus: RecommendationLifecycleStatus;
  currentOwner: RecommendationCurrentOwner;
  issueDetectedAt: string; // ISO string
  issueReason: string;
  recommendedActionText: string;
  supplierReminderId?: string;
  supplierResponseId?: string;
  responseCategory?: SupplierResponseCategory;
  interpretedSummary?: string;
  recommendedSapField?: string;
  recommendedSapValue?: string;
  verificationField?: string;
  expectedValueAfterSync?: string;
  lastVerifiedAt?: string; // ISO string
  verificationStatus: VerificationStatus;
  verificationMessage?: string;
  createdBy: string;
  createdAt: string; // ISO string
  updatedBy: string;
  updatedAt: string; // ISO string
  version: number;
  closedAt?: string; // ISO string
  closureReason?: string;
  linkedActionIds: string[];
  supplierEmail?: string;
}

export interface RecommendationInput {
  sourceModule: RecommendationSourceModule;
  purchaseOrderNumber: string;
  purchaseOrderItem: string;
  supplierId: string;
  supplierName: string;
  recommendationType: RecommendationType;
  lifecycleStatus?: RecommendationLifecycleStatus;
  currentOwner?: RecommendationCurrentOwner;
  issueDetectedAt?: string;
  issueReason: string;
  recommendedActionText: string;
  responseCategory?: SupplierResponseCategory;
  interpretedSummary?: string;
  recommendedSapField?: string;
  recommendedSapValue?: string;
  verificationField?: string;
  expectedValueAfterSync?: string;
  verificationStatus?: VerificationStatus;
  createdBy?: string;
}

export interface RecommendationUpdateInput {
  recommendationType?: RecommendationType;
  currentOwner?: RecommendationCurrentOwner;
  recommendedActionText?: string;
  supplierReminderId?: string;
  supplierResponseId?: string;
  responseCategory?: SupplierResponseCategory;
  interpretedSummary?: string;
  recommendedSapField?: string;
  recommendedSapValue?: string;
  verificationField?: string;
  expectedValueAfterSync?: string;
  verificationStatus?: VerificationStatus;
  verificationMessage?: string;
  updatedBy?: string;
  closureReason?: string;
}

export interface RecommendationStatusTransitionInput {
  nextStatus: RecommendationLifecycleStatus;
  currentOwner?: RecommendationCurrentOwner;
  closureReason?: string;
  verificationStatus?: VerificationStatus;
  updatedBy?: string;
}

export interface RecommendationVerificationResult {
  recommendationId: string;
  passed: boolean;
  actualValueFound?: string;
  message: string;
  nextStatus: RecommendationLifecycleStatus;
}

// ---------------------------------------------------------------------------
// Custom Errors
// ---------------------------------------------------------------------------

export class RecommendationNotFoundError extends Error {
  constructor(public recommendationId: string) {
    super(`Recommendation "${recommendationId}" not found`);
    this.name = 'RecommendationNotFoundError';
  }
}

export class RecommendationConflictError extends Error {
  constructor(
    public recommendationId: string,
    public expectedVersion: number,
    public currentVersion: number
  ) {
    super(
      `Optimistic concurrency conflict on recommendation "${recommendationId}". ` +
      `Expected version ${expectedVersion}, found version ${currentVersion}. Refresh the record and resubmit.`
    );
    this.name = 'RecommendationConflictError';
  }
}

export class RecommendationValidationError extends Error {
  constructor(public field: string, message: string) {
    super(`Validation error on field "${field}": ${message}`);
    this.name = 'RecommendationValidationError';
  }
}

