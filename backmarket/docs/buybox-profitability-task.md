# Task: Fix Buyback Profitability Calculations

**For:** Claude Code
**Priority:** This week
**Repo:** panrix/icorrect-builds
**Script:** `/home/ricky/builds/buyback-monitor/buy_box_monitor.py` (1014 lines, Python)

---

## The Problem

Hugo's buybox script calculates whether a trade-in bid is profitable by estimating: "if we buy this device at £X, can we sell it for enough to make money?"

The calculation is mostly guesswork:

### What's estimated (should be real data):

1. **Sell price**: Uses V6 scraper grade prices, but these are BASE MODEL prices (e.g. 8GB/256GB) applied to ALL specs. A 16GB/1TB device gets the same sell price as a 8GB/256GB device. This is wrong by £100-300+.

2. **Parts cost**: Uses flat estimates by grade:
   - FUNC_CRACK: £120 (needs screen)
   - NONFUNC_USED: £50 (board work)
   - NONFUNC_CRACK: £170 (screen + board)
   - Default: £100
   
   Has a `parts-cost-lookup.json` for per-model overrides, but the data in it is sparse and unverified.

3. **Labour hours**: Flat estimates by grade:
   - FC: 2h, FU: 1h, FG: 1h, FE: 1h, NFU: 4h, NFC: 1.5h
   - Default: 2h
   
   No actual labour data from Monday.

### What's correct:
- **Buy price**: Real (from BM API)
- **BM fees**: 10% buy + 10% sell (correct)
- **Labour rate**: £24/hr (confirmed)
- **Shipping**: £15 (correct)
- **VAT**: (sell - buy) × 16.67% if positive (correct)

### The profit formula itself is right:
```python
profit = sell_price - buy_price - bm_buy_fee - bm_sell_fee - parts_cost - labour - shipping - tax
```

The inputs are wrong, not the formula.

---

## What Real Data We Have

### Actual sell prices (from our completed sales)
```
GET /ws/orders?state=9   # 1444 completed orders
```
Each order has: listing_id, price, date. We can calculate actual average sell price per model+spec+grade.

### Actual parts costs (from Monday)
Main Board column `formula_mkx1bjqr`: sum of all parts used per device. This is the REAL parts cost, not an estimate.

### Actual labour hours (from Monday)
Main Board column `formula__1`: total RR&D hours per device. Real tracked hours.

### Historical profitability (can be calculated)
For every device we've bought and sold through BM:
- Buy price (from BM Devices `numeric`)
- Sell price (from completed order)
- Parts cost (from Main Board formula)
- Labour hours (from Main Board formula)

We can calculate ACTUAL profit per device and aggregate by model+grade.

---

## What Code Should Build

### Step 1: Build a real profitability lookup

Script: `buyback-profitability-builder.js`

For each model+grade combination we've handled:

1. **Query completed BM orders** (state=9) for sell prices
2. **Match each order** to a BM Devices item via listing_id
3. **Get the linked Main Board item** via board_relation
4. **Read actual costs**: parts (formula_mkx1bjqr), labour (formula__1), purchase (numeric)
5. **Calculate actual profit per device**
6. **Aggregate**: avg sell price, avg parts cost, avg labour hours, avg profit per model+grade

Output: `buyback-profitability-lookup.json`
```json
{
  "A2338.8GB.256GB.FUNC_CRACK": {
    "model": "A2338",
    "spec": "8GB/256GB",
    "grade": "FUNC_CRACK",
    "sample_size": 15,
    "avg_buy_price": 85,
    "avg_sell_price": 405,
    "avg_parts_cost": 95,
    "avg_labour_hours": 2.3,
    "avg_labour_cost": 55,
    "avg_profit": 120,
    "avg_margin_pct": 29.6,
    "min_profit": 45,
    "max_profit": 195
  }
}
```

### Step 2: Update buy_box_monitor.py to use real data

Replace the three estimated inputs:

1. **Sell price**: Use actual average sell price from lookup. Fall back to V6 only when no sales data exists (new model/spec).

2. **Parts cost**: Use actual average parts cost from lookup. Fall back to flat estimate only when no data exists.

3. **Labour hours**: Use actual average labour hours from lookup. Fall back to grade-based estimate only when no data exists.

When using fallback (estimated) data, FLAG IT in the output:
```
MBA13.2020.M1.8GB.256GB.FUNC_CRACK
  Buy: £85 | Sell: £405 (actual, n=15) | Parts: £95 (actual) | Labour: 2.3h (actual)
  Profit: £120 | Margin: 29.6%

MBP16.2023.M3PRO.18GB.512GB.NONFUNC_USED
  Buy: £550 | Sell: £1464 (V6 estimate ⚠️) | Parts: £50 (flat estimate ⚠️) | Labour: 4h (estimate ⚠️)
  Profit: £508 | Margin: 34.7% ⚠️ LOW CONFIDENCE
```

### Step 3: Daily refresh

The profitability lookup should be rebuilt daily (or weekly) as new sales complete. More data = better averages.

Add to the daily cron: V6 scrape → profitability builder → buybox monitor → buy box check.

---

## Data Sources

### BM Orders API
```
GET https://www.backmarket.co.uk/ws/orders?state=9&page_size=100
Headers: Authorization, Accept-Language: en-gb, User-Agent
```
Paginate all. Each order has orderlines with listing_id and price.

### BM Buyback Orders API
```
GET https://www.backmarket.co.uk/ws/buyback/v1/orders?page_size=100
```
Trade-in orders with buy price, grade, model info.

### Monday.com
```
Board 3892194968 (BM Devices): numeric (purchase), text_mkyd4bx3 (listing_id), board_relation
Board 349212843 (Main Board): formula_mkx1bjqr (parts cost), formula__1 (labour hours)
```
Use `... on BoardRelationValue { linked_item_ids }` for board_relation.

### Current files
- V6 sell prices: `/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json`
- Parts cost lookup (sparse): `/home/ricky/builds/buyback-monitor/data/buyback/parts-cost-lookup.json`
- Hugo's script: `/home/ricky/builds/buyback-monitor/buy_box_monitor.py`

---

## What NOT to Change

- The profit formula itself is correct
- The fee rates (10% buy, 10% sell) are correct
- Labour rate (£24/hr) is confirmed
- Shipping (£15) is correct
- VAT calculation is correct
- The buybox competitor checking logic works fine
- The auto-bump logic works fine

Only change the INPUT DATA sources (sell price, parts cost, labour hours).

---

## Key Insight

We have 1,444 completed sales orders. Each one is a data point with a real sell price. Many of these can be matched back to Monday where we have real parts costs and labour hours. This is the data we need. Hugo's script was built before we had this pipeline; it used estimates because real data wasn't accessible. Now it is.

---

## Safety

- Don't change bump logic until profitability data is verified
- Run new profitability lookup in parallel with current estimates first
- Compare: where does the real data differ most from estimates?
- Report differences before switching over
- 2,603 buyback listings affected; wrong profitability = wrong bids = money lost
