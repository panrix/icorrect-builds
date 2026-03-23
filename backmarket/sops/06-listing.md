# SOP 06: Listing on Back Market

**Version:** 1.1
**Date:** 2026-03-21
**Scope:** End-to-end flow for listing a device on Back Market, from "To List" trigger to live listing with Monday updates.
**Owner:** Backmarket agent (Hugo)

---

## Trigger

Main Board (349212843) item meets BOTH conditions:
- `status24` (Repair Type) = "To List" (index 8)
- Item is in group "BMs Awaiting Sale" (`new_group88387__1`)

---

## Step 1: Read Final Grade (HARD GATE)

Read `status_2_Mjj4GJNQ` ("* Final Grade *") from Main Board.

```graphql
{ items(ids: [MAIN_ITEM_ID]) {
  column_values(ids: ["status_2_Mjj4GJNQ"]) {
    ... on StatusValue { text index }
  }
} }
```

**Values:** Fair (index 11), Good (index 0), Excellent (index 6)

**HARD GATE:** If empty/null, STOP. Alert to BM Telegram (`-1003888456344`): "Cannot list [device]: Final Grade not set on Main Board."

**Grade map for BM API:**
| Final Grade | BM API value |
|-------------|-------------|
| Fair | FAIR |
| Good | GOOD |
| Excellent | VERY_GOOD |

---

## Step 2: Read Device Specs

### From BM Devices Board (3892194968):
| Data | Column ID | Type |
|------|-----------|------|
| Model number | `text` | text |
| RAM | `status__1` | status |
| SSD | `color2` | status |
| CPU | `status7__1` | status |
| GPU | `status8__1` | status |
| Purchase price (ex VAT) | `numeric` | numbers |
| Main Board item ID | `board_relation` | board_relation → `linked_item_ids[0]` |

### From Main Board (349212843):
| Data | Column ID | Type |
|------|-----------|------|
| Colour | `status8` | status |
| Parts cost | `lookup_mkx1xzd7` | mirror (comma-separated values, sum them. Use `... on MirrorValue { display_value }`) |
| Labour cost (£) | `formula_mkx1bjqr` | formula (Total Labour in £. Use `... on FormulaValue { display_value }`) |
| Labour hours | `formula__1` | formula (Total RR&D hours, decimal. Use `... on FormulaValue { display_value }`) |

> Mirror columns return `null` for `text`. Always use `... on MirrorValue { display_value }`.

---

## Step 3: Construct SKU

Format: `{Type}.{Model}.{Chip}.{GPU?}.{RAM}.{Storage}.{Colour}.{Grade}`

**Rules:**
- **Type:** `MBA` = MacBook Air, `MBP` = MacBook Pro
- **Chip:** M1, M2, M3, M4, M1PRO, M2PRO, M3PRO, M1MAX, M2MAX, i3, i5, i7, i9
- **GPU cores:** Include ONLY when multiple GPU variants exist for the same model (e.g. MBA M1 A2337 has 7-core and 8-core GPU: include `7C` or `8C`). Omit when GPU is fixed for the model.
- **Storage:** Use `1TB` not `1000GB`, `2TB` not `2000GB`
- **Colour:** `Grey`, `Silver`, `Gold`, `Midnight`, `Starlight`, `Black`
- **Grade:** Use Final Grade value: `Fair`, `Good`, `Excellent`

**Examples:**
- `MBP.A2338.M1.8GB.256GB.Grey.Fair`
- `MBA.A2337.M1.7C.8GB.256GB.Grey.Fair`
- `MBP.A2485.M1PRO.10C.16C.16GB.512GB.Grey.Good`

**Write to Monday:**
```graphql
mutation {
  change_column_value(
    board_id: 3892194968,
    item_id: BM_ITEM_ID,
    column_id: "text89",
    value: "\"MBP.A2338.M1.8GB.256GB.Grey.Fair\""
  ) { id }
}
```

