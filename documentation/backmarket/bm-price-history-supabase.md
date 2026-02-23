# Build Spec: BM Price History — Supabase

**Requested by:** Ricky  
**Date:** 2026-02-23  
**Purpose:** Store historical Back Market sale prices by device spec so we can track market trends, detect price tanking, and make better pricing decisions at listing time.

---

## Overview

Pull all historical Back Market sales data from Monday.com BM board, normalise to a canonical device spec key, and store in Supabase. Ongoing inserts should fire after every new confirmed sale.

---

## Data Source — Monday.com BM Board

**Board ID:** `3892194968`  
**Groups to pull from:** BM To List / Listed / Sold group (`new_group`) — filter for sold items only (where buyer name field `text4` is populated AND order ID field `text_mkye7p1c` is populated).

**Fields to extract per Monday item:**

| Monday Column ID | Field | Notes |
|-----------------|-------|-------|
| `name` | BM number | e.g. "BM 1337" |
| `text89` | Raw SKU | e.g. `MBA.A2337.M1.8GB.256GB.Grey.Fair` |
| `lookup` | Device model (mirror) | e.g. "MacBook Air 13 M1 A2337" |
| `status__1` | RAM | e.g. "8GB" |
| `color2` | Storage | e.g. "256GB" |
| `status7__1` | CPU cores | e.g. "8-Core" |
| `status8__1` | GPU cores | e.g. "8-Core" |
| `mirror` | Colour (mirror) | e.g. "Space Grey" |
| `mirror_Mjj4H2hl` | Grade (mirror) | e.g. "Fair" |
| `text_mkye7p1c` | BM Sale Order ID | Numeric order ID |
| `text_mkyd4bx3` | BM Listing ID | Numeric listing ID |
| `text4` | Buyer name | Presence confirms item is sold |

**Monday GraphQL API:**
```
POST https://api.monday.com/v2
Authorization: {MONDAY_API_TOKEN}
Content-Type: application/json
```

**Mirror columns require inline fragment in GraphQL:**
```graphql
column_values {
  id
  text
  ... on MirrorValue { display_value }
}
```

---

## Sale Price + Date — BM API

For each sold item, use the BM Order ID to fetch the actual sale price and date.

**Endpoint:**
```
GET https://www.backmarket.co.uk/ws/orders/{order_id}
Authorization: {BACKMARKET_API_AUTH}
Accept-Language: en-gb
```

**Fields to extract:**
- `date_creation` → sale date
- `order_lines[0].listing_price` → sale price (GBP)

> Note: Some older orders may return 404 if BM has archived them. In that case, insert the row with `sale_price = NULL` and `sale_date = NULL` — do not skip the row entirely.

---

## Canonical Spec Key

Normalise each device into a canonical key for grouping history across listing migrations:

```
{DeviceType}.{Chip}.{RAM}.{Storage}.{Grade}
```

**Examples:**
- `MBA.M1.8GB.256GB.Fair`
- `MBA.M1.8GB.512GB.Good`
- `MBP.M1.8GB.256GB.Fair`
- `MBP.M1Pro.16GB.512GB.Fair`
- `MBP.M2Pro.16GB.512GB.Fair`
- `MBP.M3Pro.18GB.512GB.Good`
- `MBP.Intel.8GB.256GB.Fair`

**Colour is excluded** from the canonical key — prices do not vary by colour.

**Normalisation rules:**

| Source field | Mapping |
|-------------|---------|
| Model contains "MacBook Air" | DeviceType = `MBA` |
| Model contains "MacBook Pro" | DeviceType = `MBP` |
| Model contains "M1 Pro" / CPU = "10-Core" or "12-Core" with Pro | Chip = `M1Pro` |
| Model contains "M2 Pro" | Chip = `M2Pro` |
| Model contains "M3 Pro" | Chip = `M3Pro` |
| Model contains "M1 Max" | Chip = `M1Max` |
| Model contains "M1" (no Pro/Max) | Chip = `M1` |
| Model contains "M2" (no Pro/Max) | Chip = `M2` |
| Model contains "M3" (no Pro/Max) | Chip = `M3` |
| Model contains "Intel" | Chip = `Intel` |
| RAM = "8GB" | RAM = `8GB` |
| RAM = "16GB" | RAM = `16GB` |
| RAM = "32GB" | RAM = `32GB` |
| Storage = "256GB" | Storage = `256GB` |
| Storage = "512GB" | Storage = `512GB` |
| Storage = "1TB" or "1000GB" | Storage = `1TB` |
| Storage = "2TB" or "2000GB" | Storage = `2TB` |
| Grade mirror = "Fair" | Grade = `Fair` |
| Grade mirror = "Good" | Grade = `Good` |
| Grade mirror = "Excellent" or "Very Good" | Grade = `Excellent` |

