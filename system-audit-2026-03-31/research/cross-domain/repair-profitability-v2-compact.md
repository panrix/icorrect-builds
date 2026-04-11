# Repair Profitability v2 Compact

## Section 1: Methodology & Data Quality

- Generated: `2026-04-03T06:29:26Z`
- Live Monday pulls used boards `2477699024` (products), `985177480` (parts), and `349212843` (main board).
- Live Shopify product pull used the store token against ``i-correct-final.myshopify.com` / `icorrect.co.uk``. The brief named `icorrect-tech.myshopify.com`, but on `2026-04-03` that hostname returned `404` while `i-correct-final.myshopify.com` and `icorrect.co.uk` resolved successfully for the same token.
- GSC input was parsed from `gsc-repair-profit-rankings.md` only; it is a markdown export, not raw Search Console rows.

- Raw Monday products fetched: `1270`
- Raw Monday parts fetched: `1802`
- Raw Monday main-board items fetched: `4468`
- Products included in profitability output after excluding diagnostics and aftermarket screens: `1122`
- Completed repair/refurb records with usable timing attached to products: `1539`
- Shopify products fetched: `967`
- GSC landing-page rows parsed: `15`
- GSC unique query rows parsed across the three exported tables: `60`

- Products using device default time because fewer than 3 completed repairs were matched: `860`
- Products not currently listed live on Shopify: `445`
- Products with Shopify vs Monday price mismatch: `20`
- Products with at least one linked part missing a supply cost: `10`
- Products with any matched GSC demand signal from the parsed query tables: `6`

- Timing method: prefer `status4` activity-log transitions into `Under Repair` / `Under Refurb` and out to `Repaired` / `Ready To Collect` / `Returned` / `Shipped`; fall back to `Repair Time` + `Refurb Time`; last resort is the repaired-date vs intake-date columns.
- Product repair time uses a trimmed median with the top 25% of durations dropped by count (rounded down) to strip long-tail queue or pause outliers.
- Device defaults used when fewer than 3 completed repairs were matched: iPhone `1.0h`, iPad `1.5h`, MacBook `2.0h`, Watch `2.0h`.
- Profit formula used ex-VAT price from Shopify when a Shopify price existed, otherwise Monday price / `1.2`; labour at `£24/h`; payment fee at `2%` of inc-VAT price; and `£24` extra for iPhone screen products.

## Section 2: Repair Time Analysis
Full repair time detail remains in `repair-profitability-v2.md`.

## Section 3: Ranked Product Profitability
GSC clicks and positions below use crossref data where it improves the original table.
Columns: Device | Product | Price (inc VAT) | Ex-VAT | Parts Cost | Labour | Refurb | Fees | Net Profit | Net Margin % | Shopify Listed | GSC Clicks (90d) | GSC Position | Flag

