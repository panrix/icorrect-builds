# SOP 7: Buy Box Management

## Overview
Monitor live listings' buy box position and adjust prices to win while maintaining profitability. Uses stored Total Fixed Cost from listing time to avoid recalculating from Monday every check.

## Trigger
- Daily cron (05:00 UTC via `run-daily.sh`: V6 scraper → buy box check → sheet sync)
- On-demand when requested

## Flow

### Step 1: Get all active listings
- `GET /ws/listings` paginated
- Filter for `quantity > 0`

### Step 2: For each active listing, check buy box
- `GET /ws/backbox/v1/competitors/{listing_uuid}` (UUID from `listing.id`, NOT the numeric listing_id)
- Returns: `is_winning`, `price_to_win`, competitor prices

### Step 3: If winning
- No action needed
- Log: listing_id, current price, status "winning"

### Step 4: If not winning
- Read `price_to_win` from backbox API
- Calculate proposed new price = `price_to_win`
- Calculate `min_price = ceil(proposed × 0.97)` (3% floor)

### Step 5: Profitability check at new price
- Read `numeric_mm1mgcgn` (Total Fixed Cost) from BM Devices Board
  - This was written at listing time (SOP 6) and includes: purchase + parts + labour + shipping + BM buy fee
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

### Step 6: Apply price change (if profitable)
- `POST /ws/listings/{listing_id}` with new price, min_price, `pub_state: 2`, `currency: "GBP"`
- Must be POST, not PATCH
- Verify: `GET /ws/listings/{listing_id}` confirms new price

### Step 7: Age-based escalation
- Match listing to Monday item via `text_mkyd4bx3` (listing ID) on BM Devices Board
- Read `date_mkq385pa` (Date Listed) from Main Board

| Days Listed | Condition | Action |
|-------------|-----------|--------|
| 0-7 | Not winning | Monitor only |
| 8-14 | Not winning | Flag to BM Telegram |
| 15-21 | Not winning | Flag "drop to market if profitable" |
| 21+ | Not winning | Flag "consider delisting" |

### Step 8: Grade ladder integrity check
- For each model+spec: verify Fair < Good < Excellent across our listings
- Flag inversions immediately to BM Telegram
- A grade inversion means the listing won't convert (buyer picks better grade at same/lower price)

### Step 9: Quantity verification
- Cross-check listing qty against Monday
- If listing qty > 0 but no physical unit in Monday: set qty to 0 immediately (oversell risk)
- If physical unit exists but listing qty = 0: flag for relisting

### Step 10: Report
- Post summary to BM Telegram (`-1003888456344`):
  - Total active / winning / losing count
  - Bumps applied count
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

## Notifications
- All alerts go to BM Telegram group (`-1003888456344`)
- NOT Slack #general

## Implementation

**Script:** `backmarket/scripts/buy-box-check.js`

```bash
node scripts/buy-box-check.js                        # Check only (no price changes)
node scripts/buy-box-check.js --auto-bump             # Check + apply profitable bumps
node scripts/buy-box-check.js --compare-profitability  # Show real vs estimated costs
```

Note: `buy_box_monitor.py` in `buyback-monitor/` is the old Python version. The JS script above is the current implementation.

---

## QA Notes (2026-03-28)

This section records QA of SOP 7 against the active script at `backmarket/scripts/buy-box-check.js`.

### Findings

1. **HIGH — SOP profitability formula does not match the script**

The SOP says:

```text
net_margin = net_profit / (min_price × 0.90) × 100
```

The script actually calculates:

```text
margin = net_profit / min_price × 100
```

This is a real formula mismatch and changes the reported margin percentage.

2. **MEDIUM — Step 4 undercut wording is broader than implementation**

The SOP says proposed price is `price_to_win` or `price_to_win - £1`.

The script does not undercut by `£1`. It uses `price_to_win` directly.

3. **MEDIUM — Age escalation wording is more specific than the script**

The SOP describes:
- `8-14`: above market by `>£15`
- `15-21`: drop to market if profitable
- `21+`: consider delisting

The script only checks:
- not winning
- days listed at `8`, `15`, and `21`

It does not compute an explicit `>£15 above market` threshold in the age logic itself.

4. **MEDIUM — Report contents do not fully match the SOP wording**

The SOP says the Telegram summary includes:
- bumps applied count + total spend

The script sends:
- count of bumps
- alerts
- no "total spend" field

This is a documentation mismatch, not a runtime bug.

5. **LOW — Columns section includes a UUID column the script does not use**

The SOP lists BM Devices `text_mm1dt53s` (UUID), but the script does not read that column. It uses BM listing UUID from `listing.id` returned by BM.

6. **LOW — One stale comment remains in the script header**

The script header still says:
- `Step 9. Quantity verification (TODO: needs Monday cross-check)`

But quantity verification is implemented now.

### Check Summary

| Check | Status | Notes |
|------|--------|-------|
| Does every SOP step match the script? | MOSTLY PASS | Main flow matches, but some formulas/wording are more specific than implementation |
| Are profitability gates correct? | PASS | Tiered gate matches script: `>=30% + £50` silent bump, `15-30% + £50` bump+flag, `<15%` block, `<£50` block |
| Does backbox use UUID not numeric listing_id? | PASS | Uses `listing.id` |
| Does `--auto-bump` respect all three margin tiers? | PASS | Implemented in bump logic and alert behavior |
| Does qty mismatch auto-offline work? | PASS | Active listing with non-Listed Monday status is auto-offlined |
| Does Telegram report fire and include alerts? | PASS | Summary always sends, alerts append when present |
| Is age escalation logic correct? | MOSTLY PASS | Thresholds are 8/15/21 days, but not the exact market-delta wording from SOP |
| Are column IDs correct? | MOSTLY PASS | Core IDs used are correct; UUID column is listed but unused |
| Any dead code or stale references? | PASS WITH NOTES | No blocking dead path found, but one stale header comment remains |

### Confirmed Behaviors

- **Step 1:** Active listings are fetched from `GET /ws/listings` and filtered to `quantity > 0`.
- **Step 2:** Backbox call uses `listing.id` UUID, not numeric `listing_id`.
- **Step 5:** Cost data comes from BM Devices `numeric_mm1mgcgn` + `numeric`, with VAT margin-scheme treatment.
- **Step 6:** `--auto-bump` only bumps when profitability passes.
- **Step 7:** Age escalation thresholds in code are `8`, `15`, and `21` days.
- **Step 9:** Qty mismatch can auto-offline the listing by setting BM quantity to `0`.
- **Step 10:** Telegram summary is sent after every run, with appended alerts when present.

### Known Remaining Gaps (documented, non-blocking)

- Grade check in status assessment uses V6 approximate prices for some listings.
- Real profitability lookup is an extra implementation feature, not a core SOP requirement.
- No explicit `--dry-run` flag, but running without `--auto-bump` is effectively check-only.

### Syntax Check

`node --check backmarket/scripts/buy-box-check.js` passed during QA.
