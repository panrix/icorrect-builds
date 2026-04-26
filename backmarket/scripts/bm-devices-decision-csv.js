#!/usr/bin/env node

require('dotenv').config({ path: '/Users/icorrect/VPS/builds/team-audits/.env', quiet: true });
require('dotenv').config({ path: '/Users/icorrect/VPS/builds/icorrect-parts-service/.env', quiet: true });

const fs = require('fs');
const path = require('path');
const { constructBmSku } = require('./lib/sku');
const {
  findResolverSlot,
  normalizeResolverSku,
  upgradeRegistrySchema,
} = require('./lib/resolver-truth');

const MONDAY_API = 'https://api.monday.com/v2';
const MONDAY_TOKEN = process.env.MONDAY_API_TOKEN || process.env.MONDAY_APP_TOKEN;

const BM_DEVICES_BOARD = 3892194968;
const BM_TRADE_INS_GROUP = 'group_mkq3wkeq';
const MAIN_BOARD = 349212843;
const PARTS_BOARD = 985177480;
const PRODUCTS_PRICING_BOARD = 2477699024;

const OUT_DIR = path.join(__dirname, '..', 'reports');
const OUT_FILE = path.join(OUT_DIR, `bm-devices-profitability-decisions-${new Date().toISOString().slice(0, 10)}.csv`);

const SOLD_PRICES_PATH = path.join(__dirname, '..', 'data', 'sold-prices-latest.json');
const BM_CATALOG_PATH = path.join(__dirname, '..', 'data', 'bm-catalog.json');
const REGISTRY_PATH = path.join(__dirname, '..', 'data', 'listings-registry.json');

const SHIPPING_COST = 15;
const LABOUR_RATE = 24;
const BM_BUY_FEE_RATE = 0.10;
const BM_SELL_FEE_RATE = 0.10;
const VAT_RATE = 0.1667;
const MIN_PRICE_FACTOR = 0.97;

const FALLBACK_REPAIR_MINUTES = {
  screen: 150,
  battery: 90,
  keyboard: 120,
  trackpad: 60,
  charging_port: 60,
  speaker: 45,
  logic_board: 180,
};

const REPAIR_PRODUCT_PATTERNS = {
  screen: /\b(screen|lcd|display)\b/i,
  battery: /\bbattery\b/i,
  keyboard: /\b(keyboard|top\s*case|topcase)\b/i,
  trackpad: /\btrack\s*pad|trackpad\b/i,
  charging_port: /\b(charging\s*port|usb[-\s]?c|charge\s*port)\b/i,
  speaker: /\b(loudspeaker|speaker)\b/i,
  logic_board: /\b(logic\s*board|board\s*repair|board\s*level|motherboard)\b/i,
};

const PART_PATTERNS = {
  screen: /\b(lcd|screen|display)\b/i,
  battery: /\bbattery\b/i,
  keyboard: /\b(keyboard|top\s*case|topcase)\b/i,
  trackpad: /\btrack\s*pad|trackpad\b/i,
  charging_port: /\b(charging\s*port|usb[-\s]?c|charge\s*port)\b/i,
  speaker: /\b(loudspeaker|speaker)\b/i,
  logic_board: /\b(logic\s*board|motherboard)\b/i,
};

const PART_EXCLUDE_PATTERNS = {
  screen: /\b(bezel|cable|adhesive|sticker|bracket|hinge|camera|clutch|rubber|screw|backlight)\b/i,
};

const BM_DEVICE_COLUMNS = [
  'board_relation',
  'lookup',
  'numeric',
  'numeric5',
  'numeric_mm1mgcgn',
  'mirror',
  'mirror_Mjj4H2hl',
  'mirror7__1',
  'lookup_mm1vzeam',
  'lookup_mkys2r44',
  'lookup_mkyezesb',
  'lookup_mkzg8vcv',
  'lookup_mkxf83vt',
  'lookup_mksztbgq',
  'lookup_mkqg4gr8',
  'lookup_mkqgb1te',
  'lookup_mkqgkkpg',
  'lookup_mkqg1q79',
  'lookup_mkqgq791',
  'lookup_mkqg33kj',
  'lookup_mkqgcza9',
  'lookup_mkqgzr4q',
  'lookup_mkqgsg46',
  'text81',
  'text3__1',
  'color2',
  'status__1',
  'status7__1',
  'status8__1',
  'text5__1',
  'keyboard_layout__1',
  'text89',
  'text_mkyd4bx3',
  'text_mm1dt53s',
  'color_mks9d2as',
  'color_mm1fj7tb',
];

const MAIN_COLUMNS = [
  'status4',
  'status24',
  'status_2_Mjj4GJNQ',
  'color_mkp5ykhf',
  'status_2_mkmc4tew',
  'status_2_mkmcj0tz',
  'screen_condition',
  'color_mkwr7s1s',
  'color_mkqg8ktb',
  'numbers9',
  'color_mkyp4jjh',
  'lookup_mkx1xzd7',
  'formula_mkx1bjqr',
  'formula__1',
  'long_text_mkqhfapq',
  'connect_boards__1',
  'board_relation_mm01yt93',
  'board_relation',
  'lookup_mkzccxrk',
  'text_mkpp9s3h',
];

const GRADE_RANK = {
  Dead: 0,
  Fair: 1,
  'Grade C': 1,
  Good: 2,
  'Grade B': 2,
  Excellent: 3,
  'Grade A': 3,
};

const GRADE_TO_BM = {
  Fair: 'FAIR',
  Good: 'GOOD',
  Excellent: 'VERY_GOOD',
  'Grade C': 'FAIR',
  'Grade B': 'GOOD',
  'Grade A': 'VERY_GOOD',
};

