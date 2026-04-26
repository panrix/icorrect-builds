# BM 1549 Historical Sales Refresh

## Jarvis Paste Summary

- BM 1549 / Lily Doherty / Main `11507101485` / BM Devices `11507109525` maps cleanly to Back Market slot `5606597`, UUID product `b5ebc79d-0304-41a6-b1ae-d2a487afa11f`, numeric BM product `545379`.
- Exact slot `5606597` shows **8 completed Fair sales in the last 90 days** from **2026-02-28** to **2026-04-18**, with **avg £364.38 / median £361 / range £351-£378**.
- Wider Fair lineage for BM product `545379` shows **29 completed sales in the last 90 days** from **2026-01-29** to **2026-04-18**, with **avg £367.52 / median £365 / range £341-£399**.
- Longer repo-local BM order history for product `545379` shows **171 historical orders** from **2023-03-28** to **2026-03-23**, and lineage listing IDs include `5606597`.
- Caveats: BM sell-side orders API uses numeric `backmarket_id`, not the UUID `product_id`; the long-history snapshot is older (`extracted_at 2026-03-27`), so the 90-day live read-only refresh above is the fresher source for recent counts and last-seen dates.

## Identity Mapping

- Canonical SKU: `MBA.A2337.M1.7C.8GB.256GB.Grey.Fair`
- Registry slot: `5606597`
- UUID product ID: `b5ebc79d-0304-41a6-b1ae-d2a487afa11f`
- Numeric BM product ID for sell-side order history: `545379`
- Product title: `MacBook Air 13-inch (2020) - Apple M1 8-core and 7-core GPU - 8GB RAM - SSD 256GB - QWERTY - English`

## Historical Back Market Sales Evidence

- Read-only live refresh method:
  - `GET /ws/orders?state=9`
  - filtered to numeric BM product `545379`
  - filtered to Fair condition code `12`
  - 90-day window aligned to `data/sold-prices-latest.json` (`generated_at 2026-04-22T03:22:59.009Z`)
- Exact listing slot `5606597`:
  - `8` completed Fair sales
  - first seen `2026-02-28T09:56:28Z`
  - last seen `2026-04-18T16:01:14+01:00`
  - avg `£364.38`
  - median `£361`
  - range `£351-£378`
  - sale points seen: `£374`, `£357`, `£357`, `£358`, `£364`, `£376`, `£378`, `£351`
- Wider Fair product-line history for BM product `545379`:
  - `29` completed Fair sales in the same 90-day window
  - first seen `2026-01-29T18:48:27Z`
  - last seen `2026-04-18T16:01:14+01:00`
  - avg `£367.52`
  - median `£365`
  - range `£341-£399`
  - sales span older sibling listing IDs including `4857996`, `5500808`, `6347723`, and exact slot `5606597`
- Repo-local longer-history snapshot:
  - `data/order-history-product-ids.json` product `545379`
  - `order_count: 171`
  - `first_seen: 2023-03-28`
  - `last_seen: 2026-03-23`
  - lineage listing IDs include `5606597`
  - price list in snapshot spans `£335` to `£809.67`

## Caveats

- The historical evidence is strong for the exact slot and product lineage, but it is sell-side evidence only.
- The exact-slot 90-day data is fresher than the older repo snapshot and should be preferred for first/last recent sale dates.
- BM order lines expose both slot-level and product-level lineage, and older sibling slots materially contribute to the wider product average; do not treat the 29-sale product-line average as if all 29 happened on slot `5606597`.
