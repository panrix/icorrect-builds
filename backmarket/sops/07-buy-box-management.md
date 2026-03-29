# SOP 7: Buy Box Management

## Overview
Monitor live listings' buy box position and adjust prices to win while maintaining profitability. Uses stored Total Fixed Cost from listing time to avoid recalculating from Monday every check.

## Trigger
- Weekly cron (Monday 05:00 UTC via `run-weekly.sh`: V7 scraper → buy box check → sheet sync)
- On-demand when requested

## Flow

### Step 1: Get all active listings
- `GET /ws/listings` paginated
- Filter for `quantity > 0`

### Step 2: For each active listing, confirm live variant integrity
- Read the live listing `product_id`
- Cross-reference `product_id` against `backmarket/data/bm-catalog.json`
- The catalog is the resolver of record for live variant identity
- Compare catalog variant against the linked Monday item:
  - colour: Main Board `status8` vs catalog `colour` (normalized)
  - grade: Main Board `status_2_Mjj4GJNQ` vs live listing grade (mapped to BM grade)
- If `product_id` is missing from the catalog, the catalog variant is not `verified`, colour mismatches, or grade mismatches:
  - flag as critical
  - set BM listing `quantity` to `0` immediately
  - alert BM Telegram

### Step 2b: Live grade ladder scrape

Before checking buy box prices, scrape BM product pages for live grade/spec pricing.

- Resolve each listing's `product_id` to a product page URL via `bm-catalog.json`
- Deduplicate: one scrape per unique `product_id` (multiple listings may share a product page)
- Extract from `__NUXT_DATA__`: Fair / Good / Excellent lowest prices for that model + spec + colour
- Also extract adjacent storage tier prices (e.g. if selling 256, also pull 512 pricing)
- Delay 200-300ms between scrape calls
- Uses shared V7 scraper module (`scripts/lib/v7-scraper.js`)
- Uses batch browser session (one browser launch, multiple pages) for efficiency

**Non-blocking:** If scrape fails for a product, proceed with stale file data (`sell-prices-latest.json`). Log the failure.

**CLI flag:** `--no-scrape` skips all product page scrapes (for fast runs / debugging).

Scraped grade prices replace the approximate model-level data from `sell-prices-latest.json` in Steps 5, 9, and 11.

### Step 3: Check buy box
- `GET /ws/backbox/v1/competitors/{listing_uuid}` (UUID from `listing.id`, NOT the numeric listing_id)
- Returns: `is_winning`, `price_to_win`, competitor prices

### Step 4: If winning
- No action needed
- Log: listing_id, current price, status "winning"

### Step 5: If not winning
- Read `price_to_win` from backbox API
- Calculate proposed new price = `price_to_win`
- Calculate `min_price = ceil(proposed × 0.97)` (3% floor)

### Step 6: Profitability check at new price
- Read `numeric_mm1mgcgn` (Total Fixed Cost) from BM Devices Board
  - This was written at listing time (SOP 6) and includes: purchase + parts + labour + shipping + BM buy fee
  - With `--recalc`: pulls fresh parts + labour from Main Board and recalculates. Writes corrected value back to Monday if different. Use when parts/labour may have changed after listing (e.g. extra repair work).
- Calculate at min_price:
  ```
  bm_sell_fee = min_price × 0.10
  vat = (min_price - purchase) × 0.1667  (if positive)
  net_profit = min_price - bm_sell_fee - fixed_cost - vat
  net_margin = net_profit / min_price × 100
  ```
- Note: purchase price is needed for VAT calc. Read from `numeric` on BM Devices Board (already cached from listing time).

**Profitability gates (with `--auto-bump`):**
| Net Margin (at min) | Net Profit (at min) | Action |
|---------------------|---------------------|--------|
| ≥ 30% | ≥ £50 | Auto-bump (silent) |
| 15-30% | ≥ £50 | Auto-bump + flag to BM Telegram |
| < 15% | any | DO NOT bump. Flag "cannot win profitably" |
| any | < £50 | DO NOT bump. Flag "net too low at win price" |
| any | < £0 | Flag "loss at buy box price", show break-even |

### Step 7: Apply price change (if profitable)
- `POST /ws/listings/{listing_id}` with new price, min_price, `pub_state: 2`, `currency: "GBP"`
- Must be POST, not PATCH
- Verify: `GET /ws/listings/{listing_id}` confirms new price

