# BM Pricing Module — Build Plan

**Date:** 2026-02-14
**Status:** Planning
**Scraping:** Massive/ClawPod (stealth proxy) now, Massive Unblocker when available

---

## Purpose

When listing a device on Back Market, determine the optimal price by:
1. Checking live competitor prices across all grades (Fair/Good/Excellent)
2. Checking variant prices (storage, RAM, colour)
3. Comparing against our historical sales
4. Detecting market floods/dumps
5. Recommending a price or flagging for manual review

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  PRICE CHECK REQUEST                 │
│  Input: SKU, Grade, Cost Price, Product UUID/URL     │
└─────────────┬───────────────────────────────────────┘
              │
    ┌─────────▼─────────┐
    │  1. MARKET DATA   │
    │  (parallel calls)  │
    └─────────┬─────────┘
              │
   ┌──────────┼──────────────┐
   │          │              │
   ▼          ▼              ▼
┌──────┐  ┌──────────┐  ┌────────────┐
│BackBox│  │Massive/ClawPod│  │Monday Sales│
│ API   │  │(BM page)  │  │(historical)│
└──┬───┘  └─────┬────┘  └─────┬──────┘
   │            │              │
   │ price_to_  │ Fair/Good/   │ Last 5 sales
   │ win,       │ Excellent    │ of same SKU,
   │ is_winning │ prices,      │ avg price,
   │            │ variants,    │ days to sell
   │            │ sold_out     │
   └────────────┼──────────────┘
                │
      ┌─────────▼─────────┐
      │  2. PRICE ENGINE   │
      └─────────┬─────────┘
                │
      ┌─────────▼─────────┐
      │  3. DECISION       │
      │  - Set price       │
      │  - Hold (flag)     │
      │  - Alert (flood)   │
      └───────────────────┘
```

---

## Data Sources

### 1. BackBox API (free, instant)
- **Endpoint:** `GET /ws/backbox/v1/competitors/{listing_uuid}`
- **Returns:** price_to_win, winner_price, is_winning
- **Limitation:** Only works for listings we already own
- **Cost:** 2 req/sec, no credit cost

### 2. Massive/ClawPod (paid, ~10s)
- **Endpoint:** `https://app.Massive/ClawPod.com/api/v1/`
- **Params:** `render_js=true&wait=3000` (minimum for BM Cloudflare)
- **Returns:** Full product page HTML → parse for grade/variant prices
- **Cost:** 10 credits/request (JS render). 840 credits remaining.
- **Budget:** ~84 scrapes remaining. At 5 SKUs/day = ~17 days.
- **Upgrade path:** Massive Unblocker when token arrives

### 3. Monday.com Historical Sales
- **Board:** 3892194968 (BM Board)
- **Query:** Items in "Shipped" group with same/similar SKU
- **Returns:** Purchase price, sale price, date sold
- **Cost:** Free (API calls)

### 4. Price History DB (TO BUILD)
- Store daily prices per SKU in a JSON/CSV file or Google Sheet
- Track: date, SKU, Fair price, Good price, Excellent price, our price
- Use for trend detection and flood alerts

---

## Massive/ClawPod Scrape Strategy

### Request Config
```bash
curl -s --max-time 45 \
  "https://app.Massive/ClawPod.com/api/v1/?api_key=${Massive/ClawPod_KEY}&url=${ENCODED_URL}&render_js=true&wait=3000"
```

### What We Extract From BM Product Page
1. **JSON-LD block** → Product name, BuyBox price, rating, review count
2. **Grade prices** → Fair, Good, Excellent (+ sold out status)
3. **Storage variants** → 128GB, 256GB, 512GB, 1TB, 2TB with prices
4. **RAM variants** → 8GB, 16GB, 24GB, 32GB, 64GB with prices
5. **Colour variants** → Grey, Silver, Gold, Midnight, Starlight with prices
6. **Battery options** → Standard/New battery with prices

### URL Format
```
https://www.backmarket.co.uk/en-gb/p/{product-slug}/{product-uuid}?l=12
```
- `?l=12` = listing condition filter (12=Fair, 11=Good, 10=Excellent)
- Without `?l=` shows the BuyBox winner

### Credit Budget Plan
- **Per listing check:** 1 scrape = 10 credits (get all grades from one page)
- **Daily price tracking:** 5-10 top SKUs = 50-100 credits/day
- **On-demand:** When listing a new device = 10 credits
- **Monthly budget:** 1,000 credits = ~100 scrapes = ~20 days of tracking

---

## Price Engine Logic

### Inputs
```json
{
  "sku": "MBA.A2941.8C.10G.8GB.256GB.Grey.Good",
  "grade": "Good",
  "cost": 172,
  "backbox": { "price_to_win": 710, "is_winning": true },
  "scraped": {
    "fair": 620,
    "good": 700,
    "excellent": 820,
    "fair_sold_out": false,
    "good_sold_out": false
  },
  "historical": {
    "avg_sale_price": 706,
    "last_5_sales": [712, 703, 700, 700, 710],
    "avg_days_to_sell": 4
  }
}
```

