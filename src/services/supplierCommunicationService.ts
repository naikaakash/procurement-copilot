/**
 * Supplier Communication Service — Phase 8C
 *
 * Public service entry-point for supplier reminder and response operations.
 * API routes import ONLY this file — never the store directly.
 *
 * Key lifecycle rules enforced here:
 *   1. Creating a reminder → transitions linked recommendation to PENDING_SUPPLIER_RESPONSE.
 *   2. Capturing a response → transitions linked recommendation to SUPPLIER_RESPONDED.
 *   3. Interpreting a response → enriches response record (no recommendation transition).
 *
 * Rules:
 *   - Does NOT import csvDataService or procurementDataService.
 *   - Does NOT modify SAP or official ERP data.
 *   - Does NOT send real emails.
 *   - Recommendation transitions use recommendationService (service-to-service call, not direct store).
 */

import * as commStore from '@/src/services/mockSupplierCommunicationStore';
import * as recStore from '@/src/services/mockRecommendationStore';
import { interpretSupplierResponse } from '@/src/services/supplierResponseInterpreter';
import type {
  SupplierReminder,
  SupplierReminderInput,
  SupplierReminderUpdateInput,
  SupplierResponse,
  SupplierResponseInput,
  SupplierResponseInterpretationInput,
  SupplierReminderStatus,
  SupplierResponseStatus,
  SupplierResponseCategory,
} from '@/src/types/supplierCommunications';
import {
  SupplierCommunicationValidationError,
} from '@/src/types/supplierCommunications';
import type {
  RecommendationLifecycleStatus,
  RecommendationCurrentOwner,
  VerificationStatus,
} from '@/src/types/procurementRecommendations';

// ---------------------------------------------------------------------------
// Supplier Reminder — Service API
// ---------------------------------------------------------------------------

/**
 * List reminders with optional filters.
 */
export async function listReminders(filters: {
  status?: SupplierReminderStatus;
  supplierId?: string;
  purchaseOrderNumber?: string;
  recommendationId?: string;
  offset?: number;
  limit?: number;
} = {}): Promise<SupplierReminder[]> {
  return commStore.listReminders(filters);
}

/**
 * Fetch a single reminder by ID.
 * Returns null if not found.
 */
export async function getReminderById(reminderId: string): Promise<SupplierReminder | null> {
  if (!reminderId?.trim()) return null;
  return commStore.getReminderById(reminderId);
}

/**
 * Fetch all reminders linked to a specific recommendation.
 */
export async function getRemindersByRecommendationId(recommendationId: string): Promise<SupplierReminder[]> {
  if (!recommendationId?.trim()) return [];
  return commStore.getRemindersByRecommendationId(recommendationId);
}

/**
 * Creates a new supplier reminder and transitions the linked recommendation
 * to PENDING_SUPPLIER_RESPONSE (owner → SUPPLIER).
 *
 * The recommendation transition is best-effort: if the recommendation is not
 * found or already in a terminal state, the reminder is still created.
 */
