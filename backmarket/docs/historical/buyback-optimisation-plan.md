# BackMarket Buyback Listing Optimisation Plan

**Created:** 2026-02-27
**Owner:** Ricky (iCorrect / Panrix Limited)
**Status:** Phase 3 COMPLETE. Buybox audit done. Next: incremental bid bumping + fishing line promotion.

---

## Problem

iCorrect has 4,919 buyback listings on BackMarket but only ~145 SKUs have ever received an order, and only ~20-30 generate meaningful volume. Around November 2025, offer prices were raised to try to fill a new 20/day order cap — this means we have been overpaying on some SKUs since then. Sale prices are declining (MBA M1 down 9.8%), but purchase prices have not adjusted.

**10-month averages hide recent deterioration.** The past 3 months show:
- Parts costs exploding: £0 → £39 → £53 average across periods
- Margins compressing: 46% → 29%
- Loss rate climbing: 0.3% → 3.7%

**Blended SKU averages hide grade-level differences.** A single listing SKU (e.g. `MBA13.2020.M1.7CORE.8GB.256GB.FUNC.CRACK`) receives devices graded internally as Fair, Good, and Excellent. Fair grade MBA M1s sell for £341-376, while Good grade sells for ~£410. Basing max offers on the blended average overpays for Fair units (the majority).

**Current state:** £275K revenue, £103K net profit (37.6% margin), 12 loss-makers, 133 unsold units with £13K tied up.

---

## Goal

Only bid on profitable SKUs, with max offers based on **Fair grade economics** (worst case). Good and Excellent grade orders are upside.

**Recommended strategy: flat £200 minimum net per order.** This eliminates all thin-margin SKUs and frees team capacity for higher-value work.

Override: `--min-net` flag forces a flat minimum across all SKUs (e.g. `--min-net 200`).

Every trade-in slot should count.

---

## Velocity & Opportunity Cost Analysis

### Order Volume (last 3 months)

| | SKUs | Orders | Orders/month | Orders/day |
|---|---:|---:|---:|---:|
| **£200 Survivors** (KEEP+REPRICE) | 162 | 123 | 41 | 1.4 |
| **Killed** (DELIST at £200 min) | 31 | 93 | 31 | 1.0 |
| **Total** | 193 | 216 | 72 | 2.4 |

Switching to £200-only cuts 43% of order volume but only 22% of profit.

### Resource Consumption (last 3 months, monthly averages)

|  | Survivors | Killed |
|---|---:|---:|
| Orders/month | 41 | 31 |
| Purchase capital | £5,709 | £3,108 |
| Parts cost | £1,826 | £1,814 |
| Labour cost | £1,094 | £742 |
| **Total resources** | **£8,629** | **£5,664** |
| **Net return** | **£7,977** | **£2,202** |
| Net per order | £195 | £71 |
| Return on resources | 92% | 39% |
| Loss-makers | 0% | 4.3% |

Killed SKUs consume £5,664/month in resources to return £2,202 (39% return). Survivors return 92% on resources — and that improves to 159% after repricing.

### Trade-in Pipeline Speed: Identical

| Stage | Survivors | Killed |
|---|---|---|
| Created → Shipped | 7.1d (median 6d) | 7.0d (median 6d) |
| Shipped → Received | 3.1d (median 2d) | 3.2d (median 3d) |
| Received → Paid | 3.0d (median 2d) | 2.8d (median 2d) |
| **Total** | **13.3d (median 11d)** | **13.1d (median 12d)** |
| Cancellation rate | 3% | 3% |

No speed difference. Both groups take ~13 days. Repair → list → sold dates not in this data (would need Monday.com board or BM sales API).

### The MBA M1 256GB Elephant

`MBA13.2020.M1.7CORE.8GB.256GB.FUNC.CRACK` — highest volume SKU by far:
- 46 orders in 3 months (15/month, 0.5/day)
- £59 avg net per order
- Accounts for 50% of all killed-group volume
- DELIST under £200 minimum

Massive volume, thin profit. Every one of these takes a bench slot.

### Opportunity Cost

