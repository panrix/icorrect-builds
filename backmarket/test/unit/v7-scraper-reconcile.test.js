const assert = require('assert');
const { buildReconciledScrapeTarget } = require('../../scripts/lib/v7-scraper');

const bm1527Candidate = {
  productId: '9ef00207-1136-45f4-99c3-ade923986e43',
  modelFamily: 'MacBook Pro 13-inch (2020)',
  cpuGpu: 'Apple M1 8-core and 8-core GPU',
  ram: '8GB',
  ssd: '512GB',
  colour: 'Silver',
  keyboardLayout: 'QWERTY',
  grade: 'FAIR',
};

const bm1527LiveLikeScrape = {
  url: 'https://www.backmarket.co.uk/en-gb/p/placeholder/9ef00207-1136-45f4-99c3-ade923986e43?l=10',
  finalUrl: 'https://www.backmarket.co.uk/en-gb/p/placeholder/9ef00207-1136-45f4-99c3-ade923986e43?l=10',
  pageTitle: 'MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 8GB RAM - SSD 512GB - QWERTY - English',
  gradePrices: { Fair: 405, Good: 458, Excellent: 569 },
  ramPicker: {
    '8 GB': { price: 569, available: true, productId: '9ef00207-1136-45f4-99c3-ade923986e43' },
  },
  ssdPicker: {
    '256 GB': { price: 497, available: true, productId: '0dfd2e16-45be-4594-afaa-ee5a19662985' },
    '512 GB': { price: 569, available: true, productId: '9ef00207-1136-45f4-99c3-ade923986e43' },
  },
  colourPicker: {
    'Space Gray': { price: 569, available: true, productId: '30c2c24c-be74-409d-8bec-50e9b9bf421a' },
    Silver: { price: 569, available: true, productId: '9ef00207-1136-45f4-99c3-ade923986e43' },
  },
  cpuGpuPicker: {
    'Apple M1 8-core - 8-core GPU': { price: 569, available: true, productId: '9ef00207-1136-45f4-99c3-ade923986e43' },
  },
  keyboardPicker: {},
};

const wrong256SelectedScrape = {
  url: 'https://www.backmarket.co.uk/en-gb/p/placeholder/0dfd2e16-45be-4594-afaa-ee5a19662985?l=10',
  finalUrl: 'https://www.backmarket.co.uk/en-gb/p/placeholder/0dfd2e16-45be-4594-afaa-ee5a19662985?l=10',
  pageTitle: 'MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 8GB RAM - SSD 256GB - QWERTY - English',
  gradePrices: { Fair: 405, Good: 458, Excellent: 518 },
  ramPicker: {
    '8 GB': { price: 497, available: true, productId: '0dfd2e16-45be-4594-afaa-ee5a19662985' },
  },
  ssdPicker: {
    '256 GB': { price: 497, available: true, productId: '0dfd2e16-45be-4594-afaa-ee5a19662985' },
    '512 GB': { price: 569, available: true, productId: '9ef00207-1136-45f4-99c3-ade923986e43' },
  },
  colourPicker: {
    'Space Gray': { price: 569, available: true, productId: '30c2c24c-be74-409d-8bec-50e9b9bf421a' },
    Silver: { price: 497, available: true, productId: '0dfd2e16-45be-4594-afaa-ee5a19662985' },
  },
  cpuGpuPicker: {
    'Apple M1 8-core - 8-core GPU': { price: 497, available: true, productId: '0dfd2e16-45be-4594-afaa-ee5a19662985' },
  },
  keyboardPicker: {},
};

const trusted = buildReconciledScrapeTarget(bm1527Candidate, bm1527LiveLikeScrape);
assert.equal(trusted.ok, true);
assert.equal(trusted.trusted, true);
assert.equal(trusted.reconciledProductId, bm1527Candidate.productId);
assert.deepEqual(trusted.hardFailures, []);

const mismatch = buildReconciledScrapeTarget(bm1527Candidate, wrong256SelectedScrape);
assert.equal(mismatch.ok, false);
assert.equal(mismatch.trusted, false);
assert.equal(mismatch.reconciledProductId, '');
assert(mismatch.hardFailures.some(msg => msg.includes('picker product_id divergence')));

console.log('v7-scraper-reconcile.test passed');
