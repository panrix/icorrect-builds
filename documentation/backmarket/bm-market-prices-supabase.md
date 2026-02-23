# Build Spec: BM Daily Market Price Scraping — Supabase

**Requested by:** Ricky  
**Date:** 2026-02-23  
**Companion to:** `bm-price-history-supabase.md` (our sale prices — what WE sold for)  
**Purpose:** Scrape Back Market product pages daily for top 20 models/SKUs and store market prices in Supabase. Enables the agent to query historical market pricing without hitting BM live on every request. Builds seasonality data over time.

---

## Overview

Two separate concerns, two separate tables:

| Table | What it stores |
|-------|---------------|
| `bm_sale_prices` | What iCorrect sold for (from orders/Monday) — built in companion spec |
| `bm_market_prices` | What the BM market charges today (scraped daily from BM product pages) |

---

## Scraping Method

**Tool:** Massive/ClawPod (residential proxy, JS rendering)

```bash
curl --proto '=https' -s -G \
  --data-urlencode "url={BM_PRODUCT_PAGE_URL}" \
  -H "Authorization: Bearer $MASSIVE_TOKEN" \
  "https://unblocker.joinmassive.com/browser"
```

`MASSIVE_TOKEN` is stored in `/home/ricky/config/api-keys/.env`.

**What to extract per product page:**

Parse `<script id="__NUXT_DATA__">` JSON blob. Extract string values matching `^\d{3,4}\.\d{2}$` (GBP price format) with surrounding context to identify grade.

**Grade identification from NUXT context:**
- Context contains "Fair" / "sublabel" near a price → Fair grade price
- Context contains "Good" → Good grade price  
- Context contains "Excellent" → Excellent grade price
- Also extract adjacent spec prices (e.g. 256GB vs 512GB on same page)

