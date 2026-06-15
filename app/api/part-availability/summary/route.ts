'use server';
import { getPartSummary } from '@/src/services/data/csvDataService';

export async function GET() {
  try {
    const data = await getPartSummary();
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to aggregate part summary.' }, { status: 500 });
  }
}
