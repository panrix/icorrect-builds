# Channel Economics Model

Built: 2026-04-02

## Purpose

This file assembles the per-channel economics for iCorrect using the audit evidence available as of 2026-04-02.

The output has two layers:

- `Direct contribution`: gross revenue less direct channel costs.
- `Indicative fully loaded contribution`: direct contribution less an allocated share of residual business overhead.

## Method And Important Caveats

1. This model uses exact numbers where the audit already has them, and bounded ranges where it does not.
2. Back Market (`BM`) resale is the cleanest channel economically because the audit contains sold-device profit data from `601` matched orders in `/home/ricky/builds/data/buyback-profitability-lookup.json`.
3. Non-BM repair channels do not have job-level parts truth, job-level shipping truth, or a working payment reconciliation loop across Monday/Xero/Stripe/SumUp. Those channels therefore use observed ticket values plus explicit `[ASSUMPTION]` bands.
4. `Shopify Online Repair` is an ingress/payment channel, not a fulfilment mode. It overlaps with walk-in and mail-in fulfilment. To avoid double counting, treat:
   - `Shopify Online Repair` as prepaid online-origin repair orders.
   - `Walk-In Repair` in this model as non-Shopify walk-in repair.
   - `Mail-In Repair` in this model as non-Shopify mail-in repair.
5. `BM Trade-In` is an acquisition channel, not a revenue event. It deploys cash first and only monetises later through `BM Resale`.
6. Xero is on cash accounting. For channel economics, revenue is normalised to the economic event, not just the cash-ledger timing, otherwise corporate/B2B would be understated.

## Residual Overhead Allocation

The six-month Xero P&L in `/home/ricky/.openclaw/agents/operations/workspace/docs/reports/financial-leak-analysis-2026-03.md` shows:

- Revenue: `GBP 309,883`
- Wages: `GBP 109,374`
- BM Trade-Ins: `GBP 88,930`
- Parts: `GBP 85,550`
- Net P/L: `GBP -19,183`

Residual overhead not captured in those three major lines is:

`GBP 309,883 - GBP 109,374 - GBP 88,930 - GBP 85,550 - (GBP -19,183) = GBP 45,212`

Residual overhead rate for an indicative fully loaded view:

`GBP 45,212 / GBP 309,883 = 14.6% of revenue`

`[ASSUMPTION]` This `14.6%` is allocated by revenue share because the audit does not provide channel-clean labour-hour, rent, software, or admin-cost allocations.

## Evidence Confidence By Channel

| Channel | Confidence | Why |
|---|---:|---|
| BM Trade-In | High on cash deployment, Medium on full standalone cost | Purchase and BM buy fee are evidenced; intake labour before resale is less cleanly isolated. |
| BM Resale | High | Matched sold-device model already exists with fees, parts, labour, shipping, and VAT. |
| Shopify Online Repair | Medium | Ticket and payment-ingress evidence are strong; downstream parts/shipping/warranty are estimated. |
| Walk-In Repair | Medium | Revenue and payment rail are visible; parts and warranty are estimated. |
| Mail-In Repair (non-Shopify) | Medium-Low | Revenue and shipping policy are visible; parts, payment mix, and warranty cost are estimated. |
| Corporate / B2B | Medium-Low | Ticket and AR evidence exist, but cash collection and job-cost mapping are weak. |

## 1. Channel Definitions

| Channel | Definition | Included | Excluded |
|---|---|---|---|
| BM Trade-In | Buying devices from BM sellers through the BM trade-in flow. | Offer acceptance, intake, payout, inventory acquisition. | Later resale revenue. |
| BM Resale | Selling owned refurbished devices to BM buyers. | Listing, sale, BM fees, outbound shipping, BM return burden. | Initial trade-in sourcing before device ownership. |
| Shopify Online Repair | Repairs that start and are prepaid through Shopify checkout. | Shopify-paid walk-in and Shopify-paid mail-in orders. | Non-Shopify walk-ins and non-Shopify mail-ins. |
| Walk-In Repair | Non-Shopify in-store repair jobs. | Walk-in repairs paid via SumUp, cash, or invoice at/after collection. | Shopify-origin walk-ins. |
| Corporate / B2B | Account or business repair work classified as `Client = Corporate`. | Corporate repairs, business invoicing, AR. | Retail walk-ins/mail-ins not tagged corporate. |
| Mail-In Repair (non-Shopify) | Remote repair jobs that do not originate in Shopify. | Email/Intercom/phone/manual Monday mail-ins, invoice-led remote jobs. | Shopify-origin mail-ins. |