function die(message) {
  console.error(message);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function parseNumber(value) {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return 0;
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumMirrorValues(value) {
  if (!value) return 0;
  return String(value)
    .split(',')
    .map(parseNumber)
    .reduce((sum, n) => sum + n, 0);
}

function colValue(item, id) {
  const col = item?.column_values?.find((entry) => entry.id === id);
  if (!col) return '';
  const value = (col.display_value ?? col.text ?? '').toString().trim();
  return cleanMondayPlaceholder(value);
}

function cleanMondayPlaceholder(value) {
  const placeholders = new Set([
    'Battery Grade?',
    'Screen Grade?',
    'Screen Reported',
    'Casing Grade?',
    'Casing Reported',
    'Functional?',
    'Function Reported',
    'Liquid Damage?',
  ]);
  return placeholders.has(value) ? '' : value;
}

function linkedIds(item, id) {
  const col = item?.column_values?.find((entry) => entry.id === id);
  if (!col) return [];
  if (Array.isArray(col.linked_item_ids) && col.linked_item_ids.length) {
    return col.linked_item_ids.map(String);
  }

  let value = col.value;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      value = null;
    }
  }

  const linkedPulseIds = value?.linkedPulseIds || value?.linked_pulse_ids || [];
  if (Array.isArray(linkedPulseIds) && linkedPulseIds.length) {
    return linkedPulseIds
      .map((entry) => entry?.linkedPulseId || entry?.linked_pulse_id || entry?.itemId || entry?.item_id || entry)
      .filter(Boolean)
      .map(String);
  }

  const itemIds = value?.item_ids || value?.itemIds || [];
  if (Array.isArray(itemIds) && itemIds.length) {
    return itemIds.filter(Boolean).map(String);
  }

  return [];
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function extractBmNumber(name) {
  return (String(name || '').match(/\bBM\s*\d+\b/i) || [''])[0].replace(/\s+/, ' ').toUpperCase();
}

async function mondayQuery(query, variables = {}) {
  if (!MONDAY_TOKEN) die('Missing MONDAY_API_TOKEN or MONDAY_APP_TOKEN in local env files.');

  const resp = await fetch(MONDAY_API, {
    method: 'POST',
    headers: {
      Authorization: MONDAY_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await resp.json();
  if (!resp.ok || json.errors?.length) {
    throw new Error(JSON.stringify(json.errors || json, null, 2));
  }
  return json.data;
}

async function fetchBmTradeIns() {
  const items = [];
  let cursor = null;
  const columnIdsJson = JSON.stringify(BM_DEVICE_COLUMNS);

  const first = await mondayQuery(`query {
    boards(ids: [${BM_DEVICES_BOARD}]) {
      groups(ids: ["${BM_TRADE_INS_GROUP}"]) {
        id title
        items_page(limit: 100) {
          cursor
          items {
            id name group { id title }
            column_values(ids: ${columnIdsJson}) {
              id text value type
              ... on MirrorValue { display_value }
              ... on FormulaValue { display_value }
              ... on StatusValue { text index }
              ... on DropdownValue { text }
              ... on NumbersValue { number text }
              ... on TextValue { text }
              ... on LongTextValue { text }
              ... on BoardRelationValue { linked_item_ids display_value }
            }
          }
        }
      }
    }
  }`);

  const page = first.boards?.[0]?.groups?.[0]?.items_page;
  items.push(...(page?.items || []));
  cursor = page?.cursor || null;

  while (cursor) {
    const next = await mondayQuery(`query ($cursor: String!) {
      next_items_page(cursor: $cursor, limit: 100) {
        cursor
        items {
          id name group { id title }
          column_values(ids: ${columnIdsJson}) {
            id text value type
            ... on MirrorValue { display_value }
            ... on FormulaValue { display_value }
            ... on StatusValue { text index }
            ... on DropdownValue { text }
            ... on NumbersValue { number text }
            ... on TextValue { text }
            ... on LongTextValue { text }
            ... on BoardRelationValue { linked_item_ids display_value }
          }
        }
      }
    }`, { cursor });
    items.push(...(next.next_items_page?.items || []));
    cursor = next.next_items_page?.cursor || null;
  }

  return items;
}

async function fetchMainItems(ids) {
  const out = new Map();
  const unique = [...new Set(ids.map(String).filter(Boolean))];
  const columnIdsJson = JSON.stringify(MAIN_COLUMNS);

  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    const data = await mondayQuery(`query ($ids: [ID!]!) {
      items(ids: $ids) {
        id name
        updates(limit: 10) {
          id
          created_at
          text_body
          creator { name }
        }
        column_values(ids: ${columnIdsJson}) {
          id text value type
          ... on MirrorValue { display_value }
          ... on FormulaValue { display_value }
          ... on StatusValue { text index }
          ... on DropdownValue { text }
          ... on NumbersValue { number text }
          ... on LongTextValue { text }
          ... on BoardRelationValue { linked_item_ids display_value }
        }
      }
    }`, { ids: batch });
    for (const item of data.items || []) out.set(String(item.id), item);
  }

  return out;
}

async function fetchParts(ids) {
  const out = new Map();
  const unique = [...new Set(ids.map(String).filter(Boolean))];

  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    const data = await mondayQuery(`query ($ids: [ID!]!) {
      items(ids: $ids) {
        id name board { id name } group { id title }
        column_values(ids: ["supply_price", "quantity", "formula_mkv86xh7", "color_mksntr25", "color_mksn3ctf", "text_mktgxdc2"]) {
          id text value
          ... on NumbersValue { number text }
          ... on FormulaValue { display_value }
          ... on StatusValue { text }
          ... on TextValue { text }
        }
      }
    }`, { ids: batch });

    for (const item of data.items || []) {
      out.set(String(item.id), {
        id: String(item.id),
        name: item.name,
        group: item.group?.title || '',
        supplyPrice: parseNumber(colValue(item, 'supply_price')),
        stock: parseNumber(colValue(item, 'quantity')),
        availableStock: parseNumber(colValue(item, 'formula_mkv86xh7')),
        type: colValue(item, 'color_mksntr25'),
        majorPart: colValue(item, 'color_mksn3ctf'),
        partNumber: colValue(item, 'text_mktgxdc2'),
      });
    }
  }

  return out;
}

async function fetchProducts(ids) {
  const out = new Map();
  const unique = [...new Set(ids.map(String).filter(Boolean))];

  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    const data = await mondayQuery(`query ($ids: [ID!]!) {
      items(ids: $ids) {
        id name board { id name } group { id title }
        column_values(ids: ["numbers", "numbers7", "numeric", "connect_boards8", "status3"]) {
          id text value
          ... on NumbersValue { number text }
          ... on StatusValue { text }
          ... on BoardRelationValue { linked_item_ids display_value }
        }
      }
    }`, { ids: batch });

    for (const item of data.items || []) {
      out.set(String(item.id), {
        id: String(item.id),
        name: item.name,
        group: item.group?.title || '',
        priceIncVat: parseNumber(colValue(item, 'numbers')),
        requiredMinutes: parseNumber(colValue(item, 'numbers7')) || parseNumber(colValue(item, 'numeric')),
        productType: colValue(item, 'status3'),
        partIds: linkedIds(item, 'connect_boards8').map(String),
        partsDisplay: colValue(item, 'connect_boards8'),
      });
    }
  }

  return out;
}

async function fetchBoardCatalog(boardId, columnIds, mapper) {
  const out = new Map();
  let cursor = null;
  const columnIdsJson = JSON.stringify(columnIds);

  const first = await mondayQuery(`query {
    boards(ids: [${boardId}]) {
      items_page(limit: 100) {
        cursor
        items {
          id name board { id name } group { id title }
          column_values(ids: ${columnIdsJson}) {
            id text value
            ... on NumbersValue { number text }
            ... on FormulaValue { display_value }
            ... on StatusValue { text }
            ... on TextValue { text }
            ... on BoardRelationValue { linked_item_ids display_value }
          }
        }
      }
    }
  }`);

  const page = first.boards?.[0]?.items_page;
  for (const item of page?.items || []) out.set(String(item.id), mapper(item));
  cursor = page?.cursor || null;

  while (cursor) {
    const next = await mondayQuery(`query ($cursor: String!) {
      next_items_page(cursor: $cursor, limit: 100) {
        cursor
        items {
          id name board { id name } group { id title }
          column_values(ids: ${columnIdsJson}) {
            id text value
            ... on NumbersValue { number text }
            ... on FormulaValue { display_value }
            ... on StatusValue { text }
            ... on TextValue { text }
            ... on BoardRelationValue { linked_item_ids display_value }
          }
        }
      }
    }`, { cursor });

    for (const item of next.next_items_page?.items || []) out.set(String(item.id), mapper(item));
    cursor = next.next_items_page?.cursor || null;
  }

  return out;
}

function partFromMondayItem(item) {
  return {
    id: String(item.id),
    name: item.name,
    group: item.group?.title || '',
    supplyPrice: parseNumber(colValue(item, 'supply_price')),
    stock: parseNumber(colValue(item, 'quantity')),
    availableStock: parseNumber(colValue(item, 'formula_mkv86xh7')),
    type: colValue(item, 'color_mksntr25'),
    majorPart: colValue(item, 'color_mksn3ctf'),
    partNumber: colValue(item, 'text_mktgxdc2'),
  };
}

function productFromMondayItem(item) {
  return {
    id: String(item.id),
    name: item.name,
    group: item.group?.title || '',
    priceIncVat: parseNumber(colValue(item, 'numbers')),
    requiredMinutes: parseNumber(colValue(item, 'numbers7')) || parseNumber(colValue(item, 'numeric')),
    productType: colValue(item, 'status3'),
    partIds: linkedIds(item, 'connect_boards8').map(String),
    partsDisplay: colValue(item, 'connect_boards8'),
  };
}

async function fetchAllParts() {
  return fetchBoardCatalog(
    PARTS_BOARD,
    ['supply_price', 'quantity', 'formula_mkv86xh7', 'color_mksntr25', 'color_mksn3ctf', 'text_mktgxdc2'],
    partFromMondayItem
  );
}

async function fetchAllProducts() {
  return fetchBoardCatalog(
    PRODUCTS_PRICING_BOARD,
    ['numbers', 'numbers7', 'numeric', 'connect_boards8', 'status3'],
    productFromMondayItem
  );
}

function sumPartCosts(partIds, partsMap) {
  return partIds
    .map((id) => partsMap.get(String(id))?.supplyPrice || 0)
    .reduce((sum, n) => sum + n, 0);
}

function compactNames(items) {
  return items.map((item) => item?.name).filter(Boolean).join(' | ');
}

function relationDisplay(item, id) {
  return colValue(item, id);
}

function updateText(mainItem) {
  return (mainItem?.updates || [])
    .map((update) => update.text_body || '')
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 5000);
}

