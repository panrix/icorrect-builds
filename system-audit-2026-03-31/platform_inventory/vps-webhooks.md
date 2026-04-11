# VPS Webhook Services

## Overview

This inventory covers the live webhook services hosted behind `mc.icorrect.co.uk` that are tied to operational business workflows.

## Confirmed Live BM / Intake Service Map

Source: `backmarket/docs/INGRESS-MAP.md`

| Port | Bind | Service | Route | Purpose |
|---|---|---|---|---|
| 8010 | `127.0.0.1` | `icloud-checker` | `/webhook/icloud-check` | iCloud/spec/intake logic |
| 8010 | `127.0.0.1` | `icloud-checker` | `/webhook/bm/counter-offer-action` | counter-offer actions |
| 8010 | `127.0.0.1` | `icloud-checker` | `/webhook/icloud-check/recheck` | manual or batch recheck |
| 8010 | `127.0.0.1` | `icloud-checker` | `/webhook/icloud-check/spec-check` | read-only Apple spec lookup |
| 8010 | `127.0.0.1` | `icloud-checker` | `/webhook/icloud-check/health` | health check |
| 8003 | `127.0.0.1` | `telephone-inbound` | `/webhook/icloud-check/slack-interact` | Slack interactivity router |
| 8011 | `127.0.0.1` | `bm-grade-check` | `/webhook/bm/grade-check` | BM profitability/grade check |
| 8012 | `127.0.0.1` | `bm-payout` | `/webhook/bm/payout` | BM payout |
| 8013 | `127.0.0.1` | `bm-shipping` | `/webhook/bm/shipping-confirmed` | BM ship confirmation |
| 8014 | `127.0.0.1` | `status-notifications` | `/webhook/monday/status-notification` | Monday status notification shadow/live target under migration |

## Confirmed Monday -> VPS Trigger Map

Source: `backmarket/docs/INGRESS-MAP.md`

| Board | Column | Trigger | Route |
|---|---|---|---|
| Main Board `349212843` | `text4` | serial entered | `/webhook/icloud-check` |
| Main Board `349212843` | `status4` | `Diagnostic Complete` | `/webhook/bm/grade-check` |
| Main Board `349212843` | `status24` | `Pay-Out` | `/webhook/bm/payout` |
| Main Board `349212843` | `status4` | `Shipped` | `/webhook/bm/shipping-confirmed` |

## bm-payout

Code: `/home/ricky/builds/backmarket/services/bm-payout/index.js`

Observed behavior:
- consumes Monday webhook for `status24`
- gated on `Pay-Out`
- re-reads Monday item state to skip stale events
- requires BM trade-in ID and iCloud clear status
- calls BM buyback `validate`
- writes Monday status `Purchased`
- posts Monday comment and Slack/Telegram notification
- retries once on 5xx, not on 4xx

## bm-grade-check

Code: `/home/ricky/builds/backmarket/services/bm-grade-check/index.js`

Observed behavior:
- consumes Monday webhook for `status4`
- only acts when the change resolves to `Diagnostic Complete`
- reads:
  - top-case pre-grade `status_2_mkmcj0tz`
  - lid pre-grade `status_2_mkmc4tew`
  - purchase cost `numeric`
  - parts cost `lookup_mkx1xzd7`
  - labour hours `formula__1`
  - labour cost `formula_mkx1bjqr`
  - linked BM device relation `board_relation5`
- loads sell-price data from `/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json`
- predicts profitability using:
  - labour rate `24`
  - shipping cost `15`
  - BM commission `10%`
  - profitability thresholds `>=30%` margin and `>=£100` net profit
- posts Slack warnings and Monday comments when predicted profitability is below threshold
- dedups repeated events for `10` minutes

## bm-shipping

Code: `/home/ricky/builds/backmarket/services/bm-shipping/index.js`

Observed behavior:
- consumes Monday webhook for `status4`
- gated on `Shipped`
- requires tracking number, serial number, linked BM Devices item, and BM order ID
- updates BM order state with tracking URL and serial
- posts Monday comment
- sends Slack/Telegram notification
- moves BM Devices item to `Shipped` group
- retries once on 5xx, not on 4xx

## icloud-checker

Code: `/home/ricky/builds/icloud-checker/src/index.js`

Observed behavior:
- main intake route still lives here
- uses SICKW and Apple spec lookup
- reads linked BM item through `board_relation5`
- includes Slack interactivity, recheck loop, counter-offer action endpoint
- includes disabled `/webhook/bm/to-list` route returning `410 Gone`
- on spec mismatch it can:
  - set Monday `status24` to `Counteroffer` index `3`
  - post Slack approval buttons
  - execute BM buyback counter-offers through helper logic
  - reset status back to `IC OFF` if the team decides to pay original

Inference:
- this is still a multi-purpose operational service even after BM split-out work

## telephone-inbound

Code: `/home/ricky/builds/telephone-inbound/server.py`

Observed behavior:
- owns Slack endpoints `/slack/commands`, `/slack/interact`, and public ingress `/webhook/icloud-check/slack-interact`
- powers Slack `/call` phone-enquiry intake
- posts phone enquiry summaries into Slack channel `C09TBEMJA2H`
- can create:
  - Intercom contact only
  - Intercom contact + Monday main-board item
  - log-only Slack record with deferred action buttons
- Monday items created here target board `349212843` and attempt to place the item in the `Today's Repairs` group
- non-phone Slack interactions hitting the same route are forwarded to `icloud-checker` on `127.0.0.1:8010`

## status-notifications

Docs:
- `/home/ricky/builds/webhook-migration/plan-status-notifications.md`
- `/home/ricky/builds/monday/icorrect-status-notification-documentation.md`

Observed state:
- legacy architecture is documented as Monday -> Cloudflare Worker -> n8n -> Intercom
- VPS shadow service now exists on port `8014`
- live Intercom sending from the VPS path is still gated pending parity and cutover

## Open Threads

- identify the exact Monday rules behind the 8 active webhook automations
- verify whether any current Monday webhooks still point to legacy external URLs instead of `mc.icorrect.co.uk`
- trace the rendered phone-enquiry follow-up buttons (`Send Quote`, `Book Appointment`, `Send Follow-up`, `Resolved`) to their downstream handlers
