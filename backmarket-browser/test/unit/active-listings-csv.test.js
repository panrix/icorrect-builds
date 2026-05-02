const assert = require('assert');
const {
  parseDelimitedCsv,
  frontendUrlFromListingRow,
  captureRecordFromListingRow,
} = require('../../lib/active-listings-csv');

const csv = [
  '"Product ID";"Back Market ID";"Listing ID";"Language";"Link to the offer";"Listing no.";"Quantity";"SKU";"Status";"Title";"Grade";"grade"',
  '"7408af3f-40ad-4e74-aff8-d2acca799683";"2872244";"49e34bd8-3aff-4c38-8eee-aa56180b430a";"en-gb";"https://www.backmarket.co.uk/second-hand-macbook-pro-133-inch-2020-m1-8-core-and-8-core-gpu-16gb-ram-ssd-256gb-qwerty-english/2872244.html#l=3";"6709047";"1";"MBP.A2338.M1.16GB.256GB.Grey.Fair";"Online";"MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 16GB RAM - SSD 256GB - Standard display - QWERTY - English";"Correct";"FAIR"',
  '"9b1ef69f-c204-4a9f-8b06-a4ec8e37b231";"761518";"404311a2-7665-41d7-8f85-0ebf822d038a";"en-gb";"https://www.backmarket.co.uk/second-hand-macbook-air-13-inch-2022-m2-8-core-and-8-core-gpu-8gb-ram-ssd-256gb-qwerty/761518.html#l=3";"6816341";"0";"MBA.A2681.M2.8C.16GB.256GB.Starlight.Fair";"Offline";"MacBook Air 13-inch (2022) - Apple M2 8-core and 8-core GPU - 8GB RAM - SSD 256GB - Standard display - QWERTY - English";"Correct";"FAIR"',
].join('\n');

const rows = parseDelimitedCsv(csv);
assert.equal(rows.length, 2);

const matched = captureRecordFromListingRow(rows[0], { capturedAt: '2026-04-26T00:00:00.000Z' });
assert.equal(matched.listing_id, '6709047');
assert.equal(matched.product_id, '7408af3f-40ad-4e74-aff8-d2acca799683');
assert.equal(matched.verification_status, 'captured_spec_match');
assert.equal(
  matched.frontend_url,
  'https://www.backmarket.co.uk/en-gb/p/macbook-pro-133-inch-2020-m1-8-core-and-8-core-gpu-16gb-ram-ssd-256gb-qwerty-english/7408af3f-40ad-4e74-aff8-d2acca799683?l=12'
);

const mismatch = captureRecordFromListingRow(rows[1], { capturedAt: '2026-04-26T00:00:00.000Z' });
assert.equal(mismatch.verification_status, 'captured_spec_mismatch');
assert(mismatch.spec_snapshot.sku_spec_mismatches.includes('16GB'));
assert(!mismatch.spec_snapshot.sku_spec_mismatches.includes('Starlight'));

assert.equal(frontendUrlFromListingRow({}), '');

console.log('active-listings-csv.test passed');
