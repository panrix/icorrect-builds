#!/usr/bin/env node
/**
 * buyback-profitability-builder.js
 *
 * Builds a real-data profitability lookup JSON for buyback bid analysis.
 *
 * Data sources:
 *   1. BM completed orders API (/ws/orders?state=9) — actual sell prices
 *   2. Monday Main Board (lookup_mkx1xzd7) — actual parts costs per device (mirror column)
 *   3. Monday Main Board (formula_mkx1bjqr) — actual labour cost per device
 *   4. BM Devices Board (text_mkyd4bx3 listing ID + board_relation) — links orders to Monday items
 *
 * Output: data/buyback-profitability-lookup.json
 *   Keyed by normalised model+grade. Each entry has:
 *     - avgSellPrice, minSellPrice, maxSellPrice
 *     - avgPartsCost, avgLabourCost
 *     - avgProfit, avgMargin
 *     - sampleSize
 *     - orders (detail array)
 *
 * Usage:
 *   node buyback-profitability-builder.js              # Build lookup
 *   node buyback-profitability-builder.js --compare     # Build + compare vs flat estimates
 *   node buyback-profitability-builder.js --dry-run     # Show what would be fetched
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });
const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────
const BM_BASE = 'https://www.backmarket.co.uk';
const BM_AUTH = process.env.BACKMARKET_API_AUTH;
const BM_LANG = process.env.BACKMARKET_API_LANG || 'en-gb';
const BM_UA = process.env.BACKMARKET_API_UA;
const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN;

const BM_DEVICES_BOARD = 3892194968;
const MAIN_BOARD = 349212843;

// Cost constants (from SOP 06 / Master doc section 6)
const LABOUR_RATE = 24;         // £24/hr loaded rate
const SHIPPING_COST = 15;       // £15 flat
const BM_BUY_FEE_RATE = 0.10;  // 10% of purchase
const BM_SELL_FEE_RATE = 0.10;  // 10% of sell
const VAT_RATE = 0.1667;        // 16.67% margin scheme

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'buyback-profitability-lookup.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const COMPARE = args.includes('--compare');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── API helpers ──────────────────────────────────────────────────
async function bmApi(urlPath, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch(BM_BASE + urlPath, {
        headers: {
          Authorization: BM_AUTH,
          'Accept-Language': BM_LANG,
          'User-Agent': BM_UA,
        },
      });
      const text = await r.text();
      // HTML response = rate limited
      if (text.startsWith('<') || text.startsWith('<!')) {
        console.warn(`  BM returned HTML for ${urlPath} (rate limited), attempt ${attempt + 1}`);
        if (attempt < retries) { await sleep(5000); continue; }
        throw new Error(`BM rate limited on ${urlPath}`);
      }
      if (!r.ok) throw new Error(`BM ${r.status}: ${text.slice(0, 200)}`);
      return JSON.parse(text);
    } catch (e) {
      if (attempt < retries) { await sleep(2000); continue; }
      throw e;
    }
  }
}

async function mondayApi(query, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          Authorization: MONDAY_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      const data = await r.json();
      if (data.errors) {
        const msg = data.errors.map(e => e.message).join('; ');
        // Rate limit: wait and retry
        if (msg.includes('rate') || msg.includes('limit') || msg.includes('complexity')) {
          console.warn(`  Monday rate limit, waiting 10s...`);
          await sleep(10000);
          if (attempt < retries) continue;
        }
        throw new Error(`Monday API error: ${msg}`);
      }
      return data;
    } catch (e) {
      if (attempt < retries) { await sleep(2000); continue; }
      throw e;
    }
  }
}

// ─── Step 1: Fetch all completed orders from BM ──────────────────
async function fetchCompletedOrders() {
  console.log('Step 1: Fetching completed orders from BM (state=9)...');
  const allOrders = [];
  let page = 1;

  while (true) {
    const data = await bmApi(`/ws/orders?state=9&page=${page}&page_size=100`);
    const orders = data.results || [];
    if (orders.length === 0) break;

    for (const order of orders) {
      // Each order has orderlines with listing details
      for (const line of (order.orderlines || [])) {
        // listing_id can be in multiple places depending on BM API version
        const listingId = line.listing_id || line.listing || line.id;
        // Price may be nested or flat
        const price = parseFloat(line.price || line.unit_price || line.product_price || 0);

        allOrders.push({
          orderId: order.order_id,
          orderDate: order.date_creation,
          listingId,
          listingIdStr: String(listingId),
          productId: line.product_id,
          title: line.title || (typeof line.product === 'string' ? line.product : line.product?.title) || order.title || '',
          price,
          quantity: parseInt(line.quantity || 1, 10),
          grade: line.grade || '',
          sku: line.sku || '',
        });
      }
    }

    console.log(`  Page ${page}: ${orders.length} orders (${allOrders.length} lines total)`);
    if (!data.next) break;
    page++;
    await sleep(500);
  }

  console.log(`  Total completed order lines: ${allOrders.length}`);

  // Debug: log sample listing IDs to help diagnose format mismatches
  if (allOrders.length > 0) {
    const sampleIds = allOrders.slice(0, 5).map(o => `${o.listingId} (type: ${typeof o.listingId})`);
    console.log(`  Sample listing IDs from BM: ${sampleIds.join(', ')}`);
  }

  return allOrders;
}

// ─── Step 2: Match orders to Monday items via BM Devices Board ───
async function matchOrdersToMonday(orderLines) {
  console.log('\nStep 2: Matching orders to Monday items via BM Devices Board...');

  // Get unique listing IDs — try both raw and string forms
  const rawIds = orderLines.map(o => o.listingId).filter(Boolean);
  const listingIds = [...new Set(rawIds.map(id => String(id).trim()))];
  console.log(`  Unique listing IDs to match: ${listingIds.length}`);

  // Batch query Monday for listing IDs — BM Devices Board stores listing_id in text_mkyd4bx3
  // Also read the item name (= device model) so we don't depend on order title
  const listingToDevice = {};
  let matchedCount = 0;

  for (let i = 0; i < listingIds.length; i++) {
    const lid = listingIds[i];
    if (i > 0 && i % 50 === 0) {
      console.log(`  Querying Monday... ${i}/${listingIds.length} (matched: ${matchedCount})`);
    }

    // Try exact match first, then try without leading zeros
    const variants = [lid];
    const trimmed = lid.replace(/^0+/, '');
    if (trimmed !== lid) variants.push(trimmed);

    for (const searchId of variants) {
      const q = `{ boards(ids:[${BM_DEVICES_BOARD}]) { items_page(limit: 10, query_params: { rules: [{ column_id: "text_mkyd4bx3", compare_value: ["${searchId}"] }] }) { items { id name column_values(ids: ["lookup", "text_mkyd4bx3", "numeric", "board_relation", "color_mm1fj7tb"]) { id text ... on MirrorValue { display_value } ... on BoardRelationValue { linked_item_ids } } } } } }`;
      try {
        const d = await mondayApi(q);
        const items = d.data?.boards?.[0]?.items_page?.items || [];
        if (items.length > 0) {
          const item = items[0];
          let purchasePrice = 0, mainItemId = null, tradeInGrade = '', deviceName = '';
          for (const cv of item.column_values) {
            if (cv.id === 'lookup') deviceName = cv.display_value || '';
            if (cv.id === 'numeric') purchasePrice = parseFloat(cv.text) || 0;
            if (cv.id === 'board_relation' && cv.linked_item_ids?.length > 0) {
              mainItemId = cv.linked_item_ids[0];
            }
            if (cv.id === 'color_mm1fj7tb') tradeInGrade = cv.text || '';
          }
          // Store under the original listing ID so order matching works
          // deviceName from lookup mirror column; empty string if not available (old items)
          listingToDevice[lid] = {
            bmDeviceId: item.id,
            bmDeviceName: deviceName,  // Actual device model from lookup mirror column (may be empty)
            purchasePrice,
            mainItemId,
            tradeInGrade,
            matchedVia: searchId !== lid ? `trimmed:${searchId}` : 'exact',
          };
          matchedCount++;
          break; // Don't try other variants
        }
      } catch (e) {
        console.warn(`    Failed to query listing ${searchId}: ${e.message}`);
      }
      await sleep(300); // Monday rate limiting
    }
  }

  console.log(`  Matched ${matchedCount}/${listingIds.length} listing IDs to Monday items`);
  if (matchedCount < listingIds.length * 0.5) {
    // Low match rate — dump some unmatched IDs for debugging
    const unmatched = listingIds.filter(id => !listingToDevice[id]).slice(0, 10);
    console.warn(`  ⚠️ Low match rate (${Math.round(matchedCount / listingIds.length * 100)}%). Sample unmatched IDs: ${unmatched.join(', ')}`);
    console.warn(`  Check: does text_mkyd4bx3 on BM Devices Board use the same ID format?`);
  }
  return listingToDevice;
}

/**
 * Parse a Monday formula column value.
 * Monday returns formula values as strings that may include:
 *   - Currency symbols: "£42.50", "$100"
 *   - Comma thousands: "1,234.56"
 *   - Whitespace or empty string
 *   - Plain numbers: "42.5"
 *   - Display text like "0" or ""
 * Returns a numeric value or 0.
 */
