# Brief: Wire list-device.js to bm-catalog.json

**Date:** 27 Mar 2026
**From:** Code (orchestrator)
**For:** Listings agent (Codex)
**Priority:** HIGH — BM has zero live stock

---

## What Changed

A canonical BM catalog now exists at:

```
/home/ricky/builds/backmarket/data/bm-catalog.json
```

This file merges three data sources into a single product resolver:
- Listing history (279 entries — our own verified listings)
- Order history (234 entries — 1,456 orders from BM API)
- V6 scraper picker data (52 unique product_ids)

**Result:** 297 variants across 23 MacBook model families.

---

## How It Works

Each variant in the catalog has:

```json
{
  "product_id": "06adb5b3-...",
  "title": "MacBook Pro 14-inch (2021) - Apple M1 Pro 8-core and 14-core GPU - 16GB RAM - SSD 1000GB - QWERTY - English",
  "backmarket_id": 543508,
  "ram": "16GB",
  "ssd": "1000GB",
  "cpu_gpu": "Apple M1 Pro 8-core and 14-core GPU",
  "colour": "Space Gray",
  "model_family": "MacBook Pro 14-inch (2021)",
  "evidence_sources": ["listing_history", "order_history", "scraper_picker"],
  "resolution_confidence": "exact_verified",
  "verification_status": "verified",
  "last_seen_at": "2026-03-27",
  "grade_prices": { "Fair": 550, "Good": 620, "Excellent": 680 },
  "available": true
}
```

### Confidence Levels

| Level | Count | Meaning | Listing Eligibility |
|-------|-------|---------|-------------------|
| `exact_verified` | 34 | In our history AND seen in scraper | Yes (with post-create verification) |
| `historical_verified` | 245 | In our listing/order history only | Yes (with post-create verification) |
| `market_only` | 18 | Only seen in scraper, not our history | Pricing/manual review ONLY — not for live listing |
| `not_found` | 0 | — | Blocked |

### Verification Status

| Status | Count | Meaning |
|--------|-------|---------|
| `verified` | 151 | Has confidence + complete specs (model_family, ram, ssd all present) |
| `needs_review` | 146 | Has confidence but missing core spec fields (e.g. iPhone/iPad, older Macs with unparseable titles) |

**Rule:** Only `verified` entries should be used for automated product resolution. `needs_review` entries exist in the catalog but must go through manual review before live listing.

---

## What to Change in list-device.js

### Current State

The active tracked file is:

```
/home/ricky/builds/backmarket/scripts/list-device.js
```

This script currently resolves `product_id` from multiple fragmented sources:
1. `product-id-lookup.json`
2. V6 scraper data (`sell-prices-latest.json`)
3. Intel hardcoded lookup table
4. BM search/listing fallback after resolution

This multi-source approach is what the trust docs identify as the main blocker.

### Target State

Replace the multi-source resolution with a single catalog lookup:

1. Load `backmarket/data/bm-catalog.json` at startup
2. Build a lookup index: `model_family + ram + ssd + colour` → variant
3. For a given device, derive `model_family` from the current Main Board / BM Device facts already read by the script
4. Normalise colour names before lookup
   - `Grey` / `Space Grey` → `Space Gray`
   - `Black` / `Space Black` should not be treated as interchangeable unless the catalog says so
5. For Intel models, remove the separate hardcoded UUID table as a resolver source once the catalog covers that device confidently
6. Return a structured resolver result, not just a raw UUID

Suggested resolver output:

```json
{
  "productId": "uuid",
  "title": "BM title",
  "backmarketId": 543508,
  "modelFamily": "MacBook Pro 14-inch (2021)",
  "resolutionConfidence": "historical_verified",
  "verificationStatus": "verified",
  "gradePrices": { "Fair": 550, "Good": 620, "Excellent": 680 },
  "available": true,
  "source": "bm-catalog"
}
```

7. For a given device, construct the lookup key from Monday data
4. Look up in catalog:
   - If `verification_status === "verified"` → use the `product_id`, proceed to listing
   - If `verification_status === "needs_review"` → log, mark device as manual review, do not list
   - If no match → log, mark device as blocked, do not list
5. Keep existing listing-slot search and execution flow after resolution
6. Keep post-create verification, but extend it:
   - `product_id`
   - grade
   - RAM in title
   - SSD in title
   - colour where catalog colour is populated
