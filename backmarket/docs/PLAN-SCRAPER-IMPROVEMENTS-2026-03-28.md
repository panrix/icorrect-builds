# Plan: V6 Scraper Improvements

**Date:** 28 Mar 2026
**Author:** Code (orchestrator)
**For:** Codex build agent
**Status:** Ready to build

---

## Context

The V6 scraper (`buyback-monitor/sell_price_scraper_v6.js`) is a Playwright browser scraper that extracts pricing and product data from BM product pages. It's the only way to get this data — BM has no catalog API. ScrapingBee was tried before and always failed.

The scraper was hardened on 27 Mar (jitter, context rotation, backfill retry, Telegram alerting). Success rate recovered from 58% to 84%.

**Role:** The scraper is a market signal collector. It feeds the catalog merge (`bm-catalog-merge.py`) which is the single product resolver for the listing flow. It does NOT set prices — backbox does that.

---

## Three Changes

### 1. Move to Weekly Schedule

**Why:** Daily scraping increases Cloudflare detection risk with no benefit. Prices don't change hourly. The catalog merge and buy-box-check both work fine with weekly data.

**What to change:**

In `buyback-monitor/run-daily.sh`:
- The file already has a comment recommending weekly. Make it the actual schedule.

In the live crontab:
```bash
# Current:
0 5 * * * /home/ricky/builds/buyback-monitor/run-daily.sh

# Change to:
0 5 * * 1 /home/ricky/builds/buyback-monitor/run-daily.sh
```

Monday 05:00 UTC. Runs once a week. The buy-box-check and reconciliation scripts don't depend on same-day scraper data — they use cached listings and backbox API.

**Also rename the pipeline script** from `run-daily.sh` to `run-weekly.sh` for clarity. Update the crontab reference.

---

### 2. Add iPhone/iPad to the Weekly Run

**Why:** We trade in iPhones and iPads too. The scraper currently only runs the MacBook catalog (19 models). iPhone/iPad catalog exists at `buyback-monitor/scrape-urls-iphone-ipad.json` (51 models) but is never included in the scheduled run.

**What to change:**

In the pipeline script, change the scraper invocation from:
```bash
node sell_price_scraper_v6.js
```
to:
```bash
node sell_price_scraper_v6.js --all
```

The `--all` flag already exists in the scraper and loads both the MacBook and iPhone/iPad catalogs. Total: ~70 models (19 MacBook + 51 iPhone/iPad).

**Risk:** 70 models takes longer (~7-10 min vs ~3 min) and increases Cloudflare exposure. But weekly frequency offsets this. The context rotation (every 4-5 models) handles it.

**Also:** The iPhone/iPad catalog path in the scraper code has a bug. Line 28:
```js
const IPHONE_IPAD_CATALOGUE_PATH = path.join(BASE_DIR, 'scrape-urls-iphone-ipad.json');
```
But the file is at `config/scrape-urls-iphone-ipad.json` (inside the config subdirectory). Check and fix if needed — compare against where `scrape-urls.json` is loaded from (line 27).

---

### 3. Spec-Level Pricing (Derive Price Differentials from Pickers)

**Why:** Currently the scraper reports grade prices for the **default variant** of each model. A MacBook Air M1 8GB/256GB and a 16GB/512GB get the same grade prices. In reality, the 16GB/512GB is worth ~£200 more.

The data to fix this is **already in the scraper output** — it's just not being used. Each RAM/SSD/colour picker option has a `price` field that represents the price differential for selecting that option.

**What already exists in the output:**
```json
{
  "Air 13\" 2020 M1": {
    "grades": {
      "Fair": { "price": 350 },
      "Good": { "price": 408 }
    },
    "ram": {
      "8 GB": { "price": 432, "productId": "b5ebc79d-..." },
      "16 GB": { "price": 595, "productId": "0b11476c-..." }
    },
    "ssd": {
      "256 GB": { "price": 432, "productId": "..." },
      "512 GB": { "price": 510, "productId": "..." }
    }
  }
}
```

The picker `price` is the current lowest price for that specific option (e.g. £595 is the cheapest 16GB Air M1 on BM right now).