function addRepairNeed(needs, type, source) {
  if (!needs.some((need) => need.type === type)) needs.push({ type, source });
}

function hasPositiveDamage(value) {
  const text = String(value || '').toLowerCase();
  if (!text) return false;
  if (/\b(no|not|without)\b.{0,30}\b(damage|fault|issue|crack|broken)\b/.test(text)) return false;
  if (/\b(ok|passed|working|good|excellent)\b/.test(text) && !/\bnot\s+working\b/.test(text)) return false;
  return /\b(damaged|damage|broken|cracked|crack|faulty|dead|not\s+working|no\s+display|black\s+screen|lines|backlight|stage\s*light)\b/.test(text);
}

function hasFaultPhrase(text, componentPattern, faultPattern) {
  const value = String(text || '').replace(/\s+/g, ' ').toLowerCase();
  if (!value) return false;
  if (new RegExp(`\\b(no|not|without)\\b.{0,40}${componentPattern.source}`, 'i').test(value)) return false;
  const componentThenFault = new RegExp(`${componentPattern.source}.{0,80}${faultPattern.source}`, 'i');
  const faultThenComponent = new RegExp(`${faultPattern.source}.{0,80}${componentPattern.source}`, 'i');
  return componentThenFault.test(value) || faultThenComponent.test(value);
}

function inferRepairNeeds(bmItem, mainItem) {
  const needs = [];
  const screenActual = colValue(bmItem, 'lookup_mkqg1q79');
  const screenReported = colValue(bmItem, 'lookup_mkqgkkpg');
  const lcdPregrade = colValue(mainItem, 'color_mkp5ykhf');
  const screenCondition = colValue(mainItem, 'screen_condition');
  const topCase = colValue(mainItem, 'status_2_mkmcj0tz');
  const functionality = colValue(mainItem, 'status4') || colValue(bmItem, 'lookup_mkqgzr4q');
  const repairType = colValue(mainItem, 'status24');
  const ammeter = colValue(mainItem, 'color_mkwr7s1s');
  const liquid = colValue(mainItem, 'color_mkqg8ktb') || colValue(bmItem, 'lookup_mkqgsg46');
  const batteryHealth = parseNumber(colValue(mainItem, 'numbers9'));
  const freeText = [
    colValue(bmItem, 'text81'),
    colValue(bmItem, 'text3__1'),
    colValue(mainItem, 'text_mkpp9s3h'),
    colValue(mainItem, 'long_text_mkqhfapq'),
    updateText(mainItem),
  ].join(' ');

  if (
    hasPositiveDamage(screenActual) ||
    hasPositiveDamage(screenReported) ||
    hasPositiveDamage(lcdPregrade) ||
    hasPositiveDamage(screenCondition) ||
    hasFaultPhrase(freeText, /\b(screen|lcd|display)\b/i, /\b(damaged|broken|cracked|faulty|no\s+display|black\s+screen|lines|backlight|stage\s*light)\b/i)
  ) {
    addRepairNeed(needs, 'screen', 'screen_condition_or_diagnostic_fault');
  }

  if (
    (batteryHealth > 0 && batteryHealth < 80) ||
    hasFaultPhrase(freeText, /\bbattery\b/i, /\b(replace|service|swollen|poor|dead|faulty|not\s+holding|health)\b/i)
  ) {
    addRepairNeed(needs, 'battery', batteryHealth > 0 && batteryHealth < 80 ? 'battery_health_below_80' : 'diagnostic_battery_fault');
  }

  if (
    /^dead$/i.test(topCase) ||
    hasFaultPhrase(freeText, /\b(keyboard|top\s*case|topcase)\b/i, /\b(damaged|broken|faulty|dead|not\s+working|sticky|missing|replace)\b/i)
  ) {
    addRepairNeed(needs, 'keyboard', /^dead$/i.test(topCase) ? 'topcase_pregrade_dead' : 'diagnostic_keyboard_or_topcase_fault');
  }

  if (hasFaultPhrase(freeText, /\btrack\s*pad|trackpad\b/i, /\b(damaged|broken|faulty|dead|not\s+working|click|replace)\b/i)) {
    addRepairNeed(needs, 'trackpad', 'diagnostic_trackpad_fault');
  }

  if (
    /5\s*v/i.test(ammeter) ||
    /charging\s*port|usb[-\s]?c/i.test(repairType) ||
    hasFaultPhrase(freeText, /\b(charging\s*port|usb[-\s]?c|charge\s*port|charging)\b/i, /\b(damaged|broken|faulty|dead|not\s+charging|no\s+charge|replace)\b/i)
  ) {
    addRepairNeed(needs, 'charging_port', /5\s*v/i.test(ammeter) ? 'ammeter_5v' : 'diagnostic_charging_fault');
  }

  if (hasFaultPhrase(freeText, /\b(loudspeaker|speaker|audio)\b/i, /\b(damaged|broken|faulty|dead|not\s+working|distorted|no\s+sound|replace)\b/i)) {
    addRepairNeed(needs, 'speaker', 'diagnostic_speaker_fault');
  }

  if (
    /liquid|yes/i.test(liquid) ||
    /not\s+functional/i.test(functionality) ||
    hasFaultPhrase(freeText, /\b(logic\s*board|board|motherboard)\b/i, /\b(liquid|damaged|faulty|dead|not\s+powering|no\s+power|short|repair)\b/i)
  ) {
    addRepairNeed(needs, 'logic_board', /liquid|yes/i.test(liquid) ? 'liquid_damage_board_risk' : 'functional_or_diagnostic_board_risk');
  }

  return needs;
}