### iPhone
- iPhone 14 | iPhone 14 Charging Port | £89.00 | £74.17 | £0.00 | £5.31 | £0.00 | £1.78 | £67.07 | 90.4% | Yes | 7 | 8.1 | healthy, overpriced
- iPhone 13 Pro | iPhone 13 Pro Charging Port | £89.00 | £74.17 | £2.00 | £3.48 | £0.00 | £1.78 | £66.91 | 90.2% | Yes | 5 | 10.8 | healthy, overpriced
- iPhone 16 Pro Max | iPhone 16 Pro Max Rear Housing | £379.00 | £315.83 | £0.00 | £24.00 | £0.00 | £7.58 | £284.25 | 90.0% | No | 5 | 10.0 | healthy, overpriced, no-shopify
- iPhone 16 Pro | iPhone 16 Pro Front Camera | £349.00 | £290.83 | £0.00 | £24.00 | £0.00 | £6.98 | £259.85 | 89.3% | Yes | 2 | 4.8 | healthy, overpriced, price-mismatch
- iPhone 16 | iPhone 16 Front Camera | £349.00 | £290.83 | £0.00 | £24.00 | £0.00 | £6.98 | £259.85 | 89.3% | Yes | 1 | 6.6 | healthy, overpriced, price-mismatch
- iPhone 16 Pro Max | iPhone 16 Pro Max Front Camera | £349.00 | £290.83 | £0.00 | £24.00 | £0.00 | £6.98 | £259.85 | 89.3% | Yes | 1 | 4.8 | healthy, overpriced, price-mismatch
- iPhone 16 Plus | iPhone 16 Plus Front Camera | £349.00 | £290.83 | £0.00 | £24.00 | £0.00 | £6.98 | £259.85 | 89.3% | Yes | 0 | 6.5 | healthy, overpriced, price-mismatch
- iPhone 15 Pro | iPhone 15 Pro Front Camera | £329.00 | £274.17 | £0.00 | £24.00 | £0.00 | £6.58 | £243.59 | 88.8% | Yes | 15 | 7.9 | healthy, overpriced, price-mismatch
- iPhone 15 Pro Max | iPhone 15 Pro Max Front Camera | £329.00 | £274.17 | £0.00 | £24.00 | £0.00 | £6.58 | £243.59 | 88.8% | Yes | 8 | 11.4 | healthy, overpriced, price-mismatch
- iPhone 15 | iPhone 15 Front Camera | £329.00 | £274.17 | £0.00 | £24.00 | £0.00 | £6.58 | £243.59 | 88.8% | Yes | 3 | 3.8 | healthy, overpriced, price-mismatch
- iPhone 15 Plus | iPhone 15 Plus Front Camera | £329.00 | £274.17 | £0.00 | £24.00 | £0.00 | £6.58 | £243.59 | 88.8% | Yes | 1 | 17.7 | healthy, overpriced, price-mismatch
- iPhone 14 Pro | iPhone 14 Pro Front Camera | £299.00 | £249.17 | £0.00 | £24.00 | £0.00 | £5.98 | £219.19 | 88.0% | Yes | 7 | 8.7 | healthy, overpriced
- iPhone 14 Plus | iPhone 14 Plus Front Camera | £299.00 | £249.17 | £0.00 | £24.00 | £0.00 | £5.98 | £219.19 | 88.0% | Yes | 2 | 7.4 | healthy, overpriced, price-mismatch
- iPhone 14 | iPhone 14 Front Camera | £299.00 | £249.17 | £0.00 | £24.00 | £0.00 | £5.98 | £219.19 | 88.0% | Yes | 1 | 3.3 | healthy, overpriced, price-mismatch
- iPhone 13 Pro Max | iPhone 13 Pro Max Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 17 | 9.8 | healthy, overpriced, price-mismatch
- iPhone 12 Pro | iPhone 12 Pro NO SERVICE (LOGIC BOARD REPAIR) | £200.00 | £166.67 | £1.00 | £15.60 | £0.00 | £4.00 | £146.07 | 87.6% | No | 9 | 11.9 | healthy, overpriced, no-shopify
- iPhone 12 Pro | iPhone 12 Pro UNABLE TO ACTIVATE | £200.00 | £166.67 | £1.00 | £15.60 | £0.00 | £4.00 | £146.07 | 87.6% | No | 7 | 3.7 | healthy, overpriced, no-shopify
- iPhone 12 Pro Max | iPhone 12 Pro Max NO SERVICE (LOGIC BOARD REPAIR) | £200.00 | £166.67 | £1.00 | £15.60 | £0.00 | £4.00 | £146.07 | 87.6% | No | 7 | 14.6 | healthy, overpriced, no-shopify
- iPhone 14 Pro Max | iPhone 14 Pro Max Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 7 | 6.5 | healthy, overpriced, price-mismatch
- iPhone 13 Mini | iPhone 13 Mini Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 5 | 20.6 | healthy, overpriced, price-mismatch
- iPhone 13 Pro | iPhone 13 Pro Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 4 | 6.0 | healthy, overpriced, price-mismatch
- iPhone 13 | iPhone 13 Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 2 | 12.8 | healthy, overpriced, price-mismatch
- iPhone 12 Mini | iPhone 12 Mini Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 1 | 10.7 | healthy, overpriced, price-mismatch
- iPhone 12 Pro | iPhone 12 Pro Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 1 | 6.9 | healthy, overpriced, price-mismatch
- iPhone 12 Pro Max | iPhone 12 Pro Max UNABLE TO ACTIVATE | £200.00 | £166.67 | £1.00 | £15.60 | £0.00 | £4.00 | £146.07 | 87.6% | No | 1 | 4.8 | healthy, overpriced, no-shopify
- iPhone 12 | iPhone 12 Front Camera | £299.00 | £249.17 | £1.00 | £24.00 | £0.00 | £5.98 | £218.19 | 87.6% | Yes | 0 | 7.2 | healthy, overpriced, price-mismatch
- iPhone 15 Plus | iPhone 15 Plus Rear Glass | £259.00 | £215.83 | £0.00 | £24.00 | £0.00 | £5.18 | £186.65 | 86.5% | Yes | 6 | 6.9 | healthy, overpriced
- iPhone 14 Pro Max | iPhone 14 Pro Max Rear Camera Lens | £99.00 | £82.50 | £1.00 | £8.85 | £0.00 | £1.98 | £70.67 | 85.7% | Yes | 14 | 4.1 | healthy, overpriced
- iPhone 11 Pro | iPhone 11 Pro UNABLE TO ACTIVATE | £160.00 | £133.33 | £1.00 | £15.60 | £0.00 | £3.20 | £113.53 | 85.2% | No | 4 | 6.9 | healthy, overpriced, no-shopify
- iPhone 11 Pro Max | iPhone 11 Pro Max NO SERVICE (LOGIC BOARD REPAIR) | £160.00 | £133.33 | £1.00 | £15.60 | £0.00 | £3.20 | £113.53 | 85.2% | No | 1 | 37.1 | healthy, overpriced, no-shopify
- iPhone 11 Pro | iPhone 11 Pro Battery | £89.00 | £74.17 | £2.00 | £7.29 | £0.00 | £1.78 | £63.10 | 85.1% | Yes | 16 | 4.8 | healthy, overpriced
- iPhone 14 Pro Max | iPhone 14 Pro Max Battery | £89.00 | £74.17 | £0.75 | £8.91 | £0.00 | £1.78 | £62.72 | 84.6% | Yes | 59 | 5.4 | healthy, overpriced
- iPhone 16 Pro | iPhone 16 Pro Charging Port | £199.00 | £165.83 | £0.00 | £24.00 | £0.00 | £3.98 | £137.85 | 83.1% | Yes | 2 | 6.0 | healthy, overpriced
- iPhone 16 Pro | iPhone 16 Pro  Power Button | £179.00 | £149.17 | £0.00 | £24.00 | £0.00 | £3.58 | £121.59 | 81.5% | Yes | 1 | 11.5 | healthy, overpriced
- iPhone 16 Pro | iPhone 16 Pro Volume Button | £179.00 | £149.17 | £0.00 | £24.00 | £0.00 | £3.58 | £121.59 | 81.5% | Yes | 1 | 4.4 | healthy, overpriced
- iPhone 12 | iPhone 12 Charging Port | £79.00 | £65.83 | £2.00 | £8.96 | £0.00 | £1.58 | £53.29 | 81.0% | Yes | 1 | 8.0 | healthy, overpriced
- iPhone XS Max | iPhone XS Max NO SERVICE (LOGIC BOARD REPAIR) | £120.00 | £100.00 | £1.00 | £15.60 | £0.00 | £2.40 | £81.00 | 81.0% | No | 1 | 37.0 | healthy, overpriced, no-shopify
- iPhone XS Max | iPhone XS Max UNABLE TO ACTIVATE | £120.00 | £100.00 | £1.00 | £15.60 | £0.00 | £2.40 | £81.00 | 81.0% | No | 1 | 32.6 | healthy, overpriced, no-shopify
- iPhone XS Max | iPhone XS Max Battery | £89.00 | £74.17 | £2.00 | £10.49 | £0.00 | £1.78 | £59.90 | 80.8% | Yes | 1 | 10.0 | healthy, overpriced
- iPhone X | iPhone X NO SERVICE (LOGIC BOARD REPAIR) | £110.00 | £91.67 | £1.00 | £15.60 | £0.00 | £2.20 | £72.87 | 79.5% | No | 1 | 7.4 | healthy, overpriced, no-shopify
- iPhone 16 Plus | iPhone 16 Plus Screen | £299.00 | £249.17 | £0.00 | £24.00 | £24.00 | £5.98 | £195.19 | 78.3% | Yes | 56 | 4.5 | healthy, overpriced
- iPhone 16 Pro | iPhone 16 Pro Earpiece Speaker | £149.00 | £124.17 | £0.00 | £24.00 | £0.00 | £2.98 | £97.19 | 78.3% | Yes | 2 | 4.9 | healthy, overpriced
- iPhone 15 Pro | iPhone 15 Pro Charging Port | £149.00 | £124.17 | £0.00 | £24.00 | £0.00 | £2.98 | £97.19 | 78.3% | Yes | 1 | 9.0 | healthy, overpriced
- iPhone 15 Pro Max | iPhone 15 Pro Max Charging Port | £149.00 | £124.17 | £0.00 | £24.00 | £0.00 | £2.98 | £97.19 | 78.3% | Yes | 1 | 7.6 | healthy, overpriced
- iPhone 16 | iPhone 16 Rear Glass | £289.00 | £240.83 | £0.00 | £24.00 | £24.00 | £5.78 | £187.05 | 77.7% | Yes | 7 | 5.3 | healthy, overpriced
- iPhone 16 Pro Max | iPhone 16 Pro Max Rear Glass | £279.00 | £232.50 | £0.00 | £24.00 | £24.00 | £5.58 | £178.92 | 77.0% | Yes | 5 | 5.2 | healthy, overpriced
- iPhone 15 | iPhone 15 Microphone | £129.00 | £107.50 | £0.00 | £24.00 | £0.00 | £2.58 | £80.92 | 75.3% | Yes | 1 | 7.5 | healthy, overpriced
- iPhone 12 | iPhone 12 Battery | £89.00 | £74.17 | £10.00 | £7.41 | £0.00 | £1.78 | £54.97 | 74.1% | Yes | 16 | 5.1 | healthy, overpriced
- iPhone 12 Pro | iPhone 12 Pro Battery | £89.00 | £74.17 | £10.00 | £7.86 | £0.00 | £1.78 | £54.53 | 73.5% | Yes | 3 | 7.3 | healthy, overpriced
- iPhone 16 | iPhone 16 Battery | £119.00 | £99.17 | £0.00 | £24.00 | £0.00 | £2.38 | £72.79 | 73.4% | Yes | 7 | 4.9 | healthy, overpriced
- iPhone 16 Pro Max | iPhone 16 Pro Max Battery | £119.00 | £99.17 | £0.00 | £24.00 | £0.00 | £2.38 | £72.79 | 73.4% | Yes | 3 | 4.9 | healthy, overpriced
- iPhone 16 Pro | iPhone 16 Pro Battery | £119.00 | £99.17 | £0.00 | £24.00 | £0.00 | £2.38 | £72.79 | 73.4% | Yes | 2 | 5.1 | healthy, overpriced
- iPhone 16 Pro | iPhone 16 Pro Rear Camera Lens | £119.00 | £99.17 | £0.00 | £24.00 | £0.00 | £2.38 | £72.79 | 73.4% | Yes | 1 | 5.5 | healthy, overpriced
- iPhone 16 Pro Max | iPhone 16 Pro Max Rear Camera Lens | £119.00 | £99.17 | £0.00 | £24.00 | £0.00 | £2.38 | £72.79 | 73.4% | Yes | 1 | 3.0 | healthy, overpriced
- iPhone 12 Pro Max | iPhone 12 Pro Max Front Camera | £299.00 | £249.17 | £40.00 | £24.00 | £0.00 | £5.98 | £179.19 | 71.9% | Yes | 1 | 5.5 | healthy, overpriced, price-mismatch
- iPhone 13 | iPhone 13 Battery | £79.00 | £65.83 | £10.00 | £7.07 | £0.00 | £1.58 | £47.18 | 71.7% | Yes | 45 | 3.8 | healthy
- iPhone 15 Pro | iPhone 15 Pro Battery | £99.00 | £82.50 | £15.00 | £6.34 | £0.00 | £1.98 | £59.18 | 71.7% | Yes | 26 | 5.3 | healthy, overpriced
- iPhone 14 Pro Max | iPhone 14 Pro Max Microphone | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 1 | 3.8 | healthy, overpriced
- iPhone 15 Pro Max | iPhone 15 Pro Max Earpiece Speaker | £99.00 | £82.50 | £0.00 | £24.00 | £0.00 | £1.98 | £56.52 | 68.5% | Yes | 1 | 4.2 | healthy, overpriced
- iPhone 11 Pro Max | iPhone 11 Pro Max Battery | £89.00 | £74.17 | £10.00 | £12.03 | £0.00 | £1.78 | £50.35 | 67.9% | Yes | 5 | 6.4 | healthy, overpriced
- iPhone 13 Mini | iPhone 13 Mini Battery | £89.00 | £74.17 | £15.00 | £9.21 | £0.00 | £1.78 | £48.18 | 65.0% | Yes | 4 | 5.5 | healthy, overpriced
- iPhone XS Max | iPhone XS Max Display (Original OLED Screen) | £189.00 | £157.50 | £20.00 | £8.54 | £24.00 | £3.78 | £101.18 | 64.2% | Yes | 3 | 11.2 | healthy, overpriced
- iPhone X | iPhone X Battery | £59.00 | £49.17 | £10.00 | £6.88 | £0.00 | £1.18 | £31.10 | 63.3% | Yes | 1 | 9.5 | healthy, overpriced
- iPhone 13 Pro Max | iPhone 13 Pro Max Battery | £79.00 | £65.83 | £15.00 | £8.30 | £0.00 | £1.58 | £40.95 | 62.2% | Yes | 18 | 6.6 | healthy, overpriced
- iPhone 12 Pro Max | iPhone 12 Pro Max Battery | £89.00 | £74.17 | £15.00 | £11.35 | £0.00 | £1.78 | £46.04 | 62.1% | Yes | 2 | 6.4 | healthy, overpriced
- iPhone 13 | iPhone 13 Screen | £239.00 | £199.17 | £40.00 | £7.52 | £24.00 | £4.78 | £122.87 | 61.7% | Yes | 33 | 5.0 | healthy, overpriced
- iPhone 14 | iPhone 14 Battery | £79.00 | £65.83 | £15.00 | £8.79 | £0.00 | £1.58 | £40.47 | 61.5% | Yes | 11 | 1.7 | healthy
- iPhone 14 Pro Max | iPhone 14 Pro Max Charging Port | £89.00 | £74.17 | £16.84 | £10.49 | £0.00 | £1.78 | £45.06 | 60.8% | Yes | 1 | 11.7 | healthy, overpriced
- iPhone 13 Mini | iPhone 13 Mini Screen | £279.00 | £232.50 | £40.00 | £24.00 | £24.00 | £5.58 | £138.92 | 59.8% | Yes | 8 | 11.3 | healthy, overpriced
- iPhone 12 Mini | iPhone 12 Mini Earpiece Speaker | £79.00 | £65.83 | £1.00 | £24.00 | £0.00 | £1.58 | £39.25 | 59.6% | Yes | 1 | 6.7 | healthy, overpriced
- iPhone SE3 | iPhone SE3 Original Apple Screen Assembly | £149.00 | £124.17 | £0.00 | £24.00 | £24.00 | £2.98 | £73.19 | 58.9% | Yes | 1 | 11.9 | healthy, overpriced
- iPhone 12 Pro Max | iPhone 12 Pro Max Charging Port | £79.00 | £65.83 | £3.00 | £24.00 | £0.00 | £1.58 | £37.25 | 56.6% | Yes | 1 | 6.3 | healthy, overpriced
- iPhone 12 Pro Max | iPhone 12 Pro Max Screen | £229.00 | £190.83 | £40.00 | £14.96 | £24.00 | £4.58 | £107.30 | 56.2% | Yes | 38 | 5.1 | healthy, overpriced
- iPhone 13 Pro | iPhone 13 Pro Screen | £289.00 | £240.83 | £50.00 | £26.06 | £24.00 | £5.78 | £134.99 | 56.1% | Yes | 20 | 6.0 | healthy, overpriced
- iPhone 13 Pro Max | iPhone 13 Pro Max Screen | £299.00 | £249.17 | £70.00 | £11.61 | £24.00 | £5.98 | £137.57 | 55.2% | Yes | 32 | 6.0 | healthy, overpriced
- iPhone 14 Pro | iPhone 14 Pro Battery | £79.00 | £65.83 | £20.00 | £8.74 | £0.00 | £1.58 | £35.51 | 53.9% | Yes | 9 | 5.5 | healthy, overpriced
- iPhone 12 Mini | iPhone 12 Mini Screen | £199.00 | £165.83 | £35.00 | £24.00 | £24.00 | £3.98 | £78.85 | 47.5% | Yes | 2 | 5.2 | healthy
- iPhone 15 | iPhone 15 Screen | £289.00 | £240.83 | £80.00 | £20.79 | £24.00 | £5.78 | £110.27 | 45.8% | Yes | 29 | 5.5 | healthy
- iPhone XR | iPhone XR Battery | £89.00 | £74.17 | £15.00 | £24.00 | £0.00 | £1.78 | £33.39 | 45.0% | Yes | 1 | 6.9 | healthy
- iPhone 15 Plus | iPhone 15 Plus Screen | £289.00 | £240.83 | £80.00 | £24.00 | £24.00 | £5.78 | £107.05 | 44.5% | Yes | 4 | 6.0 | healthy
- iPhone 15 Pro Max | iPhone 15 Pro Max Battery | £99.00 | £82.50 | £20.00 | £24.00 | £0.00 | £1.98 | £36.52 | 44.3% | Yes | 18 | 4.9 | healthy
- iPhone 12 Pro Max | iPhone 12 Pro Max Earpiece Speaker | £79.00 | £65.83 | £13.57 | £24.00 | £0.00 | £1.58 | £26.68 | 40.5% | Yes | 1 | 5.2 | healthy
- iPhone 8 | iPhone 8 Battery | £59.00 | £49.17 | £5.00 | £24.00 | £0.00 | £1.18 | £18.99 | 38.6% | Yes | 1 | 4.5 | healthy
- iPhone 14 Plus | iPhone 14 Plus Battery | £79.00 | £65.83 | £15.00 | £24.00 | £0.00 | £1.58 | £25.25 | 38.4% | Yes | 6 | 4.9 | healthy
- iPhone 14 | iPhone 14 Screen | £239.00 | £199.17 | £80.00 | £15.08 | £24.00 | £4.78 | £75.31 | 37.8% | Yes | 19 | 7.2 | healthy
- iPhone 15 Pro | iPhone 15 Pro Screen | £339.00 | £282.50 | £130.00 | £16.66 | £24.00 | £6.78 | £105.06 | 37.2% | Yes | 53 | 5.1 | healthy
- iPhone 11 Pro | iPhone 11 Pro Screen | £189.00 | £157.50 | £60.00 | £14.61 | £24.00 | £3.78 | £55.11 | 35.0% | Yes | 15 | 10.7 | healthy
- iPhone 14 Pro Max | iPhone 14 Pro Max Screen | £299.00 | £249.17 | £120.00 | £12.55 | £24.00 | £5.98 | £86.63 | 34.8% | Yes | 68 | 5.6 | healthy
- iPhone 11 Pro Max | iPhone 11 Pro Max Screen | £189.00 | £157.50 | £65.00 | £10.78 | £24.00 | £3.78 | £53.94 | 34.2% | Yes | 4 | 11.3 | healthy
- iPhone 11 | iPhone 11 Screen | £109.00 | £90.83 | £25.00 | £10.99 | £24.00 | £2.18 | £28.66 | 31.6% | No | 1 | 14.3 | healthy, no-shopify
- iPhone 15 Pro Max | iPhone 15 Pro Max Screen | £359.00 | £299.17 | £150.00 | £28.65 | £24.00 | £7.18 | £89.34 | 29.9% | Yes | 42 | 6.1 | thin
- iPhone 14 Plus | iPhone 14 Plus Screen | £249.00 | £207.50 | £100.00 | £20.65 | £24.00 | £4.98 | £57.87 | 27.9% | Yes | 5 | 5.1 | thin
- iPhone XR | iPhone XR Charging Port | £59.00 | £49.17 | £20.00 | £14.63 | £0.00 | £1.18 | £13.36 | 27.2% | Yes | 1 | 8.7 | thin
- iPhone 11 Pro | iPhone 11 Pro Charging Port | £69.00 | £57.50 | £21.00 | £24.00 | £0.00 | £1.38 | £11.12 | 19.3% | Yes | 1 | 6.2 | thin
- iPhone 11 | iPhone 11 Rear Camera | £89.00 | £74.17 | £35.00 | £24.00 | £0.00 | £1.78 | £13.39 | 18.0% | Yes | 1 | 7.5 | thin
- iPhone 15 Pro Max | iPhone 15 Pro Max Rear Glass | £279.00 | £232.50 | £165.00 | £24.33 | £0.00 | £5.58 | £37.59 | 16.2% | Yes | 19 | 5.6 | thin
- iPhone 7 | iPhone 7 Charging Port | £59.00 | £49.17 | £20.00 | £24.00 | £0.00 | £1.18 | £3.99 | 8.1% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 7 | iPhone 7 Microphone | £59.00 | £49.17 | £20.00 | £24.00 | £0.00 | £1.18 | £3.99 | 8.1% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 7 Plus | iPhone 7 Plus Charging Port | £59.00 | £49.17 | £20.00 | £24.00 | £0.00 | £1.18 | £3.99 | 8.1% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 7 Plus | iPhone 7 Plus Microphone | £59.00 | £49.17 | £20.00 | £24.00 | £0.00 | £1.18 | £3.99 | 8.1% | No | 0 | 16.7 | loss-maker, no-shopify
- iPhone 8 Plus | iPhone 8 Plus Charging Port | £59.00 | £49.17 | £20.00 | £24.00 | £0.00 | £1.18 | £3.99 | 8.1% | Yes | 0 | 12.0 | loss-maker
- iPhone 8 Plus | iPhone 8 Plus Microphone | £59.00 | £49.17 | £20.00 | £24.00 | £0.00 | £1.18 | £3.99 | 8.1% | Yes | 0 | 18.0 | loss-maker
- iPhone 8 | iPhone 8 Rear Camera | £79.00 | £65.83 | £35.00 | £24.00 | £0.00 | £1.58 | £5.25 | 8.0% | Yes | 0 | n/a | loss-maker
- iPhone SE2 | iPhone SE2 Rear Camera | £79.00 | £65.83 | £35.00 | £24.00 | £0.00 | £1.58 | £5.25 | 8.0% | Yes | 0 | n/a | loss-maker
- iPhone X | iPhone X Rear Camera | £79.00 | £65.83 | £35.00 | £24.00 | £0.00 | £1.58 | £5.25 | 8.0% | Yes | 0 | n/a | loss-maker
- iPhone XR | iPhone XR Rear Camera | £79.00 | £65.83 | £35.00 | £24.00 | £0.00 | £1.58 | £5.25 | 8.0% | Yes | 0 | n/a | loss-maker
- iPhone XS | iPhone XS Rear Camera | £79.00 | £65.83 | £35.00 | £24.00 | £0.00 | £1.58 | £5.25 | 8.0% | Yes | 0 | n/a | loss-maker
- iPhone XS Max | iPhone XS Max Rear Camera | £79.00 | £65.83 | £35.00 | £24.00 | £0.00 | £1.58 | £5.25 | 8.0% | Yes | 0 | n/a | loss-maker
- iPhone XS Max | iPhone XS Max Charging Port | £59.00 | £49.17 | £21.00 | £24.00 | £0.00 | £1.18 | £2.99 | 6.1% | Yes | 0 | 4.4 | loss-maker
- iPhone XS Max | iPhone XS Max Microphone | £59.00 | £49.17 | £21.00 | £24.00 | £0.00 | £1.18 | £2.99 | 6.1% | Yes | 0 | n/a | loss-maker
- iPhone 16 Pro Max | iPhone 16 Pro Max Screen | £379.00 | £315.83 | £250.00 | £16.18 | £24.00 | £7.58 | £18.07 | 5.7% | Yes | 49 | 5.6 | loss-maker
- iPhone 15 Pro | iPhone 15 Pro Rear Glass | £279.00 | £232.50 | £200.00 | £15.33 | £0.00 | £5.58 | £11.59 | 5.0% | Yes | 0 | n/a | loss-maker
- iPhone 6 | iPhone 6 Battery | £50.00 | £41.67 | £15.00 | £24.00 | £0.00 | £1.00 | £1.67 | 4.0% | No | 0 | 20.6 | loss-maker, no-shopify
- iPhone 6 Plus | iPhone 6 Plus Battery | £50.00 | £41.67 | £15.00 | £24.00 | £0.00 | £1.00 | £1.67 | 4.0% | No | 0 | 19.3 | loss-maker, no-shopify
- iPhone 6S Plus | iPhone 6s Plus Battery | £50.00 | £41.67 | £15.00 | £24.00 | £0.00 | £1.00 | £1.67 | 4.0% | No | 0 | 12.0 | loss-maker, no-shopify
- iPhone 6s, iPhone 5 | iPhone 6s Battery | £50.00 | £41.67 | £15.00 | £24.00 | £0.00 | £1.00 | £1.67 | 4.0% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 16 Pro | iPhone 16 Pro Screen | £349.00 | £290.83 | £220.00 | £32.05 | £24.00 | £6.98 | £7.80 | 2.7% | Yes | 0 | n/a | loss-maker
- iPhone 11 Pro Max | iPhone 11 Pro Max Rear Camera Lens | £49.00 | £40.83 | £15.00 | £24.00 | £0.00 | £0.98 | £0.85 | 2.1% | Yes | 0 | 11.8 | loss-maker
- iPhone 11 Pro Max | iPhone 11 Pro Max Charging Port | £69.00 | £57.50 | £31.00 | £24.00 | £0.00 | £1.38 | £1.12 | 1.9% | Yes | 0 | 3.6 | loss-maker
- iPhone 11 Pro Max | iPhone 11 Pro Max Microphone | £69.00 | £57.50 | £31.00 | £24.00 | £0.00 | £1.38 | £1.12 | 1.9% | Yes | 0 | 8.2 | loss-maker
- iPhone XS | iPhone XS Mute Button | £59.00 | £49.17 | £25.00 | £24.00 | £0.00 | £1.18 | £-1.01 | -2.1% | Yes | 0 | n/a | loss-maker
- iPhone XS | iPhone XS Volume Button | £59.00 | £49.17 | £25.00 | £24.00 | £0.00 | £1.18 | £-1.01 | -2.1% | Yes | 0 | n/a | loss-maker
- iPhone 6 | iPhone 6 Charging Port | £50.00 | £41.67 | £20.00 | £24.00 | £0.00 | £1.00 | £-3.33 | -8.0% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 6 | iPhone 6 Microphone | £50.00 | £41.67 | £20.00 | £24.00 | £0.00 | £1.00 | £-3.33 | -8.0% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 6 Plus | iPhone 6 Plus Charging Port | £50.00 | £41.67 | £20.00 | £24.00 | £0.00 | £1.00 | £-3.33 | -8.0% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 6 Plus | iPhone 6 Plus Headphone Jack | £50.00 | £41.67 | £20.00 | £24.00 | £0.00 | £1.00 | £-3.33 | -8.0% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 6 Plus | iPhone 6 Plus Microphone | £50.00 | £41.67 | £20.00 | £24.00 | £0.00 | £1.00 | £-3.33 | -8.0% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 6S Plus | iPhone 6s Plus Charging Port | £50.00 | £41.67 | £20.00 | £24.00 | £0.00 | £1.00 | £-3.33 | -8.0% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 6S Plus | iPhone 6s Plus Microphone | £50.00 | £41.67 | £20.00 | £24.00 | £0.00 | £1.00 | £-3.33 | -8.0% | No | 0 | n/a | loss-maker, no-shopify
- iPhone XR | iPhone XR Display (Original LCD Screen) | £79.00 | £65.83 | £45.00 | £5.37 | £24.00 | £1.58 | £-10.12 | -15.4% | No | 5 | 9.7 | loss-maker, no-shopify
- iPhone 7 Plus | iPhone 7 Plus Original LCD Screen | £129.00 | £107.50 | £80.00 | £24.00 | £24.00 | £2.58 | £-23.08 | -21.5% | No | 0 | 36.9 | loss-maker, no-shopify
- iPhone 6S Plus | iPhone 6s Plus Original LCD Screen | £90.00 | £75.00 | £42.00 | £24.00 | £24.00 | £1.80 | £-16.80 | -22.4% | No | 0 | 67.2 | loss-maker, no-shopify
- iPhone 15 | iPhone 15 Rear Glass | £259.00 | £215.83 | £240.00 | £24.00 | £0.00 | £5.18 | £-53.35 | -24.7% | Yes | 0 | n/a | loss-maker
- iPhone XS | iPhone XS Rear Housing (Rear Glass And Frame) | £119.00 | £99.17 | £100.00 | £24.00 | £0.00 | £2.38 | £-27.21 | -27.4% | Yes | 0 | 26.2 | loss-maker
- iPhone XS Max | iPhone XS Max Rear Housing (Rear Glass And Frame) | £119.00 | £99.17 | £100.00 | £24.00 | £0.00 | £2.38 | £-27.21 | -27.4% | Yes | 0 | 17.5 | loss-maker
- iPhone 11 | iPhone 11 Charging Port | £69.00 | £57.50 | £60.00 | £12.49 | £0.00 | £1.38 | £-16.37 | -28.5% | Yes | 0 | n/a | loss-maker
- iPhone 6 | iPhone 6 Original LCD Screen | £70.00 | £58.33 | £29.30 | £24.00 | £24.00 | £1.40 | £-20.37 | -34.9% | No | 0 | 28.4 | loss-maker, no-shopify
- iPhone 6 Plus | iPhone 6 Plus Original LCD Screen | £80.00 | £66.67 | £42.00 | £24.00 | £24.00 | £1.60 | £-24.93 | -37.4% | No | 0 | 27.0 | loss-maker, no-shopify
- iPhone 6 | iPhone 6 Rear Camera | £50.00 | £41.67 | £35.00 | £24.00 | £0.00 | £1.00 | £-18.33 | -44.0% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 6 Plus | iPhone 6 Plus Rear Camera | £50.00 | £41.67 | £35.00 | £24.00 | £0.00 | £1.00 | £-18.33 | -44.0% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 6S Plus | iPhone 6s Plus Rear Camera | £50.00 | £41.67 | £35.00 | £24.00 | £0.00 | £1.00 | £-18.33 | -44.0% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 6s, iPhone 5 | iPhone 6s Rear Camera | £50.00 | £41.67 | £35.00 | £24.00 | £0.00 | £1.00 | £-18.33 | -44.0% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 7 | iPhone 7 Rear Camera | £49.00 | £40.83 | £35.00 | £24.00 | £0.00 | £0.98 | £-19.15 | -46.9% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 7 Plus | iPhone 7 Plus Rear Camera | £49.00 | £40.83 | £35.00 | £24.00 | £0.00 | £0.98 | £-19.15 | -46.9% | No | 0 | n/a | loss-maker, no-shopify
- iPhone SE2 | iPhone SE2 Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £123.16 | £8.66 | £0.00 | £2.18 | £-43.17 | -47.5% | Yes | 0 | n/a | loss-maker
- iPhone 11 | iPhone 11 Microphone | £69.00 | £57.50 | £60.00 | £24.00 | £0.00 | £1.38 | £-27.88 | -48.5% | Yes | 0 | n/a | loss-maker
- iPhone X | iPhone X Charging Port | £59.00 | £49.17 | £50.00 | £24.00 | £0.00 | £1.18 | £-26.01 | -52.9% | Yes | 0 | 15.2 | loss-maker
- iPhone X | iPhone X Microphone | £59.00 | £49.17 | £50.00 | £24.00 | £0.00 | £1.18 | £-26.01 | -52.9% | Yes | 0 | 11.0 | loss-maker
- iPhone 6s, iPhone 5 | iPhone 6s Original LCD Screen | £70.00 | £58.33 | £40.00 | £24.00 | £24.00 | £1.40 | £-31.07 | -53.3% | No | 0 | n/a | loss-maker, no-shopify
- iPhone X | iPhone X Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £130.00 | £24.00 | £0.00 | £2.18 | £-65.35 | -71.9% | Yes | 0 | 11.0 | loss-maker
- iPhone 8 Plus | iPhone 8 Plus Display (Original LCD Screen) | £129.00 | £107.50 | £144.00 | £24.00 | £24.00 | £2.58 | £-87.08 | -81.0% | No | 0 | 30.4 | loss-maker, no-shopify
- iPhone 14 Pro Max | iPhone 14 Pro Max Rear Housing (Rear Glass And Frame) | £209.00 | £174.17 | £340.00 | £13.40 | £0.00 | £4.18 | £-183.41 | -105.3% | Yes | 21 | 4.5 | loss-maker
- iPhone 14 Plus | iPhone 14 Plus Rear Glass | £249.00 | £207.50 | £400.00 | £24.00 | £0.00 | £4.98 | £-221.48 | -106.7% | Yes | 1 | 5.3 | loss-maker
- iPhone 14 Pro | iPhone 14 Pro Rear Housing (Rear Glass And Frame) | £209.00 | £174.17 | £340.00 | £15.85 | £0.00 | £4.18 | £-185.86 | -106.7% | Yes | 0 | n/a | loss-maker
- iPhone 14 | iPhone 14 Rear Glass | £239.00 | £199.17 | £400.00 | £24.00 | £0.00 | £4.78 | £-229.61 | -115.3% | Yes | 0 | n/a | loss-maker
- iPhone 8 | iPhone 8 Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £170.00 | £24.00 | £0.00 | £2.18 | £-105.35 | -116.0% | Yes | 0 | 11.1 | loss-maker
- iPhone 12 | iPhone 12 Rear Housing (Rear Glass And Frame) | £179.00 | £149.17 | £311.00 | £11.50 | £0.00 | £3.58 | £-176.91 | -118.6% | Yes | 3 | 4.4 | loss-maker
- iPhone 12 Pro Max | iPhone 12 Pro Max Rear Housing (Rear Glass And Frame) | £189.00 | £157.50 | £340.00 | £15.99 | £0.00 | £3.78 | £-202.27 | -128.4% | Yes | 4 | 5.5 | loss-maker
- iPhone 11 Pro Max | iPhone 11 Pro Max Rear Housing (Rear Glass And Frame) | £139.00 | £115.83 | £255.00 | £11.12 | £0.00 | £2.78 | £-153.07 | -132.1% | Yes | 0 | 12.2 | loss-maker
- iPhone 12 Pro | iPhone 12 Pro Rear Housing (Rear Glass And Frame) | £189.00 | £157.50 | £340.00 | £24.00 | £0.00 | £3.78 | £-210.28 | -133.5% | Yes | 0 | n/a | loss-maker
- iPhone 13 Pro Max | iPhone 13 Pro Max Rear Housing (Rear Glass And Frame) | £199.00 | £165.83 | £380.00 | £9.44 | £0.00 | £3.98 | £-227.59 | -137.2% | Yes | 19 | 5.4 | loss-maker
- iPhone 8 Plus | iPhone 8 Plus Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £190.00 | £24.00 | £0.00 | £2.18 | £-125.35 | -138.0% | Yes | 0 | 14.9 | loss-maker
- iPhone 11 Pro | iPhone 11 Pro Rear Housing (Rear Glass And Frame) | £139.00 | £115.83 | £280.00 | £24.00 | £0.00 | £2.78 | £-190.95 | -164.8% | Yes | 0 | n/a | loss-maker
- iPhone XR | iPhone XR Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £220.00 | £24.00 | £0.00 | £2.18 | £-155.35 | -171.0% | Yes | 0 | 7.4 | loss-maker
- iPhone 11 | iPhone 11 Rear Housing (Rear Glass And Frame) | £139.00 | £115.83 | £290.00 | £24.00 | £0.00 | £2.78 | £-200.95 | -173.5% | Yes | 0 | n/a | loss-maker
- iPhone 13 Pro | iPhone 13 Pro Rear Housing (Rear Glass And Frame) | £199.00 | £165.83 | £470.00 | £17.22 | £0.00 | £3.98 | £-325.36 | -196.2% | Yes | 0 | n/a | loss-maker
- iPhone 13 | iPhone 13 Rear Housing (Rear Glass And Frame) | £189.00 | £157.50 | £470.00 | £16.27 | £0.00 | £3.78 | £-332.55 | -211.1% | Yes | 0 | n/a | loss-maker
- iPhone 13 Mini | iPhone 13 Mini Rear Housing (Rear Glass And Frame) | £199.00 | £165.83 | £600.00 | £24.00 | £0.00 | £3.98 | £-462.15 | -278.7% | Yes | 4 | 4.4 | loss-maker
- iPhone 12 Mini | iPhone 12 Mini Rear Housing (Rear Glass And Frame) | £179.00 | £149.17 | £550.00 | £24.00 | £0.00 | £3.58 | £-428.41 | -287.2% | Yes | 0 | 6.4 | loss-maker
- iPhone 6s, iPhone 5 | iPhone 6s Rear Camera Lens | £40.00 | £33.33 | £111.00 | £24.00 | £0.00 | £0.80 | £-102.47 | -307.4% | No | 0 | n/a | loss-maker, no-shopify
- iPhone 16 | iPhone 16 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 17 | 5.4 | thin, no-shopify
- iPhone 13 | iPhone 13 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 13 | 7.1 | thin, no-shopify
- iPhone 15 | iPhone 15 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 13 | 5.9 | thin, no-shopify
- iPhone 12 | iPhone 12 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 6 | 6.7 | thin, no-shopify
- iPhone 14 | iPhone 14 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 6 | 8.2 | thin, no-shopify
- iPhone XR | iPhone XR | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 3 | 19.5 | thin, no-shopify
- iPhone 11 | iPhone 11 | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 2 | 14.3 | thin, no-shopify
- iPhone X | iPhone X | n/a | n/a | £0.00 | £24.00 | £0.00 | n/a | n/a | n/a | No | 1 | 22.5 | thin, no-shopify
- Plus 269 more iPhone products with healthy margins and no search demand; plus 64 more iPhone products with thin margins and no search demand; plus 29 iPhone rows removed because net profit was n/a and GSC clicks were zero.

