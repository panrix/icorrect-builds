const assert = require('assert');
const { classifyCustomerCareRow } = require('../../lib/cs-monitor-contract');
assert.equal(classifyCustomerCareRow({ status: '5 days left', task: 'Repair/replace' }).urgent, true);
assert.equal(classifyCustomerCareRow({ status: '5 days left', task: 'Repair/replaxe' }).urgent, true);
assert.equal(classifyCustomerCareRow({ status: 'Completed', task: 'Repair/replace' }).urgent, false);
console.log('cs-monitor.test passed');
