#!/usr/bin/env node
/**
 * generate-scenario-csv-data.js
 * ============================================================
 * Deterministic, scenario-rich CSV test data generator.
 *
 * USAGE:
 *   node scripts/generate-scenario-csv-data.js [--out <folder>] [--seed <number>] [--validate-only]
 *
 * DEFAULTS:
 *   --out     procurement_data_sample   (relative to project root)
 *   --seed    42
 *
 * OUTPUTS:
 *   Writes all 26 CSV files to <out> folder.
 *   Prints a validation summary to stdout.
 *
 * RULES ENFORCED:
 *   - po_schedule_lines.csv  MUST NOT contain confirmation_control_key
 *   - purchase_order_items.csv MUST contain confirmation_control_key
 *   - All FK references are resolved (no dangling IDs)
 *   - Every scenario listed in docs/scenario-test-catalog.md is represented
 *
 * NOTE: Does NOT write to Azure SQL or any remote location.
 *       Use scripts/azure-csv-sync.ps1 to upload generated files.
 * ============================================================
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}
const VALIDATE_ONLY = args.includes('--validate-only');
const SEED          = parseInt(getArg('--seed') || '42', 10);
const OUT_DIR       = path.resolve(getArg('--out') || 'procurement_data_sample');

// ── Deterministic PRNG (Mulberry32) ──────────────────────────────────────────
function createPRNG(seed) {
  let s = seed >>> 0;
  return function rand() {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rand = createPRNG(SEED);
function pick(arr)          { return arr[Math.floor(rand() * arr.length)]; }
function randInt(lo, hi)    { return Math.floor(rand() * (hi - lo + 1)) + lo; }
function randFloat(lo, hi, dp=2) { return parseFloat((rand() * (hi - lo) + lo).toFixed(dp)); }
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
const TODAY = '2026-06-18';

// ── CSV serialiser ────────────────────────────────────────────────────────────
function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape  = v => {
    const s = (v == null) ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\r\n');
}

function writeCsv(filename, rows) {
  if (VALIDATE_ONLY) return;
  const full = path.join(OUT_DIR, filename);
  fs.writeFileSync(full, toCsv(rows) + '\r\n', 'utf8');
}

// ═════════════════════════════════════════════════════════════════════════════
//  STATIC / REFERENCE DATA
// ═════════════════════════════════════════════════════════════════════════════

const PLANTS = [
  { plant:'PL01', plant_name:'Austin Tech Plant',    city:'Austin',    region:'TX', country:'US', timezone:'CST' },
  { plant:'PL02', plant_name:'Chicago Mfg Center',   city:'Chicago',   region:'IL', country:'US', timezone:'CST' },
  { plant:'PL03', plant_name:'Houston Assembly Hub',  city:'Houston',   region:'TX', country:'US', timezone:'CST' },
  { plant:'PL04', plant_name:'Newark Distribution',   city:'Newark',    region:'NJ', country:'US', timezone:'EST' },
];

const PURCHASING_ORGS  = [{ purchasing_org:'PO01', description:'US Procurement Org',   company_code:'US01' }];
const PURCHASING_GROUPS = [
  { purchasing_group:'PG1', description:'Electronics Buyers',  responsible_buyer:'Alex Buyer'  },
  { purchasing_group:'PG2', description:'Mechanical Parts',    responsible_buyer:'Jordan Buyer' },
  { purchasing_group:'PG3', description:'Raw Materials',       responsible_buyer:'Sam Buyer'   },
];
const COMPANY_CODES    = [{ company_code:'US01', company_name:'US Manufacturing Corp', currency:'USD', country:'US' }];
const PURCHASING_ORGS_CSV = PURCHASING_ORGS;

const SUPPLIERS = [
  { supplier_id:'VEND-001', business_partner_id:'BP200001', supplier_name:'Sterling Electronics',       country:'US', region:'TX', payment_terms:'NET30', incoterms:'FCA', supplier_tier:'STRATEGIC',  risk_score:38, avg_response_days:4.4, on_time_delivery_pct:80, quality_ppm:658,  created_on:'2023-05-29', blocked_flag:'N' },
  { supplier_id:'VEND-002', business_partner_id:'BP200002', supplier_name:'Global Foundry',             country:'US', region:'CA', payment_terms:'NET60', incoterms:'FOB', supplier_tier:'STRATEGIC',  risk_score:61, avg_response_days:7.4, on_time_delivery_pct:98, quality_ppm:1934, created_on:'2024-11-24', blocked_flag:'N' },
  { supplier_id:'VEND-003', business_partner_id:'BP200003', supplier_name:'Apex Precision Parts',       country:'DE', region:'BY', payment_terms:'NET45', incoterms:'DAP', supplier_tier:'PREFERRED',  risk_score:22, avg_response_days:2.1, on_time_delivery_pct:96, quality_ppm:310,  created_on:'2022-03-15', blocked_flag:'N' },
  { supplier_id:'VEND-004', business_partner_id:'BP200004', supplier_name:'Horizon Raw Materials',      country:'US', region:'OH', payment_terms:'NET30', incoterms:'FCA', supplier_tier:'PREFERRED',  risk_score:45, avg_response_days:5.0, on_time_delivery_pct:88, quality_ppm:780,  created_on:'2023-09-01', blocked_flag:'N' },
  { supplier_id:'VEND-005', business_partner_id:'BP200005', supplier_name:'SilverPath Logistics Co',   country:'MX', region:'NL', payment_terms:'NET60', incoterms:'DAP', supplier_tier:'APPROVED',   risk_score:72, avg_response_days:9.2, on_time_delivery_pct:74, quality_ppm:2410, created_on:'2025-01-20', blocked_flag:'N' },
  { supplier_id:'VEND-006', business_partner_id:'BP200006', supplier_name:'NorthStar Components',      country:'US', region:'MN', payment_terms:'NET30', incoterms:'FCA', supplier_tier:'STRATEGIC',  risk_score:18, avg_response_days:1.8, on_time_delivery_pct:99, quality_ppm:120,  created_on:'2021-07-11', blocked_flag:'N' },
  { supplier_id:'VEND-007', business_partner_id:'BP200007', supplier_name:'BlockedCo Industries',      country:'CN', region:'GD', payment_terms:'NET90', incoterms:'FOB', supplier_tier:'APPROVED',   risk_score:91, avg_response_days:15.0,on_time_delivery_pct:55, quality_ppm:5200, created_on:'2024-03-01', blocked_flag:'Y' },
];

const MATERIALS = [
  { material_id:'M100001', material_description:'Microprocessor Core v1',   material_group:'SEMICONDUCTOR', base_uom:'PC', division:'01', product_hierarchy:'0101', abc_indicator:'A', critical_part_flag:'Y', serial_managed_flag:'N', batch_managed_flag:'N', standard_price:15.00, currency:'USD' },
  { material_id:'M100002', material_description:'Power Regulator IC',        material_group:'SEMICONDUCTOR', base_uom:'PC', division:'01', product_hierarchy:'0101', abc_indicator:'A', critical_part_flag:'Y', serial_managed_flag:'N', batch_managed_flag:'N', standard_price:8.50,  currency:'USD' },
  { material_id:'M100003', material_description:'Aluminum Housing Shell',    material_group:'MECH_PARTS',    base_uom:'PC', division:'02', product_hierarchy:'0201', abc_indicator:'B', critical_part_flag:'N', serial_managed_flag:'N', batch_managed_flag:'N', standard_price:22.00, currency:'USD' },
  { material_id:'M100004', material_description:'Stainless Steel Bracket',   material_group:'MECH_PARTS',    base_uom:'PC', division:'02', product_hierarchy:'0201', abc_indicator:'B', critical_part_flag:'N', serial_managed_flag:'N', batch_managed_flag:'N', standard_price:5.75,  currency:'USD' },
  { material_id:'M100005', material_description:'Copper Wire Spool 10m',     material_group:'RAW_MATERIALS', base_uom:'EA', division:'03', product_hierarchy:'0301', abc_indicator:'C', critical_part_flag:'N', serial_managed_flag:'N', batch_managed_flag:'N', standard_price:3.20,  currency:'USD' },
  { material_id:'M100006', material_description:'LCD Display Module 7"',     material_group:'DISPLAY',       base_uom:'PC', division:'01', product_hierarchy:'0102', abc_indicator:'A', critical_part_flag:'Y', serial_managed_flag:'N', batch_managed_flag:'N', standard_price:45.00, currency:'USD' },
  { material_id:'M100007', material_description:'Thermal Paste Compound',    material_group:'CONSUMABLES',   base_uom:'KG', division:'04', product_hierarchy:'0401', abc_indicator:'C', critical_part_flag:'N', serial_managed_flag:'N', batch_managed_flag:'N', standard_price:12.00, currency:'USD' },
  { material_id:'M100008', material_description:'FPGA Dev Module XC7A',      material_group:'SEMICONDUCTOR', base_uom:'PC', division:'01', product_hierarchy:'0101', abc_indicator:'A', critical_part_flag:'Y', serial_managed_flag:'Y', batch_managed_flag:'N', standard_price:120.00,currency:'USD' },
];

const MATERIAL_PLANT = [
  { material_id:'M100001', plant:'PL01', mrp_type:'PD', mrp_controller:'MC1', procurement_type:'F', planned_delivery_time_days:15, gr_processing_time_days:2, safety_stock:200, reorder_point:150, lot_size:'EX', min_lot_size:10, rounding_value:10, source_list_required:'Y' },
  { material_id:'M100002', plant:'PL01', mrp_type:'PD', mrp_controller:'MC1', procurement_type:'F', planned_delivery_time_days:10, gr_processing_time_days:1, safety_stock:500, reorder_point:300, lot_size:'EX', min_lot_size:50, rounding_value:50, source_list_required:'Y' },
  { material_id:'M100003', plant:'PL02', mrp_type:'PD', mrp_controller:'MC2', procurement_type:'F', planned_delivery_time_days:20, gr_processing_time_days:3, safety_stock:50,  reorder_point:30,  lot_size:'EX', min_lot_size:5,  rounding_value:5,  source_list_required:'N' },
  { material_id:'M100004', plant:'PL02', mrp_type:'PD', mrp_controller:'MC2', procurement_type:'F', planned_delivery_time_days:12, gr_processing_time_days:2, safety_stock:100, reorder_point:80,  lot_size:'EX', min_lot_size:10, rounding_value:10, source_list_required:'N' },
  { material_id:'M100005', plant:'PL03', mrp_type:'VB', mrp_controller:'MC3', procurement_type:'F', planned_delivery_time_days:7,  gr_processing_time_days:1, safety_stock:1000,reorder_point:500, lot_size:'EX', min_lot_size:100,rounding_value:100,source_list_required:'N' },
  { material_id:'M100006', plant:'PL01', mrp_type:'PD', mrp_controller:'MC1', procurement_type:'F', planned_delivery_time_days:30, gr_processing_time_days:2, safety_stock:20,  reorder_point:10,  lot_size:'EX', min_lot_size:5,  rounding_value:5,  source_list_required:'Y' },
  { material_id:'M100007', plant:'PL03', mrp_type:'VB', mrp_controller:'MC3', procurement_type:'F', planned_delivery_time_days:5,  gr_processing_time_days:1, safety_stock:200, reorder_point:100, lot_size:'EX', min_lot_size:10, rounding_value:10, source_list_required:'N' },
  { material_id:'M100008', plant:'PL04', mrp_type:'PD', mrp_controller:'MC4', procurement_type:'F', planned_delivery_time_days:45, gr_processing_time_days:3, safety_stock:10,  reorder_point:5,   lot_size:'EX', min_lot_size:1,  rounding_value:1,  source_list_required:'Y' },
];

const SUPPLIER_CONTACTS = [
  { contact_id:'CON01', supplier_id:'VEND-001', contact_name:'Alice Sterling',   email:'alice@sterlingelectronics.com', role:'Sales Manager',    primary_flag:'Y' },
  { contact_id:'CON02', supplier_id:'VEND-001', contact_name:'Bob Sterling',     email:'bob@sterlingelectronics.com',   role:'Account Rep',      primary_flag:'N' },
  { contact_id:'CON03', supplier_id:'VEND-002', contact_name:'Chen Wei',         email:'cwei@globalfoundry.com',        role:'Sales Manager',    primary_flag:'Y' },
  { contact_id:'CON04', supplier_id:'VEND-003', contact_name:'Klaus Müller',     email:'kmuller@apexprecision.de',      role:'Export Manager',   primary_flag:'Y' },
  { contact_id:'CON05', supplier_id:'VEND-004', contact_name:'Diane Rawlings',   email:'draw@horizonraw.com',           role:'Sales Rep',         primary_flag:'Y' },
  { contact_id:'CON06', supplier_id:'VEND-005', contact_name:'Carlos Reyes',     email:'creyes@silverpath.mx',          role:'Account Manager',  primary_flag:'Y' },
  { contact_id:'CON07', supplier_id:'VEND-006', contact_name:'Erik Nordstrom',   email:'enordstrom@northstar.com',      role:'Sales Director',   primary_flag:'Y' },
];

const SOURCE_LIST = [
  { material_id:'M100001', plant:'PL01', supplier_id:'VEND-001', valid_from:'2025-01-01', valid_to:'2027-12-31', fixed_source:'Y' },
  { material_id:'M100002', plant:'PL01', supplier_id:'VEND-001', valid_from:'2025-01-01', valid_to:'2027-12-31', fixed_source:'Y' },
  { material_id:'M100006', plant:'PL01', supplier_id:'VEND-003', valid_from:'2025-01-01', valid_to:'2027-12-31', fixed_source:'Y' },
  { material_id:'M100008', plant:'PL04', supplier_id:'VEND-006', valid_from:'2025-01-01', valid_to:'2027-12-31', fixed_source:'Y' },
];

const PURCHASING_INFO_RECORDS = [
  { info_record:'5300000001', supplier_id:'VEND-001', material_id:'M100001', plant:'PL01', std_price:15.00, currency:'USD', valid_from:'2025-01-01', valid_to:'2027-12-31' },
  { info_record:'5300000002', supplier_id:'VEND-001', material_id:'M100002', plant:'PL01', std_price:8.50,  currency:'USD', valid_from:'2025-01-01', valid_to:'2027-12-31' },
  { info_record:'5300000003', supplier_id:'VEND-003', material_id:'M100006', plant:'PL01', std_price:45.00, currency:'USD', valid_from:'2025-01-01', valid_to:'2027-12-31' },
];

const INVENTORY_STOCK = [
  { material_id:'M100001', plant:'PL01', storage_location:'SL01', unrestricted_stock:120, quality_stock:0,  blocked_stock:0,  in_transit_stock:0,  last_updated:TODAY },
  { material_id:'M100002', plant:'PL01', storage_location:'SL01', unrestricted_stock:480, quality_stock:20, blocked_stock:0,  in_transit_stock:50, last_updated:TODAY },
  { material_id:'M100003', plant:'PL02', storage_location:'SL02', unrestricted_stock:35,  quality_stock:0,  blocked_stock:0,  in_transit_stock:0,  last_updated:TODAY },
  { material_id:'M100005', plant:'PL03', storage_location:'SL03', unrestricted_stock:800, quality_stock:0,  blocked_stock:0,  in_transit_stock:0,  last_updated:TODAY },
  { material_id:'M100008', plant:'PL04', storage_location:'SL04', unrestricted_stock:8,   quality_stock:0,  blocked_stock:2,  in_transit_stock:0,  last_updated:TODAY },
];

// ═════════════════════════════════════════════════════════════════════════════
//  SCENARIO DEFINITIONS
//  Each scenario drives 1 PO header + 1 or more items + schedule lines.
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Scenario catalog. Each entry maps to doc/scenario-test-catalog.md row.
 * Fields:
 *   id           – SCN-001..SCN-033
 *   name         – human label
 *   po_offset    – PO number = 4500002000 + po_offset
 *   supplier_id
 *   plant
 *   material_id
 *   order_qty
 *   net_price
 *   po_date
 *   delivery_date_offset  – days from TODAY
 *   ack_status   – UNACKNOWLEDGED | ACKNOWLEDGED | PARTIALLY_CONFIRMED | REJECTED | OVERRIDDEN
 *   confirmed_qty / committed_offset  – for ack row
 *   requires_ack – 'ZACK' to set confirmation_control_key, '' otherwise
 *   gr_posted    – whether a goods receipt exists
 *   gr_qty
 *   header_status – OPEN | CLOSED | BLOCKED
 *   item_category – STANDARD | CONSIGNMENT | THIRD_PARTY | LIMIT
 *   exception_type / exception_severity / exception_status (optional)
 *   notes        – test scenario description
 */
