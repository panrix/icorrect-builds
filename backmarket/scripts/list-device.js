#!/usr/bin/env node
/**
 * list-device.js — Back Market Listing Script (SOP 06)
 *
 * Modes:
 *   --dry-run   (default) Calculate everything, print results, no actions
 *   --live      Create/reactivate listings and update Monday
 *   --item <id> Process a single Main Board item
 *   (no --item) Process ALL items where status24 = "To List" (index 8)
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });

const fs = require('fs');
const path = require('path');
const { mondayQuery, BOARDS, COLUMNS } = require('./lib/monday');
const { BM_API_HEADERS } = require('./lib/bm-api');
const { createLogger } = require('./lib/logger');

// ─── Config ───────────────────────────────────────────────────────
const BM_BASE = 'https://www.backmarket.co.uk';
const MAIN_BOARD = BOARDS.MAIN;           // 349212843
const BM_DEVICES_BOARD = BOARDS.BM_DEVICES; // 3892194968
const TO_LIST_GROUP = 'new_group88387__1';
const TO_LIST_INDEX = 8;
const LISTED_INDEX = 7;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BM_TELEGRAM_CHAT = '-1003888456344';
const V6_DATA_PATH = '/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json';
const PRODUCT_ID_LOOKUP_PATH = '/home/ricky/builds/bm-scripts/data/product-id-lookup.json';
const SHIPPING_COST = 15;
const LABOUR_RATE = 24; // £/hr
const BM_BUY_FEE_RATE = 0.10;
const BM_SELL_FEE_RATE = 0.10;
const VAT_RATE = 0.1667;
const MIN_PRICE_FACTOR = 0.97; // 3% floor

const log = createLogger('list-device.log');

// ─── Grade Maps ───────────────────────────────────────────────────
const FINAL_GRADE_TO_BM = { Fair: 'FAIR', Good: 'GOOD', Excellent: 'VERY_GOOD' };
const BM_GRADE_TO_SCRAPER = { FAIR: 'Fair', GOOD: 'Good', VERY_GOOD: 'Excellent' };

// ─── CLI Args ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
const isLive = args.includes('--live');
const isDryRun = !isLive;
const itemIdx = args.indexOf('--item');
const singleItemId = itemIdx !== -1 ? args[itemIdx + 1] : null;

// ─── Helpers ──────────────────────────────────────────────────────

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function postTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN) { console.log('[TG] No token, skipping:', text); return; }
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: BM_TELEGRAM_CHAT, text, parse_mode: 'HTML' })
    });
  } catch (e) { console.error('[TG] Post failed:', e.message); }
}

async function bmApiFetch(urlPath, opts = {}) {
  const url = urlPath.startsWith('http') ? urlPath : `${BM_BASE}${urlPath}`;
  const headers = { ...BM_API_HEADERS };
  if (opts.headers) Object.assign(headers, opts.headers);
  const fetchOpts = { ...opts, headers };

  for (let attempt = 1; attempt <= 3; attempt++) {
    const resp = await fetch(url, fetchOpts);
    if (resp.ok) return resp.json();
    const text = await resp.text();
    // Rate limited (HTML response)
    if (resp.status === 429 || text.startsWith('<!') || text.startsWith('<html')) {
      console.warn(`[BM] Rate limited on ${urlPath}, attempt ${attempt}/3, waiting 30s...`);
      await sleep(30000);
      continue;
    }
    throw new Error(`BM API ${resp.status} ${urlPath}: ${text.slice(0, 300)}`);
  }
  throw new Error(`BM API failed after 3 retries: ${urlPath}`);
}

function today() { return new Date().toISOString().slice(0, 10); }

// ─── Step 1: Read Final Grade ─────────────────────────────────────

async function readFinalGrade(mainItemId) {
  const q = `query { items(ids: [${mainItemId}]) {
    name
    column_values(ids: ["status_2_Mjj4GJNQ"]) {
      ... on StatusValue { text index }
    }
  }}`;
  const data = await mondayQuery(q);
  const item = data.items?.[0];
  if (!item) throw new Error(`Main item ${mainItemId} not found`);
  const cv = item.column_values?.[0];
  const gradeText = cv?.text;
  if (!gradeText) {
    const msg = `⛔ Cannot list ${item.name}: Final Grade not set on Main Board.`;
    console.error(msg);
    await postTelegram(msg);
    return null;
  }
  const bmGrade = FINAL_GRADE_TO_BM[gradeText];
  if (!bmGrade) {
    const msg = `⛔ Cannot list ${item.name}: Unknown Final Grade "${gradeText}".`;
    console.error(msg);
    await postTelegram(msg);
    return null;
  }
  return { name: item.name, gradeText, bmGrade };
}

// ─── Step 2: Read Device Specs ────────────────────────────────────

/**
 * Build a map of Main Board item ID → BM Device item (with all specs).
 * We scan BM Devices board groups and read board_relation to find the link.
 */
async function buildBmDeviceMap(mainItemIds) {
  const map = {}; // mainItemId → { bmDeviceId, ...specs }
  const mainIdSet = new Set(mainItemIds.map(String));
  let cursor = null;
  let page = 0;

  // First page
  const firstQ = `query { boards(ids: [${BM_DEVICES_BOARD}]) {
    items_page(limit: 100) {
      cursor
      items {
        id name
        column_values(ids: ["board_relation", "text", "status__1", "color2", "status7__1", "status8__1", "numeric", "lookup", "text_mkyd4bx3", "text_mm1dt53s"]) {
          id text type
          ... on BoardRelationValue { linked_item_ids }
          ... on MirrorValue { display_value }
          ... on NumbersValue { number }
        }
      }
    }
  }}`;
  const firstData = await mondayQuery(firstQ);
  let items = firstData.boards[0].items_page.items;
  cursor = firstData.boards[0].items_page.cursor;

  function processItems(items) {
    for (const item of items) {
      const brCol = item.column_values.find(c => c.id === 'board_relation');
      const linkedIds = brCol?.linked_item_ids || [];
      for (const lid of linkedIds) {
        if (mainIdSet.has(String(lid))) {
          const specs = {};
          for (const cv of item.column_values) {
            if (cv.id === 'text') specs.model = (cv.text || '').trim();
            if (cv.id === 'status__1') specs.ram = cv.text || '';
            if (cv.id === 'color2') specs.ssd = cv.text || '';
            if (cv.id === 'status7__1') specs.cpu = cv.text || '';
            if (cv.id === 'status8__1') specs.gpu = cv.text || '';
            if (cv.id === 'numeric') specs.purchasePrice = parseFloat(cv.text) || 0;
            if (cv.id === 'lookup') specs.deviceName = cv.display_value || '';
            if (cv.id === 'text_mkyd4bx3') specs.storedListingId = (cv.text || '').trim();
            if (cv.id === 'text_mm1dt53s') specs.storedUuid = (cv.text || '').trim();
          }
          // Extract A-number from deviceName if model column is empty
          if (!specs.model && specs.deviceName) {
            const aMatch = specs.deviceName.match(/A\d{4}/);
            if (aMatch) specs.model = aMatch[0];
          }
          map[String(lid)] = {
            bmDeviceId: item.id,
            bmDeviceName: item.name,
            ...specs,
          };
        }
      }
    }
  }

  processItems(items);

  // If all found, skip remaining pages
  const allFound = () => mainItemIds.every(id => map[String(id)]);
  while (cursor && !allFound()) {
    page++;
    const nextQ = `query ($cursor: String!) {
      next_items_page(cursor: $cursor, limit: 100) {
        cursor
        items {
          id name
          column_values(ids: ["board_relation", "text", "status__1", "color2", "status7__1", "status8__1", "numeric", "lookup", "text_mkyd4bx3", "text_mm1dt53s"]) {
            id text type
            ... on BoardRelationValue { linked_item_ids }
            ... on MirrorValue { display_value }
            ... on NumbersValue { number }
          }
        }
      }
    }`;
    const nextData = await mondayQuery(nextQ, { cursor });
    items = nextData.next_items_page.items;
    cursor = nextData.next_items_page.cursor;
    processItems(items);
    if (items.length === 0) break;
  }

  return map;
}

async function readDeviceSpecs(mainItemId, bmDeviceMap) {
  // 2a: Read Main Board data (colour, parts cost, labour hours)
  const mainQ = `query { items(ids: [${mainItemId}]) {
    name
    column_values(ids: ["status8", "formula_mkx1bjqr", "formula__1"]) {
      id
      ... on StatusValue { text }
      ... on FormulaValue { display_value }
    }
  }}`;
  const mainData = await mondayQuery(mainQ);
  const mainItem = mainData.items?.[0];
  if (!mainItem) throw new Error(`Main item ${mainItemId} not found`);

  let colour = '', partsCostStr = '0', labourHoursStr = '0';
  for (const cv of mainItem.column_values) {
    if (cv.id === 'status8') colour = cv.text || '';
    if (cv.id === 'formula_mkx1bjqr') partsCostStr = cv.display_value || '0';
    if (cv.id === 'formula__1') labourHoursStr = cv.display_value || '0';
  }

  // 2b: Get BM Device specs from pre-built map
  const bmDev = bmDeviceMap?.[String(mainItemId)];
  if (!bmDev) throw new Error(`No BM Device found linked to Main item ${mainItemId} on BM Devices Board`);

  const partsCost = parseFloat(String(partsCostStr).replace(/[£,]/g, '')) || 0;
  const labourHours = parseFloat(String(labourHoursStr).replace(/[^0-9.]/g, '')) || 0;

  // Model number: from text column, or parse from device name/item name
  let model = bmDev.model || '';
  if (!model) {
    // Try to extract model number (A####) from device name or item name
    const nameStr = (bmDev.deviceName || '') + ' ' + (bmDev.bmDeviceName || '');
    const modelMatch = nameStr.match(/A\d{4}/);
    if (modelMatch) model = modelMatch[0];
  }

  return {
    bmDeviceId: bmDev.bmDeviceId,
    bmDeviceName: bmDev.bmDeviceName,
    model,
    ram: bmDev.ram || '',
    ssd: bmDev.ssd || '',
    cpu: bmDev.cpu || '',
    gpu: bmDev.gpu || '',
    purchasePrice: bmDev.purchasePrice || 0,
    deviceName: bmDev.deviceName || bmDev.bmDeviceName || '',
    colour,
    partsCost,
    labourHours,
    storedListingId: bmDev.storedListingId || '',
    storedUuid: bmDev.storedUuid || '',
  };
}

