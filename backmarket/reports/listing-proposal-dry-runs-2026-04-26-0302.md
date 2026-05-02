# Listing Proposal Dry Runs - 2026-04-26

Scope: SOP 06 dry-run only for ready, non-return-cautioned BMs. No live listings, no Back Market writes, no portal actions.

Excluded:
- BM Nicola Aaron: missing BM Devices relation.
- BM 1541: return/refund relist caution; do not live-list until original BM Devices linkage/reset verified.

## Summary

All 10 non-cautioned candidates were dry-run through SOP 06. None are ready for normal profitable live listing under current gates.

- 3 blocked on resolver/catalog gaps.
- 7 blocked on economics / clearance decision required.

## Resolver/catalog blocked

- BM 1446 / Joseph Bullmore / Main `11299994046`
  - SKU: `MBA.A2337.M1.7C.8GB.128GB.Grey.Fair`
  - Block: no catalog match for model/spec/colour.
- BM 1536 / Marni Mills / Main `11465304732`
  - SKU: `MBA.A2681.M2.8C.16GB.256GB.Starlight.Fair`
  - Block: no exact colour match for Starlight; 2 spec candidates require review.
- BM 1560 / Caitlin Shaw / Main `11542997681`
  - SKU: `MBA.A2681.M2.8C.16GB.256GB.Starlight.Good`
  - Block: no exact colour match for Starlight; 2 spec candidates require review.

## Economics / clearance decision required

- BM 1555 / Isaiah Ellis / Main `11522195767`
  - SKU: `MBP.A2338.M2.8GB.256GB.Grey.Fair`
  - Market Fair: £599; min: £582; break-even: £625
  - Net@min: `-£30.81`; margin `-5.29%`
  - Decision: BLOCK, loss at min price.
- BM 1582 / Geoffrey Glees / Main `11658468933`
  - SKU: `MBP.A2338.M1.16GB.256GB.Grey.Fair`
  - Market Fair: £502; min: £487; break-even: £468
  - Net@min: `£14.08`; margin `2.89%`
  - Decision: BLOCK, below £100 secondary minimum.
  - Flags: grade inversion and tight grade ladder.
- BM 1549 / Lily Doherty / Main `11507101485`
  - SKU: `MBA.A2337.M1.7C.8GB.256GB.Grey.Fair`
  - Market Fair: £335; min: £325; break-even: £456
  - Net@min: `-£95.62`; margin `-29.42%`
  - Decision: BLOCK, loss at min price.
- BM 1564 / Gemma Guarin / Main `11553196759`
  - SKU: `MBP.A2338.M1.8GB.256GB.Grey.Fair`
  - Market Fair: £410; min: £398; break-even: £609
  - Net@min: `-£154.31`; margin `-38.77%`
  - Decision: BLOCK, loss at min price.
- BM 1527 / Precious Uhwache / Main `11440582288`
  - SKU: `MBP.A2338.M1.8GB.512GB.Silver.Fair`
  - Market Fair: £410; min: £398; break-even: £569
  - Net@min: `-£124.68`; margin `-31.33%`
  - Decision: BLOCK, loss at min price.
- BM 1524 / Djibril Fotsing / Main `11430091106`
  - SKU: `MBP.A2338.M1.8GB.256GB.Grey.Fair`
  - Market Fair: £410; min: £398; break-even: £447
  - Net@min: `-£35.77`; margin `-8.99%`
  - Decision: BLOCK, loss at min price.
- BM 1592 / roxy ROX / Main `11717344920`
  - SKU: `MBP.A2338.M2.8GB.256GB.Grey.Fair`
  - Market Fair: £599; min: £582; break-even: £573
  - Net@min: `£7.13`; margin `1.23%`
  - Decision: BLOCK, below £100 secondary minimum.

## Interpretation

This validates Ricky's earlier correction: the task is not just “list if profitable”. These are largely clearance/cash-recovery decisions. Normal gates block most of the queue because historic purchase/parts/labour costs exceed current market prices.

## Next recommendation

Do not live-list any item yet.

Next step should be a clearance policy decision:

1. Which loss/low-margin items are approved for clearance via `--min-margin 0` or another explicit override?
2. Which resolver-blocked items need product-id probe/catalog repair first?
3. Which return-cautioned item (BM 1541) needs linkage/reset verification before proposal.
