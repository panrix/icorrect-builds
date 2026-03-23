/**
 * profitability.js — Cost and margin calculation for BM listings
 * Reused by builds 4/5 (listing automation) and builds 9/10 (pricing).
 *
 * BM commission: ~10% (net revenue = sell_price * 0.90)
 * Shipping: £15 flat
 * Labour: hours * £24/hr
 */

const BM_COMMISSION_RATE = 0.10; // 10% BackMarket commission
const SHIPPING_COST = 15;        // £15 flat shipping
const LABOUR_RATE = 24;          // £24/hr

// Auto-list thresholds
const MIN_MARGIN_PCT = 0.30;     // 30% minimum net margin
const MIN_NET_PROFIT = 100;      // £100 minimum net profit

/**
 * Calculate profitability for a device listing.
 * @param {object} params
 * @param {number} params.sellPrice     - BM sell price (£)
 * @param {number} params.purchaseCost  - Purchase cost ex VAT (£)
 * @param {number} params.partsCost     - Parts cost (£), default 0
 * @param {number} params.labourHours   - Labour hours, default 0
 * @param {number} [params.shippingCost] - Override shipping cost (default £15)
 * @returns {object} Profitability breakdown
 */
function calculateProfitability({ sellPrice, purchaseCost, partsCost = 0, labourHours = 0, shippingCost = SHIPPING_COST }) {
  const labourCost = labourHours * LABOUR_RATE;
  const totalCost = purchaseCost + partsCost + labourCost + shippingCost;
  const bmFee = sellPrice * BM_COMMISSION_RATE;
  const netRevenue = sellPrice - bmFee; // what we actually receive
  const netProfit = netRevenue - totalCost;
  const netMargin = netRevenue > 0 ? netProfit / netRevenue : 0;

  return {
    sellPrice,
    purchaseCost,
    partsCost,
    labourCost,
    labourHours,
    shippingCost,
    totalCost,
    bmFee,
    netRevenue,
    netProfit,
    netMargin,
    meetsAutoListThreshold: netMargin >= MIN_MARGIN_PCT && netProfit >= MIN_NET_PROFIT,
  };
}

/**
 * Format profitability breakdown as a readable string (for Slack).
 * @param {object} p - Output from calculateProfitability
 * @returns {string}
 */
function formatBreakdown(p) {
  const pct = (p.netMargin * 100).toFixed(1);
  return [
    `Sell: £${p.sellPrice.toFixed(2)}`,
    `BM fee (10%): £${p.bmFee.toFixed(2)}`,
    `Net revenue: £${p.netRevenue.toFixed(2)}`,
    `Purchase: £${p.purchaseCost.toFixed(2)}`,
    `Parts: £${p.partsCost.toFixed(2)}`,
    `Labour (${p.labourHours}h @ £${LABOUR_RATE}/h): £${p.labourCost.toFixed(2)}`,
    `Shipping: £${p.shippingCost.toFixed(2)}`,
    `Total cost: £${p.totalCost.toFixed(2)}`,
    `Net profit: £${p.netProfit.toFixed(2)}`,
    `Net margin: ${pct}%`,
  ].join('\n');
}

module.exports = {
  calculateProfitability,
  formatBreakdown,
  BM_COMMISSION_RATE,
  SHIPPING_COST,
  LABOUR_RATE,
  MIN_MARGIN_PCT,
  MIN_NET_PROFIT,
};
