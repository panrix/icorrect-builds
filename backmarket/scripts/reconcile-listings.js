#!/usr/bin/env node
/**
 * reconcile-listings.js — SOP 6.5: Listings Reconciliation
 *
 * Runs BEFORE buy-box-check.js. Ensures Monday and BM agree.
 *
 * Steps from SOP 6.5:
 * 1. Gather data from Monday (Listed items) and BM (active listings)
 * 2. Cross-reference: Check A (Monday→BM), Check B (BM→Monday), Check C (qty), Check D (missing BM Device), Check E (missing costs)
 * 3. Auto-actions: take offline oversell risks, backfill costs
 * 4. Report to BM Telegram
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });
const fs = require('fs');

// ─── Run mode: --dry-run (default) or --live ──────────────────────
// Phase 0.7: mutations are gated behind explicit --live flag.
// Fail-safe default: no flag → dry-run. Only --live triggers mutations.
const LIVE_FLAG = process.argv.includes('--live');
const DRY_RUN_FLAG = process.argv.includes('--dry-run');
const IS_LIVE = LIVE_FLAG;  // only live when explicitly requested
const IS_DRY_RUN = !IS_LIVE;
const MODE = IS_LIVE ? 'live' : 'dry-run';
const MODE_TAG = IS_LIVE ? '[LIVE]' : '[DRY-RUN]';

if (!LIVE_FLAG && !DRY_RUN_FLAG) {
  console.log('⚠️  No mode flag passed — defaulting to --dry-run.');
  console.log('    Pass --live to execute mutations. Pass --dry-run to suppress this banner.\n');
}

// Record of every action the script proposes or executes — written to JSON at end of run
const actionsLog = [];

/**
 * Gate every mutation through this helper.
 *   action:   { type: 'monday_write' | 'bm_offline', target: string, current_value?: any, proposed_value?: any, reason: string }
 *   executor: async () => <the actual API call>
 * In dry-run:   logs "[DRY-RUN] Would ...", records action, returns without executing
 * In live:      logs "[LIVE] ...", awaits executor, records action with executed: true
 */
async function maybeMutate(action, executor) {
  const description = `${action.type} on ${action.target}` + (action.proposed_value !== undefined ? ` → ${JSON.stringify(action.proposed_value)}` : '');
  if (IS_DRY_RUN) {
    console.log(`    ${MODE_TAG} Would ${description} (reason: ${action.reason})`);
    actionsLog.push({ ...action, executed: false, timestamp: new Date().toISOString() });
    return { dryRun: true };
  }
  try {
    console.log(`    ${MODE_TAG} Executing ${description} (reason: ${action.reason})`);
    const result = await executor();
    actionsLog.push({ ...action, executed: true, timestamp: new Date().toISOString() });
    return { dryRun: false, result };
  } catch (e) {
    actionsLog.push({ ...action, executed: false, error: e.message, timestamp: new Date().toISOString() });
    throw e;
  }
}

// ─── Config ───────────────────────────────────────────────────────
const BM_BASE = 'https://www.backmarket.co.uk';
const BM_AUTH = process.env.BACKMARKET_API_AUTH;
const BM_LANG = process.env.BACKMARKET_API_LANG || 'en-gb';
const BM_UA = process.env.BACKMARKET_API_UA;
const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN;

const MAIN_BOARD = 349212843;
const BM_DEVICES_BOARD = 3892194968;
const TO_LIST_GROUP = 'new_group88387__1';
const LISTED_INDEX = 7;
const LABOUR_RATE = 24;
const SHIPPING = 15;
const BUY_FEE_RATE = 0.10;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BM_TELEGRAM_CHAT = '-1003888456344';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── API helpers ──────────────────────────────────────────────────
async function bmApi(path, opts = {}) {
  const r = await fetch(BM_BASE + path, {
    method: opts.method || 'GET',
    headers: { Authorization: BM_AUTH, 'Accept-Language': BM_LANG, 'User-Agent': BM_UA, 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`BM ${r.status}: ${t.slice(0, 200)}`); }
  return r.json();
}

async function mondayApi(query) {
  const r = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: { Authorization: MONDAY_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return r.json();
}

async function postTelegram(msg) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: BM_TELEGRAM_CHAT, text: msg }),
    });
  } catch (e) { console.warn(`Telegram failed: ${e.message}`); }
}