**What to build:**

A post-processing step in the scraper (or in the catalog merge) that derives per-spec grade prices:

1. For each model, take the base grade prices (default variant)
2. For each RAM option, calculate the delta from the default RAM price
3. For each SSD option, calculate the delta from the default SSD price
4. Apply deltas to produce estimated grade prices per spec combination

Example:
```
Base (8GB/256GB):  Fair £350, Good £408
RAM 16GB delta:    £595 - £432 = +£163
SSD 512GB delta:   £510 - £432 = +£78

Estimated 16GB/256GB Fair:  £350 + £163 = £513
Estimated 8GB/512GB Fair:   £350 + £78 = £428
Estimated 16GB/512GB Fair:  £350 + £163 + £78 = £591
```

These are estimates, not exact prices. But they're much better than using the base model price for every spec.

**Where this goes:**

Option A: Add to the scraper output as a `spec_prices` section per model. The catalog merge then reads it.

Option B: Add to the catalog merge as a post-processing step. The merge already has grade_prices per variant — enhance them with picker differentials when available.

**Recommendation: Option B.** Keep the scraper simple (just extract raw data). Let the merge script do the intelligence. The merge already handles combining sources.

**Implementation in `bm-catalog-merge.py`:**

After the main merge loop, for each variant that has no grade_prices but belongs to a model family with scraper data:

1. Find the base model in scraper data (by model_family → scraper model key)
2. Get the base grade prices
3. Get the RAM and SSD picker prices
4. Calculate deltas for the variant's RAM and SSD
5. Apply deltas to base grade prices
6. Store as `grade_prices` with a source tag like `derived_from_picker_delta`

This means the catalog's 151 verified entries (many currently with no grade prices) would gain estimated pricing. The listing flow's P&L calculation would then have market reference prices for far more devices.

**Important:** Derived prices should be tagged as `source: "derived"` in the catalog so downstream consumers can distinguish them from direct scraper prices (`source: "direct"`). The listing flow should treat derived prices as estimates — good enough for P&L reference but not as precise as backbox.

---

## Output Changes to bm-catalog.json

After all three changes, the catalog merge should produce grade_prices with a source field:

```json
{
  "grade_prices": {
    "Fair": 513,
    "Good": 571,
    "Excellent": 595
  },
  "grade_price_source": "derived_from_picker_delta"
}
```

Possible values for `grade_price_source`:
- `direct` — grade prices came directly from scraper for this exact product_id
- `derived_from_picker_delta` — estimated from base model + RAM/SSD picker differentials
- `none` — no pricing data available

---

## Files to Modify

| File | Change |
|------|--------|
| `buyback-monitor/run-daily.sh` | Rename to `run-weekly.sh`, add `--all` flag |
| `buyback-monitor/sell_price_scraper_v6.js` | Fix iPhone/iPad catalog path if wrong |
| `backmarket/analysis/bm-catalog-merge.py` | Add spec-level price derivation in post-processing |
| Crontab | Change `0 5 * * *` to `0 5 * * 1` |

---

## Verification

After changes:

1. `node sell_price_scraper_v6.js --all --dry-run` — confirm MacBook + iPhone/iPad catalogs both load
2. Run the catalog merge with `--dry-run` and `--verbose` — confirm derived prices appear for variants that previously had none
3. Show 3 examples of derived pricing (one where it's clearly different from the base model price)
4. Confirm the iPhone/iPad catalog path loads correctly

---

## What NOT to Change

- Scraper core logic (NUXT extraction, picker parsing, categorisation)
- Scraper output format (buy_box_monitor.py and sync_to_sheet.py still consume it)
- Hardening features (jitter, context rotation, backfill, alerting)
- CLI flags (--dry-run, --model, --iphone-ipad, --all)

---

## Acceptance Criteria

1. Weekly cron runs Monday 05:00 UTC with `--all` (MacBook + iPhone/iPad)
2. Catalog merge produces derived grade prices for variants using picker deltas
3. Derived prices are tagged with `grade_price_source: "derived_from_picker_delta"`
4. iPhone/iPad catalog loads without path errors
5. Pipeline script renamed to `run-weekly.sh`
