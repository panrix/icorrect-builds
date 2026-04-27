#!/usr/bin/env node
/*
 * V0 Parts Stock Check
 *
 * Usage:
 *   node tools/repair-stock-check.js "iPhone 15 Pro" "Screen"
 *   node tools/repair-stock-check.js "MacBook Pro 15 A1398" "Battery"
 *
 * Reads MONDAY_APP_TOKEN from environment, or from the existing
 * icorrect-parts-service .env as a convenience for local ops use.
 *
 * This is read-only. It does not reserve or deduct stock.
 *
 * The shared stock-check logic lives in tools/lib/stock-check-core.js
 * and is also used by the Monday webhook service at
 * monday/services/repair-stock-check/.
 */

const fs = require('fs');
const path = require('path');

const {
  BOARDS,
  COLUMNS,
  makeMondayClient,
  parseLinkedIds,
  col,
  partSummary,
  fetchPartsByIds,
  checkStockForProductIds,
} = require('./lib/stock-check-core');

const ENV_FALLBACK_PATHS = [
  '/home/ricky/config/.env',
  '/home/ricky/builds/icorrect-parts-service/.env',
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function getToken() {
  if (!process.env.MONDAY_APP_TOKEN && !process.env.MONDAY_API_TOKEN) {
    for (const filePath of ENV_FALLBACK_PATHS) loadEnvFile(filePath);
  }
  const token = process.env.MONDAY_APP_TOKEN || process.env.MONDAY_API_TOKEN;
  if (!token) {
    throw new Error(`MONDAY_APP_TOKEN not set and not found in: ${ENV_FALLBACK_PATHS.join(', ')}`);
  }
  return token;
}

function normalise(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[()"']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function significantTokens(text) {
  const stop = new Set(['the', 'for', 'and', 'repair', 'replacement', 'genuine', 'oem', 'copy', 'new']);
  return normalise(text)
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !stop.has(t));
}

function scorePart(partName, device, repair) {
  const hayNorm = normalise(partName);
  const deviceNorm = normalise(device);
  const repairNorm = normalise(repair);
  const hay = ` ${hayNorm} `;
  const deviceTokens = significantTokens(device);
  const repairTokens = significantTokens(repair);

  const categoryTokens = ['iphone', 'ipad', 'macbook', 'watch'];
  const deviceCategory = categoryTokens.find((token) => deviceNorm.includes(token));
  if (deviceCategory && !hay.includes(` ${deviceCategory} `)) return 0;

  let score = 0;
  if (hayNorm.includes(deviceNorm)) score += 6;
  if (repairNorm && hayNorm.includes(repairNorm)) score += 4;
  for (const token of deviceTokens) if (hay.includes(` ${token} `)) score += 2;
  for (const token of repairTokens) if (hay.includes(` ${token} `)) score += 3;

  const deviceHasMax = deviceNorm.includes('max');
  const partHasMax = hayNorm.includes('max');
  if (deviceNorm.includes('pro') && deviceHasMax !== partHasMax) score -= 4;

  return Math.max(0, score);
}

async function queryProductsByName(monday, search) {
  const query = `query($board:[ID!], $search:CompareValue!) {
    boards(ids:$board) {
      items_page(limit:50, query_params:{rules:[{column_id:"name",compare_value:$search,operator:contains_text}]}) {
        items {
          id
          name
          group { id title }
          column_values(ids:["status3","numbers","numeric8","${COLUMNS.PRODUCT_PARTS_RELATION}"]) {
            id type text value
            ... on BoardRelationValue { linked_item_ids display_value }
          }
        }
      }
    }
  }`;
  const data = await monday(query, { board: [BOARDS.PRODUCTS_AND_PRICING], search: [search] });
  return data.boards?.[0]?.items_page?.items || [];
}

async function findProducts(monday, device, repair) {
  const modelTokens = significantTokens(device).filter((t) => /^a\d{4}$/i.test(t));
  const repairTokens = significantTokens(repair);
  const searches = [
    `${device} ${repair}`.trim(),
    ...modelTokens,
    ...repairTokens,
    device,
  ].filter(Boolean);

  const seen = new Map();
  for (const search of searches) {
    const items = await queryProductsByName(monday, search);
    for (const item of items) seen.set(String(item.id), item);
    if (seen.size && (search === `${device} ${repair}`.trim() || modelTokens.includes(search))) break;
  }

  return [...seen.values()]
    .map((item) => ({ item, score: scorePart(item.name, device, repair) }))
    .filter(({ score }) => score >= 3)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

async function searchParts(monday, device, repair) {
  const repairTokens = significantTokens(repair);
  const broad = repairTokens[0] || repair || device;
  const query = `query($board:[ID!], $search:CompareValue!) {
    boards(ids:$board) {
      items_page(limit:100, query_params:{rules:[{column_id:"name",compare_value:$search,operator:contains_text}]}) {
        items {
          id
          name
          column_values(ids:["${COLUMNS.PART_QTY}","${COLUMNS.PART_AVAILABLE}","${COLUMNS.PART_SUPPLY_PRICE}","${COLUMNS.PART_TAGS}"]) { id type text value }
        }
      }
    }
  }`;
  const data = await monday(query, { board: [BOARDS.PARTS], search: [broad] });
  const items = data.boards?.[0]?.items_page?.items || [];
  return items
    .map((item) => ({ item, score: scorePart(item.name, device, repair) }))
    .filter(({ score }) => score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ item }) => item);
}

function printStockCheck({ product, parts, fallback = false }) {
  const summaries = parts.map(partSummary);
  const primary = summaries[0];

  console.log('Stock Check');
  console.log(`• Repair: ${product ? product.name : 'No matching repair product found'}`);

  if (!primary) {
    console.log('• Linked Part: Not found');
    console.log('• Available Stock: Manual check required');
    return;
  }

  console.log(`• Linked Part: ${primary.name}${fallback ? ' (best-effort match)' : ''}`);
  console.log(`• Available Stock: ${primary.availableStock}`);

  if (summaries.length > 1) {
    console.log('• Other Possible Parts:');
    for (const p of summaries.slice(1, 5)) {
      console.log(`  - ${p.name}: ${p.availableStock}`);
    }
  }
}

async function main() {
  const [device, repair] = process.argv.slice(2);
  if (!device || !repair) {
    console.error('Usage: node tools/repair-stock-check.js "<device/model>" "<requested repair>"');
    process.exit(2);
  }

  const monday = makeMondayClient(getToken());

  const products = await findProducts(monday, device, repair);
  const product = products[0];

  if (product) {
    const [check] = await checkStockForProductIds(monday, [product.id]);
    if (check && check.parts.length) {
      // checkStockForProductIds returns {parts: [{name, availableStock, ...}]}
      // Map back to raw items so printStockCheck can reuse partSummary().
      const rawParts = await fetchPartsByIds(monday, parseLinkedIds(col(product, COLUMNS.PRODUCT_PARTS_RELATION)));
      printStockCheck({ product, parts: rawParts });
      return;
    }
  }

  const fallbackParts = await searchParts(monday, device, repair);
  if (fallbackParts.length) {
    printStockCheck({ product, parts: fallbackParts, fallback: true });
  } else {
    printStockCheck({ product, parts: [] });
  }
}

main().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
