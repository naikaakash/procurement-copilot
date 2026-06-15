/*
 * seed-sql.js - Idempotent SQL seeder for procurement-copilot.
 *
 * Reads every CSV under procurement_data_sample/, drops + recreates a matching
 * reference table per file, bulk-inserts all rows, then ensures app-state tables
 * (mutable runtime stores) exist without dropping them.
 *
 * Requires env var SQL_CONNECTION_STRING (ADO.NET style).
 *
 *   npm run seed:sql
 * or
 *   $env:SQL_CONNECTION_STRING = az containerapp secret show ... ; node scripts/seed-sql.js
 */

const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const csvtojson = require('csvtojson');

const CSV_DIR = path.join(__dirname, '..', 'procurement_data_sample');

// Composite (and singular) primary keys per table. Tables not listed get a
// synthetic IDENTITY surrogate PK so they remain SELECT-able by row.
const PRIMARY_KEYS = {
  agent_recommendations: ['recommendation_id'],
  asn_shipments: ['asn_number'],
  communication_logs: ['message_id'],
  company_codes: ['company_code'],
  ctb_snapshots: ['snapshot_id'],
  exception_worklist: ['exception_id'],
  // goods_receipts: legitimately has multi-line material docs (multiple item_numbers
  // per material_doc, sometimes duplicates of the same item). No reliable natural
  // composite key exists in the seed CSV - use a synthetic surrogate.
  inventory_movements: ['movement_id'],
  inventory_stock: ['material_id', 'plant', 'storage_location'],
  material_plant: ['material_id', 'plant'],
  materials: ['material_id'],
  mrp_elements: ['mrp_element_id'],
  plants: ['plant'],
  po_schedule_lines: ['po_number', 'item_number', 'schedule_line'],
  production_orders: ['production_order'],
  purchase_order_headers: ['po_number'],
  purchase_order_items: ['po_number', 'item_number'],
  purchasing_groups: ['purchasing_group'],
  purchasing_info_records: ['info_record_id'],
  purchasing_orgs: ['purchasing_org'],
  quality_inspections: ['inspection_lot'],
  reservations: ['reservation_id'],
  source_list: ['material_id', 'plant', 'supplier_id'],
  supplier_acknowledgements: ['po_number', 'item_number'],
  supplier_contacts: ['contact_id'],
  suppliers: ['supplier_id'],
};

// App-state tables - never dropped by this script, only created if missing.
// Each stores a JSON blob keyed by id so the existing TypeScript stores can
// drop in with minimal shape changes.
const APP_STATE_TABLES = [
  'app_actions',
  'app_recommendations',
  'app_supplier_reminders',
  'app_supplier_responses',
  'app_po_mutations',
];

function quote(ident) {
  return '[' + ident.replace(/]/g, ']]') + ']';
}

function readHeader(csvPath) {
  const firstLine = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/, 1)[0];
  return firstLine.split(',').map((h) => h.trim()).filter(Boolean);
}

function buildCreateDdl(table, headers) {
  const pkCols = PRIMARY_KEYS[table] || [];
  const colDefs = headers.map((col) => {
    const isPk = pkCols.includes(col);
    if (isPk) return `${quote(col)} NVARCHAR(128) NOT NULL`;
    return `${quote(col)} NVARCHAR(4000) NULL`;
  });
  if (pkCols.length > 0) {
    const pkClause = `CONSTRAINT ${quote('PK_' + table)} PRIMARY KEY (${pkCols.map(quote).join(', ')})`;
    colDefs.push(pkClause);
  } else {
    colDefs.unshift(`${quote('_row_id')} BIGINT IDENTITY(1,1) PRIMARY KEY`);
  }
  return `CREATE TABLE ${quote(table)} (\n  ${colDefs.join(',\n  ')}\n);`;
}

function buildAppStateDdl(table) {
  return `IF OBJECT_ID(N'${table}', N'U') IS NULL\nBEGIN\n  CREATE TABLE ${quote(table)} (\n    ${quote('id')} NVARCHAR(128) NOT NULL PRIMARY KEY,\n    ${quote('data')} NVARCHAR(MAX) NOT NULL,\n    ${quote('created_at')} DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),\n    ${quote('updated_at')} DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()\n  );\nEND;`;
}

