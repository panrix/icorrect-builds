#!/usr/bin/env node

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env', quiet: true });

const fs = require('fs');
const path = require('path');
const { mondayQuery, BOARDS } = require('./lib/monday');
const { calculateProfitability } = require('./lib/profitability');
const { postTelegram: sendTelegram } = require('./lib/notifications');

const TODAY = new Date().toISOString().slice(0, 10);
const DATA_DIR = '/home/ricky/builds/backmarket/data';
const BM_CATALOG_PATH = path.join(DATA_DIR, 'bm-catalog.json');
const BUYBACK_MONITOR_DATA_DIR = '/home/ricky/builds/buyback-monitor/data';
const SHIPPING_COST = 15;
const MAIN_BOARD = BOARDS.MAIN;
const BM_DEVICES_BOARD = BOARDS.BM_DEVICES;
const IS_DRY_RUN = process.argv.includes('--dry-run');

const CSV_COLUMNS = [
  'item_id',
  'listing_id',
  'main_board_item_id',
  'device_name',
  'sku',
  'grade',
  'cost_basis_gbp',
  'days_listed',
  'market_price_gbp',
  'proposed_action',
  'ACTION',
  'notes',
];

const SALVAGE_MODELS = new Set(['A1932', 'A2179', 'A2251', 'A2289']);
const MODEL_NUMBER_TO_CATALOG_FAMILY = {
  A1466: 'MacBook Air 13-inch (2017)',
  A1932: 'MacBook Air 13-inch (2018)',
  A2179: 'MacBook Air 13-inch (2020)',
  A2337: 'MacBook Air 13-inch (2020)',
  A2681: 'MacBook Air 13-inch (2022)',
  A2941: 'MacBook Air 15-inch (2023)',
  A3113: 'MacBook Air 13-inch (2024)',
  A3114: 'MacBook Air 13-inch (2024)',
  A3240: 'MacBook Air 13-inch (2025)',
  A2251: 'MacBook Pro 13-inch (2020)',
  A2289: 'MacBook Pro 13-inch (2020)',
  A2338: 'MacBook Pro 13-inch (2020)',
  A2442: 'MacBook Pro 14-inch (2021)',
  A2485: 'MacBook Pro 16-inch (2021)',
  A2779: 'MacBook Pro 14-inch (2023)',
  A2780: 'MacBook Pro 16-inch (2023)',
  A2918: 'MacBook Pro 14-inch (2023)',
  A2991: 'MacBook Pro 16-inch (2023)',
  A2992: 'MacBook Pro 14-inch (2023)',
};

function info(message) {
  console.log(message);
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function escapeGraphqlString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function daysBetween(dateText, now = new Date()) {
  if (!dateText) return null;
  const then = new Date(dateText);
  if (Number.isNaN(then.getTime())) return null;
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / 86400000);
}