31 killed devices/month = 31 bench slots the team could use for:
1. **More BM buyback survivors** (if BM sends them)
2. **BM sales-side repairs** (existing pipeline)
3. **Walk-in / mail-in repairs** (typically higher margin)
4. **Faster turnaround** on the 42 survivor devices (quicker cash cycle)

### Financial Comparison

| Scenario | Orders/month | Net/month |
|---|---:|---:|
| **Current** (all SKUs, current prices) | 72 | £10,179 |
| **£200 strategy** (survivors only, repriced) | 42 | £13,735 |
| **£200 + fill freed slots** (if demand exists) | 69 | £23,049 |

Dropping killed SKUs and repricing survivors already nets **£3,556 more per month with 30 fewer orders**. Freed bench time is pure bonus.

### Target: 60 orders/month at £200+

At £335 avg net (repriced): 60 orders = **£20,100/month**.

Need 18 more survivor orders/month beyond current 42. That is 1.4/day → 2.0/day. Already hitting 2.1-2.6/day on good weeks (W49, W50, W04). Not consistent yet but within range.

£3,108/month in freed purchase capital could go toward competitive pricing on survivor SKUs to win more buyboxes.

### Weekly Order Distribution (last 3 months)

```
Week      Surv  Kill  Total  /day
2025-W48:  10    13    23    3.3
2025-W49:  16     5    21    3.0
2025-W50:  15     6    21    3.0
2025-W51:   6     4    10    1.4
2025-W52:   5     6    11    1.6
2026-W01:   9    11    20    2.9
2026-W02:   7    12    19    2.7
2026-W03:  13     7    20    2.9
2026-W04:  18     9    27    3.9
2026-W05:   6     5    11    1.6
2026-W06:   7     6    13    1.9
2026-W07:   3     4     7    1.0
```

---

## Data Sources

| Source | Location | Records | Contains |
|--------|----------|---------|----------|
| Crossref P&L | `bm-crossref-data.json` | 715 orders | Sale, purchase, BM fee, tax, parts, labour, net, monday_sku |
| Trade-in CSV | `Backmarket Trade-in Data - Sheet1.csv` | 1,845 orders (694 completed) | BM order ID, listing SKU, status, pipeline dates |
| Listings CSV | `Buy_Back_Listings_2602.csv` | 4,919 listings | SKU, current price, listing ID |
| BM Buyback API | `GET /ws/buyback/v1/listings` | Live | UUID, SKU, prices, grades |

**Join logic:** Crossref → Trade-in CSV via BM order ID (`GB-xxxxx-xxxxx`) → Listings via `listingSku` = `sku`.

**Internal grade extraction:** The `monday_sku` field in crossref data contains the internal grade as its last segment (e.g. `MBA.M1A2337.8GB.256GB.Grey.Fair` → `fair`). This splits orders by actual device condition, not just the BM listing grade.

**Trade-in pipeline dates:** `creationDate`, `shippingDate`, `receivalDate`, `paymentDate` — all populated for MONEY_TRANSFERED orders. Status field uses `MONEY_TRANSFERED` (not COMPLETED) for finished trade-ins.

**Known data quirk:** 147 listings in the CSV have literal string `"None"` as their SKU value. These are filtered out and counted as DEAD.

---

## Phase 1: Decision Engine [COMPLETE]

**Script:** `/home/ricky/builds/backmarket/api/bm-listing-optimizer.py`
**Utility module:** `/home/ricky/builds/backmarket/api/bm_utils.py`
**Output:** `/home/ricky/builds/backmarket/audit/listing-decisions*.json` + printed summary

### CLI Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `--months N` | All data (~10 months) | Filter crossref to last N months only |
| `--min-net N` | Tiered (100/200) | Flat minimum net override for all SKUs |
| `--output PATH` | `audit/listing-decisions.json` | Custom output path |

### How It Works

