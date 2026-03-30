# Buyback Optimisation — Phase 1-3 Build Tasks

**Status:** Phase 1-2 COMPLETE, Phase 3 test batch done, full run pending
**Reference for:** `bm_utils.py`, `bm-listing-optimizer.py`, `bm-pricing-report.py`, `bm-reprice.py`
**Directory:** `/home/ricky/builds/backmarket/api/`
**Output:** `/home/ricky/builds/backmarket/audit/`

---

## Task 1: Read Existing Scripts & Data [DONE]

Understood data structures, API patterns, env var names, join chain.

### Key findings
- Crossref `order_id` matches trade-in `orderPublicId` (format: `GB-xxxxx-xxxxx`)
- Trade-in `listingSku` matches listings `sku`
- Crossref `monday_sku` contains internal grade as last segment (e.g. `MBA.M1A2337.8GB.256GB.Grey.Fair`)
- 661 of 715 crossref orders have matching trade-in rows with listingSku
- 149 unique listing SKUs have order data
- 147 listings have literal "None" as SKU (data quality issue)
- Env vars: BACKMARKET_API_AUTH, BACKMARKET_API_BASE, BACKMARKET_API_LANG, BACKMARKET_API_UA, MONDAY_API_TOKEN

---

## Task 2: Build `bm_utils.py` [DONE]

**File:** `/home/ricky/builds/backmarket/api/bm_utils.py`

### Functions

| Function | Purpose |
|----------|---------|
| `load_env(path)` | Read `/home/ricky/config/api-keys/.env`, return dict |
| `bm_api_call(method, endpoint, data, env)` | BM buyback API wrapper via curl, sets auth headers |
| `monday_query(query, env, retries)` | Monday GraphQL with rate limit retry (3 attempts) |
| `get_min_net_tier(sku)` | Returns 200 for MBP14/16, M2+, M1Pro/Max; 100 for rest |
| `calc_max_offer(avg_sale, bm_fee, avg_tax, parts_75th, avg_labour, shipping, min_net_target)` | Floors at 0 |

---

## Task 3: Build Data Loading & Join Logic [DONE]

### Join chain
```
crossref (order_id) -> trade-in CSV (orderPublicId -> listingSku) -> listings CSV (sku)
```

### Grade extraction
```python
def extract_internal_grade(monday_sku):
    # "MBA.M1A2337.8GB.256GB.Grey.Fair" -> "fair"
    # Last segment of dot-separated monday_sku
    # Normalised to: fair, good, excellent, unknown
```

### Grouping
Orders grouped by:
- `listing_sku` -> for listing-level classification
- `(listing_sku, internal_grade)` -> for grade-level stats

### Edge cases handled
- 54 crossref orders with no matching trade-in row (skipped, logged)
- 147 listings with "None" SKU (filtered, counted as DEAD)
- Multiple internal grades per listing SKU (expected — grade split)
- SKUs with orders but no sales (sale <= 0) -> no stats, classified DEAD

---

## Task 4: Build Per-SKU Performance Calculations [DONE]

### Per-grade stats calculated

| Metric | How |
|--------|-----|
| `orders` | Count of matched orders for this grade |
| `avg_sale` | Mean sale price |
| `avg_net` | Mean net per order |
| `total_net` | Sum of net |
| `parts_75th` | 75th percentile of parts cost (pure Python, no numpy) |
| `avg_labour` | Mean labour cost |
| `bm_fee` | 10% of avg_sale |
| `avg_tax` | Mean tax |
| `loss_rate` | % of orders where net < 0 |

### Max offer calculation
- Uses **Fair grade stats** if Fair orders exist for the SKU
- Falls back to all-grade stats if no Fair data
- `max_offer_based_on` field records which grade drove the calculation

### CLI flags
- `--months N` — filter crossref to last N months (based on `created` date)
- `--min-net N` — flat minimum net override (replaces tiered £100/£200)

---

## Task 5: Build Listing Classification [DONE]

### Actions

| Action | Condition |
|--------|-----------|
| **KEEP** | current_price <= max_offer AND max_offer > 0 |
| **REPRICE** | current_price > max_offer AND max_offer > 0 |
| **DELIST** | max_offer <= 0 (cannot be profitable even at Fair grade) |
| **DEAD** | No orders, or SKU is "None" |

### JSON output structure