// ─── Step 1a: Get Monday "Listed" items ───────────────────────────
async function getMondayListedItems() {
  const q = `{ boards(ids:[${MAIN_BOARD}]) { groups(ids:["${TO_LIST_GROUP}"]) { items_page(limit:200) { items { id name column_values(ids:["status24"]) { ... on StatusValue { text index } } } } } } }`;
  const d = await mondayApi(q);
  const items = d.data?.boards?.[0]?.groups?.[0]?.items_page?.items || [];
  return items.filter(i => i.column_values?.[0]?.index === LISTED_INDEX);
}

// ─── Step 1b: Get BM listings ─────────────────────────────────────
async function getBmListings() {
  const all = [];
  let page = 1;
  while (true) {
    const d = await bmApi(`/ws/listings?page=${page}&page_size=100`);
    const items = d.results || [];
    if (items.length === 0) break;
    all.push(...items);
    if (!d.next) break;
    page++;
    await sleep(300);
  }
  return all;
}

// ─── Batch load all BM Devices ────────────────────────────────────
async function loadAllBmDevices() {
  const allItems = [];
  let cursor = null;
  while (true) {
    const cursorPart = cursor ? `cursor: "${cursor}"` : `limit: 500`;
    // Include CPU (status7__1) and GPU (status8__1) cores so Check C missed-revenue flag
    // can validate that all devices on a shared listing_id truly match (e.g. A2338 M1 vs M2
    // both string-match MBP.A2338 SKUs but differ on GPU core count: M1=8C, M2=10C).
    // Include group so Check F can detect active items missing board_relation back-link
    // (breaks icloud-checker spec comparison — same class of issue Hugo hit on BM 1598).
    const q = `{ boards(ids:[${BM_DEVICES_BOARD}]) { items_page(${cursorPart}) { cursor items { id name group { id title } column_values(ids:["text_mkyd4bx3", "numeric_mm1mgcgn", "numeric", "board_relation", "status__1", "color2", "status7__1", "status8__1"]) { id text ... on BoardRelationValue { linked_item_ids } } } } } }`;
    const d = await mondayApi(q);
    const page = d.data?.boards?.[0]?.items_page;
    if (!page?.items?.length) break;
    allItems.push(...page.items);
    if (!page.cursor) break;
    cursor = page.cursor;
  }
  return allItems;
}

