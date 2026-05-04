#!/usr/bin/env node
/**
 * list-device.js — Back Market Listing Script (SOP 06)
 *
 * Clean-create only (Path B). Never reactivates old listings.
 * Creates as draft (state=3), gets backbox price, then publishes.
 *
 * Modes:
 *   --dry-run                  (default) Calculate everything, print results, no actions
 *   --live                     Create fresh listings and update Monday
 *   --probe-product-id <uuid>  Create draft only, verify returned data, never publish
 *   --item <id>                Process a single Main Board item
 *   --product-id <uuid>        Override catalog product_id for live mode
 *   --min-margin <n>           Override minimum margin % and net £ floor
 *   --legacy-gates             Use pre-Phase-0.2 thresholds
 *   --json                     Emit structured JSON for probe mode
 *   (no --item)                Process ALL items where status24 = "To List" (index 8)
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });

const fs = require('fs');
const path = require('path');
const { mondayQuery, BOARDS, COLUMNS } = require('./lib/monday');
const { constructBmSku, normalizeHistoricalSku, validateSku } = require('./lib/sku');
const { BM_API_HEADERS, fetchSalesHistory } = require('./lib/bm-api');
const { createLogger } = require('./lib/logger');
const { loadFrontendUrlMap, lookupFrontendUrl } = require('./lib/frontend-url-map');
const { postTelegram: sendTelegram } = require('./lib/notifications');
const {
  findResolverSlot,
  isResolverSlotLiveSafe,
  normalizeResolverSku,
  upgradeRegistrySchema,
} = require('./lib/resolver-truth');
const {
  resolveNuxt, extractNuxtPrice, categorisePickerLabel,
  findNuxtPickers, extractNuxtDataCategories,
  createStealthContext, extractNuxtDataFromPage, isCloudflareBlocked,
  scrapeSingleProduct, scrapeWithFallback, buildReconciledScrapeTarget,
} = require('./lib/v7-scraper');

// ─── Config ───────────────────────────────────────────────────────
const BM_BASE = 'https://www.backmarket.co.uk';
const MAIN_BOARD = BOARDS.MAIN;           // 349212843
const BM_DEVICES_BOARD = BOARDS.BM_DEVICES; // 3892194968
const TO_LIST_GROUP = 'new_group88387__1';
const TO_LIST_INDEX = 8;
const LISTED_INDEX = 7;
const SCRAPER_DATA_PATH = '/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json';
const BM_CATALOG_PATH = '/home/ricky/builds/backmarket/data/bm-catalog.json';
const REGISTRY_PATH = '/home/ricky/builds/backmarket/data/listings-registry.json';
const SOLD_PRICES_PATH = '/home/ricky/builds/backmarket/data/sold-prices-latest.json';
const SHIPPING_COST = 15;
const LABOUR_RATE = 24; // £/hr
const BM_BUY_FEE_RATE = 0.10;
const BM_SELL_FEE_RATE = 0.10;
const VAT_RATE = 0.1667;
const MIN_PRICE_FACTOR = 0.97; // 3% floor
const LIVE_SCRAPE_TIMEOUT_MS = 15000;

const log = createLogger('list-device.log');

// ─── Grade Maps ───────────────────────────────────────────────────
const FINAL_GRADE_TO_BM = { Fair: 'FAIR', Good: 'GOOD', Excellent: 'VERY_GOOD' };
const BM_GRADE_TO_SCRAPER = { FAIR: 'Fair', GOOD: 'Good', VERY_GOOD: 'Excellent' };

// ─── CLI Args ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
const isLive = args.includes('--live');
const probeProductIdIdx = args.indexOf('--probe-product-id');
const PROBE_PRODUCT_ID = probeProductIdIdx !== -1 ? args[probeProductIdIdx + 1] : null;
const isProbe = !!PROBE_PRODUCT_ID;
const isDryRun = !isLive && !isProbe;
const itemIdx = args.indexOf('--item');
const singleItemId = itemIdx !== -1 ? args[itemIdx + 1] : null;
const minMarginIdx = args.indexOf('--min-margin');
const MIN_MARGIN_OVERRIDE = minMarginIdx !== -1 ? parseFloat(args[minMarginIdx + 1]) : null;
const productIdIdx = args.indexOf('--product-id');
const PRODUCT_ID_OVERRIDE = productIdIdx !== -1 ? args[productIdIdx + 1] : null;
const EFFECTIVE_PRODUCT_ID_OVERRIDE = PROBE_PRODUCT_ID || PRODUCT_ID_OVERRIDE;
const USE_LEGACY_GATES = args.includes('--legacy-gates') || process.env.BM_THRESHOLDS_VERSION === 'v1';

const priceIdx = args.indexOf('--price');
const PRICE_OVERRIDE = priceIdx !== -1 ? parseFloat(args[priceIdx + 1]) : null;
const JSON_OUTPUT = args.includes('--json');
const CARD_JSON_MODE = args.includes('--card-json');
const SKIP_HISTORY = args.includes('--skip-history');
const LEGACY_CONSTRUCT_SKU = args.includes('--legacy-construct-sku');

// In card-json mode suppress all console output — only CARD_JSON: line goes to stdout
if (CARD_JSON_MODE) {
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.warn = noop;
}

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
  await sendTelegram(text, { parseMode: 'HTML', logger: console });
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

function shouldSkipColourTitleCheck(expected = {}) {
  if (expected.colourVerifiedByCatalog) {
    return {
      skip: true,
      reason: 'catalog',
      log: '  Colour: ✅ verified by catalog (skipping title check)',
    };
  }
  if (expected.colourVerifiedByTrustedSlot) {
    return {
      skip: true,
      reason: 'trusted_slot',
      log: '  Colour: ✅ verified by trusted slot lineage (skipping title check)',
    };
  }
  if (expected.skipColourTitleCheckForManualOverride) {
    return {
      skip: true,
      reason: 'manual_override',
      log: '  Colour: ⚠️ skipping title check (--product-id override — colour in product_id)',
    };
  }
  return { skip: false, reason: '', log: '' };
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

function inferKeyboardLayout(title = '') {
  const match = String(title || '').match(/\b(QWERTY|AZERTY)\b/i);
  return match ? match[1].toUpperCase() : '';
}

function buildScrapeVerificationCandidate(specs, bmGrade, catalogResult) {
  return {
    productId: catalogResult?.productId || '',
    modelFamily: catalogResult?.modelFamily || catalogResult?.modelKey || '',
    cpuGpu: catalogResult?.slot?.verified_title?.cpu_gpu || catalogResult?.variant?.cpu_gpu || '',
    ram: specs?.ram || '',
    ssd: specs?.ssd || '',
    colour: specs?.colour || '',
    keyboardLayout: inferKeyboardLayout(catalogResult?.title || catalogResult?.lookupTitle || ''),
    grade: bmGrade || '',
  };
}

function buildScrapeVerificationReason(verification) {
  const issues = []
    .concat(verification?.hardFailures || [])
    .concat(verification?.unresolved || []);
  return issues.length > 0
    ? `Unreconciled scrape target: ${issues.join('; ')}`
    : 'Unreconciled scrape target';
}

function parseCaptureJsonField(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === 'object') return [value];
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    if (parsed && typeof parsed === 'object') return [parsed];
    return [];
  } catch (_) {
    return [];
  }
}

function summarizeFrontendCaptureMismatches(record) {
  const mismatches = parseCaptureJsonField(record?.spec_snapshot?.sku_spec_mismatches);
  if (mismatches.length > 0) {
    return mismatches.map((entry) => {
      if (typeof entry === 'string') return entry;
      const field = entry?.field || 'unknown';
      const expected = entry?.expected ? ` expected ${entry.expected}` : '';
      return `${field}${expected}`;
    });
  }
  const checks = parseCaptureJsonField(record?.spec_snapshot?.sku_spec_check);
  return checks
    .filter((entry) => entry && entry.ok === false)
    .map((entry) => `${entry.field || 'unknown'} expected ${entry.expected || 'mismatch'}`);
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
  // A2338: model number reused across M1 (2020) and M2 (2022). Disambiguate by GPU cores.
  // M1 = 8-core GPU → catalog family "MacBook Pro 13-inch (2020)"
  // M2 = 10-core GPU → catalog family "MacBook Pro 13-inch (2022)"
  if (specs.model === 'A2338') {
    const gpuCores = parseInt((specs.gpu || '').match(/(\d+)/)?.[1] || '0');
    if (gpuCores === 10) return 'MacBook Pro 13-inch (2022)';
    return 'MacBook Pro 13-inch (2020)';
  }

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
  if (decision?.requiresMinMarginOverride) {
    return { classification: 'manual_review', reason: decision.reason };
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
        column_values(ids: ["board_relation", "text", "status__1", "color2", "status7__1", "status8__1", "numeric", "lookup", "text_mkyd4bx3", "text_mm1dt53s", "text89"]) {
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
            if (cv.id === 'text89') specs.storedSku = (cv.text || '').trim();
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
          column_values(ids: ["board_relation", "text", "status__1", "color2", "status7__1", "status8__1", "numeric", "lookup", "text_mkyd4bx3", "text_mm1dt53s", "text89"]) {
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
    storedSku: bmDev.storedSku || '',
  };
}

// ─── Step 3: Construct SKU ────────────────────────────────────────
// SKU construction now lives in scripts/lib/sku.js so QC handoff and listing
// validation use exactly the same identity logic.

let _bmCatalog = null;
let _bmCatalogIndex = null;
let _registry = null;
let _frontendUrlMap = null;
let _soldPriceLookup = null;
let _soldPriceLookupLoaded = false;

function loadBmCatalog() {
  if (_bmCatalog) return _bmCatalog;
  const raw = fs.readFileSync(BM_CATALOG_PATH, 'utf8');
  _bmCatalog = JSON.parse(raw);
  console.log(`  Loaded BM catalog: ${Object.keys(_bmCatalog.variants || {}).length} variants`);
  return _bmCatalog;
}

function loadListingsRegistry() {
  if (_registry) return _registry;
  if (!fs.existsSync(REGISTRY_PATH)) {
    _registry = { slots: {} };
    return _registry;
  }
  const rawRegistry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  _registry = upgradeRegistrySchema(rawRegistry).registry;
  console.log(`  Loaded listings registry: ${Object.keys(_registry.slots || {}).length} slots`);
  return _registry;
}

function loadListingFrontendUrls() {
  if (_frontendUrlMap) return _frontendUrlMap;
  _frontendUrlMap = loadFrontendUrlMap();
  if (_frontendUrlMap.exists) {
    console.log(`  Loaded frontend URL map: ${_frontendUrlMap.accepted.length} trusted capture(s), ${_frontendUrlMap.mismatches.length} mismatch capture(s)`);
  }
  return _frontendUrlMap;
}

function loadSoldPriceLookup() {
  if (_soldPriceLookupLoaded) return _soldPriceLookup;
  _soldPriceLookupLoaded = true;
  if (!fs.existsSync(SOLD_PRICES_PATH)) {
    return null;
  }
  try {
    _soldPriceLookup = JSON.parse(fs.readFileSync(SOLD_PRICES_PATH, 'utf8'));
    console.log(`  Loaded sold lookup: ${Object.keys(_soldPriceLookup.by_sku || {}).length} SKUs, ${Object.keys(_soldPriceLookup.by_model || {}).length} model-grade groups`);
  } catch (error) {
    console.warn(`  Failed to load sold lookup: ${error.message}`);
    _soldPriceLookup = null;
  }
  return _soldPriceLookup;
}

function lookupRegistrySlot(sku) {
  const registry = loadListingsRegistry();
  const slot = findResolverSlot(registry, { sku: normalizeResolverSku(sku) });
  if (slot && isResolverSlotLiveSafe(slot)) return slot;
  return null;
}

function buildSoldLookupModelKey(sku) {
  const parts = normalizeHistoricalSku(sku).split('.');
  if (parts.length < 3) return null;
  return `${parts[0].toUpperCase()}.${parts[1].toUpperCase()}.${parts[2].toUpperCase()}`;
}

function normalizeHistoricalSalesEntry(entry, source) {
  return {
    count: Number(entry?.count) || 0,
    avg: Number(entry?.avg_price) || 0,
    median: Number(entry?.median_price) || 0,
    low: Number(entry?.min_price) || 0,
    high: Number(entry?.max_price) || 0,
    sales: [],
    source,
    lastSoldDate: entry?.last_sold_date || '',
  };
}

function aggregateHistoricalSalesEntries(entries, source) {
  if (!entries.length) return null;
  if (entries.length === 1) {
    return normalizeHistoricalSalesEntry(entries[0], source);
  }

  const count = entries.reduce((sum, entry) => sum + (Number(entry?.count) || 0), 0);
  if (!count) return null;

  const weightedAvg = entries.reduce((sum, entry) => sum + (Number(entry?.avg_price) || 0) * (Number(entry?.count) || 0), 0) / count;
  const weightedMedian = entries.reduce((sum, entry) => sum + (Number(entry?.median_price) || 0) * (Number(entry?.count) || 0), 0) / count;
  const low = entries.reduce((min, entry) => Math.min(min, Number(entry?.min_price) || Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY);
  const high = entries.reduce((max, entry) => Math.max(max, Number(entry?.max_price) || 0), 0);
  const lastSoldDate = entries.reduce((latest, entry) => {
    const current = entry?.last_sold_date || '';
    return current > latest ? current : latest;
  }, '');

  return {
    count,
    avg: Math.round(weightedAvg * 100) / 100,
    median: Math.round(weightedMedian * 100) / 100,
    low: Number.isFinite(low) ? low : 0,
    high,
    sales: [],
    source,
    lastSoldDate,
  };
}

function resolveHistoricalSalesFromSoldLookup(sku, bmGrade, soldLookupOverride = null) {
  if (!sku) return null;
  const soldLookup = soldLookupOverride || loadSoldPriceLookup();
  if (!soldLookup) return null;

  const canonicalSku = normalizeHistoricalSku(sku);
  const normalizedBySkuEntries = Object.entries(soldLookup.by_sku || {});

  const exactSkuEntries = normalizedBySkuEntries
    .filter(([rawSku]) => normalizeHistoricalSku(rawSku) === canonicalSku)
    .map(([, entry]) => entry);
  const exactSkuHistory = aggregateHistoricalSalesEntries(
    exactSkuEntries,
    `sold_lookup:by_sku_normalized:${canonicalSku}:aliases=${exactSkuEntries.length}`
  );
  if (exactSkuHistory && exactSkuHistory.count >= 2) {
    return exactSkuHistory;
  }

  const modelKey = buildSoldLookupModelKey(canonicalSku);
  if (!modelKey) return null;

  const lookupGrade = BM_GRADE_TO_SCRAPER[String(bmGrade || '').toUpperCase()] || '';
  const byGradeEntries = normalizedBySkuEntries
    .filter(([rawSku, entry]) => {
      const normalizedSku = normalizeHistoricalSku(rawSku);
      return buildSoldLookupModelKey(normalizedSku) === modelKey && String(entry?.grade || '') === lookupGrade;
    })
    .map(([, entry]) => entry);
  const byGradeHistory = aggregateHistoricalSalesEntries(
    byGradeEntries,
    `sold_lookup:by_model_normalized:${modelKey}:${lookupGrade}:aliases=${byGradeEntries.length}`
  );
  if (byGradeHistory && byGradeHistory.count >= 3) {
    return byGradeHistory;
  }

  const fairEntries = normalizedBySkuEntries
    .filter(([rawSku, entry]) => {
      const normalizedSku = normalizeHistoricalSku(rawSku);
      return buildSoldLookupModelKey(normalizedSku) === modelKey && String(entry?.grade || '') === 'Fair';
    })
    .map(([, entry]) => entry);
  const fairHistory = aggregateHistoricalSalesEntries(
    fairEntries,
    `sold_lookup:by_model_normalized:${modelKey}:Fair:aliases=${fairEntries.length}`
  );
  if (fairHistory && fairHistory.count >= 3) {
    return fairHistory;
  }

  return null;
}

function resolveProductFromFrontendCapture(specs, frontendCapture) {
  const record = frontendCapture?.record;
  if (!record?.product_id) return null;

  const modelFamily = deriveCatalogModelFamily(specs);
  const trusted = frontendCapture?.trusted !== false;
  const mismatchSummary = summarizeFrontendCaptureMismatches(record);
  const title = record?.spec_snapshot?.page_title || record?.spec_snapshot?.h1 || record?.frontend_url || '';

  return {
    source: 'frontend-url-map',
    modelKey: modelFamily || '(frontend capture)',
    modelFamily,
    normalizedRam: normalizeRamForCatalog(specs.ram),
    normalizedSsd: normalizeStorageForCatalog(specs.ssd),
    normalizedColour: normalizeColour(specs.colour),
    gradePrices: {},
    ssdPicker: {},
    colourPrices: {},
    adjacentSsd: [],
    ramPicker: {},
    colourPicker: {},
    cpuGpuPicker: {},
    colourVerified: trusted,
    liveEligible: trusted,
    productId: record.product_id,
    title,
    lookupTitle: title,
    backmarketId: record?.spec_snapshot?.active_listing_export_back_market_id || null,
    resolutionConfidence: record.verification_status || (trusted ? 'captured_spec_match' : 'captured_spec_mismatch'),
    verificationStatus: trusted ? 'verified' : 'captured_mismatch',
    resolutionSource: trusted ? 'frontend-capture-exact' : 'frontend-capture-mismatch',
    truthSource: record.source || 'listing-frontend-url-map',
    frontendCapture: record,
    blockReason: trusted
      ? ''
      : (mismatchSummary.length > 0
          ? `Frontend capture contradicts SKU: ${mismatchSummary.join(', ')}`
          : 'Frontend capture contradicts SKU'),
    contradictionFlags: trusted ? [] : ['frontend_capture_spec_mismatch'],
  };
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

function findGradePricesForCatalogVariant(scraperData, variant) {
  if (variant?.grade_prices && Object.keys(variant.grade_prices).length > 0) {
    return variant.grade_prices;
  }
  return {};
}

function resolveProductFromRegistrySlot(slot) {
  return {
    source: 'listings-registry',
    modelKey: slot?.model_family || '(registry slot)',
    modelFamily: slot?.model_family || '',
    normalizedRam: normalizeRamForCatalog(slot?.ram || ''),
    normalizedSsd: normalizeStorageForCatalog(slot?.ssd || ''),
    normalizedColour: normalizeColour(slot?.colour || ''),
    gradePrices: {},
    ssdPicker: {},
    colourPrices: {},
    adjacentSsd: [],
    ramPicker: {},
    colourPicker: {},
    cpuGpuPicker: {},
    colourVerified: !!normalizeColour(slot?.colour || ''),
    liveEligible: isResolverSlotLiveSafe(slot),
    productId: slot?.product_id || '',
    title: slot?.title || '',
    lookupTitle: slot?.title || '',
    backmarketId: slot?.backmarket_id || null,
    resolutionConfidence: slot?.trust_class || '',
    verificationStatus: slot?.verified ? 'verified' : 'unverified',
    resolutionSource: `resolver-truth:${slot?.trust_class || 'unknown'}`,
    trustClass: slot?.trust_class || '',
    truthSource: slot?.source || '',
    contradictionFlags: Array.isArray(slot?.contradiction_flags) ? slot.contradiction_flags : [],
    slot,
  };
}

function resolveProductFromCatalog(specs, scraperData) {
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
      gradePrices: findGradePricesForCatalogVariant(scraperData, variant),
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
      gradePrices: findGradePricesForCatalogVariant(scraperData, variant),
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

// ─── Step 4: Get product_id from BM Catalog ──────────────────────

function loadScraperData() {
  const raw = fs.readFileSync(SCRAPER_DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

async function getLiveMarketData(productId, catalogResult, scrapeTarget = null) {
  return scrapeWithFallback(productId, catalogResult, LIVE_SCRAPE_TIMEOUT_MS, {
    frontendUrl: scrapeTarget?.record?.frontend_url || '',
  });
}

// ─── Path B: Create Fresh Listing ────────────────────────────────
// ─── Step 5: Get Reference product_id ────────────────────────────
// (product_id already resolved in Step 4 via catalog — no listing search needed)

// ─── Path B: Create Fresh Listing ────────────────────────────────

async function createFreshListing(productId, sku, bmGrade, placeholderPrice) {
  // CSV format with grade column included — CRITICAL: without grade, BM defaults to GOOD
  const csvHeader = 'sku,product_id,quantity,warranty_delay,price,state,currency,grade';
  const csvRow = `${sku},${productId},0,12,${placeholderPrice},3,GBP,${bmGrade}`;
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

async function updateListingPrice(listingId, finalPrice, minPrice) {
  console.log(`  Updating listing ${listingId}: price=£${finalPrice}, min=£${minPrice}`);
  await bmApiFetch(`/ws/listings/${listingId}`, {
    method: 'POST',
    body: JSON.stringify({
      price: finalPrice,
      min_price: minPrice,
      currency: 'GBP',
    }),
  });
}

// ─── Step 6: Get Catalog Grade Price (market reference) ──────────

function getCatalogGradePrice(catalogResult, bmGrade) {
  const gradePrices = catalogResult?.gradePrices || {};
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

function getPriceFlags(catalogResult) {
  const flags = [];

  if (catalogResult?.ramPicker) {
    const ramKeys = Object.keys(catalogResult.ramPicker).filter(k => catalogResult.ramPicker[k].available);
    const ramPrices = ramKeys.map(k => ({ key: k, price: catalogResult.ramPicker[k].price })).filter(p => p.price);
    ramPrices.sort((a, b) => parseInt(a.key) - parseInt(b.key));
    for (let i = 1; i < ramPrices.length; i++) {
      const gap = ramPrices[i].price - ramPrices[i - 1].price;
      if (gap < 0) flags.push(`🔴 RAM anomaly: ${ramPrices[i - 1].key}(£${ramPrices[i - 1].price}) > ${ramPrices[i].key}(£${ramPrices[i].price})`);
    }
  }

  // Adjacent SSD check
  if (catalogResult?.ssdPicker) {
    const ssdKeys = Object.keys(catalogResult.ssdPicker).filter(k => catalogResult.ssdPicker[k].available);
    const ssdPrices = ssdKeys.map(k => ({ key: k, price: catalogResult.ssdPicker[k].price })).filter(p => p.price);
    ssdPrices.sort((a, b) => parseInt(a.key) - parseInt(b.key));
    for (let i = 1; i < ssdPrices.length; i++) {
      const gap = ssdPrices[i].price - ssdPrices[i - 1].price;
      if (gap < 20) flags.push(`⚠️ SSD gap ${ssdPrices[i - 1].key}→${ssdPrices[i].key}: only £${gap}`);
      if (gap < 0) flags.push(`🔴 SSD anomaly: ${ssdPrices[i - 1].key}(£${ssdPrices[i - 1].price}) > ${ssdPrices[i].key}(£${ssdPrices[i].price})`);
    }
  }

  // Grade ladder check
  if (catalogResult?.gradePrices) {
    const gp = catalogResult.gradePrices;
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
  const { margin, net } = profitability;
  const reviewDecision = (reason, extra = {}) => ({
    decision: 'PROPOSE',
    reviewRequired: true,
    requiresMinMarginOverride: true,
    ...extra,
    reason,
  });

  if (MIN_MARGIN_OVERRIDE !== null) {
    const minMargin = MIN_MARGIN_OVERRIDE;
    const minNet = MIN_MARGIN_OVERRIDE;

    if (net < 0) return { decision: 'PROPOSE', reason: `⚠️ Loss maker (net £${net}) — approved via --min-margin override` };
    if (net < minNet) return reviewDecision(`Review required — Net £${net} < £${minNet} override floor at min_price`);
    if (margin < minMargin) return reviewDecision(`Review required — Margin ${margin.toFixed(1)}% < ${minMargin}% override floor at min_price`);
    return { decision: 'PROPOSE', reason: `Margin ${margin.toFixed(1)}%, net £${net}` };
  }

  if (net < 0) return reviewDecision(`Review required — Loss at min_price (net £${net})`);

  if (USE_LEGACY_GATES) {
    if (net < 50) return reviewDecision(`Review required — Net £${net} < £50 minimum at min_price`);
    if (margin < 15) return reviewDecision(`Review required — Margin ${margin.toFixed(1)}% < 15% at min_price`);
    return { decision: 'PROPOSE', reason: `Margin ${margin.toFixed(1)}%, net £${net}` };
  }

  if (net >= 150 && margin >= 25) {
    return { decision: 'PROPOSE', reason: `Margin ${margin.toFixed(1)}%, net £${net} — primary gate met` };
  }
  if (net >= 100 && margin >= 20) {
    return reviewDecision(
      `Review required — Margin ${margin.toFixed(1)}%, net £${net} — secondary gate only`,
      { requiresMinMarginOverride: true }
    );
  }
  if (net < 100) return reviewDecision(`Review required — Net £${net} < £100 secondary minimum at min_price`);
  return reviewDecision(`Review required — Margin ${margin.toFixed(1)}% < 20% secondary minimum at min_price`);
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
  const colourCheck = shouldSkipColourTitleCheck(expected);
  if (colourCheck.skip) {
    console.log(colourCheck.log);
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

function determineProbeVerdict(checks) {
  return (
    checks.candidate_product_id_preserved &&
    checks.grade_match &&
    checks.ram_match &&
    checks.ssd_match &&
    checks.colour_match
  ) ? 'pass' : 'fail';
}

function buildProbeReport(result, candidateProductId, draftVerification, taskResult, options = {}) {
  const listing = draftVerification?.listing || {};
  const issues = draftVerification?.issues || [];
  const issueHas = (prefix) => issues.some(i => i.startsWith(prefix));
  const checks = {
    candidate_product_id_preserved: listing.product_id ? listing.product_id === candidateProductId : false,
    grade_match: !issueHas('⛔ GRADE MISMATCH'),
    ram_match: !issueHas('⛔ TITLE RAM MISMATCH'),
    ssd_match: !issueHas('⛔ TITLE SSD MISMATCH'),
    colour_match: !issueHas('⛔ TITLE COLOUR MISMATCH'),
  };
  const verdict = determineProbeVerdict(checks);

  return {
    mode: 'probe',
    verdict,
    promotable_resolver_truth: verdict === 'pass',
    main_item_id: result.mainItemId,
    sku: result.sku,
    candidate_product_id: candidateProductId,
    expected: {
      ram: result.specs?.ram || '',
      ssd: result.specs?.ssd || '',
      colour: result.specs?.colour || '',
      grade: result.bmGrade || '',
    },
    task_result: {
      listing_id: taskResult?.listing_id || listing.listing_id || null,
      backmarket_id: taskResult?.backmarket_id || listing.backmarket_id || null,
      publication_state: taskResult?.publication_state ?? listing.publication_state ?? listing.pub_state ?? null,
    },
    actual: {
      listing_id: listing.id || null,
      numeric_listing_id: listing.listing_id || null,
      product_id: listing.product_id || '',
      title: listing.title || '',
      grade: listing.grade || '',
      quantity: listing.quantity ?? null,
      publication_state: listing.publication_state ?? listing.pub_state ?? null,
      sku: listing.sku || '',
    },
    checks,
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
    mainItemId, itemName, grade, bmGrade, sku, specs, catalogResult, slotResult,
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
  const gradePrices = catalogResult?.gradePrices || {};
  if (Object.keys(gradePrices).length > 0) {
    const marketParts = Object.entries(gradePrices).map(([g, pr]) => `${g} £${pr}`).join(' | ');
    lines.push(`Market now:  ${marketParts}`);
  } else {
    lines.push(`Market now:  N/A`);
  }

  // Colour premium (if scraper has colour data)
  if (catalogResult?.colourPrices && Object.keys(catalogResult.colourPrices).length > 1) {
    const colourParts = Object.entries(catalogResult.colourPrices)
      .map(([c, pr]) => c === specs.colour ? `${c}:£${pr}` : `${c}:£${pr}`)
      .join('  ');
    lines.push(`Colour   ${colourParts}`);
  }

  // Adjacent SSD prices
  if (catalogResult?.adjacentSsd && catalogResult.adjacentSsd.length > 0) {
    const adjParts = catalogResult.adjacentSsd.map(a => `${a.ssd}:£${a.price}`).join('  ');
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
  if (historicalSales && historicalSales.count > 0) {
    const histParts = [`${historicalSales.count} sold @ avg £${historicalSales.avg}`];
    if (historicalSales.median) histParts.push(`median £${historicalSales.median}`);
    if (historicalSales.avgDaysToSell) histParts.push(`avg ${historicalSales.avgDaysToSell} days to sell`);
    if (historicalSales.source) histParts.push(historicalSales.source);
    let salesLine = `Our history: ${histParts.join(' | ')}`;
    if (historicalSales.avg > p.proposed * 1.3) {
      salesLine += `\n         🔴 Historical avg significantly above market: prices have dropped`;
    }
    lines.push(salesLine);
  } else {
    lines.push(`Our history: N/A`);
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
  lines.push(`Path     ${device.pathLabel || 'B (clean create — draft then publish)'}`);
  lines.push(`SKU      ${sku}`);
  if (device.registrySlot) {
    const registryParts = [];
    if (device.registrySlot.listing_id) registryParts.push(`listing_id ${device.registrySlot.listing_id}`);
    if (device.registrySlot.product_id) registryParts.push(`product_id ${device.registrySlot.product_id}`);
    if (device.registrySlot.trust_class) registryParts.push(`trust ${device.registrySlot.trust_class}`);
    lines.push(`Registry  hit -> ${registryParts.join(' | ') || 'resolver truth present'}`);
  } else {
    lines.push(`Registry  miss`);
  }

  // Product source and title verification
  if (catalogResult?.source === 'bm-catalog') {
    lines.push(`Source   BM catalog: ${catalogResult.modelKey}`);
    if (catalogResult.lookupTitle) lines.push(`BM title ${catalogResult.lookupTitle}`);
    if (catalogResult.resolutionConfidence) lines.push(`Conf     ${catalogResult.resolutionConfidence}`);
    if (catalogResult.verificationStatus) lines.push(`Verify   ${catalogResult.verificationStatus}`);
    if (catalogResult.blockReason) lines.push(`Block    ${catalogResult.blockReason}`);
  }
  if (catalogResult?.source === 'frontend-url-map') {
    lines.push(`Source   Frontend capture`);
    if (catalogResult.lookupTitle) lines.push(`BM title ${catalogResult.lookupTitle}`);
    if (catalogResult.resolutionConfidence) lines.push(`Conf     ${catalogResult.resolutionConfidence}`);
    if (catalogResult.verificationStatus) lines.push(`Verify   ${catalogResult.verificationStatus}`);
    if (catalogResult.blockReason) lines.push(`Block    ${catalogResult.blockReason}`);
  }
  if (catalogResult?.resolutionSource) {
    lines.push(`Resolve  ${catalogResult.resolutionSource}${catalogResult.colourVerified ? ' | colour verified' : ' | colour not independently verified'}`);
  }
  if (catalogResult?.frontendCapture?.frontend_url) {
    lines.push(`Capture  ${catalogResult.frontendCapture.frontend_url}`);
  }
  if (device.liveMarketSource) {
    lines.push(`Live     ${device.liveMarketSource}`);
  }
  if (device.scrapeVerification) {
    const sv = device.scrapeVerification;
    lines.push(`Scrape   ${sv.trusted ? 'reconciled' : 'UNTRUSTED'} | requested ${sv.requestedProductId || 'n/a'}${sv.reconciledProductId ? ` | reconciled ${sv.reconciledProductId}` : ''}`);
    const issues = [].concat(sv.hardFailures || []).concat(sv.unresolved || []);
    if (issues.length > 0) {
      lines.push(`         ${issues.join(' | ')}`);
    }
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

async function processItem(mainItemId, scraperData, bmDeviceMap) {
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

  // Step 3: Validate stored QC SKU
  console.log('[Step 3] Validating QC SKU handoff...');
  const sku = constructBmSku(specs, grade.gradeText);
  const skuValidation = validateSku({ storedSku: specs.storedSku, expectedSku: sku });
  console.log(`  Stored SKU: ${skuValidation.storedSku || '(missing)'}`);
  console.log(`  Expected SKU: ${sku}`);
  if (!skuValidation.ok) {
    const blockReason = `${skuValidation.code}: stored SKU must be generated during QC handoff before listing`;
    console.log(`  ⛔ ${blockReason}`);
    if (isLive && !LEGACY_CONSTRUCT_SKU) {
      throw new Error(`Live listing blocked: ${blockReason}. Use --legacy-construct-sku only for explicitly approved transition work.`);
    }
    if (!isLive) {
      const blockedDecision = { decision: 'BLOCK', reason: blockReason };
      const blockedTrust = classifyTrust({ hasProductResolution: false, liveEligible: false, decision: blockedDecision, missingGrade: !grade?.bmGrade });
      const blockedResult = {
        mainItemId, itemName: grade.name, grade, bmGrade: grade.bmGrade, sku, specs,
        skuValidation, catalogResult: null, slotResult: null,
        pricing: { proposed: 0, source: 'blocked before resolver' },
        historicalSales: { count: 0, avg: 0, low: 0, high: 0, sales: [] },
        profitability: { proposed: 0, minPrice: 0, purchasePrice: specs.purchasePrice || 0, partsCost: specs.partsCost || 0, labourCost: 0, labourHours: specs.labourHours || 0, shipping: SHIPPING_COST, bmBuyFee: 0, bmSellFee: 0, vat: 0, totalCosts: 0, net: 0, margin: 0, totalFixedCost: 0, breakEven: 0 },
        decision: blockedDecision, priceFlags: [], trust: blockedTrust,
      };
      console.log('\n' + formatSummary(blockedResult));
      return blockedResult;
    }
    console.log('  ⚠️ Transitional --legacy-construct-sku supplied; continuing with expected SKU.');
  }

  const registrySlot = lookupRegistrySlot(sku);
  const frontendUrlMap = loadListingFrontendUrls();
  const frontendCapture = lookupFrontendUrl(frontendUrlMap, {
    listing_id: specs.storedListingId,
    sku,
    product_id: specs.storedUuid,
  }, { includeMismatch: true });

  // Step 4: Resolve product from canonical resolver truth, then rebuilt capture truth, then BM catalog fallback
  console.log('[Step 4] Resolving product from canonical resolver truth...');
  let catalogResult;
  if (EFFECTIVE_PRODUCT_ID_OVERRIDE) {
    // Manual product_id override — for family-member resolution when catalog can't exact-match
    console.log(`  ⚠️ product_id override: ${EFFECTIVE_PRODUCT_ID_OVERRIDE}`);
    console.log(`  BM will auto-resolve the correct catalog entry from this product_id.`);
    console.log(`  Post-create verification MUST confirm the title matches the device specs.`);
    const overrideBase = resolveProductFromCatalog(specs, scraperData);
    catalogResult = {
      ...overrideBase,
      productId: EFFECTIVE_PRODUCT_ID_OVERRIDE,
      resolutionConfidence: 'manual_override',
      verificationStatus: 'verified',
      resolutionSource: isProbe ? 'probe-product-id' : 'product-id-override',
      liveEligible: true,
      colourVerified: false, // Must verify after creation
    };
  } else if (registrySlot?.product_id) {
    console.log(`  Resolver truth hit: ${registrySlot.sku} -> ${registrySlot.product_id}`);
    catalogResult = resolveProductFromRegistrySlot(registrySlot);
  } else if (frontendCapture?.trusted && frontendCapture.record?.product_id) {
    console.log(`  Resolver truth miss; rebuilt frontend capture hit (${frontendCapture.matchedBy}).`);
    catalogResult = resolveProductFromFrontendCapture(specs, frontendCapture);
  } else {
    console.log('  Resolver truth miss; falling back to BM catalog exact lookup.');
    catalogResult = resolveProductFromCatalog(specs, scraperData);
    if (!catalogResult?.productId && frontendCapture?.record?.product_id) {
      console.log(`  Catalog blocked; rebuilt frontend capture shows ${frontendCapture.record.verification_status} via ${frontendCapture.matchedBy}.`);
      catalogResult = resolveProductFromFrontendCapture(specs, frontendCapture);
    }
  }
  const hasCatalogMatch = catalogResult && catalogResult.productId;
  console.log(`  Family: ${catalogResult.modelFamily || '(unmapped)'}`);
  console.log(`  Lookup: ${catalogResult.normalizedRam}/${catalogResult.normalizedSsd}/${catalogResult.normalizedColour || '(no colour)'}`);
  if (hasCatalogMatch) {
    const sourceLabel = catalogResult.source === 'listings-registry'
      ? `resolver truth: "${catalogResult.trustClass || 'unknown'}"`
      : catalogResult.source === 'frontend-url-map'
        ? `frontend capture: "${catalogResult.resolutionConfidence || 'unknown'}"`
      : catalogResult.resolutionSource === 'product-id-override'
        ? 'MANUAL OVERRIDE'
        : `catalog: "${catalogResult.modelKey}"`;
    console.log(`  product_id: ${catalogResult.productId} (${sourceLabel})`);
    console.log(`  resolution_confidence: ${catalogResult.resolutionConfidence}`);
    console.log(`  verification_status: ${catalogResult.verificationStatus}`);
    console.log(`  Grade prices: ${JSON.stringify(catalogResult.gradePrices)}`);
    console.log(`  Resolution: ${catalogResult.resolutionSource}`);
    if (catalogResult.truthSource) {
      console.log(`  Truth source: ${catalogResult.truthSource}`);
    }
    if (catalogResult.contradictionFlags?.length) {
      console.log(`  Contradictions: ${catalogResult.contradictionFlags.join(', ')}`);
    }
    if (catalogResult.resolutionConfidence === 'market_only') {
      console.log('  ⛔ market_only cannot authorize live listing.');
      catalogResult.liveEligible = false;
    }
    if (catalogResult.verificationStatus !== 'verified') {
      console.log(`  ⛔ Catalog match requires manual review (${catalogResult.verificationStatus}).`);
      catalogResult.liveEligible = false;
    }
  } else {
    console.log(`  ⛔ Catalog resolution blocked: ${catalogResult?.blockReason || 'unknown reason'}`);
    if (catalogResult?.candidates?.length) {
      console.log(`  Candidates: ${catalogResult.candidates.length}`);
    }
  }

  if (!hasCatalogMatch || catalogResult.verificationStatus !== 'verified' || catalogResult.resolutionConfidence === 'market_only') {
    const blockReason = !hasCatalogMatch
      ? (catalogResult?.blockReason || 'No catalog product match')
      : catalogResult.resolutionConfidence === 'market_only'
        ? 'Catalog match is market_only and cannot authorize listing'
        : (catalogResult?.blockReason || `Catalog match status is ${catalogResult.verificationStatus}`);
    const blockedDecision = { decision: 'BLOCK', reason: blockReason };
    const blockedTrust = classifyTrust({
      hasProductResolution: !!hasCatalogMatch,
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
      catalogResult,
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

  // Step 5: Live market check (single product page scrape)
  console.log('[Step 5] Live market check...');
  console.log(`  product_id: ${catalogResult.productId}`);
  console.log(`  model_family: ${catalogResult.modelFamily || catalogResult.modelKey}`);
  const scrapeTarget = (catalogResult.frontendCapture && frontendCapture?.trusted)
    ? { matchedBy: frontendCapture.matchedBy, record: catalogResult.frontendCapture, trusted: true }
    : lookupFrontendUrl(frontendUrlMap, {
    listing_id: registrySlot?.listing_id || specs.storedListingId,
    sku,
    product_id: catalogResult.productId,
  });
  if (scrapeTarget) {
    console.log(`  scrape_target: captured_frontend_url (${scrapeTarget.matchedBy})`);
    console.log(`  frontend_url: ${scrapeTarget.record.frontend_url}`);
  } else {
    console.log('  scrape_target: product_id_fallback');
  }
  const liveMarket = await getLiveMarketData(catalogResult.productId, catalogResult, scrapeTarget);
  const scrapeVerification = buildReconciledScrapeTarget(
    buildScrapeVerificationCandidate(specs, grade.bmGrade, catalogResult),
    liveMarket
  );
  const marketResult = {
    ...catalogResult,
    scrapeTargetSource: liveMarket.scrapeTargetSource || (scrapeTarget ? 'captured_frontend_url' : 'product_id_fallback'),
    frontendUrlCapture: scrapeTarget?.record || null,
    gradePrices: Object.keys(liveMarket.gradePrices || {}).length > 0 ? liveMarket.gradePrices : catalogResult.gradePrices,
    gradePicker: Object.keys(liveMarket.gradePicker || {}).length > 0 ? liveMarket.gradePicker : catalogResult.gradePicker,
    ramPicker: Object.keys(liveMarket.ramPicker || {}).length > 0 ? liveMarket.ramPicker : catalogResult.ramPicker,
    ssdPicker: Object.keys(liveMarket.ssdPicker || {}).length > 0 ? liveMarket.ssdPicker : catalogResult.ssdPicker,
    colourPicker: Object.keys(liveMarket.colourPicker || {}).length > 0 ? liveMarket.colourPicker : catalogResult.colourPicker,
    cpuGpuPicker: Object.keys(liveMarket.cpuGpuPicker || {}).length > 0 ? liveMarket.cpuGpuPicker : catalogResult.cpuGpuPicker,
    keyboardPicker: Object.keys(liveMarket.keyboardPicker || {}).length > 0 ? liveMarket.keyboardPicker : catalogResult.keyboardPicker,
  };
  console.log(`  Live scrape: ${liveMarket.ok ? 'ok' : `fallback (${liveMarket.error})`}`);
  if (Object.keys(marketResult.gradePrices || {}).length > 0) {
    console.log(`  Live/catalog grade prices: ${JSON.stringify(marketResult.gradePrices)}`);
  }
  console.log('[Step 5a] Scrape target verification...');
  console.log(`  Requested product_id: ${scrapeVerification.requestedProductId || '(missing)'}`);
  console.log(`  Reconciled product_id: ${scrapeVerification.reconciledProductId || '(none)'}`);
  console.log(`  Verification: ${scrapeVerification.trusted ? 'trusted' : 'UNTRUSTED'}`);
  for (const issue of scrapeVerification.hardFailures || []) {
    console.log(`  ⛔ ${issue}`);
  }
  for (const issue of scrapeVerification.unresolved || []) {
    console.log(`  ⚠️ ${issue}`);
  }

  // Step 5b: Calculate P&L using live market prices where available
  console.log('[Step 5b] Calculating P&L...');
  const marketGrade = getCatalogGradePrice(marketResult, grade.bmGrade);
  const priceFlags = getPriceFlags(marketResult);
  if (!scrapeVerification.trusted) {
    priceFlags.unshift(`⛔ ${buildScrapeVerificationReason(scrapeVerification)}`);
  }
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
  console.log(`  Market grade price: £${marketGrade.price || 'N/A'} (${liveMarket.ok ? marketGrade.source || liveMarket.source : liveMarket.source})`);
  console.log(`  Floor price (break-even): £${floorPrice}`);

  // Use live scrape grade price as market reference for P&L, fallback to catalog, then floor × 1.5
  const marketPrice = marketGrade.price || 0;
  const rawProposedPrice = marketPrice > 0 ? marketPrice : Math.round(floorPrice * 1.5);
  const proposedPrice = PRICE_OVERRIDE !== null ? PRICE_OVERRIDE : rawProposedPrice;
  const priceSource = PRICE_OVERRIDE !== null ? `--price override (£${PRICE_OVERRIDE})` : (marketPrice > 0 ? (liveMarket.ok ? marketGrade.source || liveMarket.source : marketGrade.source || liveMarket.source) : `floor × 1.5 (no live or catalog grade price)`);
  console.log(`  Proposed (for P&L): £${proposedPrice} (${priceSource})`);

  // Historical sales — query BM completed orders for same product_id + grade (last 90 days)
  console.log('[Step 6b] Looking up historical sales...');
  let historicalSales = { count: 0, avg: 0, median: 0, low: 0, high: 0, sales: [] };
  if (SKIP_HISTORY) {
    console.log('  Skipped ( --skip-history )');
  } else {
    try {
      const soldLookupHistory = resolveHistoricalSalesFromSoldLookup(sku, grade.bmGrade);
      if (soldLookupHistory) {
        historicalSales = soldLookupHistory;
        console.log(`  Sold lookup hit: ${historicalSales.count} sales, avg £${historicalSales.avg}, median £${historicalSales.median} (£${historicalSales.low}-£${historicalSales.high})`);
      } else {
        historicalSales = await fetchSalesHistory(catalogResult.productId, grade.bmGrade, 90);
        historicalSales.source = 'bm_orders_api';
        if (historicalSales.count > 0) {
          console.log(`  BM orders API hit: ${historicalSales.count} sales: avg £${historicalSales.avg}, median £${historicalSales.median} (£${historicalSales.low}-£${historicalSales.high})`);
        } else {
          console.log('  No sales history (sold lookup miss and no completed BM orders in 90 days)');
        }
      }
    } catch (e) {
      console.log(`  Sales history lookup failed: ${e.message}`);
    }
  }

  // Calculate profitability at proposed price
  console.log('[Step 6c] Calculating profitability at min_price...');
  const profitability = calculateProfitability(proposedPrice, specs);
  console.log(`  Min price: £${profitability.minPrice}`);
  console.log(`  Net@min: £${profitability.net} | Margin: ${profitability.margin}%`);

  // Step 6: Decision gate
  console.log('[Step 6] Decision gate...');
  let decision = decisionGate(profitability);
  console.log(`  Decision: ${decision.decision} — ${decision.reason}`);
  let trust = classifyTrust({
    hasProductResolution: !!hasCatalogMatch,
    liveEligible: !!catalogResult?.liveEligible,
    decision,
    missingGrade: !grade?.bmGrade,
  });
  if (!scrapeVerification.trusted) {
    decision = { decision: 'BLOCK', reason: buildScrapeVerificationReason(scrapeVerification) };
    trust = classifyTrust({
      hasProductResolution: !!hasCatalogMatch,
      liveEligible: false,
      decision,
      missingGrade: !grade?.bmGrade,
    });
    console.log(`  Decision override: ${decision.decision} — ${decision.reason}`);
  }
  console.log(`  Trust: ${trust.classification} — ${trust.reason}`);

  // Step 7: Registry lookup (preferred)
  console.log('[Step 7] Registry lookup...');
  if (registrySlot) {
    console.log(`  Registry hit: product_id=${registrySlot.product_id}${registrySlot.listing_id ? ` listing_id=${registrySlot.listing_id}` : ''}`);
  } else {
    console.log('  Registry miss');
  }

  // Placeholder/initial price
  const marketGradePrice = marketGrade.price || 0;
  const placeholderPrice = Math.max(floorPrice * 2, marketGradePrice > 0 ? Math.round(marketGradePrice * 1.2) : 0) || floorPrice * 2;

  // Build result object
  const result = {
    mainItemId,
    itemName: grade.name,
    grade,
    bmGrade: grade.bmGrade,
    sku,
    specs,
    catalogResult: marketResult,
    registrySlot,
    slotResult: null,
    pricing: { proposed: proposedPrice, source: priceSource },
    historicalSales,
    profitability,
    decision,
    priceFlags,
    trust,
    scrapeVerification,
    liveMarketSource: liveMarket.ok ? 'single-page scrape' : `catalog fallback (${liveMarket.error})`,
    // Clean-create specific
    floorPrice,
    placeholderPrice,
    catalogGradePrice: marketGradePrice,
    pathLabel: registrySlot?.listing_id ? 'Registry (pre-built slot)' : 'B (clean create — draft then publish)',
  };

  // Print formatted summary (dry-run output)
  if (isDryRun) {
    if (CARD_JSON_MODE) {
      const gp = marketResult?.gradePrices || {};
      const ladderOk = !!(gp.Fair && gp.Good && gp.Excellent && gp.Fair < gp.Good && gp.Good < gp.Excellent);
      const cardJson = {
        itemId: result.mainItemId,
        name: result.itemName,
        sku: result.sku,
        grade: result.bmGrade,
        specs: {
          ram: result.specs?.ram || '',
          ssd: result.specs?.ssd || '',
          colour: result.specs?.colour || '',
          deviceName: result.specs?.deviceName || '',
        },
        market: {
          gradePrices: gp,
          adjacentSsd: result.catalogResult?.adjacentSsd || [],
          colourPrices: result.catalogResult?.colourPrices || {},
          scrapeTargetSource: result.catalogResult?.scrapeTargetSource || 'product_id_fallback',
          frontendUrl: result.catalogResult?.frontendUrlCapture?.frontend_url || null,
          ladderOk,
          ladderNote: ladderOk ? '' : `INVERTED`,
        },
        costs: {
          purchase: result.profitability?.purchasePrice || 0,
          parts: result.profitability?.partsCost || 0,
          labourHours: result.profitability?.labourHours || 0,
          labour: result.profitability?.labourCost || 0,
          shipping: result.profitability?.shipping || 15,
          fixed: result.profitability?.totalFixedCost || 0,
          breakEven: result.profitability?.breakEven || 0,
        },
        pricing: {
          proposed: result.pricing?.proposed || 0,
          minPrice: result.profitability?.minPrice || 0,
          net: result.profitability?.net || 0,
          margin: result.profitability?.margin || 0,
        },
        decision: result.decision?.decision || 'BLOCK',
        decisionReason: result.decision?.reason || '',
        listingId: result.registrySlot?.listing_id || null,
        productId: result.catalogResult?.productId || null,
        scrapeVerification: result.scrapeVerification || null,
        priceFlags: result.priceFlags || [],
      };
      process.stdout.write('CARD_JSON:' + JSON.stringify(cardJson) + '\n');
      return result;
    }
    console.log('\n' + formatSummary(result));
    console.log(`Draft    £${placeholderPrice} (safe placeholder)`);
    const gp = marketResult?.gradePrices || {};
    if (Object.keys(gp).length > 0) {
      console.log(`Market   ${Object.entries(gp).map(([g, p]) => `${g[0]}:£${p}`).join('  ')} (${liveMarket.ok ? 'live scrape' : 'catalog fallback'})`);
    }
    if (registrySlot?.listing_id) {
      console.log(`Registry listing_id ${registrySlot.listing_id}`);
    }
    console.log(`Product  ${catalogResult.productId} (${catalogResult.modelFamily || catalogResult.modelKey})`);
    console.log('');
    return result;
  }

  if (isProbe) {
    if (!catalogResult?.productId) {
      throw new Error(`Probe blocked: ${catalogResult?.blockReason || 'no product_id available for probe'}`);
    }

    console.log('\n[Probe] Creating draft listing via Path B...');
    const taskId = await createFreshListing(catalogResult.productId, sku, grade.bmGrade, placeholderPrice);
    console.log(`  Task ID: ${taskId}`);

    console.log('[Probe] Polling task...');
    const taskResult = await pollTask(taskId);
    const listingId = taskResult.listing_id;
    if (!listingId) throw new Error('Probe task complete but no listing_id in result');

    if (taskResult.publication_state === 2 || taskResult.publication_state === '2') {
      console.warn(`  ⚠️ BM returned pub_state=2 during probe. Setting qty=0 immediately.`);
      await bmApiFetch(`/ws/listings/${listingId}`, { method: 'POST', body: JSON.stringify({ quantity: 0 }) });
    }

    console.log('[Probe] Verifying returned draft listing...');
    const draftVerification = await verifyListing(listingId, {
      quantity: 0,
      grade: grade.bmGrade,
      productId: catalogResult.productId,
      ram: specs.ram,
      ssd: specs.ssd,
      colour: specs.colour,
      colourVerifiedByCatalog: false,
      skipColourTitleCheckForManualOverride: false,
      pubState: undefined,
    });

    const probeReport = buildProbeReport(result, catalogResult.productId, draftVerification, taskResult);

    if (JSON_OUTPUT) {
      console.log(JSON.stringify(probeReport, null, 2));
    } else {
      console.log('\n' + '─'.repeat(60));
      console.log('  PROBE RESULT');
      console.log('─'.repeat(60));
      console.log(JSON.stringify(probeReport, null, 2));
      console.log('');
    }

    result.probe = probeReport;
    if (probeReport.verdict !== 'pass') {
      process.exitCode = 2;
    }
    return result;
  }

  // Print summary for live mode too
  console.log('\n' + formatSummary(result));

  // ─── Live mode: registry-first flow ────────────────────────────
  const exactResolutionForLive = !!catalogResult?.liveEligible;
  const exactScrapeForLive = !!scrapeVerification?.trusted;
  const liveModeAllowed = isLive && !!singleItemId;
  const shouldExecuteLive =
    liveModeAllowed &&
    exactResolutionForLive &&
    exactScrapeForLive &&
    decision.decision !== 'BLOCK' &&
    !decision.requiresMinMarginOverride;

  if (shouldExecuteLive) {
    try {
      const reusableRegistrySlot = registrySlot?.listing_id ? registrySlot : null;
      const listingProductId = registrySlot?.product_id || catalogResult.productId;
      let newListingId;
      let createdViaPathB = false;

      if (reusableRegistrySlot) {
        newListingId = reusableRegistrySlot.listing_id;
        console.log(`\n[Step 8] Using registry slot ${newListingId}...`);
      } else {
        console.log('\n[Step 8] Creating draft listing via Path B...');
        const taskId = await createFreshListing(catalogResult.productId, sku, grade.bmGrade, placeholderPrice);
        console.log(`  Task ID: ${taskId}`);

        console.log('[Step 8b] Polling task...');
        const taskResult = await pollTask(taskId);
        newListingId = taskResult.listing_id;
        createdViaPathB = true;
        if (!newListingId) throw new Error('Task complete but no listing_id in result');

        if (taskResult.publication_state === 2 || taskResult.publication_state === '2') {
          console.warn(`  ⚠️ BM returned pub_state=2 instead of draft. Setting qty=0 for safe verification.`);
          try {
            await bmApiFetch(`/ws/listings/${newListingId}`, { method: 'POST', body: JSON.stringify({ quantity: 0 }) });
          } catch (e) {
            console.error(`  ❌ Failed to set qty=0: ${e.message}`);
          }
        }
      }

      const colourVerifiedByCatalog = !EFFECTIVE_PRODUCT_ID_OVERRIDE && catalogResult?.colourVerified && catalogResult?.resolutionSource === 'catalog-exact';
      const colourVerifiedByTrustedSlot = !EFFECTIVE_PRODUCT_ID_OVERRIDE && catalogResult?.colourVerified && catalogResult?.source === 'listings-registry';
      if (createdViaPathB) {
        console.log('[Step 8c] Verifying draft listing...');
        const draftVerification = await verifyListing(newListingId, {
          quantity: 0,
          grade: grade.bmGrade,
          productId: EFFECTIVE_PRODUCT_ID_OVERRIDE ? undefined : listingProductId,
          ram: specs.ram,
          ssd: specs.ssd,
          colour: specs.colour,
          colourVerifiedByCatalog,
          colourVerifiedByTrustedSlot,
          skipColourTitleCheckForManualOverride: !!PRODUCT_ID_OVERRIDE,
          pubState: undefined,
        });
        if (!draftVerification.verified) {
          const criticalIssues = draftVerification.issues.filter(i => i.startsWith('⛔'));
          if (criticalIssues.length > 0) {
            const msg = `⛔ Draft listing ${newListingId} verification FAILED: ${criticalIssues.join(', ')}. Left as draft. NOT publishing.`;
            console.error(`  ${msg}`);
            await postTelegram(msg);
            return result;
          }
          console.warn(`  ⚠️ Draft verification issues (non-critical): ${draftVerification.issues.join(', ')}`);
        } else {
          console.log('  ✅ Draft listing verified');
        }
      }

      // Step 9: Activate listing with initial live-scrape price, then backbox
      const initialPrice = proposedPrice;
      const initialMinPrice = Math.ceil(initialPrice * MIN_PRICE_FACTOR);
      console.log(`[Step 9] Activating listing ${newListingId} at £${initialPrice}...`);
      await publishListing(newListingId, initialPrice, initialMinPrice);

      console.log('[Step 9b] Getting backbox price...');
      let finalPrice;
      let finalPriceSource;
      if (PRICE_OVERRIDE !== null) {
        // User explicitly set a price — lock it in, skip backbox cascade
        finalPrice = PRICE_OVERRIDE;
        finalPriceSource = `--price override (£${PRICE_OVERRIDE})`;
        console.log(`  Using --price override: £${finalPrice} (backbox skipped)`);
      } else {
        const backbox = await getBackboxPrice(newListingId);
        if (backbox.price > 0 && initialPrice > 0) {
          const diffRatio = Math.abs(backbox.price - initialPrice) / initialPrice;
          if (diffRatio > 0.20) {
            console.warn(`  ⚠️ Backbox differs from live scrape by ${(diffRatio * 100).toFixed(1)}%`);
          }
        }
        if (backbox.price > 0 && backbox.price >= floorPrice) {
          finalPrice = backbox.price;
          finalPriceSource = 'backbox price_to_win';
        } else if (backbox.price > 0 && backbox.price < floorPrice) {
          finalPrice = floorPrice;
          finalPriceSource = `floor (backbox £${backbox.price} below floor £${floorPrice})`;
          console.log(`  ⚠️ Backbox price £${backbox.price} below floor £${floorPrice}. Using floor.`);
        } else if (marketGradePrice > 0) {
          finalPrice = marketGradePrice;
          finalPriceSource = liveMarket.ok ? 'live scrape price (no backbox data)' : 'catalog grade price (no backbox data)';
          console.log(`  No backbox data. Using fallback market price: £${marketGradePrice}`);
        } else {
          finalPrice = Math.round(floorPrice * 1.5);
          finalPriceSource = 'floor × 1.5 (no backbox or catalog data)';
          console.log(`  ⚠️ No pricing data. Using conservative placeholder: £${finalPrice}`);
        }
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

      if (finalPrice !== initialPrice || finalMinPrice !== initialMinPrice) {
        console.log('[Step 9c] Updating activated listing price after backbox...');
        await updateListingPrice(newListingId, finalPrice, finalMinPrice);
      }

      // Step 12: Verify published listing
      console.log('[Step 12] Verifying published listing...');
      await sleep(2000); // Brief wait for BM to update state
      const pubVerification = await verifyListing(newListingId, {
        quantity: 1,
        grade: grade.bmGrade,
        productId: EFFECTIVE_PRODUCT_ID_OVERRIDE ? undefined : listingProductId,
        ram: specs.ram,
        ssd: specs.ssd,
        colour: specs.colour,
        colourVerifiedByCatalog,
        colourVerifiedByTrustedSlot,
        skipColourTitleCheckForManualOverride: !!PRODUCT_ID_OVERRIDE,
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
        console.log('  Retrying publish/update...');
        await publishListing(newListingId, finalPrice, finalMinPrice);
        await sleep(2000);
        const retry = await verifyListing(newListingId, {
          quantity: 1,
          grade: grade.bmGrade,
          productId: EFFECTIVE_PRODUCT_ID_OVERRIDE ? undefined : listingProductId,
          ram: specs.ram,
          ssd: specs.ssd,
          colour: specs.colour,
          colourVerifiedByCatalog,
          colourVerifiedByTrustedSlot,
          skipColourTitleCheckForManualOverride: !!PRODUCT_ID_OVERRIDE,
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
      await updateMonday(mainItemId, specs.bmDeviceId, newListingId, listingProductId, finalProfitability.totalFixedCost, sku);
      console.log('  Monday updated');

      // Step 14: Telegram confirmation (SOP 6 proposal card format)
      const marketGradePrices = result.catalogResult?.gradePrices || {};
      const marketLine = Object.keys(marketGradePrices).length > 0
        ? Object.entries(marketGradePrices).map(([g, pr]) => `${g} £${pr}`).join(' | ')
        : 'N/A';
      const histSales = result.historicalSales || { count: 0 };
      const histLine = histSales.count > 0
        ? `${histSales.count} sold @ avg £${histSales.avg}${histSales.avgDaysToSell ? ` | avg ${histSales.avgDaysToSell} days to sell` : ''}`
        : 'N/A';
      const costBasis = Math.round(finalProfitability.totalFixedCost || 0);
      const tgMsg = [
        `✅ Listing proposal: ${grade.name} ${specs.ram}/${specs.ssd} ${specs.colour} ${grade.gradeText}`,
        `BM#: ${newListingId} | Path: ${reusableRegistrySlot ? 'Registry' : 'B'}`,
        `Proposed price: £${finalPrice} | Min: £${finalMinPrice}`,
        `Net@min: £${finalProfitability.net} (${finalProfitability.margin}%) | Cost basis: £${costBasis}`,
        `  └ Purchase £${Math.round(specs.purchasePrice || 0)} + Parts £${Math.round(specs.partsCost || 0)} + Labour £${Math.round(finalProfitability.labourCost || 0)} + Ship £${SHIPPING_COST}`,
        '',
        `Market now:  ${marketLine}`,
        `Our history: ${histLine}`,
        '',
        `Monday: #${grade.name} updated ✓`,
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
  if (isLive && isProbe) {
    throw new Error('Choose one action mode: --live or --probe-product-id, not both');
  }
  if (isProbe && !singleItemId) {
    throw new Error('Probe mode requires --item <MainBoardId>');
  }

  const modeLabel = isProbe ? `🧪 PROBE MODE (${PROBE_PRODUCT_ID})` : (isDryRun ? 'DRY RUN' : '🔴 LIVE MODE');

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Back Market Listing Script — ${modeLabel}`);
  console.log(`  ${today()} | Node ${process.version}`);
  console.log('═'.repeat(60));
  if (USE_LEGACY_GATES) {
    console.log('[LEGACY] using pre-Phase-0.2 thresholds');
  }

  if (isLive && !singleItemId) {
    console.error('⛔ Live mode without --item is disabled. Mass live listing remains blocked.');
    process.exit(1);
  }

  // Load scraper data once
  console.log('\nLoading V7 scraper data...');
  const scraperData = loadScraperData();
  const modelCount = Object.keys(scraperData.models).length;
  console.log(`  ${modelCount} models loaded (scraped ${scraperData.scraped_at})`);

  console.log('\nLoading BM catalog...');
  const bmCatalog = loadBmCatalog();
  console.log(`  ${Object.keys(bmCatalog.variants || {}).length} variants loaded (catalog ${bmCatalog.catalog_version || 'unknown'})`);

  console.log('\nLoading listings registry...');
  const registry = loadListingsRegistry();
  console.log(`  ${Object.keys(registry.slots || {}).length} verified slots loaded`);

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
      const result = await processItem(id, scraperData, bmDeviceMap);
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
  console.log(`  Mode: ${isProbe ? '🧪 PROBE (draft create + verify only)' : (isDryRun ? 'DRY RUN (no actions taken)' : '🔴 LIVE')}`);
  console.log('');
}

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
});

if (require.main === module) {
  main().then(() => {
    // Ensure stdout flushes before exit
    if (process.stdout.writableEnded) return;
    process.stdout.write('', () => process.exit(process.exitCode || 0));
  }).catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}

module.exports = {
  buildProbeReport,
  classifyTrust,
  decisionGate,
  determineProbeVerdict,
  loadListingsRegistry,
  lookupRegistrySlot,
  processItem,
  resolveHistoricalSalesFromSoldLookup,
  resolveProductFromRegistrySlot,
  summarizeFrontendCaptureMismatches,
  verifyListing,
};