```json
{
  "generated": "2026-02-27T...",
  "config": {
    "months": 3,
    "min_net_override": null
  },
  "summary": {
    "total_listings": 4919,
    "keep": 131,
    "reprice": 61,
    "delist": 1,
    "dead": 4726,
    "skus_with_data": 193
  },
  "listings": [
    {
      "sku": "MBA13.2020.M1.7CORE.8GB.256GB.FUNC.CRACK",
      "listing_id": 1233422,
      "current_price": 153,
      "action": "REPRICE",
      "max_offer": 65.32,
      "tier": 100,
      "avg_sale": 374,
      "avg_net": 112,
      "parts_75th": 53,
      "avg_labour": 15,
      "total_orders": 23,
      "loss_rate": 0.05,
      "total_net": 2576,
      "max_offer_based_on": "fair",
      "by_grade": {
        "fair": {
          "orders": 15,
          "avg_sale": 374,
          "avg_net": 112,
          "total_net": 1680,
          "parts_75th": 53,
          "avg_labour": 15,
          "bm_fee": 37.4,
          "avg_tax": 18,
          "loss_rate": 0.07
        },
        "good": {
          "orders": 8,
          "avg_sale": 410,
          "avg_net": 185,
          "total_net": 1480,
          "parts_75th": 25,
          "avg_labour": 12,
          "bm_fee": 41,
          "avg_tax": 20,
          "loss_rate": 0.0
        }
      }
    },
    {
      "sku": "SOME.DEAD.SKU",
      "listing_id": 9999999,
      "current_price": 50,
      "action": "DEAD"
    }
  ]
}
```

**Note:** Field is `total_orders` (not `order_count`). Grade data is in `by_grade` dict keyed by grade name.

---

## Task 6: Deploy & Verify Phase 1 [DONE]

### Verification results
- [x] Script runs without errors
- [x] JSON generated in audit/
- [x] Total listings = 4,919
- [x] ~149 SKUs have order data (124 with actual sales)
- [x] Spot-check: MBA13.2020.M1.7CORE.8GB.256GB.FUNC.CRACK — max offer £88.68 (tiered, full data) matches manual calc
- [x] Grade split verified: Fair avg sale £374, Good avg sale £410 for same listing SKU
- [x] 661 of 715 crossref orders matched (54 had no listingSku)
- [x] 147 "None" SKU listings correctly filtered as DEAD
- [x] Distribution sensible across KEEP/REPRICE/DELIST/DEAD
- [x] Tier classification correct (M2+ gets £200, M1 MBA gets £100)

### Bugs fixed during build
1. **numpy import error** — VPS has no numpy (PEP 668). Replaced with pure Python `percentile_75()`.
2. **"None" SKU bug** — 147 listings with literal "None" string as SKU. Added explicit `sku != "None"` filter.
3. **Double-counting** — None SKU listings were counted in both main loop and raw_listings loop. Fixed by filtering before grouping.

---

## Task 7: Build Phase 2 Report Generator [DONE]

**Script:** `/home/ricky/builds/backmarket/api/bm-pricing-report.py`, `bm-reprice.py`

### CLI flags
- `--input PATH` (required) — path to listing-decisions JSON
- `--output PATH` — custom output path (auto-generated with date if omitted)

### Report sections (grade-aware)

1. **Executive Summary** — counts per category, current vs recommended monthly spend
2. **Top 30 Active SKUs** — columns: Fair Ord, Fair Sale, Fair Net, Good Ord, Good Sale, Good Net, Max Offer, Action
3. **Repricing Actions** — every REPRICE SKU with monthly overspend
4. **Delist Candidates** — with Fair vs Good grade breakdown showing why Fair kills profitability
5. **Dead Listings** — count, how many have non-zero prices
6. **Projected Impact** — monthly net current vs new, annualised
7. **Risk Factors** — M5 announcement (March 2026), budget Mac, Fair grade price trends

---

## Task 8: Run Phase 2 & Verify [DONE]

### Scenarios generated

| Scenario | Input | Output | Key Result |
|----------|-------|--------|------------|
| 3m tiered (Fair basis) | `listing-decisions-3m-tiered.json` | `pricing-report-3m-tiered-graded.md` | 131 KEEP, 61 REPRICE, 1 DELIST. Projected £12,489/month (+£2,310) |
| 3m flat £200 (Fair basis) | `listing-decisions-3m-200.json` | `pricing-report-3m-200-graded.md` | 92 KEEP, 70 REPRICE, 31 DELIST. Projected £9,764/month, £335 avg net/order |

