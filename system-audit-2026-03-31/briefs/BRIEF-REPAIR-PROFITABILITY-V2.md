# Brief: Repair Profitability Model v2

## Objective

Build a net profitability model for every product on the Products & Pricing board, cross-referenced with Shopify listings and Google Search Console data. Output a ranked pricing action list.

## Data Sources

### Monday Boards
- **Products & Pricing**: `2477699024` - products, prices, estimated repair minutes, linked parts
- **Parts**: `985177480` - part costs, linked to products
- **Main Board**: `349212843` - completed repairs with timestamps

### Shopify
- Use the Shopify Admin API (REST or GraphQL) with token from `/home/ricky/config/api-keys/.env` (`SHOPIFY_ACCESS_TOKEN`)
- Store: `icorrect.co.uk` / `icorrect-tech.myshopify.com`
- Pull all products with handles, URLs, prices, and published status

### Google Search Console
- Already extracted in `/home/ricky/builds/system-audit-2026-03-31/gsc-repair-profit-rankings.md`
- Parse the tables from that file for click/impression/position data per query and page

## Step 1: Calculate Actual Repair Times

1. Pull all completed repairs from the main board (`349212843`)
2. Filter to items with repair type = `Repair` or `Refurb` only (NOT `Diagnostic`, NOT `No Fault Found`, NOT `Board Level` unless it was a repair)
3. For each product on Products & Pricing, find linked completed repairs via the parts relationship
4. Calculate elapsed time from the repair start to completion. Use status change timestamps where possible
5. Use trimmed median (drop top 25% to strip queue/wait outliers)
6. Compare calculated times against these device defaults:
   - iPhone: 1 hour
   - iPad: 1.5 hours
   - MacBook: 2 hours
   - Watch: 2 hours
7. Report both the calculated time and the default, flag significant differences
8. For products with fewer than 3 completed repairs, use the device default

## Step 2: Net Profit Calculation

For every product (EXCLUDING diagnostics and aftermarket screens):

```
ex_vat_price = shopify_price / 1.2  (or Monday price / 1.2 if no Shopify listing)
parts_cost = sum of all linked part costs (some products use multiple parts)
labour_cost = actual_repair_time_hours * £24
screen_refurb = £24 extra for all iPhone screen products
payment_fee = ex_vat_price * 1.2 * 0.02  (2% of inc-VAT price)
net_profit = ex_vat_price - parts_cost - labour_cost - screen_refurb - payment_fee
net_margin = net_profit / ex_vat_price
```

## Step 3: Shopify Cross-Reference

1. Pull all Shopify products
2. Match each Monday product to its Shopify listing (by title/handle matching)
3. Flag Monday products that have NO Shopify listing (not being sold online)
4. Flag Shopify products where the Shopify price differs from Monday price
5. **Find new device models on the Monday Products & Pricing board that are missing from Shopify** (e.g. iPhone 16 Pro Max repairs, new MacBook models, etc.)

## Step 4: GSC Cross-Reference

1. Parse the GSC data from `gsc-repair-profit-rankings.md`
2. Match landing pages and queries to products where possible
3. For each product, attach: clicks, impressions, avg position, click trend

## Output

Write to `/home/ricky/builds/system-audit-2026-03-31/repair-profitability-v2.md`:

### Section 1: Methodology & Data Quality
- How many products analysed, data completeness notes

### Section 2: Repair Time Analysis
- Calculated vs default times per product
- Flag where calculated time is significantly higher/lower than default

### Section 3: Ranked Product Profitability (sorted by net margin descending)
Table columns: Device | Product | Price (inc VAT) | Ex-VAT | Parts Cost | Labour | Refurb | Fees | Net Profit | Net Margin % | Shopify Listed | GSC Clicks (90d) | GSC Position | Flag

Flags:
- `healthy`: net margin > 30%
- `thin`: net margin 10-30%
- `loss-maker`: net margin < 10%
- `overpriced`: margin > 50% with low volume (opportunity to reduce price for more orders)
- `no-shopify`: not listed on Shopify
- `price-mismatch`: Shopify price differs from Monday

### Section 4: Missing From Shopify
- New model devices on Monday but not on Shopify (these need listings created)

### Section 5: Pricing Action List
- Products to raise price (loss-makers with demand)
- Products to lower price (overpriced, could drive volume)
- Products to flag for review (thin margin, moderate demand)
- Products to consider dropping

### Section 6: GSC Opportunity Matrix
- High-traffic queries matched to products with margin data
- Where we rank well but margin is bad
- Where margin is great but we don't rank or have low traffic

## Credentials

Source all API keys from `/home/ricky/config/api-keys/.env`:
- `MONDAY_APP_TOKEN` for Monday API
- `SHOPIFY_ACCESS_TOKEN` for Shopify API (store: `icorrect-tech.myshopify.com`)

## Constraints

- Read-only. Do not mutate any Monday, Shopify, or external data.
- Exclude all Diagnostic products from the profitability output
- Exclude all Aftermarket Screen products from the profitability output
- VAT rate: 20% (standard UK rate)
- Labour rate: £24/hr
- iPhone screen refurb surcharge: £24 per repair
- Payment fee: 2% of inc-VAT price

When completely finished, run this command to notify:
openclaw system event --text "Done: Repair Profitability v2 complete - net margin model with Shopify and GSC crossref written to repair-profitability-v2.md" --mode now