> `value` must be double JSON-encoded: `json.dumps(json.dumps(sku))`.

---

## Step 4: Get product_id from V6 Scraper

**Source:** `/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json`

This file contains all models with picker data (RAM, SSD, colour, CPU/GPU) and a `productId` for each combination.

### Matching process:

1. **Match model** to a key in `models` (e.g. "Air 13\" 2020 M1", "Pro 14\" 2021 M1 Pro")
2. **Navigate pickers** to find the exact `productId`:
   - Match RAM in `ram` picker (e.g. "8 GB")
   - Match SSD in `ssd` picker (e.g. "256 GB")
   - Match colour in `colour` picker (e.g. "Space Gray", "Silver", "Gold")
   - Match CPU/GPU in `cpu_gpu` picker if multiple variants exist

3. **Resolve product_id:** Each picker entry has a `productId` (UUID). The correct product_id is the one where ALL pickers converge. Start from the base model `uuid`, then apply each picker that changes the productId.

   In practice: the colour picker's `productId` is the final product_id for that exact spec+colour combination, because BM encodes colour into the product catalogue. Cross-check that RAM and SSD pickers also return a consistent productId for the chosen spec.

### Product_id lookup order:

1. **Our listings lookup table** (`data/product-id-lookup.json`): search by model+RAM+SSD+colour+CPU. This is the most reliable source because titles are verified.
2. **V6 scraper**: provides the base model product_id and some picker product_ids. Only valid when the device matches the base spec or an available picker option.
3. **Intel product_id table**: hardcoded for Intel models not in V6.

**⚠️ The product_id determines exactly what spec the buyer sees.** Using the wrong product_id = wrong title = wrong product sold. See `knowledge/bm-product-ids.md` for full explanation.

**HARD GATE:** If no matching product_id found in any source, STOP. Alert to BM Telegram. Do NOT use a "close enough" product_id.

**Sold-out specs:** If the exact spec has never been listed by anyone on BM (all pickers show `available: false`), the product_id is unobtainable. Park the device and check periodically.

### Intel models (A2179, A2289, A2251)

Intel Macs are NOT in the V6 scraper's main catalogue. They use a separate `INTEL_PRODUCT_IDS` lookup table in `list-device.js`, keyed by `{model}.{cpu}.{ram}.{ssd}.{colour}`.

**Why separate:** BM has different product_ids for every Intel CPU+colour combination (e.g. i3 Gold ≠ i5 Gold ≠ i3 Silver). M-series models share a base product_id with pickers. Intel doesn't.

**To add a new Intel variant:**
1. Search our existing BM listings for a matching product_id
2. Add the UUID to the V6 scraper catalogue (`config/scrape-urls.json`)
3. Scrape to get grade prices
4. Add to `INTEL_PRODUCT_IDS` in `list-device.js`

**Known issue:** Some Intel colour+spec combos return `ERR_TOO_MANY_REDIRECTS` when scraping (product page removed from BM front-end but listing still exists in API). Use a different colour variant's scraped prices as comparison.

### Shared model numbers (A2918, A2992, A2442, A2485)

Some model numbers cover both base and Pro/Max chips:
- **A2918:** base M3 (8c CPU/10c GPU) OR M3 Pro (11c/14c or 12c/18c)
- **A2992:** base M3 OR M3 Pro (same distinction)
- **A2442:** M1 Pro OR M1 Max
- **A2485:** M1 Pro OR M1 Max

**Detection:** Use CPU and GPU core counts from the BM Devices Board to distinguish:
| CPU | GPU | Chip |
|-----|-----|------|
| 8-core | 10-core | M3 (base) |
| 11-core | 14-core | M3 Pro |
| 12-core | 18-core | M3 Pro |
| 10-core | 14-core | M1 Pro |
| 10-core | 16-core | M1 Pro |
| 10-core | 24-core | M1 Max |
| 10-core | 32-core | M1 Max |

