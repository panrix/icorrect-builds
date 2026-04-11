---
status: unverified
last_verified: 2026-04-06
sources:
  - /home/ricky/builds/system-audit-2026-03-31/research/finance/financial-mapping.md
  - /home/ricky/builds/system-audit-2026-03-31/research/finance/payment-truth-target-state.md
  - /home/ricky/builds/system-audit-2026-03-31/research/finance/xero-monday-reconciliation-gap.md
  - /home/ricky/builds/system-audit-2026-03-31/research/finance/xero-revenue-by-repair.md
related:
  - xero-structure.md
  - payment-truth.md
  - revenue-channels.md
  - ../index.md
---

# Finance

Initial finance knowledge pages for the Xero, Monday, and payment-reconciliation stack.

## Content

### Pages

| Page | Focus |
| --- | --- |
| [xero-structure.md](xero-structure.md) | Xero ledger shape, chart-of-accounts signals, and channel payment flows |
| [payment-truth.md](payment-truth.md) | Current reconciliation gap and target-state payment model |
| [revenue-channels.md](revenue-channels.md) | Revenue readout by Back Market, Shopify, walk-in, and corporate channels |

### Current Readout

- Xero is the live accounting ledger for `Panrix Ltd` and is configured on cash accounting in `GBP`.
- Monday is the live operational workflow surface, but its finance fields are not reliable enough to act as payment truth on their own.
- The finance problem is not missing payment rails. The main gap is ownerless reconciliation between capture events, Xero ledger state, and Monday operational state.
- Corporate and batched invoicing are the largest sources of ambiguity in the current Xero-to-Monday matching work.

## Open Questions

- Which person or team owns payment write-back into Monday?
- What is the canonical live runtime for Stripe, SumUp, and Back Market reconciliation into Xero?
- Should channel-level reporting be standardised around Xero account codes, Monday channel tags, or a separate reporting model?