7. If colour is missing in the catalog entry, do not fail solely on colour; keep it as a review note

### What NOT to Change

- Keep the existing P&L calculation — it already works
- Keep the existing listing execution flow (create/reactivate/qty bump)
- Keep the existing Monday writeback logic
- Keep `--dry-run` and `--item` modes
- Keep the `--live` gate
- Do not reintroduce fuzzy “best match” model resolution for live execution
- Do not keep any path where `market_only` can go live
- Do not fall back from `needs_review` to V6 guesswork

### Grade Prices Bonus

The catalog includes `grade_prices` from the scraper when available. The P&L calculation can use these as current market prices instead of needing a separate V6 lookup.

### Resolver Rules

The integration should follow these hard rules:

1. `verification_status === "verified"`:
   Allowed to proceed to listing flow, subject to existing post-create verification.

2. `verification_status === "needs_review"`:
   Must stop before live listing.
   Log the candidate catalog entry and why it was blocked.

3. `resolution_confidence === "market_only"`:
   Must never authorize live listing.
   Can be used for pricing context in dry-run output only.

4. No catalog match:
   Must stop before live listing.
   Emit a clear manual-review reason.

### Implementation Notes

- The current Step 4 code block in `list-device.js` should be renamed conceptually from “Get product_id from V6 scraper” to “Resolve product from canonical BM catalog”.
- Keep the Step 5 listing search by `product_id` + grade once Step 4 returns a verified resolver result.
- Keep the stored-listing reuse path, but compare the stored listing against the catalog-resolved `product_id`, not the old V6 result object.
- The old V6 loader can remain temporarily for grade-price enrichment if needed, but it should no longer be the resolver of record.
- The old lookup table path and Intel UUID table should become dead code after the catalog integration is stable, then be removed in a follow-up cleanup commit.

### Acceptance Criteria

The work is only complete when all of the following are true:

1. `backmarket/scripts/list-device.js` reads `backmarket/data/bm-catalog.json`.
2. `product-id-lookup.json` is no longer used as an active resolver source in that file.
3. The Intel hardcoded UUID table is no longer required for live resolution.
4. A `needs_review` or `market_only` catalog result cannot go live even with normal execution flow.
5. Dry-run output clearly shows:
   - catalog match or no match
   - `resolution_confidence`
   - `verification_status`
   - selected `product_id`
6. Post-create verification includes colour when catalog colour is known.
7. At least one safe MacBook test item is run through `--dry-run` and the output is reviewed.

---

## Model Index

The catalog also has a `model_index` for human-readable lookups:

```json
{
  "model_index": {
    "MacBook Air 13-inch (2020)": ["b5ebc79d-...", "0b11476c-...", ...],
    "MacBook Pro 14-inch (2021)": ["06adb5b3-...", ...],
    ...
  }
}
```

23 model families, useful for debugging and reporting.

---

## Files

| File | Purpose |
|------|---------|
| `backmarket/data/bm-catalog.json` | **THE canonical catalog — use this** |
| `backmarket/analysis/bm-catalog-merge.py` | Regenerates the catalog (run after new scraper data or order history pull) |
| `backmarket/analysis/bm-order-history-extract.py` | Pulls order history from BM API |
| `backmarket/docs/RESEARCH-BM-CATALOG-SCRAPER-2026-03-27.md` | Full research doc on catalog architecture |

---

## First Safe Relist Batch

Once the catalog is wired in:

1. Query Monday for devices in `To List` state
2. For each device, look up in catalog
3. Filter to `verified` matches only
4. Start with 3-5 unambiguous devices (e.g. common MacBook Air M1/M2 configs)
5. Run `--dry-run` first, review output
6. Run `--live --item <id>` one at a time
7. Verify each listing manually
8. If zero mismatches after 5, expand cautiously

This is Phase 4 exit criteria from the master plan.

---

## Deliverables From The Agent

The listings agent should return:

1. Code changes made in `backmarket/scripts/list-device.js`
2. Any helper functions added for catalog lookup / normalization
3. A short summary of which legacy resolver paths were removed or bypassed
4. One dry-run example showing a `verified` match
5. One dry-run example showing a blocked `needs_review` or no-match case
