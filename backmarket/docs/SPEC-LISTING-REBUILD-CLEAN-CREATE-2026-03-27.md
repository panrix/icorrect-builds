# Spec: Clean-Create Listing Rebuild

**Date:** 27 Mar 2026
**Author:** Code (orchestrator)
**Priority:** CRITICAL — current listings have dirty SKUs, stale prices, and unverified data
**Status:** Ready for build

---

## The Problem

The current listing flow reactivates old BM listings (Path A). These old listings have:
- Test SKUs ("test", "placeholder", garbage data)
- Stale prices from months ago
- No backbox data (dormant listings return 404)
- Mismatched specs from previous devices
- 828 listings of unknown quality

Reactivating dirty listings is how we nearly sold an M3 for £626 tonight.

## The Fix

**Never reactivate old listings. Always create fresh.**

Every listing goes through Path B (CSV create). No Path A, no Path A2. Every listing is:
- Created by us with a clean SKU
- Priced safely (draft or high placeholder)
- Verified after creation
- Only published after price is confirmed

The 828 old listings are dead. Historical data only.

---

## How Path B Works (Proven)

```
POST /ws/listings
Content-Type: application/json
Authorization: {BACKMARKET_API_AUTH}
Accept-Language: en-gb
User-Agent: {BACKMARKET_API_UA}

{
  "catalog": "sku,product_id,quantity,warranty_delay,price,state,currency,grade\r\n{SKU},{PRODUCT_ID},1,12,{PRICE},{STATE},GBP,{GRADE}",
  "quotechar": "\"",
  "delimiter": ",",
  "encoding": "utf-8"
}
```

BM accepts ANY product_id from the same model family and auto-resolves to the correct backmarket_id based on the product_id + grade. Proven March 21.

The response gives a task_id. Poll `GET /ws/tasks/{task_id}` until complete. The result contains:
- `listing_id` — our new clean listing
- `backmarket_id` — BM's catalog entry for this exact spec
- `publication_state` — confirms live (2) or draft (3)

---

## New Flow (Step by Step)

### Step 1: Read device data (unchanged)
- Final Grade from Main Board (HARD GATE)
- Specs from BM Devices Board (RAM, SSD, CPU, GPU, colour, purchase price)
- Costs from Main Board (parts, labour)

### Step 2: Resolve product from catalog (unchanged)
- Look up in `bm-catalog.json`
- Must be `verification_status === "verified"`
- Get the product_id

### Step 3: Get a reference product_id for creation
- Use the catalog's `model_index` to find all product_ids in the same model family
- Pick any verified product_id from that family
- This is the reference product_id for the CSV — BM resolves the rest

If the exact product_id from Step 2 is available, use that. Otherwise, any family member works.

### Step 4: Construct clean SKU
Same as current: `{Type}.{Model}.{Chip}.{GPU?}.{RAM}.{Storage}.{Colour}.{Grade}`

### Step 5: Calculate P&L
Same as current, but price source changes:
- Use V6 scraper grade prices from the catalog as market reference
- Calculate floor price from costs
- **Do NOT use old listing prices as a pricing input**

### Step 6: Create listing via Path B
```
POST /ws/listings
```
- SKU: our clean constructed SKU
- product_id: reference product_id from Step 3
- quantity: 1
- price: **floor price × 2** (safe placeholder — will be adjusted)
- state: **3 (draft)** — do NOT publish yet
- grade: BM grade (FAIR / GOOD / VERY_GOOD)
- currency: GBP
- warranty_delay: 12

**CRITICAL: Include `grade` in the CSV header and data.** Without it BM defaults to GOOD.

### Step 7: Poll task for result
```
GET /ws/tasks/{task_id}
```
Wait for `action_status` = 9 (complete). Extract:
- `listing_id`
- `backmarket_id`
- `publication_state`

### Step 8: Verify the new listing
```
GET /ws/listings/{listing_id}
```
Verify:
- `product_id` matches expected
- `grade` matches expected (FAIR/GOOD/VERY_GOOD)
- Title contains correct RAM
- Title contains correct SSD
- Title contains correct colour (where known)
- `publication_state` = 3 (draft — not yet live)

If ANY mismatch → delete or leave as draft. Do NOT publish. Alert Telegram.

### Step 9: Get real buy box price
Now that the listing exists (even as draft), try:
```
GET /ws/backbox/v1/competitors/{listing_uuid}
```

If backbox returns data:
- Use `price_to_win` as the listing price
- Calculate min_price from P&L (3% below proposed)
- If price_to_win < floor → use floor, flag for review

If backbox returns 404 (no competitors or listing too new):
- Use V6 catalog grade price as reference
- If no V6 price → use floor × 1.5 as conservative placeholder
- Flag for manual price review

