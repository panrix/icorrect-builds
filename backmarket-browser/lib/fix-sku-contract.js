const REQUIRED_FIELDS = [
  'listing_id', 'current_sku', 'correct_sku', 'product_id', 'appearance'
];

function validateSkuRow(row) {
  const missing = REQUIRED_FIELDS.filter(field => !String(row[field] || '').trim());
  if (missing.length) return { ok: false, reason: `missing required fields: ${missing.join(', ')}` };
  if (String(row.current_sku).trim() === String(row.correct_sku).trim()) {
    return { ok: false, reason: 'current_sku already equals correct_sku' };
  }
  return { ok: true };
}

function buildVerificationPlan(row) {
  const validation = validateSkuRow(row);
  if (!validation.ok) return { ok: false, reason: validation.reason };
  return {
    ok: true,
    mode: 'dry-run',
    lookupOrder: ['uuid/listing_id', 'current_sku', 'title'],
    steps: [
      'open Listings',
      'open Filter',
      'filter by UUID/listing_id if available, else exact current_sku',
      'require exactly one result',
      'click underlined listing name',
      'assert product_id, appearance, current_sku',
      'planned edit: SKU only',
      'after save: return to listings URL, filter again, reopen, verify exact correct_sku'
    ],
    row
  };
}

module.exports = { REQUIRED_FIELDS, validateSkuRow, buildVerificationPlan };
