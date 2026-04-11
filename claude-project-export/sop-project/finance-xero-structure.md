---
status: unverified
last_verified: 2026-04-06
sources:
  - /home/ricky/builds/system-audit-2026-03-31/research/finance/financial-mapping.md
  - /home/ricky/builds/system-audit-2026-03-31/research/finance/payment-truth-target-state.md
related:
  - README.md
  - payment-truth.md
  - revenue-channels.md
  - ../monday/main-board.md
---

# Xero Structure

This page captures the current Xero ledger structure and the payment flows that connect Xero to Monday and the payment rails.

## Content

### Core Accounting Model

- Live Xero tenant: `Panrix Ltd`
- `SalesTaxBasis = CASH`
- `SalesTaxPeriod = QUARTERLY`
- Base currency: `GBP`
- Current research position: Xero is live and actively used, but it is not yet the uncontested real-time truth for payment closure across the business.

### Confirmed Xero Structure

- The sampled chart of accounts contains `135` accounts.
- Confirmed bank and finance accounts include:
  - `Cash Account`
  - `Starling Business Account`
  - `Starling Business Account#001`
  - `Stripe GBP`
  - `Stripe GBP 1`
  - `Pleo account`
- Confirmed channel-specific revenue accounts include:
  - `SumUp`
  - `Stripe`
  - `Shopify`
  - `Backmarket`
- Confirmed channel-specific cost and fee accounts include:
  - `Backmarket - TradeIns`
  - `Payment Fees - SumUp`
  - `Payment Fees - Stripe`
  - `Stripe Fees`
- Current balance-sheet evidence includes `Accounts Receivable`, cash balances, bank balances, and Stripe balances.

### Payment Flow by Channel

#### Shopify / Online Store

- Shopify is the ecommerce order surface and the least ambiguous capture path.
- Shopify-origin jobs enter Monday with `payment_status = Confirmed` and `payment_method = Shopify`.
- Xero already has separate `Shopify` revenue and `Stripe` ledger surfaces, which suggests Shopify cash is accounted for downstream in Xero rather than Xero being the point of operational capture.

#### Walk-In / In-Store

- Walk-in card capture is currently associated with SumUp.
- Cash is also a live in-person rail and is consistent with the presence of `Cash Account` in Xero.
- Xero contains `SumUp` revenue and `Payment Fees - SumUp`, but no dedicated SumUp bank account was observed.
- Sampled authorised Xero bank transactions show SumUp receipts landing in `Starling Business Account#001`.

#### Mail-In / Remote Repair

- Mail-in payment flow is split.
- Some jobs are prepaid through Shopify and arrive in Monday already marked as paid.
- Other jobs use Xero invoicing later, with Monday set to `Payment Method = Invoiced - Xero` and `Payment Status = Pending`.
- Draft invoice creation is live; send-invoice and payment-received write-back are not proven live.

#### Corporate / B2B

- Corporate work has the clearest receivables exposure.
- Xero shows live receivables and outstanding `Accounts Receivable`.
- Monday can trigger draft invoice creation, but collection and payment write-back into Monday remain weak.

#### Back Market

- Xero has a separate `Backmarket` revenue account and `Backmarket - TradeIns` direct-cost account.
- Sampled authorised bank transactions include `BackMarket` receipts landing in `Starling Business Account#001`.
- The exact ingestion path from Back Market operations into Xero is still unproven.

### Monday to Xero Invoice Flow

- The confirmed live automation is `Xero Invoice Creator`.
- Monday trigger surface: `Invoice Action` changed to `Create Invoice`.
- The workflow refreshes the Xero token, reads Monday item data, validates invoiceability, searches or creates a Xero contact, creates a draft invoice, and writes Xero invoice details back to Monday.
- Live Monday finance labels referenced in the research include:
  - `Payment Status`
  - `Payment Method`
  - `Invoice Status`
  - `Xero Invoice ID`
  - `Xero Invoice URL`
- The invoicing path is live only for draft creation. The back-half flow from sent invoice to paid and reconciled state is not yet proven.

### Structural Risks

- Payment-received write-back from Xero into Monday has not been live-verified.
- Archived reconciliation logic is reference material only and should not be treated as the current runtime.
- Embedded auth material and refresh-token state inside workflow exports are still part of the control-plane debt.
- SumUp and Back Market both appear clearly in ledger evidence, but their exact runtime ownership into Xero is still unclear.

## Open Questions

- What is the canonical live owner for Stripe, SumUp, and Back Market reconciliation into Xero?
- Should SumUp remain a Starling-reconciled flow or get its own explicit ledger/bank-treatment documentation?
- Which workflow or service should own the back-half state change from Xero payment receipt to Monday closure?
