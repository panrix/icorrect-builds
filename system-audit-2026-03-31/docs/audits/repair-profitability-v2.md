# Repair Profitability v2

## Section 1: Methodology & Data Quality

- Generated: `2026-04-06T14:48:35Z`
- Live Monday pulls used boards `2477699024` (products), `985177480` (parts), and `349212843` (main board).
- Live Shopify product pull used the store token against ``i-correct-final.myshopify.com` / `icorrect.co.uk``. The brief named `icorrect-tech.myshopify.com`, but on `2026-04-03` that hostname returned `404` while `i-correct-final.myshopify.com` and `icorrect.co.uk` resolved successfully for the same token.
- GSC input was parsed from `gsc-repair-profit-rankings.md` only; it is a markdown export, not raw Search Console rows.

- Raw Monday products fetched: `1270`
- Raw Monday parts fetched: `1802`
- Raw Monday main-board items fetched: `4477`
- Products included in profitability output after excluding diagnostics and aftermarket screens: `1122`
- Completed repair/refurb records with usable timing attached to products: `1539`
- Shopify products fetched: `967`
- GSC landing-page rows parsed: `15`
- GSC unique query rows parsed across the three exported tables: `60`

- Products using device default time because fewer than 3 completed repairs were matched: `860`
- Products not currently listed live on Shopify: `445`
- Products with Shopify vs Monday price mismatch: `20`
- Products with at least one linked part missing a supply cost: `10`
- Products with any matched GSC demand signal from the parsed query tables: `5`

- Timing method: prefer `status4` activity-log transitions into `Under Repair` / `Under Refurb` and out to `Repaired` / `Ready To Collect` / `Returned` / `Shipped`; fall back to `Repair Time` + `Refurb Time`; last resort is the repaired-date vs intake-date columns.
- Product repair time uses a trimmed median with the top 25% of durations dropped by count (rounded down) to strip long-tail queue or pause outliers.
- Device defaults used when fewer than 3 completed repairs were matched: iPhone `1.0h`, iPad `1.5h`, MacBook `2.0h`, Watch `2.0h`.
- Profit formula used ex-VAT price from Shopify when a Shopify price existed, otherwise Monday price / `1.2`; labour at `£24/h`; payment fee at `2%` of inc-VAT price; and `£24` extra for iPhone screen products.

## Section 2: Repair Time Analysis