export async function createReminder(input: SupplierReminderInput): Promise<{
  reminder: SupplierReminder;
  recommendationUpdated: boolean;
  recommendationError?: string;
}> {
  // Validate recommendation linkage
  if (!input.recommendationId?.trim()) {
    throw new SupplierCommunicationValidationError('recommendationId', 'is required');
  }

  // Create the reminder record (store handles all remaining field validations)
  const reminder = commStore.createReminder(input);

  // Transition the linked recommendation lifecycle status
  let recommendationUpdated = false;
  let recommendationError: string | undefined;

  try {
    const rec = recStore.getRecommendationById(input.recommendationId.trim());
    if (rec) {
      // Only transition if not already in a terminal or later state
      const terminalStates = ['CONFIRMED_RESOLVED', 'CLOSED_NO_ACTION'];
      const alreadyPendingOrLater = [
        'PENDING_SUPPLIER_RESPONSE',
        'SUPPLIER_RESPONDED',
        'PENDING_BUYER_SAP_UPDATE',
        'VERIFICATION_PENDING',
        ...terminalStates,
      ];

      if (!alreadyPendingOrLater.includes(rec.lifecycleStatus)) {
        recStore.transitionRecommendationStatus(
          rec.recommendationId,
          {
            nextStatus: 'PENDING_SUPPLIER_RESPONSE',
            currentOwner: 'SUPPLIER',
            updatedBy: input.createdBy?.trim() || 'local-user',
          },
          rec.version
        );
        // Link the reminder to the recommendation
        const updatedRec = recStore.getRecommendationById(rec.recommendationId);
        if (updatedRec) {
          recStore.updateRecommendation(
            rec.recommendationId,
            { supplierReminderId: reminder.reminderId, updatedBy: input.createdBy?.trim() || 'local-user' },
            updatedRec.version
          );
        }
        recommendationUpdated = true;
      } else {
        // Still link the reminder ID even if status is not changing
        try {
          recStore.updateRecommendation(
            rec.recommendationId,
            { supplierReminderId: reminder.reminderId, updatedBy: input.createdBy?.trim() || 'local-user' },
            rec.version
          );
          recommendationUpdated = true;
        } catch {
          // Non-fatal — reminder was created successfully
          recommendationUpdated = false;
        }
      }
    } else {
      recommendationError = `Recommendation "${input.recommendationId}" not found — reminder created but recommendation not updated.`;
    }
  } catch (err: unknown) {
    recommendationError = err instanceof Error ? err.message : String(err);
  }

  return { reminder, recommendationUpdated, recommendationError };
}

/**
 * Updates mutable fields of an existing reminder.
 */
export async function updateReminder(
  reminderId: string,
  input: SupplierReminderUpdateInput,
  expectedVersion: number
): Promise<SupplierReminder> {
  if (!reminderId?.trim()) {
    throw new SupplierCommunicationValidationError('reminderId', 'is required');
  }
  return commStore.updateReminder(reminderId, input, expectedVersion);
}

/**
 * Cancels a SENT reminder.
 */
export async function cancelReminder(
  reminderId: string,
  cancellationReason: string,
  expectedVersion: number,
  cancelledBy?: string
): Promise<SupplierReminder> {
  if (!reminderId?.trim()) {
    throw new SupplierCommunicationValidationError('reminderId', 'is required');
  }
  if (!cancellationReason?.trim()) {
    throw new SupplierCommunicationValidationError('cancellationReason', 'is required');
  }
  return commStore.cancelReminder(reminderId, cancellationReason, expectedVersion, cancelledBy);
}

// ---------------------------------------------------------------------------
// Supplier Response — Service API
// ---------------------------------------------------------------------------

/**
 * List responses with optional filters.
 */
export async function listResponses(filters: {
  status?: SupplierResponseStatus;
  supplierId?: string;
  purchaseOrderNumber?: string;
  recommendationId?: string;
  reminderId?: string;
  offset?: number;
  limit?: number;
} = {}): Promise<SupplierResponse[]> {
  return commStore.listResponses(filters);
}

/**
 * Fetch a single response by ID.
 * Returns null if not found.
 */
export async function getResponseById(responseId: string): Promise<SupplierResponse | null> {
  if (!responseId?.trim()) return null;
  return commStore.getResponseById(responseId);
}

/**
 * Fetch all responses linked to a specific recommendation.
 */
export async function getResponsesByRecommendationId(recommendationId: string): Promise<SupplierResponse[]> {
  if (!recommendationId?.trim()) return [];
  return commStore.getResponsesByRecommendationId(recommendationId);
}

/**
 * Captures a new supplier response and transitions the linked recommendation
 * to SUPPLIER_RESPONDED (owner → BUYER).
 *
 * The recommendation transition is best-effort.
 */
/**
 * Captures a new supplier response, interprets it (using rules if not pre-categorized),
 * and transitions the linked recommendation to the correct lifecycle status.
 */
