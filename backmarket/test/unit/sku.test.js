const assert = require('assert');
const { constructBmSku, validateSku, normalizeStorage, normalizeColour } = require('../../scripts/lib/sku');

assert.equal(
  constructBmSku({
    model: 'A2338',
    cpu: '8-Core',
    gpu: '10-Core',
    ram: '8GB',
    ssd: '256GB',
    colour: 'Space Gray',
    deviceName: 'MacBook Pro 13-inch A2338',
  }, 'Fair'),
  'MBP.A2338.M2.8GB.256GB.Grey.Fair'
);

assert.equal(
  constructBmSku({
    model: 'A2337',
    cpu: '8-Core',
    gpu: '7-Core',
    ram: '8 GB',
    ssd: '256 GB',
    colour: 'Gold',
    deviceName: 'MacBook Air 13-inch A2337',
  }, 'Good'),
  'MBA.A2337.M1.7C.8GB.256GB.Gold.Good'
);

assert.equal(normalizeStorage('1000GB'), '1TB');
assert.equal(normalizeStorage('2000GB'), '2TB');
assert.equal(normalizeColour('Space Grey'), 'Grey');

assert.deepEqual(
  validateSku({ storedSku: '', expectedSku: 'MBA.A2337.M1.7C.8GB.256GB.Gold.Good' }),
  { ok: false, code: 'QC_SKU_MISSING', storedSku: null, expectedSku: 'MBA.A2337.M1.7C.8GB.256GB.Gold.Good' }
);

assert.deepEqual(
  validateSku({ storedSku: 'WRONG', expectedSku: 'RIGHT' }),
  { ok: false, code: 'QC_SKU_MISMATCH', storedSku: 'WRONG', expectedSku: 'RIGHT' }
);

assert.deepEqual(
  validateSku({ storedSku: 'RIGHT', expectedSku: 'RIGHT' }),
  { ok: true, code: 'SKU_MATCH', storedSku: 'RIGHT', expectedSku: 'RIGHT' }
);

console.log('sku.test passed');
