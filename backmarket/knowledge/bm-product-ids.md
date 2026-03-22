# Back Market Product IDs — How They Work

## Core Concept

Every unique spec combination on BM has its own `product_id` (UUID). This is NOT one per model. It's one per exact combination of:
- Model (e.g. MacBook Pro 13" 2020)
- CPU/GPU variant (e.g. M1 8c/8c vs M1 Pro 10c/16c)
- RAM (e.g. 8GB vs 16GB)
- SSD (e.g. 256GB vs 512GB)
- Colour (e.g. Grey vs Silver) — sometimes shared, sometimes separate

Example for MacBook Pro 13" M1 (A2338):
- 8GB/256GB/Grey → `8948b82c`
- 8GB/256GB/Silver → `0dfd2e16`
- 16GB/512GB/Grey → `2e0861d0`
- 16GB/256GB/Grey → `7408af3f`

## What the product_id controls

When you create a listing with a product_id, BM determines:
- **Title** (what the buyer sees: model, RAM, SSD, CPU)
- **backmarket_id** (BM's internal catalogue entry for that exact spec)
- **Product page** (which page the listing appears on)

**You cannot override the title.** The product_id IS the spec. Use the wrong product_id and the buyer sees the wrong spec.

## What the product_id does NOT control

- **Grade** — set separately via the `grade` column in the CSV (FAIR/GOOD/VERY_GOOD). Must be explicitly included or BM defaults to GOOD.
- **Price** — set by the seller
- **SKU** — our internal reference, BM doesn't use it for matching

## How to find the correct product_id

### Source 1: Our existing listings (BEST)
We have 832+ listings across 279 unique backmarket_ids. Search by title keywords to find the product_id for a specific spec. This is the most reliable source because we've already verified these work.

### Source 2: V6 scraper picker data
The scraper captures product_ids from BM's product page pickers (RAM, SSD, colour, CPU/GPU). Limitations:
- Only captures product_ids for **available** picker options (has at least one seller)
- **Sold-out options show `productId: null`** — no product_id available
- The "base" product_id in the scraper is the default spec for that model page
- Picker product_ids are for individual options, not combinations. They may resolve to the correct combo but should be verified.

### Source 3: Completed orders
If we've sold a specific spec before, the order contains the product_id. Search via `GET /ws/orders?state=9`.

### What does NOT work
- **Browser scraping sold-out specs** — BM doesn't expose product_ids for sold-out picker options. No product_id, nothing to scrape.
- **Using a "related" product_id hoping BM auto-resolves** — BM maps the listing to whatever the product_id represents. It does NOT auto-resolve to a different RAM/SSD. Tested and confirmed Mar 21.

## Product_id lookup table

Built from our existing listings. File: `/home/ricky/builds/bm-scripts/data/product-id-lookup.json`

Structure:
```json
{
  "product_id": {
    "title": "MacBook Pro 13-inch (2020) - M1 - 16GB RAM - SSD 512GB",
    "backmarket_id": 626770,
    "grades": ["FAIR", "GOOD", "VERY_GOOD", "EXCELLENT"],
    "listing_ids": [6024010, 6231231, 6355474]
  }
}
```

Script should search this table FIRST, before V6 scraper, when looking for a product_id.

## Lessons (Mar 21 incident)

1. **Never assume a product_id is correct without verifying the listing title matches the device spec.** The V6 scraper's base product_id matched the wrong spec.
2. **Always verify grade after listing creation.** BM defaults to GOOD if grade isn't in the CSV.
3. **Grade cannot be changed via POST update.** Must recreate the listing.
4. **Stored listing IDs from Monday must be spec+grade verified** before reuse. A previous device's listing may have different specs.
5. **For sold-out specs we've never listed, we cannot currently get the product_id.** Park the device and check periodically.
