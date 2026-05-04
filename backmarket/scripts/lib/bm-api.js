/**
 * BackMarket API helper
 */
require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });
const fs = require('fs');
const path = require('path');

const BM_API_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'Accept-Language': 'en-gb',
  Authorization:
    process.env.BM_AUTH ||
    process.env.BACKMARKET_API_AUTH,
  'User-Agent': process.env.BM_UA || 'BM-iCorrect-n8n;ricky@icorrect.co.uk',
};

const BM_BUYBACK_BASE = 'https://www.backmarket.co.uk/ws/buyback/v1/orders';
const BM_LISTINGS_BASE = 'https://www.backmarket.co.uk/ws/listings';

/**
 * Fetch all buyback orders in a given state, handling pagination.
 */
async function fetchBuybackOrders(state = 'sent') {
  const orders = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const url = `${BM_BUYBACK_BASE}?state=${state}&offset=${offset}&limit=${limit}`;
    const resp = await fetch(url, { headers: BM_API_HEADERS });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`BM buyback API ${resp.status}: ${text.slice(0, 200)}`);
    }

    const data = await resp.json();
    const results = data.results || data.orders || (Array.isArray(data) ? data : []);

    if (results.length === 0) break;
    orders.push(...results);

    // If we got fewer than limit, we've reached the end
    if (results.length < limit) break;
    offset += limit;
  }

  return orders;
}

/**
 * Fetch all active listings, handling pagination.
 */
async function fetchAllListings() {
  const listings = [];
  let page = 1;

  while (true) {
    const url = `${BM_LISTINGS_BASE}?page=${page}&page_size=100`;
    const resp = await fetch(url, { headers: BM_API_HEADERS });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`BM listings API ${resp.status}: ${text.slice(0, 200)}`);
    }

    const data = await resp.json();
    const results = data.results || (Array.isArray(data) ? data : []);

    if (results.length === 0) break;
    listings.push(...results);

    // Check if there's a next page (BM returns 10 per page regardless of page_size)
    if (!data.next) break;
    page++;
  }

  return listings;
}

const BM_ORDERS_BASE = 'https://www.backmarket.co.uk/ws/orders';
const DEFAULT_REQUEST_TIMEOUT_MS = 12000;
const DEFAULT_HISTORY_TIMEOUT_MS = 45000;
const SALES_HISTORY_CACHE_DIR = path.join(__dirname, '..', '..', 'data', 'cache', 'sales-history');
const SALES_HISTORY_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function salesHistoryCachePath(cacheKey) {
  return path.join(SALES_HISTORY_CACHE_DIR, `${cacheKey.replace(/[^a-z0-9_.-]/gi, '_')}.json`);
}

function readSalesHistoryDiskCache(cacheKey) {
  const filePath = salesHistoryCachePath(cacheKey);
  if (!fs.existsSync(filePath)) return null;
  const stat = fs.statSync(filePath);
  if (Date.now() - stat.mtimeMs > SALES_HISTORY_CACHE_TTL_MS) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function writeSalesHistoryDiskCache(cacheKey, result) {
  fs.mkdirSync(SALES_HISTORY_CACHE_DIR, { recursive: true });
  fs.writeFileSync(salesHistoryCachePath(cacheKey), JSON.stringify(result, null, 2));
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    if (!resp.ok) {
      const text = await resp.text();
      const error = new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
      error.statusCode = resp.status;
      throw error;
    }
    return resp.json();
  } finally {
    clearTimeout(timeout);
  }
}

function orderIsOlderThanCutoff(order, cutoff) {
  const rawDate = order?.date_creation || order?.date_created || order?.date || '';
  if (!rawDate) return false;
  const orderDate = new Date(rawDate);
  return Number.isFinite(orderDate.getTime()) && orderDate < cutoff;
}

/**
 * Fetch completed sell-side orders and compute historical sales stats
 * for a given product_id + grade combination.
 *
 * @param {string} productId - BM product UUID
 * @param {string} grade - BM grade ('FAIR', 'GOOD', 'VERY_GOOD')
 * @param {number} days - lookback window (default 90)
 * @returns {{ count, avg, median, low, high, sales[] }}
 */
