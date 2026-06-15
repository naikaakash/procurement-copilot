# 🔌 New APIs Needed — Phases 2E through 5

This file lists every new API route and service function Claude must create.
Existing routes must NOT be modified. Add only new routes.

---

## Phase 2E — Buyer Productivity

### `GET /api/buyer-productivity`
**Service function:** `getBuyerProductivity(filters?)`

**Returns:**
```typescript
interface BuyerProductivityItem {
  buyer_id: string;
  total_assigned: number;
  open_count: number;
  resolved_count: number;
  resolution_rate_pct: number;
  avg_days_to_resolve: number;
  financial_exposure: number;
  overdue_count: number;  // open > 7 days
}

interface BuyerProductivitySummary {
  buyers: BuyerProductivityItem[];
  team_resolution_rate: number;
  team_avg_days: number;
  total_open: number;
  total_resolved: number;
}
```

**Derives from:** `exception_worklist.csv` — group by `assigned_buyer`, calculate from `status`, `created_date`, `resolved_date`, `financial_impact_estimate`

---

## Phase 3A — Procurement Copilot

### `POST /api/copilot/chat`
**No service function** — calls Anthropic API directly with injected CSV context

**Request body:**
```typescript
{ messages: Array<{role: 'user'|'assistant', content: string}>, context_mode: 'full'|'scoped' }
```

**Returns:**
```typescript
{ reply: string; sources_used: string[]; tokens_used: number }
```

**Implementation notes:**
- System prompt injects summary stats (total POs, overdue count, top suppliers, critical exceptions)
- Uses `claude-sonnet-4-20250514` model
- Context window: inject last 5 key KPIs + user question
- Streaming optional but preferred for UX

---

## Phase 3B — Root Cause Analysis

### `GET /api/root-cause?exception_id=`
**No service function** — calls Anthropic API with exception detail context

**Returns:**
```typescript
interface RootCauseAnalysis {
  exception_id: string;
  primary_cause: string;           // "Supplier Capacity Issue"
  contributing_factors: string[];  // ["OTD historically < 75%", "No ASN filed"]
  narrative: string;               // 2-3 sentence AI explanation
  confidence: number;              // 0-100
  recommended_action: string;
  similar_past_exceptions: number; // count of same category from this supplier
}
```

---

## Phase 3C — Supplier Intelligence

### `GET /api/supplier-intelligence?supplier_id=`
**Service function:** `getSupplierIntelligenceContext(supplier_id)` — returns raw data
Then passes to Anthropic API for narrative generation

**Returns:**
```typescript
interface SupplierIntelligence {
  supplier_id: string;
  supplier_name: string;
  ai_summary: string;           // 3-4 sentence AI narrative
  risk_flags: string[];         // ["Blocked", "OTD < 75%", "PPM > 800"]
  trend_direction: 'improving'|'stable'|'declining';
  open_exceptions_count: number;
  recommendation: string;       // "Consider dual-sourcing" etc.
}
```

---

## Phase 3D — Predictive Risk

### `GET /api/predictive-risk`
**Service function:** `getPredictiveRiskScores()`

**Returns:**
```typescript
interface PredictiveRiskItem {
  supplier_id: string;
  supplier_name: string;
  delay_risk_score: number;    // 0-100
  shortage_risk_score: number; // 0-100
  risk_factors: string[];
  at_risk_po_count: number;
  at_risk_value: number;
  prediction_horizon_days: number; // how far ahead
}
```

**Logic:** Combine supplier OTD%, open PO count, days until delivery, safety stock levels → weighted score

---

## Phase 3E — Executive AI Insights

### `GET /api/executive-insights`
**No service function** — aggregates existing KPIs then calls Anthropic API

**Returns:**
```typescript
interface ExecutiveInsights {
  generated_at: string;
  week_summary: string;        // AI narrative of the week
  top_risks: string[];         // 3 bullets
  wins: string[];              // resolved exceptions, improved suppliers
  action_items: string[];      // recommended leadership actions
  kpi_snapshot: {
    total_overdue: number;
    critical_count: number;
    resolution_rate: number;
    total_exposure: number;
  }
}
```

---

## Phase 4A — Supplier Reminder Agent

### `GET /api/agents/reminders/pending`
### `POST /api/agents/reminders/approve`
### `POST /api/agents/reminders/send`

**Service functions:**
- `getPendingReminders()` — exceptions > 3 days unacknowledged
- `approveReminder(exception_id, edited_message)` — marks as APPROVED
- `markReminderSent(exception_id)` — marks as SENT, logs timestamp

---

## Phase 4B — Acknowledgement Follow-Up Agent

### `GET /api/agents/ack-followup/queue`
### `POST /api/agents/ack-followup/execute`

**Service functions:**
- `getAckFollowUpQueue()` — POs > N days without ACK, with draft message
- `executeAckFollowUp(exception_id)` — marks as followed up

---

## Phase 4C — Escalation Agent

### `GET /api/agents/escalation/triggers`
### `POST /api/agents/escalation/escalate`

**Service functions:**
- `getEscalationTriggers()` — exceptions exceeding SLA thresholds
- `createEscalation(exception_id, escalation_level, message)` — logs escalation

---

## Phase 5 — Autonomous Platform

### `GET /api/platform/agent-registry`
Lists all active agents, their status, last run time, actions taken

### `POST /api/platform/agent/run`
Triggers an agent run (monitoring, engagement, etc.)

### `GET /api/platform/audit-log`
Full log of all autonomous actions taken — who approved what, when sent
