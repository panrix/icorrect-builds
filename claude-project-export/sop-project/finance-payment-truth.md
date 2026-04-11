---
status: unverified
last_verified: 2026-04-06
sources:
  - /home/ricky/builds/system-audit-2026-03-31/research/finance/financial-mapping.md
  - /home/ricky/builds/system-audit-2026-03-31/research/finance/payment-truth-target-state.md
  - /home/ricky/builds/system-audit-2026-03-31/research/finance/xero-monday-reconciliation-gap.md
  - /home/ricky/builds/system-audit-2026-03-31/research/finance/xero-revenue-by-repair.md
related:
  - README.md
  - xero-structure.md
  - revenue-channels.md
  - ../monday/main-board.md
---

# Payment Truth

This page captures the current reconciliation gap between Xero and Monday and the target-state design for operational payment truth.

## Content

### Current State

- Xero is the live accounting ledger.
- Monday is the live operational workflow system.
- Payment truth is currently broken and ownerless across Monday, Xero, Stripe, and SumUp.
- Shopify is the least ambiguous channel because payment capture happens before or at Monday ingress.
- Invoice creation from Monday into Xero is live, but payment-received write-back into Monday is not proven live.

### Current Reconciliation Gap

#### Xero-side unresolved value

- `75 / 295` Xero invoices in the analysed 6-month window were unresolved against Monday after matching.
- Unresolved invoice value: `£32,063.62`
- Unresolved live invoice value (`PAID` + `AUTHORISED`): `£31,061.62`
- Outstanding unresolved value still open in Xero: `£5,512.20`

#### Monday-side unresolved value

- `372 / 539` Monday rows with positive payment evidence had no strong Xero match.
- Total value on those rows: `£92,162.00`
- This is not all missing Xero invoicing. Most of it sits in `Not Taken`, `Shopify`, and `Cash`, which means the Monday number is contaminated by mixed payment rails and poor field hygiene.
- The cleaner Xero-shaped Monday miss is `21` rows already marked `Invoiced - Xero`, totalling `£9,317.00`.

#### Finance-field contamination on Monday

- `Invoice Status = Voided` on all `4,465` sampled main-board items.
- `Xero Invoice ID` populated on `0 / 4,465`.
- `Invoice Amount` populated on `0 / 4,465`.
- `Payments Reconciled` populated on `0 / 4,465`.
- The only practical positive-payment evidence in the research window was amount-bearing fields such as `Paid`, `Payment 1 Amt`, and `Payment 2 Amt`.

#### What the gap is not

- The gap does not primarily look like ghost Xero drafts.
- Only `4` unresolved Xero drafts were found, and only `£556.00` of that draft value was non-zero.
- The larger control failure is broken linkage, especially around corporate and batched invoice handling.

### Target-State Design

#### Core Model

- Separate `payment captured` from `payment reconciled`.
- Keep Monday as the operational payment surface, not the accounting ledger.
- Keep Xero as the ledger truth for invoice lifecycle, payment receipt, bank reconciliation, and reporting.

#### Recommended Monday Field Meanings

| Field | Role |
| --- | --- |
| `Payment Status` | Customer-facing operational state such as `Pending`, `Confirmed`, `Corporate - Pay Later` |
| `Payment Method` | Rail or payment path such as `Shopify`, `Cash`, `Invoiced - Xero` |
| `Invoice Status` | Xero invoice lifecycle such as `Draft`, `Sent`, `Paid`, `Overdue`, `Voided`, `Error` |
| `Payments Reconciled` | Back-office control state such as `Processing`, `Complete`, `Error` |
| `Payment 1/2 Date/Amt/Ref` | Evidence slots for captured payments |
| `Xero Invoice ID` / `Xero Invoice URL` | Link back to the ledger object |

#### Channel Rules

##### Shopify

- Capture event: Shopify order payment succeeds.
- Monday should show `Payment Method = Shopify` and `Payment Status = Confirmed`.
- Xero settlement later marks `Payments Reconciled = Complete`.

##### SumUp / Walk-In Card

- Capture event: successful SumUp payment.
- Monday should show confirmed payment operationally.
- Xero or bank matching later completes reconciliation.

##### Cash Walk-In

- Capture event: operator records cash received.
- Reconciliation completes later through Xero cash or bank handling.

##### Xero-Invoiced Consumer / Corporate

- Invoice creation sets `Payment Method = Invoiced - Xero` and `Payment Status = Pending`.
- Payment receipt sets `Invoice Status = Paid`, `Payment Status = Confirmed`, and `Payments Reconciled = Complete`.

#### Minimum Controls

- One canonical Xero refresh-token owner
- No embedded finance secrets in workflow exports
- One named owner for payment write-back into Monday
- One canonical per-channel mapping spec across capture, invoice, and reconciliation states

## Open Questions

- Who owns the live payment write-back runtime and ongoing exceptions?
- Which Monday finance fields should be reset or repaired before any new reconciliation automation is built?
- How should batched corporate invoices be represented so that one Xero invoice can cleanly map back to multiple Monday jobs?
