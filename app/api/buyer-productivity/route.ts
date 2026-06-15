import { NextRequest, NextResponse } from 'next/server';
import { getBuyerProductivityData } from '@/src/services/data/csvDataService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyer = searchParams.get('buyer') || 'ALL';
    const status = searchParams.get('status') || '';
    const severity = searchParams.get('severity') || '';
    const exceptionType = searchParams.get('exceptionType') || '';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const data = await getBuyerProductivityData(
      buyer,
      {
        status: status || undefined,
        severity: severity || undefined,
        exceptionType: exceptionType || undefined,
        search: search || undefined,
        sortBy: sortBy || undefined,
        limit,
        offset
      }
    );

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Buyer productivity API error:', err);
    return NextResponse.json(
      { error: 'Failed to compute buyer productivity data.' },
      { status: 500 }
    );
  }
}