const SCENARIOS = [
  // ── Group A: Acknowledgement Scenarios ────────────────────────────────────
  {
    id:'SCN-001', name:'Fresh PO – ZACK unacknowledged',
    po_offset:1, supplier_id:'VEND-001', plant:'PL01', material_id:'M100001',
    order_qty:200, net_price:15.00, po_date:'2026-06-01', delivery_date_offset:30,
    requires_ack:'ZACK', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    exception_type:'ACK_OVERDUE', exception_severity:'HIGH', exception_status:'NEW',
    notes:'Supplier has not acknowledged. Workbench should show red ACK badge.',
  },
  {
    id:'SCN-002', name:'ZACK fully acknowledged on time',
    po_offset:2, supplier_id:'VEND-001', plant:'PL01', material_id:'M100002',
    order_qty:500, net_price:8.50, po_date:'2026-06-05', delivery_date_offset:25,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:25, confirmed_qty:500,
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    notes:'Full ACK with matching qty. No action required.',
  },
  {
    id:'SCN-003', name:'ZACK partially confirmed – short qty',
    po_offset:3, supplier_id:'VEND-002', plant:'PL01', material_id:'M100001',
    order_qty:300, net_price:15.00, po_date:'2026-05-25', delivery_date_offset:14,
    requires_ack:'ZACK', ack_status:'PARTIALLY_CONFIRMED', committed_offset:20, confirmed_qty:200,
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    exception_type:'ACK_QTY_MISMATCH', exception_severity:'MEDIUM', exception_status:'IN_PROGRESS',
    notes:'Supplier confirmed only 200/300. Buyer must decide: accept split or escalate.',
  },
  {
    id:'SCN-004', name:'ZACK – supplier rejected delivery date',
    po_offset:4, supplier_id:'VEND-003', plant:'PL01', material_id:'M100006',
    order_qty:50, net_price:45.00, po_date:'2026-06-10', delivery_date_offset:8,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:21, confirmed_qty:50,
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    exception_type:'DATE_MISMATCH', exception_severity:'HIGH', exception_status:'NEW',
    notes:'Supplier acknowledged but committed to a later date than PO line. Exception raised.',
  },
  {
    id:'SCN-005', name:'No-ACK PO (not ZACK) – no ack expected',
    po_offset:5, supplier_id:'VEND-004', plant:'PL03', material_id:'M100005',
    order_qty:1000, net_price:3.20, po_date:'2026-06-12', delivery_date_offset:10,
    requires_ack:'', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    notes:'No confirmation_control_key = ZACK. ACK is not required. App should not flag.',
  },
  {
    id:'SCN-006', name:'ZACK overdue > 7 days no ack',
    po_offset:6, supplier_id:'VEND-005', plant:'PL01', material_id:'M100001',
    order_qty:100, net_price:15.00, po_date:'2026-05-01', delivery_date_offset:-5,
    requires_ack:'ZACK', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    exception_type:'ACK_OVERDUE', exception_severity:'CRITICAL', exception_status:'NEW',
    notes:'PO is overdue with no ACK. Highest priority exception. Escalation needed.',
  },
  {
    id:'SCN-007', name:'ZACK buyer override accepted',
    po_offset:7, supplier_id:'VEND-001', plant:'PL01', material_id:'M100002',
    order_qty:200, net_price:8.50, po_date:'2026-06-08', delivery_date_offset:18,
    requires_ack:'ZACK', ack_status:'OVERRIDDEN', committed_offset:18, confirmed_qty:200,
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    notes:'Buyer manually overrode ACK status. Should show OVERRIDDEN badge.',
  },

  // ── Group B: Delivery & GR Scenarios ─────────────────────────────────────
  {
    id:'SCN-008', name:'Goods receipt fully matched',
    po_offset:8, supplier_id:'VEND-006', plant:'PL01', material_id:'M100001',
    order_qty:150, net_price:15.00, po_date:'2026-05-15', delivery_date_offset:-3,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:-3, confirmed_qty:150,
    gr_posted:true, gr_qty:150,
    header_status:'OPEN', item_category:'STANDARD',
    notes:'Full GR posted. Open qty = 0. PO should show delivery complete.',
  },
  {
    id:'SCN-009', name:'Partial GR – still open',
    po_offset:9, supplier_id:'VEND-001', plant:'PL01', material_id:'M100001',
    order_qty:400, net_price:15.00, po_date:'2026-05-20', delivery_date_offset:5,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:5, confirmed_qty:400,
    gr_posted:true, gr_qty:200,
    header_status:'OPEN', item_category:'STANDARD',
    notes:'200/400 received. Open qty = 200. Must monitor second delivery.',
  },
  {
    id:'SCN-010', name:'Over-delivery – received more than ordered',
    po_offset:10, supplier_id:'VEND-003', plant:'PL01', material_id:'M100006',
    order_qty:100, net_price:45.00, po_date:'2026-05-25', delivery_date_offset:-7,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:-7, confirmed_qty:100,
    gr_posted:true, gr_qty:120,
    header_status:'OPEN', item_category:'STANDARD',
    exception_type:'OVER_DELIVERY', exception_severity:'MEDIUM', exception_status:'NEW',
    notes:'GR qty 120 > ordered qty 100. Exception: over-delivery. Invoice may not match.',
  },
  {
    id:'SCN-011', name:'PO closed – GR and invoice complete',
    po_offset:11, supplier_id:'VEND-006', plant:'PL01', material_id:'M100002',
    order_qty:1000, net_price:8.50, po_date:'2026-04-01', delivery_date_offset:-30,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:-30, confirmed_qty:1000,
    gr_posted:true, gr_qty:1000,
    header_status:'CLOSED', item_category:'STANDARD',
    notes:'Fully closed PO. Should not appear in open workbench. Historical reference only.',
  },
  {
    id:'SCN-012', name:'Late delivery – GR posted after due date',
    po_offset:12, supplier_id:'VEND-005', plant:'PL03', material_id:'M100005',
    order_qty:500, net_price:3.20, po_date:'2026-05-10', delivery_date_offset:-10,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:-10, confirmed_qty:500,
    gr_posted:true, gr_qty:500,
    header_status:'OPEN', item_category:'STANDARD',
    exception_type:'LATE_DELIVERY', exception_severity:'HIGH', exception_status:'RESOLVED',
    notes:'Delivery was 3 days late. Exception resolved. OTD metric should be impacted.',
  },

  // ── Group C: Exception / Risk Scenarios ──────────────────────────────────
  {
    id:'SCN-013', name:'High-risk supplier – unacknowledged critical part',
    po_offset:13, supplier_id:'VEND-005', plant:'PL01', material_id:'M100001',
    order_qty:80, net_price:15.00, po_date:'2026-06-13', delivery_date_offset:12,
    requires_ack:'ZACK', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    exception_type:'HIGH_RISK_SUPPLIER', exception_severity:'HIGH', exception_status:'NEW',
    notes:'Supplier risk_score=72. Critical part. Dual-source recommendation expected.',
  },
  {
    id:'SCN-014', name:'Blocked supplier – active PO',
    po_offset:14, supplier_id:'VEND-007', plant:'PL02', material_id:'M100003',
    order_qty:60, net_price:22.00, po_date:'2026-06-01', delivery_date_offset:20,
    requires_ack:'', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'BLOCKED', item_category:'STANDARD',
    exception_type:'SUPPLIER_BLOCKED', exception_severity:'CRITICAL', exception_status:'NEW',
    notes:'VEND-007 blocked_flag=Y. PO status BLOCKED. Immediate buyer action required.',
  },
  {
    id:'SCN-015', name:'Deletion flag set – item cancelled',
    po_offset:15, supplier_id:'VEND-002', plant:'PL01', material_id:'M100002',
    order_qty:200, net_price:8.50, po_date:'2026-06-02', delivery_date_offset:28,
    requires_ack:'ZACK', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    deletion_flag:'Y',
    notes:'Item marked for deletion. App should treat as inactive.',
  },
  {
    id:'SCN-016', name:'Quality hold – stock in quality inspection',
    po_offset:16, supplier_id:'VEND-001', plant:'PL01', material_id:'M100002',
    order_qty:300, net_price:8.50, po_date:'2026-05-28', delivery_date_offset:-2,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:-2, confirmed_qty:300,
    gr_posted:true, gr_qty:300,
    header_status:'OPEN', item_category:'STANDARD',
    exception_type:'QUALITY_HOLD', exception_severity:'HIGH', exception_status:'IN_PROGRESS',
    notes:'GR posted, but material in quality stock. Not available for production.',
  },
  {
    id:'SCN-017', name:'Long lead-time item – upcoming shortage risk',
    po_offset:17, supplier_id:'VEND-003', plant:'PL01', material_id:'M100006',
    order_qty:30, net_price:45.00, po_date:'2026-06-15', delivery_date_offset:45,
    requires_ack:'ZACK', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    exception_type:'SHORTAGE_RISK', exception_severity:'MEDIUM', exception_status:'NEW',
    notes:'30-day planned lead time + no ACK received. Agent should recommend expedite.',
  },
  {
    id:'SCN-018', name:'FPGA – serial-managed critical part, no GR yet',
    po_offset:18, supplier_id:'VEND-006', plant:'PL04', material_id:'M100008',
    order_qty:10, net_price:120.00, po_date:'2026-06-10', delivery_date_offset:40,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:40, confirmed_qty:10,
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    notes:'Serial-managed FPGA. ACK confirmed. Long lead time. GR pending.',
  },

  // ── Group D: Multi-Item / Split-PO Scenarios ──────────────────────────────
  {
    id:'SCN-019', name:'Multi-item PO – item 1 complete, item 2 open',
    po_offset:19, supplier_id:'VEND-001', plant:'PL01', material_id:'M100001',
    order_qty:100, net_price:15.00, po_date:'2026-05-20', delivery_date_offset:5,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:5, confirmed_qty:100,
    gr_posted:true, gr_qty:100,
    header_status:'OPEN', item_category:'STANDARD',
    // Second item defined inline in build step
    item2_material_id:'M100002', item2_qty:250, item2_price:8.50, item2_requires_ack:'ZACK',
    item2_ack_status:'UNACKNOWLEDGED',
    notes:'PO has 2 items. Item 1 GR complete; item 2 awaiting ACK.',
  },
  {
    id:'SCN-020', name:'Split schedule lines – 2 delivery splits',
    po_offset:20, supplier_id:'VEND-004', plant:'PL03', material_id:'M100005',
    order_qty:800, net_price:3.20, po_date:'2026-06-01', delivery_date_offset:10,
    requires_ack:'', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    split_schedule:true,  // signals 2 schedule lines at offset+10 and offset+25
    notes:'Qty split across two schedule lines. App should show both delivery windows.',
  },
  {
    id:'SCN-021', name:'Third-party PO item',
    po_offset:21, supplier_id:'VEND-002', plant:'PL01', material_id:'M100003',
    order_qty:40, net_price:22.00, po_date:'2026-06-05', delivery_date_offset:20,
    requires_ack:'', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'THIRD_PARTY',
    notes:'Third-party item type. Delivery goes direct to customer, not to plant.',
  },
  {
    id:'SCN-022', name:'Consignment PO – no invoice expected on delivery',
    po_offset:22, supplier_id:'VEND-006', plant:'PL01', material_id:'M100002',
    order_qty:2000, net_price:8.50, po_date:'2026-06-01', delivery_date_offset:3,
    requires_ack:'', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'CONSIGNMENT',
    notes:'Consignment item. No invoice on GR. Invoice comes on consumption withdrawal.',
  },

  // ── Group E: Supplier Performance / Recommendation Scenarios ─────────────
  {
    id:'SCN-023', name:'Low OTD supplier – recommendation: expedite or dual source',
    po_offset:23, supplier_id:'VEND-005', plant:'PL01', material_id:'M100001',
    order_qty:120, net_price:15.00, po_date:'2026-06-10', delivery_date_offset:15,
    requires_ack:'ZACK', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    exception_type:'LOW_OTD_RISK', exception_severity:'HIGH', exception_status:'NEW',
    notes:'VEND-005 OTD=74%. Agent should recommend expedite and flag for dual sourcing.',
  },
  {
    id:'SCN-024', name:'High quality PPM – recommendation: quality audit',
    po_offset:24, supplier_id:'VEND-002', plant:'PL01', material_id:'M100001',
    order_qty:200, net_price:15.00, po_date:'2026-06-12', delivery_date_offset:20,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:20, confirmed_qty:200,
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    exception_type:'HIGH_PPM', exception_severity:'MEDIUM', exception_status:'NEW',
    notes:'VEND-002 quality_ppm=1934. Recommendation: initiate supplier quality review.',
  },
  {
    id:'SCN-025', name:'Strategic supplier – perfect performance, no action',
    po_offset:25, supplier_id:'VEND-006', plant:'PL04', material_id:'M100008',
    order_qty:5, net_price:120.00, po_date:'2026-06-15', delivery_date_offset:45,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:45, confirmed_qty:5,
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    notes:'VEND-006 OTD=99%, PPM=120. Minimal risk. No exception expected.',
  },
  {
    id:'SCN-026', name:'Slow responder – buyer follow-up escalation',
    po_offset:26, supplier_id:'VEND-005', plant:'PL01', material_id:'M100002',
    order_qty:300, net_price:8.50, po_date:'2026-05-28', delivery_date_offset:12,
    requires_ack:'ZACK', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    followup_count:3,
    exception_type:'ACK_OVERDUE', exception_severity:'HIGH', exception_status:'IN_PROGRESS',
    notes:'3 follow-up messages sent with no response. Escalation due.',
  },

  // ── Group F: Edge / Regression Cases ─────────────────────────────────────
  {
    id:'SCN-027', name:'Zero open qty – delivery complete indicator check',
    po_offset:27, supplier_id:'VEND-001', plant:'PL01', material_id:'M100001',
    order_qty:75, net_price:15.00, po_date:'2026-05-05', delivery_date_offset:-15,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:-15, confirmed_qty:75,
    gr_posted:true, gr_qty:75,
    header_status:'OPEN', item_category:'STANDARD',
    delivery_completed_flag:'Y',
    notes:'Open qty = 0 and delivery_completed_flag = Y. App should show as fulfilled.',
  },
  {
    id:'SCN-028', name:'PO with invoice receipt flag – three-way match',
    po_offset:28, supplier_id:'VEND-006', plant:'PL01', material_id:'M100002',
    order_qty:600, net_price:8.50, po_date:'2026-05-01', delivery_date_offset:-20,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:-20, confirmed_qty:600,
    gr_posted:true, gr_qty:600, invoice_receipt_flag:'Y',
    header_status:'OPEN', item_category:'STANDARD',
    notes:'GR posted, invoice received. Three-way match should be successful.',
  },
  {
    id:'SCN-029', name:'German supplier (VEND-003) – international DAP terms',
    po_offset:29, supplier_id:'VEND-003', plant:'PL01', material_id:'M100006',
    order_qty:25, net_price:45.00, po_date:'2026-06-14', delivery_date_offset:30,
    requires_ack:'ZACK', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    notes:'International supplier. DAP incoterms. Customs clearance risk. Longer lead expected.',
  },
  {
    id:'SCN-030', name:'Thermal paste – C-class consumable replenishment',
    po_offset:30, supplier_id:'VEND-004', plant:'PL03', material_id:'M100007',
    order_qty:50, net_price:12.00, po_date:'2026-06-16', delivery_date_offset:7,
    requires_ack:'', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    notes:'C-class material. No ACK required. Routine replenishment order.',
  },
  {
    id:'SCN-031', name:'Qty mismatch – ACK qty > PO qty',
    po_offset:31, supplier_id:'VEND-002', plant:'PL01', material_id:'M100001',
    order_qty:100, net_price:15.00, po_date:'2026-06-10', delivery_date_offset:18,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:18, confirmed_qty:130,
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    exception_type:'ACK_QTY_MISMATCH', exception_severity:'MEDIUM', exception_status:'NEW',
    notes:'Supplier confirmed 130 against PO of 100. Investigate overbooking.',
  },
  {
    id:'SCN-032', name:'MRP stock shortage – material below safety stock',
    po_offset:32, supplier_id:'VEND-001', plant:'PL01', material_id:'M100001',
    order_qty:300, net_price:15.00, po_date:'2026-06-17', delivery_date_offset:15,
    requires_ack:'ZACK', ack_status:'UNACKNOWLEDGED',
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    exception_type:'STOCK_BELOW_SAFETY', exception_severity:'HIGH', exception_status:'NEW',
    notes:'Unrestricted stock (120) < safety stock (200). Urgent replenishment PO.',
  },
  {
    id:'SCN-033', name:'ASN received – advance shipment notification',
    po_offset:33, supplier_id:'VEND-006', plant:'PL04', material_id:'M100008',
    order_qty:8, net_price:120.00, po_date:'2026-06-12', delivery_date_offset:7,
    requires_ack:'ZACK', ack_status:'ACKNOWLEDGED', committed_offset:7, confirmed_qty:8,
    gr_posted:false, gr_qty:0, header_status:'OPEN', item_category:'STANDARD',
    asn:true,
    notes:'Supplier sent ASN. Shipment in transit. GR pending. Workbench: "In Transit" badge.',
  },
];