---

## Supabase Schema

```sql
CREATE TABLE bm_price_history (
  id              BIGSERIAL PRIMARY KEY,
  bm_number       TEXT NOT NULL,           -- e.g. "BM 1337"
  canonical_key   TEXT NOT NULL,           -- e.g. "MBA.M1.8GB.256GB.Fair"
  device_type     TEXT,                    -- MBA / MBP
  chip            TEXT,                    -- M1, M2, M1Pro, M2Pro, Intel etc.
  ram_gb          INTEGER,                 -- 8, 16, 18, 32
  storage_gb      INTEGER,                 -- 256, 512, 1000, 2000
  grade           TEXT,                    -- Fair, Good, Excellent
  colour          TEXT,                    -- Space Grey, Silver, Gold etc.
  sale_price      NUMERIC(10,2),           -- GBP sale price (nullable if BM order 404s)
  sale_date       DATE,                    -- from BM API date_creation (nullable if 404)
  listing_id      TEXT,                    -- numeric BM listing ID
  bm_order_id     TEXT,                    -- BM order ID
  raw_sku         TEXT,                    -- original SKU as stored on listing
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_canonical_key ON bm_price_history (canonical_key);
CREATE INDEX idx_sale_date ON bm_price_history (sale_date);
CREATE INDEX idx_chip_grade ON bm_price_history (chip, grade);
```

---

## Initial Data Load Script

1. Pull all items from Monday BM board group `new_group` where `text4` (buyer name) is non-empty AND `text_mkye7p1c` (order ID) is non-empty
2. For each item: call BM API to get sale price + date
3. Normalise to canonical key using rules above
4. Insert into `bm_price_history`
5. Log any items skipped or errored (don't silently fail)
6. Output: total rows inserted, total skipped, total errored

---

## Ongoing Updates

After every confirmed sale (BM order accepted, matched to a Monday BM board item), insert one row into `bm_price_history`. This should be triggered from the sales confirmation flow.

**Insert payload:**
```json
{
  "bm_number": "BM 1337",
  "canonical_key": "MBA.M1.8GB.256GB.Fair",
  "device_type": "MBA",
  "chip": "M1",
  "ram_gb": 8,
  "storage_gb": 256,
  "grade": "Fair",
  "colour": "Space Grey",
  "sale_price": 394.00,
  "sale_date": "2026-02-18",
  "listing_id": "4857996",
  "bm_order_id": "77520797",
  "raw_sku": "MBA.A2337.M1.8GB.256GB.Grey.Fair"
}
```

---

## Credentials Required

All credentials are stored at `/home/ricky/config/api-keys/.env`:

| Variable | Used for |
|----------|---------|
| `MONDAY_API_TOKEN` | Monday GraphQL API |
| `BACKMARKET_API_AUTH` | BM API (Basic auth header value) |
| `SUPABASE_URL` | Supabase project URL (to be added) |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (to be added) |

---

## Key Query Patterns (for agent reference)

```sql
-- Last 10 sale prices for a specific spec
SELECT sale_price, sale_date, bm_order_id
FROM bm_price_history
WHERE canonical_key = 'MBA.M1.8GB.256GB.Fair'
ORDER BY sale_date DESC
LIMIT 10;

-- Average sale price last 90 days per spec
SELECT canonical_key, ROUND(AVG(sale_price), 2) AS avg_price, COUNT(*) AS units_sold
FROM bm_price_history
WHERE sale_date > NOW() - INTERVAL '90 days'
  AND sale_price IS NOT NULL
GROUP BY canonical_key
ORDER BY canonical_key;

-- Market trend: is avg price this month lower than last month? (tank detection)
SELECT
  canonical_key,
  ROUND(AVG(CASE WHEN sale_date > NOW() - INTERVAL '30 days' THEN sale_price END), 2) AS avg_30d,
  ROUND(AVG(CASE WHEN sale_date BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days' THEN sale_price END), 2) AS avg_30_60d
FROM bm_price_history
WHERE sale_price IS NOT NULL
GROUP BY canonical_key
HAVING COUNT(*) >= 3
ORDER BY canonical_key;
```

---

## Deliverables

1. Supabase table created with schema above
2. Initial data load script (run once) — pulls all historical sold items from Monday + BM API
3. Single-row insert function for ongoing sales updates
4. Output log from initial load showing row counts
