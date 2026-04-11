# Supplier Source Of Truth

Last updated: 2026-04-02

## Purpose

This file turns the resolved supplier answers into a practical target-state requirement.

## Current Truth

- `Observed`: Xero is the best current supplier-data source.
- `Observed`: it is still not operationally sufficient.
- `Observed`: the Monday parts board has `1,802` items and many prices, but supplier identity is effectively blank across the live snapshot.
- `Observed`: operator confirmation says the active supplier set is segmented, not a single-primary-supplier model.

Primary evidence:
- `/home/ricky/builds/system-audit-2026-03-31/logistics-supplier-analysis.md`
- `/home/ricky/builds/system-audit-2026-03-31/MASTER-QUESTIONS-FOR-JARVIS.md`

## Current Failure Mode

- Xero can answer:
  - who was paid
  - roughly how much was spent
- Xero cannot answer cleanly:
  - which repair needed the part
  - which supplier was preferred versus actually used
  - lead time
  - wastage
  - part acceptance/rejection
  - stock-to-job linkage

## Minimum Target-State Fields

For each purchased part:
- supplier
- preferred supplier
- actual supplier
- purchase date
- supply cost
- linked repair item
- linked device model
- lead time
- received/accepted/rejected
- wastage / unused / returned

## Minimum System Behaviour

- every ordered part should link to one repair or stock purpose
- every consumed part should link back to one repair item
- supplier should never be blank on a real procurement record
- accepted versus rejected/wrong part should be logged explicitly

## Main Conclusion

- `Observed`: current supplier truth lives more in finance than operations.
- `Inferred`: until supplier identity and part-to-job linkage are rebuilt operationally, parts economics will remain visible in aggregate but weak in decision-making detail.