### iPad
- iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Glass Screen | £399.00 | £332.50 | £0.00 | £36.00 | £0.00 | £7.98 | £288.52 | 86.8% | No | 19 | 12.5 | healthy, overpriced, no-shopify
- iPad Pro 11 (4G) | iPad Pro 11 (4G) Display Screen | £349.00 | £290.83 | £0.00 | £36.00 | £0.00 | £6.98 | £247.85 | 85.2% | No | 8 | 19.8 | healthy, overpriced, no-shopify
- iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Charging Port | £149.00 | £124.17 | £4.80 | £13.39 | £0.00 | £2.98 | £102.99 | 82.9% | Yes | 14 | 4.5 | healthy, overpriced
- iPad Air 7 (13) | iPad Air 7 (13) Screen | £399.00 | £332.50 | £0.00 | £52.85 | £0.00 | £7.98 | £271.67 | 81.7% | No | 32 | 10.9 | healthy, overpriced, no-shopify
- iPad Mini 6 | iPad Mini 6 Glass Screen | £269.00 | £224.17 | £0.00 | £36.00 | £0.00 | £5.38 | £182.79 | 81.5% | No | 10 | 16.8 | healthy, overpriced, no-shopify
- iPad Air 6 (13) | iPad Air 6 (13) Screen | £349.00 | £290.83 | £0.00 | £50.27 | £0.00 | £6.98 | £233.58 | 80.3% | No | 1 | 2.9 | healthy, overpriced, no-shopify
- iPad 10 | iPad 10 Glass Screen | £199.00 | £165.83 | £13.00 | £19.57 | £0.00 | £3.98 | £129.28 | 78.0% | No | 3 | 9.0 | healthy, overpriced, no-shopify
- iPad Air 4 | iPad Air 4 Glass Screen | £199.00 | £165.83 | £0.00 | £36.00 | £0.00 | £3.98 | £125.85 | 75.9% | No | 5 | 17.2 | healthy, overpriced, no-shopify
- iPad Air 5 | iPad Air 5 Glass Screen | £199.00 | £165.83 | £0.00 | £36.00 | £0.00 | £3.98 | £125.85 | 75.9% | No | 4 | 15.7 | healthy, overpriced, no-shopify
- iPad Air 5 | iPad Air 5 Charging Port | £149.00 | £124.17 | £9.60 | £17.29 | £0.00 | £2.98 | £94.30 | 75.9% | Yes | 1 | 5.9 | healthy, overpriced
- iPad Air 3 | iPad Air 3 Glass Screen | £149.00 | £124.17 | £0.00 | £36.00 | £0.00 | £2.98 | £85.19 | 68.6% | No | 1 | 7.1 | healthy, overpriced, no-shopify
- iPad Air 2 | iPad Air 2 Battery | £149.00 | £124.17 | £8.35 | £36.00 | £0.00 | £2.98 | £76.84 | 61.9% | No | 1 | 6.5 | healthy, overpriced, no-shopify
- iPad Pro 9.7 | iPad Pro 9.7 Battery | £149.00 | £124.17 | £8.90 | £36.00 | £0.00 | £2.98 | £76.29 | 61.4% | No | 8 | 4.5 | healthy, overpriced, no-shopify
- iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Battery | £159.00 | £132.50 | £12.10 | £36.00 | £0.00 | £3.18 | £81.22 | 61.3% | No | 1 | 3.8 | healthy, overpriced, no-shopify
- iPad Mini 6 | iPad Mini 6 Battery | £169.00 | £140.83 | £19.30 | £36.00 | £0.00 | £3.38 | £82.15 | 58.3% | Yes | 1 | 6.1 | healthy, overpriced
- iPad Air 4 | iPad Air 4 Battery | £149.00 | £124.17 | £20.00 | £36.00 | £0.00 | £2.98 | £65.19 | 52.5% | Yes | 1 | 3.2 | healthy, overpriced
- iPad 9 | iPad 9 Display Screen | £119.00 | £99.17 | £40.00 | £17.33 | £0.00 | £2.38 | £39.46 | 39.8% | Yes | 0 | n/a | healthy, price-mismatch
- iPad Pro 13 (7G) | iPad Pro 13 (7G) Screen | £799.00 | £665.83 | £550.00 | £36.00 | £0.00 | £15.98 | £63.85 | 9.6% | No | 16 | 5.7 | loss-maker, no-shopify
- iPad Pro 10.5 | iPad Pro 10.5 Display Screen | £199.00 | £165.83 | £112.50 | £36.00 | £0.00 | £3.98 | £13.35 | 8.1% | No | 0 | 4.0 | loss-maker, no-shopify
- iPad 10 | iPad 10 Display Screen | £149.00 | £124.17 | £77.50 | £36.00 | £0.00 | £2.98 | £7.69 | 6.2% | Yes | 0 | n/a | loss-maker
- iPad 5 | iPad 5 Display Screen | £99.00 | £82.50 | £40.00 | £36.00 | £0.00 | £1.98 | £4.52 | 5.5% | No | 0 | n/a | loss-maker, no-shopify
- iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Display Screen | £349.00 | £290.83 | £246.00 | £36.00 | £0.00 | £6.98 | £1.85 | 0.6% | No | 0 | n/a | loss-maker, no-shopify
- iPad Pro 9.7 | iPad Pro 9.7 Display Screen | £189.00 | £157.50 | £118.00 | £36.00 | £0.00 | £3.78 | £-0.28 | -0.2% | No | 0 | n/a | loss-maker, no-shopify
- iPad Pro 11 (5G) | iPad Pro 11 (5G) Screen | £699.00 | £582.50 | £550.00 | £36.00 | £0.00 | £13.98 | £-17.48 | -3.0% | No | 0 | n/a | loss-maker, no-shopify
- iPad Mini 4 | iPad Mini 4 Display Screen | £149.00 | £124.17 | £125.00 | £36.00 | £0.00 | £2.98 | £-39.81 | -32.1% | No | 0 | n/a | loss-maker, no-shopify
- iPad Air 3 | iPad Air 3 Display Screen | £199.00 | £165.83 | £184.00 | £36.00 | £0.00 | £3.98 | £-58.15 | -35.1% | No | 0 | n/a | loss-maker, no-shopify
- iPad Air 2 | iPad Air 2 Display Screen | £179.00 | £149.17 | £168.00 | £36.00 | £0.00 | £3.58 | £-58.41 | -39.2% | No | 0 | 67.5 | loss-maker, no-shopify
- iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Display Screen | £399.00 | £332.50 | £420.00 | £36.00 | £0.00 | £7.98 | £-131.48 | -39.5% | No | 0 | n/a | loss-maker, no-shopify
- iPad 6 | iPad 6 Display Screen | £99.00 | £82.50 | £80.00 | £36.00 | £0.00 | £1.98 | £-35.48 | -43.0% | Yes | 0 | n/a | loss-maker
- iPad Mini 5 | iPad Mini 5 Display Screen | £149.00 | £124.17 | £170.00 | £21.56 | £0.00 | £2.98 | £-70.38 | -56.7% | No | 0 | n/a | loss-maker, no-shopify
- iPad Air | iPad Air | n/a | n/a | £0.00 | £36.00 | £0.00 | n/a | n/a | n/a | No | 1 | 23.0 | thin, no-shopify
- Plus 83 more iPad products with healthy margins and no search demand; plus 15 more iPad products with thin margins and no search demand; plus 26 iPad rows removed because net profit was n/a and GSC clicks were zero.

