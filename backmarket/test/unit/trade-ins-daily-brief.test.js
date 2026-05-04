const assert = require('assert');
const { buildMessage } = require('../../scripts/trade-ins-daily-brief');

const message = buildMessage([
  {
    createdAt: '2026-05-04T08:01:00.000Z',
    publicId: 'T1',
    bmName: 'BM 1562',
    product: 'MacBook Air 13 M1 A2337',
    customerName: 'Gajal Gupta',
    exVatPrice: 101,
    functionalLabel: 'Not Functional',
  },
  {
    createdAt: '2026-05-04T08:02:00.000Z',
    publicId: 'T2',
    bmName: 'BM 1560',
    product: 'MacBook Air 13 M2 A2681',
    customerName: 'Caitlin Shaw',
    exVatPrice: 156,
    functionalLabel: 'Functional',
  },
]);

assert.ok(message.includes('2 new trade-ins'));
assert.ok(message.includes('🆕 BM 1562 - MacBook Air 13 M1 A2337 - £101'));
assert.ok(message.includes('Customer: Gajal Gupta | Status: 🔴 Non-Functional'));
assert.ok(message.includes('Customer: Caitlin Shaw | Status: ✅ Functional'));

console.log('trade-ins-daily-brief.test passed');
