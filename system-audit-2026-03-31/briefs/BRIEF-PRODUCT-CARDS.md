# Brief: Product Profitability Cards with Recent Volume

## Objective

Generate compressed product profitability cards for every device family, including recent repair volume (30d / 60d / 90d). Output as a single .md file optimised for reading on mobile Telegram.

## Data Sources

### Monday
- **Main board**: `349212843` - pull all completed repairs with dates to calculate 30d/60d/90d volumes per product
- **Products & Pricing board**: `2477699024` - product details
- **Parts board**: `985177480` - parts costs
- Credentials: `MONDAY_APP_TOKEN` from `/home/ricky/config/api-keys/.env`
- Date reference: use 2026-04-04 as "today"

### Existing Files (parse these, don't regenerate)
- `repair-profitability-v2.md` Section 3 - profitability data per product (price, costs, margin, profit)
- `repair-profitability-v2.md` Section 2 - repair time data per product
- `gsc-profitability-crossref-v2.md` Section 2 - GSC clicks/impressions/position per product

## Card Format

For each product, output exactly this format:

```
## {Product Name}
- **Price:** £X inc / £X ex
- **Margin:** X% · **Profit:** £X
- **Costs:** Parts £X · Labour £X · Refurb £X · Fees £X
- **Total costs:** £X · **Repair time:** Xh
- **Volume:** 30d: X · 60d: X · 90d: X
- **GSC:** X clicks · X impr · pos X · ↑X
```

If GSC data is zero/missing, omit the GSC line.
If refurb is £0, omit it from costs line.
Flag loss-makers with ⚠️ LOSS-MAKER after the product name.
Flag products not on Shopify with 🔴 NO SHOPIFY after the product name.

## Grouping

Group cards under H1 headers by device family:
- `# iPhone` (sorted by: iPhone 16 Pro Max first, descending by model, within each model sort by clicks descending then margin descending)
- `# iPad`
- `# MacBook`
- `# Apple Watch`
- `# Other`

Within each family, group by device model under H2:
```
# iPhone

---
### iPhone 16 Pro Max

## Screen
...

## Battery
...

---
### iPhone 16 Pro

## Screen
...
```

## Volume Calculation

For each product on Products & Pricing:
1. Find all completed repairs linked to that product (via parts relationship or direct product link on the main board)
2. A repair is "completed" if its status is in: `Ready To Collect`, `Repaired`, `Returned`, `Shipped`, `Collected`
3. Use `Date Repaired` or the status change date to determine when it was completed
4. Count repairs completed in: last 30 days, last 60 days, last 90 days (from 2026-04-04)

## Filtering

Only include products that meet ANY of these criteria:
- Has 1+ completed repairs in the last 90 days
- Has 1+ GSC clicks
- Is flagged as a loss-maker (negative margin)
- Is flagged as price-mismatch between Shopify and Monday

Skip products that have zero recent volume, zero GSC demand, and healthy/overpriced margins. At the end of each device family, add a summary line:
`*Plus X more products with no recent volume or search demand*`

## Output

Write to `/home/ricky/builds/system-audit-2026-03-31/product-cards.md`

## Constraints

- Read-only on Monday. Do not modify any data.
- Parse existing .md files for profitability/GSC data rather than recalculating.
- For repair volume, you DO need to pull fresh from Monday main board to get date-based counts.

When completely finished, run:
openclaw system event --text "Done: Product profitability cards with 30/60/90d volume written to product-cards.md" --mode now
