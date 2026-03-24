# Back Market API — Endpoint Migration (URGENT)

**Deadline: March 2026 (NEXT WEEK)**

## What's Changing

Old endpoint `/ws/listings_bi` is being deprecated.

**New endpoint:** `/ws/backbox/v1/competitors/{listingId}` (GetCompetitors)

## Why Switch

- 2 requests/second (vs 2 per hour on old endpoint)
- Listing-level competitor data per BackBox
- Price-to-win signals: your minimum/target price, competitor prices, current BackBox price

## What To Do

1. Update any scripts/workflows using `/ws/listings_bi` to use `/ws/backbox/v1/competitors/{listingId}`
2. Use GET endpoint alongside Listings API POSTs ("Update specific listing" / "Create or update products and listings")
3. API docs: https://api.backmarket.dev/#/#cookbooks

## Notes

- No scripts in our current codebase found using the old endpoint
- Old endpoint may have been called from n8n workflows (check Docker) or manual sessions
- The new endpoint is significantly better for pricing automation — 2/sec vs 2/hour is a game changer

**Contact:** partner-support@backmarket.com
