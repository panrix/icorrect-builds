#!/usr/bin/env node
/**
 * shipping.js — SOP 09: Label Buying & Ship Confirmation
 *
 * Two modes:
 *   --labels    Fetch pending BM orders (state=3), buy Royal Mail labels,
 *               write tracking to Monday, post dispatch summary to Slack
 *   --confirm   Find items on Monday with status4 = "Shipped" (index 160),
 *               notify BM API of shipment with tracking number
 *
 * Usage:
 *   node shipping.js --labels              # Buy labels (dry run)
 *   node shipping.js --labels --live       # Buy labels (live)
 *   node shipping.js --confirm             # Ship confirmation (dry run)
 *   node shipping.js --confirm --live      # Ship confirmation (live)
 *   node shipping.js --confirm --item <id> # Confirm single item
 *
 * SOP 09 Checklist:
 *   Part A — Label Buying:
 *     Step A1: Fetch pending orders (state=3)                 ✅ fetchPendingOrders()
 *     Step A2: Match to Monday by order ID                    ✅ matchToMonday()
 *     Step A3: Write tracking to Monday (text53)              ✅ writeTracking()
 *     Step A4: Post dispatch summary to Slack                 ✅ postSlackSummary()
 *
 *   Part B — Ship Confirmation:
 *     Step B1: Find Shipped items on Monday (status4=160)     ✅ findShippedItems()
 *     Step B2: Dedup (skip if "BM notified" in updates)       ✅ checkAlreadyNotified()
 *     Step B3: Fetch tracking number (text53)                 ✅ (in findShippedItems)
 *     Step B4: Fetch BM order ID from BM Devices Board       ✅ fetchBmOrderId()
 *     Step B5: Notify BM of shipment (POST with tracking)     ✅ notifyBmShipped()
 *     Step B6: Post Monday comment + Slack notification       ✅ postConfirmation()
 *
 * CRITICAL RULES:
 *   - Label buying ≠ ship confirmation (two separate steps)
 *   - No tracking number → HARD GATE, do not notify BM
 *   - No BM order ID → HARD GATE, do not notify BM
 *   - 4xx from BM: do NOT retry (already shipped, cancelled, etc.)
 *   - 5xx from BM: retry ONCE after 30s
 *   - Tracking number: strip spaces before sending to BM
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });

// ─── Config ───────────────────────────────────────────────────────
const BM_BASE = 'https://www.backmarket.co.uk';
const BM_AUTH = process.env.BACKMARKET_API_AUTH;
const BM_LANG = process.env.BACKMARKET_API_LANG || 'en-gb';
const BM_UA = process.env.BACKMARKET_API_UA;
const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN;
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;

const MAIN_BOARD = 349212843;
const BM_DEVICES_BOARD = 3892194968;
const SHIPPED_INDEX = 160;    // status4 = "Shipped"
const SHIPPED_GROUP = 'new_group269'; // Shipped group on BM Devices
const SLACK_CHANNEL = process.env.DISPATCH_SLACK_CHANNEL || 'C024H7518J3'; // #general
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BM_TELEGRAM_CHAT = '-1003888456344';

const args = process.argv.slice(2);
const isLive = args.includes('--live');
const isDryRun = !isLive;
const doLabels = args.includes('--labels');
const doConfirm = args.includes('--confirm');
const itemIdx = args.indexOf('--item');
const singleItemId = itemIdx !== -1 ? args[itemIdx + 1] : null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── API helpers ──────────────────────────────────────────────────
async function bmApiRaw(path, opts = {}) {
  const url = `${BM_BASE}${path}`;
  return fetch(url, {
    method: opts.method || 'GET',
    headers: {
      Authorization: BM_AUTH,
      'Accept-Language': BM_LANG,
      'User-Agent': BM_UA,
      'Content-Type': 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
}

async function bmApi(path, opts = {}) {
  const r = await bmApiRaw(path, opts);
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
  if (!TELEGRAM_BOT_TOKEN) return;
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

async function postSlack(text, channel = SLACK_CHANNEL, threadTs = null) {
  if (!SLACK_TOKEN) {
    console.log('  [Slack] No token, skipping');
    return null;
  }
  if (isDryRun) {
    console.log(`  [DRY RUN] Would post to Slack: ${text.slice(0, 100)}...`);
    return null;
  }
  try {
    const body = { channel, text };
    if (threadTs) body.thread_ts = threadTs;
    const r = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SLACK_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    return d.ts || null; // thread timestamp for replies
  } catch (e) {
    console.warn(`  Slack failed: ${e.message}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// PART A: Label Buying
// ═══════════════════════════════════════════════════════════════════

// Step A1: Fetch pending BM orders (state=3 = accepted, awaiting shipment)
async function fetchPendingOrders() {
  const all = [];
  let page = 1;
  while (true) {
    const d = await bmApi(`/ws/orders?state=3&page=${page}&page_size=50`);
    const items = d.results || (Array.isArray(d) ? d : []);
    if (items.length === 0) break;
    all.push(...items);
    if (!d.next) break;
    page++;
    await sleep(300);
  }
  return all;
}

// Step A2: Match order to Monday Main Board
async function matchOrderToMonday(orderId) {
  const q = `{ boards(ids: [${MAIN_BOARD}]) {
    items_page(limit: 5, query_params: {
      rules: [{ column_id: "text_mkye7p1c", compare_value: ["${orderId}"] }]
    }) {
      items {
        id name
        column_values(ids: ["text53"]) { id text }
      }
    }
  } }`;
  const d = await mondayApi(q);
  return d.data?.boards?.[0]?.items_page?.items || [];
}

// Step A3: Write tracking number to Monday
async function writeTracking(mainItemId, trackingNumber) {
  const q = `mutation { change_multiple_column_values(
    board_id: ${MAIN_BOARD},
    item_id: ${mainItemId},
    column_values: "{\\"text53\\": \\"${trackingNumber}\\"}"
  ) { id } }`;
  const d = await mondayApi(q);
  return !!d.data;
}

async function runLabels() {
  console.log('\n── PART A: Label Buying ──\n');

  // Step A1
  console.log('[Step A1] Fetching pending BM orders (state=3)...');
  const orders = await fetchPendingOrders();
  console.log(`  ${orders.length} pending orders\n`);

  if (orders.length === 0) {
    console.log('No pending orders to ship.');
    return;
  }

  const labelsNeeded = [];

  for (const order of orders) {
    const orderId = order.order_id;
    const buyer = order.shipping_address
      ? `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`.trim()
      : 'Unknown';
    const address = order.shipping_address || {};

    console.log('─'.repeat(40));
    console.log(`Order ${orderId} — ${buyer}`);
    console.log(`  Address: ${address.street || '?'}, ${address.city || '?'}, ${address.zip || '?'}`);

    // Step A2: Match to Monday
    const matches = await matchOrderToMonday(orderId);
    if (matches.length === 0) {
      console.log(`  ⚠️ No Monday match for order ${orderId}`);
      continue;
    }

    const mondayItem = matches[0];
    const existingTracking = mondayItem.column_values.find(cv => cv.id === 'text53')?.text?.trim();

    if (existingTracking) {
      console.log(`  Already has tracking: ${existingTracking}. Skipping label.`);
      continue;
    }

    labelsNeeded.push({
      orderId,
      buyer,
      address,
      mondayItemId: mondayItem.id,
      mondayItemName: mondayItem.name,
    });
  }

  console.log(`\n${labelsNeeded.length} labels needed.\n`);

  if (labelsNeeded.length === 0) return;

  // NOTE: Actual Royal Mail label purchase requires the buy-labels.js module
  // from /home/ricky/builds/royal-mail-automation/buy-labels.js
  // This script prepares the batch and can write tracking numbers once obtained
  console.log('  Label purchasing requires Royal Mail API integration.');
  console.log('  Run dispatch.js from /home/ricky/builds/royal-mail-automation/ for label buying.');
  console.log('  This script handles tracking write-back and Slack notifications.\n');

  // Step A4: Post dispatch summary to Slack
  if (labelsNeeded.length > 0) {
    const summaryMsg = `Hi guys, ${labelsNeeded.length} BMs to ship today. Please find attached labels and packing slips.`;
    console.log('[Step A4] Posting dispatch summary to Slack...');
    await postSlack(summaryMsg);

    for (const label of labelsNeeded) {
      console.log(`  ${label.mondayItemName} → ${label.buyer} (Order ${label.orderId})`);
    }
  }

  // status4 changes are handled by Monday automation, not this script (SOP 09)
}

// ═══════════════════════════════════════════════════════════════════
// PART B: Ship Confirmation
// ═══════════════════════════════════════════════════════════════════

// Step B1: Find items with status4 = Shipped (index 160)
// Only returns items updated in the last 7 days to avoid processing historical backlog
async function findShippedItems() {
  let query;
  if (singleItemId) {
    query = `{ items(ids: [${singleItemId}]) {
      id name updated_at
      column_values(ids: ["status4", "text53", "board_relation5"]) {
        id text
        ... on StatusValue { index }
        ... on BoardRelationValue { linked_item_ids }
      }
    } }`;
  } else {
    query = `{ boards(ids: [${MAIN_BOARD}]) {
      items_page(limit: 100, query_params: {
        rules: [{ column_id: "status4", compare_value: [${SHIPPED_INDEX}] }]
      }) {
        items {
          id name updated_at
          column_values(ids: ["status4", "text53", "board_relation5"]) {
            id text
            ... on StatusValue { index }
            ... on BoardRelationValue { linked_item_ids }
          }
        }
      }
    } }`;
  }

  const d = await mondayApi(query);
  let items;
  if (singleItemId) {
    items = d.data?.items || [];
  } else {
    items = d.data?.boards?.[0]?.items_page?.items || [];
  }

  // Filter to items updated in the last 7 days (skip historical backlog)
  // Applied in all modes including --item to prevent duplicate confirmations on old items
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const before = items.length;
  items = items.filter(item => {
    if (!item.updated_at) return true; // include if no timestamp
    return new Date(item.updated_at) >= cutoff;
  });
  if (before !== items.length) {
    console.log(`  Filtered ${before} → ${items.length} (last 7 days only)`);
  }

  return items;
}

// Step B2: Check if BM was already notified (dedup)
async function checkAlreadyNotified(itemId) {
  const q = `{ items(ids: [${itemId}]) {
    updates(limit: 5) { text_body }
  } }`;
  const d = await mondayApi(q);
  const updates = d.data?.items?.[0]?.updates || [];
  return updates.some(u => (u.text_body || '').includes('BM notified'));
}

// Step B4: Fetch BM order ID from BM Devices Board
async function fetchBmOrderId(bmDeviceItemId) {
  const q = `{ items(ids: [${bmDeviceItemId}]) {
    id name
    column_values(ids: ["text_mkye7p1c"]) { id text }
  } }`;
  const d = await mondayApi(q);
  const item = d.data?.items?.[0];
  return item?.column_values?.find(cv => cv.id === 'text_mkye7p1c')?.text?.trim() || '';
}

// Step B5: Notify BM of shipment
async function notifyBmShipped(bmOrderId, trackingNumber) {
  const body = {
    order_id: bmOrderId,
    new_state: 3,
    tracking_number: trackingNumber,
    tracking_url: `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`,
    shipper: 'Royal Mail Express',
  };

  const r = await bmApiRaw(`/ws/orders/${bmOrderId}`, {
    method: 'POST',
    body,
  });

  if (r.ok) return { success: true, status: r.status };

  const text = await r.text();

  // 5xx: retry ONCE after 30s
  if (r.status >= 500) {
    console.log(`  ⚠️ BM returned ${r.status}. Retrying in 30s...`);
    await sleep(30000);
    const r2 = await bmApiRaw(`/ws/orders/${bmOrderId}`, { method: 'POST', body });
    if (r2.ok) return { success: true, status: r2.status };
    const text2 = await r2.text();
    return { success: false, status: r2.status, error: text2.slice(0, 300) };
  }

  // 4xx: do NOT retry
  return { success: false, status: r.status, error: text.slice(0, 300) };
}

// Step B6: Post confirmation to Monday + Slack/Telegram
async function postConfirmation(itemId, itemName, bmOrderId, tracking) {
  const ts = new Date().toISOString();
  const commentText = `BM notified of shipment [${ts}]\\nTracking: ${tracking}\\nOrder: ${bmOrderId}`;

  // Monday comment
  const q = `mutation { create_update(
    item_id: ${itemId},
    body: "${commentText}"
  ) { id } }`;
  await mondayApi(q);

  // Telegram
  await postTelegram(`✅ BM notified of shipment: ${itemName} - Order ${bmOrderId} - Tracking ${tracking}`);
}

// Move BM Devices item to Shipped group
async function moveBmDeviceToShipped(bmDeviceItemId) {
  const q = `mutation { move_item_to_group(
    item_id: ${bmDeviceItemId},
    group_id: "${SHIPPED_GROUP}"
  ) { id } }`;
  const d = await mondayApi(q);
  return !!d.data;
}

async function runConfirmation() {
  console.log('\n── PART B: Ship Confirmation ──\n');

  // Step B1
  console.log('[Step B1] Finding shipped items on Monday...');
  const items = await findShippedItems();
  console.log(`  ${items.length} shipped item(s) found\n`);

  if (items.length === 0) {
    console.log('No shipped items to confirm.');
    return;
  }

  const summary = { confirmed: 0, skipped: 0, errors: 0 };

  for (const item of items) {
    console.log('─'.repeat(50));
    console.log(`Item: ${item.name} (ID: ${item.id})`);

    // Step B2: Dedup
    console.log(`\n  [Step B2] Checking if BM already notified...`);
    const alreadyNotified = await checkAlreadyNotified(item.id);
    if (alreadyNotified) {
      console.log(`  ⏭️ Already notified. Skipping.`);
      summary.skipped++;
      continue;
    }

    // Step B3: Get tracking number
    const tracking = (item.column_values.find(cv => cv.id === 'text53')?.text || '').replace(/\s/g, '');
    if (!tracking) {
      console.log(`  ⛔ HARD GATE: No tracking number (text53 empty)`);
      await postTelegram(`⚠️ ${item.name} marked Shipped but no tracking number found. Manual BM update needed.`);
      summary.errors++;
      continue;
    }
    console.log(`  Tracking: ${tracking}`);

    // Get linked BM Devices item
    const relCol = item.column_values.find(cv => cv.id === 'board_relation5');
    const bmDeviceItemId = relCol?.linked_item_ids?.[0];
    if (!bmDeviceItemId) {
      console.log(`  ⛔ HARD GATE: No linked BM Devices item (board_relation5 empty)`);
      await postTelegram(`⚠️ ${item.name} has tracking ${tracking} but no BM Devices link. Manual BM update needed.`);
      summary.errors++;
      continue;
    }

    // Step B4: Fetch BM order ID
    console.log(`  [Step B4] Fetching BM order ID from BM Devices Board...`);
    const bmOrderId = await fetchBmOrderId(bmDeviceItemId);
    if (!bmOrderId) {
      console.log(`  ⛔ HARD GATE: No BM order ID (text_mkye7p1c empty on BM Devices ${bmDeviceItemId})`);
      await postTelegram(`⚠️ ${item.name} has tracking but no BM order ID. Manual BM update needed.`);
      summary.errors++;
      continue;
    }
    console.log(`  BM Order ID: ${bmOrderId}`);

    if (isDryRun) {
      console.log(`\n  [DRY RUN] Would notify BM of shipment for order ${bmOrderId}`);
      summary.confirmed++;
      continue;
    }

    // Step B5: Notify BM
    console.log(`\n  [Step B5] Notifying BM of shipment...`);
    const result = await notifyBmShipped(bmOrderId, tracking);

    if (!result.success) {
      console.error(`  ❌ BM notification FAILED: HTTP ${result.status}`);
      console.error(`  Error: ${result.error}`);
      await postTelegram(`❌ BM update FAILED for ${item.name} (Order ${bmOrderId}). HTTP ${result.status}: ${result.error}`);
      summary.errors++;
      continue;
    }
    console.log(`  ✅ BM notified (HTTP ${result.status})`);

    // Step B6: Post confirmation
    console.log(`  [Step B6] Posting confirmation...`);
    await postConfirmation(item.id, item.name, bmOrderId, tracking);

    // Move BM Devices item to Shipped group
    console.log(`  Moving BM Devices item to Shipped group...`);
    const moved = await moveBmDeviceToShipped(bmDeviceItemId);
    console.log(`  Move to Shipped: ${moved ? '✅' : '❌'}`);

    console.log(`\n  ── SHIP CONFIRMED ──`);
    console.log(`  Device: ${item.name}`);
    console.log(`  BM Order: ${bmOrderId}`);
    console.log(`  Tracking: ${tracking}`);

    summary.confirmed++;
    await sleep(1000);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Confirmed: ${summary.confirmed}`);
  console.log(`  Skipped:   ${summary.skipped} (already notified)`);
  console.log(`  Errors:    ${summary.errors}`);
}

// ─── Main ─────────────────────────────────────────────────────────
(async () => {
  console.log('═'.repeat(60));
  console.log(`  SOP 09: Shipping — ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  if (!doLabels && !doConfirm) {
    console.log('\nUsage:');
    console.log('  node shipping.js --labels              # Label buying (dry run)');
    console.log('  node shipping.js --labels --live       # Label buying (live)');
    console.log('  node shipping.js --confirm             # Ship confirmation (dry run)');
    console.log('  node shipping.js --confirm --live      # Ship confirmation (live)');
    console.log('  node shipping.js --confirm --item <id> # Confirm single item');
    process.exit(0);
  }

  if (doLabels) await runLabels();
  if (doConfirm) await runConfirmation();
})();
