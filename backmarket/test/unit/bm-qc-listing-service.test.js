const assert = require('assert');
const {
  isListingsTopicMessage,
  statusIndex,
  statusLabel,
} = require('../../services/bm-qc-listing');

assert.equal(
  statusIndex({ value: JSON.stringify({ index: 8 }) }),
  8
);

assert.equal(
  statusIndex({ value: { label: { index: 12 } } }),
  12
);

assert.equal(
  statusIndex({ value: '{bad json' }),
  null
);

assert.equal(
  statusLabel({ value: JSON.stringify({ label: { text: 'Ready To Collect' } }) }),
  'Ready To Collect'
);

assert.equal(
  statusLabel({ value: { label: 'To List' } }),
  'To List'
);

assert.equal(
  isListingsTopicMessage({ chat: { id: '-1003888456344' }, message_thread_id: 5618 }),
  true
);

assert.equal(
  isListingsTopicMessage({ chat: { id: '-1003888456344' }, message_thread_id: 5619 }),
  false
);

console.log('bm-qc-listing-service.test passed');