export async function captureResponse(input: SupplierResponseInput): Promise<{
  response: SupplierResponse;
  recommendationUpdated: boolean;
  recommendationError?: string;
}> {
  if (!input.recommendationId?.trim()) {
    throw new SupplierCommunicationValidationError('recommendationId', 'is required');
  }

  // 1. Run interpretation if category or summary is missing
  const rawText = input.rawResponseText || '';
  let responseCategory = input.responseCategory;
  let interpretedSummary = input.interpretedSummary;
  let proposedNewDeliveryDate = input.proposedNewDeliveryDate;
  let proposedNewQuantity = input.proposedNewQuantity;
  let proposedNewPrice = input.proposedNewPrice;

  if (!responseCategory || !interpretedSummary) {
    const interpretation = interpretSupplierResponse(rawText);
    if (!responseCategory) responseCategory = interpretation.responseCategory;
    if (!interpretedSummary) interpretedSummary = interpretation.interpretedSummary;
    if (proposedNewDeliveryDate === undefined) proposedNewDeliveryDate = interpretation.proposedNewDeliveryDate;
    if (proposedNewQuantity === undefined) proposedNewQuantity = interpretation.proposedNewQuantity;
    if (proposedNewPrice === undefined) proposedNewPrice = interpretation.proposedNewPrice;
  }

  const responseInput: SupplierResponseInput = {
    ...input,
    responseCategory,
    interpretedSummary,
    proposedNewDeliveryDate,
    proposedNewQuantity,
    proposedNewPrice,
  };

  // Create the response record
  const response = commStore.createResponse(responseInput);

  // Transition the linked recommendation
  let recommendationUpdated = false;
  let recommendationError: string | undefined;

  try {
    const rec = recStore.getRecommendationById(input.recommendationId.trim());
    if (rec) {
      const terminalStates = ['CONFIRMED_RESOLVED', 'CLOSED_NO_ACTION'];
      
      // Determine updates based on category and current recommendation type
      const mapping = determineRecommendationUpdate(
        responseCategory!,
        rec.recommendationType,
        proposedNewDeliveryDate,
        proposedNewQuantity,
        proposedNewPrice
      );

      // Enforce: only update recommendation status if not already terminal
      if (!terminalStates.includes(rec.lifecycleStatus)) {
        // First transition status and owner
        const transitionedRec = recStore.transitionRecommendationStatus(
          rec.recommendationId,
          {
            nextStatus: mapping.nextStatus,
            currentOwner: mapping.currentOwner,
            verificationStatus: mapping.verificationStatus,
            updatedBy: input.createdBy?.trim() || 'local-user',
          },
          rec.version
        );

        // Next update the recommendation detail fields
        recStore.updateRecommendation(
          rec.recommendationId,
          {
            supplierResponseId: response.responseId,
            responseCategory,
            interpretedSummary,
            recommendedSapField: mapping.recommendedSapField,
            recommendedSapValue: mapping.recommendedSapValue,
            verificationField: mapping.verificationField,
            expectedValueAfterSync: mapping.expectedValueAfterSync,
            verificationStatus: mapping.verificationStatus,
            recommendedActionText: mapping.recommendedActionText,
            updatedBy: input.createdBy?.trim() || 'local-user',
          },
          transitionedRec.version
        );
        recommendationUpdated = true;
      } else {
        // Link the response ID even if status doesn't change
        recStore.updateRecommendation(
          rec.recommendationId,
          {
            supplierResponseId: response.responseId,
            responseCategory,
            interpretedSummary,
            updatedBy: input.createdBy?.trim() || 'local-user',
          },
          rec.version
        );
        recommendationUpdated = true;
      }
    } else {
      recommendationError = `Recommendation "${input.recommendationId}" not found — response captured but recommendation not updated.`;
    }
  } catch (err: unknown) {
    recommendationError = err instanceof Error ? err.message : String(err);
  }

  return { response, recommendationUpdated, recommendationError };
}