function modelMatchesName(name, model) {
  return !model || String(name || '').toUpperCase().includes(String(model).toUpperCase());
}

function findRepairProduct(productsMap, model, type) {
  const pattern = REPAIR_PRODUCT_PATTERNS[type];
  if (!pattern) return null;
  const candidates = [...productsMap.values()].filter((product) => {
    const name = product.name || '';
    return pattern.test(name) && !/\bdiagnostic\b/i.test(name) && modelMatchesName(name, model);
  });
  candidates.sort((a, b) => {
    const score = (product) =>
      (product.partIds?.length ? 20 : 0) +
      (product.requiredMinutes ? 10 : 0) +
      (product.priceIncVat ? 1 : 0);
    return score(b) - score(a);
  });
  return candidates[0] || null;
}

function findCompatibleParts(partsMap, model, type, linkedPartIds = []) {
  const linked = linkedPartIds
    .map((id) => partsMap.get(String(id)))
    .filter((part) => part?.supplyPrice > 0);

  const pattern = PART_PATTERNS[type];
  if (!pattern) return linked;
  const searched = [...partsMap.values()].filter((part) => (
    part.supplyPrice > 0 &&
    pattern.test(`${part.group} ${part.name}`) &&
    modelMatchesName(`${part.group} ${part.name}`, model)
  ));

  const byId = new Map([...linked, ...searched].map((part) => [part.id, part]));
  return [...byId.values()].filter((part) => !PART_EXCLUDE_PATTERNS[type]?.test(`${part.group} ${part.name}`));
}

function partMatchScore(part, type, model) {
  const text = `${part.group} ${part.name}`;
  let score = 0;
  if (modelMatchesName(text, model)) score += 100;
  if (type === 'screen' && /\bmacbook\s+lcds\b/i.test(part.group)) score += 50;
  if (type === 'screen' && /\blcd\b/i.test(part.name)) score += 40;
  if (type === 'screen' && /\bfull\s+screen\b/i.test(part.name)) score += 30;
  if (type !== 'screen' && PART_PATTERNS[type]?.test(part.name)) score += 30;
  if (part.availableStock > 0 || part.stock > 0) score += 5;
  return score;
}

function bestPositivePart(parts, type, model) {
  return parts
    .filter((part) => part?.supplyPrice > 0)
    .sort((a, b) => {
      const scoreDiff = partMatchScore(b, type, model) - partMatchScore(a, type, model);
      return scoreDiff || a.supplyPrice - b.supplyPrice;
    })[0] || null;
}

function predictRepairCosts(bmItem, mainItem, model, partsMap, productsMap) {
  const needs = inferRepairNeeds(bmItem, mainItem);
  const repairs = needs.map((need) => {
    const product = findRepairProduct(productsMap, model, need.type);
    const matchedParts = findCompatibleParts(partsMap, model, need.type, product?.partIds || []);
    const selectedPart = bestPositivePart(matchedParts, need.type, model);
    const minutes = product?.requiredMinutes || FALLBACK_REPAIR_MINUTES[need.type] || 60;
    return {
      type: need.type,
      trigger: need.source,
      product,
      part: selectedPart,
      minutes,
      labourCost: (minutes / 60) * LABOUR_RATE,
      partCost: selectedPart?.supplyPrice || 0,
      source: [
        need.source,
        product ? `product:${product.id}` : 'fallback_labour_minutes',
        selectedPart ? `part:${selectedPart.id}` : 'no_part_match',
      ].join('|'),
    };
  });

  const selectedPartIds = repairs.map((repair) => repair.part?.id).filter(Boolean);
  const selectedProductIds = repairs.map((repair) => repair.product?.id).filter(Boolean);
  const minutes = repairs.reduce((sum, repair) => sum + repair.minutes, 0);
  const partsCost = repairs.reduce((sum, repair) => sum + repair.partCost, 0);
  const labourCost = repairs.reduce((sum, repair) => sum + repair.labourCost, 0);

  return {
    repairs,
    needs: repairs.map((repair) => repair.type),
    partsCost,
    minutes,
    labourHours: minutes / 60,
    labourCost,
    selectedPartIds,
    selectedProductIds,
    parts: repairs.map((repair) => repair.part).filter(Boolean),
    products: repairs.map((repair) => repair.product).filter(Boolean),
    source: repairs.map((repair) => repair.source).join('; '),
  };
}

function predictGrade(mainItem) {
  const finalGrade = colValue(mainItem, 'status_2_Mjj4GJNQ');
  if (finalGrade) return { grade: finalGrade, source: 'final_grade' };

  const topCase = colValue(mainItem, 'status_2_mkmcj0tz');
  const lid = colValue(mainItem, 'status_2_mkmc4tew');
  if (!topCase || !lid) return { grade: '', source: 'missing_pregrades' };

  if (topCase === 'Dead') return { grade: 'Fair', source: 'predicted_from_pregrades_topcase_dead' };

  const topRank = GRADE_RANK[topCase] || 0;
  const lidRank = GRADE_RANK[lid] || 0;
  return {
    grade: topRank <= lidRank ? topCase : lid,
    source: 'predicted_from_pregrades',
  };
}

