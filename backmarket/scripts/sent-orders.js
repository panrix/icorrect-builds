#!/usr/bin/env node
/**
 * sent-orders.js — SOP 01: Trade-in SENT Orders
 *
 * Polls BM buyback API for orders with status SENT (customer has shipped),
 * deduplicates against Monday, creates linked items on Main Board + BM Devices Board.
 *
 * Usage:
 *   node sent-orders.js              # Detect + create (default: dry run)
 *   node sent-orders.js --dry-run    # Preview only
 *   node sent-orders.js --live       # Create items on Monday
 *
 * SOP 01 Step Checklist:
 *   Step 1: Fetch SENT orders from BM buyback API        ✅ fetchSentOrders()
 *   Step 2: Dedup against Main Board (text_mky01vb4)     ✅ getExistingTradeInIds()
 *   Step 3: Create Main Board item (Incoming Future)     ✅ createMainBoardItem()
 *   Step 4: Create BM Devices Board item (BM Trade-Ins)  ✅ createBmDevicesItem()
 *   Step 5: Link items via board relation                ✅ linkItems()
 *   Step 6: Notification to BM Telegram                  ✅ sendNotification()
 *
 * CRITICAL RULES:
 *   - Dedup on BM order public ID (text_mky01vb4 on Main Board)
 *   - Create on BOTH boards, linked together
 *   - Missing fields: create anyway with available data, log warning
 *   - Board relation failure: log error, flag for manual fix
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { postTelegram: sendTelegram } = require('./lib/notifications');

// ─── Config ───────────────────────────────────────────────────────
const BM_BASE = 'https://www.backmarket.co.uk';
const BM_AUTH = process.env.BACKMARKET_API_AUTH;
const BM_LANG = process.env.BACKMARKET_API_LANG || 'en-gb';
const BM_UA = process.env.BACKMARKET_API_UA;
const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN;

const MAIN_BOARD = 349212843;
const BM_DEVICES_BOARD = 3892194968;
const DEVICE_LOOKUP_BOARD = 3923707691;
const MAIN_BOARD_GROUP = 'new_group34198';       // "Incoming Future"
const BM_DEVICES_GROUP = 'group_mkq3wkeq';      // "BM Trade-Ins"
const DEVICE_LOOKUP_GROUP = 'new_group';
const TRADE_INS_LOG_PATH = path.join(__dirname, '..', 'data', 'trade-ins-created.jsonl');

const args = process.argv.slice(2);
const isLive = args.includes('--live');
const isDryRun = !isLive;
const specificOrders = args.filter(a => a.startsWith('--order=')).map(a => a.split('=')[1]);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const STORAGE_NORMALIZATION = { '1000GB': '1TB', '2000GB': '2TB', '4000GB': '4TB' };
const BATTERY_MAP = { Normal: 'Normal', 'Service recommended': 'Service', Service: 'Service' };
const SCREEN_MAP = { Flawless: 'Excellent', 'Flawless appearance': 'Excellent', Good: 'Good', Used: 'Fair', Cracked: 'Damaged' };
const CASING_MAP = { Flawless: 'Excellent', 'Flawless appearance': 'Excellent', Good: 'Good', Used: 'Fair', 'Broken sides and/or back': 'Damaged' };
const FUNCTIONAL_MAP = { 'Product is functional': 'Functional', "Product isn't functional": 'Not Functional' };
const BM_TO_DEVICE_MAP = {
  'MacBook Air 13 (Late 2020)': 'MacBook Air 13 M1 A2337',
  'MacBook Air 13 (2020-01-01T00:00:00+00:00)': 'MacBook Air 13 M1 A2337',
  'MacBook Air 13 (Mid 2022)': 'MacBook Air 13 M2 A2681',
  'MacBook Air 13 (Mid 2024)': 'MacBook Air 13 M3 A3113',
  'MacBook Air 13 (Early 2025)': 'MacBook Air 13 M4 A3240',
  'MacBook Air 13 (Mid 2020)': 'MacBook Air 13 A2179',
  'MacBook Air 13 (Mid 2018)': 'MacBook Air 13 A1932',
  'MacBook Air 15 (Mid 2023)': 'MacBook Air 15 M2 A2941',
  'MacBook Air 15 (Mid 2024)': 'MacBook Air 15 M3 A3114',
  'MacBook Pro 13 (Late 2020)': 'MacBook Pro 13 M1 A2338',
  'MacBook Pro 13 (Mid 2022)': 'MacBook Pro 13 M2 A2338',
  'MacBook Pro 13 (Mid 2020)': 'MacBook Pro 13 2TB 3 A2289',
  'MacBook Pro 13 (Mid 2019)': 'MacBook Pro 13 2TB 3 A2159',
  'MacBook Pro 13 Touch Bar (Mid 2019)': 'MacBook Pro 13 Touch Bar A1989',
  'MacBook Pro 13 Touch Bar (Mid 2018)': 'MacBook Pro 13 Touch Bar A1706',
  'MacBook Pro 13 4TB (Mid 2020)': 'MacBook Pro 13 4TB 3 A2251',
  'MacBook Pro 14 (Late 2021)': 'MacBook Pro 14 M1 Pro/Max A2442',
  'MacBook Pro 14 (2021-01-01T00:00:00+00:00)': 'MacBook Pro 14 M1 Pro/Max A2442',
  'MacBook Pro 14 (Early 2023)': 'MacBook Pro 14 M2 Pro/Max A2779',
  'MacBook Pro 14 (Late 2023)': 'MacBook Pro 14 M3 A2918',
  'MacBook Pro 14 (Mid 2024)': 'MacBook Pro 14 M3 A2992',
  'MacBook Pro 14 (Late 2024)': 'MacBook Pro 14 M4 A3401',
  'MacBook Pro 14 (Nov 2024)': 'MacBook Pro 14 M4 A3112',
  'MacBook Pro 15 (Mid 2019)': 'MacBook Pro 15 A1990',
  'MacBook Pro 15 (Mid 2018)': 'MacBook Pro 15 A1707',
  'MacBook Pro 16 (Late 2019)': 'MacBook Pro 16 A2141',
  'MacBook Pro 16 (Late 2021)': 'MacBook Pro 16 M1 Pro/Max A2485',
  'MacBook Pro 16 (2021-01-01T00:00:00+00:00)': 'MacBook Pro 16 M1 Pro/Max A2485',
  'MacBook Pro 16 (Early 2023)': 'MacBook Pro 16 M2 Pro/Max A2780',
  'MacBook Pro 16 (Late 2023)': 'MacBook Pro 16 M3 Pro/Max A2991',
  'MacBook 12 (Mid 2019)': 'MacBook 12 A1534',
};
const GPU_TO_CPU_MAP = {
  'M1 Pro': { '14': '8-Core', '16': '10-Core' },
  'M1 Max': { '24': '10-Core', '32': '10-Core' },
  'M2 Pro': { '16': '10-Core', '19': '12-Core' },
  'M2 Max': { '30': '12-Core', '38': '12-Core' },
  'M3 Pro': { '14': '12-Core', '18': '12-Core' },
  'M3 Max': { '30': '12-Core', '40': '12-Core' },
  'M4 Pro': { '16': '12-Core', '20': '12-Core' },
  'M4 Max': { '32': '12-Core', '40': '12-Core' },
};

// ─── API helpers ──────────────────────────────────────────────────
async function bmApi(path) {
  const url = path.startsWith('http') ? path : `${BM_BASE}${path}`;
  const r = await fetch(url, {
    headers: {
      Authorization: BM_AUTH,
      'Accept-Language': BM_LANG,
      'User-Agent': BM_UA,
      'Content-Type': 'application/json',
    },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`BM ${r.status}: ${t.slice(0, 300)}`);
  }
  return r.json();
}

async function mondayApi(query) {
  const r = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: { Authorization: MONDAY_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const d = await r.json();
  if (d.errors) console.error('  Monday API error:', JSON.stringify(d.errors));
  return d;
}

function normalizeStorage(value) {
  const raw = String(value || '').replace(/\s+/g, '').toUpperCase();
  return STORAGE_NORMALIZATION[raw] || raw;
}

function escapeGraphQLString(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function parsePdfAssessments(pdfText, apiData) {
  const cleanAssessment = value => String(value || '').replace(/\s{2,}.*$/, '').trim();
  const nameMatch = pdfText.match(/I,\s+([^,]+),\s+agree to sell/i);
  const customerName = nameMatch ? nameMatch[1].trim() : `${apiData.customer?.firstName || ''} ${apiData.customer?.lastName || ''}`.trim();
  const deviceTitle = apiData.listing?.title || '';
  const battery = cleanAssessment(pdfText.match(/^\s*Battery\s*-\s*(.+)$/im)?.[1] || '');
  const screen = cleanAssessment(pdfText.match(/^\s*Screen\s*-\s*(.+)$/im)?.[1] || '');
  const casing = cleanAssessment(pdfText.match(/^\s*Casing\s*-\s*(.+)$/im)?.[1] || '');
  const functional = cleanAssessment(pdfText.match(/^\s*Functional\s*-\s*(.+)$/im)?.[1] || '');
  return { customerName, deviceTitle, battery, screen, casing, functional };
}

async function extractPdfTextFromUrl(pdfUrl) {
  if (!pdfUrl) return '';
  const r = await fetch(pdfUrl, { headers: { 'User-Agent': BM_UA || 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`PDF ${r.status}`);
  const buffer = Buffer.from(await r.arrayBuffer());
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-pdf-'));
  const pdfPath = path.join(dir, 'packing-slip.pdf');
  fs.writeFileSync(pdfPath, buffer);
  try {
    return execFileSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
  }
}

async function getBmDevicesGroupItems() {
  const q = `{ boards(ids:[${BM_DEVICES_BOARD}]) { groups(ids:["${BM_DEVICES_GROUP}"]) { items_page(limit: 500) { items { id name column_values(ids:["text_mkqy3576"]) { id text } } } } } }`;
  const result = await mondayApi(q);
  return result.data?.boards?.[0]?.groups?.[0]?.items_page?.items || [];
}

async function getNextBmNumber(items = null) {
  const rows = items || await getBmDevicesGroupItems();
  let highest = 0;
  for (const item of rows) {
    const match = item.name?.match(/BM\s+(\d+)/i);
    if (match) highest = Math.max(highest, parseInt(match[1], 10));
  }
  return highest + 1;
}

async function findDeviceItemByName(deviceName) {
  if (!deviceName) return null;
  const q = `{ boards(ids:[${DEVICE_LOOKUP_BOARD}]) { groups(ids:["${DEVICE_LOOKUP_GROUP}"]) { items_page(limit: 500) { items { id name } } } } }`;
  const d = await mondayApi(q);
  const items = d.data?.boards?.[0]?.groups?.[0]?.items_page?.items || [];
  return items.find(item => item.name === deviceName) || null;
}

function normalizeBMModelPeriod(bmModel, deviceTitle = '') {
  const match = String(bmModel || '').match(/^(MacBook (?:Air|Pro) \d+) \(([^)]+)\)$/i);
  if (!match) return bmModel;

  const prefix = match[1];
  const period = match[2];
  const title = String(deviceTitle || '');
  const isoYear = period.match(/^(\d{4})-\d{2}-\d{2}T/);
  const year = isoYear ? isoYear[1] : '';
  const chip = title.match(/\bApple\s+(M\d)(?:\s+(Pro|Max))?/i);
  const chipName = chip ? `${chip[1].toUpperCase()}${chip[2] ? ` ${chip[2]}` : ''}` : '';

  if (year === '2020' && prefix === 'MacBook Air 13') {
    return chipName === 'M1' ? `${prefix} (Late 2020)` : `${prefix} (Mid 2020)`;
  }
  if (year === '2020' && prefix === 'MacBook Pro 13') {
    return chipName === 'M1' ? `${prefix} (Late 2020)` : `${prefix} (Mid 2020)`;
  }
  if (year === '2021' && /^MacBook Pro (14|16)$/.test(prefix)) return `${prefix} (Late 2021)`;
  if (year === '2022' && prefix === 'MacBook Air 13') return `${prefix} (Mid 2022)`;
  if (year === '2022' && prefix === 'MacBook Pro 13') return `${prefix} (Mid 2022)`;
  if (year === '2023' && /^MacBook Pro (14|16)$/.test(prefix)) {
    if (chipName.startsWith('M3')) return `${prefix} (Late 2023)`;
    return `${prefix} (Early 2023)`;
  }
  if (year === '2024' && prefix.startsWith('MacBook Air')) return `${prefix} (Mid 2024)`;
  if (year === '2025' && prefix === 'MacBook Air 13') return `${prefix} (Early 2025)`;

  return bmModel;
}

function extractBMModel(deviceTitle) {
  if (!deviceTitle) return null;
  const match = deviceTitle.match(/(MacBook (?:Air|Pro)) (\d+)"?\s*\(([^)]+)\)/i);
  if (match) {
    const rawModel = `${match[1]} ${match[2]} (${match[3]})`;
    return normalizeBMModelPeriod(rawModel, deviceTitle);
  }
  return null;
}

function detectCPU(deviceName, cpuFromTitle, deviceTitle) {
  if (cpuFromTitle && cpuFromTitle.startsWith('i')) return cpuFromTitle;
  if (cpuFromTitle && !/M\d+\s+(Pro|Max)/i.test(deviceTitle || '')) return cpuFromTitle;
  if (!deviceName) return '8-Core';
  if (!/M\d+/i.test(deviceName) && deviceName !== 'Pro/Max') {
    const intelMatch = (deviceTitle || '').match(/Core i(\d+)/i);
    return intelMatch ? `i${intelMatch[1]}` : 'i5';
  }
  if (!/Pro\/Max/i.test(deviceName)) return '8-Core';
  const chipMatch = (deviceTitle || '').match(/Apple\s+(M\d+)\s+(Pro|Max)/i);
  if (chipMatch) {
    const chipKey = `${chipMatch[1]} ${chipMatch[2]}`;
    const gpuMatch = (deviceTitle || '').match(/(\d+)-core\s+GPU/i);
    if (gpuMatch) {
      const mapped = GPU_TO_CPU_MAP[chipKey]?.[gpuMatch[1]];
      if (mapped) return mapped;
    }
    return chipKey.includes('M1') ? '10-Core' : '12-Core';
  }
  return '10-Core';
}

function deriveAssessmentLabels({ battery, screen, casing, functional }) {
  const isFullyFunctional =
    battery === 'Normal' &&
    (screen === 'Flawless' || screen === 'Flawless appearance') &&
    (casing === 'Flawless' || casing === 'Flawless appearance') &&
    functional === 'Product is functional';
  return {
    batteryLabel: BATTERY_MAP[battery] || 'Battery Reported',
    screenLabel: SCREEN_MAP[screen] || 'Screen Reported',
    casingLabel: CASING_MAP[casing] || 'Casing Reported',
    functionalLabel: functional === 'Product is functional'
      ? (isFullyFunctional ? 'Fully Functional' : 'Functional')
      : (FUNCTIONAL_MAP[functional] || 'Function Reported'),
  };
}

async function postTelegram(msg) {
  if (isDryRun) {
    console.log(`  [DRY RUN] Would send to Telegram: ${msg.slice(0, 120)}...`);
    return;
  }
  const topic = /^[⚠️❌⛔]/u.test(msg) ? 'issues' : 'tradeIns';
  await sendTelegram(msg, { logger: console, topic });
}

function buildTradeInNotification(prepared) {
  const status = /non[-\s]?functional|not functional/i.test(prepared.assessments.functionalLabel || prepared.assessments.functional || '')
    ? '🔴 Non-Functional'
    : '✅ Functional';
  const product = prepared.deviceLookup.mappedDeviceName !== 'NOT_FOUND'
    ? prepared.deviceLookup.mappedDeviceName
    : prepared.deviceTitle;
  return [
    `🆕 ${prepared.bmName} - ${product} - £${prepared.exVatPrice}`,
    `Customer: ${prepared.customerName} | Status: ${status}`,
  ].join('\n');
}

function appendTradeInCreatedLog(prepared, mainItem, bmDeviceItem) {
  const entry = {
    createdAt: new Date().toISOString(),
    publicId: prepared.publicId,
    bmName: prepared.bmName,
    product: prepared.deviceLookup.mappedDeviceName !== 'NOT_FOUND'
      ? prepared.deviceLookup.mappedDeviceName
      : prepared.deviceTitle,
    customerName: prepared.customerName,
    exVatPrice: prepared.exVatPrice,
    functionalLabel: prepared.assessments.functionalLabel,
    mainItemId: mainItem?.id || null,
    bmDeviceItemId: bmDeviceItem?.id || null,
  };
  fs.mkdirSync(path.dirname(TRADE_INS_LOG_PATH), { recursive: true });
  fs.appendFileSync(TRADE_INS_LOG_PATH, `${JSON.stringify(entry)}\n`);
}

// ─── Step 1: Fetch SENT orders from BM buyback API ───────────────
async function fetchSentOrders() {
  const all = [];
  let url = '/ws/buyback/v1/orders?status=SENT';
  while (url) {
    const d = await bmApi(url);
    const items = d.results || (Array.isArray(d) ? d : []);
    all.push(...items);
    url = d.next || null;
    if (url) await sleep(500);
  }
  return all;
}

// ─── Step 2: Dedup — get existing BM trade-in IDs from Main Board ─
async function getExistingTradeInIds() {
  const ids = new Set();
  let cursor = null;

  // First page
  const firstQ = `{ boards(ids: [${MAIN_BOARD}]) { items_page(limit: 500, query_params: { rules: [{ column_id: "text_mky01vb4", compare_value: [""], operator: is_not_empty }] }) { cursor items { column_values(ids: ["text_mky01vb4"]) { text } } } } }`;
  const first = await mondayApi(firstQ);
  const firstPage = first.data?.boards?.[0]?.items_page;
  if (firstPage) {
    for (const item of firstPage.items || []) {
      const val = item.column_values?.[0]?.text;
      if (val) ids.add(val.trim());
    }
    cursor = firstPage.cursor;
  }

  // Subsequent pages
  while (cursor) {
    const nextQ = `{ next_items_page(limit: 500, cursor: "${cursor}") { cursor items { column_values(ids: ["text_mky01vb4"]) { text } } } }`;
    const next = await mondayApi(nextQ);
    const page = next.data?.next_items_page;
    if (!page) break;
    for (const item of page.items || []) {
      const val = item.column_values?.[0]?.text;
      if (val) ids.add(val.trim());
    }
    cursor = page.cursor;
  }

  return ids;
}

// ─── Helpers: Extract nested BM buyback fields ──────────────────
// BM buyback API nests data differently from sell-side orders.
// Try multiple paths to find the right field.
function extractField(order, ...paths) {
  for (const p of paths) {
    const parts = p.split('.');
    let val = order;
    for (const part of parts) {
      if (val == null) break;
      val = val[part];
    }
    if (val != null && val !== '') return val;
  }
  return '';
}

function extractProductName(order) {
  return extractField(order,
    'listing.product.name',
    'listing.title',
    'product.name',
    'product_description',
    'product_name',
    'title',
    'listing_title'
  ) || 'Unknown';
}

function extractPrice(order) {
  const raw = extractField(order,
    'originalPrice.value',
    'originalPrice',
    'original_price',
    'price',
    'listing.price',
    'offer_price'
  );
  return parseFloat(raw) || 0;
}

function extractCustomerName(order) {
  // Try nested customer object first
  const customer = order.customer || order.sender || {};
  const first = customer.first_name || customer.firstName || order.first_name || '';
  const last = customer.last_name || customer.lastName || order.last_name || '';
  if (first || last) return `${first} ${last}`.trim();
  return order.customer_name || 'Unknown';
}

function extractTracking(order) {
  return extractField(order,
    'tracking_number',
    'inbound_tracking',
    'shipping.tracking_number',
    'trackingNumber'
  );
}

async function buildPreparedOrderData(order, bmNumber) {
  const orderDetail = order.transferCertificateLink ? order : await bmApi(`/ws/buyback/v1/orders/${order.public_id || order.orderPublicId}`);
  const publicId = orderDetail.public_id || orderDetail.orderPublicId || '';
  const orderDate = (orderDetail.date || orderDetail.created_at || orderDetail.createdAt || '').slice(0, 10);
  const trackingNumber = extractTracking(orderDetail);
  const pdfLink = orderDetail.transferCertificateLink || '';

  let pdfText = '';
  try {
    pdfText = await extractPdfTextFromUrl(pdfLink);
  } catch (e) {
    console.warn(`  ⚠️ Packing slip parse failed for ${publicId}: ${e.message}`);
  }

  const pdfData = parsePdfAssessments(pdfText, orderDetail);
  const customerName = pdfData.customerName || extractCustomerName(orderDetail) || 'Unknown';
  const deviceTitle = pdfData.deviceTitle || extractProductName(orderDetail);
  const specs = parseSpecsFromTitle(deviceTitle, orderDetail.listing?.sku);
  const bmModel = extractBMModel(deviceTitle);
  const mappedDeviceName = bmModel ? BM_TO_DEVICE_MAP[bmModel] : null;
  const matchedDevice = mappedDeviceName ? await findDeviceItemByName(mappedDeviceName) : null;
  const cpuValue = detectCPU(matchedDevice?.name || mappedDeviceName || (/M\d+\s+(Pro|Max)/i.test(deviceTitle) ? 'Pro/Max' : null), specs.cpu, deviceTitle);
  const assessments = deriveAssessmentLabels(pdfData);
  const exVatPrice = getExVatPrice(orderDetail);

  // Trade-in grade from BM — map cosmetic grades to Monday labels
  const BM_GRADE_MAP = {
    'STALLONE': 'NONFUNC_CRACK', 'BRONZE': 'NONFUNC_USED', 'SILVER': 'FUNC_CRACK',
    'GOLD': 'FUNC_USED', 'PLATINUM': 'FUNC_GOOD', 'DIAMOND': 'FUNC_EXCELLENT',
    'FUNC_CRACK': 'FUNC_CRACK', 'FUNC_USED': 'FUNC_USED', 'FUNC_GOOD': 'FUNC_GOOD',
    'FUNC_EXCELLENT': 'FUNC_EXCELLENT', 'NONFUNC_CRACK': 'NONFUNC_CRACK', 'NONFUNC_USED': 'NONFUNC_USED',
  };
  const rawGrade = extractField(orderDetail, 'listing.grade', 'grade', 'condition', 'offer_grade');
  const bmGrade = BM_GRADE_MAP[rawGrade] || '';
  if (!bmGrade && rawGrade) {
    console.warn(`  ⚠️ Unknown BM grade: "${rawGrade}" — not mapped. Grade field will be blank.`);
  }

  const bmName = `BM ${bmNumber}`;
  const mainBoardName = `${bmName} ( ${customerName} )`;

  const mainBoardColumns = {
    text_mky01vb4: publicId,
    text5: customerName,
    numbers: exVatPrice,
    text796: trackingNumber || '',
    link1: pdfLink ? { url: pdfLink, text: 'Packing Slip' } : undefined,
    status: { label: 'BM' },
    service: { label: 'Mail-In' },
    status4: { label: 'Expecting Device' },
    status24: { label: 'Diagnostic' },
    color_mkypbg6z: { label: 'Trade-in' },
    color_mkyp4jjh: { label: 'Unknown' },
    color_mkqg66bx: { label: assessments.batteryLabel },
    color_mkqg7pea: { label: assessments.screenLabel },
    color_mkqg1c3h: { label: assessments.casingLabel },
    color_mkqg578m: { label: assessments.functionalLabel },
    color_mkxga4sk: { label: specs.keyboardLayout || 'QWERTY' },
    status9: { label: specs.keyboardLayout || 'QWERTY' },
    status_1: { label: specs.ram || '8GB' },
    status_15: { label: normalizeStorage(specs.storage || '256GB') },
    status7: { label: specs.gpu || '8-Core' },
  };
  if (orderDate) mainBoardColumns.date_mkqgbbtp = { date: orderDate };
  if (matchedDevice?.id) mainBoardColumns.board_relation5 = { item_ids: [parseInt(matchedDevice.id, 10)] };
  if (cpuValue) mainBoardColumns.dropdown = { labels: [cpuValue] };
  if (!pdfLink) delete mainBoardColumns.link1;

  const bmDevicesColumns = {
    text_mkqy3576: publicId,
    text8: customerName,
    numeric: exVatPrice,
    text0: trackingNumber || '',
    link: pdfLink ? { url: pdfLink, text: 'Packing Slip' } : undefined,
    text81: extractField(orderDetail, 'customer_comment', 'comment', 'description', 'listing.description'),
    ...(bmGrade ? { color_mm1fj7tb: { label: bmGrade } } : {}),
    status__1: { label: specs.ram || '8GB' },
    color2: { label: normalizeStorage(specs.storage || '256GB') },
    status8__1: { label: /Core i\d+/i.test(deviceTitle) ? 'Intel' : (specs.gpu || '8-Core') },
  };
  if (cpuValue) bmDevicesColumns.status7__1 = { label: cpuValue };
  if (!pdfLink) delete bmDevicesColumns.link;

  // Remove undefined fields before JSON serialization
  for (const [key, val] of Object.entries(mainBoardColumns)) if (val === undefined || val === '') delete mainBoardColumns[key];
  for (const [key, val] of Object.entries(bmDevicesColumns)) if (val === undefined || val === '') delete bmDevicesColumns[key];

  return {
    orderDetail,
    publicId,
    bmNumber,
    bmName,
    mainBoardName,
    customerName,
    deviceTitle,
    orderDate,
    trackingNumber,
    pdfLink,
    exVatPrice,
    specs: {
      ram: specs.ram || '8GB',
      ssd: normalizeStorage(specs.storage || '256GB'),
      gpu: /Core i\d+/i.test(deviceTitle) ? 'Intel' : (specs.gpu || '8-Core'),
      keyboard: specs.keyboardLayout || 'QWERTY',
      cpuValue,
    },
    assessments: {
      battery: pdfData.battery,
      screen: pdfData.screen,
      casing: pdfData.casing,
      functional: pdfData.functional,
      ...assessments,
    },
    deviceLookup: {
      bmModel,
      mappedDeviceName: matchedDevice?.name || mappedDeviceName || 'NOT_FOUND',
      deviceItemId: matchedDevice?.id || null,
    },
    mainBoardColumns,
    bmDevicesColumns,
  };
}

// ─── Step 3: Create Main Board item ──────────────────────────────
async function createMainBoardItem(prepared) {
  const escapedVals = JSON.stringify(JSON.stringify(prepared.mainBoardColumns));
  const q = `mutation { create_item(
    board_id: ${MAIN_BOARD},
    group_id: "${MAIN_BOARD_GROUP}",
    item_name: "${escapeGraphQLString(prepared.mainBoardName)}",
    column_values: ${escapedVals}
  ) { id name } }`;
  const d = await mondayApi(q);
  return d.data?.create_item;
}

// ─── Spec extraction from BM listing title / SKU ─────────────────
// Title format: "MacBook Pro 14" (Late 2021) - Apple M1 Pro 10-core - 16 GB Memory - 512 GB - 16-core GPU - QWERTY"
// SKU format:   "MBP14.2021.M1PRO.APPLECORE.16GB.512GB.FUNC.CRACK"
function parseSpecsFromTitle(title, sku) {
  const result = { ram: '', storage: '', cpu: '', gpu: '', keyboardLayout: '' };
  if (!title) return result;

  // Split on " - " separators
  const parts = title.split(' - ').map(s => s.trim());
  // parts[0] = model (e.g. "MacBook Pro 14\" (Late 2021)")
  // parts[1] = cpu   (e.g. "Apple M1 Pro 10-core")
  // parts[2] = ram   (e.g. "16 GB Memory")
  // parts[3] = ssd   (e.g. "512 GB")
  // parts[4] = gpu   (e.g. "16-core GPU")
  // parts[5] = keyboard (e.g. "QWERTY")

  if (parts[1]) {
    // CPU column uses core count labels: "8-Core", "10-Core", "Intel", "i5"
    // Title: "Apple M1 Pro 10-core" → "10-Core"
    // Title: "Apple M1" (no core count) → skip (team fills manually)
    // Title: "Intel Core i5" → "Intel"
    if (/intel/i.test(parts[1])) {
      result.cpu = 'Intel';
    } else {
      const coreMatch = parts[1].match(/(\d+)-core/i);
      if (coreMatch) result.cpu = coreMatch[1] + '-Core';
    }
  }

  if (parts[2]) {
    // Extract RAM: "16 GB Memory" → "16GB"
    const ramMatch = parts[2].match(/(\d+)\s*GB/i);
    if (ramMatch) result.ram = ramMatch[1] + 'GB';
  }

  if (parts[3]) {
    // Extract SSD: "512 GB" → "512GB"
    const ssdMatch = parts[3].match(/(\d+)\s*(?:GB|TB)/i);
    if (ssdMatch) result.storage = normalizeStorage(parts[3].replace(/\s+/g, '').toUpperCase());
  }

  if (parts[4]) {
    // Extract GPU: "16-core GPU" → "16-Core"
    const gpuMatch = parts[4].match(/(\d+-core)/i);
    if (gpuMatch) result.gpu = gpuMatch[1].replace('core', 'Core');
  }

  if (parts[5]) {
    result.keyboardLayout = parts[5];
  }

  // Fallback to SKU for RAM/SSD if title didn't provide them
  if (sku && (!result.ram || !result.storage)) {
    const skuParts = sku.split('.');
    for (const p of skuParts) {
      if (!result.ram && /^\d+GB$/i.test(p) && parseInt(p) <= 128) result.ram = p.toUpperCase();
      if (!result.storage && /^\d+GB$/i.test(p) && parseInt(p) >= 128) result.storage = normalizeStorage(p.toUpperCase());
      if (!result.storage && /^\d+TB$/i.test(p)) result.storage = normalizeStorage(p.toUpperCase());
    }
  }

  return result;
}

function getExVatPrice(order) {
  const raw = extractPrice(order);
  return raw > 0 ? Math.round(raw / 1.1) : 0;
}

// ─── Step 4: Create BM Devices Board item ────────────────────────
async function createBmDevicesItem(prepared) {
  const escapedVals = JSON.stringify(JSON.stringify(prepared.bmDevicesColumns));
  const q = `mutation { create_item(
    board_id: ${BM_DEVICES_BOARD},
    group_id: "${BM_DEVICES_GROUP}",
    item_name: "${escapeGraphQLString(prepared.bmName)}",
    column_values: ${escapedVals}
  ) { id name } }`;
  const d = await mondayApi(q);
  return d.data?.create_item;
}

async function verifyBmDevicesItem(itemId) {
  if (!itemId) return;

  await sleep(1000);
  const verifyQ = `{ items(ids: [${itemId}]) { column_values(ids: ["numeric", "text0", "link"]) { id text } } }`;
  const verifyResult = await mondayApi(verifyQ);
  const cols = verifyResult.data?.items?.[0]?.column_values || [];
  const missing = [];

  for (const col of cols) {
    if (!col.text || col.text === '') missing.push(col.id);
  }

  if (missing.length > 0) {
    console.warn(`  ⚠️ Post-create check: empty columns: ${missing.join(', ')}`);
  }
}

// ─── Step 5: Link items via board relation ───────────────────────
async function linkItems(bmDeviceItemId, mainItemId) {
  const q = `mutation { change_column_value(
    board_id: ${BM_DEVICES_BOARD},
    item_id: ${bmDeviceItemId},
    column_id: "board_relation",
    value: "{\\"item_ids\\": [${mainItemId}]}"
  ) { id } }`;
  const d = await mondayApi(q);
  return !!d.data;
}

function logPreparedOrder(prepared) {
  console.log(`  BM Number: ${prepared.bmNumber}`);
  console.log(`  Main Board name: ${prepared.mainBoardName}`);
  console.log(`  BM Devices name: ${prepared.bmName}`);
  console.log(`  Device title: ${prepared.deviceTitle}`);
  console.log(`  Device match: ${prepared.deviceLookup.mappedDeviceName} (${prepared.deviceLookup.deviceItemId || 'no item id'})`);
  console.log('  Main Board columns:');
  console.log(JSON.stringify(prepared.mainBoardColumns, null, 2));
  console.log('  BM Devices columns:');
  console.log(JSON.stringify(prepared.bmDevicesColumns, null, 2));
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(60));
  console.log(`  SOP 01: Trade-in SENT Orders — ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  console.log('\nSOP 01 Checklist:');
  console.log('  Step 1: Fetch SENT orders                ✅ fetchSentOrders()');
  console.log('  Step 2: Dedup against Main Board         ✅ getExistingTradeInIds()');
  console.log('  Step 3: Create Main Board item           ✅ createMainBoardItem()');
  console.log('  Step 4: Create BM Devices Board item     ✅ createBmDevicesItem()');
  console.log('  Step 5: Link items via board relation    ✅ linkItems()');
  console.log('  Step 6: Telegram notification            ✅ postTelegram()');
  console.log('');

  // Step 1
  let orders;
  if (specificOrders.length > 0) {
    console.log(`[Step 1] Fetching ${specificOrders.length} specific order(s) from BM buyback API...`);
    orders = [];
    for (const id of specificOrders) {
      try {
        const order = await bmApi(`/ws/buyback/v1/orders/${id}`);
        orders.push(order);
        console.log(`  ✅ ${id} (${order.status})`);
      } catch (e) {
        console.error(`  ❌ ${id}: ${e.message}`);
      }
      await sleep(500);
    }
  } else {
    console.log('[Step 1] Fetching SENT orders from BM buyback API...');
    try {
      orders = await fetchSentOrders();
    } catch (e) {
      console.error(`  ❌ Failed to fetch orders: ${e.message}`);
      await postTelegram(`❌ SOP 01: Failed to fetch SENT orders from BM API: ${e.message}`);
      process.exit(1);
    }
  }
  console.log(`  ${orders.length} orders found\n`);

  if (orders.length === 0) {
    console.log('No SENT orders. Done.');
    return;
  }

  // Step 2
  console.log('[Step 2] Fetching existing BM trade-in IDs from Monday...');
  const existingIds = await getExistingTradeInIds();
  console.log(`  ${existingIds.size} existing trade-in IDs on Monday\n`);
  const bmGroupItems = await getBmDevicesGroupItems();
  let nextBmNumber = await getNextBmNumber(bmGroupItems);
  console.log(`  Next BM number: ${nextBmNumber}\n`);

  const summary = { created: 0, skipped: 0, errors: 0 };

  for (const order of orders) {
    const publicId = order.public_id || order.orderPublicId || '?';
    const productName = extractProductName(order);
    const price = extractPrice(order) || '?';

    console.log('─'.repeat(50));
    console.log(`Order: ${publicId}`);
    console.log(`Product: ${productName}`);
    console.log(`Price: £${price}`);

    // Dedup check
    if (existingIds.has(publicId)) {
      console.log(`  ⏭️ Already exists on Monday. Skipping.`);
      summary.skipped++;
      continue;
    }

    let prepared;
    try {
      prepared = await buildPreparedOrderData(order, nextBmNumber);
      nextBmNumber++;
    } catch (e) {
      console.error(`  ❌ Failed to prepare order payload: ${e.message}`);
      summary.errors++;
      continue;
    }
    if (!prepared.deviceLookup.deviceItemId) {
      const lookupMsg = `⚠️ Device lookup failed for ${publicId}: "${prepared.deviceTitle}" resolved as "${prepared.deviceLookup.bmModel || 'unknown'}". Main Board device relation will be blank unless fixed manually.`;
      console.warn(`  ${lookupMsg}`);
      await postTelegram(`SOP 01 warning\n${lookupMsg}`);
    }

    if (isDryRun) {
      console.log(`  [DRY RUN] Would create items on both boards and link them.`);
      logPreparedOrder(prepared);
      summary.created++;
      continue;
    }

    // Step 3: Create Main Board item
    console.log(`\n  [Step 3] Creating Main Board item...`);
    let mainItem;
    try {
      mainItem = await createMainBoardItem(prepared);
      if (!mainItem) throw new Error('No item returned');
      console.log(`  ✅ Main Board: ${mainItem.name} (ID: ${mainItem.id})`);
    } catch (e) {
      console.error(`  ❌ Main Board create failed: ${e.message}`);
      summary.errors++;
      continue;
    }

    await sleep(500); // Monday rate limit

    // Step 4: Create BM Devices Board item
    console.log(`  [Step 4] Creating BM Devices Board item...`);
    let bmDeviceItem;
    try {
      bmDeviceItem = await createBmDevicesItem(prepared);
      if (!bmDeviceItem) throw new Error('No item returned');
      console.log(`  ✅ BM Devices: ${bmDeviceItem.name} (ID: ${bmDeviceItem.id})`);
      await verifyBmDevicesItem(bmDeviceItem.id);
    } catch (e) {
      console.error(`  ❌ BM Devices create failed: ${e.message}`);
      console.error(`  ⚠️ Main Board item ${mainItem.id} created but BM Devices failed. Manual fix needed.`);
      await postTelegram(`⚠️ SOP 01: Main Board item created for ${publicId} but BM Devices create failed: ${e.message}. Manual fix needed.`);
      summary.errors++;
      continue;
    }

    await sleep(500);

    // Step 5: Link items
    console.log(`  [Step 5] Linking items...`);
    const linked = await linkItems(bmDeviceItem.id, mainItem.id);
    if (linked) {
      console.log(`  ✅ Items linked`);
    } else {
      console.error(`  ❌ Board relation failed. Items created but NOT linked. Manual fix needed.`);
      await postTelegram(`⚠️ SOP 01: Items created for ${publicId} but board relation failed. Main: ${mainItem.id}, BM Device: ${bmDeviceItem.id}. Manual link needed.`);
    }

    // Step 6: Notification
    console.log(`  [Step 6] Sending notification...`);
    appendTradeInCreatedLog(prepared, mainItem, bmDeviceItem);
    await postTelegram(buildTradeInNotification(prepared));

    console.log(`\n  ── TRADE-IN CREATED ──`);
    console.log(`  Order: ${publicId}`);
    console.log(`  Main Board: ${mainItem.id}`);
    console.log(`  BM Devices: ${bmDeviceItem.id}`);

    summary.created++;
    await sleep(1000);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Created:  ${summary.created}`);
  console.log(`  Skipped:  ${summary.skipped} (already on Monday)`);
  console.log(`  Errors:   ${summary.errors}`);

  if (summary.created > 0 && !isDryRun) {
    await postTelegram(
      `📦 SOP 01 Complete: ${summary.created} new trade-in(s) added to Monday.\n` +
      `Skipped: ${summary.skipped} | Errors: ${summary.errors}`
    );
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  BM_TO_DEVICE_MAP,
  buildPreparedOrderData,
  extractBMModel,
  normalizeBMModelPeriod,
  parseSpecsFromTitle,
};
