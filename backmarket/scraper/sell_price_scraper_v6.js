#!/usr/bin/env node
/**
 * sell_price_scraper_v6.js
 * 
 * Stealth Playwright scraper for BackMarket sell prices.
 * Extracts picker data (grades, RAM, SSD, CPU/GPU, colours) from __NUXT_DATA__ payload.
 * 
 * Usage:
 *   node sell_price_scraper_v6.js                    # MacBook only
 *   node sell_price_scraper_v6.js --iphone-ipad      # MacBook + iPhone/iPad
 *   node sell_price_scraper_v6.js --all              # All devices (same as --iphone-ipad)
 *   node sell_price_scraper_v6.js --dry-run           # Show catalogue, don't scrape
 *   node sell_price_scraper_v6.js --model "Pro 14"    # Filter to matching models
 *   node sell_price_scraper_v6.js --model "iPhone"    # iPhone models only
 */

const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Register stealth plugin
chromium.use(StealthPlugin());

// --- Config ---
const BASE_DIR = __dirname;
const CATALOGUE_PATH = path.join(BASE_DIR, 'config', 'scrape-urls.json');
const IPHONE_IPAD_CATALOGUE_PATH = path.join(BASE_DIR, 'scrape-urls-iphone-ipad.json');
const DATA_DIR = path.join(BASE_DIR, 'data');

const GRADE_LABELS = ['Fair', 'Good', 'Excellent', 'Premium'];
const RAM_VALUES = [8, 16, 18, 24, 32, 36, 48, 64, 128];
const SSD_VALUES = [128, 256, 512, 1000, 2000, 4000, 8000];
const COLOUR_LABELS = [
  // MacBook colours
  'Space Gray', 'Silver', 'Gold', 'Starlight', 'Midnight', 'Space Black',
  // iPhone/iPad colours
  'Blue', 'Green', 'Purple', 'Red', 'Pink', 'Yellow', 'Black', 'White',
  'Graphite', 'Sierra Blue', 'Alpine Green', 'Deep Purple', 'Product Red',
  'Coral', 'Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium',
  'Desert Titanium', 'Ultramarine', 'Teal',
];

// --- CLI args ---
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const INCLUDE_IPHONE_IPAD = args.includes('--iphone-ipad') || args.includes('--all');
const modelFilterIdx = args.indexOf('--model');
const MODEL_FILTER = modelFilterIdx !== -1 ? args[modelFilterIdx + 1] : null;

// --- NUXT helpers ---

/**
 * Resolve a NUXT data array reference.
 * The array uses indices to reference other positions; value 17 is NUXT's null marker.
 */
function resolve(arr, idx) {
  if (typeof idx === 'number' && idx >= 0 && idx < arr.length) {
    const val = arr[idx];
    if (val === 17) return null; // NUXT null marker
    return val;
  }
  return idx;
}

/**
 * Deep-resolve an object: for each value that's a number, resolve it from the array.
 * Only goes one level deep (sufficient for picker objects).
 */
function resolveObject(arr, obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const resolved = {};
  for (const [key, val] of Object.entries(obj)) {
    resolved[key] = resolve(arr, val);
  }
  return resolved;
}

/**
 * Extract price amount from a picker's price field.
 * picker.price -> index -> price object with {amount} -> resolve amount
 */
function extractPrice(arr, picker) {
  const priceRef = picker.price;
  if (priceRef === undefined || priceRef === null) return null;
  const priceObj = resolve(arr, priceRef);
  if (!priceObj || typeof priceObj !== 'object') return null;
  const amount = resolve(arr, priceObj.amount);
  if (amount === null || amount === undefined) return null;
  return typeof amount === 'number' ? amount : parseFloat(amount) || null;
}

/**
 * Categorise a resolved label into a picker type.
 */
function categoriseLabel(label) {
  if (!label || typeof label !== 'string') return null;
  const trimmed = label.trim();

  // Keyboard: skip
  if (/QWERTY|AZERTY/i.test(trimmed)) return 'keyboard';

  // Grade
  if (GRADE_LABELS.includes(trimmed)) return 'grade';

  // Colour
  if (COLOUR_LABELS.includes(trimmed)) return 'colour';

  // CPU/GPU: contains M1/M2/M3/M4 and "core"
  if (/M[1-4]/i.test(trimmed) && /core/i.test(trimmed)) return 'cpu_gpu';

  // Size: ends with " and number is a known screen size (MacBook + iPad)
  if (trimmed.endsWith('"') || trimmed.endsWith('\u201D') || trimmed.endsWith("\"")) {
    const num = parseFloat(trimmed);
    if ([10.2, 10.5, 10.9, 11, 12.9, 13, 14, 15, 16].includes(num)) return 'size';
  }

  // iPhone/iPad: A-series or M-series chip labels (e.g. "A15 Bionic", "A17 Pro", "M2")
  if (/^A\d{2}\b/i.test(trimmed) || /^M\d\b/i.test(trimmed)) return 'cpu_gpu';

  // RAM vs SSD: both end with "GB" but have different value ranges
  const gbMatch = trimmed.match(/^(\d+)\s*GB$/i);
  if (gbMatch) {
    const val = parseInt(gbMatch[1], 10);
    if (RAM_VALUES.includes(val) && !SSD_VALUES.includes(val)) return 'ram';
    if (SSD_VALUES.includes(val) && !RAM_VALUES.includes(val)) return 'ssd';
    // Ambiguous (e.g. 128 is both): use context or default to SSD for storage-range values
    if (val >= 128) return 'ssd';
    return 'ram';
  }

  // TB storage
  const tbMatch = trimmed.match(/^(\d+)\s*TB$/i);
  if (tbMatch) return 'ssd';

  return 'unknown';
}

