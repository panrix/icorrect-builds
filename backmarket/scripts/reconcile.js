#!/usr/bin/env node
/**
 * Build 8: Daily Listing Reconciliation
 *
 * Compares Monday "Listed" items against BM active listings.
 * Flags ghost listings, qty mismatches, and orphan listings.
 *
 * Usage: node reconcile.js [--dry-run]
 */
require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });

const { fetchAllListings } = require('./lib/bm-api');
const { getListedItems, getBmDeviceItems, COLUMNS } = require('./lib/monday');
const { postToSlack } = require('./lib/slack');
const { formatFullDate } = require('./lib/dates');
const { createLogger } = require('./lib/logger');

const log = createLogger('reconciliation.log');
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Extract linked item IDs from a board_relation column value.
 * Monday API v2 returns linked_item_ids directly via typed fragment.
 */
function extractLinkedItemIds(columnValue) {
  if (!columnValue) return [];
  // Monday API v2: linked_item_ids is returned directly via ... on BoardRelationValue { linked_item_ids }
  if (columnValue.linked_item_ids && Array.isArray(columnValue.linked_item_ids)) {
    return columnValue.linked_item_ids;
  }
  return [];
}

async function main() {
  const today = new Date();
  const dateStr = formatFullDate(today);

  log.info(`=== Reconciliation started === ${DRY_RUN ? '(DRY RUN)' : ''}`);

  // 1. Get all "Listed" items from Monday Main Board
  let listedItems;
  try {
    listedItems = await getListedItems();
    log.info(`Found ${listedItems.length} Listed items on Monday`);
  } catch (err) {
    log.error(`Failed to fetch Monday Listed items: ${err.message}`);
    const errMsg = `📊 Reconciliation failed: could not fetch Monday items. Error: ${err.message}`;
    if (!DRY_RUN) await postToSlack(errMsg);
    process.exit(1);
  }

  // 2. Extract linked BM Device item IDs and fetch their listing UUIDs
  const allLinkedIds = [];
  const mondayItemToLinkedIds = new Map();

  for (const item of listedItems) {
    const relationCol = item.column_values.find((cv) => cv.id === COLUMNS.BOARD_RELATION);
    const linkedIds = extractLinkedItemIds(relationCol);
    mondayItemToLinkedIds.set(item.id, linkedIds);
    allLinkedIds.push(...linkedIds);
  }

  const uniqueLinkedIds = [...new Set(allLinkedIds)];
  log.info(`Found ${uniqueLinkedIds.length} unique linked BM Device items`);

  let bmDeviceItems = [];
  if (uniqueLinkedIds.length > 0) {
    try {
      bmDeviceItems = await getBmDeviceItems(uniqueLinkedIds);
    } catch (err) {
      log.error(`Failed to fetch BM Device items: ${err.message}`);
    }
  }

  // Build map: device item id -> { uuid, listingId, name }
  const deviceMap = new Map();
  for (const dev of bmDeviceItems) {
    const uuidCol = dev.column_values.find((cv) => cv.id === COLUMNS.LISTING_UUID);
    const idCol = dev.column_values.find((cv) => cv.id === COLUMNS.LISTING_ID);
    deviceMap.set(String(dev.id), {
      uuid: uuidCol?.text || null,
      listingId: idCol?.text || null,
      name: dev.name,
    });
  }

  // Build Monday tracking: uuid -> { item names, count }
  const mondayByUuid = new Map(); // uuid -> { names: [], count: number }

  for (const item of listedItems) {
    const linkedIds = mondayItemToLinkedIds.get(item.id) || [];
    for (const lid of linkedIds) {
      const dev = deviceMap.get(String(lid));
      if (dev && dev.uuid) {
        if (!mondayByUuid.has(dev.uuid)) {
          mondayByUuid.set(dev.uuid, { names: [], count: 0 });
        }
        const entry = mondayByUuid.get(dev.uuid);
        entry.names.push(item.name);
        entry.count++;
      }
    }

    // If no linked device items with UUID, track without UUID
    if (linkedIds.length === 0) {
      // Item marked Listed but no linked BM device: flag as potential ghost
      if (!mondayByUuid.has(`no-link:${item.id}`)) {
        mondayByUuid.set(`no-link:${item.id}`, { names: [item.name], count: 1, noLink: true });
      }
    }
  }

  // 3. Fetch all BM active listings
  let bmListings;
  try {
    bmListings = await fetchAllListings();
    log.info(`Fetched ${bmListings.length} listings from BM`);
  } catch (err) {
    log.error(`Failed to fetch BM listings: ${err.message}`);
    const errMsg = `📊 Reconciliation failed: could not fetch BM listings. Error: ${err.message}`;
    if (!DRY_RUN) await postToSlack(errMsg);
    process.exit(1);
  }

  // Build BM map: uuid -> { qty, sku, title }
  const bmByUuid = new Map();
  for (const listing of bmListings) {
    const uuid = listing.uuid || listing.id;
    const qty = listing.quantity ?? listing.qty ?? 0;
    if (qty > 0) {
      bmByUuid.set(String(uuid), {
        qty,
        sku: listing.sku || listing.product?.sku || '—',
        title: listing.title || listing.product?.title || listing.product_name || '—',
      });
    }
  }

  // 4. Detect mismatches
  const ghosts = [];
  const qtyMismatches = [];
  const orphans = [];

  // Check Monday items against BM
  for (const [uuid, mondayInfo] of mondayByUuid) {
    if (mondayInfo.noLink) {
      ghosts.push({
        device: mondayInfo.names[0],
        uuid: 'no BM link',
        reason: 'Listed in Monday but no linked BM Device item',
      });
      continue;
    }

    const bmListing = bmByUuid.get(uuid);
    if (!bmListing) {
      ghosts.push({
        device: mondayInfo.names.join(', '),
        uuid,
        reason: 'Monday says Listed, BM qty=0 or missing',
      });
    } else if (mondayInfo.count !== bmListing.qty) {
      qtyMismatches.push({
        device: mondayInfo.names.join(', '),
        mondayCount: mondayInfo.count,
        bmQty: bmListing.qty,
        uuid,
      });
    }
  }

  // Check BM listings not tracked in Monday
  const trackedUuids = new Set(
    [...mondayByUuid.keys()].filter((k) => !k.startsWith('no-link:'))
  );
  for (const [uuid, bmInfo] of bmByUuid) {
    if (!trackedUuids.has(uuid)) {
      orphans.push({
        sku: bmInfo.sku,
        title: bmInfo.title,
        uuid,
        qty: bmInfo.qty,
      });
    }
  }

  // 5. Build Slack message
  const totalIssues = ghosts.length + qtyMismatches.length + orphans.length;
  let message;

  if (totalIssues === 0) {
    message = `✅ Listing reconciliation: all clear (${mondayByUuid.size} Monday items, ${bmByUuid.size} BM listings checked)`;
  } else {
    const lines = [`📊 Listing Reconciliation — ${dateStr}`, ''];

    if (ghosts.length > 0) {
      lines.push(`👻 Ghost listings (in Monday, not on BM): ${ghosts.length}`);
      for (const g of ghosts) {
        lines.push(`• ${g.device} — UUID ${g.uuid} — ${g.reason}`);
      }
      lines.push('');
    }

    if (qtyMismatches.length > 0) {
      lines.push(`🔢 Qty mismatch: ${qtyMismatches.length}`);
      for (const m of qtyMismatches) {
        lines.push(`• ${m.device} — Monday: ${m.mondayCount} items, BM: ${m.bmQty} qty`);
      }
      lines.push('');
    }

    if (orphans.length > 0) {
      lines.push(`🤷 Orphan listings (on BM, not in Monday): ${orphans.length}`);
      for (const o of orphans) {
        lines.push(`• ${o.sku} — UUID ${o.uuid} — qty=${o.qty}, not tracked in Monday`);
      }
      lines.push('');
    }

    lines.push(`Total checked: ${mondayByUuid.size} Monday items, ${bmByUuid.size} BM listings`);
    message = lines.join('\n');
  }

  log.info(`Results: ${ghosts.length} ghosts, ${qtyMismatches.length} qty mismatches, ${orphans.length} orphans`);

  if (DRY_RUN) {
    console.log('[DRY RUN] Would post to Slack:\n');
    console.log(message);
  } else {
    try {
      await postToSlack(message);
      log.info('Reconciliation posted to Slack');
    } catch (err) {
      log.error(`Failed to post to Slack: ${err.message}`);
      process.exit(1);
    }
  }

  log.info('=== Reconciliation complete ===');
}

main().catch((err) => {
  log.error(`Unhandled error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
