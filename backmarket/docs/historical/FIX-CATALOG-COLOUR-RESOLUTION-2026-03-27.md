# Fix: Catalog Colour Resolution

**Date:** 27 Mar 2026
**Author:** Code (orchestrator)
**Priority:** CRITICAL — 125 of 151 verified catalog entries have no colour, blocking most listings

---

## Problem

The dry-run showed 20 devices. Only 1 could proceed (BM 611, Space Black — exact colour match). Most others blocked on "No exact colour match in catalog" because:

- 279 of 309 catalog entries have no colour
- 125 of 151 verified entries have no colour
- The scraper captures colour picker data (30 product_ids with colours), but **zero** of those UUIDs match listing-history UUIDs

**Why the UUIDs don't match:** The scraper colour picker gives the product_id for the default variant at that colour (e.g. 8GB/256GB Silver). Our listing history has product_ids for specific spec combinations (e.g. 16GB/512GB Silver). These are different UUIDs for the same colour, so a direct UUID match fails.

## Root Cause

The merge script (`bm-catalog-merge.py`) only assigns colour when:
1. A listing-history UUID directly matches a scraper picker UUID (rarely happens)
2. The entry came from a scraper picker option in the colour category

It does NOT:
- Parse colour from BM titles (titles don't include colour)
- Infer colour from the scraper's colour picker for the same model family
- Use our own listing SKUs which contain colour (e.g. `MBP.A2338.M1.8GB.256GB.Grey.Fair`)

## Fix Plan

### Fix 1: Extract colour from our own SKUs

The `product-id-lookup.json` has `listing_ids` per product_id. Our BM listings have SKUs that contain colour as the second-to-last segment:
- `MBP.A2338.M1.8GB.256GB.Grey.Fair` → Grey
- `MBA.A2337.M1.7C.8GB.256GB.Silver.Good` → Silver
- `MBP.A2991.M3PRO.18GB.512GB.Space Black.Fair` → Space Black

**Action:** In the merge script, for each listing-history entry, fetch one of its listing_ids from the BM API, read the SKU, extract the colour segment.

**Problem:** This requires API calls per entry. With 279 entries, that's 279 calls. Too slow for a merge script.

**Better approach:** We already have all 828 listings cached from the dry-run's Step 5 fetch. Export that cache, extract SKU → colour per product_id, and feed it into the merge.

### Fix 2: Build a colour map from our cached listings data

The dry-run already fetched all 828 listings from BM. Each listing has:
- `product_id` (UUID)
- `sku` (contains colour)
- `grade`

**Action:** Write a one-time script that:
1. Fetches all our BM listings (or reuses the cached data)
2. For each listing, extracts the colour from the SKU
3. Builds a `product_id → colour` map
4. Feeds this into the catalog merge as a fourth data source

### Fix 3: Enrich the catalog merge with colour from scraper model-level data

The scraper knows which colours exist per model family. For a listing-history entry in "MacBook Pro 14-inch (2023)" with no colour, we can check what colours the scraper found for that model family and see if there's only one possible colour for that specific RAM/SSD combination.

**This is secondary** — Fix 2 is more reliable because SKUs are explicit.

### Fix 4: Update the resolver to handle colourless verified entries

Some entries will never get colour (old listings with bad SKUs, specs we've never scraped). The resolver currently blocks these. It should instead:
- If there's exactly 1 verified candidate for a spec (any colour or no colour), and the confidence is exact_verified or historical_verified, allow it with a `colourVerified: false` flag
- Post-create verification then checks colour in the BM title after listing

This is a resolver logic change in `list-device.js`, not a catalog change.

---

## Execution Order

1. **Build colour map from listings** — one-time extraction script
2. **Update catalog merge** — add listings-colour as a fourth source
3. **Regenerate catalog** — re-run merge with colour data
4. **Update resolver fallback** — allow single-candidate colourless matches
5. **Re-run dry-run** — verify more devices unblock
6. **Loop if needed**

---

## Expected Impact

| Fix | Entries Gaining Colour | Devices Unblocked |
|-----|----------------------|-------------------|
| Fix 2 (SKU colour extraction) | ~200+ of 279 listing entries | Most colour-blocked devices |
| Fix 4 (single-candidate fallback) | N/A (resolver change) | Remaining single-match entries |

After both fixes, the only remaining blocks should be:
- Genuine no-match (spec not in catalog at all, like 36GB/1TB M3 Pro)
- Margin blocks (legitimate business rule)
- Multi-candidate ambiguity with no colour to disambiguate
