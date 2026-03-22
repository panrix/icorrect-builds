# Task: Rebuild All BM Sales Listings

**For:** Claude Code
**Priority:** Next week
**Repo:** panrix/icorrect-builds

---

## Objective

Rebuild all Back Market sales listings with standardised SKUs, verified product_ids, and correct grades. Every listing must match 1:1: model, RAM, SSD, colour, CPU/GPU, and grade.

---

## Background

We have 831 listings on BM. Most were created manually or by old scripts with:
- Inconsistent SKU formats (dozens of variations)
- Product_ids that may not match the actual spec shown to buyers
- Grades that defaulted to GOOD when not explicitly set
- No systematic verification

This has caused: wrong spec sold, wrong grade sold, wrong colour shipped, cancelled orders.

---

## What a listing needs

Each listing on BM is defined by:
- **product_id** (UUID): determines the title, RAM, SSD, CPU/GPU shown to the buyer. One product_id per exact spec combination.
- **grade** (FAIR/GOOD/VERY_GOOD): must be set explicitly in the CSV `grade` column when creating. Cannot be changed after creation.
- **SKU**: our internal reference. BM doesn't use it for matching, but we use it for reconciliation.
- **listing_id**: numeric ID assigned by BM on creation.

---

## SKU Format Standard

```
{Type}.{Model}.{Chip}.{GPU?}.{RAM}.{SSD}.{Colour}.{Grade}
```

- **Type:** MBA = MacBook Air, MBP = MacBook Pro
- **Model:** A-number (A2338, A2681, etc.)
- **Chip:** M1, M2, M3, M1PRO, M2PRO, M3PRO, M1MAX, I3, I5, I7
- **GPU:** Include ONLY when multiple variants exist (e.g. 7C, 8C, 10C, 14C)
- **RAM:** 8GB, 16GB, 18GB, 36GB
- **SSD:** 256GB, 512GB, 1TB, 2TB
- **Colour:** Grey, Silver, Gold, Midnight, Starlight, Black
- **Grade:** Fair, Good, Excellent

Examples:
```
MBP.A2338.M1.8GB.256GB.Grey.Fair
MBA.A2337.M1.7C.8GB.256GB.Silver.Good
MBP.A2442.M1PRO.8C.14C.16GB.512GB.Silver.Excellent
MBA.A2179.I3.8GB.256GB.Gold.Fair
```

---

## Data sources

### Product_id lookup table
File: `backmarket/data/product-id-lookup.json`

279 verified product_ids extracted from our existing listings. Each maps to:
- BM title (shows exact spec)
- backmarket_id
- Available grades
- Existing listing_ids

**Use this as the primary source for product_ids.** Each entry has a verified title showing exactly what spec the buyer sees.

### BM Listings API
```
GET https://www.backmarket.co.uk/ws/listings?page={n}&page_size=100
Headers: Authorization, Accept-Language: en-gb, User-Agent
```

Returns all our listings with: listing_id, sku, title, grade, product_id, quantity, price, backmarket_id.

### Monday.com BM Devices Board (3892194968)
Each BM Device item stores:
- `text_mkyd4bx3`: listing_id
- `text_mm1dt53s`: product UUID
- `text89`: SKU
- `numeric`: purchase price
- `numeric_mm1mgcgn`: total fixed cost

---

## The rebuild process

For each unique product_id in our lookup table:

### Step 1: Verify the product_id
```
GET /ws/listings/{any_existing_listing_id_for_this_product_id}
```
Confirm the title matches the spec we think it represents.

### Step 2: Identify which grades we need
Check which grades we currently have listings for on this product_id. Also check which grades have devices in stock on Monday.

### Step 3: Create new listing with correct SKU
```
POST /ws/listings
Content-Type: application/json

{
  "catalog": "sku,product_id,quantity,warranty_delay,price,state,currency,grade\r\n{SKU},{PRODUCT_ID},0,12,{PRICE},3,GBP,{GRADE}",
  "quotechar": "\"",
  "delimiter": ",",
  "encoding": "utf-8"
}
```

**CRITICAL:** The `grade` column MUST be in the CSV. Without it, BM defaults to GOOD.

State 3 = draft. Do NOT go live until verified.

### Step 4: Poll task for result
```
GET /ws/tasks/{task_id}
```
Wait for `action_status === 9`. Response gives new `listing_id` and `backmarket_id`.

### Step 5: Verify the new listing
```
GET /ws/listings/{new_listing_id}
```
Check ALL of:
- **Grade** matches expected (FAIR/GOOD/VERY_GOOD)
- **Title** contains correct RAM
- **Title** contains correct SSD
- **Title** contains correct CPU/GPU variant
- **backmarket_id** matches expected

If ANY mismatch: delete the listing. Do not proceed.

### Step 6: Activate
```
POST /ws/listings/{new_listing_id}
{ "quantity": 0, "pub_state": 2, "price": {price}, "min_price": {min_price}, "currency": "GBP" }
```
Keep qty=0 until a device is assigned.

### Step 7: Archive old listing(s)
For the same product_id + grade, set old listings to qty=0. Do not delete (keeps sales history).

### Step 8: Update Monday
Write new listing_id and SKU to any BM Device items that were on the old listing.

---

## API gotchas

1. **POST not PATCH.** PATCH returns 405.
2. **Grade in CSV is mandatory.** Omitting it = GOOD.
3. **Grade cannot be changed after creation.** Must recreate.
4. **Accept-Language: en-gb required.** Without it: EUR prices, wrong pub_state.
5. **SKU reuse:** If you create with an SKU that already exists, BM may reuse the old listing instead of creating a new one. Use unique SKUs.
6. **product_id determines title.** You cannot override the title.
7. **board_relation on Monday:** Use `... on BoardRelationValue { linked_item_ids }` syntax.

---

## Execution plan

### Phase 1: Audit (read-only)
For each of our 831 listings:
1. Read listing from API
2. Construct what the SKU SHOULD be from the title
3. Compare to current SKU
4. Flag mismatches

Output: report of all listings with current SKU, correct SKU, and whether they match.

### Phase 2: Create new listings
For each unique product_id + grade combination where the SKU is wrong:
1. Create new listing with correct SKU
2. Verify (Step 5 above)
3. Keep at qty=0

### Phase 3: Migration
For each old listing that has a new replacement:
1. If old listing has qty > 0, transfer qty to new listing
2. Update Monday references
3. Set old listing qty=0

### Phase 4: Verify
Run reconciliation script (`reconcile-listings.js`) to confirm:
- All Monday "Listed" items match active BM listings
- All specs verified
- All grades correct
- No qty mismatches

---

## Safety rules

- Never delete old listings (sales history)
- Never go live (qty > 0) without verification passing
- Run in batches by model family, not all at once
- Reconciliation after every batch
- No device goes unlisted during migration (overlap)

---

## Files to reference

- `backmarket/sops/06-listing.md` — listing SOP
- `backmarket/sops/06.5-listings-reconciliation.md` — reconciliation SOP
- `backmarket/knowledge/bm-product-ids.md` — how product_ids work
- `backmarket/data/product-id-lookup.json` — verified product_ids
- `backmarket/scripts/reconcile-listings.js` — reconciliation script
- `backmarket/scripts/list-device.js` — current listing script