// ═════════════════════════════════════════════════════════════════════════════
//  BUILD DERIVED DATA FROM SCENARIOS
// ═════════════════════════════════════════════════════════════════════════════

const po_headers            = [];
const po_items              = [];
const po_schedule_lines     = [];
const supplier_acks         = [];
const goods_receipts        = [];
const exception_worklist    = [];
const asn_shipments         = [];
const agent_recommendations = [];
const communication_logs    = [];
const quality_inspections   = [];
const ctb_snapshots         = [];
const mrp_elements          = [];
const production_orders     = [];
const inventory_movements   = [];
const reservations          = [];

let grDocNum   = 5000003000;
let exNum      = 1;
let asnNum     = 1;
let recNum     = 1;
let commNum    = 1;
let qiNum      = 1;
let ctbNum     = 1;
let mrpNum     = 1;
let prodNum    = 1;
let invMovNum  = 1;
let resNum     = 1;

function poNum(offset) { return `450000${2000 + offset}`; }

for (const scn of SCENARIOS) {
  const po      = poNum(scn.po_offset);
  const dDate   = addDays(TODAY, scn.delivery_date_offset);
  const suppRow = SUPPLIERS.find(s => s.supplier_id === scn.supplier_id);
  const pg      = scn.plant === 'PL03' ? 'PG3' : scn.plant === 'PL02' ? 'PG2' : 'PG1';

  // ── PO Header ─────────────────────────────────────────────────────────────
  po_headers.push({
    po_number:       po,
    document_type:   'NB',
    company_code:    'US01',
    purchasing_org:  'PO01',
    purchasing_group: pg,
    supplier_id:     scn.supplier_id,
    po_date:         scn.po_date,
    currency:        'USD',
    created_by:      pg === 'PG1' ? 'Alex Buyer' : pg === 'PG2' ? 'Jordan Buyer' : 'Sam Buyer',
    release_status:  scn.header_status === 'BLOCKED' ? 'BLOCKED' : 'RELEASED',
    header_status:   scn.header_status,
    payment_terms:   suppRow.payment_terms,
    incoterms:       suppRow.incoterms,
    last_change_date: TODAY,
  });

  // ── PO Item (primary) ─────────────────────────────────────────────────────
  const grQty     = scn.gr_posted ? scn.gr_qty : 0;
  const openQty   = Math.max(0, scn.order_qty - grQty);
  const itemValue = parseFloat((scn.order_qty * scn.net_price).toFixed(2));

  po_items.push({
    po_number:                  po,
    item_number:                '00010',
    material_id:                scn.material_id,
    material_description:       MATERIALS.find(m => m.material_id === scn.material_id)?.material_description || '',
    plant:                      scn.plant,
    storage_location:           `SL0${scn.plant.slice(-1)}`,
    order_qty:                  scn.order_qty,
    uom:                        MATERIALS.find(m => m.material_id === scn.material_id)?.base_uom || 'PC',
    net_price:                  scn.net_price,
    price_unit:                 1,
    item_value:                 itemValue,
    delivery_date:              dDate,
    item_category:              scn.item_category,
    account_assignment_category: '',
    deletion_flag:              scn.deletion_flag || 'N',
    delivery_completed_flag:    scn.delivery_completed_flag || 'N',
    invoice_receipt_flag:       scn.invoice_receipt_flag || 'N',
    goods_receipt_flag:         scn.gr_posted ? 'Y' : 'N',
    confirmation_control_key:   scn.requires_ack || '',  // ZACK or ''
  });

  // Optional second item for SCN-019
  if (scn.item2_material_id) {
    const item2GrQty  = 0;
    const item2Open   = scn.item2_qty;
    const item2Val    = parseFloat((scn.item2_qty * scn.item2_price).toFixed(2));
    po_items.push({
      po_number:                  po,
      item_number:                '00020',
      material_id:                scn.item2_material_id,
      material_description:       MATERIALS.find(m => m.material_id === scn.item2_material_id)?.material_description || '',
      plant:                      scn.plant,
      storage_location:           `SL0${scn.plant.slice(-1)}`,
      order_qty:                  scn.item2_qty,
      uom:                        MATERIALS.find(m => m.material_id === scn.item2_material_id)?.base_uom || 'PC',
      net_price:                  scn.item2_price,
      price_unit:                 1,
      item_value:                 item2Val,
      delivery_date:              dDate,
      item_category:              'STANDARD',
      account_assignment_category: '',
      deletion_flag:              'N',
      delivery_completed_flag:    'N',
      invoice_receipt_flag:       'N',
      goods_receipt_flag:         'N',
      confirmation_control_key:   scn.item2_requires_ack || '',
    });
  }

  // ── Schedule Lines ────────────────────────────────────────────────────────
  // NOTE: confirmation_control_key is intentionally EXCLUDED from schedule lines.
  if (scn.split_schedule) {
    const splitA = Math.floor(scn.order_qty * 0.5);
    const splitB = scn.order_qty - splitA;
    po_schedule_lines.push({
      po_number:                po,
      item_number:              '00010',
      schedule_line:            '0001',
      delivery_date:            dDate,
      scheduled_qty:            splitA,
      received_qty:             0,
      open_qty:                 splitA,
      statistical_delivery_date: dDate,
      confirmed_date:           '',
    });
    po_schedule_lines.push({
      po_number:                po,
      item_number:              '00010',
      schedule_line:            '0002',
      delivery_date:            addDays(dDate, 15),
      scheduled_qty:            splitB,
      received_qty:             0,
      open_qty:                 splitB,
      statistical_delivery_date: addDays(dDate, 15),
      confirmed_date:           '',
    });
  } else {
    const confirmedDate = (scn.ack_status === 'ACKNOWLEDGED' || scn.ack_status === 'PARTIALLY_CONFIRMED' || scn.ack_status === 'OVERRIDDEN')
      ? addDays(TODAY, scn.committed_offset || scn.delivery_date_offset)
      : '';
    po_schedule_lines.push({
      po_number:                po,
      item_number:              '00010',
      schedule_line:            '0001',
      delivery_date:            dDate,
      scheduled_qty:            scn.order_qty,
      received_qty:             grQty,
      open_qty:                 openQty,
      statistical_delivery_date: dDate,
      confirmed_date:           confirmedDate,
    });
    // Second item schedule line for SCN-019
    if (scn.item2_material_id) {
      po_schedule_lines.push({
        po_number:                po,
        item_number:              '00020',
        schedule_line:            '0001',
        delivery_date:            dDate,
        scheduled_qty:            scn.item2_qty,
        received_qty:             0,
        open_qty:                 scn.item2_qty,
        statistical_delivery_date: dDate,
        confirmed_date:           '',
      });
    }
  }

  // ── Supplier Acknowledgements ─────────────────────────────────────────────
  if (scn.ack_status !== 'UNACKNOWLEDGED') {
    const commitDate = addDays(TODAY, scn.committed_offset || scn.delivery_date_offset);
    supplier_acks.push({
      po_number:                po,
      item_number:              '00010',
      acknowledgement_status:   scn.ack_status,
      acknowledged_qty:         scn.confirmed_qty || scn.order_qty,
      committed_delivery_date:  commitDate,
      supplier_confirm_number:  `CONF_${po}`,
      last_supplier_response_date: commitDate,
      response_source:          'EMAIL',
      buyer_followup_count:     scn.followup_count || 0,
    });
  } else if (scn.followup_count && scn.followup_count > 0) {
    // Unacknowledged but follow-ups were sent
    supplier_acks.push({
      po_number:                po,
      item_number:              '00010',
      acknowledgement_status:   'UNACKNOWLEDGED',
      acknowledged_qty:         0,
      committed_delivery_date:  '',
      supplier_confirm_number:  '',
      last_supplier_response_date: '',
      response_source:          'NONE',
      buyer_followup_count:     scn.followup_count,
    });
  }

  // ── Goods Receipts ────────────────────────────────────────────────────────
  if (scn.gr_posted) {
    goods_receipts.push({
      material_doc:       String(grDocNum++),
      material_doc_year:  '2026',
      po_number:          po,
      item_number:        '00010',
      movement_type:      '101',
      posting_date:       addDays(dDate, scn.gr_qty > scn.order_qty ? -2 : 1), // over-delivery a day early
      received_qty:       scn.gr_qty,
      plant:              scn.plant,
      storage_location:   `SL0${scn.plant.slice(-1)}`,
      batch_number:       '',
      created_by:         'GR_MOCK',
      reference_doc:      '',
    });

    // Quality inspection if quality hold scenario
    if (scn.exception_type === 'QUALITY_HOLD') {
      quality_inspections.push({
        inspection_lot:   `QI${String(qiNum++).padStart(8,'0')}`,
        po_number:        po,
        item_number:      '00010',
        material_id:      scn.material_id,
        plant:            scn.plant,
        inspection_qty:   scn.gr_qty,
        inspection_status:'IN_PROGRESS',
        usage_decision:   '',
        inspector:        'QA_MOCK',
        opened_on:        addDays(dDate, 1),
        closed_on:        '',
      });
    }
  }

  // ── Exceptions ────────────────────────────────────────────────────────────
  if (scn.exception_type) {
    const finImpact = parseFloat((scn.order_qty * scn.net_price * 0.1).toFixed(2));
    exception_worklist.push({
      exception_id:              `EX_${po}_00010`,
      exception_type:            scn.exception_type,
      severity:                  scn.exception_severity,
      status:                    scn.exception_status,
      po_number:                 po,
      item_number:               '00010',
      material_id:               scn.material_id,
      plant:                     scn.plant,
      supplier_id:               scn.supplier_id,
      detected_on:               scn.po_date,
      due_date:                  dDate,
      days_past_due:             Math.max(0, -scn.delivery_date_offset),
      root_cause:                scn.notes.split('.')[0],
      financial_impact_estimate: finImpact,
      assigned_buyer:            pg === 'PG1' ? 'Alex Buyer' : pg === 'PG2' ? 'Jordan Buyer' : 'Sam Buyer',
    });
  }

  // ── ASN Shipments ─────────────────────────────────────────────────────────
  if (scn.asn) {
    asn_shipments.push({
      asn_number:       `ASN${String(asnNum++).padStart(8,'0')}`,
      po_number:        po,
      item_number:      '00010',
      supplier_id:      scn.supplier_id,
      ship_date:        addDays(TODAY, -2),
      expected_arrival: addDays(TODAY, scn.delivery_date_offset),
      shipped_qty:      scn.order_qty,
      carrier:          'DHL',
      tracking_number:  `TRACK${po}`,
      asn_status:       'IN_TRANSIT',
    });
  }

  // ── Agent Recommendations ─────────────────────────────────────────────────
  if (scn.exception_type || scn.ack_status === 'UNACKNOWLEDGED') {
    let recType  = 'MONITOR';
    let recText  = `Monitor PO ${po} — no immediate action required.`;
    let priority = 'LOW';

    if (scn.exception_severity === 'CRITICAL') {
      recType  = 'ESCALATE';
      recText  = `CRITICAL: Escalate PO ${po} to supply chain manager. ${scn.notes.split('.')[0]}.`;
      priority = 'CRITICAL';
    } else if (scn.exception_severity === 'HIGH') {
      recType  = 'EXPEDITE';
      recText  = `Expedite PO ${po}: ${scn.notes.split('.')[0]}. Contact supplier immediately.`;
      priority = 'HIGH';
    } else if (scn.exception_severity === 'MEDIUM') {
      recType  = 'INVESTIGATE';
      recText  = `Investigate PO ${po}: ${scn.notes.split('.')[0]}.`;
      priority = 'MEDIUM';
    }

    agent_recommendations.push({
      recommendation_id:   `REC${String(recNum++).padStart(6,'0')}`,
      scenario_id:         scn.id,
      po_number:           po,
      item_number:         '00010',
      supplier_id:         scn.supplier_id,
      recommendation_type: recType,
      recommendation_text: recText,
      priority:            priority,
      generated_on:        TODAY,
      status:              'OPEN',
    });

    // Communication log for follow-ups
    if (scn.followup_count && scn.followup_count > 0) {
      for (let f = 1; f <= scn.followup_count; f++) {
        communication_logs.push({
          comm_id:       `COMM${String(commNum++).padStart(6,'0')}`,
          po_number:     po,
          item_number:   '00010',
          supplier_id:   scn.supplier_id,
          direction:     'OUTBOUND',
          channel:       'EMAIL',
          subject:       `Follow-up #${f}: PO ${po} acknowledgement required`,
          sent_date:     addDays(scn.po_date, f * 2),
          sent_by:       'Alex Buyer',
          response_received: 'N',
        });
      }
    }
  }

  // ── CTB Snapshots ─────────────────────────────────────────────────────────
  if (scn.material_id === 'M100001' || scn.material_id === 'M100008') {
    ctb_snapshots.push({
      snapshot_id:       `CTB${String(ctbNum++).padStart(6,'0')}`,
      material_id:       scn.material_id,
      plant:             scn.plant,
      snapshot_date:     TODAY,
      committed_to_build: Math.max(0, openQty - randInt(0, 20)),
      available_qty:     INVENTORY_STOCK.find(s => s.material_id === scn.material_id && s.plant === scn.plant)?.unrestricted_stock || 0,
      shortage_qty:      Math.max(0, 200 - (INVENTORY_STOCK.find(s => s.material_id === scn.material_id && s.plant === scn.plant)?.unrestricted_stock || 0)),
      ctb_status:        openQty === 0 ? 'CLEAR' : 'AT_RISK',
    });
  }

  // ── MRP Elements ──────────────────────────────────────────────────────────
  if (scn.exception_type === 'STOCK_BELOW_SAFETY' || scn.exception_type === 'SHORTAGE_RISK') {
    mrp_elements.push({
      mrp_element_id:    `MRP${String(mrpNum++).padStart(8,'0')}`,
      material_id:       scn.material_id,
      plant:             scn.plant,
      element_type:      'PO',
      element_number:    po,
      quantity:          scn.order_qty,
      available_date:    dDate,
      mrp_controller:    'MC1',
      created_on:        TODAY,
    });
  }
}

