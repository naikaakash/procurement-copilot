# 🎨 UI Patterns & Design Rules

_Dark slate glassmorphism theme — NO external CSS libraries_

---

## Color System

```css
/* Core backgrounds */
--bg-primary:    #0f0f1a;   /* page background */
--bg-panel:      #1a1a2e;   /* sidebar, cards */
--bg-elevated:   #16213e;   /* drawers, modals */
--bg-hover:      #2a2a4e;   /* hover states */

/* Borders */
--border-subtle: #2a2a4e;
--border-accent: #3a3a5e;

/* Text */
--text-primary:  #e0e0e0;
--text-secondary:#aaa;
--text-muted:    #666;

/* Severity / Status Colors */
--critical:  #ef4444;   /* red */
--high:      #f97316;   /* orange */
--medium:    #eab308;   /* yellow */
--low:       #22c55e;   /* green */
--info:      #3b82f6;   /* blue */

/* Accent */
--accent:    #4E79A7;   /* primary brand blue */
```

---

## Badge Pattern

```typescript
// Severity badge
function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#22c55e',
  };
  return (
    <span style={{
      background: colors[severity] + '22',
      color: colors[severity],
      border: `1px solid ${colors[severity]}44`,
      borderRadius: '4px',
      padding: '2px 6px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.05em',
    }}>
      {severity}
    </span>
  );
}
```

---

## Card / Glassmorphic Widget

```css
.kpi-card {
  background: rgba(26, 26, 46, 0.8);
  border: 1px solid #2a2a4e;
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  transition: border-color 0.2s;
}
.kpi-card:hover {
  border-color: #4E79A7;
}
```

---

## Table Pattern

```css
.worklist-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.worklist-table th {
  background: #1a1a2e;
  color: #aaa;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 12px;
  border-bottom: 1px solid #2a2a4e;
  text-align: left;
}
.worklist-table td { padding: 10px 12px; border-bottom: 1px solid #1a1a2e; }
.worklist-table tr:hover td { background: #1a1a2e; cursor: pointer; }
```

---

## Drawer (Side Panel) Pattern

```css
.detail-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 480px;
  height: 100vh;
  background: #1a1a2e;
  border-left: 1px solid #2a2a4e;
  overflow-y: auto;
  z-index: 1000;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}
.detail-drawer.open {
  transform: translateX(0);
}
```

**Critical:** Use `position: fixed` not `position: absolute` — otherwise drawer hides behind scrollable viewport (known bug from ai_memory/bug_fixes.md).

---

## Tab Navigation Pattern

```typescript
const tabs = [
  { id: 'overview', label: '📊 Executive Overview' },
  { id: 'overdue', label: '⏳ Overdue PO Workbench' },
  // ... etc
];

// Tab render
{activeTab === 'copilot' && <ProcurementCopilotTab />}
```

New tabs for Phase 3+ follow same pattern — add to sidebar nav array and add conditional render.

---

## Loading State Pattern

```typescript
{loading ? (
  <div style={{ color: '#aaa', padding: '40px', textAlign: 'center' }}>
    Loading...
  </div>
) : data.length === 0 ? (
  <div style={{ color: '#555', padding: '40px', textAlign: 'center' }}>
    No data available
  </div>
) : (
  <YourTable data={data} />
)}
```

---

## New Tab Structure Template (for Phases 3–5)

```typescript
// Add to sidebar nav
{ id: 'copilot', icon: '🤖', label: 'Procurement Copilot' },

// Add tab content component (inline in page.tsx for MVP, or extract to /components)
function ProcurementCopilotTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    setLoading(true);
    const res = await fetch('/api/copilot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, { role: 'user', content: input }] }),
    });
    const json = await res.json();
    setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'assistant', content: json.reply }]);
    setInput('');
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* chat messages */}
      {/* input bar */}
    </div>
  );
}
```
