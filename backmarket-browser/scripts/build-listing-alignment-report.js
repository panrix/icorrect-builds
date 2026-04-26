#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {
  defaultActiveListingsCsvPath,
  recordsFromActiveListingsCsv,
} = require('../lib/active-listings-csv');

function argValue(name, fallback = '') {
  const prefix = `${name}=`;
  const match = process.argv.find(arg => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function normalize(value) {
  return String(value || '').trim();
}

function normalizeSku(value) {
  return normalize(value).toLowerCase();
}

function skuEquals(left, right) {
  return normalize(left).replace(/[^a-z0-9]+/gi, '').toLowerCase() ===
    normalize(right).replace(/[^a-z0-9]+/gi, '').toLowerCase();
}

function rowsFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function recordsFromMapPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.captures)) return payload.captures;
  return [];
}

function registrySlotsFromPayload(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload.slots && typeof payload.slots === 'object') return Object.values(payload.slots);
  if (typeof payload === 'object') return Object.values(payload);
  return [];
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function csvEscape(value) {
  const raw = String(value ?? '');
  if (!/[",\n]/.test(raw)) return raw;
  return `"${raw.replace(/"/g, '""')}"`;
}

function writeCsv(filePath, rows) {
  const headers = [
    'priority',
    'classification',
    'listing_id',
    'listing_uuid',
    'sku',
    'product_id',
    'status',
    'quantity',
    'mismatches',
    'queue_items',
    'title',
    'frontend_url',
  ];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(header => csvEscape(row[header])).join(','));
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
}

function indexRecords(records) {
  const byListing = new Map();
  const bySku = new Map();
  const byProduct = new Map();
  for (const record of records) {
    const listingId = normalize(record.listing_id);
    const sku = normalizeSku(record.sku);
    const productId = normalize(record.product_id);
    if (listingId) byListing.set(listingId, record);
    if (sku) {
      if (!bySku.has(sku)) bySku.set(sku, []);
      bySku.get(sku).push(record);
    }
    if (productId) {
      if (!byProduct.has(productId)) byProduct.set(productId, []);
      byProduct.get(productId).push(record);
    }
  }
  return { byListing, bySku, byProduct };
}

function indexRegistrySlots(slots) {
  const bySku = new Map();
  for (const slot of slots) {
    const sku = normalizeSku(slot?.sku);
    if (!sku) continue;
    if (!bySku.has(sku)) bySku.set(sku, []);
    bySku.get(sku).push(slot);
  }
  return { bySku };
}

function enrichQueueRowFromRegistry(row, registryIndexes) {
  const expectedSku = normalizeSku(row.sku_expected || row.correct_sku || row.sku_current || row.sku);
  const matches = registryIndexes.bySku.get(expectedSku) || [];
  if (matches.length !== 1) return { row, registrySlot: null };
  const slot = matches[0];
  return {
    row: {
      ...row,
      listing_id: row.listing_id || slot.listing_id || '',
      uuid: row.uuid || slot.product_id || '',
      product_id: row.product_id || slot.product_id || '',
      registry_listing_id: slot.listing_id || '',
      registry_product_id: slot.product_id || '',
    },
    registrySlot: slot,
  };
}

function queueRefsForRecord(record, queueRows) {
  const recordSku = normalizeSku(record.sku);
  const listingId = normalize(record.listing_id);
  const productId = normalize(record.product_id);
  return queueRows.filter(row => {
    const rowListingId = normalize(row.listing_id);
    const rowProductId = normalize(row.uuid || row.product_id || row.productId);
    const currentSku = normalizeSku(row.sku_current || row.sku);
    const expectedSku = normalizeSku(row.sku_expected || row.correct_sku || row.sku);
    return (listingId && rowListingId === listingId) ||
      (productId && rowProductId === productId) ||
      (recordSku && (currentSku === recordSku || expectedSku === recordSku));
  });
}

function classifyExportRecord(record, queueRows) {
  const mismatches = parseJsonArray(record.spec_snapshot?.sku_spec_mismatches);
  const status = normalize(record.spec_snapshot?.active_listing_export_status || '');
  const quantity = Number(normalize(record.spec_snapshot?.active_listing_export_quantity || '0')) || 0;
  const queueRefs = queueRefsForRecord(record, queueRows);
  const isOnline = status.toLowerCase() === 'online';
  const hasStock = quantity > 0;
  let priority = 'P4';
  let classification = 'untrusted_export_evidence';

  if (record.verification_status === 'captured_spec_match') {
    classification = isOnline || hasStock ? 'aligned_live_listing' : 'aligned_offline_or_zero_qty';
    priority = isOnline || hasStock ? 'P3' : 'P5';
  } else if (record.verification_status === 'captured_spec_mismatch') {
    classification = 'sku_spec_mismatch';
    priority = isOnline || hasStock ? 'P0' : queueRefs.length ? 'P1' : 'P3';
  } else if (record.verification_status === 'capture_failed') {
    classification = 'unparseable_or_nonstandard_sku';
    priority = isOnline || hasStock ? 'P1' : 'P4';
  }

  if (queueRefs.length && classification === 'aligned_offline_or_zero_qty') {
    priority = 'P2';
    classification = 'queue_item_maps_to_offline_or_zero_qty_listing';
  }

  return {
    priority,
    classification,
    listing_id: normalize(record.listing_id),
    listing_uuid: normalize(record.spec_snapshot?.active_listing_export_listing_uuid),
    sku: normalize(record.sku),
    product_id: normalize(record.product_id),
    status,
    quantity,
    mismatches: mismatches.map(item => `${item.field}:${item.expected}`).join('; '),
    queue_items: queueRefs.map(row => `${row.item_name || row.main_item_id || ''} (${row.main_item_id || ''})`).filter(Boolean).join('; '),
    title: normalize(record.spec_snapshot?.page_title),
    frontend_url: normalize(record.frontend_url),
  };
}

function classifyQueueRow(row, indexes, trustedRecords) {
  const listingId = normalize(row.listing_id);
  const productId = normalize(row.uuid || row.product_id || row.productId);
  const expectedSku = normalize(row.sku_expected || row.correct_sku || row.sku_current || row.sku);
  const currentSku = normalize(row.sku_current || row.sku || expectedSku);
  const expectedMatches = indexes.bySku.get(normalizeSku(expectedSku)) || [];
  const currentMatches = indexes.bySku.get(normalizeSku(currentSku)) || [];
  const listingMatch = listingId ? indexes.byListing.get(listingId) : null;
  const productMatches = productId ? indexes.byProduct.get(productId) || [] : [];
  const trustedBySku = trustedRecords.find(record => skuEquals(record.sku, expectedSku));
  const trustedByListing = listingId
    ? trustedRecords.find(record => normalize(record.listing_id) === listingId && skuEquals(record.sku, expectedSku))
    : null;
  const trustedByProduct = productId
    ? trustedRecords.find(record => normalize(record.product_id) === productId && skuEquals(record.sku, expectedSku))
    : null;
  const trusted = trustedByListing || trustedBySku || trustedByProduct || null;
  const strongMatches = [
    listingMatch,
    ...expectedMatches,
    ...currentMatches,
  ].filter(Boolean);
  const candidateMatches = strongMatches.length ? strongMatches : productMatches;
  const uniqueMatches = Array.from(new Map(candidateMatches.map(record => [
    `${record.listing_id}|${record.sku}|${record.product_id}`,
    record,
  ])).values());
  const nonCanonicalTrustedMatches = uniqueMatches.filter(record =>
    ['captured_spec_match', 'captured_title_match'].includes(record.verification_status) &&
    expectedSku &&
    !skuEquals(record.sku, expectedSku)
  );
  const mismatchMatches = uniqueMatches.filter(record => record.verification_status === 'captured_spec_mismatch');

  let classification = 'queue_needs_browser_or_create_listing';
  let priority = 'P2';
  let reason = 'No trusted active-listings export row matched listing/product/SKU';

  if (trusted) {
    classification = 'queue_aligned_to_trusted_export_url';
    priority = 'P3';
    reason = `Trusted by ${trusted.listing_id ? 'listing/SKU/product evidence' : 'SKU/product evidence'}`;
  } else if (nonCanonicalTrustedMatches.length) {
    classification = 'queue_product_matches_but_sku_not_canonical';
    priority = nonCanonicalTrustedMatches.some(record =>
      normalize(record.spec_snapshot?.active_listing_export_status).toLowerCase() === 'online' ||
      Number(record.spec_snapshot?.active_listing_export_quantity || 0) > 0
    ) ? 'P0' : 'P1';
    reason = nonCanonicalTrustedMatches
      .map(record => `BM SKU "${record.sku}" should become "${expectedSku}" on listing ${record.listing_id}`)
      .join(' | ');
  } else if (mismatchMatches.length) {
    classification = 'queue_sku_spec_mismatch_in_export';
    priority = 'P1';
    reason = mismatchMatches
      .map(record => parseJsonArray(record.spec_snapshot?.sku_spec_mismatches).map(item => `${item.field}:${item.expected}`).join('; '))
      .filter(Boolean)
      .join(' | ') || 'Export row mismatches SKU-derived spec';
  } else if (uniqueMatches.length) {
    classification = 'queue_has_untrusted_export_evidence';
    priority = 'P2';
    reason = uniqueMatches.map(record => record.verification_status).join(', ');
  }

  if (row.return_relist_caution) {
    classification = 'queue_return_relist_caution';
    priority = 'P0';
    reason = row.return_relist_reason || 'Return/relist caution';
  }

  return {
    priority,
    classification,
    main_item_id: normalize(row.main_item_id),
    item_name: normalize(row.item_name),
    bm_device_id: normalize(row.bm_device_id),
    listing_id: listingId,
    expected_sku: expectedSku,
    current_sku: currentSku,
    product_id: productId,
    trusted_frontend_url: trusted?.frontend_url || '',
    trusted_listing_id: trusted?.listing_id || '',
    trusted_product_id: trusted?.product_id || '',
    registry_listing_id: normalize(row.registry_listing_id),
    registry_product_id: normalize(row.registry_product_id),
    reason,
  };
}

function buildMarkdownReport(summary, exportRows, queueRows, sourcePaths) {
  const lines = [];
  lines.push('# Back Market Listing Alignment Report');
  lines.push('');
  lines.push(`Generated: ${summary.generated_at}`);
  lines.push('');
  lines.push('## Sources');
  lines.push('');
  lines.push(`- Active listings CSV: \`${sourcePaths.activeListingsCsvPath}\``);
  lines.push(`- Current queue: \`${sourcePaths.queuePath}\``);
  lines.push(`- Frontend URL map: \`${sourcePaths.frontendUrlMapPath}\``);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- GB export records: ${summary.gb_export_records}`);
  lines.push(`- Trusted scraper-safe records: ${summary.trusted_records}`);
  lines.push(`- Quarantined/untrusted records: ${summary.untrusted_records}`);
  lines.push(`- Current queue rows: ${summary.current_queue_rows}`);
  lines.push('');
  lines.push('### Export Classifications');
  lines.push('');
  for (const [key, count] of Object.entries(summary.export_classifications)) {
    lines.push(`- ${key}: ${count}`);
  }
  lines.push('');
  lines.push('### Current Queue Classifications');
  lines.push('');
  for (const [key, count] of Object.entries(summary.queue_classifications)) {
    lines.push(`- ${key}: ${count}`);
  }
  lines.push('');
  lines.push('## Current Queue Actions');
  lines.push('');
  lines.push('| Priority | Classification | Item | Listing | Expected SKU | Reason |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const row of queueRows) {
    lines.push(`| ${row.priority} | ${row.classification} | ${row.item_name || row.main_item_id} | ${row.listing_id || row.trusted_listing_id || ''} | \`${row.expected_sku}\` | ${row.reason.replace(/\|/g, '/')} |`);
  }
  lines.push('');
  lines.push('## Top Export Mismatches');
  lines.push('');
  lines.push('| Priority | Listing | SKU | Status | Qty | Mismatches | Queue Items |');
  lines.push('| --- | --- | --- | --- | ---: | --- | --- |');
  const topMismatches = exportRows
    .filter(row => row.classification.includes('mismatch') || row.priority === 'P0' || row.priority === 'P1')
    .slice(0, 50);
  for (const row of topMismatches) {
    lines.push(`| ${row.priority} | ${row.listing_id} | \`${row.sku}\` | ${row.status} | ${row.quantity} | ${row.mismatches || ''} | ${row.queue_items || ''} |`);
  }
  lines.push('');
  lines.push('## Policy');
  lines.push('');
  lines.push('- Only `captured_spec_match` and `captured_title_match` records are scraper-safe.');
  lines.push('- `captured_spec_mismatch` and `capture_failed` records are evidence for SKU/listing repair, not scrape targets.');
  lines.push('- Browser work is reserved for rows classified as queue blockers or requiring verification.');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function countBy(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field] || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function main() {
  const today = new Date().toISOString().slice(0, 10);
  const activeListingsCsvPath = argValue('--active-listings-csv', process.env.BM_ACTIVE_LISTINGS_CSV || defaultActiveListingsCsvPath());
  const queuePath = argValue('--queue', path.join(__dirname, '..', '..', 'backmarket', 'reports', 'current-queue-qc-sku-map-2026-04-26-024008.json'));
  const registryPath = argValue('--registry', path.join(__dirname, '..', '..', 'backmarket', 'data', 'listings-registry.json'));
  const frontendUrlMapPath = argValue('--frontend-url-map', path.join(__dirname, '..', '..', 'backmarket', 'data', 'listing-frontend-url-map.json'));
  const outJsonPath = argValue('--out-json', path.join(__dirname, '..', '..', 'backmarket', 'reports', `listing-alignment-report-${today}.json`));
  const outMdPath = argValue('--out-md', path.join(__dirname, '..', '..', 'backmarket', 'reports', `listing-alignment-report-${today}.md`));
  const outCsvPath = argValue('--out-csv', path.join(__dirname, '..', '..', 'backmarket', 'reports', `listing-alignment-export-actions-${today}.csv`));

  const csvImport = recordsFromActiveListingsCsv(activeListingsCsvPath);
  const queueRows = rowsFromPayload(readJson(queuePath, []));
  const registryIndexes = indexRegistrySlots(registrySlotsFromPayload(readJson(registryPath, [])));
  const mapRecords = recordsFromMapPayload(readJson(frontendUrlMapPath, { records: [] }));
  const trustedRecords = mapRecords.filter(record => ['captured_spec_match', 'captured_title_match'].includes(record.verification_status));
  const indexes = indexRecords(csvImport.records);

  const exportClassifications = csvImport.records
    .map(record => classifyExportRecord(record, queueRows))
    .sort((a, b) => a.priority.localeCompare(b.priority) || a.classification.localeCompare(b.classification));
  const queueClassifications = queueRows
    .map(row => classifyQueueRow(enrichQueueRowFromRegistry(row, registryIndexes).row, indexes, trustedRecords))
    .sort((a, b) => a.priority.localeCompare(b.priority) || a.classification.localeCompare(b.classification));

  const summary = {
    generated_at: new Date().toISOString(),
    gb_export_records: csvImport.records.length,
    trusted_records: trustedRecords.length,
    untrusted_records: mapRecords.length - trustedRecords.length,
    current_queue_rows: queueRows.length,
    export_classifications: countBy(exportClassifications, 'classification'),
    queue_classifications: countBy(queueClassifications, 'classification'),
  };

  const payload = {
    summary,
    sources: {
      activeListingsCsvPath,
      queuePath,
      registryPath,
      frontendUrlMapPath,
    },
    exportClassifications,
    queueClassifications,
  };

  fs.mkdirSync(path.dirname(outJsonPath), { recursive: true });
  fs.writeFileSync(outJsonPath, JSON.stringify(payload, null, 2) + '\n');
  fs.writeFileSync(outMdPath, buildMarkdownReport(summary, exportClassifications, queueClassifications, payload.sources));
  writeCsv(outCsvPath, exportClassifications);

  console.log(JSON.stringify({
    ok: true,
    out_json: outJsonPath,
    out_md: outMdPath,
    out_csv: outCsvPath,
    summary,
  }, null, 2));
}

main();
