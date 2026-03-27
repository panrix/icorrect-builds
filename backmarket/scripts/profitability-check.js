#!/usr/bin/env node
/**
 * Build 9: Daily Profitability Check
 *
 * Checks all live BM listings against sell price data.
 * Flags unprofitable listings and lost buy boxes.
 * Posts summary to Slack.
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });
const fs = require('fs');
const path = require('path');
const { mondayQuery, BOARDS, COLUMNS } = require('./lib/monday');
const { postToSlack } = require('./lib/slack');
const {
  calculateProfitability,
  matchModel,
  lookupSellPrice,
  GRADE_MAP,
} = require('./lib/profitability');
const { fetchAllListings } = require('./lib/bm-api');

const SELL_PRICES_PATH = '/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json';
const SIGNED_OFF_PATH = path.join(__dirname, 'data', 'signed-off-unprofitable.json');
const LOG_PATH = path.join(__dirname, 'logs', 'profitability-check.log');
const SLACK_CHANNEL = 'C024H7518J3'; // #dispatch / BM channel

// Monday columns for cost data
const PURCHASE_COST_COLUMN = 'numeric';     // Purchase Price (ex VAT) — on BM Devices Board
const PARTS_COST_COLUMN = 'lookup_mkx1xzd7'; // Parts Cost (mirror) — on Main Board
const LABOUR_HOURS_COLUMN = 'numeric_mkxcedc'; // Initial Hours — on Main Board

// --- Helpers ---

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_PATH, line + '\n');
  } catch (e) {
    // logs dir might not exist yet
  }
}

function loadSignedOff() {
  try {
    return JSON.parse(fs.readFileSync(SIGNED_OFF_PATH, 'utf8'));
  } catch {
    // Create empty file if missing
    fs.mkdirSync(path.dirname(SIGNED_OFF_PATH), { recursive: true });
    fs.writeFileSync(SIGNED_OFF_PATH, '[]');
    return [];
  }
}

function loadSellPrices() {
  try {
    const data = JSON.parse(fs.readFileSync(SELL_PRICES_PATH, 'utf8'));
    // Check staleness: warn if older than 48 hours
    if (data.scraped_at) {
      const age = Date.now() - new Date(data.scraped_at).getTime();
      if (age > 48 * 60 * 60 * 1000) {
        log(`WARNING: Sell price data is ${Math.round(age / 3600000)}h old`);
      }
    }
    return data;
  } catch (err) {
    log(`ERROR: Could not load sell prices: ${err.message}`);
    return null;
  }
}

function isSignedOff(signedOffList, productId, grade) {
  return signedOffList.some(
    (s) => s.product_id === productId && s.grade === grade
  );
}

// --- BM Listings API ---

async function fetchActiveListings() {
  const listings = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const url = `https://www.backmarket.co.uk/ws/listings?page=${page}&page_size=${pageSize}`;
    log(`Fetching BM listings page ${page}...`);

    const resp = await fetch(url, { headers: BM_API_HEADERS });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`BM API ${resp.status}: ${text.substring(0, 200)}`);
    }

    const data = await resp.json();
    const results = data.results || data;

    if (!Array.isArray(results) || results.length === 0) break;

    // Filter for active listings with quantity > 0
    for (const listing of results) {
      if (listing.quantity > 0) {
        listings.push(listing);
      }
    }

    // Check if there are more pages
    if (data.next) {
      page++;
    } else {
      break;
    }
  }

  log(`Found ${listings.length} active listings`);
  return listings;
}

// --- Monday cost data ---

/**
 * Fetch cost data for Main Board items that have a board_relation to BM Devices items
 * matching a given listing UUID.
 */
