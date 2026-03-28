# Spec: BM Listings Registry — Pre-Create All Listing Slots

**Date:** 28 Mar 2026
**Author:** Code (orchestrator)
**For:** Codex build agent
**Priority:** HIGH

---

## The Idea

Instead of creating listings on-demand when a device is ready to sell, pre-create a clean listing slot for every model/spec/colour/grade combination we could ever need. Verify each one. Store them in a registry. Then when a device needs listing, just bump qty on a known-good slot.

---

## Why

Current problems with on-demand creation:
- BM reuses old dirty slots (wrong SKU, stale data)
- BM sometimes ignores state=3 (draft) and publishes immediately
- Creation + polling + verification takes ~30 seconds per device
- Each listing attempt is a gamble on whether BM cooperates

With a pre-built registry:
- Every listing is verified before any device needs it
- Listing a device becomes a single POST (qty bump + price set) — 2 seconds
- No creation, no polling, no draft state surprises
- SKUs are clean and documented from the start
- The registry IS the ground truth for what we own on BM

---

## What to Build

### Script: `backmarket/scripts/build-listings-registry.js`

This script:
1. Reads `backmarket/data/bm-catalog.json` for all verified product variants
2. For each variant × each grade (FAIR, GOOD, VERY_GOOD), creates a listing via Path B
3. Verifies each listing (title, grade, SKU)
4. Stores the results in `backmarket/data/listings-registry.json`

### Input: bm-catalog.json

Use only entries where `verification_status === "verified"`. Currently 151 entries.

Each entry has: `product_id`, `model_family`, `ram`, `ssd`, `colour`, `cpu_gpu`.

For each entry, create up to 3 listings (one per grade: FAIR, GOOD, VERY_GOOD).

That's up to 453 listings (151 × 3). In practice fewer, because some entries share the same product_id (different colours resolve to different product_ids but same model family).

### Creation: Path B CSV

For each listing:

```
POST /ws/listings
Content-Type: application/json

{
  "catalog": "sku,product_id,quantity,warranty_delay,price,state,currency,grade\r\n{SKU},{PRODUCT_ID},0,12,9999,3,GBP,{GRADE}",
  "quotechar": "\"",
  "delimiter": ",",
  "encoding": "utf-8"
}
```

Key settings:
- **quantity: 0** — not live, just reserving the slot
- **price: 9999** — placeholder, never goes live at this price
- **state: 3** — draft
- **grade: MUST be included** — FAIR, GOOD, or VERY_GOOD

Poll `GET /ws/tasks/{task_id}` for result. Extract `listing_id`, `backmarket_id`.

### Verification

After creation, fetch `GET /ws/listings/{listing_id}` and verify:
- `grade` matches what we sent
- Title contains correct RAM
- Title contains correct SSD
- `product_id` matches (unless BM resolved to a different one — record what BM gave us)

If BM returns pub_state=2 instead of 3, immediately set qty=0.

SKU check: if BM kept an old SKU, POST update with our clean SKU.

### Output: listings-registry.json

```json
{
  "created_at": "2026-03-28T...",
  "total_slots": 350,
  "verified": 340,
  "failed": 10,
  "slots": {
    "MBP.A2338.M1.8GB.256GB.Grey.Fair": {
      "listing_id": 6505341,
      "backmarket_id": 543508,
      "product_id": "8948b82c-...",
      "sku": "MBP.A2338.M1.8GB.256GB.Grey.Fair",
      "grade": "FAIR",
      "model_family": "MacBook Pro 13-inch (2020)",
      "ram": "8GB",
      "ssd": "256GB",
      "colour": "Space Gray",
      "title": "MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 8GB RAM - SSD 256GB - QWERTY - English",
      "verified": true,
      "created_at": "2026-03-28"
    }
  },
  "failed_slots": [
    {
      "sku": "...",
      "reason": "BM task error: ...",
      "product_id": "..."
    }
  ]
}
```

Keyed by SKU for fast lookup. The SKU encodes model + spec + colour + grade, so it's unique per listing slot.

---

## How list-device.js Changes

After the registry is built, the listing flow simplifies:

### Old flow (current):
1. Resolve product from catalog
2. Create listing via Path B (draft)
3. Poll task
4. Verify draft
5. Get backbox price
6. Publish
7. Verify published
8. Check SKU
9. Update Monday

