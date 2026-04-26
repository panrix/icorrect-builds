# Back Market Listing Alignment Report

Generated: 2026-04-26T13:26:35.128Z

## Sources

- Active listings CSV: `/Users/icorrect/VPS/builds/backmarket/data/backmarket-active-listings-2026-04-26.csv`
- Current queue: `/Users/icorrect/VPS/builds/backmarket/reports/current-queue-qc-sku-map-2026-04-26-024008.json`
- Frontend URL map: `/Users/icorrect/VPS/builds/backmarket/data/listing-frontend-url-map.json`

## Summary

- GB export records: 1013
- Trusted scraper-safe records: 189
- Quarantined/untrusted records: 824
- Current queue rows: 12

### Export Classifications

- sku_spec_mismatch: 513
- unparseable_or_nonstandard_sku: 311
- queue_item_maps_to_offline_or_zero_qty_listing: 7
- aligned_live_listing: 5
- aligned_offline_or_zero_qty: 177

### Current Queue Classifications

- queue_product_matches_but_sku_not_canonical: 3
- queue_return_relist_caution: 1
- queue_sku_spec_mismatch_in_export: 3
- queue_needs_browser_or_create_listing: 2
- queue_aligned_to_trusted_export_url: 3

## Current Queue Actions

| Priority | Classification | Item | Listing | Expected SKU | Reason |
| --- | --- | --- | --- | --- | --- |
| P0 | queue_product_matches_but_sku_not_canonical | BM 1555 ( Isaiah Ellis ) | 6569346 | `MBP.A2338.M2.8GB.256GB.Grey.Fair` | BM SKU "MBP.M2.A2338.8GB.256GB.Grey.Fair" should become "MBP.A2338.M2.8GB.256GB.Grey.Fair" on listing 6569346 |
| P0 | queue_product_matches_but_sku_not_canonical | BM 1592 ( roxy ROX ) | 6569346 | `MBP.A2338.M2.8GB.256GB.Grey.Fair` | BM SKU "MBP.M2.A2338.8GB.256GB.Grey.Fair" should become "MBP.A2338.M2.8GB.256GB.Grey.Fair" on listing 6569346 |
| P0 | queue_return_relist_caution | BM 1541 (Muhab Saed) *RTN > REFUND | 6024010 | `MBP.A2338.M1.16GB.512GB.Grey.Good` | Return/refund relist marker detected; verify original BM Devices linkage/reset before SOP 06 live listing |
| P1 | queue_product_matches_but_sku_not_canonical | BM 1527 ( Precious Uhwache ) | 5035146 | `MBP.A2338.M1.8GB.512GB.Silver.Fair` | BM SKU "MBP13.M1A2338.8GB.512GB.silver.Fair" should become "MBP.A2338.M1.8GB.512GB.Silver.Fair" on listing 5035146 |
| P1 | queue_sku_spec_mismatch_in_export | BM 1446 ( Joseph Bullmore ) |  | `MBA.A2337.M1.7C.8GB.128GB.Grey.Fair` | storage:128GB |
| P1 | queue_sku_spec_mismatch_in_export | BM 1536 ( Marni Mills ) |  | `MBA.A2681.M2.8C.16GB.256GB.Starlight.Fair` | ram:16GB |
| P1 | queue_sku_spec_mismatch_in_export | BM 1549 ( Lily Doherty ) | 5606597 | `MBA.A2337.M1.7C.8GB.256GB.Grey.Fair` | storage:Grey |
| P2 | queue_needs_browser_or_create_listing | BM Nicola Aaron **RICKY DIAGNOSTICS** |  | `` | No trusted active-listings export row matched listing/product/SKU |
| P2 | queue_needs_browser_or_create_listing | BM 1560 ( Caitlin Shaw ) |  | `MBA.A2681.M2.8C.16GB.256GB.Starlight.Good` | No trusted active-listings export row matched listing/product/SKU |
| P3 | queue_aligned_to_trusted_export_url | BM 1582 ( Geoffrey Glees ) | 6709047 | `MBP.A2338.M1.16GB.256GB.Grey.Fair` | Trusted by listing/SKU/product evidence |
| P3 | queue_aligned_to_trusted_export_url | BM 1564 ( Gemma Guarin ) | 5500817 | `MBP.A2338.M1.8GB.256GB.Grey.Fair` | Trusted by listing/SKU/product evidence |
| P3 | queue_aligned_to_trusted_export_url | BM 1524 ( Djibril Fotsing ) | 5500817 | `MBP.A2338.M1.8GB.256GB.Grey.Fair` | Trusted by listing/SKU/product evidence |