### MacBook
- MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Flexgate | £349.00 | £290.83 | £0.00 | £13.94 | £0.00 | £6.98 | £269.91 | 92.8% | Yes | 55 | 8.5 | healthy, overpriced
- MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Backlight | £299.00 | £249.17 | £0.00 | £13.55 | £0.00 | £5.98 | £229.64 | 92.2% | No | 1 | 9.3 | healthy, overpriced, no-shopify
- MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Screen | £649.00 | £540.83 | £0.00 | £34.36 | £0.00 | £12.98 | £493.49 | 91.2% | Yes | 74 | 11.3 | healthy, overpriced
- MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Screen | £649.00 | £540.83 | £0.00 | £34.65 | £0.00 | £12.98 | £493.20 | 91.2% | Yes | 5 | 8.2 | healthy, overpriced
- MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Screen | £799.00 | £665.83 | £0.00 | £48.00 | £0.00 | £15.98 | £601.85 | 90.4% | Yes | 34 | 7.6 | healthy, overpriced
- MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Battery | £199.00 | £165.83 | £0.00 | £16.33 | £0.00 | £3.98 | £145.53 | 87.8% | No | 24 | 5.9 | healthy, overpriced, no-shopify
- MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Keyboard | £499.00 | £415.83 | £0.00 | £48.00 | £0.00 | £9.98 | £357.85 | 86.1% | Yes | 5 | 8.4 | healthy, overpriced
- MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Screen | £499.00 | £415.83 | £0.00 | £48.00 | £0.00 | £9.98 | £357.85 | 86.1% | No | 4 | 11.1 | healthy, overpriced, no-shopify
- MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Battery | £449.00 | £374.17 | £0.00 | £48.00 | £0.00 | £8.98 | £317.19 | 84.8% | Yes | 10 | 5.7 | healthy, overpriced
- MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Screen | £399.00 | £332.50 | £0.00 | £48.00 | £0.00 | £7.98 | £276.52 | 83.2% | No | 8 | 9.4 | healthy, overpriced, no-shopify
- MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Charging Port | £399.00 | £332.50 | £0.00 | £48.00 | £0.00 | £7.98 | £276.52 | 83.2% | Yes | 1 | 7.8 | healthy, overpriced
- MacBook Air 13 A1466 | MacBook Air 13 A1466 Screen | £299.00 | £249.17 | £0.00 | £48.00 | £0.00 | £5.98 | £195.19 | 78.3% | Yes | 55 | 9.4 | healthy, overpriced
- MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Keyboard | £299.00 | £249.17 | £0.00 | £48.00 | £0.00 | £5.98 | £195.19 | 78.3% | Yes | 3 | 9.1 | healthy, overpriced
- MacBook Air 13 M4 A3240 | MacBook Air 13 M4 A3240 Keyboard | £299.00 | £249.17 | £0.00 | £48.00 | £0.00 | £5.98 | £195.19 | 78.3% | Yes | 1 | 6.5 | healthy, overpriced
- MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Keyboard | £279.00 | £232.50 | £0.00 | £48.00 | £0.00 | £5.58 | £178.92 | 77.0% | Yes | 1 | 20.8 | healthy, overpriced
- MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Battery | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 7 | 5.8 | healthy, overpriced
- MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Keyboard | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 1 | 23.1 | healthy, overpriced
- MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Battery | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 1 | 6.2 | healthy, overpriced
- MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Battery | £249.00 | £207.50 | £0.00 | £48.00 | £0.00 | £4.98 | £154.52 | 74.5% | Yes | 1 | 7.7 | healthy, overpriced
- MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Battery | £179.00 | £149.17 | £33.00 | £10.35 | £0.00 | £3.58 | £102.24 | 68.5% | Yes | 1 | 9.4 | healthy, overpriced
- MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Screen | £399.00 | £332.50 | £45.00 | £59.48 | £0.00 | £7.98 | £220.04 | 66.2% | Yes | 1 | 28.0 | healthy, overpriced
- MacBook Air 13 M4 A3240 | MacBook Air 13 M4 A3240 Screen | £479.00 | £399.17 | £95.00 | £37.08 | £0.00 | £9.58 | £257.51 | 64.5% | Yes | 16 | 3.4 | healthy, overpriced
- MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Battery | £199.00 | £165.83 | £47.00 | £12.63 | £0.00 | £3.98 | £102.23 | 61.6% | Yes | 5 | 6.0 | healthy, overpriced
- MacBook Air 13 A2179 | MacBook Air 13 A2179 Screen | £299.00 | £249.17 | £45.00 | £46.09 | £0.00 | £5.98 | £152.10 | 61.0% | Yes | 1 | 6.6 | healthy, overpriced
- MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Screen | £429.00 | £357.50 | £95.00 | £37.08 | £0.00 | £8.58 | £216.84 | 60.7% | Yes | 1 | 14.6 | healthy, overpriced
- MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Battery | £199.00 | £165.83 | £35.00 | £26.75 | £0.00 | £3.98 | £100.10 | 60.4% | No | 1 | 11.4 | healthy, overpriced, no-shopify
- MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Screen | £469.00 | £390.83 | £106.95 | £47.11 | £0.00 | £9.38 | £227.39 | 58.2% | Yes | 1 | 4.1 | healthy, overpriced
- MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Screen | £399.00 | £332.50 | £95.00 | £36.75 | £0.00 | £7.98 | £192.77 | 58.0% | Yes | 18 | 14.3 | healthy, overpriced
- MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Battery | £179.00 | £149.17 | £47.00 | £12.63 | £0.00 | £3.58 | £85.96 | 57.6% | Yes | 1 | 5.6 | healthy, overpriced
- MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Screen | £449.00 | £374.17 | £106.95 | £47.11 | £0.00 | £8.98 | £211.12 | 56.4% | Yes | 2 | 18.3 | healthy, overpriced
- MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Screen | £499.00 | £415.83 | £110.00 | £67.31 | £0.00 | £9.98 | £228.55 | 55.0% | Yes | 1 | 14.5 | healthy, overpriced
- MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Screen | £499.00 | £415.83 | £140.00 | £50.35 | £0.00 | £9.98 | £215.50 | 51.8% | Yes | 1 | 7.8 | healthy, overpriced
- MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Screen | £339.00 | £282.50 | £99.00 | £33.15 | £0.00 | £6.78 | £143.57 | 50.8% | Yes | 29 | 13.6 | healthy, overpriced
- MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 M1 Pro/Max A2442 Battery | £249.00 | £207.50 | £50.00 | £48.00 | £0.00 | £4.98 | £104.52 | 50.4% | Yes | 4 | 7.2 | healthy, overpriced
- MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Screen | £639.00 | £532.50 | £228.00 | £39.11 | £0.00 | £12.78 | £252.61 | 47.4% | Yes | 2 | 10.8 | healthy
- MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Screen | £599.00 | £499.17 | £228.00 | £39.37 | £0.00 | £11.98 | £219.82 | 44.0% | Yes | 14 | 7.0 | healthy
- MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Screen | £599.00 | £499.17 | £228.00 | £40.77 | £0.00 | £11.98 | £218.42 | 43.8% | Yes | 1 | 5.7 | healthy
- MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Battery | £149.00 | £124.17 | £35.00 | £32.20 | £0.00 | £2.98 | £53.99 | 43.5% | Yes | 1 | 7.0 | healthy
- MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Screen | £429.00 | £357.50 | £200.00 | £47.62 | £0.00 | £8.58 | £101.30 | 28.3% | Yes | 3 | 15.7 | thin
- MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Screen | £699.00 | £582.50 | £456.00 | £39.24 | £0.00 | £13.98 | £73.28 | 12.6% | Yes | 2 | 13.7 | thin
- MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Screen | £599.00 | £499.17 | £415.00 | £39.98 | £0.00 | £11.98 | £32.21 | 6.5% | Yes | 0 | 3.8 | loss-maker
- MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Trackpad | £299.00 | £249.17 | £187.00 | £48.00 | £0.00 | £5.98 | £8.19 | 3.3% | Yes | 0 | n/a | loss-maker
- MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Screen | £549.00 | £457.50 | £415.00 | £40.23 | £0.00 | £10.98 | £-8.71 | -1.9% | Yes | 7 | 9.3 | loss-maker
- MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Trackpad | £249.00 | £207.50 | £177.00 | £48.00 | £0.00 | £4.98 | £-22.48 | -10.8% | Yes | 0 | n/a | loss-maker
- Plus 142 more MacBook products with healthy margins and no search demand; plus 7 more MacBook products with thin margins and no search demand; plus 36 MacBook rows removed because net profit was n/a and GSC clicks were zero.

