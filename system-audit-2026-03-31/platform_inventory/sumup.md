# SumUp

## Access

- `Observed`: SumUp access depends on which env file is used.
- `config/.env` key result:
  - `GET /v0.1/me` -> HTTP `401`
- `config/api-keys/.env` key result:
  - `GET /v0.1/me` -> HTTP `200`
  - transaction-history probe `GET /v0.1/me/transactions/history?limit=1` -> returned `1` item

Evidence exports:
- `/home/ricky/data/exports/system-audit-2026-03-31/sumup/me.body.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/sumup/me-api-keys.body.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/sumup/transactions-api-keys.json`

## Observed Inventory

- Merchant profile is live for:
  - company `Panrix Ltd T/a iCorrect`
  - merchant code `MEMCHVCK`
  - website `https://icorrect.co.uk/`
  - default currency `GBP`
  - address `12 Margaret Street, London, W1W 8JQ`
- One transaction-history item was readable from the safe sample probe.

## Cross-System Role

- `Observed`: SumUp is a live payment system candidate rather than a dead credential.
- `Observed`: local finance/docs position SumUp as the walk-in card-payment rail.
- `Observed`: live Xero contains a `SumUp` revenue account and `Payment Fees - SumUp` account.
- `Observed`: current `2025+` authorised Xero bank-transaction sample includes `5` `RECEIVE` rows with `SumUp` as contact, all landing in `Starling Business Account#001`.
- `Observed`: the active n8n workflow export set contains no `SumUp` references.
- `Observed`: a stricter non-doc source-code sweep found SumUp in KPI/reporting code and pricing-sync catalog tooling, but not in live payment-ingestion or reconciliation services.
- `Inferred`: SumUp is most likely the primary in-store card path, while Stripe handles at least some online/invoice collection and Shopify handles prepaid ecommerce ingress into Monday. In current Xero evidence, SumUp appears through revenue/fee accounting plus Starling receive-side bank activity rather than through a dedicated Xero bank account.

## Observed Risks

- The working SumUp key is not the one in `config/.env`.
- Any process assuming the canonical env key is valid will misclassify SumUp as dead.
- SumUp still lacks a proven live reconciliation runtime back into Monday or Xero despite its clear presence in the ledger.

## Open Threads

- inspect safe merchant/transaction endpoints further without exposing payment-sensitive data
- confirm whether SumUp -> Monday/Xero reconciliation should be restored from the archived Python script or rebuilt elsewhere, because no current live runtime owner has been found
- determine whether the remaining live SumUp footprint is now POS/catalog plus Xero/bank-ledger visibility rather than automation-owned payment closure
