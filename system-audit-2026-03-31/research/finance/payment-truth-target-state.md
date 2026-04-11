# Payment Truth Target State

Last updated: 2026-04-02

## Purpose

This file turns the resolved finance answers into a concrete target-state design under cash accounting.

## Current Truth

- `Observed`: Xero is the live accounting ledger and uses cash accounting.
- `Observed`: Monday is the live operational workflow system.
- `Observed`: current payment truth is broken and ownerless.
- `Observed`: Shopify currently reconciles cleanly enough to be the least ambiguous channel.
- `Observed`: Stripe/Xero links and corporate invoice payment do not write back cleanly to Monday.

Primary evidence:
- `/home/ricky/builds/system-audit-2026-03-31/financial-mapping.md`
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/xero.md`
- `/home/ricky/builds/system-audit-2026-03-31/MASTER-QUESTIONS-FOR-JARVIS.md`

## What The Target State Must Do

### 1. Separate Capture From Reconciliation

Under cash accounting, these are not the same event:

- `Payment captured`
  - customer actually paid on a rail
- `Payment reconciled`
  - finance has matched that payment into Xero / bank truth

### 2. Keep Monday Operational, Not Accounting-Led

Monday should show operational payment visibility, but not replace the ledger.

### 3. Make Xero The Ledger Truth

Xero should remain the accounting truth for:
- invoice existence
- payment receipt
- bank reconciliation
- reporting

## Recommended Field-Level Model

### Monday Fields To Keep As Operational Truth

- `Payment Status` -> `payment_status`
- `Payment Method` -> `payment_method`
- `Invoice Status` -> `color_mm0pkek6`
- `Payments Reconciled` -> `color_mm0e2jz6`
- `Payment 1 Date/Amt/Ref`
- `Payment 2 Date/Amt/Ref`
- `Xero Invoice ID` -> `text_mm0a8fwb`
- `Xero Invoice URL` -> `link_mm0a43e0`

### Recommended Meaning

- `Payment Status`
  - customer-facing operational state
  - examples: `Pending`, `Confirmed`, `Corporate - Pay Later`

- `Invoice Status`
  - Xero invoice lifecycle
  - examples: `Draft`, `Sent`, `Paid`, `Overdue`, `Voided`, `Error`

- `Payments Reconciled`
  - back-office control state
  - examples: `Processing`, `Complete`, `Error`

## Channel Rules

### Shopify

- `Observed`: Shopify order is the capture event.
- Monday should write:
  - `Payment Method = Shopify`
  - `Payment Status = Confirmed`
- Xero settlement/reconciliation should later mark:
  - `Payments Reconciled = Complete`

### SumUp / Walk-In Card

- capture event = successful SumUp payment
- Monday should write `Confirmed`
- Xero/bank match later sets `Payments Reconciled = Complete`

### Cash Walk-In

- capture event = operator-recorded cash receipt
- Xero cash/bank handling later completes reconciliation

### Xero-Invoiced Consumer / Corporate

- invoice creation:
  - `Payment Method = Invoiced - Xero`
  - `Payment Status = Pending`
  - `Invoice Status = Draft` or `Sent`
- payment receipt:
  - `Invoice Status = Paid`
  - `Payment Status = Confirmed`
  - `Payments Reconciled = Complete`

## What Should Not Be Restored

- `Observed`: archive-only reconciliation logic should be treated as reference, not restored wholesale.
- `Observed`: the old payment-received draft writes wrong Monday labels and expects a `Monday ID:` reference pattern that does not exist in live Xero invoice samples.

## Minimum Controls

- one canonical Xero refresh-token owner
- no embedded finance secrets in workflow exports
- one named owner for payment write-back
- one canonical per-channel mapping spec

## Main Conclusion

- `Observed`: the main problem is not lack of payment rails.
- `Observed`: it is lack of a clean captured-versus-reconciled model with an owner.
- `Inferred`: the target state should keep Monday as the operational surface, Xero as the ledger truth, and explicit reconciliation state between them.
