# Apple SSR Parts Catalog — iCorrect

**Generated:** 2026-04-29
**Source:** Live API + repair-history-derived serials + past-order serials
**Coverage:** 23 device models, 6,438 parts cached

## Coverage by device family

- **MacBook Pro**: 9 models, 3,375 parts
- **MacBook Air**: 5 models, 1,656 parts
- **iPhone**: 8 models, 1,311 parts
- **iPad**: 1 models, 96 parts

## Models in catalog

| Model ID | Device | Repair types | Parts | iCorrect history |
|---|---|---|---|---|
| 49 | MacBook Air (M1, 2020) | 14 | 287 | 227 repairs |
| 50 | MacBook Pro (13-inch, M1, 2020) | 16 | 458 | 119 repairs |
| 52 | MacBook Pro (16-inch, 2021) | 16 | 460 | 4 repairs |
| 131 | MacBook Air (13-inch, M3, 2024) | 16 | 283 | 2 repairs |
| 91 | MacBook Pro (13-inch, M2, 2022) | 16 | 513 | 2 repairs |
| 127 | MacBook Pro (14-inch, M3 Pro or M3 Max, Nov 2023) | 17 | 297 | 2 repairs |
| 51 | MacBook Pro (14-inch, 2021) | 16 | 447 | 2 repairs |
| 215 | MacBook Air (15-inch, M4, 2025) | 17 | 307 | 1 repairs |
| 115 | MacBook Pro (16-inch, 2023) | 17 | 302 | 1 repairs |
| 126 | MacBook Pro (14-inch, M3, Nov 2023) | 17 | 290 | 1 repairs |
| 190 | iPad Pro 13-inch (M4) | 5 | 96 | 1 repairs |
| 114 | MacBook Pro (14-inch, 2023) | 17 | 301 | 1 repairs |
| 226 | MacBook Pro (14-inch, M5) | 18 | 307 | 0 repairs |
| 1 | iPhone 12 mini | 7 | 147 | 0 repairs |
| 132 | MacBook Air (15-inch, M3, 2024) | 17 | 308 | 0 repairs |
| 90 | MacBook Air (M2, 2022) | 16 | 471 | 0 repairs |
| 16 | iPhone 13 Pro | 8 | 204 | 0 repairs |
| 4 | iPhone 12 Pro Max | 7 | 160 | 0 repairs |
| 15 | iPhone 13 | 8 | 184 | 0 repairs |
| 18 | iPhone 13 mini | 8 | 185 | 0 repairs |
| 2 | iPhone 12 | 7 | 146 | 0 repairs |
| 48 | iPhone SE (3rd generation) | 6 | 128 | 0 repairs |
| 3 | iPhone 12 Pro | 7 | 157 | 0 repairs |

## Known gaps (not in catalog)

- **iPhone 14, 15, 16 series** — Apple SSR supports them; no working serial in past orders to seed lookup. Add when iCorrect orders parts for these models (serial gets captured automatically).
- **Apple Watch** — not yet attempted; Apple SSR EU may have limited Watch repair coverage.
- **Older iPhones (X / XR / XS / 11)** — not in past-order history.
- **Mac desktops (iMac, Mac mini, Mac Pro, Studio Display)** — Apple SSR supports them; no past orders to seed.

## How to extend

1. **For an iPhone we don't yet have:** wait for a customer to bring one in for repair. Capture their IMEI. Add to the seeds file. Re-run Phase 4.
2. **For a model with no working serial:** the SearchByDevice endpoint requires `sn=`. Without one, it returns 204. The serial-resolver (`GetDeviceIdRecaptcha`) requires reCAPTCHA + a known-good serial.
3. **Periodic refresh:** prices and stock change. Re-run the full builder weekly via cron once we wire it.

## Source files

- `apple-ssr-catalog-final.json` — full catalog (23 models, 6,438 parts)
- `apple-ssr-catalog-candidates.json` — repair-history-derived serial candidates (input)
- `apple-ssr-known-good-serials.json` — model→serial pairs from past orders (input)
- `apple-ssr-orders-detail.json` — 91 past orders, full detail (16 MB)
- `apple-ssr-orders-raw.json` — order summaries

## Next steps (decisions for Ricky)

- **Where should this catalog live?** Local JSON for Phase 1; Supabase table for production lookups. Recommend `ic_apple_ssr_catalog` table with refresh cron (weekly).
- **MS price comparison:** join this catalog vs Mobilesentrix's catalog by SKU/part description → 'cheapest path per repair' lookup feeding repair-quoting.
- **Stock alerting:** monitor `unavailable` flag changes per part — Telegram ping when a hot part goes back in stock.
- **Order automation:** the place-order chain is documented but not wired. Once you green-light a single canary order via API (under per-order approval contract), this becomes the foundation for stock-out automation from Monday cards.