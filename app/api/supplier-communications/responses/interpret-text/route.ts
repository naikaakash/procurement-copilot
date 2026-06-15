/**
 * POST /api/supplier-communications/responses/interpret-text
 *
 * Dry-run interpretation utility. Accepts a raw response text, passes it to the
 * local rule-based interpreter, and returns the classification, summary, and
 * any extracted values.
 *
 * Body (JSON):
 *   {
 *     "rawResponseText": "..."
 *   }
 *
 * Phase 8D: Response Interpretation Rules
 */

import { NextRequest } from 'next/server';
import { interpretSupplierResponse } from '@/src/services/supplierResponseInterpreter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: { rawResponseText?: string };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const rawText = body.rawResponseText;
    if (rawText === undefined || rawText === null) {
      return Response.json({ error: 'rawResponseText is required' }, { status: 400 });
    }

    const interpretation = interpretSupplierResponse(rawText);
    return Response.json(interpretation);
  } catch (e) {
    console.error('[POST /api/supplier-communications/responses/interpret-text] Unexpected error:', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
