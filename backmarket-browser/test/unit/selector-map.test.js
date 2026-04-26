const assert = require('assert');
const { loadSelectorMap, validateSelectorMap } = require('../../lib/selector-map');
const result = validateSelectorMap(loadSelectorMap());
assert.equal(result.ok, true, result.errors.join('\n'));
console.log('selector-map.test passed');