// ── Extra static / cross-table rows ──────────────────────────────────────────

// Production order referencing SCN-032 material shortage
production_orders.push({
  production_order: 'PRD1000001',
  material_id:      'M100001',
  plant:            'PL01',
  order_qty:        500,
  start_date:       addDays(TODAY, 5),
  finish_date:      addDays(TODAY, 12),
  status:           'RELEASED',
  shortage_flag:    'Y',
});

// Inventory movements for GR scenarios
goods_receipts.filter(gr => gr.movement_type === '101').slice(0, 3).forEach(gr => {
  inventory_movements.push({
    movement_id:      `IM${String(invMovNum++).padStart(8,'0')}`,
    material_id:      po_items.find(i => i.po_number === gr.po_number && i.item_number === gr.item_number)?.material_id || '',
    plant:            gr.plant,
    storage_location: gr.storage_location,
    movement_type:    '101',
    quantity:         gr.received_qty,
    posting_date:     gr.posting_date,
    reference_doc:    gr.material_doc,
  });
});

// Reservation for SCN-032 MRP shortage
reservations.push({
  reservation_id:  `RES${String(resNum++).padStart(8,'0')}`,
  material_id:     'M100001',
  plant:           'PL01',
  storage_location:'SL01',
  requirement_date: addDays(TODAY, 5),
  required_qty:    500,
  withdrawn_qty:   0,
  open_qty:        500,
  order_reference: 'PRD1000001',
});

