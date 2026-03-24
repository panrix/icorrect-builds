/**
 * bm-listings-cache.js — Loads and searches the local BM listings JSON file.
 * 
 * Listings file structure (array of objects):
 * {
 *   listing_id, product_id, sku, grade, quantity, pub_state, price, min_price,
 *   backmarket_id, title
 * }
 * 
 * pub_state: 2 = active/published, 3 = deactivated
 * grade: FAIR, GOOD, VERY_GOOD, EXCELLENT
 */

const fs = require("fs");

let _cache = null;
let _loadedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // refresh from disk every 5 min

/**
 * Load listings from disk (with in-memory TTL cache).
 * @param {string} filePath - Path to bm-listings-clean.json
 * @returns {Array} Array of listing objects
 */
function loadListings(filePath) {
  const now = Date.now();
  if (_cache && (now - _loadedAt) < CACHE_TTL_MS) return _cache;

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    _cache = JSON.parse(raw);
    _loadedAt = now;
    return _cache;
  } catch (err) {
    console.error(`[bm-listings-cache] Failed to load ${filePath}:`, err.message);
    return _cache || [];
  }
}

/**
 * Invalidate the in-memory cache (force reload on next call).
 */
function invalidateCache() {
  _cache = null;
  _loadedAt = 0;
}

/**
 * Find active listings (qty > 0) matching product_id and grade.
 * @param {string} filePath
 * @param {string} productId - BM product UUID
 * @param {string} grade - BM grade code (FAIR, GOOD, VERY_GOOD, EXCELLENT)
 * @returns {Array} Matching active listings
 */
function findActiveListings(filePath, productId, grade) {
  const listings = loadListings(filePath);
  return listings.filter(l =>
    l.product_id === productId &&
    l.grade === grade &&
    l.quantity > 0
  );
}

/**
 * Find offline listings (qty === 0) matching product_id, grade, and optionally colour (from SKU).
 * @param {string} filePath
 * @param {string} productId - BM product UUID
 * @param {string} grade - BM grade code
 * @param {string} [colourSlug] - BM colour slug to match in SKU (e.g. "space-grey")
 * @returns {Array} Matching offline listings
 */
function findOfflineListings(filePath, productId, grade, colourSlug) {
  const listings = loadListings(filePath);
  return listings.filter(l => {
    if (l.product_id !== productId) return false;
    if (l.grade !== grade) return false;
    if (l.quantity !== 0) return false;
    if (colourSlug) {
      // Match colour slug in the SKU string (case-insensitive)
      const skuLower = (l.sku || "").toLowerCase();
      if (!skuLower.includes(colourSlug.toLowerCase())) return false;
    }
    return true;
  });
}

/**
 * Find ANY listing matching product_id + grade (regardless of qty).
 * Used to check if a listing slot exists at all.
 * @param {string} filePath
 * @param {string} productId
 * @param {string} grade
 * @returns {Array}
 */
function findAnyListings(filePath, productId, grade) {
  const listings = loadListings(filePath);
  return listings.filter(l =>
    l.product_id === productId &&
    l.grade === grade
  );
}

/**
 * Search listings by device specs (model number, RAM, SSD) + grade.
 * Matches model number in SKU or title, RAM and SSD in title/SKU.
 * @param {string} filePath
 * @param {object} specs - { modelNumber, ram, ssd, grade }
 * @returns {Array} Matching listings sorted by relevance
 */
function findListingsBySpecs(filePath, { modelNumber, ram, ssd, grade }) {
  const listings = loadListings(filePath);
  const results = [];

  for (const l of listings) {
    // Grade must match exactly
    if (grade && l.grade !== grade) continue;

    const skuLower = (l.sku || "").toLowerCase();
    const titleLower = (l.title || "").toLowerCase();
    const combined = skuLower + " " + titleLower;

    let score = 0;

    // Model number match (e.g. "A2337" in SKU)
    if (modelNumber) {
      const mnLower = modelNumber.toLowerCase();
      if (skuLower.includes(mnLower)) score += 10;
      else if (titleLower.includes(mnLower)) score += 5;
    }

    // RAM match (e.g. "8gb" or "8GB RAM")
    if (ram) {
      const ramNorm = ram.toLowerCase().replace(/\s/g, "");
      if (combined.includes(ramNorm)) score += 3;
      // Also try "8gb ram" pattern
      const ramNum = ram.replace(/[^0-9]/g, "");
      if (ramNum && titleLower.includes(ramNum + "gb ram")) score += 3;
    }

    // SSD/storage match (e.g. "256gb" or "SSD 256")
    if (ssd) {
      const ssdNorm = ssd.toLowerCase().replace(/\s/g, "");
      if (combined.includes(ssdNorm)) score += 3;
      const ssdNum = ssd.replace(/[^0-9]/g, "");
      if (ssdNum && (titleLower.includes("ssd " + ssdNum) || titleLower.includes(ssdNum + "gb"))) score += 3;
    }

    if (score > 0) {
      results.push({ ...l, _matchScore: score });
    }
  }

  // Sort by match score descending
  results.sort((a, b) => b._matchScore - a._matchScore);
  return results;
}

module.exports = {
  loadListings,
  invalidateCache,
  findActiveListings,
  findOfflineListings,
  findAnyListings,
  findListingsBySpecs,
};