### Apple Watch
- Apple Watch S7 45MM | Apple Watch S7 45MM Display Screen | £199.00 | £165.83 | £1.00 | £8.89 | £0.00 | £3.98 | £151.96 | 91.6% | Yes | 255 | 12.1 | healthy, overpriced
- Apple Watch S7 45MM | Apple Watch S7 45MM Glass Screen | £199.00 | £165.83 | £1.00 | £8.89 | £0.00 | £3.98 | £151.96 | 91.6% | Yes | 62 | 14.4 | healthy, overpriced
- Apple Watch Ultra | Apple Watch Ultra  Display Screen | £399.00 | £332.50 | £0.00 | £48.00 | £0.00 | £7.98 | £276.52 | 83.2% | Yes | 26 | 24.6 | healthy, overpriced
- Apple Watch Ultra | Apple Watch Ultra Glass Screen | £399.00 | £332.50 | £0.00 | £48.00 | £0.00 | £7.98 | £276.52 | 83.2% | Yes | 2 | 30.1 | healthy, overpriced
- Apple Watch Ultra | Apple Watch Ultra Battery | £279.00 | £232.50 | £0.00 | £48.00 | £0.00 | £5.58 | £178.92 | 77.0% | Yes | 137 | 5.3 | healthy, overpriced
- Apple Watch SE 44mm | Apple Watch SE 44mm Display Screen | £199.00 | £165.83 | £20.00 | £14.33 | £0.00 | £3.98 | £127.53 | 76.9% | Yes | 26 | 19.3 | healthy, overpriced
- Apple Watch SE 44mm | Apple Watch SE 44MM Glass Screen | £199.00 | £165.83 | £20.00 | £14.99 | £0.00 | £3.98 | £126.86 | 76.5% | Yes | 3 | 3.2 | healthy, overpriced
- Apple Watch SE 40mm | Apple Watch SE 40mm Display Screen | £199.00 | £165.83 | £20.00 | £15.67 | £0.00 | £3.98 | £126.19 | 76.1% | Yes | 5 | 25.8 | healthy, overpriced
- Apple Watch Ultra | Apple Watch Ultra Crown | £229.00 | £190.83 | £0.00 | £48.00 | £0.00 | £4.58 | £138.25 | 72.4% | No | 1 | 5.2 | healthy, overpriced, no-shopify
- Apple Watch Ultra | Apple Watch Ultra Side Button | £229.00 | £190.83 | £0.00 | £48.00 | £0.00 | £4.58 | £138.25 | 72.4% | Yes | 1 | 5.8 | healthy, overpriced
- Apple Watch SE 40mm | Apple Watch SE 40mm Battery | £149.00 | £124.17 | £20.00 | £15.67 | £0.00 | £2.98 | £85.52 | 68.9% | Yes | 3 | 3.7 | healthy, overpriced
- Apple Watch SE2 40MM | Apple Watch SE2 40MM Glass Screen | £199.00 | £165.83 | £0.00 | £48.00 | £0.00 | £3.98 | £113.85 | 68.7% | Yes | 1 | 2.2 | healthy, overpriced
- Apple Watch S9 41MM | Apple Watch S9 41MM Battery | £179.00 | £149.17 | £0.00 | £48.00 | £0.00 | £3.58 | £97.59 | 65.4% | Yes | 1 | 6.5 | healthy, overpriced
- Apple Watch S1 38mm | Apple Watch S1 38mm Glass Screen | £129.00 | £107.50 | £60.00 | £48.00 | £0.00 | £2.58 | £-3.08 | -2.9% | No | 0 | n/a | loss-maker, no-shopify
- Apple Watch S1 42mm | Apple Watch S1 42mm Glass Screen | £129.00 | £107.50 | £60.00 | £48.00 | £0.00 | £2.58 | £-3.08 | -2.9% | No | 0 | n/a | loss-maker, no-shopify
- Apple Watch S6 40mm | Apple Watch S6 40mm Display Screen | £179.00 | £149.17 | £120.00 | £48.00 | £0.00 | £3.58 | £-22.41 | -15.0% | Yes | 0 | n/a | loss-maker
- Apple Watch S6 40mm | Apple Watch S6 40mm Glass Screen | £179.00 | £149.17 | £120.00 | £48.00 | £0.00 | £3.58 | £-22.41 | -15.0% | Yes | 0 | n/a | loss-maker
- Apple Watch S2 38mm | Apple Watch S2 38mm Glass Screen | £129.00 | £107.50 | £80.00 | £48.00 | £0.00 | £2.58 | £-23.08 | -21.5% | No | 0 | n/a | loss-maker, no-shopify
- Apple Watch S3 38mm | Apple Watch S3 38mm Glass Screen | £129.00 | £107.50 | £80.00 | £48.00 | £0.00 | £2.58 | £-23.08 | -21.5% | No | 0 | n/a | loss-maker, no-shopify
- Plus 120 more Apple Watch products with healthy margins and no search demand; plus 10 more Apple Watch products with thin margins and no search demand; plus 24 Apple Watch rows removed because net profit was n/a and GSC clicks were zero.

