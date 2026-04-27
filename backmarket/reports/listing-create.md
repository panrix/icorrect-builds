# Back Market — list a device end-to-end via API

Discovered 2026-04-27. Listing creation collapses to **3 API calls** (catalog search → listability check → POST listings). No UI clicks required, no Cloudflare to clear, no DOM to fight. Proven live: BM 1483 (MacBook Pro 16" M3 Pro Excellent, listed at £2000 in ~1s wall-clock).

This skill replaces the "find catalog match in local snapshot, fall back to manual UI" pattern in Codex's `list-device.js` for any device whose canonical product exists in BM's live catalog (which is roughly 100% of refurbished Apple stock — confirmed by repeatedly hitting BM's catalog with iCorrect's typical SKUs).

## The 3-step flow

### Step 1 — find the canonical productId

Use `GET /api/seller-experience/opportunities/inventory` with `productTitle` + `categoryId` filters:

```python
url = '/api/seller-experience/opportunities/inventory'
params = {
    'productTitle': 'MacBook Pro 16-inch (2023)',  # broad enough to match
    'categoryId': 110,                              # MacBook
    'pageSize': 100,                                # max page = 200
}
# returns {count, next, results: [{productId, title, brand, grade, categoryName, isListed, ...}]}
```

**Important quirks of `/opportunities/inventory`:**

- Despite the name ("opportunities"), this is **the** searchable BM catalog. It surfaces ~all products in your authorised categories — not just BM-curated recommendations.
- `productTitle` is **substring match against the canonical product name**. Phrases like `"MacBook Pro 16-inch (2023)"` work; `"M3 Pro"` works; `"M3+Pro"` (URL-encoded space) returns broader matches than `"M3-Pro"` would.
- Returns DUPLICATE rows per (productId, grade) combination — same productId can appear multiple times if BM has data for it at Excellent + Good + Fair separately. Dedupe by `productId` when you only need the catalog entry.
- The `title` field carries spec but **NOT colour**. Colour is bound to the productId itself (different colour = different productId), but you can't tell which is which from the title alone — you have to either disambiguate from the public product page or check the per-product detail (next step).
- For **MacBook**, `categoryId=110`. Other category IDs are at `GET /api/seller-experience/opportunities/inventory/metadata` (returns full category list — iPhone, iPad etc.).

For "MacBook Pro 16-inch (2023) - Apple M3 Pro 36GB 1TB SSD English QWERTY" the search returned 4 productId rows with that exact spec, two of which were English QWERTY (one Space Black, one Silver) — the other two were Italian / French / Dutch keyboard variants.

### Step 2 — verify listability + colour disambiguation

For each candidate productId, hit `GET /api/seller-experience/listings/metadata/create/products/{product_id}`:

```python
r = api('GET', f'/api/seller-experience/listings/metadata/create/products/{product_id}')
# returns {
#   "aestheticGrades": [{"label","value","code"}],   ← what grades are listable for THIS product
#   "product": {
#     "id", "publicId", "name", "mpn", "manufacturerVersion",
#     "dualSim", "thumbnails",
#     "availableMarkets": [{"market", "productPageLink": {"href"}}]
#   }
# }
```

**Key fields:**

- `aestheticGrades[].value` — the integer used in the POST body (`Excellent=0, Very good=1, Good=2, Fair=3, Stallone=4`; PREMIUM grade = 9 if your account has premium access).
- `aestheticGrades[].code` — the human-readable code (`SHINY`, `GOLD`, `SILVER`, `BRONZE`, `STALLONE`, `PREMIUM`).
- `product.mpn` — Apple's manufacturer part number. **The fastest colour disambiguator.** For MBP 16" 2023 M3 Pro 36GB 1TB the two candidates differ on `mpn`: `MRW63FN/A-CTO-RO-36GB-1TB` vs `MRW23FN/A-CTO-RO-36GB-1TB`. Apple's MPN scheme encodes colour. Cross-reference against an Apple MPN map, OR just hit the public product page once per candidate and grep for `space black` / `silver`.
- `product.availableMarkets[].productPageLink.href` — the canonical public URL (no `?l=N` suffix from the API; that's appended only when the UI navigates there).
- `product.dualSim` — for iPhones; null for laptops.

**Colour disambiguation by public-page check:** if MPN doesn't disambiguate (or you don't have an MPN→colour map handy), fetch each candidate's `productPageLink.href` and regex for the colour token. The first hit per session may need ~5s for Cloudflare to clear; subsequent hits in the same session are instant.

### Step 3 — POST the listing

`POST /api/seller-experience/listings` with body matching `ListingCreationDTO`:

```python
body = {
    "sku": "MBP.A2991.M3PRO.36GB.1TB.SpaceBlack.Excellent",  # iCorrect's internal SKU
    "aestheticGrade": 0,                                      # INTEGER (0 = Excellent)
    "stock": 1,
    "markets": [
        {"market": "GB", "price": 2000}                       # price is a flat NUMBER (not PriceDTO)
    ],
    "productId": "7321f8b6-c3f9-4141-b562-c1f6e426bf0e"       # from step 2
    # optional: "specialOfferType": "NORMAL" | "NEW_BATTERY" | "BATTERY_90_99"
}
r = api('POST', '/api/seller-experience/listings', body)
# 201 Created with empty body (BM does NOT echo the resource)
```

**Required fields**: `sku`, `aestheticGrade` (int), `stock` (int), `markets` (array), `productId` (uuid).

**Schema gotchas worth burning into the wrapper:**

- `aestheticGrade` is an **integer enum**, NOT the string code. `Excellent → 0`, not `"SHINY"`. Use the `value` field from step 2's metadata.
- `markets[i].price` is a **flat number** (e.g. `2000`), NOT a `{amount, currency}` object. Currency is implied by the market (GB → GBP, FR → EUR, etc.).
- **`minimumPrice` is NOT settable at create time.** It's only on the UPDATE schema (`ListingPriceDTO`). To set min, follow up with `PATCH /listings/{uuid}` with `{markets: {GB: {price: ..., minimumPrice: {amount, currency}}}}`.
- **POST returns 201 with empty body.** Don't try to JSON-parse the response — find the new listing via `GET /listings-new?sku=<your_sku>` instead. The `id` field on that result is the listing UUID; `legacyId` is the numeric Listing no.

### Verification

```python
# Find the new listing by SKU
r = api('GET', f'/api/seller-experience/listings-new?publicationStates=ONLINE&publicationStates=OFFLINE&publicationStates=DISABLED&publicationStates=IN_VALIDATION&publicationStates=MISSING_PRICE_OR_COMMENT&sku={your_sku}&pageSize=10')
listing_uuid = r['parsed']['results'][0]['id']

# Full state
full = api('GET', f'/api/seller-experience/listings/{listing_uuid}')
# Confirm:
#   - sku matches what you sent
#   - quantity matches your stock value
#   - aestheticGrade.label matches the grade you intended
#   - markets.<bucket>.GB.publicationState == 'ONLINE' (or 'IN_VALIDATION' if BM is still validating)
#   - markets.<bucket>.GB.price.amount matches the price you sent
```

**Bucket placement:** the new listing lands in `markets.withBackbox.GB` if BM has a competing-listing BackBox for this product, otherwise `markets.withoutBackbox.GB`. Your code shouldn't assume a specific bucket — iterate `('offline', 'withoutBackbox', 'withBackbox')` for the GB market data.

## What this replaces in Codex's pipeline

`list-device.js` currently:
1. Loads `bm-catalog.json` (a stale local snapshot)
2. Looks up the product by model/spec/colour
3. Marks BLOCK if no match → "no catalog match for model/spec/colour"

The fix: **replace step 2 with `/api/seller-experience/opportunities/inventory` query**. Local catalog still useful as a fast-path cache, but the API is the source of truth.

Sub-agent investigation 2026-04-27 confirmed: of the 3 BLOCKed listings in SOP 6's most recent dry-run (BM 1418, BM 1483, BM 1491), all 3 are resolvable via the API. See `sop6-block-resolution-report.md` for per-card productIds.

## Hard safety rules

- **POST /listings is a write.** Per Codex's contract, every individual list requires explicit per-card approval naming the SKU, productId, grade, stock, and market price. The fact that the API call is one-shot atomic does NOT relax this rule — it sharpens it (one PATCH/POST = one mutation, no UI undo).
- **Never auto-list without dry-run first.** The Step 1 + Step 2 search flow is read-only and safe to run unsupervised. Step 3 is not.
- **A POST that succeeds is immediately live to buyers.** A bad price or wrong grade is a real-money error within seconds. Dry-run + manual review of the constructed body before POSTing is the only safe pattern for bulk runs.
- **A duplicate listing under a different grade is allowed by the API** (same productId, different SKU+grade combo). BM 1483 was listed at Excellent on the same productId iCorrect already had a Good-grade listing on. Be aware this is a feature for multi-grade inventory, but also a footgun if your SKU scheme accidentally collides on grade tokens.
- **Reverse: `POST /listings/{uuid}/archive`** moves a freshly-created listing to DISABLED state. Same one-call pattern as the existing TEST cleanup. Reversible via `POST /listings/{uuid}/publish`.

## End-to-end wrapper

```python
def list_device_via_api(sku, product_title_search, category_id, grade_int, stock, gb_price, *, expected_colour=None):
    """Returns (listing_uuid, listing_legacy_id) or raises with explanation."""
    # 1. Search catalog
    candidates = []
    page = 1
    while True:
        r = api('GET', f'/api/seller-experience/opportunities/inventory?productTitle={url_encode(product_title_search)}&categoryId={category_id}&pageSize=100&page={page}')
        for x in r['parsed']['results']:
            if x['productId'] not in [c['productId'] for c in candidates]:
                candidates.append(x)
        if not r['parsed'].get('next'): break
        page += 1
    if not candidates:
        raise NoMatch(f"No catalog candidates for {product_title_search!r} in category {category_id}")
    # 2. (optional) Disambiguate by colour
    if expected_colour:
        candidates = filter_by_public_page_colour(candidates, expected_colour)
    if len(candidates) > 1:
        raise NeedsDisambiguation(f"{len(candidates)} candidates for {product_title_search!r} — narrow further or pick manually", candidates)
    pid = candidates[0]['productId']
    # 3. Verify listability for grade
    meta = api('GET', f'/api/seller-experience/listings/metadata/create/products/{pid}')
    grade_codes = [g['value'] for g in meta['parsed']['aestheticGrades']]
    if grade_int not in grade_codes:
        raise BadGrade(f"Grade {grade_int} not authorised for product {pid}; allowed: {grade_codes}")
    # 4. Create listing
    body = {'sku': sku, 'aestheticGrade': grade_int, 'stock': stock,
            'markets': [{'market': 'GB', 'price': gb_price}], 'productId': pid}
    r = api('POST', '/api/seller-experience/listings', body)
    if r['status'] != 201:
        raise CreateFailed(f"POST returned {r['status']}: {r['body'][:300]}")
    # 5. Find the created listing
    r = api('GET', f'/api/seller-experience/listings-new?publicationStates=ONLINE&publicationStates=OFFLINE&publicationStates=DISABLED&publicationStates=IN_VALIDATION&publicationStates=MISSING_PRICE_OR_COMMENT&sku={url_encode(sku)}')
    rec = next((x for x in r['parsed']['results'] if x['sku']==sku and x['productId']==pid), None)
    if not rec: raise CreateFailed("POST 201 but listing not found by SKU within 1s")
    return rec['id'], rec.get('legacyId')
```

## Per-product caching

The `(productTitle, categoryId) → productId` mapping is stable across a release cycle (BM doesn't churn product IDs). Cache results for ~24h to avoid re-searching the catalog on every listing. Invalidate cache on 404-from-product or on listing-create failure with `productId` validation error.
