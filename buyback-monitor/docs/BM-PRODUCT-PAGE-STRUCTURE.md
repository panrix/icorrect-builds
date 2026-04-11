# BackMarket Product Page Structure

## Last Updated: 2026-03-15

## URL Format
```
https://www.backmarket.co.uk/en-gb/p/{slug}/{product-uuid}?l={grade}
```
- The slug is descriptive but NOT reliable for spec identification (e.g. slug says "2tb" but page shows 256GB)
- The UUID is the true product identifier
- `?l=` parameter controls grade view: `12`=Fair, `11`=Good, `10`=Excellent

## Nuxt Payload (__NUXT_DATA__)
All pricing data lives in a `<script id="__NUXT_DATA__">` tag containing a JSON array.

### Grade Picker Entries
Each grade picker entry is a dict in the array with keys: `label`, `price`, `productId`, `available`, `selected`.

**CRITICAL: Grade picker product_ids are NOT always for the current spec.**

When a grade has sellers for the current spec:
- `product_id` matches the page UUID
- Price is the real per-spec price for that grade
- `available: true`

When a grade has NO sellers for the current spec:
- `product_id` points to a DIFFERENT product (the cheapest available at that grade across ALL specs)
- Price is for that other product, NOT the current spec
- Still shows `available: true` (misleading!)

**Detection method:** Compare `grade.product_id` to the page's UUID.
- `grade.product_id == page_uuid` → real per-spec price ✅
- `grade.product_id != page_uuid` → cross-spec redirect, NOT this spec's price → leave blank ❌

### Example: MBP13 2020 M1

**8GB/256GB page (UUID: 8948b82c):**
- Fair: pid=8948b82c ✅ MATCH → £459 (real)
- Good: pid=8948b82c ✅ MATCH → £501 (real)
- Excellent: pid=0dfd2e16 ❌ DIFFERENT → £529 (this is a different spec's price)

**16GB/1TB page (UUID: 313b776d):**
- Fair: pid=313b776d ✅ MATCH → £609 (real)
- Good: pid=8948b82c ❌ DIFFERENT → £501 (this is 8GB/256GB's Good price, not 16GB/1TB)
- Excellent: pid=0dfd2e16 ❌ DIFFERENT → £529 (cross-spec)

### Storage Picker Entries
- Each entry has a `product_id` (UUID) pointing to a different product page
- `available: true/false` indicates if sellers exist at that storage size
- Price shown is the Fair price for that storage variant
- The `selected` entry's product_id matches the current page UUID

### RAM Picker Entries
- Show price differences but do NOT have product_ids
- RAM variants must be found via sitemap or by following storage picker links from other pages

### Chip/GPU Picker Entries
- Show price and availability but no product_ids
- Different chip variants (M1 Pro vs M1 Max) are different product pages
- Must be found via sitemap

### Colour Picker Entries
- Have product_ids (different UUID per colour)
- Typically same price or ±£20-30

## Sitemap
`https://www.backmarket.co.uk/sitemap_products.xml` contains ~120 MacBook URLs.
- Filter out Intel models (core-i3/i5/i7/i9, retina 2017-2019)
- ~63 M1+ URLs after Intel filtering
- ~47 after keyboard layout deduplication
- Keyboard dupes: same spec, different keyboard (QWERTY English UK vs US vs Canadian)
- Same UUID = definitely same product across keyboard variants

## Scraping Approach
1. Build URL catalogue from sitemap (47 unique M1+ pages)
2. For each page scraped, check storage picker for new product_ids → add to queue
3. One scrape per URL via Massive unblocker (residential IP, JS rendering)
4. Extract: title, grade prices (using product_id matching), colours, storage/RAM pickers
5. Retry failed scrapes with increasing delay (5s, 8s, 10s)

## Massive Unblocker
```
curl -s -H "Authorization: Bearer {token}" \
  "https://unblocker.joinmassive.com/browser?url={encoded_url}&country=gb&delay={delay}"
```
- `delay`: render delay in seconds (5s recommended, increase to 8-10s on retry)
- `expiration=0`: bypass cache (for fresh data)
- Cost: 1 credit per request
- Returns fully rendered HTML including Nuxt payload

## Known Issues
- ~10-15% of scrapes fail (no Nuxt payload in response). Usually Massive timeout.
- BM's slug in URL doesn't always match the actual displayed product (slug says 2TB but page shows 256GB)
- Grade `available: true` is misleading when product_id doesn't match (it means that grade is available SOMEWHERE, not for this spec)
- Premium grade rarely available for MacBooks

## Price Data Reliability
- **Fair price**: most reliable. Always per-spec when the page loads correctly.
- **Good/Excellent**: only reliable when grade picker product_id matches page UUID. Otherwise it's a cross-spec price that should be treated as null.
- **Storage picker Fair prices**: accurate per-spec (each storage option shows its own Fair price)
- **RAM picker prices**: show the Fair price delta but don't have product_ids for direct scraping
