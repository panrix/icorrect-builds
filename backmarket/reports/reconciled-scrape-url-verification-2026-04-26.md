# Reconciled Back Market Scrape URL Verification

Date: 2026-04-26
Scope: investigation, design, and minimal dry-run-only implementation for listing-card scrape target verification.
Guardrails: no BM or Monday mutation changes were made; live listing behavior was not changed.

## Executive Summary

Ricky's concern was valid at the system-design level: before this patch, `list-device.js` trusted the live scrape output for a requested `product_id` without proving the returned page state still matched the candidate's exact RAM, SSD, colour, chip, keyboard/layout, and grade.

On 2026-04-26, BM 1527 itself is **not** proven to be mismatched in the live scrape path. A read-only live scrape of UUID `9ef00207-1136-45f4-99c3-ade923986e43` reconciled correctly to:

- RAM `8GB`
- SSD `512GB`
- Colour `Silver`
- Chip `Apple M1 8-core / 8-core GPU`
- Grade ladder `Fair 405 / Good 458 / Excellent 569`

The real defect was that the code had no contract to prove that. A wrong sibling page or family-level fallback could have been accepted as trusted market data.

## Root Cause

### 1. `list-device.js` selected a scrape URL but did not verify the returned page state

Current path before patch:

1. Build canonical SKU from Monday/BM Devices.
2. Resolve a canonical `product_id` from `data/listings-registry.json` or `data/bm-catalog.json`.
3. Scrape `https://www.backmarket.co.uk/en-gb/p/placeholder/{product_id}?l=10`.
4. Accept returned `gradePrices`, `ramPicker`, `ssdPicker`, `colourPicker`, `cpuGpuPicker`.
5. Use the ladder for market pricing and proposal output.

Missing check:

- no assertion that the expected RAM/SSD/colour/chip picker labels all map back to the same UUID
- no assertion that the reconciled UUID equals the requested UUID
- no assertion that the expected grade is present on that reconciled target
- no hard fail when the page exposes conflicting sibling UUIDs

That is the core wrong-market-pricing risk.

### 2. `scripts/lib/v7-scraper.js` extracted picker data but had no reconciliation layer

Before patch it returned raw extracted data only:

- `gradePrices`
- `ramPicker`
- `ssdPicker`
- `colourPicker`
- `cpuGpuPicker`

It did not:

- extract page metadata
- extract keyboard/layout picker data
- reconcile expected spec labels back to a single UUID
- mark mismatch/divergence as untrusted

### 3. Weekly market data and catalog fallback are not safe trust sources by themselves

Confirmed on 2026-04-26:

- `/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json` model `Pro 13" 2020 M1` is anchored to UUID `8948b82c-f746-4be0-a8b0-0758b1dc4acc`, which is the `256GB Space Gray` sibling.
- That model page exposes sibling picker UUIDs for other SSD/colour combinations.
- `data/bm-catalog.json` contains inverted fallback grade ladders for the 512GB siblings:
  - `30c2c24c-be74-409d-8bec-50e9b9bf421a` (`512GB Space Gray`): `Fair 463 / Good 436 / Excellent 483`
  - `9ef00207-1136-45f4-99c3-ade923986e43` (`512GB Silver`): `Fair 463 / Good 436 / Excellent 483`

So a family-level match or fallback can easily produce plausible-looking but wrong or unsafe prices unless the page is reconciled back to the exact candidate target.

### 4. Why a 512GB device could receive 256GB market data

This can happen if any path accepts family-page data or a sibling-selected page state without reconciliation:

- weekly model page anchored to a 256GB base UUID
- scrape lands on a family page whose selected state is not the requested sibling
- live scrape falls back to catalog/weekly family-grade data
- any consumer matches by family/title/picker presence instead of proving all expected spec pickers converge to the same UUID

The failure mode is not "the URL string is wrong"; it is "the requested target is not reconciled against the returned page state."

## BM 1527 Verification

BM 1527 context checked on 2026-04-26:

- Main item `11440582288`
- BM Devices item `11440594268`
- SKU `MBP.A2338.M1.8GB.512GB.Silver.Fair`
- Registry slot `5035146`
- Requested UUID `9ef00207-1136-45f4-99c3-ade923986e43`

Read-only live scrape result for that UUID on 2026-04-26:

- final URL preserved the same UUID
- RAM picker `8 GB` -> `9ef00207-1136-45f4-99c3-ade923986e43`
- SSD picker `512 GB` -> `9ef00207-1136-45f4-99c3-ade923986e43`
- Colour picker `Silver` -> `9ef00207-1136-45f4-99c3-ade923986e43`
- CPU/GPU picker `Apple M1 8-core - 8-core GPU` -> `9ef00207-1136-45f4-99c3-ade923986e43`
- page title: `MacBook Pro (M1 series)QWERTY - English • 13" • Apple M1 8-core - 8-core GPU • 512 GB • RAM 8GB • Silver`
- grade ladder: `Fair 405 / Good 458 / Excellent 569`

Conclusion for BM 1527:

- the immediate live scrape mismatch was **not reproduced**
- the old card was still unsafe in principle because the script had no explicit verification contract
- after the patch, BM 1527's scrape target now verifies as reconciled in dry-run

## Reconciled Scrape Target Contract

Required contract before a card/listing proposal is trusted:

1. Canonical candidate spec
   - from Monday/BM Devices/QC SKU
   - model family
   - chip / CPU-GPU
   - RAM
   - SSD
   - colour
   - keyboard/layout where present
   - grade