const _salesHistoryCache = {};

async function fetchSalesHistory(productId, grade, days = 90) {
  const cacheKey = `${productId}:${grade}:${days}`;
  if (_salesHistoryCache[cacheKey]) return _salesHistoryCache[cacheKey];
  const cached = readSalesHistoryDiskCache(cacheKey);
  if (cached) {
    _salesHistoryCache[cacheKey] = cached;
    return cached;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const lookupStartedAt = Date.now();
  const gradeMap = { 'FAIR': 'FAIR', 'GOOD': 'GOOD', 'VERY_GOOD': 'VERY_GOOD',
    'Fair': 'FAIR', 'Good': 'GOOD', 'Excellent': 'VERY_GOOD' };
  const targetGrade = gradeMap[grade] || grade;
  const matchesTarget = (line) => {
    const lineGrade = gradeMap[line.grade] || line.grade;
    return String(line.productId) === String(productId) && lineGrade === targetGrade && line.price > 0;
  };

  // Fetch completed orders first, then delivered only if no signal was found.
  const allOrderLines = [];
  for (const state of [9, 4]) {
    let page = 1;
    while (true) {
      if (Date.now() - lookupStartedAt > DEFAULT_HISTORY_TIMEOUT_MS) {
        throw new Error(`sales_history_timeout_after_${DEFAULT_HISTORY_TIMEOUT_MS}ms`);
      }
      const url = `${BM_ORDERS_BASE}?state=${state}&page=${page}&page_size=100`;
      const data = await fetchJsonWithTimeout(url, { headers: BM_API_HEADERS });
      const orders = data.results || [];
      if (orders.length === 0) break;

      let pageHasRecentOrders = false;
      for (const order of orders) {
        const orderDate = new Date(order.date_creation);
        if (orderDate < cutoff) continue;
        pageHasRecentOrders = true;

        for (const line of (order.orderlines || [])) {
          allOrderLines.push({
            orderId: order.order_id,
            orderDate,
            productId: line.product_id,
            price: parseFloat(line.price || line.unit_price || line.product_price || 0),
            grade: line.grade || '',
            listingId: line.listing_id || line.listing || line.id,
          });
        }
      }

      if (!pageHasRecentOrders && orders.every(order => orderIsOlderThanCutoff(order, cutoff))) {
        break;
      }
      if (!data.next) break;
      page++;
    }

    if (allOrderLines.some(matchesTarget)) break;
  }

  // Filter to matching product_id + grade
  const matching = allOrderLines.filter(matchesTarget);

  if (matching.length === 0) {
    const result = { count: 0, avg: 0, median: 0, low: 0, high: 0, avgDaysToSell: null, sales: [], message: 'No sales history (new model)' };
    _salesHistoryCache[cacheKey] = result;
    writeSalesHistoryDiskCache(cacheKey, result);
    return result;
  }

  const prices = matching.map(m => m.price).sort((a, b) => a - b);
  const sum = prices.reduce((s, p) => s + p, 0);
  const avg = Math.round(sum / prices.length);
  const median = prices.length % 2 === 0
    ? Math.round((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2)
    : prices[Math.floor(prices.length / 2)];

  // avgDaysToSell: null by default — requires Monday cross-reference for listing dates.
  // Caller can compute this if they have Monday date_mkq385pa data.
  const result = {
    count: prices.length,
    avg,
    median,
    low: prices[0],
    high: prices[prices.length - 1],
    avgDaysToSell: null,
    sales: matching.map(m => ({
      orderId: m.orderId,
      price: m.price,
      date: m.orderDate.toISOString().slice(0, 10),
    })),
  };
  _salesHistoryCache[cacheKey] = result;
  writeSalesHistoryDiskCache(cacheKey, result);
  return result;
}

module.exports = {
  BM_API_HEADERS,
  fetchBuybackOrders,
  fetchAllListings,
  fetchSalesHistory,
};