// ─── Main ─────────────────────────────────────────────────────────
(async () => {
  console.log('═'.repeat(60));
  console.log('  Listings Reconciliation — SOP 6.5');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  // Step 1a: Monday Listed items
  console.log('\n[Step 1a] Fetching Monday "Listed" items...');
  const mondayListed = await getMondayListedItems();
  console.log(`  ${mondayListed.length} items with status "Listed"`);

  // Step 1b: BM listings
  console.log('\n[Step 1b] Fetching BM listings...');
  const bmListings = await getBmListings();
  const bmActive = bmListings.filter(l => l.quantity > 0);
  console.log(`  ${bmListings.length} total listings, ${bmActive.length} active (qty > 0)`);

  // Step 1c: BM Devices
  console.log('\n[Step 1c] Loading BM Devices board...');
  const bmDevices = await loadAllBmDevices();
  console.log(`  ${bmDevices.length} BM Device items loaded`);

  // Build lookup maps
  const bmListingsByLid = {};
  for (const l of bmListings) {
    bmListingsByLid[String(l.listing_id)] = l;
  }

  const bmDevicesByMainId = {};
  const bmDevicesByListingId = {};
  for (const item of bmDevices) {
    const listingId = item.column_values.find(cv => cv.id === 'text_mkyd4bx3')?.text || '';
    const relCol = item.column_values.find(cv => cv.id === 'board_relation');
    const mainId = relCol?.linked_item_ids?.[0];

    if (mainId) {
      if (!bmDevicesByMainId[mainId]) bmDevicesByMainId[mainId] = [];
      bmDevicesByMainId[mainId].push({ ...item, listingId, mainItemId: mainId });
    }
    if (listingId) {
      if (!bmDevicesByListingId[listingId]) bmDevicesByListingId[listingId] = [];
      bmDevicesByListingId[listingId].push({ ...item, listingId, mainItemId: mainId });
    }
  }

  // ─── Step 2: Cross-reference ──────────────────────────────────
  const results = {
    matched: [],
    mondayListedBmOffline: [],
    mondayListedNoListing: [],
    oversellRisk: [],
    orphanListings: [],
    missingBmDevice: [],
    missingCost: [],
    qtyMismatch: [],
    costBackfilled: [],
    specMismatch: [],
    missingBackRelation: [],  // Check F: BM Devices items in active groups with no Main Board link
  };

  // Check F: BM Devices items in active lifecycle groups missing board_relation back-link
  // to Main Board. icloud-checker's spec-compare looks up claimed specs via this back-link
  // (post Hugo's 2026-04-20 fix). A missing link means intake spec-compare silently skips
  // the device — exactly what happened to BM 1598. Flag all active-group items missing it
  // so Ferrari can backfill on the weekly report (same pattern he ran for BM 1602-1605).
  //
  // Active groups that BENEFIT from a back-link: BM Trade-Ins (intake spec-compare fires
  // here), and the live lifecycle (Listed → Sold → Shipped → Returns — sale-detection,
  // reconciliation, and shipping confirmation all read the back-link).
  // EXCLUDED: Rejected / iC Locked (post-facto, spec-compare is moot once rejected);
  // Old BMs, MTR, TigerTech, Repair Board (partner/archive — historical noise).
  const ACTIVE_BM_GROUPS = new Set([
    'group_mkq3wkeq',         // BM Trade-Ins
    'new_group',               // BM To List / Listed / Sold (main lifecycle)
    'new_group269',            // Shipped
    'new_group_mkmybfgr',      // BM Returns
    // If group IDs shift, add "title" fallback below
  ]);
  const ACTIVE_BM_TITLES = /BM Trade-Ins|BM To List|Listed|Sold|Shipped|BM Returns/i;
  console.log('\n[Step 2F] BM Devices items missing board_relation back-link (active groups only)...');
  for (const item of bmDevices) {
    const relCol = item.column_values.find(cv => cv.id === 'board_relation');
    const hasLink = relCol?.linked_item_ids && relCol.linked_item_ids.length > 0;
    if (hasLink) continue;
    const groupId = item.group?.id || '';
    const groupTitle = item.group?.title || '';
    const isActive = ACTIVE_BM_GROUPS.has(groupId) || ACTIVE_BM_TITLES.test(groupTitle);
    if (!isActive) continue;  // Historical / partner groups — skip
    console.log(`  ⛔ MISSING BACK-LINK: ${item.name} (id=${item.id}, group="${groupTitle}") — intake spec-compare will fail`);
    results.missingBackRelation.push({ bmDeviceId: item.id, name: item.name, group: groupTitle });
  }
  console.log(`  ${results.missingBackRelation.length} BM Devices items in active groups missing board_relation`);

  // Check A: Monday Listed → BM Active
  console.log('\n[Step 2A] Monday Listed → BM Active...');
  for (const mondayItem of mondayListed) {
    const mainId = mondayItem.id;
    const name = mondayItem.name;

    // Find BM Device entry
    const bmDevEntries = bmDevicesByMainId[mainId];
    if (!bmDevEntries || bmDevEntries.length === 0) {
      console.log(`  ⛔ ${name}: NO BM DEVICE ENTRY`);
      results.missingBmDevice.push({ name, mainItemId: mainId });
      continue;
    }

    // Get listing ID from BM Device (prefer one with cost data)
    const bmDev = bmDevEntries.find(d => {
      const cost = d.column_values.find(cv => cv.id === 'numeric_mm1mgcgn')?.text;
      return cost && parseFloat(cost) > 0;
    }) || bmDevEntries[0];

    const listingId = bmDev.listingId;
    if (!listingId) {
      console.log(`  ⛔ ${name}: BM Device exists but NO LISTING ID stored`);
      results.mondayListedNoListing.push({ name, mainItemId: mainId, bmDeviceId: bmDev.id });
      continue;
    }

    // Find in BM listings
    const bmListing = bmListingsByLid[listingId];
    if (!bmListing) {
      console.log(`  ⛔ ${name}: listing ${listingId} NOT FOUND on BM`);
      results.mondayListedNoListing.push({ name, mainItemId: mainId, listingId, bmDeviceId: bmDev.id });
      continue;
    }

    if (bmListing.quantity > 0) {
      // Spec verification: check listing title matches device specs
      const title = (bmListing.title || '').toLowerCase();
      const devRam = (bmDev.column_values.find(cv => cv.id === 'status__1')?.text || '').replace(/\s/g, '');
      const devSsd = (bmDev.column_values.find(cv => cv.id === 'color2')?.text || '').replace(/\s/g, '');
      // text column deleted Mar 23 — extract model from item name instead
      const devModel = ((bmDev.name || '').match(/A\d{4}/) || [''])[0].toUpperCase();

      let specOk = true;
      const specIssues = [];

      // Check RAM in title
      if (devRam) {
        const ramGB = devRam.replace(/GB/i, '');
        if (!title.includes(ramGB + 'gb') && !title.includes(ramGB + ' gb')) {
          specIssues.push(`RAM: device=${devRam}, title doesn't contain it`);
          specOk = false;
        }
      }

      // Check SSD in title
      if (devSsd) {
        let ssdSearch = devSsd.replace(/GB/i, '').replace(/TB/i, '');
        if (devSsd.toLowerCase().includes('1tb')) ssdSearch = '1000';
        else if (devSsd.toLowerCase().includes('2tb')) ssdSearch = '2000';
        if (!title.includes('ssd ' + ssdSearch) && !title.includes(ssdSearch + 'gb') && !title.includes(ssdSearch + ' gb') && !title.includes('ssd ' + ssdSearch)) {
          specIssues.push(`SSD: device=${devSsd}, title doesn't contain it`);
          specOk = false;
        }
      }

      // Check grade matches
      const GRADE_MAP = { 'Fair': 'FAIR', 'Good': 'GOOD', 'Excellent': 'VERY_GOOD' };
      // We'd need the Main Board grade for this — skip for now, covered in listing script

      if (specOk) {
        console.log(`  ✅ ${name}: listing ${listingId} active, qty=${bmListing.quantity}, spec verified`);
      } else {
        console.log(`  ⛔ ${name}: listing ${listingId} active but SPEC MISMATCH:`);
        for (const issue of specIssues) console.log(`    ${issue}`);
        console.log(`    Title: ${bmListing.title}`);
        results.specMismatch.push({ name, mainItemId: mainId, listingId, bmDeviceId: bmDev.id, listing: bmListing, issues: specIssues });
      }
      // Capture spec tuple so Check C (qty reconciliation) can detect mis-grouped devices
      // on a shared listing_id — e.g. A2338 M1 (8c GPU) and A2338 M2 (10c GPU) both have
      // identical SKU strings but are different products. Missed-revenue qty-bumping is
      // only valid when every device on the listing matches on RAM/SSD/CPU/GPU.
      const devCpu = (bmDev.column_values.find(cv => cv.id === 'status7__1')?.text || '').trim();
      const devGpu = (bmDev.column_values.find(cv => cv.id === 'status8__1')?.text || '').trim();
      results.matched.push({ name, mainItemId: mainId, listingId, bmDeviceId: bmDev.id, listing: bmListing, specOk, specIssues, ram: devRam, ssd: devSsd, cpu: devCpu, gpu: devGpu, model: devModel });
    } else {
      console.log(`  ⚠️ ${name}: listing ${listingId} exists but OFFLINE (qty=0)`);
      results.mondayListedBmOffline.push({ name, mainItemId: mainId, listingId, bmDeviceId: bmDev.id, listing: bmListing });
    }

    // Check E: Missing cost data
    const costVal = bmDev.column_values.find(cv => cv.id === 'numeric_mm1mgcgn')?.text;
    if (!costVal || parseFloat(costVal) <= 0) {
      const purchase = parseFloat(bmDev.column_values.find(cv => cv.id === 'numeric')?.text) || 0;
      console.log(`  ⚠️ ${name}: missing Total Fixed Cost`);

      // Try to auto-calculate
      if (bmDev.mainItemId) {
        const q = `{ items(ids:[${bmDev.mainItemId}]) { column_values(ids:["lookup_mkx1xzd7","formula_mkx1bjqr","formula__1"]) { id text ... on MirrorValue { display_value } ... on FormulaValue { display_value } } } }`;
        const d = await mondayApi(q);
        const mainItem = d.data?.items?.[0];
        if (mainItem) {
          const partsRaw = mainItem.column_values.find(cv => cv.id === 'lookup_mkx1xzd7')?.display_value || '0';
          const parts = String(partsRaw).split(',').reduce((sum, v) => sum + (parseFloat(v.trim()) || 0), 0);
          const labourH = parseFloat(mainItem.column_values.find(cv => cv.id === 'formula__1')?.display_value) || 0;
          const labour = labourH * LABOUR_RATE;
          const buyFee = purchase * BUY_FEE_RATE;
          const fixed = purchase + parts + labour + SHIPPING + buyFee;

          // Write to Monday (gated)
          await maybeMutate(
            {
              type: 'monday_write',
              target: `BM Devices item ${bmDev.id} (${name})`,
              column_id: 'numeric_mm1mgcgn',
              proposed_value: Math.round(fixed),
              reason: `Auto-backfill Total Fixed Cost: purchase=£${purchase} + parts=£${parts} + labour=£${labour.toFixed(0)} + ship=£${SHIPPING} + buyFee=£${buyFee.toFixed(0)}`,
            },
            () => mondayApi(`mutation { change_column_value(board_id: ${BM_DEVICES_BOARD}, item_id: ${bmDev.id}, column_id: "numeric_mm1mgcgn", value: "${Math.round(fixed)}") { id } }`)
          );
          console.log(`    Auto-backfilled: £${Math.round(fixed)} (purchase=£${purchase}, parts=£${parts}, labour=£${labour.toFixed(0)})`);
          results.costBackfilled.push({ name, bmDeviceId: bmDev.id, fixed: Math.round(fixed) });
        } else {
          results.missingCost.push({ name, bmDeviceId: bmDev.id, reason: 'Main Board item not found' });
        }
      } else {
        results.missingCost.push({ name, bmDeviceId: bmDev.id, reason: 'No Main Board link' });
      }
    }
  }

  // Check C: Quantity reconciliation by listing_id
  console.log('\n[Step 2C] Quantity reconciliation...');
  const matchedByListing = {};
  for (const m of results.matched) {
    if (!matchedByListing[m.listingId]) matchedByListing[m.listingId] = [];
    matchedByListing[m.listingId].push(m);
  }
  for (const [lid, devices] of Object.entries(matchedByListing)) {
    const bmListing = bmListingsByLid[lid];
    if (!bmListing) continue;
    const mondayCount = devices.length;
    const bmQty = bmListing.quantity;
    if (mondayCount > bmQty) {
      // Before declaring "missed revenue", verify every device on this listing has matching
      // RAM, SSD, CPU cores and GPU cores. Shared SKU string does NOT guarantee interchangeable
      // devices — e.g. A2338 M1 (8c GPU) vs M2 (10c GPU) share SKU "MBP.A2338...". Bumping qty
      // in that case sells the wrong-gen device at the wrong price.
      const specKey = (d) => `${(d.ram || '').toUpperCase()}|${(d.ssd || '').toUpperCase()}|${(d.cpu || '').toLowerCase()}|${(d.gpu || '').toLowerCase()}`;
      const uniqueSpecs = new Set(devices.map(specKey));
      if (uniqueSpecs.size === 1) {
        console.log(`  ⚠️ MISSED REVENUE: listing ${lid} (${bmListing.sku}) has ${mondayCount} devices on Monday but qty=${bmQty} on BM — all specs match, safe to bump`);
        results.qtyMismatch.push({ listingId: lid, sku: bmListing.sku, mondayCount, bmQty, type: 'missed_revenue', devices: devices.map(d => d.name), specs: [...uniqueSpecs] });
      } else {
        // Spec drift within a single listing_id — one or more devices is mis-assigned
        console.log(`  ⛔ SPEC DRIFT on listing ${lid} (${bmListing.sku}): ${mondayCount} devices share the listing but their specs diverge`);
        for (const d of devices) {
          console.log(`     ${d.name}: RAM=${d.ram}, SSD=${d.ssd}, CPU=${d.cpu}, GPU=${d.gpu}`);
        }
        results.qtyMismatch.push({ listingId: lid, sku: bmListing.sku, mondayCount, bmQty, type: 'spec_drift', devices: devices.map(d => ({ name: d.name, bmDeviceId: d.bmDeviceId, mainItemId: d.mainItemId, ram: d.ram, ssd: d.ssd, cpu: d.cpu, gpu: d.gpu })), uniqueSpecs: [...uniqueSpecs] });
      }
    } else if (bmQty > mondayCount) {
      console.log(`  ⛔ OVERSELL RISK: listing ${lid} (${bmListing.sku}) has qty=${bmQty} on BM but only ${mondayCount} device(s) on Monday`);
      results.qtyMismatch.push({ listingId: lid, sku: bmListing.sku, mondayCount, bmQty, type: 'oversell', devices: devices.map(d => d.name) });
    } else {
      // Qty matches
    }
  }

  // Check B: BM Active → Monday Listed
  console.log('\n[Step 2B] BM Active → Monday Listed...');
  const matchedListingIds = new Set(results.matched.map(m => m.listingId));
  for (const listing of bmActive) {
    const lid = String(listing.listing_id);
    if (matchedListingIds.has(lid)) continue; // Already matched in Check A

    // Find BM Device with this listing ID
    const bmDevEntries = bmDevicesByListingId[lid];
    if (!bmDevEntries || bmDevEntries.length === 0) {
      console.log(`  ⛔ ORPHAN: listing ${lid} (${listing.sku}) active on BM, no BM Device entry`);
      results.orphanListings.push({ listingId: lid, listing });
      continue;
    }

    const bmDev = bmDevEntries[0];
    const mainId = bmDev.mainItemId;

    if (!mainId) {
      console.log(`  ⛔ ORPHAN: listing ${lid} (${listing.sku}) has BM Device but no Main Board link`);
      results.orphanListings.push({ listingId: lid, listing, bmDeviceId: bmDev.id });
      continue;
    }

    // Check Main Board status
    const q = `{ items(ids:[${mainId}]) { name column_values(ids:["status24"]) { ... on StatusValue { text index } } } }`;
    const d = await mondayApi(q);
    const mainItem = d.data?.items?.[0];
    const status = mainItem?.column_values?.[0];

    if (!mainItem) {
      console.log(`  ⛔ ORPHAN: listing ${lid} (${listing.sku}) Main Board item ${mainId} not found`);
      results.orphanListings.push({ listingId: lid, listing, mainItemId: mainId });
      continue;
    }

    if (status?.index === LISTED_INDEX) {
      // Already matched or in a different group
      console.log(`  ✅ listing ${lid} (${listing.sku}): Main Board "${mainItem.name}" status=Listed`);
    } else {
      console.log(`  ⛔ OVERSELL RISK: listing ${lid} (${listing.sku}) active on BM but Monday status="${status?.text}" for ${mainItem.name}`);
      results.oversellRisk.push({ listingId: lid, listing, mainItemId: mainId, mainName: mainItem.name, mondayStatus: status?.text });
    }

    await sleep(300); // Rate limit Monday
  }

  // ─── Step 3: Auto-actions ─────────────────────────────────────
  console.log('\n[Step 3] Auto-actions...');

  // Take oversell risks offline (Check B: wrong Monday status)
  for (const risk of results.oversellRisk) {
    console.log(`  Taking offline: listing ${risk.listingId} (${risk.mainName}, status="${risk.mondayStatus}")`);
    try {
      await maybeMutate(
        {
          type: 'bm_offline',
          target: `listing ${risk.listingId}`,
          current_value: `qty>0, mondayStatus="${risk.mondayStatus}"`,
          proposed_value: 'qty=0',
          reason: `Oversell risk (Check B): listing active on BM but Monday says "${risk.mondayStatus}" for "${risk.mainName}"`,
        },
        () => bmApi(`/ws/listings/${risk.listingId}`, { method: 'POST', body: { quantity: 0 } })
      );
      console.log(`    ✅ Offline`);
    } catch (e) {
      console.error(`    ❌ Failed: ${e.message}`);
    }
    await sleep(500);
  }

  // Take qty oversell risks offline (Check C: BM qty > Monday device count)
  for (const risk of results.qtyMismatch.filter(r => r.type === 'oversell')) {
    console.log(`  Taking offline (qty oversell): listing ${risk.listingId} (${risk.sku}) BM qty=${risk.bmQty} > Monday=${risk.mondayCount}`);
    try {
      await maybeMutate(
        {
          type: 'bm_offline',
          target: `listing ${risk.listingId} (${risk.sku})`,
          current_value: `bmQty=${risk.bmQty}, mondayCount=${risk.mondayCount}`,
          proposed_value: 'qty=0',
          reason: `Qty oversell (Check C): BM quantity ${risk.bmQty} exceeds Monday device count ${risk.mondayCount}`,
        },
        () => bmApi(`/ws/listings/${risk.listingId}`, { method: 'POST', body: { quantity: 0 } })
      );
      console.log(`    ✅ Offline`);
    } catch (e) {
      console.error(`    ❌ Failed: ${e.message}`);
    }
    await sleep(500);
  }

  // ─── Step 4: Report (count summary + saved JSON report) ───────
  console.log('\n' + '═'.repeat(60));
  console.log('  RECONCILIATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Monday Listed:           ${mondayListed.length}`);
  console.log(`  BM Active:               ${bmActive.length}`);
  console.log(`  Delta:                   ${mondayListed.length - bmActive.length}`);
  console.log('');
  console.log(`  ✅ Matched:              ${results.matched.length}`);
  console.log(`  ⛔ Oversell (offlined):  ${results.oversellRisk.length}`);
  console.log(`  ⚠️ Monday Listed/BM off: ${results.mondayListedBmOffline.length}`);
  console.log(`  ⛔ No listing found:     ${results.mondayListedNoListing.length}`);
  console.log(`  ⛔ Orphan BM listings:   ${results.orphanListings.length}`);
  console.log(`  ⛔ Missing BM Device:    ${results.missingBmDevice.length}`);
  console.log(`  ⛔ Missing back-link:    ${results.missingBackRelation.length}`);
  console.log(`  ⚠️ Missing cost data:    ${results.missingCost.length}`);
  console.log(`  ⛔ Spec mismatch:        ${(results.specMismatch || []).length}`);
  console.log(`  ⚠️ Qty mismatch:        ${results.qtyMismatch.length}`);
  console.log(`  ✅ Cost auto-backfilled: ${results.costBackfilled.length}`);

  // Detail sections
  if (results.oversellRisk.length > 0) {
    console.log('\n⛔ OVERSELL RISKS (auto-offlined):');
    for (const r of results.oversellRisk) {
      console.log(`  ${r.mainName}: listing ${r.listingId}, Monday status="${r.mondayStatus}"`);
    }
  }

  if (results.mondayListedBmOffline.length > 0) {
    console.log('\n⚠️ MONDAY LISTED BUT BM OFFLINE:');
    for (const r of results.mondayListedBmOffline) {
      console.log(`  ${r.name}: listing ${r.listingId} (qty=0)`);
    }
  }

  if (results.mondayListedNoListing.length > 0) {
    console.log('\n⛔ MONDAY LISTED BUT NO BM LISTING:');
    for (const r of results.mondayListedNoListing) {
      console.log(`  ${r.name}: listing ID ${r.listingId || 'none'}`);
    }
  }

  if (results.orphanListings.length > 0) {
    console.log('\n⛔ ORPHAN BM LISTINGS (active, no Monday match):');
    for (const r of results.orphanListings) {
      console.log(`  listing ${r.listingId}: ${r.listing.sku} @ £${r.listing.price}`);
    }
  }

  if (results.missingBmDevice.length > 0) {
    console.log('\n⛔ MISSING BM DEVICE ENTRY:');
    for (const r of results.missingBmDevice) {
      console.log(`  ${r.name}`);
    }
  }

  if (results.missingBackRelation.length > 0) {
    console.log('\n⛔ MISSING BACK-RELATION (breaks intake spec-compare):');
    for (const r of results.missingBackRelation) {
      console.log(`  ${r.name} (BM Devices id=${r.bmDeviceId}, group="${r.group}") — add board_relation to Main Board item`);
    }
  }

  if ((results.specMismatch || []).length > 0) {
    console.log('\n⛔ SPEC MISMATCHES:');
    for (const r of results.specMismatch) {
      console.log(`  ${r.name}: listing ${r.listingId}`);
      for (const issue of r.issues) console.log(`    ${issue}`);
      console.log(`    BM title: ${r.listing.title}`);
    }
  }

  if (results.qtyMismatch.length > 0) {
    console.log('\n⚠️ QTY MISMATCHES:');
    for (const r of results.qtyMismatch) {
      const icon = r.type === 'oversell' ? '⛔' : '⚠️';
      console.log(`  ${icon} listing ${r.listingId} (${r.sku}): Monday=${r.mondayCount}, BM qty=${r.bmQty} [${r.type}]`);
      console.log(`    Devices: ${r.devices.join(', ')}`);
    }
  }

  if (results.missingCost.length > 0) {
    console.log('\n⚠️ MISSING COST DATA (could not auto-backfill):');
    for (const r of results.missingCost) {
      console.log(`  ${r.name}: ${r.reason}`);
    }
  }

  // ─── Send Telegram report ──────────────────────────────────────
  const tgLines = [
    `📋 Listings Reconciliation — ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `Monday Listed: ${mondayListed.length} | BM Active: ${bmActive.length} | Delta: ${mondayListed.length - bmActive.length}`,
    ``,
    `✅ Matched: ${results.matched.length}`,
  ];
  if (results.oversellRisk.length > 0) tgLines.push(`⛔ Oversell risk (offlined): ${results.oversellRisk.length}`);
  if (results.qtyMismatch.filter(r => r.type === 'oversell').length > 0) tgLines.push(`⛔ Qty oversell (offlined): ${results.qtyMismatch.filter(r => r.type === 'oversell').length}`);
  if (results.mondayListedBmOffline.length > 0) tgLines.push(`⚠️ Monday Listed/BM offline: ${results.mondayListedBmOffline.length}`);
  if (results.mondayListedNoListing.length > 0) tgLines.push(`⛔ No listing found: ${results.mondayListedNoListing.length}`);
  if (results.orphanListings.length > 0) tgLines.push(`⛔ Orphan BM listings: ${results.orphanListings.length}`);
  if (results.missingBmDevice.length > 0) tgLines.push(`⛔ Missing BM Device: ${results.missingBmDevice.length}`);
  if (results.missingBackRelation.length > 0) tgLines.push(`⛔ BM Devices missing back-link (breaks spec-compare): ${results.missingBackRelation.length}`);
  if ((results.specMismatch || []).length > 0) tgLines.push(`⛔ Spec mismatch: ${results.specMismatch.length}`);
  if (results.missingCost.length > 0) tgLines.push(`⚠️ Missing cost data: ${results.missingCost.length}`);
  if (results.qtyMismatch.filter(r => r.type === 'missed_revenue').length > 0) tgLines.push(`⚠️ Missed revenue (more devices than listed, specs match): ${results.qtyMismatch.filter(r => r.type === 'missed_revenue').length}`);
  if (results.qtyMismatch.filter(r => r.type === 'spec_drift').length > 0) tgLines.push(`⛔ Spec drift on shared listing_id (qty bump UNSAFE): ${results.qtyMismatch.filter(r => r.type === 'spec_drift').length}`);
  if (results.costBackfilled.length > 0) tgLines.push(`✅ Cost auto-backfilled: ${results.costBackfilled.length}`);

  // Prefix Telegram line with mode tag so the chat clearly shows whether the run was a drill or for real
  tgLines.splice(1, 0, `Mode: ${MODE.toUpperCase()}`);
  await postTelegram(tgLines.join('\n'));

  // Save standard reconciliation report (results of the checks)
  const outDir = '/home/ricky/builds/backmarket/data/reports';
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = `${outDir}/reconciliation-${new Date().toISOString().slice(0, 10)}.json`;
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${outFile}`);

  // Save actions log (every mutation proposed or executed) — schema matches Phase 0.7 spec
  const actionsDir = '/home/ricky/builds/backmarket/data';
  const actionsFile = `${actionsDir}/reconcile-${MODE}-${new Date().toISOString().slice(0, 10)}.json`;
  const byType = actionsLog.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {});
  fs.writeFileSync(actionsFile, JSON.stringify({
    run_timestamp: new Date().toISOString(),
    mode: MODE,
    actions: actionsLog,
    summary: { total: actionsLog.length, by_type: byType, executed: actionsLog.filter(a => a.executed).length, proposed_only: actionsLog.filter(a => !a.executed).length },
  }, null, 2));
  console.log(`Actions log saved to ${actionsFile} (${actionsLog.length} actions, mode=${MODE})`);
})();
