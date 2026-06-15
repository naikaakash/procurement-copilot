import { NextResponse } from 'next/server';
import { getCumulativeTokens } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const record = getCumulativeTokens();
    return NextResponse.json({
      totalTokens: record.totalTokens,
      totalCost: record.totalCost,
      lastUpdated: record.lastUpdated,
      sessionCount: record.sessionCount
    });
  } catch (err: any) {
    console.error('Admin metrics route error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve token metrics.' },
      { status: 500 }
    );
  }
}
