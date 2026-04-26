# SKU Normalisation Canary: Listing 5035146

Generated: 2026-04-26T13:52:11.902Z

Status: prepared, not executed. No portal mutation has been performed.

## Candidate

- Listing: 5035146
- Portal UUID: df49e4bd-9875-4cf6-838e-264d016f7f33
- Item: BM 1527 ( Precious Uhwache )
- Main item: 11440582288
- BM Devices item: 11440594268
- Product ID: 9ef00207-1136-45f4-99c3-ade923986e43
- Status/quantity: Offline / 0
- Current BM SKU: `MBP13.M1A2338.8GB.512GB.silver.Fair`
- Target canonical SKU: `MBP.A2338.M1.8GB.512GB.Silver.Fair`
- Title: MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 8GB RAM - SSD 512GB - Standard display - QWERTY - English
- Frontend URL: https://www.backmarket.co.uk/en-gb/p/macbook-pro-2020-13-inch-with-m1-8-core-and-8-core-gpu-8gb-ram-ssd-512gb-qwerty-english-uk/9ef00207-1136-45f4-99c3-ade923986e43?l=12

## Required Live Steps

1. Open Back Market active listings and filter by listing 5035146 or current SKU
2. Open listing detail drawer for listing 5035146
3. Verify title, product_id, status, quantity, current SKU, and frontend URL match this payload
4. Edit only #edit-sku from current_backmarket_sku to target_canonical_sku
5. Click Save only after explicit approval
6. Return to active listings, re-filter by target_canonical_sku or listing identifier, reopen detail
7. Verify SKU changed and product_id/title/status/quantity did not change

## Approval Text Required Before Save

```text
Approve one live Back Market SKU normalisation canary on listing 5035146 only. Current SKU: MBP13.M1A2338.8GB.512GB.silver.Fair. Target SKU: MBP.A2338.M1.8GB.512GB.Silver.Fair. Product ID: 9ef00207-1136-45f4-99c3-ade923986e43. Permission: edit only the SKU field and click Save, then verify by re-filtering/reopening.
```
