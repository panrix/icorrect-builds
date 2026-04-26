const assert = require('assert');
const {
  VERIFICATION_STATUSES,
  validateFrontendUrlCaptureRecord,
  buildFrontendUrlCapturePlan,
} = require('../../lib/frontend-url-capture-contract');

const validRecord = {
  listing_id: '6709047',
  sku: 'MBP.A2338.M1.16GB.256GB.Grey.Fair',
  product_id: '7408af3f-40ad-4e74-aff8-d2acca799683',
  seller_portal_url: 'https://www.backmarket.co.uk/en-gb/dashboard/seller/listings/6709047',
  frontend_url: 'https://www.backmarket.co.uk/en-gb/p/macbook-pro-13-inch-2020-m1-16gb-256gb-space-grey/7408af3f-40ad-4e74-aff8-d2acca799683?l=10',
  captured_at: '2026-04-26T07:00:00.000Z',
  spec_snapshot: {
    page_title: 'MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 16GB RAM - SSD 256GB - QWERTY - English',
    ram: '16GB',
    ssd: '256GB',
    colour: 'Space Gray',
    grade: 'Fair',
  },
  verification_status: 'captured_spec_match',
};

assert.equal(VERIFICATION_STATUSES.includes(validRecord.verification_status), true);
assert.equal(validateFrontendUrlCaptureRecord(validRecord).ok, true);

const invalidRecord = {
  ...validRecord,
  frontend_url: 'https://example.com/not-backmarket',
  verification_status: 'unknown_status',
};
assert.equal(validateFrontendUrlCaptureRecord(invalidRecord).ok, false);

const plan = buildFrontendUrlCapturePlan({
  listing_id: '6709047',
  sku: 'MBP.A2338.M1.16GB.256GB.Grey.Fair',
  product_id: '7408af3f-40ad-4e74-aff8-d2acca799683',
});
assert.equal(plan.ok, true);
assert.equal(plan.readOnly, true);
assert(plan.steps.some(step => step.includes('GB market flag')));
assert.equal(plan.scrapeTargetPolicy.preferred.includes('frontend_url'), true);

console.log('frontend-url-capture-contract.test passed');
