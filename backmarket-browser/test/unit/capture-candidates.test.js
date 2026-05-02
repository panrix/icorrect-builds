const assert = require('assert');
const {
  rowsFromQueuePayload,
  candidateFromQueueRow,
  buildCaptureCandidates,
} = require('../../lib/capture-candidates');

const rows = rowsFromQueuePayload({
  rows: [
    {
      main_item_id: '11440582288',
      item_name: 'BM 1527',
      listing_id: '5035146',
      sku_current: 'MBP.A2338.M1.8GB.512GB.Silver.Fair',
      uuid: '9ef00207-1136-45f4-99c3-ade923986e43',
      classification: 'READY_FOR_LISTING_PROPOSAL',
    },
    {
      item_name: 'BM 1541 *RTN > REFUND',
      sku_current: 'MBP.A2338.M1.16GB.512GB.Grey.Good',
      return_relist_caution: true,
    },
  ],
});

assert.equal(rows.length, 2);
const first = candidateFromQueueRow(rows[0]);
assert.equal(first.listing_id, '5035146');
assert.equal(first.product_id, '9ef00207-1136-45f4-99c3-ade923986e43');

const filtered = buildCaptureCandidates(rows);
assert.equal(filtered.candidates.length, 1);
assert.equal(filtered.rejected[0].reason, 'return_relist_caution');

const withCaution = buildCaptureCandidates(rows, { includeCaution: true });
assert.equal(withCaution.candidates.length, 2);

const duplicates = buildCaptureCandidates([rows[0], { ...rows[0], main_item_id: 'next' }]);
assert.equal(duplicates.candidates.length, 2);

console.log('capture-candidates.test passed');
