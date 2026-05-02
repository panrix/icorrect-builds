const assert = require('assert');
const { candidateHarnessBins, resolveHarnessBin } = require('../../lib/harness-path');

const explicit = candidateHarnessBins({ BROWSER_HARNESS_BIN: '/tmp/custom-browser-harness' });
assert.equal(explicit[0], '/tmp/custom-browser-harness');

const resolved = resolveHarnessBin({ BROWSER_HARNESS_BIN: '/definitely/not/browser-harness' });
assert.equal(typeof resolved, 'string');
assert(resolved.endsWith('browser-harness'));

console.log('harness-path.test passed');
