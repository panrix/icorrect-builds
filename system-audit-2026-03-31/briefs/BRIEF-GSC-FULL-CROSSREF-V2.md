# Brief: Full GSC × Product Profitability Crossref v2

## Objective

Pull ALL repair-intent queries from Google Search Console for the last 90 days and cross-reference every one against the product profitability model in `repair-profitability-v2.md`.

## CRITICAL: Use the correct GSC credentials

- Use the **Edge** Google account, NOT the Jarvis account
- Credentials from `/home/ricky/config/api-keys/.env`:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `EDGE_GOOGLE_REFRESH_TOKEN` (this is the refresh token to use)
- GSC property: `sc-domain:icorrect.co.uk` (the non-www domain property)
- Do NOT fall back to `https://www.icorrect.co.uk/` - if sc-domain doesn't work, report the error

The previous attempt used the wrong token (JARVIS_GOOGLE_REFRESH_TOKEN) and got insufficient permissions on the domain property, falling back to www which returned almost no data (53 clicks total). The Edge account has proper access.

## Step 1: Full GSC Pull

1. Use GSC API (`searchanalytics/query`) against `sc-domain:icorrect.co.uk`
2. Pull ALL queries for the last 90 days with dimensions: `query`, `page`
3. Filter to repair-intent queries (keywords: repair, screen, battery, replacement, broken, glass, display, charging, keyboard, camera, diagnostic, fix, cracked, water damage, backlight, flexgate, dustgate, port, speaker, microphone, housing, lens, button, crown, logic board, no power, no service, wifi, activate, refurb, macbook, iphone, ipad, apple watch, ipod)
4. Also pull page-level data with dimensions: `page` only (for landing page totals)
5. No row limit: get everything. Use startRow pagination to get all rows (GSC returns max 25000 per request).
6. Also pull a separate query-only dimension request (no page) to get accurate per-query totals

## Step 2: Parse Profitability Data

1. Read `repair-profitability-v2.md` Section 3 (Ranked Product Profitability table)
2. Parse every product row: Device, Product, Price, Net Profit, Net Margin %, Shopify Listed, Flag
3. Also read Section 4 (Missing From Shopify) for the gap list

## Step 3: Match Queries to Products

For each GSC query:
1. Extract device model and repair type from the query string
2. Match to the closest Monday product(s) using fuzzy matching on device + repair type
3. Where a query matches a landing page URL, use the page URL to help resolve the product match
4. For aggregate/generic queries ("iphone battery replacement"), roll up to product category level AND try to match specific models where the landing page gives a hint

Matching rules:
- "iphone 14 battery replacement" → iPhone 14 Battery
- "macbook screen repair" → all MacBook screen products (aggregate)
- "apple watch screen repair" → all Apple Watch screen products (aggregate)
- Generic queries like "iphone repair london" → flag as brand/generic, don't force a product match
- Include "london", "near me", "uk", "cost", "price" variants

## Step 4: Output

Write to `/home/ricky/builds/system-audit-2026-03-31/gsc-profitability-crossref-v2.md`:

### Section 1: Data Summary
- Total queries pulled, total clicks, total impressions
- How many queries matched to products vs unmatched
- Compare against v1 (which only had 53 clicks)

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

## Constraints

- Read-only. No mutations to any external system.
- Use the full 90-day window for trends. Split into current 30d vs prior 30d for trend comparison.

When completely finished, run this command to notify:
openclaw system event --text "Done: GSC crossref v2 with Edge account complete - written to gsc-profitability-crossref-v2.md" --mode now