// ─── Step 3: Construct SKU ────────────────────────────────────────

function constructSku(specs, gradeText) {
  const { model, cpu, gpu, ram, ssd, colour } = specs;

  // Type from device name
  let type = 'MAC';
  const dn = (specs.deviceName || '').toLowerCase();
  if (dn.includes('air')) type = 'MBA';
  else if (dn.includes('pro')) type = 'MBP';

  // Chip: PRIMARY source is model number lookup (most reliable)
  // Device name can say "M3" when it's actually M3 Pro (e.g. "MacBook Pro 14 M3 A2918")
  const modelChipMap = {
    'A2337': 'M1',                  // Air 13 2020 M1
    // A2179 is Intel Air — NOT in V6 scraper. Uses hardcoded product_id lookup instead.
    'A2681': 'M2',                  // Air 13 2022
    'A3113': 'M3', 'A3114': 'M3',  // Air 13 2024
    'A2338': 'M1',                  // Pro 13 2020
    'A2442': 'M1PRO',              // Pro 14 2021 (or Max)
    'A2485': 'M1PRO',              // Pro 16 2021 (or Max)
    'A2779': 'M2PRO',              // Pro 14 2023
    // A2918/A2992: M3 or M3 Pro — determined by CPU/GPU core counts below
    'A2918': 'M3PRO',              // Pro 14 2023 (default, overridden below)
    'A2992': 'M3PRO',              // Pro 14 2023 (default, overridden below)
    'A2780': 'M2PRO',              // Pro 16 2023
    'A2991': 'M3PRO',              // Pro 16 2023
    'A2941': 'M2',                 // Air 15 2023
    'A2289': 'I5',                 // MBP 13 2020 Intel 2-port
    'A2251': 'I5',                 // MBP 13 2020 Intel 4-port
  };
  let chip = modelChipMap[model] || '';
  // Max distinction from device name for shared model numbers
  // A2442/A2485: distinguish Pro vs Max using GPU core count, NOT device name
  // (device name often says "Pro/Max" which matches both)
  if (chip && (model === 'A2442' || model === 'A2485')) {
    const gpuCores = parseInt((gpu || '').match(/(\d+)/)?.[1] || '0');
    // M1 Max has 24 or 32 GPU cores; M1 Pro has 14 or 16
    if (gpuCores >= 24) chip = chip.replace('PRO', 'MAX');
  }
  // A2918/A2992: distinguish base M3 from M3 Pro using CPU/GPU core counts
  // Base M3 = 8-core CPU, 10-core GPU. M3 Pro = 11c/14c or 12c/18c.
  if (model === 'A2918' || model === 'A2992') {
    const cpuCores = parseInt((cpu || '').match(/(\d+)/)?.[1] || '0');
    const gpuCores = parseInt((gpu || '').match(/(\d+)/)?.[1] || '0');
    if (cpuCores === 8 && gpuCores === 10) {
      chip = 'M3'; // base M3, not Pro
      console.log(`  Chip override: ${model} with ${cpuCores}c CPU/${gpuCores}c GPU → base M3`);
    } else if (cpuCores > 0 || gpuCores > 0) {
      console.log(`  Chip confirmed: ${model} with ${cpuCores}c CPU/${gpuCores}c GPU → M3 Pro`);
    }
  }

  // Fallback: parse from device name if model not in map
  if (!chip) {
    const chipPatterns = [
      { re: /M4\s*Pro/i, chip: 'M4PRO' },
      { re: /M4\s*Max/i, chip: 'M4MAX' },
      { re: /M4/i, chip: 'M4' },
      { re: /M3\s*Pro/i, chip: 'M3PRO' },
      { re: /M3\s*Max/i, chip: 'M3MAX' },
      { re: /M3/i, chip: 'M3' },
      { re: /M2\s*Pro/i, chip: 'M2PRO' },
      { re: /M2\s*Max/i, chip: 'M2MAX' },
      { re: /M2/i, chip: 'M2' },
      { re: /M1\s*Pro/i, chip: 'M1PRO' },
      { re: /M1\s*Max/i, chip: 'M1MAX' },
      { re: /M1/i, chip: 'M1' },
    ];
    for (const p of chipPatterns) {
      if (p.re.test(dn)) { chip = p.chip; break; }
    }
  }
  // Fallback: check CPU column
  if (!chip) {
    const cpuLower = (cpu || '').toLowerCase();
    const chipPatterns = [
      { re: /M4\s*Pro/i, chip: 'M4PRO' }, { re: /M4/i, chip: 'M4' },
      { re: /M3\s*Pro/i, chip: 'M3PRO' }, { re: /M3/i, chip: 'M3' },
      { re: /M2\s*Pro/i, chip: 'M2PRO' }, { re: /M2/i, chip: 'M2' },
      { re: /M1\s*Pro/i, chip: 'M1PRO' }, { re: /M1/i, chip: 'M1' },
    ];
    for (const p of chipPatterns) {
      if (p.re.test(cpuLower)) { chip = p.chip; break; }
    }
  }
  // Fallback: Intel detection from CPU or GPU columns
  if (!chip) {
    const cpuLower = (cpu || '').toLowerCase();
    const gpuLower = (gpu || '').toLowerCase();
    if (cpuLower.includes('i5') || cpuLower === 'i5') chip = 'I5';
    else if (cpuLower.includes('i7') || cpuLower === 'i7') chip = 'I7';
    else if (cpuLower.includes('i9') || cpuLower === 'i9') chip = 'I9';
    else if (cpuLower.includes('i3') || cpuLower === 'i3') chip = 'I3';
    else if (cpuLower.includes('intel') || gpuLower.includes('intel')) chip = 'INTEL';
    else chip = cpu.replace(/\s+/g, '').toUpperCase(); // last resort
  }

  // GPU: only include core count when multiple GPU variants exist for same model
  // e.g. MBA M1 A2337 has 7-core and 8-core GPU
  const variableGpuModels = ['A2337', 'A2681'];
  let gpuPart = '';
  if (variableGpuModels.includes(model) && gpu) {
    const coreMatch = gpu.match(/(\d+)/);
    if (coreMatch) gpuPart = `${coreMatch[1]}C`;
  }

  // Storage normalisation
  let storage = ssd.replace(/\s/g, '');
  if (storage === '1000GB') storage = '1TB';
  if (storage === '2000GB') storage = '2TB';

  // RAM normalisation
  let ramStr = ram.replace(/\s/g, '');

  // Colour normalisation
  let col = colour || 'Grey';
  col = col.replace('Space Gray', 'Grey').replace('Space Grey', 'Grey');

  const parts = [type, model, chip, gpuPart, ramStr, storage, col, gradeText].filter(Boolean);
  return parts.join('.');
}

async function writeSkuToMonday(bmDeviceId, sku) {
  const q = `mutation {
    change_column_value(board_id: ${BM_DEVICES_BOARD}, item_id: ${bmDeviceId},
      column_id: "text89", value: ${JSON.stringify(JSON.stringify(sku))}) { id }
  }`;
  await mondayQuery(q);
}

// ─── Step 4: Get product_id from V6 Scraper ──────────────────────

