# Research: BM Catalog Scraper (Ground Truth Data)

**Date:** 27 Mar 2026
**Author:** Code
**Status:** Research — ready for Codex agent to plan + build
**Priority:** HIGH — everything downstream (listing flow, product resolution, pricing, buy box) depends on this data being reliable

---

## The Problem

iCorrect has **zero reliable ground truth** for Back Market's catalog. Every critical BM operation depends on knowing which `product_id` maps to which exact spec, what the current sell prices are, and which variants are available. Right now we're working from:

1. A browser scraper (`sell_price_scraper_v7.js`) that fails ~30-40% of the time due to Cloudflare blocks
2. A static lookup table (`product-id-lookup.json`) built from our own 832 historical listings — which only covers specs we've listed before
3. Manual knowledge in people's heads

This means:
- The listing flow cannot safely resolve `product_id` for devices we haven't listed before
- Pricing decisions are based on incomplete/stale market data
- The estate-wide classifier (needed for the listings rebuild) has no verified spec data to compare against
- Buy box monitoring only works for models that scraped successfully that day

**Until this is fixed, the listings rebuild is blocked.** The trust implementation plan identifies "trusted product resolution" as the main blocker, and this is the data layer underneath it.

---

## What Exists Today

### V6 Scraper (`buyback-monitor/sell_price_scraper_v7.js`)

**What it does:**
- Launches headless Chromium with puppeteer-extra stealth plugin
- Visits BM product pages by UUID (e.g. `backmarket.co.uk/en-gb/p/placeholder/{uuid}`)
- Extracts `__NUXT_DATA__` payload from rendered HTML
- Parses picker data: grades (with prices), RAM, SSD, CPU/GPU, colour, size
- Each picker option includes: label, price, availability, and `productId` (when available)
- Outputs daily JSON to `buyback-monitor/data/sell-prices-YYYY-MM-DD.json`

**Catalogue coverage:**
- Default scheduled run is weekly and should include MacBook + iPhone/iPad via `--all`
- iPhone/iPad catalogue exists (`config/scrape-urls-iphone-ipad.json`, 51 models) and is part of the weekly run
- Expanded catalogue exists (`config/scrape-urls-expanded.json`, 100 models) but is NOT in the weekly run

**Success rate (last 10 days):**

| Date | Success | Total | Rate | Notes |
|------|---------|-------|------|-------|
| Mar 18 | 16 | 16 | 100% | Before Intel models added |
| Mar 19 | 16 | 16 | 100% | |
| Mar 20 | 15 | 16 | 94% | |
| Mar 21 | 15 | 16 | 94% | |
| Mar 22 | 18 | 19 | 95% | Intel models added |
| Mar 23 | 18 | 19 | 95% | |
| Mar 24 | 17 | 19 | 89% | |
| Mar 25 | 16 | 19 | 84% | |
| Mar 26 | 16 | 19 | 84% | |
| Mar 27 | 11 | 19 | 58% | 6 Cloudflare blocks |

**Trend:** degrading. Cloudflare is getting better at detecting the scraper. The stealth plugin is no longer sufficient on its own.

**Failed models (Mar 27):** Air M3, Pro 13" M1, Pro 14" M2 Pro, Pro 16" M1 Pro, Pro 16" M3 Pro, Air Intel i5 Gold 512 — all `cloudflare_blocked`.

**Anti-detection measures currently in place:**
- `puppeteer-extra-plugin-stealth` (patches navigator, webdriver, etc.)
- Homepage warmup visit before scraping (sets cookies, passes initial CF challenge)
- 3-second wait after page load
- 5-second delay between retry attempts
- 2 attempts per model
- Realistic user agent, viewport, locale, timezone

**What's missing from anti-detection:**
- No request spacing/jitter between models (sequential but fast)
- No cookie/session rotation between models
- No IP rotation or proxy support
- No fingerprint randomization between runs
- No Cloudflare Turnstile/challenge solver
- Same browser context (and therefore same fingerprint) used for all 19 models in sequence

### Product ID Lookup Table (`backmarket/data/product-id-lookup.json`)

**What it is:** A map of 279 unique `product_id` UUIDs to their verified BM specs, built from our own existing listings.