/**
 * Helper to determine recommendation lifecycle status, owner, action text, and fields based on the interpreted category.
 */
export function determineRecommendationUpdate(
  category: SupplierResponseCategory,
  recType: string,
  proposedDate?: string,
  proposedQty?: number,
  proposedPrice?: number
): {
  nextStatus: RecommendationLifecycleStatus;
  currentOwner: RecommendationCurrentOwner;
  recommendedActionText: string;
  recommendedSapField?: string;
  recommendedSapValue?: string;
  verificationField?: string;
  expectedValueAfterSync?: string;
  verificationStatus?: VerificationStatus;
} {
  switch (category) {
    case 'DELIVERY_DATE_CHANGED': {
      const dateStr = proposedDate || '';
      return {
        nextStatus: 'PENDING_BUYER_SAP_UPDATE',
        currentOwner: 'BUYER',
        recommendedSapField: 'deliveryDate',
        expectedValueAfterSync: dateStr,
        verificationStatus: 'PENDING_NEXT_SYNC',
        verificationField: 'delivery_date',
        recommendedSapValue: dateStr,
        recommendedActionText: `Manually update SAP delivery date to ${dateStr}, then wait for next sync verification.`,
      };
    }
    case 'QUANTITY_CHANGED': {
      const qtyStr = proposedQty !== undefined ? proposedQty.toString() : '';
      return {
        nextStatus: 'PENDING_BUYER_SAP_UPDATE',
        currentOwner: 'BUYER',
        recommendedSapField: 'quantity',
        expectedValueAfterSync: qtyStr,
        verificationStatus: 'PENDING_NEXT_SYNC',
        verificationField: 'scheduled_qty',
        recommendedSapValue: qtyStr,
        recommendedActionText: 'Review and manually update SAP quantity if appropriate, then wait for next sync verification.',
      };
    }
    case 'ACCEPTED_AS_IS': {
      const isAckRec = recType === 'REQUEST_ACKNOWLEDGEMENT';
      return {
        nextStatus: 'VERIFICATION_PENDING',
        currentOwner: 'SOURCE_SYSTEM',
        verificationStatus: 'PENDING_NEXT_SYNC',
        verificationField: isAckRec ? 'acknowledgement_status' : undefined,
        expectedValueAfterSync: isAckRec ? 'ACKNOWLEDGED' : undefined,
        recommendedActionText: 'No SAP update is performed by the app. Verify acknowledgement/status after next sync.',
      };
    }
    case 'PRICE_ISSUE':
      return {
        nextStatus: 'PENDING_BUYER_ACTION',
        currentOwner: 'BUYER',
        recommendedActionText: 'Review supplier price issue with buyer/commercial owner. No automatic SAP update.',
      };
    case 'REJECTED':
      return {
        nextStatus: 'ESCALATED',
        currentOwner: 'BUYER',
        recommendedActionText: 'Supplier rejected the PO. Escalate and resolve manually. No automatic SAP update.',
      };
    case 'PARTIAL_CONFIRMATION':
      return {
        nextStatus: 'PENDING_BUYER_ACTION',
        currentOwner: 'BUYER',
        recommendedActionText: 'Supplier partially confirmed the PO. Buyer must review before any manual SAP update.',
      };
    case 'NEEDS_CLARIFICATION':
      return {
        nextStatus: 'PENDING_BUYER_ACTION',
        currentOwner: 'BUYER',
        recommendedActionText: 'Supplier response needs clarification. Follow up before making any SAP change.',
      };
    case 'WRONG_CONTACT':
      return {
        nextStatus: 'BLOCKED',
        currentOwner: 'BUYER',
        recommendedActionText: 'Supplier indicates wrong contact. Identify correct contact and resend reminder.',
      };
    case 'OUT_OF_OFFICE':
      return {
        nextStatus: 'PENDING_BUYER_ACTION',
        currentOwner: 'BUYER',
        recommendedActionText: 'Supplier contact is out of office. Follow up with alternate contact or wait until return.',
      };
    case 'FREE_TEXT_UNCLEAR':
    default:
      return {
        nextStatus: 'SUPPLIER_RESPONDED',
        currentOwner: 'BUYER',
        recommendedActionText: 'Supplier response needs buyer review.',
      };
  }
}