function cleanDeviceName(name) {
  return String(name || '')
    .replace(/^BM\s+\d+\s*/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeColour(value) {
  const raw = String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!raw) return '';
  if (['space gray', 'space grey', 'grey', 'gray'].includes(raw)) return 'Space Gray';
  if (raw === 'space black') return 'Space Black';
  if (raw === 'rose gold') return 'Rose Gold';
  return raw
    .split(' ')
    .map(token => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function normalizeRam(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function normalizeSsd(value) {
  const raw = String(value || '').trim().toUpperCase().replace(/\s+/g, '');
  if (raw === '1TB') return '1000GB';
  if (raw === '2TB') return '2000GB';
  if (raw === '4TB') return '4000GB';
  return raw;
}

function parsePartsCost(partsDisplay) {
  return roundMoney(
    String(partsDisplay || '')
      .split(',')
      .map(token => parseFloat(String(token).replace(/[^\d.-]/g, '')) || 0)
      .reduce((sum, value) => sum + value, 0)
  );
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map(values => {
    const record = {};
    header.forEach((key, position) => {
      record[key] = values[position] !== undefined ? values[position] : '';
    });
    return record;
  });
}

function toCsv(rows) {
  const escapeCell = value => {
    const stringValue = value === null || value === undefined ? '' : String(value);
    if (/[",\n\r]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const lines = [CSV_COLUMNS.join(',')];
  for (const row of rows) {
    lines.push(CSV_COLUMNS.map(column => escapeCell(row[column])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function fmtMoney(value) {
  return `£${roundMoney(value).toFixed(2)}`;
}

function getModelNumber(...values) {
  for (const value of values) {
    const match = String(value || '').match(/A\d{4}/i);
    if (match) return match[0].toUpperCase();
  }
  return '';
}

function classifyChip(specs) {
  const model = specs.model;
  const deviceName = String(specs.device_name || '').toUpperCase();
  const cpu = String(specs.cpu || '').toUpperCase();
  const gpu = String(specs.gpu || '').toUpperCase();

  if (cpu.includes('INTEL') || gpu.includes('INTEL')) return 'INTEL';

  if (model === 'A2337') return 'M1';
  if (model === 'A2681') return 'M2';
  if (model === 'A3113' || model === 'A3114') return 'M3';
  if (model === 'A3240') return 'M4';
  if (model === 'A2338') {
    const gpuCores = parseInt((gpu.match(/(\d+)/) || [])[1] || '0', 10);
    return gpuCores === 10 ? 'M2' : 'M1';
  }
  if (model === 'A2442' || model === 'A2485') {
    const gpuCores = parseInt((gpu.match(/(\d+)/) || [])[1] || '0', 10);
    return gpuCores >= 24 ? 'M1 Max' : 'M1 Pro';
  }
  if (model === 'A2779' || model === 'A2780') return 'M2 Pro';
  if (model === 'A2918') {
    const gpuCores = parseInt((gpu.match(/(\d+)/) || [])[1] || '0', 10);
    return gpuCores >= 14 ? 'M3 Pro' : 'M3';
  }
  if (model === 'A2992') {
    const gpuCores = parseInt((gpu.match(/(\d+)/) || [])[1] || '0', 10);
    return gpuCores >= 18 ? 'M3 Pro' : 'M3';
  }
  if (model === 'A2991') return 'M3 Pro';

  const chipMatch = deviceName.match(/\b(M[1-4])\b/);
  if (chipMatch) {
    if (deviceName.includes('PRO')) return `${chipMatch[1]} Pro`;
    if (deviceName.includes('MAX')) return `${chipMatch[1]} Max`;
    return chipMatch[1];
  }

  return '';
}

function deriveCatalogModelFamily(specs) {
  if (specs.model === 'A2338') {
    const gpuCores = parseInt((String(specs.gpu || '').match(/(\d+)/) || [])[1] || '0', 10);
    return gpuCores === 10 ? 'MacBook Pro 13-inch (2022)' : 'MacBook Pro 13-inch (2020)';
  }

  return MODEL_NUMBER_TO_CATALOG_FAMILY[specs.model] || '';
}

function buildCatalogIndex(catalog) {
  const exact = new Map();
  const spec = new Map();

  for (const variant of Object.values(catalog.variants || {})) {
    const modelFamily = String(variant.model_family || '').trim();
    const ram = normalizeRam(variant.ram);
    const ssd = normalizeSsd(variant.ssd);
    const colour = normalizeColour(variant.colour);
    if (!modelFamily || !ram || !ssd) continue;

    const exactKey = [modelFamily, ram, ssd, colour].join('|');
    if (!exact.has(exactKey)) exact.set(exactKey, []);
    exact.get(exactKey).push(variant);

    const specKey = [modelFamily, ram, ssd].join('|');
    if (!spec.has(specKey)) spec.set(specKey, []);
    spec.get(specKey).push(variant);
  }

  return { exact, spec };
}

function resolveCatalogVariant(catalogIndex, specs) {
  const modelFamily = deriveCatalogModelFamily(specs);
  const ram = normalizeRam(specs.ram);
  const ssd = normalizeSsd(specs.ssd);
  const colour = normalizeColour(specs.colour);
  if (!modelFamily || !ram || !ssd) return null;

  const exactKey = [modelFamily, ram, ssd, colour].join('|');
  const exactMatches = catalogIndex.exact.get(exactKey) || [];
  if (exactMatches.length === 1) return exactMatches[0];

  const specKey = [modelFamily, ram, ssd].join('|');
  const specMatches = catalogIndex.spec.get(specKey) || [];
  if (specMatches.length === 1) return specMatches[0];

  const noColourMatches = specMatches.filter(variant => !normalizeColour(variant.colour));
  if (noColourMatches.length === 1) return noColourMatches[0];

  return null;
}

function buildRawScraperModelKey(specs) {
  const family = deriveCatalogModelFamily(specs);
  const familyMatch = family.match(/^MacBook\s+(Air|Pro)\s+(\d+)-inch\s+\((\d{4})\)$/i);
  if (!familyMatch) return '';

  const type = familyMatch[1];
  const size = familyMatch[2];
  const year = familyMatch[3];
  const chip = classifyChip(specs);
  if (!chip || chip === 'INTEL') return '';
  return `${type} ${size}" ${year} ${chip}`;
}

function lookupMarketPrice(scraperData, catalogIndex, specs, gradeText) {
  const variant = resolveCatalogVariant(catalogIndex, specs);
  const grade = String(gradeText || '').trim();

  if (variant && variant.grade_prices && variant.grade_prices[grade] != null) {
    return {
      marketPrice: roundMoney(variant.grade_prices[grade]),
      source: 'bm-catalog.grade_prices',
      modelKey: buildRawScraperModelKey(specs),
    };
  }

  const modelKey = buildRawScraperModelKey(specs);
  const model = scraperData.models?.[modelKey];
  const rawPrice = model?.grades?.[grade]?.price;
  if (rawPrice != null) {
    return {
      marketPrice: roundMoney(rawPrice),
      source: `sell-prices:${modelKey}`,
      modelKey,
    };
  }

  return {
    marketPrice: 0,
    source: variant ? 'bm-catalog.no-grade-price' : 'sell-prices.no-match',
    modelKey,
  };
}

function buildSku(specs) {
  const family = String(specs.device_name || '').toLowerCase();
  const type = family.includes('air') ? 'MBA' : family.includes('pro') ? 'MBP' : 'MAC';
  const model = specs.model || 'UNKNOWN';
  const chip = classifyChip(specs);
  const chipToken = chip
    ? chip.toUpperCase().replace(/\s+/g, '')
    : String(specs.cpu || '').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'UNKNOWN';
  const colour = normalizeColour(specs.colour || '').replace(/\s+/g, '') || 'Unknown';
  return [
    type,
    model,
    chipToken,
    normalizeRam(specs.ram) || 'UNKNOWN',
    normalizeSsd(specs.ssd) || 'UNKNOWN',
    colour,
    String(specs.grade || '').replace(/\s+/g, '') || 'Unknown',
  ].join('.');
}

function buildProposedAction(specs, costBasis, marketPrice) {
  const model = specs.model || '';
  const chip = classifyChip(specs);
  const isIntel = chip === 'INTEL';
  const isMSeries = /^M[1-4]/.test(chip);

  if (marketPrice > costBasis) return 'LIST_AT_LOSS';
  if (isIntel && SALVAGE_MODELS.has(model)) return 'SALVAGE';
  if (isMSeries && marketPrice < costBasis) return 'LIST_AT_LOSS';
  return 'SCRAP';
}

function findLatestSellPricesFile() {
  const candidates = [];
  for (const directory of [DATA_DIR, BUYBACK_MONITOR_DATA_DIR]) {
    if (!fs.existsSync(directory)) continue;
    for (const entry of fs.readdirSync(directory)) {
      if (/^sell-prices-\d{4}-\d{2}-\d{2}\.json$/.test(entry)) {
        candidates.push(path.join(directory, entry));
      }
    }
  }
  candidates.sort();
  if (candidates.length === 0) {
    throw new Error('No sell-prices-YYYY-MM-DD.json file found in backmarket/data or buyback-monitor/data');
  }
  return candidates[candidates.length - 1];
}

function readExistingAnnotations(csvPath) {
  if (!fs.existsSync(csvPath)) return new Map();
  const records = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const map = new Map();
  for (const record of records) {
    if (!record.item_id) continue;
    map.set(String(record.item_id), {
      ACTION: record.ACTION || '',
      notes: record.notes || '',
      proposed_action: record.proposed_action || '',
    });
  }
  return map;
}

function mergeNotes(existingNotes, action, nextProposedAction, previousProposedAction) {
  const baseNotes = String(existingNotes || '');
  if (!action || action === nextProposedAction || previousProposedAction === nextProposedAction) {
    return baseNotes;
  }
  if (/^CONFLICT:/i.test(baseNotes)) return baseNotes;
  const detail = `CONFLICT: ACTION=${action} proposed_action=${nextProposedAction}.`;
  return baseNotes ? `${detail} ${baseNotes}` : detail;
}

async function postTelegram(text) {
  if (IS_DRY_RUN) return;
  await sendTelegram(text, { logger: { log: info, warn: info }, topic: 'issues' });
}

async function loadBmDevices() {
  const items = [];
  let cursor = null;

  while (true) {
    const query = cursor
      ? `query ($cursor: String!) {
          next_items_page(cursor: $cursor, limit: 500) {
            cursor
            items {
              id
              name
              column_values(ids: ["lookup","board_relation","text89","text_mkyd4bx3","numeric","status__1","color2","status7__1","status8__1","lookup_mkq370j8","lookup_mkqgabc3"]) {
                id
                text
                ... on MirrorValue { display_value }
                ... on BoardRelationValue { linked_item_ids }
                ... on NumbersValue { number }
              }
            }
          }
        }`
      : `query {
          boards(ids:[${BM_DEVICES_BOARD}]) {
            items_page(limit: 500) {
              cursor
              items {
                id
                name
                column_values(ids: ["lookup","board_relation","text89","text_mkyd4bx3","numeric","status__1","color2","status7__1","status8__1","lookup_mkq370j8","lookup_mkqgabc3"]) {
                  id
                  text
                  ... on MirrorValue { display_value }
                  ... on BoardRelationValue { linked_item_ids }
                  ... on NumbersValue { number }
                }
              }
            }
          }
        }`;

    const data = cursor
      ? await mondayQuery(query, { cursor })
      : await mondayQuery(query);

    const page = cursor
      ? data.next_items_page
      : data.boards?.[0]?.items_page;

    if (!page?.items?.length) break;
    items.push(...page.items);
    if (!page.cursor) break;
    cursor = page.cursor;
  }

  const map = new Map();
  for (const item of items) {
    const relation = item.column_values.find(column => column.id === 'board_relation');
    const mainItemId = relation?.linked_item_ids?.[0];
    if (!mainItemId) continue;
    if (!map.has(String(mainItemId))) map.set(String(mainItemId), []);
    map.get(String(mainItemId)).push(item);
  }
  return map;
}

async function loadCandidateMainItems() {
  const items = [];
  let cursor = null;

  while (true) {
    const query = cursor
      ? `query ($cursor: String!) {
          next_items_page(cursor: $cursor, limit: 500) {
            cursor
            items {
              id
              name
              column_values(ids: ["status24","date_mkq385pa","date_mkqgbbtp","status_2_Mjj4GJNQ","status8","lookup_mkx1xzd7","formula_mkx1bjqr","formula__1"]) {
                id
                text
                ... on StatusValue { text index }
                ... on MirrorValue { display_value }
                ... on FormulaValue { display_value }
              }
            }
          }
        }`
      : `query {
          boards(ids:[${MAIN_BOARD}]) {
            items_page(limit: 500, query_params:{ rules:[{column_id:"status24", compare_value:[7,8], operator:any_of}] }) {
              cursor
              items {
                id
                name
                column_values(ids: ["status24","date_mkq385pa","date_mkqgbbtp","status_2_Mjj4GJNQ","status8","lookup_mkx1xzd7","formula_mkx1bjqr","formula__1"]) {
                  id
                  text
                  ... on StatusValue { text index }
                  ... on MirrorValue { display_value }
                  ... on FormulaValue { display_value }
                }
              }
            }
          }
        }`;

    const data = cursor
      ? await mondayQuery(query, { cursor })
      : await mondayQuery(query);

    const page = cursor
      ? data.next_items_page
      : data.boards?.[0]?.items_page;

    if (!page?.items?.length) break;
    items.push(...page.items);
    if (!page.cursor) break;
    cursor = page.cursor;
  }

  return items;
}

function chooseBmDevice(itemsForMain) {
  const sorted = [...itemsForMain].sort((left, right) => Number(right.id) - Number(left.id));
  const withListing = sorted.find(item => item.column_values.find(column => column.id === 'text_mkyd4bx3')?.text);
  return withListing || sorted[0];
}

async function main() {
  info(`stuck-inventory-audit.js ${IS_DRY_RUN ? '[DRY-RUN]' : '[LIVE]'}`);

  const latestSellPricesPath = findLatestSellPricesFile();
  const scraperData = JSON.parse(fs.readFileSync(latestSellPricesPath, 'utf8'));
  const catalog = JSON.parse(fs.readFileSync(BM_CATALOG_PATH, 'utf8'));
  const catalogIndex = buildCatalogIndex(catalog);
  const existingCsvPath = path.join(DATA_DIR, `stuck-inventory-${TODAY}.csv`);
  const existingAnnotations = readExistingAnnotations(existingCsvPath);

  info(`Using market data: ${latestSellPricesPath}`);
  info('Loading Monday candidate items...');
  const [mainItems, bmDevicesByMainId] = await Promise.all([
    loadCandidateMainItems(),
    loadBmDevices(),
  ]);

  const now = new Date();
  const rows = [];
  const missingBmDeviceLinks = [];
  const skippedMissingAge = [];

  for (const mainItem of mainItems) {
    const status = mainItem.column_values.find(column => column.id === 'status24')?.text || '';
    const grade = mainItem.column_values.find(column => column.id === 'status_2_Mjj4GJNQ')?.text || '';
    const colour = mainItem.column_values.find(column => column.id === 'status8')?.text || '';
    const dateListed = mainItem.column_values.find(column => column.id === 'date_mkq385pa')?.text || '';
    const datePurchased = mainItem.column_values.find(column => column.id === 'date_mkqgbbtp')?.text || '';
    const partsDisplay = mainItem.column_values.find(column => column.id === 'lookup_mkx1xzd7')?.display_value || '';
    const labourHours = parseFloat(mainItem.column_values.find(column => column.id === 'formula__1')?.display_value || '0') || 0;

    const linkedBmDevices = bmDevicesByMainId.get(String(mainItem.id)) || [];
    if (linkedBmDevices.length === 0) {
      missingBmDeviceLinks.push(mainItem.id);
      continue;
    }

    const bmDevice = chooseBmDevice(linkedBmDevices);
    const lookupName = bmDevice.column_values.find(column => column.id === 'lookup')?.display_value || '';
    const bmDateListed = bmDevice.column_values.find(column => column.id === 'lookup_mkq370j8')?.display_value || '';
    const bmDatePurchased = bmDevice.column_values.find(column => column.id === 'lookup_mkqgabc3')?.display_value || '';
    const purchasePrice = parseFloat(bmDevice.column_values.find(column => column.id === 'numeric')?.text || '0') || 0;
    const listingId = bmDevice.column_values.find(column => column.id === 'text_mkyd4bx3')?.text || '';
    const cpu = bmDevice.column_values.find(column => column.id === 'status7__1')?.text || '';
    const gpu = bmDevice.column_values.find(column => column.id === 'status8__1')?.text || '';
    const ram = bmDevice.column_values.find(column => column.id === 'status__1')?.text || '';
    const ssd = bmDevice.column_values.find(column => column.id === 'color2')?.text || '';
    const effectiveDateListed = dateListed || bmDateListed;
    const effectiveDatePurchased = datePurchased || bmDatePurchased;
    const ageAnchor = effectiveDateListed || (status === 'To List' ? effectiveDatePurchased : '');
    const daysListed = daysBetween(ageAnchor, now);
    if (daysListed === null) {
      skippedMissingAge.push({
        mainItemId: mainItem.id,
        status,
        dateListed,
        datePurchased,
        bmDateListed,
        bmDatePurchased,
      });
      continue;
    }
    if (daysListed <= 14) continue;
    const deviceName = lookupName || cleanDeviceName(bmDevice.name) || mainItem.name;
    const model = getModelNumber(deviceName, bmDevice.name, mainItem.name);
    const partsCost = parsePartsCost(partsDisplay);
    const profitability = calculateProfitability(0, {
      purchaseCost: purchasePrice,
      partsCost,
      labourHours,
    });
    const costBasis = roundMoney(profitability.totalCost);

    const specs = {
      device_name: deviceName,
      model,
      ram,
      ssd,
      cpu,
      gpu,
      colour,
      grade,
    };
    const market = lookupMarketPrice(scraperData, catalogIndex, specs, grade);
    const proposedAction = buildProposedAction(specs, costBasis, market.marketPrice);
    const sku = bmDevice.column_values.find(column => column.id === 'text89')?.text || buildSku(specs);
    const existing = existingAnnotations.get(String(bmDevice.id)) || {};
    const notes = mergeNotes(existing.notes, existing.ACTION, proposedAction, existing.proposed_action);

    rows.push({
      item_id: String(bmDevice.id),
      listing_id: listingId,
      main_board_item_id: String(mainItem.id),
      device_name: deviceName,
      sku,
      grade,
      cost_basis_gbp: costBasis.toFixed(2),
      days_listed: String(daysListed),
      market_price_gbp: roundMoney(market.marketPrice).toFixed(2),
      proposed_action: proposedAction,
      ACTION: existing.ACTION || '',
      notes,
    });
  }

  rows.sort((left, right) => {
    const dayDelta = Number(right.days_listed) - Number(left.days_listed);
    if (dayDelta !== 0) return dayDelta;
    return Number(left.item_id) - Number(right.item_id);
  });

  const jsonPath = path.join(DATA_DIR, `stuck-inventory-${TODAY}.json`);
  fs.writeFileSync(existingCsvPath, toCsv(rows));
  fs.writeFileSync(jsonPath, `${JSON.stringify(rows, null, 2)}\n`);

  const counts = rows.reduce((accumulator, row) => {
    accumulator[row.proposed_action] = (accumulator[row.proposed_action] || 0) + 1;
    return accumulator;
  }, {});
  const totalRisk = rows.reduce((sum, row) => sum + (parseFloat(row.cost_basis_gbp) || 0), 0);
  const summaryLines = [
    `Stuck inventory audit ${TODAY}`,
    `Rows: ${rows.length}`,
    ...['LIST_AT_LOSS', 'SALVAGE', 'LOGIC_BOARD_DONOR', 'SCRAP'].map(action => `${action}: ${counts[action] || 0}`),
    `Total £ at risk: ${fmtMoney(totalRisk)}`,
  ];
  if (missingBmDeviceLinks.length > 0) {
    summaryLines.push(`Missing BM Device link: ${missingBmDeviceLinks.length}`);
  }
  if (skippedMissingAge.length > 0) {
    summaryLines.push(`Skipped missing age anchor: ${skippedMissingAge.length}`);
  }

  info(`Wrote ${existingCsvPath}`);
  info(`Wrote ${jsonPath}`);
  info(summaryLines.join('\n'));
  await postTelegram(summaryLines.join('\n'));
}

main().catch(error => {
  console.error(`Audit failed: ${error.message}`);
  process.exit(1);
});
