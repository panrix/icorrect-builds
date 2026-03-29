/**
 * V7 NUXT Data Scraper — shared module
 *
 * Extracts grade ladder, RAM/SSD/colour/CPU picker prices from
 * BackMarket product pages by parsing __NUXT_DATA__ script tags.
 *
 * Used by:
 *   - list-device.js (SOP 06) — single product page scrape before listing
 *   - buy-box-check.js (SOP 07) — grade ladder scrape for live listings
 */

const { chromium } = require('/home/ricky/builds/buyback-monitor/node_modules/playwright-extra');
const StealthPlugin = require('/home/ricky/builds/buyback-monitor/node_modules/puppeteer-extra-plugin-stealth');

chromium.use(StealthPlugin());

const BM_BASE = 'https://www.backmarket.co.uk';
const DEFAULT_TIMEOUT_MS = 15000;

// ─── NUXT Data Parsing ──────────────────────────────────────────

function resolveNuxt(arr, idx) {
  if (typeof idx === 'number' && idx >= 0 && idx < arr.length) {
    const val = arr[idx];
    if (val === 17) return null;
    return val;
  }
  return idx;
}

function extractNuxtPrice(arr, picker) {
  const priceRef = picker.price;
  if (priceRef === undefined || priceRef === null) return null;
  const priceObj = resolveNuxt(arr, priceRef);
  if (!priceObj || typeof priceObj !== 'object') return null;
  const amount = resolveNuxt(arr, priceObj.amount);
  if (amount === null || amount === undefined) return null;
  return typeof amount === 'number' ? amount : parseFloat(amount) || null;
}

function categorisePickerLabel(label) {
  if (!label || typeof label !== 'string') return null;
  const trimmed = label.trim();
  if (/QWERTY|AZERTY/i.test(trimmed)) return 'keyboard';
  if (['Fair', 'Good', 'Excellent', 'Premium'].includes(trimmed)) return 'grade';
  if (['Space Gray', 'Space Grey', 'Grey', 'Gray', 'Silver', 'Gold', 'Midnight', 'Starlight', 'Black', 'Space Black', 'Blue', 'Green', 'Purple', 'Red', 'Pink', 'Yellow', 'White'].includes(trimmed)) return 'colour';
  if (/M[1-4]/i.test(trimmed) && /core/i.test(trimmed)) return 'cpu_gpu';
  const gbMatch = trimmed.match(/^(\d+)\s*GB$/i);
  if (gbMatch) {
    const val = parseInt(gbMatch[1], 10);
    if (val >= 128) return 'ssd';
    return 'ram';
  }
  if (/^\d+\s*TB$/i.test(trimmed)) return 'ssd';
  return 'unknown';
}

function findNuxtPickers(arr) {
  const pickers = [];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    if ('label' in item && 'price' in item && 'available' in item) {
      pickers.push(item);
    }
  }
  return pickers;
}

function extractNuxtDataCategories(arr) {
  const categorised = {
    gradePrices: {},
    ramPicker: {},
    ssdPicker: {},
    colourPicker: {},
    cpuGpuPicker: {},
  };

  for (const raw of findNuxtPickers(arr)) {
    const label = resolveNuxt(arr, raw.label);
    const available = resolveNuxt(arr, raw.available);
    const productId = resolveNuxt(arr, raw.productId || raw.product_id);
    const price = extractNuxtPrice(arr, raw);
    if (!label || typeof label !== 'string') continue;

    const entry = {
      price,
      available: available === true || available === 'true',
    };
    if (productId) entry.productId = productId;

    const category = categorisePickerLabel(label);
    if (category === 'grade') {
      categorised.gradePrices[label] = entry.price;
    } else if (category === 'ram') {
      categorised.ramPicker[label] = entry;
    } else if (category === 'ssd') {
      categorised.ssdPicker[label] = entry;
    } else if (category === 'colour') {
      categorised.colourPicker[label] = entry;
    } else if (category === 'cpu_gpu') {
      categorised.cpuGpuPicker[label] = entry;
    }
  }

  return categorised;
}

// ─── Browser Helpers ─────────────────────────────────────────────

async function createStealthContext(browser) {
  const context = await browser.newContext({
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  });
  const warmPage = await context.newPage();
  try {
    await warmPage.goto('https://www.backmarket.co.uk/en-gb', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await warmPage.waitForTimeout(3500);
  } catch (_) {
    // best-effort cookie warmup only
  }
  await warmPage.close();
  return context;
}

async function extractNuxtDataFromPage(page) {
  return await page.evaluate(() => {
    const scripts = document.querySelectorAll('script#__NUXT_DATA__');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (Array.isArray(data)) return data;
      } catch (_) {}
    }
    return null;
  });
}

