/**
 * Monday.com GraphQL helper
 */
require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });

const MONDAY_API = 'https://api.monday.com/v2';
const MONDAY_TOKEN = process.env.MONDAY_AUTOMATIONS_TOKEN;

const BOARDS = {
  MAIN: 349212843,
  BM_DEVICES: 3892194968,
};

const COLUMNS = {
  BM_TRADE_IN_ID: 'text_mky01vb4',
  STATUS: 'status24',
  // Main Board board_relation5 has historically linked to generic Devices, not BM Devices.
  // For BM Devices -> Main back-link mapping, use BM_DEVICES_BACK_RELATION.
  BOARD_RELATION: 'board_relation5',
  BM_DEVICES_BACK_RELATION: 'board_relation',
  LISTING_UUID: 'text_mm1dt53s',
  LISTING_ID: 'text_mkyd4bx3',
};

async function mondayQuery(query, variables = {}) {
  const resp = await fetch(MONDAY_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: MONDAY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Monday API ${resp.status}: ${text}`);
  }

  const json = await resp.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Monday GQL error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

/**
 * Find Main Board items matching a BM public_id in the trade-in ID column.
 */
async function findItemsByTradeInId(publicId) {
  const query = `query ($boardId: [ID!]!, $columnId: String!, $value: CompareValue!) {
    items_page_by_column_values(
      board_id: $boardId
      limit: 10
      columns: [{ column_id: $columnId, column_values: [$value] }]
    ) {
      items {
        id
        name
        column_values { id text value }
      }
    }
  }`;

  const data = await mondayQuery(query, {
    boardId: [String(BOARDS.MAIN)],
    columnId: COLUMNS.BM_TRADE_IN_ID,
    value: String(publicId),
  });

  return data.items_page_by_column_values?.items || [];
}

/**
 * Get all Main Board items with status = Listed (index 7).
 * Returns items with their board_relation linked items from BM Devices board.
 */
async function getListedItems() {
  const items = [];
  let cursor = null;

  // First page
  const firstQuery = `query {
    boards(ids: [${BOARDS.MAIN}]) {
      items_page(limit: 100, query_params: { rules: [{ column_id: "${COLUMNS.STATUS}", compare_value: [7] }] }) {
        cursor
        items {
          id
          name
          column_values(ids: ["${COLUMNS.STATUS}", "${COLUMNS.BOARD_RELATION}"]) {
            id
            text
            ... on BoardRelationValue { linked_item_ids }
          }
        }
      }
    }
  }`;

  const firstData = await mondayQuery(firstQuery);
  const firstPage = firstData.boards[0].items_page;
  items.push(...firstPage.items);
  cursor = firstPage.cursor;

  while (cursor) {
    const nextQuery = `query ($cursor: String!) {
      next_items_page(cursor: $cursor, limit: 100) {
        cursor
        items {
          id
          name
          column_values(ids: ["${COLUMNS.STATUS}", "${COLUMNS.BOARD_RELATION}"]) {
            id
            text
            ... on BoardRelationValue { linked_item_ids }
          }
        }
      }
    }`;

    const nextData = await mondayQuery(nextQuery, { cursor });
    const nextPage = nextData.next_items_page;
    items.push(...nextPage.items);
    cursor = nextPage.cursor;
  }

  return items;
}

/**
 * Get BM Devices Board items by IDs, returning listing UUID and listing ID.
 */
async function getBmDeviceItems(itemIds) {
  if (!itemIds.length) return [];

  const results = [];
  // Batch in groups of 50
  for (let i = 0; i < itemIds.length; i += 50) {
    const batch = itemIds.slice(i, i + 50);
    const query = `query ($ids: [ID!]!) {
      items(ids: $ids) {
        id
        name
        column_values(ids: ["${COLUMNS.LISTING_UUID}", "${COLUMNS.LISTING_ID}"]) {
          id
          text
        }
      }
    }`;

    const data = await mondayQuery(query, { ids: batch.map(String) });
    results.push(...(data.items || []));
  }

  return results;
}

module.exports = {
  mondayQuery,
  findItemsByTradeInId,
  getListedItems,
  getBmDeviceItems,
  BOARDS,
  COLUMNS,
};