2. Canonical BM target
   - registry/catalog `product_id`
   - source of truth (`listings-registry` preferred, catalog fallback second)
   - generated URL `.../p/placeholder/{product_id}?l=10`

3. Returned page assertions
   - expected RAM picker label exists
   - expected SSD picker label exists
   - expected colour picker label exists
   - expected chip picker label exists
   - expected keyboard/layout is confirmed by picker or page title
   - all matched spec dimensions reconcile to one UUID
   - reconciled UUID equals requested UUID

4. Grade assertions
   - expected grade price exists on the returned ladder
   - ladder validation checks `Fair < Good < Excellent` when all are present

5. Trust rule
   - hard fail if any required spec dimension is missing/mismatched
   - hard fail if matched picker UUIDs diverge
   - hard fail if reconciled UUID != requested UUID
   - hard fail if expected grade is missing
   - card/proposal is untrusted until fully reconciled

## Implemented Fix

Implemented because scope stayed small and isolated to read-only trust logic.

### Files changed

- `scripts/lib/v7-scraper.js`
- `scripts/list-device.js`
- `test/unit/v7-scraper-reconcile.test.js`

### `scripts/lib/v7-scraper.js`

Added:

- `keyboardPicker` extraction
- page metadata extraction (`pageTitle`, `finalUrl`)
- normalization helpers for RAM/SSD/colour/chip/keyboard
- `buildReconciledScrapeTarget(candidate, scrape)`

`buildReconciledScrapeTarget(...)` now:

- matches expected spec labels against returned pickers
- records per-dimension assertions
- derives the reconciled UUID from matched picker evidence
- detects picker UUID divergence
- validates expected grade presence and grade ladder order
- returns `trusted: true|false`

### `scripts/list-device.js`

Added dry-run/card-only verification step after live scrape:

- builds the canonical scrape candidate from resolver truth + BM Devices specs
- runs `buildReconciledScrapeTarget(...)`
- logs requested vs reconciled UUID
- exposes verification state in summary/card JSON
- in `--dry-run`, blocks proposal trust if the scrape target is unreconciled

Important boundary:

- live mutation path was **not** changed
- no BM/Monday writes were added or modified
- this is a verification layer for read-only proposal safety only

## Verification

### Tests run

1. `node test/unit/sku.test.js`
2. `node test/unit/current-queue-readonly.test.js`
3. `node test/unit/v7-scraper-reconcile.test.js`
4. `timeout 120s node scripts/list-device.js --dry-run --item 11440582288 --skip-history`

### Test results

- `sku.test passed`
- `current-queue-readonly.test passed`
- `v7-scraper-reconcile.test passed`

### BM 1527 dry-run verification output

Key lines from the 2026-04-26 read-only run:

- `Requested product_id: 9ef00207-1136-45f4-99c3-ade923986e43`
- `Reconciled product_id: 9ef00207-1136-45f4-99c3-ade923986e43`
- `Verification: trusted`
- `Live/catalog grade prices: {"Fair":405,"Good":458,"Excellent":569,"Premium":null}`

The final dry-run stayed blocked only for economics:

- `Decision: BLOCK — Loss at min_price (net £-128.34)`

Not for identity uncertainty.

## Residual Risk / Next Patch

This patch closes the immediate read-only trust gap, but not every upstream pricing risk:

- catalog fallback ladders are still unsafe/inverted in some variants
- weekly market data is still family-page based
- live path still uses the same market result object, even though mutation behavior was intentionally left untouched here

Recommended next step:

1. Move the reconciled-target helper into a shared contract used by:
   - `list-device.js`
   - `buy-box-check.js`
   - any future pricing/card generator
2. Quarantine inverted catalog grade ladders so fallback data cannot silently override live truth.
3. Only allow price consumption when `trusted === true`, even outside dry-run, once that path is explicitly approved and tested.

## Jarvis Paste-Ready Summary

Investigated the Back Market scrape-target mismatch risk on April 26, 2026. Root cause was real: `list-device.js` and `v7-scraper.js` were trusting the returned BM product page ladder without proving the page still matched the candidate's exact RAM/SSD/colour/chip/keyboard target. This meant a 512GB device could inherit 256GB or other sibling-market data if BM returned a family page or fallback data without reconciliation. Also confirmed `sell-prices-latest.json` is family-page based and `bm-catalog.json` contains unsafe inverted fallback ladders for the 512GB A2338 siblings.

Implemented a small dry-run-only reconciliation layer. `v7-scraper.js` now extracts keyboard picker + page metadata and exposes `buildReconciledScrapeTarget(...)`, which matches expected RAM/SSD/colour/chip/keyboard labels back to picker UUIDs, derives the reconciled UUID, validates the grade ladder, and hard-fails on UUID divergence or missing expected grade. `list-device.js` now runs this in Step 5a for cards/dry-run and marks proposals untrusted if the scrape target is unreconciled. Live mutation flow was not changed.

BM 1527 itself was rechecked read-only on April 26, 2026 and the immediate live mismatch was not reproduced. Requested UUID `9ef00207-1136-45f4-99c3-ade923986e43` reconciled cleanly to `8GB / 512GB / Silver / M1 8-core-8-core GPU`, with live ladder `Fair 405 / Good 458 / Excellent 569`. The dry-run now shows the scrape as reconciled and blocks only on economics, not identity uncertainty.
