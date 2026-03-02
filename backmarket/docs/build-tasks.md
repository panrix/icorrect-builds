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

## Task 12: Execute Full Repricing Run [PENDING]

- 358 remaining changes (363 - 5 test batch)
- Command: `python3 bm-reprice.py --decisions ../audit/listing-decisions-3m-200.json --skip-dead --execute`
- Awaiting Ricky's go-ahead

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

## Task 16: Buybox Strategy & Bid Bumping [REVISED — PENDING FRESH CSV]

**Date:** 2 March 2026
**Script:** `api/bm-bid-bump.py` (built, dry-run tested)
**Report:** `audit/buybox-strategy-2026-03-02.md`
**Plan:** `audit/bid-bump-plan-2026-03-02.json`

### Strategy revision: blind bumping was WRONG

Buybox mapping revealed we **already win 88% of buyboxes** (44/50 survivors). Bumping would just increase costs.

### November price increase analysis
- Orders: +63% (64/mo → 104/mo)
- Total net: +23% (£11,224/mo → £13,828/mo)
- Per-order net: -24% (£176 → £133)
- NONFUNC.USED margins IMPROVED (+10%). FC margins dropped -30%, NFC -45%.

### Revised approach (needs fresh BM CSV export)
1. **Win 1 actionable loser:** MBP13 M2 8/256 NFU — bump +£4 (wins 9 orders/qtr)
2. **Reduce overpay on high-demand winners:** ~£1,100/qtr savings possible
   - MBP14 M1Pro FC: £273 → ~£225 (saves £256/qtr, no volume impact per monthly data)
   - MBA M1 NFU: £111 → ~£95 (saves £250/qtr)
   - MBP13 M1 NFU: £100 → ~£90 (saves £177/qtr)
3. **Push NONFUNC.USED** — only grade where higher bids improve margins
4. **Hold/reduce FUNC.CRACK** — volume grew but margins compressed

### Blocked on
- Fresh BM listings CSV export with `buybox_price`, `is_buybox`, `price_to_win` columns
- Ricky's decision on MBP14 M1Pro FC bid reduction

---

## Task 17: Fishing Line Promotion [PENDING]

- 5 high-demand M1+ DEAD SKUs need P&L data before max offers can be calculated
- Requires crossref data refresh (run bm-crossref.py with updated exports)
- Once P&L available, calculate max offers and set competitive prices
- These 5 SKUs represent ~27 orders/3m = 2/week additional volume

---

## Context for Next Session

### Key numbers (as of 2 March 2026)
- **6 accepted/day BM cap** for next 30 days
- At 37% send-in rate = 2.2 received/day = ~11/week
- ~£200-244 avg net/order = **£2,200/week = ~£9,500-12,000/month**
- 365 repricing changes executed (all 202 OK) + 2 overbid fixes
- NONFUNC.USED is the best grade: £284 avg net, 0% loss rate

### Scripts on VPS
- `/home/ricky/builds/backmarket/api/bm-reprice.py` — Phase 3 repricing
- `/home/ricky/builds/backmarket/api/bm-listing-optimizer.py` — Phase 1 decisions
- `/home/ricky/builds/backmarket/api/bm-pricing-report.py` — Phase 2 reports
- `/home/ricky/builds/backmarket/api/bm_utils.py` — shared utilities

### Audit files
- `listing-decisions-3m-200.json` — £200 flat scenario decisions
- `reprice-log-2026-03-01.json` — execution log (365 changes)
- `buybox-audit-2026-03-01.json` — buybox audit results
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

## Task 19: Layer 3 Completion — Saf Diagnostic Notes [PENDING]

- Pull Monday item updates for all NONFUNC.USED + NONFUNC.CRACK devices where Saf did board work (~97 devices)
- Parse ammeter readings and fault descriptions from Saf's written notes
- Categorise repairs: routine (single component swap) / moderate (multi-component) / complex (liquid damage, trace work) / failed (BER)
- Cross-reference fault patterns with outcomes to identify teachable vs specialist-only repairs
- Resolve Unknown part IDs against Parts board

---

## Task 20: Stuck Device Triage [PENDING]

- Present 24 stuck devices (30+ days) to Ricky/team for per-device decisions
- 90+ days (6 devices, £501): repair or write off
- 30-90 days (18 devices, £1,649): identify blockers per device
- Update Monday statuses based on decisions
- Track capital recovered

---

## Task 21: FUNC.CRACK Returns Investigation [PENDING]

- Pull return reasons from BM API or Monday board for 18 returned FUNC.CRACK devices
- Identify pattern: QC gap, cosmetic issues, or customer complaints
- If QC gap: recommend checklist changes

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

### What's done
- Layers 1-3 complete with corrected financials (parts + RR&D labour)
- Saf's diagnostic notes pulled and analysed — complexity categorisation done
- FUNC.CRACK Saf investigation complete — assignments justified
- All Intel listings confirmed zeroed
- 365 repricing changes + 2 overbid fixes + 208 Intel zeroing = 575 total API changes
- Buybox mapping complete: 88% of survivor SKUs already winning
- November price increase analysis: +63% orders, +23% total net, NFU margins improved, FC/NFC margins compressed
- Bid bump script built and dry-run tested (`api/bm-bid-bump.py`)
- Strategy document written: `audit/buybox-strategy-2026-03-02.md`

### What's next (blocked on fresh BM CSV export)
- **Task 16: Buybox strategy** — REVISED. Not blind bumping. Win 1 loser (+£4), reduce overpay on winners (~£1,100/qtr savings), push NFU. Needs fresh CSV with buybox data.
- **Task 17: Fishing line promotion** — all 19 fishing lines winning buybox. Need P&L data (crossref refresh) to confirm profitability.
- **Task 20: Stuck device triage** — 24 devices 30+ days, £2,150 capital. Per-device decisions with team.
- **Task 21: FUNC.CRACK returns** — 18 returned devices need return reason analysis
- **Saf full diagnostic audit** — separate project scope. Script supports --all-clients.

### Key files
- `audit/buybox-strategy-2026-03-02.md` — **START HERE** — full buybox + price increase analysis
- `audit/buybox-audit-2026-03-01.json` — 50 survivors + 19 fishing lines with buybox data
- `audit/bid-bump-plan-2026-03-02.json` — dry-run bump plan (66 listings, pre-strategy revision)
- `api/bm-bid-bump.py` — bid bump script (supports --grade, --increment, --execute)
- `audit/repair-analysis-report-2026-03-02.md` — Layers 1-3 report (corrected financials)
- `audit/saf-layer3-report-2026-03-02.md` — Layer 3 deep dive (Saf's repair complexity)
- `audit/repair-analysis-data-2026-03-02.json` — 1,256 orders, 534 matched
- `audit/saf-diagnostics-2026-03-02.json` — 150 Saf devices with notes + complexity
- `api/bm-repair-analysis.py` — Data collection script (parts cost + RR&D labour)
- `api/bm-saf-diagnostics.py` — Saf diagnostics (supports --all-clients)
- `docs/repair-analysis-plan.md` — North star document

### For next Code session
1. Ricky uploads fresh BM listings CSV to `builds/backmarket/docs/`
2. Code re-runs buybox analysis with fresh data
3. Build overpay reduction plan + targeted bump plan
4. Execute changes with Ricky's approval
