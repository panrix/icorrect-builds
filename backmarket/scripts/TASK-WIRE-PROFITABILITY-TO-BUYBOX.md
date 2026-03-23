# Task: Wire Profitability Lookup into Buy Box Bump Decisions

## Current State
- `buy-box-check.js` already loads `buyback-profitability-lookup.json` (line 40)
- `matchProfitability()` (line 62) matches listings to lookup entries
- BUT bump decisions (line 387+) use `costData.totalFixedCost` from Monday's `numeric_mm1mgcgn` column
- This Monday column is manually populated and often wrong/empty
- The profitability lookup has real per-model+grade average costs from actual sales data

## What to Change

### 1. Use lookup data in margin gate for bumps

Current (line 387):
```js
} else if (buyBox.priceToWin && costData?.totalFixedCost) {
    const atWin = calcProfit(buyBox.priceToWin, costData.totalFixedCost, costData.purchasePrice);
```

Change to:
- First try profitability lookup (real data from completed sales)
- Fall back to Monday's totalFixedCost if no lookup match
- When using lookup: reconstruct totalFixedCost from `avgPurchasePrice + avgPartsCost + avgLabourCost + 15 (shipping) + (avgPurchasePrice * 0.10) (BM buy fee)`

### 2. Exclude no-cost-data entries from lookup averages

In `buyback-profitability-builder.js`, when computing averages for a model+grade:
- Only include orders where `hasCostData === true`
- Add a top-level `hasRealCosts` boolean to each lookup entry
- If all orders for a model+grade have `hasCostData: false`, set `hasRealCosts: false`
- The buy box check should skip lookup entries where `hasRealCosts: false`

### 3. Flag unprofitable listings as "do not bump"

When the margin gate calculation shows margin < 0% at priceToWin:
- Do NOT bump (already the case)
- Add to a new `unprofitable` category in the summary
- Log: "⛔ UNPROFITABLE at buy box price: [model] [grade] margin X%"

When margin is 0-15% at priceToWin:
- Bump but flag as "marginal" (already the case)
- Include real vs estimated costs in the log for visibility

### 4. Summary output

Add to the daily summary:
```
Real Data Coverage: X/Y listings matched to profitability lookup (Z%)
Unprofitable (do not bump): N listings
Marginal (bumped with caution): N listings
```

## Lookup Structure Reference

File: `/home/ricky/builds/data/buyback-profitability-lookup.json`

Key format: `"MacBook Pro 13 M1 A2338|FAIR"`

```json
{
  "model": "MacBook Pro 13 M1 A2338",
  "grade": "FAIR",
  "sampleSize": 98,
  "avgSellPrice": 483.94,
  "avgPurchasePrice": 118.19,
  "avgPartsCost": 64.61,
  "avgLabourCost": 31.56,
  "avgNetProfit": 133.39,
  "avgMargin": 27.54
}
```

## Matching Logic

`matchProfitability()` already exists at line 62. It matches by normalised model name + grade. The key challenge is that listing titles from BM (e.g. "MacBook Pro 13-inch (2020) - Apple M1") don't exactly match lookup keys (e.g. "MacBook Pro 13 M1 A2338"). The normaliseModel() function handles this.

## Testing

Run: `node buy-box-check.js --auto-bump --dry-run`

Verify:
1. Listings matched to profitability lookup show real costs in output
2. Bump decisions use real margin, not Monday totalFixedCost
3. Unprofitable listings are blocked from bumping
4. Summary shows real data coverage %
