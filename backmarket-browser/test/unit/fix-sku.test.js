const assert = require('assert');
const { validateSkuRow, buildVerificationPlan } = require('../../lib/fix-sku-contract');
const row = {
  listing_id: '123',
  current_sku: 'OLD.SKU.Good',
  correct_sku: 'NEW.SKU.Good',
  product_id: 'uuid',
  appearance: 'Good'
};
assert.equal(validateSkuRow(row).ok, true);
assert.equal(validateSkuRow({ ...row, correct_sku: row.current_sku }).ok, false);
const plan = buildVerificationPlan(row);
assert.equal(plan.ok, true);
assert(plan.steps.some(step => step.includes('filter again')));
console.log('fix-sku.test passed');
