/**
 * Recommendation Service — Phase 8B: Backend Setup
 *
 * This is the public service entry point for all recommendation reads and writes.
 * API routes should import this file to perform recommendation operations.
 *
 * Rules:
 *   - Serves as the abstraction boundary for mockRecommendationStore.
 *   - Does NOT import csvDataService or procurementDataService.
 *   - Does NOT modify SAP or official ERP data.
 */

import * as store from '@/src/services/mockRecommendationStore';
import type {
  Recommendation,
  RecommendationInput,
  RecommendationUpdateInput,
  RecommendationStatusTransitionInput,
  RecommendationLifecycleStatus,
  RecommendationSourceModule,
  RecommendationCurrentOwner,
} from '@/src/types/procurementRecommendations';

/**
 * Fetch a list of recommendations matching optional filters.
 */
export async function listRecommendations(filters: {
  status?: RecommendationLifecycleStatus;
  supplierId?: string;
  purchaseOrderNumber?: string;
  sourceModule?: RecommendationSourceModule;
  owner?: RecommendationCurrentOwner;
  offset?: number;
  limit?: number;
} = {}): Promise<Recommendation[]> {
  return store.listRecommendations(filters);
}

/**
 * Fetch a single recommendation by ID.
 * Returns null if not found.
 */
export async function getRecommendationById(recommendationId: string): Promise<Recommendation | null> {
  if (!recommendationId?.trim()) {
    return null;
  }
  return store.getRecommendationById(recommendationId);
}

/**
 * Fetch all recommendations linked to a specific Purchase Order Line schedule item.
 */
export async function getRecommendationsForPurchaseOrderLine(
  purchaseOrderNumber: string,
  purchaseOrderItem: string
): Promise<Recommendation[]> {
  if (!purchaseOrderNumber?.trim() || !purchaseOrderItem?.trim()) {
    return [];
  }
  return store.getRecommendationsForPurchaseOrderLine(purchaseOrderNumber, purchaseOrderItem);
}

/**
 * Fetch all recommendations for a vendor.
 */
export async function getRecommendationsForSupplier(supplierId: string): Promise<Recommendation[]> {
  if (!supplierId?.trim()) {
    return [];
  }
  return store.getRecommendationsForSupplier(supplierId);
}

/**
 * Create a new recommendation.
 * Enforces basic field validations.
 */
export async function createRecommendation(input: RecommendationInput): Promise<Recommendation> {
  return store.createRecommendation(input);
}

/**
 * Update general properties of a recommendation.
 * Requires optimistic concurrency version checks.
 */
export async function updateRecommendation(
  recommendationId: string,
  input: RecommendationUpdateInput,
  expectedVersion: number
): Promise<Recommendation> {
  return store.updateRecommendation(recommendationId, input, expectedVersion);
}

/**
 * Transition the lifecycle status of a recommendation.
 * Sets owner and verification status automatically based on target status.
 */
export async function transitionRecommendationStatus(
  recommendationId: string,
  transitionInput: RecommendationStatusTransitionInput,
  expectedVersion: number
): Promise<Recommendation> {
  return store.transitionRecommendationStatus(recommendationId, transitionInput, expectedVersion);
}

/**
 * Link an app-owned ProcurementAction ID to the recommendation history.
 */
export async function linkActionToRecommendation(
  recommendationId: string,
  actionId: string,
  expectedVersion: number
): Promise<Recommendation> {
  return store.linkActionToRecommendation(recommendationId, actionId, expectedVersion);
}

/**
 * Retrieve all active open recommendations.
 */
export async function listOpenRecommendations(): Promise<Recommendation[]> {
  return store.listOpenRecommendations();
}

/**
 * Retrieve recommendations filtered by status.
 */
export async function listRecommendationsByStatus(status: RecommendationLifecycleStatus): Promise<Recommendation[]> {
  return store.listRecommendationsByStatus(status);
}
