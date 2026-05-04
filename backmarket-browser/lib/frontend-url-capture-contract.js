const CAPTURE_REQUIRED_FIELDS = [
  'sku',
  'seller_portal_url',
  'frontend_url',
  'captured_at',
  'verification_status',
];

const VERIFICATION_STATUSES = [
  'captured_unchecked',
  'captured_title_match',
  'captured_spec_match',
  'captured_spec_mismatch',
  'missing_gb_flag',
  'public_page_unreachable',
  'capture_failed',
];

function isIsoDateTime(value) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(String(value || ''));
}

function isBackMarketUrl(value, { allowSeller = false } = {}) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (allowSeller) return host.endsWith('backmarket.co.uk');
    return host === 'www.backmarket.co.uk' || host === 'backmarket.co.uk';
  } catch (_) {
    return false;
  }
}

function isBackMarketProductUrl(value) {
  if (!isBackMarketUrl(value)) return false;
  try {
    const url = new URL(String(value || '').trim());
    return /\/en-gb\/p\//.test(url.pathname);
  } catch (_) {
    return false;
  }
}

function validateSpecSnapshot(snapshot) {
  if (!snapshot) return { ok: true, errors: [] };
  const errors = [];
  if (typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return { ok: false, errors: ['spec_snapshot must be an object when present'] };
  }
  for (const key of Object.keys(snapshot)) {
    if (snapshot[key] !== null && snapshot[key] !== undefined && typeof snapshot[key] !== 'string') {
      errors.push(`spec_snapshot.${key} must be a string when present`);
    }
  }
  return { ok: errors.length === 0, errors };
}

function validateFrontendUrlCaptureRecord(record) {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return { ok: false, errors: ['record must be an object'] };
  }

  for (const field of CAPTURE_REQUIRED_FIELDS) {
    if (!String(record[field] || '').trim()) {
      errors.push(`missing required field: ${field}`);
    }
  }

  if (record.captured_at && !isIsoDateTime(record.captured_at)) {
    errors.push('captured_at must be an ISO-8601 UTC timestamp');
  }

  if (record.verification_status && !VERIFICATION_STATUSES.includes(record.verification_status)) {
    errors.push(`verification_status must be one of: ${VERIFICATION_STATUSES.join(', ')}`);
  }

  if (record.seller_portal_url && !isBackMarketUrl(record.seller_portal_url, { allowSeller: true })) {
    errors.push('seller_portal_url must be a Back Market portal/dashboard URL');
  }

  if (record.frontend_url && !isBackMarketProductUrl(record.frontend_url)) {
    errors.push('frontend_url must be a Back Market UK public product URL');
  }

  const specSnapshot = validateSpecSnapshot(record.spec_snapshot);
  errors.push(...specSnapshot.errors);

  return { ok: errors.length === 0, errors };
}

function buildFrontendUrlCapturePlan(candidate = {}) {
  const listingId = String(candidate.listing_id || '').trim();
  const sku = String(candidate.sku || '').trim();
  const productId = String(candidate.product_id || '').trim();
  if (!listingId && !sku) {
    return { ok: false, reason: 'candidate requires listing_id or sku' };
  }

  return {
    ok: true,
    mode: 'plan-only',
    readOnly: true,
    operation: 'capture-gb-frontend-url',
    lookupOrder: ['listing_id', 'sku', 'product_id'],
    steps: [
      'open seller portal Listings page',
      'filter to one listing using listing_id first, else exact sku',
      'open listing detail and record seller_portal_url',
      'locate the GB market flag/link for the United Kingdom market',
      'open the GB public link in a new tab without editing the listing',
      'wait for redirects to settle and capture the final public URL',
      'capture public page title and safe visible spec text for reconciliation',
      'close the public tab and return to the seller portal detail tab',
      'write a local capture record only',
    ],
    guardrails: [
      'no Save clicks',
      'no listing edits',
      'no inventory or unit changes',
      'no price or publication changes',
      'no customer care, return, refund, or warranty actions',
      'fail closed on selector drift or ambiguous listing results',
    ],
    outputFields: [
      'listing_id',
      'sku',
      'product_id',
      'seller_portal_url',
      'frontend_url',
      'captured_at',
      'spec_snapshot',
      'verification_status',
    ],
    scrapeTargetPolicy: {
      preferred: 'captured frontend_url from seller portal GB link',
      fallback: 'product_id placeholder URL only when no captured frontend_url exists',
      stillVerify: ['page title', 'spec snapshot', 'product_id when exposed in picker evidence', 'sku-derived spec'],
    },
    candidate: {
      listing_id: listingId,
      sku,
      product_id: productId,
    },
  };
}

module.exports = {
  CAPTURE_REQUIRED_FIELDS,
  VERIFICATION_STATUSES,
  validateFrontendUrlCaptureRecord,
  buildFrontendUrlCapturePlan,
  isBackMarketProductUrl,
};