### Other
- iPod Touch 6th Gen | iPod Touch 6th Gen Screen | £80.00 | £66.67 | £31.04 | £9.31 | £0.00 | £1.60 | £24.72 | 37.1% | No | 1 | 9.4 | healthy, no-shopify
- iPod Touch 6th Gen | iPod Touch 6th Gen Battery | £50.00 | £41.67 | £13.74 | £36.00 | £0.00 | £1.00 | £-9.07 | -21.8% | No | 0 | 6.6 | loss-maker, no-shopify
- TEST PRODUCT GROUP | TEST GLASS TOUCH PRODUCT | £50.00 | £41.67 | £20.00 | £36.00 | £0.00 | £1.00 | £-15.33 | -36.8% | No | 0 | n/a | loss-maker, no-shopify
- TEST PRODUCT GROUP | TEST BATTEY PRODUCT | £50.00 | £41.67 | £30.00 | £36.00 | £0.00 | £1.00 | £-25.33 | -60.8% | No | 0 | n/a | loss-maker, no-shopify
- iPod Touch 6th Gen | iPod Touch 6th Gen Software Re-Installation | £25.00 | £20.83 | £1.00 | £36.00 | £0.00 | £0.50 | £-16.67 | -80.0% | No | 0 | n/a | loss-maker, no-shopify
- iPod Touch 7th Gen | iPod Touch 7th Gen Software Re-Installation | £25.00 | £20.83 | £1.00 | £36.00 | £0.00 | £0.50 | £-16.67 | -80.0% | No | 0 | n/a | loss-maker, no-shopify
- TEST PRODUCT GROUP | TEST DISPLAY PRODUCT | £40.00 | £33.33 | £55.41 | £36.00 | £0.00 | £0.80 | £-58.88 | -176.6% | No | 0 | n/a | loss-maker, no-shopify
- TEST PRODUCT GROUP | Custom Product | £10.00 | £8.33 | £0.00 | £36.00 | £0.00 | £0.20 | £-27.87 | -334.4% | No | 0 | n/a | loss-maker, no-shopify
- Other Device | Screen Protector | n/a | n/a | £0.00 | £13.93 | £0.00 | n/a | n/a | n/a | No | 1 | 4.2 | thin, no-shopify
- Plus 8 more Other products with healthy margins and no search demand; plus 1 more Other products with thin margins and no search demand; plus 7 Other rows removed because net profit was n/a and GSC clicks were zero.

