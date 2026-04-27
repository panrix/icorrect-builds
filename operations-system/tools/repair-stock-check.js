#!/usr/bin/env node
/*
 * V0 Parts Stock Check
 *
 * Usage:
 *   node tools/parts-stock-check.js "iPhone 15 Pro" "Screen"
 *   node tools/parts-stock-check.js "MacBook Pro 15 A1398" "Battery"
 *
 * Reads MONDAY_APP_TOKEN from environment, or from the existing
 * icorrect-parts-service .env as a convenience for local ops use.
 *
 * This is read-only. It does not reserve or deduct stock.
 */

const fs = require('fs');
const path = require('path');

const MONDAY_API_URL = 'https://api.monday.com/v2';
const PRODUCTS_BOARD_ID = '2477699024';
const PARTS_BOARD_ID = '985177480';
const DEFAULT_ENV_PATH = '/home/ricky/builds/icorrect-parts-service/.env';

const PRODUCT_PARTS_COLUMN = 'connect_boards8';
const PART_QTY_COLUMN = 'quantity';
const PART_AVAILABLE_COLUMN = 'formula_mkv86xh7';
const PART_SUPPLY_PRICE_COLUMN = 'supply_price';
const PART_TAGS_COLUMN = 'tags';

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
  if (!process.env.MONDAY_APP_TOKEN) loadEnvFile(DEFAULT_ENV_PATH);
  if (!process.env.MONDAY_APP_TOKEN) {
    throw new Error('MONDAY_APP_TOKEN not set and not found in icorrect-parts-service .env');
  }
  return process.env.MONDAY_APP_TOKEN;
}

async function mondayRequest(query, variables = {}) {
  const res = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getToken(),
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Monday API returned non-JSON response: ${text.slice(0, 300)}`);
  }

  if (!res.ok || data.errors) {
    throw new Error(`Monday API error: ${JSON.stringify(data.errors || data, null, 2)}`);
  }

  return data.data;
}

function parseLinkedIds(columnValue) {
  if (!columnValue) return [];

  // Monday board_relation columns on the 2024/2025 API often expose IDs via the
  // typed BoardRelationValue fields, while `text` and `value` can still be null.
  if (Array.isArray(columnValue.linked_item_ids) && columnValue.linked_item_ids.length) {
    return columnValue.linked_item_ids.map(String).filter(Boolean);
  }

  const raw = columnValue.value ?? columnValue;
  if (!raw) return [];

  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return [];
  }
  const linked = parsed.linkedPulseIds || parsed.linked_item_ids || [];
  return linked.map((entry) => String(entry.linkedPulseId || entry.itemId || entry)).filter(Boolean);
}

function col(item, id) {
  return item.column_values?.find((c) => c.id === id);
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

  // Prevent broad repair searches like "battery" returning every battery in stock.
  const categoryTokens = ['iphone', 'ipad', 'macbook', 'watch'];
  const deviceCategory = categoryTokens.find((token) => deviceNorm.includes(token));
  if (deviceCategory && !hay.includes(` ${deviceCategory} `)) return 0;

  let score = 0;
  if (hayNorm.includes(deviceNorm)) score += 6;
  if (repairNorm && hayNorm.includes(repairNorm)) score += 4;
  for (const token of deviceTokens) if (hay.includes(` ${token} `)) score += 2;
  for (const token of repairTokens) if (hay.includes(` ${token} `)) score += 3;

  // Avoid iPhone Pro searches overmatching Pro Max, and vice versa.
  const deviceHasMax = deviceNorm.includes('max');
  const partHasMax = hayNorm.includes('max');
  if (deviceNorm.includes('pro') && deviceHasMax !== partHasMax) score -= 4;

  return Math.max(0, score);
}

async function queryProductsByName(search) {
  const query = `query($board:[ID!], $search:CompareValue!) {
    boards(ids:$board) {
      items_page(limit:50, query_params:{rules:[{column_id:"name",compare_value:$search,operator:contains_text}]}) {
        items {
          id
          name
          group { id title }
          column_values(ids:["status3","numbers","numeric8","${PRODUCT_PARTS_COLUMN}"]) { id type text value ... on BoardRelationValue { linked_item_ids display_value } }
        }
      }
    }
  }`;
  const data = await mondayRequest(query, { board: [PRODUCTS_BOARD_ID], search: [search] });
  return data.boards?.[0]?.items_page?.items || [];
}

async function findProducts(device, repair) {
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
    const items = await queryProductsByName(search);
    for (const item of items) seen.set(String(item.id), item);
    // If a precise search found candidates, avoid excessive broad queries.
    if (seen.size && (search === `${device} ${repair}`.trim() || modelTokens.includes(search))) break;
  }

  return [...seen.values()]
    .map((item) => ({ item, score: scorePart(item.name, device, repair) }))
    .filter(({ score }) => score >= 3)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

async function fetchPartsByIds(ids) {
  if (!ids.length) return [];
  const query = `query($ids:[ID!]) {
    items(ids:$ids) {
      id
      name
      column_values(ids:["${PART_QTY_COLUMN}","${PART_AVAILABLE_COLUMN}","${PART_SUPPLY_PRICE_COLUMN}","${PART_TAGS_COLUMN}"]) { id type text value }
    }
  }`;
  const data = await mondayRequest(query, { ids });
  return data.items || [];
}

async function searchParts(device, repair) {
  const repairTokens = significantTokens(repair);
  const broad = repairTokens[0] || repair || device;
  const query = `query($board:[ID!], $search:CompareValue!) {
    boards(ids:$board) {
      items_page(limit:100, query_params:{rules:[{column_id:"name",compare_value:$search,operator:contains_text}]}) {
        items {
          id
          name
          column_values(ids:["${PART_QTY_COLUMN}","${PART_AVAILABLE_COLUMN}","${PART_SUPPLY_PRICE_COLUMN}","${PART_TAGS_COLUMN}"]) { id type text value }
        }
      }
    }
  }`;
  const data = await mondayRequest(query, { board: [PARTS_BOARD_ID], search: [broad] });
  const items = data.boards?.[0]?.items_page?.items || [];
  return items
    .map((item) => ({ item, score: scorePart(item.name, device, repair) }))
    .filter(({ score }) => score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ item }) => item);
}

function partSummary(part) {
  return {
    id: part.id,
    name: part.name,
    totalStock: col(part, PART_QTY_COLUMN)?.text || '0',
    availableStock: col(part, PART_AVAILABLE_COLUMN)?.text || col(part, PART_QTY_COLUMN)?.text || '0',
    supplyPrice: col(part, PART_SUPPLY_PRICE_COLUMN)?.text || '',
  };
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
    console.error('Usage: node tools/parts-stock-check.js "<device/model>" "<requested repair>"');
    process.exit(2);
  }

  const products = await findProducts(device, repair);
  const product = products[0];

  if (product) {
    const linkedPartIds = parseLinkedIds(col(product, PRODUCT_PARTS_COLUMN));
    if (linkedPartIds.length) {
      printStockCheck({ product, parts: await fetchPartsByIds(linkedPartIds) });
      return;
    }
  }

  const fallbackParts = await searchParts(device, repair);
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