### Verification
- [x] Reports generate without errors
- [x] Totals add up to 4,919
- [x] Grade columns display correctly
- [x] Top 30 ranking matches Phase 1 data
- [x] Projected impact realistic vs baseline
- [x] Risk factors included (M5, budget Mac, Fair grade trends)

### Comparison: flat £200 kills 9 SKUs that were profitable under tiered (61 orders, ~£5K net) but survivors average £335/order vs £268 under tiered.

---

## Task 9: Velocity & Opportunity Cost Analysis [DONE]

Analysed order velocity, pipeline turnaround, resource consumption, and opportunity cost for the £200 flat scenario. This analysis is now in the main plan document.

### Key findings
- **Volume:** Survivors get 1.4 orders/day (41/month), killed get 1.0/day (31/month)
- **Pipeline speed:** Identical for both groups (~13 days end-to-end, 3% cancellation)
- **Resource efficiency:** Killed SKUs earn £71/order consuming £183 in direct costs (39% return). Survivors earn £195/order at 92% return, rising to £335 repriced (159% return).
- **MBA M1 256GB dominance:** Single SKU is 46 of 93 killed orders (50%). £59 avg net. Highest volume, lowest value.
- **Opportunity cost:** 31 killed devices/month = 31 bench slots freed. Even without filling them with more buyback orders, dropping killed + repricing survivors yields £13,735/month vs current £10,179 — +£3,556/month from fewer orders.
- **60/month target:** Needs 2.0 survivor orders/day vs current 1.4. Best weeks already hit 2.6/day. Not consistent but within range.
- **Working capital freed:** £3,108/month in purchase capital no longer tied up in killed SKUs.

**Reports ready for Ricky to review. Phase 3 execution awaits approval.**

---

## Task 10: Build Phase 3 Repricing Script [DONE]

**Script:** `/home/ricky/builds/backmarket/api/bm-reprice.py`

### Features built
- Whitelist/blacklist system for manual SKU overrides
- Dry-run default (--execute flag required for live changes)
- --skip-dead flag to preserve M1+ fishing lines
- --bump-dead flag for buybox optimization (not yet used)
- --limit N for test batches
- Exponential backoff retry on 429 (up to 5 retries per page)
- 1.0s rate limit between API calls
- Abort after 10 consecutive failures
- Full audit trail: dry-run plan JSON + execution log JSON

### Whitelist (hardcoded)
- MBA13.2020.M1.7CORE.8GB.256GB.NONFUNC.USED (close to £200 net, predictable repairs)
- MBA13.2024.M4.APPLECORE.16GB.512GB.NONFUNC.CRACK (every sale £200+ net)

### Blacklist (regex)
- ^MBP13\.2020\.I\d (all Intel MBP13 2020 — unrepairable board failures)

### Strategy logic
1. Whitelist match → KEEP at current price (override any decision)
2. Blacklist match → ZERO (override any decision)
3. Decision = REPRICE → set to max_offer
4. Decision = DELIST → set to £0
5. Decision = DEAD + skip-dead → skip
6. Decision = DEAD + not skip-dead + Intel → zero out
7. Decision = DEAD + not skip-dead + M1+ → leave alone
8. Decision = KEEP → no change

---

## Task 11: Phase 3 Dry Run & Test Batch [DONE]

### Dry run (1 March 2026)
- Fetched 4,919 listings across 50 API pages (~4 min with rate limiting)
- 363 changes planned: 57 reprices + 306 zero-outs
- Plan saved to: `/home/ricky/builds/backmarket/audit/reprice-plan-2026-03-01.json`

### Test batch (1 March 2026)
- 5 listings updated with --execute --limit 5
- All returned 202 OK
- Changes confirmed on BM dashboard (listings showing "Offline" for zeroed prices)
- Log saved to: `/home/ricky/builds/backmarket/audit/reprice-log-2026-03-01.json`

### Bugs fixed
1. **429 rate limit** — BM API throttles after ~10 rapid requests. Added exponential backoff (2^n + 1 sec, 5 retries max).
2. **Rate limit spacing** — Increased from 0.5s to 1.0s between calls.

---

## Task 12: Execute Full Repricing Run [DONE]

- 360 changes executed (full run), all 202 OK
- Combined with test batch: 365 total changes
- Change log: `/home/ricky/builds/backmarket/audit/reprice-log-2026-03-01.json`

---

