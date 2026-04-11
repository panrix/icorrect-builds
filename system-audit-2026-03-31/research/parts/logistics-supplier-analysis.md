# Logistics And Supplier Economics

Last updated: 2026-04-02

## Scope

This file covers supplementary research areas `S1` and `S5` from `RESEARCH-EXPANSION-BRIEF.md`:
- supplier and parts economics
- shipping and logistics economics

Evidence base:
- Xero filtered bank transactions:
  - `/home/ricky/data/exports/system-audit-2026-03-31/xero/bank-transactions-authorised-2025-10-plus-all-2026-04-01.json`
- Monday main-board paid/service surface:
  - `/home/ricky/data/exports/system-audit-2026-03-31/monday/main-board-paid-service-surface-2026-04-01.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/monday/main-board-paid-service-surface-summary-2026-04-01.json`
- Monday parts-board snapshot:
  - `/home/ricky/data/exports/system-audit-2026-03-31/monday/parts-board-items-2026-04-01.json`
  - `/home/ricky/data/exports/system-audit-2026-03-31/monday/parts-board-items-summary-2026-04-01.json`

Analysis window:
- Xero bank transactions from `2025-10-01` onward
- Monday board state as of `2026-04-01`

## Short Answer

- `Observed`: logistics spend is meaningful enough to matter, especially on remote work.
- `Observed`: identified outbound shipping spend from Xero is about `£12.3k` since `2025-10-01`, led by Royal Mail.
- `Observed`: the remote-service paid-value surface on Monday is about `£99.5k`, so identified logistics spend is roughly `12.4%` of visible remote paid value.
- `Observed`: parts/procurement spend is also material, with at least `£31.8k` visible across major parts suppliers and marketplaces in the same Xero window.
- `Observed`: operator confirmation now clarifies shipping ownership by path:
  - walk-in has no shipping
  - mail-in customers are charged a flat `£20`
  - courier fees are generally charged to the customer
  - warranty returns are fully absorbed by iCorrect
  - Back Market returns and normal BM client shipping are absorbed by iCorrect
- `Observed`: the parts board is not mature enough to support clean supplier economics from Monday alone because supplier identity is effectively blank across the live snapshot.
- `Inferred`: remote work is revenue-positive, but shipping friction and weak supplier data make margin management harder than it should be.

## 1. Xero Shipping And Logistics Spend

- `Observed`: identified logistics spend since `2025-10-01` is `£12,314.35` across `379` spend transactions.
- `Observed`: the biggest logistics payees are:
  - Royal Mail: `£10,305.21` across `365` transactions
  - Gophr: `£1,706.31` across `5` transactions
  - UPS: `£179.11`
  - DHL: `£117.62`
  - Stuart Couriers: `£6.10`

## 2. Remote-Service Value Surface

- `Observed`: the Monday main-board paid surface contains `£99,517.67` of visible paid value across remote service types:
  - Mail-In: `£78,495.32`
  - Gophr Courier: `£9,824.10`
  - Stuart Courier: `£9,809.75`
  - External Mail-In: `£138.00`
  - International Mail-In: `£1,250.50`
- `Observed`: the same surface shows `£332,757.81` of visible Walk-In paid value.
- `Observed`: remote work accounts for about `23.0%` of visible paid value on the main board.

## 3. Shipping As A Share Of Remote Paid Value

- `Observed`: Royal Mail alone equals about `10.4%` of visible remote paid value.
- `Observed`: Royal Mail plus Gophr equals about `12.1%` of visible remote paid value.
- `Observed`: all identified logistics spend combined equals about `12.4%` of visible remote paid value.
- `Inferred`: this is high enough that shipping is not a rounding error in remote-job economics.
- `Observed`: operator confirmation says mail-in customers are charged a flat `£20`, effectively `£10` each direction, and iCorrect absorbs any shipping cost above that.
- `Observed`: operator confirmation says warranty and BM returns are fully absorbed by iCorrect, while courier fees are generally customer-paid.
- `Inferred`: the exact net shipping burden still cannot be reduced to a clean per-job unit cost from current evidence because shipment counts and job-level label costs are not yet tied back to Monday items.

## 4. Parts And Supplier Spend From Xero

- `Observed`: identified parts/procurement spend across major suppliers and marketplaces totals `£31,821.48` across `246` spend transactions since `2025-10-01`.
- `Observed`: the largest visible parts/procurement payees are:
  - Sparlay IT: `£8,876.30`
  - Mobilesentrix: `£8,835.11`
  - Ebay: `£5,185.41`
  - Amazon: `£3,909.65`
  - Cambridge Accessories: `£3,257.63`
  - Apple Self Serve: `£1,146.97`
  - iParts4u: `£159.04`

## 5. Parts Board Readiness

- `Observed`: the live parts board contains `1,802` stock items.
- `Observed`: `1,240` rows have a populated `Supply Price (ex VAT)` field, with average listed supply price about `£28.87`.
- `Observed`: the most expensive listed parts are concentrated in MacBook/iPad screens and newer premium iPhone displays, for example:
  - MBPro A2442 Front Screen - Space Grey: `£583.33`
  - iPad Pro screens: `£550.00`
  - A2141 MacBook Pro front screens: `£350-360`
  - iPhone 16 Pro Max full screen: `£250.00`
- `Observed`: supplier identity is effectively absent in the live parts-board snapshot:
  - `Preferred Supplier` blank
  - `Order Supplier` blank
  - `Supplier` relation blank
  - all `1,802` rows collapse to `Unspecified` when grouped
- `Observed`: the documented supplier universe in `/home/ricky/Claude-SOPs-for-iCorrect/26_Supplier_Directory.md` includes Nancy, MobileSentrix UK, CPU Technology, Laptop Power NW, and The Only Phones, but the live parts board does not expose those supplier labels and the visible Xero spend contacts skew toward Mobilesentrix, Sparlay IT, Cambridge Accessories, Ebay, and Amazon.
- `Observed`: operator confirmation on `2026-04-02` says all of these suppliers should be treated as active, segmented suppliers rather than assuming one single current primary supplier.
- `Observed`: operator confirmation also says Xero is the best current supplier-data source, but still not good enough as a true operational supplier system.
- `Inferred`: supplier knowledge currently lives more in docs and finance records than in the operational stock board.
- `Inferred`: Monday cannot currently answer basic supplier questions like lead time by supplier, supplier concentration, or preferred-vs-actual ordering discipline.

## 6. Interpretation

- `Observed`: Xero confirms that Back Market buy cost remains the dominant direct spend line in this filtered window at `£87,212.80`.
- `Observed`: after BM acquisition cost, the next visible operating drains include payments/fees (`Stripe`), shipping (`Royal Mail`, `Gophr`), and parts suppliers (`Sparlay IT`, `Mobilesentrix`, `Cambridge Accessories`, marketplaces).
- `Inferred`: the remote operation is not just constrained by conversion and queueing; it also carries a non-trivial shipping burden that should be included in channel margin analysis.
- `Inferred`: supplier economics are currently more visible in Xero than in Monday, which means procurement and stock decisions are not yet operationally transparent in the main workflow system.

## 7. Working Conclusion

- `Observed`: supplier and logistics costs are high enough to be part of the loss story, but they do not look like the single biggest hidden issue.
- `Inferred`: the more important pattern is compounded leakage:
  - BM acquisition overpay
  - shipping drag on remote jobs
  - incomplete supplier metadata
  - queue delay and rework consuming labour after the spend has already happened
