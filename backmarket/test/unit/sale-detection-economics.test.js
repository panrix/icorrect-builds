const assert = require('assert');
const {
  buildCandidateOrderSkus,
  calculateSaleEconomics,
  parsePartsCost,
  roundMoney,
} = require('../../scripts/sale-detection');

assert.deepEqual(
  buildCandidateOrderSkus(
    'MBA.A2337.8GB.256GB.Grey.Fair',
    'MacBook Air 13-inch (2020) - Apple M1 8-core and 7-core GPU - 8GB RAM - SSD 256GB - Standard display - QWERTY - English'
  ),
  [
    'MBA.A2337.8GB.256GB.Grey.Fair',
    'MBA.A2337.M1.7C.8GB.256GB.Grey.Fair',
  ]
);

assert.equal(roundMoney(10.005), 10.01);
assert.equal(parsePartsCost('15, 99, 7, 11, 3'), 135);
assert.equal(parsePartsCost(''), 0);

const economics = calculateSaleEconomics(475, {
  purchasePrice: 250,
  partsCost: 40,
  labourHours: 2,
});

assert.deepEqual(economics, {
  basis: 'actual_sale_price',
  salePrice: 475,
  purchasePrice: 250,
  partsCost: 40,
  labourHours: 2,
  labourCost: 48,
  shipping: 15,
  bmBuyFee: 25,
  fixedCost: 378,
  bmSellFee: 47.5,
  vat: 37.51,
  totalCost: 463.01,
  net: 11.99,
  margin: 2.52,
});

console.log('sale-detection-economics.test passed');
