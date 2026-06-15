# 🗄️ CSV Join Service Layer Template

Generic file join service matching the decoupled architecture requirements:

```typescript
export async function getRelationalData() {
  const [headers, items] = await Promise.all([
    readCsv('headers.csv'),
    readCsv('items.csv')
  ]);
  return headers.map(h => {
    const matched = items.filter(i => i.id === h.itemId);
    return { ...h, items: matched };
  });
}
```
