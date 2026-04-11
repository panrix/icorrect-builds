---
status: unverified
last_verified: 2026-04-06
sources:
  - /home/ricky/builds/system-audit-2026-03-31/research/finance/financial-mapping.md
  - /home/ricky/builds/system-audit-2026-03-31/research/finance/xero-monday-reconciliation-gap.md
  - /home/ricky/builds/system-audit-2026-03-31/research/finance/xero-revenue-by-repair.md
related:
  - README.md
  - xero-structure.md
  - payment-truth.md
---

# Revenue Channels

This page summarises how revenue currently appears across Back Market, Shopify, walk-in, and corporate channels.

## Content

### Reading Notes

- The research uses two different lenses:
  - live Xero account and bank evidence
  - exact/strong Monday-linked invoice analysis from the 6-month reconciliation window
- Channel figures below should be treated as directional rather than fully closed revenue truth because Monday-to-Xero linkage is incomplete.

### Back Market

- Xero has a distinct `Backmarket` revenue account and `Backmarket - TradeIns` direct-cost account.
- Sampled authorised Xero bank transactions include `2` `BackMarket` receipts into `Starling Business Account#001`.
- April 2026 Xero P&L includes separate Back Market revenue.
- In the invoice-matching analysis, Back Market revenue did not show up as clean one-to-one `ACCREC` invoice revenue:
  - exact/strong Back Market invoice matches: `£0.00`
  - Monday Back Market rows with positive payment evidence in the same window: `£1,073.00`
- Current read: Back Market cash is visible in the ledger, but not mainly as clean customer invoice matches.

### Shopify

- Shopify has a dedicated revenue account in Xero.
- Shopify-origin jobs enter Monday with `Payment Method = Shopify` and `Payment Status = Confirmed`.
- Exact/strong invoice-matched Shopify revenue in the analysed window totals `£2,301.00`.
- Matched Shopify revenue by month from the research sample:

| Month | Revenue |
| --- | ---: |
| 2026-01 | £438.00 |
| 2026-02 | £597.00 |
| 2026-03 | £1,266.00 |

- Monday still shows a large Shopify-side linkage gap:
  - `103` Shopify rows with positive payment evidence had no strong Xero match
  - value on those rows: `£23,544.00`

### Walk-In

- Walk-in revenue appears in Xero both through in-person rails and through the `Walk-ins` revenue account.
- Exact/strong invoice-matched walk-in revenue in the analysed window totals `£8,370.14`.
- Matched walk-in revenue by month from the research sample:

| Month | Revenue |
| --- | ---: |
| 2025-10 | £762.00 |
| 2025-11 | £956.00 |
| 2025-12 | £1,408.00 |
| 2026-01 | £1,463.14 |
| 2026-02 | £2,026.00 |
| 2026-03 | £956.00 |
| 2026-04 | £799.00 |

- Walk-in payment capture is currently split between SumUp and cash.
- The unresolved walk-in surface is materially contaminated by Monday field quality:
  - `Cash` rows without strong Xero match: `55`, worth `£10,840.00`
  - `Not Taken` rows without strong Xero match: `176`, worth `£45,084.00`

### Corporate

- Corporate is the clearest invoiced revenue channel and the main source of residual ambiguity.
- Exact/strong invoice-matched corporate revenue in the analysed window totals `£32,211.27`.
- Matched corporate revenue by month from the research sample:

| Month | Revenue |
| --- | ---: |
| 2025-10 | £10,525.00 |
| 2025-11 | £6,442.50 |
| 2025-12 | £3,146.77 |
| 2026-01 | £4,269.00 |
| 2026-02 | £4,250.00 |
| 2026-03 | £2,979.00 |
| 2026-04 | £599.00 |

- A large share of unresolved live Xero invoice value looks like batched or multi-device corporate billing:
  - likely batched corporate or multi-job unresolved live value: `£25,343.85`
- This makes corporate the channel where linkage design matters most.

### Channel-Level Readout

| Channel | Best current read | Main caveat |
| --- | --- | --- |
| Back Market | Visible in Xero revenue and bank receipts | Not showing up as clean one-to-one sales invoices |
| Shopify | Operationally strongest capture path | Large Monday-to-Xero linkage gap remains |
| Walk-in | Live revenue across cash and SumUp-supported flows | Monday payment-method contamination is high |
| Corporate | Largest exact/strong invoice-matched channel in the sample | Batched invoicing creates major ambiguity |

## Open Questions

- Should Back Market revenue be documented as platform-settlement revenue rather than invoice revenue?
- What is the canonical rule for separating walk-in `Cash`, `SumUp`, and `Not Taken` states in reporting?
- How should batched corporate invoices be allocated back to individual Monday jobs for channel reporting?