function parseFormulaValue(text) {
  if (!text || typeof text !== 'string') return 0;
  // Strip currency symbols, commas, whitespace
  const cleaned = text.replace(/[£$€,\s]/g, '').trim();
  if (cleaned === '' || cleaned === '-') return 0;
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

/**
 * Parse a mirror column display_value that contains comma-separated part costs.
 * e.g. "18, 7, 11, 8, 29, 55, 47.0" → 175
 * Splits by comma, parseFloat each, sums for total.
 */
function parseMirrorPartsCost(text) {
  if (!text || typeof text !== 'string') return 0;
  const parts = text.split(',');
  let sum = 0;
  for (const p of parts) {
    const val = parseFloat(p.trim());
    if (!isNaN(val)) sum += val;
  }
  return sum;
}

// ─── Step 3: Fetch parts cost + labour hours from Main Board ─────
async function fetchCostData(listingToDevice) {
  console.log('\nStep 3: Fetching parts cost + labour hours from Main Board...');

  const mainItemIds = [...new Set(
    Object.values(listingToDevice).map(d => d.mainItemId).filter(Boolean)
  )];
  console.log(`  Main Board items to query: ${mainItemIds.length}`);

  const mainItemData = {};
  const BATCH_SIZE = 25;
  let zeroParts = 0, zeroLabour = 0;

  for (let i = 0; i < mainItemIds.length; i += BATCH_SIZE) {
    const batch = mainItemIds.slice(i, i + BATCH_SIZE);
    const ids = batch.join(',');
    console.log(`  Querying Main Board batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(mainItemIds.length / BATCH_SIZE)}...`);

    // Use MirrorValue for parts cost, FormulaValue for labour cost, StatusValue for grade
    const q = `{ items(ids:[${ids}]) { id name column_values(ids: ["lookup_mkx1xzd7", "formula_mkx1bjqr", "status_2_Mjj4GJNQ"]) { id text ... on MirrorValue { display_value } ... on FormulaValue { display_value } ... on StatusValue { text } } } }`;
    try {
      const d = await mondayApi(q);
      const items = d.data?.items || [];
      for (const item of items) {
        let partsCost = 0, labourCost = 0, finalGrade = '';
        let partsRaw = '', labourRaw = '';
        for (const cv of item.column_values) {
          // display_value comes from FormulaValue fragment; fall back to text
          const val = cv.display_value || cv.text || '';
          if (cv.id === 'lookup_mkx1xzd7') {
            partsRaw = val;
            partsCost = parseMirrorPartsCost(val);
          }
          if (cv.id === 'formula_mkx1bjqr') {
            labourRaw = val;
            labourCost = parseFormulaValue(val);
          }
          if (cv.id === 'status_2_Mjj4GJNQ') {
            // Final Grade: Fair/Good/Excellent. Map Excellent → VERY_GOOD for BM consistency.
            const raw = (cv.text || '').trim();
            finalGrade = raw.toUpperCase() === 'EXCELLENT' ? 'VERY_GOOD' : raw.toUpperCase();
          }
        }
        if (partsCost === 0) zeroParts++;
        if (labourCost === 0) zeroLabour++;
        mainItemData[item.id] = {
          name: item.name,
          partsCost,
          labourCost,
          finalGrade,
          _partsRaw: partsRaw,
          _labourRaw: labourRaw,
        };
      }
    } catch (e) {
      console.warn(`    Failed to query Main Board batch: ${e.message}`);
    }
    await sleep(500);
  }

  console.log(`  Got cost data for ${Object.keys(mainItemData).length}/${mainItemIds.length} Main Board items`);
  if (zeroParts > 0 || zeroLabour > 0) {
    console.log(`  ⚠️ Zero values: parts=£0 on ${zeroParts} items, labour=£0 on ${zeroLabour} items`);
    // Show a few raw values to help debug formula parsing
    const samples = Object.values(mainItemData).filter(d => d.partsCost === 0 && d._partsRaw).slice(0, 3);
    if (samples.length > 0) {
      console.log(`  Sample raw formula values (parts): ${samples.map(s => `"${s._partsRaw}"`).join(', ')}`);
    }
    const labSamples = Object.values(mainItemData).filter(d => d.labourCost === 0 && d._labourRaw).slice(0, 3);
    if (labSamples.length > 0) {
      console.log(`  Sample raw formula values (labour): ${labSamples.map(s => `"${s._labourRaw}"`).join(', ')}`);
    }
  }
  return mainItemData;
}

// ─── Step 4: Normalise model name from listing title ─────────────
function normaliseModel(title) {
  if (!title) return 'unknown';

  // Normalise common patterns
  let t = title
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, ' ')
    .trim();

  // Extract key identifiers: model family, size, year, chip
  // iPhones: "iPhone 15 Pro Max 256 GB Black Unlocked" → "iPhone 15 Pro Max"
  // iPads: "iPad Pro 11 3rd Gen (2021) 128 GB Space Gray WiFi" → "iPad Pro 11 2021"
  // MacBooks: "MacBook Pro 13-inch (2020) M1 16GB RAM SSD 512GB" → "MacBook Pro 13 2020 M1"

  // Remove storage/RAM/colour details for grouping
  let model = t
    .replace(/\b\d+\s*GB\s*(RAM|SSD|HDD)\b/gi, '')
    .replace(/\bSSD\s*\d+\s*GB\b/gi, '')
    .replace(/\bRAM\s*\d+\s*GB\b/gi, '')
    .replace(/\b\d+\s*GB\b/g, '')  // remaining GB references (storage)
    .replace(/\b\d+\s*TB\b/gi, '')
    .replace(/\bunlocked\b/gi, '')
    .replace(/\bwifi\b/gi, '')
    .replace(/\bwi-fi\b/gi, '')
    .replace(/\b5g\b/gi, '')
    .replace(/\blte\b/gi, '')
    .replace(/\(.*?gen\)/gi, '')
    .replace(/\b(space\s*gray|silver|gold|midnight|starlight|black|white|blue|green|pink|red|purple|yellow|graphite|sierra\s*blue|alpine\s*green|deep\s*purple|coral|teal|ultramarine|natural\s*titanium|blue\s*titanium|white\s*titanium|black\s*titanium|desert\s*titanium|space\s*black)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove trailing hyphens and clean up
  model = model.replace(/\s*-\s*$/, '').replace(/\s+-\s+/g, ' ').trim();

  return model || 'unknown';
}

// ─── Step 5: Build profitability lookup ──────────────────────────
function buildLookup(orderLines, listingToDevice, mainItemData) {
  console.log('\nStep 4: Building profitability lookup...');

  const lookup = {};
  let matched = 0, unmatched = 0, noCost = 0;

  for (const order of orderLines) {
    const lid = String(order.listingId);
    const device = listingToDevice[lid];

    if (!device) {
      unmatched++;
      continue;
    }

    const mainData = device.mainItemId ? mainItemData[device.mainItemId] : null;

    // Use actual device name from lookup mirror column (e.g. "MacBook Pro 14 M1 Pro/Max A2442")
    // Falls back to order title if lookup column was empty/NULL (old items pre ~BM 847)
    const modelSource = device.bmDeviceName || order.title;
    const model = normaliseModel(modelSource);

    // Grade: use Final Grade from Main Board (status_2_Mjj4GJNQ), mapped for BM consistency
    const grade = mainData?.finalGrade || 'UNKNOWN';
    const key = `${model}|${grade}`;

    const purchasePrice = device.purchasePrice || 0;
    const partsCost = mainData?.partsCost || 0;
    const labourCost = mainData?.labourCost || 0;
    const sellPrice = order.price;

    if (!mainData) {
      noCost++;
    }

    // Calculate profitability for this order
    const bmBuyFee = purchasePrice * BM_BUY_FEE_RATE;
    const totalFixed = purchasePrice + partsCost + labourCost + SHIPPING_COST + bmBuyFee;
    const bmSellFee = sellPrice * BM_SELL_FEE_RATE;
    const vat = Math.max(0, (sellPrice - purchasePrice) * VAT_RATE);
    const totalCosts = totalFixed + bmSellFee + vat;
    const netProfit = sellPrice - totalCosts;
    const margin = sellPrice > 0 ? (netProfit / sellPrice) * 100 : 0;

    if (!lookup[key]) {
      lookup[key] = {
        model,
        grade,
        sellPrices: [],
        partsCosts: [],
        labourCosts: [],
        purchasePrices: [],
        netProfits: [],
        margins: [],
        orders: [],
      };
    }

    lookup[key].sellPrices.push(sellPrice);
    lookup[key].partsCosts.push(partsCost);
    lookup[key].labourCosts.push(labourCost);
    lookup[key].purchasePrices.push(purchasePrice);
    lookup[key].netProfits.push(netProfit);
    lookup[key].margins.push(margin);
    lookup[key].orders.push({
      orderId: order.orderId,
      orderDate: order.orderDate,
      listingId: order.listingId,
      sellPrice,
      purchasePrice,
      partsCost,
      labourCost,
      totalFixed: Math.round(totalFixed * 100) / 100,
      bmSellFee: Math.round(bmSellFee * 100) / 100,
      vat: Math.round(vat * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      hasCostData: !!mainData,
      modelSource: device.bmDeviceName ? 'monday' : 'order',
      bmDeviceName: device.bmDeviceName || null,
    });

    matched++;
  }

  console.log(`  Matched: ${matched}, Unmatched: ${unmatched}, No cost data: ${noCost}`);

  // Compute averages
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const round2 = n => Math.round(n * 100) / 100;

  const result = {};
  for (const [key, data] of Object.entries(lookup)) {
    result[key] = {
      model: data.model,
      grade: data.grade,
      sampleSize: data.orders.length,
      avgSellPrice: round2(avg(data.sellPrices)),
      minSellPrice: round2(Math.min(...data.sellPrices)),
      maxSellPrice: round2(Math.max(...data.sellPrices)),
      avgPurchasePrice: round2(avg(data.purchasePrices)),
      avgPartsCost: round2(avg(data.partsCosts)),
      avgLabourCost: round2(avg(data.labourCosts)),
      avgNetProfit: round2(avg(data.netProfits)),
      avgMargin: round2(avg(data.margins)),
      orders: data.orders,
    };
  }

  return result;
}

// ─── Step 6: Flat estimate comparison ────────────────────────────
// Hugo's current flat estimates (from SOP / master doc context)
const FLAT_ESTIMATES = {
  partsCost: 25,       // Flat estimated parts
  labourCost: 24,      // Flat estimated labour cost
  shipping: 15,        // Same as real
};

function compareRealVsEstimated(lookup) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  REAL vs ESTIMATED COMPARISON');
  console.log('═══════════════════════════════════════════════════════\n');

  const rows = [];

  for (const [key, data] of Object.entries(lookup)) {
    if (data.sampleSize < 1) continue;

    // Estimated profit using flat assumptions
    const estPartsCost = FLAT_ESTIMATES.partsCost;
    const estLabourCost = FLAT_ESTIMATES.labourCost;

    // Real averages
    const realPartsCost = data.avgPartsCost;
    const realLabourCost = data.avgLabourCost;

    // Deltas
    const partsDelta = realPartsCost - estPartsCost;
    const labourDelta = realLabourCost - estLabourCost;
    const totalDelta = partsDelta + labourDelta;

    rows.push({
      key,
      model: data.model,
      grade: data.grade,
      n: data.sampleSize,
      avgSell: data.avgSellPrice,
      realParts: realPartsCost,
      estParts: estPartsCost,
      partsDelta,
      realLabour: realLabourCost,
      estLabour: estLabourCost,
      labourDelta,
      totalDelta,
      realMargin: data.avgMargin,
    });
  }

  // Sort by absolute delta (biggest discrepancy first)
  rows.sort((a, b) => Math.abs(b.totalDelta) - Math.abs(a.totalDelta));

  console.log(`${'Model+Grade'.padEnd(45)} ${'N'.padStart(3)} ${'AvgSell'.padStart(8)} ${'RealParts'.padStart(10)} ${'EstParts'.padStart(9)} ${'Delta'.padStart(7)} ${'RealLab'.padStart(8)} ${'EstLab'.padStart(7)} ${'Delta'.padStart(7)} ${'TotDelta'.padStart(9)} ${'Margin%'.padStart(8)}`);
  console.log('─'.repeat(130));

  for (const r of rows) {
    const label = `${r.model} | ${r.grade}`.slice(0, 44).padEnd(45);
    const partsDeltaSign = r.partsDelta >= 0 ? '+' : '';
    const labourDeltaSign = r.labourDelta >= 0 ? '+' : '';
    const totalDeltaSign = r.totalDelta >= 0 ? '+' : '';
    const flag = Math.abs(r.totalDelta) > 30 ? ' ⚠️' : '';

    console.log(
      `${label} ${String(r.n).padStart(3)} ` +
      `£${r.avgSell.toFixed(0).padStart(6)} ` +
      `£${r.realParts.toFixed(0).padStart(8)} ` +
      `£${r.estParts.toFixed(0).padStart(7)} ` +
      `${partsDeltaSign}£${r.partsDelta.toFixed(0).padStart(5)} ` +
      `£${r.realLabour.toFixed(0).padStart(6)} ` +
      `£${r.estLabour.toFixed(0).padStart(5)} ` +
      `${labourDeltaSign}£${r.labourDelta.toFixed(0).padStart(5)} ` +
      `${totalDeltaSign}£${r.totalDelta.toFixed(0).padStart(7)} ` +
      `${r.realMargin.toFixed(1).padStart(6)}%${flag}`
    );
  }

  console.log('\n─'.repeat(130));

  // Summary stats
  const withData = rows.filter(r => r.n >= 2);
  const overEstimated = rows.filter(r => r.totalDelta < -10);
  const underEstimated = rows.filter(r => r.totalDelta > 10);

  console.log(`\nModels with ≥2 sales:          ${withData.length}`);
  console.log(`Costs OVER-estimated (>£10):   ${overEstimated.length} (flat estimates too high → real profit is BETTER)`);
  console.log(`Costs UNDER-estimated (>£10):  ${underEstimated.length} (flat estimates too low → real profit is WORSE)`);

  if (underEstimated.length > 0) {
    console.log('\n⚠️  Models where REAL costs exceed estimates significantly:');
    for (const r of underEstimated.slice(0, 10)) {
      console.log(`    ${r.model} | ${r.grade}: real costs +£${r.totalDelta.toFixed(0)} vs estimate (parts: £${r.realParts.toFixed(0)} vs £${r.estParts}, labour: £${r.realLabour.toFixed(0)} vs £${r.estLabour})`);
    }
  }

  return rows;
}

// ─── Main ─────────────────────────────────────────────────────────
(async () => {
  console.log('═'.repeat(60));
  console.log('  Buyback Profitability Builder');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  if (!BM_AUTH) {
    console.error('Missing BACKMARKET_API_AUTH env var');
    process.exit(1);
  }
  if (!MONDAY_TOKEN) {
    console.error('Missing MONDAY_APP_TOKEN env var');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('\n--- DRY RUN ---');
    console.log('Would fetch:');
    console.log('  1. All completed BM orders (GET /ws/orders?state=9)');
    console.log('  2. Match listing IDs to BM Devices Board (text_mkyd4bx3)');
    console.log('  3. Follow board_relation to Main Board items');
    console.log('  4. Read lookup_mkx1xzd7 (parts cost, mirror) + formula_mkx1bjqr (labour cost)');
    console.log('  5. Build lookup JSON by model+grade');
    console.log(`\nOutput: ${OUTPUT_FILE}`);
    process.exit(0);
  }

  // Step 1: Fetch completed orders
  const orderLines = await fetchCompletedOrders();
  if (orderLines.length === 0) {
    console.log('\nNo completed orders found. Nothing to build.');
    process.exit(0);
  }

  // Step 2: Match to Monday via BM Devices Board
  const listingToDevice = await matchOrdersToMonday(orderLines);

  // Step 3: Fetch cost data from Main Board
  const mainItemData = await fetchCostData(listingToDevice);

  // Step 4: Build lookup
  const lookup = buildLookup(orderLines, listingToDevice, mainItemData);

  // Save output
  const output = {
    built_at: new Date().toISOString(),
    constants: {
      labour_rate_per_hour: LABOUR_RATE,
      shipping_flat: SHIPPING_COST,
      bm_buy_fee_rate: BM_BUY_FEE_RATE,
      bm_sell_fee_rate: BM_SELL_FEE_RATE,
      vat_margin_scheme_rate: VAT_RATE,
    },
    summary: {
      total_model_grades: Object.keys(lookup).length,
      total_orders_matched: Object.values(lookup).reduce((s, d) => s + d.sampleSize, 0),
    },
    lookup,
  };

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nSaved: ${OUTPUT_FILE}`);

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  LOOKUP SUMMARY');
  console.log('═══════════════════════════════════════════════════════');

  const sorted = Object.entries(lookup).sort((a, b) => b[1].sampleSize - a[1].sampleSize);
  console.log(`\n${'Model+Grade'.padEnd(45)} ${'N'.padStart(3)} ${'AvgSell'.padStart(8)} ${'AvgParts'.padStart(9)} ${'AvgLabour'.padStart(9)} ${'AvgProfit'.padStart(9)} ${'Margin%'.padStart(8)}`);
  console.log('─'.repeat(95));

  for (const [, data] of sorted) {
    const label = `${data.model} | ${data.grade}`.slice(0, 44).padEnd(45);
    const profitSign = data.avgNetProfit >= 0 ? '' : '';
    console.log(
      `${label} ${String(data.sampleSize).padStart(3)} ` +
      `£${data.avgSellPrice.toFixed(0).padStart(6)} ` +
      `£${data.avgPartsCost.toFixed(0).padStart(7)} ` +
      `£${data.avgLabourCost.toFixed(0).padStart(7)} ` +
      `${profitSign}£${data.avgNetProfit.toFixed(0).padStart(7)} ` +
      `${data.avgMargin.toFixed(1).padStart(6)}%`
    );
  }

  // Step 5: Comparison mode
  if (COMPARE) {
    compareRealVsEstimated(lookup);
  }

  console.log('\nDone.');
})().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
