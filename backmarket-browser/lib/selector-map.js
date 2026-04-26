const fs = require('fs');
const path = require('path');

const DEFAULT_SELECTOR_PATH = path.join(__dirname, '..', 'config', 'selectors', 'portal.json');

function loadSelectorMap(filePath = DEFAULT_SELECTOR_PATH) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function validateSelectorMap(map) {
  const errors = [];
  if (!map || typeof map !== 'object') errors.push('selector map must be an object');
  if (!map.version) errors.push('missing version');
  if (!map.pages || typeof map.pages !== 'object') errors.push('missing pages');

  for (const [pageName, selectors] of Object.entries(map.pages || {})) {
    if (!selectors || typeof selectors !== 'object') {
      errors.push(`${pageName}: selectors must be an object`);
      continue;
    }
    for (const [selectorName, selector] of Object.entries(selectors)) {
      const hasLocator = Boolean(selector.text || selector.label || selector.role || selector.textPrefix || selector.css);
      if (!hasLocator) errors.push(`${pageName}.${selectorName}: missing locator hint`);
      if (selector.required === undefined) errors.push(`${pageName}.${selectorName}: missing required flag`);
    }
  }

  return { ok: errors.length === 0, errors };
}

module.exports = { DEFAULT_SELECTOR_PATH, loadSelectorMap, validateSelectorMap };