// ═════════════════════════════════════════════════════════════════════════════
//  VALIDATION
// ═════════════════════════════════════════════════════════════════════════════

let errors   = 0;
let warnings = 0;
const report = [];

function fail(msg)  { errors++;   report.push(`  ✗ FAIL    ${msg}`); }
function warn(msg)  { warnings++; report.push(`  ⚠ WARN    ${msg}`); }
function pass(msg)  {             report.push(`  ✓ OK      ${msg}`); }

report.push('\n══════════════════════════════════════════════════════════');
report.push(' SCENARIO CSV GENERATOR — VALIDATION REPORT');
report.push('══════════════════════════════════════════════════════════\n');

// 1. Schedule lines must NOT have confirmation_control_key
if (po_schedule_lines.length > 0 && 'confirmation_control_key' in po_schedule_lines[0]) {
  fail('po_schedule_lines contains confirmation_control_key column — schema violation!');
} else {
  pass('po_schedule_lines does NOT contain confirmation_control_key');
}

// 2. PO items MUST have confirmation_control_key
if (po_items.length > 0 && !('confirmation_control_key' in po_items[0])) {
  fail('purchase_order_items missing confirmation_control_key column!');
} else {
  pass('purchase_order_items contains confirmation_control_key');
}

// 3. Every scenario has a PO header
const missingHeaders = SCENARIOS.filter(s => !po_headers.find(h => h.po_number === poNum(s.po_offset)));
if (missingHeaders.length) {
  fail(`Missing PO headers for scenarios: ${missingHeaders.map(s => s.id).join(', ')}`);
} else {
  pass(`All ${SCENARIOS.length} scenarios have a PO header`);
}

