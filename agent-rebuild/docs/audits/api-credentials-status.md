# API Credentials Status

Generated: 2026-04-06 14:32:47Z
Source env: `/home/ricky/config/api-keys/.env`

| Service | Status | Key format | Test call | Result | Errors / notes |
|---|---|---|---|---|---|
| Monday.com | working | `MONDAY_APP_TOKEN` is a JWT-like app token (`eyJ...`, 3 dot-separated segments) | Exact brief call: `GET https://api.monday.com/v2` with auth header. Fallback auth probe: `POST /v2` GraphQL `users(limit:1)` and `boards(limit:1)` | Exact `GET /v2` returned `404 page not found`. Fallback GraphQL probes returned `200` and read user `Ricky Panesar` plus board data, so the token itself is valid. | `me` and `account` fields returned `UNAUTHORIZED_FIELD_OR_TYPE` for this app token, so account info was not available from that query shape. |
| Intercom | working | `INTERCOM_API_TOKEN` is an opaque bearer token with a base64-style shape (`dG9r...`) | `GET https://api.intercom.io/contacts?per_page=1` | `200 OK`; contacts list returned successfully. | Read-only probe succeeded. |
| Shopify | working | `SHOPIFY_ACCESS_TOKEN` is a Shopify admin token (`shpat_...`) | `GET https://i-correct-final.myshopify.com/admin/api/2024-01/shop.json` | `200 OK`; returned shop `iCorrect` on domain `icorrect.co.uk` with plan `professional`. | Read-only probe succeeded. |
| Back Market | working | `BACKMARKET_API_AUTH` is an HTTP Basic auth header value (`Basic ...`) | Exact brief call: `GET https://www.backmarket.co.uk/ws/` with auth header. Fallback auth probe: `GET /ws/buyback/v1/orders?pageSize=1&page=1` | Exact `GET /ws/` returned `404` HTML. Fallback buyback endpoint returned `200 OK` JSON with paginated order data (`count: 2013`), so the credential itself is valid. | Root `/ws/` is not a usable health endpoint on the current API shape. |
| Xero | working | OAuth 2.0 client credentials (`XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`) plus opaque refresh token (`XERO_REFRESH_TOKEN`) | `POST https://identity.xero.com/connect/token` with `grant_type=refresh_token` | `200 OK`; Xero issued a fresh access token and refresh token. OAuth is still valid. | Xero refresh rotates the refresh token. To avoid leaving the integration stale, the local `XERO_REFRESH_TOKEN` in `/home/ricky/config/api-keys/.env` was updated immediately after the successful test. |
| Google Search Console | working | OAuth 2.0 client credentials plus Google refresh token (`GOOGLE_REFRESH_TOKEN`, format `1//...`) | Refresh token exchange at `https://oauth2.googleapis.com/token`, then `GET https://www.googleapis.com/webmasters/v3/sites` | Token refresh returned `200 OK`; Search Console sites listing returned `200 OK`; configured site `https://www.icorrect.co.uk/` was present with permission `siteFullUser`. | Returned scopes included `webmasters.readonly`. |
| Stripe | working | `STRIPE_API_KEY` is a live secret key (`sk_live_...`) | `GET https://api.stripe.com/v1/balance` | `200 OK`; returned Stripe balance object with `livemode: true`. | Read-only probe succeeded. |

