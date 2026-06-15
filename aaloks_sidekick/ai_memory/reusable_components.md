# 🧩 Reusable Premium Components

*Catalog of standard React/Next.js components matching Aalok's exact UX preferences.*

### 1. Glassmorphic Card Widget
```tsx
export function GlassCard({ title, value }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{title}</span>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>{value}</h3>
    </div>
  );
}
```