1. Load all 3 data sources
2. Optionally filter crossref by `--months N` (based on `created` date field)
3. Join crossref P&L to listing SKUs via BM order ID chain
4. **Extract internal grade** from `monday_sku` last segment → `fair`, `good`, `excellent`, `unknown`
5. Group orders by `(listing_sku, internal_grade)` — not just listing_sku
6. Calculate per-grade performance stats (avg sale, parts 75th, avg labour, etc.)
7. **Set max offer based on Fair grade economics:**
   - If Fair grade orders exist for this SKU → use Fair grade stats for max_offer
   - If no Fair grade orders → fall back to all-grade stats
   - Good/Excellent results included in output for reference but don't drive pricing
8. Classify every listing: KEEP / REPRICE / DELIST / DEAD

### Max Offer Formula

```
max_offer = avg_sale_fair - bm_fee - avg_tax_fair - parts_75th_fair - avg_labour_fair - shipping(15) - min_net_target
```

Where `min_net_target` = tier-based (100/200) or flat via `--min-net`.

### Tier Classification (from listing SKU)

| Tier | Min Net | Devices |
|------|---------|---------|
| £200 | £200 | MBP 14"/16" (any chip), M2/M3/M4 anything, M1 Pro/Max |
| £100 | £100 | Intel MacBooks, M1 MacBook Airs, M1 MacBook Pro 13" |

### Grade Breakdown in Output

Each classified listing with order data includes a `by_grade` dict:

```json
{
  "by_grade": {
    "fair": {"orders": 15, "avg_sale": 374, "avg_net": 112, "parts_75th": 53},
    "good": {"orders": 8, "avg_sale": 410, "avg_net": 185, "parts_75th": 25}
  },
  "max_offer_based_on": "fair",
  "total_orders": 23
}
```

### Listing Actions

| Action | Condition |
|--------|-----------|
| **KEEP** | Has order data AND current_price <= max_offer |
| **REPRICE** | Has order data AND current_price > max_offer AND max_offer > 0 |
| **DELIST** | Has order data AND max_offer <= 0 |
| **DEAD** | No orders ever for this SKU (or SKU is "None") |

### Generated Scenarios

| Scenario | File | Result |
|----------|------|--------|
| 3-month tiered (Fair basis) | `listing-decisions-3m-tiered.json` | 131 KEEP, 61 REPRICE, 1 DELIST, 4726 DEAD |
| 3-month flat £200 (Fair basis) | `listing-decisions-3m-200.json` | 92 KEEP, 70 REPRICE, 31 DELIST, 4726 DEAD |

### Verification
- All 4,919 listings classified
- Spot-checked MBA13.2020.M1.7CORE.8GB.256GB.FUNC.CRACK: max offer £88.68 (tiered) matches manual calc
- Grade split verified: Fair grade avg sale £374, Good grade avg sale £410 for same listing SKU
- 147 "None" SKU listings correctly filtered as DEAD
- 75th percentile parts cost uses pure Python (no numpy dependency)

---

## Phase 2: Pricing Report [COMPLETE]

**Script:** `/home/ricky/builds/backmarket/api/bm-pricing-report.py`
**Input:** Any Phase 1 JSON output (via `--input PATH`)
**Output:** Markdown report (via `--output PATH`)

### CLI Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `--input PATH` | (required) | Path to listing-decisions JSON |
| `--output PATH` | Auto-generated with date | Custom output path |

### Report Sections

1. **Executive summary** — counts per category, total current vs recommended monthly spend
2. **Top 30 active SKUs** — grade breakdown columns: Fair Ord, Fair Sale, Fair Net, Good Ord, Good Sale, Good Net, Max Offer, Action
3. **Repricing actions** — every overpaying SKU with monthly overspend
4. **Delist candidates** — with Fair vs Good breakdown showing why Fair kills profitability
5. **Dead listings** — count, how many have non-zero prices
6. **Projected impact** — monthly net at new prices vs current, annualised
7. **Risk factors** — M5 MacBook Air announcement (March 2026), budget Mac rumours, Fair grade price trends

### Generated Reports

| Report | File | Key Numbers |
|--------|------|-------------|
| 3-month tiered (Fair basis) | `pricing-report-3m-tiered-graded.md` | Projected £12,489/month (+£2,310) |
| 3-month flat £200 (Fair basis) | `pricing-report-3m-200-graded.md` | Projected £9,764/month, £335 avg net/order |

