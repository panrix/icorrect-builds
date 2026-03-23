# QA: buyback-profitability-builder.js — Field Mapping Broken

## What happened
Ran the builder with --compare. Pipeline works end-to-end:
- ✅ Pulled 1,445 completed order lines from BM API
- ✅ Matched 101/496 listing IDs to Monday items (20% match rate)
- ✅ Fetched Main Board cost data for 99/99 items
- ❌ All 601 matched lines grouped as "unknown | UNKNOWN"
- ❌ Parts cost showing £0 for all despite having Main Board data

## Issue 1: Model+Grade not extracted
Every entry lands in "unknown | UNKNOWN". The BM orders API (`/ws/orders?state=9`) returns order lines with listing_id and price, but NOT model or grade.

**Fix:** After matching listing_id → BM Devices Board item, read the model from the BM Devices item. The device name/title column has the model info. Or use the SKU column if populated. The grade can come from `status24` or from the listing's aesthetic grade field.

## Issue 2: Parts cost = £0 for everything
Main Board `formula_mkx1bjqr` (parts cost) data was fetched for 99 items but all show £0.

**Fix:** Check how formula column values are being parsed. Monday formula columns return values as strings in `{ "text": "95.50" }` format, not as numbers. Also verify the column ID is correct — run a test query for one known item:
```
{ items(ids: [<any Main Board item with parts>]) { column_values(ids: ["formula_mkx1bjqr"]) { text value } } }
```
Same applies to `formula__1` (labour hours).

## Issue 3: Match rate low (20%)
101/496 listing IDs matched. Expected ~40%. Check:
- Is `text_mkyd4bx3` on BM Devices Board the right column for listing ID?
- Are listing IDs stored with or without prefix? (e.g. "12345" vs "L-12345")
- Try matching a known listing ID manually to verify the lookup works

## To reproduce
```bash
cd /home/ricky/builds/bm-scripts
NODE_PATH=node_modules node buyback-profitability-builder.js --compare
```

## Output location
`/home/ricky/builds/data/buyback-profitability-lookup.json`