function gradeFromCondition(screen, casing, functionality) {
  const values = [screen, casing].filter(Boolean);
  if (!values.length) return '';
  if (values.some((value) => /damaged|fair/i.test(value))) return 'Fair';
  if (/not functional/i.test(functionality || '')) return 'Fair';
  if (values.some((value) => /good/i.test(value))) return 'Good';
  if (values.every((value) => /excellent/i.test(value))) return 'Excellent';
  return '';
}

function predictGradeWithFallback(mainItem, bmItem) {
  const formal = predictGrade(mainItem);
  if (formal.grade) return formal;

  const actualGrade = gradeFromCondition(
    colValue(bmItem, 'lookup_mkqg1q79'),
    colValue(bmItem, 'lookup_mkqg33kj'),
    colValue(bmItem, 'lookup_mkqgzr4q')
  );
  if (actualGrade) {
    return { grade: actualGrade, source: 'derived_from_actual_condition' };
  }

  const reportedGrade = gradeFromCondition(
    colValue(bmItem, 'lookup_mkqgkkpg'),
    colValue(bmItem, 'lookup_mkqgq791'),
    colValue(bmItem, 'lookup_mkqgcza9')
  );
  if (reportedGrade) {
    return { grade: reportedGrade, source: 'derived_from_reported_condition' };
  }

  return { grade: 'Fair', source: 'conservative_fair_fallback' };
}

function gradePriceKey(grade) {
  if (grade === 'VERY_GOOD') return 'Excellent';
  if (grade === 'FAIR') return 'Fair';
  if (grade === 'GOOD') return 'Good';
  return grade;
}

function getCatalogVariantByProductId(catalog, productId) {
  if (!productId) return null;
  return catalog.variants?.[productId] || null;
}

function getRegistrySlot(registry, sku, storedListingId, storedUuid) {
  return findResolverSlot(registry, {
    sku: normalizeResolverSku(sku),
    listingId: storedListingId,
    productId: storedUuid,
  });
}

function resolveSoldPrice(soldLookup, sku, model, grade) {
  const normalizedGrade = gradePriceKey(grade);
  const exact = soldLookup.by_sku?.[sku];
  if (exact?.avg_price) {
    return {
      price: Number(exact.avg_price),
      source: `sold_by_sku:n=${exact.count || 0}`,
      sample: Number(exact.count || 0),
    };
  }

  const modelKey = String(model || '').toUpperCase();
  const modelEntry = soldLookup.by_model?.[modelKey]?.grades?.[normalizedGrade];
  if (modelEntry?.avg_price) {
    return {
      price: Number(modelEntry.avg_price),
      source: `sold_by_model:${modelKey}:${normalizedGrade}:n=${modelEntry.count || 0}`,
      sample: Number(modelEntry.count || 0),
    };
  }

  const fairEntry = soldLookup.by_model?.[modelKey]?.grades?.Fair;
  if (fairEntry?.avg_price) {
    return {
      price: Number(fairEntry.avg_price),
      source: `sold_by_model:${modelKey}:Fair:fallback:n=${fairEntry.count || 0}`,
      sample: Number(fairEntry.count || 0),
    };
  }

  return { price: 0, source: '', sample: 0 };
}

function resolvePredictedPrice({ soldLookup, catalog, registry, sku, model, grade, storedListingId, storedUuid }) {
  const sold = resolveSoldPrice(soldLookup, sku, model, grade);
  if (sold.price && sold.sample >= 2) return sold;

  const slot = getRegistrySlot(registry, sku, storedListingId, storedUuid);
  const productId = slot?.product_id || storedUuid || '';
  const catalogVariant = getCatalogVariantByProductId(catalog, productId);
  const catalogGrade = gradePriceKey(grade);
  const catalogPrice = catalogVariant?.grade_prices?.[catalogGrade] || slot?.grade_prices?.[catalogGrade] || 0;
  if (catalogPrice) {
    return {
      price: Number(catalogPrice),
      source: `catalog_or_registry:${catalogGrade}`,
      sample: 0,
      productId,
      listingId: slot?.listing_id || '',
    };
  }

  if (sold.price) return sold;

  return {
    price: 0,
    source: 'no_price_match',
    sample: 0,
    productId,
    listingId: slot?.listing_id || '',
  };
}

function calculateProfitability(predictedSalePrice, costs) {
  if (!predictedSalePrice) {
    return {
      proposed: 0, minPrice: 0, bmBuyFee: 0, bmSellFee: 0, vat: 0,
      totalFixedCost: 0, totalCosts: 0, net: 0, margin: 0, breakEven: 0,
    };
  }

  const purchase = costs.purchasePrice || 0;
  const parts = costs.partsCost || 0;
  const labour = costs.labourCost || 0;
  const minPrice = Math.ceil(predictedSalePrice * MIN_PRICE_FACTOR);
  const bmBuyFee = purchase * BM_BUY_FEE_RATE;
  const bmSellFee = minPrice * BM_SELL_FEE_RATE;
  const vat = Math.max(0, (minPrice - purchase) * VAT_RATE);
  const totalFixedCost = purchase + parts + labour + SHIPPING_COST + bmBuyFee;
  const totalCosts = totalFixedCost + bmSellFee + vat;
  const net = minPrice - totalCosts;
  const margin = minPrice > 0 ? (net / minPrice) * 100 : 0;
  const breakEven = totalFixedCost > 0
    ? Math.ceil((totalFixedCost - purchase * VAT_RATE) / (1 - BM_SELL_FEE_RATE - VAT_RATE))
    : 0;

  return {
    proposed: round2(predictedSalePrice),
    minPrice,
    bmBuyFee: round2(bmBuyFee),
    bmSellFee: round2(bmSellFee),
    vat: round2(vat),
    totalFixedCost: round2(totalFixedCost),
    totalCosts: round2(totalCosts),
    net: round2(net),
    margin: round2(margin),
    breakEven,
  };
}

