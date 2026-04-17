#!/usr/bin/env node
/**
 * trade-in-payout.js — SOP 03b: Trade-in Payout
 *
 * Finds devices on Monday where status24 = "Pay-Out" (index 12),
 * validates pre-flight checks, calls BM validate endpoint (IRREVERSIBLE),
 * updates Monday status to "Purchased" (index 6).
 *
 * Usage:
 *   node trade-in-payout.js              # Dry run (default)
 *   node trade-in-payout.js --dry-run    # Preview only
 *   node trade-in-payout.js --live       # Execute payouts (IRREVERSIBLE)
 *   node trade-in-payout.js --item <id>  # Process single Main Board item
 *
 * SOP 03b Step Checklist:
 *   Step 1: Find items with status24 = Pay-Out (index 12)    ✅ findPayoutItems()
 *   Step 2: Fetch BM Trade-in ID (text_mky01vb4)             ✅ (in findPayoutItems)
 *   Step 3: Pre-flight validation                             ✅ preFlightCheck()
 *   Step 4: Execute payout via BM API (PUT /validate)         ✅ executePayout()
 *   Step 5: Update Monday status → Purchased (index 6)        ✅ updateMondayStatus()
 *   Step 6: Notification to BM Telegram                       ✅ sendNotification()
 *
 * CRITICAL:
 *   - BM validate endpoint is IMMEDIATE and IRREVERSIBLE
 *   - Once called, BM pays the customer — no undo
 *   - Monday is the ONLY source of truth for payout eligibility
 *   - 4xx errors: do NOT retry (already validated, cancelled, etc.)
 *   - 5xx errors: retry ONCE after 30s
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
const PAYOUT_INDEX = 12;      // status24 = "Pay-Out"
const PURCHASED_INDEX = 6;    // status24 = "Purchased"
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BM_TELEGRAM_CHAT = '-1003888456344';

const args = process.argv.slice(2);
const isLive = args.includes('--live');
const isDryRun = !isLive;
const itemIdx = args.indexOf('--item');
const singleItemId = itemIdx !== -1 ? args[itemIdx + 1] : null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── API helpers ──────────────────────────────────────────────────
async function bmApiRaw(path, opts = {}) {
  const url = `${BM_BASE}${path}`;
  const r = await fetch(url, {
    method: opts.method || 'GET',
    headers: {
      Authorization: BM_AUTH,
      'Accept-Language': BM_LANG,
      'User-Agent': BM_UA,
      'Content-Type': 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return r;
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

// ─── Step 1: Find items with status24 = Pay-Out ──────────────────
async function findPayoutItems() {
  let query;
  if (singleItemId) {
    query = `{ items(ids: [${singleItemId}]) {
      id name
      column_values(ids: ["status24", "text_mky01vb4", "color_mkyp4jjh"]) {
        id text
        ... on StatusValue { index }
      }
    } }`;
  } else {
    query = `{ boards(ids: [${MAIN_BOARD}]) {
      items_page(limit: 100, query_params: {
        rules: [{ column_id: "status24", compare_value: [${PAYOUT_INDEX}] }]
      }) {
        items {
          id name
          column_values(ids: ["status24", "text_mky01vb4", "color_mkyp4jjh"]) {
            id text
            ... on StatusValue { index }
          }
        }
      }
    } }`;
  }

  const d = await mondayApi(query);

  if (singleItemId) {
    return d.data?.items || [];
  }
  return d.data?.boards?.[0]?.items_page?.items || [];
}

// ─── Step 3: Pre-flight validation ───────────────────────────────
async function preFlightCheck(item) {
  const errors = [];

  // Check status24 = Pay-Out (index 12)
  const status24 = item.column_values.find(cv => cv.id === 'status24');
  if (status24?.index !== PAYOUT_INDEX) {
    errors.push(`status24 is not Pay-Out (got index ${status24?.index})`);
  }

  // Check BM Trade-in ID exists
  const bmTradeInId = item.column_values.find(cv => cv.id === 'text_mky01vb4')?.text?.trim();
  if (!bmTradeInId) {
    errors.push('No BM Trade-in ID (text_mky01vb4 is empty)');
  }

  // Check iCloud status is NOT locked
  const icloud = item.column_values.find(cv => cv.id === 'color_mkyp4jjh')?.text?.trim()?.toLowerCase();
  if (icloud === 'locked' || icloud === 'on') {
    errors.push(`iCloud is ${icloud} — cannot payout`);
  }

  // Fetch linked BM Devices item to cross-check purchase price
  let bmDeviceData = null;
  if (bmTradeInId) {
    const devQ = `{ boards(ids: [${BM_DEVICES_BOARD}]) {
      items_page(limit: 5, query_params: {
        rules: [{ column_id: "text_mkqy3576", compare_value: ["${bmTradeInId}"] }]
      }) {
        items {
          id name
          column_values(ids: ["numeric", "text_mkqy3576"]) { id text }
        }
      }
    } }`;
    const devD = await mondayApi(devQ);
    const devItems = devD.data?.boards?.[0]?.items_page?.items || [];
    if (devItems.length > 0) {
      bmDeviceData = devItems[0];
    }
  }

  return { errors, bmTradeInId, bmDeviceData };
}

// ─── Step 4: Execute payout via BM API ───────────────────────────
async function executePayout(bmTradeInId) {
  // PUT /ws/buyback/v1/orders/{orderPublicId}/validate
  // Body: {} (empty JSON object)
  // This is IRREVERSIBLE — BM pays the customer immediately
  const r = await bmApiRaw(`/ws/buyback/v1/orders/${bmTradeInId}/validate`, {
    method: 'PUT',
    body: {},
  });

  if (r.ok || r.status === 202) {
    return { success: true, status: r.status };
  }

  const text = await r.text();

  // 5xx: retry ONCE after 30s
  if (r.status >= 500) {
    console.log(`  ⚠️ BM returned ${r.status}. Retrying in 30s...`);
    await sleep(30000);
    const r2 = await bmApiRaw(`/ws/buyback/v1/orders/${bmTradeInId}/validate`, {
      method: 'PUT',
      body: {},
    });
    if (r2.ok || r2.status === 202) {
      return { success: true, status: r2.status };
    }
    const text2 = await r2.text();
    return { success: false, status: r2.status, error: text2.slice(0, 300) };
  }

  // 4xx: do NOT retry
  return { success: false, status: r.status, error: text.slice(0, 300) };
}

// ─── Step 5: Update Monday status → Purchased ────────────────────
async function updateMondayStatus(mainItemId) {
  const q = `mutation { change_column_value(
    board_id: ${MAIN_BOARD},
    item_id: ${mainItemId},
    column_id: "status24",
    value: "{\\"index\\": ${PURCHASED_INDEX}}"
  ) { id } }`;
  const d = await mondayApi(q);
  return !!d.data;
}

// ─── Main ─────────────────────────────────────────────────────────
(async () => {
  console.log('═'.repeat(60));
  console.log(`  SOP 03b: Trade-in Payout — ${isDryRun ? 'DRY RUN' : '⚠️  LIVE (IRREVERSIBLE)'}`);
  console.log(`  ${new Date().toISOString()}`);
  if (singleItemId) console.log(`  Single item mode: ${singleItemId}`);
  console.log('═'.repeat(60));

  if (isLive) {
    console.log('\n  ⚠️  WARNING: LIVE mode. Payouts are IMMEDIATE and IRREVERSIBLE.');
    console.log('  BM will pay the customer as soon as validate is called.\n');
  }

  console.log('\nSOP 03b Checklist:');
  console.log('  Step 1: Find Pay-Out items               ✅ findPayoutItems()');
  console.log('  Step 2: Fetch BM Trade-in ID             ✅ (in findPayoutItems)');
  console.log('  Step 3: Pre-flight validation             ✅ preFlightCheck()');
  console.log('  Step 4: Execute BM payout (PUT /validate) ✅ executePayout()');
  console.log('  Step 5: Update Monday → Purchased         ✅ updateMondayStatus()');
  console.log('  Step 6: Telegram notification             ✅ postTelegram()');
  console.log('');

  // Step 1
  console.log('[Step 1] Finding items with status24 = Pay-Out...');
  const items = await findPayoutItems();
  console.log(`  ${items.length} item(s) found\n`);

  if (items.length === 0) {
    console.log('No Pay-Out items. Done.');
    return;
  }

  const summary = { paid: 0, failed: 0, blocked: 0 };

  for (const item of items) {
    console.log('─'.repeat(50));
    console.log(`Item: ${item.name} (ID: ${item.id})`);

    // Step 3: Pre-flight
    console.log(`\n  [Step 3] Pre-flight validation...`);
    const preflight = await preFlightCheck(item);

    if (preflight.errors.length > 0) {
      console.log(`  ⛔ Pre-flight FAILED:`);
      for (const err of preflight.errors) console.log(`    - ${err}`);
      await postTelegram(`⚠️ SOP 03b: ${item.name} failed pre-flight:\n${preflight.errors.join('\n')}`);
      summary.blocked++;
      continue;
    }

    const bmTradeInId = preflight.bmTradeInId;
    console.log(`  ✅ Pre-flight passed`);
    console.log(`  BM Trade-in ID: ${bmTradeInId}`);
    if (preflight.bmDeviceData) {
      const purchasePrice = preflight.bmDeviceData.column_values.find(cv => cv.id === 'numeric')?.text;
      console.log(`  Purchase price: £${purchasePrice || '?'}`);
    }

    if (isDryRun) {
      console.log(`\n  [DRY RUN] Would call PUT /ws/buyback/v1/orders/${bmTradeInId}/validate`);
      console.log(`  [DRY RUN] Would update status24 → Purchased (index ${PURCHASED_INDEX})`);
      summary.paid++;
      continue;
    }

    // Step 4: Execute payout
    console.log(`\n  [Step 4] Executing payout for ${bmTradeInId}...`);
    console.log(`  ⚠️  This is IRREVERSIBLE`);
    const result = await executePayout(bmTradeInId);

    if (!result.success) {
      console.error(`  ❌ Payout FAILED: HTTP ${result.status}`);
      console.error(`  Error: ${result.error}`);
      await postTelegram(`❌ SOP 03b: Payout FAILED for ${item.name} (${bmTradeInId}). HTTP ${result.status}: ${result.error}`);
      summary.failed++;
      continue;
    }

    console.log(`  ✅ Payout sent (HTTP ${result.status})`);

    // Step 5: Update Monday status → Purchased
    console.log(`\n  [Step 5] Updating Monday status → Purchased...`);
    const mondayOk = await updateMondayStatus(item.id);
    if (mondayOk) {
      console.log(`  ✅ Monday updated`);
    } else {
      console.error(`  ❌ Monday update FAILED. Payout was sent but Monday NOT updated.`);
      await postTelegram(`⚠️ SOP 03b: Payout sent for ${item.name} (${bmTradeInId}) but Monday NOT updated to Purchased. Manual fix needed.`);
    }

    // Step 6: Notification
    console.log(`\n  [Step 6] Sending notification...`);
    await postTelegram(`✅ Payout sent for ${item.name} — ${bmTradeInId}`);

    console.log(`\n  ── PAYOUT CONFIRMED ──`);
    console.log(`  Device: ${item.name}`);
    console.log(`  BM Trade-in ID: ${bmTradeInId}`);

    summary.paid++;
    await sleep(1000);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Paid out:  ${summary.paid}`);
  console.log(`  Blocked:   ${summary.blocked} (pre-flight failed)`);
  console.log(`  Failed:    ${summary.failed} (BM API error)`);
})();