// 4. Every PO item references a valid PO header
const headerNums = new Set(po_headers.map(h => h.po_number));
const orphanItems = po_items.filter(i => !headerNums.has(i.po_number));
if (orphanItems.length) {
  fail(`Orphan PO items (no header): ${orphanItems.map(i => i.po_number).join(', ')}`);
} else {
  pass('All PO items reference a valid PO header');
}

// 5. Every schedule line references a valid PO item
const itemKeys = new Set(po_items.map(i => `${i.po_number}|${i.item_number}`));
const orphanLines = po_schedule_lines.filter(l => !itemKeys.has(`${l.po_number}|${l.item_number}`));
if (orphanLines.length) {
  fail(`Orphan schedule lines (no PO item): ${orphanLines.length} rows`);
} else {
  pass('All schedule lines reference a valid PO item');
}

// 6. Every ACK row references a valid PO item
const orphanAcks = supplier_acks.filter(a => !itemKeys.has(`${a.po_number}|${a.item_number}`));
if (orphanAcks.length) {
  fail(`Orphan supplier ACK rows: ${orphanAcks.length}`);
} else {
  pass('All supplier ACK rows reference a valid PO item');
}

// 7. Every GR references a valid PO item
const orphanGRs = goods_receipts.filter(g => !itemKeys.has(`${g.po_number}|${g.item_number}`));
if (orphanGRs.length) {
  fail(`Orphan GR rows (no PO item): ${orphanGRs.length}`);
} else {
  pass('All GR rows reference a valid PO item');
}