/**
 * Find all picker objects in the NUXT data array.
 * Pickers have: label, price, available, productId (or product_id), and typically slug.
 */
function findPickers(arr) {
  const pickers = [];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    // A picker must have label and price keys (as index references)
    if ('label' in item && 'price' in item && 'available' in item) {
      pickers.push({ index: i, raw: item });
    }
  }
  return pickers;
}

/**
 * Extract base product price from NUXT data (for pages without pickers).
 * Looks for objects with productId + priceWhenNew or similar product-level data.
 */
function extractBasePrice(arr) {
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    // Product objects have productId, titles, type, etc.
    if ('productId' in item && 'type' in item && ('titles' in item || 'tracking' in item)) {
      const productId = resolve(arr, item.productId);
      // Look for a price object nearby
      const tracking = item.tracking ? resolve(arr, item.tracking) : null;
      let price = null;
      if (tracking && typeof tracking === 'object') {
        const trackPrice = tracking.price !== undefined ? resolve(arr, tracking.price) : null;
        if (typeof trackPrice === 'number') price = trackPrice;
      }
      return { productId, price };
    }
  }
  return null;
}

/**
 * Extract and categorise all pickers from the NUXT data array.
 */
function extractPickers(arr) {
  const rawPickers = findPickers(arr);
  const categorised = {
    grades: {},
    ram: {},
    ssd: {},
    cpu_gpu: {},
    colour: {},
    size: {}
  };
  let totalPickers = 0;

  for (const { raw } of rawPickers) {
    const label = resolve(arr, raw.label);
    const available = resolve(arr, raw.available);
    const productId = resolve(arr, raw.productId || raw.product_id);
    const price = extractPrice(arr, raw);

    if (!label || typeof label !== 'string') continue;

    const category = categoriseLabel(label);
    if (!category || category === 'keyboard' || category === 'unknown') continue;

    const entry = {
      price: price,
      available: available === true || available === 'true'
    };
    if (productId) entry.productId = productId;

    if (category === 'grade') {
      categorised.grades[label] = { price: entry.price, available: entry.available };
    } else if (categorised[category]) {
      categorised[category][label] = entry;
    }

    totalPickers++;
  }

  return { categorised, totalPickers };
}

/**
 * Extract __NUXT_DATA__ from page HTML.
 */
async function extractNuxtData(page) {
  return await page.evaluate(() => {
    const scripts = document.querySelectorAll('script#__NUXT_DATA__');
    if (scripts.length === 0) return null;
    // Could be multiple; take the first with type application/json
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (Array.isArray(data)) return data;
      } catch (e) { /* try next */ }
    }
    return null;
  });
}

/**
 * Check if page is Cloudflare blocked.
 */
async function isCloudflareBlocked(page) {
  return await page.evaluate(() => {
    const body = document.body ? document.body.innerText : '';
    return body.includes('Checking your browser') ||
           body.includes('Just a moment') ||
           body.includes('cf-browser-verification') ||
           document.title.includes('Just a moment');
  });
}

/**
 * Scrape a single URL. Returns extracted data or null on failure.
 */
