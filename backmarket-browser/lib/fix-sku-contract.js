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
      'capture GB market flag frontend URL and public page spec snapshot',
      'record listing_id -> frontend_url mapping locally for scraper target selection',
      'planned edit: SKU only',
      'after save: return to listings URL, filter again, reopen, verify exact correct_sku and frontend_url mapping still points to matching public spec'
    ],
    urlCapture: {
      required: true,
      operation: 'capture-gb-frontend-url',
      outputFields: ['listing_id', 'sku', 'product_id', 'seller_portal_url', 'frontend_url', 'captured_at', 'spec_snapshot', 'verification_status'],
      scrapeTargetPolicy: 'captured frontend_url becomes preferred scraper target; product_id placeholder URL is fallback only',
    },
    row
  };
}

module.exports = { REQUIRED_FIELDS, validateSkuRow, buildVerificationPlan };
