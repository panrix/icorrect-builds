function normalizeKey(value) {
  return String(value || '').trim();
}

function rowsFromQueuePayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function candidateFromQueueRow(row = {}) {
  const listingId = normalizeKey(row.listing_id || row.listingId);
  const sku = normalizeKey(row.sku_current || row.sku || row.correct_sku);
  const productId = normalizeKey(row.uuid || row.product_id || row.productId);
  const mainItemId = normalizeKey(row.main_item_id || row.mainItemId);
  const bmDeviceId = normalizeKey(row.bm_device_id || row.bmDeviceId);
  const itemName = normalizeKey(row.item_name || row.name);

  if (!listingId && !sku) return null;

  return {
    main_item_id: mainItemId,
    bm_device_id: bmDeviceId,
    item_name: itemName,
    listing_id: listingId,
    sku,
    product_id: productId,
    return_relist_caution: Boolean(row.return_relist_caution),
    return_relist_reason: normalizeKey(row.return_relist_reason),
    classification: normalizeKey(row.classification),
  };
}

function buildCaptureCandidates(rows = [], options = {}) {
  const includeCaution = Boolean(options.includeCaution);
  const candidates = [];
  const rejected = [];
  for (const row of rows) {
    const candidate = candidateFromQueueRow(row);
    if (!candidate) {
      rejected.push({ row, reason: 'missing listing_id and sku' });
      continue;
    }
    if (candidate.return_relist_caution && !includeCaution) {
      rejected.push({ row, reason: 'return_relist_caution' });
      continue;
    }
    candidates.push(candidate);
  }

  return { candidates, rejected };
}

module.exports = {
  rowsFromQueuePayload,
  candidateFromQueueRow,
  buildCaptureCandidates,
};
