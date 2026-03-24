# QA Issues from Dry Run — Mar 22

## sent-orders.js
- Product name and price showing as "Unknown" / "£?" 
- The BM buyback API response field mapping needs checking
- The order data IS there (order IDs work, dedup works) but product/price fields aren't being extracted from the correct keys

## shipping.js
- Dry run found 100 shipped items — this is the ENTIRE historical backlog
- Needs a date filter: only process items shipped in the last 7 days (or since last run)
- Without the filter, every run would try to process/flag hundreds of old items
- Also timed out due to volume (100+ Monday API calls)

## trade-in-payout.js  
- ✅ Working correctly. 21 found, 1 blocked by pre-flight. No issues.

## General
- All 3 scripts: column IDs and status indices need spot-checking against actual Monday board
- All default to dry-run (good)
- All have SOP step checklists in headers (good)

## shipping.js — Additional requirement
- After label is bought successfully, set `status4` (Main Board) to "Return Booked" (index 19)
- Column: status4, board: 349212843
- This is in ADDITION to writing the tracking number