async function loadTable(pool, csvPath) {
  const table = path.basename(csvPath, '.csv');
  const headers = readHeader(csvPath);
  if (headers.length === 0) {
    console.warn(`[skip] ${table}: no headers`);
    return { table, rows: 0 };
  }

  // Drop + create
  await pool.request().batch(`DROP TABLE IF EXISTS ${quote(table)};`);
  await pool.request().batch(buildCreateDdl(table, headers));

  // Parse rows (will be empty array for empty-body CSVs)
  const rows = await csvtojson({ ignoreEmpty: false, checkType: false }).fromFile(csvPath);
  if (rows.length === 0) return { table, rows: 0 };

  // mssql Table for bulk insert
  const t = new sql.Table(table);
  t.create = false;
  for (const col of headers) {
    const isPk = (PRIMARY_KEYS[table] || []).includes(col);
    if (isPk) {
      t.columns.add(col, sql.NVarChar(128), { nullable: false });
    } else {
      t.columns.add(col, sql.NVarChar(4000), { nullable: true });
    }
  }
  for (const row of rows) {
    const values = headers.map((h) => {
      const v = row[h];
      if (v === undefined || v === null || v === '') return null;
      return String(v);
    });
    t.rows.add(...values);
  }

  await pool.request().bulk(t);
  return { table, rows: rows.length };
}

async function ensureAppStateTables(pool) {
  for (const table of APP_STATE_TABLES) {
    await pool.request().batch(buildAppStateDdl(table));
  }
}

async function main() {
  const connStr = process.env.SQL_CONNECTION_STRING;
  if (!connStr) {
    console.error('FATAL: SQL_CONNECTION_STRING env var not set.');
    console.error('Set it via:');
    console.error('  $env:SQL_CONNECTION_STRING = az containerapp secret show -g sap-assistant-rg -n sapassistant-app --secret-name sql-conn --query value -o tsv');
    process.exit(1);
  }

  const config = parseAdoNetConnectionString(connStr);
  console.log(`Connecting to ${config.server}/${config.database} as ${config.user}...`);

  const pool = await sql.connect(config);
  try {
    const csvFiles = fs
      .readdirSync(CSV_DIR)
      .filter((f) => f.endsWith('.csv'))
      .map((f) => path.join(CSV_DIR, f))
      .sort();

    console.log(`Loading ${csvFiles.length} CSV files from ${CSV_DIR}\n`);

    const results = [];
    for (const csvPath of csvFiles) {
      try {
        const result = await loadTable(pool, csvPath);
        results.push(result);
        const rowsLabel = String(result.rows).padStart(4);
        console.log(`  ✓ ${rowsLabel} rows  ${result.table}`);
      } catch (err) {
        console.error(`  ✗ ${path.basename(csvPath)}: ${err.message}`);
        throw err;
      }
    }

    console.log('\nEnsuring app-state tables exist...');
    await ensureAppStateTables(pool);
    for (const t of APP_STATE_TABLES) console.log(`  ✓ ${t}`);

    const totalRefRows = results.reduce((s, r) => s + r.rows, 0);
    console.log(`\nDone. ${results.length} reference tables, ${totalRefRows} rows loaded.`);
  } finally {
    await pool.close();
  }
}

function parseAdoNetConnectionString(str) {
  const parts = {};
  for (const segment of str.split(';')) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim().toLowerCase();
    const value = trimmed.slice(eq + 1).trim();
    parts[key] = value;
  }
  const serverRaw = parts['server'] || parts['data source'] || '';
  const serverHost = serverRaw.replace(/^tcp:/i, '').split(',')[0];
  return {
    server: serverHost,
    database: parts['initial catalog'] || parts['database'] || '',
    user: parts['user id'] || parts['uid'] || '',
    password: parts['password'] || parts['pwd'] || '',
    options: {
      encrypt: true,
      trustServerCertificate: false,
      connectTimeout: 30000,
    },
    pool: { max: 4, min: 0, idleTimeoutMillis: 30000 },
  };
}

main().catch((err) => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});