function classifyRecommendation({ row, mainItem, costs, pnl, price, gradeInfo }) {
  const flags = [];
  const gaps = [];
  const status = colValue(mainItem, 'status4');
  const repairType = colValue(mainItem, 'status24');
  const icloud = colValue(mainItem, 'color_mkyp4jjh') || colValue(row.bmItem, 'mirror3__1');
  const liquid = colValue(mainItem, 'color_mkqg8ktb') || colValue(row.bmItem, 'lookup_mkqgsg46');
  const topCase = colValue(mainItem, 'status_2_mkmcj0tz');
  const lid = colValue(mainItem, 'status_2_mkmc4tew');
  const screen = colValue(mainItem, 'color_mkp5ykhf') || colValue(row.bmItem, 'lookup_mkqg1q79');
  const predictedRepairNeeds = row.predictedRepairNeeds || [];

  if (!row.mainItemId) gaps.push('missing_main_item_link');
  if (!row.model) gaps.push('missing_model_a_number');
  if (!row.ram) gaps.push('missing_ram');
  if (!row.ssd) gaps.push('missing_ssd');
  if (!row.colour) gaps.push('missing_colour');
  if (!costs.purchasePrice) gaps.push('missing_purchase_price');
  if (!gradeInfo.grade) gaps.push('missing_final_or_pregrade');
  if (!price.price) gaps.push('missing_sale_price_match');

  if (/on/i.test(icloud)) flags.push('icloud_on_or_not_cleared');
  if (/liquid|yes/i.test(liquid)) flags.push('liquid_damage');
  if (/dead/i.test(topCase)) flags.push('top_case_dead');
  if (/fair/i.test(screen)) flags.push('screen_fair_or_worse');
  if (/5V|5 V/i.test(colValue(mainItem, 'color_mkwr7s1s'))) flags.push('charging_or_board_risk');
  if (predictedRepairNeeds.includes('logic_board')) flags.push('logic_board_risk_predicted');

  if (gaps.length) {
    return {
      recommendation: 'DATA_REQUIRED',
      confidence: 'low',
      rationale: `Cannot price safely until ${gaps.join(', ')} is resolved.`,
      flags,
      gaps,
    };
  }

  const inferredGrade = !['final_grade', 'predicted_from_pregrades', 'predicted_from_pregrades_topcase_dead'].includes(gradeInfo.source);
  const inferredNote = inferredGrade ? ` Using ${gradeInfo.source} grade, so review before committing repair spend.` : '';

  if (/on/i.test(icloud)) {
    return {
      recommendation: 'SELL_DIAGNOSED_WITH_ISSUES_OR_RETURN',
      confidence: 'medium',
      rationale: 'iCloud is not clearly off, so do not invest repair labour until ownership lock is cleared.',
      flags,
      gaps,
    };
  }

  if (flags.includes('logic_board_risk_predicted') && costs.partsCost === 0) {
    return {
      recommendation: pnl.net < 0 ? 'STRIP_FOR_PARTS' : 'SELL_DIAGNOSED_WITH_ISSUES',
      confidence: 'medium',
      rationale: 'Board-level risk is inferred but no reliable board part cost is available, so do not treat this as a clean repair-and-sell decision.',
      flags,
      gaps,
    };
  }

  if (pnl.net >= 150 && pnl.margin >= 25) {
    return {
      recommendation: inferredGrade ? 'REPAIR_AND_SELL_REVIEW' : 'REPAIR_AND_SELL',
      confidence: inferredGrade ? 'medium' : 'high',
      rationale: `Strong economics at min price: net £${pnl.net}, margin ${pnl.margin}%.${inferredNote}`,
      flags,
      gaps,
    };
  }

  if (pnl.net >= 100 && pnl.margin >= 20) {
    return {
      recommendation: 'REPAIR_AND_SELL_REVIEW',
      confidence: inferredGrade ? 'low' : 'medium',
      rationale: `Meets secondary economics only: net £${pnl.net}, margin ${pnl.margin}%.${inferredNote}`,
      flags,
      gaps,
    };
  }

  const hasRepairBurden = costs.partsCost >= 80 || costs.labourCost >= 80 || flags.includes('top_case_dead') || flags.includes('liquid_damage') || flags.includes('charging_or_board_risk') || flags.includes('logic_board_risk_predicted');

  if (pnl.net >= 0 && !hasRepairBurden) {
    return {
      recommendation: 'SELL_AS_IS',
      confidence: inferredGrade ? 'low' : 'medium',
      rationale: `Positive but weak margin with low known repair burden: net £${pnl.net}, margin ${pnl.margin}%.${inferredNote}`,
      flags,
      gaps,
    };
  }

  if (pnl.net >= 0) {
    return {
      recommendation: 'SELL_DIAGNOSED_WITH_ISSUES',
      confidence: inferredGrade ? 'low' : 'medium',
      rationale: `Repair route is marginal after known costs: net £${pnl.net}, margin ${pnl.margin}%. Prefer cash recovery unless reviewed.${inferredNote}`,
      flags,
      gaps,
    };
  }

  if (pnl.net < 0 && (hasRepairBurden || pnl.breakEven > price.price * 1.1)) {
    return {
      recommendation: 'STRIP_FOR_PARTS',
      confidence: inferredGrade ? 'low' : 'medium',
      rationale: `Predicted sale loses £${Math.abs(pnl.net)} at min price; break-even £${pnl.breakEven} exceeds predicted market £${price.price}.${inferredNote}`,
      flags,
      gaps,
    };
  }

  return {
    recommendation: 'SELL_DIAGNOSED_WITH_ISSUES',
    confidence: 'low',
    rationale: `Negative economics, but parts value is not quantified in Monday. Use diagnosed sale/offload unless parts are known valuable.`,
    flags,
    gaps,
  };
}

