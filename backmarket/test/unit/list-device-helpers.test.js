const assert = require('assert');
const {
  buildProjectedEconomics,
  calculateProfitability,
  decisionGate,
  classifyTrust,
  resolveHistoricalSalesFromSoldLookup,
  summarizeFrontendCaptureMismatches,
} = require('../../scripts/list-device');

const profitability = calculateProfitability(500, {
  purchasePrice: 250,
  partsCost: 40,
  labourHours: 2,
});

assert.equal(profitability.minPrice, 485);
assert.equal(profitability.labourCost, 48);
assert.equal(profitability.bmBuyFee, 25);
assert.equal(profitability.bmSellFee, 48.5);
assert.equal(profitability.vat, 39.17);
assert.equal(profitability.totalFixedCost, 378);
assert.equal(profitability.totalCosts, 465.67);
assert.equal(profitability.net, 19.33);
assert.equal(profitability.margin, 3.98);
assert.equal(profitability.breakEven, 459);

assert.deepEqual(
  buildProjectedEconomics(profitability),
  {
    basis: 'projected_min_price',
    salePrice: 485,
    fixedCost: 378,
    bmSellFee: 48.5,
    vat: 39.17,
    totalCost: 465.67,
    net: 19.33,
    margin: 3.98,
  }
);

assert.deepEqual(
  summarizeFrontendCaptureMismatches({
    spec_snapshot: {
      sku_spec_mismatches: { field: 'storage', expected: '128GB' },
    },
  }),
  ['storage expected 128GB']
);

assert.deepEqual(
  summarizeFrontendCaptureMismatches({
    spec_snapshot: {
      sku_spec_mismatches: JSON.stringify([{ field: 'ram', expected: '16GB' }]),
    },
  }),
  ['ram expected 16GB']
);

assert.deepEqual(
  summarizeFrontendCaptureMismatches({
    spec_snapshot: {
      sku_spec_check: { field: 'colour', expected: 'Silver', ok: false },
    },
  }),
  ['colour expected Silver']
);

const sparseCrossGenerationLookup = {
  by_sku: {
    'MBP.A2338.M2.8GB.256GB.Grey.Fair': {
      grade: 'Fair',
      count: 1,
      avg_price: 601,
      median_price: 601,
      min_price: 601,
      max_price: 601,
      last_sold_date: '2026-04-28T13:22:36+01:00',
    },
    'MBP.A2338.M1.8GB.256GB.Grey.Fair': {
      grade: 'Fair',
      count: 4,
      avg_price: 452,
      median_price: 456,
      min_price: 399,
      max_price: 511,
      last_sold_date: '2026-04-26T06:49:41+01:00',
    },
  },
};

assert.equal(
  resolveHistoricalSalesFromSoldLookup(
    'MBP.A2338.M2.8GB.256GB.Grey.Fair',
    'FAIR',
    sparseCrossGenerationLookup
  ),
  null
);

const aliasedSameGenerationLookup = {
  by_sku: {
    'MBP.A2338.M2.8GB.256GB.Grey.Fair': {
      grade: 'Fair',
      count: 1,
      avg_price: 600,
      median_price: 600,
      min_price: 600,
      max_price: 600,
      last_sold_date: '2026-04-20T10:00:00+01:00',
    },
    'MBP.M2.A2338.8GB.256GB.Grey.Fair': {
      grade: 'Fair',
      count: 2,
      avg_price: 630,
      median_price: 630,
      min_price: 620,
      max_price: 640,
      last_sold_date: '2026-04-28T13:22:36+01:00',
    },
  },
};

const sameGenerationHistory = resolveHistoricalSalesFromSoldLookup(
  'MBP.A2338.M2.8GB.256GB.Grey.Fair',
  'FAIR',
  aliasedSameGenerationLookup
);

assert.ok(sameGenerationHistory);
assert.equal(sameGenerationHistory.count, 3);
assert.equal(sameGenerationHistory.avg, 620);
assert.equal(sameGenerationHistory.median, 620);
assert.equal(sameGenerationHistory.low, 600);
assert.equal(sameGenerationHistory.high, 640);
assert.equal(
  sameGenerationHistory.source,
  'sold_lookup:by_sku_normalized:MBP.A2338.M2.8GB.256GB.Grey.Fair:aliases=2'
);

const lossDecision = decisionGate({ margin: -12.5, net: -42 });
assert.equal(lossDecision.decision, 'PROPOSE');
assert.equal(lossDecision.reviewRequired, true);
assert.equal(lossDecision.requiresMinMarginOverride, true);
assert.match(lossDecision.reason, /Loss/);

assert.deepEqual(
  classifyTrust({
    hasProductResolution: true,
    liveEligible: false,
    decision: { decision: 'BLOCK', reason: 'Unreconciled scrape target: ram mismatch for expected "16GB"' },
    missingGrade: false,
  }),
  {
    classification: 'blocked',
    reason: 'Unreconciled scrape target: ram mismatch for expected "16GB"',
  }
);
