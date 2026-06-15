# 📦 Starter Templates

*Core templates for setting up clean project layers.*

### 1. Basic API Handler (`Next.js Route.ts`)
```typescript
import { NextRequest } from 'next/server';
import { getServiceData } from '@/src/services/data/myService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const data = await getServiceData();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```