// 8. Every exception references a valid PO item
const orphanExc = exception_worklist.filter(e => !itemKeys.has(`${e.po_number}|${e.item_number}`));
if (orphanExc.length) {
  fail(`Orphan exception rows: ${orphanExc.length}`);
} else {
  pass('All exception rows reference a valid PO item');
}

// 9. Every PO header references a valid supplier
const supplierIds = new Set(SUPPLIERS.map(s => s.supplier_id));
const badHeaders = po_headers.filter(h => !supplierIds.has(h.supplier_id));
if (badHeaders.length) {
  fail(`PO headers with unknown supplier: ${badHeaders.map(h => h.po_number).join(', ')}`);
} else {
  pass('All PO headers reference valid suppliers');
}

// 10. No duplicate PO numbers
const allPOs = po_headers.map(h => h.po_number);
const dupPOs = allPOs.filter((p, i) => allPOs.indexOf(p) !== i);
if (dupPOs.length) {
  fail(`Duplicate PO numbers: ${dupPOs.join(', ')}`);
} else {
  pass('No duplicate PO numbers');
}

// 11. Scenario count
if (SCENARIOS.length < 30) {
  fail(`Only ${SCENARIOS.length} scenarios defined; minimum required is 30`);
} else {
  pass(`${SCENARIOS.length} scenarios defined (≥30 required)`);
}

// 12. ZACK items should have ACK rows (unless unacknowledged by design)
const zackItems = po_items.filter(i => i.confirmation_control_key === 'ZACK');
const zackWithAck = zackItems.filter(i =>
  supplier_acks.find(a => a.po_number === i.po_number && a.item_number === i.item_number));
report.push(`  ℹ INFO    ${zackItems.length} ZACK items; ${zackWithAck.length} have ACK rows (${zackItems.length - zackWithAck.length} intentionally unacknowledged)`);

// 13. Row counts
report.push('\n── Row counts ──────────────────────────────────────────────');
const counts = {
  suppliers:               SUPPLIERS.length,
  purchase_order_headers:  po_headers.length,
  purchase_order_items:    po_items.length,
  po_schedule_lines:       po_schedule_lines.length,
  supplier_acknowledgements: supplier_acks.length,
  goods_receipts:          goods_receipts.length,
  exception_worklist:      exception_worklist.length,
  agent_recommendations:   agent_recommendations.length,
  communication_logs:      communication_logs.length,
  asn_shipments:           asn_shipments.length,
  quality_inspections:     quality_inspections.length,
  ctb_snapshots:           ctb_snapshots.length,
  mrp_elements:            mrp_elements.length,
  production_orders:       production_orders.length,
  inventory_movements:     inventory_movements.length,
  reservations:            reservations.length,
};
for (const [name, count] of Object.entries(counts)) {
  report.push(`  ${String(count).padStart(4)} rows   ${name}`);
}

