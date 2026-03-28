#!/usr/bin/env node
/**
 * list-device.js — Back Market Listing Script (SOP 06)
 *
 * Clean-create only (Path B). Never reactivates old listings.
 * Creates as draft (state=3), gets backbox price, then publishes.
 *
 * Modes:
 *   --dry-run   (default) Calculate everything, print results, no actions
 *   --live      Create fresh listings and update Monday
 *   --item <id> Process a single Main Board item
 *   --min-margin <n> Override minimum margin % (default: 15)
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
const BM_CATALOG_PATH = '/home/ricky/builds/backmarket/data/bm-catalog.json';
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
const minMarginIdx = args.indexOf('--min-margin');
const MIN_MARGIN_OVERRIDE = minMarginIdx !== -1 ? parseFloat(args[minMarginIdx + 1]) : null;
const productIdIdx = args.indexOf('--product-id');
const PRODUCT_ID_OVERRIDE = productIdIdx !== -1 ? args[productIdIdx + 1] : null;

// ─── Disk Cache ──────────────────────────────────────────────────
const CACHE_DIR = path.join(__dirname, 'data', 'cache');
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function readDiskCache(name) {
  const cachePath = path.join(CACHE_DIR, `${name}.json`);
  if (!fs.existsSync(cachePath)) return null;
  const stat = fs.statSync(cachePath);
  if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null;
  try {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch { return null; }
}

function writeDiskCache(name, data) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CACHE_DIR, `${name}.json`), JSON.stringify(data));
}

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

function normalizeColour(colour) {
  const value = (colour || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!value) return '';
  if (['space gray', 'space grey', 'grey', 'gray'].includes(value)) return 'Space Gray';
  if (value === 'silver') return 'Silver';
  if (value === 'gold') return 'Gold';
  if (value === 'midnight') return 'Midnight';
  if (value === 'starlight') return 'Starlight';
  if (value === 'black') return 'Black';
  if (value === 'space black') return 'Space Black';
  return colour.trim();
}

function lookupTitleHasExpectedColour(title, colour) {
  const titleNorm = (title || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const colourNorm = normalizeColour(colour);
  if (!titleNorm || !colourNorm) return false;

  const acceptable = {
    'Space Gray': ['space gray', 'space grey', 'grey', 'gray'],
    Silver: ['silver'],
    Gold: ['gold'],
    Midnight: ['midnight'],
    Starlight: ['starlight'],
    Black: ['black'],
    'Space Black': ['space black'],
  };

  return (acceptable[colourNorm] || [colourNorm.toLowerCase()]).some(option => titleNorm.includes(option));
}

function normalizeStorageForCatalog(ssd) {
  const value = (ssd || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!value) return '';
  if (value === '1TB') return '1000GB';
  if (value === '2TB') return '2000GB';
  if (value === '4TB') return '4000GB';
  return value;
}

function normalizeRamForCatalog(ram) {
  return (ram || '').trim().toUpperCase().replace(/\s+/g, '');
}

const MODEL_NUMBER_TO_CATALOG_FAMILY = {
  A1466: 'MacBook Air 13-inch (2017)',
  A1932: 'MacBook Air Retina 13-inch (2018)',
  A2179: 'MacBook Air Retina 13-inch (2020)',
  A2337: 'MacBook Air 13-inch (2020)',
  A2681: 'MacBook Air 13-inch (2022)',
  A2941: 'MacBook Air 15-inch (2023)',
  A3113: 'MacBook Air 13-inch (2024)',
  A3114: 'MacBook Air 13-inch (2024)',
  A3240: 'MacBook Air 13-inch (2025)',
  A2251: 'MacBook Pro Retina 13-inch (2020)',
  A2289: 'MacBook Pro Retina 13-inch (2020)',
  A2338: 'MacBook Pro 13-inch (2020)',
  A2442: 'MacBook Pro 14-inch (2021)',
  A2485: 'MacBook Pro 16-inch (2021)',
  A2779: 'MacBook Pro 14-inch (2023)',
  A2780: 'MacBook Pro 16-inch (2023)',
  A2918: 'MacBook Pro 14-inch (2023)',
  A2991: 'MacBook Pro 16-inch (2023)',
  A2992: 'MacBook Pro 14-inch (2023)',
};

function deriveCatalogModelFamily(specs) {
  const fromModel = MODEL_NUMBER_TO_CATALOG_FAMILY[specs.model];
  if (fromModel) return fromModel;

  const deviceName = specs.deviceName || '';
  const retinaMatch = deviceName.match(/MacBook\s+(Air|Pro)\s+(Retina\s+)?(\d+).*(20\d{2})/i);
  if (retinaMatch) {
    const type = retinaMatch[1];
    const retina = retinaMatch[2] ? ' Retina' : '';
    const size = retinaMatch[3];
    const year = retinaMatch[4];
    return `MacBook ${type}${retina} ${size}-inch (${year})`;
  }
  return '';
}

function classifyTrust({ hasProductResolution, liveEligible, decision, missingGrade }) {
  if (missingGrade || !hasProductResolution) {
    return {
      classification: 'blocked',
      reason: missingGrade ? 'Missing or unmapped final grade' : 'No trusted product_id resolution',
    };
  }
  if (decision?.decision === 'BLOCK') {
    return { classification: 'blocked', reason: decision.reason };
  }
  if (!liveEligible) {
    return { classification: 'manual_review', reason: 'Product/spec/colour resolution is not exact enough for live listing' };
  }
  return { classification: 'safe_manual', reason: 'Exact product resolution and non-blocked profitability; eligible only for single-item manual live run' };
}

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
  // 2a: Read Main Board data (colour, parts cost, labour cost, labour hours)
  // lookup_mkx1xzd7 = Parts Cost (mirror, comma-separated values, SUM them)
  // formula_mkx1bjqr = Labour Cost £ (formula)
  // formula__1 = Labour Hours (formula, decimal)
  const mainQ = `query { items(ids: [${mainItemId}]) {
    name
    column_values(ids: ["status8", "lookup_mkx1xzd7", "formula_mkx1bjqr", "formula__1"]) {
      id
      ... on StatusValue { text }
      ... on FormulaValue { display_value }
      ... on MirrorValue { display_value }
    }
  }}`;
  const mainData = await mondayQuery(mainQ);
  const mainItem = mainData.items?.[0];
  if (!mainItem) throw new Error(`Main item ${mainItemId} not found`);

  let colour = '', partsCostStr = '0', labourCostStr = '0', labourHoursStr = '0';
  for (const cv of mainItem.column_values) {
    if (cv.id === 'status8') colour = cv.text || '';
    if (cv.id === 'lookup_mkx1xzd7') partsCostStr = cv.display_value || '0'; // Parts Cost (mirror, comma-separated)
    if (cv.id === 'formula_mkx1bjqr') labourCostStr = cv.display_value || '0'; // Labour Cost £
    if (cv.id === 'formula__1') labourHoursStr = cv.display_value || '0'; // Labour Hours
  }

  // 2b: Get BM Device specs from pre-built map
  const bmDev = bmDeviceMap?.[String(mainItemId)];
  if (!bmDev) throw new Error(`No BM Device found linked to Main item ${mainItemId} on BM Devices Board`);

  // Parts cost: mirror column returns comma-separated values like "18, 7, 11, 8" — sum them
  const partsCost = String(partsCostStr).split(',')
    .map(v => parseFloat(v.replace(/[£,\s]/g, '')) || 0)
    .reduce((a, b) => a + b, 0);
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
    // A2179 is Intel Air — resolved via catalog or --product-id override.
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

let _bmCatalog = null;
let _bmCatalogIndex = null;

function loadBmCatalog() {
  if (_bmCatalog) return _bmCatalog;
  const raw = fs.readFileSync(BM_CATALOG_PATH, 'utf8');
  _bmCatalog = JSON.parse(raw);
  console.log(`  Loaded BM catalog: ${Object.keys(_bmCatalog.variants || {}).length} variants`);
  return _bmCatalog;
}

function buildCatalogKey(modelFamily, ram, ssd, colour) {
  return [
    modelFamily || '',
    normalizeRamForCatalog(ram),
    normalizeStorageForCatalog(ssd),
    normalizeColour(colour),
  ].join('|');
}

function buildCatalogIndexes() {
  if (_bmCatalogIndex) return _bmCatalogIndex;

  const catalog = loadBmCatalog();
  const exact = new Map();
  const bySpec = new Map();

  for (const variant of Object.values(catalog.variants || {})) {
    const modelFamily = variant.model_family || '';
    const ram = normalizeRamForCatalog(variant.ram);
    const ssd = normalizeStorageForCatalog(variant.ssd);
    const colour = normalizeColour(variant.colour);
    if (!modelFamily || !ram || !ssd) continue;

    const exactKey = buildCatalogKey(modelFamily, ram, ssd, colour);
    if (!exact.has(exactKey)) exact.set(exactKey, []);
    exact.get(exactKey).push(variant);

    const specKey = [modelFamily, ram, ssd].join('|');
    if (!bySpec.has(specKey)) bySpec.set(specKey, []);
    bySpec.get(specKey).push(variant);
  }

  _bmCatalogIndex = { exact, bySpec };
  return _bmCatalogIndex;
}

function findV6GradePricesForCatalogVariant(v6Data, variant) {
  if (variant?.grade_prices && Object.keys(variant.grade_prices).length > 0) {
    return variant.grade_prices;
  }
  return {};
}

function resolveProductFromCatalog(specs, v6Data) {
  const indexes = buildCatalogIndexes();
  const modelFamily = deriveCatalogModelFamily(specs);
  const ram = normalizeRamForCatalog(specs.ram);
  const ssd = normalizeStorageForCatalog(specs.ssd);
  const colour = normalizeColour(specs.colour);

  const base = {
    source: 'bm-catalog',
    modelKey: modelFamily || '(unmapped family)',
    modelFamily,
    normalizedRam: ram,
    normalizedSsd: ssd,
    normalizedColour: colour,
    gradePrices: {},
    ssdPicker: {},
    colourPrices: {},
    adjacentSsd: [],
    ramPicker: {},
    colourPicker: {},
    cpuGpuPicker: {},
    colourVerified: false,
    liveEligible: false,
  };

  if (!modelFamily || !ram || !ssd) {
    return {
      ...base,
      blocked: true,
      resolutionSource: 'catalog-missing-core-fields',
      blockReason: 'Missing model_family, RAM, or SSD for catalog lookup',
    };
  }

  const exactKey = buildCatalogKey(modelFamily, ram, ssd, colour);
  const exactCandidates = indexes.exact.get(exactKey) || [];
  if (exactCandidates.length === 1) {
    const variant = exactCandidates[0];
    return {
      ...base,
      productId: variant.product_id,
      title: variant.title,
      lookupTitle: variant.title,
      backmarketId: variant.backmarket_id,
      resolutionConfidence: variant.resolution_confidence,
      verificationStatus: variant.verification_status,
      gradePrices: findV6GradePricesForCatalogVariant(v6Data, variant),
      available: variant.available,
      liveEligible: variant.verification_status === 'verified' && variant.resolution_confidence !== 'market_only',
      resolutionSource: 'catalog-exact',
      colourVerified: !!normalizeColour(variant.colour),
      variant,
    };
  }
  if (exactCandidates.length > 1) {
    return {
      ...base,
      blocked: true,
      resolutionSource: 'catalog-ambiguous-exact',
      blockReason: `Ambiguous exact catalog match (${exactCandidates.length} variants)`,
      candidates: exactCandidates.map(v => ({ product_id: v.product_id, title: v.title })),
    };
  }

  const specKey = [modelFamily, ram, ssd].join('|');
  const specCandidates = indexes.bySpec.get(specKey) || [];
  const noColourCandidates = specCandidates.filter(v => !normalizeColour(v.colour));
  if (noColourCandidates.length === 1) {
    const variant = noColourCandidates[0];
    return {
      ...base,
      productId: variant.product_id,
      title: variant.title,
      lookupTitle: variant.title,
      backmarketId: variant.backmarket_id,
      resolutionConfidence: variant.resolution_confidence,
      verificationStatus: variant.verification_status,
      gradePrices: findV6GradePricesForCatalogVariant(v6Data, variant),
      available: variant.available,
      liveEligible: variant.verification_status === 'verified' && variant.resolution_confidence !== 'market_only',
      resolutionSource: 'catalog-spec-no-colour',
      colourVerified: false,
      variant,
    };
  }

  if (specCandidates.length > 0) {
    return {
      ...base,
      blocked: true,
      resolutionSource: 'catalog-needs-review',
      blockReason: colour
        ? `No exact colour match in catalog for ${colour}; ${specCandidates.length} spec candidate(s) require review`
        : `${specCandidates.length} catalog candidate(s) found but none are safely exact`,
      candidates: specCandidates.map(v => ({
        product_id: v.product_id,
        colour: v.colour,
        verification_status: v.verification_status,
        resolution_confidence: v.resolution_confidence,
      })),
    };
  }

  return {
    ...base,
    blocked: true,
    resolutionSource: 'catalog-no-match',
    blockReason: 'No catalog match for model/spec/colour',
  };
}

// ─── Step 4: Get product_id from V6 Scraper ──────────────────────

function loadV6Data() {
  const raw = fs.readFileSync(V6_DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

// ─── Path B: Create Fresh Listing ────────────────────────────────
// ─── Step 5: Get Reference product_id ────────────────────────────
// (product_id already resolved in Step 4 via catalog — no listing search needed)

// ─── Path B: Create Fresh Listing ────────────────────────────────

async function createFreshListing(productId, sku, bmGrade, placeholderPrice) {
  // CSV format with grade column included — CRITICAL: without grade, BM defaults to GOOD
  const csvHeader = 'sku,product_id,quantity,warranty_delay,price,state,currency,grade';
  const csvRow = `${sku},${productId},1,12,${placeholderPrice},3,GBP,${bmGrade}`;
  const catalog = csvHeader + '\r\n' + csvRow;

  const body = {
    catalog,
    quotechar: '"',
    delimiter: ',',
    encoding: 'utf-8',
  };

  console.log(`  [Path B] POST /ws/listings (draft, grade=${bmGrade})`);
  console.log(`  CSV: ${catalog}`);
  const result = await bmApiFetch(`/ws/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const taskId = result.bodymessage || result.task_id || result.id;
  if (!taskId) throw new Error(`Path B create returned no task_id: ${JSON.stringify(result)}`);
  return taskId;
}

async function pollTask(taskId, maxAttempts = 15) {
  console.log(`  Polling task ${taskId}...`);
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(3000);
    try {
      const task = await bmApiFetch(`/ws/tasks/${taskId}`);
      if (task.action_status === 9) {
        // Task complete
        const ps = task.result?.product_success || {};
        const pe = task.result?.product_errors || {};
        if (Object.keys(pe).length > 0) {
          throw new Error(`Path B task errors: ${JSON.stringify(pe)}`);
        }
        const firstKey = Object.keys(ps)[0];
        if (!firstKey) throw new Error(`Path B task complete but no product_success entries`);
        const entry = ps[firstKey];
        console.log(`  ✅ Task complete: listing_id=${entry.listing_id}, backmarket_id=${entry.backmarket_id}, pub_state=${entry.publication_state}`);
        return entry;
      }
      if (task.action_status > 9 || task.state === 'FAILURE' || task.status === 'FAILURE') {
        throw new Error(`Path B task failed: status=${task.action_status}, ${JSON.stringify(task)}`);
      }
      console.log(`  ... poll ${i + 1}/${maxAttempts}, action_status=${task.action_status}`);
    } catch (e) {
      if (i === maxAttempts - 1) throw e;
      // Transient error — retry
    }
  }
  throw new Error(`Task ${taskId} polling timeout after ${maxAttempts} attempts`);
}

async function getBackboxPrice(listingId) {
  // First get the listing to find the UUID (backbox needs UUID, not numeric ID)
  const listing = await bmApiFetch(`/ws/listings/${listingId}`);
  const listingUuid = listing.id; // UUID format
  if (!listingUuid) {
    console.warn(`  No UUID found for listing ${listingId}`);
    return { price: 0, source: 'no-uuid' };
  }
  try {
    const bbData = await bmApiFetch(`/ws/backbox/v1/competitors/${listingUuid}`);
    if (bbData.price_to_win) {
      const price = parseFloat(bbData.price_to_win);
      console.log(`  Backbox price_to_win: £${price} (uuid=${listingUuid})`);
      return { price, source: 'backbox', data: bbData };
    }
    console.log(`  Backbox returned no price_to_win for uuid=${listingUuid}`);
    return { price: 0, source: 'backbox-no-price' };
  } catch (e) {
    console.warn(`  Backbox API failed for listing ${listingId} (uuid=${listingUuid}): ${e.message}`);
    return { price: 0, source: 'backbox-error' };
  }
}

async function publishListing(listingId, finalPrice, minPrice) {
  const body = {
    quantity: 1,
    price: finalPrice,
    min_price: minPrice,
    pub_state: 2,
    currency: 'GBP',
  };
  console.log(`  Publishing listing ${listingId}: price=£${finalPrice}, min=£${minPrice}`);
  await bmApiFetch(`/ws/listings/${listingId}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── Step 6: Get Catalog Grade Price (market reference) ──────────

function getCatalogGradePrice(v6Result, bmGrade) {
  const gradePrices = v6Result?.gradePrices || {};
  const scraperGrade = BM_GRADE_TO_SCRAPER[bmGrade] || bmGrade;

  // Direct match
  let price = gradePrices[scraperGrade] || gradePrices[bmGrade] || 0;
  let source = price > 0 ? 'catalog grade price' : '';

  // Derive from other grades if our grade has no price
  if (!price) {
    const availPrices = Object.values(gradePrices).filter(p => p > 0);
    if (availPrices.length > 0) {
      const lowestAvail = Math.min(...availPrices);
      const gradeOrder = { 'FAIR': 0, 'GOOD': 1, 'VERY_GOOD': 2 };
      const ourLevel = gradeOrder[bmGrade] ?? 1;
      let lowestPricedLevel = 3;
      for (const [g, p] of Object.entries(gradePrices)) {
        const bg = g === 'Fair' ? 'FAIR' : g === 'Good' ? 'GOOD' : g === 'Excellent' ? 'VERY_GOOD' : g;
        const level = gradeOrder[bg] ?? gradeOrder[g] ?? 1;
        if (p > 0 && level < lowestPricedLevel) lowestPricedLevel = level;
      }
      if (ourLevel < lowestPricedLevel) {
        price = Math.floor(lowestAvail * 0.95);
        source = `derived: 5% under lowest available grade (£${lowestAvail})`;
      } else if (ourLevel > lowestPricedLevel) {
        price = Math.max(...availPrices);
        source = `derived: matched to highest available grade (£${price})`;
      }
    }
  }

  return { price, source };
}

function getPriceFlags(v6Result) {
  const flags = [];

  // Adjacent SSD check
  if (v6Result?.ssdPicker) {
    const ssdKeys = Object.keys(v6Result.ssdPicker).filter(k => v6Result.ssdPicker[k].available);
    const ssdPrices = ssdKeys.map(k => ({ key: k, price: v6Result.ssdPicker[k].price })).filter(p => p.price);
    ssdPrices.sort((a, b) => parseInt(a.key) - parseInt(b.key));
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

  return flags;
}

// ─── Step 7: Historical Sales ─────────────────────────────────────

// Orders cache: fetch once, reuse across all items
let _ordersCache = null;
async function getAllCompletedOrders() {
  if (_ordersCache) {
    console.log(`  Using cached orders (${_ordersCache.length} total)`);
    return _ordersCache;
  }
  const diskCache = readDiskCache('orders');
  if (diskCache) {
    console.log(`  Using disk-cached orders (${diskCache.length} total, <1hr old)`);
    _ordersCache = diskCache;
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
  writeDiskCache('orders', allOrders);
  return allOrders;
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
  const minMargin = MIN_MARGIN_OVERRIDE !== null ? MIN_MARGIN_OVERRIDE : 15;
  const minNet = MIN_MARGIN_OVERRIDE !== null ? MIN_MARGIN_OVERRIDE : 50; // £50 minimum net profit

  if (net < 0 && MIN_MARGIN_OVERRIDE === null) return { decision: 'BLOCK', reason: `Loss at min_price (net £${net})` };
  if (net < 0 && MIN_MARGIN_OVERRIDE !== null) return { decision: 'PROPOSE', reason: `⚠️ Loss maker (net £${net}) — approved via --min-margin override` };
  if (net < minNet && net >= 0) return { decision: 'BLOCK', reason: `Net £${net} < £${minNet} minimum at min_price` };
  if (margin < minMargin) return { decision: 'BLOCK', reason: `Margin ${margin.toFixed(1)}% < ${minMargin}% at min_price` };
  return { decision: 'PROPOSE', reason: `Margin ${margin.toFixed(1)}%, net £${net}` };
}

// ─── Step 11: Verify Listing ──────────────────────────────────────

async function verifyListing(listingId, expected) {
  if (!listingId) return { verified: false, error: 'No listing_id' };

  const listing = await bmApiFetch(`/ws/listings/${listingId}`);
  const issues = [];

  const pubState = listing.publication_state ?? listing.pub_state;
  const expectedPubState = expected.pubState || 2;
  if (pubState !== expectedPubState && pubState !== String(expectedPubState)) issues.push(`pub_state=${pubState} (expected ${expectedPubState})`);
  if (expected.quantity && listing.quantity !== expected.quantity) issues.push(`qty=${listing.quantity} (expected ${expected.quantity})`);
  if (expected.productId && listing.product_id !== expected.productId) {
    issues.push(`⛔ PRODUCT_ID MISMATCH: listing product_id=${listing.product_id}, expected=${expected.productId}`);
  }

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
  // Colour verification: two-tier approach
  // If catalog already verified colour at Step 4 (catalog-exact + colourVerified), skip title check
  // BM titles don't always include colour — the product_id IS the colour verification
  if (expected.colourVerifiedByCatalog) {
    console.log(`  Colour: ✅ verified by catalog (skipping title check)`);
  } else if (expected.colour) {
    if (!lookupTitleHasExpectedColour(listing.title || '', expected.colour)) {
      issues.push(`⛔ TITLE COLOUR MISMATCH: title="${listing.title}", expected colour=${expected.colour}`);
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

async function updateMonday(mainItemId, bmDeviceId, listingId, productId, totalFixedCost, sku) {
  // BM Devices Board updates
  const mutations = [
    // SKU -> text89, but only after successful live verification
    `m0: change_column_value(board_id: ${BM_DEVICES_BOARD}, item_id: ${bmDeviceId},
      column_id: "text89", value: ${JSON.stringify(JSON.stringify(String(sku)))}) { id }`,
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
    pricing, historicalSales, profitability, decision, priceFlags, trust,
  } = device;

  const p = profitability || {
    proposed: 0, minPrice: 0, purchasePrice: specs.purchasePrice || 0, partsCost: specs.partsCost || 0,
    labourCost: 0, labourHours: specs.labourHours || 0, shipping: SHIPPING_COST, bmBuyFee: 0, bmSellFee: 0, vat: 0,
    totalFixedCost: 0, breakEven: 0, net: 0, margin: 0,
  };
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
  lines.push(`Path     B (clean create — draft then publish)`);
  lines.push(`SKU      ${sku}`);

  // Product source and title verification
  if (v6Result?.source === 'bm-catalog') {
    lines.push(`Source   BM catalog: ${v6Result.modelKey}`);
    if (v6Result.lookupTitle) lines.push(`BM title ${v6Result.lookupTitle}`);
    if (v6Result.resolutionConfidence) lines.push(`Conf     ${v6Result.resolutionConfidence}`);
    if (v6Result.verificationStatus) lines.push(`Verify   ${v6Result.verificationStatus}`);
    if (v6Result.blockReason) lines.push(`Block    ${v6Result.blockReason}`);
  }
  if (v6Result?.resolutionSource) {
    lines.push(`Resolve  ${v6Result.resolutionSource}${v6Result.colourVerified ? ' | colour verified' : ' | colour not independently verified'}`);
  }

  // Status
  const statusEmoji = decision.decision === 'AUTO-LIST' ? '✅' : decision.decision === 'PROPOSE' ? '⚠️' : '⛔';
  const statusLabel = decision.decision === 'AUTO-LIST' ? 'AUTO-LIST' : decision.decision === 'PROPOSE' ? `PROPOSE (${p.margin}% margin)` : 'BLOCK';
  lines.push(`Status   ${statusEmoji} ${statusLabel}`);
  if (decision.decision !== 'AUTO-LIST') lines.push(`         ${decision.reason}`);
  lines.push(`Trust    ${trust.classification} — ${trust.reason}`);

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

  // Step 4: Resolve product from canonical BM catalog
  console.log('[Step 4] Resolving product from BM catalog...');
  let v6Result;
  if (PRODUCT_ID_OVERRIDE) {
    // Manual product_id override — for family-member resolution when catalog can't exact-match
    console.log(`  ⚠️ --product-id override: ${PRODUCT_ID_OVERRIDE}`);
    console.log(`  BM will auto-resolve the correct catalog entry from this product_id.`);
    console.log(`  Post-create verification MUST confirm the title matches the device specs.`);
    const catalogResult = resolveProductFromCatalog(specs, v6Data);
    v6Result = {
      ...catalogResult,
      productId: PRODUCT_ID_OVERRIDE,
      resolutionConfidence: 'manual_override',
      verificationStatus: 'verified',
      resolutionSource: 'product-id-override',
      liveEligible: true,
      colourVerified: false, // Must verify after creation
    };
  } else {
    v6Result = resolveProductFromCatalog(specs, v6Data);
  }
  const hasV6 = v6Result && v6Result.productId;
  console.log(`  Family: ${v6Result.modelFamily || '(unmapped)'}`);
  console.log(`  Lookup: ${v6Result.normalizedRam}/${v6Result.normalizedSsd}/${v6Result.normalizedColour || '(no colour)'}`);
  if (hasV6) {
    console.log(`  product_id: ${v6Result.productId} (${v6Result.resolutionSource === 'product-id-override' ? 'MANUAL OVERRIDE' : `catalog: "${v6Result.modelKey}"`})`);
    console.log(`  resolution_confidence: ${v6Result.resolutionConfidence}`);
    console.log(`  verification_status: ${v6Result.verificationStatus}`);
    console.log(`  Grade prices: ${JSON.stringify(v6Result.gradePrices)}`);
    console.log(`  Resolution: ${v6Result.resolutionSource}`);
    if (v6Result.resolutionConfidence === 'market_only') {
      console.log('  ⛔ market_only cannot authorize live listing.');
      v6Result.liveEligible = false;
    }
    if (v6Result.verificationStatus !== 'verified') {
      console.log(`  ⛔ Catalog match requires manual review (${v6Result.verificationStatus}).`);
      v6Result.liveEligible = false;
    }
  } else {
    console.log(`  ⛔ Catalog resolution blocked: ${v6Result?.blockReason || 'unknown reason'}`);
    if (v6Result?.candidates?.length) {
      console.log(`  Candidates: ${v6Result.candidates.length}`);
    }
  }

  if (!hasV6 || v6Result.verificationStatus !== 'verified' || v6Result.resolutionConfidence === 'market_only') {
    const blockReason = !hasV6
      ? (v6Result?.blockReason || 'No catalog product match')
      : v6Result.resolutionConfidence === 'market_only'
        ? 'Catalog match is market_only and cannot authorize listing'
        : `Catalog match status is ${v6Result.verificationStatus}`;
    const blockedDecision = { decision: 'BLOCK', reason: blockReason };
    const blockedTrust = classifyTrust({
      hasProductResolution: !!hasV6,
      liveEligible: false,
      decision: blockedDecision,
      missingGrade: !grade?.bmGrade,
    });
    const blockedResult = {
      mainItemId,
      itemName: grade.name,
      grade,
      bmGrade: grade.bmGrade,
      sku,
      specs,
      v6Result,
      slotResult: null,
      pricing: { proposed: 0, source: 'blocked before pricing' },
      historicalSales: { count: 0, avg: 0, low: 0, high: 0, sales: [] },
      profitability: {
        proposed: 0, minPrice: 0, purchasePrice: specs.purchasePrice || 0, partsCost: specs.partsCost || 0,
        labourCost: 0, labourHours: specs.labourHours || 0, shipping: SHIPPING_COST, bmBuyFee: 0, bmSellFee: 0,
        vat: 0, totalCosts: 0, net: 0, margin: 0, totalFixedCost: 0, breakEven: 0,
      },
      decision: blockedDecision,
      priceFlags: [],
      trust: blockedTrust,
    };
    console.log('\n' + formatSummary(blockedResult));
    return blockedResult;
  }

  // Step 5: Reference product_id (already resolved in Step 4)
  console.log('[Step 5] Reference product_id from catalog...');
  console.log(`  product_id: ${v6Result.productId}`);
  console.log(`  model_family: ${v6Result.modelFamily || v6Result.modelKey}`);

  // Step 6: Calculate P&L using catalog grade prices as market reference
  console.log('[Step 6] Getting catalog grade price for P&L...');
  const catalogGrade = getCatalogGradePrice(v6Result, grade.bmGrade);
  const priceFlags = getPriceFlags(v6Result);
  if (priceFlags.length > 0) {
    for (const f of priceFlags) console.log(`  ${f}`);
  }

  // Calculate floor price from costs
  const labourCost = specs.labourHours * LABOUR_RATE;
  const bmBuyFee = specs.purchasePrice * BM_BUY_FEE_RATE;
  const totalFixedCost = specs.purchasePrice + specs.partsCost + labourCost + SHIPPING_COST + bmBuyFee;
  // Floor = break-even price (where net = 0)
  const floorPrice = totalFixedCost > 0
    ? Math.ceil((totalFixedCost - specs.purchasePrice * VAT_RATE) / (1 - BM_SELL_FEE_RATE - VAT_RATE))
    : 100;
  console.log(`  Catalog grade price: £${catalogGrade.price || 'N/A'} (${catalogGrade.source || 'none'})`);
  console.log(`  Floor price (break-even): £${floorPrice}`);

  // Use catalog grade price as market reference for P&L
  const marketPrice = catalogGrade.price || 0;
  const proposedPrice = marketPrice > 0 ? marketPrice : Math.round(floorPrice * 1.5);
  const priceSource = marketPrice > 0 ? catalogGrade.source : `floor × 1.5 (no catalog grade price)`;
  console.log(`  Proposed (for P&L): £${proposedPrice} (${priceSource})`);

  // Historical sales (use orders cache — no listings search needed)
  console.log('[Step 6b] Looking up historical sales...');
  const historicalSales = { count: 0, avg: 0, low: 0, high: 0, sales: [] };
  // Historical sales are less relevant for clean-create flow (no existing listing IDs to match)
  // Kept as placeholder for future enhancement if needed

  // Calculate profitability at proposed price
  console.log('[Step 6c] Calculating profitability at min_price...');
  const profitability = calculateProfitability(proposedPrice, specs);
  console.log(`  Min price: £${profitability.minPrice}`);
  console.log(`  Net@min: £${profitability.net} | Margin: ${profitability.margin}%`);

  // Step 7: Decision gate
  console.log('[Step 7] Decision gate...');
  const decision = decisionGate(profitability);
  console.log(`  Decision: ${decision.decision} — ${decision.reason}`);
  const trust = classifyTrust({
    hasProductResolution: !!hasV6,
    liveEligible: !!v6Result?.liveEligible,
    decision,
    missingGrade: !grade?.bmGrade,
  });
  console.log(`  Trust: ${trust.classification} — ${trust.reason}`);

  // Placeholder price for draft listing: safe high number
  const catalogGradePrice = catalogGrade.price || 0;
  const placeholderPrice = Math.max(floorPrice * 2, catalogGradePrice > 0 ? Math.round(catalogGradePrice * 1.2) : 0) || floorPrice * 2;

  // Build result object
  const result = {
    mainItemId,
    itemName: grade.name,
    grade,
    bmGrade: grade.bmGrade,
    sku,
    specs,
    v6Result,
    slotResult: null,
    pricing: { proposed: proposedPrice, source: priceSource },
    historicalSales,
    profitability,
    decision,
    priceFlags,
    trust,
    // Clean-create specific
    floorPrice,
    placeholderPrice,
    catalogGradePrice,
  };

  // Print formatted summary (dry-run output)
  if (isDryRun) {
    console.log('\n' + formatSummary(result));
    // Additional dry-run Path B specific output
    console.log(`Draft    £${placeholderPrice} (safe placeholder)`);
    const gp = v6Result?.gradePrices || {};
    if (Object.keys(gp).length > 0) {
      console.log(`Market   ${Object.entries(gp).map(([g, p]) => `${g[0]}:£${p}`).join('  ')} (catalog)`);
    }
    console.log(`Product  ${v6Result.productId} (${v6Result.modelFamily || v6Result.modelKey})`);
    console.log('');
    return result;
  }

  // Print summary for live mode too
  console.log('\n' + formatSummary(result));

  // ─── Live mode: Path B clean-create flow ───────────────────────
  const exactResolutionForLive = !!v6Result?.liveEligible;
  const liveModeAllowed = isLive && !!singleItemId;
  const shouldExecuteLive =
    liveModeAllowed &&
    exactResolutionForLive &&
    decision.decision !== 'BLOCK';

  if (shouldExecuteLive) {
    try {
      // Step 8: Create draft listing via Path B
      console.log('\n[Step 8] Creating draft listing via Path B...');
      const taskId = await createFreshListing(v6Result.productId, sku, grade.bmGrade, placeholderPrice);
      console.log(`  Task ID: ${taskId}`);

      // Step 9: Poll task for result
      console.log('[Step 9] Polling task...');
      const taskResult = await pollTask(taskId);
      const newListingId = taskResult.listing_id;
      if (!newListingId) throw new Error('Task complete but no listing_id in result');

      // Safety: if BM returned pub_state=2 instead of draft (reactivated old slot), set qty=0 immediately
      if (taskResult.publication_state === 2 || taskResult.publication_state === '2') {
        console.warn(`  ⚠️ BM returned pub_state=2 instead of draft. Setting qty=0 for safe verification.`);
        try {
          await bmApiFetch(`/ws/listings/${newListingId}`, { method: 'POST', body: JSON.stringify({ quantity: 0 }) });
        } catch (e) {
          console.error(`  ❌ Failed to set qty=0: ${e.message}`);
        }
      }

      // Step 10: Verify draft listing
      console.log('[Step 10] Verifying draft listing...');
      const colourVerifiedByCatalog = !PRODUCT_ID_OVERRIDE && v6Result?.colourVerified && v6Result?.resolutionSource === 'catalog-exact';
      const draftVerification = await verifyListing(newListingId, {
        quantity: 1,
        grade: grade.bmGrade,
        productId: PRODUCT_ID_OVERRIDE ? undefined : v6Result.productId,
        ram: specs.ram,
        ssd: specs.ssd,
        colour: specs.colour,
        colourVerifiedByCatalog,
        pubState: undefined, // Don't check pub_state — BM may return 2 or 3 unpredictably
      });
      if (!draftVerification.verified) {
        const criticalIssues = draftVerification.issues.filter(i => i.startsWith('⛔'));
        if (criticalIssues.length > 0) {
          // Critical mismatch (grade/title) — leave as draft, alert
          const msg = `⛔ Draft listing ${newListingId} verification FAILED: ${criticalIssues.join(', ')}. Left as draft. NOT publishing.`;
          console.error(`  ${msg}`);
          await postTelegram(msg);
          return result;
        }
        // Non-critical issues (pub_state) — may be OK, continue with caution
        console.warn(`  ⚠️ Draft verification issues (non-critical): ${draftVerification.issues.join(', ')}`);
      } else {
        console.log('  ✅ Draft listing verified');
      }

      // Step 11: Get backbox price and determine final price
      console.log('[Step 11] Getting backbox price...');
      const backbox = await getBackboxPrice(newListingId);
      let finalPrice;
      let finalPriceSource;
      if (backbox.price > 0 && backbox.price >= floorPrice) {
        finalPrice = backbox.price;
        finalPriceSource = 'backbox price_to_win';
      } else if (backbox.price > 0 && backbox.price < floorPrice) {
        finalPrice = floorPrice;
        finalPriceSource = `floor (backbox £${backbox.price} below floor £${floorPrice})`;
        console.log(`  ⚠️ Backbox price £${backbox.price} below floor £${floorPrice}. Using floor.`);
      } else if (catalogGradePrice > 0) {
        finalPrice = catalogGradePrice;
        finalPriceSource = 'catalog grade price (no backbox data)';
        console.log(`  No backbox data. Using catalog grade price: £${catalogGradePrice}`);
      } else {
        finalPrice = Math.round(floorPrice * 1.5);
        finalPriceSource = 'floor × 1.5 (no backbox or catalog data)';
        console.log(`  ⚠️ No pricing data. Using conservative placeholder: £${finalPrice}`);
      }
      const finalMinPrice = Math.ceil(finalPrice * MIN_PRICE_FACTOR);
      console.log(`  Final price: £${finalPrice} (${finalPriceSource}), min: £${finalMinPrice}`);

      // Recalculate profitability with final price
      const finalProfitability = calculateProfitability(finalPrice, specs);
      console.log(`  Final net@min: £${finalProfitability.net} | Margin: ${finalProfitability.margin}%`);

      // Check profitability with final price — block if loss
      if (finalProfitability.net < 0 && MIN_MARGIN_OVERRIDE === null) {
        const msg = `⛔ Final price £${finalPrice} results in loss (net £${finalProfitability.net}). Listing ${newListingId} left as draft. NOT publishing.`;
        console.error(`  ${msg}`);
        await postTelegram(msg);
        return result;
      }

      // Publish with real price
      console.log('[Step 11b] Publishing listing...');
      await publishListing(newListingId, finalPrice, finalMinPrice);

      // Step 12: Verify published listing
      console.log('[Step 12] Verifying published listing...');
      await sleep(2000); // Brief wait for BM to update state
      const pubVerification = await verifyListing(newListingId, {
        quantity: 1,
        grade: grade.bmGrade,
        productId: PRODUCT_ID_OVERRIDE ? undefined : v6Result.productId,
        ram: specs.ram,
        ssd: specs.ssd,
        colour: specs.colour,
        colourVerifiedByCatalog,
        pubState: 2, // published
      });
      if (pubVerification.verified) {
        console.log('  ✅ Published listing verified');
      } else {
        console.warn(`  ⚠️ Publish verification issues: ${pubVerification.issues.join(', ')}`);
        // Critical issues already handled in verifyListing (auto-sets qty=0)
        const criticalPub = pubVerification.issues.filter(i => i.startsWith('⛔'));
        if (criticalPub.length > 0) {
          await postTelegram(`⛔ Published listing ${newListingId} verification failed: ${criticalPub.join(', ')}. Taken offline.`);
          console.error('  ⛔ Verification failed. Monday will NOT be updated.');
          return result;
        }
        // Non-critical — retry publish
        console.log('  Retrying publish...');
        await publishListing(newListingId, finalPrice, finalMinPrice);
        await sleep(2000);
        const retry = await verifyListing(newListingId, {
          quantity: 1,
          grade: grade.bmGrade,
          productId: PRODUCT_ID_OVERRIDE ? undefined : v6Result.productId,
          ram: specs.ram,
          ssd: specs.ssd,
          colour: specs.colour,
          colourVerifiedByCatalog,
          pubState: 2,
        });
        if (!retry.verified) {
          await postTelegram(`⚠️ Listing ${newListingId} publish verification failed after retry: ${retry.issues.join(', ')}`);
          console.error('  ⛔ Verification failed after retry. Monday will NOT be updated.');
          return result;
        }
      }

      // Step 12b: Verify and fix SKU on BM listing
      // When BM reuses an existing slot, it may keep the old SKU instead of our new one
      console.log('[Step 12b] Checking SKU on BM listing...');
      const skuCheck = await bmApiFetch(`/ws/listings/${newListingId}`);
      const bmSku = skuCheck.sku || '';
      if (bmSku !== sku) {
        console.log(`  ⚠️ SKU mismatch: BM has "${bmSku}", expected "${sku}". Updating...`);
        try {
          await bmApiFetch(`/ws/listings/${newListingId}`, {
            method: 'POST',
            body: JSON.stringify({ sku }),
          });
          console.log(`  ✅ SKU updated to "${sku}"`);
        } catch (e) {
          console.warn(`  ⚠️ SKU update failed: ${e.message}. Monday will still have correct SKU.`);
        }
      } else {
        console.log(`  ✅ SKU matches: "${sku}"`);
      }

      // Step 13: Update Monday
      console.log('[Step 13] Updating Monday...');
      await updateMonday(mainItemId, specs.bmDeviceId, newListingId, v6Result.productId, finalProfitability.totalFixedCost, sku);
      console.log('  Monday updated');

      // Step 14: Telegram confirmation
      const tgMsg = [
        `✅ Listed: ${grade.name} ${specs.ssd} ${specs.ram} ${grade.gradeText} ${specs.colour}`,
        `Price: £${finalPrice} | Min: £${finalMinPrice} | Net@min: £${finalProfitability.net} (${finalProfitability.margin}%)`,
        `Listing ID: ${newListingId} (NEW — clean create)`,
        `Path: B (${finalPriceSource})`,
      ].join('\n');
      await postTelegram(tgMsg);

    } catch (e) {
      console.error(`  ❌ Listing failed: ${e.message}`);
      await postTelegram(`❌ Listing failed for ${grade.name} (${sku}): ${e.message}`);
    }
  } else if (isLive && !singleItemId) {
    const tgMsg = `⛔ BLOCKED\n${formatSummary(result)}\n\nLive execution requires --item <MainBoardId>. Mass live listing remains disabled.`;
    await postTelegram(tgMsg);
  } else if (isLive && decision.decision === 'PROPOSE') {
    const resolutionMsg = exactResolutionForLive
      ? ''
      : '\n\n⛔ Live execution blocked: product_id resolution is not exact enough.';
    const tgMsg = `⚠️ AWAITING APPROVAL\n${formatSummary(result)}${resolutionMsg}`;
    await postTelegram(tgMsg);
  } else if (isLive && !exactResolutionForLive) {
    const tgMsg = `⛔ BLOCKED\n${formatSummary(result)}\n\nLive execution blocked: product_id resolution is not exact enough.`;
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

  if (isLive && !singleItemId) {
    console.error('⛔ Live mode without --item is disabled. Mass live listing remains blocked.');
    process.exit(1);
  }

  // Load V6 data once
  console.log('\nLoading V6 scraper data...');
  const v6Data = loadV6Data();
  const modelCount = Object.keys(v6Data.models).length;
  console.log(`  ${modelCount} models loaded (scraped ${v6Data.scraped_at})`);

  console.log('\nLoading BM catalog...');
  const bmCatalog = loadBmCatalog();
  console.log(`  ${Object.keys(bmCatalog.variants || {}).length} variants loaded (catalog ${bmCatalog.catalog_version || 'unknown'})`);

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