---

## Phase 3: Execute Price Changes via BM API [TEST BATCH DONE]

**Script:** `/home/ricky/builds/backmarket/api/bm-reprice.py`
**Depends on:** Phase 2 report reviewed and approved by Ricky

### Strategy Decisions (Confirmed 1 March 2026)

| Decision | Detail |
|----------|--------|
| **Minimum net** | Flat £200 per order (replaces tiered £100/£200) |
| **Whitelist** | MBA13.2020.M1.7CORE.8GB.256GB.NONFUNC.USED, MBA13.2024.M4.APPLECORE.16GB.512GB.NONFUNC.CRACK |
| **Blacklist** | All MBP13.2020 Intel (i3/i5/i7) — unrepairable board failures |
| **M1+ DEAD listings** | Keep as fishing lines (927 winning buybox, cost nothing) |
| **Intel DEAD listings** | Zero out |

### Script Features
- `--decisions PATH` (required) — path to listing-decisions JSON
- `--execute` — actually updates prices (default: dry-run)
- `--limit N` — process first N changes only
- `--skip-dead` — leave DEAD listings untouched (for M1+ fishing lines)
- `--bump-dead` — increase losing-buybox DEAD listings by £1-5
- Whitelist: hardcoded profitable SKUs that override DELIST/zero decisions
- Blacklist: regex patterns for SKUs that must always be zeroed
- Rate limiting: 1.0s between API calls
- 429 retry: exponential backoff (2^n + 1 seconds, up to 5 retries per page)
- Abort after 10 consecutive failures
- Full change log: `/home/ricky/builds/backmarket/audit/reprice-log-YYYY-MM-DD.json`
- Dry-run plan: `/home/ricky/builds/backmarket/audit/reprice-plan-YYYY-MM-DD.json`

### API Endpoints (Confirmed)
- `GET /ws/buyback/v1/listings?page=1&page_size=100` — paginated listing fetch
- `PUT /ws/buyback/v1/listings/{uuid}` — update price, returns 202 Accepted
- Body: `{"prices": {"GB": {"amount": "X.XX", "currency": "GBP"}}}`

### Dry Run Results (1 March 2026)
- 4,919 listings fetched (50 pages, ~4 min with rate limiting)
- **363 total changes planned:**
  - 57 reprices (current price > max offer, reduced to max offer)
  - 306 zero-outs (288 Intel MBP13 blacklisted + 18 MBA M1/Intel Air DELIST)
  - Whitelisted SKUs preserved at current prices
  - M1+ DEAD listings skipped (--skip-dead)

### Test Batch (1 March 2026) — 5/5 SUCCESSFUL

| # | SKU | UUID | Old | New | Status |
|---|-----|------|-----|-----|--------|
| 1 | MBA13.2020.M1.7CORE.8GB.256GB.FUNC.CRACK | b6365fe2 | £153 | £0 | 202 OK |
| 2 | MBA13.2020.M1.7CORE.8GB.256GB.NONFUNC.CRACK | 29004ce8 | £88 | £0 | 202 OK |
| 3 | MBP13.2020.M1.8CORE.8GB.256GB.FUNC.CRACK | 240928b9 | £153 | £34.38 | 202 OK |
| 4 | MBP13.2020.M1.8CORE.8GB.256GB.NONFUNC.CRACK | 2c06dd58 | £81 | £64.15 | 202 OK |
| 5 | MBA13.2020.M1.7CORE.8GB.256GB.FUNC.CRACK | 7b48894e | £129 | £0 | 202 OK |

**Verified on BM dashboard:** Listings confirmed showing updated prices / "Offline" status.

### Remaining Execution
- **358 changes pending** (363 planned - 5 executed)
- Command: `python3 /home/ricky/builds/backmarket/api/bm-reprice.py --decisions /home/ricky/builds/backmarket/audit/listing-decisions-3m-200.json --skip-dead --execute`
- Estimated time: ~6 minutes (358 calls at 1.0s rate limit)
- Awaiting Ricky's go-ahead

