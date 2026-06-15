# 🔄 Reusable Patterns

*Copy-pasteable code patterns for starting backend and UI components.*

### 1. Decoupled CSV Data Service Layer
```typescript
import csv from 'csvtojson';
import path from 'path';

let cache: Record<string, any[]> = {};

export async function readCsv(filename: string): Promise<any[]> {
  const DATA_ROOT = path.join(process.cwd(), 'procurement_data_sample');
  const filePath = path.join(DATA_ROOT, filename);
  if (cache[filename]) return cache[filename];
  const data = await csv().fromFile(filePath);
  cache[filename] = data;
  return data;
}
```

### 2. Viewport-Pinned Fixed Slide Drawer
```css
.detail-drawer {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  width: 450px;
  height: calc(100vh - 2.5rem);
  background: var(--bg-surface);
  box-shadow: var(--shadow-drawer);
  transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 100;
  border-radius: 0.5rem;
}
```