function loadV6Data() {
  const raw = fs.readFileSync(V6_DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

// Hardcoded model number → V6 scraper key mapping
// This is the single source of truth for model identification. Update when new models are added.
const MODEL_NUMBER_TO_V6 = {
  // MacBook Air
  // A2179 = Intel Air. NOT in V6. Uses INTEL_PRODUCT_IDS lookup below.
  'A2337': 'Air 13" 2020 M1',     // M1
  'A2681': 'Air 13" 2022 M2',     // M2
  'A3113': 'Air 13" 2024 M3',     // M3
  'A3114': 'Air 13" 2024 M3',     // M3 (alternative)
  // Air 15"
  'A2941': 'Air 15" 2023 M2',     // M2
  // MacBook Pro 13"
  'A2338': 'Pro 13" 2020 M1',     // M1
  'A2289': 'Pro 13" 2020 M1',     // Intel but same catalogue
  'A2251': 'Pro 13" 2020 M1',     // Intel 4-port
  'A2442': 'Pro 14" 2021 M1 Pro', // M1 Pro (also M1 Max)
  'A2485': 'Pro 16" 2021 M1 Pro', // M1 Pro (also M1 Max)
  // Pro 14" 2023
  'A2779': 'Pro 14" 2023 M2 Pro', // M2 Pro
  'A2918': 'Pro 14" 2023 M3 Pro', // M3 Pro
  'A2992': 'Pro 14" 2023 M3 Pro', // M3 Pro (alternative model number)
  // Pro 16" 2023
  'A2780': 'Pro 16" 2023 M2 Pro', // M2 Pro
  'A2991': 'Pro 16" 2023 M3 Pro', // M3 Pro
};

// For models that share a model number, check device name or CPU/GPU to resolve
function resolveV6Key(model, deviceName, specs) {
  let key = MODEL_NUMBER_TO_V6[model];
  if (!key) return null;
  const dnLower = (deviceName || '').toLowerCase();
  // A2442 and A2485 can be Pro or Max — check GPU core count
  if ((model === 'A2442' || model === 'A2485') && specs?.gpu) {
    const gpuCores = parseInt((specs.gpu || '').match(/(\d+)/)?.[1] || '0');
    if (gpuCores >= 24) key = key.replace('M1 Pro', 'M1 Max');
  }
  // A2918/A2992 can be base M3 or M3 Pro — check CPU/GPU core counts
  if (model === 'A2918' || model === 'A2992') {
    const cpuCores = parseInt((specs?.cpu || '').match(/(\d+)/)?.[1] || '0');
    const gpuCores = parseInt((specs?.gpu || '').match(/(\d+)/)?.[1] || '0');
    if (cpuCores === 8 && gpuCores === 10) {
      key = 'Pro 14" 2023 M3'; // base M3
      console.log(`  V6 key override: ${model} ${cpuCores}c/${gpuCores}c → "${key}"`);
    }
  }
  return key;
}

// Intel models not in V6 scraper — product_ids from our existing BM listings
// Key format: "A2179.{cpu}.{ram}.{ssd}.{colour}" (normalised)
const INTEL_PRODUCT_IDS = {
  // A2179 MacBook Air 2020 Intel
  'A2179.i3.8GB.256GB.Space Grey':  '1e94610d-47fc-4e18-910a-1cbcec05bde1',
  'A2179.i3.8GB.256GB.Grey':        '1e94610d-47fc-4e18-910a-1cbcec05bde1',
  'A2179.i3.8GB.256GB.Silver':      '9bb8f64a-7bd9-4087-b3ca-3fa978655da6',
  'A2179.i3.8GB.256GB.Gold':        'ab6fbe7f-ef87-4843-848d-2e5bac803117',
  'A2179.i3.8GB.512GB.Grey':        'defdf354-2287-4d17-ad0e-26b4b8955427',
  'A2179.i3.8GB.512GB.Space Grey':  'defdf354-2287-4d17-ad0e-26b4b8955427',
  'A2179.i5.8GB.256GB.Gold':        '58b693f2-2c99-4674-848a-f0ab4f3ccf73',
  'A2179.i5.8GB.512GB.Grey':        'ab191cdf-2e76-4701-bb6a-b851d27ef262',
  'A2179.i5.8GB.512GB.Space Grey':  'ab191cdf-2e76-4701-bb6a-b851d27ef262',
  'A2179.i5.8GB.512GB.Silver':      'ca7a6f67-5725-4ffe-8179-031c56d33943',
  'A2179.i5.8GB.512GB.Gold':        'a95cf4ab-f96a-4dec-bbf7-7e8f5751d3cd',
  'A2179.i7.8GB.256GB.Grey':        '03773c6d-1e47-4eeb-acda-ace9e100b42e',
  'A2179.i7.8GB.256GB.Space Grey':  '03773c6d-1e47-4eeb-acda-ace9e100b42e',
};

// ─── Product ID Lookup Table (Source 1: our existing listings) ────
let _productIdLookup = null;
function loadProductIdLookup() {
  if (_productIdLookup) return _productIdLookup;
  try {
    _productIdLookup = JSON.parse(fs.readFileSync(PRODUCT_ID_LOOKUP_PATH, 'utf8'));
    console.log(`  Loaded product_id lookup: ${Object.keys(_productIdLookup).length} entries`);
  } catch (e) {
    console.warn(`  ⚠️ Could not load product_id lookup: ${e.message}`);
    _productIdLookup = {};
  }
  return _productIdLookup;
}

function findProductIdFromLookup(specs, bmGrade) {
  const lookup = loadProductIdLookup();
  const { model, ram, ssd, cpu, gpu, colour, deviceName } = specs;

  // Normalise search values
  const ramGB = (ram || '').replace(/\s/g, '').replace(/GB/i, '');
  let ssdSearch = (ssd || '').replace(/\s/g, '').replace(/GB/i, '').replace(/TB/i, '');
  // Convert TB to GB for title matching
  if ((ssd || '').toLowerCase().includes('1tb')) ssdSearch = '1000';
  else if ((ssd || '').toLowerCase().includes('2tb')) ssdSearch = '2000';
  else if ((ssd || '').toLowerCase().includes('4tb')) ssdSearch = '4000';

  const candidates = [];
  for (const [pid, info] of Object.entries(lookup)) {
    const title = (info.title || '').toLowerCase();

    // Must match RAM
    if (ramGB && !title.includes(ramGB + 'gb') && !title.includes(ramGB + ' gb')) continue;

    // Must match SSD
    if (ssdSearch && !title.includes('ssd ' + ssdSearch) && !title.includes(ssdSearch + 'gb') && !title.includes(ssdSearch + ' gb')) continue;

    // Must match model year/type from title
    // Extract device type hints from model number
    const MODEL_HINTS = {
      'A2337': ['air 13', '2020'],
      'A2179': ['air', '2020'],
      'A2681': ['air 13', '2022'],
      'A2941': ['air 15', '2023'],
      'A3113': ['air 15'],
      'A3240': ['air 13'],
      'A2338': ['pro 13', '2020'],
      'A2442': ['pro 14', '2021'],
      'A2485': ['pro 16', '2021'],
      'A2779': ['pro 14', '2023'],
      'A2780': ['pro 16', '2023'],
      'A2918': ['pro 14', '2023'],
      'A2992': ['pro 14', '2023'],
      'A2991': ['pro 16', '2023'],
      'A2289': ['pro 13', '2020'],
      'A2251': ['pro 13', '2020'],
    };

    const hints = MODEL_HINTS[model] || [];
    if (hints.length > 0) {
      // ALL hints must match (not just one)
      let allMatch = true;
      for (const h of hints) {
        if (!title.includes(h)) { allMatch = false; break; }
      }
      if (!allMatch) continue;
    }

    // Verify Air vs Pro matches device
    const isAir = (deviceName || '').toLowerCase().includes('air');
    const isPro = (deviceName || '').toLowerCase().includes('pro');
    if (isAir && !title.includes('air')) continue;
    if (isPro && title.includes('air')) continue;

    // Verify chip family matches (M1 vs i3 vs i5 etc)
    const cpuLower = (cpu || '').toLowerCase();
    if (cpuLower.match(/^i[3579]$/) && !title.includes(cpuLower)) continue;
    if (cpuLower.includes('core') && !title.includes('core')) continue; // M-series has "core" in GPU spec
    // For M1/M2/M3 chips, check title contains the chip name
    const dnLower = (deviceName || '').toLowerCase();
    if (dnLower.includes(' m1 ') && !title.includes(' m1 ')) continue;
    if (dnLower.includes(' m2 ') && !title.includes(' m2 ')) continue;
    if (dnLower.includes(' m3 ') && !title.includes(' m3 ')) continue;
    if (dnLower.includes('m1 pro') && !title.includes('m1 pro')) continue;
    if (dnLower.includes('m2 pro') && !title.includes('m2 pro')) continue;
    if (dnLower.includes('m3 pro') && !title.includes('m3 pro')) continue;

    // Check CPU/GPU if relevant (for shared model numbers like A2442 Pro/Max)
    const gpuCores = (gpu || '').match(/(\d+)/)?.[1];
    if (gpuCores) {
      if (title.includes(gpuCores + '-core gpu') || title.includes(gpuCores + ' core gpu')) {
        // Good match
      } else if (title.includes('-core gpu')) {
        // Title has a GPU spec but it doesn't match ours
        continue;
      }
    }

    // Check grade availability
    if (bmGrade && info.grades && !info.grades.includes(bmGrade)) continue;

    candidates.push({ pid, info, title });
  }

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // Multiple matches — prefer exact colour match if possible
  const colourNorm = (colour || '').toLowerCase().replace('space grey', 'space gray');
  const colourMatch = candidates.find(c => c.title.includes(colourNorm));
  return colourMatch || candidates[0];
}

function findProductId(v6, specs, bmGrade) {
  const { model, ram, ssd, colour, cpu, gpu, deviceName } = specs;

  // ── SOURCE 1: Product ID lookup table (our existing listings) ──
  const lookupResult = findProductIdFromLookup(specs, bmGrade);
  if (lookupResult) {
    console.log(`  ✅ Lookup table match: "${lookupResult.info.title}"`);
    console.log(`     product_id: ${lookupResult.pid}, bm_id: ${lookupResult.info.backmarket_id}`);
    // Still need V6 for grade prices, so continue to V6 but use lookup product_id
    const v6Prices = {};
    // Try to find V6 grade prices for context (not for product_id)
    if (v6) {
      for (const [mk, md] of Object.entries(v6.models || {})) {
        if (md.grades) {
          // Check if this V6 model matches our model hints
          const key = mk.toLowerCase();
          const dn = (deviceName || '').toLowerCase();
          if (key.includes(model.toLowerCase()) || dn.includes(mk.split('"')[0].trim().toLowerCase())) {
            for (const [g, gd] of Object.entries(md.grades)) {
              if (gd.available && gd.price) v6Prices[g] = gd.price;
            }
            break;
          }
        }
      }
    }
    return {
      productId: lookupResult.pid,
      modelKey: `Lookup: ${lookupResult.info.title.slice(0, 60)}`,
      gradePrices: v6Prices,
      ssdPicker: {},
      colourPrices: {},
      adjacentSsd: [],
      ramPicker: {},
      colourPicker: {},
      cpuGpuPicker: {},
      baseUuid: null,
      fromLookup: true,
      lookupTitle: lookupResult.info.title,
    };
  }

  // ── SOURCE 2: Intel product_id table ──
  // Check Intel product_id lookup first (models not in V6 scraper)
  const colourNorm = (colour || '').replace('Space Gray', 'Space Grey');
  const cpuNorm = (cpu || '').toLowerCase().trim();
  const intelKey = `${model}.${cpuNorm}.${ram}.${ssd}.${colourNorm}`;
  // Known Intel models: if not found in Intel lookup, don't fall through to V6 (would match wrong model)
  const INTEL_MODELS = ['A2179', 'A2289', 'A2251'];
  const isIntelModel = INTEL_MODELS.includes(model) || cpuNorm.match(/^i[3579]$/);

  if (INTEL_PRODUCT_IDS[intelKey]) {
    const pid = INTEL_PRODUCT_IDS[intelKey];
    console.log(`  Intel match: ${intelKey} → ${pid}`);
    // Try to find V6 scraper data for this Intel model (if scraped)
    let v6Grades = {};
    let v6Colour = {};
    let v6Ssd = {};
    for (const [mk, md] of Object.entries(v6.models)) {
      if (md.uuid === pid || (md.colour && Object.values(md.colour).some(c => c.productId === pid))) {
        v6Grades = {};
        if (md.grades) {
          for (const [g, gd] of Object.entries(md.grades)) {
            if (gd.available && gd.price) v6Grades[g] = gd.price;
          }
        }
        v6Colour = {};
        if (md.colour) {
          for (const [c, cd] of Object.entries(md.colour)) {
            if (cd.available !== false) v6Colour[c] = cd.price || 0;
          }
        }
        v6Ssd = md.ssd || {};
        if (Object.keys(v6Grades).length > 0) {
          console.log(`  V6 grade prices found: ${JSON.stringify(v6Grades)}`);
        }
        break;
      }
    }

    // If no grade prices for this colour, try other colours of the same model+cpu+ram+ssd
    if (Object.keys(v6Grades).length === 0) {
      const specPrefix = `${model}.${cpuNorm}.${ram}.${ssd}`;
      for (const [altKey, altPid] of Object.entries(INTEL_PRODUCT_IDS)) {
        if (altKey.startsWith(specPrefix) && altPid !== pid) {
          // Check if V6 has grade prices for this alt colour
          for (const [mk, md] of Object.entries(v6.models)) {
            if (md.uuid === altPid || (md.colour && Object.values(md.colour).some(c => c.productId === altPid))) {
              if (md.grades) {
                for (const [g, gd] of Object.entries(md.grades)) {
                  if (gd.available && gd.price && !v6Grades[g]) v6Grades[g] = gd.price;
                }
              }
              if (Object.keys(v6Grades).length > 0) {
                const altColour = altKey.split('.').pop();
                console.log(`  No V6 prices for ${colourNorm}. Using ${altColour} prices as reference: ${JSON.stringify(v6Grades)}`);
                break;
              }
            }
          }
          if (Object.keys(v6Grades).length > 0) break;
        }
      }
    }

    return {
      productId: pid,
      modelKey: `Intel ${model}`,
      gradePrices: v6Grades,
      ssdPicker: v6Ssd,
      colourPrices: v6Colour,
      adjacentSsd: [],
      ramPicker: {},
      colourPicker: {},
      cpuGpuPicker: {},
      baseUuid: null,
    };
  }

  // If this is a known Intel model and no Intel match found, abort — don't fuzzy match V6 (would match wrong model)
  if (isIntelModel) {
    console.log(`  ⛔ Intel model ${model} with key "${intelKey}" not in INTEL_PRODUCT_IDS. Cannot list this configuration.`);
    return null;
  }

  const modelKeys = Object.keys(v6.models);

  // Primary: use hardcoded model number lookup
  let matchKey = null;
  const resolvedKey = resolveV6Key(model, deviceName, specs);
  if (resolvedKey && v6.models[resolvedKey]) {
    matchKey = { key: resolvedKey, score: 100 };
    console.log(`  V6 match via model number ${model} → "${resolvedKey}"`);
  }

  // Fallback: fuzzy matching from device name (for unknown model numbers)
  if (!matchKey) {
    console.log(`  ⚠️ Model ${model} not in lookup table, falling back to fuzzy match`);
    const dnLower = (deviceName || '').toLowerCase();

    for (const key of modelKeys) {
      const kLower = key.toLowerCase();
      let matches = 0;

      if (dnLower.includes('air') && kLower.includes('air')) matches += 3;
      if (dnLower.includes('pro') && kLower.includes('pro') && !kLower.includes('m1 pro') && !kLower.includes('m2 pro') && !kLower.includes('m3 pro')) matches += 3;
      if (dnLower.includes('pro') && kLower.includes('pro')) matches += 2;

      const yearMatch = dnLower.match(/(20\d{2})/);
      if (yearMatch && kLower.includes(yearMatch[1])) matches += 3;

      if (dnLower.includes('13') && kLower.includes('13')) matches += 2;
      if (dnLower.includes('14') && kLower.includes('14')) matches += 2;
      if (dnLower.includes('15') && kLower.includes('15')) matches += 2;
      if (dnLower.includes('16') && kLower.includes('16')) matches += 2;

      // Chip matching from device name (not CPU column)
      if (dnLower.includes('m1 pro') && kLower.includes('m1 pro')) matches += 5;
      else if (dnLower.includes('m1 max') && kLower.includes('m1 max')) matches += 5;
      else if (dnLower.includes('m2 pro') && kLower.includes('m2 pro')) matches += 5;
      else if (dnLower.includes('m2 max') && kLower.includes('m2 max')) matches += 5;
      else if (dnLower.includes('m3 pro') && kLower.includes('m3 pro')) matches += 5;
      else if (dnLower.includes('m3 max') && kLower.includes('m3 max')) matches += 5;
      else if (dnLower.includes('m1') && kLower.includes('m1') && !kLower.includes('m1 pro') && !kLower.includes('m1 max')) matches += 3;
      else if (dnLower.includes('m2') && kLower.includes('m2') && !kLower.includes('m2 pro') && !kLower.includes('m2 max')) matches += 3;
      else if (dnLower.includes('m3') && kLower.includes('m3') && !kLower.includes('m3 pro') && !kLower.includes('m3 max')) matches += 3;

      if (matches > (matchKey ? matchKey.score : 0)) {
        matchKey = { key, score: matches };
      }
    }
  }

  if (!matchKey) return null;

  const modelData = v6.models[matchKey.key];
  if (!modelData) return null;

  // Navigate pickers to find productId
  // The colour picker productId is the final product_id for exact spec+colour
  // But we need to verify RAM and SSD match too

  // Find RAM
  const ramNorm = ram.replace(/\s/g, ' ').trim(); // "8 GB" format
  const ramKey = Object.keys(modelData.ram || {}).find(k =>
    k.replace(/\s/g, '') === ramNorm.replace(/\s/g, '')
  );
  if (ramKey && modelData.ram[ramKey] && !modelData.ram[ramKey].available) {
    const availRam = Object.entries(modelData.ram || {}).filter(([k,v]) => v.available).map(([k]) => k);
    console.log(`  ⛔ RAM ${ramNorm} unavailable on BM. Available: ${availRam.join(', ') || 'none'}`);
    return null;
  }

  // Find SSD
  const ssdNorm = ssd.replace(/\s/g, '');
  let ssdKey = Object.keys(modelData.ssd || {}).find(k =>
    k.replace(/\s/g, '') === ssdNorm
  );
  // Try with GB suffix if not found
  if (!ssdKey) {
    ssdKey = Object.keys(modelData.ssd || {}).find(k => {
      const kNorm = k.replace(/\s/g, '');
      return kNorm === ssdNorm || kNorm === ssdNorm + 'GB' || ssdNorm === kNorm + 'GB';
    });
  }
  // Handle 1TB = 1000GB
  if (!ssdKey && (ssdNorm === '1TB' || ssdNorm === '1000GB')) {
    ssdKey = Object.keys(modelData.ssd || {}).find(k =>
      k.replace(/\s/g, '') === '1000GB' || k.replace(/\s/g, '') === '1TB'
    );
  }
  if (!ssdKey && (ssdNorm === '2TB' || ssdNorm === '2000GB')) {
    ssdKey = Object.keys(modelData.ssd || {}).find(k =>
      k.replace(/\s/g, '') === '2000GB' || k.replace(/\s/g, '') === '2TB'
    );
  }
  if (ssdKey && modelData.ssd[ssdKey] && !modelData.ssd[ssdKey].available) {
    const availSsd = Object.entries(modelData.ssd || {}).filter(([k,v]) => v.available).map(([k]) => k);
    console.log(`  ⛔ SSD ${ssdNorm} unavailable on BM. Available: ${availSsd.join(', ') || 'none'}`);
    return null;
  }

  // Find colour
  const colourMap = {
    'Grey': ['Space Gray', 'Space Grey', 'Grey'],
    'Space Gray': ['Space Gray', 'Grey', 'Space Grey'],
    'Space Grey': ['Space Gray', 'Grey', 'Space Grey'],
    'Silver': ['Silver'],
    'Gold': ['Gold'],
    'Midnight': ['Midnight'],
    'Starlight': ['Starlight'],
    'Black': ['Black', 'Space Black'],
    'Space Black': ['Space Black', 'Black'],
  };
  const colourVariants = colourMap[specs.colour] || [specs.colour];
  let colourEntry = null;
  let colourKey = null;
  for (const cv of colourVariants) {
    if (modelData.colour?.[cv]) {
      colourEntry = modelData.colour[cv];
      colourKey = cv;
      break;
    }
  }
  if (colourEntry && !colourEntry.available) {
    const availColours = Object.entries(modelData.colour || {}).filter(([k,v]) => v.available).map(([k,v]) => `${k} (${v.productId?.slice(0,8)})`);
    console.log(`  ⛔ Colour "${colourKey}" unavailable on BM. Available: ${availColours.join(', ') || 'none'}`);
    return null;
  }

  // The colour picker productId is the final one (per SOP)
  let productId = colourEntry?.productId || modelData.uuid;

  // If no colour picker, use SSD picker productId, then RAM, then base UUID
  if (!colourEntry) {
    if (ssdKey && modelData.ssd[ssdKey]?.productId) productId = modelData.ssd[ssdKey].productId;
    else if (ramKey && modelData.ram[ramKey]?.productId) productId = modelData.ram[ramKey].productId;
    else productId = modelData.uuid;
  }

  // Gather grade prices and adjacent spec data for later steps
  const gradePrices = {};
  for (const [g, gd] of Object.entries(modelData.grades || {})) {
    if (gd.available) gradePrices[g] = gd.price;
  }

  // SSD picker for adjacent spec check
  const ssdPicker = modelData.ssd || {};

  // Build colour prices for the current grade
  const colourPrices = {};
  for (const [colName, colData] of Object.entries(modelData.colour || {})) {
    if (colData && colData.available !== false) {
      // Colour prices are relative to base; use grade price if available
      colourPrices[colName] = gradePrices[BM_GRADE_TO_SCRAPER[specs?.bmGrade] || 'Fair'] || 0;
      if (colData.price) colourPrices[colName] = colData.price;
    }
  }

  // Build adjacent SSD prices for context
  const adjacentSsd = [];
  const ssdKeys = Object.keys(ssdPicker);
  for (const sk of ssdKeys) {
    if (sk !== ssdKey && ssdPicker[sk]?.available !== false) {
      adjacentSsd.push({
        ssd: sk,
        price: ssdPicker[sk]?.price || gradePrices?.Fair || 0,
      });
    }
  }

  return {
    productId,
    modelKey: matchKey.key,
    gradePrices,
    ssdPicker,
    colourPrices,
    adjacentSsd,
    ramPicker: modelData.ram || {},
    colourPicker: modelData.colour || {},
    cpuGpuPicker: modelData.cpu_gpu || {},
    baseUuid: modelData.uuid,
  };
}

function buildModelNumberMap(v6) {
  // Known model number → V6 key mappings
  return {
    'A2337': 'Air 13" 2020 M1',
    'A2179': 'Air 13" 2020 M1',    // Intel but might map
    'A2681': 'Air 13" 2022 M2',
    'A3113': 'Air 13" 2024 M3',
    'A3114': 'Air 13" 2025 M4',
    'A2941': 'Air 15" 2023 M2',
    'A2338': 'Pro 13" 2020 M1',
    'A2442': 'Pro 14" 2021 M1 Pro',
    'A2485': 'Pro 16" 2021 M1 Pro',
    'A2779': 'Pro 14" 2023 M2 Pro',
    'A2780': 'Pro 16" 2023 M2 Pro',
    'A2918': 'Pro 14" 2023 M3',
    'A2992': 'Pro 14" 2023 M3 Pro',
    'A2991': 'Pro 16" 2023 M3 Pro',
    'A2141': 'Pro 16" 2021 M1 Pro',  // fallback
  };
}

// ─── Step 5: Search for Existing Listing Slot ─────────────────────

// Listing cache: fetch once, reuse across all items
let _listingsCache = null;
async function getAllListings() {
  if (_listingsCache) {
    console.log(`  Using cached listings (${_listingsCache.length} total)`);
    return _listingsCache;
  }
  console.log(`  Fetching all listings (first time, will cache)...`);
  const allListings = [];
  let page = 1;
  while (true) {
    const data = await bmApiFetch(`/ws/listings?page=${page}`);
    const results = data.results || (Array.isArray(data) ? data : []);
    if (results.length === 0) break;
    allListings.push(...results);
    if (!data.next) break;
    page++;
    await sleep(500);
  }
  console.log(`  Fetched ${allListings.length} total listings across ${page} pages`);
  _listingsCache = allListings;
  return allListings;
}

async function searchListingSlot(targetProductId, targetBmGrade) {
  console.log(`[Step 5] Searching listings for product_id=${targetProductId}, grade=${targetBmGrade}...`);
  const allListings = await getAllListings();

  // Filter by product_id + grade
  const matches = allListings.filter(l =>
    l.product_id === targetProductId && l.grade === targetBmGrade
  );

  console.log(`  Found ${matches.length} matching listings`);

  if (matches.length === 0) {
    // Path B: no match. Try to find backmarket_id from same model listings
    let backmarketId = null;
    for (const l of allListings) {
      if (l.product_id === targetProductId) {
        backmarketId = l.backmarket_id || l.catalog;
        break;
      }
    }
    return { path: 'B', listing: null, allListingIds: [], backmarketId, allListings };
  }

  // Check for qty > 0
  const active = matches.filter(l => (l.quantity || 0) > 0);
  if (active.length > 0) {
    // Path A2: bump qty
    const listing = active[0];
    return { path: 'A2', listing, allListingIds: matches.map(l => l.listing_id || l.id), allListings };
  }

  // Path A: qty=0, pick highest listing_id
  const sorted = matches.sort((a, b) => (b.listing_id || b.id || 0) - (a.listing_id || a.id || 0));
  const listing = sorted[0];
  return { path: 'A', listing, allListingIds: matches.map(l => l.listing_id || l.id), allListings };
}

// ─── Step 6: Get Buy Box Price ────────────────────────────────────

async function getBuyBoxPrice(slotResult, v6Result, gradeText) {
  let proposed = null;
  let source = '';

  // 6a: Path A/A2 — use backbox API (needs UUID, not numeric listing_id)
  if (slotResult.path !== 'B' && slotResult.listing) {
    const listingUuid = slotResult.listing.id; // UUID format (e.g. d77fb96c-7c68-4b9c-...)
    const listingId = slotResult.listing.listing_id; // numeric (for logging)
    try {
      const bbData = await bmApiFetch(`/ws/backbox/v1/competitors/${listingUuid}`);
      if (bbData.price_to_win) {
        proposed = parseFloat(bbData.price_to_win);
        source = `backbox price_to_win (listing ${listingId}, uuid ${listingUuid})`;
      }
    } catch (e) {
      console.warn(`  Backbox API failed for listing ${listingId}: ${e.message}`);
    }
  }

  // 6b: Fallback / Path B — use V6 scraper grade price
  if (!proposed && v6Result?.gradePrices) {
    const scraperGrade = BM_GRADE_TO_SCRAPER[gradeText] || gradeText;
    // Use the BM grade text mapped back to scraper grade name
    proposed = v6Result.gradePrices[scraperGrade] || v6Result.gradePrices[gradeText];
    source = 'V6 scraper grade price';
  }

  // 6b2: If our grade has no price but other grades do, derive from them
  // e.g. Fair has no price but Good=£1593, Excellent=£1464 → Fair should be under the lowest
  if (!proposed && v6Result?.gradePrices) {
    const gp = v6Result.gradePrices;
    const availPrices = Object.values(gp).filter(p => p > 0);
    if (availPrices.length > 0) {
      const lowestAvail = Math.min(...availPrices);
      // Grade hierarchy: Fair < Good < Excellent
      const gradeOrder = { 'FAIR': 0, 'GOOD': 1, 'VERY_GOOD': 2 };
      const ourLevel = gradeOrder[gradeText] ?? 1;
      // Find lowest grade level that has a price
      let lowestPricedLevel = 3;
      for (const [g, p] of Object.entries(gp)) {
        const bmGrade = g === 'Fair' ? 'FAIR' : g === 'Good' ? 'GOOD' : g === 'Excellent' ? 'VERY_GOOD' : g;
        const level = gradeOrder[bmGrade] ?? gradeOrder[g] ?? 1;
        if (p > 0 && level < lowestPricedLevel) lowestPricedLevel = level;
      }
      if (ourLevel < lowestPricedLevel) {
        // Our grade is below all available grades — price under the lowest
        proposed = Math.floor(lowestAvail * 0.95); // 5% under lowest available
        source = `derived: 5% under lowest available grade (£${lowestAvail})`;
      } else if (ourLevel > lowestPricedLevel) {
        // Our grade is above available — use highest available as floor
        const highestAvail = Math.max(...availPrices);
        proposed = highestAvail;
        source = `derived: matched to highest available grade (£${highestAvail})`;
      }
    }
  }

  // 6c: Adjacent spec check
  const flags = [];
  if (v6Result?.ssdPicker) {
    const ssdKeys = Object.keys(v6Result.ssdPicker).filter(k => v6Result.ssdPicker[k].available);
    const ssdPrices = ssdKeys.map(k => ({ key: k, price: v6Result.ssdPicker[k].price })).filter(p => p.price);
    ssdPrices.sort((a, b) => {
      const aNum = parseInt(a.key);
      const bNum = parseInt(b.key);
      return aNum - bNum;
    });
    for (let i = 1; i < ssdPrices.length; i++) {
      const gap = ssdPrices[i].price - ssdPrices[i - 1].price;
      if (gap < 20) flags.push(`⚠️ SSD gap ${ssdPrices[i - 1].key}→${ssdPrices[i].key}: only £${gap}`);
      if (gap < 0) flags.push(`🔴 SSD anomaly: ${ssdPrices[i - 1].key}(£${ssdPrices[i - 1].price}) > ${ssdPrices[i].key}(£${ssdPrices[i].price})`);
    }
  }

  // Grade ladder check
  if (v6Result?.gradePrices) {
    const gp = v6Result.gradePrices;
    if (gp.Fair && gp.Good && gp.Fair >= gp.Good) flags.push(`🔴 Grade inversion: Fair(£${gp.Fair}) ≥ Good(£${gp.Good})`);
    if (gp.Good && gp.Excellent && gp.Good >= gp.Excellent) flags.push(`🔴 Grade inversion: Good(£${gp.Good}) ≥ Excellent(£${gp.Excellent})`);
    if (gp.Fair && gp.Good && Math.abs(gp.Good - gp.Fair) < 10) flags.push(`⚠️ Fair/Good within £${Math.abs(gp.Good - gp.Fair)} — buyers will upgrade`);
    if (gp.Good && gp.Excellent && Math.abs(gp.Excellent - gp.Good) < 10) flags.push(`⚠️ Good/Excellent within £${Math.abs(gp.Excellent - gp.Good)} — buyers will upgrade`);
  }

  return { proposed, source, flags };
}

// ─── Step 7: Historical Sales ─────────────────────────────────────

// Orders cache: fetch once, reuse across all items
let _ordersCache = null;
async function getAllCompletedOrders() {
  if (_ordersCache) {
    console.log(`  Using cached orders (${_ordersCache.length} total)`);
    return _ordersCache;
  }
  console.log(`  Fetching all completed orders (first time, will cache)...`);
  const allOrders = [];
  let page = 1;
  try {
    while (true) {
      const data = await bmApiFetch(`/ws/orders?state=9&page=${page}`);
      const results = data.results || (Array.isArray(data) ? data : []);
      if (results.length === 0) break;
      allOrders.push(...results);
      if (!data.next) break;
      page++;
      if (page % 10 === 0) console.log(`    ... page ${page}, ${allOrders.length} orders so far`);
      await sleep(300);
    }
  } catch (e) {
    console.warn(`  Orders API error on page ${page}: ${e.message}`);
  }
  console.log(`  Fetched ${allOrders.length} completed orders across ${page} pages`);
  _ordersCache = allOrders;
  return allOrders;
}

async function getHistoricalSales(listingIds) {
  if (!listingIds || listingIds.length === 0) return { count: 0, avg: 0, low: 0, high: 0, sales: [] };

  const listingIdSet = new Set(listingIds.map(String));
  const matchingSales = [];

  const allOrders = await getAllCompletedOrders();
  for (const order of allOrders) {
    const orderlines = order.orderlines || [];
    for (const line of orderlines) {
      if (listingIdSet.has(String(line.listing_id))) {
        matchingSales.push(parseFloat(line.price) || 0);
      }
    }
  }

  if (matchingSales.length === 0) return { count: 0, avg: 0, low: 0, high: 0, sales: [] };

  const avg = matchingSales.reduce((a, b) => a + b, 0) / matchingSales.length;
  return {
    count: matchingSales.length,
    avg: Math.round(avg * 100) / 100,
    low: Math.min(...matchingSales),
    high: Math.max(...matchingSales),
    sales: matchingSales,
  };
}

// ─── Step 8: Calculate Profitability ──────────────────────────────

function calculateProfitability(proposed, specs) {
  const { purchasePrice, partsCost, labourHours } = specs;
  const labourCost = labourHours * LABOUR_RATE;

  const minPrice = Math.ceil(proposed * MIN_PRICE_FACTOR);

  const bmBuyFee = purchasePrice * BM_BUY_FEE_RATE;
  const bmSellFee = minPrice * BM_SELL_FEE_RATE;
  const vat = Math.max(0, (minPrice - purchasePrice) * VAT_RATE);

  const totalCosts = purchasePrice + partsCost + labourCost + SHIPPING_COST + bmBuyFee + bmSellFee + vat;
  const net = minPrice - totalCosts;
  const margin = minPrice > 0 ? (net / minPrice) * 100 : -999;

  // Fixed cost for Monday write (purchase + parts + labour + shipping + buy fee)
  const totalFixedCost = purchasePrice + partsCost + labourCost + SHIPPING_COST + bmBuyFee;

  // Break-even price: sell where net = 0
  // 0 = sell - fixedCost - sell*sellFee - (sell - purchase)*vatRate
  // 0 = sell*(1 - sellFee - vatRate) - fixedCost + purchase*vatRate
  // sell = (fixedCost - purchase*vatRate) / (1 - sellFee - vatRate)
  const breakEven = totalFixedCost > 0 ? Math.ceil((totalFixedCost - purchasePrice * VAT_RATE) / (1 - BM_SELL_FEE_RATE - VAT_RATE)) : 0;

  return {
    proposed,
    minPrice,
    purchasePrice,
    partsCost,
    labourCost,
    labourHours,
    shipping: SHIPPING_COST,
    bmBuyFee: Math.round(bmBuyFee * 100) / 100,
    bmSellFee: Math.round(bmSellFee * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    totalCosts: Math.round(totalCosts * 100) / 100,
    net: Math.round(net * 100) / 100,
    margin: Math.round(margin * 100) / 100,
    totalFixedCost: Math.round(totalFixedCost * 100) / 100,
    breakEven,
  };
}

// ─── Step 9: Decision Gate ────────────────────────────────────────

function decisionGate(profitability) {
  const { margin, net, minPrice } = profitability;

  if (net < 0) return { decision: 'BLOCK', reason: `Loss at min_price (net £${net})` };
  if (margin < 15) return { decision: 'BLOCK', reason: `Margin ${margin.toFixed(1)}% < 15% at min_price` };
  // AUTO-LIST disabled until data pipeline is trusted (parts, model matching, product_ids verified)
  // if (margin >= 30 && net >= 100) return { decision: 'AUTO-LIST', reason: `Margin ${margin.toFixed(1)}%, net £${net}` };
  return { decision: 'PROPOSE', reason: `Margin ${margin.toFixed(1)}%, net £${net}` };
}

// ─── Step 10: Create/Reactivate Listing ───────────────────────────

async function createOrReactivateListing(slotResult, profitability, bmGrade, sku) {
  const { proposed, minPrice } = profitability;
  const listingId = slotResult.listing?.listing_id || slotResult.listing?.id;

  if (slotResult.path === 'A') {
    // Reactivate: use existing SKU from BM listing, do NOT overwrite
    const existingSku = slotResult.listing.sku || slotResult.listing.merchant_sku || sku;
    const body = {
      quantity: 1,
      price: proposed,
      min_price: minPrice,
      sku: existingSku,
      pub_state: 2,
      currency: 'GBP',
      grade: bmGrade,
    };
    console.log(`  [Path A] POST /ws/listings/${listingId}`, JSON.stringify(body));
    const result = await bmApiFetch(`/ws/listings/${listingId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { listingId, result, path: 'A' };
  }

  if (slotResult.path === 'A2') {
    // Bump qty + update price
    const currentQty = slotResult.listing.quantity || 0;
    const body = {
      quantity: currentQty + 1,
      price: proposed,
      min_price: minPrice,
      pub_state: 2,
      currency: 'GBP',
    };
    console.log(`  [Path A2] POST /ws/listings/${listingId} (qty ${currentQty} → ${currentQty + 1})`, JSON.stringify(body));
    const result = await bmApiFetch(`/ws/listings/${listingId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { listingId, result, path: 'A2' };
  }

  if (slotResult.path === 'B') {
    // Create new listing via JSON body with CSV in catalog field
    // Grade MUST be included as a column in the CSV (BM defaults to GOOD otherwise)
    const productId = slotResult.productId || (hasV6 ? v6Result.productId : null);
    if (!productId) throw new Error('Cannot create Path B listing: no product_id available');

    const csvHeader = 'sku,product_id,quantity,warranty_delay,price,state,currency,grade';
    const csvLine = `${sku},${productId},1,12,${proposed},2,GBP,${bmGrade}`;
    const csvContent = csvHeader + '\r\n' + csvLine;

    const body = {
      catalog: csvContent,
      quotechar: '"',
      delimiter: ',',
      encoding: 'utf-8',
    };

    console.log(`  [Path B] POST /ws/listings (JSON body, grade=${bmGrade})`);
    console.log(`  CSV: ${csvContent}`);
    const result = await bmApiFetch(`/ws/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // Poll task for completion
    const taskId = result.bodymessage || result.task_id;
    let newListingId = null;
    if (taskId) {
      console.log(`  Task ID: ${taskId}`);
      for (let i = 0; i < 15; i++) {
        await sleep(2000);
        try {
          const task = await bmApiFetch(`/ws/tasks/${taskId}`);
          if (task.action_status === 9) {
            const ps = task.result?.product_success || {};
            const firstKey = Object.keys(ps)[0];
            if (firstKey) {
              newListingId = ps[firstKey].listing_id;
              console.log(`  ✅ Path B listing created: ID ${newListingId}, backmarket_id ${ps[firstKey].backmarket_id}`);
            }
            const pe = task.result?.product_errors || {};
            if (Object.keys(pe).length > 0) {
              throw new Error(`Path B errors: ${JSON.stringify(pe)}`);
            }
            break;
          }
          if (task.state === 'FAILURE' || task.status === 'FAILURE') {
            throw new Error(`Path B task failed: ${JSON.stringify(task)}`);
          }
        } catch (e) {
          if (i === 9) throw e;
        }
      }
    } else {
      newListingId = result.listing_id || result.id;
    }

    return { listingId: newListingId, result, path: 'B' };
  }
}

// ─── Step 11: Verify Listing ──────────────────────────────────────

async function verifyListing(listingId, expected) {
  if (!listingId) return { verified: false, error: 'No listing_id' };

  const listing = await bmApiFetch(`/ws/listings/${listingId}`);
  const issues = [];

  const pubState = listing.publication_state ?? listing.pub_state;
  if (pubState !== 2 && pubState !== '2') issues.push(`pub_state=${pubState} (expected 2)`);
  if (expected.quantity && listing.quantity !== expected.quantity) issues.push(`qty=${listing.quantity} (expected ${expected.quantity})`);

  // ── GRADE CHECK (CRITICAL) ──
  if (expected.grade && listing.grade !== expected.grade) {
    issues.push(`⛔ GRADE MISMATCH: listing grade=${listing.grade}, expected=${expected.grade}`);
  }

  // ── TITLE/SPEC CHECK (CRITICAL) ──
  const title = (listing.title || '').toLowerCase();
  if (expected.ram) {
    const ramNorm = expected.ram.replace(/\s/g, '').toLowerCase();
    const ramGB = ramNorm.replace('gb', '');
    if (!title.includes(ramGB + 'gb') && !title.includes(ramGB + ' gb')) {
      issues.push(`⛔ TITLE RAM MISMATCH: title="${listing.title}", expected RAM=${expected.ram}`);
    }
  }
  if (expected.ssd) {
    const ssdNorm = expected.ssd.replace(/\s/g, '').toLowerCase();
    let ssdSearch = ssdNorm.replace('gb', '').replace('tb', '');
    // Convert TB to GB for title matching (1TB = 1000GB in titles)
    if (ssdNorm.includes('1tb')) ssdSearch = '1000';
    else if (ssdNorm.includes('2tb')) ssdSearch = '2000';
    if (!title.includes('ssd ' + ssdSearch) && !title.includes(ssdSearch + 'gb') && !title.includes(ssdSearch + ' gb')) {
      issues.push(`⛔ TITLE SSD MISMATCH: title="${listing.title}", expected SSD=${expected.ssd}`);
    }
  }

  // Any critical mismatch (grade or title) → take offline immediately
  const hasCritical = issues.some(i => i.startsWith('⛔'));
  if (hasCritical) {
    console.error(`  ⛔ CRITICAL MISMATCH on listing ${listingId}. Taking offline immediately.`);
    for (const i of issues.filter(i => i.startsWith('⛔'))) console.error(`    ${i}`);
    try {
      await bmApiFetch(`/ws/listings/${listingId}`, { method: 'POST', body: JSON.stringify({ quantity: 0 }) });
      console.log(`  Listing ${listingId} taken offline.`);
    } catch (e) {
      console.error(`  Failed to take listing offline: ${e.message}`);
    }
  }

  return {
    verified: issues.length === 0,
    listing,
    issues,
  };
}

// ─── Step 12: Update Monday ───────────────────────────────────────

async function updateMonday(mainItemId, bmDeviceId, listingId, productId, totalFixedCost) {
  // BM Devices Board updates
  const mutations = [
    // Listing ID → text_mkyd4bx3
    `m1: change_column_value(board_id: ${BM_DEVICES_BOARD}, item_id: ${bmDeviceId},
      column_id: "text_mkyd4bx3", value: ${JSON.stringify(JSON.stringify(String(listingId)))}) { id }`,
    // UUID → text_mm1dt53s
    `m2: change_column_value(board_id: ${BM_DEVICES_BOARD}, item_id: ${bmDeviceId},
      column_id: "text_mm1dt53s", value: ${JSON.stringify(JSON.stringify(String(productId)))}) { id }`,
    // Total Fixed Cost → numeric_mm1mgcgn
    `m3: change_column_value(board_id: ${BM_DEVICES_BOARD}, item_id: ${bmDeviceId},
      column_id: "numeric_mm1mgcgn", value: ${JSON.stringify(JSON.stringify(String(totalFixedCost)))}) { id }`,
    // Main Board: status24 → Listed (index 7)
    `m4: change_column_value(board_id: ${MAIN_BOARD}, item_id: ${mainItemId},
      column_id: "status24", value: "{\\"index\\": 7}") { id }`,
    // Main Board: date_mkq385pa → today
    `m5: change_column_value(board_id: ${MAIN_BOARD}, item_id: ${mainItemId},
      column_id: "date_mkq385pa", value: "{\\"date\\": \\"${today()}\\"}") { id }`,
    // Listing ID only on BM Devices Board (text_mkyd4bx3). NOT on Main Board.
  ];

  const q = `mutation { ${mutations.join('\n')} }`;
  await mondayQuery(q);
}

// ─── Step 13: Output Results ──────────────────────────────────────

function formatSummary(device) {
  const {
    mainItemId, itemName, grade, bmGrade, sku, specs, v6Result, slotResult,
    pricing, historicalSales, profitability, decision, priceFlags,
  } = device;

  const p = profitability;
  const r = (n) => typeof n === 'number' ? n.toFixed(2) : n;

  // Device header
  const deviceType = specs.deviceName?.includes('Air') ? 'MacBook Air' : 'MacBook Pro';
  const screenSize = specs.deviceName?.match(/(\d+)/)?.[1] || '';
  const chipName = sku.split('.')[2] || '';
  const header = `${itemName} ${deviceType} ${screenSize}" ${chipName} | ${specs.ram}/${specs.ssd} | ${specs.colour} | ${grade.gradeText}`;

  const lines = ['', header, ''];

  // Market prices (today)
  const gradePrices = v6Result?.gradePrices || {};
  if (Object.keys(gradePrices).length > 0) {
    lines.push(`Market   ${Object.entries(gradePrices).map(([g, pr]) => `${g[0]}:£${pr}`).join('  ')} (today)`);
  }

  // Colour premium (if V6 has colour data)
  if (v6Result?.colourPrices && Object.keys(v6Result.colourPrices).length > 1) {
    const colourParts = Object.entries(v6Result.colourPrices)
      .map(([c, pr]) => c === specs.colour ? `${c}:£${pr}` : `${c}:£${pr}`)
      .join('  ');
    lines.push(`Colour   ${colourParts}`);
  }

  // Adjacent SSD prices
  if (v6Result?.adjacentSsd && v6Result.adjacentSsd.length > 0) {
    const adjParts = v6Result.adjacentSsd.map(a => `${a.ssd}:£${a.price}`).join('  ');
    lines.push(`Adj SSD  ${adjParts}`);
  }

  // Grade ladder validation
  const gp = gradePrices;
  if (gp.Fair && gp.Good && gp.Excellent) {
    const gaps = [];
    const fgGap = gp.Good - gp.Fair;
    const geGap = gp.Excellent - gp.Good;
    if (gp.Fair < gp.Good && gp.Good < gp.Excellent) {
      lines.push(`Ladder   ✅ F < G < E (gaps: £${fgGap}, £${geGap})`);
    } else {
      lines.push(`Ladder   ⛔ INVERTED (F:£${gp.Fair} G:£${gp.Good} E:£${gp.Excellent})`);
    }
    if (fgGap < 10 || geGap < 10) {
      lines.push(`         ⚠️ Tight gap${fgGap < 10 ? ` F→G: £${fgGap}` : ''}${geGap < 10 ? ` G→E: £${geGap}` : ''}`);
    }
  }

  // Historical sales
  if (historicalSales.count > 0) {
    let salesLine = `Sales    avg £${r(historicalSales.avg)} (£${r(historicalSales.low)}-£${r(historicalSales.high)}) n=${historicalSales.count}`;
    if (historicalSales.avg > p.proposed * 1.3) {
      salesLine += `\n         🔴 Historical avg significantly above market: prices have dropped`;
    }
    lines.push(salesLine);
  } else {
    lines.push(`Sales    no data`);
  }

  lines.push('');

  // Costs
  lines.push(`Costs    Purchase £${r(p.purchasePrice)} | Parts £${r(p.partsCost)} | Labour £${r(p.labourCost)} (${p.labourHours}h) | Ship £${p.shipping}`);
  lines.push(`Fees     Buy £${r(p.bmBuyFee)} | Sell £${r(p.bmSellFee)} | VAT £${r(p.vat)}`);
  lines.push(`Fixed    £${r(p.totalFixedCost)}  |  B/E £${r(p.breakEven || (p.totalFixedCost / 0.8333))}`);
  lines.push(`Prop     £${r(p.proposed)}  |  Min £${r(p.minPrice)} (3%)`);
  lines.push(`Net@min  £${r(p.net)}  |  Margin ${p.margin}%`);

  lines.push('');

  // Path and listing
  const pathInfo = slotResult.path === 'B' ? 'B (new listing)'
    : `${slotResult.path} (listing ${slotResult.listing?.listing_id || slotResult.listing?.id}, qty=${slotResult.listing?.quantity || 0})`;
  lines.push(`Path     ${pathInfo}`);
  lines.push(`SKU      ${sku}`);

  // Product source and title verification
  if (v6Result?.fromLookup) {
    lines.push(`Source   ✅ Lookup table (verified title)`);
    lines.push(`BM title ${v6Result.lookupTitle}`);
  } else if (v6Result?.modelKey?.startsWith('Intel')) {
    lines.push(`Source   Intel product_id table`);
  } else if (v6Result?.modelKey) {
    lines.push(`Source   V6 scraper: ${v6Result.modelKey}`);
  }

  // Status
  const statusEmoji = decision.decision === 'AUTO-LIST' ? '✅' : decision.decision === 'PROPOSE' ? '⚠️' : '⛔';
  const statusLabel = decision.decision === 'AUTO-LIST' ? 'AUTO-LIST' : decision.decision === 'PROPOSE' ? `PROPOSE (${p.margin}% margin)` : 'BLOCK';
  lines.push(`Status   ${statusEmoji} ${statusLabel}`);
  if (decision.decision !== 'AUTO-LIST') lines.push(`         ${decision.reason}`);

  return lines.join('\n');
}

// ─── Main Pipeline ────────────────────────────────────────────────

async function getToListItems() {
  const q = `query {
    boards(ids: [${MAIN_BOARD}]) {
      groups(ids: ["${TO_LIST_GROUP}"]) {
        items_page(limit: 100, query_params: {
          rules: [{ column_id: "status24", compare_value: [${TO_LIST_INDEX}] }]
        }) {
          items {
            id
            name
          }
        }
      }
    }
  }`;
  const data = await mondayQuery(q);
  return data.boards?.[0]?.groups?.[0]?.items_page?.items || [];
}

async function processItem(mainItemId, v6Data, bmDeviceMap) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing Main Board item: ${mainItemId}`);
  console.log('='.repeat(60));

  // Step 1: Read Final Grade
  console.log('[Step 1] Reading Final Grade...');
  const grade = await readFinalGrade(mainItemId);
  if (!grade) return null;
  console.log(`  Grade: ${grade.gradeText} → ${grade.bmGrade}`);

  // Step 2: Read Device Specs
  console.log('[Step 2] Reading device specs...');
  const specs = await readDeviceSpecs(mainItemId, bmDeviceMap);
  console.log(`  Model: ${specs.model}, RAM: ${specs.ram}, SSD: ${specs.ssd}, CPU: ${specs.cpu}, GPU: ${specs.gpu}`);
  console.log(`  Colour: ${specs.colour}, Purchase: £${specs.purchasePrice}, Parts: £${specs.partsCost}, Labour: ${specs.labourHours}h`);
  console.log(`  Device: ${specs.deviceName}`);

  // Check for missing cost data
  if (!specs.purchasePrice) {
    console.error(`  ⚠️ Missing purchase price — cannot calculate profitability`);
  }

  // Step 3: Construct SKU
  console.log('[Step 3] Constructing SKU...');
  const sku = constructSku(specs, grade.gradeText);
  console.log(`  SKU: ${sku}`);

  if (isLive) {
    await writeSkuToMonday(specs.bmDeviceId, sku);
    console.log(`  Written SKU to Monday`);
  }

  // Step 4: Get product_id from V6 scraper
  console.log('[Step 4] Looking up product_id from V6 scraper...');
  const v6Result = findProductId(v6Data, specs, grade.bmGrade);
  const hasV6 = v6Result && v6Result.productId;
  if (hasV6) {
    console.log(`  product_id: ${v6Result.productId} (matched: "${v6Result.modelKey}")`);
    console.log(`  Grade prices: ${JSON.stringify(v6Result.gradePrices)}`);
  } else if (specs.storedListingId) {
    console.log(`  V6 lookup failed, but stored listing ${specs.storedListingId} exists. Continuing with stored listing.`);
  } else {
    const msg = `⛔ Cannot list ${grade.name} (${sku}): model/spec not found in V6 scraper data and no stored listing ID. Manual product_id lookup required.`;
    console.error(`  ${msg}`);
    await postTelegram(msg);
    return null;
  }

  // Step 5: Search for existing listing slot
  // First check if Monday already has a stored listing ID (from previous listing or Path B creation)
  let slotResult;
  if (specs.storedListingId) {
    console.log(`[Step 5] Using stored listing ID from Monday: ${specs.storedListingId}`);
    try {
      const storedListing = await bmApiFetch(`/ws/listings/${specs.storedListingId}`);

      // ── SPEC & GRADE VERIFICATION (HARD GATE) ──
      // The stored listing may be from a previous device with different specs.
      // Verify product_id and grade match before using it.
      let specMismatch = false;
      const listingGrade = storedListing.grade; // FAIR, GOOD, VERY_GOOD
      const listingProductId = storedListing.product_id;

      // Check grade match
      if (listingGrade && listingGrade !== grade.bmGrade) {
        console.warn(`  ⛔ STORED LISTING GRADE MISMATCH: listing grade=${listingGrade}, device grade=${grade.bmGrade}`);
        specMismatch = true;
      }

      // Check product_id match (if we have V6 data to compare)
      if (hasV6 && listingProductId && listingProductId !== v6Result.productId) {
        // Product IDs can differ if the listing was created via Path B with a related product_id
        // that BM auto-resolved. Check if the stored UUID matches instead.
        if (specs.storedUuid && specs.storedUuid === v6Result.productId) {
          console.log(`  Stored UUID matches V6 product_id (listing product_id differs due to Path B auto-resolve)`);
        } else {
          console.warn(`  ⛔ STORED LISTING PRODUCT_ID MISMATCH: listing=${listingProductId}, V6=${v6Result.productId}`);
          specMismatch = true;
        }
      }

      // If no V6 data, verify using listing SKU text as sanity check
      if (!hasV6 && storedListing.sku) {
        const listingSku = (storedListing.sku || '').toUpperCase();
        const deviceSsd = (specs.ssd || '').replace(/\s/g, '').toUpperCase();
        const deviceRam = (specs.ram || '').replace(/\s/g, '').toUpperCase();
        // Check SSD and RAM appear in the listing SKU
        if (deviceSsd && !listingSku.includes(deviceSsd.replace('GB','')) && !listingSku.includes(deviceSsd)) {
          console.warn(`  ⛔ STORED LISTING SKU MISMATCH: listing SKU "${storedListing.sku}" doesn't contain device SSD "${specs.ssd}"`);
          specMismatch = true;
        }
        if (deviceRam && !listingSku.includes(deviceRam.replace('GB','')) && !listingSku.includes(deviceRam)) {
          console.warn(`  ⛔ STORED LISTING SKU MISMATCH: listing SKU "${storedListing.sku}" doesn't contain device RAM "${specs.ram}"`);
          specMismatch = true;
        }
      }

      if (specMismatch) {
        const msg = `⛔ Stored listing ${specs.storedListingId} does NOT match device specs/grade for ${grade.name} (${sku}). Listing SKU: "${storedListing.sku}", grade: ${listingGrade}. Falling back to product_id search.`;
        console.error(`  ${msg}`);
        await postTelegram(msg);
        // Fall through to product_id search instead of using mismatched listing
        if (hasV6) {
          console.log(`  Falling back to product_id search...`);
          slotResult = await searchListingSlot(v6Result.productId, grade.bmGrade);
        } else {
          console.error(`  No V6 data for fallback. Cannot list.`);
          return null;
        }
      } else {
        console.log(`  ✅ Stored listing verified: grade=${listingGrade}, product_id matches`);
        slotResult = {
          path: storedListing.quantity > 0 ? 'A2' : 'A',
          listing: storedListing,
          allListingIds: [storedListing.listing_id || storedListing.id],
          allListings: [],
        };
      }
    } catch (e) {
      console.warn(`  Stored listing ${specs.storedListingId} not found via API: ${e.message}. Falling back to search.`);
      if (hasV6) {
        slotResult = await searchListingSlot(v6Result.productId, grade.bmGrade);
      } else {
        const msg = `⛔ Cannot list ${grade.name} (${sku}): stored listing ${specs.storedListingId} not found and no V6 data for fallback.`;
        console.error(`  ${msg}`);
        await postTelegram(msg);
        return null;
      }
    }
  } else if (hasV6) {
    console.log(`[Step 5] Searching listings for product_id=${v6Result.productId}, grade=${grade.bmGrade}...`);
    slotResult = await searchListingSlot(v6Result.productId, grade.bmGrade);
  } else {
    // Should not reach here (caught above), but safety net
    const msg = `⛔ Cannot list ${grade.name} (${sku}): no V6 data and no stored listing.`;
    console.error(`  ${msg}`);
    return null;
  }
  console.log(`  Path: ${slotResult.path}`);
  if (slotResult.listing) {
    console.log(`  Listing ID: ${slotResult.listing.listing_id || slotResult.listing.id}, qty: ${slotResult.listing.quantity}`);
  }

  // Step 6: Get buy box price
  console.log('[Step 6] Getting buy box price...');
  const { proposed, source, flags: priceFlags } = await getBuyBoxPrice(slotResult, v6Result, grade.bmGrade);
  if (!proposed) {
    // If we have a stored listing with a price, use that as fallback
    const listingPrice = slotResult?.listing?.price;
    if (listingPrice && listingPrice > 0) {
      console.log(`  No V6 grade price. Using existing listing price: £${listingPrice}`);
      // Continue with listing price as proposed — will be overridden below
      var proposedOverride = listingPrice;
      var sourceOverride = 'existing listing price';
    } else {
      const scraperGradeName = BM_GRADE_TO_SCRAPER[grade.bmGrade] || grade.gradeText;
      const availGrades = v6Result?.gradePrices ? Object.entries(v6Result.gradePrices).map(([g, p]) => `${g}:£${p}`).join(', ') : 'none';
      const msg = `⛔ Cannot list ${grade.name} (${sku}): grade "${scraperGradeName}" has no price on BM. Available grades: ${availGrades}`;
      console.error(`  ${msg}`);
      await postTelegram(msg);
      return null;
    }
  }
  const finalProposed = proposed || proposedOverride;
  const finalSource = source || sourceOverride || 'unknown';
  console.log(`  Proposed: £${finalProposed} (${finalSource})`);
  if (priceFlags.length > 0) {
    for (const f of priceFlags) console.log(`  ${f}`);
  }

  // Check for grade inversion — flag but don't block
  // Inversions between OTHER grades (e.g. Good ≥ Excellent) shouldn't block THIS grade
  const hasInversion = priceFlags.some(f => f.includes('Grade inversion'));
  if (hasInversion) {
    console.log(`  ⚠️ Grade inversion detected in market prices. Flagged for review but not blocking.`);
  }

  // Step 7: Historical sales
  console.log('[Step 7] Looking up historical sales...');
  const historicalSales = await getHistoricalSales(slotResult.allListingIds);
  console.log(`  Sales: ${historicalSales.count > 0 ? `n=${historicalSales.count}, avg £${historicalSales.avg}` : 'no matching sales'}`);

  if (historicalSales.count > 0 && historicalSales.avg > finalProposed * 1.2) {
    console.log(`  🔴 Historical avg £${historicalSales.avg} significantly above proposed £${finalProposed} — market has moved down`);
  }

  // Step 8: Calculate profitability
  console.log('[Step 8] Calculating profitability at min_price...');
  const profitability = calculateProfitability(finalProposed, specs);
  console.log(`  Min price: £${profitability.minPrice}`);
  console.log(`  Net@min: £${profitability.net} | Margin: ${profitability.margin}%`);

  // Step 9: Decision gate
  console.log('[Step 9] Decision gate...');
  const decision = decisionGate(profitability);
  console.log(`  Decision: ${decision.decision} — ${decision.reason}`);

  // Build result object
  const result = {
    mainItemId,
    itemName: grade.name,
    grade,
    bmGrade: grade.bmGrade,
    sku,
    specs,
    v6Result,
    slotResult,
    pricing: { proposed: finalProposed, source: finalSource },
    historicalSales,
    profitability,
    decision,
    priceFlags,
  };

  // Print formatted summary
  console.log('\n' + formatSummary(result));

  // Step 10-12: Live mode actions
  if (isLive && decision.decision === 'AUTO-LIST') {
    console.log('\n[Step 10] Creating/reactivating listing...');
    try {
      const listResult = await createOrReactivateListing(slotResult, profitability, grade.bmGrade, sku);
      console.log(`  Listing action complete. Listing ID: ${listResult.listingId}`);

      // Step 11: Verify
      console.log('[Step 11] Verifying listing...');
      const expectedQty = slotResult.path === 'A2' ? (slotResult.listing.quantity || 0) + 1 : 1;
      const verification = await verifyListing(listResult.listingId, { quantity: expectedQty });
      if (verification.verified) {
        console.log('  ✅ Listing verified');
      } else {
        console.warn(`  ⚠️ Verification issues: ${verification.issues.join(', ')}`);
        // Retry once
        console.log('  Retrying POST...');
        await createOrReactivateListing(slotResult, profitability, grade.bmGrade, sku);
        const retry = await verifyListing(listResult.listingId, { quantity: expectedQty });
        if (!retry.verified) {
          await postTelegram(`⚠️ Listing ${listResult.listingId} verification failed after retry: ${retry.issues.join(', ')}`);
        }
      }

      // Step 12: Update Monday
      console.log('[Step 12] Updating Monday...');
      await updateMonday(mainItemId, specs.bmDeviceId, listResult.listingId, v6Result.productId, profitability.totalFixedCost);
      console.log('  Monday updated');

      // Step 13: Telegram confirmation
      const tgMsg = [
        `✅ Listed: ${grade.name} ${specs.ssd} ${specs.ram} ${grade.gradeText} ${specs.colour}`,
        `Price: £${profitability.proposed} | Min: £${profitability.minPrice} | Net@min: £${profitability.net} (${profitability.margin}%)`,
        `Listing ID: ${listResult.listingId}`,
        `Path: ${slotResult.path}`,
      ].join('\n');
      await postTelegram(tgMsg);

    } catch (e) {
      console.error(`  ❌ Listing failed: ${e.message}`);
      await postTelegram(`❌ Listing failed for ${grade.name} (${sku}): ${e.message}`);
    }
  } else if (isLive && decision.decision === 'PROPOSE') {
    // Post proposal to Telegram
    const tgMsg = `⚠️ AWAITING APPROVAL\n${formatSummary(result)}`;
    await postTelegram(tgMsg);
  } else if (isLive && decision.decision === 'BLOCK') {
    const tgMsg = `⛔ BLOCKED\n${formatSummary(result)}`;
    await postTelegram(tgMsg);
  }

  return result;
}

async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Back Market Listing Script — ${isDryRun ? 'DRY RUN' : '🔴 LIVE MODE'}`);
  console.log(`  ${today()} | Node ${process.version}`);
  console.log('═'.repeat(60));

  // Load V6 data once
  console.log('\nLoading V6 scraper data...');
  const v6Data = loadV6Data();
  const modelCount = Object.keys(v6Data.models).length;
  console.log(`  ${modelCount} models loaded (scraped ${v6Data.scraped_at})`);

  // Get items to process
  let itemIds = [];
  if (singleItemId) {
    itemIds = [singleItemId];
    console.log(`\nProcessing single item: ${singleItemId}`);
  } else {
    console.log(`\nFetching "To List" items from group ${TO_LIST_GROUP}...`);
    const items = await getToListItems();
    itemIds = items.map(i => i.id);
    console.log(`  Found ${itemIds.length} items to process`);
    if (items.length > 0) {
      for (const item of items) console.log(`    - ${item.id}: ${item.name}`);
    }
  }

  if (itemIds.length === 0) {
    console.log('\nNo items to process. Exiting.');
    return;
  }

  // Pre-build BM Device map (scan BM Devices board once, not per item)
  console.log('\nBuilding BM Devices map...');
  const bmDeviceMap = await buildBmDeviceMap(itemIds);
  const mappedCount = Object.keys(bmDeviceMap).length;
  console.log(`  Mapped ${mappedCount}/${itemIds.length} items to BM Devices`);
  for (const [mainId, dev] of Object.entries(bmDeviceMap)) {
    console.log(`    ${mainId} → ${dev.bmDeviceId} (${dev.bmDeviceName})`);
  }

  // Process each item
  const results = [];
  for (const id of itemIds) {
    try {
      const result = await processItem(id, v6Data, bmDeviceMap);
      if (result) results.push(result);
    } catch (e) {
      console.error(`\n❌ Error processing item ${id}: ${e.message}`);
      log.error(`Item ${id}: ${e.stack}`);
    }
  }

  // Final summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Processed: ${results.length}/${itemIds.length}`);
  const autoList = results.filter(r => r.decision.decision === 'AUTO-LIST').length;
  const propose = results.filter(r => r.decision.decision === 'PROPOSE').length;
  const block = results.filter(r => r.decision.decision === 'BLOCK').length;
  console.log(`  ✅ Auto-list: ${autoList}`);
  console.log(`  ⚠️ Propose: ${propose}`);
  console.log(`  ⛔ Blocked: ${block}`);
  console.log(`  Mode: ${isDryRun ? 'DRY RUN (no actions taken)' : '🔴 LIVE'}`);
  console.log('');
}

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
});

main().then(() => {
  // Ensure stdout flushes before exit
  if (process.stdout.writableEnded) return;
  process.stdout.write('', () => process.exit(0));
}).catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