function buildRow(bmItem, mainItem, soldLookup, catalog, registry, partsMap, productsMap) {
  const mainItemId = linkedIds(bmItem, 'board_relation')[0] || '';
  const deviceName = colValue(bmItem, 'lookup') || bmItem.name;
  const model = (deviceName.match(/A\d{4}/) || bmItem.name.match(/A\d{4}/) || [''])[0];
  const ram = colValue(bmItem, 'status__1');
  const ssd = colValue(bmItem, 'color2');
  const cpu = colValue(bmItem, 'status7__1') || colValue(bmItem, 'text5__1');
  const gpu = colValue(bmItem, 'status8__1');
  const colour = colValue(bmItem, 'mirror');
  const purchasePrice = parseNumber(colValue(bmItem, 'numeric'));

  const partsUsedIds = linkedIds(mainItem, 'connect_boards__1').map(String);
  const partsRequiredIds = linkedIds(mainItem, 'board_relation_mm01yt93').map(String);
  const requestedRepairIds = linkedIds(mainItem, 'board_relation').map(String);
  const partsUsed = partsUsedIds.map((id) => partsMap.get(id)).filter(Boolean);
  const partsRequired = partsRequiredIds.map((id) => partsMap.get(id)).filter(Boolean);
  const requestedRepairs = requestedRepairIds.map((id) => productsMap.get(id)).filter(Boolean);
  const requestedRepairPartIds = [...new Set(requestedRepairs.flatMap((product) => product.partIds || []))];
  const requestedRepairParts = requestedRepairPartIds.map((id) => partsMap.get(id)).filter(Boolean);

  const actualPartsMirrorCost = sumMirrorValues(colValue(mainItem, 'lookup_mkx1xzd7') || colValue(bmItem, 'lookup_mkxf83vt'));
  const partsUsedCost = sumPartCosts(partsUsedIds, partsMap);
  const partsRequiredCost = sumPartCosts(partsRequiredIds, partsMap);
  const requestedRepairPartsCost = sumPartCosts(requestedRepairPartIds, partsMap);
  const linkedPartsCost = actualPartsMirrorCost || partsUsedCost || partsRequiredCost || requestedRepairPartsCost;
  let partsCost = linkedPartsCost;
  let partsCostSource = 'none';
  if (actualPartsMirrorCost) partsCostSource = 'actual_parts_cost_mirror';
  else if (partsUsedCost) partsCostSource = 'parts_used_links';
  else if (partsRequiredCost) partsCostSource = 'parts_required_links';
  else if (requestedRepairPartsCost) partsCostSource = 'requested_repair_linked_parts';

  const labourCostFromFormula = parseNumber(colValue(mainItem, 'formula_mkx1bjqr'));
  const actualLabourHours = parseNumber(colValue(mainItem, 'formula__1')) || parseNumber(colValue(bmItem, 'lookup_mksztbgq')) / LABOUR_RATE;
  const requestedRepairMinutes = requestedRepairs.reduce((sum, product) => sum + (product.requiredMinutes || 0), 0);
  const linkedLabourHours = actualLabourHours || (requestedRepairMinutes / 60);
  const linkedLabourCost = labourCostFromFormula || linkedLabourHours * LABOUR_RATE;
  let labourHours = linkedLabourHours;
  let labourCost = linkedLabourCost;
  let labourCostSource = labourCostFromFormula || actualLabourHours
    ? 'actual_labour_formula'
    : requestedRepairMinutes
      ? 'requested_repairs_required_minutes'
      : 'none';

  const predictedRepairs = predictRepairCosts(bmItem, mainItem, model, partsMap, productsMap);
  if (!partsCost && predictedRepairs.partsCost) {
    partsCost = predictedRepairs.partsCost;
    partsCostSource = 'predicted_repair_inference';
  } else if (
    predictedRepairs.partsCost >= 30 &&
    predictedRepairs.partsCost > partsCost + 25 &&
    predictedRepairs.partsCost > partsCost * 1.25
  ) {
    partsCost = predictedRepairs.partsCost;
    partsCostSource = `${partsCostSource}_overridden_by_prediction`;
  }
  if (!labourCost && predictedRepairs.labourCost) {
    labourHours = predictedRepairs.labourHours;
    labourCost = predictedRepairs.labourCost;
    labourCostSource = 'predicted_repair_inference';
  } else if (
    predictedRepairs.labourCost >= 24 &&
    predictedRepairs.labourCost > labourCost + 24 &&
    predictedRepairs.labourCost > labourCost * 1.25
  ) {
    labourHours = predictedRepairs.labourHours;
    labourCost = predictedRepairs.labourCost;
    labourCostSource = `${labourCostSource}_overridden_by_prediction`;
  }

  const gradeInfo = predictGradeWithFallback(mainItem, bmItem);
  const bmGrade = GRADE_TO_BM[gradeInfo.grade] || '';
  const specs = { model, ram, ssd, cpu, gpu, colour, deviceName };
  const expectedSku = bmGrade ? constructBmSku(specs, gradeInfo.grade) : '';
  const storedSku = colValue(bmItem, 'text89');
  const skuForPricing = storedSku || expectedSku;
  const storedListingId = colValue(bmItem, 'text_mkyd4bx3');
  const storedUuid = colValue(bmItem, 'text_mm1dt53s');
  const price = resolvePredictedPrice({
    soldLookup,
    catalog,
    registry,
    sku: skuForPricing,
    model,
    grade: gradeInfo.grade,
    storedListingId,
    storedUuid,
  });
  const costs = { purchasePrice, partsCost, labourCost };
  const pnl = calculateProfitability(price.price, costs);
	  const classified = classifyRecommendation({
	    row: { bmItem, mainItemId, model, ram, ssd, colour, predictedRepairNeeds: predictedRepairs.needs },
	    mainItem,
    costs,
    pnl,
    price,
    gradeInfo,
  });

  return {
    name: bmItem.name,
    bm_number: extractBmNumber(bmItem.name),
    bm_item_id: bmItem.id,
    main_item_id: mainItemId,
    group: bmItem.group?.title || '',
    main_name: mainItem?.name || '',
    status: colValue(mainItem, 'status4'),
    repair_type: colValue(mainItem, 'status24'),
    process_status: colValue(bmItem, 'color_mks9d2as'),
    trade_in_status: colValue(bmItem, 'lookup_mkys2r44'),
    device_name: deviceName,
    model,
    ram,
    ssd,
    cpu,
    gpu,
    colour,
    serial: colValue(bmItem, 'mirror7__1'),
    final_grade: colValue(mainItem, 'status_2_Mjj4GJNQ') || colValue(bmItem, 'mirror_Mjj4H2hl'),
    lid_pregrade: colValue(mainItem, 'status_2_mkmc4tew'),
    topcase_pregrade: colValue(mainItem, 'status_2_mkmcj0tz'),
    lcd_pregrade: colValue(mainItem, 'color_mkp5ykhf'),
    predicted_grade: gradeInfo.grade,
    grade_source: gradeInfo.source,
    reported_screen: colValue(bmItem, 'lookup_mkqgkkpg'),
    actual_screen: colValue(bmItem, 'lookup_mkqg1q79'),
    reported_casing: colValue(bmItem, 'lookup_mkqgq791'),
    actual_casing: colValue(bmItem, 'lookup_mkqg33kj'),
    reported_functionality: colValue(bmItem, 'lookup_mkqgcza9'),
    actual_functionality: colValue(bmItem, 'lookup_mkqgzr4q'),
    liquid_damage: colValue(mainItem, 'color_mkqg8ktb') || colValue(bmItem, 'lookup_mkqgsg46'),
    icloud: colValue(mainItem, 'color_mkyp4jjh') || colValue(bmItem, 'mirror3__1'),
    ammeter: colValue(mainItem, 'color_mkwr7s1s'),
	    purchase_price: round2(purchasePrice),
	    parts_cost: round2(partsCost),
	    parts_cost_source: partsCostSource,
	    linked_parts_cost: round2(linkedPartsCost),
	    actual_parts_mirror_cost: round2(actualPartsMirrorCost),
	    parts_used_cost: round2(partsUsedCost),
	    parts_required_cost: round2(partsRequiredCost),
	    requested_repair_parts_cost: round2(requestedRepairPartsCost),
	    predicted_repair_needs: predictedRepairs.needs.join('|'),
	    predicted_parts_cost: round2(predictedRepairs.partsCost),
	    predicted_parts: compactNames(predictedRepairs.parts),
	    predicted_part_ids: predictedRepairs.selectedPartIds.join('|'),
	    predicted_labour_hours: round2(predictedRepairs.labourHours),
	    predicted_labour_cost: round2(predictedRepairs.labourCost),
	    predicted_repair_products: compactNames(predictedRepairs.products),
	    predicted_repair_product_ids: predictedRepairs.selectedProductIds.join('|'),
	    predicted_repair_source: predictedRepairs.source,
	    labour_hours: round2(labourHours),
	    labour_cost: round2(labourCost),
	    labour_cost_source: labourCostSource,
	    linked_labour_hours: round2(linkedLabourHours),
	    linked_labour_cost: round2(linkedLabourCost),
	    requested_repair_minutes: round2(requestedRepairMinutes),
    shipping: SHIPPING_COST,
    bm_buy_fee: pnl.bmBuyFee,
    total_fixed_cost: pnl.totalFixedCost,
    predicted_sale_price: price.price ? round2(price.price) : '',
    price_source: price.source,
    price_sample_size: price.sample || '',
    min_price: pnl.minPrice || '',
    bm_sell_fee: pnl.bmSellFee || '',
    vat: pnl.vat || '',
    total_costs_at_min: pnl.totalCosts || '',
    break_even_price: pnl.breakEven || '',
    net_profit_at_min: price.price ? pnl.net : '',
    margin_percent_at_min: price.price ? pnl.margin : '',
    stored_sku: storedSku,
    expected_sku: expectedSku,
    sku_match: storedSku && expectedSku ? String(storedSku === expectedSku) : '',
    bm_listing_id: storedListingId,
    product_id: price.productId || storedUuid,
    resolver_listing_id: price.listingId || '',
    requested_repairs: compactNames(requestedRepairs) || relationDisplay(mainItem, 'board_relation'),
    parts_required: compactNames(partsRequired) || relationDisplay(mainItem, 'board_relation_mm01yt93'),
    parts_used: compactNames(partsUsed) || relationDisplay(mainItem, 'connect_boards__1'),
    requested_repair_parts: compactNames(requestedRepairParts),
    requested_repair_ids: requestedRepairIds.join('|'),
    parts_required_ids: partsRequiredIds.join('|'),
    parts_used_ids: partsUsedIds.join('|'),
    part_to_order: colValue(mainItem, 'text_mkpp9s3h'),
    diagnostic_update_excerpt: updateText(mainItem).replace(/\s+/g, ' ').slice(0, 500),
    recommendation: classified.recommendation,
    confidence: classified.confidence,
    rationale: classified.rationale,
    flags: classified.flags.join('|'),
    data_gaps: classified.gaps.join('|'),
    reported_damage_fault: colValue(bmItem, 'text81'),
    confirmed_damage_fault: colValue(bmItem, 'text3__1'),
  };
}