| Device | Product | Repairs | Calculated | Default | Used | Flag | Timing source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apple Watch S1 38mm | Apple Watch S1 38mm | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S1 38mm | Apple Watch S1 38mm Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S1 38mm | Apple Watch S1 38mm Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S1 38mm | Apple Watch S1 38mm Display Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S1 38mm | Apple Watch S1 38mm Glass Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S1 38mm | Apple Watch S1 38mm Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S1 42mm | Apple Watch S1 42mm | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S1 42mm | Apple Watch S1 42mm Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S1 42mm | Apple Watch S1 42mm Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S1 42mm | Apple Watch S1 42mm Display Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S1 42mm | Apple Watch S1 42mm Glass Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S1 42mm | Apple Watch S1 42mm Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S2 38mm | Apple Watch S2 38mm | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S2 38mm | Apple Watch S2 38mm Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S2 38mm | Apple Watch S2 38mm Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S2 38mm | Apple Watch S2 38mm Display Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S2 38mm | Apple Watch S2 38mm Glass Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S2 38mm | Apple Watch S2 38mm Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S2 42mm | Apple Watch S2 42mm | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S2 42mm | Apple Watch S2 42mm Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S2 42mm | Apple Watch S2 42mm Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S2 42mm | Apple Watch S2 42mm Display Screen | 6 | 0.62h | 2.00h | 0.62h | lower-than-default | status-activity, time-tracking |
| Apple Watch S2 42mm | Apple Watch S2 42mm Glass Screen | 6 | 0.62h | 2.00h | 0.62h | lower-than-default | status-activity, time-tracking |
| Apple Watch S2 42mm | Apple Watch S2 42mm Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S3 38mm | Apple Watch S3 38mm | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S3 38mm | Apple Watch S3 38mm Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S3 38mm | Apple Watch S3 38mm Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S3 38mm | Apple Watch S3 38mm Display Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S3 38mm | Apple Watch S3 38mm Glass Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S3 38mm | Apple Watch S3 38mm Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S3 42mm | Apple Watch S3 42mm | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S3 42mm | Apple Watch S3 42mm Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S3 42mm | Apple Watch S3 42mm Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S3 42mm | Apple Watch S3 42mm Display Screen | 6 | 0.62h | 2.00h | 0.62h | lower-than-default | status-activity, time-tracking |
| Apple Watch S3 42mm | Apple Watch S3 42mm Glass Screen | 7 | 0.52h | 2.00h | 0.52h | lower-than-default | status-activity, time-tracking |
| Apple Watch S3 42mm | Apple Watch S3 42mm Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S4 40mm | Apple Watch S4 40mm | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S4 40mm | Apple Watch S4 40mm Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S4 40mm | Apple Watch S4 40mm Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S4 40mm | Apple Watch S4 40mm Display Screen | 3 | 0.98h | 2.00h | 0.98h | lower-than-default | time-tracking |
| Apple Watch S4 40mm | Apple Watch S4 40mm Glass Screen | 4 | 0.88h | 2.00h | 0.88h | lower-than-default | time-tracking |
| Apple Watch S4 40mm | Apple Watch S4 40mm Heart Rate Monitor | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S4 40mm | Apple Watch S4 40mm Rear Housing | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S4 40mm | Apple Watch S4 40mm Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S4 44mm | Apple Watch S4 44mm | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S4 44mm | Apple Watch S4 44mm Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S4 44mm | Apple Watch S4 44mm Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S4 44mm | Apple Watch S4 44mm Display Screen | 4 | 0.76h | 2.00h | 0.76h | lower-than-default | time-tracking |
| Apple Watch S4 44mm | Apple Watch S4 44mm Glass Screen | 6 | 0.76h | 2.00h | 0.76h | lower-than-default | time-tracking |
| Apple Watch S4 44mm | Apple Watch S4 44mm Heart Rate Monitor | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S4 44mm | Apple Watch S4 44mm Rear Housing | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S4 44mm | Apple Watch S4 44mm Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S5 40mm | Apple Watch S5 40mm | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S5 40mm | Apple Watch S5 40mm Battery | 1 | 0.58h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S5 40mm | Apple Watch S5 40mm Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S5 40mm | Apple Watch S5 40mm Display Screen | 20 | 0.65h | 2.00h | 0.65h | lower-than-default | time-tracking |
| Apple Watch S5 40mm | Apple Watch S5 40mm Glass Screen | 20 | 0.65h | 2.00h | 0.65h | lower-than-default | time-tracking |
| Apple Watch S5 40mm | Apple Watch S5 40mm Heart Rate Monitor | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S5 40mm | Apple Watch S5 40mm Rear Housing | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S5 40mm | Apple Watch S5 40mm Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S5 44mm | Apple Watch S5 44mm | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S5 44mm | Apple Watch S5 44mm Battery | 2 | 1.25h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S5 44mm | Apple Watch S5 44mm Crown | 1 | 0.85h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S5 44mm | Apple Watch S5 44mm Display Screen | 13 | 0.62h | 2.00h | 0.62h | lower-than-default | time-tracking |
| Apple Watch S5 44mm | Apple Watch S5 44mm Glass Screen | 13 | 0.62h | 2.00h | 0.62h | lower-than-default | time-tracking |
| Apple Watch S5 44mm | Apple Watch S5 44mm Heart Rate Monitor | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S5 44mm | Apple Watch S5 44mm Rear Housing | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S5 44mm | Apple Watch S5 44mm Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm Display Screen | 1 | 0.88h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S6 40mm | Apple Watch S6 40mm Glass Screen | 2 | 1.37h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S6 40mm | Apple Watch S6 40mm Heart Rate Monitor | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm Rear Housing | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm Speaker Flex | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S6 44mm | Apple Watch S6 44mm | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S6 44mm | Apple Watch S6 44mm Battery | 2 | 1.44h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S6 44mm | Apple Watch S6 44mm Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S6 44mm | Apple Watch S6 44mm Display Screen | 6 | 0.73h | 2.00h | 0.73h | lower-than-default | time-tracking |
| Apple Watch S6 44mm | Apple Watch S6 44mm Glass Screen | 7 | 0.77h | 2.00h | 0.77h | lower-than-default | time-tracking |
| Apple Watch S6 44mm | Apple Watch S6 44mm Heart Rate Monitor | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S6 44mm | Apple Watch S6 44mm Rear Housing | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S6 44mm | Apple Watch S6 44mm Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S7 41MM | Apple Watch S7 41MM | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S7 41MM | Apple Watch S7 41MM Battery | 1 | 0.20h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S7 41MM | Apple Watch S7 41MM Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S7 41MM | Apple Watch S7 41MM Display Screen | 1 | 1.16h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S7 41MM | Apple Watch S7 41MM Glass Screen | 1 | 1.16h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S7 41MM | Apple Watch S7 41MM Heart Rate Monitor | 1 | 0.76h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S7 41MM | Apple Watch S7 41MM Rear Housing | 1 | 0.76h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S7 41MM | Apple Watch S7 41MM Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S7 45MM | Apple Watch S7 45MM | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S7 45MM | Apple Watch S7 45MM Battery | 2 | 0.38h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S7 45MM | Apple Watch S7 45MM Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S7 45MM | Apple Watch S7 45MM Display Screen | 4 | 0.37h | 2.00h | 0.37h | lower-than-default | status-activity, time-tracking |
| Apple Watch S7 45MM | Apple Watch S7 45MM Glass Screen | 4 | 0.37h | 2.00h | 0.37h | lower-than-default | status-activity, time-tracking |
| Apple Watch S7 45MM | Apple Watch S7 45MM Heart Rate Monitor | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S7 45MM | Apple Watch S7 45MM Rear Housing | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S7 45MM | Apple Watch S7 45MM Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM Display Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM Glass Screen | 1 | 0.28h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S8 41MM | Apple Watch S8 41MM Heart Rate Monitor | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM Rear Housing | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S8 45MM | Apple Watch S8 45MM | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S8 45MM | Apple Watch S8 45MM Battery | 1 | 0.27h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S8 45MM | Apple Watch S8 45MM Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S8 45MM | Apple Watch S8 45MM Display Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S8 45MM | Apple Watch S8 45MM Glass Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S8 45MM | Apple Watch S8 45MM Heart Rate Monitor | 1 | 1.52h | 2.00h | 2.00h | aligned | time-tracking |
| Apple Watch S8 45MM | Apple Watch S8 45MM Rear Housing | 1 | 1.52h | 2.00h | 2.00h | aligned | time-tracking |
| Apple Watch S8 45MM | Apple Watch S8 45MM Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S9 41MM | Apple Watch S9 41MM | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S9 41MM | Apple Watch S9 41MM Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S9 41MM | Apple Watch S9 41MM Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S9 41MM | Apple Watch S9 41MM Display Screen | 1 | 0.30h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S9 41MM | Apple Watch S9 41MM Glass Screen | 2 | 1.18h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch S9 41MM | Apple Watch S9 41MM Heart Rate Monitor | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S9 41MM | Apple Watch S9 41MM Rear Housing | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S9 41MM | Apple Watch S9 41MM Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S9 45MM | Apple Watch S9 45MM | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S9 45MM | Apple Watch S9 45MM Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S9 45MM | Apple Watch S9 45MM Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S9 45MM | Apple Watch S9 45MM Display Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S9 45MM | Apple Watch S9 45MM Glass Screen | 1 | 22.37h | 2.00h | 2.00h | higher-than-default | status-activity |
| Apple Watch S9 45MM | Apple Watch S9 45MM Heart Rate Monitor | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S9 45MM | Apple Watch S9 45MM Rear Housing | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch S9 45MM | Apple Watch S9 45MM Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE 40mm | Apple Watch SE 40mm | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE 40mm | Apple Watch SE 40mm Battery | 20 | 0.65h | 2.00h | 0.65h | lower-than-default | time-tracking |
| Apple Watch SE 40mm | Apple Watch SE 40mm Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE 40mm | Apple Watch SE 40mm Display Screen | 20 | 0.65h | 2.00h | 0.65h | lower-than-default | time-tracking |
| Apple Watch SE 40mm | Apple Watch SE 40mm Glass Screen | 22 | 0.67h | 2.00h | 0.67h | lower-than-default | date-columns, status-activity, time-tracking |
| Apple Watch SE 40mm | Apple Watch SE 40mm Heart Rate Monitor | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE 40mm | Apple Watch SE 40mm Rear Housing | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE 40mm | Apple Watch SE 40mm Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE 44mm | Apple Watch SE 44mm | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE 44mm | Apple Watch SE 44MM Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE 44mm | Apple Watch SE 44MM Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE 44mm | Apple Watch SE 44mm Display Screen | 12 | 0.60h | 2.00h | 0.60h | lower-than-default | time-tracking |
| Apple Watch SE 44mm | Apple Watch SE 44MM Glass Screen | 13 | 0.62h | 2.00h | 0.62h | lower-than-default | time-tracking |
| Apple Watch SE 44mm | Apple Watch SE 44mm Heart Rate Monitor | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE 44mm | Apple Watch SE 44mm Rear Housing | 1 | 0.98h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch SE 44mm | Apple Watch SE 44MM Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Display Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Glass Screen | 1 | 0.76h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Heart Rate Monitor | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Rear Housing | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Display Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Glass Screen | 2 | 1.15h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Heart Rate Monitor | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Rear Housing | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch Ultra | Apple Watch Ultra | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch Ultra | Apple Watch Ultra  Display Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch Ultra | Apple Watch Ultra Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch Ultra | Apple Watch Ultra Crown | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch Ultra | Apple Watch Ultra Glass Screen | 1 | 1.04h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch Ultra | Apple Watch Ultra Heart Rate Monitor | 1 | 0.88h | 2.00h | 2.00h | lower-than-default | time-tracking |
| Apple Watch Ultra | Apple Watch Ultra Rear Housing | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Apple Watch Ultra | Apple Watch Ultra Side Button | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Index Items | iPad Pro 13 (7G) | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| Index Items | Other Device Other Repair | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad 10 | iPad 10 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad 10 | iPad 10 Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad 10 | iPad 10 Charging Port | 1 | 0.86h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad 10 | iPad 10 Display Screen | 2 | 0.94h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad 10 | iPad 10 Glass Screen | 4 | 0.82h | 1.50h | 0.82h | lower-than-default | time-tracking |
| iPad 4 | iPad 4 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad 4 | iPad 4 Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad 4 | iPad 4 Charging Port | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad 4 | iPad 4 Display Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad 4 | iPad 4 Glass and Touch Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad 5 | iPad 5 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad 5 | iPad 5 Battery | 1 | 0.64h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad 5 | iPad 5 Charging Port | 2 | 0.58h | 1.50h | 1.50h | lower-than-default | status-activity, time-tracking |
| iPad 5 | iPad 5 Display Screen | 1 | 2.38h | 1.50h | 1.50h | higher-than-default | date-columns |
| iPad 5 | iPad 5 Glass and Touch Screen | 4 | 0.85h | 1.50h | 0.85h | lower-than-default | time-tracking |
| iPad 5 | iPad 5 Glass Screen | 4 | 0.85h | 1.50h | 0.85h | lower-than-default | time-tracking |
| iPad 6 | iPad 6 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad 6 | iPad 6 Battery | 1 | 0.64h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad 6 | iPad 6 Charging Port | 1 | 0.14h | 1.50h | 1.50h | lower-than-default | date-columns |
| iPad 6 | iPad 6 Display Screen | 1 | 1.19h | 1.50h | 1.50h | aligned | time-tracking |
| iPad 6 | iPad 6 Glass and Touch Screen | 5 | 0.84h | 1.50h | 0.84h | lower-than-default | time-tracking |
| iPad 6 | iPad 6 Glass Screen | 5 | 0.84h | 1.50h | 0.84h | lower-than-default | time-tracking |
| iPad 7 | iPad 7 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad 7 | iPad 7 Battery | 1 | 0.64h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad 7 | iPad 7 Charging Port | 2 | 1.55h | 1.50h | 1.50h | aligned | status-activity, time-tracking |
| iPad 7 | iPad 7 Display Screen | 7 | 0.85h | 1.50h | 0.85h | lower-than-default | time-tracking |
| iPad 7 | iPad 7 Glass Screen | 11 | 0.97h | 1.50h | 0.97h | lower-than-default | time-tracking |
| iPad 8 | iPad 8 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad 8 | iPad 8 Battery | 1 | 0.64h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad 8 | iPad 8 Charging Port | 4 | 1.08h | 1.50h | 1.08h | lower-than-default | status-activity, time-tracking |
| iPad 8 | iPad 8 Display Screen | 7 | 0.85h | 1.50h | 0.85h | lower-than-default | time-tracking |
| iPad 8 | iPad 8 Glass and Touch Screen | 11 | 0.97h | 1.50h | 0.97h | lower-than-default | time-tracking |
| iPad 8 | iPad 8 Glass Screen | 12 | 0.97h | 1.50h | 0.97h | lower-than-default | time-tracking |
| iPad 9 | iPad 9 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad 9 | iPad 9 Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad 9 | iPad 9 Charging Port | 8 | 0.49h | 1.50h | 0.49h | lower-than-default | time-tracking |
| iPad 9 | iPad 9 Display Screen | 8 | 0.72h | 1.50h | 0.72h | lower-than-default | time-tracking |
| iPad 9 | iPad 9 Glass and Touch Screen | 38 | 0.84h | 1.50h | 0.84h | lower-than-default | time-tracking |
| iPad 9 | iPad 9 Glass Screen | 41 | 0.84h | 1.50h | 0.84h | lower-than-default | time-tracking |
| iPad 9 | iPad Logic Board Repair | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Air | iPad Air | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Air | iPad Air Battery | 1 | 0.64h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad Air | iPad Air Charging Port | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Air | iPad Air Display Screen | 2 | 1.54h | 1.50h | 1.50h | aligned | date-columns, time-tracking |
| iPad Air | iPad Air Glass Screen | 4 | 0.85h | 1.50h | 0.85h | lower-than-default | time-tracking |
| iPad Air 2 | iPad Air 2 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Air 2 | iPad Air 2 Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Air 2 | iPad Air 2 Charging Port | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Air 2 | iPad Air 2 Display Screen | 1 | 3.41h | 1.50h | 1.50h | higher-than-default | time-tracking |
| iPad Air 2 | iPad Air 2 Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Air 3 | iPad Air 3 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Air 3 | iPad Air 3 Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Air 3 | iPad Air 3 Charging Port | 1 | 2.68h | 1.50h | 1.50h | higher-than-default | date-columns |
| iPad Air 3 | iPad Air 3 Display Screen | 1 | 0.67h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad Air 3 | iPad Air 3 Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Air 4 | iPad Air 4 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Air 4 | iPad Air 4 Battery | 2 | 2.51h | 1.50h | 1.50h | higher-than-default | time-tracking |
| iPad Air 4 | iPad Air 4 Charging Port | 2 | 1.18h | 1.50h | 1.50h | aligned | time-tracking |
| iPad Air 4 | iPad Air 4 Display Screen | 6 | 0.94h | 1.50h | 0.94h | lower-than-default | time-tracking |
| iPad Air 4 | iPad Air 4 Glass Screen | 1 | 0.94h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad Air 5 | iPad Air 5 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Air 5 | iPad Air 5 Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Air 5 | iPad Air 5 Charging Port | 3 | 0.72h | 1.50h | 0.72h | lower-than-default | date-columns, status-activity, time-tracking |
| iPad Air 5 | iPad Air 5 Display Screen | 7 | 1.02h | 1.50h | 1.02h | lower-than-default | time-tracking |
| iPad Air 5 | iPad Air 5 Glass Screen | 1 | 2.38h | 1.50h | 1.50h | higher-than-default | date-columns |
| iPad Air 6 (13) | iPad Air 6 (13) Screen | 3 | 2.09h | 1.50h | 2.09h | higher-than-default | time-tracking |
| iPad Air 7 (13) | iPad Air 7 (13) Screen | 3 | 2.20h | 1.50h | 2.20h | higher-than-default | time-tracking |
| iPad Mini 2 | iPad Mini 2 Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 2 | iPad Mini 2 Charging Port | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 2 | iPad Mini 2 Display Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 2 | iPad Mini 2 Glass and Touch | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 2 | iPad Mini 2 Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 3 | iPad Mini 3 Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 3 | iPad Mini 3 Charging Port | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 3 | iPad Mini 3 Display Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 3 | iPad Mini 3 Glass and Touch | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 3 | iPad Mini 3 Glass Screen | 1 | 1.41h | 1.50h | 1.50h | aligned | time-tracking |
| iPad Mini 4 | iPad Mini 4 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 4 | iPad Mini 4 Battery | 1 | 0.52h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad Mini 4 | iPad Mini 4 Charging Port | 2 | 1.18h | 1.50h | 1.50h | aligned | time-tracking |
| iPad Mini 4 | iPad Mini 4 Display Screen | 1 | 1.39h | 1.50h | 1.50h | aligned | time-tracking |
| iPad Mini 4 | iPad Mini 4 Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 5 | iPad Mini 5 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 5 | iPad Mini 5 Battery | 1 | 0.75h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad Mini 5 | iPad Mini 5 Charging Port | 1 | 0.13h | 1.50h | 1.50h | lower-than-default | status-activity |
| iPad Mini 5 | iPad Mini 5 Display Screen | 5 | 0.90h | 1.50h | 0.90h | lower-than-default | status-activity, time-tracking |
| iPad Mini 5 | iPad Mini 5 Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 6 | iPad Mini 6 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 6 | iPad Mini 6 Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 6 | iPad Mini 6 Charging Port | 4 | 0.90h | 1.50h | 0.90h | lower-than-default | time-tracking |
| iPad Mini 6 | iPad Mini 6 Display Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Mini 6 | iPad Mini 6 Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 10.5 | iPad Pro 10.5 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 10.5 | iPad Pro 10.5 Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 10.5 | iPad Pro 10.5 Charging Port | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 10.5 | iPad Pro 10.5 Display Screen | 1 | 3.44h | 1.50h | 1.50h | higher-than-default | time-tracking |
| iPad Pro 10.5 | iPad Pro 10.5 Glass Screen | 2 | 0.75h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Charging Port | 3 | 0.69h | 1.50h | 0.69h | lower-than-default | time-tracking |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Display Screen | 4 | 0.54h | 1.50h | 0.54h | lower-than-default | time-tracking |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Charging Port | 3 | 0.69h | 1.50h | 0.69h | lower-than-default | time-tracking |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Display Screen | 5 | 0.85h | 1.50h | 0.85h | lower-than-default | time-tracking |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Glass Screen | 1 | 2.06h | 1.50h | 1.50h | higher-than-default | time-tracking |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) Battery | 2 | 3.31h | 1.50h | 1.50h | higher-than-default | time-tracking |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) Charging Port | 8 | 0.73h | 1.50h | 0.73h | lower-than-default | time-tracking |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) Display Screen | 9 | 1.76h | 1.50h | 1.76h | aligned | date-columns, time-tracking |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Charging Port | 7 | 0.89h | 1.50h | 0.89h | lower-than-default | time-tracking |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Display Screen | 1 | 2.92h | 1.50h | 1.50h | higher-than-default | time-tracking |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 11 (5G) | iPad Pro 11 (5G) Charging Port | 2 | 0.99h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad Pro 11 (5G) | iPad Pro 11 (5G) Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Charging Port | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Display Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Battery | 2 | 0.84h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Charging Port | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Display Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (3G) | iPad Pro 11 (3G) Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Battery | 3 | 3.05h | 1.50h | 3.05h | higher-than-default | time-tracking |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Charging Port | 8 | 0.56h | 1.50h | 0.56h | lower-than-default | status-activity, time-tracking |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Display Screen | 13 | 1.54h | 1.50h | 1.54h | aligned | time-tracking |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Battery | 3 | 3.05h | 1.50h | 3.05h | higher-than-default | time-tracking |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Charging Port | 7 | 0.56h | 1.50h | 0.56h | lower-than-default | status-activity, time-tracking |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Display Screen | 11 | 1.68h | 1.50h | 1.68h | aligned | time-tracking |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Glass Screen | 1 | 1.35h | 1.50h | 1.50h | aligned | time-tracking |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Battery | 1 | 1.64h | 1.50h | 1.50h | aligned | time-tracking |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Charging Port | 6 | 1.03h | 1.50h | 1.03h | lower-than-default | time-tracking |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Display Screen | 7 | 2.07h | 1.50h | 2.07h | higher-than-default | time-tracking |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Battery | 2 | 1.03h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Charging Port | 6 | 1.03h | 1.50h | 1.03h | lower-than-default | time-tracking |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Display Screen | 7 | 2.07h | 1.50h | 2.07h | higher-than-default | time-tracking |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 13 (7G) | iPad Pro 13 (7G) Screen | 1 | 1.16h | 1.50h | 1.50h | aligned | time-tracking |
| iPad Pro 9.7 | iPad Pro 9.7 | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 9.7 | iPad Pro 9.7 Battery | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 9.7 | iPad Pro 9.7 Charging Port | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 9.7 | iPad Pro 9.7 Display Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPad Pro 9.7 | iPad Pro 9.7 Glass Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPhone 11 | iPhone 11 | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 | iPhone 11 Battery | 5 | 0.35h | 1.00h | 0.35h | lower-than-default | time-tracking |
| iPhone 11 | iPhone 11 Charging Port | 3 | 0.52h | 1.00h | 0.52h | lower-than-default | time-tracking |
| iPhone 11 | iPhone 11 Earpiece Speaker | 3 | 0.52h | 1.00h | 0.52h | lower-than-default | time-tracking |
| iPhone 11 | iPhone 11 Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 | iPhone 11 Microphone | 2 | 0.52h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 11 | iPhone 11 Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 | iPhone 11 NO SERVICE (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 11 | iPhone 11 NO WIFI (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 11 | iPhone 11 Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 | iPhone 11 Rear Camera | 1 | 0.49h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 11 | iPhone 11 Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 | iPhone 11 Rear Housing (Rear Glass And Frame) | 2 | 0.62h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 11 | iPhone 11 Screen | 15 | 0.46h | 1.00h | 0.46h | lower-than-default | status-activity, time-tracking |
| iPhone 11 | iPhone 11 UNABLE TO ACTIVATE | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 11 | iPhone 11 Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 Pro | iPhone 11 Pro | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 Pro | iPhone 11 Pro Battery | 6 | 0.30h | 1.00h | 0.30h | lower-than-default | time-tracking |
| iPhone 11 Pro | iPhone 11 Pro Charging Port | 2 | 0.73h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 11 Pro | iPhone 11 Pro Earpiece Speaker | 1 | 0.17h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 11 Pro | iPhone 11 Pro Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 Pro | iPhone 11 Pro Microphone | 2 | 0.73h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 11 Pro | iPhone 11 Pro Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 Pro | iPhone 11 Pro NO SERVICE (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 11 Pro | iPhone 11 Pro NO WIFI (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 11 Pro | iPhone 11 Pro Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 Pro | iPhone 11 Pro Rear Camera | 1 | 0.32h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 11 Pro | iPhone 11 Pro Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 Pro | iPhone 11 Pro Rear Housing (Rear Glass And Frame) | 2 | 0.78h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 11 Pro | iPhone 11 Pro Screen | 9 | 0.61h | 1.00h | 0.61h | lower-than-default | status-activity, time-tracking |
| iPhone 11 Pro | iPhone 11 Pro UNABLE TO ACTIVATE | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 11 Pro | iPhone 11 Pro Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max Battery | 6 | 0.50h | 1.00h | 0.50h | lower-than-default | status-activity, time-tracking |
| iPhone 11 Pro Max | iPhone 11 Pro Max Charging Port | 1 | 0.73h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 11 Pro Max | iPhone 11 Pro Max Earpiece Speaker | 2 | 0.30h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 11 Pro Max | iPhone 11 Pro Max Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max NO SERVICE (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 11 Pro Max | iPhone 11 Pro Max NO WIFI (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 11 Pro Max | iPhone 11 Pro Max Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max Rear Camera | 1 | 0.32h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 11 Pro Max | iPhone 11 Pro Max Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max Rear Housing (Rear Glass And Frame) | 4 | 0.46h | 1.00h | 0.46h | lower-than-default | time-tracking |
| iPhone 11 Pro Max | iPhone 11 Pro Max Screen | 11 | 0.45h | 1.00h | 0.45h | lower-than-default | status-activity, time-tracking |
| iPhone 11 Pro Max | iPhone 11 Pro Max UNABLE TO ACTIVATE | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 11 Pro Max | iPhone 11 Pro Max Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 | iPhone 12 | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 | iPhone 12 Battery | 30 | 0.31h | 1.00h | 0.31h | lower-than-default | date-columns, status-activity, time-tracking |
| iPhone 12 | iPhone 12 Charging Port | 4 | 0.37h | 1.00h | 0.37h | lower-than-default | date-columns, time-tracking |
| iPhone 12 | iPhone 12 Earpiece Speaker | 7 | 0.39h | 1.00h | 0.39h | lower-than-default | time-tracking |
| iPhone 12 | iPhone 12 Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 | iPhone 12 Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 | iPhone 12 Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 | iPhone 12 Mute Button | 1 | 168.26h | 1.00h | 1.00h | higher-than-default | date-columns |
| iPhone 12 | iPhone 12 NO SERVICE (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 12 | iPhone 12 NO WIFI (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 12 | iPhone 12 Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 | iPhone 12 Rear Camera | 1 | 0.34h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 12 | iPhone 12 Rear Camera Lens | 5 | 0.51h | 1.00h | 0.51h | lower-than-default | status-activity, time-tracking |
| iPhone 12 | iPhone 12 Rear Housing (Rear Glass And Frame) | 5 | 0.48h | 1.00h | 0.48h | lower-than-default | time-tracking |
| iPhone 12 | iPhone 12 Screen | 11 | 0.74h | 1.00h | 0.74h | lower-than-default | status-activity, time-tracking |
| iPhone 12 | iPhone 12 UNABLE TO ACTIVATE | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 12 | iPhone 12 Volume Button | 1 | 168.26h | 1.00h | 1.00h | higher-than-default | date-columns |
| iPhone 12 Mini | iPhone 12 Mini | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Mini | iPhone 12 Mini Battery | 9 | 0.31h | 1.00h | 0.31h | lower-than-default | status-activity, time-tracking |
| iPhone 12 Mini | iPhone 12 Mini Charging Port | 1 | 0.14h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 12 Mini | iPhone 12 Mini Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Mini | iPhone 12 Mini Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Mini | iPhone 12 Mini Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Mini | iPhone 12 Mini Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Mini | iPhone 12 Mini Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Mini | iPhone 12 Mini NO SERVICE (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 12 Mini | iPhone 12 Mini NO WIFI (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 12 Mini | iPhone 12 Mini Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Mini | iPhone 12 Mini Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Mini | iPhone 12 Mini Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Mini | iPhone 12 Mini Rear Housing (Rear Glass And Frame) | 1 | 0.60h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 12 Mini | iPhone 12 Mini Screen | 2 | 0.60h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 12 Mini | iPhone 12 Mini Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Mini | iPhone 12 UNABLE TO ACTIVATE | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 12 Pro | iPhone 12 Pro | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Pro | iPhone 12 Pro Battery | 33 | 0.33h | 1.00h | 0.33h | lower-than-default | date-columns, status-activity, time-tracking |
| iPhone 12 Pro | iPhone 12 Pro Charging Port | 2 | 0.37h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 12 Pro | iPhone 12 Pro Earpiece Speaker | 8 | 0.37h | 1.00h | 0.37h | lower-than-default | time-tracking |
| iPhone 12 Pro | iPhone 12 Pro Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Pro | iPhone 12 Pro Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Pro | iPhone 12 Pro Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Pro | iPhone 12 Pro Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Pro | iPhone 12 Pro NO SERVICE (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 12 Pro | iPhone 12 Pro NO WIFI (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 12 Pro | iPhone 12 Pro Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Pro | iPhone 12 Pro Rear Camera | 4 | 0.51h | 1.00h | 0.51h | lower-than-default | time-tracking |
| iPhone 12 Pro | iPhone 12 Pro Rear Camera Lens | 5 | 0.51h | 1.00h | 0.51h | lower-than-default | status-activity, time-tracking |
| iPhone 12 Pro | iPhone 12 Pro Rear Housing (Rear Glass And Frame) | 1 | 0.29h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 12 Pro | iPhone 12 Pro Screen | 11 | 0.74h | 1.00h | 0.74h | lower-than-default | status-activity, time-tracking |
| iPhone 12 Pro | iPhone 12 Pro UNABLE TO ACTIVATE | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 12 Pro | iPhone 12 Pro Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max Battery | 10 | 0.47h | 1.00h | 0.47h | lower-than-default | status-activity, time-tracking |
| iPhone 12 Pro Max | iPhone 12 Pro Max Charging Port | 1 | 0.85h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 12 Pro Max | iPhone 12 Pro Max Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max Microphone | 1 | 0.85h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 12 Pro Max | iPhone 12 Pro Max Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max NO SERVICE (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 12 Pro Max | iPhone 12 Pro Max NO WIFI (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 12 Pro Max | iPhone 12 Pro Max Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max Rear Camera | 3 | 0.85h | 1.00h | 0.85h | aligned | time-tracking |
| iPhone 12 Pro Max | iPhone 12 Pro Max Rear Camera Lens | 5 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 12 Pro Max | iPhone 12 Pro Max Rear Housing (Rear Glass And Frame) | 4 | 0.67h | 1.00h | 0.67h | lower-than-default | time-tracking |
| iPhone 12 Pro Max | iPhone 12 Pro Max Screen | 7 | 0.62h | 1.00h | 0.62h | lower-than-default | status-activity, time-tracking |
| iPhone 12 Pro Max | iPhone 12 Pro Max UNABLE TO ACTIVATE | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone 12 Pro Max | iPhone 12 Pro Max Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 | iPhone 13 | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 | iPhone 13 Battery | 29 | 0.29h | 1.00h | 0.29h | lower-than-default | status-activity, time-tracking |
| iPhone 13 | iPhone 13 Charging Port | 12 | 0.22h | 1.00h | 0.22h | lower-than-default | status-activity, time-tracking |
| iPhone 13 | iPhone 13 Earpiece Speaker | 3 | 0.39h | 1.00h | 0.39h | lower-than-default | status-activity, time-tracking |
| iPhone 13 | iPhone 13 Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 | iPhone 13 Loudspeaker | 1 | 0.11h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 13 | iPhone 13 Microphone | 2 | 0.62h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 13 | iPhone 13 Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 | iPhone 13 Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 | iPhone 13 Rear Camera | 7 | 0.51h | 1.00h | 0.51h | lower-than-default | time-tracking |
| iPhone 13 | iPhone 13 Rear Camera Lens | 4 | 0.48h | 1.00h | 0.48h | lower-than-default | time-tracking |
| iPhone 13 | iPhone 13 Rear Housing (Rear Glass And Frame) | 3 | 0.68h | 1.00h | 0.68h | lower-than-default | time-tracking |
| iPhone 13 | iPhone 13 Screen | 15 | 0.31h | 1.00h | 0.31h | lower-than-default | status-activity, time-tracking |
| iPhone 13 | iPhone 13 Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Mini | iPhone 13 Mini | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Mini | iPhone 13 Mini Battery | 11 | 0.38h | 1.00h | 0.38h | lower-than-default | status-activity, time-tracking |
| iPhone 13 Mini | iPhone 13 Mini Charging Port | 2 | 0.37h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 13 Mini | iPhone 13 Mini Earpiece Speaker | 1 | 0.54h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 13 Mini | iPhone 13 Mini Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Mini | iPhone 13 Mini Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Mini | iPhone 13 Mini Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Mini | iPhone 13 Mini Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Mini | iPhone 13 Mini Power Button | 1 | 0.22h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 13 Mini | iPhone 13 Mini Rear Camera | 7 | 0.51h | 1.00h | 0.51h | lower-than-default | time-tracking |
| iPhone 13 Mini | iPhone 13 Mini Rear Camera Lens | 4 | 0.43h | 1.00h | 0.43h | lower-than-default | time-tracking |
| iPhone 13 Mini | iPhone 13 Mini Rear Housing (Rear Glass And Frame) | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Mini | iPhone 13 Mini Screen | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Mini | iPhone 13 Mini Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Pro | iPhone 13 Pro | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Pro | iPhone 13 Pro Battery | 20 | 0.29h | 1.00h | 0.29h | lower-than-default | status-activity, time-tracking |
| iPhone 13 Pro | iPhone 13 Pro Charging Port | 6 | 0.14h | 1.00h | 0.14h | lower-than-default | time-tracking |
| iPhone 13 Pro | iPhone 13 Pro Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Pro | iPhone 13 Pro Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Pro | iPhone 13 Pro Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Pro | iPhone 13 Pro Microphone | 1 | 0.92h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 13 Pro | iPhone 13 Pro Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Pro | iPhone 13 Pro Power Button | 1 | 0.86h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 13 Pro | iPhone 13 Pro Rear Camera | 8 | 0.53h | 1.00h | 0.53h | lower-than-default | time-tracking |
| iPhone 13 Pro | iPhone 13 Pro Rear Camera Lens | 5 | 0.33h | 1.00h | 0.33h | lower-than-default | status-activity, time-tracking |
| iPhone 13 Pro | iPhone 13 Pro Rear Housing (Rear Glass And Frame) | 8 | 0.72h | 1.00h | 0.72h | lower-than-default | status-activity, time-tracking |
| iPhone 13 Pro | iPhone 13 Pro Screen | 5 | 1.09h | 1.00h | 1.09h | aligned | time-tracking |
| iPhone 13 Pro | iPhone 13 Pro Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max Battery | 6 | 0.35h | 1.00h | 0.35h | lower-than-default | time-tracking |
| iPhone 13 Pro Max | iPhone 13 Pro Max Charging Port | 2 | 0.47h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 13 Pro Max | iPhone 13 Pro Max Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max Rear Camera | 8 | 0.53h | 1.00h | 0.53h | lower-than-default | time-tracking |
| iPhone 13 Pro Max | iPhone 13 Pro Max Rear Camera Lens | 1 | 0.65h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 13 Pro Max | iPhone 13 Pro Max Rear Housing (Rear Glass And Frame) | 4 | 0.39h | 1.00h | 0.39h | lower-than-default | time-tracking |
| iPhone 13 Pro Max | iPhone 13 Pro Max Screen | 3 | 0.48h | 1.00h | 0.48h | lower-than-default | date-columns, time-tracking |
| iPhone 13 Pro Max | iPhone 13 Pro Max Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 | iPhone 14 | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 | iPhone 14 Battery | 5 | 0.37h | 1.00h | 0.37h | lower-than-default | status-activity, time-tracking |
| iPhone 14 | iPhone 14 Charging Port | 4 | 0.22h | 1.00h | 0.22h | lower-than-default | time-tracking |
| iPhone 14 | iPhone 14 Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 | iPhone 14 Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 | iPhone 14 Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 | iPhone 14 Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 | iPhone 14 Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 | iPhone 14 Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 | iPhone 14 Rear Camera | 1 | 1.11h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 14 | iPhone 14 Rear Camera Lens | 1 | 1.11h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 14 | iPhone 14 Rear Glass | 2 | 0.57h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 14 | iPhone 14 Rear Housing | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 | iPhone 14 Screen | 6 | 0.63h | 1.00h | 0.63h | lower-than-default | time-tracking |
| iPhone 14 | iPhone 14 Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Plus | iPhone 14 Plus | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Plus | iPhone 14 Plus Battery | 1 | 0.51h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 14 Plus | iPhone 14 Plus Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Plus | iPhone 14 Plus Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Plus | iPhone 14 Plus Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Plus | iPhone 14 Plus Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Plus | iPhone 14 Plus Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Plus | iPhone 14 Plus Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Plus | iPhone 14 Plus Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Plus | iPhone 14 Plus Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Plus | iPhone 14 Plus Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Plus | iPhone 14 Plus Rear Glass | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Plus | iPhone 14 Plus Rear Housing | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Plus | iPhone 14 Plus Screen | 3 | 0.86h | 1.00h | 0.86h | aligned | status-activity, time-tracking |
| iPhone 14 Plus | iPhone 14 Plus Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Pro | iPhone 14 Pro | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Pro | iPhone 14 Pro Battery | 23 | 0.36h | 1.00h | 0.36h | lower-than-default | status-activity, time-tracking |
| iPhone 14 Pro | iPhone 14 Pro Charging Port | 12 | 0.46h | 1.00h | 0.46h | lower-than-default | status-activity, time-tracking |
| iPhone 14 Pro | iPhone 14 Pro Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Pro | iPhone 14 Pro Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Pro | iPhone 14 Pro Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Pro | iPhone 14 Pro Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Pro | iPhone 14 Pro Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Pro | iPhone 14 Pro Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Pro | iPhone 14 Pro Rear Camera | 4 | 0.62h | 1.00h | 0.62h | lower-than-default | time-tracking |
| iPhone 14 Pro | iPhone 14 Pro Rear Camera Lens | 4 | 0.62h | 1.00h | 0.62h | lower-than-default | status-activity, time-tracking |
| iPhone 14 Pro | iPhone 14 Pro Rear Housing (Rear Glass And Frame) | 13 | 0.66h | 1.00h | 0.66h | lower-than-default | status-activity, time-tracking |
| iPhone 14 Pro | iPhone 14 Pro Screen | 4 | 0.54h | 1.00h | 0.54h | lower-than-default | time-tracking |
| iPhone 14 Pro | iPhone 14 Pro Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Pro Max | iPhone 14 Pro Max | 2 | 0.33h | 1.00h | 1.00h | lower-than-default | status-activity, time-tracking |
| iPhone 14 Pro Max | iPhone 14 Pro Max Battery | 7 | 0.37h | 1.00h | 0.37h | lower-than-default | time-tracking |
| iPhone 14 Pro Max | iPhone 14 Pro Max Charging Port | 8 | 0.44h | 1.00h | 0.44h | lower-than-default | status-activity, time-tracking |
| iPhone 14 Pro Max | iPhone 14 Pro Max Earpiece Speaker | 1 | 1.24h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 14 Pro Max | iPhone 14 Pro Max Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Pro Max | iPhone 14 Pro Max Loudspeaker | 1 | 1.24h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 14 Pro Max | iPhone 14 Pro Max Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Pro Max | iPhone 14 Pro Max Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Pro Max | iPhone 14 Pro Max Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 14 Pro Max | iPhone 14 Pro Max Rear Camera | 2 | 0.33h | 1.00h | 1.00h | lower-than-default | status-activity, time-tracking |
| iPhone 14 Pro Max | iPhone 14 Pro Max Rear Camera Lens | 6 | 0.37h | 1.00h | 0.37h | lower-than-default | date-columns, status-activity, time-tracking |
| iPhone 14 Pro Max | iPhone 14 Pro Max Rear Housing (Rear Glass And Frame) | 9 | 0.56h | 1.00h | 0.56h | lower-than-default | time-tracking |
| iPhone 14 Pro Max | iPhone 14 Pro Max Screen | 5 | 0.52h | 1.00h | 0.52h | lower-than-default | time-tracking |
| iPhone 14 Pro Max | iPhone 14 Pro Max Volume Button | 1 | 0.94h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 15 | iPhone 15 | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 | iPhone 15 Battery | 1 | 0.56h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 15 | iPhone 15 Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 | iPhone 15 Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 | iPhone 15 Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 | iPhone 15 Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 | iPhone 15 Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 | iPhone 15 Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 | iPhone 15 Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 | iPhone 15 Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 | iPhone 15 Rear Glass | 1 | 0.44h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 15 | iPhone 15 Rear Housing | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 | iPhone 15 Screen | 4 | 0.87h | 1.00h | 0.87h | aligned | status-activity, time-tracking |
| iPhone 15 | iPhone 15 Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Plus | iPhone 15 Plus | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Plus | iPhone 15 Plus Battery | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Plus | iPhone 15 Plus Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Plus | iPhone 15 Plus Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Plus | iPhone 15 Plus Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Plus | iPhone 15 Plus Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Plus | iPhone 15 Plus Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Plus | iPhone 15 Plus Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Plus | iPhone 15 Plus Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Plus | iPhone 15 Plus Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Plus | iPhone 15 Plus Rear Glass | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Plus | iPhone 15 Plus Rear Housing | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Plus | iPhone 15 Plus Screen | 1 | 0.02h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 15 Plus | iPhone 15 Plus Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro | iPhone 15 Pro | 1 | 0.42h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 15 Pro | iPhone 15 Pro Battery | 4 | 0.26h | 1.00h | 0.26h | lower-than-default | status-activity, time-tracking |
| iPhone 15 Pro | iPhone 15 Pro Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro | iPhone 15 Pro Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro | iPhone 15 Pro Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro | iPhone 15 Pro Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro | iPhone 15 Pro Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro | iPhone 15 Pro Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro | iPhone 15 Pro Rear Camera | 2 | 0.93h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 15 Pro | iPhone 15 Pro Rear Camera Lens | 2 | 0.23h | 1.00h | 1.00h | lower-than-default | date-columns, time-tracking |
| iPhone 15 Pro | iPhone 15 Pro Rear Glass | 7 | 0.64h | 1.00h | 0.64h | lower-than-default | time-tracking |
| iPhone 15 Pro | iPhone 15 Pro Rear Housing | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro | iPhone 15 Pro Screen | 7 | 0.69h | 1.00h | 0.69h | lower-than-default | status-activity, time-tracking |
| iPhone 15 Pro | iPhone 15 Pro Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro Max | iPhone 15 Pro Max | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro Max | iPhone 15 Pro Max Battery | 2 | 0.91h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 15 Pro Max | iPhone 15 Pro Max Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro Max | iPhone 15 Pro Max Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro Max | iPhone 15 Pro Max Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro Max | iPhone 15 Pro Max Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro Max | iPhone 15 Pro Max Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro Max | iPhone 15 Pro Max Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro Max | iPhone 15 Pro Max Rear Camera | 2 | 0.88h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 15 Pro Max | iPhone 15 Pro Max Rear Camera Lens | 3 | 0.40h | 1.00h | 0.40h | lower-than-default | time-tracking |
| iPhone 15 Pro Max | iPhone 15 Pro Max Rear Glass | 3 | 1.01h | 1.00h | 1.01h | aligned | time-tracking |
| iPhone 15 Pro Max | iPhone 15 Pro Max Rear Housing | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 15 Pro Max | iPhone 15 Pro Max Screen | 7 | 1.19h | 1.00h | 1.19h | aligned | time-tracking |
| iPhone 15 Pro Max | iPhone 15 Pro Max Volume Button | 1 | 0.78h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 16 | iPhone 16 | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 | iPhone 16 Battery | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 | iPhone 16 Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 | iPhone 16 Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 | iPhone 16 Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 | iPhone 16 Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 | iPhone 16 Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 | iPhone 16 Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 | iPhone 16 Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 | iPhone 16 Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 | iPhone 16 Rear Glass | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 | iPhone 16 Rear Housing | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 | iPhone 16 Screen | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 | iPhone 16 Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Plus | iPhone 16 Plus | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Plus | iPhone 16 Plus Battery | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Plus | iPhone 16 Plus Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Plus | iPhone 16 Plus Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Plus | iPhone 16 Plus Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Plus | iPhone 16 Plus Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Plus | iPhone 16 Plus Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Plus | iPhone 16 Plus Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Plus | iPhone 16 Plus Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Plus | iPhone 16 Plus Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Plus | iPhone 16 Plus Rear Glass | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Plus | iPhone 16 Plus Rear Housing | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Plus | iPhone 16 Plus Screen | 1 | 0.81h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 16 Plus | iPhone 16 Plus Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro | iPhone 16 Pro | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro | iPhone 16 Pro  Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro | iPhone 16 Pro Battery | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro | iPhone 16 Pro Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro | iPhone 16 Pro Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro | iPhone 16 Pro Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro | iPhone 16 Pro Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro | iPhone 16 Pro Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro | iPhone 16 Pro Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro | iPhone 16 Pro Rear Camera Lens | 2 | 0.41h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 16 Pro | iPhone 16 Pro Rear Glass | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro | iPhone 16 Pro Rear Housing | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro | iPhone 16 Pro Screen | 3 | 1.34h | 1.00h | 1.34h | higher-than-default | time-tracking |
| iPhone 16 Pro | iPhone 16 Pro Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro Max | iPhone 16 Pro Max | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro Max | iPhone 16 Pro Max Battery | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro Max | iPhone 16 Pro Max Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro Max | iPhone 16 Pro Max Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro Max | iPhone 16 Pro Max Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro Max | iPhone 16 Pro Max Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro Max | iPhone 16 Pro Max Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro Max | iPhone 16 Pro Max Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro Max | iPhone 16 Pro Max Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro Max | iPhone 16 Pro Max Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro Max | iPhone 16 Pro Max Rear Glass | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro Max | iPhone 16 Pro Max Rear Housing | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 16 Pro Max | iPhone 16 Pro Max Screen | 4 | 0.67h | 1.00h | 0.67h | lower-than-default | time-tracking |
| iPhone 16 Pro Max | iPhone 16 Pro Max Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 | iPhone 6 Battery | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 | iPhone 6 Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 | iPhone 6 Headphone Jack | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 | iPhone 6 Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 | iPhone 6 Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 | iPhone 6 Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 | iPhone 6 Original LCD Screen | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 | iPhone 6 Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 | iPhone 6 Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 | iPhone 6 Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 | iPhone 6 Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 | iPhone 6 Wifi  Module | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 Plus | iPhone 6 Plus Battery | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 Plus | iPhone 6 Plus Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 Plus | iPhone 6 Plus Headphone Jack | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 Plus | iPhone 6 Plus Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 Plus | iPhone 6 Plus Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 Plus | iPhone 6 Plus Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 Plus | iPhone 6 Plus Original LCD Screen | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 Plus | iPhone 6 Plus Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 Plus | iPhone 6 Plus Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 Plus | iPhone 6 Plus Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 Plus | iPhone 6 Plus Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6 Plus | iPhone 6 Plus Wifi  Module | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6S Plus | iPhone 6s Plus Battery | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6S Plus | iPhone 6s Plus Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6S Plus | iPhone 6s Plus Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6S Plus | iPhone 6s Plus Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6S Plus | iPhone 6s Plus Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6S Plus | iPhone 6s Plus Original LCD Screen | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6S Plus | iPhone 6s Plus Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6S Plus | iPhone 6s Plus Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6S Plus | iPhone 6s Plus Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6S Plus | iPhone 6s Plus Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6S Plus | Liquid Damage Treatment | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6S Plus | MacBook Air 13 A2179 Lid Replacement | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6S Plus | MacBook Pro 13 A1708 Bezel Replacement | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Battery | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Charging Port | 1 | 0.40h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 6s, iPhone 5 | iPhone 6s Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Microphone | 1 | 0.40h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 6s, iPhone 5 | iPhone 6s Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Original LCD Screen | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 | iPhone 7 | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 | iPhone 7 Battery | 2 | 0.80h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 7 | iPhone 7 Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 | iPhone 7 Earpiece Speaker | 1 | 0.53h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 7 | iPhone 7 Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 | iPhone 7 Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 | iPhone 7 Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 | iPhone 7 Original LCD Screen | 3 | 0.55h | 1.00h | 0.55h | lower-than-default | time-tracking |
| iPhone 7 | iPhone 7 Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 | iPhone 7 Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 | iPhone 7 Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 | iPhone 7 Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 Plus | iPhone 7 Plus | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 Plus | iPhone 7 Plus Battery | 1 | 0.57h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 7 Plus | iPhone 7 Plus Charging Port | 1 | 0.84h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 7 Plus | iPhone 7 Plus Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 Plus | iPhone 7 Plus Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 Plus | iPhone 7 Plus Microphone | 1 | 0.84h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 7 Plus | iPhone 7 Plus Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 Plus | iPhone 7 Plus Original LCD Screen | 1 | 1.23h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone 7 Plus | iPhone 7 Plus Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 Plus | iPhone 7 Plus Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 Plus | iPhone 7 Plus Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 7 Plus | iPhone 7 Plus Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 | iPhone 8 | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 | iPhone 8 Battery | 2 | 0.41h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 8 | iPhone 8 Charging Port | 6 | 0.39h | 1.00h | 0.39h | lower-than-default | date-columns, time-tracking |
| iPhone 8 | iPhone 8 Earpiece Speaker | 1 | 0.53h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 8 | iPhone 8 Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 | iPhone 8 Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 | iPhone 8 Microphone | 4 | 0.46h | 1.00h | 0.46h | lower-than-default | date-columns, time-tracking |
| iPhone 8 | iPhone 8 Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 | iPhone 8 Original LCD Screen | 96 | 0.32h | 1.00h | 0.32h | lower-than-default | status-activity, time-tracking |
| iPhone 8 | iPhone 8 Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 | iPhone 8 Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 | iPhone 8 Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 | iPhone 8 Rear Housing (Rear Glass And Frame) | 1 | 0.50h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 8 | iPhone 8 Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 Plus | iPhone 8 Plus | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 Plus | iPhone 8 Plus Battery | 1 | 0.31h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone 8 Plus | iPhone 8 Plus Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 Plus | iPhone 8 Plus Display (Original LCD Screen) | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 Plus | iPhone 8 Plus Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 Plus | iPhone 8 Plus Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 Plus | iPhone 8 Plus Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 Plus | iPhone 8 Plus Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 Plus | iPhone 8 Plus Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 Plus | iPhone 8 Plus Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 Plus | iPhone 8 Plus Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 Plus | iPhone 8 Plus Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 Plus | iPhone 8 Plus Rear Housing (Rear Glass And Frame) | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone 8 Plus | iPhone 8 Plus Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE2 | iPhone SE2 | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE2 | iPhone SE2 Battery | 8 | 0.35h | 1.00h | 0.35h | lower-than-default | time-tracking |
| iPhone SE2 | iPhone SE2 Charging Port | 8 | 0.37h | 1.00h | 0.37h | lower-than-default | date-columns, time-tracking |
| iPhone SE2 | iPhone SE2 Display (Original LCD Screen) | 98 | 0.32h | 1.00h | 0.32h | lower-than-default | status-activity, time-tracking |
| iPhone SE2 | iPhone SE2 Earpiece Speaker | 1 | 0.53h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone SE2 | iPhone SE2 Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE2 | iPhone SE2 Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE2 | iPhone SE2 Microphone | 4 | 0.46h | 1.00h | 0.46h | lower-than-default | date-columns, time-tracking |
| iPhone SE2 | iPhone SE2 Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE2 | iPhone SE2 Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE2 | iPhone SE2 Proximity Sensor | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE2 | iPhone SE2 Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE2 | iPhone SE2 Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE2 | iPhone SE2 Rear Housing (Rear Glass And Frame) | 5 | 0.36h | 1.00h | 0.36h | lower-than-default | time-tracking |
| iPhone SE2 | iPhone SE2 Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE2 | iPhone SE2 Wifi Module | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE3 | iPhone SE3 | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE3 | iPhone SE3 Battery | 8 | 0.29h | 1.00h | 0.29h | lower-than-default | status-activity, time-tracking |
| iPhone SE3 | iPhone SE3 Charging Port | 7 | 0.42h | 1.00h | 0.42h | lower-than-default | date-columns, time-tracking |
| iPhone SE3 | iPhone SE3 Earpiece Speaker | 1 | 0.53h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone SE3 | iPhone SE3 Front Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE3 | iPhone SE3 Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE3 | iPhone SE3 Microphone | 4 | 0.46h | 1.00h | 0.46h | lower-than-default | date-columns, time-tracking |
| iPhone SE3 | iPhone SE3 Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE3 | iPhone SE3 Original Apple Screen Assembly | 1 | 0.67h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone SE3 | iPhone SE3 Original LCD Screen | 104 | 0.33h | 1.00h | 0.33h | lower-than-default | date-columns, status-activity, time-tracking |
| iPhone SE3 | iPhone SE3 Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone SE3 | iPhone SE3 Rear Camera | 3 | 0.58h | 1.00h | 0.58h | lower-than-default | time-tracking |
| iPhone SE3 | iPhone SE3 Rear Camera Lens | 1 | 0.16h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone SE3 | iPhone SE3 Rear Housing (Rear Glass And Frame) | 34 | 0.47h | 1.00h | 0.47h | lower-than-default | time-tracking |
| iPhone SE3 | iPhone SE3 Volume Button | 1 | 0.29h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone X | iPhone X | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone X | iPhone X Battery | 4 | 0.29h | 1.00h | 0.29h | lower-than-default | status-activity, time-tracking |
| iPhone X | iPhone X Charging Port | 1 | 0.28h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone X | iPhone X Display (Original OLED Screen) | 8 | 0.98h | 1.00h | 0.98h | aligned | status-activity, time-tracking |
| iPhone X | iPhone X Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone X | iPhone X Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone X | iPhone X Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone X | iPhone X Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone X | iPhone X NO SERVICE (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone X | iPhone X NO WIFI (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone X | iPhone X Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone X | iPhone X Rear Camera | 1 | 1.09h | 1.00h | 1.00h | aligned | time-tracking |
| iPhone X | iPhone X Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone X | iPhone X Rear Housing (Rear Glass And Frame) | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone X | iPhone X UNABLE TO ACTIVATE | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone X | iPhone X Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone X | iPhone X WIFI Module | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XR | iPhone XR | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XR | iPhone XR Battery | 2 | 0.31h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone XR | iPhone XR Charging Port | 3 | 0.61h | 1.00h | 0.61h | lower-than-default | time-tracking |
| iPhone XR | iPhone XR Display (Original LCD Screen) | 5 | 0.22h | 1.00h | 0.22h | lower-than-default | time-tracking |
| iPhone XR | iPhone XR Earpiece Speaker | 1 | 0.08h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone XR | iPhone XR Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XR | iPhone XR Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XR | iPhone XR Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XR | iPhone XR NO SERVICE (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone XR | iPhone XR NO WIFI (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone XR | iPhone XR Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XR | iPhone XR Rear Camera | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XR | iPhone XR Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XR | iPhone XR Rear Housing (Rear Glass And Frame) | 2 | 0.47h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone XR | iPhone XR UNABLE TO ACTIVATE | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone XR | iPhone XR Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XR | iPhone XR WIFI Module | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS | iPhone XS | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS | iPhone XS Battery | 3 | 0.36h | 1.00h | 0.36h | lower-than-default | time-tracking |
| iPhone XS | iPhone XS Charging Port | 3 | 0.36h | 1.00h | 0.36h | lower-than-default | time-tracking |
| iPhone XS | iPhone XS Display (Original OLED Screen) | 4 | 0.24h | 1.00h | 0.24h | lower-than-default | status-activity, time-tracking |
| iPhone XS | iPhone XS Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS | iPhone XS Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS | iPhone XS Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS | iPhone XS Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS | iPhone XS NO SERVICE (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone XS | iPhone XS NO WIFI (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone XS | iPhone XS Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS | iPhone XS Rear Camera | 1 | 0.12h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone XS | iPhone XS Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS | iPhone XS Rear Housing (Rear Glass And Frame) | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS | iPhone XS UNABLE TO ACTIVATE | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone XS | iPhone XS Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS | iPhone XS WIFI Module | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS Max | iPhone XS Max | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS Max | iPhone XS Max Battery | 5 | 0.44h | 1.00h | 0.44h | lower-than-default | time-tracking |
| iPhone XS Max | iPhone XS Max Charging Port | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS Max | iPhone XS Max Display (Original OLED Screen) | 5 | 0.36h | 1.00h | 0.36h | lower-than-default | time-tracking |
| iPhone XS Max | iPhone XS Max Earpiece Speaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS Max | iPhone XS Max Loudspeaker | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS Max | iPhone XS Max Microphone | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS Max | iPhone XS Max Mute Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS Max | iPhone XS Max NO SERVICE (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone XS Max | iPhone XS Max NO WIFI (LOGIC BOARD REPAIR) | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone XS Max | iPhone XS Max Power Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS Max | iPhone XS Max Rear Camera | 1 | 0.12h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone XS Max | iPhone XS Max Rear Camera Lens | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS Max | iPhone XS Max Rear Housing (Rear Glass And Frame) | 1 | 0.59h | 1.00h | 1.00h | lower-than-default | time-tracking |
| iPhone XS Max | iPhone XS Max UNABLE TO ACTIVATE | 6 | 0.65h | 1.00h | 0.65h | lower-than-default | time-tracking |
| iPhone XS Max | iPhone XS Max Volume Button | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPhone XS Max | iPhone XS Max WIFI Module | 0 | n/a | 1.00h | 1.00h | no-history | default-fallback (no matched repairs) |
| iPod Touch 6th Gen | iPod Touch 6th Gen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPod Touch 6th Gen | iPod Touch 6th Gen Battery | 2 | 0.23h | 1.50h | 1.50h | lower-than-default | time-tracking |
| iPod Touch 6th Gen | iPod Touch 6th Gen Charging IC | 7 | 0.15h | 1.50h | 0.15h | lower-than-default | time-tracking |
| iPod Touch 6th Gen | iPod Touch 6th Gen Charging Port | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPod Touch 6th Gen | iPod Touch 6th Gen Screen | 7 | 0.39h | 1.50h | 0.39h | lower-than-default | time-tracking |
| iPod Touch 6th Gen | iPod Touch 6th Gen Software Re-Installation | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPod Touch 6th Gen | iPod Touch 6th/7th Gen Rear Camera | 5 | 0.61h | 1.50h | 0.61h | lower-than-default | time-tracking |
| iPod Touch 7th Gen | iPod Touch 7th Gen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPod Touch 7th Gen | iPod Touch 7th Gen Battery | 4 | 0.19h | 1.50h | 0.19h | lower-than-default | time-tracking |
| iPod Touch 7th Gen | iPod Touch 7th Gen Charging IC | 7 | 0.15h | 1.50h | 0.15h | lower-than-default | time-tracking |
| iPod Touch 7th Gen | iPod Touch 7th Gen Charging Port | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| iPod Touch 7th Gen | iPod Touch 7th Gen Screen | 7 | 0.39h | 1.50h | 0.39h | lower-than-default | time-tracking |
| iPod Touch 7th Gen | iPod Touch 7th Gen Software Re-Installation | 1 | 0.48h | 1.50h | 1.50h | lower-than-default | time-tracking |
| MacBook 12 A1534 | MacBook 12 A1534 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook 12 A1534 | MacBook 12 A1534 Battery | 1 | 0.31h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook 12 A1534 | MacBook 12 A1534 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook 12 A1534 | MacBook 12 A1534 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook 12 A1534 | MacBook 12 A1534 Screen | 2 | 143.58h | 2.00h | 2.00h | higher-than-default | time-tracking |
| MacBook 12 A1534 | MacBook 12 A1534 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Trackpad | 1 | 0.91h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Battery | 3 | 0.19h | 2.00h | 0.19h | lower-than-default | time-tracking |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Screen | 2 | 0.46h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Battery | 10 | 0.43h | 2.00h | 0.43h | lower-than-default | time-tracking |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Keyboard | 1 | 4.27h | 2.00h | 2.00h | higher-than-default | status-activity |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Screen | 9 | 1.95h | 2.00h | 1.95h | aligned | status-activity, time-tracking |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Battery | 9 | 0.42h | 2.00h | 0.42h | lower-than-default | time-tracking |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Keyboard | 1 | 0.87h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Screen | 9 | 1.92h | 2.00h | 1.92h | aligned | status-activity, time-tracking |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Battery | 1 | 0.48h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Charging Port | 1 | 1.24h | 2.00h | 2.00h | lower-than-default | date-columns |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Keyboard | 1 | 1.36h | 2.00h | 2.00h | lower-than-default | status-activity |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Screen | 48 | 1.38h | 2.00h | 1.38h | lower-than-default | status-activity, time-tracking |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 M1 A2337 | MacBook Air 13 M1 A2337 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Battery | 1 | 0.33h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Keyboard | 2 | 1.47h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Screen | 49 | 1.53h | 2.00h | 1.53h | aligned | date-columns, status-activity, time-tracking |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Battery | 1 | 0.33h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Screen | 48 | 1.54h | 2.00h | 1.54h | aligned | date-columns, status-activity, time-tracking |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 M4 A3240 | MacBook Air 13 M4 A3240 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 13 M4 A3240 | MacBook Air 13 M4 A3240 Screen | 50 | 1.54h | 2.00h | 1.54h | aligned | date-columns, status-activity, time-tracking |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Keyboard | 1 | 1.27h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Screen | 12 | 1.96h | 2.00h | 1.96h | aligned | time-tracking |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Keyboard | 1 | 1.40h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Screen | 9 | 1.96h | 2.00h | 1.96h | aligned | time-tracking |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Air 15 M3 A3114 | S001 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Battery | 15 | 0.43h | 2.00h | 0.43h | lower-than-default | time-tracking |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Keyboard | 2 | 4.13h | 2.00h | 2.00h | higher-than-default | time-tracking |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Screen | 32 | 2.60h | 2.00h | 2.60h | higher-than-default | status-activity, time-tracking |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13  A1708 | MacBook Pro 13 A1708 Dustgate | 45 | 0.99h | 2.00h | 0.99h | lower-than-default | status-activity, time-tracking |
| MacBook Pro 13  A1708 | MacBook Pro 13 A1708 Flexgate | 38 | 0.91h | 2.00h | 0.91h | lower-than-default | time-tracking |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Backlight | 145 | 0.56h | 2.00h | 0.56h | lower-than-default | date-columns, status-activity, time-tracking |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Battery | 7 | 0.53h | 2.00h | 0.53h | lower-than-default | status-activity, time-tracking |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Charging Port | 2 | 1.88h | 2.00h | 2.00h | aligned | time-tracking |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Dustgate | 148 | 0.57h | 2.00h | 0.57h | lower-than-default | date-columns, status-activity, time-tracking |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Screen | 27 | 1.93h | 2.00h | 1.93h | aligned | status-activity, time-tracking |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Touch Bar | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Trackpad | 1 | 0.78h | 2.00h | 2.00h | lower-than-default | status-activity |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Backlight | 145 | 0.56h | 2.00h | 0.56h | lower-than-default | date-columns, status-activity, time-tracking |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Battery | 7 | 0.53h | 2.00h | 0.53h | lower-than-default | status-activity, time-tracking |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Dustgate | 145 | 0.56h | 2.00h | 0.56h | lower-than-default | date-columns, status-activity, time-tracking |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Keyboard | 1 | 1.40h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Screen | 27 | 1.94h | 2.00h | 1.94h | aligned | status-activity, time-tracking |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Trackpad | 1 | 4.79h | 2.00h | 2.00h | higher-than-default | time-tracking |
| MacBook Pro 13 4TB 3 A2251 | Liquid Damage Treatment | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Backlight | 145 | 0.56h | 2.00h | 0.56h | lower-than-default | date-columns, status-activity, time-tracking |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Battery | 8 | 0.53h | 2.00h | 0.53h | lower-than-default | status-activity, time-tracking |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Charging Port | 1 | 1.28h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Dustgate | 145 | 0.56h | 2.00h | 0.56h | lower-than-default | date-columns, status-activity, time-tracking |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Keyboard | 1 | 1.28h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Screen | 24 | 2.01h | 2.00h | 2.01h | aligned | status-activity, time-tracking |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Touch Bar | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Battery | 3 | 0.68h | 2.00h | 0.68h | lower-than-default | time-tracking |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 A1502 | MacBook Pro 13 A1502 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 A1502 | MacBook Pro 13 A1502 Logic Board | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 M1 A2338 | Liquid Damage Treatment | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Backlight | 145 | 0.56h | 2.00h | 0.56h | lower-than-default | date-columns, status-activity, time-tracking |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Battery | 7 | 0.53h | 2.00h | 0.53h | lower-than-default | status-activity, time-tracking |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Dustgate | 147 | 0.57h | 2.00h | 0.57h | lower-than-default | date-columns, status-activity, time-tracking |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Keyboard | 1 | 3.95h | 2.00h | 2.00h | higher-than-default | time-tracking |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Logic Board Repair | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Screen | 65 | 2.05h | 2.00h | 2.05h | aligned | status-activity, time-tracking |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Touch Bar | 1 | 0.81h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Trackpad | 1 | 0.31h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Battery | 7 | 0.53h | 2.00h | 0.53h | lower-than-default | status-activity, time-tracking |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Dustgate | 145 | 0.56h | 2.00h | 0.56h | lower-than-default | date-columns, status-activity, time-tracking |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Screen | 53 | 1.98h | 2.00h | 1.98h | aligned | status-activity, time-tracking |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Touch Bar | 1 | 1.12h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Trackpad | 1 | 0.31h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Battery | 6 | 1.34h | 2.00h | 1.34h | lower-than-default | time-tracking |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Dustgate | 40 | 0.94h | 2.00h | 0.94h | lower-than-default | time-tracking |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Flexgate | 158 | 0.58h | 2.00h | 0.58h | lower-than-default | date-columns, status-activity, time-tracking |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Keyboard | 2 | 1.47h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Screen | 28 | 2.48h | 2.00h | 2.48h | aligned | status-activity, time-tracking |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Touch Bar | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Backlight | 145 | 0.56h | 2.00h | 0.56h | lower-than-default | date-columns, status-activity, time-tracking |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Battery | 7 | 1.90h | 2.00h | 1.90h | aligned | status-activity, time-tracking |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Dustgate | 49 | 0.97h | 2.00h | 0.97h | lower-than-default | time-tracking |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Screen | 28 | 1.93h | 2.00h | 1.93h | aligned | status-activity, time-tracking |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Touch Bar | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 13"  A1708 | MacBook Pro 13 A1708  Warranty Assessment | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Keyboard | 4 | 2.58h | 2.00h | 2.58h | higher-than-default | status-activity, time-tracking |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Screen | 46 | 1.68h | 2.00h | 1.68h | aligned | status-activity, time-tracking |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Trackpad | 1 | 1.06h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 M1 Pro/Max A2442 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 M1 Pro/Max A2442 Battery | 1 | 1.00h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Keyboard | 1 | 18.67h | 2.00h | 2.00h | higher-than-default | time-tracking |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Screen | 31 | 1.70h | 2.00h | 1.70h | aligned | status-activity, time-tracking |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 A2992 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Keyboard | 1 | 18.67h | 2.00h | 2.00h | higher-than-default | time-tracking |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Screen | 5 | 1.43h | 2.00h | 1.43h | lower-than-default | time-tracking |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Keyboard | 1 | 18.67h | 2.00h | 2.00h | higher-than-default | time-tracking |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Screen | 19 | 1.44h | 2.00h | 1.44h | lower-than-default | time-tracking |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M3 Pro/Max A2992 | MacBook Pro 14 M3 Pro/Max A2992 Warranty Assessment | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Screen | 43 | 1.67h | 2.00h | 1.67h | aligned | status-activity, time-tracking |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Battery | 4 | 1.11h | 2.00h | 1.11h | lower-than-default | time-tracking |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Screen | 1 | 0.75h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Battery | 8 | 0.98h | 2.00h | 0.98h | lower-than-default | status-activity, time-tracking |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Dustgate | 38 | 0.91h | 2.00h | 0.91h | lower-than-default | time-tracking |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Flexgate | 37 | 0.91h | 2.00h | 0.91h | lower-than-default | time-tracking |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Keyboard | 2 | 2.46h | 2.00h | 2.00h | aligned | time-tracking |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Screen | 10 | 2.54h | 2.00h | 2.54h | higher-than-default | status-activity, time-tracking |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Backlight | 145 | 0.56h | 2.00h | 0.56h | lower-than-default | date-columns, status-activity, time-tracking |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Battery | 11 | 0.65h | 2.00h | 0.65h | lower-than-default | status-activity, time-tracking |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Charging Port | 2 | 1.25h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Dustgate | 38 | 0.91h | 2.00h | 0.91h | lower-than-default | status-activity, time-tracking |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Logic Board Repair | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Screen | 12 | 2.80h | 2.00h | 2.80h | higher-than-default | status-activity, time-tracking |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Backlight | 145 | 0.56h | 2.00h | 0.56h | lower-than-default | date-columns, status-activity, time-tracking |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Battery | 7 | 1.40h | 2.00h | 1.40h | lower-than-default | time-tracking |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Dustgate | 42 | 0.94h | 2.00h | 0.94h | lower-than-default | time-tracking |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Keyboard | 6 | 1.43h | 2.00h | 1.43h | lower-than-default | time-tracking |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Screen | 14 | 2.10h | 2.00h | 2.10h | aligned | time-tracking |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Touch Bar | 1 | 1.36h | 2.00h | 2.00h | lower-than-default | time-tracking |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Screen | 46 | 1.64h | 2.00h | 1.64h | aligned | status-activity, time-tracking |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Trackpad | 1 | 2.43h | 2.00h | 2.00h | aligned | time-tracking |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Screen | 41 | 1.63h | 2.00h | 1.63h | aligned | status-activity, time-tracking |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M3 Pro/Max A2991 | Liquid Damage Treatment | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M3 Pro/Max A2991 | Liquid Damage Treatment | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Screen | 42 | 1.64h | 2.00h | 1.64h | aligned | status-activity, time-tracking |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Battery | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Charging Port | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Keyboard | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Screen | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Trackpad | 0 | n/a | 2.00h | 2.00h | no-history | default-fallback (no matched repairs) |
| Other Device | Other Device Other Product | 145 | 0.56h | 1.50h | 0.56h | lower-than-default | date-columns, status-activity, time-tracking |
| Other Device | Screen Protector | 10 | 0.58h | 1.50h | 0.58h | lower-than-default | status-activity, time-tracking |
| TEST PRODUCT GROUP | Custom Product | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| TEST PRODUCT GROUP | TEST BATTEY PRODUCT | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| TEST PRODUCT GROUP | TEST DISPLAY PRODUCT | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| TEST PRODUCT GROUP | TEST GLASS TOUCH PRODUCT | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| TEST PRODUCT GROUP | TEST PRODUCT GROUP | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| Zebra PDA | Zebra PDA | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| Zebra PDA | Zebra PDA LCD | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |
| Zebra PDA | Zebra PDA Touch Screen | 0 | n/a | 1.50h | 1.50h | no-history | default-fallback (no matched repairs) |

## Section 3: Ranked Product Profitability

| Device | Product | Price (inc VAT) | Ex-VAT | Parts Cost | Labour | Refurb | Fees | Net Profit | Net Margin % | Shopify Listed | GSC Clicks (90d) | GSC Position | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Backlight | £499.00 | £415.83 | £0.00 | £13.55 | £0.00 | £9.98 | £392.31 | 94.3% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Backlight | £499.00 | £415.83 | £0.00 | £13.55 | £0.00 | £9.98 | £392.31 | 94.3% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Backlight | £399.00 | £332.50 | £0.00 | £13.55 | £0.00 | £7.98 | £310.97 | 93.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPod Touch 6th Gen | iPod Touch 6th Gen Charging IC | £120.00 | £100.00 | £1.00 | £3.65 | £0.00 | £2.40 | £92.95 | 92.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPod Touch 7th Gen | iPod Touch 7th Gen Charging IC | £120.00 | £100.00 | £1.00 | £3.65 | £0.00 | £2.40 | £92.95 | 92.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Flexgate | £349.00 | £290.83 | £0.00 | £13.94 | £0.00 | £6.98 | £269.91 | 92.8% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Backlight | £329.00 | £274.17 | £0.00 | £13.55 | £0.00 | £6.58 | £254.04 | 92.7% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Backlight | £329.00 | £274.17 | £0.00 | £13.55 | £0.00 | £6.58 | £254.04 | 92.7% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Backlight | £329.00 | £274.17 | £0.00 | £13.55 | £0.00 | £6.58 | £254.04 | 92.7% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Backlight | £299.00 | £249.17 | £0.00 | £13.55 | £0.00 | £5.98 | £229.64 | 92.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S7 45MM | Apple Watch S7 45MM Display Screen | £199.00 | £165.83 | £1.00 | £8.89 | £0.00 | £3.98 | £151.96 | 91.6% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S7 45MM | Apple Watch S7 45MM Glass Screen | £199.00 | £165.83 | £1.00 | £8.89 | £0.00 | £3.98 | £151.96 | 91.6% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Screen | £649.00 | £540.83 | £0.00 | £34.36 | £0.00 | £12.98 | £493.49 | 91.2% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Screen | £649.00 | £540.83 | £0.00 | £34.65 | £0.00 | £12.98 | £493.20 | 91.2% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Dustgate | £249.00 | £207.50 | £0.00 | £13.55 | £0.00 | £4.98 | £188.97 | 91.1% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Dustgate | £249.00 | £207.50 | £0.00 | £13.55 | £0.00 | £4.98 | £188.97 | 91.1% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Dustgate | £249.00 | £207.50 | £0.00 | £13.55 | £0.00 | £4.98 | £188.97 | 91.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Dustgate | £249.00 | £207.50 | £0.00 | £13.74 | £0.00 | £4.98 | £188.78 | 91.0% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Dustgate | £249.00 | £207.50 | £0.00 | £13.74 | £0.00 | £4.98 | £188.78 | 91.0% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 | iPhone 14 Charging Port | £89.00 | £74.17 | £0.00 | £5.31 | £0.00 | £1.78 | £67.07 | 90.4% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Screen | £799.00 | £665.83 | £0.00 | £48.00 | £0.00 | £15.98 | £601.85 | 90.4% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro | iPhone 13 Pro Charging Port | £89.00 | £74.17 | £2.00 | £3.48 | £0.00 | £1.78 | £66.91 | 90.2% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13  A1708 | MacBook Pro 13 A1708 Flexgate | £349.00 | £290.83 | £0.00 | £21.78 | £0.00 | £6.98 | £262.07 | 90.1% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Flexgate | £349.00 | £290.83 | £0.00 | £21.83 | £0.00 | £6.98 | £262.02 | 90.1% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Dustgate | £349.00 | £290.83 | £0.00 | £21.88 | £0.00 | £6.98 | £261.97 | 90.1% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Dustgate | £349.00 | £290.83 | £0.00 | £21.88 | £0.00 | £6.98 | £261.97 | 90.1% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro Max | iPhone 16 Pro Max Rear Housing | £379.00 | £315.83 | £0.00 | £24.00 | £0.00 | £7.58 | £284.25 | 90.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Dustgate | £349.00 | £290.83 | £0.00 | £22.62 | £0.00 | £6.98 | £261.23 | 89.8% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13  A1708 | MacBook Pro 13 A1708 Dustgate | £349.00 | £290.83 | £0.00 | £23.69 | £0.00 | £6.98 | £260.16 | 89.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 | iPhone 16 Front Camera | £349.00 | £290.83 | £0.00 | £24.00 | £0.00 | £6.98 | £259.85 | 89.3% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 16 Plus | iPhone 16 Plus Front Camera | £349.00 | £290.83 | £0.00 | £24.00 | £0.00 | £6.98 | £259.85 | 89.3% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 16 Pro | iPhone 16 Pro Front Camera | £349.00 | £290.83 | £0.00 | £24.00 | £0.00 | £6.98 | £259.85 | 89.3% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 16 Pro | iPhone 16 Pro Rear Housing | £349.00 | £290.83 | £0.00 | £24.00 | £0.00 | £6.98 | £259.85 | 89.3% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 16 Pro Max | iPhone 16 Pro Max Front Camera | £349.00 | £290.83 | £0.00 | £24.00 | £0.00 | £6.98 | £259.85 | 89.3% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 15 | iPhone 15 Front Camera | £329.00 | £274.17 | £0.00 | £24.00 | £0.00 | £6.58 | £243.59 | 88.8% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 15 Plus | iPhone 15 Plus Front Camera | £329.00 | £274.17 | £0.00 | £24.00 | £0.00 | £6.58 | £243.59 | 88.8% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 15 Pro | iPhone 15 Pro Front Camera | £329.00 | £274.17 | £0.00 | £24.00 | £0.00 | £6.58 | £243.59 | 88.8% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 15 Pro Max | iPhone 15 Pro Max Front Camera | £329.00 | £274.17 | £0.00 | £24.00 | £0.00 | £6.58 | £243.59 | 88.8% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 16 Plus | iPhone 16 Plus Rear Housing | £319.00 | £265.83 | £0.00 | £24.00 | £0.00 | £6.38 | £235.45 | 88.6% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 14 | iPhone 14 Front Camera | £299.00 | £249.17 | £0.00 | £24.00 | £0.00 | £5.98 | £219.19 | 88.0% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 14 Plus | iPhone 14 Plus Front Camera | £299.00 | £249.17 | £0.00 | £24.00 | £0.00 | £5.98 | £219.19 | 88.0% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 14 Pro | iPhone 14 Pro Front Camera | £299.00 | £249.17 | £0.00 | £24.00 | £0.00 | £5.98 | £219.19 | 88.0% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Battery | £199.00 | £165.83 | £0.00 | £16.33 | £0.00 | £3.98 | £145.53 | 87.8% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 13 | iPhone 13 Charging Port | £89.00 | £74.17 | £2.00 | £5.32 | £0.00 | £1.78 | £65.07 | 87.7% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro | iPhone 12 Pro NO SERVICE (LOGIC BOARD REPAIR) | £200.00 | £166.67 | £1.00 | £15.60 | £0.00 | £4.00 | £146.07 | 87.6% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 Pro | iPhone 12 Pro NO WIFI (LOGIC BOARD REPAIR) | £200.00 | £166.67 | £1.00 | £15.60 | £0.00 | £4.00 | £146.07 | 87.6% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 Pro | iPhone 12 Pro UNABLE TO ACTIVATE | £200.00 | £166.67 | £1.00 | £15.60 | £0.00 | £4.00 | £146.07 | 87.6% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 Pro Max | iPhone 12 Pro Max NO SERVICE (LOGIC BOARD REPAIR) | £200.00 | £166.67 | £1.00 | £15.60 | £0.00 | £4.00 | £146.07 | 87.6% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 Pro Max | iPhone 12 Pro Max NO WIFI (LOGIC BOARD REPAIR) | £200.00 | £166.67 | £1.00 | £15.60 | £0.00 | £4.00 | £146.07 | 87.6% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 Pro Max | iPhone 12 Pro Max UNABLE TO ACTIVATE | £200.00 | £166.67 | £1.00 | £15.60 | £0.00 | £4.00 | £146.07 | 87.6% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 16 | iPhone 16 Rear Housing | £289.00 | £240.83 | £0.00 | £24.00 | £0.00 | £5.78 | £211.05 | 87.6% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 | iPhone 12 Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 12 Mini | iPhone 12 Mini Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 12 Pro | iPhone 12 Pro Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 13 | iPhone 13 Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 13 Mini | iPhone 13 Mini Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 13 Pro | iPhone 13 Pro Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 13 Pro Max | iPhone 13 Pro Max Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 14 Pro Max | iPhone 14 Pro Max Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 15 Pro | iPhone 15 Pro Rear Housing | £279.00 | £232.50 | £0.00 | £24.00 | £0.00 | £5.58 | £202.92 | 87.3% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 15 Pro Max | iPhone 15 Pro Max Rear Housing | £279.00 | £232.50 | £0.00 | £24.00 | £0.00 | £5.58 | £202.92 | 87.3% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Glass Screen | £399.00 | £332.50 | £0.00 | £36.00 | £0.00 | £7.98 | £288.52 | 86.8% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Dustgate | £249.00 | £207.50 | £0.00 | £22.62 | £0.00 | £4.98 | £179.90 | 86.7% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 | iPhone 12 NO SERVICE (LOGIC BOARD REPAIR) | £180.00 | £150.00 | £1.00 | £15.60 | £0.00 | £3.60 | £129.80 | 86.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 | iPhone 12 NO WIFI (LOGIC BOARD REPAIR) | £180.00 | £150.00 | £1.00 | £15.60 | £0.00 | £3.60 | £129.80 | 86.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 | iPhone 12 UNABLE TO ACTIVATE | £180.00 | £150.00 | £1.00 | £15.60 | £0.00 | £3.60 | £129.80 | 86.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 Mini | iPhone 12 Mini NO SERVICE (LOGIC BOARD REPAIR) | £180.00 | £150.00 | £1.00 | £15.60 | £0.00 | £3.60 | £129.80 | 86.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 Mini | iPhone 12 Mini NO WIFI (LOGIC BOARD REPAIR) | £180.00 | £150.00 | £1.00 | £15.60 | £0.00 | £3.60 | £129.80 | 86.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 Mini | iPhone 12 UNABLE TO ACTIVATE | £180.00 | £150.00 | £1.00 | £15.60 | £0.00 | £3.60 | £129.80 | 86.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 15 | iPhone 15 Rear Housing | £259.00 | £215.83 | £0.00 | £24.00 | £0.00 | £5.18 | £186.65 | 86.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 15 Plus | iPhone 15 Plus Rear Glass | £259.00 | £215.83 | £0.00 | £24.00 | £0.00 | £5.18 | £186.65 | 86.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Plus | iPhone 15 Plus Rear Housing | £259.00 | £215.83 | £0.00 | £24.00 | £0.00 | £5.18 | £186.65 | 86.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Dustgate | £249.00 | £207.50 | £0.00 | £23.39 | £0.00 | £4.98 | £179.13 | 86.3% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Screen | £499.00 | £415.83 | £0.00 | £48.00 | £0.00 | £9.98 | £357.85 | 86.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Keyboard | £499.00 | £415.83 | £0.00 | £48.00 | £0.00 | £9.98 | £357.85 | 86.1% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Plus | iPhone 14 Plus Rear Housing | £249.00 | £207.50 | £0.00 | £24.00 | £0.00 | £4.98 | £178.52 | 86.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 16 Pro | iPhone 16 Pro Rear Camera | £249.00 | £207.50 | £0.00 | £24.00 | £0.00 | £4.98 | £178.52 | 86.0% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro Max | iPhone 16 Pro Max Rear Camera | £249.00 | £207.50 | £0.00 | £24.00 | £0.00 | £4.98 | £178.52 | 86.0% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro Max | iPhone 14 Pro Max Rear Camera Lens | £99.00 | £82.50 | £1.00 | £8.85 | £0.00 | £1.98 | £70.67 | 85.7% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 | iPhone 14 Rear Housing | £239.00 | £199.17 | £0.00 | £24.00 | £0.00 | £4.78 | £170.39 | 85.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 13 Pro | iPhone 13 Pro Rear Camera Lens | £89.00 | £74.17 | £1.00 | £8.00 | £0.00 | £1.78 | £63.39 | 85.5% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Display Screen | £349.00 | £290.83 | £0.00 | £36.00 | £0.00 | £6.98 | £247.85 | 85.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Glass Screen | £349.00 | £290.83 | £0.00 | £36.00 | £0.00 | £6.98 | £247.85 | 85.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Glass Screen | £349.00 | £290.83 | £0.00 | £36.00 | £0.00 | £6.98 | £247.85 | 85.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 11 Pro | iPhone 11 Pro NO SERVICE (LOGIC BOARD REPAIR) | £160.00 | £133.33 | £1.00 | £15.60 | £0.00 | £3.20 | £113.53 | 85.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 11 Pro | iPhone 11 Pro NO WIFI (LOGIC BOARD REPAIR) | £160.00 | £133.33 | £1.00 | £15.60 | £0.00 | £3.20 | £113.53 | 85.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 11 Pro | iPhone 11 Pro UNABLE TO ACTIVATE | £160.00 | £133.33 | £1.00 | £15.60 | £0.00 | £3.20 | £113.53 | 85.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 11 Pro Max | iPhone 11 Pro Max NO SERVICE (LOGIC BOARD REPAIR) | £160.00 | £133.33 | £1.00 | £15.60 | £0.00 | £3.20 | £113.53 | 85.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 11 Pro Max | iPhone 11 Pro Max NO WIFI (LOGIC BOARD REPAIR) | £160.00 | £133.33 | £1.00 | £15.60 | £0.00 | £3.20 | £113.53 | 85.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 11 Pro Max | iPhone 11 Pro Max UNABLE TO ACTIVATE | £160.00 | £133.33 | £1.00 | £15.60 | £0.00 | £3.20 | £113.53 | 85.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 11 Pro | iPhone 11 Pro Battery | £89.00 | £74.17 | £2.00 | £7.29 | £0.00 | £1.78 | £63.10 | 85.1% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Battery | £449.00 | £374.17 | £0.00 | £48.00 | £0.00 | £8.98 | £317.19 | 84.8% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro Max | iPhone 14 Pro Max Battery | £89.00 | £74.17 | £0.75 | £8.91 | £0.00 | £1.78 | £62.72 | 84.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 | iPhone 13 Earpiece Speaker | £89.00 | £74.17 | £1.00 | £9.42 | £0.00 | £1.78 | £61.97 | 83.5% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch Ultra | Apple Watch Ultra  Display Screen | £399.00 | £332.50 | £0.00 | £48.00 | £0.00 | £7.98 | £276.52 | 83.2% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch Ultra | Apple Watch Ultra Glass Screen | £399.00 | £332.50 | £0.00 | £48.00 | £0.00 | £7.98 | £276.52 | 83.2% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Screen | £399.00 | £332.50 | £0.00 | £48.00 | £0.00 | £7.98 | £276.52 | 83.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Charging Port | £399.00 | £332.50 | £0.00 | £48.00 | £0.00 | £7.98 | £276.52 | 83.2% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Trackpad | £399.00 | £332.50 | £0.00 | £48.00 | £0.00 | £7.98 | £276.52 | 83.2% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Glass Screen | £299.00 | £249.17 | £0.00 | £36.00 | £0.00 | £5.98 | £207.19 | 83.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Glass Screen | £299.00 | £249.17 | £0.00 | £36.00 | £0.00 | £5.98 | £207.19 | 83.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 16 Pro | iPhone 16 Pro Charging Port | £199.00 | £165.83 | £0.00 | £24.00 | £0.00 | £3.98 | £137.85 | 83.1% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro Max | iPhone 16 Pro Max Charging Port | £199.00 | £165.83 | £0.00 | £24.00 | £0.00 | £3.98 | £137.85 | 83.1% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Pro Max | iPhone 15 Pro Max Rear Camera Lens | £79.00 | £65.83 | £0.00 | £9.58 | £0.00 | £1.58 | £54.67 | 83.0% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Charging Port | £149.00 | £124.17 | £4.80 | £13.39 | £0.00 | £2.98 | £102.99 | 82.9% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Charging Port | £149.00 | £124.17 | £4.80 | £13.41 | £0.00 | £2.98 | £102.98 | 82.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro | iPhone 14 Pro Charging Port | £89.00 | £74.17 | £0.00 | £11.09 | £0.00 | £1.78 | £61.29 | 82.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Mini | iPhone 13 Mini Rear Camera Lens | £89.00 | £74.17 | £1.00 | £10.33 | £0.00 | £1.78 | £61.05 | 82.3% | Yes | 0 | n/a | healthy, overpriced |
| iPad Air 7 (13) | iPad Air 7 (13) Screen | £399.00 | £332.50 | £0.00 | £52.85 | £0.00 | £7.98 | £271.67 | 81.7% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Mini 6 | iPad Mini 6 Glass Screen | £269.00 | £224.17 | £0.00 | £36.00 | £0.00 | £5.38 | £182.79 | 81.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 16 | iPhone 16 Charging Port | £179.00 | £149.17 | £0.00 | £24.00 | £0.00 | £3.58 | £121.59 | 81.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 | iPhone 16 Rear Camera | £179.00 | £149.17 | £0.00 | £24.00 | £0.00 | £3.58 | £121.59 | 81.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Plus | iPhone 16 Plus Charging Port | £179.00 | £149.17 | £0.00 | £24.00 | £0.00 | £3.58 | £121.59 | 81.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Plus | iPhone 16 Plus Rear Camera | £179.00 | £149.17 | £0.00 | £24.00 | £0.00 | £3.58 | £121.59 | 81.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro | iPhone 16 Pro  Power Button | £179.00 | £149.17 | £0.00 | £24.00 | £0.00 | £3.58 | £121.59 | 81.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro | iPhone 16 Pro Loudspeaker | £179.00 | £149.17 | £0.00 | £24.00 | £0.00 | £3.58 | £121.59 | 81.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro | iPhone 16 Pro Microphone | £179.00 | £149.17 | £0.00 | £24.00 | £0.00 | £3.58 | £121.59 | 81.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro | iPhone 16 Pro Volume Button | £179.00 | £149.17 | £0.00 | £24.00 | £0.00 | £3.58 | £121.59 | 81.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro Max | iPhone 16 Pro Max Loudspeaker | £179.00 | £149.17 | £0.00 | £24.00 | £0.00 | £3.58 | £121.59 | 81.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro Max | iPhone 16 Pro Max Microphone | £179.00 | £149.17 | £0.00 | £24.00 | £0.00 | £3.58 | £121.59 | 81.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro Max | iPhone 16 Pro Max Power Button | £179.00 | £149.17 | £0.00 | £24.00 | £0.00 | £3.58 | £121.59 | 81.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro Max | iPhone 16 Pro Max Volume Button | £179.00 | £149.17 | £0.00 | £24.00 | £0.00 | £3.58 | £121.59 | 81.5% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch Ultra | Apple Watch Ultra Heart Rate Monitor | £349.00 | £290.83 | £0.00 | £48.00 | £0.00 | £6.98 | £235.85 | 81.1% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch Ultra | Apple Watch Ultra Rear Housing | £349.00 | £290.83 | £0.00 | £48.00 | £0.00 | £6.98 | £235.85 | 81.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook 12 A1534 | MacBook 12 A1534 Screen | £349.00 | £290.83 | £0.00 | £48.00 | £0.00 | £6.98 | £235.85 | 81.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 11 | iPhone 11 NO SERVICE (LOGIC BOARD REPAIR) | £120.00 | £100.00 | £1.00 | £15.60 | £0.00 | £2.40 | £81.00 | 81.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 11 | iPhone 11 NO WIFI (LOGIC BOARD REPAIR) | £120.00 | £100.00 | £1.00 | £15.60 | £0.00 | £2.40 | £81.00 | 81.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 11 | iPhone 11 UNABLE TO ACTIVATE | £120.00 | £100.00 | £1.00 | £15.60 | £0.00 | £2.40 | £81.00 | 81.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone XS | iPhone XS NO SERVICE (LOGIC BOARD REPAIR) | £120.00 | £100.00 | £1.00 | £15.60 | £0.00 | £2.40 | £81.00 | 81.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone XS | iPhone XS NO WIFI (LOGIC BOARD REPAIR) | £120.00 | £100.00 | £1.00 | £15.60 | £0.00 | £2.40 | £81.00 | 81.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone XS | iPhone XS UNABLE TO ACTIVATE | £120.00 | £100.00 | £1.00 | £15.60 | £0.00 | £2.40 | £81.00 | 81.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone XS Max | iPhone XS Max NO SERVICE (LOGIC BOARD REPAIR) | £120.00 | £100.00 | £1.00 | £15.60 | £0.00 | £2.40 | £81.00 | 81.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone XS Max | iPhone XS Max NO WIFI (LOGIC BOARD REPAIR) | £120.00 | £100.00 | £1.00 | £15.60 | £0.00 | £2.40 | £81.00 | 81.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone XS Max | iPhone XS Max UNABLE TO ACTIVATE | £120.00 | £100.00 | £1.00 | £15.60 | £0.00 | £2.40 | £81.00 | 81.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 | iPhone 12 Charging Port | £79.00 | £65.83 | £2.00 | £8.96 | £0.00 | £1.58 | £53.29 | 81.0% | Yes | 0 | n/a | healthy, overpriced |
| iPhone XS Max | iPhone XS Max Battery | £89.00 | £74.17 | £2.00 | £10.49 | £0.00 | £1.78 | £59.90 | 80.8% | Yes | 0 | n/a | healthy, overpriced |
| iPhone SE3 | iPhone SE3 Rear Camera | £99.00 | £82.50 | £0.00 | £13.94 | £0.00 | £1.98 | £66.58 | 80.7% | Yes | 0 | n/a | healthy, overpriced |
| iPad Air 6 (13) | iPad Air 6 (13) Screen | £349.00 | £290.83 | £0.00 | £50.27 | £0.00 | £6.98 | £233.58 | 80.3% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Pro 12.9 (3G) | iPad Pro 11 (3G) Glass Screen | £249.00 | £207.50 | £0.00 | £36.00 | £0.00 | £4.98 | £166.52 | 80.3% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Glass Screen | £249.00 | £207.50 | £0.00 | £36.00 | £0.00 | £4.98 | £166.52 | 80.3% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Keyboard | £329.00 | £274.17 | £0.00 | £48.00 | £0.00 | £6.58 | £219.59 | 80.1% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) Charging Port | £149.00 | £124.17 | £4.80 | £17.55 | £0.00 | £2.98 | £98.84 | 79.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro | iPhone 14 Pro Rear Camera Lens | £99.00 | £82.50 | £0.00 | £14.91 | £0.00 | £1.98 | £65.61 | 79.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone X | iPhone X NO SERVICE (LOGIC BOARD REPAIR) | £110.00 | £91.67 | £1.00 | £15.60 | £0.00 | £2.20 | £72.87 | 79.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone X | iPhone X NO WIFI (LOGIC BOARD REPAIR) | £110.00 | £91.67 | £1.00 | £15.60 | £0.00 | £2.20 | £72.87 | 79.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone X | iPhone X UNABLE TO ACTIVATE | £110.00 | £91.67 | £1.00 | £15.60 | £0.00 | £2.20 | £72.87 | 79.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone XR | iPhone XR NO SERVICE (LOGIC BOARD REPAIR) | £110.00 | £91.67 | £1.00 | £15.60 | £0.00 | £2.20 | £72.87 | 79.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone XR | iPhone XR NO WIFI (LOGIC BOARD REPAIR) | £110.00 | £91.67 | £1.00 | £15.60 | £0.00 | £2.20 | £72.87 | 79.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone XR | iPhone XR UNABLE TO ACTIVATE | £110.00 | £91.67 | £1.00 | £15.60 | £0.00 | £2.20 | £72.87 | 79.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 16 | iPhone 16 Loudspeaker | £159.00 | £132.50 | £0.00 | £24.00 | £0.00 | £3.18 | £105.32 | 79.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 | iPhone 16 Microphone | £159.00 | £132.50 | £0.00 | £24.00 | £0.00 | £3.18 | £105.32 | 79.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 | iPhone 16 Power Button | £159.00 | £132.50 | £0.00 | £24.00 | £0.00 | £3.18 | £105.32 | 79.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 | iPhone 16 Volume Button | £159.00 | £132.50 | £0.00 | £24.00 | £0.00 | £3.18 | £105.32 | 79.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Plus | iPhone 16 Plus Loudspeaker | £159.00 | £132.50 | £0.00 | £24.00 | £0.00 | £3.18 | £105.32 | 79.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Plus | iPhone 16 Plus Microphone | £159.00 | £132.50 | £0.00 | £24.00 | £0.00 | £3.18 | £105.32 | 79.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Plus | iPhone 16 Plus Power Button | £159.00 | £132.50 | £0.00 | £24.00 | £0.00 | £3.18 | £105.32 | 79.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Plus | iPhone 16 Plus Volume Button | £159.00 | £132.50 | £0.00 | £24.00 | £0.00 | £3.18 | £105.32 | 79.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Plus | iPhone 16 Plus Screen | £299.00 | £249.17 | £0.00 | £24.00 | £24.00 | £5.98 | £195.19 | 78.3% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Screen | £299.00 | £249.17 | £0.00 | £48.00 | £0.00 | £5.98 | £195.19 | 78.3% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Keyboard | £299.00 | £249.17 | £0.00 | £48.00 | £0.00 | £5.98 | £195.19 | 78.3% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 M4 A3240 | MacBook Air 13 M4 A3240 Keyboard | £299.00 | £249.17 | £0.00 | £48.00 | £0.00 | £5.98 | £195.19 | 78.3% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Trackpad | £299.00 | £249.17 | £0.00 | £48.00 | £0.00 | £5.98 | £195.19 | 78.3% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Keyboard | £299.00 | £249.17 | £0.00 | £48.00 | £0.00 | £5.98 | £195.19 | 78.3% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Trackpad | £299.00 | £249.17 | £0.00 | £48.00 | £0.00 | £5.98 | £195.19 | 78.3% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Trackpad | £299.00 | £249.17 | £0.00 | £48.00 | £0.00 | £5.98 | £195.19 | 78.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 | iPhone 15 Charging Port | £149.00 | £124.17 | £0.00 | £24.00 | £0.00 | £2.98 | £97.19 | 78.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Plus | iPhone 15 Plus Charging Port | £149.00 | £124.17 | £0.00 | £24.00 | £0.00 | £2.98 | £97.19 | 78.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Pro | iPhone 15 Pro Charging Port | £149.00 | £124.17 | £0.00 | £24.00 | £0.00 | £2.98 | £97.19 | 78.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Pro Max | iPhone 15 Pro Max Charging Port | £149.00 | £124.17 | £0.00 | £24.00 | £0.00 | £2.98 | £97.19 | 78.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro | iPhone 16 Pro Earpiece Speaker | £149.00 | £124.17 | £0.00 | £24.00 | £0.00 | £2.98 | £97.19 | 78.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro Max | iPhone 16 Pro Max Earpiece Speaker | £149.00 | £124.17 | £0.00 | £24.00 | £0.00 | £2.98 | £97.19 | 78.3% | Yes | 0 | n/a | healthy, overpriced |
| iPad 10 | iPad 10 Glass Screen | £199.00 | £165.83 | £13.00 | £19.57 | £0.00 | £3.98 | £129.28 | 78.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 16 | iPhone 16 Rear Glass | £289.00 | £240.83 | £0.00 | £24.00 | £24.00 | £5.78 | £187.05 | 77.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Keyboard | £289.00 | £240.83 | £0.00 | £48.00 | £0.00 | £5.78 | £187.05 | 77.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Keyboard | £289.00 | £240.83 | £0.00 | £48.00 | £0.00 | £5.78 | £187.05 | 77.7% | Yes | 0 | n/a | healthy, overpriced |
| iPad 9 | iPad 9 Charging Port | £99.00 | £82.50 | £4.80 | £11.78 | £0.00 | £1.98 | £63.94 | 77.5% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch Ultra | Apple Watch Ultra Battery | £279.00 | £232.50 | £0.00 | £48.00 | £0.00 | £5.58 | £178.92 | 77.0% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 | iPhone 16 Screen | £279.00 | £232.50 | £0.00 | £24.00 | £24.00 | £5.58 | £178.92 | 77.0% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro Max | iPhone 16 Pro Max Rear Glass | £279.00 | £232.50 | £0.00 | £24.00 | £24.00 | £5.58 | £178.92 | 77.0% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Keyboard | £279.00 | £232.50 | £0.00 | £48.00 | £0.00 | £5.58 | £178.92 | 77.0% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Keyboard | £279.00 | £232.50 | £0.00 | £48.00 | £0.00 | £5.58 | £178.92 | 77.0% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE 44mm | Apple Watch SE 44mm Display Screen | £199.00 | £165.83 | £20.00 | £14.33 | £0.00 | £3.98 | £127.53 | 76.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Keyboard | £329.00 | £274.17 | £9.00 | £48.00 | £0.00 | £6.58 | £210.59 | 76.8% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Keyboard | £329.00 | £274.17 | £9.00 | £48.00 | £0.00 | £6.58 | £210.59 | 76.8% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Keyboard | £249.00 | £207.50 | £9.00 | £34.23 | £0.00 | £4.98 | £159.29 | 76.8% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Charging Port | £149.00 | £124.17 | £4.80 | £21.32 | £0.00 | £2.98 | £95.07 | 76.6% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE 44mm | Apple Watch SE 44MM Glass Screen | £199.00 | £165.83 | £20.00 | £14.99 | £0.00 | £3.98 | £126.86 | 76.5% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Charging Port | £149.00 | £124.17 | £9.60 | £16.65 | £0.00 | £2.98 | £94.94 | 76.5% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Charging Port | £149.00 | £124.17 | £9.60 | £16.65 | £0.00 | £2.98 | £94.94 | 76.5% | Yes | 0 | n/a | healthy, overpriced |
| iPad Mini 6 | iPad Mini 6 Charging Port | £149.00 | £124.17 | £4.80 | £21.59 | £0.00 | £2.98 | £94.79 | 76.3% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE 40mm | Apple Watch SE 40mm Display Screen | £199.00 | £165.83 | £20.00 | £15.67 | £0.00 | £3.98 | £126.19 | 76.1% | Yes | 0 | n/a | healthy, overpriced |
| iPad Air 5 | iPad Air 5 Charging Port | £149.00 | £124.17 | £9.60 | £17.29 | £0.00 | £2.98 | £94.30 | 75.9% | Yes | 0 | n/a | healthy, overpriced |
| iPad Air 4 | iPad Air 4 Glass Screen | £199.00 | £165.83 | £0.00 | £36.00 | £0.00 | £3.98 | £125.85 | 75.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Air 5 | iPad Air 5 Glass Screen | £199.00 | £165.83 | £0.00 | £36.00 | £0.00 | £3.98 | £125.85 | 75.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Mini 2 | iPad Mini 2 Display Screen | £199.00 | £165.83 | £0.00 | £36.00 | £0.00 | £3.98 | £125.85 | 75.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Mini 3 | iPad Mini 3 Display Screen | £199.00 | £165.83 | £0.00 | £36.00 | £0.00 | £3.98 | £125.85 | 75.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Glass Screen | £199.00 | £165.83 | £0.00 | £36.00 | £0.00 | £3.98 | £125.85 | 75.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Glass Screen | £199.00 | £165.83 | £0.00 | £36.00 | £0.00 | £3.98 | £125.85 | 75.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Glass Screen | £199.00 | £165.83 | £0.00 | £36.00 | £0.00 | £3.98 | £125.85 | 75.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch SE 40mm | Apple Watch SE 40mm Glass Screen | £199.00 | £165.83 | £20.00 | £16.12 | £0.00 | £3.98 | £125.73 | 75.8% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Battery | £179.00 | £149.17 | £20.00 | £12.63 | £0.00 | £3.58 | £112.95 | 75.7% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 | iPhone 15 Loudspeaker | £129.00 | £107.50 | £0.00 | £24.00 | £0.00 | £2.58 | £80.92 | 75.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 | iPhone 15 Microphone | £129.00 | £107.50 | £0.00 | £24.00 | £0.00 | £2.58 | £80.92 | 75.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Plus | iPhone 15 Plus Loudspeaker | £129.00 | £107.50 | £0.00 | £24.00 | £0.00 | £2.58 | £80.92 | 75.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Plus | iPhone 15 Plus Microphone | £129.00 | £107.50 | £0.00 | £24.00 | £0.00 | £2.58 | £80.92 | 75.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Plus | iPhone 15 Plus Rear Camera | £129.00 | £107.50 | £0.00 | £24.00 | £0.00 | £2.58 | £80.92 | 75.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Pro | iPhone 15 Pro Loudspeaker | £129.00 | £107.50 | £0.00 | £24.00 | £0.00 | £2.58 | £80.92 | 75.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Pro | iPhone 15 Pro Microphone | £129.00 | £107.50 | £0.00 | £24.00 | £0.00 | £2.58 | £80.92 | 75.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Pro Max | iPhone 15 Pro Max Loudspeaker | £129.00 | £107.50 | £0.00 | £24.00 | £0.00 | £2.58 | £80.92 | 75.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Pro Max | iPhone 15 Pro Max Microphone | £129.00 | £107.50 | £0.00 | £24.00 | £0.00 | £2.58 | £80.92 | 75.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 | iPhone 16 Earpiece Speaker | £129.00 | £107.50 | £0.00 | £24.00 | £0.00 | £2.58 | £80.92 | 75.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 | iPhone 13 Rear Camera | £119.00 | £99.17 | £10.00 | £12.25 | £0.00 | £2.38 | £74.54 | 75.2% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Mini | iPhone 13 Mini Rear Camera | £119.00 | £99.17 | £10.00 | £12.25 | £0.00 | £2.38 | £74.54 | 75.2% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Keyboard | £299.00 | £249.17 | £9.00 | £48.00 | £0.00 | £5.98 | £186.19 | 74.7% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S9 41MM | Apple Watch S9 41MM Display Screen | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S9 41MM | Apple Watch S9 41MM Glass Screen | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S9 41MM | Apple Watch S9 41MM Heart Rate Monitor | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S9 41MM | Apple Watch S9 41MM Rear Housing | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S9 45MM | Apple Watch S9 45MM Display Screen | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S9 45MM | Apple Watch S9 45MM Glass Screen | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S9 45MM | Apple Watch S9 45MM Heart Rate Monitor | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S9 45MM | Apple Watch S9 45MM Rear Housing | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 16 Pro | iPhone 16 Pro Rear Glass | £249.00 | £207.50 | £0.00 | £24.00 | £24.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook 12 A1534 | MacBook 12 A1534 Keyboard | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Keyboard | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Keyboard | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Keyboard | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Battery | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Keyboard | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Keyboard | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Touch Bar | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Keyboard | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Keyboard | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Touch Bar | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Keyboard | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Keyboard | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Touch Bar | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Touch Bar | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Battery | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Trackpad | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Battery | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Trackpad | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Battery | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Trackpad | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Battery | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Trackpad | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Keyboard | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Keyboard | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Keyboard | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Touch Bar | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Battery | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Battery | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S5 44mm | Apple Watch S5 44mm Display Screen | £179.00 | £149.17 | £20.00 | £14.99 | £0.00 | £3.58 | £110.60 | 74.1% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S5 44mm | Apple Watch S5 44mm Glass Screen | £179.00 | £149.17 | £20.00 | £14.99 | £0.00 | £3.58 | £110.60 | 74.1% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 | iPhone 12 Battery | £89.00 | £74.17 | £10.00 | £7.41 | £0.00 | £1.78 | £54.97 | 74.1% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Keyboard | £289.00 | £240.83 | £9.00 | £48.00 | £0.00 | £5.78 | £178.05 | 73.9% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Charging Port | £149.00 | £124.17 | £4.80 | £24.76 | £0.00 | £2.98 | £91.63 | 73.8% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Charging Port | £149.00 | £124.17 | £4.80 | £24.76 | £0.00 | £2.98 | £91.63 | 73.8% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S5 40mm | Apple Watch S5 40mm Display Screen | £179.00 | £149.17 | £20.00 | £15.67 | £0.00 | £3.58 | £109.92 | 73.7% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S5 40mm | Apple Watch S5 40mm Glass Screen | £179.00 | £149.17 | £20.00 | £15.67 | £0.00 | £3.58 | £109.92 | 73.7% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro | iPhone 12 Pro Battery | £89.00 | £74.17 | £10.00 | £7.86 | £0.00 | £1.78 | £54.53 | 73.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Plus | iPhone 14 Plus Rear Camera | £119.00 | £99.17 | £0.00 | £24.00 | £0.00 | £2.38 | £72.79 | 73.4% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 | iPhone 16 Battery | £119.00 | £99.17 | £0.00 | £24.00 | £0.00 | £2.38 | £72.79 | 73.4% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Plus | iPhone 16 Plus Battery | £119.00 | £99.17 | £0.00 | £24.00 | £0.00 | £2.38 | £72.79 | 73.4% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Plus | iPhone 16 Plus Earpiece Speaker | £119.00 | £99.17 | £0.00 | £24.00 | £0.00 | £2.38 | £72.79 | 73.4% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro | iPhone 16 Pro Battery | £119.00 | £99.17 | £0.00 | £24.00 | £0.00 | £2.38 | £72.79 | 73.4% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro | iPhone 16 Pro Rear Camera Lens | £119.00 | £99.17 | £0.00 | £24.00 | £0.00 | £2.38 | £72.79 | 73.4% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro Max | iPhone 16 Pro Max Battery | £119.00 | £99.17 | £0.00 | £24.00 | £0.00 | £2.38 | £72.79 | 73.4% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Pro Max | iPhone 16 Pro Max Rear Camera Lens | £119.00 | £99.17 | £0.00 | £24.00 | £0.00 | £2.38 | £72.79 | 73.4% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Keyboard | £279.00 | £232.50 | £9.00 | £48.00 | £0.00 | £5.58 | £169.92 | 73.1% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Battery | £159.00 | £132.50 | £27.95 | £4.64 | £0.00 | £3.18 | £96.73 | 73.0% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 11 | iPhone 11 Battery | £89.00 | £74.17 | £10.00 | £8.50 | £0.00 | £1.78 | £53.89 | 72.7% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch Ultra | Apple Watch Ultra Crown | £229.00 | £190.83 | £0.00 | £48.00 | £0.00 | £4.58 | £138.25 | 72.4% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch Ultra | Apple Watch Ultra Side Button | £229.00 | £190.83 | £0.00 | £48.00 | £0.00 | £4.58 | £138.25 | 72.4% | Yes | 0 | n/a | healthy, overpriced |
| iPhone XS | iPhone XS Battery | £89.00 | £74.17 | £10.00 | £8.67 | £0.00 | £1.78 | £53.71 | 72.4% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro Max | iPhone 12 Pro Max Front Camera | £299.00 | £249.17 | £40.00 | £24.00 | £0.00 | £5.98 | £179.19 | 71.9% | Yes | 0 | n/a | healthy, overpriced, price-mismatch |
| iPhone 15 Pro | iPhone 15 Pro Battery | £99.00 | £82.50 | £15.00 | £6.34 | £0.00 | £1.98 | £59.18 | 71.7% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 | iPhone 13 Battery | £79.00 | £65.83 | £10.00 | £7.07 | £0.00 | £1.58 | £47.18 | 71.7% | Yes | 15 | 2.7 | healthy |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Battery | £199.00 | £165.83 | £33.00 | £10.25 | £0.00 | £3.98 | £118.61 | 71.5% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Display Screen | £449.00 | £374.17 | £50.00 | £49.73 | £0.00 | £8.98 | £265.46 | 70.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S8 41MM | Apple Watch S8 41MM Heart Rate Monitor | £219.00 | £182.50 | £1.00 | £48.00 | £0.00 | £4.38 | £129.12 | 70.8% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S8 45MM | Apple Watch S8 45MM Display Screen | £219.00 | £182.50 | £1.00 | £48.00 | £0.00 | £4.38 | £129.12 | 70.8% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S8 45MM | Apple Watch S8 45MM Glass Screen | £219.00 | £182.50 | £1.00 | £48.00 | £0.00 | £4.38 | £129.12 | 70.8% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S8 45MM | Apple Watch S8 45MM Heart Rate Monitor | £219.00 | £182.50 | £1.00 | £48.00 | £0.00 | £4.38 | £129.12 | 70.8% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S8 41MM | Apple Watch S8 41MM Rear Housing | £219.00 | £182.50 | £2.00 | £48.00 | £0.00 | £4.38 | £128.12 | 70.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S8 45MM | Apple Watch S8 45MM Rear Housing | £219.00 | £182.50 | £2.00 | £48.00 | £0.00 | £4.38 | £128.12 | 70.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Keyboard | £249.00 | £207.50 | £9.00 | £48.00 | £0.00 | £4.98 | £145.52 | 70.1% | Yes | 0 | n/a | healthy, overpriced |
| iPhone SE2 | iPhone SE2 Charging Port | £59.00 | £49.17 | £5.00 | £8.81 | £0.00 | £1.18 | £34.18 | 69.5% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE 40mm | Apple Watch SE 40mm Battery | £149.00 | £124.17 | £20.00 | £15.67 | £0.00 | £2.98 | £85.52 | 68.9% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Display Screen | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Glass Screen | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Display Screen | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Glass Screen | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Plus | iPhone 16 Plus Rear Glass | £199.00 | £165.83 | £0.00 | £24.00 | £24.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook 12 A1534 | MacBook 12 A1534 Trackpad | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Trackpad | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Keyboard | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Charging Port | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Charging Port | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Charging Port | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Charging Port | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Trackpad | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Trackpad | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Trackpad | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Touch Bar | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Trackpad | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Charging Port | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Charging Port | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Charging Port | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Charging Port | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Charging Port | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Trackpad | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Trackpad | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Charging Port | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Charging Port | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Charging Port | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 0 | n/a | healthy, overpriced |
| iPad Air 3 | iPad Air 3 Glass Screen | £149.00 | £124.17 | £0.00 | £36.00 | £0.00 | £2.98 | £85.19 | 68.6% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Mini 2 | iPad Mini 2 Glass Screen | £149.00 | £124.17 | £0.00 | £36.00 | £0.00 | £2.98 | £85.19 | 68.6% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Pro 11 (5G) | iPad Pro 11 (5G) Charging Port | £149.00 | £124.17 | £0.00 | £36.00 | £0.00 | £2.98 | £85.19 | 68.6% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Battery | £179.00 | £149.17 | £33.00 | £10.35 | £0.00 | £3.58 | £102.24 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 | iPhone 14 Earpiece Speaker | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 | iPhone 14 Loudspeaker | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 | iPhone 14 Microphone | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 | iPhone 14 Mute Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 | iPhone 14 Power Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 | iPhone 14 Volume Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Plus | iPhone 14 Plus Earpiece Speaker | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Plus | iPhone 14 Plus Loudspeaker | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Plus | iPhone 14 Plus Microphone | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Plus | iPhone 14 Plus Mute Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Plus | iPhone 14 Plus Power Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Plus | iPhone 14 Plus Volume Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro | iPhone 14 Pro Earpiece Speaker | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro | iPhone 14 Pro Loudspeaker | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro | iPhone 14 Pro Microphone | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro | iPhone 14 Pro Mute Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro | iPhone 14 Pro Power Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro | iPhone 14 Pro Volume Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro Max | iPhone 14 Pro Max Microphone | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro Max | iPhone 14 Pro Max Mute Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro Max | iPhone 14 Pro Max Power Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro Max | iPhone 14 Pro Max Volume Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 | iPhone 15 Battery | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 | iPhone 15 Earpiece Speaker | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 | iPhone 15 Power Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 | iPhone 15 Volume Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Plus | iPhone 15 Plus Battery | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Plus | iPhone 15 Plus Earpiece Speaker | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Plus | iPhone 15 Plus Power Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Plus | iPhone 15 Plus Volume Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Pro | iPhone 15 Pro Earpiece Speaker | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Pro | iPhone 15 Pro Power Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Pro | iPhone 15 Pro Volume Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Pro Max | iPhone 15 Pro Max Earpiece Speaker | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Pro Max | iPhone 15 Pro Max Power Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Pro Max | iPhone 15 Pro Max Volume Button | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 | iPhone 16 Rear Camera Lens | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 16 Plus | iPhone 16 Plus Rear Camera Lens | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone SE3 | iPhone SE3 Battery | £89.00 | £74.17 | £15.00 | £6.86 | £0.00 | £1.78 | £50.53 | 68.1% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S7 41MM | Apple Watch S7 41MM Heart Rate Monitor | £199.00 | £165.83 | £1.00 | £48.00 | £0.00 | £3.98 | £112.85 | 68.1% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S7 45MM | Apple Watch S7 45MM Heart Rate Monitor | £199.00 | £165.83 | £1.00 | £48.00 | £0.00 | £3.98 | £112.85 | 68.1% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Battery | £199.00 | £165.83 | £1.00 | £48.00 | £0.00 | £3.98 | £112.85 | 68.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 11 Pro Max | iPhone 11 Pro Max Battery | £89.00 | £74.17 | £10.00 | £12.03 | £0.00 | £1.78 | £50.35 | 67.9% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Display Screen | £399.00 | £332.50 | £50.00 | £49.73 | £0.00 | £7.98 | £224.79 | 67.6% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S7 41MM | Apple Watch S7 41MM Rear Housing | £199.00 | £165.83 | £2.00 | £48.00 | £0.00 | £3.98 | £111.85 | 67.4% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S7 45MM | Apple Watch S7 45MM Rear Housing | £199.00 | £165.83 | £2.00 | £48.00 | £0.00 | £3.98 | £111.85 | 67.4% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Mini 2 | iPad Mini 2 Battery | £179.00 | £149.17 | £9.00 | £36.00 | £0.00 | £3.58 | £100.59 | 67.4% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Mini 3 | iPad Mini 3 Battery | £179.00 | £149.17 | £9.00 | £36.00 | £0.00 | £3.58 | £100.59 | 67.4% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 7 Plus | iPhone 7 Plus Earpiece Speaker | £99.00 | £82.50 | £0.90 | £24.00 | £0.00 | £1.98 | £55.62 | 67.4% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 14 Pro Max | iPhone 14 Pro Max Earpiece Speaker | £99.00 | £82.50 | £1.00 | £24.00 | £0.00 | £1.98 | £55.52 | 67.3% | Yes | 0 | n/a | healthy, overpriced |
| iPad 9 | iPad Logic Board Repair | £139.00 | £115.83 | £0.00 | £36.00 | £0.00 | £2.78 | £77.05 | 66.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Pro 9.7 | iPad Pro 9.7 Glass Screen | £139.00 | £115.83 | £0.00 | £36.00 | £0.00 | £2.78 | £77.05 | 66.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPod Touch 6th Gen | iPod Touch 6th/7th Gen Rear Camera | £60.00 | £50.00 | £1.00 | £14.70 | £0.00 | £1.20 | £33.10 | 66.2% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Screen | £399.00 | £332.50 | £45.00 | £59.48 | £0.00 | £7.98 | £220.04 | 66.2% | Yes | 0 | n/a | healthy, overpriced |
| iPhone SE2 | iPhone SE2 Battery | £89.00 | £74.17 | £15.00 | £8.45 | £0.00 | £1.78 | £48.94 | 66.0% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S7 41MM | Apple Watch S7 41MM Display Screen | £199.00 | £165.83 | £4.44 | £48.00 | £0.00 | £3.98 | £109.41 | 66.0% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S7 41MM | Apple Watch S7 41MM Glass Screen | £199.00 | £165.83 | £4.44 | £48.00 | £0.00 | £3.98 | £109.41 | 66.0% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S9 41MM | Apple Watch S9 41MM Battery | £179.00 | £149.17 | £0.00 | £48.00 | £0.00 | £3.58 | £97.59 | 65.4% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S9 45MM | Apple Watch S9 45MM Battery | £179.00 | £149.17 | £0.00 | £48.00 | £0.00 | £3.58 | £97.59 | 65.4% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Heart Rate Monitor | £179.00 | £149.17 | £0.00 | £48.00 | £0.00 | £3.58 | £97.59 | 65.4% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Rear Housing | £179.00 | £149.17 | £0.00 | £48.00 | £0.00 | £3.58 | £97.59 | 65.4% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Heart Rate Monitor | £179.00 | £149.17 | £0.00 | £48.00 | £0.00 | £3.58 | £97.59 | 65.4% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Rear Housing | £179.00 | £149.17 | £0.00 | £48.00 | £0.00 | £3.58 | £97.59 | 65.4% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Screen | £179.00 | £149.17 | £0.00 | £48.00 | £0.00 | £3.58 | £97.59 | 65.4% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Screen | £399.00 | £332.50 | £45.00 | £62.42 | £0.00 | £7.98 | £217.10 | 65.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Plus | iPhone 14 Plus Charging Port | £89.00 | £74.17 | £0.00 | £24.00 | £0.00 | £1.78 | £48.39 | 65.2% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Mini | iPhone 13 Mini Battery | £89.00 | £74.17 | £15.00 | £9.21 | £0.00 | £1.78 | £48.18 | 65.0% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S4 40mm | Apple Watch S4 40mm Heart Rate Monitor | £179.00 | £149.17 | £1.00 | £48.00 | £0.00 | £3.58 | £96.59 | 64.8% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S4 44mm | Apple Watch S4 44mm Heart Rate Monitor | £179.00 | £149.17 | £1.00 | £48.00 | £0.00 | £3.58 | £96.59 | 64.8% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S5 40mm | Apple Watch S5 40mm Heart Rate Monitor | £179.00 | £149.17 | £1.00 | £48.00 | £0.00 | £3.58 | £96.59 | 64.8% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S5 44mm | Apple Watch S5 44mm Heart Rate Monitor | £179.00 | £149.17 | £1.00 | £48.00 | £0.00 | £3.58 | £96.59 | 64.8% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S6 40mm | Apple Watch S6 40mm Heart Rate Monitor | £179.00 | £149.17 | £1.00 | £48.00 | £0.00 | £3.58 | £96.59 | 64.8% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S6 44mm | Apple Watch S6 44mm Heart Rate Monitor | £179.00 | £149.17 | £1.00 | £48.00 | £0.00 | £3.58 | £96.59 | 64.8% | Yes | 0 | n/a | healthy, overpriced |
| iPad Air 4 | iPad Air 4 Charging Port | £149.00 | £124.17 | £4.80 | £36.00 | £0.00 | £2.98 | £80.39 | 64.7% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Charging Port | £149.00 | £124.17 | £4.80 | £36.00 | £0.00 | £2.98 | £80.39 | 64.7% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Air 13 M4 A3240 | MacBook Air 13 M4 A3240 Screen | £479.00 | £399.17 | £95.00 | £37.08 | £0.00 | £9.58 | £257.51 | 64.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Screen | £329.00 | £274.17 | £45.00 | £46.23 | £0.00 | £6.58 | £176.36 | 64.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone XS Max | iPhone XS Max Display (Original OLED Screen) | £189.00 | £157.50 | £20.00 | £8.54 | £24.00 | £3.78 | £101.18 | 64.2% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Screen | £329.00 | £274.17 | £45.00 | £46.59 | £0.00 | £6.58 | £175.99 | 64.2% | Yes | 0 | n/a | healthy, overpriced |
| iPad Air 2 | iPad Air 2 Glass Screen | £129.00 | £107.50 | £0.00 | £36.00 | £0.00 | £2.58 | £68.92 | 64.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S4 40mm | Apple Watch S4 40mm Rear Housing | £179.00 | £149.17 | £2.00 | £48.00 | £0.00 | £3.58 | £95.59 | 64.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S4 44mm | Apple Watch S4 44mm Rear Housing | £179.00 | £149.17 | £2.00 | £48.00 | £0.00 | £3.58 | £95.59 | 64.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S5 40mm | Apple Watch S5 40mm Rear Housing | £179.00 | £149.17 | £2.00 | £48.00 | £0.00 | £3.58 | £95.59 | 64.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S5 44mm | Apple Watch S5 44mm Rear Housing | £179.00 | £149.17 | £2.00 | £48.00 | £0.00 | £3.58 | £95.59 | 64.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S6 40mm | Apple Watch S6 40mm Rear Housing | £179.00 | £149.17 | £2.00 | £48.00 | £0.00 | £3.58 | £95.59 | 64.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S6 44mm | Apple Watch S6 44mm Rear Housing | £179.00 | £149.17 | £2.00 | £48.00 | £0.00 | £3.58 | £95.59 | 64.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 13 | iPhone 13 Loudspeaker | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 | iPhone 13 Microphone | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 | iPhone 13 Mute Button | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 | iPhone 13 Power Button | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 | iPhone 13 Volume Button | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Mini | iPhone 13 Mini Earpiece Speaker | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Mini | iPhone 13 Mini Loudspeaker | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Mini | iPhone 13 Mini Microphone | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Mini | iPhone 13 Mini Mute Button | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Mini | iPhone 13 Mini Power Button | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Mini | iPhone 13 Mini Volume Button | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro | iPhone 13 Pro Earpiece Speaker | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro | iPhone 13 Pro Loudspeaker | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro | iPhone 13 Pro Microphone | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro | iPhone 13 Pro Mute Button | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro | iPhone 13 Pro Power Button | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro | iPhone 13 Pro Volume Button | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro Max | iPhone 13 Pro Max Earpiece Speaker | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro Max | iPhone 13 Pro Max Loudspeaker | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro Max | iPhone 13 Pro Max Microphone | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro Max | iPhone 13 Pro Max Mute Button | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro Max | iPhone 13 Pro Max Power Button | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro Max | iPhone 13 Pro Max Volume Button | £89.00 | £74.17 | £1.00 | £24.00 | £0.00 | £1.78 | £47.39 | 63.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Screen | £329.00 | £274.17 | £45.00 | £48.20 | £0.00 | £6.58 | £174.38 | 63.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 11 | iPhone 11 Earpiece Speaker | £79.00 | £65.83 | £10.00 | £12.40 | £0.00 | £1.58 | £41.85 | 63.6% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Keyboard | £249.00 | £207.50 | £9.00 | £62.00 | £0.00 | £4.98 | £131.52 | 63.4% | Yes | 0 | n/a | healthy, overpriced |
| iPhone X | iPhone X Battery | £59.00 | £49.17 | £10.00 | £6.88 | £0.00 | £1.18 | £31.10 | 63.3% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Battery | £149.00 | £124.17 | £33.00 | £10.06 | £0.00 | £2.98 | £78.13 | 62.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Mini | iPhone 13 Mini Charging Port | £89.00 | £74.17 | £2.00 | £24.00 | £0.00 | £1.78 | £46.39 | 62.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro Max | iPhone 13 Pro Max Charging Port | £89.00 | £74.17 | £2.00 | £24.00 | £0.00 | £1.78 | £46.39 | 62.5% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Keyboard | £249.00 | £207.50 | £25.00 | £48.00 | £0.00 | £4.98 | £129.52 | 62.4% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro Max | iPhone 13 Pro Max Battery | £79.00 | £65.83 | £15.00 | £8.30 | £0.00 | £1.58 | £40.95 | 62.2% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro Max | iPhone 12 Pro Max Battery | £89.00 | £74.17 | £15.00 | £11.35 | £0.00 | £1.78 | £46.04 | 62.1% | Yes | 0 | n/a | healthy, overpriced |
| iPad Air 2 | iPad Air 2 Battery | £149.00 | £124.17 | £8.35 | £36.00 | £0.00 | £2.98 | £76.84 | 61.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 13 | iPhone 13 Screen | £239.00 | £199.17 | £40.00 | £7.52 | £24.00 | £4.78 | £122.87 | 61.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Battery | £199.00 | £165.83 | £47.00 | £12.63 | £0.00 | £3.98 | £102.23 | 61.6% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Battery | £199.00 | £165.83 | £47.00 | £12.63 | £0.00 | £3.98 | £102.23 | 61.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 | iPhone 14 Battery | £79.00 | £65.83 | £15.00 | £8.79 | £0.00 | £1.58 | £40.47 | 61.5% | Yes | 12 | 1.7 | healthy |
| iPad Pro 9.7 | iPad Pro 9.7 Battery | £149.00 | £124.17 | £8.90 | £36.00 | £0.00 | £2.98 | £76.29 | 61.4% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Charging Port | £159.00 | £132.50 | £0.00 | £48.00 | £0.00 | £3.18 | £81.32 | 61.4% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Charging Port | £159.00 | £132.50 | £0.00 | £48.00 | £0.00 | £3.18 | £81.32 | 61.4% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Battery | £159.00 | £132.50 | £12.10 | £36.00 | £0.00 | £3.18 | £81.22 | 61.3% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Mini 4 | iPad Mini 4 Glass Screen | £119.00 | £99.17 | £0.00 | £36.00 | £0.00 | £2.38 | £60.79 | 61.3% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Mini 5 | iPad Mini 5 Glass Screen | £119.00 | £99.17 | £0.00 | £36.00 | £0.00 | £2.38 | £60.79 | 61.3% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 14 | iPhone 14 Rear Camera Lens | £79.00 | £65.83 | £0.00 | £24.00 | £0.00 | £1.58 | £40.25 | 61.1% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Plus | iPhone 14 Plus Rear Camera Lens | £79.00 | £65.83 | £0.00 | £24.00 | £0.00 | £1.58 | £40.25 | 61.1% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 | iPhone 15 Rear Camera Lens | £79.00 | £65.83 | £0.00 | £24.00 | £0.00 | £1.58 | £40.25 | 61.1% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Plus | iPhone 15 Plus Rear Camera Lens | £79.00 | £65.83 | £0.00 | £24.00 | £0.00 | £1.58 | £40.25 | 61.1% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 15 Pro | iPhone 15 Pro Rear Camera Lens | £79.00 | £65.83 | £0.00 | £24.00 | £0.00 | £1.58 | £40.25 | 61.1% | Yes | 0 | n/a | healthy, overpriced |
| iPad 6 | iPad 6 Glass and Touch Screen | £109.00 | £90.83 | £13.00 | £20.20 | £0.00 | £2.18 | £55.46 | 61.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad 6 | iPad 6 Glass Screen | £109.00 | £90.83 | £13.00 | £20.20 | £0.00 | £2.18 | £55.46 | 61.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Screen | £299.00 | £249.17 | £45.00 | £46.09 | £0.00 | £5.98 | £152.10 | 61.0% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Screen | £299.00 | £249.17 | £45.00 | £46.23 | £0.00 | £5.98 | £151.96 | 61.0% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Charging Port | £149.00 | £124.17 | £9.60 | £36.00 | £0.00 | £2.98 | £75.59 | 60.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 Mini | iPhone 12 Mini Battery | £89.00 | £74.17 | £20.00 | £7.33 | £0.00 | £1.78 | £45.06 | 60.8% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 14 Pro Max | iPhone 14 Pro Max Charging Port | £89.00 | £74.17 | £16.84 | £10.49 | £0.00 | £1.78 | £45.06 | 60.8% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Screen | £299.00 | £249.17 | £45.00 | £46.83 | £0.00 | £5.98 | £151.35 | 60.7% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Screen | £429.00 | £357.50 | £95.00 | £37.08 | £0.00 | £8.58 | £216.84 | 60.7% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE 40mm | Apple Watch SE 40mm Heart Rate Monitor | £159.00 | £132.50 | £1.00 | £48.00 | £0.00 | £3.18 | £80.32 | 60.6% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE 44mm | Apple Watch SE 44mm Heart Rate Monitor | £159.00 | £132.50 | £1.00 | £48.00 | £0.00 | £3.18 | £80.32 | 60.6% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) Display Screen | £299.00 | £249.17 | £50.00 | £42.33 | £0.00 | £5.98 | £150.86 | 60.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Display Screen | £249.00 | £207.50 | £40.00 | £37.02 | £0.00 | £4.98 | £125.50 | 60.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Battery | £199.00 | £165.83 | £35.00 | £26.75 | £0.00 | £3.98 | £100.10 | 60.4% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 Pro Max | iPhone 12 Pro Max Rear Camera Lens | £59.00 | £49.17 | £2.83 | £15.51 | £0.00 | £1.18 | £29.65 | 60.3% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Screen | £549.00 | £457.50 | £110.00 | £61.01 | £0.00 | £10.98 | £275.51 | 60.2% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Battery | £199.00 | £165.83 | £26.00 | £36.00 | £0.00 | £3.98 | £99.85 | 60.2% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Battery | £199.00 | £165.83 | £26.00 | £36.00 | £0.00 | £3.98 | £99.85 | 60.2% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro | iPhone 12 Pro Volume Button | £80.00 | £66.67 | £1.00 | £24.00 | £0.00 | £1.60 | £40.07 | 60.1% | Yes | 0 | n/a | healthy, overpriced |
| iPhone SE2 | iPhone SE2 Display (Original LCD Screen) | £149.00 | £124.17 | £15.00 | £7.60 | £24.00 | £2.98 | £74.59 | 60.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch SE 40mm | Apple Watch SE 40mm Rear Housing | £159.00 | £132.50 | £2.00 | £48.00 | £0.00 | £3.18 | £79.32 | 59.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch SE 44mm | Apple Watch SE 44mm Rear Housing | £159.00 | £132.50 | £2.00 | £48.00 | £0.00 | £3.18 | £79.32 | 59.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone SE3 | iPhone SE3 Original LCD Screen | £149.00 | £124.17 | £15.00 | £7.87 | £24.00 | £2.98 | £74.31 | 59.8% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 8 Plus | iPhone 8 Plus Earpiece Speaker | £79.00 | £65.83 | £0.90 | £24.00 | £0.00 | £1.58 | £39.35 | 59.8% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Mini | iPhone 13 Mini Screen | £279.00 | £232.50 | £40.00 | £24.00 | £24.00 | £5.58 | £138.92 | 59.8% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 11 Pro | iPhone 11 Pro Earpiece Speaker | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 11 Pro Max | iPhone 11 Pro Max Earpiece Speaker | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 | iPhone 12 Microphone | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 | iPhone 12 Mute Button | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 | iPhone 12 Power Button | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 | iPhone 12 Volume Button | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Mini | iPhone 12 Mini Earpiece Speaker | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Mini | iPhone 12 Mini Microphone | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Mini | iPhone 12 Mini Mute Button | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Mini | iPhone 12 Mini Power Button | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Mini | iPhone 12 Mini Volume Button | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro | iPhone 12 Pro Mute Button | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro | iPhone 12 Pro Power Button | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro Max | iPhone 12 Pro Max Mute Button | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro Max | iPhone 12 Pro Max Power Button | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro Max | iPhone 12 Pro Max Volume Button | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone XS | iPhone XS Earpiece Speaker | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone XS Max | iPhone XS Max Earpiece Speaker | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 0 | n/a | healthy, overpriced |
| iPad 9 | iPad 9 Battery | £139.00 | £115.83 | £8.19 | £36.00 | £0.00 | £2.78 | £68.86 | 59.5% | Yes | 0 | n/a | healthy, overpriced |
| iPad 5 | iPad 5 Battery | £139.00 | £115.83 | £8.26 | £36.00 | £0.00 | £2.78 | £68.79 | 59.4% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad 6 | iPad 6 Battery | £139.00 | £115.83 | £8.26 | £36.00 | £0.00 | £2.78 | £68.79 | 59.4% | Yes | 0 | n/a | healthy, overpriced |
| iPad 7 | iPad 7 Battery | £139.00 | £115.83 | £8.26 | £36.00 | £0.00 | £2.78 | £68.79 | 59.4% | Yes | 0 | n/a | healthy, overpriced |
| iPad 8 | iPad 8 Battery | £139.00 | £115.83 | £8.26 | £36.00 | £0.00 | £2.78 | £68.79 | 59.4% | Yes | 0 | n/a | healthy, overpriced |
| iPad Air | iPad Air Battery | £139.00 | £115.83 | £8.26 | £36.00 | £0.00 | £2.78 | £68.79 | 59.4% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Display Screen | £249.00 | £207.50 | £40.00 | £40.21 | £0.00 | £4.98 | £122.31 | 58.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S9 41MM | Apple Watch S9 41MM Crown | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S9 41MM | Apple Watch S9 41MM Side Button | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S9 45MM | Apple Watch S9 45MM Crown | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S9 45MM | Apple Watch S9 45MM Side Button | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone SE3 | iPhone SE3 Original Apple Screen Assembly | £149.00 | £124.17 | £0.00 | £24.00 | £24.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook 12 A1534 | MacBook 12 A1534 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Trackpad | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Trackpad | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Trackpad | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Charging Port | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 M3 Pro/Max A2991 | Liquid Damage Treatment | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Pro 16 M3 Pro/Max A2991 | Liquid Damage Treatment | £149.00 | £124.17 | £0.00 | £48.00 | £0.00 | £2.98 | £73.19 | 58.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Battery | £149.00 | £124.17 | £12.10 | £36.00 | £0.00 | £2.98 | £73.09 | 58.9% | Yes | 0 | n/a | healthy, overpriced |
| iPad 4 | iPad 4 Battery | £139.00 | £115.83 | £9.00 | £36.00 | £0.00 | £2.78 | £68.05 | 58.8% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad 7 | iPad 7 Glass Screen | £149.00 | £124.17 | £25.00 | £23.32 | £0.00 | £2.98 | £72.87 | 58.7% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad 8 | iPad 8 Glass and Touch Screen | £149.00 | £124.17 | £25.00 | £23.32 | £0.00 | £2.98 | £72.87 | 58.7% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad 8 | iPad 8 Glass Screen | £149.00 | £124.17 | £25.00 | £23.32 | £0.00 | £2.98 | £72.87 | 58.7% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 13 Pro Max | iPhone 13 Pro Max Rear Camera Lens | £89.00 | £74.17 | £5.00 | £24.00 | £0.00 | £1.78 | £43.39 | 58.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 8 | iPhone 8 Front Camera | £89.00 | £74.17 | £5.00 | £24.00 | £0.00 | £1.78 | £43.39 | 58.5% | Yes | 0 | n/a | healthy, overpriced |
| iPad Mini 6 | iPad Mini 6 Battery | £169.00 | £140.83 | £19.30 | £36.00 | £0.00 | £3.38 | £82.15 | 58.3% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Battery | £179.00 | £149.17 | £35.00 | £23.57 | £0.00 | £3.58 | £87.01 | 58.3% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Screen | £469.00 | £390.83 | £106.95 | £47.11 | £0.00 | £9.38 | £227.39 | 58.2% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S8 41MM | Apple Watch S8 41MM Battery | £149.00 | £124.17 | £1.00 | £48.00 | £0.00 | £2.98 | £72.19 | 58.1% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S8 45MM | Apple Watch S8 45MM Battery | £149.00 | £124.17 | £1.00 | £48.00 | £0.00 | £2.98 | £72.19 | 58.1% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE 44mm | Apple Watch SE 44MM Battery | £149.00 | £124.17 | £1.00 | £48.00 | £0.00 | £2.98 | £72.19 | 58.1% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 10.5 | iPad Pro 10.5 Glass Screen | £149.00 | £124.17 | £13.00 | £36.00 | £0.00 | £2.98 | £72.19 | 58.1% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 Pro | iPhone 12 Pro Charging Port | £79.00 | £65.83 | £2.00 | £24.00 | £0.00 | £1.58 | £38.25 | 58.1% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Screen | £399.00 | £332.50 | £95.00 | £36.75 | £0.00 | £7.98 | £192.77 | 58.0% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Battery | £169.00 | £140.83 | £20.00 | £36.00 | £0.00 | £3.38 | £81.45 | 57.8% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Battery | £179.00 | £149.17 | £47.00 | £12.63 | £0.00 | £3.58 | £85.96 | 57.6% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Battery | £179.00 | £149.17 | £47.00 | £12.63 | £0.00 | £3.58 | £85.96 | 57.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro | iPhone 12 Pro Microphone | £79.00 | £65.83 | £2.50 | £24.00 | £0.00 | £1.58 | £37.75 | 57.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro Max | iPhone 12 Pro Max Microphone | £79.00 | £65.83 | £2.50 | £24.00 | £0.00 | £1.58 | £37.75 | 57.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro | iPhone 13 Pro Battery | £79.00 | £65.83 | £20.00 | £6.89 | £0.00 | £1.58 | £37.36 | 56.7% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro Max | iPhone 12 Pro Max Charging Port | £79.00 | £65.83 | £3.00 | £24.00 | £0.00 | £1.58 | £37.25 | 56.6% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Screen | £449.00 | £374.17 | £106.95 | £47.11 | £0.00 | £8.98 | £211.12 | 56.4% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Battery | £159.00 | £132.50 | £18.69 | £36.00 | £0.00 | £3.18 | £74.63 | 56.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro Max | iPhone 12 Pro Max Screen | £229.00 | £190.83 | £40.00 | £14.96 | £24.00 | £4.58 | £107.30 | 56.2% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Battery | £139.00 | £115.83 | £0.00 | £48.00 | £0.00 | £2.78 | £65.05 | 56.2% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Battery | £139.00 | £115.83 | £0.00 | £48.00 | £0.00 | £2.78 | £65.05 | 56.2% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro | iPhone 13 Pro Screen | £289.00 | £240.83 | £50.00 | £26.06 | £24.00 | £5.78 | £134.99 | 56.1% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro Max | iPhone 13 Pro Max Screen | £299.00 | £249.17 | £70.00 | £11.61 | £24.00 | £5.98 | £137.57 | 55.2% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Battery | £249.00 | £207.50 | £40.00 | £48.00 | £0.00 | £4.98 | £114.52 | 55.2% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Battery | £249.00 | £207.50 | £40.00 | £48.00 | £0.00 | £4.98 | £114.52 | 55.2% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Touch Bar | £249.00 | £207.50 | £40.00 | £48.00 | £0.00 | £4.98 | £114.52 | 55.2% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Screen | £499.00 | £415.83 | £110.00 | £67.31 | £0.00 | £9.98 | £228.55 | 55.0% | Yes | 0 | n/a | healthy, overpriced |
| iPad 5 | iPad 5 Glass Screen | £99.00 | £82.50 | £15.00 | £20.33 | £0.00 | £1.98 | £45.19 | 54.8% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad 8 | iPad 8 Charging Port | £99.00 | £82.50 | £9.60 | £25.88 | £0.00 | £1.98 | £45.04 | 54.6% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S6 40mm | Apple Watch S6 40mm Battery | £139.00 | £115.83 | £2.14 | £48.00 | £0.00 | £2.78 | £62.91 | 54.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 8 | iPhone 8 Original LCD Screen | £129.00 | £107.50 | £15.00 | £7.60 | £24.00 | £2.58 | £58.32 | 54.3% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Mini 6 | iPad Mini 6 Display Screen | £319.00 | £265.83 | £80.00 | £36.00 | £0.00 | £6.38 | £143.45 | 54.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad 4 | iPad 4 Display Screen | £99.00 | £82.50 | £0.00 | £36.00 | £0.00 | £1.98 | £44.52 | 54.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPad Mini 3 | iPad Mini 3 Glass Screen | £99.00 | £82.50 | £0.00 | £36.00 | £0.00 | £1.98 | £44.52 | 54.0% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 14 Pro | iPhone 14 Pro Battery | £79.00 | £65.83 | £20.00 | £8.74 | £0.00 | £1.58 | £35.51 | 53.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 13 | iPhone 13 Rear Camera Lens | £59.00 | £49.17 | £10.00 | £11.49 | £0.00 | £1.18 | £26.49 | 53.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone SE3 | iPhone SE3 Charging Port | £69.00 | £57.50 | £15.00 | £10.19 | £0.00 | £1.38 | £30.93 | 53.8% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro | iPhone 12 Pro Earpiece Speaker | £79.00 | £65.83 | £20.00 | £8.97 | £0.00 | £1.58 | £35.28 | 53.6% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Battery | £179.00 | £149.17 | £50.00 | £15.65 | £0.00 | £3.58 | £79.93 | 53.6% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Battery | £179.00 | £149.17 | £20.00 | £45.70 | £0.00 | £3.58 | £79.89 | 53.6% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 7 | iPhone 7 Earpiece Speaker | £79.00 | £65.83 | £5.00 | £24.00 | £0.00 | £1.58 | £35.25 | 53.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 8 | iPhone 8 Earpiece Speaker | £79.00 | £65.83 | £5.00 | £24.00 | £0.00 | £1.58 | £35.25 | 53.5% | Yes | 0 | n/a | healthy, overpriced |
| iPod Touch 7th Gen | iPod Touch 7th Gen Battery | £50.00 | £41.67 | £13.74 | £4.64 | £0.00 | £1.00 | £22.29 | 53.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch S5 44mm | Apple Watch S5 44mm Battery | £139.00 | £115.83 | £3.20 | £48.00 | £0.00 | £2.78 | £61.85 | 53.4% | Yes | 0 | n/a | healthy, overpriced |
| iPhone XS | iPhone XS Display (Original OLED Screen) | £189.00 | £157.50 | £40.00 | £5.65 | £24.00 | £3.78 | £84.07 | 53.4% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Battery | £179.00 | £149.17 | £30.00 | £36.00 | £0.00 | £3.58 | £79.59 | 53.4% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone 12 | iPhone 12 Earpiece Speaker | £79.00 | £65.83 | £20.00 | £9.37 | £0.00 | £1.58 | £34.88 | 53.0% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Crown | £129.00 | £107.50 | £0.00 | £48.00 | £0.00 | £2.58 | £56.92 | 52.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Side Button | £129.00 | £107.50 | £0.00 | £48.00 | £0.00 | £2.58 | £56.92 | 52.9% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Crown | £129.00 | £107.50 | £0.00 | £48.00 | £0.00 | £2.58 | £56.92 | 52.9% | No | 0 | n/a | healthy, overpriced, no-shopify |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Side Button | £129.00 | £107.50 | £0.00 | £48.00 | £0.00 | £2.58 | £56.92 | 52.9% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 | iPhone 12 Rear Camera Lens | £59.00 | £49.17 | £10.00 | £12.15 | £0.00 | £1.18 | £25.83 | 52.5% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro | iPhone 12 Pro Rear Camera Lens | £59.00 | £49.17 | £10.00 | £12.15 | £0.00 | £1.18 | £25.83 | 52.5% | Yes | 0 | n/a | healthy, overpriced |
| iPad Air 4 | iPad Air 4 Battery | £149.00 | £124.17 | £20.00 | £36.00 | £0.00 | £2.98 | £65.19 | 52.5% | Yes | 0 | n/a | healthy, overpriced |
| iPad Mini 5 | iPad Mini 5 Battery | £149.00 | £124.17 | £20.00 | £36.00 | £0.00 | £2.98 | £65.19 | 52.5% | Yes | 0 | n/a | healthy, overpriced |
| iPad Pro 10.5 | iPad Pro 10.5 Battery | £149.00 | £124.17 | £20.00 | £36.00 | £0.00 | £2.98 | £65.19 | 52.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| iPhone SE3 | iPhone SE3 Microphone | £69.00 | £57.50 | £15.00 | £11.14 | £0.00 | £1.38 | £29.98 | 52.1% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Battery | £179.00 | £149.17 | £20.00 | £48.00 | £0.00 | £3.58 | £77.59 | 52.0% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Screen | £499.00 | £415.83 | £140.00 | £50.35 | £0.00 | £9.98 | £215.50 | 51.8% | Yes | 0 | n/a | healthy, overpriced |
| iPad 10 | iPad 10 Battery | £149.00 | £124.17 | £21.50 | £36.00 | £0.00 | £2.98 | £63.69 | 51.3% | Yes | 0 | n/a | healthy, overpriced |
| iPad Air 3 | iPad Air 3 Battery | £149.00 | £124.17 | £21.50 | £36.00 | £0.00 | £2.98 | £63.69 | 51.3% | Yes | 0 | n/a | healthy, overpriced |
| iPad Air 5 | iPad Air 5 Battery | £149.00 | £124.17 | £21.50 | £36.00 | £0.00 | £2.98 | £63.69 | 51.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 | iPhone 12 Screen | £199.00 | £165.83 | £35.00 | £17.82 | £24.00 | £3.98 | £85.03 | 51.3% | Yes | 0 | n/a | healthy, overpriced |
| iPhone 12 Pro | iPhone 12 Pro Screen | £199.00 | £165.83 | £35.00 | £17.82 | £24.00 | £3.98 | £85.03 | 51.3% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Screen | £339.00 | £282.50 | £99.00 | £33.15 | £0.00 | £6.78 | £143.57 | 50.8% | Yes | 0 | n/a | healthy, overpriced |
| iPad 5 | iPad 5 Glass and Touch Screen | £90.00 | £75.00 | £15.00 | £20.33 | £0.00 | £1.80 | £37.87 | 50.5% | No | 0 | n/a | healthy, overpriced, no-shopify |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Battery | £249.00 | £207.50 | £50.00 | £48.00 | £0.00 | £4.98 | £104.52 | 50.4% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 M1 Pro/Max A2442 Battery | £249.00 | £207.50 | £50.00 | £48.00 | £0.00 | £4.98 | £104.52 | 50.4% | Yes | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Battery | £249.00 | £207.50 | £50.00 | £48.00 | £0.00 | £4.98 | £104.52 | 50.4% | Yes | 0 | n/a | healthy, overpriced |
| Apple Watch S6 44mm | Apple Watch S6 44mm Battery | £139.00 | £115.83 | £6.82 | £48.00 | £0.00 | £2.78 | £58.23 | 50.3% | Yes | 0 | n/a | healthy, overpriced |
| iPad Air | iPad Air Glass Screen | £89.00 | £74.17 | £15.00 | £20.33 | £0.00 | £1.78 | £37.05 | 50.0% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S8 41MM | Apple Watch S8 41MM Display Screen | £219.00 | £182.50 | £40.00 | £48.00 | £0.00 | £4.38 | £90.12 | 49.4% | Yes | 0 | n/a | healthy |
| Apple Watch S8 41MM | Apple Watch S8 41MM Glass Screen | £219.00 | £182.50 | £40.00 | £48.00 | £0.00 | £4.38 | £90.12 | 49.4% | Yes | 0 | n/a | healthy |
| MacBook Pro 13 4TB 3 A2251 | Liquid Damage Treatment | £119.00 | £99.17 | £0.00 | £48.00 | £0.00 | £2.38 | £48.79 | 49.2% | No | 0 | n/a | healthy, no-shopify |
| iPhone 8 | iPhone 8 Charging Port | £59.00 | £49.17 | £15.00 | £9.25 | £0.00 | £1.18 | £23.74 | 48.3% | Yes | 0 | n/a | healthy |
| Apple Watch S7 41MM | Apple Watch S7 41MM Crown | £119.00 | £99.17 | £1.00 | £48.00 | £0.00 | £2.38 | £47.79 | 48.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S7 41MM | Apple Watch S7 41MM Side Button | £119.00 | £99.17 | £1.00 | £48.00 | £0.00 | £2.38 | £47.79 | 48.2% | Yes | 0 | n/a | healthy |
| Apple Watch S7 45MM | Apple Watch S7 45MM Crown | £119.00 | £99.17 | £1.00 | £48.00 | £0.00 | £2.38 | £47.79 | 48.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S7 45MM | Apple Watch S7 45MM Side Button | £119.00 | £99.17 | £1.00 | £48.00 | £0.00 | £2.38 | £47.79 | 48.2% | Yes | 0 | n/a | healthy |
| Apple Watch S8 41MM | Apple Watch S8 41MM Crown | £119.00 | £99.17 | £1.00 | £48.00 | £0.00 | £2.38 | £47.79 | 48.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S8 41MM | Apple Watch S8 41MM Side Button | £119.00 | £99.17 | £1.00 | £48.00 | £0.00 | £2.38 | £47.79 | 48.2% | Yes | 0 | n/a | healthy |
| Apple Watch S8 45MM | Apple Watch S8 45MM Crown | £119.00 | £99.17 | £1.00 | £48.00 | £0.00 | £2.38 | £47.79 | 48.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S8 45MM | Apple Watch S8 45MM Side Button | £119.00 | £99.17 | £1.00 | £48.00 | £0.00 | £2.38 | £47.79 | 48.2% | Yes | 0 | n/a | healthy |
| Apple Watch SE 40mm | Apple Watch SE 40mm Crown | £119.00 | £99.17 | £1.00 | £48.00 | £0.00 | £2.38 | £47.79 | 48.2% | Yes | 0 | n/a | healthy |
| Apple Watch SE 40mm | Apple Watch SE 40mm Side Button | £119.00 | £99.17 | £1.00 | £48.00 | £0.00 | £2.38 | £47.79 | 48.2% | Yes | 0 | n/a | healthy |
| Apple Watch SE 44mm | Apple Watch SE 44MM Crown | £119.00 | £99.17 | £1.00 | £48.00 | £0.00 | £2.38 | £47.79 | 48.2% | Yes | 0 | n/a | healthy |
| Apple Watch SE 44mm | Apple Watch SE 44MM Side Button | £119.00 | £99.17 | £1.00 | £48.00 | £0.00 | £2.38 | £47.79 | 48.2% | Yes | 0 | n/a | healthy |
| iPad 10 | iPad 10 Charging Port | £99.00 | £82.50 | £4.80 | £36.00 | £0.00 | £1.98 | £39.72 | 48.1% | Yes | 0 | n/a | healthy |
| iPad Mini 5 | iPad Mini 5 Charging Port | £99.00 | £82.50 | £4.80 | £36.00 | £0.00 | £1.98 | £39.72 | 48.1% | Yes | 0 | n/a | healthy |
| iPhone SE3 | iPhone SE3 Rear Housing (Rear Glass And Frame) | £129.00 | £107.50 | £42.00 | £11.20 | £0.00 | £2.58 | £51.72 | 48.1% | Yes | 0 | n/a | healthy |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Keyboard | £249.00 | £207.50 | £55.00 | £48.00 | £0.00 | £4.98 | £99.52 | 48.0% | Yes | 0 | n/a | healthy |
| Apple Watch S2 38mm | Apple Watch S2 38mm Battery | £129.00 | £107.50 | £5.79 | £48.00 | £0.00 | £2.58 | £51.13 | 47.6% | No | 0 | n/a | healthy, no-shopify |
| iPhone 12 Mini | iPhone 12 Mini Screen | £199.00 | £165.83 | £35.00 | £24.00 | £24.00 | £3.98 | £78.85 | 47.5% | Yes | 0 | n/a | healthy |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Screen | £639.00 | £532.50 | £228.00 | £39.11 | £0.00 | £12.78 | £252.61 | 47.4% | Yes | 0 | n/a | healthy |
| iPhone 15 | iPhone 15 Rear Camera | £129.00 | £107.50 | £30.00 | £24.00 | £0.00 | £2.58 | £50.92 | 47.4% | Yes | 0 | n/a | healthy |
| iPhone 14 Pro | iPhone 14 Pro Rear Camera | £119.00 | £99.17 | £35.00 | £14.91 | £0.00 | £2.38 | £46.87 | 47.3% | Yes | 0 | n/a | healthy |
| iPhone 11 | iPhone 11 Loudspeaker | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 11 | iPhone 11 Power Button | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 11 Pro | iPhone 11 Pro Loudspeaker | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 11 Pro | iPhone 11 Pro Mute Button | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 11 Pro | iPhone 11 Pro Power Button | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 11 Pro | iPhone 11 Pro Volume Button | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 11 Pro Max | iPhone 11 Pro Max Loudspeaker | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 11 Pro Max | iPhone 11 Pro Max Mute Button | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 11 Pro Max | iPhone 11 Pro Max Power Button | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 11 Pro Max | iPhone 11 Pro Max Volume Button | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 12 | iPhone 12 Loudspeaker | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 12 Mini | iPhone 12 Mini Loudspeaker | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 12 Pro | iPhone 12 Pro Loudspeaker | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 12 Pro Max | iPhone 12 Pro Max Loudspeaker | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 14 Pro Max | iPhone 14 Pro Max Loudspeaker | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone SE3 | iPhone SE3 Rear Camera Lens | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone XR | iPhone XR Microphone | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone XS | iPhone XS Microphone | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone XS | iPhone XS Power Button | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone XS Max | iPhone XS Max Mute Button | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone XS Max | iPhone XS Max Power Button | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone XS Max | iPhone XS Max Volume Button | £59.00 | £49.17 | £1.00 | £24.00 | £0.00 | £1.18 | £22.99 | 46.8% | Yes | 0 | n/a | healthy |
| iPhone 15 | iPhone 15 Screen | £289.00 | £240.83 | £80.00 | £20.79 | £24.00 | £5.78 | £110.27 | 45.8% | Yes | 0 | n/a | healthy |
| Apple Watch S6 44mm | Apple Watch S6 44mm Display Screen | £179.00 | £149.17 | £60.00 | £17.63 | £0.00 | £3.58 | £67.95 | 45.6% | Yes | 0 | n/a | healthy |
| Apple Watch S1 42mm | Apple Watch S1 42mm Battery | £129.00 | £107.50 | £8.02 | £48.00 | £0.00 | £2.58 | £48.90 | 45.5% | No | 0 | n/a | healthy, no-shopify |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Battery | £199.00 | £165.83 | £53.00 | £33.59 | £0.00 | £3.98 | £75.26 | 45.4% | Yes | 0 | n/a | healthy |
| iPhone 8 Plus | iPhone 8 Plus Front Camera | £89.00 | £74.17 | £15.00 | £24.00 | £0.00 | £1.78 | £33.39 | 45.0% | Yes | 0 | n/a | healthy |
| iPhone XR | iPhone XR Battery | £89.00 | £74.17 | £15.00 | £24.00 | £0.00 | £1.78 | £33.39 | 45.0% | Yes | 0 | n/a | healthy |
| Apple Watch S6 44mm | Apple Watch S6 44mm Glass Screen | £179.00 | £149.17 | £60.00 | £18.57 | £0.00 | £3.58 | £67.01 | 44.9% | Yes | 0 | n/a | healthy |
| iPhone 15 Plus | iPhone 15 Plus Screen | £289.00 | £240.83 | £80.00 | £24.00 | £24.00 | £5.78 | £107.05 | 44.5% | Yes | 0 | n/a | healthy |
| iPhone 12 Mini | iPhone 12 Mini Charging Port | £79.00 | £65.83 | £11.00 | £24.00 | £0.00 | £1.58 | £29.25 | 44.4% | Yes | 0 | n/a | healthy |
| iPhone 8 | iPhone 8 Microphone | £59.00 | £49.17 | £15.00 | £11.14 | £0.00 | £1.18 | £21.85 | 44.4% | Yes | 0 | n/a | healthy |
| iPhone SE2 | iPhone SE2 Microphone | £59.00 | £49.17 | £15.00 | £11.14 | £0.00 | £1.18 | £21.85 | 44.4% | Yes | 0 | n/a | healthy |
| Apple Watch S2 42mm | Apple Watch S2 42mm Battery | £129.00 | £107.50 | £9.26 | £48.00 | £0.00 | £2.58 | £47.66 | 44.3% | No | 0 | n/a | healthy, no-shopify |
| iPhone 15 Pro Max | iPhone 15 Pro Max Battery | £99.00 | £82.50 | £20.00 | £24.00 | £0.00 | £1.98 | £36.52 | 44.3% | Yes | 0 | n/a | healthy |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Screen | £599.00 | £499.17 | £228.00 | £39.37 | £0.00 | £11.98 | £219.82 | 44.0% | Yes | 0 | n/a | healthy |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Screen | £599.00 | £499.17 | £228.00 | £40.77 | £0.00 | £11.98 | £218.42 | 43.8% | Yes | 0 | n/a | healthy |
| iPhone 7 | iPhone 7 Battery | £59.00 | £49.17 | £2.50 | £24.00 | £0.00 | £1.18 | £21.49 | 43.7% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S1 38mm | Apple Watch S1 38mm Battery | £129.00 | £107.50 | £10.00 | £48.00 | £0.00 | £2.58 | £46.92 | 43.6% | No | 0 | n/a | healthy, no-shopify |
| iPad 4 | iPad 4 Glass and Touch Screen | £80.00 | £66.67 | £0.00 | £36.00 | £0.00 | £1.60 | £29.07 | 43.6% | No | 0 | n/a | healthy, no-shopify |
| iPad Mini 2 | iPad Mini 2 Glass and Touch | £80.00 | £66.67 | £0.00 | £36.00 | £0.00 | £1.60 | £29.07 | 43.6% | No | 0 | n/a | healthy, no-shopify |
| iPad Mini 3 | iPad Mini 3 Glass and Touch | £80.00 | £66.67 | £0.00 | £36.00 | £0.00 | £1.60 | £29.07 | 43.6% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S5 40mm | Apple Watch S5 40mm Battery | £139.00 | £115.83 | £14.68 | £48.00 | £0.00 | £2.78 | £50.37 | 43.5% | Yes | 0 | n/a | healthy |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Battery | £149.00 | £124.17 | £35.00 | £32.20 | £0.00 | £2.98 | £53.99 | 43.5% | Yes | 0 | n/a | healthy |
| Apple Watch S7 41MM | Apple Watch S7 41MM Battery | £139.00 | £115.83 | £15.00 | £48.00 | £0.00 | £2.78 | £50.05 | 43.2% | Yes | 0 | n/a | healthy |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Display Screen | £249.00 | £207.50 | £100.00 | £12.87 | £0.00 | £4.98 | £89.65 | 43.2% | No | 0 | n/a | healthy, no-shopify |
| iPhone 15 Pro | iPhone 15 Pro Rear Camera | £129.00 | £107.50 | £35.00 | £24.00 | £0.00 | £2.58 | £45.92 | 42.7% | Yes | 0 | n/a | healthy |
| iPhone 15 Pro Max | iPhone 15 Pro Max Rear Camera | £129.00 | £107.50 | £35.00 | £24.00 | £0.00 | £2.58 | £45.92 | 42.7% | Yes | 0 | n/a | healthy |
| iPad Pro 10.5 | iPad Pro 10.5 Charging Port | £99.00 | £82.50 | £9.60 | £36.00 | £0.00 | £1.98 | £34.92 | 42.3% | No | 0 | n/a | healthy, no-shopify |
| iPad Pro 9.7 | iPad Pro 9.7 Charging Port | £99.00 | £82.50 | £9.60 | £36.00 | £0.00 | £1.98 | £34.92 | 42.3% | No | 0 | n/a | healthy, no-shopify |
| Zebra PDA | Zebra PDA LCD | £216.00 | £180.00 | £65.14 | £36.00 | £0.00 | £4.32 | £74.54 | 41.4% | No | 0 | n/a | healthy, no-shopify |
| iPad 9 | iPad 9 Glass and Touch Screen | £149.00 | £124.17 | £50.00 | £20.07 | £0.00 | £2.98 | £51.11 | 41.2% | No | 0 | n/a | healthy, no-shopify |
| iPhone 12 Pro Max | iPhone 12 Pro Max Earpiece Speaker | £79.00 | £65.83 | £13.57 | £24.00 | £0.00 | £1.58 | £26.68 | 40.5% | Yes | 0 | n/a | healthy |
| iPad 9 | iPad 9 Display Screen | £119.00 | £99.17 | £40.00 | £17.33 | £0.00 | £2.38 | £39.46 | 39.8% | Yes | 0 | n/a | healthy, price-mismatch |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Display Screen | £249.00 | £207.50 | £100.00 | £20.48 | £0.00 | £4.98 | £82.04 | 39.5% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S1 42mm | Apple Watch S1 42mm Crown | £99.00 | £82.50 | £0.00 | £48.00 | £0.00 | £1.98 | £32.52 | 39.4% | No | 0 | n/a | healthy, no-shopify |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Charging Port | £99.00 | £82.50 | £0.00 | £48.00 | £0.00 | £1.98 | £32.52 | 39.4% | Yes | 0 | n/a | healthy |
| Apple Watch S4 40mm | Apple Watch S4 40mm Battery | £129.00 | £107.50 | £15.30 | £48.00 | £0.00 | £2.58 | £41.62 | 38.7% | Yes | 0 | n/a | healthy |
| iPhone 8 | iPhone 8 Battery | £59.00 | £49.17 | £5.00 | £24.00 | £0.00 | £1.18 | £18.99 | 38.6% | Yes | 0 | n/a | healthy |
| iPhone SE3 | iPhone SE3 Earpiece Speaker | £59.00 | £49.17 | £5.00 | £24.00 | £0.00 | £1.18 | £18.99 | 38.6% | Yes | 0 | n/a | healthy |
| iPhone 14 Plus | iPhone 14 Plus Battery | £79.00 | £65.83 | £15.00 | £24.00 | £0.00 | £1.58 | £25.25 | 38.4% | Yes | 0 | n/a | healthy |
| Apple Watch S1 38mm | Apple Watch S1 38mm Crown | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S1 38mm | Apple Watch S1 38mm Side Button | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S1 42mm | Apple Watch S1 42mm Side Button | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S2 38mm | Apple Watch S2 38mm Crown | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S2 38mm | Apple Watch S2 38mm Side Button | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S2 42mm | Apple Watch S2 42mm Crown | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S2 42mm | Apple Watch S2 42mm Side Button | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S3 38mm | Apple Watch S3 38mm Crown | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S3 38mm | Apple Watch S3 38mm Side Button | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S3 42mm | Apple Watch S3 42mm Crown | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S3 42mm | Apple Watch S3 42mm Side Button | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S4 40mm | Apple Watch S4 40mm Crown | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | Yes | 0 | n/a | healthy |
| Apple Watch S4 40mm | Apple Watch S4 40mm Side Button | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | Yes | 0 | n/a | healthy |
| Apple Watch S4 44mm | Apple Watch S4 44mm Crown | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | Yes | 0 | n/a | healthy |
| Apple Watch S4 44mm | Apple Watch S4 44mm Side Button | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | Yes | 0 | n/a | healthy |
| Apple Watch S5 40mm | Apple Watch S5 40mm Crown | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | Yes | 0 | n/a | healthy |
| Apple Watch S5 40mm | Apple Watch S5 40mm Side Button | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | Yes | 0 | n/a | healthy |
| Apple Watch S5 44mm | Apple Watch S5 44mm Crown | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | Yes | 0 | n/a | healthy |
| Apple Watch S5 44mm | Apple Watch S5 44mm Side Button | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | Yes | 0 | n/a | healthy |
| Apple Watch S6 40mm | Apple Watch S6 40mm Crown | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | Yes | 0 | n/a | healthy |
| Apple Watch S6 40mm | Apple Watch S6 40mm Side Button | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | Yes | 0 | n/a | healthy |
| Apple Watch S6 44mm | Apple Watch S6 44mm Crown | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | Yes | 0 | n/a | healthy |
| Apple Watch S6 44mm | Apple Watch S6 44mm Side Button | £99.00 | £82.50 | £1.00 | £48.00 | £0.00 | £1.98 | £31.52 | 38.2% | Yes | 0 | n/a | healthy |
| iPhone 12 | iPhone 12 Rear Camera | £119.00 | £99.17 | £35.00 | £24.00 | £0.00 | £2.38 | £37.79 | 38.1% | Yes | 0 | n/a | healthy |
| iPhone 12 Mini | iPhone 12 Mini Rear Camera | £119.00 | £99.17 | £35.00 | £24.00 | £0.00 | £2.38 | £37.79 | 38.1% | Yes | 0 | n/a | healthy |
| iPhone 14 | iPhone 14 Rear Camera | £119.00 | £99.17 | £35.00 | £24.00 | £0.00 | £2.38 | £37.79 | 38.1% | Yes | 0 | n/a | healthy |
| iPhone 14 | iPhone 14 Screen | £239.00 | £199.17 | £80.00 | £15.08 | £24.00 | £4.78 | £75.31 | 37.8% | Yes | 0 | n/a | healthy |
| iPhone 6 | iPhone 6 Wifi  Module | £50.00 | £41.67 | £1.00 | £24.00 | £0.00 | £1.00 | £15.67 | 37.6% | No | 0 | n/a | healthy, no-shopify |
| iPhone 6 Plus | iPhone 6 Plus Loudspeaker | £50.00 | £41.67 | £1.00 | £24.00 | £0.00 | £1.00 | £15.67 | 37.6% | No | 0 | n/a | healthy, no-shopify |
| iPhone 6 Plus | iPhone 6 Plus Wifi  Module | £50.00 | £41.67 | £1.00 | £24.00 | £0.00 | £1.00 | £15.67 | 37.6% | No | 0 | n/a | healthy, no-shopify |
| iPhone 6S Plus | iPhone 6s Plus Loudspeaker | £50.00 | £41.67 | £1.00 | £24.00 | £0.00 | £1.00 | £15.67 | 37.6% | No | 0 | n/a | healthy, no-shopify |
| iPhone SE2 | iPhone SE2 Wifi Module | £50.00 | £41.67 | £1.00 | £24.00 | £0.00 | £1.00 | £15.67 | 37.6% | No | 0 | n/a | healthy, no-shopify |
| iPhone X | iPhone X WIFI Module | £50.00 | £41.67 | £1.00 | £24.00 | £0.00 | £1.00 | £15.67 | 37.6% | No | 0 | n/a | healthy, no-shopify |
| iPhone XR | iPhone XR WIFI Module | £50.00 | £41.67 | £1.00 | £24.00 | £0.00 | £1.00 | £15.67 | 37.6% | No | 0 | n/a | healthy, no-shopify |
| iPhone XS | iPhone XS WIFI Module | £50.00 | £41.67 | £1.00 | £24.00 | £0.00 | £1.00 | £15.67 | 37.6% | No | 0 | n/a | healthy, no-shopify |
| iPhone XS Max | iPhone XS Max WIFI Module | £50.00 | £41.67 | £1.00 | £24.00 | £0.00 | £1.00 | £15.67 | 37.6% | No | 0 | n/a | healthy, no-shopify |
| iPhone 15 Pro | iPhone 15 Pro Screen | £339.00 | £282.50 | £130.00 | £16.66 | £24.00 | £6.78 | £105.06 | 37.2% | Yes | 0 | n/a | healthy |
| iPod Touch 6th Gen | iPod Touch 6th Gen Screen | £80.00 | £66.67 | £31.04 | £9.31 | £0.00 | £1.60 | £24.72 | 37.1% | No | 0 | n/a | healthy, no-shopify |
| iPod Touch 7th Gen | iPod Touch 7th Gen Screen | £80.00 | £66.67 | £31.04 | £9.31 | £0.00 | £1.60 | £24.72 | 37.1% | No | 0 | n/a | healthy, no-shopify |
| iPhone X | iPhone X Rear Camera Lens | £49.00 | £40.83 | £0.78 | £24.00 | £0.00 | £0.98 | £15.07 | 36.9% | Yes | 0 | n/a | healthy |
| iPhone 12 Pro Max | iPhone 12 Pro Max Rear Camera | £129.00 | £107.50 | £45.00 | £20.36 | £0.00 | £2.58 | £39.56 | 36.8% | Yes | 0 | n/a | healthy |
| iPad 8 | iPad 8 Display Screen | £119.00 | £99.17 | £40.00 | £20.48 | £0.00 | £2.38 | £36.31 | 36.6% | Yes | 0 | n/a | healthy |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Trackpad | £249.00 | £207.50 | £79.00 | £48.00 | £0.00 | £4.98 | £75.52 | 36.4% | Yes | 0 | n/a | healthy |
| iPhone 7 | iPhone 7 Loudspeaker | £49.00 | £40.83 | £1.00 | £24.00 | £0.00 | £0.98 | £14.85 | 36.4% | No | 0 | n/a | healthy, no-shopify |
| iPhone 7 | iPhone 7 Mute Button | £49.00 | £40.83 | £1.00 | £24.00 | £0.00 | £0.98 | £14.85 | 36.4% | No | 0 | n/a | healthy, no-shopify |
| iPhone 7 | iPhone 7 Power Button | £49.00 | £40.83 | £1.00 | £24.00 | £0.00 | £0.98 | £14.85 | 36.4% | No | 0 | n/a | healthy, no-shopify |
| iPhone 7 | iPhone 7 Rear Camera Lens | £49.00 | £40.83 | £1.00 | £24.00 | £0.00 | £0.98 | £14.85 | 36.4% | No | 0 | n/a | healthy, no-shopify |
| iPhone 7 | iPhone 7 Volume Button | £49.00 | £40.83 | £1.00 | £24.00 | £0.00 | £0.98 | £14.85 | 36.4% | No | 0 | n/a | healthy, no-shopify |
| iPhone 7 Plus | iPhone 7 Plus Loudspeaker | £49.00 | £40.83 | £1.00 | £24.00 | £0.00 | £0.98 | £14.85 | 36.4% | No | 0 | n/a | healthy, no-shopify |
| iPhone 8 | iPhone 8 Rear Camera Lens | £49.00 | £40.83 | £1.00 | £24.00 | £0.00 | £0.98 | £14.85 | 36.4% | Yes | 0 | n/a | healthy |
| iPhone SE2 | iPhone SE2 Rear Camera Lens | £49.00 | £40.83 | £1.00 | £24.00 | £0.00 | £0.98 | £14.85 | 36.4% | Yes | 0 | n/a | healthy |
| iPhone XR | iPhone XR Loudspeaker | £49.00 | £40.83 | £1.00 | £24.00 | £0.00 | £0.98 | £14.85 | 36.4% | Yes | 0 | n/a | healthy |
| iPhone XS | iPhone XS Loudspeaker | £49.00 | £40.83 | £1.00 | £24.00 | £0.00 | £0.98 | £14.85 | 36.4% | Yes | 0 | n/a | healthy |
| iPhone XS Max | iPhone XS Max Loudspeaker | £49.00 | £40.83 | £1.00 | £24.00 | £0.00 | £0.98 | £14.85 | 36.4% | Yes | 0 | n/a | healthy |
| Apple Watch S2 42mm | Apple Watch S2 42mm Display Screen | £179.00 | £149.17 | £76.94 | £14.78 | £0.00 | £3.58 | £53.87 | 36.1% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S3 42mm | Apple Watch S3 42mm Display Screen | £179.00 | £149.17 | £76.94 | £14.78 | £0.00 | £3.58 | £53.87 | 36.1% | No | 0 | n/a | healthy, no-shopify |
| iPad 5 | iPad 5 Charging Port | £79.00 | £65.83 | £4.80 | £36.00 | £0.00 | £1.58 | £23.45 | 35.6% | No | 0 | n/a | healthy, no-shopify |
| iPad Air 3 | iPad Air 3 Charging Port | £79.00 | £65.83 | £4.80 | £36.00 | £0.00 | £1.58 | £23.45 | 35.6% | Yes | 0 | n/a | healthy |
| iPad Mini 4 | iPad Mini 4 Charging Port | £79.00 | £65.83 | £4.80 | £36.00 | £0.00 | £1.58 | £23.45 | 35.6% | No | 0 | n/a | healthy, no-shopify |
| iPhone 6 | iPhone 6 Loudspeaker | £50.00 | £41.67 | £2.00 | £24.00 | £0.00 | £1.00 | £14.67 | 35.2% | No | 0 | n/a | healthy, no-shopify |
| iPhone 12 Pro | iPhone 12 Pro Rear Camera | £129.00 | £107.50 | £55.00 | £12.19 | £0.00 | £2.58 | £37.73 | 35.1% | Yes | 0 | n/a | healthy |
| iPhone 11 Pro | iPhone 11 Pro Screen | £189.00 | £157.50 | £60.00 | £14.61 | £24.00 | £3.78 | £55.11 | 35.0% | Yes | 0 | n/a | healthy |
| iPhone 14 Pro Max | iPhone 14 Pro Max Screen | £299.00 | £249.17 | £120.00 | £12.55 | £24.00 | £5.98 | £86.63 | 34.8% | Yes | 21 | 1.9 | healthy |
| Apple Watch S4 44mm | Apple Watch S4 44mm Battery | £129.00 | £107.50 | £20.00 | £48.00 | £0.00 | £2.58 | £36.92 | 34.3% | Yes | 0 | n/a | healthy |
| iPhone 11 Pro Max | iPhone 11 Pro Max Screen | £189.00 | £157.50 | £65.00 | £10.78 | £24.00 | £3.78 | £53.94 | 34.2% | Yes | 0 | n/a | healthy |
| iPhone 13 Pro | iPhone 13 Pro Rear Camera | £119.00 | £99.17 | £50.00 | £12.83 | £0.00 | £2.38 | £33.96 | 34.2% | Yes | 0 | n/a | healthy |
| iPhone 13 Pro Max | iPhone 13 Pro Max Rear Camera | £119.00 | £99.17 | £50.00 | £12.83 | £0.00 | £2.38 | £33.96 | 34.2% | Yes | 0 | n/a | healthy |
| iPod Touch 6th Gen | iPod Touch 6th Gen Charging Port | £70.00 | £58.33 | £1.00 | £36.00 | £0.00 | £1.40 | £19.93 | 34.2% | No | 0 | n/a | healthy, no-shopify |
| iPod Touch 7th Gen | iPod Touch 7th Gen Charging Port | £70.00 | £58.33 | £1.00 | £36.00 | £0.00 | £1.40 | £19.93 | 34.2% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S3 42mm | Apple Watch S3 42mm Battery | £129.00 | £107.50 | £20.22 | £48.00 | £0.00 | £2.58 | £36.70 | 34.1% | No | 0 | n/a | healthy, no-shopify |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Trackpad | £199.00 | £165.83 | £58.00 | £48.00 | £0.00 | £3.98 | £55.85 | 33.7% | Yes | 0 | n/a | healthy |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Trackpad | £199.00 | £165.83 | £58.00 | £48.00 | £0.00 | £3.98 | £55.85 | 33.7% | Yes | 0 | n/a | healthy |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Trackpad | £199.00 | £165.83 | £58.00 | £48.00 | £0.00 | £3.98 | £55.85 | 33.7% | Yes | 0 | n/a | healthy |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Trackpad | £199.00 | £165.83 | £58.00 | £48.00 | £0.00 | £3.98 | £55.85 | 33.7% | Yes | 0 | n/a | healthy |
| iPhone 14 Pro Max | iPhone 14 Pro Max Rear Camera | £119.00 | £99.17 | £40.00 | £24.00 | £0.00 | £2.38 | £32.79 | 33.1% | Yes | 0 | n/a | healthy |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Trackpad | £249.00 | £207.50 | £86.00 | £48.00 | £0.00 | £4.98 | £68.52 | 33.0% | Yes | 0 | n/a | healthy |
| Apple Watch S3 38mm | Apple Watch S3 38mm Battery | £129.00 | £107.50 | £21.56 | £48.00 | £0.00 | £2.58 | £35.36 | 32.9% | No | 0 | n/a | healthy, no-shopify |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) Battery | £159.00 | £132.50 | £50.00 | £36.00 | £0.00 | £3.18 | £43.32 | 32.7% | Yes | 0 | n/a | healthy |
| iPhone 7 Plus | iPhone 7 Plus Battery | £59.00 | £49.17 | £8.00 | £24.00 | £0.00 | £1.18 | £15.99 | 32.5% | No | 0 | n/a | healthy, no-shopify |
| iPhone 11 | iPhone 11 Screen | £109.00 | £90.83 | £25.00 | £10.99 | £24.00 | £2.18 | £28.66 | 31.6% | No | 1 | 14.3 | healthy, no-shopify |
| iPhone 14 Pro | iPhone 14 Pro Screen | £249.00 | £207.50 | £100.00 | £13.07 | £24.00 | £4.98 | £65.45 | 31.5% | Yes | 0 | n/a | healthy |
| iPhone 7 Plus | iPhone 7 Plus Rear Camera Lens | £49.00 | £40.83 | £3.00 | £24.00 | £0.00 | £0.98 | £12.85 | 31.5% | No | 0 | n/a | healthy, no-shopify |
| iPhone 8 Plus | iPhone 8 Plus Rear Camera Lens | £49.00 | £40.83 | £3.00 | £24.00 | £0.00 | £0.98 | £12.85 | 31.5% | Yes | 0 | n/a | healthy |
| iPhone X | iPhone X Earpiece Speaker | £79.00 | £65.83 | £20.00 | £24.00 | £0.00 | £1.58 | £20.25 | 30.8% | Yes | 0 | n/a | healthy |
| iPhone 7 | iPhone 7 Original LCD Screen | £129.00 | £107.50 | £35.00 | £13.17 | £24.00 | £2.58 | £32.75 | 30.5% | No | 0 | n/a | healthy, no-shopify |
| Apple Watch S7 45MM | Apple Watch S7 45MM Battery | £139.00 | £115.83 | £30.00 | £48.00 | £0.00 | £2.78 | £35.05 | 30.3% | Yes | 0 | n/a | healthy |
| iPhone 15 Pro Max | iPhone 15 Pro Max Screen | £359.00 | £299.17 | £150.00 | £28.65 | £24.00 | £7.18 | £89.34 | 29.9% | Yes | 11 | 2.4 | thin |
| Apple Watch S4 40mm | Apple Watch S4 40mm Glass Screen | £179.00 | £149.17 | £80.00 | £21.18 | £0.00 | £3.58 | £44.41 | 29.8% | Yes | 0 | n/a | thin |
| iPad Mini 4 | iPad Mini 4 Battery | £79.00 | £65.83 | £9.00 | £36.00 | £0.00 | £1.58 | £19.25 | 29.2% | No | 0 | n/a | thin, no-shopify |
| iPad Air 4 | iPad Air 4 Display Screen | £249.00 | £207.50 | £120.00 | £22.66 | £0.00 | £4.98 | £59.86 | 28.8% | No | 0 | n/a | thin, no-shopify |
| iPhone 11 | iPhone 11 Mute Button | £59.00 | £49.17 | £10.00 | £24.00 | £0.00 | £1.18 | £13.99 | 28.4% | Yes | 0 | n/a | thin |
| iPhone 11 | iPhone 11 Volume Button | £59.00 | £49.17 | £10.00 | £24.00 | £0.00 | £1.18 | £13.99 | 28.4% | Yes | 0 | n/a | thin |
| iPhone 12 Mini | iPhone 12 Mini Rear Camera Lens | £59.00 | £49.17 | £10.00 | £24.00 | £0.00 | £1.18 | £13.99 | 28.4% | Yes | 0 | n/a | thin |
| iPhone SE3 | iPhone SE3 Mute Button | £59.00 | £49.17 | £10.00 | £24.00 | £0.00 | £1.18 | £13.99 | 28.4% | Yes | 0 | n/a | thin |
| iPhone SE3 | iPhone SE3 Power Button | £59.00 | £49.17 | £10.00 | £24.00 | £0.00 | £1.18 | £13.99 | 28.4% | Yes | 0 | n/a | thin |
| iPhone SE3 | iPhone SE3 Volume Button | £59.00 | £49.17 | £10.00 | £24.00 | £0.00 | £1.18 | £13.99 | 28.4% | Yes | 0 | n/a | thin |
| iPhone X | iPhone X Mute Button | £59.00 | £49.17 | £10.00 | £24.00 | £0.00 | £1.18 | £13.99 | 28.4% | Yes | 0 | n/a | thin |
| iPhone X | iPhone X Power Button | £59.00 | £49.17 | £10.00 | £24.00 | £0.00 | £1.18 | £13.99 | 28.4% | Yes | 0 | n/a | thin |
| iPhone X | iPhone X Volume Button | £59.00 | £49.17 | £10.00 | £24.00 | £0.00 | £1.18 | £13.99 | 28.4% | Yes | 0 | n/a | thin |
| iPhone XR | iPhone XR Mute Button | £59.00 | £49.17 | £10.00 | £24.00 | £0.00 | £1.18 | £13.99 | 28.4% | Yes | 0 | n/a | thin |
| iPhone XR | iPhone XR Power Button | £59.00 | £49.17 | £10.00 | £24.00 | £0.00 | £1.18 | £13.99 | 28.4% | Yes | 0 | n/a | thin |
| iPhone XR | iPhone XR Volume Button | £59.00 | £49.17 | £10.00 | £24.00 | £0.00 | £1.18 | £13.99 | 28.4% | Yes | 0 | n/a | thin |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Screen | £429.00 | £357.50 | £200.00 | £47.62 | £0.00 | £8.58 | £101.30 | 28.3% | Yes | 0 | n/a | thin |
| iPad 6 | iPad 6 Charging Port | £79.00 | £65.83 | £9.60 | £36.00 | £0.00 | £1.58 | £18.65 | 28.3% | Yes | 0 | n/a | thin |
| iPad 7 | iPad 7 Charging Port | £79.00 | £65.83 | £9.60 | £36.00 | £0.00 | £1.58 | £18.65 | 28.3% | Yes | 0 | n/a | thin |
| iPad Air | iPad Air Charging Port | £79.00 | £65.83 | £9.60 | £36.00 | £0.00 | £1.58 | £18.65 | 28.3% | No | 0 | n/a | thin, no-shopify |
| iPad Air 2 | iPad Air 2 Charging Port | £79.00 | £65.83 | £9.60 | £36.00 | £0.00 | £1.58 | £18.65 | 28.3% | No | 0 | n/a | thin, no-shopify |
| iPad Mini 2 | iPad Mini 2 Charging Port | £79.00 | £65.83 | £9.60 | £36.00 | £0.00 | £1.58 | £18.65 | 28.3% | No | 0 | n/a | thin, no-shopify |
| iPad Mini 3 | iPad Mini 3 Charging Port | £79.00 | £65.83 | £9.60 | £36.00 | £0.00 | £1.58 | £18.65 | 28.3% | No | 0 | n/a | thin, no-shopify |
| Apple Watch S4 40mm | Apple Watch S4 40mm Display Screen | £179.00 | £149.17 | £80.00 | £23.42 | £0.00 | £3.58 | £42.17 | 28.3% | Yes | 0 | n/a | thin |
| iPhone 6s, iPhone 5 | iPhone 6s Loudspeaker | £50.00 | £41.67 | £5.00 | £24.00 | £0.00 | £1.00 | £11.67 | 28.0% | No | 0 | n/a | thin, no-shopify |
| iPad Air 5 | iPad Air 5 Display Screen | £249.00 | £207.50 | £120.00 | £24.53 | £0.00 | £4.98 | £57.99 | 27.9% | No | 0 | n/a | thin, no-shopify |
| iPhone 14 Plus | iPhone 14 Plus Screen | £249.00 | £207.50 | £100.00 | £20.65 | £24.00 | £4.98 | £57.87 | 27.9% | Yes | 0 | n/a | thin |
| iPhone XR | iPhone XR Charging Port | £59.00 | £49.17 | £20.00 | £14.63 | £0.00 | £1.18 | £13.36 | 27.2% | Yes | 0 | n/a | thin |
| iPhone X | iPhone X Display (Original OLED Screen) | £149.00 | £124.17 | £40.00 | £23.53 | £24.00 | £2.98 | £33.66 | 27.1% | Yes | 0 | n/a | thin |
| MacBook 12 A1534 | MacBook 12 A1534 Battery | £199.00 | £165.83 | £69.20 | £48.00 | £0.00 | £3.98 | £44.65 | 26.9% | No | 0 | n/a | thin, no-shopify |
| iPad 9 | iPad 9 Glass Screen | £119.00 | £99.17 | £50.00 | £20.11 | £0.00 | £2.38 | £26.67 | 26.9% | No | 0 | n/a | thin, no-shopify |
| iPhone 8 Plus | iPhone 8 Plus Rear Camera | £100.00 | £83.33 | £35.00 | £24.00 | £0.00 | £2.00 | £22.33 | 26.8% | Yes | 0 | n/a | thin |
| iPad 4 | iPad 4 Charging Port | £69.00 | £57.50 | £4.80 | £36.00 | £0.00 | £1.38 | £15.32 | 26.6% | No | 0 | n/a | thin, no-shopify |
| iPhone 8 | iPhone 8 Loudspeaker | £49.00 | £40.83 | £5.00 | £24.00 | £0.00 | £0.98 | £10.85 | 26.6% | Yes | 0 | n/a | thin |
| iPhone SE2 | iPhone SE2 Earpiece Speaker | £49.00 | £40.83 | £5.00 | £24.00 | £0.00 | £0.98 | £10.85 | 26.6% | Yes | 0 | n/a | thin |
| iPhone SE2 | iPhone SE2 Front Camera | £49.00 | £40.83 | £5.00 | £24.00 | £0.00 | £0.98 | £10.85 | 26.6% | Yes | 0 | n/a | thin |
| iPhone SE2 | iPhone SE2 Loudspeaker | £49.00 | £40.83 | £5.00 | £24.00 | £0.00 | £0.98 | £10.85 | 26.6% | Yes | 0 | n/a | thin |
| iPhone SE2 | iPhone SE2 Proximity Sensor | £49.00 | £40.83 | £5.00 | £24.00 | £0.00 | £0.98 | £10.85 | 26.6% | No | 0 | n/a | thin, no-shopify |
| iPhone SE3 | iPhone SE3 Front Camera | £49.00 | £40.83 | £5.00 | £24.00 | £0.00 | £0.98 | £10.85 | 26.6% | Yes | 0 | n/a | thin |
| iPhone SE3 | iPhone SE3 Loudspeaker | £49.00 | £40.83 | £5.00 | £24.00 | £0.00 | £0.98 | £10.85 | 26.6% | Yes | 0 | n/a | thin |
| iPhone X | iPhone X Loudspeaker | £49.00 | £40.83 | £5.00 | £24.00 | £0.00 | £0.98 | £10.85 | 26.6% | Yes | 0 | n/a | thin |
| iPhone XR | iPhone XR Rear Camera Lens | £49.00 | £40.83 | £5.00 | £24.00 | £0.00 | £0.98 | £10.85 | 26.6% | Yes | 0 | n/a | thin |
| iPhone XS | iPhone XS Rear Camera Lens | £49.00 | £40.83 | £5.00 | £24.00 | £0.00 | £0.98 | £10.85 | 26.6% | Yes | 0 | n/a | thin |
| iPhone XS Max | iPhone XS Max Rear Camera Lens | £49.00 | £40.83 | £5.00 | £24.00 | £0.00 | £0.98 | £10.85 | 26.6% | Yes | 0 | n/a | thin |
| Apple Watch S1 38mm | Apple Watch S1 38mm Display Screen | £179.00 | £149.17 | £60.00 | £48.00 | £0.00 | £3.58 | £37.59 | 25.2% | No | 0 | n/a | thin, no-shopify |
| Apple Watch S1 42mm | Apple Watch S1 42mm Display Screen | £179.00 | £149.17 | £60.00 | £48.00 | £0.00 | £3.58 | £37.59 | 25.2% | No | 0 | n/a | thin, no-shopify |
| iPad 7 | iPad 7 Display Screen | £99.00 | £82.50 | £40.00 | £20.48 | £0.00 | £1.98 | £20.04 | 24.3% | Yes | 0 | n/a | thin |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Battery | £159.00 | £132.50 | £23.99 | £73.25 | £0.00 | £3.18 | £32.08 | 24.2% | Yes | 0 | n/a | thin |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Battery | £159.00 | £132.50 | £23.99 | £73.25 | £0.00 | £3.18 | £32.08 | 24.2% | Yes | 0 | n/a | thin |
| iPhone XR | iPhone XR Earpiece Speaker | £79.00 | £65.83 | £25.00 | £24.00 | £0.00 | £1.58 | £15.25 | 23.2% | Yes | 0 | n/a | thin |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Screen | £399.00 | £332.50 | £200.00 | £49.18 | £0.00 | £7.98 | £75.34 | 22.7% | Yes | 0 | n/a | thin |
| iPhone 6 Plus | iPhone 6 Plus Rear Camera Lens | £40.00 | £33.33 | £1.00 | £24.00 | £0.00 | £0.80 | £7.53 | 22.6% | No | 0 | n/a | thin, no-shopify |
| iPhone 6S Plus | iPhone 6s Plus Rear Camera Lens | £40.00 | £33.33 | £1.00 | £24.00 | £0.00 | £0.80 | £7.53 | 22.6% | No | 0 | n/a | thin, no-shopify |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Trackpad | £199.00 | £165.83 | £78.00 | £48.00 | £0.00 | £3.98 | £35.85 | 21.6% | Yes | 0 | n/a | thin |
| iPhone 6 | iPhone 6 Rear Camera Lens | £40.00 | £33.33 | £2.00 | £24.00 | £0.00 | £0.80 | £6.53 | 19.6% | No | 0 | n/a | thin, no-shopify |
| iPhone 11 Pro | iPhone 11 Pro Charging Port | £69.00 | £57.50 | £21.00 | £24.00 | £0.00 | £1.38 | £11.12 | 19.3% | Yes | 0 | n/a | thin |
| iPhone 11 Pro | iPhone 11 Pro Microphone | £69.00 | £57.50 | £21.00 | £24.00 | £0.00 | £1.38 | £11.12 | 19.3% | Yes | 0 | n/a | thin |
| Apple Watch S4 44mm | Apple Watch S4 44mm Display Screen | £179.00 | £149.17 | £100.00 | £18.29 | £0.00 | £3.58 | £27.29 | 18.3% | Yes | 0 | n/a | thin |
| Apple Watch S4 44mm | Apple Watch S4 44mm Glass Screen | £179.00 | £149.17 | £100.00 | £18.29 | £0.00 | £3.58 | £27.29 | 18.3% | Yes | 0 | n/a | thin |
| iPhone 8 Plus | iPhone 8 Plus Battery | £59.00 | £49.17 | £15.00 | £24.00 | £0.00 | £1.18 | £8.99 | 18.3% | Yes | 0 | n/a | thin |
| iPhone 11 | iPhone 11 Rear Camera | £89.00 | £74.17 | £35.00 | £24.00 | £0.00 | £1.78 | £13.39 | 18.0% | Yes | 0 | n/a | thin |
| iPhone 11 Pro | iPhone 11 Pro Rear Camera | £89.00 | £74.17 | £35.00 | £24.00 | £0.00 | £1.78 | £13.39 | 18.0% | Yes | 0 | n/a | thin |
| iPhone 11 Pro Max | iPhone 11 Pro Max Rear Camera | £89.00 | £74.17 | £35.00 | £24.00 | £0.00 | £1.78 | £13.39 | 18.0% | Yes | 0 | n/a | thin |
| Zebra PDA | Zebra PDA Touch Screen | £144.00 | £120.00 | £60.00 | £36.00 | £0.00 | £2.88 | £21.12 | 17.6% | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Trackpad | £249.00 | £207.50 | £118.00 | £48.00 | £0.00 | £4.98 | £36.52 | 17.6% | Yes | 0 | n/a | thin |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Trackpad | £249.00 | £207.50 | £118.00 | £48.00 | £0.00 | £4.98 | £36.52 | 17.6% | Yes | 0 | n/a | thin |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Trackpad | £199.00 | £165.83 | £87.00 | £48.00 | £0.00 | £3.98 | £26.85 | 16.2% | Yes | 0 | n/a | thin |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Trackpad | £199.00 | £165.83 | £87.00 | £48.00 | £0.00 | £3.98 | £26.85 | 16.2% | Yes | 0 | n/a | thin |
| iPhone 15 Pro Max | iPhone 15 Pro Max Rear Glass | £279.00 | £232.50 | £165.00 | £24.33 | £0.00 | £5.58 | £37.59 | 16.2% | Yes | 0 | n/a | thin |
| iPhone 6 | iPhone 6 Mute Button | £50.00 | £41.67 | £10.00 | £24.00 | £0.00 | £1.00 | £6.67 | 16.0% | No | 0 | n/a | thin, no-shopify |
| iPhone 6 | iPhone 6 Power Button | £50.00 | £41.67 | £10.00 | £24.00 | £0.00 | £1.00 | £6.67 | 16.0% | No | 0 | n/a | thin, no-shopify |
| iPhone 6 | iPhone 6 Volume Button | £50.00 | £41.67 | £10.00 | £24.00 | £0.00 | £1.00 | £6.67 | 16.0% | No | 0 | n/a | thin, no-shopify |
| iPhone 6 Plus | iPhone 6 Plus Mute Button | £50.00 | £41.67 | £10.00 | £24.00 | £0.00 | £1.00 | £6.67 | 16.0% | No | 0 | n/a | thin, no-shopify |
| iPhone 6 Plus | iPhone 6 Plus Power Button | £50.00 | £41.67 | £10.00 | £24.00 | £0.00 | £1.00 | £6.67 | 16.0% | No | 0 | n/a | thin, no-shopify |
| iPhone 6 Plus | iPhone 6 Plus Volume Button | £50.00 | £41.67 | £10.00 | £24.00 | £0.00 | £1.00 | £6.67 | 16.0% | No | 0 | n/a | thin, no-shopify |
| iPhone 6S Plus | iPhone 6s Plus Mute Button | £50.00 | £41.67 | £10.00 | £24.00 | £0.00 | £1.00 | £6.67 | 16.0% | No | 0 | n/a | thin, no-shopify |
| iPhone 6S Plus | iPhone 6s Plus Power Button | £50.00 | £41.67 | £10.00 | £24.00 | £0.00 | £1.00 | £6.67 | 16.0% | No | 0 | n/a | thin, no-shopify |
| iPhone 6S Plus | iPhone 6s Plus Volume Button | £50.00 | £41.67 | £10.00 | £24.00 | £0.00 | £1.00 | £6.67 | 16.0% | No | 0 | n/a | thin, no-shopify |
| iPhone 6s, iPhone 5 | iPhone 6s Charging Port | £50.00 | £41.67 | £10.00 | £24.00 | £0.00 | £1.00 | £6.67 | 16.0% | No | 0 | n/a | thin, no-shopify |
| iPhone 6s, iPhone 5 | iPhone 6s Microphone | £50.00 | £41.67 | £10.00 | £24.00 | £0.00 | £1.00 | £6.67 | 16.0% | No | 0 | n/a | thin, no-shopify |
| iPhone 6s, iPhone 5 | iPhone 6s Mute Button | £50.00 | £41.67 | £10.00 | £24.00 | £0.00 | £1.00 | £6.67 | 16.0% | No | 0 | n/a | thin, no-shopify |
| iPhone 6s, iPhone 5 | iPhone 6s Power Button | £50.00 | £41.67 | £10.00 | £24.00 | £0.00 | £1.00 | £6.67 | 16.0% | No | 0 | n/a | thin, no-shopify |
| iPhone 6s, iPhone 5 | iPhone 6s Volume Button | £50.00 | £41.67 | £10.00 | £24.00 | £0.00 | £1.00 | £6.67 | 16.0% | No | 0 | n/a | thin, no-shopify |
| Apple Watch S3 42mm | Apple Watch S3 42mm Glass Screen | £129.00 | £107.50 | £76.94 | £12.47 | £0.00 | £2.58 | £15.51 | 14.4% | No | 0 | n/a | thin, no-shopify |
| iPhone 11 | iPhone 11 Rear Camera Lens | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | Yes | 0 | n/a | thin |
| iPhone 11 Pro | iPhone 11 Pro Rear Camera Lens | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | Yes | 0 | n/a | thin |
| iPhone 7 Plus | iPhone 7 Plus Mute Button | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | No | 0 | n/a | thin, no-shopify |
| iPhone 7 Plus | iPhone 7 Plus Power Button | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | No | 0 | n/a | thin, no-shopify |
| iPhone 7 Plus | iPhone 7 Plus Volume Button | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | No | 0 | n/a | thin, no-shopify |
| iPhone 8 | iPhone 8 Mute Button | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | Yes | 0 | n/a | thin |
| iPhone 8 | iPhone 8 Power Button | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | Yes | 0 | n/a | thin |
| iPhone 8 | iPhone 8 Volume Button | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | Yes | 0 | n/a | thin |
| iPhone 8 Plus | iPhone 8 Plus Loudspeaker | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | Yes | 0 | n/a | thin |
| iPhone 8 Plus | iPhone 8 Plus Mute Button | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | Yes | 0 | n/a | thin |
| iPhone 8 Plus | iPhone 8 Plus Power Button | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | Yes | 0 | n/a | thin |
| iPhone 8 Plus | iPhone 8 Plus Volume Button | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | Yes | 0 | n/a | thin |
| iPhone SE2 | iPhone SE2 Mute Button | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | Yes | 0 | n/a | thin |
| iPhone SE2 | iPhone SE2 Power Button | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | Yes | 0 | n/a | thin |
| iPhone SE2 | iPhone SE2 Volume Button | £49.00 | £40.83 | £10.00 | £24.00 | £0.00 | £0.98 | £5.85 | 14.3% | Yes | 0 | n/a | thin |
| iPad Air | iPad Air Display Screen | £109.00 | £90.83 | £40.00 | £36.00 | £0.00 | £2.18 | £12.65 | 13.9% | No | 0 | n/a | thin, no-shopify |
| iPhone XS | iPhone XS Charging Port | £59.00 | £49.17 | £33.00 | £8.67 | £0.00 | £1.18 | £6.31 | 12.8% | Yes | 0 | n/a | thin |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Screen | £699.00 | £582.50 | £456.00 | £39.24 | £0.00 | £13.98 | £73.28 | 12.6% | Yes | 0 | n/a | thin |
| Apple Watch S2 42mm | Apple Watch S2 42mm Glass Screen | £129.00 | £107.50 | £76.94 | £14.78 | £0.00 | £2.58 | £13.20 | 12.3% | No | 0 | n/a | thin, no-shopify |
| Apple Watch S2 38mm | Apple Watch S2 38mm Display Screen | £179.00 | £149.17 | £80.00 | £48.00 | £0.00 | £3.58 | £17.59 | 11.8% | No | 0 | n/a | thin, no-shopify |
| Apple Watch S3 38mm | Apple Watch S3 38mm Display Screen | £179.00 | £149.17 | £80.00 | £48.00 | £0.00 | £3.58 | £17.59 | 11.8% | No | 0 | n/a | thin, no-shopify |
| iPad Pro 13 (7G) | iPad Pro 13 (7G) Screen | £799.00 | £665.83 | £550.00 | £36.00 | £0.00 | £15.98 | £63.85 | 9.6% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 7 | iPhone 7 Charging Port | £59.00 | £49.17 | £20.00 | £24.00 | £0.00 | £1.18 | £3.99 | 8.1% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 7 | iPhone 7 Microphone | £59.00 | £49.17 | £20.00 | £24.00 | £0.00 | £1.18 | £3.99 | 8.1% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 7 Plus | iPhone 7 Plus Charging Port | £59.00 | £49.17 | £20.00 | £24.00 | £0.00 | £1.18 | £3.99 | 8.1% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 7 Plus | iPhone 7 Plus Microphone | £59.00 | £49.17 | £20.00 | £24.00 | £0.00 | £1.18 | £3.99 | 8.1% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 8 Plus | iPhone 8 Plus Charging Port | £59.00 | £49.17 | £20.00 | £24.00 | £0.00 | £1.18 | £3.99 | 8.1% | Yes | 0 | n/a | loss-maker |
| iPhone 8 Plus | iPhone 8 Plus Microphone | £59.00 | £49.17 | £20.00 | £24.00 | £0.00 | £1.18 | £3.99 | 8.1% | Yes | 0 | n/a | loss-maker |
| iPad Pro 10.5 | iPad Pro 10.5 Display Screen | £199.00 | £165.83 | £112.50 | £36.00 | £0.00 | £3.98 | £13.35 | 8.1% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 8 | iPhone 8 Rear Camera | £79.00 | £65.83 | £35.00 | £24.00 | £0.00 | £1.58 | £5.25 | 8.0% | Yes | 0 | n/a | loss-maker |
| iPhone SE2 | iPhone SE2 Rear Camera | £79.00 | £65.83 | £35.00 | £24.00 | £0.00 | £1.58 | £5.25 | 8.0% | Yes | 0 | n/a | loss-maker |
| iPhone X | iPhone X Rear Camera | £79.00 | £65.83 | £35.00 | £24.00 | £0.00 | £1.58 | £5.25 | 8.0% | Yes | 0 | n/a | loss-maker |
| iPhone XR | iPhone XR Rear Camera | £79.00 | £65.83 | £35.00 | £24.00 | £0.00 | £1.58 | £5.25 | 8.0% | Yes | 0 | n/a | loss-maker |
| iPhone XS | iPhone XS Rear Camera | £79.00 | £65.83 | £35.00 | £24.00 | £0.00 | £1.58 | £5.25 | 8.0% | Yes | 0 | n/a | loss-maker |
| iPhone XS Max | iPhone XS Max Rear Camera | £79.00 | £65.83 | £35.00 | £24.00 | £0.00 | £1.58 | £5.25 | 8.0% | Yes | 0 | n/a | loss-maker |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Screen | £599.00 | £499.17 | £415.00 | £39.98 | £0.00 | £11.98 | £32.21 | 6.5% | Yes | 0 | n/a | loss-maker |
| iPad 10 | iPad 10 Display Screen | £149.00 | £124.17 | £77.50 | £36.00 | £0.00 | £2.98 | £7.69 | 6.2% | Yes | 0 | n/a | loss-maker |
| iPhone XS Max | iPhone XS Max Charging Port | £59.00 | £49.17 | £21.00 | £24.00 | £0.00 | £1.18 | £2.99 | 6.1% | Yes | 0 | n/a | loss-maker |
| iPhone XS Max | iPhone XS Max Microphone | £59.00 | £49.17 | £21.00 | £24.00 | £0.00 | £1.18 | £2.99 | 6.1% | Yes | 0 | n/a | loss-maker |
| iPhone 16 Pro Max | iPhone 16 Pro Max Screen | £379.00 | £315.83 | £250.00 | £16.18 | £24.00 | £7.58 | £18.07 | 5.7% | Yes | 0 | n/a | loss-maker |
| iPad 5 | iPad 5 Display Screen | £99.00 | £82.50 | £40.00 | £36.00 | £0.00 | £1.98 | £4.52 | 5.5% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 15 Pro | iPhone 15 Pro Rear Glass | £279.00 | £232.50 | £200.00 | £15.33 | £0.00 | £5.58 | £11.59 | 5.0% | Yes | 0 | n/a | loss-maker |
| iPhone 6 | iPhone 6 Battery | £50.00 | £41.67 | £15.00 | £24.00 | £0.00 | £1.00 | £1.67 | 4.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6 Plus | iPhone 6 Plus Battery | £50.00 | £41.67 | £15.00 | £24.00 | £0.00 | £1.00 | £1.67 | 4.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6S Plus | iPhone 6s Plus Battery | £50.00 | £41.67 | £15.00 | £24.00 | £0.00 | £1.00 | £1.67 | 4.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6s, iPhone 5 | iPhone 6s Battery | £50.00 | £41.67 | £15.00 | £24.00 | £0.00 | £1.00 | £1.67 | 4.0% | No | 0 | n/a | loss-maker, no-shopify |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Trackpad | £299.00 | £249.17 | £187.00 | £48.00 | £0.00 | £5.98 | £8.19 | 3.3% | Yes | 0 | n/a | loss-maker |
| iPhone 16 Pro | iPhone 16 Pro Screen | £349.00 | £290.83 | £220.00 | £32.05 | £24.00 | £6.98 | £7.80 | 2.7% | Yes | 0 | n/a | loss-maker |
| iPhone 11 Pro Max | iPhone 11 Pro Max Rear Camera Lens | £49.00 | £40.83 | £15.00 | £24.00 | £0.00 | £0.98 | £0.85 | 2.1% | Yes | 0 | n/a | loss-maker |
| iPhone 11 Pro Max | iPhone 11 Pro Max Charging Port | £69.00 | £57.50 | £31.00 | £24.00 | £0.00 | £1.38 | £1.12 | 1.9% | Yes | 0 | n/a | loss-maker |
| iPhone 11 Pro Max | iPhone 11 Pro Max Microphone | £69.00 | £57.50 | £31.00 | £24.00 | £0.00 | £1.38 | £1.12 | 1.9% | Yes | 0 | n/a | loss-maker |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Display Screen | £349.00 | £290.83 | £246.00 | £36.00 | £0.00 | £6.98 | £1.85 | 0.6% | No | 0 | n/a | loss-maker, no-shopify |
| iPad Pro 9.7 | iPad Pro 9.7 Display Screen | £189.00 | £157.50 | £118.00 | £36.00 | £0.00 | £3.78 | £-0.28 | -0.2% | No | 0 | n/a | loss-maker, no-shopify |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Screen | £549.00 | £457.50 | £415.00 | £40.23 | £0.00 | £10.98 | £-8.71 | -1.9% | Yes | 0 | n/a | loss-maker |
| iPhone XS | iPhone XS Mute Button | £59.00 | £49.17 | £25.00 | £24.00 | £0.00 | £1.18 | £-1.01 | -2.1% | Yes | 0 | n/a | loss-maker |
| iPhone XS | iPhone XS Volume Button | £59.00 | £49.17 | £25.00 | £24.00 | £0.00 | £1.18 | £-1.01 | -2.1% | Yes | 0 | n/a | loss-maker |
| Apple Watch S1 38mm | Apple Watch S1 38mm Glass Screen | £129.00 | £107.50 | £60.00 | £48.00 | £0.00 | £2.58 | £-3.08 | -2.9% | No | 0 | n/a | loss-maker, no-shopify |
| Apple Watch S1 42mm | Apple Watch S1 42mm Glass Screen | £129.00 | £107.50 | £60.00 | £48.00 | £0.00 | £2.58 | £-3.08 | -2.9% | No | 0 | n/a | loss-maker, no-shopify |
| iPad Pro 11 (5G) | iPad Pro 11 (5G) Screen | £699.00 | £582.50 | £550.00 | £36.00 | £0.00 | £13.98 | £-17.48 | -3.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6 | iPhone 6 Charging Port | £50.00 | £41.67 | £20.00 | £24.00 | £0.00 | £1.00 | £-3.33 | -8.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6 | iPhone 6 Microphone | £50.00 | £41.67 | £20.00 | £24.00 | £0.00 | £1.00 | £-3.33 | -8.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6 Plus | iPhone 6 Plus Charging Port | £50.00 | £41.67 | £20.00 | £24.00 | £0.00 | £1.00 | £-3.33 | -8.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6 Plus | iPhone 6 Plus Headphone Jack | £50.00 | £41.67 | £20.00 | £24.00 | £0.00 | £1.00 | £-3.33 | -8.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6 Plus | iPhone 6 Plus Microphone | £50.00 | £41.67 | £20.00 | £24.00 | £0.00 | £1.00 | £-3.33 | -8.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6S Plus | iPhone 6s Plus Charging Port | £50.00 | £41.67 | £20.00 | £24.00 | £0.00 | £1.00 | £-3.33 | -8.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6S Plus | iPhone 6s Plus Microphone | £50.00 | £41.67 | £20.00 | £24.00 | £0.00 | £1.00 | £-3.33 | -8.0% | No | 0 | n/a | loss-maker, no-shopify |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Trackpad | £249.00 | £207.50 | £177.00 | £48.00 | £0.00 | £4.98 | £-22.48 | -10.8% | Yes | 0 | n/a | loss-maker |
| Apple Watch S6 40mm | Apple Watch S6 40mm Display Screen | £179.00 | £149.17 | £120.00 | £48.00 | £0.00 | £3.58 | £-22.41 | -15.0% | Yes | 0 | n/a | loss-maker |
| Apple Watch S6 40mm | Apple Watch S6 40mm Glass Screen | £179.00 | £149.17 | £120.00 | £48.00 | £0.00 | £3.58 | £-22.41 | -15.0% | Yes | 0 | n/a | loss-maker |
| iPhone XR | iPhone XR Display (Original LCD Screen) | £79.00 | £65.83 | £45.00 | £5.37 | £24.00 | £1.58 | £-10.12 | -15.4% | No | 0 | n/a | loss-maker, no-shopify |
| Apple Watch S2 38mm | Apple Watch S2 38mm Glass Screen | £129.00 | £107.50 | £80.00 | £48.00 | £0.00 | £2.58 | £-23.08 | -21.5% | No | 0 | n/a | loss-maker, no-shopify |
| Apple Watch S3 38mm | Apple Watch S3 38mm Glass Screen | £129.00 | £107.50 | £80.00 | £48.00 | £0.00 | £2.58 | £-23.08 | -21.5% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 7 Plus | iPhone 7 Plus Original LCD Screen | £129.00 | £107.50 | £80.00 | £24.00 | £24.00 | £2.58 | £-23.08 | -21.5% | No | 0 | n/a | loss-maker, no-shopify |
| iPod Touch 6th Gen | iPod Touch 6th Gen Battery | £50.00 | £41.67 | £13.74 | £36.00 | £0.00 | £1.00 | £-9.07 | -21.8% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6S Plus | iPhone 6s Plus Original LCD Screen | £90.00 | £75.00 | £42.00 | £24.00 | £24.00 | £1.80 | £-16.80 | -22.4% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 15 | iPhone 15 Rear Glass | £259.00 | £215.83 | £240.00 | £24.00 | £0.00 | £5.18 | £-53.35 | -24.7% | Yes | 0 | n/a | loss-maker |
| iPhone XS | iPhone XS Rear Housing (Rear Glass And Frame) | £119.00 | £99.17 | £100.00 | £24.00 | £0.00 | £2.38 | £-27.21 | -27.4% | Yes | 0 | n/a | loss-maker |
| iPhone XS Max | iPhone XS Max Rear Housing (Rear Glass And Frame) | £119.00 | £99.17 | £100.00 | £24.00 | £0.00 | £2.38 | £-27.21 | -27.4% | Yes | 0 | n/a | loss-maker |
| iPhone 11 | iPhone 11 Charging Port | £69.00 | £57.50 | £60.00 | £12.49 | £0.00 | £1.38 | £-16.37 | -28.5% | Yes | 0 | n/a | loss-maker |
| iPad Mini 4 | iPad Mini 4 Display Screen | £149.00 | £124.17 | £125.00 | £36.00 | £0.00 | £2.98 | £-39.81 | -32.1% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6 | iPhone 6 Original LCD Screen | £70.00 | £58.33 | £29.30 | £24.00 | £24.00 | £1.40 | £-20.37 | -34.9% | No | 0 | n/a | loss-maker, no-shopify |
| iPad Air 3 | iPad Air 3 Display Screen | £199.00 | £165.83 | £184.00 | £36.00 | £0.00 | £3.98 | £-58.15 | -35.1% | No | 0 | n/a | loss-maker, no-shopify |
| TEST PRODUCT GROUP | TEST GLASS TOUCH PRODUCT | £50.00 | £41.67 | £20.00 | £36.00 | £0.00 | £1.00 | £-15.33 | -36.8% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6 Plus | iPhone 6 Plus Original LCD Screen | £80.00 | £66.67 | £42.00 | £24.00 | £24.00 | £1.60 | £-24.93 | -37.4% | No | 0 | n/a | loss-maker, no-shopify |
| iPad Air 2 | iPad Air 2 Display Screen | £179.00 | £149.17 | £168.00 | £36.00 | £0.00 | £3.58 | £-58.41 | -39.2% | No | 0 | n/a | loss-maker, no-shopify |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Display Screen | £399.00 | £332.50 | £420.00 | £36.00 | £0.00 | £7.98 | £-131.48 | -39.5% | No | 0 | n/a | loss-maker, no-shopify |
| iPad 6 | iPad 6 Display Screen | £99.00 | £82.50 | £80.00 | £36.00 | £0.00 | £1.98 | £-35.48 | -43.0% | Yes | 0 | n/a | loss-maker |
| iPhone 6 | iPhone 6 Rear Camera | £50.00 | £41.67 | £35.00 | £24.00 | £0.00 | £1.00 | £-18.33 | -44.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6 Plus | iPhone 6 Plus Rear Camera | £50.00 | £41.67 | £35.00 | £24.00 | £0.00 | £1.00 | £-18.33 | -44.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6S Plus | iPhone 6s Plus Rear Camera | £50.00 | £41.67 | £35.00 | £24.00 | £0.00 | £1.00 | £-18.33 | -44.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 6s, iPhone 5 | iPhone 6s Rear Camera | £50.00 | £41.67 | £35.00 | £24.00 | £0.00 | £1.00 | £-18.33 | -44.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 7 | iPhone 7 Rear Camera | £49.00 | £40.83 | £35.00 | £24.00 | £0.00 | £0.98 | £-19.15 | -46.9% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 7 Plus | iPhone 7 Plus Rear Camera | £49.00 | £40.83 | £35.00 | £24.00 | £0.00 | £0.98 | £-19.15 | -46.9% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone SE2 | iPhone SE2 Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £123.16 | £8.66 | £0.00 | £2.18 | £-43.17 | -47.5% | Yes | 0 | n/a | loss-maker |
| iPhone 11 | iPhone 11 Microphone | £69.00 | £57.50 | £60.00 | £24.00 | £0.00 | £1.38 | £-27.88 | -48.5% | Yes | 0 | n/a | loss-maker |
| iPhone X | iPhone X Charging Port | £59.00 | £49.17 | £50.00 | £24.00 | £0.00 | £1.18 | £-26.01 | -52.9% | Yes | 0 | n/a | loss-maker |
| iPhone X | iPhone X Microphone | £59.00 | £49.17 | £50.00 | £24.00 | £0.00 | £1.18 | £-26.01 | -52.9% | Yes | 0 | n/a | loss-maker |
| iPhone 6s, iPhone 5 | iPhone 6s Original LCD Screen | £70.00 | £58.33 | £40.00 | £24.00 | £24.00 | £1.40 | £-31.07 | -53.3% | No | 0 | n/a | loss-maker, no-shopify |
| iPad Mini 5 | iPad Mini 5 Display Screen | £149.00 | £124.17 | £170.00 | £21.56 | £0.00 | £2.98 | £-70.38 | -56.7% | No | 0 | n/a | loss-maker, no-shopify |
| TEST PRODUCT GROUP | TEST BATTEY PRODUCT | £50.00 | £41.67 | £30.00 | £36.00 | £0.00 | £1.00 | £-25.33 | -60.8% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone X | iPhone X Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £130.00 | £24.00 | £0.00 | £2.18 | £-65.35 | -71.9% | Yes | 0 | n/a | loss-maker |
| iPod Touch 6th Gen | iPod Touch 6th Gen Software Re-Installation | £25.00 | £20.83 | £1.00 | £36.00 | £0.00 | £0.50 | £-16.67 | -80.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPod Touch 7th Gen | iPod Touch 7th Gen Software Re-Installation | £25.00 | £20.83 | £1.00 | £36.00 | £0.00 | £0.50 | £-16.67 | -80.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 8 Plus | iPhone 8 Plus Display (Original LCD Screen) | £129.00 | £107.50 | £144.00 | £24.00 | £24.00 | £2.58 | £-87.08 | -81.0% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 14 Pro Max | iPhone 14 Pro Max Rear Housing (Rear Glass And Frame) | £209.00 | £174.17 | £340.00 | £13.40 | £0.00 | £4.18 | £-183.41 | -105.3% | Yes | 0 | n/a | loss-maker |
| iPhone 14 Pro | iPhone 14 Pro Rear Housing (Rear Glass And Frame) | £209.00 | £174.17 | £340.00 | £15.85 | £0.00 | £4.18 | £-185.86 | -106.7% | Yes | 0 | n/a | loss-maker |
| iPhone 14 Plus | iPhone 14 Plus Rear Glass | £249.00 | £207.50 | £400.00 | £24.00 | £0.00 | £4.98 | £-221.48 | -106.7% | Yes | 0 | n/a | loss-maker |
| iPhone 14 | iPhone 14 Rear Glass | £239.00 | £199.17 | £400.00 | £24.00 | £0.00 | £4.78 | £-229.61 | -115.3% | Yes | 0 | n/a | loss-maker |
| iPhone 8 | iPhone 8 Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £170.00 | £24.00 | £0.00 | £2.18 | £-105.35 | -116.0% | Yes | 0 | n/a | loss-maker |
| iPhone 12 | iPhone 12 Rear Housing (Rear Glass And Frame) | £179.00 | £149.17 | £311.00 | £11.50 | £0.00 | £3.58 | £-176.91 | -118.6% | Yes | 0 | n/a | loss-maker |
| iPhone 12 Pro Max | iPhone 12 Pro Max Rear Housing (Rear Glass And Frame) | £189.00 | £157.50 | £340.00 | £15.99 | £0.00 | £3.78 | £-202.27 | -128.4% | Yes | 0 | n/a | loss-maker |
| iPhone 11 Pro Max | iPhone 11 Pro Max Rear Housing (Rear Glass And Frame) | £139.00 | £115.83 | £255.00 | £11.12 | £0.00 | £2.78 | £-153.07 | -132.1% | Yes | 0 | n/a | loss-maker |
| iPhone 12 Pro | iPhone 12 Pro Rear Housing (Rear Glass And Frame) | £189.00 | £157.50 | £340.00 | £24.00 | £0.00 | £3.78 | £-210.28 | -133.5% | Yes | 0 | n/a | loss-maker |
| iPhone 13 Pro Max | iPhone 13 Pro Max Rear Housing (Rear Glass And Frame) | £199.00 | £165.83 | £380.00 | £9.44 | £0.00 | £3.98 | £-227.59 | -137.2% | Yes | 0 | n/a | loss-maker |
| iPhone 8 Plus | iPhone 8 Plus Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £190.00 | £24.00 | £0.00 | £2.18 | £-125.35 | -138.0% | Yes | 0 | n/a | loss-maker |
| iPhone 11 Pro | iPhone 11 Pro Rear Housing (Rear Glass And Frame) | £139.00 | £115.83 | £280.00 | £24.00 | £0.00 | £2.78 | £-190.95 | -164.8% | Yes | 0 | n/a | loss-maker |
| iPhone XR | iPhone XR Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £220.00 | £24.00 | £0.00 | £2.18 | £-155.35 | -171.0% | Yes | 0 | n/a | loss-maker |
| iPhone 11 | iPhone 11 Rear Housing (Rear Glass And Frame) | £139.00 | £115.83 | £290.00 | £24.00 | £0.00 | £2.78 | £-200.95 | -173.5% | Yes | 0 | n/a | loss-maker |
| TEST PRODUCT GROUP | TEST DISPLAY PRODUCT | £40.00 | £33.33 | £55.41 | £36.00 | £0.00 | £0.80 | £-58.88 | -176.6% | No | 0 | n/a | loss-maker, no-shopify |
| iPhone 13 Pro | iPhone 13 Pro Rear Housing (Rear Glass And Frame) | £199.00 | £165.83 | £470.00 | £17.22 | £0.00 | £3.98 | £-325.36 | -196.2% | Yes | 0 | n/a | loss-maker |
| iPhone 13 | iPhone 13 Rear Housing (Rear Glass And Frame) | £189.00 | £157.50 | £470.00 | £16.27 | £0.00 | £3.78 | £-332.55 | -211.1% | Yes | 0 | n/a | loss-maker |
| iPhone 13 Mini | iPhone 13 Mini Rear Housing (Rear Glass And Frame) | £199.00 | £165.83 | £600.00 | £24.00 | £0.00 | £3.98 | £-462.15 | -278.7% | Yes | 0 | n/a | loss-maker |
| iPhone 12 Mini | iPhone 12 Mini Rear Housing (Rear Glass And Frame) | £179.00 | £149.17 | £550.00 | £24.00 | £0.00 | £3.58 | £-428.41 | -287.2% | Yes | 0 | n/a | loss-maker |
| iPhone 6s, iPhone 5 | iPhone 6s Rear Camera Lens | £40.00 | £33.33 | £111.00 | £24.00 | £0.00 | £0.80 | £-102.47 | -307.4% | No | 0 | n/a | loss-maker, no-shopify |
| TEST PRODUCT GROUP | Custom Product | £10.00 | £8.33 | £0.00 | £36.00 | £0.00 | £0.20 | £-27.87 | -334.4% | No | 0 | n/a | loss-maker, no-shopify |
| Apple Watch S1 38mm | Apple Watch S1 38mm | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S1 42mm | Apple Watch S1 42mm | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S2 38mm | Apple Watch S2 38mm | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S2 42mm | Apple Watch S2 42mm | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S3 38mm | Apple Watch S3 38mm | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S3 42mm | Apple Watch S3 42mm | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S4 40mm | Apple Watch S4 40mm | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S4 44mm | Apple Watch S4 44mm | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S5 40mm | Apple Watch S5 40mm | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S5 44mm | Apple Watch S5 44mm | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S6 40mm | Apple Watch S6 40mm | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S6 40mm | Apple Watch S6 40mm Speaker Flex | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S6 44mm | Apple Watch S6 44mm | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S7 41MM | Apple Watch S7 41MM | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S7 45MM | Apple Watch S7 45MM | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S8 41MM | Apple Watch S8 41MM | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S8 45MM | Apple Watch S8 45MM | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S9 41MM | Apple Watch S9 41MM | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch S9 45MM | Apple Watch S9 45MM | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch SE 40mm | Apple Watch SE 40mm | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch SE 44mm | Apple Watch SE 44mm | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Apple Watch Ultra | Apple Watch Ultra | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Index Items | iPad Pro 13 (7G) | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Index Items | Other Device Other Repair | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad 10 | iPad 10 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad 4 | iPad 4 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad 5 | iPad 5 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad 6 | iPad 6 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad 7 | iPad 7 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad 8 | iPad 8 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad 9 | iPad 9 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Air | iPad Air | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Air 2 | iPad Air 2 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Air 3 | iPad Air 3 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Air 4 | iPad Air 4 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Air 5 | iPad Air 5 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Mini 4 | iPad Mini 4 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Mini 5 | iPad Mini 5 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Mini 6 | iPad Mini 6 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Pro 10.5 | iPad Pro 10.5 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPad Pro 9.7 | iPad Pro 9.7 | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 11 | iPhone 11 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 11 Pro | iPhone 11 Pro | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 11 Pro Max | iPhone 11 Pro Max | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 12 | iPhone 12 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 12 Mini | iPhone 12 Mini | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 12 Pro | iPhone 12 Pro | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 12 Pro Max | iPhone 12 Pro Max | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 13 | iPhone 13 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 13 Mini | iPhone 13 Mini | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 13 Pro | iPhone 13 Pro | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 13 Pro Max | iPhone 13 Pro Max | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 14 | iPhone 14 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 14 Plus | iPhone 14 Plus | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 14 Pro | iPhone 14 Pro | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 14 Pro Max | iPhone 14 Pro Max | n/a | n/a | £40.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 15 | iPhone 15 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 15 Plus | iPhone 15 Plus | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 15 Pro | iPhone 15 Pro | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 15 Pro Max | iPhone 15 Pro Max | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 16 | iPhone 16 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 16 Plus | iPhone 16 Plus | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 16 Pro | iPhone 16 Pro | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 16 Pro Max | iPhone 16 Pro Max | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 6 | iPhone 6 Headphone Jack | n/a | n/a | £20.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 6S Plus | Liquid Damage Treatment | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 6S Plus | MacBook Air 13 A2179 Lid Replacement | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 6S Plus | MacBook Pro 13 A1708 Bezel Replacement | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 7 | iPhone 7 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 7 Plus | iPhone 7 Plus | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 8 | iPhone 8 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone 8 Plus | iPhone 8 Plus | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone SE2 | iPhone SE2 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone SE3 | iPhone SE3 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone X | iPhone X | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone XR | iPhone XR | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone XS | iPhone XS | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPhone XS Max | iPhone XS Max | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPod Touch 6th Gen | iPod Touch 6th Gen | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| iPod Touch 7th Gen | iPod Touch 7th Gen | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook 12 A1534 | MacBook 12 A1534 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Air 13 M1 A2337 | MacBook Air 13 M1 A2337 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Air 15 M3 A3114 | S001 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 13 A1502 | MacBook Pro 13 A1502 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 13 A1502 | MacBook Pro 13 A1502 Logic Board | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 13 M1 A2338 | Liquid Damage Treatment | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Logic Board Repair | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 13"  A1708 | MacBook Pro 13 A1708  Warranty Assessment | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 M1 Pro/Max A2442 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 A2992 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 14 M3 Pro/Max A2992 | MacBook Pro 14 M3 Pro/Max A2992 Warranty Assessment | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Logic Board Repair | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 | n/a | n/a | £0.00 | £48.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Other Device | Other Device Other Product | n/a | n/a | £0.00 | £13.55 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Other Device | Screen Protector | n/a | n/a | £0.00 | £13.93 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| TEST PRODUCT GROUP | TEST PRODUCT GROUP | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |
| Zebra PDA | Zebra PDA | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 0 | n/a | thin, no-shopify |

## Section 4: Missing From Shopify

| Device model | Missing SKUs | Example Monday products |
| --- | --- | --- |
| Apple Watch S1 38mm | 6 | Apple Watch S1 38mm Display Screen, Apple Watch S1 38mm Glass Screen, Apple Watch S1 38mm Battery, Apple Watch S1 38mm Crown |
| Apple Watch S1 42mm | 6 | Apple Watch S1 42mm Display Screen, Apple Watch S1 42mm Glass Screen, Apple Watch S1 42mm Battery, Apple Watch S1 42mm Crown |
| Apple Watch S2 38mm | 6 | Apple Watch S2 38mm Display Screen, Apple Watch S2 38mm Glass Screen, Apple Watch S2 38mm Battery, Apple Watch S2 38mm Crown |
| Apple Watch S2 42mm | 6 | Apple Watch S2 42mm Display Screen, Apple Watch S2 42mm Glass Screen, Apple Watch S2 42mm Battery, Apple Watch S2 42mm Crown |
| Apple Watch S3 38mm | 6 | Apple Watch S3 38mm Display Screen, Apple Watch S3 38mm Glass Screen, Apple Watch S3 38mm Battery, Apple Watch S3 38mm Crown |
| Apple Watch S3 42mm | 6 | Apple Watch S3 42mm Display Screen, Apple Watch S3 42mm Glass Screen, Apple Watch S3 42mm Battery, Apple Watch S3 42mm Crown |
| Apple Watch S4 40mm | 2 | Apple Watch S4 40mm Rear Housing, Apple Watch S4 40mm |
| Apple Watch S4 44mm | 2 | Apple Watch S4 44mm Rear Housing, Apple Watch S4 44mm |
| Apple Watch S5 40mm | 2 | Apple Watch S5 40mm Rear Housing, Apple Watch S5 40mm |
| Apple Watch S5 44mm | 2 | Apple Watch S5 44mm Rear Housing, Apple Watch S5 44mm |
| Apple Watch S6 40mm | 3 | Apple Watch S6 40mm Rear Housing, Apple Watch S6 40mm Speaker Flex, Apple Watch S6 40mm |
| Apple Watch S6 44mm | 2 | Apple Watch S6 44mm Rear Housing, Apple Watch S6 44mm |
| Apple Watch S7 41MM | 3 | Apple Watch S7 41MM Crown, Apple Watch S7 41MM Rear Housing, Apple Watch S7 41MM |
| Apple Watch S7 45MM | 3 | Apple Watch S7 45MM Crown, Apple Watch S7 45MM Rear Housing, Apple Watch S7 45MM |
| Apple Watch S8 41MM | 3 | Apple Watch S8 41MM Crown, Apple Watch S8 41MM Rear Housing, Apple Watch S8 41MM |
| Apple Watch S8 45MM | 3 | Apple Watch S8 45MM Crown, Apple Watch S8 45MM Rear Housing, Apple Watch S8 45MM |
| Apple Watch S9 41MM | 3 | Apple Watch S9 41MM Crown, Apple Watch S9 41MM Rear Housing, Apple Watch S9 41MM |
| Apple Watch S9 45MM | 3 | Apple Watch S9 45MM Crown, Apple Watch S9 45MM Rear Housing, Apple Watch S9 45MM |
| Apple Watch SE 40mm | 2 | Apple Watch SE 40mm Rear Housing, Apple Watch SE 40mm |
| Apple Watch SE 44mm | 2 | Apple Watch SE 44mm Rear Housing, Apple Watch SE 44mm |
| Apple Watch SE2 40MM | 3 | Apple Watch SE2 40MM Crown, Apple Watch SE2 40MM Rear Housing, Apple Watch SE2 40MM |
| Apple Watch SE2 44MM | 3 | Apple Watch SE2 44MM Crown, Apple Watch SE2 44MM Rear Housing, Apple Watch SE2 44MM |
| Apple Watch Ultra | 3 | Apple Watch Ultra Crown, Apple Watch Ultra Rear Housing, Apple Watch Ultra |
| Index Items | 2 | Other Device Other Repair, iPad Pro 13 (7G) |
| iPad 10 | 2 | iPad 10 Glass Screen, iPad 10 |
| iPad 4 | 5 | iPad 4 Display Screen, iPad 4 Battery, iPad 4 Charging Port, iPad 4 Glass and Touch Screen |
| iPad 5 | 6 | iPad 5 Display Screen, iPad 5 Battery, iPad 5 Charging Port, iPad 5 Glass Screen |
| iPad 6 | 3 | iPad 6 Glass Screen, iPad 6 Glass and Touch Screen, iPad 6 |
| iPad 7 | 2 | iPad 7 Glass Screen, iPad 7 |
| iPad 8 | 3 | iPad 8 Glass Screen, iPad 8 Glass and Touch Screen, iPad 8 |
| iPad 9 | 4 | iPad 9 Glass Screen, iPad 9 Glass and Touch Screen, iPad Logic Board Repair, iPad 9 |
| iPad Air | 5 | iPad Air Display Screen, iPad Air Battery, iPad Air Charging Port, iPad Air Glass Screen |
| iPad Air 2 | 5 | iPad Air 2 Display Screen, iPad Air 2 Battery, iPad Air 2 Charging Port, iPad Air 2 Glass Screen |
| iPad Air 3 | 3 | iPad Air 3 Display Screen, iPad Air 3 Glass Screen, iPad Air 3 |
| iPad Air 4 | 3 | iPad Air 4 Display Screen, iPad Air 4 Glass Screen, iPad Air 4 |
| iPad Air 5 | 3 | iPad Air 5 Display Screen, iPad Air 5 Glass Screen, iPad Air 5 |
| iPad Air 6 (13) | 1 | iPad Air 6 (13) Screen |
| iPad Air 7 (13) | 1 | iPad Air 7 (13) Screen |
| iPad Mini 2 | 5 | iPad Mini 2 Display Screen, iPad Mini 2 Battery, iPad Mini 2 Charging Port, iPad Mini 2 Glass Screen |
| iPad Mini 3 | 5 | iPad Mini 3 Display Screen, iPad Mini 3 Battery, iPad Mini 3 Charging Port, iPad Mini 3 Glass Screen |
| iPad Mini 4 | 5 | iPad Mini 4 Display Screen, iPad Mini 4 Battery, iPad Mini 4 Charging Port, iPad Mini 4 Glass Screen |
| iPad Mini 5 | 3 | iPad Mini 5 Display Screen, iPad Mini 5 Glass Screen, iPad Mini 5 |
| iPad Mini 6 | 3 | iPad Mini 6 Display Screen, iPad Mini 6 Glass Screen, iPad Mini 6 |
| iPad Pro 10.5 | 5 | iPad Pro 10.5 Display Screen, iPad Pro 10.5 Battery, iPad Pro 10.5 Charging Port, iPad Pro 10.5 Glass Screen |
| iPad Pro 11 (1G) | 3 | iPad Pro 11 (1G) Display Screen, iPad Pro 11 (1G) Glass Screen, iPad Pro 11 (1G) |
| iPad Pro 11 (2G) | 3 | iPad Pro 11 (2G) Display Screen, iPad Pro 11 (2G) Glass Screen, iPad Pro 11 (2G) |
| iPad Pro 11 (3G) | 2 | iPad Pro 11 (3G) Display Screen, iPad Pro 11 (3G) |
| iPad Pro 11 (4G) | 3 | iPad Pro 11 (4G) Display Screen, iPad Pro 11 (4G) Glass Screen, iPad Pro 11 (4G) |
| iPad Pro 11 (5G) | 1 | iPad Pro 11 (5G) Screen |
| iPad Pro 12.9 (1G) | 5 | iPad Pro 12.9 (1G) Display Screen, iPad Pro 12.9 (1G) Battery, iPad Pro 12.9 (1G) Charging Port, iPad Pro 12.9 (1G) Glass Screen |
| iPad Pro 12.9 (2G) | 5 | iPad Pro 12.9 (2G) Display Screen, iPad Pro 12.9 (2G) Battery, iPad Pro 12.9 (2G) Charging Port, iPad Pro 12.9 (2G) Glass Screen |
| iPad Pro 12.9 (3G) | 4 | iPad Pro 12.9 (3G) Display Screen, iPad Pro 12.9 (3G) Glass Screen, iPad Pro 11 (3G) Glass Screen, iPad Pro 12.9 (3G) |
| iPad Pro 12.9 (4G) | 3 | iPad Pro 12.9 (4G) Display Screen, iPad Pro 12.9 (4G) Glass Screen, iPad Pro 12.9 (4G) |
| iPad Pro 12.9 (5G) | 3 | iPad Pro 12.9 (5G) Display Screen, iPad Pro 12.9 (5G) Glass Screen, iPad Pro 12.9 (5G) |
| iPad Pro 12.9 (6G) | 3 | iPad Pro 12.9 (6G) Display Screen, iPad Pro 12.9 (6G) Glass Screen, iPad Pro 12.9 (6G) |
| iPad Pro 13 (7G) | 1 | iPad Pro 13 (7G) Screen |
| iPad Pro 9.7 | 5 | iPad Pro 9.7 Display Screen, iPad Pro 9.7 Battery, iPad Pro 9.7 Charging Port, iPad Pro 9.7 Glass Screen |
| iPhone 11 | 5 | iPhone 11 Screen, iPhone 11 NO SERVICE (LOGIC BOARD REPAIR), iPhone 11 NO WIFI (LOGIC BOARD REPAIR), iPhone 11 UNABLE TO ACTIVATE |
| iPhone 11 Pro | 4 | iPhone 11 Pro NO SERVICE (LOGIC BOARD REPAIR), iPhone 11 Pro NO WIFI (LOGIC BOARD REPAIR), iPhone 11 Pro UNABLE TO ACTIVATE, iPhone 11 Pro |
| iPhone 11 Pro Max | 4 | iPhone 11 Pro Max NO SERVICE (LOGIC BOARD REPAIR), iPhone 11 Pro Max NO WIFI (LOGIC BOARD REPAIR), iPhone 11 Pro Max UNABLE TO ACTIVATE, iPhone 11 Pro Max |
| iPhone 12 | 4 | iPhone 12 NO SERVICE (LOGIC BOARD REPAIR), iPhone 12 NO WIFI (LOGIC BOARD REPAIR), iPhone 12 UNABLE TO ACTIVATE, iPhone 12 |
| iPhone 12 Mini | 4 | iPhone 12 Mini NO SERVICE (LOGIC BOARD REPAIR), iPhone 12 Mini NO WIFI (LOGIC BOARD REPAIR), iPhone 12 UNABLE TO ACTIVATE, iPhone 12 Mini |
| iPhone 12 Pro | 4 | iPhone 12 Pro NO SERVICE (LOGIC BOARD REPAIR), iPhone 12 Pro NO WIFI (LOGIC BOARD REPAIR), iPhone 12 Pro UNABLE TO ACTIVATE, iPhone 12 Pro |
| iPhone 12 Pro Max | 4 | iPhone 12 Pro Max NO SERVICE (LOGIC BOARD REPAIR), iPhone 12 Pro Max NO WIFI (LOGIC BOARD REPAIR), iPhone 12 Pro Max UNABLE TO ACTIVATE, iPhone 12 Pro Max |
| iPhone 13 | 1 | iPhone 13 |
| iPhone 13 Mini | 1 | iPhone 13 Mini |
| iPhone 13 Pro | 1 | iPhone 13 Pro |
| iPhone 13 Pro Max | 1 | iPhone 13 Pro Max |
| iPhone 14 | 2 | iPhone 14 Rear Housing, iPhone 14 |
| iPhone 14 Plus | 2 | iPhone 14 Plus Rear Housing, iPhone 14 Plus |
| iPhone 14 Pro | 1 | iPhone 14 Pro |
| iPhone 14 Pro Max | 1 | iPhone 14 Pro Max |
| iPhone 15 | 2 | iPhone 15 Rear Housing, iPhone 15 |
| iPhone 15 Plus | 2 | iPhone 15 Plus Rear Housing, iPhone 15 Plus |
| iPhone 15 Pro | 2 | iPhone 15 Pro Rear Housing, iPhone 15 Pro |
| iPhone 15 Pro Max | 2 | iPhone 15 Pro Max Rear Housing, iPhone 15 Pro Max |
| iPhone 16 | 2 | iPhone 16 Rear Housing, iPhone 16 |
| iPhone 16 Plus | 2 | iPhone 16 Plus Rear Housing, iPhone 16 Plus |
| iPhone 16 Pro | 2 | iPhone 16 Pro Rear Housing, iPhone 16 Pro |
| iPhone 16 Pro Max | 2 | iPhone 16 Pro Max Rear Housing, iPhone 16 Pro Max |
| iPhone 6 | 12 | iPhone 6 Original LCD Screen, iPhone 6 Battery, iPhone 6 Charging Port, iPhone 6 Rear Camera |
| iPhone 6 Plus | 12 | iPhone 6 Plus Original LCD Screen, iPhone 6 Plus Battery, iPhone 6 Plus Charging Port, iPhone 6 Plus Rear Camera |
| iPhone 6S Plus | 13 | iPhone 6s Plus Original LCD Screen, iPhone 6s Plus Battery, iPhone 6s Plus Charging Port, iPhone 6s Plus Rear Camera |
| iPhone 6s, iPhone 5 | 10 | iPhone 6s Original LCD Screen, iPhone 6s Battery, iPhone 6s Charging Port, iPhone 6s Rear Camera |
| iPhone 7 | 12 | iPhone 7 Original LCD Screen, iPhone 7 Battery, iPhone 7 Charging Port, iPhone 7 Rear Camera |
| iPhone 7 Plus | 12 | iPhone 7 Plus Original LCD Screen, iPhone 7 Plus Battery, iPhone 7 Plus Charging Port, iPhone 7 Plus Rear Camera |
| iPhone 8 | 2 | iPhone 8 Original LCD Screen, iPhone 8 |
| iPhone 8 Plus | 2 | iPhone 8 Plus Display (Original LCD Screen), iPhone 8 Plus |
| iPhone SE2 | 4 | iPhone SE2 Display (Original LCD Screen), iPhone SE2 Wifi Module, iPhone SE2 Proximity Sensor, iPhone SE2 |
| iPhone SE3 | 2 | iPhone SE3 Original LCD Screen, iPhone SE3 |
| iPhone X | 5 | iPhone X NO SERVICE (LOGIC BOARD REPAIR), iPhone X NO WIFI (LOGIC BOARD REPAIR), iPhone X WIFI Module, iPhone X UNABLE TO ACTIVATE |
| iPhone XR | 6 | iPhone XR Display (Original LCD Screen), iPhone XR NO SERVICE (LOGIC BOARD REPAIR), iPhone XR NO WIFI (LOGIC BOARD REPAIR), iPhone XR WIFI Module |
| iPhone XS | 5 | iPhone XS NO SERVICE (LOGIC BOARD REPAIR), iPhone XS NO WIFI (LOGIC BOARD REPAIR), iPhone XS WIFI Module, iPhone XS UNABLE TO ACTIVATE |
| iPhone XS Max | 5 | iPhone XS Max NO SERVICE (LOGIC BOARD REPAIR), iPhone XS Max NO WIFI (LOGIC BOARD REPAIR), iPhone XS Max WIFI Module, iPhone XS Max UNABLE TO ACTIVATE |
| iPod Touch 6th Gen | 7 | iPod Touch 6th Gen Screen, iPod Touch 6th Gen Battery, iPod Touch 6th Gen Charging Port, iPod Touch 6th Gen Software Re-Installation |
| iPod Touch 7th Gen | 6 | iPod Touch 7th Gen Screen, iPod Touch 7th Gen Battery, iPod Touch 7th Gen Charging Port, iPod Touch 7th Gen Software Re-Installation |
| MacBook 12 A1534 | 6 | MacBook 12 A1534 Screen, MacBook 12 A1534 Battery, MacBook 12 A1534 Charging Port, MacBook 12 A1534 Keyboard |
| MacBook Air 11 A1465 | 6 | MacBook Air 11 A1465 Screen, MacBook Air 11 A1465 Battery, MacBook Air 11 A1465 Charging Port, MacBook Air 11 A1465 Keyboard |
| MacBook Air 13 A1466 | 1 | MacBook Air 13 A1466 |
| MacBook Air 13 A1932 | 1 | MacBook Air 13 A1932 |
| MacBook Air 13 A2179 | 1 | MacBook Air 13 A2179 |
| MacBook Air 13 M1 A2337 | 1 | MacBook Air 13 M1 A2337 |
| MacBook Air 13 M2 A2681 | 1 | MacBook Air 13 M2 A2681 |
| MacBook Air 13 M3 A3113 | 1 | MacBook Air 13 M3 A3113 |
| MacBook Air 15 M2 A2941 | 1 | MacBook Air 15 M2 A2941 |
| MacBook Air 15 M3 A3114 | 1 | S001 |
| MacBook Pro 13  A1708 | 1 | MacBook Pro 13  A1708 |
| MacBook Pro 13 2TB 3 A2159 | 2 | MacBook Pro 13 2TB 3 A2159 Backlight, MacBook Pro 13 2TB 3 A2159 |
| MacBook Pro 13 2TB 3 A2289 | 2 | MacBook Pro 13 2TB 3 A2289 Backlight, MacBook Pro 13 2TB 3 A2289 |
| MacBook Pro 13 4TB 3 A2251 | 3 | MacBook Pro 13 4TB 3 A2251 Backlight, Liquid Damage Treatment, MacBook Pro 13 4TB 3 A2251 |
| MacBook Pro 13 A1502 | 7 | MacBook Pro 13  A1502 Screen, MacBook Pro 13  A1502 Battery, MacBook Pro 13  A1502 Charging Port, MacBook Pro 13  A1502 Keyboard |
| MacBook Pro 13 M1 A2338 | 4 | MacBook Pro 13 M1 A2338 Backlight, MacBook Pro 13 M1 A2338 Logic Board Repair, Liquid Damage Treatment, MacBook Pro 13 M1 A2338 |
| MacBook Pro 13 M2 A2338 | 2 | MacBook Pro 13 M2 A2338 Dustgate, MacBook Pro 13 M2 A2338 |
| MacBook Pro 13 Touch Bar A1706 | 2 | MacBook Pro 13 Touch Bar A1706 Touch Bar, MacBook Pro 13 Touch Bar A1706 |
| MacBook Pro 13 Touch Bar A1989 | 3 | MacBook Pro 13 Touch Bar A1989 Backlight, MacBook Pro 13 Touch Bar A1989 Touch Bar, MacBook Pro 13 Touch Bar A1989 |
| MacBook Pro 13"  A1708 | 1 | MacBook Pro 13 A1708  Warranty Assessment |
| MacBook Pro 14 M1 Pro/Max A2442 | 1 | MacBook Pro 14 M1 Pro/Max A2442 |
| MacBook Pro 14 M2 Pro/Max A2779 | 1 | MacBook Pro 14 M2 Pro/Max A2779 |
| MacBook Pro 14 M3 A2992 | 2 | MacBook Pro 14 M3 Pro/Max A2992, MacBook Pro 14 M3 A2918 A2992 |
| MacBook Pro 14 M3 Pro/Max A2992 | 1 | MacBook Pro 14 M3 Pro/Max A2992 Warranty Assessment |
| MacBook Pro 15 A1398 | 6 | MacBook Pro 15 A1398 Screen, MacBook Pro 15 A1398 Battery, MacBook Pro 15 A1398 Charging Port, MacBook Pro 15 A1398 Keyboard |
| MacBook Pro 15 A1707 | 1 | MacBook Pro 15 A1707 |
| MacBook Pro 15 A1990 | 3 | MacBook Pro 15 A1990 Backlight, MacBook Pro 15 A1990 Logic Board Repair, MacBook Pro 15 A1990 |
| MacBook Pro 16 A2141 | 2 | MacBook Pro 16 A2141 Backlight, MacBook Pro 16 A2141 |
| MacBook Pro 16 M1 Pro/Max A2485 | 1 | MacBook Pro 16 M1 Pro/Max A2485 |
| MacBook Pro 16 M2 Pro/Max A2780 | 2 | MacBook Pro 16 M2 Pro/Max A2780 Battery, MacBook Pro 16 M2 Pro/Max A2780 |
| MacBook Pro 16 M3 Pro/Max A2991 | 3 | Liquid Damage Treatment, Liquid Damage Treatment, MacBook Pro 16 M3 Pro/Max A2991 |
| Other Device | 2 | Other Device Other Product, Screen Protector |
| TEST PRODUCT GROUP | 5 | TEST PRODUCT GROUP, TEST BATTEY PRODUCT, TEST GLASS TOUCH PRODUCT, TEST DISPLAY PRODUCT |
| Zebra PDA | 3 | Zebra PDA Touch Screen, Zebra PDA LCD, Zebra PDA |

## Section 5: Pricing Action List

### Raise Price

| Device | Product | Price | Net Profit | Net Margin | GSC Clicks | GSC Position | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| n/a | None | n/a | n/a | n/a | 0 | n/a | n/a |

### Lower Price

| Device | Product | Price | Net Profit | Net Margin | GSC Clicks | GSC Position | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Flexgate | £349.00 | £269.91 | 92.8% | 0 | n/a | healthy, overpriced |
| Apple Watch S7 45MM | Apple Watch S7 45MM Display Screen | £199.00 | £151.96 | 91.6% | 0 | n/a | healthy, overpriced |
| Apple Watch S7 45MM | Apple Watch S7 45MM Glass Screen | £199.00 | £151.96 | 91.6% | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Screen | £649.00 | £493.49 | 91.2% | 0 | n/a | healthy, overpriced |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Screen | £649.00 | £493.20 | 91.2% | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Dustgate | £249.00 | £188.97 | 91.1% | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Dustgate | £249.00 | £188.97 | 91.1% | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Dustgate | £249.00 | £188.78 | 91.0% | 0 | n/a | healthy, overpriced |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Dustgate | £249.00 | £188.78 | 91.0% | 0 | n/a | healthy, overpriced |
| iPhone 14 | iPhone 14 Charging Port | £89.00 | £67.07 | 90.4% | 0 | n/a | healthy, overpriced |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Screen | £799.00 | £601.85 | 90.4% | 0 | n/a | healthy, overpriced |
| iPhone 13 Pro | iPhone 13 Pro Charging Port | £89.00 | £66.91 | 90.2% | 0 | n/a | healthy, overpriced |
| MacBook Pro 13  A1708 | MacBook Pro 13 A1708 Flexgate | £349.00 | £262.07 | 90.1% | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Flexgate | £349.00 | £262.02 | 90.1% | 0 | n/a | healthy, overpriced |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Dustgate | £349.00 | £261.97 | 90.1% | 0 | n/a | healthy, overpriced |

### Review

| Device | Product | Price | Net Profit | Net Margin | GSC Clicks | GSC Position | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone 15 Pro Max | iPhone 15 Pro Max Screen | £359.00 | £89.34 | 29.9% | 11 | 2.4 | thin |

### Consider Dropping

| Device | Product | Price | Net Profit | Net Margin | GSC Clicks | GSC Position | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Display Screen | £399.00 | £-131.48 | -39.5% | 0 | n/a | loss-maker, no-shopify |
| iPhone 6s, iPhone 5 | iPhone 6s Rear Camera Lens | £40.00 | £-102.47 | -307.4% | 0 | n/a | loss-maker, no-shopify |
| iPhone 8 Plus | iPhone 8 Plus Display (Original LCD Screen) | £129.00 | £-87.08 | -81.0% | 0 | n/a | loss-maker, no-shopify |
| iPad Mini 5 | iPad Mini 5 Display Screen | £149.00 | £-70.38 | -56.7% | 0 | n/a | loss-maker, no-shopify |
| TEST PRODUCT GROUP | TEST DISPLAY PRODUCT | £40.00 | £-58.88 | -176.6% | 0 | n/a | loss-maker, no-shopify |
| iPad Air 2 | iPad Air 2 Display Screen | £179.00 | £-58.41 | -39.2% | 0 | n/a | loss-maker, no-shopify |
| iPad Air 3 | iPad Air 3 Display Screen | £199.00 | £-58.15 | -35.1% | 0 | n/a | loss-maker, no-shopify |
| iPad Mini 4 | iPad Mini 4 Display Screen | £149.00 | £-39.81 | -32.1% | 0 | n/a | loss-maker, no-shopify |
| iPhone 6s, iPhone 5 | iPhone 6s Original LCD Screen | £70.00 | £-31.07 | -53.3% | 0 | n/a | loss-maker, no-shopify |
| TEST PRODUCT GROUP | Custom Product | £10.00 | £-27.87 | -334.4% | 0 | n/a | loss-maker, no-shopify |
| TEST PRODUCT GROUP | TEST BATTEY PRODUCT | £50.00 | £-25.33 | -60.8% | 0 | n/a | loss-maker, no-shopify |
| iPhone 6 Plus | iPhone 6 Plus Original LCD Screen | £80.00 | £-24.93 | -37.4% | 0 | n/a | loss-maker, no-shopify |
| Apple Watch S2 38mm | Apple Watch S2 38mm Glass Screen | £129.00 | £-23.08 | -21.5% | 0 | n/a | loss-maker, no-shopify |
| Apple Watch S3 38mm | Apple Watch S3 38mm Glass Screen | £129.00 | £-23.08 | -21.5% | 0 | n/a | loss-maker, no-shopify |
| iPhone 7 Plus | iPhone 7 Plus Original LCD Screen | £129.00 | £-23.08 | -21.5% | 0 | n/a | loss-maker, no-shopify |

## Section 6: GSC Opportunity Matrix

### High-Traffic Queries With Bad Margin

| Device | Product | Clicks | Impr. | Position | Click trend | Margin | Matched queries |
| --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone 15 Pro Max | iPhone 15 Pro Max Screen | 11 | 863 | 2.4 | +8 | 29.9% | iphone 15 pro max screen replacement |

### Rank Well But Margin Is Bad

| Device | Product | Clicks | Impr. | Position | Click trend | Margin | Matched queries |
| --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone 15 Pro Max | iPhone 15 Pro Max Screen | 11 | 863 | 2.4 | +8 | 29.9% | iphone 15 pro max screen replacement |

### Great Margin But Low Traffic

| Device | Product | Clicks | Impr. | Position | Click trend | Margin | Matched queries |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Backlight | 0 | 0 | n/a | 0 | 94.3% |  |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Backlight | 0 | 0 | n/a | 0 | 94.3% |  |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Backlight | 0 | 0 | n/a | 0 | 93.5% |  |
| iPod Touch 6th Gen | iPod Touch 6th Gen Charging IC | 0 | 0 | n/a | 0 | 92.9% |  |
| iPod Touch 7th Gen | iPod Touch 7th Gen Charging IC | 0 | 0 | n/a | 0 | 92.9% |  |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Flexgate | 0 | 0 | n/a | 0 | 92.8% |  |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Backlight | 0 | 0 | n/a | 0 | 92.7% |  |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Backlight | 0 | 0 | n/a | 0 | 92.7% |  |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Backlight | 0 | 0 | n/a | 0 | 92.7% |  |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Backlight | 0 | 0 | n/a | 0 | 92.2% |  |
| Apple Watch S7 45MM | Apple Watch S7 45MM Display Screen | 0 | 0 | n/a | 0 | 91.6% |  |
| Apple Watch S7 45MM | Apple Watch S7 45MM Glass Screen | 0 | 0 | n/a | 0 | 91.6% |  |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Screen | 0 | 0 | n/a | 0 | 91.2% |  |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Screen | 0 | 0 | n/a | 0 | 91.2% |  |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Dustgate | 0 | 0 | n/a | 0 | 91.1% |  |
