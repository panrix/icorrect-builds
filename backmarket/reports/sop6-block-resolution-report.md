# SOP 6 BLOCK Resolution Report

**Date:** 2026-04-26
**Source dry-run:** `/home/ricky/.openclaw/agents/backmarket/workspace/docs/sop6-to-list-cards-2026-04-02.md`
**Method:** READ-ONLY GETs against BM seller-portal private API. No mutations. Session: existing signed-in Chrome tab on `bo-seller`.

---

## Summary

| | Count |
|---|---|
| Total non-PROPOSE entries in SOP 6 dry-run | 4 |
| BLOCKs from catalog miss (API-resolvable) | 3 |
| ERRORs from upstream data integrity (not API-fixable) | 1 |
| **Now resolvable via live API: 3 / 3 BLOCKs** | **100%** |
| Still blocked: 0 |
| Need disambiguation: 0 |

All three SOP 6 BLOCKs are **false negatives** caused by the local snapshot at `/home/ricky/builds/backmarket/data/bm-catalog.json` (catalog_version `2026-W13`, snapped 2026-03-28). Every one resolves to a single, unambiguous BM productId that is currently listable on GB at the requested grade.

The remaining ERROR (BM 1411) is a Monday-board linkage problem — out of scope for this audit.

---

## Per-item resolution

| BM | Status | Live productId | Title (BM canonical) | Colour | GB market | Grade authorised | Listable now |
|---|---|---|---|---|---|---|---|
| 1418 | RESOLVABLE | `8f4afe93-a39c-4752-9805-a3626a565618` | MacBook Air 13-inch (2022) — Apple M2 8-core / 10-core GPU — 8GB / 512GB SSD — QWERTY-EN | Space Gray | Yes | Excellent | Yes |
| 1483 | RESOLVABLE | `7321f8b6-c3f9-4141-b562-c1f6e426bf0e` | MacBook Pro 16-inch (2023) — Apple M3 Pro 12-core / 18-core GPU — 36GB / 1000GB SSD — QWERTY-EN | Space Black | Yes | Excellent | Yes |
| 1491 | RESOLVABLE | `9b1ef69f-c204-4a9f-8b06-a4ec8e37b231` | MacBook Air 13-inch (2022) — Apple M2 8-core / 8-core GPU — 8GB / 256GB SSD — QWERTY-EN | Midnight | Yes | Good | Yes |
| 1411 | NOT API-FIXABLE | n/a | n/a | n/a | n/a | n/a | Upstream data: no BM Devices link on Main Board. |

For all three resolved items, `availableMarkets` = `['GB']` and `aestheticGrades` includes Excellent/Good/Very good/Fair/Stallone (i.e. SHINY/GOLD/SILVER/BRONZE/STALLONE — values 0-4). Each has a live GB product page link.

### Notable side-finding (catalog labelling bug, not a missing product)

`9b1ef69f-…` is the SAME productId already used in the registry for **BM 1429 / BM 1496** (per SOP 6 PROPOSE entries). Codex's local catalog labels it `Starlight`, but BM's live `/products/{id}` returns `color: "Midnight"`. So the local snapshot mis-labels the colour; the registry mapping is correct.

---

## Why the local catalog missed these

`/home/ricky/builds/backmarket/data/bm-catalog.json` was built from listing-history + order-history + scraper-picker. Its 309 variants cover the colours iCorrect has previously transacted; it does NOT enumerate BM's full product catalog. So:

- BM 1483 (M3 Pro Space Black) — not in catalog at all (we've never listed an M3 Pro before).
- BM 1418 (Space Gray M2/512) — catalog has the M2/512 spec only in Midnight (×2). Space Gray exists in BM but never appeared in our history.
- BM 1491 (Midnight M2/256, 8-core GPU) — catalog has 5 colours for that spec but mis-labels the Midnight productId as Starlight.

---

## Discovery findings

The task brief described `GET /api/seller-experience/opportunities/inventory` as a "full live catalog" search by `productTitle`. That is **not accurate**. Confirmed empirically:

- Without `categoryId`, MacBook search returns 1219 rows — but **only Intel-era 2015-2020 MBPs**. M-series queries (`M2`, `M3`, `2023`) return zero.
- `categoryId=110` ("MacBook") returns the **legacy / Intel** subset only (441 rows, year distribution 2015-2020).
- **The actual M-series surface is `categoryId=528`** ("MacBook M1" — the umbrella for all Apple Silicon Macs: M1/M2/M3/M4). 742 rows, full M-series coverage.
- `opportunities/inventory` is curated by demand. Some niche variants may not appear at all even on the right category. So it should be treated as a **product candidate generator**, not as a definitive catalog source.

The truly authoritative endpoint per-product is `GET /api/seller-experience/products/{productId}` — which returns `fields.color`, `fields.processor`, `fields.title`, `fields.memory`, `fields.storage`, `fields.manufacturer_version` (e.g. `A2681`/`A2991`) and gives unambiguous spec data.

The listability gate is `GET /api/seller-experience/listings/metadata/create/products/{productId}` — returns `aestheticGrades` (the seller's authorised grade list, value 0-4 = SHINY/GOLD/SILVER/BRONZE/STALLONE) plus `product.availableMarkets` (GB / FR / DE / etc.).

Caveat: `aestheticGrades` was the same five-grade enum on every product I checked, so its discriminating power for these three items is low — `availableMarkets` is the real listability gate, and all three include `GB`.

---

## Recommended patch to `list-device.js`

Add a fallback resolver that runs only when the local catalog returns one of:
- `resolutionSource: 'catalog-no-match'` (line 704)
- `resolutionSource: 'catalog-needs-review'` with `blockReason` containing "No exact colour match" (line 688-691)
- `resolutionSource: 'catalog-ambiguous-exact'` (line 656)

### Minimal patch (sketch)

Insert before the BLOCK return at lines 685-699 and 701-706 of `/home/ricky/builds/backmarket/scripts/list-device.js`:

```js
// Live-API fallback: query opportunities/inventory + filter by colour via /products/{id}
const liveMatch = await resolveViaLiveApi({ modelFamily, ram, ssd, colour, processor: specs.processor });
if (liveMatch?.productId) {
  return {
    ...base,
    productId: liveMatch.productId,
    title: liveMatch.title,
    backmarketId: liveMatch.backmarketId,
    resolutionConfidence: 'live_api_verified',
    verificationStatus: 'verified',
    liveEligible: true,
    resolutionSource: 'live-api-fallback',
    colourVerified: true,
    variant: liveMatch,
  };
}
// fall through to existing BLOCK
```

Where `resolveViaLiveApi` does (pseudocode, all GETs, no mutations):

1. Map `modelFamily` → BM title fragment (e.g. `MacBook Pro 16-inch (2023)`) and category (`528` for Apple-Silicon, `110` for Intel).
2. `GET /api/seller-experience/opportunities/inventory?productTitle=<fragment>&pageSize=200&categoryId=<cat>&currency=GBP` — collect unique `productId`s whose titles contain the right RAM/SSD/processor.
3. For each candidate, `GET /api/seller-experience/products/{id}` and match `fields.color` against the SKU's normalised colour.
4. If exactly one match, `GET /api/seller-experience/listings/metadata/create/products/{id}` — confirm `product.availableMarkets` includes `GB` and the BM grade is in `aestheticGrades`. Return resolved.
5. If zero matches via opportunities/inventory, **stop** (do not invent a productId). The brief's premise that opportunities/inventory exposes the entire catalog is wrong; some products (especially low-volume colours) may genuinely not be in this feed.

### Auth

Reuses the seller cookie that the existing pipeline already holds via `credentials: 'include'` from a signed-in browser context. No new credentials needed. If running headlessly (Codex CI), the call must go through a session-bearing browser harness, exactly as the SKU canary already does.

### Safety

All four endpoints are GETs. No state changes. Add a feature flag (e.g. `--live-catalog-fallback`) so the patch is opt-in for the first few runs until trust builds.

### Side benefit

A logged `resolutionSource: 'live-api-fallback'` value also surfaces catalog drift — every successful fallback is a hint that `bm-catalog.json` should grow. Pipe those into the next `build-listings-registry.js` rebuild to keep the local snapshot current.

---

## Files of record

- Script analysed: `/home/ricky/builds/backmarket/scripts/list-device.js` (BLOCK logic at lines 600-707, especially 684-706)
- Stale catalog: `/home/ricky/builds/backmarket/data/bm-catalog.json` (2026-W13, 309 variants)
- Dry-run: `/home/ricky/.openclaw/agents/backmarket/workspace/docs/sop6-to-list-cards-2026-04-02.md`
- API reference: `/Users/icorrect/Developer/browser-harness/domain-skills/backmarket/api-discovery.md`
