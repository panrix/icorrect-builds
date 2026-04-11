# Stripe

## Access

- `Observed`: live Stripe API access works when sourced from `/home/ricky/config/.env`.
- Safe read-only probes completed:
  - `GET /v1/account`
  - `GET /v1/payment_intents?limit=3`

Evidence exports:
- `/home/ricky/data/exports/system-audit-2026-03-31/stripe/account.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/stripe/payment_intents_sample.json`

## Observed Inventory

- Account ID: `acct_1P8Ks7S1IqGUbO9S`
- Country: `GB`
- Default currency: `gbp`
- Account type: `standard`
- `charges_enabled=true`
- `payouts_enabled=true`
- `details_submitted=true`

Sample live payment-intent evidence:
- all `3` sampled payment intents were `succeeded`
- all `3` carried invoice-style metadata including:
  - `Invoice number`
  - `EmailAddress`
  - `OrgCode`
  - `OrgName`

## Cross-System Role

- `Observed`: Stripe is a live payment rail, not a stale credential.
- `Observed`: local data-architecture docs describe Stripe as the source for:
  - online payments
  - invoice payments (`INV-xxxx`)
- `Observed`: finance docs place Stripe alongside SumUp, bank transfer, and cash as active business payment rails.
- `Observed`: live Xero contains dedicated Stripe-linked ledger structure:
  - revenue account `Stripe`
  - bank accounts `Stripe GBP` and `Stripe GBP 1`
  - fee accounts `Payment Fees - Stripe` and `Stripe Fees`
- `Observed`: current `2025+` authorised Xero bank-transaction sample includes `7` `RECEIVE` rows with `Stripe` as contact, and live Xero bank accounts `Stripe GBP` / `Stripe GBP 1` use Stripe-style account identifiers.
- `Observed`: the active n8n workflow export set contains no `Stripe` references.
- `Observed`: a stricter non-doc source-code sweep found Stripe only in KPI/reporting code, not in live payment-ingestion or reconciliation services.
- `Inferred`: Stripe currently sits closer to online/invoice payment collection than to walk-in card-present payments, which are separately attributed to SumUp in local finance/docs.

## Operational Notes

- `Observed`: the sampled payment intents look invoice-linked rather than generic storefront telemetry because the metadata includes explicit invoice numbers.
- `User-confirmed` on `2026-04-01`: Shopify checkout is running through the Shopify payment-gateway path that includes Stripe-backed processing.
- `Unknown`: the exact API-visible ownership shape is still unresolved because the current Shopify token cannot reliably expose payment-gateway configuration directly.
- `Inferred`: Stripe appears to have a more direct Xero-ledger presence than SumUp because it is represented as dedicated bank accounts inside Xero as well as receive-side bank activity.
- `Unknown`: the exact runtime owner for Stripe reconciliation into Monday/Xero is still partly documentary rather than live-verified.

## Risks

- Payment ownership is split across Stripe, SumUp, Shopify order capture, and Xero invoicing.
- Without a clearly documented canonical reconciliation owner, payment state can diverge between Monday, Xero, and the payment rails.

## Open Threads

- convert the user-confirmed Shopify Payments / Stripe-backed checkout path into API-observed evidence if another token or admin surface becomes available
- confirm whether Stripe -> Monday/Xero reconciliation should be restored from the archived Python script or rebuilt elsewhere, because no current live runtime owner has been found
- determine whether the KPI/reporting-only code footprint means Stripe settlement handling is now effectively Xero/bank-ledger plus manual cleanup rather than automation-owned
