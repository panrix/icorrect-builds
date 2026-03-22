#!/usr/bin/env node
/**
 * listings-audit.js — Listings Rebuild Phase 1: Audit
 *
 * Read-only. Fetches ALL listings from BM API, constructs what each SKU
 * SHOULD be from the title, compares to current SKU, flags mismatches.
 *
 * Outputs: JSON report of all listings with current SKU, correct SKU,
 * and mismatch details.
 *
 * Usage:
 *   node listings-audit.js                       # Full audit
 *   node listings-audit.js --limit 50            # Audit first 50 listings
 *   node listings-audit.js --output report.json  # Custom output path
 *
 * SKU Format Standard:
 *   {Type}.{Model}.{Chip}.{GPU?}.{RAM}.{SSD}.{Colour}.{Grade}
 *   Example: MBP.A2338.M1.8GB.256GB.Grey.Fair
 *
 * This script is Phase 1 of the listings rebuild (backmarket/listings-rebuild-task.md).
 * It DOES NOT modify any listings — it only reads and reports.
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });
const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────
const BM_BASE = 'https://www.backmarket.co.uk';
const BM_AUTH = process.env.BACKMARKET_API_AUTH;
const BM_LANG = process.env.BACKMARKET_API_LANG || 'en-gb';
const BM_UA = process.env.BACKMARKET_API_UA;
const PRODUCT_ID_LOOKUP_PATH = path.join(__dirname, '..', 'data', 'product-id-lookup.json');

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const maxListings = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;
const outputIdx = args.indexOf('--output');
const outputPath = outputIdx !== -1
  ? args[outputIdx + 1]
  : path.join(__dirname, '..', 'data', `listings-audit-${new Date().toISOString().slice(0, 10)}.json`);

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── API helpers ──────────────────────────────────────────────────
async function bmApi(urlPath) {
  const url = urlPath.startsWith('http') ? urlPath : `${BM_BASE}${urlPath}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(url, {
      headers: {
        Authorization: BM_AUTH,
        'Accept-Language': BM_LANG,
        'User-Agent': BM_UA,
        'Content-Type': 'application/json',
      },
    });
    if (r.ok) return r.json();
    const text = await r.text();
    if (r.status === 429 || text.startsWith('<!') || text.startsWith('<html')) {
      console.warn(`  Rate limited, attempt ${attempt}/3, waiting 30s...`);
      await sleep(30000);
      continue;
    }
    throw new Error(`BM API ${r.status}: ${text.slice(0, 300)}`);
  }
  throw new Error(`BM API failed after 3 retries`);
}

// ─── Grade mapping ───────────────────────────────────────────────
const BM_GRADE_TO_SKU = {
  1: 'Fair',      // SHINY / FAIR
  2: 'Good',      // GOOD
  3: 'Excellent',  // VERY_GOOD / Excellent
  4: 'Premium',
  // String forms
  'FAIR': 'Fair',
  'GOOD': 'Good',
  'VERY_GOOD': 'Excellent',
  'SHINY': 'Fair',
  'STALLONE': 'Fair',
  'Premium': 'Premium',
};

function gradeToSku(grade) {
  if (typeof grade === 'number') return BM_GRADE_TO_SKU[grade] || `Grade${grade}`;
  if (typeof grade === 'string') return BM_GRADE_TO_SKU[grade.toUpperCase()] || grade;
  return 'Unknown';
}

// ─── Title parsing ───────────────────────────────────────────────

// Model number (A-number) mappings from title patterns
const MODEL_PATTERNS = [
  // MacBook Air
  { pattern: /Air.*13.*2020.*M1/i, type: 'MBA', model: 'A2337', chip: 'M1' },
  { pattern: /Air.*13.*2022.*M2/i, type: 'MBA', model: 'A2681', chip: 'M2' },
  { pattern: /Air.*13.*2024.*M3/i, type: 'MBA', model: 'A3113', chip: 'M3' },
  { pattern: /Air.*13.*2025.*M4/i, type: 'MBA', model: 'A3211', chip: 'M4' },
  { pattern: /Air.*15.*2023.*M2/i, type: 'MBA', model: 'A2941', chip: 'M2' },
  { pattern: /Air.*15.*2024.*M3/i, type: 'MBA', model: 'A3114', chip: 'M3' },
  // MacBook Air Intel
  { pattern: /Air.*13.*2020.*Core i3/i, type: 'MBA', model: 'A2179', chip: 'I3' },
  { pattern: /Air.*13.*2020.*Core i5.*SSD 512/i, type: 'MBA', model: 'A2179', chip: 'I5' },
  { pattern: /Air.*13.*2020.*Core i5/i, type: 'MBA', model: 'A2179', chip: 'I5' },
  { pattern: /Air.*13.*2019.*Core i5/i, type: 'MBA', model: 'A1932', chip: 'I5' },
  { pattern: /Air.*13.*2018.*Core i5/i, type: 'MBA', model: 'A1932', chip: 'I5' },
  { pattern: /Air.*13.*2017/i, type: 'MBA', model: 'A1466', chip: 'I5' },
  // MacBook Pro 13"
  { pattern: /Pro.*13.*2020.*M1/i, type: 'MBP', model: 'A2338', chip: 'M1' },
  { pattern: /Pro.*13.*2022.*M2/i, type: 'MBP', model: 'A2681', chip: 'M2' },
  { pattern: /Pro.*13.*2020.*Core i5/i, type: 'MBP', model: 'A2289', chip: 'I5' },
  { pattern: /Pro.*13.*2020.*Core i7/i, type: 'MBP', model: 'A2289', chip: 'I7' },
  { pattern: /Pro.*13.*2019.*Core i5/i, type: 'MBP', model: 'A2159', chip: 'I5' },
  { pattern: /Pro.*13.*2019.*Core i7/i, type: 'MBP', model: 'A2159', chip: 'I7' },
  { pattern: /Pro.*13.*2018.*Core i5/i, type: 'MBP', model: 'A1989', chip: 'I5' },
  { pattern: /Pro.*13.*2018.*Core i7/i, type: 'MBP', model: 'A1989', chip: 'I7' },
  { pattern: /Pro.*13.*2017.*Core i5/i, type: 'MBP', model: 'A1708', chip: 'I5' },
  { pattern: /Pro.*13.*2017.*Core i7/i, type: 'MBP', model: 'A1708', chip: 'I7' },
  { pattern: /Pro.*13.*2016.*Core i5/i, type: 'MBP', model: 'A1706', chip: 'I5' },
  // MacBook Pro 14"
  { pattern: /Pro.*14.*2021.*M1 Pro.*8-core and 14-core/i, type: 'MBP', model: 'A2442', chip: 'M1PRO', gpuCores: '14C' },
  { pattern: /Pro.*14.*2021.*M1 Pro.*8-core and 16-core/i, type: 'MBP', model: 'A2442', chip: 'M1PRO', gpuCores: '16C' },
  { pattern: /Pro.*14.*2021.*M1 Pro/i, type: 'MBP', model: 'A2442', chip: 'M1PRO' },
  { pattern: /Pro.*14.*2021.*M1 Max.*24-core/i, type: 'MBP', model: 'A2442', chip: 'M1MAX', gpuCores: '24C' },
  { pattern: /Pro.*14.*2021.*M1 Max.*32-core/i, type: 'MBP', model: 'A2442', chip: 'M1MAX', gpuCores: '32C' },
  { pattern: /Pro.*14.*2021.*M1 Max/i, type: 'MBP', model: 'A2442', chip: 'M1MAX' },
  { pattern: /Pro.*14.*2023.*M2 Pro/i, type: 'MBP', model: 'A2779', chip: 'M2PRO' },
  { pattern: /Pro.*14.*2023.*M3 Pro.*11-core and 14-core/i, type: 'MBP', model: 'A2918', chip: 'M3PRO', gpuCores: '14C' },
  { pattern: /Pro.*14.*2023.*M3 Pro.*12-core and 18-core/i, type: 'MBP', model: 'A2918', chip: 'M3PRO', gpuCores: '18C' },
  { pattern: /Pro.*14.*2023.*M3 Pro/i, type: 'MBP', model: 'A2918', chip: 'M3PRO' },
  { pattern: /Pro.*14.*2023.*M3\b/i, type: 'MBP', model: 'A2918', chip: 'M3' },
  { pattern: /Pro.*14.*2024.*M4 Pro/i, type: 'MBP', model: 'A2992', chip: 'M4PRO' },
  { pattern: /Pro.*14.*2024.*M4\b/i, type: 'MBP', model: 'A2992', chip: 'M4' },
  // MacBook Pro 16"
  { pattern: /Pro.*16.*2021.*M1 Pro.*16-core/i, type: 'MBP', model: 'A2485', chip: 'M1PRO', gpuCores: '16C' },
  { pattern: /Pro.*16.*2021.*M1 Pro/i, type: 'MBP', model: 'A2485', chip: 'M1PRO' },
  { pattern: /Pro.*16.*2021.*M1 Max.*24-core/i, type: 'MBP', model: 'A2485', chip: 'M1MAX', gpuCores: '24C' },
  { pattern: /Pro.*16.*2021.*M1 Max.*32-core/i, type: 'MBP', model: 'A2485', chip: 'M1MAX', gpuCores: '32C' },
  { pattern: /Pro.*16.*2021.*M1 Max/i, type: 'MBP', model: 'A2485', chip: 'M1MAX' },
  { pattern: /Pro.*16.*2023.*M2 Pro/i, type: 'MBP', model: 'A2780', chip: 'M2PRO' },
  { pattern: /Pro.*16.*2023.*M2 Max/i, type: 'MBP', model: 'A2780', chip: 'M2MAX' },
  { pattern: /Pro.*16.*2023.*M3 Pro/i, type: 'MBP', model: 'A2991', chip: 'M3PRO' },
  { pattern: /Pro.*16.*2023.*M3 Max/i, type: 'MBP', model: 'A2991', chip: 'M3MAX' },
  { pattern: /Pro.*16.*2024.*M4 Pro/i, type: 'MBP', model: 'A2993', chip: 'M4PRO' },
  { pattern: /Pro.*16.*2024.*M4 Max/i, type: 'MBP', model: 'A2993', chip: 'M4MAX' },
];

// Extract RAM from title
function extractRam(title) {
  const match = title.match(/(\d+)\s*GB\s*RAM/i);
  if (match) return `${match[1]}GB`;
  return null;
}

// Extract SSD from title
function extractSsd(title) {
  const tbMatch = title.match(/SSD\s+(\d+)\s*TB/i);
  if (tbMatch) return `${tbMatch[1]}TB`;
  const gbMatch = title.match(/SSD\s+(\d+)\s*GB/i);
  if (gbMatch) return `${gbMatch[1]}GB`;
  // Also try "SSD 1000GB" format
  const altMatch = title.match(/SSD\s+(\d+)/i);
  if (altMatch) {
    const val = parseInt(altMatch[1], 10);
    if (val >= 1000) return `${val / 1000}TB`;
    return `${val}GB`;
  }
  return null;
}

// Extract colour from title (limited; BM titles don't always include colour)
function extractColour(title) {
  // BM titles for MacBooks usually don't include colour
  // We'll return null and rely on the picker/spec data instead
  return null;
}

// Parse a BM listing title into SKU components
function parseTitle(title) {
  for (const mp of MODEL_PATTERNS) {
    if (mp.pattern.test(title)) {
      const ram = extractRam(title);
      const ssd = extractSsd(title);
      const parts = [mp.type, mp.model, mp.chip];
      if (mp.gpuCores) parts.push(mp.gpuCores);
      if (ram) parts.push(ram);
      if (ssd) parts.push(ssd);
      return {
        type: mp.type,
        model: mp.model,
        chip: mp.chip,
        gpuCores: mp.gpuCores || null,
        ram,
        ssd,
        skuBase: parts.join('.'),
      };
    }
  }
  return null;
}

// Build the correct SKU from listing data
function buildCorrectSku(listing) {
  const parsed = parseTitle(listing.title || '');
  if (!parsed) return null;

  const grade = gradeToSku(listing.grade);
  // We can't reliably extract colour from titles, so omit it for now
  // The full SKU without colour is still useful for mismatch detection
  return `${parsed.skuBase}.${grade}`;
}

// ─── Main ─────────────────────────────────────────────────────────
(async () => {
  console.log('═'.repeat(60));
  console.log('  Listings Rebuild — Phase 1: Audit (READ-ONLY)');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  // Load product ID lookup for cross-reference
  let productLookup = {};
  try {
    productLookup = JSON.parse(fs.readFileSync(PRODUCT_ID_LOOKUP_PATH, 'utf8'));
    console.log(`\nLoaded ${Object.keys(productLookup).length} product IDs from lookup table`);
  } catch (e) {
    console.log(`\n⚠️ Could not load product ID lookup: ${e.message}`);
  }

  // Fetch ALL listings from BM API
  console.log('\nFetching all listings from BM API...');
  const allListings = [];
  let page = 1;
  while (allListings.length < maxListings) {
    try {
      const d = await bmApi(`/ws/listings?page=${page}&page_size=100`);
      const items = d.results || [];
      if (items.length === 0) break;
      allListings.push(...items);
      console.log(`  Page ${page}: ${items.length} listings (total: ${allListings.length})`);
      if (!d.next) break;
      page++;
      await sleep(1000);
    } catch (e) {
      console.error(`  Error on page ${page}: ${e.message}`);
      break;
    }
  }
  console.log(`\nTotal listings fetched: ${allListings.length}\n`);

  // Audit each listing
  const report = {
    generated: new Date().toISOString(),
    total: allListings.length,
    summary: { match: 0, mismatch: 0, unparseable: 0, noSku: 0 },
    mismatches: [],
    unparseable: [],
    matches: [],
  };

  for (const listing of allListings) {
    const listingId = listing.id || listing.listing_id;
    const currentSku = listing.sku || '';
    const title = listing.title || '';
    const grade = listing.grade;
    const productId = listing.product_id || listing.product?.id || '';
    const qty = listing.quantity || 0;
    const price = listing.price || 0;
    const pubState = listing.publication_state;

    const correctSku = buildCorrectSku(listing);

    const entry = {
      listing_id: listingId,
      title,
      current_sku: currentSku,
      correct_sku: correctSku,
      grade: gradeToSku(grade),
      product_id: productId,
      quantity: qty,
      price,
      publication_state: pubState,
    };

    if (!correctSku) {
      // Title couldn't be parsed
      report.unparseable.push({ ...entry, reason: 'Title did not match any known model pattern' });
      report.summary.unparseable++;
      continue;
    }

    if (!currentSku) {
      report.mismatches.push({ ...entry, reason: 'No current SKU set' });
      report.summary.noSku++;
      report.summary.mismatch++;
      continue;
    }

    // Compare: normalize both to check for match
    const currentNorm = currentSku.toUpperCase().replace(/[^A-Z0-9.]/g, '');
    const correctNorm = correctSku.toUpperCase().replace(/[^A-Z0-9.]/g, '');

    if (currentNorm === correctNorm) {
      report.matches.push(entry);
      report.summary.match++;
    } else {
      report.mismatches.push({ ...entry, reason: 'SKU mismatch' });
      report.summary.mismatch++;
    }
  }

  // Lookup table coverage
  const lookupProductIds = new Set(Object.keys(productLookup));
  const listingProductIds = new Set(allListings.map(l => l.product_id || l.product?.id).filter(Boolean));
  const inLookupNotListings = [...lookupProductIds].filter(id => !listingProductIds.has(id));
  const inListingsNotLookup = [...listingProductIds].filter(id => !lookupProductIds.has(id));

  report.lookup_coverage = {
    in_lookup: lookupProductIds.size,
    in_listings: listingProductIds.size,
    in_lookup_not_listings: inLookupNotListings.length,
    in_listings_not_lookup: inListingsNotLookup.length,
  };

  // Save report
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`Report saved to: ${outputPath}`);

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('  AUDIT SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Total listings:    ${report.total}`);
  console.log(`  SKU matches:       ${report.summary.match}`);
  console.log(`  SKU mismatches:    ${report.summary.mismatch} (${report.summary.noSku} have no SKU)`);
  console.log(`  Unparseable:       ${report.summary.unparseable} (title didn't match known patterns)`);
  console.log('');
  console.log('  Lookup table coverage:');
  console.log(`    Product IDs in lookup: ${report.lookup_coverage.in_lookup}`);
  console.log(`    Product IDs in listings: ${report.lookup_coverage.in_listings}`);
  console.log(`    In lookup but no listing: ${report.lookup_coverage.in_lookup_not_listings}`);
  console.log(`    In listings but not lookup: ${report.lookup_coverage.in_listings_not_lookup}`);

  if (report.mismatches.length > 0) {
    console.log(`\n  Top 10 mismatches:`);
    for (const m of report.mismatches.slice(0, 10)) {
      console.log(`    ${m.listing_id}: "${m.current_sku}" → "${m.correct_sku}" (${m.reason})`);
    }
    if (report.mismatches.length > 10) {
      console.log(`    ... and ${report.mismatches.length - 10} more`);
    }
  }

  if (report.unparseable.length > 0) {
    console.log(`\n  Top 5 unparseable titles:`);
    for (const u of report.unparseable.slice(0, 5)) {
      console.log(`    ${u.listing_id}: "${u.title}"`);
    }
  }
})();
