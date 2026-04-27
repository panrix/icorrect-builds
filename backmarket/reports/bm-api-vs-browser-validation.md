# BM seller-experience API vs browser-harness URL capture — validation

**Run date:** 2026-04-27
**Hypothesis:** `GET /api/seller-experience/listings/{uuid}` returns the same `productPageLink.href` as yesterday's browser walk, so URL capture can collapse from a ~100-min DOM scrape to a ~30s API loop.

## Verdict: CONFIRMED

10/10 of yesterday's batch-10 SKUs reconciled byte-for-byte to the API's `markets.GB.productPageLink.href` after stripping the `?l=N` tracking param the front-end appends. No conflicts. No partial matches.

## Throughput

| Stage | API | Browser (yesterday's run) |
|---|---|---|
| 50-listing URL capture | **36.3 s** total (1.2 s list + 35.1 s detail, serial) | 1300 s extrapolated (26.2 s/SKU × 50) |
| Per-listing detail GET | 0.70 s mean (min 0.58 / median 0.68 / max 1.50) | ~26 s |
| Speedup | — | ~36× |

The API loop is serial. A `ThreadPoolExecutor(max_workers=8)` over the same 50 calls would land near 5 s — practical 50× without any reliability hit since each is an idempotent GET with no rate-limit signals observed.

## Match rate (10 overlap SKUs)

10/10 identical after stripping `?l=N` (a UI-side referrer tag that doesn't change the canonical product URL — browser sees `?l=12`, API returns the bare URL). SKU, productId, and `legacyProductId` (back_market_id) all reconcile cleanly.

**Notable:** 2 of yesterday's 10 records (`MBA.A2179.I3.8GB.512GB.Grey.GOOD`, `iPXR.White.256GB.Good`) had `verification_status: error` in the browser run (`WebSocket connection closed` / `keepalive ping timeout`). The API resolved both deterministically in <1 s with no special handling. **The API doesn't just match the browser — it strictly dominates it on the failure cases.**

## Quirks / edge cases

- **Filter shape:** `/listings-new` REQUIRES at least one `publicationStates` value. Empty/omitted returns 400. Same for `/listings/count`. To enumerate the full inventory, pass all five: `ONLINE`, `OFFLINE`, `DISABLED`, `IN_VALIDATION`, `MISSING_PRICE_OR_COMMENT`.
- **`markets.GB` lives in one of three buckets:** `withoutBackbox`, `withBackbox`, or `offline`. Pipeline must check all three. Distribution in this 50-listing sample: 47 offline, 2 withoutBackbox, 1 withBackbox. The bucket reflects BackBox enrollment / publication state, not whether the URL is valid — `productPageLink.href` was populated in 50/50 records regardless of bucket or publication state (including DISABLED listings).
- **`?l=N` tracking suffix:** browser-scraped URLs carry a `?l=10|11|12` referrer tag from the seller-portal click-through. API returns the bare canonical URL. Strip with `re.sub(r'\?l=\d+$', '', url)` — these are equivalent.
- **`legacyProductId` = back_market_id.** The numeric "back market ID" Codex's pipeline tracks is the listing's `legacyProductId`. The listing itself also has a separate `legacyId` (different number).
- **Pagination:** `nextCursor` is a UUID; pass as `cursorId=<uuid>&direction=next`. `pageSize` accepts only the enum {10, 20, 30, 50, 100, 200}.
- **No 401/CAPTCHA encountered.** Session cookies on the existing tab carried 60+ GETs cleanly.

## Recommendation

**Switch Codex's URL-mapping pipeline to API-only.** The browser walk is now strictly worse on every axis: 36× slower, fails on roughly 20% of records (2/10 in yesterday's run), and adds a Cloudflare/DOM surface for no informational gain. The browser-harness session is still required as the auth carrier (cookies for `fetch credentials:'include'`), but no DOM interaction is needed.

Concrete rewrite:
1. One `GET /api/seller-experience/listings-new?publicationStates=...&markets=GB&pageSize=200` (paginated by `nextCursor`) gets the full inventory + every listing's `id` in seconds.
2. For each `id`, `GET /api/seller-experience/listings/{id}` returns `markets.{withoutBackbox|withBackbox|offline}.GB.productPageLink.href` plus `sku`, `productId`, `legacyId`, `legacyProductId`, `quantity`, and `publicationState`. Strip `?l=\d+$` if cross-comparing against any historical browser-scrape data.
3. Wrap in `ThreadPoolExecutor(max_workers=8)` with a single shared session; expect ~5 s for 50, well under 1 minute for the entire seller catalog.

The earlier browser-harness `url-capture.md` skill should be marked superseded for this use case.

## Artifacts

- Raw 50-listing capture: `/tmp/bm-api-50-validation.json` (includes per-call timing and overlap diff)
- Endpoint reference: `/tmp/bm-openapi.json` schemas `FilteredListingDTO`, `ListingDTO`, `MarketInfoDTO`