## Task 13: Post-Repricing Audit [DONE]

- 775 trade-in orders analysed (last 3 months)
- 50% still landing on survivors, 37% now blocked, 12% fishing line hits
- 37% actual send-in rate confirmed from data
- At 6 accepted/day cap: ~2.2 received/day, ~11/week, ~£2,200/week net
- 95 fishing line hits identified — top candidates for promotion to active listings
- Audit script: `/tmp/post-reprice-audit.py` (move to api/ if reused)

---

## Task 14: Buybox Optimisation & Fishing Line Promotion [PENDING]

- Audit all surviving SKUs for buybox competitiveness
- Calculate max offers for top fishing line SKUs
- Identify M2+ buybox opportunities from the 126 non-winning SKUs
- Fine-tune repriced SKU bids to maximise volume within £200 net floor

---

## Task 15: Buybox Audit & Grade Analysis [DONE]

**Date:** 2 March 2026
**Script:** `/tmp/buybox-audit-v3.py`, `/tmp/nfu-analysis.py`
**Output:** `/home/ricky/builds/backmarket/audit/buybox-audit-2026-03-01.json`

### Fresh API fetch (post-repricing)
- 4,919 listings fetched via cursor-based pagination
- Active (price > 0): 2,821
- Inactive (price = 0): 2,098
- API does NOT return buybox winner status or competitor prices
- Cached to: `api-listings-cache-2026-03-01.json`

### Survivor analysis (50 SKUs)
- All 50 survivors have orders in last 3 months (none zero-demand)
- 23 SKUs have bid headroom (current price below max offer)
- 3 SKUs were overbidding (current price above max offer)

