import { NextResponse } from 'next/server';
import { getExceptionAnalytics } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const analytics = await getExceptionAnalytics();
    return NextResponse.json(analytics);
  } catch (err: any) {
    console.error('Exception analytics API error:', err);
    return NextResponse.json({ error: 'Failed to compute exception analytics.' }, { status: 500 });
  }
}