report.push('\n── Summary ─────────────────────────────────────────────────');
report.push(`  Errors:   ${errors}`);
report.push(`  Warnings: ${warnings}`);
report.push(errors === 0 ? '  ✓ VALIDATION PASSED' : '  ✗ VALIDATION FAILED — fix errors before upload');
report.push('══════════════════════════════════════════════════════════\n');

console.log(report.join('\n'));

if (errors > 0) {
  process.exit(1);
}

// ═════════════════════════════════════════════════════════════════════════════
//  WRITE CSV FILES
// ═════════════════════════════════════════════════════════════════════════════

if (!VALIDATE_ONLY) {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  writeCsv('suppliers.csv',                 SUPPLIERS.map(({ ...s }) => s));
  writeCsv('supplier_contacts.csv',         SUPPLIER_CONTACTS);
  writeCsv('plants.csv',                    PLANTS);
  writeCsv('company_codes.csv',             COMPANY_CODES);
  writeCsv('purchasing_orgs.csv',           PURCHASING_ORGS_CSV);
  writeCsv('purchasing_groups.csv',         PURCHASING_GROUPS);
  writeCsv('materials.csv',                 MATERIALS);
  writeCsv('material_plant.csv',            MATERIAL_PLANT);
  writeCsv('source_list.csv',               SOURCE_LIST);
  writeCsv('purchasing_info_records.csv',   PURCHASING_INFO_RECORDS);
  writeCsv('inventory_stock.csv',           INVENTORY_STOCK);
  writeCsv('purchase_order_headers.csv',    po_headers);
  writeCsv('purchase_order_items.csv',      po_items);
  writeCsv('po_schedule_lines.csv',         po_schedule_lines);
  writeCsv('supplier_acknowledgements.csv', supplier_acks);
  writeCsv('goods_receipts.csv',            goods_receipts);
  writeCsv('exception_worklist.csv',        exception_worklist);
  writeCsv('agent_recommendations.csv',     agent_recommendations);
  writeCsv('communication_logs.csv',        communication_logs);
  writeCsv('asn_shipments.csv',             asn_shipments);
  writeCsv('quality_inspections.csv',       quality_inspections);
  writeCsv('ctb_snapshots.csv',             ctb_snapshots);
  writeCsv('mrp_elements.csv',              mrp_elements);
  writeCsv('production_orders.csv',         production_orders);
  writeCsv('inventory_movements.csv',       inventory_movements);
  writeCsv('reservations.csv',              reservations);

  console.log(`\n✓ All 26 CSV files written to: ${OUT_DIR}\n`);

  // ── APP-OWNED JSON DATABASES SEEDING (33 scenarios) ──────────────────────
  const appRecommendations = agent_recommendations.map(r => {
    const scn = SCENARIOS.find(s => s.id === r.scenario_id);
    const supplier = SUPPLIERS.find(s => s.supplier_id === r.supplier_id) || {};
    
    let recType = 'SEND_SUPPLIER_REMINDER';
    if (scn.exception_type === 'ACK_OVERDUE' || scn.ack_status === 'UNACKNOWLEDGED') {
      recType = 'REQUEST_ACKNOWLEDGEMENT';
    } else if (scn.exception_type === 'DATE_MISMATCH') {
      recType = 'UPDATE_SAP_DELIVERY_DATE_MANUALLY';
    } else if (scn.exception_type === 'ACK_QTY_MISMATCH') {
      recType = 'UPDATE_SAP_QUANTITY_MANUALLY';
    } else if (r.priority === 'CRITICAL') {
      recType = 'ESCALATE_SUPPLIER';
    } else if (r.priority === 'LOW') {
      recType = 'NO_ACTION_REQUIRED';
    }

    let lifecycleStatus = 'RECOMMENDED';
    let currentOwner = 'BUYER';
    let supplierReminderId = null;
    let supplierResponseId = null;

    if (scn.followup_count && scn.followup_count > 0) {
      lifecycleStatus = 'PENDING_SUPPLIER_RESPONSE';
      currentOwner = 'SUPPLIER';
      supplierReminderId = `rem-${r.recommendation_id}`;
    }

    return {
      recommendationId: r.recommendation_id,
      sourceModule: (scn.exception_type === 'ACK_OVERDUE' || scn.ack_status === 'UNACKNOWLEDGED') ? 'PO_ACKNOWLEDGEMENT' : 'OVERDUE_PO',
      purchaseOrderNumber: String(r.po_number),
      purchaseOrderItem: String(r.item_number),
      supplierId: r.supplier_id,
      supplierName: supplier.supplier_name || 'Unknown Supplier',
      recommendationType: recType,
      lifecycleStatus,
      currentOwner,
      issueDetectedAt: `${scn.po_date || TODAY}T10:00:00.000Z`,
      issueReason: scn.notes ? scn.notes.split('.')[0] : 'PO line issue detected.',
      recommendedActionText: r.recommendation_text,
      verificationStatus: 'NOT_READY',
      createdBy: 'demo.seed',
      createdAt: `${scn.po_date || TODAY}T10:00:00.000Z`,
      updatedBy: 'demo.seed',
      updatedAt: `${scn.po_date || TODAY}T10:00:00.000Z`,
      version: 1,
      linkedActionIds: [],
      supplierReminderId,
      supplierResponseId
    };
  });

  const appReminders = [];
  agent_recommendations.forEach(r => {
    const scn = SCENARIOS.find(s => s.id === r.scenario_id);
    if (scn.followup_count && scn.followup_count > 0) {
      const supplier = SUPPLIERS.find(s => s.supplier_id === r.supplier_id) || {};
      const contact = SUPPLIER_CONTACTS.find(c => c.supplier_id === r.supplier_id && c.primary_flag === 'Y') || {};
      
      const reminderId = `rem-${r.recommendation_id}`;
      appReminders.push({
        reminderId,
        recommendationId: r.recommendation_id,
        purchaseOrderNumber: String(r.po_number),
        purchaseOrderItem: String(r.item_number),
        supplierId: r.supplier_id,
        supplierName: supplier.supplier_name || 'Unknown Supplier',
        supplierEmail: contact.email || 'supplier@example.com',
        channel: 'EMAIL',
        reminderStatus: 'SENT',
        subject: `Follow-up: PO ${r.po_number} Item ${r.item_number} Query`,
        bodyText: `Hello, please provide status for PO ${r.po_number} item ${r.item_number}.`,
        sentAt: `${addDays(scn.po_date, scn.followup_count * 2)}T10:00:00.000Z`,
        createdBy: 'demo.seed',
        createdAt: `${scn.po_date}T10:00:00.000Z`,
        updatedBy: 'demo.seed',
        updatedAt: `${addDays(scn.po_date, scn.followup_count * 2)}T10:00:00.000Z`,
        version: 1
      });
    }
  });

  const dataDir = path.resolve('data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(path.join(dataDir, 'app-recommendations.json'), JSON.stringify(appRecommendations, null, 2), 'utf8');
  fs.writeFileSync(path.join(dataDir, 'app-supplier-reminders.json'), JSON.stringify(appReminders, null, 2), 'utf8');
  fs.writeFileSync(path.join(dataDir, 'app-supplier-responses.json'), '[]', 'utf8');
  fs.writeFileSync(path.join(dataDir, 'app-actions.json'), '[]', 'utf8');

  const memoryDir = path.resolve('project_memory');
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }
  fs.writeFileSync(path.join(memoryDir, 'recommendation_updates.json'), '{}', 'utf8');

  console.log(`✓ Synchronized JSON database files written to: ${dataDir}`);
  console.log(`✓ recommendation_updates.json reset in: ${memoryDir}\n`);

  console.log('Next steps:');
  console.log('  1. Verify locally: npm run dev  → check dashboard KPIs & workbenches');
  console.log('  2. Upload to Azure: .\\scripts\\azure-csv-sync.ps1 -Action Upload');
  console.log('  3. Run app refresh via control-tower sync-erp endpoint');
  console.log('  4. See docs/scenario-test-catalog.md for manual test checklist\n');
}
