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
    keyboardPicker: {},
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
    } else if (category === 'keyboard') {
      categorised.keyboardPicker[label] = entry;
    }
  }

  return categorised;
}

function normalizeWhitespace(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeRamLabel(value) {
  const match = normalizeWhitespace(value).toUpperCase().match(/(\d+)\s*GB/);
  return match ? `${match[1]}GB` : '';
}

function normalizeSsdLabel(value) {
  const token = normalizeWhitespace(value).toUpperCase();
  const gbMatch = token.match(/(\d+)\s*GB/);
  if (gbMatch) return `${gbMatch[1]}GB`;
  const tbMatch = token.match(/(\d+)\s*TB/);
  if (tbMatch) return `${parseInt(tbMatch[1], 10) * 1000}GB`;
  return '';
}

function normalizeColourLabel(value) {
  const token = normalizeWhitespace(value).toUpperCase().replace(/[\s-]+/g, '');
  const aliases = {
    SPACEGRAY: 'SPACEGRAY',
    SPACEGREY: 'SPACEGRAY',
    GREY: 'SPACEGRAY',
    GRAY: 'SPACEGRAY',
    SILVER: 'SILVER',
    GOLD: 'GOLD',
    MIDNIGHT: 'MIDNIGHT',
    STARLIGHT: 'STARLIGHT',
    BLACK: 'BLACK',
    SPACEBLACK: 'SPACEBLACK',
    BLUE: 'BLUE',
    GREEN: 'GREEN',
    PURPLE: 'PURPLE',
    RED: 'RED',
    PINK: 'PINK',
    YELLOW: 'YELLOW',
    WHITE: 'WHITE',
  };
  return aliases[token] || token;
}

function normalizeCpuGpuLabel(value) {
  return normalizeWhitespace(value)
    .toUpperCase()
    .replace(/[()"]/g, '')
    .replace(/\bWITH\b/g, ' ')
    .replace(/\bAPPLE\b/g, 'APPLE ')
    .replace(/\s+AND\s+/g, ' ')
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKeyboardLabel(value) {
  const token = normalizeWhitespace(value).toUpperCase();
  if (token.includes('AZERTY')) return 'AZERTY';
  if (token.includes('QWERTY')) return 'QWERTY';
  return token;
}

function normalizeTitleText(value) {
  return normalizeWhitespace(value)
    .toUpperCase()
    .replace(/[()"]/g, '')
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeModelFamilyLabel(value) {
  return normalizeTitleText(value)
    .replace(/-?INCH\b/g, ' ')
    .replace(/\bRETINA\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeExpectedValue(category, value) {
  if (!value) return '';
  if (category === 'ram') return normalizeRamLabel(value);
  if (category === 'ssd') return normalizeSsdLabel(value);
  if (category === 'colour') return normalizeColourLabel(value);
  if (category === 'cpu_gpu') return normalizeCpuGpuLabel(value);
  if (category === 'keyboard') return normalizeKeyboardLabel(value);
  if (category === 'model_family') return normalizeModelFamilyLabel(value);
  return normalizeWhitespace(value).toUpperCase();
}

function findMatchingPickerEntry(picker = {}, expectedValue, category) {
  const expected = normalizeExpectedValue(category, expectedValue);
  if (!expected) return null;

  for (const [label, entry] of Object.entries(picker || {})) {
    const normalizedLabel = normalizeExpectedValue(category, label);
    if (normalizedLabel && normalizedLabel === expected) {
      return { label, entry };
    }
  }
  return null;
}

function titleMatchesExpected(pageTitle, expectedValue, category) {
  const title = category === 'model_family'
    ? normalizeModelFamilyLabel(pageTitle)
    : normalizeTitleText(pageTitle);
  const expected = normalizeExpectedValue(category, expectedValue);
  if (!title || !expected) return false;
  return title.includes(expected);
}

function expectedGradeLabel(grade) {
  return {
    FAIR: 'Fair',
    GOOD: 'Good',
    VERY_GOOD: 'Excellent',
    EXCELLENT: 'Excellent',
  }[String(grade || '').trim().toUpperCase()] || '';
}

function buildReconciledScrapeTarget(candidate = {}, scrape = {}) {
  const assertions = [];
  const hardFailures = [];
  const unresolved = [];
  const matchedProductIds = {};
  const pageTitle = scrape.pageTitle || '';
  const finalUrl = scrape.finalUrl || scrape.url || '';
  const gradePrices = scrape.gradePrices || {};
  const gradeLabel = expectedGradeLabel(candidate.grade);
  const gradePrice = gradeLabel ? gradePrices[gradeLabel] || null : null;

  function assertPicker(category, picker, expectedValue, options = {}) {
    const { required = false, titleFallback = false } = options;
    if (!expectedValue) return;

    const pickerValues = picker || {};
    const pickerKeys = Object.keys(pickerValues);
    const match = findMatchingPickerEntry(pickerValues, expectedValue, category);
    if (match) {
      const productId = String(match.entry?.productId || '').trim();
      assertions.push({
        category,
        ok: true,
        expected: expectedValue,
        actual: match.label,
        productId,
      });
      if (productId) matchedProductIds[category] = productId;
      return;
    }

    if (titleFallback && titleMatchesExpected(pageTitle, expectedValue, category)) {
      assertions.push({
        category,
        ok: true,
        expected: expectedValue,
        actual: `title:${pageTitle}`,
        productId: '',
        via: 'title',
      });
      return;
    }

    const message = pickerKeys.length === 0
      ? `${category} picker not exposed for expected "${expectedValue}"`
      : `${category} mismatch for expected "${expectedValue}"`;
    assertions.push({
      category,
      ok: false,
      expected: expectedValue,
      actual: pickerKeys,
      productId: '',
    });
    if (required) hardFailures.push(message);
    else unresolved.push(message);
  }

  if (candidate.modelFamily) {
    if (titleMatchesExpected(pageTitle, candidate.modelFamily, 'model_family')) {
      assertions.push({ category: 'model_family', ok: true, expected: candidate.modelFamily, actual: pageTitle, productId: '', via: 'title' });
    } else {
      assertions.push({ category: 'model_family', ok: false, expected: candidate.modelFamily, actual: pageTitle, productId: '', via: 'title' });
    }
  }

  assertPicker('ram', scrape.ramPicker, candidate.ram, { required: true, titleFallback: true });
  assertPicker('ssd', scrape.ssdPicker, candidate.ssd, { required: true, titleFallback: true });
  assertPicker('colour', scrape.colourPicker, candidate.colour, { required: true, titleFallback: false });
  assertPicker('cpu_gpu', scrape.cpuGpuPicker, candidate.cpuGpu, { required: true, titleFallback: true });
  assertPicker('keyboard', scrape.keyboardPicker, candidate.keyboardLayout, { required: !!candidate.keyboardLayout, titleFallback: true });

  if (!gradeLabel) {
    unresolved.push(`expected grade "${candidate.grade || ''}" is not mapped for scrape verification`);
  } else if (!gradePrice) {
    hardFailures.push(`missing expected grade price for ${gradeLabel}`);
  }

  const fair = gradePrices.Fair;
  const good = gradePrices.Good;
  const excellent = gradePrices.Excellent;
  const ladderOk = !(fair && good && fair >= good) && !(good && excellent && good >= excellent);
  if (fair && good && fair >= good) {
    hardFailures.push(`grade ladder inversion: Fair £${fair} >= Good £${good}`);
  }
  if (good && excellent && good >= excellent) {
    hardFailures.push(`grade ladder inversion: Good £${good} >= Excellent £${excellent}`);
  }

  const uniqueProductIds = Array.from(new Set(Object.values(matchedProductIds).filter(Boolean)));
  const reconciledProductId = uniqueProductIds.length === 1 ? uniqueProductIds[0] : '';

  if (uniqueProductIds.length > 1) {
    hardFailures.push(`picker product_id divergence: ${uniqueProductIds.join(', ')}`);
  } else if (candidate.productId && reconciledProductId && String(candidate.productId).trim() !== reconciledProductId) {
    hardFailures.push(`reconciled product_id ${reconciledProductId} does not match requested ${candidate.productId}`);
  } else if (candidate.productId && !reconciledProductId) {
    hardFailures.push(`requested product_id ${candidate.productId} was not reconciled from picker evidence`);
  }

  return {
    ok: hardFailures.length === 0,
    trusted: hardFailures.length === 0 && unresolved.length === 0,
    fullyReconciled: hardFailures.length === 0 && unresolved.length === 0,
    requestedProductId: String(candidate.productId || '').trim(),
    reconciledProductId,
    url: scrape.url || '',
    finalUrl,
    pageTitle,
    expectedGradeLabel: gradeLabel,
    expectedGradePrice: gradePrice,
    ladderOk,
    matchedProductIds,
    assertions,
    hardFailures,
    unresolved,
  };
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

async function extractPageMetadata(page) {
  return await page.evaluate(() => ({
    finalUrl: window.location.href,
    pageTitle: document.querySelector('h1')?.textContent?.trim() || document.title || '',
  }));
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

    // Cloudflare warmup — visit homepage first to set cookies before hitting product page
    await page.goto(BM_BASE, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await page.waitForTimeout(1500);

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
    const metadata = await extractPageMetadata(page);
    await page.close();
    return {
      ok: true,
      source: 'live single-page scrape',
      url,
      ...metadata,
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
    const metadata = await extractPageMetadata(page);
    return {
      ok: true,
      source: 'live single-page scrape',
      url,
      ...metadata,
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
      keyboardPicker: catalogFallback.keyboardPicker || {},
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
  buildReconciledScrapeTarget,
  // Browser helpers
  createStealthContext,
  extractNuxtDataFromPage,
  extractPageMetadata,
  isCloudflareBlocked,
  // Main scrape functions
  scrapeSingleProduct,
  scrapeWithContext,
  scrapeWithFallback,
  // Batch helpers
  launchBatchBrowser,
  closeBatchBrowser,
};