async function main() {
  const soldLookup = readJson(SOLD_PRICES_PATH);
  const catalog = readJson(BM_CATALOG_PATH);
  const registry = upgradeRegistrySchema(readJson(REGISTRY_PATH)).registry;

  const bmItems = await fetchBmTradeIns();
  const mainIds = bmItems.flatMap((item) => linkedIds(item, 'board_relation'));
  const mainItems = await fetchMainItems(mainIds);
  const mainItemsArray = [...mainItems.values()];
  const productIds = mainItemsArray.flatMap((item) => linkedIds(item, 'board_relation').map(String));
  const directPartIds = mainItemsArray.flatMap((item) => [
    ...linkedIds(item, 'connect_boards__1'),
    ...linkedIds(item, 'board_relation_mm01yt93'),
  ].map(String));
  const productsMap = await fetchAllProducts();
  const linkedProducts = await fetchProducts(productIds);
  for (const [id, product] of linkedProducts) productsMap.set(id, product);

  const productPartIds = [...productsMap.values()].flatMap((product) => product.partIds || []);
  const partsMap = await fetchAllParts();
  const linkedParts = await fetchParts([...directPartIds, ...productPartIds]);
  for (const [id, part] of linkedParts) partsMap.set(id, part);

  const rows = bmItems.map((bmItem) => {
    const mainItemId = linkedIds(bmItem, 'board_relation')[0] || '';
    return buildRow(
      bmItem,
      mainItems.get(String(mainItemId)) || { column_values: [], updates: [] },
      soldLookup,
      catalog,
      registry,
      partsMap,
      productsMap
    );
  });

  rows.sort((a, b) => {
    const aNum = parseInt((a.bm_number.match(/\d+/) || ['0'])[0], 10);
    const bNum = parseInt((b.bm_number.match(/\d+/) || ['0'])[0], 10);
    return aNum - bNum;
  });

  const headers = [
    'name', 'bm_number', 'bm_item_id', 'main_item_id', 'group', 'main_name',
    'status', 'repair_type', 'process_status', 'trade_in_status',
    'device_name', 'model', 'ram', 'ssd', 'cpu', 'gpu', 'colour', 'serial',
    'final_grade', 'lid_pregrade', 'topcase_pregrade', 'lcd_pregrade',
    'predicted_grade', 'grade_source',
    'reported_screen', 'actual_screen', 'reported_casing', 'actual_casing',
    'reported_functionality', 'actual_functionality', 'liquid_damage',
    'icloud', 'ammeter',
    'purchase_price', 'parts_cost', 'labour_hours', 'labour_cost', 'shipping',
    'parts_cost_source', 'linked_parts_cost', 'actual_parts_mirror_cost',
    'parts_used_cost', 'parts_required_cost', 'requested_repair_parts_cost',
    'predicted_repair_needs', 'predicted_parts_cost', 'predicted_parts',
    'predicted_part_ids', 'predicted_labour_hours', 'predicted_labour_cost',
    'predicted_repair_products', 'predicted_repair_product_ids',
    'predicted_repair_source',
    'labour_cost_source', 'linked_labour_hours', 'linked_labour_cost',
    'requested_repair_minutes',
    'bm_buy_fee', 'total_fixed_cost', 'predicted_sale_price', 'price_source',
    'price_sample_size', 'min_price', 'bm_sell_fee', 'vat', 'total_costs_at_min',
    'break_even_price', 'net_profit_at_min', 'margin_percent_at_min',
    'stored_sku', 'expected_sku', 'sku_match', 'bm_listing_id', 'product_id',
    'resolver_listing_id', 'requested_repairs', 'parts_required', 'parts_used',
    'requested_repair_parts', 'requested_repair_ids', 'parts_required_ids',
    'parts_used_ids', 'part_to_order', 'diagnostic_update_excerpt',
    'recommendation', 'confidence', 'rationale',
    'flags', 'data_gaps', 'reported_damage_fault', 'confirmed_damage_fault',
  ];

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n') + '\n';
  fs.writeFileSync(OUT_FILE, csv);

  const counts = rows.reduce((acc, row) => {
    acc[row.recommendation] = (acc[row.recommendation] || 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({
    output: OUT_FILE,
    group_id: BM_TRADE_INS_GROUP,
    rows: rows.length,
	    linked_requested_repairs: productIds.length,
	    linked_direct_parts: directPartIds.length,
	    product_catalog_items: productsMap.size,
	    parts_catalog_items: partsMap.size,
	    resolved_products: productsMap.size,
	    resolved_parts: partsMap.size,
    recommendation_counts: counts,
  }, null, 2));
}

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exit(1);
});
