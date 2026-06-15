/**
 * POST /api/recommendations/[recommendationId]/link-action — Link a ProcurementAction ID to a recommendation
 *
 * Phase 8B: Backend Setup
 * Does NOT import csvDataService, SAP, or touch any ERP system.
 */
import { NextRequest } from 'next/server';
import {
  linkActionToRecommendation,
} from '@/src/services/recommendationService';
import {
  RecommendationConflictError,
  RecommendationNotFoundError,
  RecommendationValidationError,
} from '@/src/types/procurementRecommendations';

export const dynamic = 'force-dynamic';

export async function POST(
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

    const { actionId, expectedVersion } = body;

    if (!actionId) {
      return Response.json({ error: "Missing required field: actionId" }, { status: 400 });
    }

    if (expectedVersion === undefined || expectedVersion === null) {
      return Response.json({ error: "Missing required field: expectedVersion" }, { status: 400 });
    }

    const versionNum = parseInt(expectedVersion, 10);
    if (isNaN(versionNum) || versionNum < 1) {
      return Response.json({ error: "expectedVersion must be a positive integer" }, { status: 400 });
    }

    const updated = await linkActionToRecommendation(
      recommendationId,
      actionId,
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
    console.error('[POST /api/recommendations/[recommendationId]/link-action] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