async function scrapeUrl(context, entry, attempt = 1) {
  const maxAttempts = 2;
  const page = await context.newPage();

  try {
    console.log(`  [${attempt}/${maxAttempts}] Navigating to ${entry.model}...`);
    await page.goto(entry.url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Wait for render/Cloudflare
    await page.waitForTimeout(3000);

    // Check Cloudflare
    const blocked = await isCloudflareBlocked(page);
    if (blocked) {
      console.log(`  ⚠ Cloudflare block detected for ${entry.model}`);
      await page.close();

      if (attempt < maxAttempts) {
        console.log(`  Retrying in 5s...`);
        await new Promise(r => setTimeout(r, 5000));
        return scrapeUrl(context, entry, attempt + 1);
      }
      return { error: 'cloudflare_blocked' };
    }

    // Extract NUXT data
    const nuxtData = await extractNuxtData(page);
    if (!nuxtData) {
      console.log(`  ⚠ No __NUXT_DATA__ found for ${entry.model}`);
      await page.close();

      if (attempt < maxAttempts) {
        console.log(`  Retrying in 5s...`);
        await new Promise(r => setTimeout(r, 5000));
        return scrapeUrl(context, entry, attempt + 1);
      }
      return { error: 'no_nuxt_data' };
    }

    console.log(`  ✓ Got NUXT data (${nuxtData.length} entries) for ${entry.model}`);

    // Extract pickers
    const { categorised, totalPickers } = extractPickers(nuxtData);
    console.log(`  ✓ Extracted ${totalPickers} pickers for ${entry.model}`);

    await page.close();
    return { categorised, totalPickers };

  } catch (err) {
    console.log(`  ✗ Error scraping ${entry.model}: ${err.message}`);
    try { await page.close(); } catch (_) {}

    if (attempt < maxAttempts) {
      console.log(`  Retrying in 5s...`);
      await new Promise(r => setTimeout(r, 5000));
      return scrapeUrl(context, entry, attempt + 1);
    }
    return { error: err.message };
  }
}

// --- Main ---
async function main() {
  // Load catalogue
  if (!fs.existsSync(CATALOGUE_PATH)) {
    console.error(`Catalogue not found: ${CATALOGUE_PATH}`);
    process.exit(1);
  }

  let catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf8'));
  console.log(`Loaded ${catalogue.length} MacBook models from catalogue`);

  // Optionally include iPhone/iPad catalogue
  if (INCLUDE_IPHONE_IPAD && fs.existsSync(IPHONE_IPAD_CATALOGUE_PATH)) {
    const iphoneIpad = JSON.parse(fs.readFileSync(IPHONE_IPAD_CATALOGUE_PATH, 'utf8'));
    catalogue = catalogue.concat(iphoneIpad);
    console.log(`Added ${iphoneIpad.length} iPhone/iPad models (total: ${catalogue.length})`);
  } else if (INCLUDE_IPHONE_IPAD) {
    console.log(`⚠️ iPhone/iPad catalogue not found: ${IPHONE_IPAD_CATALOGUE_PATH}`);
  }

  // Filter if --model specified
  if (MODEL_FILTER) {
    catalogue = catalogue.filter(e => e.model.includes(MODEL_FILTER));
    console.log(`Filtered to ${catalogue.length} models matching "${MODEL_FILTER}"`);
  }

  if (catalogue.length === 0) {
    console.error('No models to scrape');
    process.exit(1);
  }

  // Dry run: just print catalogue
  if (DRY_RUN) {
    console.log('\n--- DRY RUN: Catalogue ---');
    for (const entry of catalogue) {
      console.log(`  ${entry.model} (${entry.uuid})`);
      console.log(`    ${entry.url}`);
    }
    console.log(`\nTotal: ${catalogue.length} models`);
    process.exit(0);
  }

  // Launch browser
  console.log('\nLaunching stealth browser...');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 }
  });

  // Visit homepage first to establish cookies and pass Cloudflare
  console.log('Warming up: visiting BM homepage to set cookies...');
  const warmPage = await context.newPage();
  try {
    await warmPage.goto('https://www.backmarket.co.uk/en-gb', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await warmPage.waitForTimeout(4000);
    console.log('  ✓ Homepage loaded, cookies set');
  } catch (e) {
    console.log('  ⚠ Homepage warm-up failed:', e.message);
  }
  await warmPage.close();
  await new Promise(r => setTimeout(r, 2000));

  const results = {};
  let scrapedOk = 0;
  let failed = 0;
  let totalPickers = 0;

  for (let i = 0; i < catalogue.length; i++) {
    const entry = catalogue[i];

    // Skip derived models (they'll be populated in post-processing from parent data)
    if (entry.parent) {
      console.log(`\n[${i + 1}/${catalogue.length}] Skipping ${entry.model} (derived from ${entry.parent})`);
      results[entry.model] = { uuid: entry.uuid, url: entry.url, scraped: false, grades: {}, pending_derivation: true };
      continue;
    }

    // Skip models marked as unavailable on BM
    if (entry.unavailable) {
      console.log(`\n[${i + 1}/${catalogue.length}] Skipping ${entry.model} (unavailable on BM)`);
      results[entry.model] = { uuid: entry.uuid, url: entry.url, scraped: false, unavailable: true, grades: {} };
      continue;
    }

    console.log(`\n[${i + 1}/${catalogue.length}] Scraping ${entry.model}...`);

    const result = await scrapeUrl(context, entry);

    if (result.error) {
      failed++;
      results[entry.model] = {
        uuid: entry.uuid,
        url: entry.url,
        scraped: false,
        error: result.error,
        grades: {},
        ram: {},
        ssd: {},
        cpu_gpu: {},
        colour: {}
      };
      console.log(`  ✗ Failed: ${result.error}`);
    } else {
      scrapedOk++;
      totalPickers += result.totalPickers;
      results[entry.model] = {
        uuid: entry.uuid,
        url: entry.url,
        scraped: true,
        ...result.categorised
      };
      // Remove empty categories
      const model = results[entry.model];
      for (const key of ['grades', 'ram', 'ssd', 'cpu_gpu', 'colour', 'size']) {
        if (model[key] && Object.keys(model[key]).length === 0) {
          delete model[key];
        }
      }
    }

    // Polite delay between pages (not after last)
    if (i < catalogue.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  await browser.close();

  // Post-processing: derive child models from parent pickers
  for (const entry of catalogue) {
    if (!entry.parent) continue;
    const parent = results[entry.parent];
    if (!parent || !parent.scraped) {
      console.log(`\n⚠ ${entry.model}: parent "${entry.parent}" not scraped, cannot derive`);
      continue;
    }

    // Find this model's chip variant in the parent's cpu_gpu pickers
    const chipKey = entry.model.toLowerCase();
    const cpuGpu = parent.cpu_gpu || {};
    let matchedProductId = null;
    let matchedChipName = null;

    for (const [name, data] of Object.entries(cpuGpu)) {
      const nameLower = name.toLowerCase();
      // Match M1 Max, M2, M3 Pro etc from the picker name
      if (chipKey.includes('m1 max') && nameLower.includes('m1 max')) { matchedProductId = data.productId; matchedChipName = name; break; }
      if (chipKey.includes('m1 pro') && nameLower.includes('m1 pro')) { matchedProductId = data.productId; matchedChipName = name; break; }
      if (chipKey.includes('m3 pro') && nameLower.includes('m3 pro')) { matchedProductId = data.productId; matchedChipName = name; break; }
      if (chipKey.includes('m2 pro') && nameLower.includes('m2 pro')) { matchedProductId = data.productId; matchedChipName = name; break; }
      if (chipKey.includes('m2') && !chipKey.includes('m2 pro') && nameLower.includes('m2') && !nameLower.includes('m2 pro') && !nameLower.includes('m2 max')) { matchedProductId = data.productId; matchedChipName = name; break; }
    }

    if (matchedProductId && matchedProductId !== '?') {
      // Use the parent's grade/picker data but with the derived product_id
      results[entry.model] = {
        uuid: matchedProductId,
        url: `https://www.backmarket.co.uk/en-gb/p/placeholder/${matchedProductId}?l=10`,
        scraped: true,
        derived_from: entry.parent,
        derived_chip: matchedChipName,
        grades: parent.grades || {},
        ram: parent.ram || {},
        ssd: parent.ssd || {},
        cpu_gpu: parent.cpu_gpu || {},
        colour: parent.colour || {},
        size: parent.size || {}
      };
      scrapedOk++;
      if (results[entry.model].error) delete results[entry.model].error;
      console.log(`\n✓ ${entry.model}: derived from "${entry.parent}" (chip: ${matchedChipName}, productId: ${matchedProductId})`);
    } else {
      console.log(`\n⚠ ${entry.model}: could not find matching chip variant in parent "${entry.parent}" pickers`);
    }
  }

  // Build output
  const output = {
    scraped_at: new Date().toISOString(),
    models: results,
    summary: {
      total_models: catalogue.length,
      scraped_ok: scrapedOk,
      failed: failed,
      total_pickers: totalPickers
    }
  };

  // Save dated file
  const dateStr = new Date().toISOString().split('T')[0];
  const datedPath = path.join(DATA_DIR, `sell-prices-${dateStr}.json`);
  const latestPath = path.join(DATA_DIR, 'sell-prices-latest.json');

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(datedPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved: ${datedPath}`);

  // Update latest symlink
  try { fs.unlinkSync(latestPath); } catch (_) {}
  fs.symlinkSync(path.basename(datedPath), latestPath);
  console.log(`Symlink: ${latestPath} -> ${path.basename(datedPath)}`);

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total models: ${catalogue.length}`);
  console.log(`Scraped OK:   ${scrapedOk}`);
  console.log(`Failed:       ${failed}`);
  console.log(`Total pickers: ${totalPickers}`);

  // Exit code: 0 if >80% succeeded
  const successRate = scrapedOk / catalogue.length;
  if (successRate < 0.8) {
    console.log(`\n⚠ Success rate ${(successRate * 100).toFixed(0)}% < 80% threshold. Exiting with code 1.`);
    process.exit(1);
  }

  console.log(`\n✓ Success rate: ${(successRate * 100).toFixed(0)}%`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
