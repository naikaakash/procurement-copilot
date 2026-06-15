/**
 * Recommendation Verification Service — Phase 8E: Verification Engine
 *
 * Checks whether recommendations with expected source-system changes have been
 * resolved after the next ERP/source data refresh.
 *
 * Guardrails:
 *   - Read-only regarding source data (uses procurementDataService).
 *   - Updates app-owned recommendation workflow data only (via recommendationService).
 *   - No SAP write-back or source CSV mutation.
 */

import * as procurementDataService from '@/src/services/procurementDataService';
import * as recommendationService from '@/src/services/recommendationService';
import type {
  Recommendation,
  RecommendationVerificationResult,
  RecommendationLifecycleStatus,
  VerificationStatus,
} from '@/src/types/procurementRecommendations';

/**
 * Normalizes a date value (string or date) to YYYY-MM-DD format for stable comparison.
 */
function normalizeDate(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim();
  if (!str) return null;
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * Fetches all valid schedule lines for a PO item.
 * Filters out fallback values returned when a schedule line doesn't actually exist on the item.
 */
async function getAllScheduleLinesForPoItem(poNumber: string, itemNumber: string): Promise<any[]> {
  const lines: any[] = [];
  // Loop through lines 0001 to 0010 to fetch all active schedule lines
  for (let i = 1; i <= 10; i++) {
    const padLine = String(i).padStart(4, '0');
    try {
      const detail = await procurementDataService.getPurchaseOrderLineDetail(poNumber, itemNumber, padLine);
      if (detail && detail.actualScheduleLine === padLine && detail.materialId) {
        lines.push(detail);
      }
    } catch (e) {
      // Safe fallback
    }
  }
  return lines;
}

/**
 * Verifies a single recommendation against the latest source data.
 */
export async function verifyRecommendationAfterSync(recommendationId: string): Promise<RecommendationVerificationResult> {
  const rec = await recommendationService.getRecommendationById(recommendationId);
  if (!rec) {
    throw new Error(`Recommendation "${recommendationId}" not found`);
  }

  // If already closed, return current state
  if (rec.lifecycleStatus === 'CONFIRMED_RESOLVED' || rec.lifecycleStatus === 'CLOSED_NO_ACTION') {
    return {
      recommendationId,
      passed: rec.lifecycleStatus === 'CONFIRMED_RESOLVED',
      actualValueFound: rec.expectedValueAfterSync,
      message: `Recommendation is already resolved/closed with status ${rec.lifecycleStatus}.`,
      nextStatus: rec.lifecycleStatus,
    };
  }

  const poNumber = rec.purchaseOrderNumber;
  const itemNumber = rec.purchaseOrderItem;

  const lines = await getAllScheduleLinesForPoItem(poNumber, itemNumber);
  const recordFound = lines.length > 0;

  // Outcome: SOURCE_RECORD_NOT_FOUND
  if (!recordFound) {
    const nextStatus: RecommendationLifecycleStatus = 'BLOCKED';
    const msg = `Source record for PO ${poNumber} Item ${itemNumber} was not found.`;
    
    // Transition status to BLOCKED, owner to BUYER
    const transitioned = await recommendationService.transitionRecommendationStatus(
      recommendationId,
      {
        nextStatus,
        currentOwner: 'BUYER',
        verificationStatus: 'FAILED',
        closureReason: 'Source record not found during sync verification.',
        updatedBy: 'verification-engine',
      },
      rec.version
    );

    // Save verification message and last verified timestamp
    await recommendationService.updateRecommendation(
      recommendationId,
      {
        verificationMessage: msg,
        updatedBy: 'verification-engine',
      },
      transitioned.version
    );

    return {
      recommendationId,
      passed: false,
      message: msg,
      nextStatus,
    };
  }

  // Outcome: PO_CLOSED_OR_CANCELLED
  // Check if all lines are part of a closed or cancelled PO
  const poClosedOrCancelled = lines.every(
    line => line.headerStatus === 'CANCELLED' || line.headerStatus === 'CLOSED'
  );

  if (poClosedOrCancelled) {
    const nextStatus: RecommendationLifecycleStatus = 'CLOSED_NO_ACTION';
    const msg = `Purchase order ${poNumber} is closed or cancelled in ERP.`;

    const transitioned = await recommendationService.transitionRecommendationStatus(
      recommendationId,
      {
        nextStatus,
        currentOwner: 'NONE',
        verificationStatus: 'MANUALLY_CLOSED',
        closureReason: 'PO closed or cancelled in ERP.',
        updatedBy: 'verification-engine',
      },
      rec.version
    );

    await recommendationService.updateRecommendation(
      recommendationId,
      {
        verificationMessage: msg,
        updatedBy: 'verification-engine',
      },
      transitioned.version
    );

    return {
      recommendationId,
      passed: false,
      message: msg,
      nextStatus,
    };
  }

  // Compare expected values
  const fieldName = (rec.verificationField || rec.recommendedSapField || '').toLowerCase().trim();
  const expectedValue = (rec.expectedValueAfterSync || rec.recommendedSapValue || '').trim();

  let passed = false;
  let partialMatch = false;
  let sourceChangedDifferently = false;
  let actualValueFound = '';

  // 1. Verify Delivery Date
  if (fieldName === 'delivery_date' || fieldName === 'deliverydate' || fieldName === 'requested_delivery_date') {
    const expectedNorm = normalizeDate(expectedValue);
    let matchedAny = false;
    let changedToSomethingElse = false;

    for (const line of lines) {
      const reqNorm = normalizeDate(line.requestedDeliveryDate);
      const confNorm = normalizeDate(line.confirmedDeliveryDate);
      
      if (reqNorm === expectedNorm || confNorm === expectedNorm) {
        matchedAny = true;
        actualValueFound = reqNorm || confNorm || '';
        break;
      }
      actualValueFound = reqNorm || confNorm || '';
      changedToSomethingElse = true;
    }

    if (matchedAny) {
      passed = true;
    } else if (changedToSomethingElse) {
      sourceChangedDifferently = true;
    }
  }
  // 2. Verify Quantity
  else if (fieldName === 'quantity' || fieldName === 'ordered_quantity' || fieldName === 'open_quantity' || fieldName === 'orderedquantity' || fieldName === 'openquantity') {
    const expectedQty = parseFloat(expectedValue);
    
    let totalOrdered = 0;
    let totalOpen = 0;
    let totalReceived = 0;

    for (const line of lines) {
      totalOrdered += line.orderedQuantity || 0;
      totalOpen += line.openQuantity || 0;
      totalReceived += line.receivedQuantity || 0;
    }

    actualValueFound = totalOrdered.toString();

    if (totalOrdered === expectedQty || totalOpen === expectedQty) {
      passed = true;
    } else if (totalReceived > 0 && totalOpen > 0) {
      partialMatch = true;
      actualValueFound = `Received ${totalReceived} of ${totalOrdered}`;
    } else {
      sourceChangedDifferently = true;
    }
  }
  // 3. Verify Acknowledgement / Status
  else if (fieldName === 'acknowledgement_status' || fieldName === 'acknowledgementstatus' || fieldName === 'status' || fieldName === 'acknowledgement') {
    let matchedAny = false;

    for (const line of lines) {
      const ackStatus = (line.acknowledgementStatus || '').toUpperCase();
      const lineStatus = (line.status || '').toUpperCase();
      const expectedUpper = expectedValue.toUpperCase();

      if (ackStatus === expectedUpper || lineStatus === expectedUpper) {
        matchedAny = true;
        actualValueFound = line.acknowledgementStatus || line.status || '';
        break;
      }
      actualValueFound = line.acknowledgementStatus || line.status || '';
    }

    if (matchedAny) {
      passed = true;
    }
  }
  // Fallback: Exact match check on any other field
  else {
    let matchedAny = false;
    for (const line of lines) {
      const actualVal = line[rec.verificationField || ''] || line[rec.recommendedSapField || ''];
      if (actualVal !== undefined && String(actualVal).toLowerCase() === expectedValue.toLowerCase()) {
        matchedAny = true;
        actualValueFound = String(actualVal);
        break;
      }
    }
    if (matchedAny) {
      passed = true;
    }
  }

  // Set the next lifecycle state and verification details
  let nextStatus: RecommendationLifecycleStatus = rec.lifecycleStatus;
  let owner = rec.currentOwner;
  let vStatus: VerificationStatus = 'PENDING_NEXT_SYNC';
  let msg = '';

  if (passed) {
    nextStatus = 'CONFIRMED_RESOLVED';
    owner = 'NONE';
    vStatus = 'PASSED';
    msg = `Verification passed. Expected value matches latest source data.`;
  } else if (partialMatch) {
    nextStatus = 'PENDING_BUYER_ACTION';
    owner = 'BUYER';
    vStatus = 'FAILED';
    msg = `Verification partial match. Expected ${expectedValue}, found: ${actualValueFound}.`;
  } else if (sourceChangedDifferently) {
    nextStatus = 'PENDING_BUYER_ACTION';
    owner = 'BUYER';
    vStatus = 'FAILED';
    msg = `Verification source changed differently. Expected ${expectedValue}, found: ${actualValueFound}.`;
  } else {
    nextStatus = 'PENDING_BUYER_ACTION';
    owner = 'BUYER';
    vStatus = 'FAILED';
    msg = `Verification mismatch. Expected ${expectedValue}, found: ${actualValueFound}.`;
  }

  const transitioned = await recommendationService.transitionRecommendationStatus(
    recommendationId,
    {
      nextStatus,
      currentOwner: owner,
      verificationStatus: vStatus,
      updatedBy: 'verification-engine',
    },
    rec.version
  );

  await recommendationService.updateRecommendation(
    recommendationId,
    {
      verificationMessage: msg,
      updatedBy: 'verification-engine',
    },
    transitioned.version
  );

  return {
    recommendationId,
    passed,
    actualValueFound,
    message: msg,
    nextStatus,
  };
}

/**
 * Verifies all open recommendations that are pending next sync verification.
 */
export async function verifyOpenRecommendationsAfterSync() {
  const allRecs = await recommendationService.listOpenRecommendations();
  
  // Filter for recommendations requiring verification check
  const pendingRecs = allRecs.filter(
    r =>
      r.verificationStatus === 'PENDING_NEXT_SYNC' ||
      r.lifecycleStatus === 'PENDING_BUYER_SAP_UPDATE' ||
      r.lifecycleStatus === 'VERIFICATION_PENDING'
  );

  const details: RecommendationVerificationResult[] = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const rec of pendingRecs) {
    try {
      const result = await verifyRecommendationAfterSync(rec.recommendationId);
      details.push(result);
      if (result.passed) {
        passedCount++;
      } else {
        failedCount++;
      }
    } catch (e: any) {
      console.error(`[verification-engine] Error verifying recommendation ${rec.recommendationId}:`, e);
      details.push({
        recommendationId: rec.recommendationId,
        passed: false,
        message: `Error during verification check: ${e.message}`,
        nextStatus: rec.lifecycleStatus,
      });
      failedCount++;
    }
  }

  return {
    totalVerified: pendingRecs.length,
    passedCount,
    failedCount,
    details,
  };
}
