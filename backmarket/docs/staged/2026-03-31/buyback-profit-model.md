# Buyback Profit Model — Spec (14 Mar 2026)

## Profit Formula Per Device

```
Gross Profit = Sale Price - Buy Price
Net Profit = Sale Price
             - Buy Price
             - BM Fee (Buy): 10% of Buy Price
             - BM Fee (Sell): 10% of Sale Price
             - Screen Cost (if cracked grade)
             - Other Parts (if applicable)
             - Labour: Total RR&D hours (Diag + Repair + Refurb) × £25/hr
             - Shipping: £15 per device
             - Tax: 16.6% marginal on (Sale Price - Buy Price)
```

## Buyback Grade Logic

| Grade | API Code | Screen Needed? | Typical Repair |
|-------|----------|---------------|----------------|
| Functional Cracked | FUNCTIONAL_CRACKED | YES | Screen replacement. Device works. |
| Non-Functional Used | NOT_FUNCTIONAL_USED | NO | Logic board repair. Screen intact. LOW parts cost = our edge. |
| Non-Functional Cracked | NOT_FUNCTIONAL_CRACKED | YES | Screen + logic board. Highest cost. |

## Strategic Edge
- NOT_FUNCTIONAL_USED is where the margin is: low parts cost (no screen)
- If techs are trained up + best diagnostic software = dominate this grade
- Goal: get daily buyback orders back to 20/day (currently <30/week)

## Data Sources
- **Buy Price**: BM Buyback API (`/ws/buyback/v1/listings`)
- **Sale Price**: BM Seller API (`/ws/listings`) — Fair grade
- **Screen Cost**: Monday Parts Board
- **Parts History**: Monday BM Board — need to link trade-in order ID to original grade
- **Labour**: Total RR&D (Diag + Repair + Refurb) × £25/hr — mirrored on BM board via `lookup_mksztbgq`
- **Shipping**: £15 flat per device
- **BM Fees**: 10% buy side + 10% sell side
- **Tax**: 16.6% marginal on gross profit (sale - buy)

## Build Steps
1. Add "Original Grade" column to Monday BM board, backfill from trade-in order IDs
2. Pull average parts cost per grade per device model from Monday
3. Build profit matrix: per model/chipset, per grade
4. Identify which listings are profitable and by how much
5. Use this to inform bidding strategy and buy box positioning
6. Set up crons for ongoing monitoring