**Structure per entry:**
```json
{
  "06adb5b3-3dbd-4a84-aa94-ea328c464357": {
    "title": "MacBook Pro 14-inch (2021) - Apple M1 Pro 8-core and 14-core GPU - 16GB RAM - SSD 1000GB - QWERTY - English",
    "backmarket_id": 543508,
    "grades": ["VERY_GOOD"],
    "listing_ids": [6675394]
  }
}
```

**Strengths:**
- The `title` is BM's auto-generated title from the `product_id` — it IS the verified spec
- 279 entries covers a decent range of what we actually sell
- Maps to `backmarket_id` (BM's internal catalog number)

**Weaknesses:**
- Only covers specs we've previously listed — no coverage for new models or specs we haven't sold
- No price data
- No availability data (is this spec currently active on BM?)
- No timestamp — we don't know when these were last verified as valid
- The `grades` array only shows grades WE have listed, not all grades BM supports for that product
- Duplicate copies exist at `bm-scripts/data/product-id-lookup.json` and `backmarket/data/product-id-lookup.json` — no canonical location declared

### V6 Output Format (What a Successful Scrape Produces)

Example for Air 13" 2020 M1:
```json
{
  "uuid": "b5ebc79d-0304-41a6-b1ae-d2a487afa11f",
  "url": "https://...",
  "scraped": true,
  "grades": {
    "Fair": { "price": 350, "available": true },
    "Good": { "price": 408, "available": true },
    "Excellent": { "price": 432, "available": true },
    "Premium": { "price": null, "available": false }
  },
  "ram": {
    "8 GB": { "price": 432, "available": true, "productId": "b5ebc79d-..." },
    "16 GB": { "price": 595, "available": true, "productId": "0b11476c-..." }
  },
  "ssd": { ... },
  "cpu_gpu": { ... },
  "colour": {
    "Space Gray": { "price": 432, "available": true, "productId": "..." },
    "Silver": { "price": 432, "available": true, "productId": "..." },
    "Gold": { "price": 432, "available": true, "productId": "..." }
  }
}
```

**Critical limitation:** Picker `productId` values are per-option, not per-combination. The RAM picker's `productId` for "16 GB" is the default 16GB variant (default SSD, default colour). It is NOT necessarily the `product_id` for 16GB + 512GB + Silver. The correct combination-level `product_id` requires either:
- Cross-referencing multiple picker selections (which the scraper doesn't do)
- Looking it up in the product-id-lookup table
- Hitting the BM page with specific picker selections and reading the resulting `product_id`

**Also:** Sold-out picker options show `productId: null`. BM does not expose the UUID for specs with zero sellers. This is a hard BM platform limitation — no workaround via scraping.

---

## What We Need

A weekly catalog snapshot that provides **ground truth** for every BM product spec iCorrect trades in. Specifically:

### Required Data Per Product Variant

| Field | Why | Source |
|-------|-----|--------|
| `product_id` (UUID) | Exact BM variant identity — used to create/verify listings | Picker data, existing listings |
| `backmarket_id` | BM's internal catalog number | Page data or existing listings |
| `title` | BM's auto-generated spec title — THE verified spec description | Page data or listing API |
| `model_family` | e.g. "MacBook Pro 14-inch (2023)" | Derived from title |
| `ram` | e.g. "16GB" | Picker or title |
| `ssd` | e.g. "512GB" | Picker or title |
| `cpu_gpu` | e.g. "M3 Pro 11-core and 14-core GPU" | Picker or title |
| `colour` | e.g. "Space Black" | Picker data |
| `grade_prices` | Price per grade (Fair/Good/Excellent/Premium) | Picker data |
| `grade_availability` | Which grades have stock | Picker data |
| `available` | Is this variant currently active on BM | Picker data |
| `scraped_at` | When this data was collected | Timestamp |

### Required Coverage

**Minimum (what we list/trade):**
- All MacBook Air models (M1 onwards + Intel variants we trade in)
- All MacBook Pro models (M1 onwards)
- Total: ~20-25 parent models × variants = ~200-400 product_ids

**Target (full catalog for pricing intelligence):**
- Above plus iPhone, iPad models we trade in
- Total: ~70-100 parent models

### Required Reliability

- **Weekly minimum** — data must be fresh within 7 days for pricing/listing decisions
- **>90% success rate** — a scrape run must capture at least 90% of the target catalog
- **Retry/backfill** — if a model fails, it gets retried (same day or next day) until captured
- **Alerting** — if success rate drops below threshold, alert Telegram so it gets fixed before it compounds

### Required Output Format

A single canonical JSON file that downstream systems can consume:

```json
{
  "scraped_at": "2026-03-27T05:00:00Z",
  "catalog_version": "2026-W13",
  "models": {
    "MacBook Air 13\" 2020 M1": {
      "parent_uuid": "b5ebc79d-...",
      "variants": [
        {
          "product_id": "b5ebc79d-...",
          "backmarket_id": 456789,
          "title": "MacBook Air 13-inch (2020) - Apple M1 - 8GB RAM - SSD 256GB - QWERTY - English",
          "ram": "8GB",
          "ssd": "256GB",
          "cpu_gpu": "Apple M1",
          "colour": "Space Gray",
          "grades": {
            "Fair": { "price": 350, "available": true },
            "Good": { "price": 408, "available": true },
            "Excellent": { "price": 432, "available": true },
            "Premium": { "price": null, "available": false }
          },
          "resolution_source": "scraper_picker"
        },
        {
          "product_id": "0b11476c-...",
          "title": "MacBook Air 13-inch (2020) - Apple M1 - 16GB RAM - SSD 256GB ...",
          "ram": "16GB",
          "ssd": "256GB",
          "colour": "Space Gray",
          "grades": { ... },
          "resolution_source": "scraper_picker"
        }
      ]
    }
  },
  "summary": {
    "total_models": 20,
    "scraped_ok": 19,
    "failed": 1,
    "total_variants": 279,
    "variants_with_product_id": 245,
    "variants_without_product_id": 34
  }
}
```

This replaces both the V6 output AND the product-id-lookup table as a single source of truth.

---

## Constraints

### BM Does Not Expose a Catalog API

There is no API endpoint to query BM's product catalog, get product_ids, or list available specs. The only ways to get this data are:

1. **Browser scraping** — visit product pages, extract `__NUXT_DATA__` picker payloads
2. **Our own listing data** — product_ids from listings we've already created
3. **Our own order data** — product_ids from completed sales (`GET /ws/orders?state=9`)

Browser scraping is the only way to discover product_ids for specs we haven't listed or sold before.

### Cloudflare Protection

BM uses Cloudflare with increasing sophistication. The current stealth plugin approach is degrading. Any rebuild must account for this. Options:

1. **Better stealth** — fingerprint randomization, request jitter, session rotation, residential proxy
2. **Headful browser** — run with a visible browser on a VPS with desktop environment (heavier but harder to detect)
3. **Cloud browser service** — Browserless.io, ScrapingBee, etc. (cost, but handles anti-bot)
4. **Accept partial data** — scrape what we can, fill gaps from lookup table and order history

### Sold-Out Specs Have No product_id

BM's pickers show `productId: null` for specs with zero active sellers. This is a hard platform limitation. We can only get product_ids for:
- Specs currently for sale (scraper)
- Specs we've listed before (lookup table)
- Specs we've sold before (order history)

For genuinely new specs that nobody has ever listed, we cannot get the product_id via any automated means. These must be parked for manual review.

### Picker product_ids Are Per-Option, Not Per-Combination

The RAM picker for "16 GB" gives one product_id — the default variant for that RAM tier. To get the exact product_id for 16GB + 1TB + Silver, you'd need to:
- Select those specific picker options on the page and read the resulting product_id
- Or cross-reference with the lookup table
- Or hit a multi-picker selection endpoint (not known to exist)

This is a structural limitation of the current scraping approach.

---

## What Needs to Happen

### Decision: What The Scraper Is And Is Not Allowed To Do

The V7 scraper should be treated as a **market signal collector**, not as a standalone source of truth for exact listing identity.

That means:
- It **is** allowed to tell us which parent models are live, what picker values exist, and what the current grade prices look like.
- It **is** allowed to discover some `product_id` values for available options.
- It is **not** allowed to assert an exact combination-level `product_id` unless that UUID is corroborated by a verified source (existing listing / completed order / explicit combination re-read).
- It is **not** allowed to fill gaps for sold-out specs with guesswork.

This needs to be explicit because several downstream docs and scripts still implicitly treat picker-level `productId` data as if it were exact per-combination truth. That is not defensible given the current evidence.

### Phase 1: Make the Current Scraper Reliable

Before rebuilding from scratch, harden what exists:

1. **Add request jitter** — random 2-8 second delay between model scrapes
2. **Rotate browser context** — fresh context (new fingerprint + cookies) every 5-6 models
3. **Add retry with backfill** — if a model fails, queue it for a second pass at end of run with fresh context
4. **Add success rate alerting** — if <90% success, send Telegram alert
5. **Run iPhone/iPad catalog** — use `--all` in the weekly cron so we capture the full device range
6. **Move to weekly** — daily scraping increases detection risk; weekly is sufficient for pricing decisions

**Implementation note:** the active scraper already supports `--iphone-ipad`, `--all`, `--dry-run`, and `--model`. The immediate reliability work is therefore operational and code-hardening, not a greenfield rebuild.

### Phase 2: Merge Scraper Output with Lookup Table

Build a post-processing step that:

1. Takes the weekly scrape output
2. Merges with existing `product-id-lookup.json` (which has verified product_ids from our listings)
3. Merges with order history product_ids (`GET /ws/orders?state=9`)
4. Produces a single canonical `bm-catalog.json` with the combined/verified data
5. Flags new product_ids discovered by the scraper that aren't in the lookup table
6. Flags lookup table entries not seen in the scrape (potentially delisted)

**Additional merge source required:** historical order data and verified live listing exports should be treated as first-class evidence, not optional enrichment. They are the only non-scraper sources that can prove exact UUID-to-title mappings at scale.

### Phase 3: Make Output Usable by Listing Flow

The canonical catalog file should be directly consumable by `list-device.js`:

1. Given a device's model + RAM + SSD + colour → resolve exact `product_id`
2. Return confidence level: `exact_verified`, `historical_verified`, `market_only`, `not_found`
3. Return current market prices per grade for P&L calculation
4. Return availability status

This replaces the current multi-source product resolution mess with a single lookup.

**Important correction:** `market_only` data must not be sufficient for automatic live listing. It can support pricing and manual review, but not final product resolution.

### Phase 4: Canonical Resolver Contract

The fix is not complete until there is one canonical resolver contract that every downstream script uses.

For each variant, the canonical file should record:

| Field | Meaning |
|-------|---------|
| `product_id` | UUID candidate |
| `title` | Verified BM title, if known |
| `backmarket_id` | Exact BM catalog ID, if known |
| `evidence_sources` | e.g. `listing_history`, `order_history`, `scraper_picker`, `scraper_base` |
| `resolution_confidence` | `exact_verified`, `historical_verified`, `market_only`, `not_found` |
| `verification_status` | `verified`, `needs_review`, `unverifiable_sold_out` |
| `last_seen_at` | Last successful evidence timestamp |
| `grade_prices` | Market pricing snapshot |
| `available` | Whether BM currently shows stock for that variant or parent option |

Downstream rule:
- `exact_verified` and `historical_verified` may be used for live listing, subject to post-create verification.
- `market_only` may be used for pricing context and manual review only.
- `not_found` and `unverifiable_sold_out` must block listing.

---

## Current File Locations

| File | Path | Status |
|------|------|--------|
| V7 scraper (primary) | `/home/ricky/builds/buyback-monitor/sell_price_scraper_v7.js` | Active, weekly cron |
| V7 scraper (mirror) | `/home/ricky/builds/backmarket/scraper/sell_price_scraper_v7.js` | Stale copy — do not use |
| MacBook catalog | `/home/ricky/builds/buyback-monitor/config/scrape-urls.json` | 19 models |
| iPhone/iPad catalog | `/home/ricky/builds/buyback-monitor/config/scrape-urls-iphone-ipad.json` | 51 models, included via `--all` |
| Expanded catalog | `/home/ricky/builds/buyback-monitor/config/scrape-urls-expanded.json` | 100 models, not in weekly run |
| Daily output | `/home/ricky/builds/buyback-monitor/data/sell-prices-YYYY-MM-DD.json` | 10 days of history |
| Latest output symlink | `/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json` | Points to today |
| Product ID lookup (copy 1) | `/home/ricky/builds/backmarket/data/product-id-lookup.json` | 279 entries |
| Product ID lookup (copy 2) | `/home/ricky/builds/bm-scripts/data/product-id-lookup.json` | 279 entries (identical) |
| BM product IDs knowledge doc | `/home/ricky/builds/backmarket/knowledge/bm-product-ids.md` | Good reference |
| Weekly pipeline script | `/home/ricky/builds/buyback-monitor/run-weekly.sh` | Runs V6 (`--all`) → buy box monitor → sheet sync |
| Cron entry | `0 5 * * 1` | `/home/ricky/builds/buyback-monitor/run-weekly.sh` |
| Logs | `/home/ricky/logs/buyback/buy-box-YYYY-MM-DD.log` | Per-run log |

---

## Downstream Consumers (What Breaks Without This Data)

| System | Needs from catalog | Current state |
|--------|-------------------|---------------|
| `list-device.js` — product resolution | Exact `product_id` for model+spec+colour | Falls back to lookup table, then V6, then Intel hardcoded. Unreliable for new devices. |
| `list-device.js` — P&L calculation | Current sell prices per grade | Uses V6 scrape data when available. Missing data = no pricing context. |
| `buy-box-check.js` | Current competitor prices | Reads V6 output. Missing models = blind. |
| `buy_box_monitor.py` | Daily price comparison | Reads V6 output. Failed scrapes = gaps. |
| Estate-wide classifier | Verified spec per product_id | Doesn't exist yet. Blocked by unreliable catalog data. |
| `listings-audit.js` | product_id → expected spec mapping | Uses lookup table. 487 of 828 listings unparseable. |
| `reconcile-listings.js` | product_id verification | Limited to lookup table. |

---

## Risks

1. **Cloudflare escalation** — BM could upgrade to Turnstile or full bot management. Browser scraping may become impossible. No alternative data source exists.
2. **NUXT format change** — BM could change their frontend framework or data format. The scraper would break silently. Need change detection.
3. **Rate limiting** — Scraping 100 models weekly from one IP could trigger IP-level blocks. May need proxy rotation for the expanded catalog.
4. **Data drift** — If scraping fails for 2+ weeks, all downstream pricing and product data goes stale. Need staleness alerting.

---

## Open Questions for Builder

1. **Proxy strategy** — Do we invest in a residential proxy for reliability, or try to make stealth good enough? Cost vs reliability tradeoff.
2. **Cloud browser service** — Worth evaluating Browserless.io / ScrapingBee as a managed alternative? They handle anti-bot. Adds cost (~$50-100/mo) but eliminates the arms race.
3. **Combination-level product_ids** — Can we scrape by selecting specific picker combinations on the page? This would give exact product_ids per variant instead of per-option defaults. More requests but more accurate.
4. **Order history enrichment** — Should we pull all historical order product_ids via BM API as a one-time enrichment to the lookup table? This is free data we already have.
5. **Canonical location** — Where should the merged catalog file live? Suggest `backmarket/data/bm-catalog.json` in the tracked repo.

---

## Recommended Build Order

If this work is handed to a Codex agent, the highest-signal order is:

1. **Declare one canonical output file**
   `backmarket/data/bm-catalog.json`

2. **Build a merge job before rebuilding the scraper**
   Merge:
   - current lookup table
   - historical order product_ids
   - verified listing history
   - latest scraper output

   This immediately improves trust even before scraper reliability is fixed.

3. **Add confidence + verification fields**
   So downstream consumers stop treating all UUIDs equally.

4. **Refactor consumers to read the canonical file**
   First:
   - `list-device.js`
   - `listings-audit.js`
   - `reconcile-listings.js`
   Then:
   - `buy-box-check.js`
   - monitoring/reporting jobs

5. **Only then harden the scraper runtime**
   Add jitter, context rotation, retry/backfill, and alerting.

6. **Only after the above expand catalog coverage**
   Add iPhone/iPad and the larger model set once the pipeline is trustworthy.

This order matters because a more reliable scraper alone still leaves the core trust problem unsolved.

---

## Immediate Conclusions

- The current V7 scraper should remain in service short-term, but only as an input, not the truth.
- The real fix is a canonical merged catalog with explicit confidence levels.
- Sold-out and never-listed specs remain a hard blocker; they must be parked, not guessed.
- The listings rebuild should stay blocked on exact product resolution, but pricing work can proceed from market data once the canonical file exists.

---

## QA Notes (2026-03-28)

This section records QA of the implemented scraper-improvement work across:
- `buyback-monitor/sell_price_scraper_v7.js`
- `buyback-monitor/run-weekly.sh`
- `backmarket/analysis/bm-catalog-merge.py`
- `backmarket/data/bm-catalog.json`

### Resolved

1. **Weekly schedule**
   Implemented. The pipeline script has been renamed to `run-weekly.sh` and the live crontab now runs it on Monday at `05:00 UTC` (`0 5 * * 1`).

2. **iPhone/iPad inclusion in the scheduled run**
   Implemented. The weekly runner now calls:
   ```bash
   node sell_price_scraper_v7.js --all
   ```
   and the iPhone/iPad catalogue path was corrected to:
   `buyback-monitor/config/scrape-urls-iphone-ipad.json`

3. **Spec-level pricing derivation**
   Implemented for MacBook variants in `bm-catalog-merge.py`.
   The catalog now includes:
   - `grade_prices`
   - `grade_price_source`

   Supported `grade_price_source` values:
   - `direct`
   - `derived_from_picker_delta`
   - `none`

   Current output after regeneration:
   - `grade_prices_direct: 16`
   - `grade_prices_derived: 42`
   - `grade_prices_none: 251`

### Findings

1. **HIGH — iPhone/iPad scraper data is captured but not yet merged into catalog-derived pricing**

The weekly pipeline now scrapes iPhone/iPad models, but the merge-side family parsing and pricing derivation remain MacBook-centric.

Current effect:
- iPhone/iPad scraper output exists
- iPhone/iPad rows can appear in scraper data
- but the `bm-catalog.json` merge does not currently derive `grade_prices` for iPhone/iPad catalog entries the way it does for MacBooks

Reason:
- `derive_model_family_from_scraper_name()` only maps MacBook-style scraper names
- `build_scraper_pricing_index()` therefore only builds derived-pricing records for MacBook families
- many iPhone/iPad catalog entries from order/listing history still lack the family/spec structure needed for merge-side price derivation

**Resolution required:**
- extend merge-side family parsing/indexing for iPhone/iPad model names and BM title formats, or
- explicitly treat iPhone/iPad pricing as scraper-output-only until that parser exists

Until that is done, the weekly `--all` run improves market visibility but does **not** fully extend catalog-derived pricing to iPhone/iPad variants.

2. **MEDIUM — One direct-priced market-only entry still has incomplete specs**

There are still edge cases where a scraper base UUID can carry direct grade prices while core spec fields remain incomplete.

This is not currently dangerous because:
- `verification_status` downgrades incomplete entries
- downstream listing resolution still blocks non-verified entries

But it is slightly misleading from a catalog hygiene perspective.

Suggested cleanup:
- only assign direct grade pricing when at least `model_family` is present
- optionally require full core specs before treating direct prices as normal catalog pricing

3. **LOW — iPhone/iPad catalogue size differs from the planning assumption**

The plan text assumed `51` iPhone/iPad entries.
The currently loaded file used by the weekly dry-run produced `27` iPhone/iPad models, giving `46` total scheduled models (`19` MacBook + `27` iPhone/iPad).

This is a documentation/planning mismatch, not a code bug.

4. **LOW — Derived prices are colour-agnostic**

Derived pricing currently uses RAM and SSD picker deltas.
It does not apply colour-specific pricing differentials.

That is acceptable for now and materially better than base-price reuse, but downstream consumers should treat derived prices as market estimates rather than exact colour-level truth.

### Current Verdict

- **MacBook improvements:** implemented and working
- **Weekly pipeline:** implemented and live
- **Catalog pricing coverage:** materially improved for MacBooks
- **iPhone/iPad merge-side pricing:** still incomplete and remains the next follow-up task if full cross-category pricing coverage is required
