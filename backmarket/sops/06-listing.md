# SOP 06: Listing on Back Market

**Version:** 2.0
**Date:** 2026-03-28
**Scope:** End-to-end flow for listing a device on Back Market.
**Script:** `backmarket/scripts/list-device.js`

---

## Trigger

Main Board item (349212843) in group "BMs Awaiting Sale" (`new_group88387__1`) with `status24` = "To List" (index 8).

```bash
# Dry-run all
node scripts/list-device.js --dry-run

# Dry-run single item
node scripts/list-device.js --dry-run --item <mainBoardItemId>

# Live single item
node scripts/list-device.js --live --item <mainBoardItemId>

# Override minimum margin (Ricky approval required)
node scripts/list-device.js --live --item <mainBoardItemId> --min-margin 0

# Override product_id (for family-member resolution when catalog can't exact-match)
node scripts/list-device.js --live --item <mainBoardItemId> --product-id <uuid>
```

Live mode requires `--item`. Batch live is disabled.

---

## Step 1: Read Final Grade (HARD GATE)

Column: `status_2_Mjj4GJNQ` on Main Board.

| Final Grade | BM Grade | Index |
|-------------|----------|-------|
| Fair | FAIR | 11 |
| Good | GOOD | 0 |
| Excellent | VERY_GOOD | 6 |

**HARD GATE:** If empty → STOP. Alert Telegram.

---

## Step 2: Read Device Specs

### BM Devices Board (3892194968):

| Column ID | Data |
|-----------|------|
| `status__1` | RAM |
| `color2` | SSD |
| `status7__1` | CPU |
| `status8__1` | GPU |
| `numeric` | Purchase price (ex VAT) |
| `board_relation` | Link to Main Board item |

### Main Board (349212843):

| Column ID | Data | Notes |
|-----------|------|-------|
| `status8` | Colour | |
| `lookup_mkx1xzd7` | Parts cost | Mirror, comma-separated, sum. Use `... on MirrorValue { display_value }` |
| `formula_mkx1bjqr` | Labour cost £ | Use `... on FormulaValue { display_value }` |
| `formula__1` | Labour hours | Decimal. Use `... on FormulaValue { display_value }` |

---

## Step 3: Construct SKU

Format: `{Type}.{Model}.{Chip}.{GPU?}.{RAM}.{Storage}.{Colour}.{Grade}`

- Type: `MBA` (Air), `MBP` (Pro)
- Chip: M1, M2, M3, M1PRO, M2PRO, M3PRO, M1MAX, i3, i5, i7
- GPU cores: include only when multiple variants exist for the model (e.g. MBA M1 7C vs 8C)
- Storage: `1TB` not `1000GB`
- Colour: `Grey`, `Silver`, `Gold`, `Midnight`, `Starlight`, `Space Black`
- Grade: `Fair`, `Good`, `Excellent`

Write SKU to BM Devices Board `text89`.

---

## Step 4: Resolve Product from BM Catalog (HARD GATE)

**Source:** `backmarket/data/bm-catalog.json` (309 variants, 23 model families)

The catalog is the **single product resolver**. No other source is used for product identity.

### How it works:

1. Derive `model_family` from model number (e.g. A2338 → "MacBook Pro 13-inch (2020)")
2. Normalize RAM, SSD, colour
3. Look up: `model_family + RAM + SSD + colour`

### Resolution outcomes:

| Outcome | Meaning | Action |
|---------|---------|--------|
| Exact match, `verified` | Product_id confirmed with complete specs | Proceed |
| Exact match, `needs_review` | Product_id found but specs incomplete | BLOCK — manual review |
| `market_only` | Only seen in scraper, not our history | BLOCK — cannot authorize listing |
| Ambiguous (multiple matches) | Multiple candidates for same spec | BLOCK — manual review |
| No match | Spec not in catalog | BLOCK |

**HARD GATE:** Only `verification_status === "verified"` proceeds.

### Colour normalization:

- `Space Grey` / `Space Gray` / `Grey` / `Gray` → `Space Gray`
- `Space Black` and `Black` are NOT interchangeable
- `Silver`, `Gold`, `Midnight`, `Starlight` → as-is

### For blocked devices with candidates:

When the catalog has the right model family but can't exact-match (e.g. colour missing), BM's Path B CSV create can use **any product_id from the same model family**. BM auto-resolves to the correct backmarket_id. The post-create verification then confirms the title matches the device.

