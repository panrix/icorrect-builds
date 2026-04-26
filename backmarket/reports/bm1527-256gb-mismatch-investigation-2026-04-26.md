# BM 1527 256GB Mismatch Investigation

Date: 2026-04-26
Mode: read-only investigation only
Target: `BM 1527 / Precious Uhwache / Main 11440582288 / BM Devices 11440594268`

## Conclusion

Confirmed issue, but not at the identity-mapping layer.

- BM 1527 is correctly identified as `MBP.A2338.M1.8GB.512GB.Silver.Fair`.
- The resolver slot, BM catalog entry, numeric product, and existing BM listing slot all point to the `512GB Silver` product.
- The mismatch happens in the live market-price scrape/selection layer used by `scripts/list-device.js`.
- Specifically, the live scraper accepts `Fair` and `Good` grade prices from grade picker entries whose own `productId` points to a different BM product: `8948b82c-f746-4be0-a8b0-0758b1dc4acc`, which is `8GB / 256GB / Space Gray`.
- Because BM 1527 is a `Fair` device, the proposed price on the card (`£405`) is contaminated by that wrong product/variant.

Net: BM 1527 was not matched to the wrong BM product for identity/listing, but it was priced using a mixed-variant market ladder. The card is therefore invalid for commercial use.

## Layer-By-Layer Findings

### 1. Monday spec read and SKU generation: correct `512GB`

Evidence:

- [reports/current-queue-qc-sku-map-2026-04-26-024008.json](/home/ricky/builds/backmarket/reports/current-queue-qc-sku-map-2026-04-26-024008.json:175) shows:
  - `main_item_id: 11440582288`
  - `sku_current: MBP.A2338.M1.8GB.512GB.Silver.Fair`
  - `sku_expected: MBP.A2338.M1.8GB.512GB.Silver.Fair`
- [reports/sop06-card-BM-1527-2026-04-26.md](/home/ricky/builds/backmarket/reports/sop06-card-BM-1527-2026-04-26.md:17) records the same `512GB` identity.

Assessment:

- No evidence of a Monday field read error.
- No evidence of a SKU construction error.

### 2. Registry mapping: correct `512GB`

Evidence:

- [reports/sop06-card-BM-1527-2026-04-26.md](/home/ricky/builds/backmarket/reports/sop06-card-BM-1527-2026-04-26.md:30) records:
  - slot `5035146`
  - `product_id 9ef00207-1136-45f4-99c3-ade923986e43`
  - numeric BM product `545417`
- Read-only resolver lookup returned:
  - `listing_id: 5035146`
  - `product_id: 9ef00207-1136-45f4-99c3-ade923986e43`
  - `ssd: 512GB`
  - `colour: Silver`
  - `trust_class: registry_verified`
- [data/vetted-listings.csv](/home/ricky/builds/backmarket/data/vetted-listings.csv:201) shows listing `5035146` as `MBP13.M1A2338.8GB.512GB.silver.Fair`.

Assessment:

- No evidence of registry slot mismatch.
- Slot `5035146` is a `512GB Silver Fair` slot.

### 3. BM catalog / product lookup / order-history maps: correct `512GB`

Evidence:

- [data/bm-catalog.json](/home/ricky/builds/backmarket/data/bm-catalog.json:5007) maps `9ef00207-1136-45f4-99c3-ade923986e43` to:
  - `SSD 512GB`
  - `colour Silver`
  - `backmarket_id 545417`
- [data/product-id-lookup.json](/home/ricky/builds/backmarket/data/product-id-lookup.json:457) maps the same UUID to listing IDs `6434923` and `5035146`.
- [data/order-history-product-ids.json](/home/ricky/builds/backmarket/data/order-history-product-ids.json:1634) maps numeric product `545417` to:
  - title with `SSD 512GB`
  - `skus_seen` including `MBP13.M1A2338.8GB.512GB.silver.Fair`

Assessment:

- No evidence of BM catalog contamination for BM 1527.
- No evidence that numeric product `545417` is really a `256GB` product.

