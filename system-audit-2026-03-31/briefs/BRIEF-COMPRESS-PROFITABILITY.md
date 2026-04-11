# Brief: Compress Profitability Model

## Objective

Read `repair-profitability-v2.md` (2,491 lines) and produce a compressed version at `repair-profitability-v2-compact.md`.

## Rules

1. **Section 1 (Methodology)**: Keep as-is, it's already short.

2. **Section 2 (Repair Time Analysis)**: Remove entirely. Replace with a 1-line note saying full repair time data is in the main file.

3. **Section 3 (Ranked Product Profitability)**: This is the big one. Compress as follows:
   - Group products by device family (iPhone, iPad, MacBook, Apple Watch, Other)
   - Within each family, sort by net margin descending
   - Keep the same table columns but remove any product where: net profit is "n/a" AND no GSC clicks AND not flagged as loss-maker
   - Keep ALL products that have any GSC clicks (from the GSC columns in the table)
   - Keep ALL loss-makers (negative margin)
   - Keep ALL products flagged as price-mismatch
   - For products with zero clicks and healthy margins that aren't notable, just include a summary count per device family like "Plus 45 more iPhone products with healthy margins and no search demand"

4. **Section 4 (Missing From Shopify)**: Compress by removing old/legacy devices nobody searches for. Keep:
   - Any device model from iPhone 11 onwards
   - Any device model from iPad Air 3 onwards, iPad Pro 11 (1G) onwards, iPad Mini 5 onwards
   - Any MacBook from 2017 onwards
   - Any Apple Watch S4 onwards
   - Group the rest as "Plus X older device models"

5. **Section 5 (Pricing Action List)**: Keep as-is.

6. **Section 6 (GSC Opportunity Matrix)**: Keep as-is.

Also merge in the GSC crossref data from `gsc-profitability-crossref-v2.md`:
- For Section 3 products, add the GSC clicks and position data from the crossref if it has better data than what's already in the table
- Add a new **Section 7: Top Search Demand Products** that lists the top 50 products by GSC clicks with their margin data (from the crossref Section 2)

## Input Files
- `/home/ricky/builds/system-audit-2026-03-31/repair-profitability-v2.md`
- `/home/ricky/builds/system-audit-2026-03-31/gsc-profitability-crossref-v2.md`

## Output
- `/home/ricky/builds/system-audit-2026-03-31/repair-profitability-v2-compact.md`

Target: under 500 lines. Must be readable on Telegram (no wide tables; if a table is too wide, split into multiple narrower tables or use bullet format).

When completely finished, run:
openclaw system event --text "Done: Compact profitability model written to repair-profitability-v2-compact.md" --mode now