### Step 8: Age-based escalation
- Match listing to Monday item via `text_mkyd4bx3` (listing ID) on BM Devices Board
- Read `date_mkq385pa` (Date Listed) from Main Board

| Days Listed | Condition | Action |
|-------------|-----------|--------|
| 0-7 | Not winning | Monitor only |
| 8-14 | Not winning | Flag to BM Telegram |
| 15-21 | Not winning | Flag "drop to market if profitable" |
| 21+ | Not winning | Flag "consider delisting" |

### Step 9: Grade ladder integrity check
- Use live scrape grade prices from Step 2b (spec-accurate, not approximate model-level data)
- For each model+spec: verify Fair < Good < Excellent
- Flag inversions immediately to BM Telegram
- A grade inversion means the listing won't convert (buyer picks better grade at same/lower price)
- If live scrape was unavailable, fall back to `sell-prices-latest.json` (approximate)

### Step 10: Quantity verification
- Cross-check listing qty against Monday
- If listing qty > 0 but no physical unit in Monday: set qty to 0 immediately (oversell risk)
- If physical unit exists but listing qty = 0: flag for relisting

### Step 11: Report

Post per-listing alert cards and run summary to BM Telegram (`-1003888456344`).

**Per-listing card formats:**

Not winning — bump eligible:
```
⚠️ Not winning: MacBook Air M1 8/256 Space Grey Good
BM#: 1234567 | Listed: 12 days
Our price: £449 | Buy box: £419

Market:  Fair £369 | Good £419 | Excellent £499
Net@win: £121 (28.8%) | Net@current: £141 (31.4%)

Action: Bump eligible (15-30% tier) — flagged for review
```

Not winning — cannot win profitably:
```
🚫 Cannot win profitably: MacBook Pro 14 M3 Pro 18/512 Space Black Good
BM#: 7654321 | Listed: 9 days
Our price: £1,299 | Buy box: £1,149

Market:  Fair £999 | Good £1,149 | Excellent £1,349
Net@win: £84 (7.3%) — below 15% floor
Break-even price: £1,198

Action: No change. Monitor.
```

Winning:
```
✅ Winning: MacBook Air M2 8/256 Midnight Good
BM#: 1234567 | Price: £499 | Net: £167 (34.5%)
Market:  Fair £389 | Good £479 | Excellent £549
```

**Card rules:** All fields are mandatory. If data is unavailable, output `N/A` — do not silently drop the field. Market prices come from Step 2b live scrape where available.

**Run summary includes:**
  - Total active / winning / losing count
  - Bumps applied count
  - Variant mismatches auto-offlined
  - Unprofitable listings count
  - Grade inversions found
  - Qty mismatches (auto-offlined)
  - Missing cost data count
  - Stale listings (21+ days)
  - API errors
  - Per-alert detail (capped at 10)

## Columns used

### BM Devices Board (3892194968)
| Column ID | Title | Purpose |
|-----------|-------|---------|
| `numeric_mm1mgcgn` | Total Fixed Cost | Written at listing time; purchase + parts + labour + shipping + BM buy fee |
| `numeric` | Purchase Price (ex VAT) | Needed for VAT margin scheme calc |
| `text_mkyd4bx3` | BM Listing ID | Links listing to Monday item |

### Main Board (349212843)
| Column ID | Title | Purpose |
|-----------|-------|---------|
| `date_mkq385pa` | Date Listed (BM) | For age-based escalation |
| `status8` | Colour | Expected device colour for live variant verification |
| `status_2_Mjj4GJNQ` | Final Grade | Expected grade for live listing verification |

### Catalog
| Source | Purpose |
|--------|---------|
| `backmarket/data/bm-catalog.json` | Resolver of record for live `product_id -> variant` verification |

## BM API endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ws/listings` | GET | List all our listings |
| `/ws/listings/{listing_id}` | POST | Update price |
| `/ws/backbox/v1/competitors/{listing_uuid}` | GET | Buy box status + price to win (uses UUID, not numeric listing_id) |

## Error handling
- Backbox API returns 404: listing may have been removed by BM. Flag and skip.
- BM returns HTML: rate limited. Retry after delay.
- Total Fixed Cost is empty/zero: cannot assess profitability. Flag and skip (do not bump blindly).
- Monday lookup fails: flag and skip.

## What does NOT happen
- No bumps below profitability floor
- No delisting without Ricky approval
- No price changes without profitability check
- No bumps on listings with missing Total Fixed Cost
- No listing may remain active if live variant verification fails