### Overbidding fixes (2 March 2026)
- MBP13.2020.M1.8CORE.16GB.512GB.FUNC.CRACK: £174 -> £163 (202 OK)
- MBP13.2022.M2.APPLECORE.16GB.256GB.FUNC.CRACK: £204 -> £185 (202 OK)
- MBP13.2020.M1.8CORE.8GB.256GB.NONFUNC.USED: LEFT AT £100 (£12 over max offer but #1 volume SKU, 53 orders, 0% loss rate — risk of losing buybox outweighs £12 saving)

### NONFUNC.USED grade deep dive
- 53 orders in 3 months, £284 avg net, **0% loss rate**
- 64% of orders needed zero parts
- Parts distribution: median £0, 75th percentile £84
- By internal grade: Fair £245 net, Good £355, VGood £447
- Best listing grade by far — FUNC.CRACK is £130 avg net with 3% losses
- Conclusion: NONFUNC.USED is the priority grade for bid increases

### Fishing lines (19 M1+ DEAD SKUs with 2+ orders)
- 5 high-demand SKUs (4+ orders) but NO P&L data in crossref
  - MBP13 M1 16/256 NONFUNC.USED (8 orders)
  - MBP16 M1Pro 16/512 FUNC.CRACK (6 orders)
  - MBA M2 16/256 NONFUNC.CRACK (5 orders)
  - MBP14 M1Pro 16/512 NONFUNC.CRACK (4 orders)
  - MBA15 M2 8/256 FUNC.CRACK (4 orders)
- Cannot calculate max offers without P&L — need crossref refresh
- 0 promotable yet (all lack P&L data)

### 23 bump candidates (can increase bid, still profitable)
Top opportunities by headroom:
- MBP16 M3Pro 18/512 NONFUNC.USED: £283 -> up to £853 (+£570)
- MBP14 M4Pro 24/512 NONFUNC.USED: £200 -> up to £675 (+£475)
- MBP16 M1Pro 32/1TB NONFUNC.USED: £163 -> up to £555 (+£392)
- MBA M4 16/256 NONFUNC.USED: £130 -> up to £446 (+£316)
- Strategy: increment bids gradually, monitor order volume changes

---

## Task 16: Buybox Strategy & Bid Bumping [DONE]

**Date:** 2 March 2026
**Script:** `api/bm-bid-bump.py`
**Report:** `audit/buybox-strategy-2026-03-02.md`
**Execution log:** `audit/buybox-bump-log-2026-03-02.json`

### What happened
1. Fresh CSV (March 2) showed repricing dropped us from 44 → 37 winning buyboxes
2. 7 losses were Intel zeroing (by design), 4 were FC over-corrections, 1 NFU actionable
3. Crossref deep dive proved all 4 FC losses are profitable at PTW (£183-227 net/device)
4. **Executed 18 listing bumps** (5 SKUs) — all 202 OK

### Bumps executed

| SKU | Old | New | PTW | Proj Net | Demand |
|-----|-----|-----|-----|----------|--------|
| MBP13 M1 8/256 FC | £34 | £91 | £90 | £195 | 31/qtr |
| MBA M2 8/256 FC | £66 | £100 | £99 | £227 | 24/qtr |
| MBP13 M1 8/512 FC | £53 | £91 | £90 | £207 | 12/qtr |
| MBA M1 16/256 FC | £4 | £91 | £90 | £183 | 8/qtr |
| MBP13 M2 8/256 NFU | £117 | £123 | £122 | £250 | 9/qtr |

**Recovered ~84 orders/quarter, ~£1,287/month projected profit**

### Key findings
- Overpay eliminated by March 1 repricing (was ~£1,100/qtr waste)
- Optimizer net figures can be misleading — crossref is the source of truth
- November price increase: +63% orders, +23% total profit, but FC margins compressed -30%

---

## Task 17: Fishing Line P&L Assessment [DONE]

**Date:** 2 March 2026

### Result: All 19 fishing lines winning buybox — no action needed

**With confirmed P&L (8 SKUs, 11 sold orders):** All profitable, £102-£348 net/device
- Best: MBA M2 16/256 NFU (£348), MBP16 M1Pro NFU (£331), MBP13 M1 16/1TB FC (£265)

**In pipeline (6 SKUs, 12 unsold devices):** Can't calculate net yet — devices still in repair/sale

**No crossref data (5 SKUs):** Estimated from closest survivor match:
- 3 likely profitable: MBP16 M1Pro FC (est £582), MBP14 M4 FC (est £278), MBA15 M2 NFC (est £120)
- 1 likely unprofitable: MBA15 M2 8/256 FC at £219 (est -£55, but proxy was MBA13 M2 — MBA15 sells higher)
- 1 marginal: MBP16 M4Pro 24/512 NFC at £200 (est £48)

### Action: HOLD — monitor via next crossref refresh
- No price changes — all winning buybox at current prices
- 12 unsold devices in pipeline will provide more data points
- Flag MBA15 M2 FC (£219) for review once first device sells

---

## Context for Next Session

### Key numbers (as of 2 March 2026)
- **6 accepted/day BM cap** for next 30 days
- At 37% send-in rate = 2.2 received/day = ~11/week
- ~£200-244 avg net/order = **£2,200/week = ~£9,500-12,000/month**
- 365 repricing changes (Mar 1) + 18 buybox recovery bumps (Mar 2) — all 202 OK
- NONFUNC.USED is the best grade: £284 avg net, 0% loss rate
- Recovered 4 FC buyboxes worth ~£1,287/month projected profit

### Scripts on VPS
- `/home/ricky/builds/backmarket/api/bm-reprice.py` — Phase 3 repricing
- `/home/ricky/builds/backmarket/api/bm-listing-optimizer.py` — Phase 1 decisions
- `/home/ricky/builds/backmarket/api/bm-pricing-report.py` — Phase 2 reports
- `/home/ricky/builds/backmarket/api/bm_utils.py` — shared utilities

### Audit files
- `listing-decisions-3m-200.json` — £200 flat scenario decisions
- `reprice-log-2026-03-01.json` — execution log (365 changes)
- `buybox-audit-2026-03-01.json` — buybox audit results
- `buybox-bump-log-2026-03-02.json` — buybox recovery execution log (18 bumps)
- `buybox-strategy-2026-03-02.md` — full strategy document
- `api-listings-cache-2026-03-01.json` — fresh API listing data

### API notes
- Cursor-based pagination (follow `next` URL, don't increment page number)
- Auth header: use env var directly (`Authorization: {BACKMARKET_API_AUTH}`)
- PUT returns 202 with empty body (not JSON-parseable)
- Rate limit: 1s between calls, exponential backoff on 429
- Each SKU has 1-6 listings (keyboard variants: QWERTY/AZERTY/QWERTZ x with/without BackBox)

---

## Task 18: Repair Analysis — Layers 1-3 [DONE]

**Date:** 2 March 2026
**Reference:** `docs/repair-analysis-plan.md`
**Data:** `audit/repair-analysis-data-2026-03-02.json` (1,256 orders, 534 matched)
**Report:** `audit/repair-analysis-report-2026-03-02.md`

### What was built
- Phase 1 data collection script pulled all BM trade-in orders + Monday main board + BM board data, joined on BM Trade-in ID, cached to JSON
- Layer 1: Full pipeline categorisation — 343 sold (£208 avg net, 1.5% loss), 101 in repair/stuck (£11,748 capital), 14 BER, 34 returned, 300 cancelled, 448 never sent
- Layer 2: Grade x Tech performance matrix — NONFUNC.USED confirmed best grade (£289 avg net, 0% loss), FUNC.CRACK highest volume (167 sold), NONFUNC.CRACK worst efficiency (£195 avg net, 3% loss, 266min bench time)
- Layer 3 partial: Logic board analysis — Saf is sole board-level capability (every LB repair goes through him), 50% of NONFUNC.USED needs board work, ammeter readings analysed against outcomes
- Stuck device report: 24 devices stuck 30+ days, £2,150 capital, individual triage list
- Condition mismatch analysis: 20% of NONFUNC.USED arrives actually functional, 79% screen mismatch on NONFUNC.USED
- Turnaround times by grade: NONFUNC.USED median 6 days, FUNC.CRACK median 5 days

### Key findings
- **Saf is the only person doing logic board work** — devices assigned to other techs for LB repairs were actually done by Saf then handed off for screen/refurb
- **Saf's throughput ramping:** 4/month (Sep) → 30/month (Feb) — not yet at ceiling
- **Saf wasting time on FUNC.CRACK:** 28 screen swaps at 193min each = ~90 hours on work any tech can do
- **NONFUNC.USED 50/50 split:** half need Saf (board), half don't (battery/LCD/adapter) — the non-board half scales freely
- **FUNC.CRACK returns:** 18 returned devices (highest of any grade) — needs investigation

### What's NOT done (Layer 3 gaps)
- Saf's diagnostic notes not pulled (requires per-item Monday API calls for item updates)
- No routine/moderate/complex/failed categorisation of board repairs
- Unknown parts (20+ items showing as Monday IDs, not resolved to names)
- Parts cost per device not broken out (mirrored column not in extract)

---

## Task 19: Layer 3 Completion — Saf Diagnostic Notes [DONE — completed as Task 22]

- Pull Monday item updates for all NONFUNC.USED + NONFUNC.CRACK devices where Saf did board work (~97 devices)
- Parse ammeter readings and fault descriptions from Saf's written notes
- Categorise repairs: routine (single component swap) / moderate (multi-component) / complex (liquid damage, trace work) / failed (BER)
- Cross-reference fault patterns with outcomes to identify teachable vs specialist-only repairs
- Resolve Unknown part IDs against Parts board

---

## Task 20: Stuck Device Triage [DONE]

**Date:** 2 March 2026
**Report:** `audit/stuck-device-triage-2026-03-02.md`

### Result: 43 stuck devices, £3,987 capital tied up

More than originally estimated (24 → 43) because the full 6-month dataset captured more.

| Bucket | Devices | Capital |
|--------|---------|---------|
| 90+ days | 10 | £819 |
| 60-90 days | 11 | £961 |
| 30-60 days | 22 | £2,207 |

### Immediate actions identified
- **Ship today:** 2 devices "Ready To Collect" (£282)
- **QC and ship:** 2 devices repaired but sitting (£290)
- **Chase Ferrari:** BM 1311 MBP14 M1Pro £248 — highest single value stuck
- **Priority rescues for Saf:** 4 high-value M1+ devices (£505)
- **Assign to tech:** 3 devices unassigned 33-89 days (£399)
- **Write off/strip:** 9 Intel BER devices (£459)
- **Chase parts:** 6 devices (£578)
- **Chase clients:** 2 devices (£310)

### Saf queue problem
22 of 43 stuck devices (51%) are on Saf's bench. 4 Intel + 5 BER should be cleared off immediately to free 9 slots.

---

## Task 21: Returns Investigation — All Grades [DONE → REPLACED BY Task 24]

**Phase 1-2 reports superseded by Task 24 forensic investigation.**

Previous summary reports: `audit/returns-investigation-2026-03-02.md`, `audit/returns-deep-dive-2026-03-03.md`

---

## Task 24: Forensic Returns Investigation — Per-Device [DONE]

**Date:** 3 March 2026
**Script:** `api/bm-returns-forensic.py`
**Data:** `audit/returns-forensic-2026-03-03.json` (45 per-device profiles)
**Report:** `audit/returns-forensic-2026-03-03.md`
**Source:** BM returns CSV (47 unique) × repair analysis data (534 devices) × Monday item updates (526 notes)

### What it does
- Parses UTF-16 BM returns CSV, groups by order ID (47 unique returns)
- Matches to repair chain data by date_sold ±3 days + model type
- Pulls ALL Monday item updates + replies for matched devices (41 unique IDs)
- Builds per-device forensic profiles with repair chain, timeline, condition, notes
- Auto-detects red flags from data (12 flag types)
- Rules-based root cause classification (7 categories)
- Pattern analysis: by cause, by person, by prevention measure, repeats, time distribution

### Results: 45/47 matched (96%)

| Root Cause | Count | Net at Risk |
|------------|-------|-------------|
| qc_failure | 12 (27%) | £1,891 |
| listing_error | 9 (20%) | £1,102 |
| unknown | 7 (16%) | £938 |
| repair_failure | 7 (16%) | £2,114 |
| transit_damage | 4 (9%) | £660 |
| buyers_remorse | 4 (9%) | £793 |
| cosmetic_mismatch | 2 (4%) | £688 |

**Total net at risk: £8,187**

### Key findings

**No feedback loop:** 42/45 returned devices have zero post-return notes. Nobody is logging what they find when devices come back. No post-mortem, no learning, same failures repeat.

**Ghost repairs:** 20 devices have parts installed but no repair person logged. 19 have 0 min repair time despite parts being swapped (LCDs, batteries, logic boards). No accountability trail for the repair itself.

**Condition grading unreliable:** 21/45 screen mismatches (47%), 20/45 casing mismatches (44%). Screens reported "Good" but actually "Damaged" is the most common. Wrong intake grading → wrong BM listing grade → customer gets something they didn't expect.

**Liquid damage = high risk:** 20/45 returns (44%) had liquid damage at intake. BM 1078 is the poster child: liquid damage → Saf repaired logic board → passed QC → sold for £1,099 → came back twice in one day (keyboard defects, then display issues).

**9 devices shipped with no QC evidence:** Technical customer complaints but zero QC notes in Monday. 6 of these 9 also had no repair person and 0 min repair time. A 2-minute boot test would have caught every one.

**84% returned within 3 days:** 17 within 0-1 days, 21 within 2-3 days. Customers opening the box and immediately seeing the problem — dispatch-side failures, not durability.

**4 repeat returners:** BM 1078 (2 returns, £2,198 sale value), BM 1216 (2 returns), BM 1130 (2 returns), BM 1103 (2 returns). Should have been pulled from sale after first return.

**Andres pattern:** Touched 16 returned devices, 9 had 0 min repair time with parts logged. 3 came back for boot failure.

**Financial:** Repair failures cost most per return (£302 avg). QC failures are most frequent and preventable (12 returns, £1,891). Listing errors are pure process (9 returns, nothing wrong with device).

### Per-device profiles include
- Pre-dispatch notes (repair chain, QC, listing) and post-return notes (split at sale date)
- Full repair chain (who, how long, their written Monday notes — Systems Manager automated templates filtered out)
- Condition mismatches (intake vs actual for battery/screen/casing/function)
- Timeline with days in repair + days with customer
- Serial numbers for 44/45 devices (pulled from Monday main board)
- 342 team notes across 45 profiles (526 raw, 184 Systems Manager noise filtered)
- Auto-detected flags + evidence-based root cause + preventive measure

---

## Task 22: Layer 3 — Saf Diagnostic Notes from Monday Replies [DONE]

**Date:** 2 March 2026
**Script:** `api/bm-saf-diagnostics.py` (supports `--all-clients` for future full Saf audit)
**Data:** `audit/saf-diagnostics-2026-03-02.json`
**Report:** `audit/saf-layer3-report-2026-03-02.md`

### Key findings
- 150 devices where Saf is repair_person, 146 with written notes (97%)
- Saf writes notes as **replies** to Monday Systems Manager updates, not top-level updates
- **Complexity (92 LB devices):** 32% routine (teachable), 31% moderate, 35% complex (specialist-only)
- **Top faults:** Liquid damage (33%), Keyboard (32%), Battery (20%), Charging IC (15%)
- **FUNC.CRACK investigation:** 20/37 had board issues found (justified). 17/37 needed component-level diagnosis (keyboard backlight, charging port, display flex, touch bar) — also justified, not screen swaps
- **Revised recommendation:** Don't remove Saf from FUNC.CRACK — he's there because he's needed

### Corrections to Layer 2 report
- Saf on FUNC.CRACK is NOT wasted time — original recommendation was wrong
- 34% of NONFUNC.USED on Saf's bench don't need board work — efficiency win by handing off after diagnosis

---

## Task 23: Zero Remaining Intel MBA Listings [DONE]

**Date:** 2 March 2026
**Log:** `audit/intel-zero-log-2026-03-02.json`

- Order GB-26101-VXNDF came in for Intel MBA — discovered 208 Intel MBA listings still active
- All MBA 2019 (i5) + 2020 (i3/i5/i7) were not caught by original repricing run (marked DEAD but not zeroed)
- All 208 zeroed via API — 208/208 success, 0 failures
- Intel MBPs (2016-2019) confirmed already at £0
- M1+ listings we killed confirmed dead
- M1+ active listings confirmed untouched

---

## Context for Next Session

### What's done (as of 2 March 2026)
- Layers 1-3 complete with corrected financials (parts + RR&D labour)
- Saf's diagnostic notes pulled and analysed — complexity categorisation done
- FUNC.CRACK Saf investigation complete — assignments justified
- All Intel listings confirmed zeroed (208 MBA + MBP)
- 365 repricing changes + 2 overbid fixes + 208 Intel zeroing + 18 buybox bumps = 593 total API changes
- Buybox recovery: 4 FC + 1 NFU bumped, ~£1,287/mo profit recovered
- Overpay eliminated by March 1 repricing (was ~£1,100/qtr waste)
- 19 fishing lines assessed — all winning buybox, all profitable or likely profitable
- 43 stuck devices triaged with per-device recommended actions (£3,987 capital)
- 47 BM returns analysed — 81% preventable, 44/47 matched to repair chain, £3,869 direct cost
- Strategy document: `audit/buybox-strategy-2026-03-02.md`

### What's next
- **Mandate post-return logging** — 42/45 devices came back with zero notes. Team must log what they find when a returned device arrives. Without this, there is no feedback loop.
- **Fix ghost repairs** — 20 devices had parts installed with no person and 0 min repair time. Either the time tracker is broken or the process isn't being followed. Investigate and enforce.
- **Tighten intake grading** — 47% screen mismatches, 44% casing mismatches between reported and actual. This drives listing errors.
- **Pull repeat returners from sale** — 4 devices were relisted after first return. Process needed to inspect before relisting.
- **Review stuck device triage** — Ricky to decide per-device actions (ship 2 now, write off 9, chase 6 parts)
- **Monitor recovered buyboxes** — next CSV export should confirm FC + NFU wins
- **Crossref refresh** — when new CSV available, refresh P&L data for fishing lines and new orders
- **Saf full diagnostic audit** — separate project scope. Script supports --all-clients.

### Key files
- `audit/buybox-strategy-2026-03-02.md` — **START HERE** — full buybox + price increase analysis
- `audit/stuck-device-triage-2026-03-02.md` — 43 stuck devices with per-device actions
- `audit/returns-forensic-2026-03-03.md` — **Per-device forensic investigation** — 45/47 matched, Monday notes, flags, root cause
- `audit/returns-forensic-2026-03-03.json` — Full per-device data (45 profiles with repair chain + notes)
- `api/bm-returns-forensic.py` — Forensic returns script (reusable with new CSV)
- `audit/buybox-audit-2026-03-01.json` — 50 survivors + 19 fishing lines with buybox data
- `audit/buybox-bump-log-2026-03-02.json` — 18 buybox recovery bumps (all 202 OK)
- `api/bm-bid-bump.py` — bid bump script (supports --grade, --increment, --execute)
- `audit/repair-analysis-report-2026-03-02.md` — Layers 1-3 report (corrected financials)
- `audit/saf-layer3-report-2026-03-02.md` — Layer 3 deep dive (Saf's repair complexity)
- `audit/repair-analysis-data-2026-03-02.json` — 1,256 orders, 534 matched
- `audit/saf-diagnostics-2026-03-02.json` — 150 Saf devices with notes + complexity
- `api/bm-repair-analysis.py` — Data collection script (parts cost + RR&D labour)
- `api/bm-saf-diagnostics.py` — Saf diagnostics (supports --all-clients)
- `docs/repair-analysis-plan.md` — North star document
