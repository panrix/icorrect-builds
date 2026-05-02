#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { validateFrontendUrlCaptureRecord } = require('../lib/frontend-url-capture-contract');
const {
  defaultActiveListingsCsvPath,
  recordsFromActiveListingsCsv,
} = require('../lib/active-listings-csv');

function argValue(name, fallback = '') {
  const prefix = `${name}=`;
  const match = process.argv.find(arg => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function recordsFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.captures)) return payload.captures;
  return [];
}

const inputPath = argValue('--input', path.join(__dirname, '..', 'data', 'exports', 'gb-frontend-url-captures.json'));
const outPath = argValue('--out', path.join(__dirname, '..', '..', 'backmarket', 'data', 'listing-frontend-url-map.json'));
const activeListingsCsvPath = argValue('--active-listings-csv', process.env.BM_ACTIVE_LISTINGS_CSV || defaultActiveListingsCsvPath());

const payload = fs.existsSync(inputPath)
  ? JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  : [];
const browserCaptureRecords = recordsFromPayload(payload);
const csvImport = fs.existsSync(activeListingsCsvPath)
  ? recordsFromActiveListingsCsv(activeListingsCsvPath)
  : { filePath: activeListingsCsvPath, records: [], rejected: [] };
const records = [...csvImport.records, ...browserCaptureRecords];
const accepted = [];
const rejected = [];

for (const record of records) {
  const validation = validateFrontendUrlCaptureRecord(record);
  if (validation.ok) accepted.push({ ...record, source: record.source || 'backmarket-browser-gb-flag-capture' });
  else rejected.push({ record, errors: validation.errors });
}

const output = {
  generated_at: new Date().toISOString(),
  source_capture_file: inputPath,
  source_active_listings_csv: fs.existsSync(activeListingsCsvPath) ? activeListingsCsvPath : '',
  source_counts: {
    active_listings_csv_records: csvImport.records.length,
    browser_capture_records: browserCaptureRecords.length,
  },
  records: accepted,
  rejected_records: rejected,
  csv_rejected_records: csvImport.rejected,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({
  ok: rejected.length === 0,
  out: outPath,
  accepted: accepted.length,
  rejected: rejected.length,
  active_listings_csv: fs.existsSync(activeListingsCsvPath) ? activeListingsCsvPath : null,
  active_listings_csv_records: csvImport.records.length,
  browser_capture_records: browserCaptureRecords.length,
  rejected_records: rejected,
}, null, 2));
process.exit(rejected.length === 0 ? 0 : 1);