## Section 4: Missing From Shopify
Modern models kept below show `model (missing SKUs)`. Full example-product detail remains in `repair-profitability-v2.md`.

### iPhone
- iPhone 11 (5), iPhone 11 Pro (4), iPhone 11 Pro Max (4), iPhone 12 (4), iPhone 12 Mini (4), iPhone 12 Pro (4), iPhone 12 Pro Max (4), iPhone 13 (1), iPhone 13 Mini (1), iPhone 13 Pro (1), iPhone 13 Pro Max (1), iPhone 14 (2), iPhone 14 Plus (2), iPhone 14 Pro (1), iPhone 14 Pro Max (1), iPhone 15 (2), iPhone 15 Plus (2), iPhone 15 Pro (2), iPhone 15 Pro Max (2), iPhone 16 (2), iPhone 16 Plus (2), iPhone 16 Pro (2), iPhone 16 Pro Max (2).
- Plus 14 older device models.

### iPad
- iPad 10 (2), iPad Air 3 (3), iPad Air 4 (3), iPad Air 5 (3), iPad Air 6 (13) (1), iPad Air 7 (13) (1), iPad Mini 5 (3), iPad Mini 6 (3), iPad Pro 11 (1G) (3), iPad Pro 11 (2G) (3), iPad Pro 11 (3G) (2), iPad Pro 11 (4G) (3), iPad Pro 11 (5G) (1), iPad Pro 12.9 (3G) (4), iPad Pro 12.9 (4G) (3), iPad Pro 12.9 (5G) (3), iPad Pro 12.9 (6G) (3), iPad Pro 13 (7G) (1).
- Plus 15 older device models.

### MacBook
- MacBook 12 A1534 (6), MacBook Air 13 A1466 (1), MacBook Air 13 A1932 (1), MacBook Air 13 A2179 (1), MacBook Air 13 M1 A2337 (1), MacBook Air 13 M2 A2681 (1), MacBook Air 13 M3 A3113 (1), MacBook Air 15 M2 A2941 (1), MacBook Air 15 M3 A3114 (1), MacBook Pro 13  A1708 (1), MacBook Pro 13 2TB 3 A2159 (2), MacBook Pro 13 2TB 3 A2289 (2), MacBook Pro 13 4TB 3 A2251 (3), MacBook Pro 13 M1 A2338 (4), MacBook Pro 13 M2 A2338 (2), MacBook Pro 13 Touch Bar A1706 (2), MacBook Pro 13 Touch Bar A1989 (3), MacBook Pro 13"  A1708 (1), MacBook Pro 14 M1 Pro/Max A2442 (1), MacBook Pro 14 M2 Pro/Max A2779 (1), MacBook Pro 14 M3 A2992 (2), MacBook Pro 14 M3 Pro/Max A2992 (1), MacBook Pro 15 A1707 (1), MacBook Pro 15 A1990 (3), MacBook Pro 16 A2141 (2), MacBook Pro 16 M1 Pro/Max A2485 (1), MacBook Pro 16 M2 Pro/Max A2780 (2), MacBook Pro 16 M3 Pro/Max A2991 (3).
- Plus 3 older device models.

### Apple Watch
- Apple Watch S4 40mm (2), Apple Watch S4 44mm (2), Apple Watch S5 40mm (2), Apple Watch S5 44mm (2), Apple Watch S6 40mm (3), Apple Watch S6 44mm (2), Apple Watch S7 41MM (3), Apple Watch S7 45MM (3), Apple Watch S8 41MM (3), Apple Watch S8 45MM (3), Apple Watch S9 41MM (3), Apple Watch S9 45MM (3), Apple Watch SE 40mm (2), Apple Watch SE 44mm (2), Apple Watch SE2 40MM (3), Apple Watch SE2 44MM (3), Apple Watch Ultra (3).
- Plus 6 older device models.