Sources: `financial-mapping.md`, `MASTER-QUESTIONS-FOR-JARVIS.md`, `client_journeys/*.md`, `systems-architecture.md`.

## 2. Revenue Model Per Channel

| Channel | Gross revenue source and observed range | Payment rail and timing | Revenue recognition point for economics |
|---|---|---|---|
| BM Trade-In | No revenue at intake. Immediate inventory acquisition only. Observed average purchase price per completed device: `GBP 119.25`. | Cash goes out when staff trigger `Pay-Out` and `bm-payout` validates the trade-in. | Not revenue-recognised at intake. Treated as inventory acquisition / cash deployment. |
| BM Resale | Average sold-device revenue `GBP 505.07` across `601` matched orders. Grade averages run from `GBP 437.97` (`UNKNOWN`) to `GBP 588.66` (`VERY_GOOD`). | BM buyer pays BM; iCorrect receives BM settlement later through the BM payout path and Xero `Backmarket` revenue. | Recognise at sold-device level for unit economics; cash arrives later than physical shipment. |
| Shopify Online Repair | Q1 2026: `108` orders, `GBP 20,711.00` gross, average `GBP 191.77`. March 2026: `64` orders, `GBP 13,686.00`, average `GBP 213.84`. | Shopify Payments / Stripe-backed. Paid at checkout. Monday item lands with `payment_status = Confirmed` and `payment_method = Shopify`. | Recognise at order ingress, then reduce for refunds / partial refunds. |
| Walk-In Repair | Visible paid walk-in surface: `GBP 332,757.81` across `1,453` paid rows, average `GBP 229.01`. | SumUp for in-store card, plus cash and some Xero invoice paths. Usually same-day or collection-time payment. | Recognise when repair is completed and payment is taken. |
| Corporate / B2B | Visible paid corporate/B2B surface: `GBP 8,825.57` across `26` paid rows, average `GBP 339.44`. This understates activity because live Xero AR is `GBP 21,821.80`. | Xero invoices, BACS, and some Stripe/invoice collection. Payment often after completion. | Recognise at service completion / invoice issuance, not only when cash arrives. |
| Mail-In Repair (non-Shopify) | Visible paid mail-in surface: `GBP 78,495.32` across `278` paid rows, average `GBP 282.36`. Courier-led remote rows are slightly higher at `GBP 297-307`. | Mixed Stripe / Xero invoice / manual remote collection. Customer pays `GBP 20` flat shipping; iCorrect absorbs overage. | Recognise on completed repair / outbound return, adjusted for collection lag. |

Sources: `marketing-analysis.md`, `financial-mapping.md`, `platform_inventory/shopify.md`, `platform_inventory/stripe.md`, `platform_inventory/sumup.md`, `platform_inventory/xero.md`, `MASTER-QUESTIONS-FOR-JARVIS.md`, `/home/ricky/.openclaw/agents/operations/workspace/docs/reports/business-deep-dive-2026-03.md`.

## 3. Cost Stack Per Channel

### 3.1 BM Trade-In

BM Trade-In is not a standalone revenue channel. Its immediate economics are:

- Average purchase price: `GBP 119.25`
- BM buy fee at `10%`: `GBP 11.93`
- Immediate cash deployed before repair/refurb: `GBP 131.18` per completed acquired device

Working:

`GBP 119.25 + (10% x GBP 119.25) = GBP 131.18`

`[ASSUMPTION]` If BM intake labour is treated as part of acquisition rather than later refurb, add roughly `0.53-1.00h x GBP 24 = GBP 12.72-24.00` before the device is even ready for repair/refurb. The audit does not isolate this cleanly enough to hard-code it into the base case.