async function fetchCostDataByListingUuid(listingUuid) {
  if (!listingUuid) return null;

  // Search BM Devices board for items with this listing UUID
  const query = `query ($boardId: [ID!]!, $columnId: String!, $value: CompareValue!) {
    items_page_by_column_values(
      board_id: $boardId
      limit: 5
      columns: [{ column_id: $columnId, column_values: [$value] }]
    ) {
      items {
        id
        name
        column_values(ids: ["${COLUMNS.LISTING_UUID}", "${PURCHASE_COST_COLUMN}"]) {
          id
          text
        }
      }
    }
  }`;

  try {
    const data = await mondayQuery(query, {
      boardId: [String(BOARDS.BM_DEVICES)],
      columnId: COLUMNS.LISTING_UUID,
      value: String(listingUuid),
    });

    const bmDeviceItems = data.items_page_by_column_values?.items || [];
    if (bmDeviceItems.length === 0) return null;

    // Get purchase price from BM Devices Board item (it lives there, not Main Board)
    const bmDeviceItem = bmDeviceItems[0];
    const purchasePriceCol = bmDeviceItem.column_values?.find((c) => c.id === PURCHASE_COST_COLUMN);
    const purchaseCost = parseFloat(purchasePriceCol?.text) || 0;

    // Now find Main Board items linked to these BM Device items for parts + labour
    const mainQuery = `query {
      boards(ids: [${BOARDS.MAIN}]) {
        items_page(limit: 500, query_params: { rules: [{ column_id: "${COLUMNS.STATUS}", compare_value: [7] }] }) {
          items {
            id
            name
            column_values(ids: ["${COLUMNS.BOARD_RELATION}", "${PARTS_COST_COLUMN}", "${LABOUR_HOURS_COLUMN}"]) {
              id
              text
              ... on BoardRelationValue { linked_item_ids }
              ... on MirrorValue { display_value }
            }
          }
        }
      }
    }`;

    const mainData = await mondayQuery(mainQuery);
    const mainItems = mainData.boards?.[0]?.items_page?.items || [];

    // Find main items that link to one of the BM device items
    const bmDeviceIds = new Set(bmDeviceItems.map((i) => i.id));

    for (const item of mainItems) {
      const relationCol = item.column_values.find((c) => c.id === COLUMNS.BOARD_RELATION);
      if (!relationCol?.linked_item_ids?.length) continue;

      try {
        const linkedIds = relationCol.linked_item_ids.map(String);
        if (linkedIds.some((id) => bmDeviceIds.has(id))) {
          const partsCol = item.column_values.find((c) => c.id === PARTS_COST_COLUMN);
          const labourCol = item.column_values.find((c) => c.id === LABOUR_HOURS_COLUMN);

          return {
            itemName: item.name,
            purchaseCost,
            partsCost: parseFloat(partsCol?.display_value) || 0,
            labourHours: parseFloat(labourCol?.text) || 0,
          };
        }
      } catch {
        continue;
      }
    }
  } catch (err) {
    log(`WARNING: Could not fetch cost data for UUID ${listingUuid}: ${err.message}`);
  }

  return null;
}

// --- Main ---

