# Build Brief: V7 Pipeline Rewrite

**ID:** buyback-v7-pipeline-rewrite
**Owner:** codex-builder
**Created:** 2026-04-14
**Decision:** Option 2 — rewrite downstream to consume v7 natively (not adapter shim)

---

## Problem

The sell-price scraper was rewritten to v7 (`sell_price_scraper_v7.js`), which outputs a completely different contract from the old scraper. The old schema used `results[]` with `parsed_spec` and `grades` arrays. V7 outputs a `models` dict with per-model picker tables (`grades`, `ram`, `ssd`, `cpu_gpu`, `colour`, `size`).

The pipeline is broken in the middle:
- `sell_price_scraper_v7.js` writes v7 format ✅
- `generate_sell_lookup.py` expects old format ❌
- `run_price_pipeline.py` calls old `sell_price_scraper.py` ❌
- Downstream consumers (`buy_box_monitor.py`, `sync_to_sheet.py`, `bm-catalog-merge.py`) may reference old schema ❌

**Known defect:** v7 derived child models inherit parent picker tables unfiltered (impossible combinations).

---

## V7 Output Contract (source of truth)

File: `sell-prices-YYYY-MM-DD.json` / `sell-prices-latest.json`

```json
{
  "scraped_at": "2026-04-12T05:02:39.668Z",
  "models": {
    "Air 13\" 2020 M1": {
      "uuid": "b5ebc79d-...",
      "url": "https://www.backmarket.co.uk/...",
      "scraped": true,
      "grades": {
        "Fair": {"price": 371, "available": true},
        "Good": {"price": 387, "available": true},
        "Excellent": {"price": 430, "available": true},
        "Premium": {"price": 565, "available": true}
      },
      "ram": {"8 GB": {"price": 430, "available": true, "productId": "..."}},
      "ssd": {"256 GB": {"price": 430, "available": true, "productId": "..."}},
      "cpu_gpu": {"Apple M1 8-core - 7-core GPU": {...}},
      "colour": {"Space Gray": {...}},
      "size": {"13 \"": {...}}
    }
  },
  "summary": {
    "total_models": 42,
    "scraped_ok": 40,
    "failed": 2,
    "total_pickers": 180
  }
}
```

---

## Scope

### 1. Rewrite `generate_sell_lookup.py`

**Input:** v7 `sell-prices-latest.json` (models dict with picker tables)
**Output:** `sell-price-lookup.json` (same output schema as today — `by_spec`, `by_family`, `by_apple_model` — no downstream change)

Changes:
- Parse v7 `models` dict instead of old `results[]`
- Extract spec dimensions (type, size, year, chip, ram, storage) from the model name string + picker keys
- Map v7 grade names (`Fair`/`Good`/`Excellent`/`Premium`) to lookup grades (`fair`/`good`/`excellent`/`premium`)
- Build spec keys from picker dimensions: `MODEL.YEAR.CHIP.RAM.STORAGE`
- For models with multiple RAM/SSD options, emit one lookup entry per combination
- Handle derived child models: filter picker values to only valid combinations for that child
- Preserve existing lookup key format: `MBA13.2022.M2.8GB.256GB`
- Preserve existing output path and schema so buy_box_monitor.py needs zero changes

**Model name parser** — extract from v7 model key strings like:
- `"Air 13\" 2020 M1"` → type=air, size=13, year=2020, chip=M1
- `"Pro 14\" 2023 M3 Pro"` → type=pro, size=14, year=2023, chip=M3PRO
- `"Pro 16\" 2023 M3 Max"` → type=pro, size=16, year=2023, chip=M3MAX

**RAM/SSD extraction** — from picker keys:
- `"8 GB"` → 8GB
- `"256 GB"` → 256GB
- `"1 TB"` → 1TB

### 2. Update `run_price_pipeline.py`

- Step 1: call `node sell_price_scraper_v7.js` instead of `python3 sell_price_scraper.py`
- Step 2: call `python3 generate_sell_lookup.py` (reads from `data/sell-prices-latest.json`)
- Step 3: call `python3 sync_to_sheet.py` (unchanged)
- Pass through CLI flags (`--dry-run`, `--force`, `--no-sheet`, `--model`)

### 3. Update `sync_to_sheet.py`

- Read v7 `models` dict instead of old results array
- Extract per-model: grades with prices, RAM/SSD/colour/size picker values, productIds
- Output columns remain: Model, Model No(s), Year, Screen, Chip, RAM, SSD, Colour, Grade, Product ID, Listing ID, Price, Min Price, Last Scraped

### 4. Update `bm-catalog-merge.py`

- Read v7 `models` dict to extract UUID → model name mappings
- Handle `uuid` field at model level (not nested in results)

### 5. Verify `buy_box_monitor.py` compatibility

- Currently loads `sell-prices-latest.json` via `load_sell_price_lookup()`
- If it reads the lookup JSON (output of generate_sell_lookup.py), no changes needed
- If it reads the raw scraper JSON directly, update to v7 format
- Verify `SKU_TO_SCRAPER_MODEL` mappings still resolve against v7 model names
- Verify `BM_GRADE_TO_SCRAPER` grade mapping still works

### 6. Fix derived model defect

- In `generate_sell_lookup.py`, when processing derived/child models (those with `parent` field):
  - Only include picker values that are valid for the child variant
  - E.g., M1 Pro 10-core should not inherit M1 Max 10-core GPU pickers

### 7. Cleanup

- Archive `sell_price_scraper.py` (old Python scraper) — do NOT delete, move to `archive/`
- Remove any dead imports or references to old schema field names

---

## Files to modify

| File | Action |
|------|--------|
| `generate_sell_lookup.py` | Rewrite parser to consume v7 models dict |
| `run_price_pipeline.py` | Update step 1 to call v7 JS scraper |
| `sync_to_sheet.py` | Update reader to v7 models dict |
| `bm-catalog-merge.py` | Update reader to v7 models dict (in `analysis/`) |
| `buy_box_monitor.py` | Verify; update if reads raw scraper output |
| `sell_price_scraper.py` | Move to `archive/` |

---

## Test plan

1. Run `python3 generate_sell_lookup.py` against `data/sell-prices-latest.json` (v7 output)
2. Verify `sell-price-lookup.json` has entries in `by_spec` for all scraped models
3. Spot-check: `MBA13.2020.M1.8GB.256GB` should have fair/good/excellent/premium prices
4. Spot-check: derived models should NOT have impossible spec combinations
5. Run `python3 sync_to_sheet.py --dry-run` and verify output rows
6. Run `python3 buy_box_monitor.py --dry-run --limit 5` and verify sell price resolution
7. Compare sell-price-lookup.json entry count vs v7 model count — should be >= model count (more if multiple RAM/SSD combos)

---

## Out of scope

- Modifying `sell_price_scraper_v7.js` (working, do not touch)
- Changing the output schema of `sell-price-lookup.json` (keep backward compatible)
- Changing `run-daily.sh` (already calls v7 scraper directly)
- Scraper config files (`scrape-urls.json`, etc.)

---

## Working directory

`/home/ricky/builds/buyback-monitor/`

## Data directory

`/home/ricky/builds/buyback-monitor/data/`

## Reference data

Latest v7 output: `data/sell-prices-latest.json` (symlink to most recent dated file)