What matters strategically:

- BM trade-in is economically a negative-cash acquisition leg.
- It only becomes profitable when the device is repaired, listed, sold, and not trapped in WIP.
- The BM order funnel is conversion-heavy: only about `39%` of placed trade-in orders complete, and `196` devices were already stuck with `GBP 18,366` of cash tied up.

Sources: `/home/ricky/builds/data/buyback-profitability-lookup.json`, `/home/ricky/builds/buyback-monitor/docs/PROFITABILITY-FINDINGS.md`, `client_journeys/backmarket-tradein.md`, `MASTER-QUESTIONS-FOR-JARVIS.md`.

### 3.2 BM Resale

Base sold-device cost stack from the matched BM profitability model:

| Item | GBP / sold device | Working |
|---|---:|---|
| Gross revenue | `505.07` | Observed average sale price across `601` matched sold devices |
| Purchase price | `119.25` | Observed average acquisition price |
| BM buy fee | `11.93` | `10% x 119.25` |
| Parts | `55.60` | Observed average parts cost |
| Labour | `28.48` | Observed average labour cost at `GBP 24/hr` |
| Outbound shipping | `15.00` | BM margin model constant |
| BM sell fee | `50.51` | `10% x 505.07` |
| VAT margin scheme | `64.30` | `16.67% x (505.07 - 119.25)` |
| Expected BM return burden | `10.57` | `GBP 3,869 / 366 shipped sales` |
| Direct contribution | `149.43` | `505.07 - 355.64` |

Direct margin:

`GBP 149.43 / GBP 505.07 = 29.6%`

Indicative fully loaded contribution after residual overhead allocation:

- Allocated residual overhead: `14.6% x GBP 505.07 = GBP 73.69`
- Fully loaded contribution: `GBP 149.43 - GBP 73.69 = GBP 75.74`

Important nuance:

- This is the strongest directly evidenced unit-economics channel in the audit.
- It is still highly sensitive to grade mix, acceptance pricing, listing delay, and returns.
- `FUNC.CRACK` remains the weak BM volume trap. `NONFUNC.USED` is the strongest BM profit pool.

Sources: `/home/ricky/builds/data/buyback-profitability-lookup.json`, `/home/ricky/builds/buyback-monitor/README.md`, `/home/ricky/builds/buyback-monitor/docs/PROFITABILITY-FINDINGS.md`, `/home/ricky/builds/backmarket/audit/returns-investigation-2026-03-02.md`, `client_journeys/backmarket-resale-order.md`, `MASTER-QUESTIONS-FOR-JARVIS.md`.

### 3.3 Shopify Online Repair

Observed Shopify revenue surface:

- Q1 average order value: `GBP 191.77`
- March average order value: `GBP 213.84`
- Base-case planning ticket: `GBP 202.81` `[ASSUMPTION: midpoint of Q1 and March averages]`

Base-case cost stack:

| Item | GBP / order | Basis |
|---|---:|---|
| Gross revenue | `202.81` | Midpoint of observed Q1 and March AOV |
| Parts | `40.00` | `[ASSUMPTION]` roughly `1-2` typical part lines around the `GBP 28.87` average supply price, allowing for lower-value service bookings |
| Labour | `21.36` | `[ASSUMPTION]` `0.89h x GBP 24`; midpoint between repair-only and repair-plus-diagnostic touch time |
| Net absorbed shipping | `4.78` | `[ASSUMPTION]` roughly `28.9%` mail-in mix from top Shopify service line items x `GBP 16.54` net absorbed mail-in shipping burden |
| Shopify payment fee | `4.05` | `[ASSUMPTION]` `1.9% + GBP 0.20` blended Shopify Payments rate |
| Refund / warranty reserve | `8.00` | `[ASSUMPTION]` informed by `11/108` Q1 orders showing refund activity |
| Direct contribution | `124.61` | `202.81 - 78.20` |

Base-case direct margin:

`GBP 124.61 / GBP 202.81 = 61.4%`

Indicative range:

- Direct contribution range: `GBP 80.09-166.85`
- Direct margin range: `41.8%-78.0%`
- Indicative fully loaded contribution range after residual overhead: `GBP 52.11-135.65`

What drives the range:

- whether the order is a true full-price repair vs a lower-part-content service/deposit
- whether the order fulfils as walk-in vs mail-in
- actual refund severity, not just refund-event count

Sources: `marketing-analysis.md`, `platform_inventory/shopify.md`, `financial-mapping.md`, `client_journeys/shopify-online-purchase.md`, `client_journeys/walk-in-customer.md`, `client_journeys/mail-in-send-in-customer.md`, `MASTER-QUESTIONS-FOR-JARVIS.md`, `logistics-supplier-analysis.md`.

### 3.4 Walk-In Repair

Observed walk-in revenue surface:

- Visible paid walk-in average: `GBP 229.01`

Base-case cost stack:

| Item | GBP / job | Basis |
|---|---:|---|
| Gross revenue | `229.01` | Observed paid-value average |
| Parts | `45.00` | `[ASSUMPTION]` direct-repair mix using the `GBP 28.87` average supply price plus higher-value screen jobs |
| Labour | `21.36` | `[ASSUMPTION]` `0.89h x GBP 24` |
| Shipping | `0.00` | Confirmed no walk-in shipping |
| SumUp fee | `3.87` | `[ASSUMPTION]` `1.69%` card fee on average ticket |
| Warranty / rework reserve | `5.00` | `[ASSUMPTION]` informed by QC failure and repeat-completion proxies, but materially lower than those workload proxies |
| Direct contribution | `153.78` | `229.01 - 75.23` |

Base-case direct margin:

`GBP 153.78 / GBP 229.01 = 67.1%`

Indicative range:

- Direct contribution range: `GBP 116.66-184.85`
- Direct margin range: `50.9%-80.7%`
- Indicative fully loaded contribution range after residual overhead: `GBP 83.25-151.44`

Walk-in should remain the cleanest non-BM repair channel structurally because:

- no shipping drag
- stronger repeat rate than standard mail-in (`12.1%` vs `2.6%`)
- faster operational cycle (`Received -> Date Repaired` median `1 day` for walk-in repair)

Sources: `customer-retention-analysis.md`, `staff-performance-analysis.md`, `timing-mapping.md`, `platform_inventory/sumup.md`, `financial-mapping.md`, `client_journeys/walk-in-customer.md`, `MASTER-QUESTIONS-FOR-JARVIS.md`.

### 3.5 Corporate / B2B

Observed corporate/B2B revenue surface:

- Visible paid average: `GBP 339.44`
- Live Xero receivables: `GBP 21,821.80`

Base-case cost stack:

| Item | GBP / job | Basis |
|---|---:|---|
| Gross revenue | `339.44` | Observed paid-value average |
| Parts | `65.00` | `[ASSUMPTION]` higher-value repair mix than standard retail |
| Labour | `21.36` | `[ASSUMPTION]` `0.89h x GBP 24` base productive touch time |
| Shipping | `0.00` | Couriers generally charged to customer; absorbed exceptions captured in reserve |
| Payment processing | `3.39` | `[ASSUMPTION]` low blended fee because BACS/invoice is common |
| Warranty / service reserve | `8.00` | `[ASSUMPTION]` account-service follow-up burden |
| AR / collection reserve | `6.79` | `[ASSUMPTION]` `2%` of revenue because payment is delayed and collection visibility is weak |
| Direct contribution | `234.90` | `339.44 - 104.54` |

Base-case direct margin:

`GBP 234.90 / GBP 339.44 = 69.2%`

Indicative range:

- Direct contribution range: `GBP 174.40-280.72`
- Direct margin range: `51.4%-82.7%`
- Indicative fully loaded contribution range after residual overhead: `GBP 124.88-231.20`

Important nuance:

- Corporate likely has the best unit economics among repair channels.
- It also has the worst cash-realisation profile because invoice send and payment write-back are broken and AR is already live in Xero.

