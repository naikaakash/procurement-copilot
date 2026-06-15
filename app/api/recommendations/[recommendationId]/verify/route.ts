/**
 * POST /api/recommendations/[recommendationId]/verify — Trigger sync verification for a single recommendation
 *
 * Phase 8E: Verification Engine
 */
import { NextRequest } from 'next/server';
import { verifyRecommendationAfterSync } from '@/src/services/recommendationVerificationService';
import { RecommendationNotFoundError } from '@/src/types/procurementRecommendations';

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

    const result = await verifyRecommendationAfterSync(recommendationId);
    return Response.json(result);
  } catch (e: any) {
    if (e instanceof RecommendationNotFoundError || e.name === 'RecommendationNotFoundError') {
      return Response.json({ error: e.message }, { status: 404 });
    }
    console.error(`[POST /api/recommendations/[recommendationId]/verify] Error:`, e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