### 4. Scraper URL/query: correct target product, wrong downstream price selection

Read-only live scrape run on 2026-04-26:

```bash
timeout 90s node scripts/list-device.js --dry-run --item 11440582288 --skip-history --card-json
```

Returned:

- `productId: 9ef00207-1136-45f4-99c3-ade923986e43`
- market ladder `Fair £405 / Good £458 / Excellent £569`

That target UUID is the correct `512GB Silver` product.

I then ran read-only scraper probes directly against the BM product pages:

- `9ef00207-1136-45f4-99c3-ade923986e43` = intended `512GB Silver`
- `0dfd2e16-45be-4594-afaa-ee5a19662985` = `256GB Silver` sibling

Critical live evidence from the `512GB` page:

- `ssdPicker["512 GB"] -> productId 9ef00207-1136-45f4-99c3-ade923986e43`
- `ssdPicker["256 GB"] -> productId 0dfd2e16-45be-4594-afaa-ee5a19662985`
- but grade pickers on that same page resolved as:
  - `Fair £405 -> productId 8948b82c-f746-4be0-a8b0-0758b1dc4acc`
  - `Good £458 -> productId 8948b82c-f746-4be0-a8b0-0758b1dc4acc`
  - `Excellent £569 -> productId 9ef00207-1136-45f4-99c3-ade923986e43`

`8948b82c-f746-4be0-a8b0-0758b1dc4acc` is not the BM 1527 product. It is:

- [data/bm-catalog.json](/home/ricky/builds/backmarket/data/bm-catalog.json:4163)
  - `MacBook Pro 13-inch (2020)`
  - `8GB RAM`
  - `SSD 256GB`
  - `colour Space Gray`
  - `backmarket_id 545418`
- [data/vetted-listings.csv](/home/ricky/builds/backmarket/data/vetted-listings.csv:135) includes Fair listing `5500817` for that `256GB Space Gray` product.

Assessment:

- The scraper does open the correct `512GB` product page.
- The live page itself exposes grade picker entries whose `productId` points at a sibling `256GB Space Gray` product.
- The code then accepts those grade prices without checking that the grade picker `productId` still matches the selected target product/variant.

### 5. Exact code path causing the mismatch

In [scripts/lib/v7-scraper.js](/home/ricky/builds/backmarket/scripts/lib/v7-scraper.js:70):

- `extractNuxtDataCategories()` reads `productId` for each picker entry.
- For `ram`, `ssd`, `colour`, and `cpu_gpu`, it keeps structured entries with `price`, `available`, and `productId`.
- For `grade`, it discards that context and stores only `categorised.gradePrices[label] = entry.price`.

Relevant line:

- [scripts/lib/v7-scraper.js](/home/ricky/builds/backmarket/scripts/lib/v7-scraper.js:93)

In [scripts/list-device.js](/home/ricky/builds/backmarket/scripts/list-device.js:1450):

- the live scrape result replaces `marketResult.gradePrices` wholesale
- then `getCatalogGradePrice()` uses the current device grade directly from that unfiltered ladder
- for BM 1527, which is `FAIR`, that means the card uses `Fair £405`

Relevant lines:

- live scrape overwrite: [scripts/list-device.js](/home/ricky/builds/backmarket/scripts/list-device.js:1450)
- price selection: [scripts/list-device.js](/home/ricky/builds/backmarket/scripts/list-device.js:1465)

Assessment:

- Exact failing layer: live market-price selection in the scraper/list-device path.
- Root cause: grade prices are not filtered by matching `productId` or consistent variant parameters before being trusted.

### 6. Report generation: downstream consumer, not source

`scripts/listing-bot.js` gets card data by running:

- `node scripts/list-device.js --dry-run --item <id> --card-json`

and then prints whatever `d.market.gradePrices` came back.

Evidence:

- [scripts/listing-bot.js](/home/ricky/builds/backmarket/scripts/listing-bot.js:79)
- [scripts/listing-bot.js](/home/ricky/builds/backmarket/scripts/listing-bot.js:123)

