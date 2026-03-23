/**
 * Counter-Offer Module
 * Handles spec mismatches between expected and received BM buyback specs.
 * When a device comes in with worse specs than listed, this module decides
 * whether to absorb the loss, counter-offer, or escalate.
 */

const fs = require("fs");
const path = require("path");

const COUNTER_OFFER_RATE_LIMIT = 0.15; // 15%
const COUNTER_OFFER_ABSORB_THRESHOLD = 20; // £20
const COUNTER_OFFER_LOG_PATH = "/home/ricky/builds/icloud-checker/data/counter-offer-log.json";

const BM_API_BASE = "https://www.backmarket.co.uk/ws/buyback";
const BM_API_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "Accept-Language": "en-gb",
  Authorization: process.env.BM_AUTH,
  "User-Agent": "BM-iCorrect-n8n;ricky@icorrect.co.uk",
};

// --- Spec value rankings for comparison ---

const STORAGE_ORDER = ["128gb", "256gb", "512gb", "1tb", "2tb", "4tb", "8tb"];
const RAM_ORDER = ["8gb", "16gb", "18gb", "24gb", "32gb", "36gb", "48gb", "64gb", "96gb", "128gb", "192gb"];

// Chip ranking: higher index = better
const CHIP_ORDER = [
  "m1", "m1 pro", "m1 max", "m1 ultra",
  "m2", "m2 pro", "m2 max", "m2 ultra",
  "m3", "m3 pro", "m3 max", "m3 ultra",
  "m4", "m4 pro", "m4 max", "m4 ultra",
];

function normalizeSpec(val) {
  if (!val) return "";
  return val.toLowerCase().replace(/\s+/g, " ").trim();
}

function specRank(value, order) {
  if (!value) return -1;
  const norm = normalizeSpec(value).replace(/\s/g, "");
  const idx = order.findIndex(o => norm.includes(o.replace(/\s/g, "")));
  return idx;
}

/**
 * Assess whether a spec mismatch is better, worse, or mixed.
 * @param {object} expected - { model, chip, ram/memory, storage }
 * @param {object} received - { model, chip, ram/memory, storage }
 * @returns {{ action: string, reason: string, details: object }}
 */
function assessMismatch(expected, received) {
  const comparisons = {};
  let hasBetter = false;
  let hasWorse = false;

  // Compare chip
  const expChip = specRank(expected.chip, CHIP_ORDER);
  const recChip = specRank(received.chip, CHIP_ORDER);
  if (expChip >= 0 && recChip >= 0) {
    if (recChip > expChip) { comparisons.chip = "better"; hasBetter = true; }
    else if (recChip < expChip) { comparisons.chip = "worse"; hasWorse = true; }
    else { comparisons.chip = "same"; }
  }

  // Compare RAM
  const expRam = specRank(expected.ram || expected.memory, RAM_ORDER);
  const recRam = specRank(received.ram || received.memory, RAM_ORDER);
  if (expRam >= 0 && recRam >= 0) {
    if (recRam > expRam) { comparisons.ram = "better"; hasBetter = true; }
    else if (recRam < expRam) { comparisons.ram = "worse"; hasWorse = true; }
    else { comparisons.ram = "same"; }
  }

  // Compare storage
  const expStor = specRank(expected.storage, STORAGE_ORDER);
  const recStor = specRank(received.storage, STORAGE_ORDER);
  if (expStor >= 0 && recStor >= 0) {
    if (recStor > expStor) { comparisons.storage = "better"; hasBetter = true; }
    else if (recStor < expStor) { comparisons.storage = "worse"; hasWorse = true; }
    else { comparisons.storage = "same"; }
  }

  // If received is better in all changed dimensions and nothing is worse
  if (hasBetter && !hasWorse) {
    return { action: "pay_original", reason: "better_spec", details: comparisons };
  }

  // If worse in any dimension
  if (hasWorse) {
    return { action: "evaluate", reason: "worse_spec", details: comparisons };
  }

  // No meaningful difference detected (e.g. model name mismatch only)
  return { action: "pay_original", reason: "equivalent_spec", details: comparisons };
}

/**
 * Get BM order details to find original bid price.
 */
async function getBmOrderDetails(orderPublicId) {
  const resp = await fetch(`${BM_API_BASE}/v1/orders/${orderPublicId}`, {
    headers: BM_API_HEADERS,
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`BM order details HTTP ${resp.status}: ${errText.substring(0, 200)}`);
  }
  return resp.json();
}

/**
 * Calculate value difference between original bid and what the received spec is worth.
 * @param {number} originalBid - Original buyback price
 * @param {number} receivedSpecBid - What BM would pay for received spec (manual/lookup)
 * @returns {{ valueDiff: number, originalBid: number, receivedSpecBid: number }}
 */
function calculateValueDiff(originalBid, receivedSpecBid) {
  const valueDiff = originalBid - receivedSpecBid;
  return { valueDiff, originalBid, receivedSpecBid };
}

/**
 * Check rolling counter-offer rate over last 30 days.
 * @returns {{ rate: number, counterCount: number, totalCount: number, atLimit: boolean }}
 */
function checkRate() {
  const log = readLog();
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  const recentEntries = log.filter(e => new Date(e.timestamp).getTime() > thirtyDaysAgo);
  const counterCount = recentEntries.filter(e => e.action === "counter").length;
  const totalCount = recentEntries.length || 1; // avoid div by zero

  const rate = counterCount / totalCount;
  return {
    rate,
    counterCount,
    totalCount: recentEntries.length,
    atLimit: rate >= COUNTER_OFFER_RATE_LIMIT,
  };
}

/**
 * Execute a counter-offer via BM API.
 */
async function executeCounterOffer(orderPublicId, price, comment) {
  const resp = await fetch(`${BM_API_BASE}/v2/orders/${orderPublicId}/counter-offers`, {
    method: "PUT",
    headers: BM_API_HEADERS,
    body: JSON.stringify({
      counter_offer_price: price,
      comment: comment || `Counter-offer: device specs differ from listing. Adjusted price: £${price}`,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`BM counter-offer HTTP ${resp.status}: ${errText.substring(0, 300)}`);
  }

  const data = await resp.json();
  return data;
}

/**
 * Log a decision to counter-offer-log.json
 */
function logDecision(orderId, action, valueDiff, details) {
  const log = readLog();
  log.push({
    orderId,
    action,
    valueDiff,
    details,
    timestamp: new Date().toISOString(),
  });
  writeLog(log);
}

function readLog() {
  try {
    return JSON.parse(fs.readFileSync(COUNTER_OFFER_LOG_PATH, "utf8"));
  } catch {
    return [];
  }
}

function writeLog(log) {
  fs.writeFileSync(COUNTER_OFFER_LOG_PATH, JSON.stringify(log, null, 2));
}

module.exports = {
  COUNTER_OFFER_RATE_LIMIT,
  COUNTER_OFFER_ABSORB_THRESHOLD,
  assessMismatch,
  getBmOrderDetails,
  calculateValueDiff,
  checkRate,
  executeCounterOffer,
  logDecision,
};
