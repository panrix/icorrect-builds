const assert = require('assert');
const {
  isListingsTopicMessage,
  statusIndex,
  statusLabel,
} = require('../../services/bm-qc-listing');
const {
  buildButtons,
  callbackData,
  parseCallbackData,
} = require('../../scripts/listing-bot');

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

assert.deepEqual(
  parseCallbackData(callbackData('approve', '12345', 'abc123')),
  { action: 'approve', itemId: '12345', nonce: 'abc123' }
);

assert.deepEqual(
  parseCallbackData('skip:12345'),
  { action: 'skip', itemId: '12345', nonce: '' }
);

const buttons = buildButtons({
  decision: 'PROPOSE',
  itemId: '12345',
  pricing: { proposed: 499 },
}, { nonce: 'n1' });

assert.equal(buttons[0][0].callback_data, 'approve:12345:n1');
assert.equal(buttons[0][1].callback_data, 'override:12345:n1');
assert.equal(buttons[0][2].callback_data, 'skip:12345:n1');

console.log('bm-qc-listing-service.test passed');
