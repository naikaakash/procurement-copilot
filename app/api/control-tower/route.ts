import { NextRequest, NextResponse } from 'next/server';
import { getControlTowerSummary } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const data = await getControlTowerSummary();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Control Tower API error:', err);
    return NextResponse.json(
      { error: 'Failed to aggregate Control Tower metrics.' },
      { status: 500 }
    );
  }
}
