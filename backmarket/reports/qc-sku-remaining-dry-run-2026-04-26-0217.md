# QC SKU Remaining Dry Run - 2026-04-26 02:17 UTC

Scope: dry-run only for the 9 remaining `QC_SKU_MISSING` rows after BM 1446 canary. No writes attempted.

## Results

- BM 1536 / Marni Mills / Main `11465304732` / BM Devices `11465339179`
  - Expected SKU: `MBA.A2681.M2.8C.16GB.256GB.Starlight.Fair`
- BM 1582 / Geoffrey Glees / Main `11658468933` / BM Devices `11658463428`
  - Expected SKU: `MBP.A2338.M1.16GB.256GB.Grey.Fair`
- BM 1549 / Lily Doherty / Main `11507101485` / BM Devices `11507109525`
  - Expected SKU: `MBA.A2337.M1.7C.8GB.256GB.Grey.Fair`
- BM 1564 / Gemma Guarin / Main `11553196759` / BM Devices `11553102917`
  - Expected SKU: `MBP.A2338.M1.8GB.256GB.Grey.Fair`
- BM 1527 / Precious Uhwache / Main `11440582288` / BM Devices `11440594268`
  - Expected SKU: `MBP.A2338.M1.8GB.512GB.Silver.Fair`
- BM 1524 / Djibril Fotsing / Main `11430091106` / BM Devices `11430091746`
  - Expected SKU: `MBP.A2338.M1.8GB.256GB.Grey.Fair`
- BM 1592 / roxy ROX / Main `11717344920` / BM Devices `11717348363`
  - Expected SKU: `MBP.A2338.M2.8GB.256GB.Grey.Fair`
- BM 1541 / Muhab Saed / Main `11778286649` / BM Devices `11778297586`
  - Expected SKU: `MBP.A2338.M1.16GB.512GB.Grey.Good`
  - Note: item name contains `*RTN > REFUND`; treat as operational caution before listing even if SKU handoff is valid.
- BM 1560 / Caitlin Shaw / Main `11542997681` / BM Devices `11543000315`
  - Expected SKU: `MBA.A2681.M2.8C.16GB.256GB.Starlight.Good`

## Summary

All 9 remaining SKU candidates dry-run cleanly as `QC_SKU_MISSING` with calculable expected SKUs.

Recommended next step: if approved, run `qc-generate-sku.js --write` for these 9 Main item IDs, then rerun the queue map to verify they become `READY_FOR_LISTING_PROPOSAL` or `SKU_MATCH`.