**Always verify with Apple spec checker** (`node apple-spec-check.js <serial>`) if core counts are ambiguous or missing.

### V6 "Sold out" specs

When a RAM/SSD/colour/grade variant shows "Sold out" on BM, the V6 scraper captures the picker but with `available: false` and NO product_id (BM doesn't expose it in NUXT data).

**Workaround:** Use Path B to create a listing. BM accepts a product_id from ANY variant of the same model family and auto-resolves to the correct catalogue entry. See Step 10 Path B.

---

## Step 5: Find Existing Listing Slot

### 5a: Check Monday for stored listing ID (FIRST)

Before searching BM API, check if Monday already has a listing ID from a previous listing or Path B creation:

```
BM Devices Board (3892194968):
- text_mkyd4bx3 = listing_id (numeric)
- text_mm1dt53s  = product UUID
```

If `text_mkyd4bx3` has a value, fetch that listing directly:
```
GET /ws/listings/{stored_listing_id}
```

**HARD GATE — Spec & Grade Verification:**
Before using a stored listing, verify ALL of:
1. **Grade match:** listing `grade` must equal device's BM grade (FAIR/GOOD/VERY_GOOD)
2. **Product ID match:** listing `product_id` must match V6 product_id (if V6 data available)
3. **SKU sanity check:** if no V6 data, verify listing SKU contains device RAM and SSD values

If ANY mismatch: **reject the stored listing**, log a mismatch alert, and fall back to 5b (product_id search). A stored listing from a previous device with different specs will result in selling the wrong product.

If verified: use it (Path A if qty=0, Path A2 if qty>0). Skip 5b.

### 5b: Search BM listings by product_id + grade (FALLBACK)

Only if no stored listing ID exists. Search by `product_id` + grade. NOT by SKU text.

```
GET /ws/listings?limit=100
GET /ws/listings?limit=100&cursor={cursor}   # paginate until no 'next'
```

**Headers (required on ALL BM API calls):**
```
Authorization: $BACKMARKET_API_AUTH
Accept-Language: $BACKMARKET_API_LANG    (en-gb)
User-Agent: $BACKMARKET_API_UA
```

**Base URL:** `https://www.backmarket.co.uk` (NOT api.backmarket.com)

Filter client-side:
```python
matches = [l for l in all_listings
           if l['product_id'] == target_product_id
           and l['grade'] == target_bm_grade]   # FAIR / GOOD / VERY_GOOD
```

**Results determine path:**
- **Match with qty = 0** → Path A (reactivate)
- **Match with qty > 0** → Path A2 (bump qty + update price)
- **No match** → Path B (create new listing)

If multiple qty=0 matches: use the one with highest `listing_id` (most recent).

---

## Step 6: Get Buy Box Price

### 6a: For existing listings (Path A/A2) — use backbox API
If a listing slot was found in Step 5:
```
GET /ws/backbox/v1/competitors/{listing_id}
```
Returns `is_winning`, `price_to_win`, competitor data. Use `price_to_win` as the listing price.

### 6b: For new listings (Path B) — use V6 scraper
No listing_id exists yet, so use V6 front-end price as starting point:

```json
"grades": {
  "Fair": { "price": 363 },
  "Good": { "price": 407 },
  "Excellent": { "price": 437 }
}
```

After creating the listing, immediately check backbox API and adjust if needed.

### 6c: Spec price differentials
The V6 price is for the default spec. For the exact spec, apply the picker price differentials from RAM/SSD/colour pickers.

### 6d: Derive price when exact grade unavailable

When the device's grade has no V6 price but other grades do:
- **Our grade is below all available grades** (e.g. Fair, but only Good/Excellent have prices): propose 5% under the lowest available grade price.
- **Our grade is above all available grades**: use the highest available grade price.
- **Existing listing has a price** (from previous listing or Path B creation): use the listing's own price as fallback.

### 6e: Derive price from other colours (Intel models)

When an Intel model+spec has no V6 prices for the device's colour (e.g. Gold), check other colours of the same model+cpu+ram+ssd in the Intel product_id table and use their V6 prices as reference. BM pricing is typically similar across colours for the same spec.

### Adjacent spec check
From the `ssd` picker, note prices one tier below and above:
- Flag if gap between adjacent tiers < £20 (too tight to differentiate)
- Flag if smaller storage is priced higher than larger (anomaly)

### Grade ladder check
Confirm: Fair < Good < Excellent for this spec.
- **If inverted:** Flag to Ricky but **do NOT block**. An inversion between Good/Excellent doesn't prevent listing Fair. The inversion is a market anomaly, not a reason to withhold stock.
- If two grades are within £10: flag (buyers will upgrade)

---

## Step 7: Historical Sales Lookup

```
GET /ws/orders?state=9&limit=100   # state 9 = completed, paginate all
```

Filter by `orderlines[].listing_id` matching any listing_ids found in Step 5.

Report:
- Count of matching sales
- Average sale price, low, high
- If no exact match: report closest spec (same model, adjacent storage/grade) as context

**Red flag:** If historical average is significantly above current market, market has moved down. Do not anchor to old prices.

---

## Step 8: Calculate Profitability (at min_price)

### Gather costs:
| Cost | Source |
|------|--------|
| Purchase | `numeric` column (BM Devices Board) |
| Parts | `lookup_mkx1xzd7` (Main Board: mirror of Parts Used supply prices, comma-separated, sum them) |
| Labour | `formula__1` (Main Board: Total RR&D hours) × £24/hr |
| Shipping | £15 (flat) |
| BM buy fee | purchase × 10% |
| BM sell fee | sell × 10% |
| VAT (margin scheme) | (sell - purchase) × 16.67%, only if positive |

### Proposed price:
Set proposed price = current buy box price from V6 scraper (Step 6).

### Min price (3% floor):
```
min_price = ceil(proposed × 0.97)
```

### Net profit at min_price (worst case):
```
bm_buy_fee   = purchase × 0.10
bm_sell_fee  = min_price × 0.10
vat          = max(0, (min_price - purchase) × 0.1667)
total_costs  = purchase + parts + labour + shipping + bm_buy_fee + bm_sell_fee + vat
net_at_min   = min_price - total_costs
margin_pct   = (net_at_min / min_price) × 100
```

### Break-even price:
```
total_fixed  = purchase + parts + labour + shipping + bm_buy_fee
break_even   = ceil((total_fixed - purchase × 0.1667) / (1 - 0.10 - 0.1667))
```

The formula accounts for sell fee (10% of sale) and VAT (16.67% of margin above purchase). The purchase portion of VAT **reduces** the B/E because VAT is only on the profit margin (sell - purchase), not the full sale price.

> Always calculate at min_price, not listing price. BM dynamic pricing typically sells at or near min_price.

---

## Step 9: Decision Gates (at min_price)

> **AUTO-LIST IS DISABLED** (Mar 21). All devices go through PROPOSE → Ricky approval. This is because the data pipeline has known issues (parts formula was wrong, model numbers mislabelled, Intel/M1 confusion). Auto-list will be re-enabled when data quality gates are in place.

| Condition | Action |
|-----------|--------|
| margin ≥ 30% AND net ≥ £100 | ⚠️ PROPOSE (auto-list disabled) |
| margin 15-30% | ⚠️ PROPOSE to Ricky (post to BM Telegram `-1003888456344`) |
| margin < 15% | ⚠️ PROPOSE (flag as low margin) |
| net < £0 at min_price | ⚠️ PROPOSE (flag as loss maker with break-even price). Ricky may approve to clear stock. |

### Proposal format (when approval needed):
```
BM [#] [Device] [Size] [Chip] | [RAM]/[SSD] | [Colour] | [Grade]

Market   F:£X  G:£X  E:£X (today)
Ladder   ✅ F < G < E (gaps: £X, £X)
Sales    avg £X (£low-£high) n=X

Costs    Purchase £X | Parts £X | Labour £X (Xh) | Ship £15
Fees     Buy £X | Sell £X | VAT £X
Fixed    £X  |  B/E £X
Prop     £X  |  Min £X (3%)
Net@min  £X  |  Margin X%

Path     A/A2/B (listing XXXXXX, qty=X)
SKU      [constructed SKU]
Status   ⚠️ PROPOSE (X% margin) / ⛔ BLOCK / ✅ AUTO-LIST
```

**STOP here if awaiting approval.** Ricky's approval must be explicit ("approved", "go ahead", "yes"). A question or comment is NOT approval.

---

## Step 10: Create or Reactivate Listing

### Path A: Existing slot, qty = 0 (reactivate)

Use BM's existing SKU from the listing (captured in Step 5). Do NOT overwrite with our constructed SKU.

```
POST /ws/listings/{listing_id}
Content-Type: application/json

{
  "quantity": 1,
  "price": {proposed},
  "min_price": {min_price},
  "sku": "{existing_sku_from_bm_listing}",
  "pub_state": 2,
  "currency": "GBP",
  "grade": "{BM_GRADE}"
}
```

### Path A2: Existing slot, qty > 0 (bump qty + update price)

```
POST /ws/listings/{listing_id}
Content-Type: application/json

{
  "quantity": {current_qty + 1},
  "price": {current_buy_box_price},
  "min_price": {min_price},
  "pub_state": 2,
  "currency": "GBP"
}
```

> Also update price to current buy box. Don't just bump qty at the old price.

### Path B: No existing slot (create new listing)

**When this happens:** the device spec+grade+colour combination has never been listed before, or the grade/spec is "Sold out" on BM (no sellers, but product exists in BM's catalogue).

**Key discovery (Mar 21):** BM accepts a `product_id` from ANY variant of the same model family. You don't need the exact product_id for the specific RAM/colour/grade. BM auto-resolves to the correct catalogue entry (backmarket_id) based on the product_id + CSV specs. For example, using an 8GB Silver product_id to create a 16GB Silver listing works; BM assigned the correct 16GB backmarket_id.

**Where to get a product_id for Path B:**
1. From an existing listing of the same model (any RAM/SSD/grade variant)
2. From the V6 scraper colour picker (even if the exact spec is sold out, the colour picker has a product_id)
3. From a completed sale order of the same model

#### Step 1: Get a reference product_id

```
Search our listings: GET /ws/listings (paginate all)
Filter: same model family (e.g. "M3 Pro 16-inch" or "M3 14-inch")
Use the product_id from ANY matching listing
```

#### Step 2: Submit listing via JSON body

```
POST /ws/listings
Content-Type: application/json
Authorization: {BACKMARKET_API_AUTH}
Accept-Language: en-gb
User-Agent: {BACKMARKET_API_UA}

{
  "catalog": "sku,product_id,quantity,warranty_delay,price,state,currency\r\n{SKU},{PRODUCT_ID},1,12,{PRICE},{STATE},GBP",
  "quotechar": "\"",
  "delimiter": ",",
  "encoding": "utf-8"
}
```

**CSV format:** the `catalog` field contains the entire CSV as a single string with `\r\n` line endings.

**⚠️ CRITICAL: The `grade` column MUST be included in the CSV.** Without it, BM defaults to GOOD regardless of what grade you intend. This caused a mismatch incident on Mar 21.

**State values:**
| State | Meaning |
|-------|---------|
| 2 | Published (live) |
| 3 | Draft (offline) |

**Example:**
```json
{
  "catalog": "sku,product_id,quantity,warranty_delay,price,state,currency,grade\r\nMBP.A2918.M3.16GB.512GB.Silver.Good,66100734-2285-47cf-a6c1-9ad0de9193f2,1,12,920,2,GBP,GOOD",
  "quotechar": "\"",
  "delimiter": ",",
  "encoding": "utf-8"
}
```

> **NOT multipart/form-data.** The n8n flow and our tested implementation both use JSON body with `Content-Type: application/json`. Multipart form-data silently fails (returns 200 with empty product_success/product_errors).

#### Step 3: Poll task for result

```
GET /ws/tasks/{task_id}
```

Response `bodymessage` from Step 2 is the task_id. Poll until `action_status` = 9 (complete).

**Success response:**
```json
{
  "result": {
    "product_success": {
      "{SKU}": {
        "sku": "{SKU}",
        "backmarket_id": 3540535,
        "listing_id": 6675053,
        "publication_state": 2,
        "ean": "3069178739372"
      }
    },
    "product_errors": {}
  }
}
```

The response gives you:
- `listing_id`: our new listing ID (write to Monday)
- `backmarket_id`: BM's catalogue ID for this exact spec (different from the reference product_id's catalogue)
- `publication_state`: confirms live (2) or draft (3)

**Error response:** check `product_errors` for rejection reasons (wrong product_id, invalid grade, etc.)

#### Step 4: Safety protocol

After Path B creates the listing at state=2 (live):
1. **Immediately set qty=0** if the price hasn't been approved yet
2. Run profitability calculation
3. Present to Ricky for approval (PROPOSE)
4. On approval: set qty=1 with correct price and min_price

This prevents accidental sales at placeholder prices.

#### Path B: Known limitations
- BM doesn't expose product_ids for "Sold out" picker variants in NUXT data
- Using a product_id from a different variant of the same model works (BM resolves correctly)
- The SKU field is for our reference only; BM uses product_id for catalogue matching
- If `product_success` is empty (no error, no success): the product_id or CSV format is wrong. Check delimiter (comma, not semicolon) and body format (JSON, not multipart)

### Critical API rules:
- Always POST, never PATCH (PATCH returns 405)
- `pub_state: 2` is mandatory (omitting it leaves listing offline at pub=3)
- All 3 headers required on every call (Auth, Accept-Language, User-Agent)
- Missing `Accept-Language: en-gb` returns EUR prices and wrong pub_state
- Grade must be text string, not numeric

---

## Step 11: Verify Listing

```
GET /ws/listings/{listing_id}
```

Confirm:
- `publication_state` = 2 (live) — note: API returns `publication_state` not `pub_state`
- `quantity` = expected
- `price` = proposed price
- `min_price` = calculated min_price
- **`grade` = expected BM grade** (FAIR/GOOD/VERY_GOOD) — **CRITICAL CHECK**

**Post-listing verification is MANDATORY. Every listing. No exceptions.**

Verify ALL of:
1. **Grade** = expected BM grade (FAIR/GOOD/VERY_GOOD)
2. **Title** contains correct RAM, SSD, and CPU/GPU
3. **publication_state** = 2 (live)
4. **quantity** = expected

**If grade OR title mismatch:** Take listing offline immediately (qty=0). Do NOT leave it live. Grade cannot be changed via POST; title is determined by product_id. A mismatch means the wrong product_id was used or grade wasn't set. Must recreate with the correct product_id and grade.

**If publication_state or quantity mismatch:** Retry POST. If still wrong after 2 attempts, alert to BM Telegram.

**A listing that passes creation but fails verification is worse than no listing at all.** Wrong spec = wrong product sold = cancelled order + seller metrics hit.

---

## Step 12: Update Monday

### BM Devices Board (3892194968):

**Listing ID** → `text_mkyd4bx3`:
```graphql
mutation {
  change_column_value(board_id: 3892194968, item_id: BM_ITEM_ID,
    column_id: "text_mkyd4bx3", value: "\"LISTING_ID\"") { id }
}
```

**UUID** → `text_mm1dt53s`:
```graphql
mutation {
  change_column_value(board_id: 3892194968, item_id: BM_ITEM_ID,
    column_id: "text_mm1dt53s", value: "\"UUID\"") { id }
}
```

**Total Fixed Cost** → `numeric_mm1mgcgn`:
Write the sum of: purchase + parts + labour + shipping (£15) + BM buy fee (purchase × 10%).
This is used by buy box management (SOP 7) to avoid recalculating costs.
```graphql
mutation {
  change_column_value(board_id: 3892194968, item_id: BM_ITEM_ID,
    column_id: "numeric_mm1mgcgn", value: "\"TOTAL_FIXED_COST\"") { id }
}
```

### Main Board (349212843):

**Status → "Listed"** (index 7) → `status24`:
```graphql
mutation {
  change_column_value(board_id: 349212843, item_id: MAIN_ITEM_ID,
    column_id: "status24", value: "{\"index\": 7}") { id }
}
```

**Date Listed:** Auto-populated by Monday automation when status24 changes to Listed. Do NOT write manually.

> **Listing ID is NOT stored on the Main Board.** Single source of truth for listing ID is BM Devices Board `text_mkyd4bx3`. The Main Board column `text_mkydhq9n` exists but is deprecated; do not write to it.

> All text column values must be double JSON-encoded.

> `status24` update on Main Board also updates the `mirror3__1` column on BM Devices Board (it mirrors from Main).

---

## Step 13: Confirm to BM Telegram

Post confirmation to `-1003888456344`:

```
✅ Listed: [Device] [Config] [Grade] [Colour]
Price: £X | Min: £X | Net@min: £X (X%)
Listing ID: {listing_id}
Path: A/A2/B
```

---

## Error Handling

| Error | Action |
|-------|--------|
| V6 scraper has no model/spec | STOP. Alert BM Telegram. Manual product_id lookup required. |
| BM API returns HTML (not JSON) | Rate limited. Wait 30s, retry up to 3 times. |
| BM 400 "catalog not found" | Wrong product_id or need multipart/form-data CSV format. Check product_id, try Path B CSV format. |
| Monday API fails AFTER BM listing created | ALERT IMMEDIATELY to BM Telegram. Listing is live but Monday is out of sync. Include listing_id for manual fix. |
| Grade ladder inverted (e.g. Fair ≥ Good) | Flag to Ricky. Do NOT list at inverted price. |
| Final Grade empty | STOP. Cannot list without grade. |
| Parts/labour data missing | Flag. Do not auto-list without full cost data. |

---

## Status Index Reference (status24)

| Index | Value |
|-------|-------|
| 7 | Listed |
| 8 | To List |
| 10 | Sold |
| 104 | Unlisted |

---

---

## Apple Spec Checker (verification tool)

**Script:** `/home/ricky/builds/bm-scripts/apple-spec-check.js`
**Also available as HTTP:** `GET http://localhost:8010/webhook/icloud-check/spec-check?serial=XXXXX`

**Usage:** `node apple-spec-check.js <serial>`

**Returns:** model, colour (when available), chip, CPU cores, GPU cores, RAM, storage

**When to use:**
- Before listing any device where Monday specs might be wrong
- When model number is shared (A2918, A2992) to confirm base vs Pro chip
- When colour is uncertain

**Known limitation:** Colour is not always returned by Apple's API. Newer finishes (Space Black) may not be exposed. Enhancement planned: parse trackpad/top case parts which include colour in part names.

**Cache:** Results are cached in `specs-cache.json`. Delete cache entry to force fresh lookup.

---

## What This SOP Does NOT Cover

- **Diagnostic Complete trigger** (SOP 03)
- **Expected Sale Price write-back** (SOP 03 profitability prediction)
- **Weekly listing health check / price audit** (separate SOP)
- **Colour validation as separate step** (colour is implicitly validated by product_id match; if V6 returns a product_id for the colour, it's correct)
