#!/usr/bin/env node
/**
 * current-queue-readonly.js
 *
 * Narrow, quiet queue pull scaffold for Back Market clearance-first listing work.
 * Default mode is plan-only. It performs no network calls unless --execute-read is supplied.
 * It never sends Telegram/Slack and contains no Monday/BM mutation calls.
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env', quiet: true });
const fs = require('fs');
const path = require('path');
const { constructBmSku, validateSku } = require('./lib/sku');

const args = process.argv.slice(2);
const EXECUTE_READ = args.includes('--execute-read');
const JSON_OUTPUT = args.includes('--json');
const OUT_IDX = args.indexOf('--out');
const OUT_PATH = OUT_IDX !== -1 ? args[OUT_IDX + 1] : null;

const MAIN_BOARD = 349212843;
const BM_DEVICES_BOARD = 3892194968;
const TO_LIST_GROUP = 'new_group88387__1';
const TO_LIST_STATUS_INDEX = 8;

const MAIN_COLUMNS = [
  'status24',          // listing queue/status
  'status_2_Mjj4GJNQ', // final grade
  'status8',           // colour
  'lookup_mkx1xzd7',   // parts cost
  'formula_mkx1bjqr',  // labour cost
  'formula__1',        // labour hours
  'board_relation5',   // Main -> BM Devices relation, verify before relying
  'board_relation',    // fallback relation id seen in older docs/scripts
];

const BM_DEVICE_COLUMNS = [
  'board_relation5',   // BM Devices -> Main back-link, verify before relying
  'board_relation',
  'text_mkyd4bx3',     // listing id
  'text_mm1dt53s',     // uuid
  'text89',            // SKU
  'text',              // model / A-number
  'status__1',         // RAM
  'color2',            // SSD
  'status7__1',        // CPU
  'status8__1',        // GPU
  'numeric',           // purchase price
  'numeric_mm1mgcgn',  // total fixed cost
  'lookup',            // BM Devices mirror/display name used for A-number fallback
];

function usage() {
  return {
    script: 'scripts/current-queue-readonly.js',
    defaultMode: 'plan-only',
    executeReadFlag: '--execute-read',
    jsonFlag: '--json',
    outFlag: '--out <path>',
    guarantees: [
      'no Telegram/Slack notifications',
      'no Monday mutations',
      'no Back Market mutations',
      'no customer/return/warranty actions',
      'no POST/PUT/PATCH/DELETE calls except Monday GraphQL read query transport when --execute-read is explicitly supplied'
    ]
  };
}

function buildPlan() {
  return {
    ok: true,
    mode: EXECUTE_READ ? 'execute-read' : 'plan-only',
    liveRead: EXECUTE_READ,
    liveMutation: false,
    notifications: false,
    boards: { main: MAIN_BOARD, bmDevices: BM_DEVICES_BOARD },
    queueFilter: { group: TO_LIST_GROUP, statusColumn: 'status24', statusIndex: TO_LIST_STATUS_INDEX },
    columns: { main: MAIN_COLUMNS, bmDevices: BM_DEVICE_COLUMNS },
    outputSchema: {
      classification: 'READY_FOR_LISTING_PROPOSAL | QC_SKU_MISSING | QC_SKU_MISMATCH | MISSING_BM_DEVICE_RELATION | MISSING_FINAL_GRADE | MISSING_SPEC_FIELD | RESOLVER_BLOCKED | COMMERCIAL_REVIEW',
      main_item_id: 'string',
      item_name: 'string',
      bm_device_id: 'string|null',
      listing_id: 'string|null',
      uuid: 'string|null',
      sku_current: 'string|null',
      sku_expected: 'string|null',
      product_id: 'string|null',
      appearance: 'string|null',
      quantity: 'number|null',
      publication_state: 'number|string|null',
      commercial_gate: 'pass | fail | unknown',
      clearance_reason: 'string',
      block_reason: 'string',
      evidence: 'array'
    },
    nextRequiredApproval: EXECUTE_READ ? null : 'approval to run --execute-read for Monday read-only queue pull'
  };
}

function columnText(item, id) {
  const col = (item.column_values || []).find(c => c.id === id);
  return col?.text || col?.display_value || '';
}

function linkedIds(item) {
  const cols = item.column_values || [];
  const rel = cols.find(c => Array.isArray(c.linked_item_ids) && c.linked_item_ids.length);
  return rel?.linked_item_ids || [];
}

function extractModelNumber(...values) {
  for (const value of values) {
    const text = String(value || '').trim();
    if (!text) continue;
    const direct = text.match(/^A\d{4}$/i);
    if (direct) return direct[0].toUpperCase();
    const embedded = text.match(/\bA\d{4}\b/i);
    if (embedded) return embedded[0].toUpperCase();
  }
  return '';
}

function buildSpecs(mainItem, bmDevice) {
  if (!bmDevice) return null;
  const modelColumn = columnText(bmDevice, 'text');
  const lookupDisplay = columnText(bmDevice, 'lookup');
  const deviceName = lookupDisplay || bmDevice.name || mainItem?.name || '';
  const model = extractModelNumber(modelColumn, lookupDisplay, bmDevice.name, mainItem?.name);
  return {
    model,
    ram: columnText(bmDevice, 'status__1'),
    ssd: columnText(bmDevice, 'color2'),
    cpu: columnText(bmDevice, 'status7__1'),
    gpu: columnText(bmDevice, 'status8__1'),
    colour: columnText(mainItem, 'status8'),
    deviceName,
  };
}

function missingSpecFields(specs) {
  const missing = [];
  for (const key of ['model', 'ram', 'ssd', 'cpu', 'gpu', 'colour']) {
    if (!String(specs?.[key] || '').trim()) missing.push(key);
  }
  return missing;
}

function classifyRow(mainItem, bmDevice) {
  const evidence = [];
  const listingId = bmDevice ? columnText(bmDevice, 'text_mkyd4bx3') : '';
  const storedSku = bmDevice ? columnText(bmDevice, 'text89') : '';
  const grade = columnText(mainItem, 'status_2_Mjj4GJNQ');

  if (!bmDevice) {
    return { classification: 'MISSING_BM_DEVICE_RELATION', block_reason: 'Missing BM Devices relation', evidence, expectedSku: null, storedSku: null };
  }
  if (!grade) {
    return { classification: 'MISSING_FINAL_GRADE', block_reason: 'Missing final grade', evidence, expectedSku: null, storedSku };
  }

  const specs = buildSpecs(mainItem, bmDevice);
  const missing = missingSpecFields(specs);
  if (missing.length) {
    return { classification: 'MISSING_SPEC_FIELD', block_reason: `Missing spec field(s): ${missing.join(', ')}`, evidence, expectedSku: null, storedSku, missingFields: missing };
  }

  const expectedSku = constructBmSku(specs, grade);
  const validation = validateSku({ storedSku, expectedSku });
  evidence.push('Main item is in To List queue by status24 index 8');
  evidence.push(`Expected SKU computed from QC/source fields: ${expectedSku}`);

  if (!validation.ok) {
    return {
      classification: validation.code,
      block_reason: validation.code === 'QC_SKU_MISSING' ? 'BM Devices text89 missing; QC SKU handoff required' : 'BM Devices text89 does not match expected SKU',
      evidence,
      expectedSku,
      storedSku: validation.storedSku,
      missingFields: [],
    };
  }

  if (listingId) evidence.push('Existing listing id present; commercial/listing-state review may be needed');
  return {
    classification: listingId ? 'COMMERCIAL_REVIEW' : 'READY_FOR_LISTING_PROPOSAL',
    block_reason: '',
    clearance_reason: listingId ? 'Existing listing linkage present; verify economics and listing state before action' : '',
    evidence,
    expectedSku,
    storedSku,
    missingFields: [],
  };
}

async function mondayRead(query) {
  const token = process.env.MONDAY_APP_TOKEN;
  if (!token) throw new Error('MONDAY_APP_TOKEN missing');
  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!response.ok) throw new Error(`Monday ${response.status}: ${(await response.text()).slice(0, 200)}`);
  return response.json();
}


async function loadBmDevicesReadonly() {
  const all = [];
  let cursor = null;
  while (true) {
    const pagePart = cursor
      ? `next_items_page(limit:200, cursor:${JSON.stringify(cursor)}) { cursor items { id name column_values(ids:${JSON.stringify(BM_DEVICE_COLUMNS)}) { id text ... on BoardRelationValue { linked_item_ids } ... on MirrorValue { display_value } } } }`
      : `boards(ids:[${BM_DEVICES_BOARD}]) { items_page(limit:200) { cursor items { id name column_values(ids:${JSON.stringify(BM_DEVICE_COLUMNS)}) { id text ... on BoardRelationValue { linked_item_ids } ... on MirrorValue { display_value } } } } }`;
    const data = await mondayRead(`{ ${pagePart} }`);
    const page = cursor ? data.data?.next_items_page : data.data?.boards?.[0]?.items_page;
    if (!page?.items?.length) break;
    all.push(...page.items);
    if (!page.cursor) break;
    cursor = page.cursor;
  }
  return all;
}

async function executeRead() {
  const mainQuery = `{
    boards(ids:[${MAIN_BOARD}]) {
      groups(ids:["${TO_LIST_GROUP}"]) {
        items_page(limit:200) {
          items {
            id name
            column_values(ids:${JSON.stringify(MAIN_COLUMNS)}) {
              id text ... on BoardRelationValue { linked_item_ids } ... on MirrorValue { display_value }
            }
          }
        }
      }
    }
  }`;

  const mainData = await mondayRead(mainQuery);
  const mainItems = mainData.data?.boards?.[0]?.groups?.[0]?.items_page?.items || [];
  const toList = mainItems.filter(item => {
    const status = (item.column_values || []).find(c => c.id === 'status24');
    return Number(status?.index) === TO_LIST_STATUS_INDEX || /to list/i.test(status?.text || '');
  });
  // Main board board_relation5 links to the generic Devices board, not BM Devices.
  // BM Devices rows point back to Main via their board_relation column, so load BM Devices
  // read-only and map by linked Main item id.
  const bmDevices = await loadBmDevicesReadonly();
  const bmByMainId = new Map();
  for (const bmDevice of bmDevices) {
    for (const mainId of linkedIds(bmDevice).map(String)) {
      if (!bmByMainId.has(mainId)) bmByMainId.set(mainId, []);
      bmByMainId.get(mainId).push(bmDevice);
    }
  }

  const rows = toList.map(mainItem => {
    const bmCandidates = bmByMainId.get(String(mainItem.id)) || [];
    const bmDevice = bmCandidates[0] || null;
    const bmId = bmDevice ? String(bmDevice.id) : null;
    const classification = classifyRow(mainItem, bmDevice);
    return {
      classification: classification.classification,
      main_item_id: String(mainItem.id),
      item_name: mainItem.name,
      bm_device_id: bmId,
      listing_id: bmDevice ? columnText(bmDevice, 'text_mkyd4bx3') || null : null,
      uuid: bmDevice ? columnText(bmDevice, 'text_mm1dt53s') || null : null,
      sku_current: classification.storedSku || (bmDevice ? columnText(bmDevice, 'text89') || null : null),
      sku_expected: classification.expectedSku || null,
      product_id: null,
      appearance: columnText(mainItem, 'status_2_Mjj4GJNQ') || null,
      quantity: null,
      publication_state: null,
      commercial_gate: 'unknown',
      clearance_reason: classification.clearance_reason || '',
      block_reason: classification.block_reason || '',
      missing_spec_fields: classification.missingFields || [],
      evidence: classification.evidence || []
    };
  });

  return {
    generated_at: new Date().toISOString(),
    mode: 'execute-read',
    liveMutation: false,
    notifications: false,
    row_count: rows.length,
    rows
  };
}

async function main() {
  const plan = buildPlan();
  if (!EXECUTE_READ) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }
  const result = await executeRead();
  if (OUT_PATH) {
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, `${JSON.stringify(result, null, 2)}\n`);
  }
  if (JSON_OUTPUT || !OUT_PATH) console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch(error => {
    console.error(JSON.stringify({ ok: false, error: error.message, usage: usage() }, null, 2));
    process.exit(1);
  });
}

module.exports = {
  usage,
  buildPlan,
  columnText,
  linkedIds,
  classifyRow,
  buildSpecs,
  missingSpecFields,
  extractModelNumber,
  MAIN_BOARD,
  BM_DEVICES_BOARD,
  TO_LIST_GROUP,
  TO_LIST_STATUS_INDEX,
};
