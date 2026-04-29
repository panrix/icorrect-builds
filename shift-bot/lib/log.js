'use strict';

function fmt(level, fields) {
  const ts = new Date().toISOString();
  const safe = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    safe[k] = typeof v === 'string' ? v : v;
  }
  return `${ts} ${level} ${JSON.stringify(safe)}`;
}

const log = {
  info(fields)  { console.log(fmt('INFO', fields)); },
  warn(fields)  { console.warn(fmt('WARN', fields)); },
  error(fields) { console.error(fmt('ERROR', fields)); },
};

module.exports = log;
