#!/usr/bin/env node
/**
 * One-shot backfill: copy BM Sales Order ID and BM Listing ID from BM
 * Devices entries onto their linked Main Board items.
 *
 * Why: 2026-04-28 we added text_mm2vf3nk (BM Sales Order ID) and
 * text_mm2v7ysq (BM Listing ID) to the Main Board so bm-shipping (SOP 09.5)
 * and icloud-checker can read them directly without traversing the broken
 * Main → BM Devices link. Existing items predate that and need filling.
 *
 * Usage:
 *   node backfill-bm-order-ids.js --dry-run
 *   node backfill-bm-order-ids.js
 *
 * Source of truth: BM Devices board (3892194968).
 * Main Board link comes from BM Devices column `board_relation` → Main Board item id.
 */
require('dotenv').config({ path: '/home/ricky/config/.env' });

const MONDAY_TOKEN = process.env.MONDAY_AUTOMATIONS_TOKEN;
const MAIN_BOARD = 349212843;
const BM_DEVICES_BOARD = 3892194968;
const BM_DEVICE_ORDER_COL = 'text_mkye7p1c';
const BM_DEVICE_LISTING_COL = 'text_mkyd4bx3';
const MAIN_ORDER_COL = 'text_mm2vf3nk';
const MAIN_LISTING_COL = 'text_mm2v7ysq';

const isDryRun = process.argv.includes('--dry-run');

async function mondayApi(query, variables) {
  const resp = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: MONDAY_TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const data = await resp.json();
  if (!resp.ok || data.errors) {
    throw new Error(`Monday API error: ${JSON.stringify(data).slice(0, 400)}`);
  }
  return data;
}

async function fetchBmDevicesPage(cursor) {
  // Two-step: first pull ids + text columns, then fetch board_relation per-item.
  // The combined query with BoardRelationValue inline fragment was 500ing.
  const q = cursor
    ? `{ next_items_page(cursor: "${cursor}", limit: 50) { cursor items { id name column_values(ids: ["${BM_DEVICE_ORDER_COL}", "${BM_DEVICE_LISTING_COL}"]) { id text } } } }`
    : `{ boards(ids: [${BM_DEVICES_BOARD}]) { items_page(limit: 50) { cursor items { id name column_values(ids: ["${BM_DEVICE_ORDER_COL}", "${BM_DEVICE_LISTING_COL}"]) { id text } } } } }`;
  const data = await mondayApi(q);
  if (cursor) {
    return data.data.next_items_page;
  }
  return data.data.boards[0].items_page;
}

async function fetchBoardRelation(itemId) {
  const q = `{ items(ids: [${itemId}]) { column_values(ids: ["board_relation"]) { ... on BoardRelationValue { linked_item_ids } } } }`;
  const data = await mondayApi(q);
  return data?.data?.items?.[0]?.column_values?.[0]?.linked_item_ids?.[0] || null;
}

async function readMainItemValues(mainItemId) {
  const q = `{ items(ids: [${mainItemId}]) { column_values(ids: ["${MAIN_ORDER_COL}", "${MAIN_LISTING_COL}"]) { id text } } }`;
  const data = await mondayApi(q);
  const cols = data?.data?.items?.[0]?.column_values || [];
  return {
    order: cols.find((c) => c.id === MAIN_ORDER_COL)?.text?.trim() || '',
    listing: cols.find((c) => c.id === MAIN_LISTING_COL)?.text?.trim() || '',
  };
}

async function writeMainItemValues(mainItemId, orderId, listingId) {
  const values = JSON.stringify({
    [MAIN_ORDER_COL]: String(orderId || ''),
    [MAIN_LISTING_COL]: String(listingId || ''),
  });
  const q = `mutation { change_multiple_column_values(board_id: ${MAIN_BOARD}, item_id: ${mainItemId}, column_values: ${JSON.stringify(values)}) { id } }`;
  await mondayApi(q);
}

(async () => {
  console.log('═'.repeat(60));
  console.log(`  BM Sales Order ID backfill — ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('═'.repeat(60));

  let cursor = null;
  let pages = 0;
  const summary = { scanned: 0, withOrder: 0, alreadyFilled: 0, willWrite: 0, wrote: 0, noLink: 0, mismatchSkipped: 0 };

  while (true) {
    const page = await fetchBmDevicesPage(cursor);
    pages += 1;
    const items = page.items || [];
    if (items.length === 0) break;

    for (const it of items) {
      summary.scanned += 1;
      const order = it.column_values.find((c) => c.id === BM_DEVICE_ORDER_COL)?.text?.trim() || '';
      const listing = it.column_values.find((c) => c.id === BM_DEVICE_LISTING_COL)?.text?.trim() || '';

      if (!order && !listing) continue;
      summary.withOrder += 1;

      let mainItemId;
      try {
        mainItemId = await fetchBoardRelation(it.id);
      } catch (e) {
        console.warn(`  [rel error] BM Device ${it.id}: ${e.message.slice(0, 200)}`);
        continue;
      }

      if (!mainItemId) {
        summary.noLink += 1;
        console.log(`  [no link] BM Device ${it.id} (${it.name}) order=${order || '-'} listing=${listing || '-'} — no Main Board link`);
        continue;
      }

      let main;
      try {
        main = await readMainItemValues(mainItemId);
      } catch (e) {
        console.warn(`  [read error] Main ${mainItemId}: ${e.message.slice(0, 200)}`);
        continue;
      }

      const needsOrder = order && main.order !== order;
      const needsListing = listing && main.listing !== listing;

      if (!needsOrder && !needsListing) {
        summary.alreadyFilled += 1;
        continue;
      }

      if ((main.order && order && main.order !== order) || (main.listing && listing && main.listing !== listing)) {
        summary.mismatchSkipped += 1;
        console.log(`  [mismatch] Main ${mainItemId} already has order="${main.order}" listing="${main.listing}", BM Devices says order="${order}" listing="${listing}" — skipping`);
        continue;
      }

      summary.willWrite += 1;
      const targetOrder = order || main.order;
      const targetListing = listing || main.listing;
      console.log(`  ${isDryRun ? '[would write]' : '[writing]'} Main ${mainItemId} ← order="${targetOrder}" listing="${targetListing}" (from BM Device ${it.id})`);
      if (!isDryRun) {
        try {
          await writeMainItemValues(mainItemId, targetOrder, targetListing);
          summary.wrote += 1;
        } catch (e) {
          console.warn(`    write failed: ${e.message.slice(0, 200)}`);
        }
      }
    }

    cursor = page.cursor;
    if (!cursor) break;
  }

  console.log('─'.repeat(60));
  console.log(`Pages: ${pages}`);
  console.log(`Scanned BM Devices items: ${summary.scanned}`);
  console.log(`With order or listing: ${summary.withOrder}`);
  console.log(`Already filled correctly: ${summary.alreadyFilled}`);
  console.log(`No Main Board link: ${summary.noLink}`);
  console.log(`Mismatch (skipped): ${summary.mismatchSkipped}`);
  console.log(`${isDryRun ? 'Would write' : 'Wrote'}: ${isDryRun ? summary.willWrite : summary.wrote}`);
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