async function main() {
  log('=== Daily Profitability Check ===');
  const startTime = Date.now();

  // Load data
  const sellPriceData = loadSellPrices();
  if (!sellPriceData) {
    const msg = '⚠️ Profitability check skipped: sell price data unavailable';
    log(msg);
    await postToSlack(msg, SLACK_CHANNEL);
    return;
  }

  const signedOff = loadSignedOff();
  const modelKeys = Object.keys(sellPriceData.models);

  // Fetch active BM listings
  let listings;
  try {
    listings = await fetchActiveListings();
  } catch (err) {
    const msg = `❌ Profitability check failed: ${err.message}`;
    log(msg);
    await postToSlack(msg, SLACK_CHANNEL);
    return;
  }

  if (listings.length === 0) {
    log('No active listings found');
    await postToSlack('📊 Profitability Check: No active listings found.', SLACK_CHANNEL);
    return;
  }

  // Process each listing
  const unprofitable = [];
  const marginal = [];
  const lostBuyBox = [];
  const healthy = [];
  const warnings = [];

  for (const listing of listings) {
    const productId = listing.product || listing.product_id || listing.uuid || '';
    const grade = listing.grade || listing.condition || '';
    const title = listing.title || listing.product_name || `Product ${productId}`;
    const ourPrice = listing.price || listing.selling_price || 0;
    const listingUuid = listing.uuid || listing.id || '';

    // Check signed-off list
    if (isSignedOff(signedOff, productId, grade)) {
      log(`Skipping signed-off: ${title} Grade ${grade}`);
      continue;
    }

    // Match to sell price data
    const modelKey = matchModel(title, modelKeys);
    const gradeKey = GRADE_MAP[grade] || grade;

    if (!modelKey) {
      warnings.push(`Could not match model for: ${title}`);
      continue;
    }

    // Market price (lowest sell price for this grade)
    const marketPrice = lookupSellPrice(sellPriceData, modelKey, gradeKey);

    // Check buy box
    if (marketPrice && ourPrice > marketPrice) {
      lostBuyBox.push({
        title,
        grade: gradeKey,
        ourPrice,
        marketPrice,
      });
    }

    // Get cost data from Monday
    const costData = await fetchCostDataByListingUuid(listingUuid);

    if (!costData) {
      // Can't calculate profitability without cost data
      warnings.push(`No cost data for: ${title} (UUID: ${listingUuid})`);
      continue;
    }

    const sellPrice = marketPrice || ourPrice;
    const result = calculateProfitability(sellPrice, costData);

    const entry = {
      title: costData.itemName || title,
      grade: gradeKey,
      sellPrice,
      ...result,
    };

    if (result.category === 'unprofitable') {
      unprofitable.push(entry);
    } else if (result.category === 'marginal') {
      marginal.push(entry);
    } else {
      healthy.push(entry);
    }
  }

  // Build Slack report
  const date = new Date().toISOString().split('T')[0];
  const lines = [`📊 Daily Profitability Check \u2014 ${date}\n`];

  if (unprofitable.length > 0) {
    lines.push(`🔴 Unprofitable (${unprofitable.length}):`);
    for (const item of unprofitable) {
      const costNote = item.costUnknown ? ' [cost unknown]' : '';
      lines.push(`\u2022 ${item.title} Grade ${item.grade}: Cost \u00a3${item.totalCost}, Sell \u00a3${item.sellPrice}. Margin: ${item.marginPercent}%. Net: \u00a3${item.netProfit}.${costNote}`);
    }
    lines.push('');
  }

  if (marginal.length > 0) {
    lines.push(`🟡 Marginal (${marginal.length}):`);
    for (const item of marginal) {
      const costNote = item.costUnknown ? ' [cost unknown]' : '';
      lines.push(`\u2022 ${item.title} Grade ${item.grade}: Cost \u00a3${item.totalCost}, Sell \u00a3${item.sellPrice}. Margin: ${item.marginPercent}%. Net: \u00a3${item.netProfit}.${costNote}`);
    }
    lines.push('');
  }

  if (lostBuyBox.length > 0) {
    lines.push(`⚠️ Lost buy box (${lostBuyBox.length}):`);
    for (const item of lostBuyBox) {
      lines.push(`\u2022 ${item.title} Grade ${item.grade}: Our price \u00a3${item.ourPrice}, Market \u00a3${item.marketPrice}.`);
    }
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push(`⚠️ Warnings (${warnings.length}):`);
    for (const w of warnings.slice(0, 10)) {
      lines.push(`\u2022 ${w}`);
    }
    if (warnings.length > 10) lines.push(`\u2022 ...and ${warnings.length - 10} more`);
    lines.push('');
  }

  if (unprofitable.length === 0 && lostBuyBox.length === 0 && marginal.length === 0) {
    lines.push(`✅ All ${healthy.length} listings profitable and competitive.`);
  } else {
    lines.push(`✅ ${healthy.length} listings healthy.`);
  }

  const report = lines.join('\n');
  log(report);

  try {
    await postToSlack(report, SLACK_CHANNEL);
    log('Slack report posted successfully');
  } catch (err) {
    log(`ERROR posting to Slack: ${err.message}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`Completed in ${elapsed}s. ${listings.length} listings checked.`);
}

main().catch((err) => {
  log(`FATAL: ${err.message}`);
  console.error(err);
  process.exit(1);
});