### Bugs Fixed During Build
1. **429 rate limit on pagination** — BM API returns 429 after ~10 rapid GET requests. Added exponential backoff retry (2^n + 1 seconds, up to 5 retries).
2. **Rate limit too aggressive** — Increased from 0.5s to 1.0s between API calls.

## Phase 4: Weekly Monitoring (BM Agent)

**NOT a cron job.** This runs through the BackMarket OpenClaw agent (`backmarket`, Telegram group -1003888456344).

### What the agent does weekly
1. Refreshes crossref data
2. Recalculates per-SKU performance for past 4 weeks, **split by internal grade**
3. Flags:
   - SKU avg net dropped below minimum (£200)
   - Fair grade sale price dropped >5% in 4 weeks
   - Current listing price now exceeds max offer (Fair basis)
4. Generates report: `/home/ricky/builds/backmarket/audit/weekly-monitor-YYYY-MM-DD.md`
5. Posts summary to the Backmarket Jarvis Telegram group

### Implementation
- Add monitoring as a skill/SOP for the BM agent
- Agent can run the analysis script on-demand or on a schedule via OpenClaw
- Report and alerting stay within the agent's existing Telegram group

---

## Shared Utility Module

**File:** `/home/ricky/builds/backmarket/api/bm_utils.py`

Common functions used across all Phase scripts:
- `load_env()` — credentials from `/home/ricky/config/api-keys/.env`
- `bm_api_call()` — BM API wrapper with auth headers + rate limiting
- `monday_query()` — Monday GraphQL wrapper with retry on rate limit
- `calc_max_offer()` — max offer calculation (floors at 0)
- `get_min_net_tier()` — classify device into £100/£200 tier from SKU string

---

## Execution Order

```
Phase 1 (Decision Engine)  <- COMPLETE
    |
Phase 2 (Pricing Report)   <- COMPLETE
    |
  [Ricky reviews]           <- HERE
    |
Phase 3 (Execute Changes)  <- TEST BATCH DONE (5/5), full run pending
    |
Phase 4 (BM Agent Monitor) <- Agent skill, reuses Phase 1 logic
```

**Recommendation: £200 flat strategy.** Even without filling freed capacity, repricing alone yields £13,735/month vs current £10,179 — a £3,556/month improvement from 30 fewer orders. The freed bench time (31 devices/month) can go to higher-value work.

---

## Known Risks

1. **Sale price trends:** MBA M1 Fair grade last 3 sales at £341-376, heading toward £350. M5 MacBook Air announcement expected March 2026 will accelerate this. Budget Mac rumours add further pressure.
2. **Parts cost explosion:** 3-month data shows parts averaging £53, up from near-zero 6 months ago. 75th percentile gives a buffer but trend is upward.
3. **Margin compression:** 3-month margin at 29% vs 46% from older data. Using 10-month averages would significantly overstate profitability.
4. **Grade-level economics:** Fair grade units (majority of orders for top SKUs) sell for £30-50 less than Good grade. Max offers must be based on Fair grade to avoid systematic losses.
5. **Crossref freshness:** Stale data = stale results. Refresh before running Phase 1.
6. **Volume gap:** Survivor demand currently at 1.4/day. Hitting 2.0+/day target for 60 orders/month requires either more buybox wins or demand growth for survivor SKUs. Peaks of 2.6/day already observed on good weeks.

---

## Decisions Confirmed

- Dead listings: decide after seeing Phase 2 report
- Data freshness: 27 Feb crossref data is current enough
- Min net: flat £200 recommended (overrides tiered £100/£200)
- Parts cost: 75th percentile (conservative)
- BM API: PUT endpoint confirmed, returns 202
- Phase 4 monitoring: BM OpenClaw agent, NOT cron
- **Grade split**: max offers based on Fair grade economics (worst case). Good/Excellent is upside.
- **Time window**: 3-month data only (market is moving fast)
- **Opportunity cost**: freed bench time and capital from killed SKUs has real value even if not immediately filled with more buyback orders

---

## Key Findings During Build

