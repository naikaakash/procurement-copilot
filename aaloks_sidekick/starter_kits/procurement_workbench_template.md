# 📋 Procurement Workbench UI Blueprint

Use this template to rapidly prototype any grid workbench:

```tsx
export default function WorkbenchLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', padding: '1.25rem', gap: '1.25rem' }}>
      <header>{/* Title and subtitle */}</header>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        {/* KPI Cards */}
      </section>
      <div style={{ display: 'flex', flex: 1, gap: '1.25rem', overflow: 'visible' }}>
        {/* Main Worklist Table Container */}
        {/* Fixed Viewport Drawer */}
      </div>
    </div>
  );
}
```
