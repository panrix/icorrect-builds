#!/usr/bin/env node
/**
 * buy-box-check.js — SOP 07: Buy Box Management (Sell Side)
 *
 * Steps from SOP 07:
 * 1. Get all active listings (qty > 0)
 * 2. Check buy box via backbox API (UUID, not listing_id)
 * 3-5. Profitability analysis at current + win price
 * 6. Apply bump if --auto-bump and margin gate passes
 * 7. Age-based escalation
 * 8. Grade ladder integrity check
 * 9. Quantity verification + auto-offline if Monday status != Listed
 * 10. Report to BM Telegram
 *
 * Usage:
 *   node buy-box-check.js                          # Check only
 *   node buy-box-check.js --dry-run                # Check one/all listings with no live mutations or Telegram
 *   node buy-box-check.js --listing-id 1234567     # Restrict to one BM listing_id
 *   node buy-box-check.js --auto-bump              # Check + apply profitable bumps
 *   node buy-box-check.js --min-margin 0           # Clearance override: bypass margin gates
 *   node buy-box-check.js --legacy-gates           # Use pre-Phase-0.2 thresholds
 *   node buy-box-check.js --compare-profitability   # Show real vs estimated side-by-side
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });
const fs = require('fs');
const path = require('path');
const {
  findResolverSlot,
  isResolverSlotLiveSafe,
  normalizeResolverColour,
  normalizeResolverGrade,
  normalizeResolverSku,
  upgradeRegistrySchema,
} = require('./lib/resolver-truth');
const {
  launchBatchBrowser, closeBatchBrowser, scrapeWithContext,
} = require('./lib/v7-scraper');
const { postTelegram: sendTelegram } = require('./lib/notifications');

// ─── Config ───────────────────────────────────────────────────────
const BM_BASE = 'https://www.backmarket.co.uk';
const BM_AUTH = process.env.BACKMARKET_API_AUTH;
const BM_LANG = process.env.BACKMARKET_API_LANG || 'en-gb';
const BM_UA = process.env.BACKMARKET_API_UA;
const MONDAY_TOKEN = process.env.MONDAY_AUTOMATIONS_TOKEN;

const BM_DEVICES_BOARD = 3892194968;
const MAIN_BOARD = 349212843;
const BM_SELL_FEE_RATE = 0.10;
const VAT_RATE = 0.1667;
const MIN_PRICE_FACTOR = 0.97;

const PROFITABILITY_LOOKUP_PATH = path.join(__dirname, '..', 'data', 'buyback-profitability-lookup.json');
const BM_CATALOG_PATH = path.join(__dirname, '..', 'data', 'bm-catalog.json');
const REGISTRY_PATH = path.join(__dirname, '..', 'data', 'listings-registry.json');

const args = process.argv.slice(2);
const autoBump = args.includes('--auto-bump');
const dryRun = args.includes('--dry-run');
const recalcCosts = args.includes('--recalc');
const parallelCompare = args.includes('--compare-profitability');
const noScrape = args.includes('--no-scrape');
const useLegacyGates = args.includes('--legacy-gates') || process.env.BM_THRESHOLDS_VERSION === 'v1';
const minMarginIdx = args.indexOf('--min-margin');
const MIN_MARGIN_OVERRIDE = minMarginIdx !== -1 ? parseFloat(args[minMarginIdx + 1]) : null;
const bypassMarginGates = MIN_MARGIN_OVERRIDE === 0;
const listingIdFilter = (() => {
  const idx = args.indexOf('--listing-id');
  return idx >= 0 ? args[idx + 1] : null;
})();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Profitability lookup (real data) ────────────────────────────
let _profLookup = null;
let _bmCatalog = null;
let _resolverRegistry = null;
function loadProfitabilityLookup() {
  if (_profLookup !== null) return _profLookup;
  try {
    const raw = JSON.parse(fs.readFileSync(PROFITABILITY_LOOKUP_PATH, 'utf8'));
    _profLookup = raw.lookup || {};
    console.log(`  Loaded profitability lookup: ${Object.keys(_profLookup).length} model+grade combos`);
  } catch {
    _profLookup = {};
    console.log('  No profitability lookup found — using Monday cost data only');
  }
  return _profLookup;
}

function loadBmCatalog() {
  if (_bmCatalog !== null) return _bmCatalog;
  try {
    const raw = JSON.parse(fs.readFileSync(BM_CATALOG_PATH, 'utf8'));
    _bmCatalog = raw.variants || {};
    console.log(`  Loaded BM catalog: ${Object.keys(_bmCatalog).length} variants`);
  } catch {
    _bmCatalog = {};
    console.log('  No BM catalog found — live variant verification disabled');
  }
  return _bmCatalog;
}

function loadResolverRegistry() {
  if (_resolverRegistry !== null) return _resolverRegistry;
  try {
    const raw = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    _resolverRegistry = upgradeRegistrySchema(raw).registry;
    console.log(`  Loaded resolver registry: ${Object.keys(_resolverRegistry.slots || {}).length} slots`);
  } catch {
    _resolverRegistry = { slots: {} };
    console.log('  No resolver registry found — managed variant verification disabled');
  }
  return _resolverRegistry;
}

function normalizeColour(colour) {
  if (!colour) return '';
  const c = String(colour).trim().toLowerCase();
  if (['space gray', 'space grey', 'grey', 'gray'].includes(c)) return 'space gray';
  if (c === 'space black') return 'space black';
  if (c === 'black') return 'black';
  if (c === 'silver') return 'silver';
  if (c === 'gold') return 'gold';
  if (c === 'midnight') return 'midnight';
  if (c === 'starlight') return 'starlight';
  if (c === 'rose gold') return 'rose gold';
  return c.replace(/\s+/g, ' ');
}

function mapFinalGradeToBmGrade(grade) {
  if (!grade) return '';
  const g = String(grade).trim().toLowerCase();
  if (g === 'grade a' || g === 'very good' || g === 'excellent' || g === 'a') return 'VERY_GOOD';
  if (g === 'grade b' || g === 'good' || g === 'b') return 'GOOD';
  if (g === 'grade c' || g === 'fair' || g === 'c') return 'FAIR';
  return '';
}

/**
 * Extract key identifiers from a MacBook title or model string.
 * Returns { family, size, chip } or null if unparseable.
 *
 * Handles both:
 *   BM titles:   "MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 8GB RAM..."
 *   Lookup keys:  "MacBook Pro 13 M1 A2338"
 */
