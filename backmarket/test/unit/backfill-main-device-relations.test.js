const assert = require('assert');
const {
  hasLinkedDevice,
  parseBmNumber,
} = require('../../scripts/backfill-main-device-relations');

assert.equal(parseBmNumber('BM 1611 ( Gajal Gupta )'), '1611');
assert.equal(parseBmNumber('No BM number'), '?');

assert.equal(
  hasLinkedDevice({
    column_values: [
      { id: 'board_relation5', linked_item_ids: ['3923707691'] },
    ],
  }),
  true
);

assert.equal(
  hasLinkedDevice({
    column_values: [
      { id: 'board_relation5', linked_item_ids: [] },
    ],
  }),
  false
);

console.log('backfill-main-device-relations.test passed');
