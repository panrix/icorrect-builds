const fs = require('fs');
const path = require('path');

const DEFAULT_FRONTEND_URL_MAP_PATH = path.join(__dirname, '..', '..', 'data', 'listing-frontend-url-map.json');

const TRUSTED_CAPTURE_STATUSES = new Set([
  'captured_title_match',
  'captured_spec_match',
]);

const MISMATCH_CAPTURE_STATUSES = new Set([
  'captured_spec_mismatch',
]);

function defaultFrontendUrlMapPath() {
  return process.env.BM_FRONTEND_URL_MAP_PATH || DEFAULT_FRONTEND_URL_MAP_PATH;
}

function normalizeKey(value) {
  return String(value || '').trim();
}

function isTrustedCapture(record) {
  const status = normalizeKey(record?.verification_status);
  return TRUSTED_CAPTURE_STATUSES.has(status);
}

function isMismatchCapture(record) {
  const status = normalizeKey(record?.verification_status);
  return MISMATCH_CAPTURE_STATUSES.has(status);
}

function normalizeFrontendUrl(value) {
  const raw = normalizeKey(value);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (host !== 'www.backmarket.co.uk' && host !== 'backmarket.co.uk') return '';
    return url.toString();
  } catch (_) {
    return '';
  }
}

function normalizeCaptureRecord(record) {
  const frontendUrl = normalizeFrontendUrl(record?.frontend_url);
  if (!frontendUrl) return null;
  return {
    listing_id: normalizeKey(record.listing_id),
    listing_uuid: normalizeKey(record.listing_uuid),
    sku: normalizeKey(record.sku),
    product_id: normalizeKey(record.product_id),
    frontend_url: frontendUrl,
    seller_portal_url: normalizeKey(record.seller_portal_url),
    verification_status: normalizeKey(record.verification_status) || 'captured_unchecked',
    captured_at: normalizeKey(record.captured_at),
    source: normalizeKey(record.source) || 'listing-frontend-url-map',
    spec_snapshot: record?.spec_snapshot || null,
  };
}

function recordsFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.captures)) return payload.captures;
  if (payload && typeof payload === 'object') return Object.values(payload);
  return [];
}

function buildFrontendUrlMap(records = []) {
  const byListingId = new Map();
  const bySku = new Map();
  const byProductId = new Map();
  const mismatchByListingId = new Map();
  const mismatchBySku = new Map();
  const mismatchByProductId = new Map();
  const accepted = [];
  const mismatches = [];
  const rejected = [];

  for (const raw of records) {
    const record = normalizeCaptureRecord(raw);
    if (!record) {
      rejected.push(raw);
      continue;
    }

    if (isTrustedCapture(record)) {
      accepted.push(record);
      if (record.listing_id) byListingId.set(record.listing_id, record);
      if (record.sku) bySku.set(record.sku, record);
      if (record.product_id) byProductId.set(record.product_id, record);
      continue;
    }

    if (isMismatchCapture(record)) {
      mismatches.push(record);
      if (record.listing_id) mismatchByListingId.set(record.listing_id, record);
      if (record.sku) mismatchBySku.set(record.sku, record);
      if (record.product_id) mismatchByProductId.set(record.product_id, record);
      continue;
    }

    rejected.push(raw);
  }

  return {
    byListingId,
    bySku,
    byProductId,
    mismatchByListingId,
    mismatchBySku,
    mismatchByProductId,
    accepted,
    mismatches,
    rejected,
  };
}

function loadFrontendUrlMap(filePath = defaultFrontendUrlMapPath()) {
  if (!fs.existsSync(filePath)) {
    return { path: filePath, exists: false, ...buildFrontendUrlMap([]) };
  }
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return { path: filePath, exists: true, ...buildFrontendUrlMap(recordsFromPayload(payload)) };
}

function lookupFrontendUrl(map, identifiers = {}, options = {}) {
  const listingId = normalizeKey(identifiers.listing_id || identifiers.listingId);
  const sku = normalizeKey(identifiers.sku);
  const productId = normalizeKey(identifiers.product_id || identifiers.productId);
  const includeMismatch = !!options.includeMismatch;

  const trustedMaps = [
    ['listing_id', listingId, map.byListingId],
    ['sku', sku, map.bySku],
    ['product_id', productId, map.byProductId],
  ];

  for (const [matchedBy, key, index] of trustedMaps) {
    if (key && index?.has(key)) {
      return { matchedBy, record: index.get(key), trusted: true };
    }
  }

  if (!includeMismatch) {
    return null;
  }

  const mismatchMaps = [
    ['listing_id', listingId, map.mismatchByListingId],
    ['sku', sku, map.mismatchBySku],
    ['product_id', productId, map.mismatchByProductId],
  ];

  for (const [matchedBy, key, index] of mismatchMaps) {
    if (key && index?.has(key)) {
      return { matchedBy, record: index.get(key), trusted: false };
    }
  }
  return null;
}

module.exports = {
  DEFAULT_FRONTEND_URL_MAP_PATH,
  MISMATCH_CAPTURE_STATUSES,
  TRUSTED_CAPTURE_STATUSES,
  defaultFrontendUrlMapPath,
  buildFrontendUrlMap,
  isMismatchCapture,
  isTrustedCapture,
  loadFrontendUrlMap,
  lookupFrontendUrl,
  normalizeFrontendUrl,
};