Assessment:

- The report/card generator is not inventing the wrong market ladder.
- It is faithfully reproducing the contaminated ladder emitted by `list-device.js`.

## Dry-Run / Card Evidence Notes

There are two read-only price captures on 2026-04-26:

- [reports/listing-dry-runs-2026-04-26/11440582288.out](/home/ricky/builds/backmarket/reports/listing-dry-runs-2026-04-26/11440582288.out:4) shows `Fair 410 / Good 482 / Excellent 569`
- [reports/sop06-card-BM-1527-2026-04-26.md](/home/ricky/builds/backmarket/reports/sop06-card-BM-1527-2026-04-26.md:149) shows `Fair 405 / Good 458 / Excellent 569`
- a fresh read-only rerun on 2026-04-26 reproduced the card values: `Fair 405 / Good 458 / Excellent 569`

Assessment:

- Market values moved between read-only runs, or the card was built from a later rerun than the saved `.out`.
- That drift is not the root cause.
- In both cases the structural issue remains: the live ladder is not variant-safe.

## Root-Cause Statement

Root cause is confirmed at the live market-price selection layer.

- `BM 1527` is correctly resolved as `512GB Silver Fair`.
- `scripts/list-device.js` then requests a live scrape for the correct `512GB` UUID.
- `scripts/lib/v7-scraper.js` extracts grade prices from BM page pickers but drops the picker `productId` context for grades.
- On the live BM page, the `Fair` and `Good` picker entries currently point to `8948b82c-f746-4be0-a8b0-0758b1dc4acc`, a `256GB Space Gray` sibling product.
- Because BM 1527 is a `Fair` device, the proposed price on the card is taken from that wrong product branch.

This is a mixed-variant scrape contamination bug, not a Monday/spec/registry/catalog identity bug.

## Card Validity

BM 1527 card validity: invalid for pricing/approval use.

Why:

- Identity section is correct.
- Listing slot/product mapping section is correct.
- Market ladder and proposed/min/net calculations are not trustworthy because the Fair price used for pricing is coming from the wrong BM product branch.

## Safest Next Action

- Do not use the BM 1527 card for approval or listing.
- Regenerate pricing only after the scraper is made variant-safe for grade selection, or after a manual/read-only market verification method is used that proves the `512GB Silver Fair` price directly.
- Treat this as a scraper/reporting defect in `scripts/lib/v7-scraper.js` + `scripts/list-device.js`, with report generation inheriting the bad data.

## Minimal Patch Proposal (not applied)

Not applied in this investigation.

Minimal safe change:

- Preserve `productId` for grade pickers in `extractNuxtDataCategories()`.
- In `list-device.js`, only trust live grade prices whose grade picker `productId` matches the resolved target product, or whose picker parameter set matches the selected SSD/RAM/colour combination.
- If the live grade ladder is mixed across multiple product IDs, reject it and fall back to catalog/historical data instead of pricing from it.

## Jarvis Paste-Ready Summary

- Confirmed issue: yes, but only in market-price selection. BM 1527 is correctly identified as a `512GB` device; the pricing ladder is contaminated.
- Affected layer: `scripts/lib/v7-scraper.js` / `scripts/list-device.js` live market scrape selection, with `scripts/listing-bot.js` and the SOP card inheriting the bad output.
- Why it happened: the live BM page for the correct `512GB` product currently exposes `Fair` and `Good` grade pickers whose own `productId` points to `8948b82c-f746-4be0-a8b0-0758b1dc4acc` (`8GB / 256GB / Space Gray`). The scraper drops grade-picker `productId` context and trusts those prices anyway.
- Whether BM 1527 card is invalid: yes. Identity/slot mapping are fine, but the `Fair £405` used for proposed pricing is not proven to be the `512GB Silver Fair` price.
- Safest next action: do not approve/list from this card; fix or bypass the live grade-picker selection logic first, then regenerate the card from a variant-safe read-only market check.
