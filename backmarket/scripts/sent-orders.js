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

// ─── Config ───────────────────────────────────────────────────────
const BM_BASE = 'https://www.backmarket.co.uk';
const BM_AUTH = process.env.BACKMARKET_API_AUTH;
const BM_LANG = process.env.BACKMARKET_API_LANG || 'en-gb';
const BM_UA = process.env.BACKMARKET_API_UA;
const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN;

const MAIN_BOARD = 349212843;
const BM_DEVICES_BOARD = 3892194968;
const MAIN_BOARD_GROUP = 'new_group34198';       // "Incoming Future"
const BM_DEVICES_GROUP = 'group_mkq3wkeq';      // "BM Trade-Ins"
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BM_TELEGRAM_CHAT = '-1003888456344';

const args = process.argv.slice(2);
const isLive = args.includes('--live');
const isDryRun = !isLive;
const specificOrders = args.filter(a => a.startsWith('--order=')).map(a => a.split('=')[1]);
const sleep = ms => new Promise(r => setTimeout(r, ms));

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

async function postTelegram(msg) {
  if (isDryRun) {
    console.log(`  [DRY RUN] Would send to Telegram: ${msg.slice(0, 120)}...`);
    return;
  }
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('  [TG] No token, skipping');
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: BM_TELEGRAM_CHAT, text: msg }),
    });
  } catch (e) {
    console.warn(`  Telegram failed: ${e.message}`);
  }
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

// ─── Step 3: Create Main Board item ──────────────────────────────
async function createMainBoardItem(order) {
  const publicId = order.public_id || order.orderPublicId || '';
  const orderDate = (order.date || order.created_at || order.createdAt || '').slice(0, 10);
  const tracking = extractTracking(order);

  const colValues = {
    text_mky01vb4: publicId,                              // BM Trade-in ID
  };
  if (orderDate) colValues.date_mkqgbbtp = { date: orderDate }; // Date Purchased (BM)
  if (tracking) colValues.text796 = tracking;              // Inbound Tracking

  const itemName = `BM Trade-in ${publicId}`;
  const escapedVals = JSON.stringify(JSON.stringify(colValues));

  const q = `mutation { create_item(
    board_id: ${MAIN_BOARD},
    group_id: "${MAIN_BOARD_GROUP}",
    item_name: ${JSON.stringify(itemName)},
    column_values: ${escapedVals}
  ) { id name } }`;

  const d = await mondayApi(q);
  return d.data?.create_item;
}

// ─── Step 4: Create BM Devices Board item ────────────────────────
async function createBmDevicesItem(order) {
  const publicId = order.public_id || order.orderPublicId || '';
  const orderId = order.id || order.order_id || '';
  const customerName = extractCustomerName(order);
  const reportedDamage = extractField(order, 'customer_comment', 'comment', 'description', 'listing.description');
  const purchasePrice = extractPrice(order);

  // Trade-in grade from BM — map cosmetic grades to Monday labels
  const BM_GRADE_MAP = {
    'FUNC_CRACK': 'FUNC_CRACK', 'FUNC_USED': 'FUNC_USED', 'FUNC_GOOD': 'FUNC_GOOD',
    'FUNC_EXCELLENT': 'FUNC_EXCELLENT', 'NONFUNC_CRACK': 'NONFUNC_CRACK', 'NONFUNC_USED': 'NONFUNC_USED',
  };
  const rawGrade = extractField(order, 'grade', 'condition', 'listing.grade', 'offer_grade');
  const bmGrade = BM_GRADE_MAP[rawGrade] || ''; // Skip if cosmetic grade (PLATINUM/GOLD/SILVER/BRONZE)

  // Spec fields — BM nests these under listing or product objects
  const listing = order.listing || order.product || {};
  const storage = extractField(order, 'listing.storage', 'storage', 'product.storage');
  const ram = extractField(order, 'listing.ram', 'ram', 'product.ram');
  const cpu = extractField(order, 'listing.processor', 'processor', 'cpu', 'product.processor');
  const gpu = extractField(order, 'listing.gpu', 'gpu', 'product.gpu');
  const modelNumber = extractField(order, 'listing.model_number', 'model_number', 'a_number');
  const keyboardLayout = extractField(order, 'listing.keyboard_layout', 'keyboard_layout');

  const colValues = {
    text_mkqy3576: String(orderId),         // Order ID
    text8: customerName,                     // Seller
    text81: reportedDamage,                  // Reported Damage / Fault
  };

  if (purchasePrice > 0) colValues.numeric = purchasePrice;       // Purchase Price (ex VAT)
  if (bmGrade) colValues.color_mm1fj7tb = { label: bmGrade };     // Trade-in Grade
  if (storage) colValues.color2 = { label: storage };             // SSD
  if (ram) colValues.status__1 = { label: ram };                  // RAM
  if (cpu) colValues.status7__1 = { label: cpu };                 // CPU
  if (gpu) colValues.status8__1 = { label: gpu };                 // GPU
  // text column (Model Number) deleted Mar 23 — model extracted from device name downstream
  if (keyboardLayout) colValues.keyboard_layout__1 = { label: keyboardLayout }; // Keyboard Layout

  const itemName = order.product_name || order.title || `Trade-in ${publicId}`;
  const escapedVals = JSON.stringify(JSON.stringify(colValues));

  const q = `mutation { create_item(
    board_id: ${BM_DEVICES_BOARD},
    group_id: "${BM_DEVICES_GROUP}",
    item_name: ${JSON.stringify(itemName)},
    column_values: ${escapedVals}
  ) { id name } }`;

  const d = await mondayApi(q);
  return d.data?.create_item;
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

// ─── Main ─────────────────────────────────────────────────────────
(async () => {
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

    if (isDryRun) {
      console.log(`  [DRY RUN] Would create items on both boards and link them.`);
      summary.created++;
      continue;
    }

    // Step 3: Create Main Board item
    console.log(`\n  [Step 3] Creating Main Board item...`);
    let mainItem;
    try {
      mainItem = await createMainBoardItem(order);
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
      bmDeviceItem = await createBmDevicesItem(order);
      if (!bmDeviceItem) throw new Error('No item returned');
      console.log(`  ✅ BM Devices: ${bmDeviceItem.name} (ID: ${bmDeviceItem.id})`);
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
    await postTelegram(
      `📦 New BM trade-in SENT\n` +
      `Order: ${publicId}\n` +
      `Product: ${productName}\n` +
      `Price: £${price}`
    );

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
})();
