# Customer Retention And Repeat Work

Last updated: 2026-04-02

## Scope

This file covers supplementary research area `S2` from `RESEARCH-EXPANSION-BRIEF.md`.

Evidence base:
- Monday customer-repeat surface:
  - `/home/ricky/data/exports/system-audit-2026-03-31/monday/customer-repeat-surface-2026-04-01.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/monday/customer-repeat-surface-summary-2026-04-01.json`

Method:
- dedupe repair items using the best available key in this order:
  - email
  - phone number
  - item name fallback
- this is a practical proxy, not a perfect CRM identity graph
- `Observed`: operator confirmation says Monday is the canonical customer identity owner, but the live board still lacks a strong stable customer ID implementation.

## Short Answer

- `Observed`: the identifiable repeat-customer rate on the main board is about `8.1%`.
- `Observed`: repeat value is not trivial; repeat customers account for about `£92,391.88` of visible paid value in the deduped surface.
- `Observed`: repeat behaviour is materially stronger in Walk-In and courier-led service than in standard Mail-In.
- `Inferred`: the business does have a real returning-customer layer, but it does not yet look strong enough to offset acquisition and operational leakage by itself.

## 1. Customer Repeat Surface

- `Observed`: the board-wide pull covered `4,453` items.
- `Observed`: those items collapse to `3,944` identifiable customers under the current email/phone/name proxy.
- `Observed`: `320` customers have `2+` items, giving a repeat-customer rate of `8.1%`.

## 2. Repeat Value

- `Observed`: repeat customers contribute `£92,391.88` of visible paid value in the current deduped surface.
- `Observed`: average visible paid value per repeat customer is about `£288.72`.
- `Observed`: the most valuable repeat customers in the visible slice are split across Walk-In, Mail-In, and courier-led work rather than one single path.

## 3. Repeat By Service Pattern

- `Observed`: repeat rates by dominant service type are:
  - Gophr Courier: `23.0%`
  - Walk-In: `12.1%`
  - Stuart Courier: `11.5%`
  - Mail-In: `2.6%`
- `Inferred`: local/courier-led relationships appear much stickier than ordinary Mail-In.
- `Inferred`: standard Mail-In may be better at one-off fulfilment than at building repeat customer behaviour.

## 4. Interpretation

- `Observed`: repeat work exists, but the identifiable repeat layer is smaller than the overall first-time workload.
- `Inferred`: the business still depends heavily on new demand rather than a strong retention flywheel.
- `Inferred`: that makes slow response, low conversion, and weak queue hygiene more dangerous because the business cannot rely on a large installed base to smooth acquisition shocks.

## 5. Caveats

- `Observed`: this is still a Monday-only operational proxy, not a fully normalised customer-ID model.
- `Observed`: shared family phones, missing emails, and inconsistent item naming will undercount or mis-group some customers.
- `Observed`: operator confirmation says Monday should be treated as the canonical customer identity source, not Intercom, Shopify, or Xero.
- `Observed`: the dead legacy `Link - Client Information Capture` relation and dead `Contacts` / `Leads` boards mean the current canonical source is conceptually Monday, but not yet implemented as a clean stable ID layer.
- `Observed`: the strongest current identity fields on the main board are `Email` (`text5`) and `Phone Number` (`text00`), but repeat analysis still had to fall back to item-name heuristics.

## 6. What A Stable Monday Identity Layer Needs

- `Observed`: Monday is the agreed system owner.
- `Observed`: today it still relies on loose email/phone/name matching.
- `Inferred`: the minimum viable customer-identity rebuild is not a new CRM first; it is a stable reusable customer key inside Monday.

Recommended minimum fields:
- `Customer ID` as a stable generated text key
- normalized `Email`
- normalized `Phone Number`
- optional downstream link fields for:
  - Intercom
  - Shopify customer
  - Xero contact
