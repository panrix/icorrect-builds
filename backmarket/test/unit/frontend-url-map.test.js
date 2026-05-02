const assert = require('assert');
const {
  buildFrontendUrlMap,
  lookupFrontendUrl,
  normalizeFrontendUrl,
} = require('../../scripts/lib/frontend-url-map');

const records = [
  {
    listing_id: '5035146',
    sku: 'MBP.A2338.M1.8GB.512GB.Silver.Fair',
    product_id: '9ef00207-1136-45f4-99c3-ade923986e43',
    frontend_url: 'https://www.backmarket.co.uk/en-gb/p/macbook-pro/9ef00207-1136-45f4-99c3-ade923986e43?l=10',
    verification_status: 'captured_spec_match',
  },
  {
    listing_id: 'bad',
    sku: 'BAD',
    frontend_url: 'https://example.com/not-backmarket',
    verification_status: 'captured_spec_match',
  },
  {
    listing_id: 'mismatch',
    sku: 'MISMATCH',
    frontend_url: 'https://www.backmarket.co.uk/en-gb/p/not-trusted/abc?l=10',
    verification_status: 'captured_spec_mismatch',
  },
];

const map = buildFrontendUrlMap(records);
assert.equal(map.accepted.length, 1);
assert.equal(map.rejected.length, 2);

assert.equal(normalizeFrontendUrl(records[0].frontend_url), records[0].frontend_url);
assert.equal(normalizeFrontendUrl('https://example.com/nope'), '');

const byListing = lookupFrontendUrl(map, { listing_id: '5035146' });
assert.equal(byListing.matchedBy, 'listing_id');
assert.equal(byListing.record.product_id, '9ef00207-1136-45f4-99c3-ade923986e43');

const bySku = lookupFrontendUrl(map, { sku: 'MBP.A2338.M1.8GB.512GB.Silver.Fair' });
assert.equal(bySku.matchedBy, 'sku');

assert.equal(lookupFrontendUrl(map, { listing_id: 'missing' }), null);

console.log('frontend-url-map.test passed');