### New flow (with registry):
1. Resolve product from catalog
2. Construct SKU
3. **Look up SKU in listings-registry.json** → get listing_id
4. Get backbox price for that listing_id
5. **Bump qty to 1 + set price** (single POST)
6. Verify (qty, price, pub_state)
7. Update Monday

Steps 2-4 of the old flow (create, poll, verify draft, check SKU) are eliminated. The listing already exists and is verified.

If the registry doesn't have a slot for this SKU → fall back to current Path B create flow.

---

## Rate Limiting

Creating 450 listings will take time. BM rate limits at ~30 requests/sec but we should be conservative.

Recommended pace:
- 1 creation every 5 seconds
- Poll every 3 seconds (max 15 polls per task)
- Verification fetch after each creation
- Total: ~450 × (5s create + 10s poll + 2s verify) = ~2.1 hours

Add `--batch-size N` flag (default 50) to create in batches with a longer pause between batches.

Add `--grade FAIR` flag to create only one grade at a time (reduce risk, verify in stages).

Add `--model-family "MacBook Air 13-inch (2020)"` flag to create for one family only.

---

## Execution Plan

### Phase 1: Build registry for high-value models first
```bash
node scripts/build-listings-registry.js --grade FAIR --model-family "MacBook Air 13-inch (2020)" --dry-run
node scripts/build-listings-registry.js --grade FAIR --model-family "MacBook Air 13-inch (2020)"
```
Start with common models (Air M1, Air M2, Pro M1) in Fair grade. Verify results. Then expand.

### Phase 2: Expand to all verified entries
```bash
node scripts/build-listings-registry.js --grade FAIR
node scripts/build-listings-registry.js --grade GOOD
node scripts/build-listings-registry.js --grade VERY_GOOD
```

### Phase 3: Wire list-device.js to use registry
Modify list-device.js to check registry first, fall back to Path B if no slot found.

### Phase 4: Retire on-demand creation
Once registry covers all active models, the Path B create code in list-device.js becomes fallback-only for new models not yet in the registry.

---

## Deduplication

Before creating, check if we already own a listing for that product_id + grade:
1. Load all existing listings (`GET /ws/listings` paginated)
2. Build a map of `product_id + grade` → existing listing_id
3. If a slot already exists with our SKU → just verify and add to registry (don't create)
4. If a slot exists with a different SKU → verify spec, update SKU if needed, add to registry
5. If no slot exists → create via Path B

This avoids creating duplicates of listings we already own.

---

## Files

| File | Purpose |
|------|---------|
| `scripts/build-listings-registry.js` | NEW — creates and verifies all listing slots |
| `data/listings-registry.json` | NEW — the registry output |
| `scripts/list-device.js` | MODIFY (Phase 3) — add registry lookup before Path B |
| `data/bm-catalog.json` | INPUT — verified product variants |
| `sops/06-listing.md` | UPDATE — document registry lookup step |

---

## CLI Flags

```bash
node scripts/build-listings-registry.js --dry-run                    # Preview what would be created
node scripts/build-listings-registry.js --grade FAIR                  # One grade at a time
node scripts/build-listings-registry.js --model-family "MacBook Air 13-inch (2020)"  # One family
node scripts/build-listings-registry.js --batch-size 20               # Smaller batches
node scripts/build-listings-registry.js --skip-existing               # Don't touch listings we already own
```

---

## What NOT to Do

- Do NOT delete old listings — just ignore them
- Do NOT set qty > 0 on any registry listing — they start at qty=0 (empty slots)
- Do NOT set real prices — use 9999 placeholder (price set at listing time by list-device.js)
- Do NOT create listings for `needs_review` or `market_only` catalog entries
- Do NOT create iPhone/iPad listings yet (catalog parser is MacBook-only)

---

## Acceptance Criteria

1. Registry script creates listings for all verified catalog entries × 3 grades
2. Each listing is verified (title, grade, SKU)
3. SKU mismatches are corrected
4. Registry JSON is written with all slot data
5. Deduplication prevents double-creating existing listings
6. `--dry-run` shows what would be created without calling BM API
7. `--grade` and `--model-family` filters work
8. Failed creations are logged with reasons, not silently skipped
