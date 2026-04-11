# Brief: Full GSC × Product Profitability Crossref

## Objective

Pull ALL repair-intent queries from Google Search Console for the last 90 days and cross-reference every one against the product profitability model in `repair-profitability-v2.md`.

## Step 1: Full GSC Pull

1. Source credentials from `/home/ricky/config/api-keys/.env` (Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JARVIS_GOOGLE_REFRESH_TOKEN`)
2. Use GSC API (`searchanalytics/query`) against `sc-domain:icorrect.co.uk`
3. Pull ALL queries for the last 90 days with dimensions: `query`, `page`
4. Filter to repair-intent queries (keywords: repair, screen, battery, replacement, broken, glass, display, charging, keyboard, camera, diagnostic, fix, cracked, water damage, backlight, flexgate, dustgate, port, speaker, microphone, housing, lens, button, crown, logic board, no power, no service, wifi, activate, refurb)
5. Also pull page-level data with dimensions: `page` only (for landing page totals)
6. No row limit: get everything. Use pagination if needed (startRow).

## Step 2: Parse Profitability Data

1. Read `repair-profitability-v2.md` Section 3 (Ranked Product Profitability table)
2. Parse every product row: Device, Product, Price, Net Profit, Net Margin %, Shopify Listed, Flag
3. Also read Section 4 (Missing From Shopify) for the gap list

## Step 3: Match Queries to Products

For each GSC query:
1. Extract device model and repair type from the query string
2. Match to the closest Monday product(s) using fuzzy matching on device + repair type
3. Where a query matches a landing page URL, use the page URL to help resolve the product match

Matching rules:
- "iphone 14 battery replacement" → iPhone 14 Battery
- "macbook screen repair" → all MacBook screen products (aggregate)
- "apple watch screen repair" → all Apple Watch screen products (aggregate)
- Generic queries like "iphone repair london" → flag as brand/generic, don't force a product match

## Step 4: Output

Write to `/home/ricky/builds/system-audit-2026-03-31/gsc-profitability-crossref.md`:

### Section 1: Data Summary
- Total queries pulled, total clicks, total impressions
- How many queries matched to products vs unmatched

### Section 2: Product-Level Demand × Profitability
Sorted by clicks descending:
| Product | Net Margin % | Net Profit | Shopify Listed | Total Clicks | Total Impressions | Avg Position | Click Trend (current 30d vs prior 30d) | Top Queries | Action Flag |

Action flags:
- `grow`: healthy margin (>30%) + good traffic + Shopify listed → invest in SEO/content
- `fix-price`: loss-maker or thin margin (<15%) + good traffic → raise price or review costs
- `list-it`: healthy margin + no Shopify listing + has demand → create listing ASAP
- `hidden-gem`: healthy margin + low traffic but good position → needs content/SEO push
- `drop`: loss-maker + no demand → consider removing
- `investigate`: thin margin + rising demand → pricing review needed

### Section 3: Unmatched High-Traffic Queries
Queries with 5+ clicks that didn't match a product. These represent potential new product/service gaps.

### Section 4: Missing Shopify Listings With Demand
Products not on Shopify that ARE getting GSC traffic (or closely related queries are). Priority listing candidates.

### Section 5: Top Landing Pages Performance
Page-level clicks/impressions/CTR with the products they map to and aggregate margin.

### Section 6: Recommended Actions (sorted by revenue impact)
1. Products to list on Shopify immediately (margin + demand signal)
2. Products to reprice (margin too thin for the demand they get)
3. Products to push with content/SEO (great margin, ranking potential)
4. Products to consider dropping (loss-making, no demand)

## Credentials

Source from `/home/ricky/config/api-keys/.env`:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `JARVIS_GOOGLE_REFRESH_TOKEN`

## Constraints

- Read-only. No mutations to any external system.
- Use the full 90-day window for trends. Split into current 30d vs prior 30d for trend comparison.

When completely finished, run this command to notify:
openclaw system event --text "Done: Full GSC crossref with profitability model complete - written to gsc-profitability-crossref.md" --mode now