async function isCloudflareBlocked(page) {
  return await page.evaluate(() => {
    const body = document.body ? document.body.innerText : '';
    return body.includes('Checking your browser') ||
      body.includes('Just a moment') ||
      body.includes('cf-browser-verification') ||
      document.title.includes('Just a moment');
  });
}

// ─── Main Scrape Functions ───────────────────────────────────────

/**
 * Scrape a single BM product page for grade/spec pricing data.
 * Launches its own browser instance.
 *
 * @param {string} productId - BM product UUID
 * @returns {object} { ok, source, url, gradePrices, ramPicker, ssdPicker, colourPicker, cpuGpuPicker }
 */
async function scrapeSingleProduct(productId) {
  const url = `${BM_BASE}/en-gb/p/placeholder/${productId}?l=10`;
  let browser;
  let context;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });
    context = await createStealthContext(browser);
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await page.waitForTimeout(2500);

    if (await isCloudflareBlocked(page)) {
      throw new Error('cloudflare_blocked');
    }

    const nuxtData = await extractNuxtDataFromPage(page);
    if (!nuxtData) {
      throw new Error('no_nuxt_data');
    }
    const extracted = extractNuxtDataCategories(nuxtData);
    await page.close();
    return {
      ok: true,
      source: 'live single-page scrape',
      url,
      ...extracted,
    };
  } finally {
    try { if (context) await context.close(); } catch (_) {}
    try { if (browser) await browser.close(); } catch (_) {}
  }
}

/**
 * Scrape a BM product page using an existing browser context (avoids
 * launching a new browser per product — much faster for batch scraping).
 *
 * @param {object} context - Playwright browser context (from createStealthContext)
 * @param {string} productId - BM product UUID
 * @returns {object} { ok, source, url, gradePrices, ramPicker, ssdPicker, colourPicker, cpuGpuPicker }
 */
async function scrapeWithContext(context, productId) {
  const url = `${BM_BASE}/en-gb/p/placeholder/${productId}?l=10`;
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await page.waitForTimeout(2500);

    if (await isCloudflareBlocked(page)) {
      throw new Error('cloudflare_blocked');
    }

    const nuxtData = await extractNuxtDataFromPage(page);
    if (!nuxtData) {
      throw new Error('no_nuxt_data');
    }
    const extracted = extractNuxtDataCategories(nuxtData);
    return {
      ok: true,
      source: 'live single-page scrape',
      url,
      ...extracted,
    };
  } finally {
    try { await page.close(); } catch (_) {}
  }
}

/**
 * Scrape with timeout and fallback to provided catalog data.
 *
 * @param {string} productId - BM product UUID
 * @param {object} catalogFallback - fallback data (gradePrices, ramPicker, etc.)
 * @param {number} timeoutMs - timeout in ms (default 15000)
 * @returns {object} scrape result or fallback
 */
async function scrapeWithFallback(productId, catalogFallback = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  try {
    const scrape = await Promise.race([
      scrapeSingleProduct(productId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('live_scrape_timeout')), timeoutMs)),
    ]);
    return scrape;
  } catch (e) {
    return {
      ok: false,
      source: 'catalog fallback',
      error: e.message,
      gradePrices: catalogFallback.gradePrices || {},
      ramPicker: catalogFallback.ramPicker || {},
      ssdPicker: catalogFallback.ssdPicker || {},
      colourPicker: catalogFallback.colourPicker || {},
      cpuGpuPicker: catalogFallback.cpuGpuPicker || {},
    };
  }
}

/**
 * Launch a browser + stealth context for batch scraping.
 * Call closeBatchBrowser() when done.
 *
 * @returns {{ browser, context }}
 */
async function launchBatchBrowser() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  const context = await createStealthContext(browser);
  return { browser, context };
}

/**
 * Close a batch browser session.
 */
async function closeBatchBrowser({ browser, context }) {
  try { if (context) await context.close(); } catch (_) {}
  try { if (browser) await browser.close(); } catch (_) {}
}

module.exports = {
  // Parsing (for testing / direct use)
  resolveNuxt,
  extractNuxtPrice,
  categorisePickerLabel,
  findNuxtPickers,
  extractNuxtDataCategories,
  // Browser helpers
  createStealthContext,
  extractNuxtDataFromPage,
  isCloudflareBlocked,
  // Main scrape functions
  scrapeSingleProduct,
  scrapeWithContext,
  scrapeWithFallback,
  // Batch helpers
  launchBatchBrowser,
  closeBatchBrowser,
};