> ⚠️ Do NOT use the JSON-LD `offers.price` — this reflects the current cheapest seller (may be iCorrect's own listing). Always use `__NUXT_DATA__` for grade-specific prices.

---

## Top 20 SKUs to Scrape Daily

| Priority | Device | Canonical Key Pattern | BM Product UUID |
|----------|--------|----------------------|-----------------|
| 1 | MBA M1 8/256 Grey | `MBA.M1.8GB.256GB.*` | `b5ebc79d-0304-41a6-b1ae-d2a487afa11f` |
| 2 | MBA M1 8/512 Grey (7-core GPU) | `MBA.M1.8GB.512GB.*` | `f91ab739-adbf-4600-874e-4f1e93a8b02c` |
| 3 | MBA M1 8/512 Grey (8-core GPU) | `MBA.M1.8GB.512GB.*` | `1b212f6d-aa05-4b8d-802d-c633845d7f9d` |
| 4 | MBP M1 8/256 Grey | `MBP.M1.8GB.256GB.*` | `00e60dbb-24fc-4061-9d6f-228410f5a22e` |
| 5 | MBP M2 8/256 Grey | `MBP.M2.8GB.256GB.*` | `ef20e8dd-bcbf-4d94-8933-15f59560b9b9` |
| 6 | MBP Intel A2289 8/256 | `MBP.Intel.8GB.256GB.*` | `d34c17e5-b7e6-4fc9-957f-a35b36b5affa` |
| 7 | MBP Intel A2289 8/1TB | `MBP.Intel.8GB.1TB.*` | `1e646c25-5397-4ff3-9301-1c9adc23e752` |
| 8 | MBP16 M1Pro 16/512 | `MBP.M1Pro.16GB.512GB.*` | `34eca29e-4561-47ea-b437-0447e0d9bfc9` |
| 9 | MBP16 M1Pro 16/1TB | `MBP.M1Pro.16GB.1TB.*` | `a568a334-bc60-42a4-bc12-1f4298ead6de` |
| 10 | MBP16 M1Pro 32/1TB | `MBP.M1Pro.32GB.1TB.*` | `fd952460-3579-4891-9d9a-e4302041000c` |
| 11 | MBP14 M1Pro 16/512 | `MBP.M1Pro.16GB.512GB.*` | `0a874283-87fa-4f20-bb0b-527cfbaf60bb` |
| 12 | MBP14 M2Pro 16/512 | `MBP.M2Pro.16GB.512GB.*` | `971d112f-19a2-434b-982a-e393399d9fd9` |
| 13 | MBP14 M3Pro 18/512 Silver | `MBP.M3Pro.18GB.512GB.*` | `946234a9-c96f-417e-a926-51e88c732b47` |
| 14 | MBP14 M3Pro 18/1TB | `MBP.M3Pro.18GB.1TB.*` | `ff73c7ad-8858-46ff-a624-44c9e9421d3d` |
| 15 | MBA M1 16/512 Grey | `MBA.M1.16GB.512GB.*` | *(discover via category scrape)* |
| 16-20 | *(to be added as inventory grows)* | | |

> Add new product UUIDs to this table as new device types enter inventory.

---

## Supabase Schema

```sql
CREATE TABLE bm_market_prices (
  id              BIGSERIAL PRIMARY KEY,
  canonical_key   TEXT NOT NULL,           -- e.g. "MBA.M1.8GB.256GB"  (no grade — stored per row)
  product_uuid    TEXT NOT NULL,           -- BM product page UUID
  grade           TEXT NOT NULL,           -- Fair, Good, Excellent
  price           NUMERIC(10,2),           -- scraped GBP price (null if sold out / not listed)
  is_sold_out     BOOLEAN DEFAULT FALSE,   -- true if grade shows no sellers
  scraped_at      TIMESTAMPTZ NOT NULL,    -- when the scrape ran
  scrape_date     DATE NOT NULL,           -- date only (for daily dedup)
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one row per product + grade per day
CREATE UNIQUE INDEX idx_market_price_daily 
  ON bm_market_prices (product_uuid, grade, scrape_date);

-- Query indexes
CREATE INDEX idx_market_canonical ON bm_market_prices (canonical_key, grade);
CREATE INDEX idx_market_date ON bm_market_prices (scrape_date DESC);
```

---

## Daily Scrape Script

**Schedule:** Run daily (suggested 06:00 UTC — before UK market opens)

**Logic per product:**
1. Fetch product page HTML via ClawPod
2. Parse `__NUXT_DATA__` for grade-specific prices (Fair / Good / Excellent)
3. For each grade: upsert into `bm_market_prices` (update if row for today exists, insert if not)
4. Log result: product, grades found, prices captured

**Error handling:**
- If ClawPod returns empty/error: log and skip — do not insert null row
- If a grade shows 0 sellers: insert with `is_sold_out = TRUE, price = NULL`
- Credit usage: ~1 credit per page. 20 pages/day = 20 credits/day = ~50 days on 1,000 credit plan. Plan upgrade expected.

---

## Key Query Patterns (for agent use)

```sql
-- Today's prices for a specific spec across all grades
SELECT grade, price, is_sold_out
FROM bm_market_prices
WHERE canonical_key = 'MBA.M1.8GB.256GB'
  AND scrape_date = CURRENT_DATE
ORDER BY grade;

-- Price trend for Fair grade over last 30 days
SELECT scrape_date, price
FROM bm_market_prices
WHERE canonical_key = 'MBA.M1.8GB.256GB'
  AND grade = 'Fair'
  AND scrape_date > CURRENT_DATE - INTERVAL '30 days'
ORDER BY scrape_date;

-- All specs where Fair price dropped >10% vs 30 days ago (tank detection)
SELECT 
  canonical_key,
  today.price AS today_price,
  month_ago.price AS month_ago_price,
  ROUND((today.price - month_ago.price) / month_ago.price * 100, 1) AS pct_change
FROM bm_market_prices today
JOIN bm_market_prices month_ago 
  ON today.canonical_key = month_ago.canonical_key
  AND today.grade = month_ago.grade
WHERE today.scrape_date = CURRENT_DATE
  AND month_ago.scrape_date = CURRENT_DATE - INTERVAL '30 days'
  AND today.grade = 'Fair'
  AND (today.price - month_ago.price) / month_ago.price < -0.10
ORDER BY pct_change;
```

---

## Credentials Required

| Variable | Used for |
|----------|---------|
| `MASSIVE_TOKEN` | ClawPod API (`a1-MYS5t5KPNLY0WmRt4tBQwBApNPOliNEp`) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |

All stored at `/home/ricky/config/api-keys/.env`.

---

## Deliverables

1. Supabase table `bm_market_prices` created with schema above
2. Daily scrape script — fetches all 20 product pages, parses NUXT data, upserts to Supabase
3. Cron job configured at 06:00 UTC daily
4. Output log per run: pages scraped, prices captured, errors
5. Verification: query showing 3 rows (Fair/Good/Excellent) for at least one product after first run

---

## Note on Ownership

> This document provides context and requirements. The technical implementation spec should be written by Code based on the architecture decisions made during the build. 

## Sub-Agent Architecture (Backmarket)

Once the Supabase tables are live, a dedicated daily pricing sub-agent will:

1. **Run daily market scrape** — top 20 SKUs via ClawPod → upsert to `bm_market_prices`
2. **Run pricing optimisation** — check all active BM listings against Supabase data
3. **Identify price changes needed** — too high (not winning BackBox), too low (leaving money on table), broken min_price configs, cross-grade inversions
4. **Escalate to Backmarket agent** — not directly to Ricky. The BM agent reviews, curates, and presents to Ricky for approval.

**Flow:**  
`Daily sub-agent → findings → BM agent → curated report → Ricky approval → BM agent applies`
