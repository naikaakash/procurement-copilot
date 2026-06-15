/**
 * POST /api/recommendations/verify-after-sync — Trigger verification check for all open recommendations pending verification
 *
 * Phase 8E: Verification Engine
 */
import { NextRequest } from 'next/server';
import { verifyOpenRecommendationsAfterSync } from '@/src/services/recommendationVerificationService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const summary = await verifyOpenRecommendationsAfterSync();
    return Response.json(summary);
  } catch (e: any) {
    console.error(`[POST /api/recommendations/verify-after-sync] Error:`, e);
    return Response.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
