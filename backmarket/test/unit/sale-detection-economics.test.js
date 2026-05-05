const assert = require('assert');
const {
  calculateSaleEconomics,
  parsePartsCost,
  roundMoney,
} = require('../../scripts/sale-detection');

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