### Decision Rules

#### Rule 1: Floor Price
```
floor = cost / 0.54   (accounts for 10% BM fee + 40% margin target)
```
Never price below floor. If all market signals are below floor → HOLD, flag for review.

#### Rule 2: Grade Sanity
```
IF our_grade == Good:
  price MUST be > fair_price
  price SHOULD be < excellent_price
  IF price < fair_price → ALERT: we're under-selling
```

#### Rule 3: Historical Anchor
```
IF historical_avg exists AND sample >= 3:
  IF market_price < historical_avg * 0.85 → POSSIBLE FLOOD
    → Flag for review, don't auto-list
  IF market_price > historical_avg * 1.15 → PRICE INCREASE
    → Set at market_price (ride the wave)
  ELSE → Set at MAX(market_price, historical_avg)
```

#### Rule 4: Flood Detection
```
IF price_to_win dropped > 15% vs 7-day average → FLOOD ALERT
  → HOLD listing, notify Ricky
  → "Market may be flooded. {SKU} price_to_win dropped from £X to £Y"
```

#### Rule 5: Sold Out Opportunity
```
IF our_grade is sold_out on BM (no other sellers):
  → Price at historical_avg + 10% (scarcity premium)
  → Don't undercut yourself when you're the only option
```

#### Rule 6: Adjacent Spec Check
```
IF 256GB Good at £700, but 512GB Good at £720:
  → Flag: "Small price gap between 256/512 — consider holding 256 or pricing higher"
  → Buyers who don't care about storage will pick the cheaper one
```

### Output
```json
{
  "recommended_price": 710,
  "price_source": "BackBox price_to_win, validated by historical avg (£706)",
  "confidence": "HIGH",
  "action": "LIST",
  "alerts": [],
  "grade_context": {
    "fair": "£620 (we'd be 14% above)",
    "excellent": "£820 (we're 13% below)"
  },
  "margin": {
    "revenue": 710,
    "bm_fee": -71,
    "cost": -172,
    "profit": 467,
    "margin_pct": "65.8%"
  }
}
```

---

## Implementation Phases

### Phase 1: On-Demand Price Checker (NOW)
- Script that takes a SKU/product UUID
- Pulls BackBox + Massive/ClawPod + Monday historical
- Returns pricing recommendation
- Run manually before listing each device
- **Effort:** 2-3 hours

### Phase 2: Price History Tracking (WEEK 1)
- Daily cron job scrapes top 10 SKUs
- Stores prices in `/data/price-history.json`
- Tracks 30-day price trends per SKU
- **Effort:** 1-2 hours

### Phase 3: Flood Detection (WEEK 2)
- Compare today's prices vs 7-day/30-day average
- Alert when price drops > 15%
- Alert when a SKU suddenly has 5+ sellers (flooding)
- **Effort:** 1 hour

### Phase 4: Auto-Listing Integration (WEEK 3)
- Replace Flow 5 with new listing module
- Uses price engine for every listing
- Hold/flag option instead of always listing
- Daily reconciliation (Monday = BM count)
- **Effort:** 4-6 hours

### Phase 5: Massive Unblocker Migration
- Swap Massive/ClawPod calls for Massive API
- More reliable, potentially cheaper
- Same parsing code, different fetch layer
- **Effort:** 30 minutes

---

## Top SKUs to Track (based on current inventory + historical volume)

| SKU Pattern | Device | Priority |
|-------------|--------|----------|
| MBP.A2338.M1.8GB.256GB.*.* | MBP 13" M1 | HIGH (most common) |
| MBP.A2338.M2.8GB.*.*.* | MBP 13" M2 | HIGH |
| MBA.A2337.8GB.*.*.* | MBA 13" M1 | HIGH |
| MBP.A2442.16GB.512GB.*.* | MBP 14" M1 Pro | HIGH |
| MBA.A2941.*.*.*.*.* | MBA 15" M2 | MEDIUM |
| MBP.A2485.*.*.*.*.* | MBP 16" M1 Pro/Max | MEDIUM |
| MBA.A3113.*.*.*.*.* | MBA 13" M3 | MEDIUM |
| MBA.A3240.*.*.*.*.* | MBA 13" M4 | LOW (new, less data) |

---

## Files & Locations

| File | Purpose |
|------|---------|
| `scripts/price-check.sh` | On-demand price checker |
| `scripts/price-scrape.py` | Massive/ClawPod scraper + parser |
| `data/price-history.json` | Daily price tracking data |
| `data/sku-product-map.json` | SKU → BM product UUID mapping |
| `docs/pricing-module-plan.md` | This document |
