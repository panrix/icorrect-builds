#!/usr/bin/env node
const { loadSelectorMap, validateSelectorMap } = require('../lib/selector-map');
const result = validateSelectorMap(loadSelectorMap());
if (!result.ok) {
  console.error(result.errors.join('\n'));
  process.exit(1);
}
console.log('Selector map contract valid');