### Other
- Plus 6 older device models.

## Section 5: Pricing Action List

### Raise Price

| Device | Product | Price | Net Profit | Net Margin | GSC Clicks | GSC Position | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| n/a | None | n/a | n/a | n/a | 0 | n/a | n/a |

### Lower Price

| Device | Product | Price | Net Profit | Net Margin | GSC Clicks | GSC Position | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone 14 Pro | iPhone 14 Pro Battery | £79.00 | £35.51 | 53.9% | 9 | 5.5 | healthy, overpriced |

### Review

| Device | Product | Price | Net Profit | Net Margin | GSC Clicks | GSC Position | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone 15 Pro Max | iPhone 15 Pro Max Screen | £359.00 | £89.34 | 29.9% | 11 | 2.5 | thin |

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
| iPhone 15 Pro Max | iPhone 15 Pro Max Screen | 11 | 834 | 2.5 | +8 | 29.9% | iphone 15 pro max screen replacement |

### Rank Well But Margin Is Bad

| Device | Product | Clicks | Impr. | Position | Click trend | Margin | Matched queries |
| --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone 15 Pro Max | iPhone 15 Pro Max Screen | 11 | 834 | 2.5 | +8 | 29.9% | iphone 15 pro max screen replacement |

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

## Section 7: Top Search Demand Products
Columns: Product | Device | Clicks | Impressions | Avg Position | Net Margin % | Net Profit | Shopify | Action
1. Apple Watch S7 45MM Display Screen | Apple Watch S7 45MM | 255 | 31,332 | 12.1 | 91.6% | £151.96 | Yes | grow
2. Apple Watch Ultra Battery | Apple Watch Ultra | 137 | 21,206 | 5.3 | 77.0% | £178.92 | Yes | grow
3. MacBook Pro 14 M3 A2918 Screen | MacBook Pro 14 M3 A2992 | 74 | 8,779 | 11.3 | 91.2% | £493.49 | Yes | grow
4. iPhone 14 Pro Max Screen | iPhone 14 Pro Max | 68 | 7,930 | 5.6 | 34.8% | £86.63 | Yes | grow
5. Apple Watch S7 45MM Glass Screen | Apple Watch S7 45MM | 62 | 2,985 | 14.4 | 91.6% | £151.96 | Yes | grow
6. iPhone 14 Pro Max Battery | iPhone 14 Pro Max | 59 | 6,803 | 5.4 | 84.6% | £62.72 | Yes | grow
7. iPhone 16 Plus Screen | iPhone 16 Plus | 56 | 6,087 | 4.5 | 78.3% | £195.19 | Yes | grow
8. MacBook Air 13 A1466 Screen | MacBook Air 13 A1466 | 55 | 4,815 | 9.4 | 78.3% | £195.19 | Yes | grow
9. MacBook Pro 13 Touch Bar A1706 Flexgate | MacBook Pro 13 Touch Bar A1706 | 55 | 2,493 | 8.5 | 92.8% | £269.91 | Yes | grow
10. iPhone 15 Pro Screen | iPhone 15 Pro | 53 | 5,196 | 5.1 | 37.2% | £105.06 | Yes | grow
11. iPhone 16 Pro Max Screen | iPhone 16 Pro Max | 49 | 5,089 | 5.6 | 5.7% | £18.07 | Yes | fix-price
12. iPhone 13 Battery | iPhone 13 | 45 | 6,941 | 3.8 | 71.7% | £47.18 | Yes | grow
13. iPhone 15 Pro Max Screen | iPhone 15 Pro Max | 42 | 4,674 | 6.1 | 29.9% | £89.34 | Yes | investigate
14. iPhone 12 Pro Max Screen | iPhone 12 Pro Max | 38 | 6,275 | 5.1 | 56.2% | £107.30 | Yes | grow
15. MacBook Pro 16 M4 Pro/Max A3186/A3403 Screen | MacBook Pro 16 M3 Pro/Max A2991 | 34 | 1,364 | 7.6 | 90.4% | £601.85 | Yes | grow
16. iPhone 13 Screen | iPhone 13 | 33 | 5,024 | 5.0 | 61.7% | £122.87 | Yes | grow
17. iPad Air 7 (13) Screen | iPad Air 7 (13) | 32 | 2,009 | 10.9 | 81.7% | £271.67 | No | list-it
18. iPhone 13 Pro Max Screen | iPhone 13 Pro Max | 32 | 3,120 | 6.0 | 55.2% | £137.57 | Yes | grow
19. MacBook Air 13 'M1' A2337 Screen | MacBook Air 13 M1 A2337 | 29 | 1,533 | 13.6 | 50.8% | £143.57 | Yes | grow
20. iPhone 15 Screen | iPhone 15 | 29 | 5,393 | 5.5 | 45.8% | £110.27 | Yes | grow
21. Apple Watch SE 44mm Display Screen | Apple Watch SE 44mm | 26 | 2,396 | 19.3 | 76.9% | £127.53 | Yes | grow
22. Apple Watch Ultra  Display Screen | Apple Watch Ultra | 26 | 1,214 | 24.6 | 83.2% | £276.52 | Yes | grow
23. iPhone 15 Pro Battery | iPhone 15 Pro | 26 | 3,424 | 5.3 | 71.7% | £59.18 | Yes | grow
24. MacBook Pro 13  A1502 Battery | MacBook Pro 13 A1502 | 24 | 3,959 | 5.9 | 87.8% | £145.53 | No | list-it
25. iPhone 14 Pro Max Rear Housing (Rear Glass And Frame) | iPhone 14 Pro Max | 21 | 2,534 | 4.5 | -105.3% | £-183.41 | Yes | fix-price
26. iPhone 13 Pro Screen | iPhone 13 Pro | 20 | 1,740 | 6.0 | 56.1% | £134.99 | Yes | grow
27. iPad Pro 12.9 (6G) Glass Screen | iPad Pro 12.9 (6G) | 19 | 3,779 | 12.5 | 86.8% | £288.52 | No | list-it
28. iPhone 13 Pro Max Rear Housing (Rear Glass And Frame) | iPhone 13 Pro Max | 19 | 2,148 | 5.4 | -137.2% | £-227.59 | Yes | fix-price
29. iPhone 14 Screen | iPhone 14 | 19 | 4,287 | 7.2 | 37.8% | £75.31 | Yes | grow
30. iPhone 15 Pro Max Rear Glass | iPhone 15 Pro Max | 19 | 2,586 | 5.6 | 16.2% | £37.59 | Yes | investigate
31. MacBook Air 13 M2 A2681 Screen | MacBook Air 13 M2 A2681 | 18 | 1,150 | 14.3 | 58.0% | £192.77 | Yes | grow
32. iPhone 13 Pro Max Battery | iPhone 13 Pro Max | 18 | 2,269 | 6.6 | 62.2% | £40.95 | Yes | grow
33. iPhone 15 Pro Max Battery | iPhone 15 Pro Max | 18 | 1,959 | 4.9 | 44.3% | £36.52 | Yes | grow
34. iPhone 13 Pro Max Front Camera | iPhone 13 Pro Max | 17 | 867 | 9.8 | 87.6% | £218.19 | Yes | grow
35. iPhone 16 | iPhone 16 | 17 | 2,534 | 5.4 | n/a | n/a | No | investigate
36. MacBook Air 13 M4 A3240 Screen | MacBook Air 13 M4 A3240 | 16 | 294 | 3.4 | 64.5% | £257.51 | Yes | grow
37. iPad Pro 13 (7G) Screen | iPad Pro 13 (7G) | 16 | 330 | 5.7 | 9.6% | £63.85 | No | fix-price
38. iPhone 11 Pro Battery | iPhone 11 Pro | 16 | 3,389 | 4.8 | 85.1% | £63.10 | Yes | grow
39. iPhone 12 Battery | iPhone 12 | 16 | 2,493 | 5.1 | 74.1% | £54.97 | Yes | grow
40. iPhone 11 Pro Screen | iPhone 11 Pro | 15 | 2,971 | 10.7 | 35.0% | £55.11 | Yes | grow
41. iPhone 15 Pro Front Camera | iPhone 15 Pro | 15 | 1,047 | 7.9 | 88.8% | £243.59 | Yes | grow
42. MacBook Pro 16 M1 Pro/Max A2485 Screen | MacBook Pro 16 M1 Pro/Max A2485 | 14 | 535 | 7.0 | 44.0% | £219.82 | Yes | grow
43. iPad Pro 12.9 (4G) Charging Port | iPad Pro 12.9 (4G) | 14 | 2,217 | 4.5 | 82.9% | £102.99 | Yes | grow
44. iPhone 14 Pro Max Rear Camera Lens | iPhone 14 Pro Max | 14 | 1,864 | 4.1 | 85.7% | £70.67 | Yes | grow
45. iPhone 13 | iPhone 13 | 13 | 1,261 | 7.1 | n/a | n/a | No | investigate
46. iPhone 15 | iPhone 15 | 13 | 1,174 | 5.9 | n/a | n/a | No | investigate
47. MacBook Pro 16 M4 Pro/Max A3186/A3403 Battery | MacBook Pro 16 M3 Pro/Max A2991 | 10 | 537 | 5.7 | 84.8% | £317.19 | Yes | grow
48. iPad Mini 6 Glass Screen | iPad Mini 6 | 10 | 1,625 | 16.8 | 81.5% | £182.79 | No | list-it
49. iPhone 12 Pro NO SERVICE (LOGIC BOARD REPAIR) | iPhone 12 Pro | 9 | 3,320 | 11.9 | 87.6% | £146.07 | No | list-it
50. MacBook Pro 13  A1502 Screen | MacBook Pro 13 A1502 | 8 | 1,304 | 9.4 | 83.2% | £276.52 | No | list-it
