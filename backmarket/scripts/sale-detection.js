#!/usr/bin/env node
/**
 * sale-detection.js — SOP 08: Sale Detection & Acceptance
 *
 * Polls BM for new orders (state=1), matches to Monday inventory,
 * verifies stock, accepts orders, and updates both boards.
 *
 * Usage:
 *   node sale-detection.js              # Detect + accept
 *   node sale-detection.js --dry-run    # Detect only, no actions
 *
 * SOP 08 Step Checklist:
 *   Step 1: Fetch new orders (state=1)                    ✅ fetchNewOrders()
 *   Step 2: Match to BM Devices Board by SKU              ✅ matchToBmDevice()
 *   Step 3: Verify stock (text4 empty, not in returns)    ✅ verifyStock()
 *   Step 4: Accept order (POST with order SKU)            ✅ acceptOrder()
 *   Step 5a: Update BM Devices (buyer, order ID, price)   ✅ updateBmDevices()
 *   Step 5b: Update Main Board status → Sold (index 10)   ✅ updateMainBoard()
 *   Step 5c: Update Main Board date sold                  ✅ updateMainBoard()
 *   Step 5d: Rename Main Board item to buyer name         ✅ renameMainBoardItem()
 *   Step 6: Notification to BM Telegram                   ✅ sendNotification()
 *
 * Edge cases implemented:
 *   - No match found → flag, don't accept
 *   - Already processed (text4 populated) → skip
 *   - Multi-unit listing → pick first with empty text4 in the BM Devices saleable group only
 *   - Qty -1 (double checkout) → flag for manual review
 *
 * CRITICAL RULES:
 *   - Accept uses SKU from ORDER LINE (line.listing), NOT from Monday
 *   - Accept uses order_id, NOT line item id
 *   - SKU source of truth is BM Devices text89
 *   - Only items in the BM Devices saleable group (group new_group / BM To List / Listed / Sold) are eligible for matching
 *   - Every field must match 1:1: model, spec, grade, colour
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });
const fs = require('fs');

// ─── Config ───────────────────────────────────────────────────────
const BM_BASE = 'https://www.backmarket.co.uk';
const BM_AUTH = process.env.BACKMARKET_API_AUTH;
const BM_LANG = process.env.BACKMARKET_API_LANG || 'en-gb';
const BM_UA = process.env.BACKMARKET_API_UA;
const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN;

const MAIN_BOARD = 349212843;
const BM_DEVICES_BOARD = 3892194968;
const BM_SALEABLE_GROUP = 'new_group'; // BM Devices saleable stock group (BM To List / Listed / Sold)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BM_TELEGRAM_CHAT = '-1003888456344';

const isDryRun = process.argv.includes('--dry-run');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── API helpers ──────────────────────────────────────────────────
async function bmApi(path, opts = {}) {
  const r = await fetch(BM_BASE + path, {
    method: opts.method || 'GET',
    headers: { Authorization: BM_AUTH, 'Accept-Language': BM_LANG, 'User-Agent': BM_UA, 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`BM ${r.status}: ${t.slice(0, 300)}`); }
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
  if (isDryRun) { console.log(`  [DRY RUN] Would send to Telegram: ${msg.slice(0, 100)}...`); return; }
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: BM_TELEGRAM_CHAT, text: msg }),
    });
  } catch (e) { console.warn(`  Telegram failed: ${e.message}`); }
}

// ─── Step 1: Fetch new orders ─────────────────────────────────────
async function fetchNewOrders() {
  const all = [];
  let page = 1;
  while (true) {
    const d = await bmApi(`/ws/orders?state=1&page=${page}&page_size=50`);
    const items = d.results || (Array.isArray(d) ? d : []);
    if (items.length === 0) break;
    all.push(...items);
    if (!d.next) break;
    page++;
    await sleep(300);
  }
  return all;
}

// ─── Step 2: Match to BM Devices Board ────────────────────────────
// SAFE MATCH RULES:
//   1. Match by SKU (BM Devices text89), not listing_id.
//   2. Must be in the saleable group (BM_SALEABLE_GROUP).
//   3. If multiple saleable devices share a SKU, verify via Main Board link that
//      the item isn't already in a terminal state (Sold status + non-empty date
//      sold → discard). If still ambiguous after filtering, return empty and
//      alert — never auto-pick.
async function matchToBmDevice(orderLineSku) {
  const safeSku = String(orderLineSku || '').replace(/"/g, '\\"');
  if (!safeSku) return [];
  const q = `{ boards(ids:[${BM_DEVICES_BOARD}]) { items_page(limit: 500, query_params: { rules: [{ column_id: "text89", compare_value: ["${safeSku}"] }] }) { items { id name group { id title } column_values(ids: ["text4", "text_mkye7p1c", "text89", "numeric5", "text_mkyd4bx3", "board_relation"]) { id text ... on BoardRelationValue { linked_item_ids } } } } } }`;
  const d = await mondayApi(q);
  const items = d.data?.boards?.[0]?.items_page?.items || [];
  const saleable = items.filter(item => item.group?.id === BM_SALEABLE_GROUP);

  // If only one match, return it directly
  if (saleable.length <= 1) return saleable;

  // Multiple items share this SKU — verify via Main Board to disambiguate
  console.log(`  ⚠️ Multiple BM Devices items match SKU ${orderLineSku}: ${saleable.map(i => i.name).join(', ')}`);
  console.log(`  Checking Main Board status to disambiguate...`);

  const filtered = [];
  for (const item of saleable) {
    const relCol = item.column_values.find(cv => cv.id === 'board_relation');
    const mainItemId = relCol?.linked_item_ids?.[0];
    if (!mainItemId) {
      // No Main Board link — include cautiously but warn
      console.log(`  ⚠️ ${item.name} (${item.id}) has no Main Board link — including as candidate`);
      filtered.push(item);
      continue;
    }
    const mbQ = `{ items(ids:[${mainItemId}]) { id name group { title } column_values(ids:["status24","date_mkq34t04"]) { id text } } }`;
    const mbD = await mondayApi(mbQ);
    const mbItem = mbD.data?.items?.[0];
    if (!mbItem) {
      console.log(`  ⚠️ ${item.name}: Main Board item ${mainItemId} not found — including as candidate`);
      filtered.push(item);
      continue;
    }
    const mbStatus = mbItem.column_values.find(cv => cv.id === 'status24')?.text || '';
    const mbDateSold = mbItem.column_values.find(cv => cv.id === 'date_mkq34t04')?.text || '';
    const mbGroup = mbItem.group?.title || '';
    const isTerminal = (mbStatus === 'Sold' && mbDateSold) || /returned|returns/i.test(mbGroup);
    console.log(`  ${item.name} (${item.id}): Main Board "${mbItem.name}" — status="${mbStatus}" date_sold="${mbDateSold}" group="${mbGroup}" → ${isTerminal ? 'DISCARD (terminal)' : 'KEEP'}`);
    if (!isTerminal) filtered.push(item);
  }

  if (filtered.length > 1) {
    // Still ambiguous after Main Board check — bail out, require manual fix
    console.log(`  ❌ Still ${filtered.length} ambiguous matches after Main Board check. Will not auto-accept.`);
    return []; // caller will treat as no-match and fire alert
  }

  return filtered;
}

// ─── Step 3: Verify stock ─────────────────────────────────────────
const EXCLUDED_GROUPS = ['bm returns', 'rejected'];

function verifyStock(bmDeviceItem) {
  const soldTo = bmDeviceItem.column_values.find(cv => cv.id === 'text4')?.text || '';
  const existingOrder = bmDeviceItem.column_values.find(cv => cv.id === 'text_mkye7p1c')?.text || '';
  const groupTitle = (bmDeviceItem.group?.title || '').toLowerCase();

  if (soldTo.trim()) return { ok: false, reason: `Already sold to: ${soldTo}` };
  if (existingOrder.trim()) return { ok: false, reason: `Already has order: ${existingOrder}` };
  if (EXCLUDED_GROUPS.some(g => groupTitle.includes(g))) return { ok: false, reason: `Device in excluded group: ${bmDeviceItem.group.title}` };
  return { ok: true };
}

// ─── Step 4: Accept order ─────────────────────────────────────────
async function acceptOrder(orderId, orderLineSku) {
  // CRITICAL: Use SKU from the ORDER LINE (line.listing), NOT from Monday
  // CRITICAL: Use order_id, NOT line item id
  await bmApi(`/ws/orders/${orderId}`, {
    method: 'POST',
    body: { order_id: orderId, new_state: 2, sku: orderLineSku },
  });
}

// ─── Step 5a: Update BM Devices Board ─────────────────────────────
async function updateBmDevices(bmDeviceId, visibleIdentity, orderId, salePrice) {
  const values = JSON.stringify({ text4: visibleIdentity, text_mkye7p1c: String(orderId), numeric5: salePrice });
  const q = `mutation { change_multiple_column_values(board_id: ${BM_DEVICES_BOARD}, item_id: ${bmDeviceId}, column_values: ${JSON.stringify(values)}) { id } }`;
  const d = await mondayApi(q);
  return !!d.data;
}

async function clearBmDeviceListingId(bmDeviceItem) {
  const listingCol = bmDeviceItem.column_values.find(cv => cv.id === 'text_mkyd4bx3');
  const currentListingId = listingCol?.text?.trim() || '';
  if (!currentListingId) return null;

  const values = JSON.stringify({ text_mkyd4bx3: '' });
  const q = `mutation { change_multiple_column_values(board_id: ${BM_DEVICES_BOARD}, item_id: ${bmDeviceItem.id}, column_values: ${JSON.stringify(values)}) { id } }`;
  const d = await mondayApi(q);
  if (d.data && listingCol) listingCol.text = '';
  return !!d.data;
}

// ─── Step 5b+5c: Update Main Board ───────────────────────────────
async function updateMainBoard(mainItemId, dateSold, orderId, listingId) {
  // Status → Sold (index 10), Date Sold, BM Sales Order ID, BM Listing ID
  // Order ID + Listing ID are written here (not via board_relation5) so
  // bm-shipping (SOP 09.5) and icloud-checker can read them directly off
  // the Main Board without traversing a connect-boards link.
  const values = JSON.stringify({
    status24: { index: 10 },
    date_mkq34t04: { date: dateSold },
    text_mm2vf3nk: String(orderId),
    text_mm2v7ysq: String(listingId),
  });
  const q = `mutation { change_multiple_column_values(board_id: ${MAIN_BOARD}, item_id: ${mainItemId}, column_values: ${JSON.stringify(values)}) { id } }`;
  const d = await mondayApi(q);
  return !!d.data;
}

// ─── Step 5d: Rename Main Board item ──────────────────────────────
// Format: "BM XXXX (Buyer Name)" — preserve BM number, replace seller name with buyer name
async function renameMainBoardItem(mainItemId, visibleIdentity) {
  // Fetch current item name to extract BM prefix
  const fetchQ = `{ items(ids: [${mainItemId}]) { name } }`;
  const fetchD = await mondayApi(fetchQ);
  const currentName = fetchD?.data?.items?.[0]?.name || '';

  // Extract "BM XXXX" prefix — everything up to and including the number
  const bmMatch = currentName.match(/^(BM\s+\d+)/i);
  const bmPrefix = bmMatch ? bmMatch[1] : currentName.split('(')[0].trim();

  const newName = `${bmPrefix} (${visibleIdentity})`;
  const q = `mutation { change_simple_column_value(board_id: ${MAIN_BOARD}, item_id: ${mainItemId}, column_id: "name", value: ${JSON.stringify(newName)}) { id } }`;
  console.log(`  Renaming: "${currentName}" → "${newName}"`);
  const d = await mondayApi(q);
  return !!d.data;
}

// ─── Main ─────────────────────────────────────────────────────────
(async () => {
  console.log('═'.repeat(60));
  console.log(`  SOP 08: Sale Detection & Acceptance — ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  // Verify SOP checklist
  console.log('\nSOP 08 Checklist:');
  console.log('  Step 1: Fetch orders (state=1)          ✅ fetchNewOrders()');
  console.log('  Step 2: Match to BM Devices             ✅ matchToBmDevice()');
  console.log('  Step 3: Verify stock                    ✅ verifyStock()');
  console.log('  Step 4: Accept order                    ✅ acceptOrder()');
  console.log('  Step 5a: Update BM Devices              ✅ updateBmDevices()');
  console.log('  Step 5b: Main Board status → Sold       ✅ updateMainBoard()');
  console.log('  Step 5c: Main Board date sold           ✅ updateMainBoard()');
  console.log('  Step 5d: Rename item to buyer           ✅ renameMainBoardItem()');
  console.log('  Step 6: Telegram notification           ✅ postTelegram()');
  console.log('');

  // Step 1
  console.log('[Step 1] Fetching new orders (state=1)...');
  const orders = await fetchNewOrders();
  console.log(`  ${orders.length} pending orders\n`);

  if (orders.length === 0) {
    console.log('No pending orders. Done.');
    return;
  }

  const summary = { accepted: 0, noMatch: 0, alreadyProcessed: 0, errors: 0 };

  for (const order of orders) {
    const orderId = order.order_id;
    const buyer = order.shipping_address
      ? `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`.trim()
      : 'Unknown';
    const orderDate = order.date_creation || '?';

    console.log('─'.repeat(50));
    console.log(`Order ${orderId} (${orderDate})`);
    console.log(`Buyer: ${buyer}`);

    for (const line of (order.orderlines || [])) {
      const listingId = String(line.listing_id);
      const orderLineSku = line.listing; // SKU from order — use THIS for acceptance
      const price = parseFloat(line.price) || 0;
      const product = line.product || 'Unknown';
      const lineId = line.id;
      const billingName = order.billing_address
        ? `${order.billing_address.first_name || ''} ${order.billing_address.last_name || ''}`.trim()
        : '';
      const shippingName = buyer;
      const namesDiffer = billingName && shippingName && billingName.toLowerCase() !== shippingName.toLowerCase();
      const visibleIdentity = namesDiffer
        ? `Buyer: ${billingName} / Ship to: ${shippingName}`
        : (shippingName || billingName || buyer || 'Unknown');

      console.log(`\n  Product: ${product}`);
      console.log(`  Listing ID: ${listingId}`);
      console.log(`  Order SKU: ${orderLineSku}`);
      console.log(`  Price: £${price}`);

      // Step 2: Match to BM Devices
      console.log(`\n  [Step 2] Matching SKU ${orderLineSku} to BM Devices...`);
      const matches = await matchToBmDevice(orderLineSku);
      console.log(`  Found ${matches.length} BM Device items`);

      if (matches.length === 0) {
        console.log(`  ⛔ NO MATCH. Cannot accept. Manual investigation needed.`);
        await postTelegram(`⚠️ BM order ${orderId} for SKU ${orderLineSku} (listing ${listingId}) — no unambiguous Monday match found. Check BM Devices text89/SKU and duplicate saleable stock. Manual assignment needed.`);
        summary.noMatch++;
        continue;
      }

      // For multi-unit: pick first with empty text4 (Sold to)
      const availableItem = matches.find(i => {
        const soldTo = i.column_values.find(cv => cv.id === 'text4')?.text;
        return !soldTo || soldTo.trim() === '';
      });

      if (!availableItem) {
        // All matched items already have buyers — double checkout?
        console.log(`  ⛔ All ${matches.length} matched devices already have buyers assigned.`);
        console.log(`  This may be a double checkout (qty -1 scenario).`);
        for (const m of matches) {
          const soldTo = m.column_values.find(cv => cv.id === 'text4')?.text;
          console.log(`    ${m.name}: Sold to "${soldTo}"`);
        }
        await postTelegram(`⚠️ Double checkout? Order ${orderId} for SKU ${orderLineSku} but all matched devices already have buyers. Manual assignment needed.`);
        summary.noMatch++;
        continue;
      }

      console.log(`  ✅ Matched: ${availableItem.name} (BM Device ${availableItem.id})`);

      // SKU cross-check: order line vs Monday
      const mondaySku = availableItem.column_values.find(cv => cv.id === 'text89')?.text || '';
      if (mondaySku && orderLineSku && mondaySku !== orderLineSku) {
        console.log(`  ⚠️ SKU mismatch: Order="${orderLineSku}" vs Monday="${mondaySku}". Using order SKU for acceptance.`);
      }

      // Get Main Board item ID
      const relCol = availableItem.column_values.find(cv => cv.id === 'board_relation');
      const mainItemId = relCol?.linked_item_ids?.[0];
      console.log(`  Main Board item: ${mainItemId || 'NOT LINKED'}`);

      // Step 3: Verify stock
      console.log(`\n  [Step 3] Verifying stock...`);
      const stockCheck = verifyStock(availableItem);
      if (!stockCheck.ok) {
        console.log(`  ⛔ Stock check failed: ${stockCheck.reason}. Skipping.`);
        summary.alreadyProcessed++;
        continue;
      }
      console.log(`  ✅ Stock verified`);

      if (isDryRun) {
        console.log(`\n  [DRY RUN] Would accept order ${orderId} and update Monday.`);
        continue;
      }

      // Step 4: Accept order
      console.log(`\n  [Step 4] Accepting order ${orderId} with SKU "${orderLineSku}"...`);
      try {
        await acceptOrder(orderId, orderLineSku);
        console.log(`  ✅ Order accepted`);
      } catch (e) {
        console.error(`  ❌ Accept failed: ${e.message}`);
        summary.errors++;
        continue;
      }

      try {
        const listingCleared = await clearBmDeviceListingId(availableItem);
        if (listingCleared) {
          console.log(`  ✅ Cleared BM listing_id on matched device`);
        } else if (listingCleared === false) {
          console.warn(`  WARN: Failed to clear BM listing_id on BM Device ${availableItem.id}. Continuing with accepted sale.`);
        }
      } catch (e) {
        console.warn(`  WARN: Failed to clear BM listing_id on BM Device ${availableItem.id}: ${e.message}`);
      }

      // Step 5a: Update BM Devices
      console.log(`\n  [Step 5a] Updating BM Devices...`);
      const devOk = await updateBmDevices(availableItem.id, visibleIdentity, orderId, price);
      console.log(`  BM Devices (buyer, order, price): ${devOk ? '✅' : '❌'}`);

      // Step 5b+5c: Update Main Board
      if (mainItemId) {
        const today = new Date().toISOString().slice(0, 10);
        console.log(`  [Step 5b+5c] Updating Main Board status → Sold, date → ${today}, order ${orderId}, listing ${listingId}...`);
        const mainOk = await updateMainBoard(mainItemId, today, orderId, listingId);
        console.log(`  Main Board: ${mainOk ? '✅' : '❌'}`);

        // Step 5d: Rename
        console.log(`  [Step 5d] Renaming Main Board item to "${visibleIdentity}"...`);
        const renameOk = await renameMainBoardItem(mainItemId, visibleIdentity);
        console.log(`  Rename: ${renameOk ? '✅' : '❌'}`);
      } else {
        console.log(`  ⚠️ No Main Board link. Cannot update status/name. MANUAL FIX NEEDED.`);
        await postTelegram(`⚠️ Order ${orderId} accepted but ${availableItem.name} has no Main Board link. Manual Monday update needed.`);
      }

      // Step 6: Notification
      console.log(`\n  [Step 6] Sending notification...`);
      await postTelegram(
        `🛒 New BM sale accepted!\n` +
        `Device: ${availableItem.name}\n` +
        `Buyer: ${buyer}\n` +
        `Order: ${orderId}\n` +
        `Price: £${price}`
      );

      console.log(`\n  ── SALE CONFIRMED ──`);
      console.log(`  Device: ${availableItem.name}`);
      console.log(`  Buyer: ${buyer}`);
      console.log(`  Order: ${orderId}`);
      console.log(`  Price: £${price}`);

      summary.accepted++;
    }

    await sleep(1000);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Accepted:          ${summary.accepted}`);
  console.log(`  No match:          ${summary.noMatch}`);
  console.log(`  Already processed: ${summary.alreadyProcessed}`);
  console.log(`  Errors:            ${summary.errors}`);

  // Save results
  const outDir = '/home/ricky/builds/backmarket/data';
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(`${outDir}/sale-detection-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(summary, null, 2));
})();