Use the `--product-id <uuid>` override flag. The script creates the listing with that product_id, then post-create verification confirms BM assigned the correct title. If the title doesn't match the device specs, the listing stays as draft.

---

## Step 5: Calculate P&L

### Costs:

| Cost | Source |
|------|--------|
| Purchase | `numeric` on BM Devices Board |
| Parts | `lookup_mkx1xzd7` on Main Board (comma-separated, sum) |
| Labour | `formula__1` × £24/hr |
| Shipping | £15 flat |
| BM buy fee | purchase × 10% |
| BM sell fee | sell price × 10% |
| VAT (margin scheme) | (sell - purchase) × 16.67%, only if positive |

### Market price (for P&L reference):

From catalog `grade_prices` for the matched variant:
- If catalog has grade price → use it
- If not → derive: 5% under next available grade, or floor × 1.5

**This market price is NOT the final listing price.** It's used for the P&L calculation only. The actual listing price comes from backbox after creation.

### Floor price (break-even):

```
total_fixed = purchase + parts + labour + shipping + bm_buy_fee
floor = ceil((total_fixed - purchase × 0.1667) / (1 - 0.10 - 0.1667))
```

### Profitability at min_price:

```
min_price = ceil(proposed × 0.97)
bm_sell_fee = min_price × 0.10
vat = max(0, (min_price - purchase) × 0.1667)
total_costs = purchase + parts + labour + shipping + bm_buy_fee + bm_sell_fee + vat
net = min_price - total_costs
margin = (net / min_price) × 100
```

### Grade ladder check:

Verify Fair < Good < Excellent from catalog grade prices. Flag inversions but do NOT block.

---

## Step 6: Decision Gate

| Condition | Decision |
|-----------|----------|
| Net ≥ £50 and margin ≥ 15% | PROPOSE |
| Net ≥ £50 and margin < 15% | PROPOSE (flag low margin) |
| Net < £50 | BLOCK (unless `--min-margin 0` override) |
| Net < £0 | BLOCK (unless `--min-margin 0` override) |

`--min-margin 0` requires explicit Ricky approval. It overrides BOTH the margin gate AND the £50 net minimum for devices Ricky has approved to clear stock. Any other value (e.g. `--min-margin 5`) sets both the minimum margin % and minimum net £ to that value.

**In dry-run:** shows the decision and stops here.
**In live mode with `--item`:** proceeds to listing creation.

---

## Step 7: Create Draft Listing (Path B)

**Always creates a new listing. Never reactivates old listings.**

```
POST /ws/listings
Content-Type: application/json

{
  "catalog": "sku,product_id,quantity,warranty_delay,price,state,currency,grade\r\n{SKU},{PRODUCT_ID},1,12,{PLACEHOLDER_PRICE},3,GBP,{BM_GRADE}",
  "quotechar": "\"",
  "delimiter": ",",
  "encoding": "utf-8"
}
```

- **state=3** (draft — NOT live)
- **grade MUST be in CSV header and data** — without it BM defaults to GOOD
- **placeholder price** = max(floor × 2, catalog grade price × 1.2)
- The placeholder never goes live. It's a safe number in case anything goes wrong.

### Poll task for result:

```
GET /ws/tasks/{task_id}
```

Poll every 3 seconds until `action_status` = 9. Extract `listing_id`, `backmarket_id`, `publication_state` from `result.product_success`.

**Safety:** BM may return `publication_state: 2` (live) instead of 3 (draft) if a previous listing slot with the same product_id exists. If this happens, immediately set `quantity: 0` before running verification. This ensures no listing is live without passing verification.

---

## Step 8: Verify Draft Listing

```
GET /ws/listings/{listing_id}
```

Verify:
- `publication_state` = 3 (still draft)
- `grade` = expected BM grade
- Title contains correct RAM
- Title contains correct SSD
- Colour: if catalog resolution was `catalog-exact` with `colourVerified`, colour is proven by product_id — title colour check is skipped (BM titles do not always include colour). If `--product-id` override was used or catalog status is uncertain, title MUST contain correct colour.
- `product_id` matches expected

**If critical mismatch (grade or title wrong):** Leave as draft. Alert Telegram. Do NOT publish. The product_id was wrong or BM resolved to the wrong catalog entry.