## Notifications
- All alerts go to BM Telegram group (`-1003888456344`)
- NOT Slack #general

## Implementation

**Script:** `backmarket/scripts/buy-box-check.js`

```bash
node scripts/buy-box-check.js                        # Check only (no price changes)
node scripts/buy-box-check.js --auto-bump             # Check + apply profitable bumps
node scripts/buy-box-check.js --auto-bump --recalc    # Bump + recalculate costs from Monday live data
node scripts/buy-box-check.js --compare-profitability  # Show real vs estimated costs
node scripts/buy-box-check.js --no-scrape             # Skip live product page scrapes (fast mode)
```

Note: `buy_box_monitor.py` in `buyback-monitor/` is the old Python version. The JS script above is the current implementation.

---

## QA Notes (2026-03-28)

This section records QA of SOP 7 against the active script at `backmarket/scripts/buy-box-check.js`.

### Findings

No blocking mismatches remain between the SOP body and the active script.

Current non-blocking notes:

1. **RESOLVED — Grade ladder now uses live spec-accurate scrape data**

~~For some listings, grade-price comparison still comes from approximate model-level scraper matching rather than a fully spec-specific source.~~

Fixed: Step 2b now scrapes live grade prices per unique `product_id` from the BM product page. Falls back to `sell-prices-latest.json` only when scrape fails.

2. **LOW — Real profitability lookup is an implementation bonus**

The script can optionally use `buyback-profitability-lookup.json` to compare real historical costs/profitability, but this is an enhancement beyond the core SOP flow.

3. **LOW — No explicit `--dry-run` flag**

Running without `--auto-bump` is effectively check-only, but there is no named `--dry-run` flag.

### Check Summary

| Check | Status | Notes |
|------|--------|-------|
| Does every SOP step match the script? | PASS | SOP body now matches the current implementation |
| Does SOP 7 re-verify live colour and grade? | PASS | Script now cross-checks live `product_id` against `bm-catalog.json`, compares catalog colour to Main Board colour, and compares live grade to Main Board Final Grade |
| Are profitability gates correct? | PASS | Tiered gate matches script: `>=30% + £50` silent bump, `15-30% + £50` bump+flag, `<15%` block, `<£50` block |
| Does backbox use UUID not numeric listing_id? | PASS | Uses `listing.id` |
| Does `--auto-bump` respect all three margin tiers? | PASS | Implemented in bump logic and alert behavior |
| Does variant mismatch auto-offline work? | PASS | Critical colour/grade/catalog mismatches are auto-offlined before bump logic proceeds |
| Does qty mismatch auto-offline work? | PASS | Active listing with non-Listed Monday status is auto-offlined |
| Does Telegram report fire and include alerts? | PASS | Summary always sends, alerts append when present |
| Is age escalation logic correct? | PASS | Thresholds are 8/15/21 days and align with the SOP |
| Are column IDs correct? | PASS | SOP column list now matches the fields used in the script |
| Any dead code or stale references? | PASS | No blocking dead path or stale operational reference found |

### Confirmed Behaviors

- **Step 1:** Active listings are fetched from `GET /ws/listings` and filtered to `quantity > 0`.
- **Step 2:** Live listing `product_id` is cross-checked against `bm-catalog.json`, then compared to Main Board colour and Final Grade.
- **Step 3:** Backbox call uses `listing.id` UUID, not numeric `listing_id`.
- **Step 5:** Cost data comes from BM Devices `numeric_mm1mgcgn` + `numeric`, with VAT margin-scheme treatment.
- **Step 6:** `--auto-bump` only bumps when profitability passes.
- **Step 8:** Age escalation thresholds in code are `8`, `15`, and `21` days.
- **Step 10:** Qty mismatch can auto-offline the listing by setting BM quantity to `0`.
- **Step 11:** Telegram summary is sent after every run, with appended alerts when present.

### Known Remaining Gaps (documented, non-blocking)

- ~~Grade check in status assessment still uses approximate scraper prices for some listings.~~ RESOLVED: live scrape now provides spec-accurate prices.
- Real profitability lookup is an extra implementation feature, not a core SOP requirement.
- No explicit `--dry-run` flag, but running without `--auto-bump` is effectively check-only.

### Syntax Check

`node --check backmarket/scripts/buy-box-check.js` passed during QA.
