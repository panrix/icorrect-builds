# Logistics And Supplier Blockers

Last updated: 2026-04-02

## Current Blockers

- `Observed`: the Monday parts board does not expose usable supplier identity in the live snapshot.
  - `Preferred Supplier`, `Order Supplier`, and `Supplier` relation are effectively blank across the pull.
  - This blocks clean supplier concentration, lead-time, and preferred-vendor analysis from Monday alone.
- `Observed`: operator confirmation says Xero is the best current supplier-data source, but not good enough to act as a strong live supplier-management system.

- `Unknown`: whether there is another operational source for:
  - shipment count by job
  - shipping label cost by job
  - who paid for return shipping

## Best Next Evidence

- identify any Royal Mail/browser-automation logs that attach shipment count or price back to item IDs
- identify whether a purchasing board, supplier CRM, or order log exists outside the current parts board and Xero
- quantify actual mail-in shipping margin after the flat `£20` customer charge