Sources: `financial-mapping.md`, `platform_inventory/xero.md`, `client_journeys/corporate-b2b-client.md`, `timing-mapping.md`, `MASTER-QUESTIONS-FOR-JARVIS.md`.

### 3.6 Mail-In Repair (non-Shopify)

Observed mail-in revenue surface:

- Standard mail-in average paid value: `GBP 282.36`

Shipping derivation:

- Royal Mail spend identified since `2025-10-01`: `GBP 10,305.21`
- Standard/External/International mail-in paid rows visible: `278 + 2 + 2 = 282`
- Implied actual shipping cost per remote mail-in job: `GBP 10,305.21 / 282 = GBP 36.54`
- Customer flat mail-in shipping charge: `GBP 20.00`
- Net absorbed shipping burden: `GBP 36.54 - GBP 20.00 = GBP 16.54`

Base-case cost stack:

| Item | GBP / job | Basis |
|---|---:|---|
| Gross revenue | `282.36` | Observed paid-value average |
| Parts | `55.00` | `[ASSUMPTION]` more complex remote repair mix than walk-in |
| Labour | `28.32` | `[ASSUMPTION]` `1.18h x GBP 24`; remote jobs skew more diagnostic-heavy |
| Net absorbed shipping | `16.54` | Derived from Royal Mail spend less customer flat shipping charge |
| Payment fee | `5.85` | `[ASSUMPTION]` `2.0% + GBP 0.20` Stripe/Xero blended fee |
| Warranty / return reserve | `10.00` | `[ASSUMPTION]` remote rework is costlier because return shipping is absorbed on warranty |
| Direct contribution | `166.65` | `282.36 - 115.71` |

Base-case direct margin:

`GBP 166.65 / GBP 282.36 = 59.0%`

Indicative range:

- Direct contribution range: `GBP 123.83-197.34`
- Direct margin range: `43.9%-69.9%`
- Indicative fully loaded contribution range after residual overhead: `GBP 82.63-156.14`

The direct margin can still be positive, but this channel is operationally weaker than walk-in because it adds:

- slower median cycle times (`Received -> Diagnostic Complete` `4 days`; `Received -> Date Repaired` `4-8 days`)
- absorbed shipping overage
- weaker repeat behaviour (`2.6%`)
- poorer payment-state visibility

Sources: `logistics-supplier-analysis.md`, `timing-mapping.md`, `customer-retention-analysis.md`, `client_journeys/mail-in-send-in-customer.md`, `MASTER-QUESTIONS-FOR-JARVIS.md`, `financial-mapping.md`.

## 4. Contribution Margin Summary

### 4.1 Base-Case Unit Economics

| Channel | Revenue / unit | Direct contribution / unit | Direct margin | Indicative fully loaded contribution / unit |
|---|---:|---:|---:|---:|
| BM Trade-In | `0.00` at intake | `-131.18` immediate cash deployment | n/a | n/a |
| BM Resale | `505.07` | `149.43` | `29.6%` | `75.74` |
| Shopify Online Repair | `202.81` | `124.61` | `61.4%` | `95.02` |
| Walk-In Repair | `229.01` | `153.78` | `67.1%` | `120.37` |
| Corporate / B2B | `339.44` | `234.90` | `69.2%` | `185.38` |
| Mail-In Repair (non-Shopify) | `282.36` | `166.65` | `59.0%` | `125.46` |

### 4.2 Range View Where Audit Data Is Incomplete

| Channel | Direct contribution range | Fully loaded contribution range | Main uncertainty |
|---|---:|---:|---|
| BM Trade-In | `-131.18` before any intake labour | n/a | intake labour and stuck-inventory ageing |
| BM Resale | tightly evidenced around `149.43` | tightly evidenced around `75.74` | return severity beyond direct-cost estimate |
| Shopify Online Repair | `80.09-166.85` | `52.11-135.65` | parts content, refund severity, walk-in vs mail-in fulfilment mix |
| Walk-In Repair | `116.66-184.85` | `83.25-151.44` | parts mix and warranty reserve |
| Corporate / B2B | `174.40-280.72` | `124.88-231.20` | AR drag, bad debt risk, actual payment fee mix |
| Mail-In Repair (non-Shopify) | `123.83-197.34` | `82.63-156.14` | true shipping burden, payment collection mix, warranty return rate |

