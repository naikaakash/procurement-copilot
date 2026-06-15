/**
 * GET   /api/recommendations/[recommendationId] — Retrieve a single recommendation by ID
 * PATCH /api/recommendations/[recommendationId] — Update fields with optimistic concurrency check
 *
 * Phase 8B: Backend Setup
 * Does NOT import csvDataService, SAP, or touch any ERP system.
 */
import { NextRequest } from 'next/server';
import {
  getRecommendationById,
  updateRecommendation,
} from '@/src/services/recommendationService';
import {
  RecommendationConflictError,
  RecommendationNotFoundError,
  RecommendationValidationError,
} from '@/src/types/procurementRecommendations';
import type { RecommendationUpdateInput } from '@/src/types/procurementRecommendations';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/recommendations/[recommendationId]
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ recommendationId: string }> }
) {
  try {
    const { recommendationId } = await params;

    if (!recommendationId) {
      return Response.json({ error: 'Missing recommendationId' }, { status: 400 });
    }

    const rec = await getRecommendationById(recommendationId);
    if (!rec) {
      return Response.json({ error: `Recommendation not found: ${recommendationId}` }, { status: 404 });
    }

    return Response.json(rec);
  } catch (e) {
    console.error('[GET /api/recommendations/[recommendationId]] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/recommendations/[recommendationId]
// Body (JSON): RecommendationUpdateInput & expectedVersion
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ recommendationId: string }> }
) {
  try {
    const { recommendationId } = await params;

    if (!recommendationId) {
      return Response.json({ error: 'Missing recommendationId' }, { status: 400 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { expectedVersion, ...updateFields } = body;

    if (expectedVersion === undefined || expectedVersion === null) {
      return Response.json({ error: "Missing required field: expectedVersion" }, { status: 400 });
    }

    const versionNum = parseInt(expectedVersion, 10);
    if (isNaN(versionNum) || versionNum < 1) {
      return Response.json({ error: "expectedVersion must be a positive integer" }, { status: 400 });
    }

    const updated = await updateRecommendation(
      recommendationId,
      updateFields as RecommendationUpdateInput,
      versionNum
    );

    return Response.json(updated);
  } catch (e) {
    if (e instanceof RecommendationNotFoundError) {
      return Response.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof RecommendationConflictError) {
      return Response.json({ error: e.message }, { status: 409 });
    }
    if (e instanceof RecommendationValidationError) {
      return Response.json({ error: e.message, field: e.field }, { status: 400 });
    }
    console.error('[PATCH /api/recommendations/[recommendationId]] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
