/*
 * Stock Check Core
 *
 * Shared stock-check logic used by both the CLI tool
 * (tools/repair-stock-check.js) and the Monday webhook service
 * (monday/services/repair-stock-check).
 *
 * Read-only. Does not write to Monday or modify stock.
 */

const MONDAY_API_URL = 'https://api.monday.com/v2';

const BOARDS = {
  PRODUCTS_AND_PRICING: '2477699024',
  PARTS: '985177480',
};

const COLUMNS = {
  PRODUCT_PARTS_RELATION: 'connect_boards8',
  PART_QTY: 'quantity',
  PART_AVAILABLE: 'formula_mkv86xh7',
  PART_SUPPLY_PRICE: 'supply_price',
  PART_TAGS: 'tags',
};

function makeMondayClient(token) {
  if (!token) throw new Error('Monday token is required');

  return async function mondayRequest(query, variables = {}) {
    const res = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({ query, variables }),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Monday API returned non-JSON response: ${text.slice(0, 300)}`);
    }
    if (!res.ok || data.errors) {
      throw new Error(`Monday API error: ${JSON.stringify(data.errors || data, null, 2)}`);
    }
    return data.data;
  };
}

// Monday board_relation columns expose IDs via the typed BoardRelationValue
// fragment. `text` and `value` may be null even when linked items exist.
function parseLinkedIds(columnValue) {
  if (!columnValue) return [];
  if (Array.isArray(columnValue.linked_item_ids) && columnValue.linked_item_ids.length) {
    return columnValue.linked_item_ids.map(String).filter(Boolean);
  }
  const raw = columnValue.value ?? columnValue;
  if (!raw) return [];
  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return [];
  }
  const linked = parsed.linkedPulseIds || parsed.linked_item_ids || [];
  return linked.map((entry) => String(entry.linkedPulseId || entry.itemId || entry)).filter(Boolean);
}

function col(item, id) {
  return item.column_values?.find((c) => c.id === id);
}

function partSummary(part) {
  return {
    id: part.id,
    name: part.name,
    totalStock: col(part, COLUMNS.PART_QTY)?.text || '0',
    availableStock: col(part, COLUMNS.PART_AVAILABLE)?.text || col(part, COLUMNS.PART_QTY)?.text || '0',
    supplyPrice: col(part, COLUMNS.PART_SUPPLY_PRICE)?.text || '',
  };
}

async function fetchProductsByIds(monday, ids) {
  if (!ids.length) return [];
  const query = `query($ids:[ID!]) {
    items(ids:$ids) {
      id
      name
      group { id title }
      column_values(ids:["${COLUMNS.PRODUCT_PARTS_RELATION}"]) {
        id type text value
        ... on BoardRelationValue { linked_item_ids display_value }
      }
    }
  }`;
  const data = await monday(query, { ids });
  return data.items || [];
}

async function fetchPartsByIds(monday, ids) {
  if (!ids.length) return [];
  const query = `query($ids:[ID!]) {
    items(ids:$ids) {
      id
      name
      column_values(ids:["${COLUMNS.PART_QTY}","${COLUMNS.PART_AVAILABLE}","${COLUMNS.PART_SUPPLY_PRICE}","${COLUMNS.PART_TAGS}"]) {
        id type text value
      }
    }
  }`;
  const data = await monday(query, { ids });
  return data.items || [];
}

/**
 * Look up stock for a list of Products & Pricing item IDs.
 *
 * Returns an array of:
 *   { productId, productName, parts: [{ id, name, totalStock, availableStock, supplyPrice }] }
 *
 * Each entry corresponds to one input productId, even if no linked parts
 * are found (so callers can show "no part linked" per repair).
 */
async function checkStockForProductIds(monday, productIds) {
  const ids = (productIds || []).map(String).filter(Boolean);
  if (!ids.length) return [];

  const products = await fetchProductsByIds(monday, ids);
  const productById = new Map(products.map((p) => [String(p.id), p]));

  const allLinkedPartIds = new Set();
  for (const product of products) {
    for (const id of parseLinkedIds(col(product, COLUMNS.PRODUCT_PARTS_RELATION))) {
      allLinkedPartIds.add(id);
    }
  }
  const parts = await fetchPartsByIds(monday, [...allLinkedPartIds]);
  const partById = new Map(parts.map((p) => [String(p.id), p]));

  return ids.map((productId) => {
    const product = productById.get(productId);
    if (!product) {
      return { productId, productName: null, parts: [] };
    }
    const linkedIds = parseLinkedIds(col(product, COLUMNS.PRODUCT_PARTS_RELATION));
    const linkedParts = linkedIds
      .map((id) => partById.get(id))
      .filter(Boolean)
      .map(partSummary);
    return {
      productId,
      productName: product.name,
      parts: linkedParts,
    };
  });
}

module.exports = {
  BOARDS,
  COLUMNS,
  makeMondayClient,
  parseLinkedIds,
  col,
  partSummary,
  fetchProductsByIds,
  fetchPartsByIds,
  checkStockForProductIds,
};