### 4.3 Volume-Weighted Contribution

This ranking has to be directional rather than perfectly additive, because the audit has a mix of:

- six-month Xero channel revenue
- current visible paid-value surfaces
- Shopify Q1-only ecommerce revenue
- overlapping ingress vs fulfilment channels

Directional ranking of absolute contribution pool:

1. `BM Resale`
   - BM is roughly `60-62%` of revenue.
   - Even after return burden, BM resale produces about `29.6%` direct margin per sold device.
   - On current mix, this is the biggest absolute profit engine, but only if acquisition pricing and stuck stock are controlled.
2. `Walk-In Repair`
   - Largest visible non-BM paid surface at `GBP 332,757.81`.
   - No shipping drag, better repeat behaviour, faster cash cycle.
3. `Mail-In Repair (non-Shopify)`
   - Good ticket value, but shipping and slower cycle dilute realised contribution.
4. `Shopify Online Repair`
   - Positive unit economics, but still small in absolute scale: `GBP 20,711` gross in Q1 2026.
   - Also overlaps with walk-in and mail-in fulfilment, so do not add on top of those service channels.
5. `Corporate / B2B`
   - Likely high contribution per job, but small visible paid volume and heavy AR drag.
6. `BM Trade-In`
   - Not a profit pool by itself.
   - It is the largest capital sink and can destroy profit when acceptance pricing is too high.

Sources: `/home/ricky/.openclaw/agents/operations/workspace/docs/reports/business-deep-dive-2026-03.md`, `marketing-analysis.md`, `customer-retention-analysis.md`, `/home/ricky/builds/buyback-monitor/docs/PROFITABILITY-FINDINGS.md`, `/home/ricky/builds/backmarket/audit/returns-investigation-2026-03-02.md`.

## 5. Working Capital Impact

| Channel | Cash cycle | Stuck inventory / WIP risk | Payment collection delay |
|---|---|---|---|
| BM Trade-In | Worst. Cash goes out at payout before resale cash comes back. | Highest. `196` stuck devices and `GBP 18,366` tied up already. | No customer collection risk, but the cash is trapped in stock. |
| BM Resale | Medium-to-bad. Inventory is already paid for before the sale. | High. Devices can sit in `To List`, repair, QC, or return loops. | BM settlement lags physical shipment; returns reopen the cycle. |
| Shopify Online Repair | Best among remote channels. Customer prepays at checkout. | Low inventory risk; moderate WIP risk if downstream ops are slow. | Low collection delay, but refunds and partial refunds hit after capture. |
| Walk-In Repair | Best overall repair cash cycle. Often same-day or collection-time payment. | Low stock risk beyond awaiting-part cases. | Low, except for invoice-led exceptions and stale collection states. |
| Corporate / B2B | Worst receivables profile. Work can be completed before cash arrives. | Low inventory risk; medium WIP risk if quote/invoice stages stall. | Highest AR delay. Xero already shows `GBP 21,821.80` in receivables. |
| Mail-In Repair (non-Shopify) | Medium-to-bad. Shipping and repair work happen before final cash closure is reliably visible. | Medium. Remote jobs have more queue states, more outbound dependencies, and more hidden stale debt. | Medium-to-high because payment reconciliation back to Monday is broken. |

Working-capital conclusions:

- `BM Trade-In` is the channel where capital gets trapped.
- `Corporate / B2B` is the channel where receivables get trapped.
- `Mail-In` is the channel where operational lag and shipping spend quietly lengthen the cash cycle.
- `Walk-In` and `Shopify-prepaid` are the cleanest cash-cycle channels.

Sources: `client_journeys/*.md`, `timing-mapping.md`, `findings.md`, `platform_inventory/xero.md`, `/home/ricky/builds/buyback-monitor/docs/PROFITABILITY-FINDINGS.md`.

## 6. Strategic Implications

### Which channels are actually profitable?

