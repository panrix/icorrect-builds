# Royal Mail

## Access

- `Observed`: local credentials exist, but the tested OAuth endpoint did not return a token.
- attempted token request to `https://api.royalmail.net/oauth/token` returned a `404 Not Found` body rather than an access token
- `Observed`: local operations and code still show Royal Mail as a real shipping runtime, but through browser automation rather than an active API integration
- `Observed`: current BM process docs explicitly say the Royal Mail tracking API is parked and not worth onboarding during the longer-term DHL transition

Evidence sources:
- `/home/ricky/data/exports/system-audit-2026-03-31/royal-mail/oauth.body.json`
- `/home/ricky/builds/royal-mail-automation/DISPATCH-TASK.md`
- `/home/ricky/builds/backmarket/sops/09-shipping.md`

## Observed Operational Role

- `Observed`: Royal Mail is central to outbound shipping for:
  - BM resale dispatch
  - mail-in packaging
  - repaired-device returns
- `Observed`: `dispatch.js` is the live label-buying owner for BM resale shipping.
- `Observed`: SOP 09 separates:
  - label buying via `dispatch.js`
  - final BM ship confirmation via `bm-shipping`

## Documented Runtime

- live dispatch schedule:
  - `07:00 UTC` weekdays
  - `12:00 UTC` weekdays
- dispatch behavior:
  - fetch BM orders awaiting shipment
  - buy Royal Mail labels
  - write tracking to Monday `text53`
  - set `status4` to `Return Booked`
  - download BM packaging slips
  - post dispatch summary and PDFs to Slack
- `Observed`: dispatch does **not** notify BM of shipment directly in the current live flow
- `Observed`: final BM shipping confirmation happens later when Monday `status4` becomes `Shipped` and the `bm-shipping` service posts tracking back to BM

## Service / Tier Rules

- local docs state:
  - under `£400` -> Tracked 24
  - `£400` and above -> Special Delivery
- tracking URLs are formed as:
  - `https://www.royalmail.com/track-your-item#/tracking-results/{tracking_number}`

## Observed Risks

- The API onboarding state is no longer just unclear; the best current evidence says it is intentionally parked while browser automation remains the live path.
- Northern Ireland / BT postcode customs handling is still partly manual per SOP 09.

## Open Threads

- decide whether the parked Royal Mail API credentials should be retired from the canonical env during the DHL transition
- identify the correct OAuth/API base only if Royal Mail API activation becomes a real priority again