## Top Export Mismatches

| Priority | Listing | SKU | Status | Qty | Mismatches | Queue Items |
| --- | --- | --- | --- | ---: | --- | --- |
| P0 | 5476297 | `MBP.A2338.M1.8GB.256GB.Silver.Good` | Disabled | 1 | grade:Good |  |
| P0 | 5354764 | `MBA.A2179.2020.i5.8gb.512gb.Grey.Vgood` | Disabled | 1 | grade:Grey |  |
| P0 | 5294536 | `MBA.A1932.2019.8GB.128GB.Gold.fair` | Disabled | 1 | chip:2019; storage:128GB |  |
| P0 | 5293987 | `MBP14.A2442.1016.16GB.1TB.Silver.Good` | Disabled | 1 | chip:1016 |  |
| P0 | 5005045 | `MBP14.A2442.32GB.512GB.Grey.Fair` | Disabled | 1 | storage:Grey |  |
| P0 | 4925173 | `MBP13.A2338M2.16Ram.256gbSSD.Grey.Good` | Disabled | 1 | ram:16Ram; storage:256gbSSD |  |
| P0 | 4857985 | `MBA.A2337.8GB.256GB.Grey.Good` | Disabled | 1 | storage:Grey |  |
| P0 | 4852610 | `MBP13.A2338.8GB.512GB.Grey.Fair` | Disabled | 1 | storage:Grey |  |
| P0 | 4846564 | `MBP14.2442.16GB.512B.Silver.VGood` | Disabled | 1 | ram:512B; storage:Silver |  |
| P0 | 4452125 | `MBP14.2442.32GB.2TB.Good` | Disabled | 1 | storage:Good |  |
| P1 | 6816343 | `MBA.A2337.M1.7C.8GB.128GB.Grey.Fair` | Offline | 0 | storage:128GB | BM 1446 ( Joseph Bullmore ) (11299994046) |
| P1 | 6816341 | `MBA.A2681.M2.8C.16GB.256GB.Starlight.Fair` | Offline | 0 | ram:16GB | BM 1536 ( Marni Mills ) (11465304732) |
| P1 | 5561581 | `MBP.M1.A2338.8GB.256GB.Grey.VGood` | Offline | 0 | grade:VGood | BM 1555 ( Isaiah Ellis ) (11522195767) |
| P1 | 5442630 | `MBP.A2338.M1.8GB.256GB.Grey.VGood` | Offline | 0 | grade:VGood | BM 1555 ( Isaiah Ellis ) (11522195767) |
| P1 | 4858009 | `MBP13.A2338.8GB.256GB.Grey.Excellent` | Offline | 0 | storage:Grey | BM 1555 ( Isaiah Ellis ) (11522195767) |
| P1 | 4306738 | `MBPM1.A2338.256GB.Grey.Vgood` | Offline | 0 | ram:Grey; storage:Vgood | BM 1555 ( Isaiah Ellis ) (11522195767) |
| P1 | 3120479 | `MBPM1.13.256GB.Grey.Good` | Offline | 0 | ram:Grey; storage:Good | BM 1555 ( Isaiah Ellis ) (11522195767) |
| P1 | 2619491 | `S644mm.nike.Cellular.Fair` | Disabled | 1 | sku:parseable BM SKU |  |
| P1 | 2619386 | `S644mm.GPS.Fair` | Disabled | 1 | sku:parseable BM SKU |  |
| P1 | 2591942 | `APS444.Grey.Vgood` | Disabled | 1 | sku:parseable BM SKU |  |
| P3 | 6809161 | `MBA.A2681.M2.8C.8GB.256GB.Grey.Excellent` | Offline | 0 | grade:Excellent |  |
| P3 | 6736145 | `MBA.A2681.8C.10C.8GB.512GB.Grey.Vgood` | Offline | 0 | grade:Vgood |  |
| P3 | 6716978 | `MBA.A2179.8GB.512GB.Gold.Fair` | Offline | 0 | ram:512GB; storage:Gold |  |
| P3 | 6710208 | `MBP.A2991.M3PRO.36GB.1TB.Space Black.Excellent` | Disabled | 0 | ram:36GB; storage:1TB; grade:Excellent |  |
| P3 | 6710205 | `MBP.A2992.M3NO.18GB.512GB.Silver.Good` | Disabled | 0 | chip:M3NO |  |
| P3 | 6709337 | `MBP.A2251.I7.8GB.256GB.Grey.VERY_GOOD` | Offline | 0 | storage:256GB |  |
| P3 | 6709336 | `MBP.A2251.I5.16GB.256GB.Grey.VERY_GOOD` | Offline | 0 | storage:256GB |  |
| P3 | 6709335 | `MBA.A2179.I5.8GB.512GB.Grey.VERY_GOOD` | Offline | 0 | storage:512GB |  |
| P3 | 6709334 | `MBP.A2251.I5.16GB.1TB.Grey.VERY_GOOD` | Offline | 0 | storage:1TB |  |
| P3 | 6709333 | `MBA.A2179.I3.8GB.512GB.Grey.VERY_GOOD` | Offline | 0 | storage:512GB |  |
| P3 | 6709327 | `MBP.A2251.I5.8GB.1TB.Grey.VERY_GOOD` | Offline | 0 | storage:1TB |  |
| P3 | 6709326 | `MBA.A2179.I7.8GB.256GB.Grey.VERY_GOOD` | Offline | 0 | storage:256GB |  |
| P3 | 6709323 | `MBP.A2251.I7.32GB.2TB.Grey.VERY_GOOD` | Offline | 0 | storage:2TB |  |
| P3 | 6709321 | `MBP.A2251.I5.8GB.256GB.Silver.VERY_GOOD` | Offline | 0 | storage:256GB |  |
| P3 | 6709318 | `MBA.A2179.I5.8GB.512GB.Silver.VERY_GOOD` | Offline | 0 | storage:512GB |  |
| P3 | 6709309 | `MBA.A2179.I5.8GB.256GB.Gold.VERY_GOOD` | Offline | 0 | storage:256GB |  |
| P3 | 6709296 | `MBP.A2251.I7.16GB.512GB.Grey.VERY_GOOD` | Offline | 0 | storage:512GB |  |
| P3 | 6709295 | `MBA.A2179.I3.8GB.128GB.Silver.VERY_GOOD` | Offline | 0 | storage:128GB |  |
| P3 | 6709292 | `MBP.A2251.I5.16GB.512GB.Grey.VERY_GOOD` | Offline | 0 | storage:512GB |  |
| P3 | 6709286 | `MBP.A2251.I7.8GB.256GB.Grey.GOOD` | Offline | 0 | storage:256GB |  |
| P3 | 6709284 | `MBP.A2251.I5.16GB.1TB.Grey.GOOD` | Offline | 0 | storage:1TB |  |
| P3 | 6709283 | `MBA.A2179.I3.8GB.512GB.Grey.GOOD` | Offline | 0 | storage:512GB |  |
| P3 | 6709281 | `MBP.A2251.I5.8GB.1TB.Grey.GOOD` | Offline | 0 | storage:1TB |  |
| P3 | 6709280 | `MBA.A2179.I7.8GB.256GB.Grey.GOOD` | Offline | 0 | storage:256GB |  |
| P3 | 6709271 | `MBP.A2251.I5.16GB.512GB.Silver.GOOD` | Offline | 0 | storage:512GB |  |
| P3 | 6709268 | `MBP.A2251.I7.16GB.512GB.Grey.GOOD` | Offline | 0 | storage:512GB |  |
| P3 | 6709258 | `MBP.A2251.I7.8GB.256GB.Grey.FAIR` | Offline | 0 | storage:256GB |  |
| P3 | 6709257 | `MBP.A2251.I5.16GB.256GB.Grey.FAIR` | Offline | 0 | storage:256GB |  |
| P3 | 6709253 | `MBP.A2251.I5.8GB.512GB.Grey.FAIR` | Offline | 0 | storage:512GB |  |
| P3 | 6709250 | `MBP.A2251.I7.32GB.2TB.Grey.FAIR` | Offline | 0 | storage:2TB |  |

## Policy

- Only `captured_spec_match` and `captured_title_match` records are scraper-safe.
- `captured_spec_mismatch` and `capture_failed` records are evidence for SKU/listing repair, not scrape targets.
- Browser work is reserved for rows classified as queue blockers or requiring verification.

