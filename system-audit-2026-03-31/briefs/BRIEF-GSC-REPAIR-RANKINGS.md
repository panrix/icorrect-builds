# Research Brief: GSC Rankings × Repair Profit Potential

## Objective
Pull Google Search Console data for icorrect.co.uk, identify which repair-related search queries are climbing in rankings, and cross-reference with the repair profitability data to identify where rising search demand meets high-margin products. This tells us what stock to prepare for.

## What to produce
Write output to: `/home/ricky/builds/system-audit-2026-03-31/gsc-repair-profit-rankings.md`

## Required Analysis

### 1. GSC Data Pull
- Use the Google Search Console API for site: sc-domain:icorrect.co.uk (or https://www.icorrect.co.uk/ if domain property fails)
- Pull last 90 days of search query data
- Get: query, clicks, impressions, CTR, average position
- Focus on repair-related queries (filter for: repair, fix, screen, battery, replacement, broken, etc.)
- Also pull by page to see which landing pages are performing

### 2. Ranking Movement Analysis
- Compare the most recent 30 days vs the prior 30 days (or use 28-day periods for clean comparison)
- Identify queries where average position has improved (lower number = better)
- Identify queries where impressions are growing (demand signal)
- Identify queries where clicks are growing
- Flag queries that are on page 2 (positions 11-20) as "striking distance" opportunities

### 3. Cross-Reference with Repair Products
- Map GSC queries to device + repair type combinations
- Match these to Products & Pricing board products where possible (by device model and repair type)
- Use the profitability data from the repair-profitability-model.md if it exists, otherwise pull the Products & Pricing board (2477699024) directly for price data
- For each rising query, show: the query, current position, position change, clicks, the matching repair product, its price, and its margin if available

### 4. Stock Readiness Signal
- Cross-reference rising queries with parts stock levels from Parts board (985177480)
- Flag high-demand-rising queries where:
  - Stock is low or zero
  - No part is linked to the product
  - The product margin is healthy (worth pursuing)

### 5. Output Format
- Top 20 repair queries by click volume
- Top 20 fastest-climbing repair queries (position improvement)
- Top 20 "striking distance" queries (page 2, positions 11-20)
- For each: query, clicks, impressions, CTR, position, position change, matched product, price, margin, stock status
- Summary: "prepare stock for these repairs" recommendations based on rising demand + healthy margins

## Credentials
Source `/home/ricky/config/api-keys/.env` for:
- EDGE_GOOGLE_REFRESH_TOKEN (for Google API OAuth)
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- MONDAY_APP_TOKEN

### OAuth token exchange for GSC
```bash
source /home/ricky/config/api-keys/.env
ACCESS_TOKEN=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -d "client_id=$GOOGLE_CLIENT_ID" \
  -d "client_secret=$GOOGLE_CLIENT_SECRET" \
  -d "refresh_token=$EDGE_GOOGLE_REFRESH_TOKEN" \
  -d "grant_type=refresh_token" | jq -r '.access_token')
```

### GSC API
```
POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query
Authorization: Bearer <token>

Try siteUrl as: sc-domain:icorrect.co.uk
If that fails try: https://www.icorrect.co.uk/
```

### Monday GraphQL
https://api.monday.com/v2 with Authorization header

## Context files
- `/home/ricky/builds/system-audit-2026-03-31/repair-profitability-model.md` (may not exist yet)
- `/home/ricky/builds/system-audit-2026-03-31/ga4-posthog-funnel-analysis.md` (for website traffic context)
- `/home/ricky/builds/system-audit-2026-03-31/marketing-analysis.md`

## Rules
- Read only on all APIs
- Rate limit Monday: max 1 request per second
- Write findings progressively to the output file

When completely finished, run this command to notify:
openclaw system event --text "Done: GSC repair profit rankings analysis complete. Output in gsc-repair-profit-rankings.md" --mode now