1. **147 "None" SKU listings**: Listings CSV contains 147 entries with literal "None" as SKU. Filtered and counted as DEAD.
2. **661 of 715 orders matched**: 54 crossref orders had no `listingSku` in trade-in CSV (skipped).
3. **149 unique SKUs with orders**: But only 124 had actual sales (sale > 0). The 25 with orders but no sales return no stats and classify as DEAD.
4. **MBA M1 256GB FUNC.CRACK**: Top SKU by volume (46 orders in 3m). 22 different Monday SKUs across Fair/Good/VGood and colours. Only £59 avg net. 50% of killed-group volume. DELIST under £200 minimum.
5. **No numpy on VPS**: PEP 668 prevents pip install. Pure Python percentile function used instead.
6. **Trade-in pipeline identical for both groups**: ~13 days end-to-end, no speed advantage to either group. 3% cancellation rate both sides.
7. **Killed SKUs earn £2.97 per £1 of labour**: Survivors earn £7.30 per £1 — 2.5x more productive use of tech time.
8. **Weekly volume swings**: Survivor orders range from 3 to 18 per week (0.4-2.6/day). Best weeks already exceed the 2.0/day target.


---

## Phase 3 Completion Summary (1 March 2026)

### Execution
- **365 price changes executed** (5 test + 360 full run), all 202 OK, zero failures
- 57 repriced to max offer, 306 zeroed out (288 Intel MBP13 blacklisted + 18 MBA/Intel delisted)
- 2 whitelisted SKUs preserved (MBA M1 NONFUNC.USED, MBA M4 NONFUNC.CRACK)
- M1+ DEAD fishing lines left active (927 listings, --skip-dead flag)

### Post-Repricing Audit Results
- **775 trade-in orders in last 3 months** (~60/week)
- **50% still landing** (388 orders — survivors KEEP + REPRICE)
- **37% now blocked** (290 orders — killed/zeroed SKUs)
- **12% fishing line hits** (95 orders — M1+ DEAD listings catching premium devices)
- **3% cancel rate** (24 orders)
- **37% actual send-in rate** (283 completed+sent / 775 total)

### Current Projection (6 accepted/day cap, next 30 days)
- 6 accepted/day x 37% send-in = **2.2 received/day**
- ~11 received/week, ~47/month
- At ~£200 avg net = **£2,200/week = ~£9,500/month**
- Every slot now goes to £200+ net devices (previously diluted by £59-net cracked M1 Airs and loss-making Intels)

### Key Fishing Lines Catching
| SKU | Orders/3mo | Status |
|-----|-----------|--------|
| MBP13 M1 16/256 NONFUNC.USED | 8 | Promote candidate |
| MBP16 M1 Pro 16/512 FUNC.CRACK | 6 | High value — promote |
| MBA M2 16/256 NONFUNC.CRACK | 5 | Promote candidate |
| MBP14 M1 Pro 16/512 NONFUNC.CRACK | 4 | High value — promote |
| MBA15 M2 8/256 FUNC.CRACK | 4 | Promote candidate |

---

## Phase 5: Buybox Optimisation & Fishing Line Promotion

**Status:** NEXT
**Goal:** Maximise order volume on profitable SKUs within the 6/day cap

### What this phase does

1. **Buybox audit for survivors** — For every KEEP/REPRICE SKU, check if we're winning the buybox. Identify SKUs where competitors are outbidding us and we could win with a small price increase (still under max offer).

2. **Fishing line promotion** — 95 orders hit M1+ DEAD listings in 3 months (7.3/week). The top performers (MBP16 M1 Pro, MBP14 M1 Pro, MBA15 M2) are high-value devices. Calculate max offers for these and set proper competitive prices.

3. **Buybox gap analysis** — For the 126 M2+ SKUs not currently winning buybox, identify which are worth pursuing based on:
   - Expected net per order (must meet £200 minimum)
   - Competitor pricing (how much would we need to bid?)
   - Device repairability and parts availability

4. **Price fine-tuning** — Some repriced SKUs may now be bidding too low to win orders. Adjust upward where margin allows, to maximise volume without dropping below £200 net.

### Depends on
- Phase 3 complete (done)
- Fresh API listing data showing current buybox status
- Trade-in data showing which SKUs are getting orders

