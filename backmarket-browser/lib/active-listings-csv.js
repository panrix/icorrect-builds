const fs = require('fs');

const DEFAULT_ACTIVE_LISTINGS_CSV_PATHS = [
  '/Users/icorrect/VPS/builds/backmarket/data/backmarket-active-listings-2026-04-26.csv',
  '/home/ricky/builds/backmarket/data/backmarket-active-listings-2026-04-26.csv',
];

const ACTIVE_LISTINGS_URL = 'https://www.backmarket.co.uk/bo-seller/listings/active?orderBy=-quantity&pageSize=10';

function normalizeKey(value) {
  return String(value || '').trim();
}

function parseCsvLine(line, delimiter = ';') {
  const cells = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function parseDelimitedCsv(text, delimiter = ';') {
  const lines = String(text || '').split(/\r?\n/).filter(line => line.trim());
  if (!lines.length) return [];
  const header = parseCsvLine(lines[0], delimiter).map(normalizeKey);
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line, delimiter);
    const row = {};
    header.forEach((key, index) => {
      row[key] = values[index] || '';
    });
    return row;
  });
}

function defaultActiveListingsCsvPath() {
  return DEFAULT_ACTIVE_LISTINGS_CSV_PATHS.find(filePath => fs.existsSync(filePath)) || DEFAULT_ACTIVE_LISTINGS_CSV_PATHS[0];
}

function compactText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function parseSkuSpec(sku) {
  const parts = normalizeKey(sku).split('.').filter(Boolean);
  if (parts.length < 5) return null;
  let model = parts[1] || '';
  let chip = parts[2] || '';
  let tail = parts.slice(3);

  if (/^M\d(?:PRO|MAX|ULTRA)?$/i.test(parts[1] || '') && /^A\d+/i.test(parts[2] || '')) {
    chip = parts[1];
    model = parts[2];
    tail = parts.slice(3);
  } else {
    const combinedChipModel = String(parts[1] || '').match(/^(M\d(?:PRO|MAX|ULTRA)?)(A\d+)$/i);
    const combinedModelChip = String(parts[1] || '').match(/^(A\d+)(M\d(?:PRO|MAX|ULTRA)?)$/i);
    if (combinedChipModel) {
      chip = combinedChipModel[1];
      model = combinedChipModel[2];
      tail = parts.slice(2);
    } else if (combinedModelChip) {
      model = combinedModelChip[1];
      chip = combinedModelChip[2];
      tail = parts.slice(2);
    }
  }

  let gpu = '';
  if (/^\d+C$/i.test(tail[0] || '')) gpu = tail.shift();
  return {
    family: parts[0] || '',
    model,
    chip,
    gpu,
    ram: tail[0] || '',
    storage: tail[1] || '',
    color: tail[2] || '',
    grade: tail[3] || '',
  };
}

function tokenAliases(token) {
  const raw = normalizeKey(token);
  if (!raw) return [];
  const aliases = new Set([compactText(raw)]);

  if (/^\d+GB$/i.test(raw)) aliases.add(compactText(raw.replace(/gb/i, ' GB')));
  if (/^\d+TB$/i.test(raw)) aliases.add(`${parseInt(raw, 10) * 1000}gb`);
  if (/^\d+C$/i.test(raw)) {
    aliases.add(`${raw.replace(/c/i, '')}core`);
    aliases.add(`${raw.replace(/c/i, '')}coregpu`);
  }
  if (/^grey$/i.test(raw)) {
    aliases.add('gray');
    aliases.add('spacegray');
    aliases.add('spacegrey');
  }
  if (/^space black$/i.test(raw)) aliases.add('spaceblack');
  if (/^m\d+pro$/i.test(raw)) aliases.add(compactText(raw.replace(/pro/i, ' pro')));
  return Array.from(aliases).filter(Boolean);
}

function textHasToken(text, token) {
  const haystack = compactText(text);
  return tokenAliases(token).some(alias => haystack.includes(alias));
}

