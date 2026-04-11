# Google Sheet Redesign: Comprehensive BM Price Intelligence

**Date:** 2026-03-19
**Sheet:** BM Sell Prices - iCorrect (`1LyC3UpuVzT_OEbA1yPNqFPMzP73q5H5DGBtfrUWQyJc`)

## Current State

- 14 tabs, one date column (Mar 15), scraper dead since then
- Sparse coverage, no buy box data, disconnected from buyback monitor
- sync_to_sheet.py reads old scraper format (incompatible with V6)

## Redesign

### Tab Structure

One tab per model line (same as V6 scraper models). 16+ tabs:

| Tab | Models |
|-----|--------|
| Air 13" 2020 M1 | A2337 |
| Air 13" 2022 M2 | A2681 |
| Air 13" 2024 M3 | A3113 |
| Air 13" 2025 M4 | A3240 |
| Air 15" 2023 M2 | A2941 |
| Air 15" 2024 M3 | A3114 |
| Air 15" 2025 M4 | A3241 |
| Pro 13" 2020 M1 | A2338 |
| Pro 13" 2022 M2 | A2779 |
| Pro 14" 2021 M1 Pro | A2442 |
| Pro 14" 2021 M1 Max | A2442 |
| Pro 14" 2023 M2 Pro | A2779 |
| Pro 14" 2023 M3 | A2918 |
| Pro 14" 2023 M3 Pro/Max | A2992 |
| Pro 14" 2024 M4/Pro/Max | A2918/A3186 |
| Pro 16" 2021 M1 Pro | A2485 |
| Pro 16" 2021 M1 Max | A2485 |
| Pro 16" 2023 M2 Pro/Max | A2780 |
| Pro 16" 2023 M3 Pro/Max | A2991 |
| Pro 16" 2024 M4 Pro/Max | A2780/A2991 |
| **Dashboard** | Summary across all models |

### Row Structure (per model tab)

Each row = one spec+grade combo. Frozen columns A-H, dates grow rightward from I.

| Col | Header | Source |
|-----|--------|--------|
| A | RAM | V6 scraper picker |
| B | SSD | V6 scraper picker |
| C | CPU/GPU | V6 scraper picker |
| D | Grade | V6 scraper picker (Fair/Good/Excellent/Premium) |
| E | Product ID | V6 scraper picker |
| F | Our Buyback Bid | Buy box monitor (our current bid price) |
| G | Buy Box Status | Buy box monitor (WIN/LOSE/NO BID) |
| H | Price to Win | Buy box monitor (competitor price to beat) |
| I+ | Date columns | Sell prices from V6 scraper, growing rightward |

### Dashboard Tab

Top-level summary refreshed daily:

| Col | Data |
|-----|------|
| Model | e.g. "Air 13" 2022 M2" |
| Active Listings | count of our listings with qty > 0 |
| Total Bids | count of our buyback bids |
| Win Rate | % of bids winning buy box |
| Avg Margin | average profit margin across active listings |
| Fair Price | current Fair grade sell price |
| Good Price | current Good grade sell price |
| Excellent Price | current Excellent grade sell price |
| Trend (7d) | price direction indicator |

### Data Sources

1. **V6 Scraper** (`sell-prices-latest.json`): sell prices by grade, RAM, SSD, CPU/GPU per model. Adds date columns.
2. **Buy Box Monitor** (`buy-box-{date}.json`): our bid prices, win/lose status, price_to_win per listing. Updates cols F-H.
3. **BM Listings API**: our active listing prices and quantities.

### Sync Logic

1. Run V6 scraper (2 min)
2. Read sell-prices-latest.json
3. Read latest buy-box-{date}.json
4. For each model tab:
   - Match V6 picker data to rows by spec+grade
   - Add today's sell price as new date column
   - Update buy box columns (F-H) from monitor data
5. Update Dashboard tab with aggregated stats

### What Gets Scraped

Expand V6 scraper to cover ALL M1+ models, not just the 16 we have listings for. Add the missing models from BM sitemap. Target: ~27 model lines covering every Air and Pro from M1 onwards.

The scraper already extracts from each page:
- Grade prices (Fair, Good, Excellent, Premium)
- RAM variants with prices
- SSD variants with prices  
- CPU/GPU variants with prices
- Colour variants with prices
- Size variants with prices

All of this goes into the sheet.