---

## Step 9: Get Real Price from Backbox

Now the listing exists, get the actual buy box price:

```
GET /ws/listings/{listing_id}  → get UUID
GET /ws/backbox/v1/competitors/{uuid}
```

### Pricing cascade:

| Priority | Source | Condition |
|----------|--------|-----------|
| 1 | Backbox `price_to_win` | Available and ≥ floor price |
| 2 | Floor price | Backbox available but below floor |
| 3 | Catalog grade price | No backbox data |
| 4 | Floor × 1.5 | No backbox and no catalog price |

**Never use old listing prices.** They are stale.

Calculate `min_price = ceil(final_price × 0.97)`.

### Final profitability check:

Recalculate P&L with the final price. If net < £0 and no `--min-margin` override → leave as draft, alert Telegram.

---

## Step 10: Publish

```
POST /ws/listings/{listing_id}
{
  "quantity": 1,
  "price": {final_price},
  "min_price": {min_price},
  "pub_state": 2,
  "currency": "GBP"
}
```

---

## Step 11: Verify Published Listing

```
GET /ws/listings/{listing_id}
```

Confirm:
- `publication_state` = 2 (live)
- `quantity` = 1
- `grade` = expected
- Title still correct

**If critical mismatch after publishing:** Set qty=0 immediately. Alert Telegram. Do NOT update Monday.

---

## Step 12: Update Monday

### BM Devices Board (3892194968):

| Column ID | Value |
|-----------|-------|
| `text_mkyd4bx3` | New listing_id |
| `text_mm1dt53s` | Product UUID |
| `text89` | Constructed SKU |
| `numeric_mm1mgcgn` | Total fixed cost |

### Main Board (349212843):

| Column ID | Value |
|-----------|-------|
| `status24` | Listed (index 7) |

Monday is updated ONLY after published listing passes verification.

---

## Step 13: Confirm to Telegram

```
✅ Listed: [Device] [Config] [Grade] [Colour]
Price: £X | Min: £X | Net@min: £X (X%)
Listing ID: {listing_id} (NEW)
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Final Grade empty | STOP. Cannot list. |
| Catalog no match | STOP. Flag for manual review. |
| Catalog needs_review | STOP. Flag for manual review. |
| Path B creation fails | Alert Telegram. No Monday changes. |
| Draft verification fails | Leave as draft. Alert. Do NOT publish. |
| Backbox returns no data | Use catalog price or floor × 1.5. Flag for review. |
| Published verification fails | Set qty=0. Alert. Do NOT update Monday. |
| Monday update fails after listing live | ALERT IMMEDIATELY. Listing is live but Monday out of sync. |

---

## BM API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ws/listings` | POST | Create new listing (CSV body) |
| `/ws/listings/{id}` | POST | Update listing (qty, price, pub_state) |
| `/ws/listings/{id}` | GET | Read listing details |
| `/ws/tasks/{id}` | GET | Poll creation task status |
| `/ws/backbox/v1/competitors/{uuid}` | GET | Get buy box price |

**Headers required on ALL calls:**
```
Authorization: {BACKMARKET_API_AUTH}
Accept-Language: en-gb
User-Agent: {BACKMARKET_API_UA}
Content-Type: application/json
```

**Base URL:** `https://www.backmarket.co.uk`

---

## Boards & Columns Quick Reference

| Board | ID |
|-------|----|
| Main Board | 349212843 |
| BM Devices Board | 3892194968 |

| Column | Board | ID |
|--------|-------|----|
| Final Grade | Main | `status_2_Mjj4GJNQ` |
| Colour | Main | `status8` |
| Parts cost | Main | `lookup_mkx1xzd7` |
| Labour cost £ | Main | `formula_mkx1bjqr` |
| Labour hours | Main | `formula__1` |
| Status (To List/Listed) | Main | `status24` |
| RAM | BM Devices | `status__1` |
| SSD | BM Devices | `color2` |
| CPU | BM Devices | `status7__1` |
| GPU | BM Devices | `status8__1` |
| Purchase price | BM Devices | `numeric` |
| Listing ID | BM Devices | `text_mkyd4bx3` |
| Product UUID | BM Devices | `text_mm1dt53s` |
| SKU | BM Devices | `text89` |
| Total fixed cost | BM Devices | `numeric_mm1mgcgn` |
| Board relation (→ Main) | BM Devices | `board_relation` |

