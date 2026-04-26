const assert = require('assert');
const { checkHarness } = require('../../lib/harness-check');
const missing = checkHarness('/definitely/not/browser-harness');
assert.equal(missing.ok, false);
assert.equal(missing.reason, 'missing_binary');
console.log('harness-check.test passed');