function extractModelId(text) {
  if (!text) return null;
  const t = text.toLowerCase();

  // Family
  let family = null;
  if (t.includes('macbook pro')) family = 'pro';
  else if (t.includes('macbook air')) family = 'air';
  else return null; // not a MacBook

  // Size: "13-inch", "14-inch", "15-inch", "16-inch" or just "13", "14", etc.
  const sizeMatch = t.match(/\b(13|14|15|16)(?:-inch|\b)/);
  const size = sizeMatch ? sizeMatch[1] : null;

  // Chip: "Apple M1 Pro", "Apple M2", "M1 Pro/Max", "M3", or "Intel"/"Core i5"/"Core i7"
  let chip = null;
  // BM format: "Apple M1 Pro", "Apple M2 Max" etc.
  const bmChipMatch = t.match(/apple\s+(m[1-9]\d?)\s*(pro|max)?/);
  if (bmChipMatch) {
    chip = bmChipMatch[1] + (bmChipMatch[2] ? ' ' + bmChipMatch[2] : '');
  }
  // Lookup format: "M1 Pro/Max", "M1 Pro", "M2" etc.
  if (!chip) {
    const lookupChipMatch = t.match(/\b(m[1-9]\d?)\s*(pro|max)?(?:\/max)?/);
    if (lookupChipMatch) {
      chip = lookupChipMatch[1] + (lookupChipMatch[2] ? ' ' + lookupChipMatch[2] : '');
    }
  }
  // Intel fallback
  if (!chip && (t.includes('intel') || t.includes('core i'))) {
    chip = 'intel';
  }

  return { family, size, chip };
}

/**
 * Normalize BM listing grade to lookup grade format.
 * BM API returns: "1"/"FAIR", "9"/"GOOD", "10"/"VERY_GOOD"
 */
function normaliseGrade(grade) {
  if (!grade) return '';
  const g = String(grade).toUpperCase().trim();
  const map = { '1': 'FAIR', '2': 'FAIR', 'FAIR': 'FAIR', 'STALLONE': 'FAIR',
    '9': 'GOOD', 'GOOD': 'GOOD',
    '10': 'VERY_GOOD', '11': 'VERY_GOOD', 'VERY_GOOD': 'VERY_GOOD', 'EXCELLENT': 'VERY_GOOD' };
  return map[g] || g;
}

/**
 * Match a listing to a profitability lookup entry.
 * Returns { data, source: 'real'|'estimate', matchKey } or null.
 *
 * Matching strategy:
 *   1. Extract Family + Size + Chip from both BM listing title and lookup model
 *   2. Match on all three identifiers + grade
 *   3. Fall back to fuzzy word matching if extraction fails
 */
function lookupRealProfitability(listing) {
  const lookup = loadProfitabilityLookup();
  if (Object.keys(lookup).length === 0) return null;

  const title = (listing.title || '');
  const grade = normaliseGrade(listing.grade);
  const listingId = extractModelId(title);

  // Strategy 1: Structured matching on Family + Size + Chip
  if (listingId && listingId.family && listingId.chip) {
    for (const [key, data] of Object.entries(lookup)) {
      if (data.grade !== grade) continue;
      const lookupId = extractModelId(data.model);
      if (!lookupId) continue;

      if (listingId.family === lookupId.family &&
          listingId.size === lookupId.size &&
          listingId.chip === lookupId.chip) {
        return { data, source: 'real', matchKey: key };
      }
    }

    // Try matching without size (some titles may omit it)
    if (listingId.size) {
      for (const [key, data] of Object.entries(lookup)) {
        if (data.grade !== grade) continue;
        const lookupId = extractModelId(data.model);
        if (!lookupId) continue;

        if (listingId.family === lookupId.family &&
            listingId.chip === lookupId.chip &&
            !lookupId.size) {
          return { data, source: 'real', matchKey: key };
        }
      }
    }
  }

  // Strategy 2: Fall back to fuzzy word matching
  const titleLower = title.toLowerCase();
  for (const [key, data] of Object.entries(lookup)) {
    if (data.grade !== grade) continue;

    const modelWords = data.model.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
    let matchCount = 0;
    for (const w of modelWords) {
      if (titleLower.includes(w)) matchCount++;
    }
    if (modelWords.length > 0 && matchCount >= Math.ceil(modelWords.length * 0.8)) {
      return { data, source: 'real', matchKey: key };
    }
  }

  return null;
}