---

## QA Notes (2026-03-28)

This section records the current QA status of SOP 06 v2.0 against the active script at `backmarket/scripts/list-device.js`.

### Findings

1. **FIXED — Decision gate mismatch**

The SOP says devices with net profit below `£50` must be blocked unless explicitly overridden.

The script now implements that rule. In `decisionGate()`, it blocks when:
- `net < 0` with no override
- `0 <= net < £50` with no override
- `margin < minMargin`

This closes the previous gap where a device with net profit between `£0` and `£49.99` could still proceed if margin was above threshold.

**Script reference:** `list-device.js` `decisionGate()` and `minNet`

### 2. **FIXED — Cost column mismatch**

The SOP says:
- parts cost comes from Main Board `lookup_mkx1xzd7`
- labour cost is derived from `formula__1 × £24/hr`

The script now reads:
- `lookup_mkx1xzd7` into `partsCost`
- `formula__1` into `labourHours`

It also correctly treats `lookup_mkx1xzd7` as a mirror value containing comma-separated parts costs and sums them before pricing.

**Script reference:** `list-device.js` `readDeviceSpecs()`

### 3. **MEDIUM — Dead legacy resolver code still present**

The active listing flow now uses the BM catalog as the resolver of record and does not reactivate old listings.

However, the file still contains dead legacy resolver code and constants for:
- old lookup-table resolution
- old V6-based product resolution
- old Intel/hardcoded resolver paths

These are not in the active execution path, but they can confuse future agents and reviewers.

### 4. **LOW — `--force-live` is still parsed**

The script logs that `--force-live` is disabled, and the active live gate does not rely on it.

However, the flag is still parsed from CLI args, which is unnecessary and confusing.

### 5. **MEDIUM — `--min-margin` override semantics still broader than the SOP wording**

The script now uses the override value for both:
- minimum margin threshold
- minimum net-profit threshold

So `--min-margin 0` behaves as intended for Ricky-approved low-margin devices, but any other override value also changes the net-profit floor.

That behavior is coherent in code, but the SOP wording should be treated as shorthand rather than an exact description until it is tightened.

### Check Summary

| Check | Status | Notes |
|------|--------|-------|
| SOP steps match script | MOSTLY PASS | Critical cost/deadline mismatches fixed; override wording still needs tightening |
| Column IDs match script | PASS | Active script now reads `lookup_mkx1xzd7` |
| API endpoints/payloads match | PASS | Listing create/update/task/backbox flow matches |
| Verification checks all required fields | PASS | Script checks `product_id`, grade, RAM, SSD, colour, `pub_state`, quantity |
| Any live path without verification | NO | Draft-first, verify-before-live is enforced |
| Any old-listing reactivation path | NO | Active flow is clean-create only |
| Pricing cascade implemented | MOSTLY PASS | Cascade matches, but cost inputs may be wrong |
| `--product-id` override works | PASS WITH CAUTION | Uses override and relies on post-create verification |
| `--min-margin` override works as documented | MOSTLY PASS | Operationally works, but wording does not fully describe net-floor override semantics |
| Deleted functions still in active flow | NO | No active calls found |
| Dead code paths remain | YES | Old resolver code still present in-file |

### Catalog Contract Check

`backmarket/data/bm-catalog.json` matches what `resolveProductFromCatalog()` expects:
- top-level `variants` object keyed by `product_id`
- per-variant fields include:
  - `product_id`
  - `title`
  - `backmarket_id`
  - `ram`
  - `ssd`
  - `colour`
  - `model_family`
  - `resolution_confidence`
  - `verification_status`
  - `grade_prices`
  - `available`

### Live Execution Verdict

**Current verdict: CONDITIONALLY SAFE after final wording cleanup.**

The two prior critical blockers are fixed:
- profitability gating now includes the `£50` minimum net-profit rule
- parts cost now reads from the correct Main Board mirror column

Remaining caution:
- the `--min-margin` override behavior is broader than the current SOP wording
- dead legacy resolver code is still present in-file and may confuse future readers

Recommended before autonomous live execution:
1. tighten the `--min-margin` wording in the SOP so it exactly matches script behavior
2. remove dead legacy resolver code from `list-device.js`

After those cleanups, this SOP/script pair can be treated as ready for controlled single-item live execution.