function verifySkuAgainstListingRow(sku, row = {}) {
  const spec = parseSkuSpec(sku);
  if (!spec) return { status: 'capture_failed', checked: [], mismatches: [{ field: 'sku', expected: 'parseable BM SKU' }] };

  const titleText = normalizeKey(row.Title);
  const offerText = normalizeKey(row['Link to the offer']);
  const gradeText = `${row.grade || ''} ${row.Grade || ''}`;
  const hasColourEvidence = [
    'space gray', 'space grey', 'grey', 'gray', 'silver', 'gold', 'midnight', 'starlight',
    'black', 'space black', 'blue', 'green', 'purple', 'red', 'pink', 'yellow', 'white',
  ].some(colour => textHasToken(`${titleText} ${offerText}`, colour));
  const checks = [
    ['chip', spec.chip, titleText],
    ['gpu', spec.gpu, titleText],
    ['ram', spec.ram, titleText],
    ['storage', spec.storage, titleText],
    ['color', hasColourEvidence ? spec.color : '', `${titleText} ${offerText}`],
    ['grade', spec.grade, gradeText],
  ].filter(([, expected]) => expected);

  const checked = [];
  const mismatches = [];
  for (const [field, expected, source] of checks) {
    const ok = textHasToken(source, expected);
    checked.push({ field, expected, ok });
    if (!ok) mismatches.push({ field, expected });
  }

  return {
    status: mismatches.length ? 'captured_spec_mismatch' : 'captured_spec_match',
    checked,
    mismatches,
  };
}

function isGbListingRow(row = {}) {
  const language = normalizeKey(row.Language).toLowerCase();
  const link = normalizeKey(row['Link to the offer']).toLowerCase();
  return language === 'en-gb' || link.includes('backmarket.co.uk');
}

function frontendUrlFromListingRow(row = {}) {
  const productId = normalizeKey(row['Product ID']);
  const offerLink = normalizeKey(row['Link to the offer']);
  if (!productId || !offerLink) return '';

  try {
    const url = new URL(offerLink);
    if (!url.hostname.toLowerCase().endsWith('backmarket.co.uk')) return '';
    if (/\/en-gb\/p\//.test(url.pathname)) return url.toString();

    const secondHand = url.pathname.match(/\/second-hand-([^/]+)\/[^/]+\.html$/i);
    if (secondHand) {
      return `https://www.backmarket.co.uk/en-gb/p/${secondHand[1]}/${productId}?l=12`;
    }
  } catch (_) {
    return '';
  }
  return '';
}

function captureRecordFromListingRow(row = {}, options = {}) {
  const sku = normalizeKey(row.SKU);
  const frontendUrl = frontendUrlFromListingRow(row);
  if (!sku || !frontendUrl || !isGbListingRow(row)) return null;

  const verification = verifySkuAgainstListingRow(sku, row);
  const capturedAt = options.capturedAt || new Date().toISOString();
  const sellerUrl = `${ACTIVE_LISTINGS_URL}&sku=${encodeURIComponent(sku)}`;

  return {
    listing_id: normalizeKey(row['Listing no.']),
    listing_uuid: normalizeKey(row['Listing ID']),
    sku,
    product_id: normalizeKey(row['Product ID']),
    seller_portal_url: sellerUrl,
    frontend_url: frontendUrl,
    captured_at: capturedAt,
    verification_status: verification.status,
    spec_snapshot: {
      page_title: normalizeKey(row.Title),
      h1: normalizeKey(row.Title),
      visible_text: normalizeKey(row.Title),
      portal_row_text: [
        normalizeKey(row.Title),
        `SKU: ${sku}`,
        normalizeKey(row.grade || row.Grade),
        `Status: ${normalizeKey(row.Status)}`,
        `Quantity: ${normalizeKey(row.Quantity)}`,
      ].filter(Boolean).join(' '),
      sku_spec_check: JSON.stringify(verification.checked),
      sku_spec_mismatches: JSON.stringify(verification.mismatches),
      active_listing_export_status: normalizeKey(row.Status),
      active_listing_export_quantity: normalizeKey(row.Quantity),
      active_listing_export_listing_uuid: normalizeKey(row['Listing ID']),
      active_listing_export_back_market_id: normalizeKey(row['Back Market ID']),
    },
    source: 'backmarket-active-listings-export',
  };
}

function recordsFromActiveListingsCsv(filePath = defaultActiveListingsCsvPath(), options = {}) {
  const rows = parseDelimitedCsv(fs.readFileSync(filePath, 'utf8'));
  const records = [];
  const rejected = [];

  for (const row of rows) {
    if (!isGbListingRow(row)) continue;
    const record = captureRecordFromListingRow(row, options);
    if (record) records.push(record);
    else rejected.push({ row, reason: 'missing sku/product/link or unsupported offer link' });
  }

  return { filePath, rows, records, rejected };
}

module.exports = {
  ACTIVE_LISTINGS_URL,
  DEFAULT_ACTIVE_LISTINGS_CSV_PATHS,
  parseCsvLine,
  parseDelimitedCsv,
  defaultActiveListingsCsvPath,
  parseSkuSpec,
  verifySkuAgainstListingRow,
  frontendUrlFromListingRow,
  captureRecordFromListingRow,
  recordsFromActiveListingsCsv,
};
