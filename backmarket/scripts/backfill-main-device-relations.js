#!/usr/bin/env node
/**
 * Backfill Main Board board_relation5 for BackMarket trade-in items.
 *
 * Dry-run by default. Use --live to write board_relation5 when a BM trade-in
 * order resolves to exactly one generic device lookup item through the same
 * title-normalization path used by sent-orders.js.
 */
require('dotenv').config({ path: '/home/ricky/config/api-keys/.env', quiet: true });

const { mondayQuery, BOARDS } = require('./lib/monday');
const { buildPreparedOrderData } = require('./sent-orders');

const MAIN_BOARD = BOARDS.MAIN;
const TRADE_IN_ID_COLUMN = 'text_mky01vb4';
const DEVICE_RELATION_COLUMN = 'board_relation5';

const args = process.argv.slice(2);
const isLive = args.includes('--live');
const orderFilter = args
  .filter((arg) => arg.startsWith('--order='))
  .map((arg) => arg.split('=')[1])
  .filter(Boolean);
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? Math.max(parseInt(args[limitIndex + 1], 10) || 0, 0) : 0;

function escapeGraphQLString(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function parseBmNumber(itemName) {
  const match = String(itemName || '').match(/\bBM\s+(\d+)\b/i);
  return match ? match[1] : '?';
}

function col(item, id) {
  return item.column_values?.find((entry) => entry.id === id);
}

function hasLinkedDevice(item) {
  const relation = col(item, DEVICE_RELATION_COLUMN);
  return Array.isArray(relation?.linked_item_ids) && relation.linked_item_ids.length > 0;
}

async function fetchMainBoardTradeIns() {
  const items = [];
  let cursor = null;
  const columnIds = `["${TRADE_IN_ID_COLUMN}", "${DEVICE_RELATION_COLUMN}"]`;

  const firstQuery = `{
    boards(ids: [${MAIN_BOARD}]) {
      items_page(
        limit: 500,
        query_params: {
          rules: [{ column_id: "${TRADE_IN_ID_COLUMN}", compare_value: [""], operator: is_not_empty }]
        }
      ) {
        cursor
        items {
          id
          name
          column_values(ids: ${columnIds}) {
            id
            text
            ... on BoardRelationValue { linked_item_ids }
          }
        }
      }
    }
  }`;
  const firstData = await mondayQuery(firstQuery);
  const firstPage = firstData.boards?.[0]?.items_page;
  if (firstPage?.items) items.push(...firstPage.items);
  cursor = firstPage?.cursor || null;

  while (cursor) {
    const nextData = await mondayQuery(`{
      next_items_page(limit: 500, cursor: "${escapeGraphQLString(cursor)}") {
        cursor
        items {
          id
          name
          column_values(ids: ${columnIds}) {
            id
            text
            ... on BoardRelationValue { linked_item_ids }
          }
        }
      }
    }`);
    const page = nextData.next_items_page;
    if (page?.items) items.push(...page.items);
    cursor = page?.cursor || null;
  }

  return items;
}

async function writeDeviceRelation(mainItemId, deviceItemId) {
  const columnValues = JSON.stringify({
    [DEVICE_RELATION_COLUMN]: { item_ids: [parseInt(deviceItemId, 10)] },
  });

  const data = await mondayQuery(
    `mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
      change_multiple_column_values(
        board_id: $boardId,
        item_id: $itemId,
        column_values: $columnValues
      ) { id }
    }`,
    {
      boardId: String(MAIN_BOARD),
      itemId: String(mainItemId),
      columnValues,
    }
  );
  return data.change_multiple_column_values?.id;
}

async function main() {
  console.log(`Mode: ${isLive ? 'LIVE' : 'DRY-RUN'}`);
  const allItems = await fetchMainBoardTradeIns();
  let candidates = allItems.filter((item) => !hasLinkedDevice(item));

  if (orderFilter.length > 0) {
    const wanted = new Set(orderFilter);
    candidates = candidates.filter((item) => wanted.has(col(item, TRADE_IN_ID_COLUMN)?.text?.trim()));
  }
  if (limit > 0) candidates = candidates.slice(0, limit);

  console.log(`Found ${allItems.length} Main Board BM trade-ins; ${candidates.length} missing ${DEVICE_RELATION_COLUMN}.`);

  const summary = { linked: 0, skipped: 0, unresolved: 0, errors: 0 };

  for (const item of candidates) {
    const publicId = col(item, TRADE_IN_ID_COLUMN)?.text?.trim();
    if (!publicId) {
      summary.skipped++;
      continue;
    }

    try {
      const prepared = await buildPreparedOrderData({ public_id: publicId }, parseBmNumber(item.name));
      const deviceItemId = prepared.deviceLookup.deviceItemId;
      const mappedName = prepared.deviceLookup.mappedDeviceName;
      const bmModel = prepared.deviceLookup.bmModel || 'unknown';

      if (!deviceItemId) {
        summary.unresolved++;
        console.log(`UNRESOLVED ${publicId} ${item.name}: "${prepared.deviceTitle}" -> ${bmModel} -> ${mappedName}`);
        continue;
      }

      console.log(`${isLive ? 'LINK' : 'WOULD LINK'} ${publicId} ${item.name}: ${mappedName} (${deviceItemId})`);
      if (isLive) await writeDeviceRelation(item.id, deviceItemId);
      summary.linked++;
    } catch (error) {
      summary.errors++;
      console.warn(`ERROR ${publicId} ${item.name}: ${error.message}`);
    }
  }

  console.log('Summary:', summary);
  if (!isLive) {
    console.log('Dry-run only. Re-run with --live to write Main Board device relations.');
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  hasLinkedDevice,
  parseBmNumber,
};