### Step 10: Publish with correct price
```
POST /ws/listings/{listing_id}
{
  "quantity": 1,
  "price": {real_price},
  "min_price": {min_price},
  "pub_state": 2,
  "currency": "GBP"
}
```

### Step 11: Verify published listing
```
GET /ws/listings/{listing_id}
```
Confirm:
- `publication_state` = 2 (live)
- `quantity` = 1
- `price` = set price
- Grade, title, spec all still correct

If verification fails → set qty=0 immediately.

### Step 12: Update Monday
- BM Devices Board: write listing_id to `text_mkyd4bx3`, UUID to `text_mm1dt53s`, total fixed cost to `numeric_mm1mgcgn`
- Main Board: set status24 to Listed (index 7)

### Step 13: Confirm to Telegram
```
✅ Listed: [Device] [Config] [Grade] [Colour]
Price: £X | Min: £X | Net@min: £X (X%)
Listing ID: {listing_id} (NEW — clean create)
```

---

## What Changes from Current Script

| Current | New |
|---------|-----|
| Search 828 listings for existing slot (Path A) | Skip entirely — always create fresh |
| Reactivate dormant listing with stale SKU/price | Create new listing with clean SKU |
| Price from backbox (404) → stale listing price → V6 | Create as draft → get backbox → publish with real price |
| Old listing's SKU preserved | Our constructed SKU always |
| Single step: list and price together | Two steps: create as draft, then price and publish |
| Stored listing IDs from Monday reused | Stored listing IDs ignored for creation (kept for reference only) |

## What Does NOT Change

- Catalog resolution (Step 2) — keep as-is, working well
- P&L calculation — keep as-is
- Post-create verification — keep as-is, add draft state check
- Monday writeback — keep as-is
- Telegram notifications — keep as-is
- `--dry-run` / `--live` / `--item` flags — keep as-is
- `--min-margin` override — keep as-is
- Disk cache for orders — keep as-is (listings cache no longer needed since we don't search old listings)

## What Gets Deleted

- `getAllListings()` — no longer needed (don't search old listings)
- `searchListingSlot()` — no longer needed
- Stored listing ID check (Step 5a) — no longer needed
- Path A / Path A2 logic — replaced entirely by Path B
- Backbox call before listing — moved to after creation
- Listings disk cache — no longer needed

---

## Decision Gates

| Condition | Action |
|-----------|--------|
| Catalog: verified + exact match | Proceed |
| Catalog: needs_review or market_only | BLOCK — manual review |
| Catalog: no match | BLOCK |
| P&L: margin ≥ 15% (or --min-margin override) | Create listing |
| P&L: margin < 15% | BLOCK (unless overridden) |
| Path B creation fails | Alert Telegram, do not update Monday |
| Verification fails after creation | Leave as draft, alert Telegram |
| Backbox returns no price data | Use catalog grade price or conservative placeholder, flag for review |

---

## Pricing Rules

1. **Never use old listing prices.** They are stale and untrustworthy.
2. **Never use V6 scraper prices as final prices.** They are market signals, not buy box prices.
3. **Create as draft first.** Price adjustment happens after creation when backbox is available.
4. **Backbox is the pricing authority** for live listings. V6/catalog prices are reference only.
5. **Floor price is the safety net.** Never go below it regardless of buy box.
6. **If no pricing data available at all**, use floor × 1.5 and flag for manual review. Better to be overpriced and unsold than underpriced and losing money.

---

## Safe Placeholder Pricing (Pre-Backbox)

When creating the listing as draft, use:
```
placeholder_price = max(floor_price * 2, catalog_grade_price * 1.2)
```

This is never the final price. It's a safe high number so that if the listing accidentally goes live before pricing, we don't sell at a loss.

---

## Old Listings Cleanup (Separate Task)

The 828 old listings should be cleaned up separately:
1. Set all old listings to qty=0 (if not already)
2. Do NOT delete them (BM doesn't allow deletion, only deactivation)
3. They remain as historical data for the catalog merge
4. New listings will coexist with old ones — BM doesn't care about duplicates at qty=0

---

## File to Modify

```
/home/ricky/builds/backmarket/scripts/list-device.js
```

## Acceptance Criteria

1. `--dry-run` shows Path B (create new) for every device, never Path A
2. No listing search or old listing reuse in the flow
3. Listings created as draft (state=3) first
4. Price set from backbox after creation, not before
5. Verification checks draft state before publish
6. `--live --item <id>` creates one clean listing end-to-end
7. Monday only updated after verified published listing
8. All new listings have our constructed SKU, not old garbage

---

## Run Order

1. Take the 11 listings we just created offline (they used old dirty slots)
2. Rebuild the script with clean-create flow
3. Dry-run the 20 devices
4. Live-run 3 safe devices (common specs, high margin)
5. Verify manually on BM
6. If clean, run the rest
