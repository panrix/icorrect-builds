/**
 * Shared profitability calculation module
 * Used by Build 9 (daily check) and Build 10 (intake prediction)
 */

const LABOUR_RATE = 24;       // £24/hr
const SHIPPING_COST = 15;     // £15 per unit
const BM_COMMISSION = 0.10;   // 10%
const MARGIN_THRESHOLD = 0.30;
const NET_PROFIT_THRESHOLD = 100;

/**
 * Calculate profitability for a device.
 *
 * @param {number} sellPrice - Expected sell price on BM
 * @param {object} costs - { purchaseCost, partsCost, labourHours }
 * @returns {object} { totalCost, netRevenue, netProfit, margin, category, costUnknown }
 */
function calculateProfitability(sellPrice, costs = {}) {
  const purchaseCost = costs.purchaseCost || 0;
  const partsCost = costs.partsCost || 0;
  const labourHours = costs.labourHours || 0;
  const costUnknown = !costs.purchaseCost && !costs.partsCost;

  const totalCost = purchaseCost + partsCost + (labourHours * LABOUR_RATE) + SHIPPING_COST;
  const netRevenue = sellPrice * (1 - BM_COMMISSION);
  const netProfit = netRevenue - totalCost;
  const margin = netRevenue > 0 ? netProfit / netRevenue : 0;

  let category;
  if (margin >= MARGIN_THRESHOLD && netProfit >= NET_PROFIT_THRESHOLD) {
    category = 'profitable';
  } else if (margin < 0 || netProfit < 0) {
    category = 'unprofitable';
  } else {
    category = 'marginal';
  }

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    margin: Math.round(margin * 10000) / 10000,
    marginPercent: Math.round(margin * 100),
    category,
    costUnknown,
  };
}

/**
 * Map Monday grade picker labels to BM grade keys (used in sell-prices-latest.json)
 */
const GRADE_MAP = {
  'Excellent': 'Excellent',
  'Grade A': 'Excellent',
  'Good': 'Good',
  'Grade B': 'Good',
  'Fair': 'Fair',
  'Grade C': 'Fair',
};

/**
 * BM API grade identifiers
 */
const BM_GRADE_MAP = {
  'Excellent': 'VERY_GOOD',
  'Grade A': 'VERY_GOOD',
  'Good': 'GOOD',
  'Grade B': 'GOOD',
  'Fair': 'FAIR',
  'Grade C': 'FAIR',
};

/**
 * Grade ranking (lower = worse)
 */
const GRADE_RANK = {
  'Fair': 1,
  'Grade C': 1,
  'Good': 2,
  'Grade B': 2,
  'Excellent': 3,
  'Grade A': 3,
};

/**
 * Get the worst (lowest) of two grades.
 */
function worstGrade(gradeA, gradeB) {
  const rankA = GRADE_RANK[gradeA] || 0;
  const rankB = GRADE_RANK[gradeB] || 0;
  return rankA <= rankB ? gradeA : gradeB;
}

/**
 * Match a Monday item name to a sell-prices model key.
 * Monday names are like "MacBook Air 13\" 2020 M1 - ABC123" or "MacBook Pro 14\" 2023 M3 Pro"
 * Scraper keys are like "Air 13\" 2020 M1", "Pro 14\" 2023 M3 Pro"
 */
function matchModel(itemName, modelKeys) {
  if (!itemName) return null;
  const name = itemName.toLowerCase();

  // Score each model key by how well it matches
  let bestMatch = null;
  let bestScore = 0;

  for (const key of modelKeys) {
    const keyLower = key.toLowerCase();
    // Extract the key parts: "air 13\" 2020 m1" etc.
    const keyParts = keyLower.replace(/"/g, '').split(/\s+/);

    let matched = 0;
    for (const part of keyParts) {
      if (name.includes(part)) matched++;
    }

    const score = matched / keyParts.length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = key;
    }
  }

  // Require at least 80% of key parts to match
  return bestScore >= 0.8 ? bestMatch : null;
}

/**
 * Look up sell price from scraper data for a model + grade.
 *
 * @param {object} sellPriceData - Parsed sell-prices-latest.json
 * @param {string} modelKey - Key from matchModel()
 * @param {string} grade - BM-style grade: "Fair", "Good", "Excellent"
 * @returns {number|null}
 */
function lookupSellPrice(sellPriceData, modelKey, grade) {
  if (!sellPriceData?.models?.[modelKey]) return null;
  const model = sellPriceData.models[modelKey];
  const gradeKey = GRADE_MAP[grade] || grade;
  return model.grades?.[gradeKey]?.price || null;
}

module.exports = {
  calculateProfitability,
  matchModel,
  lookupSellPrice,
  worstGrade,
  GRADE_MAP,
  BM_GRADE_MAP,
  GRADE_RANK,
  LABOUR_RATE,
  SHIPPING_COST,
  BM_COMMISSION,
  MARGIN_THRESHOLD,
  NET_PROFIT_THRESHOLD,
};