/**
 * Interprets (annotates) an existing response with a structured category and summary,
 * then updates the linked Recommendation according to the new category rules.
 */
export async function interpretResponse(
  responseId: string,
  input: SupplierResponseInterpretationInput,
  expectedVersion: number
): Promise<SupplierResponse> {
  if (!responseId?.trim()) {
    throw new SupplierCommunicationValidationError('responseId', 'is required');
  }

  // 1. Update the response interpretation in store
  const response = commStore.interpretResponse(responseId, input, expectedVersion);

  // 2. Transition and update the linked Recommendation
  try {
    const rec = recStore.getRecommendationById(response.recommendationId);
    if (rec) {
      const terminalStates = ['CONFIRMED_RESOLVED', 'CLOSED_NO_ACTION'];
      
      if (!terminalStates.includes(rec.lifecycleStatus)) {
        const mapping = determineRecommendationUpdate(
          input.responseCategory,
          rec.recommendationType,
          input.proposedNewDeliveryDate || response.proposedNewDeliveryDate,
          input.proposedNewQuantity || response.proposedNewQuantity,
          input.proposedNewPrice || response.proposedNewPrice
        );

        // First transition status and owner
        const transitionedRec = recStore.transitionRecommendationStatus(
          rec.recommendationId,
          {
            nextStatus: mapping.nextStatus,
            currentOwner: mapping.currentOwner,
            verificationStatus: mapping.verificationStatus,
            updatedBy: input.interpretedBy?.trim() || 'local-user',
          },
          rec.version
        );

        // Next update the recommendation detail fields
        recStore.updateRecommendation(
          rec.recommendationId,
          {
            supplierResponseId: response.responseId,
            responseCategory: input.responseCategory,
            interpretedSummary: input.interpretedSummary,
            recommendedSapField: mapping.recommendedSapField,
            recommendedSapValue: mapping.recommendedSapValue,
            verificationField: mapping.verificationField,
            expectedValueAfterSync: mapping.expectedValueAfterSync,
            verificationStatus: mapping.verificationStatus,
            recommendedActionText: mapping.recommendedActionText,
            updatedBy: input.interpretedBy?.trim() || 'local-user',
          },
          transitionedRec.version
        );
      } else {
        // Link fields even if status is terminal
        recStore.updateRecommendation(
          rec.recommendationId,
          {
            responseCategory: input.responseCategory,
            interpretedSummary: input.interpretedSummary,
            updatedBy: input.interpretedBy?.trim() || 'local-user',
          },
          rec.version
        );
      }
    }
  } catch (err) {
    console.error(`[interpretResponse] Failed to transition recommendation ${response.recommendationId}:`, err);
  }

  return response;
}

/**
 * Marks a response as ACTIONED (buyer took action based on this response).
 */
export async function markResponseActioned(
  responseId: string,
  expectedVersion: number,
  actionedBy?: string
): Promise<SupplierResponse> {
  if (!responseId?.trim()) {
    throw new SupplierCommunicationValidationError('responseId', 'is required');
  }
  return commStore.markResponseActioned(responseId, expectedVersion, actionedBy);
}

/**
 * Dismisses a response (e.g. irrelevant auto-reply).
 */
export async function dismissResponse(
  responseId: string,
  expectedVersion: number,
  dismissedBy?: string
): Promise<SupplierResponse> {
  if (!responseId?.trim()) {
    throw new SupplierCommunicationValidationError('responseId', 'is required');
  }
  return commStore.dismissResponse(responseId, expectedVersion, dismissedBy);
}