// ─── API helpers ──────────────────────────────────────────────────
async function bmApi(path, opts = {}) {
  const r = await fetch(BM_BASE + path, {
    method: opts.method || 'GET',
    headers: { Authorization: BM_AUTH, 'Accept-Language': BM_LANG, 'User-Agent': BM_UA, 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`BM ${r.status} ${path}: ${t.slice(0, 200)}`); }
  return r.json();
}

async function mondayApi(query) {
  const r = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: { Authorization: MONDAY_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return r.json();
}

async function postTelegram(msg) {
  if (dryRun) {
    console.log(`  [DRY RUN] Would send to Telegram: ${msg.slice(0, 150)}...`);
    return;
  }
  await sendTelegram(msg, { parseMode: 'HTML', logger: console });
}

// ─── Step 1: Get active listings ──────────────────────────────────
async function getActiveListings() {
  const all = [];
  let page = 1;
  while (true) {
    const d = await bmApi(`/ws/listings?page=${page}&page_size=100`);
    const items = d.results || [];
    if (items.length === 0) break;
    for (const l of items) {
      if (l.quantity > 0) all.push(l);
    }
    if (!d.next) break;
    page++;
    await sleep(300);
  }
  return all;
}

// ─── Step 2: Check buy box (uses UUID) ────────────────────────────
async function checkBuyBox(listing) {
  const uuid = listing.id;
  try {
    const bbRaw = await bmApi(`/ws/backbox/v1/competitors/${uuid}`);
    const bb = Array.isArray(bbRaw) ? bbRaw[0] : bbRaw;
    if (!bb) throw new Error('Empty backbox response');
    return {
      isWinning: bb.is_winning || false,
      priceToWin: bb.price_to_win?.amount ? parseFloat(bb.price_to_win.amount) : null,
      winnerPrice: bb.winner_price?.amount ? parseFloat(bb.winner_price.amount) : null,
    };
  } catch (e) {
    return { error: e.message };
  }
}

// ─── Step 5: Get profitability data from Monday ──────────────────
async function getCostData(listingId) {
  const q = `{ boards(ids:[${BM_DEVICES_BOARD}]) { items_page(limit: 500, query_params: { rules: [{ column_id: "text_mkyd4bx3", compare_value: ["${listingId}"] }] }) { items { id name column_values(ids: ["numeric_mm1mgcgn", "numeric", "board_relation"]) { id text ... on BoardRelationValue { linked_item_ids } } } } } }`;
  const d = await mondayApi(q);
  const items = d.data?.boards?.[0]?.items_page?.items || [];
  if (items.length === 0) return null;

  // Prefer item with cost data (multiple items may share same listing_id)
  const item = items.find(i => {
    const costCol = i.column_values.find(cv => cv.id === 'numeric_mm1mgcgn');
    return costCol?.text && parseFloat(costCol.text) > 0;
  }) || items[0];
  let totalFixedCost = 0, purchasePrice = 0, mainItemId = null;
  for (const cv of item.column_values) {
    if (cv.id === 'numeric_mm1mgcgn') totalFixedCost = parseFloat(cv.text) || 0;
    if (cv.id === 'numeric') purchasePrice = parseFloat(cv.text) || 0;
    if (cv.id === 'board_relation' && cv.linked_item_ids?.length > 0) {
      mainItemId = cv.linked_item_ids[0];
    }
  }

  // --recalc: pull fresh costs from Monday instead of trusting stored value
  if (recalcCosts && mainItemId) {
    const costQ = `{ items(ids:[${mainItemId}]) { column_values(ids:["lookup_mkx1xzd7","formula__1"]) { id ... on MirrorValue { display_value } ... on FormulaValue { display_value } } } }`;
    const costR = await mondayApi(costQ);
    const mainCols = costR.data?.items?.[0]?.column_values || [];
    const partsRaw = mainCols.find(c => c.id === 'lookup_mkx1xzd7')?.display_value || '0';
    const parts = String(partsRaw).split(',').reduce((sum, v) => sum + (parseFloat(v.trim()) || 0), 0);
    const labourH = parseFloat(mainCols.find(c => c.id === 'formula__1')?.display_value) || 0;
    const labour = labourH * 24; // LABOUR_RATE
    const buyFee = purchasePrice * 0.10;
    const freshFixed = purchasePrice + parts + labour + 15 + buyFee;
    if (Math.abs(freshFixed - totalFixedCost) > 1) {
      console.log(`  --recalc: £${totalFixedCost.toFixed(0)} → £${freshFixed.toFixed(0)} (delta £${(freshFixed - totalFixedCost).toFixed(0)})`);
      // Write corrected value back to Monday
      await mondayApi(`mutation { change_column_value(board_id: ${BM_DEVICES_BOARD}, item_id: ${item.id}, column_id: "numeric_mm1mgcgn", value: "${Math.round(freshFixed * 100) / 100}") { id } }`);
      totalFixedCost = freshFixed;
    }
  }

  return { totalFixedCost, purchasePrice, bmDeviceName: item.name, bmDeviceId: item.id, mainItemId };
}

// ─── Step 7: Get date listed from Main Board ─────────────────────
async function getDateListed(mainItemId) {
  if (!mainItemId) return null;
  const q = `{ items(ids:[${mainItemId}]) { column_values(ids:["date_mkq385pa"]) { text } } }`;
  const d = await mondayApi(q);
  const text = d.data?.items?.[0]?.column_values?.[0]?.text;
  if (!text) return null;
  return new Date(text);
}

async function getMainItemContext(mainItemId) {
  if (!mainItemId) return null;
  const q = `{ items(ids:[${mainItemId}]) { column_values(ids:["status24","date_mkq385pa","status8","status_2_Mjj4GJNQ"]) { id text ... on StatusValue { index } } } }`;
  const d = await mondayApi(q);
  const cols = d.data?.items?.[0]?.column_values || [];
  const dateText = cols.find(c => c.id === 'date_mkq385pa')?.text || '';
  return {
    statusIdx: cols.find(c => c.id === 'status24')?.index,
    statusText: cols.find(c => c.id === 'status24')?.text || '',
    dateListed: dateText ? new Date(dateText) : null,
    colour: cols.find(c => c.id === 'status8')?.text || '',
    finalGrade: cols.find(c => c.id === 'status_2_Mjj4GJNQ')?.text || '',
  };
}

function assessRawCatalogIntegrity(listing, mainContext) {
  const productId = String(listing.product_id || listing.product || listing.uuid || '').trim();
  const catalog = loadBmCatalog();
  const variant = catalog[productId];
  if (!productId) {
    return { ok: false, reason: 'live listing missing product_id', severity: 'warning', autoOffline: false };
  }
  if (!variant) {
    return { ok: false, reason: `product_id ${productId} not found in bm-catalog.json`, severity: 'warning', autoOffline: false, productId };
  }
  if (variant.verification_status !== 'verified') {
    return {
      ok: false,
      reason: `catalog variant not verified (${variant.verification_status || 'unknown'})`,
      severity: 'warning',
      autoOffline: false,
      productId,
      variant,
    };
  }

  const expectedColour = normalizeColour(mainContext?.colour);
  const catalogColour = normalizeColour(variant.colour);
  if (!expectedColour) {
    return {
      ok: false,
      reason: `main-board colour missing; catalog says ${variant.colour || 'blank'}`,
      severity: 'warning',
      autoOffline: false,
      productId,
      variant,
    };
  }
  if (!catalogColour) {
    return {
      ok: false,
      reason: 'catalog colour missing',
      severity: 'warning',
      autoOffline: false,
      productId,
      variant,
    };
  }
  if (expectedColour !== catalogColour) {
    return {
      ok: false,
      reason: `colour mismatch: Monday="${mainContext.colour}" vs catalog="${variant.colour}"`,
      severity: 'warning',
      autoOffline: false,
      productId,
      variant,
    };
  }

  const expectedGrade = mapFinalGradeToBmGrade(mainContext?.finalGrade);
  const liveGrade = normaliseGrade(listing.grade);
  if (!expectedGrade) {
    return {
      ok: false,
      reason: `main-board final grade missing/unmapped (${mainContext?.finalGrade || 'blank'})`,
      severity: 'warning',
      autoOffline: false,
      productId,
      variant,
    };
  }
  if (!liveGrade) {
    return {
      ok: false,
      reason: 'live listing grade missing/unmapped',
      severity: 'warning',
      autoOffline: false,
      productId,
      variant,
    };
  }
  if (expectedGrade !== liveGrade) {
    return {
      ok: false,
      reason: `grade mismatch: Monday="${mainContext.finalGrade}" -> ${expectedGrade} vs live="${liveGrade}"`,
      severity: 'warning',
      autoOffline: false,
      productId,
      variant,
    };
  }

  return {
    ok: true,
    autoOffline: false,
    managed: false,
    authoritativeSource: 'bm-catalog-advisory',
    productId,
    variant,
    expectedColour: mainContext.colour,
    expectedGrade: expectedGrade,
    liveGrade,
  };
}

function assessResolverManagedIntegrity(listing, mainContext, resolverSlot) {
  const productId = String(listing.product_id || listing.product || listing.uuid || '').trim();
  const resolverProductId = String(resolverSlot?.product_id || '').trim();
  const resolverSku = normalizeResolverSku(resolverSlot?.sku || '');
  const listingSku = normalizeResolverSku(listing.sku || '');
  const expectedColour = normalizeResolverColour(mainContext?.colour);
  const resolverColour = normalizeResolverColour(resolverSlot?.colour);
  const expectedGrade = mapFinalGradeToBmGrade(mainContext?.finalGrade);
  const liveGrade = normaliseGrade(listing.grade);
  const resolverGrade = normalizeResolverGrade(resolverSlot?.grade);

  if (!productId) {
    return { ok: false, reason: 'resolver-managed listing missing product_id', severity: 'critical', autoOffline: true, managed: true, authoritativeSource: 'resolver', resolverSlot };
  }
  if (!resolverProductId) {
    return { ok: false, reason: 'resolver entry missing product_id', severity: 'critical', autoOffline: true, managed: true, authoritativeSource: 'resolver', resolverSlot };
  }
  if (productId !== resolverProductId) {
    return {
      ok: false,
      reason: `resolver product_id mismatch: live="${productId}" vs resolver="${resolverProductId}"`,
      severity: 'critical',
      autoOffline: true,
      managed: true,
      authoritativeSource: 'resolver',
      resolverSlot,
    };
  }
  if (resolverSku && listingSku && resolverSku !== listingSku) {
    // Determine if the mismatch is semantic (different device) or cosmetic (format/chip tokens added)
    // Extract critical fields: model number, RAM, storage, colour, grade
    function extractSkuCritical(sku) {
      const parts = sku.toUpperCase().split('.');
      const model = parts.find(p => /^A\d{4}$/.test(p)) || '';
      const ram = parts.find(p => /^\d+(GB|TB)$/.test(p) && parseInt(p) <= 128) || '';
      const storage = parts.find(p => /^\d+(GB|TB)$/.test(p) && parseInt(p) > 128) || '';
      const gradeRaw = parts.find(p => ['FAIR','GOOD','EXCELLENT','VERYGOOD','VERY_GOOD','VGOOD','VERY'].includes(p) || p.startsWith('VERY')) || '';
      const gradeMap = { 'VGOOD': 'VERYGOOD', 'VERY_GOOD': 'VERYGOOD', 'VERYGOOD': 'VERYGOOD', 'EXCELLENT': 'EXCELLENT', 'GOOD': 'GOOD', 'FAIR': 'FAIR' };
      const grade = gradeMap[gradeRaw] || gradeRaw;
      const colour = parts.find(p => ['GREY','GRAY','SILVER','GOLD','MIDNIGHT','STARLIGHT','SPACEBLACK','SPACEGREY','SPACEGRAY','BLACK','WHITE','BLUE','GREEN','PURPLE','PINK','RED'].includes(p)) || '';
      return { model, ram, storage, grade, colour };
    }
    const liveCritical = extractSkuCritical(listingSku);
    const resolverCritical = extractSkuCritical(resolverSku);
    const semanticMismatch =
      (liveCritical.model && resolverCritical.model && liveCritical.model !== resolverCritical.model) ||
      (liveCritical.colour && resolverCritical.colour && liveCritical.colour !== resolverCritical.colour) ||
      (liveCritical.grade && resolverCritical.grade && liveCritical.grade !== resolverCritical.grade) ||
      (liveCritical.ram && resolverCritical.ram && liveCritical.ram !== resolverCritical.ram) ||
      (liveCritical.storage && resolverCritical.storage && liveCritical.storage !== resolverCritical.storage);

    if (semanticMismatch) {
      return {
        ok: false,
        reason: `resolver SKU mismatch: live="${listing.sku}" vs resolver="${resolverSlot.sku}"`,
        severity: 'critical',
        autoOffline: true,
        managed: true,
        authoritativeSource: 'resolver',
        resolverSlot,
      };
    } else {
      // Format-only difference (chip/GPU tokens, capitalisation, prefix style) — warn, do not offline
      return {
        ok: false,
        reason: `resolver SKU format difference (non-critical): live="${listing.sku}" vs resolver="${resolverSlot.sku}"`,
        severity: 'warning',
        autoOffline: false,
        managed: true,
        authoritativeSource: 'resolver',
        resolverSlot,
      };
    }
  }
  if (!expectedColour) {
    return {
      ok: false,
      reason: `main-board colour missing; resolver says ${resolverSlot?.colour || 'blank'}`,
      severity: 'critical',
      autoOffline: true,
      managed: true,
      authoritativeSource: 'resolver',
      resolverSlot,
    };
  }
  if (!resolverColour) {
    return {
      ok: false,
      reason: 'resolver colour missing',
      severity: 'critical',
      autoOffline: true,
      managed: true,
      authoritativeSource: 'resolver',
      resolverSlot,
    };
  }
  if (expectedColour !== resolverColour) {
    return {
      ok: false,
      reason: `colour mismatch: Monday="${mainContext?.colour || ''}" vs resolver="${resolverSlot?.colour || ''}"`,
      severity: 'critical',
      autoOffline: true,
      managed: true,
      authoritativeSource: 'resolver',
      resolverSlot,
    };
  }
  if (!expectedGrade) {
    return {
      ok: false,
      reason: `main-board final grade missing/unmapped (${mainContext?.finalGrade || 'blank'})`,
      severity: 'critical',
      autoOffline: true,
      managed: true,
      authoritativeSource: 'resolver',
      resolverSlot,
    };
  }
  if (!liveGrade) {
    return {
      ok: false,
      reason: 'live listing grade missing/unmapped',
      severity: 'critical',
      autoOffline: true,
      managed: true,
      authoritativeSource: 'resolver',
      resolverSlot,
    };
  }
  if (expectedGrade !== liveGrade) {
    return {
      ok: false,
      reason: `grade mismatch: Monday="${mainContext?.finalGrade || ''}" -> ${expectedGrade} vs live="${liveGrade}"`,
      severity: 'critical',
      autoOffline: true,
      managed: true,
      authoritativeSource: 'resolver',
      resolverSlot,
    };
  }
  if (resolverGrade && liveGrade !== resolverGrade) {
    return {
      ok: false,
      reason: `resolver grade mismatch: live="${liveGrade}" vs resolver="${resolverGrade}"`,
      severity: 'critical',
      autoOffline: true,
      managed: true,
      authoritativeSource: 'resolver',
      resolverSlot,
    };
  }

  return {
    ok: true,
    autoOffline: false,
    managed: true,
    authoritativeSource: 'resolver',
    resolverSlot,
    productId,
    expectedColour: mainContext?.colour || '',
    expectedGrade,
    liveGrade,
  };
}

function assessVariantIntegrity(listing, mainContext) {
  const productId = String(listing.product_id || listing.product || listing.uuid || '').trim();
  const resolverRegistry = loadResolverRegistry();
  const resolverSlot = findResolverSlot(resolverRegistry, {
    listingId: listing.listing_id,
    sku: listing.sku,
    productId,
    grade: listing.grade,
  });

  if (resolverSlot && isResolverSlotLiveSafe(resolverSlot)) {
    return assessResolverManagedIntegrity(listing, mainContext, resolverSlot);
  }

  const advisory = assessRawCatalogIntegrity(listing, mainContext);
  if (!advisory.ok) {
    return {
      ...advisory,
      alertOnly: true,
      managed: false,
      authoritativeSource: 'unmanaged',
      reason: `unmanaged listing: ${advisory.reason}`,
    };
  }

  return {
    ...advisory,
    alertOnly: false,
    managed: false,
    authoritativeSource: 'unmanaged',
    advisoryReason: 'no canonical resolver truth; raw catalog check is advisory only',
  };
}

// ─── Profitability calculation ────────────────────────────────────
function calcProfit(price, totalFixedCost, purchasePrice) {
  const minPrice = Math.ceil(price * MIN_PRICE_FACTOR);
  const sellFee = minPrice * BM_SELL_FEE_RATE;
  const vat = Math.max(0, (minPrice - purchasePrice) * VAT_RATE);
  const net = minPrice - totalFixedCost - sellFee - vat;
  const margin = minPrice > 0 ? (net / minPrice) * 100 : -999;
  const breakEven = Math.ceil((totalFixedCost - purchasePrice * VAT_RATE) / (1 - BM_SELL_FEE_RATE - VAT_RATE));
  return {
    minPrice,
    sellFee: Math.round(sellFee * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    net: Math.round(net * 100) / 100,
    margin: Math.round(margin * 100) / 100,
    breakEven,
  };
}

function getAutoBumpThresholds() {
  if (useLegacyGates) {
    return {
      silentNet: 50,
      silentMargin: 30,
      flaggedNet: 50,
      flaggedMargin: 15,
    };
  }
  return {
    silentNet: 200,
    silentMargin: 25,
    flaggedNet: 150,
    flaggedMargin: 15,
  };
}

function evaluateAutoBumpGate(atWin) {
  const thresholds = getAutoBumpThresholds();
  if (!atWin) {
    return { eligible: false, tier: 'blocked', reason: 'no cost data', thresholds };
  }

  const margin = parseFloat(atWin.margin);
  const meetsFlaggedMargin = bypassMarginGates || margin >= thresholds.flaggedMargin;
  const meetsSilentMargin = bypassMarginGates || margin >= thresholds.silentMargin;

  if (atWin.net >= thresholds.silentNet && meetsSilentMargin) {
    return { eligible: true, tier: 'silent', reason: 'silent bump tier', thresholds };
  }
  if (atWin.net >= thresholds.flaggedNet && meetsFlaggedMargin) {
    return { eligible: true, tier: 'flagged', reason: 'Telegram flag tier', thresholds };
  }
  if (atWin.net < 0) {
    return { eligible: false, tier: 'blocked', reason: `loss at win price`, thresholds };
  }
  if (atWin.net < thresholds.flaggedNet) {
    return { eligible: false, tier: 'blocked', reason: `net £${atWin.net} < £${thresholds.flaggedNet}`, thresholds };
  }
  return {
    eligible: false,
    tier: 'blocked',
    reason: `${atWin.margin}% margin < ${thresholds.flaggedMargin}%`,
    thresholds,
  };
}

// ─── Step 8: Grade prices from V7 scraper ────────────────────────
let _scraperData = null;
function loadScraperData() {
  if (_scraperData) return _scraperData;
  try {
    _scraperData = JSON.parse(fs.readFileSync('/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json', 'utf8'));
  } catch { _scraperData = { models: {} }; }
  return _scraperData;
}

function getGradePricesForListing(listing) {
  const scraper = loadScraperData();
  const title = (listing.title || '').toLowerCase();
  const productId = listing.product_id;

  // Source 1: Try spec-specific match by product_id
  // If the V7 scraper has been run with expanded URLs, we'll find an exact match
  for (const [modelKey, modelData] of Object.entries(scraper.models)) {
    // Check if this model's UUID or any picker product_id matches our listing
    if (modelData.uuid === productId) {
      const grades = {};
      if (modelData.grades) {
        for (const [g, gd] of Object.entries(modelData.grades)) {
          if (gd.price) grades[g] = gd.price;
        }
      }
      if (Object.keys(grades).length > 0) {
        return { grades, source: 'spec-specific', modelKey };
      }
    }
    // Check colour/ram/ssd pickers for product_id match
    for (const pickerType of ['colour', 'ram', 'ssd', 'cpu_gpu']) {
      const picker = modelData[pickerType];
      if (picker) {
        for (const [, pv] of Object.entries(picker)) {
          if (pv.productId === productId) {
            const grades = {};
            if (modelData.grades) {
              for (const [g, gd] of Object.entries(modelData.grades)) {
                if (gd.price) grades[g] = gd.price;
              }
            }
            if (Object.keys(grades).length > 0) {
              return { grades, source: 'picker-match', modelKey };
            }
          }
        }
      }
    }
  }

  // Source 2: Fuzzy model-level match by title (approximate)
  for (const [modelKey, modelData] of Object.entries(scraper.models)) {
    const mkLower = modelKey.toLowerCase();
    const parts = mkLower.replace(/"/g, '').split(/\s+/);
    let matchCount = 0;
    for (const p of parts) {
      if (p.length >= 2 && title.includes(p)) matchCount++;
    }
    if (matchCount >= parts.length - 1 && matchCount >= 3) {
      const grades = {};
      if (modelData.grades) {
        for (const [g, gd] of Object.entries(modelData.grades)) {
          if (gd.price) grades[g] = gd.price;
        }
      }
      if (Object.keys(grades).length > 0) {
        return { grades, source: 'approximate (model-level)', modelKey };
      }
    }
  }
  return null;
}

// ─── Format card ──────────────────────────────────────────────────
function formatCard(listing, buyBox, costData, gradePrices, dateListed, gradeSource, realProf, variantCheck) {
  const r = n => typeof n === 'number' ? n.toFixed(2) : n;
  const lines = [];
  const currentPrice = parseFloat(listing.price);
  const daysListed = dateListed ? Math.floor((Date.now() - dateListed.getTime()) / (1000 * 60 * 60 * 24)) : null;

  // Market line (used in all card types)
  const marketLine = gradePrices
    ? `Market:  Fair £${gradePrices.Fair || 'N/A'} | Good £${gradePrices.Good || 'N/A'} | Excellent £${gradePrices.Excellent || 'N/A'}`
    : 'Market:  N/A';

  // ─── Card type: Winning ───
  if (buyBox.isWinning) {
    let netStr = 'N/A';
    let marginStr = 'N/A';
    if (costData?.totalFixedCost) {
      const atCurrent = calcProfit(currentPrice, costData.totalFixedCost, costData.purchasePrice);
      netStr = `£${r(atCurrent.net)}`;
      marginStr = `${atCurrent.margin}%`;
    }
    lines.push(`✅ Winning: ${listing.sku || listing.title}`);
    lines.push(`BM#: ${listing.listing_id} | Price: £${currentPrice.toFixed(0)} | Net: ${netStr} (${marginStr})`);
    lines.push(marketLine);

  // ─── Card type: Not winning ───
  } else if (buyBox.priceToWin) {
    let atWin = null;
    let atCurrent = null;
    let gate = null;
    let action = 'No change. Monitor.';

    if (costData?.totalFixedCost) {
      atCurrent = calcProfit(currentPrice, costData.totalFixedCost, costData.purchasePrice);
      atWin = calcProfit(buyBox.priceToWin, costData.totalFixedCost, costData.purchasePrice);
      gate = evaluateAutoBumpGate(atWin);
    }

    if (gate?.eligible) {
      // Bump eligible
      action = gate.tier === 'silent'
        ? 'Bump eligible (silent tier)'
        : 'Bump eligible (Telegram flag tier)';
      lines.push(`⚠️ Not winning: ${listing.sku || listing.title}`);
    } else {
      // Cannot win profitably
      lines.push(`🚫 Cannot win profitably: ${listing.sku || listing.title}`);
    }

    lines.push(`BM#: ${listing.listing_id} | Listed: ${daysListed != null ? `${daysListed} days` : 'N/A'}`);
    lines.push(`Our price: £${currentPrice.toFixed(0)} | Buy box: £${buyBox.priceToWin.toFixed(0)}`);
    lines.push('');
    lines.push(marketLine);

    if (gate?.eligible) {
      lines.push(`Net@win: £${r(atWin.net)} (${atWin.margin}%) | Net@current: £${r(atCurrent.net)} (${atCurrent.margin}%)`);
    } else if (atWin) {
      lines.push(`Net@win: £${r(atWin.net)} (${atWin.margin}%) — ${gate?.reason || 'below auto-bump gate'}`);
      if (costData?.totalFixedCost) {
        const be = calcProfit(0, costData.totalFixedCost, costData.purchasePrice);
        lines.push(`Break-even price: £${be.breakEven}`);
      } else {
        lines.push(`Break-even price: N/A`);
      }
    } else {
      lines.push(`Net@win: N/A (no cost data)`);
      lines.push(`Break-even price: N/A`);
    }

    lines.push('');
    lines.push(`Action: ${action}`);

  // ─── Card type: Error / no price-to-win ───
  } else {
    lines.push(`⚠️ ${listing.sku || listing.title}`);
    lines.push(`BM#: ${listing.listing_id} | Price: £${currentPrice.toFixed(0)}`);
    if (buyBox.error) {
      lines.push(`Buy box: Error — ${buyBox.error}`);
    } else {
      lines.push(`Buy box: No price-to-win data`);
    }
    lines.push(marketLine);
  }

  // ─── Statuses (for summary processing) ───
  const statuses = [];

  if (variantCheck && !variantCheck.ok) {
    statuses.push(`${variantCheck.autoOffline ? '⛔' : '⚠️'} Variant ${variantCheck.autoOffline ? 'mismatch' : 'alert'}: ${variantCheck.reason}`);
  } else if (variantCheck && !variantCheck.managed && variantCheck.advisoryReason) {
    statuses.push(`⚠️ Unmanaged listing: ${variantCheck.advisoryReason}`);
  }

  if (buyBox.error) {
    statuses.push('⚠️ API error');
  } else if (buyBox.isWinning) {
    statuses.push('✅ Winning');
  } else if (buyBox.priceToWin && costData?.totalFixedCost) {
    const atWin = calcProfit(buyBox.priceToWin, costData.totalFixedCost, costData.purchasePrice);
    const gate = evaluateAutoBumpGate(atWin);
    if (!gate.eligible) {
      statuses.push(`⛔ Cannot win profitably`);
    } else if (gate.tier === 'flagged') {
      statuses.push(`⚠️ Can win at ${atWin.margin}% margin`);
    } else {
      statuses.push(`✅ Can win at ${atWin.margin}% margin`);
    }
  } else if (!costData?.totalFixedCost) {
    statuses.push('⚠️ Missing cost data');
  }

  // Grade ladder
  if (gradePrices) {
    const gp = gradePrices;
    if (gp.Fair && gp.Good && gp.Excellent) {
      if (gp.Good >= gp.Excellent) statuses.push('⛔ Grade inversion: Good ≥ Excellent');
      if (gp.Fair >= gp.Good) statuses.push('⛔ Grade inversion: Fair ≥ Good');
    }
    if (gradeSource !== 'approximate (model-level)') {
      const bmGrade = listing.grade;
      const ourPrice = currentPrice;
      if (bmGrade === 'GOOD' && gp.Excellent && ourPrice > gp.Excellent) {
        statuses.push(`⛔ Won't sell: Good (£${ourPrice.toFixed(0)}) > Excellent (£${gp.Excellent})`);
      }
      if (bmGrade === 'FAIR' && gp.Good && ourPrice > gp.Good) {
        statuses.push(`⛔ Won't sell: Fair (£${ourPrice.toFixed(0)}) > Good (£${gp.Good})`);
      }
    }
  }

  // Age escalation
  if (daysListed != null) {
    if (daysListed >= 21 && !buyBox.isWinning) {
      statuses.push(`🔴 ${daysListed} days listed, consider delisting`);
    } else if (daysListed >= 15 && !buyBox.isWinning) {
      statuses.push(`⚠️ ${daysListed} days listed, drop to market if profitable`);
    } else if (daysListed >= 8 && !buyBox.isWinning) {
      statuses.push(`⚠️ ${daysListed} days listed`);
    }
  }

  return { lines: lines.join('\n'), statuses, buyBox, costData };
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(60));
  console.log(`  Buy Box Check — ${dryRun ? 'DRY RUN' : (autoBump ? 'AUTO-BUMP' : 'CHECK ONLY')}`);
  console.log(`  ${new Date().toISOString()}`);
  console.log('═'.repeat(60));
  if (useLegacyGates) {
    console.log('[LEGACY] using pre-Phase-0.2 thresholds');
  }

  // Step 1
  console.log('\nFetching active listings...');
  let listings = await getActiveListings();
  if (listingIdFilter) {
    listings = listings.filter(l => String(l.listing_id) === String(listingIdFilter));
    console.log(`  Filtered to listing_id ${listingIdFilter}`);
  }
  console.log(`  ${listings.length} active listings found\n`);

  if (listings.length === 0) {
    console.log('No active listings.');
    return;
  }

  const summary = {
    total: listings.length,
    winning: 0,
    losing: 0,
    bumped: 0,
    unprofitable: 0,
    inversions: 0,
    variantMismatch: 0,
    variantAlert: 0,
    missingCost: 0,
    stale: 0,
    errors: 0,
  };

  const allCards = [];
  const alerts = [];

  // ─── Live grade ladder scrape (per unique product_id) ──────────
  const liveScrapeCache = {};
  if (!noScrape) {
    const uniqueProductIds = [...new Set(listings.map(l => l.product_id).filter(Boolean))];
    if (uniqueProductIds.length > 0) {
      console.log(`\nScraping grade ladders for ${uniqueProductIds.length} unique product(s)...`);
      let batchSession = null;
      try {
        batchSession = await launchBatchBrowser();
        for (const pid of uniqueProductIds) {
          try {
            const result = await Promise.race([
              scrapeWithContext(batchSession.context, pid),
              new Promise((_, reject) => setTimeout(() => reject(new Error('scrape_timeout')), 15000)),
            ]);
            liveScrapeCache[pid] = result;
            console.log(`  ${pid}: ${result.ok ? `F:£${result.gradePrices?.Fair || '?'} G:£${result.gradePrices?.Good || '?'} E:£${result.gradePrices?.Excellent || '?'}` : `failed (${result.error})`}`);
          } catch (e) {
            liveScrapeCache[pid] = { ok: false, error: e.message, gradePrices: {} };
            console.log(`  ${pid}: scrape failed (${e.message})`);
          }
          await sleep(250); // 200-300ms delay between scrapes
        }
      } catch (e) {
        console.log(`  Browser launch failed: ${e.message}. Falling back to cached data.`);
      } finally {
        if (batchSession) await closeBatchBrowser(batchSession);
      }
      console.log(`  Scraped ${Object.keys(liveScrapeCache).length} product(s)\n`);
    }
  } else {
    console.log('\n--no-scrape: skipping product page scrapes\n');
  }

  for (const listing of listings) {
    const lid = listing.listing_id;

    // Step 2: Buy box
    const buyBox = await checkBuyBox(listing);
    await sleep(1500);

    if (buyBox.error) {
      summary.errors++;
      console.log(`${lid}: ⚠️ ${buyBox.error}`);
      continue;
    }

    if (buyBox.isWinning) summary.winning++;
    else summary.losing++;

    // Step 5: Cost data
    const costData = await getCostData(String(lid));
    if (!costData?.totalFixedCost) summary.missingCost++;

    // Main item context
    const mainContext = costData?.mainItemId
      ? await getMainItemContext(costData.mainItemId)
      : null;
    const dateListed = mainContext?.dateListed || null;

    // Step 8: Grade prices — prefer live scrape, fall back to stale file
    let gradePrices = null;
    let gradeSource = null;
    const liveScrape = liveScrapeCache[listing.product_id];
    if (liveScrape?.ok && Object.keys(liveScrape.gradePrices || {}).length > 0) {
      gradePrices = liveScrape.gradePrices;
      gradeSource = 'live product page scrape';
    } else {
      const gradeResult = getGradePricesForListing(listing);
      gradePrices = gradeResult?.grades || null;
      gradeSource = gradeResult?.source || null;
    }
    if (gradePrices) {
      const gp = gradePrices;
      if ((gp.Fair && gp.Good && gp.Fair >= gp.Good) || (gp.Good && gp.Excellent && gp.Good >= gp.Excellent)) {
        summary.inversions++;
      }
    }

    // Age check
    if (dateListed) {
      const days = Math.floor((Date.now() - dateListed.getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 21) summary.stale++;
    }

    // Live variant integrity verification
    const variantCheck = assessVariantIntegrity(listing, mainContext);
    let variantIssue = null;
    let offlinedForVariant = false;
    if (!variantCheck.ok) {
      const issuePrefix = variantCheck.autoOffline ? '⛔ VARIANT MISMATCH' : '⚠️ VARIANT ALERT';
      variantIssue = `${issuePrefix}: ${variantCheck.reason}`;
      if (variantCheck.autoOffline) {
        summary.variantMismatch++;
      } else {
        summary.variantAlert++;
      }

      if (dryRun && variantCheck.autoOffline) {
        variantIssue += ' → WOULD AUTO-OFFLINE';
        alerts.push(`⛔ WOULD AUTO-OFFLINE ${listing.sku}: ${variantCheck.reason}`);
      } else if (variantCheck.autoOffline) {
        try {
          await bmApi(`/ws/listings/${lid}`, { method: 'POST', body: { quantity: 0 } });
          offlinedForVariant = true;
          variantIssue += ' → AUTO-OFFLINED';
          alerts.push(`⛔ AUTO-OFFLINED ${listing.sku}: ${variantCheck.reason}`);
        } catch (e) {
          console.error(`  ❌ Failed to offline variant-mismatch listing ${lid}: ${e.message}`);
          alerts.push(`⛔ VARIANT MISMATCH ${listing.sku}: ${variantCheck.reason} (offline failed)`);
        }
      } else {
        variantIssue += ' → ALERT ONLY';
        alerts.push(`⚠️ ALERT ONLY ${listing.sku}: ${variantCheck.reason}`);
      }
    }

    // Step 9: Qty verification
    let qtyIssue = null;
    if (mainContext) {
      const statusText = mainContext.statusText || '';
      const statusIdx = mainContext.statusIdx;
      
      // Listed = 7, Sold = 10, Shipped = ?, Unlisted = 104
      if (statusIdx !== 7 && statusIdx !== undefined) {
        qtyIssue = `⛔ QTY MISMATCH: BM listing active (qty=${listing.quantity}) but Monday status="${statusText}" (not Listed). Oversell risk!`;
        summary.qtyMismatch = (summary.qtyMismatch || 0) + 1;
        // Auto-offline: set qty=0 to prevent oversell
        if (!offlinedForVariant) {
          if (dryRun) {
            qtyIssue += ' → WOULD AUTO-OFFLINE';
            alerts.push(`⛔ WOULD AUTO-OFFLINE ${listing.sku}: listing ${lid} active but Monday="${statusText}"`);
          } else {
            try {
              await bmApi(`/ws/listings/${lid}`, { method: 'POST', body: { quantity: 0 } });
              console.log(`  ⛔ AUTO-OFFLINE: listing ${lid} taken offline (Monday status="${statusText}")`);
              qtyIssue += ' → AUTO-OFFLINED';
              alerts.push(`⛔ AUTO-OFFLINED ${listing.sku}: listing ${lid} active but Monday="${statusText}"`);
            } catch (e) {
              console.error(`  ❌ Failed to offline listing ${lid}: ${e.message}`);
            }
          }
        } else {
          qtyIssue += ' → ALREADY OFFLINED';
        }
      }
    }

    // Real profitability lookup
    const realProf = lookupRealProfitability(listing);

    // Format card
    const card = formatCard(listing, buyBox, costData, gradePrices, dateListed, gradeSource, realProf, variantCheck);
    if (variantIssue) {
      card.lines += '\n         ' + variantIssue;
      card.statuses.push(variantIssue);
    }
    if (qtyIssue) {
      card.lines += '\n         ' + qtyIssue;
      card.statuses.push(qtyIssue);
    }
    allCards.push(card);
    console.log('\n' + card.lines + '\n');

    // Step 6: Auto-bump if enabled
    if (!dryRun && autoBump && variantCheck.ok && variantCheck.managed && !buyBox.isWinning && buyBox.priceToWin) {
      // Use real profitability data when available (more accurate than Monday's single-item costs)
      let marginSource = '';
      let atWin = null;

      if (realProf?.data && (realProf.data.hasCostData || realProf.data.sampleSize >= 3)) {
        // Real data: compute expected margin at win price using average costs from actual sales
        const rp = realProf.data;
        const realFixed = rp.avgPurchasePrice + rp.avgPartsCost + rp.avgLabourCost + 15 + (rp.avgPurchasePrice * 0.10);
        atWin = calcProfit(buyBox.priceToWin, realFixed, rp.avgPurchasePrice);
        marginSource = `real (${rp.costSampleSize || rp.sampleSize} sales)`;
      } else if (costData?.totalFixedCost) {
        // Fall back to Monday's per-item cost data
        atWin = calcProfit(buyBox.priceToWin, costData.totalFixedCost, costData.purchasePrice);
        marginSource = 'monday';
      }

      const gate = evaluateAutoBumpGate(atWin);

      if (gate.eligible) {
        const newMin = Math.ceil(buyBox.priceToWin * MIN_PRICE_FACTOR);
        const isFlagged = gate.tier === 'flagged';
        console.log(`  Bumping ${lid} to £${buyBox.priceToWin} / min £${newMin} (${atWin.margin}% margin, net £${atWin.net} via ${marginSource})...`);
        try {
          await bmApi(`/ws/listings/${lid}`, {
            method: 'POST',
            body: { price: buyBox.priceToWin, min_price: newMin, pub_state: 2, currency: 'GBP' },
          });
          // Verify
          await sleep(1000);
          const v = await bmApi(`/ws/listings/${lid}`);
          if (parseFloat(v.price) === buyBox.priceToWin) {
            console.log(`  ✅ Bumped to £${buyBox.priceToWin}`);
            summary.bumped++;
            if (isFlagged) {
              alerts.push(`⚠️ ${listing.sku}: bumped to £${buyBox.priceToWin} (${atWin.margin}% margin, net £${atWin.net}) — low margin flag`);
            }
          } else {
            console.log(`  ⚠️ Bump verification failed`);
          }
        } catch (e) {
          console.log(`  ❌ Bump failed: ${e.message}`);
        }
      } else if (atWin && atWin.net < 0) {
        summary.unprofitable++;
        alerts.push(`⛔ ${listing.sku}: loss at win price £${buyBox.priceToWin} (${marginSource})`);
      } else if (atWin && atWin.net < gate.thresholds.flaggedNet) {
        summary.unprofitable++;
        alerts.push(`⛔ ${listing.sku}: net £${atWin.net} < £${gate.thresholds.flaggedNet} at win price £${buyBox.priceToWin} (${marginSource})`);
      } else if (atWin) {
        summary.unprofitable++;
        alerts.push(`⛔ ${listing.sku}: ${atWin.margin}% margin < ${gate.thresholds.flaggedMargin}% at win price £${buyBox.priceToWin} (${marginSource})`);
      } else {
        // No cost data from either source — don't bump
        console.log(`  ⚠️ ${lid}: no cost data, skipping bump`);
      }
    }

    await sleep(500);
  }

  // ─── Step 10: Report ────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Active:      ${summary.total}`);
  console.log(`  Winning:     ${summary.winning}`);
  console.log(`  Losing:      ${summary.losing}`);
  console.log(`  Bumped:      ${summary.bumped}`);
  console.log(`  Unprofitable:${summary.unprofitable}`);
  console.log(`  Inversions:  ${summary.inversions}`);
  console.log(`  Variant mm:  ${summary.variantMismatch}`);
  console.log(`  Variant alt: ${summary.variantAlert}`);
  console.log(`  Missing cost:${summary.missingCost}`);
  console.log(`  Stale (21d+):${summary.stale}`);
  console.log(`  Qty mismatch:${summary.qtyMismatch || 0}`);
  console.log(`  API errors:  ${summary.errors}`);

  // ─── Profitability comparison summary ────────────────────────────
  if (parallelCompare) {
    const lookup = loadProfitabilityLookup();
    if (Object.keys(lookup).length > 0) {
      console.log('\n' + '═'.repeat(60));
      console.log('  REAL vs ESTIMATED PROFITABILITY');
      console.log('═'.repeat(60));

      let usingReal = 0, usingEstimate = 0;
      const diffs = [];

      for (const card of allCards) {
        // Card has realProf info encoded in its lines
        if (card.lines.includes('[') && card.lines.includes('sales]')) usingReal++;
        else if (card.lines.includes('ESTIMATE')) usingEstimate++;
      }

      console.log(`  Listings with real data:  ${usingReal}`);
      console.log(`  Listings using estimates: ${usingEstimate}`);
      console.log(`  Total checked:            ${allCards.length}`);
      console.log('\n  Run buyback-profitability-builder.js --compare for detailed model-level analysis');
    }
  }

  // ─── Telegram report ──────────────────────────────────────────
  const tgLines = [
    `📊 Buy Box Check — ${new Date().toISOString().slice(0, 10)}`,
    `${autoBump ? '🔄 AUTO-BUMP' : '👁 CHECK ONLY'}`,
    ``,
    `Active: ${summary.total} | Win: ${summary.winning} | Lose: ${summary.losing}`,
  ];
  if (summary.bumped > 0) tgLines.push(`✅ Bumped: ${summary.bumped}`);
  if (summary.unprofitable > 0) tgLines.push(`⛔ Unprofitable: ${summary.unprofitable}`);
  if (summary.inversions > 0) tgLines.push(`⛔ Grade inversions: ${summary.inversions}`);
  if (summary.variantMismatch > 0) tgLines.push(`⛔ Variant mismatches: ${summary.variantMismatch}`);
  if (summary.variantAlert > 0) tgLines.push(`⚠️ Variant alerts (unmanaged): ${summary.variantAlert}`);
  if (summary.missingCost > 0) tgLines.push(`⚠️ Missing cost data: ${summary.missingCost}`);
  if ((summary.qtyMismatch || 0) > 0) tgLines.push(`⛔ Qty mismatch (offlined): ${summary.qtyMismatch}`);
  if (summary.stale > 0) tgLines.push(`🔴 Stale 21d+: ${summary.stale}`);
  if (summary.errors > 0) tgLines.push(`⚠️ API errors: ${summary.errors}`);
  if (alerts.length > 0) {
    tgLines.push(``);
    tgLines.push(`Alerts:`);
    for (const a of alerts.slice(0, 10)) tgLines.push(a); // Cap at 10 to avoid message length limit
    if (alerts.length > 10) tgLines.push(`... +${alerts.length - 10} more`);
  }
  await postTelegram(tgLines.join('\n'));

  // Save results
  const outDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `buy-box-check-${new Date().toISOString().slice(0, 10)}.txt`);
  const fullReport = allCards.map(c => c.lines).join('\n\n' + '─'.repeat(40) + '\n\n');
  fs.writeFileSync(outFile, fullReport);
  console.log(`\nFull report saved to ${outFile}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  assessVariantIntegrity,
  loadResolverRegistry,
  main,
};
