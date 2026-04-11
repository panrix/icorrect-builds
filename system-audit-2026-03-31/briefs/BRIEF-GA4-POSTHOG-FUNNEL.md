# Research Brief: GA4 + PostHog Conversion Funnel Analysis

## Objective
Map the full website conversion funnel from visitor to booking/purchase using both GA4 and PostHog. The marketing analysis said demand is real but conversion leakage is the problem. We need the actual drop-off numbers.

## What to produce
Write output to: `/home/ricky/builds/system-audit-2026-03-31/ga4-posthog-funnel-analysis.md`

## Required analysis

### GA4 (Google Analytics 4)
1. Get OAuth access token using Edge Google refresh token (see credentials below)
2. Pull last 90 days of data from GA4 property 353983768
3. Get: sessions by source/medium, landing page performance, page path flow, conversion events
4. Key funnel stages to measure: landing -> product/service page -> Typeform/booking page -> Typeform submit -> Shopify checkout -> order complete
5. Measure bounce rate by landing page and device type
6. Identify where the biggest drop-offs happen

### PostHog
1. Use PostHog API (US endpoint: https://us.posthog.com)
2. Pull last 90 days of event data
3. Map the same funnel stages from PostHog events
4. Compare PostHog event counts with GA4 session/event counts
5. Identify any tracking gaps between the two platforms

### Cross-platform comparison
1. Where do GA4 and PostHog agree on funnel shape?
2. Where do they diverge? (tracking gaps, event mismatches)
3. What's the actual visitor -> customer conversion rate?
4. What's the biggest single drop-off point?

## Credentials
Source `/home/ricky/config/api-keys/.env` for:
- EDGE_GOOGLE_REFRESH_TOKEN (use this for GA4, NOT the Jarvis token)
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GA4_PROPERTY_ID=353983768
- POSTHOG_API_KEY (use endpoint https://us.posthog.com, NOT eu.posthog.com)
- POSTHOG_PROJECT_ID

## OAuth token exchange for GA4
```bash
curl -s -X POST https://oauth2.googleapis.com/token \
  -d "client_id=$GOOGLE_CLIENT_ID" \
  -d "client_secret=$GOOGLE_CLIENT_SECRET" \
  -d "refresh_token=$EDGE_GOOGLE_REFRESH_TOKEN" \
  -d "grant_type=refresh_token" | jq -r '.access_token'
```

Then use GA4 Data API v1:
```
POST https://analyticsdata.googleapis.com/v1beta/properties/353983768:runReport
Authorization: Bearer <token>
```

## Context files to read first
- `/home/ricky/builds/system-audit-2026-03-31/marketing-analysis.md`
- `/home/ricky/builds/system-audit-2026-03-31/marketing-blockers.md`
- `/home/ricky/builds/system-audit-2026-03-31/channel-attribution-model.md`

## Rules
- Read only. Do not modify any analytics configuration.
- If a specific event or property doesn't exist, document what IS available instead of guessing.
- Compare like-for-like date ranges across both platforms.
- Write findings progressively to the output file.

When completely finished, run this command to notify:
openclaw system event --text "Done: GA4 + PostHog funnel analysis complete. Output in ga4-posthog-funnel-analysis.md" --mode now