- `BM Resale` is profitable on a sold-device basis. That is proven by the matched BM model.
- `Walk-In Repair` is very likely profitable and is the cleanest non-BM repair channel.
- `Shopify Online Repair` is likely profitable at direct-contribution level and has the cleanest payment ingress.
- `Mail-In Repair (non-Shopify)` is probably still direct-margin positive, but it is less attractive than walk-in because shipping and longer cycle times eat into realised margin.
- `Corporate / B2B` is probably profitable per completed job, but the realised cash return is weakened by AR delay and broken payment closure.

### Which channels are volume-positive but margin-negative?

- The proven margin-negative risk is not BM resale as a whole. It is `BM Trade-In` pricing on the wrong SKUs and grades, especially `FUNC.CRACK`, plus the capital drag of stuck stock.
- `BM Trade-In` by itself is always negative-cash at acquisition and becomes margin-destructive when acceptance prices drift above the economic threshold.
- No equivalent proof exists in the audit that walk-in, Shopify, mail-in, or corporate are structurally negative at the job-contribution level.

### Where is capital trapped?

- `BM Trade-In`: inventory already bought but not sold.
- `BM Resale`: devices ready to sell but stuck in repair/QC/listing/return loops.
- `Corporate / B2B`: receivables after service completion.
- `Mail-In`: WIP plus shipping-funded remote jobs waiting on diagnosis, approval, or return logistics.

### What happens if channel mix shifts?

- More `BM Resale` only helps if BM intake pricing stays disciplined and stuck stock is cleared. More BM volume without pricing control simply scales the loss.
- More `Walk-In Repair` is the healthiest mix shift: no shipping, faster cycle, stronger repeat behaviour, cleaner cash collection.
- More `Shopify Online Repair` is good if the downstream walk-in/mail-in operations can absorb it without refund growth or stale-order drift.
- More `Corporate / B2B` likely improves accounting margin but worsens cash conversion unless invoicing and payment write-back are fixed first.
- More `Mail-In` without better remote-job control will increase shipping drag, queue debt, and payment-state blindness.

## 7. Bottom Line

The audit supports five hard conclusions:

1. `BM Resale` is not the problem on a sold-device basis. `BM Trade-In` pricing discipline and BM stock ageing are the problem.
2. `Walk-In Repair` is the best all-round repair channel once shipping, repeat rate, and cash cycle are considered together.
3. `Shopify` is a good ingress layer, but it is still too small to offset the broader business leak on its own.
4. `Corporate / B2B` likely has good unit economics but bad cash economics.
5. The definitive missing control is still channel-clean finance truth: parts-by-job, shipping-by-job, and payment reconciliation by rail.

## Source Index

- `financial-mapping.md`
- `business-viability-analysis.md`
- `marketing-analysis.md`
- `customer-retention-analysis.md`
- `logistics-supplier-analysis.md`
- `staff-performance-analysis.md`
- `timing-mapping.md`
- `findings.md`
- `MASTER-QUESTIONS-FOR-JARVIS.md`
- `systems-architecture.md`
- `client_journeys/backmarket-tradein.md`
- `client_journeys/backmarket-resale-order.md`
- `client_journeys/shopify-online-purchase.md`
- `client_journeys/walk-in-customer.md`
- `client_journeys/mail-in-send-in-customer.md`
- `client_journeys/corporate-b2b-client.md`
- `client_journeys/warranty-aftercare-returns.md`
- `/home/ricky/kb/backmarket/README.md`
- `/home/ricky/kb/backmarket/product-id-resolution.md`
- `/home/ricky/builds/buyback-monitor/README.md`
- `/home/ricky/builds/buyback-monitor/docs/PROFITABILITY-FINDINGS.md`
- `/home/ricky/builds/buyback-monitor/docs/BUY-BOX-MONITOR-CRITIQUE.md`
- `/home/ricky/builds/backmarket/audit/returns-investigation-2026-03-02.md`
- `/home/ricky/.openclaw/agents/operations/workspace/docs/reports/business-deep-dive-2026-03.md`
- `/home/ricky/.openclaw/agents/operations/workspace/docs/reports/financial-leak-analysis-2026-03.md`
