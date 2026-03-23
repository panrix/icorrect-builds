# icloud-checker: Audit & Decomposition Brief

**Date:** 2026-03-23
**Author:** Code (QA agent)
**Purpose:** Fresh-eyes brief for Codex. This service needs to be broken apart. Here's exactly what's in it, what's wrong, and how it should be restructured.

---

## What is this?

A single Express.js server (`index.js`, 1914 lines) running on the VPS at port 8010. It was originally built to check iCloud lock status via SickW API when a device serial number is entered on Monday.com. Over time, 5 additional services were bolted on because the Express server was already running and accepting webhooks.

It now powers **6 unrelated functions** across **5 SOPs**. One crash, one OOM, one bad deploy takes all of them down simultaneously. It was not in version control until today.

---

## Network exposure (CONFIRMED 2026-03-23)

Port 8010 is bound to `0.0.0.0` (all interfaces), meaning the Express server is **directly accessible from the public internet** at `46.225.53.159:8010`. No nginx, no SSL, no rate limiting, no access control.

Nginx only proxies `/webhook/icloud-check*` → port 8010. All `/webhook/bm/*` endpoints bypass nginx entirely. Monday webhooks are hitting the raw IP directly.

| Route | Reachable via | SSL |
|---|---|---|
| `/webhook/icloud-check` | nginx + direct IP | Yes (via nginx) / No (direct) |
| `/webhook/icloud-check/slack-interact` | nginx (→8003 redirect) | Yes (via nginx) |
| `/webhook/icloud-check/recheck` | direct IP only | **No** |
| `/webhook/icloud-check/spec-check` | direct IP only | **No** |
| `/webhook/icloud-check/health` | direct IP only | **No** |
| `/webhook/bm/payout` | direct IP only | **No** |
| `/webhook/bm/shipping-confirmed` | direct IP only | **No** |
| `/webhook/bm/grade-check` | direct IP only | **No** |
| `/webhook/bm/counter-offer-action` | direct IP only | **No** |
| `/webhook/bm/to-list` | direct IP only (DISABLED, returns 410) | **No** |

**Security implications:**
- All `/webhook/bm/*` endpoints accept unauthenticated POST requests from any source
- No webhook signature verification (Monday supports HMAC signing, but it's not checked)
- The payout endpoint (`/webhook/bm/payout`) triggers real BM API calls that validate buyback orders — a crafted POST could trigger an actual payout
- The shipping endpoint sends tracking updates to BackMarket — a crafted POST could mark an order as shipped
- The Express server has no request body size limit set, making it vulnerable to large payload attacks

**This should be locked down immediately** — either bind to 127.0.0.1 and route through nginx, or add Monday webhook signature verification, or both.

---

## What's inside: 10 endpoints, 6 services

### Service 1: iCloud Lock Checking (SOP 02 — Intake)
**Endpoints:**
- `POST /webhook/icloud-check` (lines 629–739) — Main webhook. Monday triggers this when serial number is entered. Checks SickW API, updates Monday status to IC ON/IC OFF, looks up Apple specs via Playwright browser automation, compares specs against BM claimed specs, triggers counter-offer flow on mismatch.
- `POST /webhook/icloud-check/slack-interact` (lines 743–952) — Handles ALL Slack button clicks and modal submissions. iCloud recheck buttons, customer reply modals, AND counter-offer approve/adjust/pay-original buttons all route through here.
- `POST /webhook/icloud-check/recheck` (lines 1077–1080) — Manual recheck trigger. Runs the recheck cron on demand.
- `GET /webhook/icloud-check/spec-check` (lines 1083–1108) — Standalone Apple spec lookup. Any script can call this to get specs for a serial number.

**Supporting code:** ~530 lines of helper functions (lines 86–628): Monday API wrapper, SickW API, BackMarket messaging API, Slack API, iCloud locked handler, recheck cron (polls BM messages for customer replies, auto-rechecks on keyword match), spec comparison logic, colour normalisation.

**Dependencies:** SickW API key, Playwright (for Apple Self Service Repair scraping), Monday API, Slack Bot tokens (2 separate tokens), BackMarket buyback API.

**External files:**
- `apple-specs.js` (211 lines) — Playwright browser automation to scrape Apple Self Service Repair site for device specs. Uses proxy (`gw.dataimpulse.com`), caches results to `specs-cache.json`.
- `lib/bm-listings-cache.js` (165 lines) — Loads and searches local BM listings JSON file. Used by listing automation AND spec matching.
- `lib/colour-map.js` (30 lines) — Apple colour names to BM SKU slugs.
- `lib/grade-map.js` (32 lines) — Monday grades to BM API grade codes.

### Service 2: Counter-Offer Module (SOP 02/03 — Intake/Diagnostic)
**Endpoint:** `POST /webhook/bm/counter-offer-action` (lines 956–1070) — Dedicated Slack action handler for counter-offer buttons.

**BUT:** Counter-offer button handling is ALSO embedded in `/webhook/icloud-check/slack-interact` (lines 769–838). Same logic, duplicated. The `slack-interact` endpoint handles counter-offer actions inline AND this dedicated endpoint exists for the same purpose.

**Supporting code:** Inline spec mismatch handler (lines 483–625) + external `lib/counter-offer.js` (205 lines) with: spec ranking (chip/RAM/storage), mismatch assessment (better/worse/equivalent), BM order details lookup, counter-offer execution via BM API, rate limiting (15% rolling 30-day cap), decision logging to JSON file.

**External files:**
- `lib/counter-offer.js` (205 lines) — Core logic.
- Logs to `/home/ricky/builds/icloud-checker/data/counter-offer-log.json`

### Service 3: Shipping Confirmation (SOP 09)
**Endpoint:** `POST /webhook/bm/shipping-confirmed` (lines 1114–1260) — Triggered when Monday status4 changes to index 160 (Shipped). Gets tracking number from Monday, finds linked BM device, gets BM sales order ID, POSTs to BM sales API with tracking + new_state:3.

**Note:** There is ALSO a standalone `shipping.js` script in `backmarket/scripts/` that has been QA'd. The relationship between these two is unclear. The standalone script was QA'd against SOP 09; this endpoint may or may not be the one actually wired to the Monday webhook.

### Service 4: Payout Processing (SOP 03b)
**Endpoint:** `POST /webhook/bm/payout` (lines 1266–1367) — Triggered when Monday status24 changes to index 12 (Pay-Out). Calls BM buyback validate API (`PUT /orders/{id}/validate`), updates Monday status to Purchased. Retries once on 5xx.

**Note:** There is ALSO a standalone `trade-in-payout.js` script. Same question — which one is actually wired?

### Service 5: Grade Check / Intake Profitability (SOP 03 — Diagnostic)
**Endpoint:** `POST /webhook/bm/grade-check` (lines 1444–1601) — Triggered when Top Case grade or Lid grade changes on Monday. Predicts final grade (worst of two), looks up estimated sell price, calculates profitability, alerts Slack if below threshold (30% margin AND £100 net).

**Standalone?** No standalone equivalent exists for this. This is the only implementation of Build 10.

### Service 6: Listing Automation (SOP 06) — DISABLED
**Endpoint:** `POST /webhook/bm/to-list` (lines 1618–1898) — **Currently disabled** (returns 410 Gone). Was triggered when Monday status24 changes to index 8 (To List). Had full Path A (qty bump) and Path B (reactivation with profitability check) logic.

**Replaced by:** Standalone `list-device.js` which has been QA'd against SOP 06. The icloud-checker version has none of the QA fixes (parts cost column fix, grade mapping corrections, decision gates).

**The disabled code is still in the file** as dead code (282 lines, assigned to `_disabled_to_list`). Should be deleted entirely.

---

## Shared infrastructure in the monolith

These are used by multiple services within the file:

| Function | Used by |
|---|---|
| `mondayQuery()` | All 6 services |
| `updateMondayStatus()` | iCloud, counter-offer, payout, listing |
| `postMondayComment()` | iCloud, counter-offer, grade-check, shipping |
| `slackPost()` / `sendSlackAlert()` | All 6 services |
| `slackPostAutomations()` | iCloud (recheck alerts), counter-offer |
| `moveItemToGroup()` | iCloud only |
| `getBmClaimedSpecs()` | iCloud, counter-offer |
| BM API headers constant | Shipping, payout, listing, counter-offer |

This shared code is the reason everything got crammed together — each new service needed Monday + Slack + BM API access, and it was easier to add an endpoint than create a shared library.

---

## What's actually wrong

### 0. SECURITY: Endpoints exposed to public internet with no auth
Port 8010 is open to the world. No webhook signature verification. The payout and shipping endpoints can be triggered by anyone who knows the IP. This is the highest priority fix — even above decomposition. See "Network exposure" section above.

### 1. Single point of failure
One process = one crash kills 5 SOPs. The Playwright browser automation in `apple-specs.js` is the highest risk — it launches headless Chrome with a proxy for every serial lookup. If the proxy hangs or Chrome leaks memory, everything goes down.

### 2. Duplicate logic with standalone scripts
| icloud-checker endpoint | Standalone script | Status |
|---|---|---|
| `/webhook/bm/to-list` | `list-device.js` | **Disabled in icloud-checker.** list-device.js is QA'd and correct. |
| `/webhook/bm/shipping-confirmed` | `shipping.js` | **Both exist.** Need to confirm which is wired to Monday webhook. |
| `/webhook/bm/payout` | `trade-in-payout.js` | **Both exist.** Need to confirm which is wired to Monday webhook. |

### 3. Counter-offer button handling is duplicated
The `/webhook/icloud-check/slack-interact` endpoint (lines 769–838) handles `counter_offer_approve`, `counter_offer_pay_original`, and `counter_offer_adjust` actions. But there's also a dedicated `/webhook/bm/counter-offer-action` endpoint (lines 956–1070) that handles the exact same action IDs with the exact same logic. Slack routes actions to one URL — only one of these can be the actual handler. The other is dead code.

### 4. Hardcoded paths to VPS filesystem
```
/home/ricky/builds/agent-rebuild/data/bm-listings-clean.json
/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json
/home/ricky/builds/icloud-checker/data/counter-offer-log.json
```
These couple the service to the exact VPS directory structure.

### 5. Two Slack bot tokens
The service uses `SLACK_BOT_TOKEN` for some messages and `SLACK_AUTOMATIONS_TOKEN` for others (customer reply alerts, counter-offer messages, modals). This suggests the Slack app setup has grown organically too.

### 6. No error boundaries
An unhandled promise rejection in the grade-check handler could crash the process, taking down iCloud checking, shipping, and payout.

### 7. Recheck cron runs inside the web server
`recheckCron()` (lines 434–481) runs on a 30-minute interval inside the Express process. It iterates all items in the iCloud locked group, calls BM messages API for each, and auto-rechecks when keywords are detected. This long-running poll loop shares the event loop with webhook handlers.

---

## Recommended decomposition

### Phase 1: Confirm what's actually wired (DO FIRST)

Before touching any code, answer these questions:
1. **What Monday webhooks point to `http://[vps]:8010`?** List every webhook URL configured on Monday boards 349212843 and 3892194968. This tells us which endpoints are live.
2. **Are `shipping.js` and `trade-in-payout.js` running as separate services?** Or are they dormant scripts that were QA'd but never deployed, with the icloud-checker endpoints being the live ones?
3. **Which Slack interactivity URL is configured?** Is it `/webhook/icloud-check/slack-interact` or `/webhook/bm/counter-offer-action` or both?

### Phase 2: Extract shared libraries

Create a shared `lib/` directory (or npm package) with:
- `monday.js` — `mondayQuery()`, `updateMondayStatus()`, `postMondayComment()`, `moveItemToGroup()`, `getBmClaimedSpecs()`
- `slack.js` — `slackPost()`, `sendSlackAlert()`, `slackPostAutomations()`
- `bm-api.js` — BM API headers, base URLs, `getBmOrderStatus()`, `suspendBmOrder()`, `getBmMessages()`, `sendBmMessage()`
- `colour-map.js`, `grade-map.js`, `profitability.js`, `counter-offer.js` — already extracted, keep as-is
- `bm-listings-cache.js` — already extracted, keep as-is

### Phase 3: Split into separate services

Each service should be its own script/process with its own port (or use a simple router that delegates to handlers in separate files).

| Service | Port | Endpoints | SOP | Notes |
|---|---|---|---|---|
| **icloud-checker** | 8010 | `/webhook/icloud-check`, `/slack-interact`, `/recheck`, `/spec-check`, `/health` | SOP 02 | Core service. Keep the name. Remove everything else. |
| **counter-offer** | 8011 | `/webhook/bm/counter-offer-action` | SOP 02/03 | Extract from icloud-checker. Remove duplicate handling from slack-interact. |
| **shipping-confirmed** | — | Webhook handler | SOP 09 | Confirm if `shipping.js` standalone is already deployed. If so, delete from icloud-checker. If not, deploy `shipping.js` and rewire Monday webhook. |
| **payout** | — | Webhook handler | SOP 03b | Same question as shipping. Confirm which is live, consolidate to standalone `trade-in-payout.js`. |
| **grade-check** | 8012 | `/webhook/bm/grade-check` | SOP 03 | No standalone equivalent exists. Extract to its own script. |
| **listing** | — | — | SOP 06 | Already disabled. Delete dead code. `list-device.js` is the canonical implementation. |

### Phase 4: Recheck cron extraction

The iCloud recheck cron should be a separate scheduled job (cron or systemd timer), not an interval inside the web server. It polls BM messages API — this is a background worker, not a request handler.

### Phase 5: Delete dead code

- Remove the `_disabled_to_list` handler (lines 1624–1898) — 275 lines of dead code
- Remove whichever counter-offer handler is not actually wired to Slack
- Remove shipping/payout endpoints if standalone scripts are confirmed as live

---

## File inventory

| File | Lines | Purpose | Keep/Extract/Delete |
|---|---|---|---|
| `index.js` | 1914 | Everything | **Decompose** per above |
| `apple-specs.js` | 211 | Playwright Apple spec scraper | **Keep** with icloud-checker service |
| `lib/bm-listings-cache.js` | 165 | BM listings JSON search | **Move** to shared lib (used by listing + spec matching) |
| `lib/colour-map.js` | 30 | Colour mapping | **Move** to shared lib |
| `lib/grade-map.js` | 32 | Grade mapping | **Move** to shared lib |
| `lib/counter-offer.js` | 205 | Counter-offer logic | **Keep** with counter-offer service |
| `lib/profitability.js` | 81 | Profitability calc | **Move** to shared lib (used by listing + grade-check) |
| `package.json` | 12 | Dependencies | Express + Playwright only |

---

## Environment variables required

The service uses these env vars (all must be present for full functionality):

| Variable | Used by |
|---|---|
| `SICKW_API_KEY` | iCloud checking |
| `MONDAY_APP_TOKEN` | All services (Monday API) |
| `SLACK_BOT_TOKEN` | Slack messaging |
| `SLACK_AUTOMATIONS_BOT_TOKEN` | Slack automations (modals, rich messages) |
| `SLACK_WEBHOOK_URL` | Fallback Slack messaging |
| `BM_AUTH` | BackMarket API (buyback + sales + listings) |
| `PORT` | Express server (default 8010) |

---

## Summary for Codex

This is a 1914-line monolith running 6 unrelated services in one Express process. It grew by scope creep — each new webhook was "just one more endpoint." The result is:

- **No fault isolation** — Chrome OOM in Apple spec lookup kills payout processing
- **Duplicate code** — Counter-offer buttons handled in two places, listing/shipping/payout duplicated as standalone scripts
- **275 lines of dead code** — Disabled listing handler still in the file
- **No version control until today** — Critical service powering 5 SOPs with no rollback capability
- **Hardcoded VPS paths** — Coupled to exact filesystem layout

The standalone scripts (`list-device.js`, `shipping.js`, `trade-in-payout.js`) have been QA'd and are correct. The icloud-checker versions of the same logic have NOT been QA'd and may have bugs the standalones fixed.

**Priority order:**
0. **IMMEDIATELY: Lock down port 8010** — bind to 127.0.0.1, route all traffic through nginx with SSL, or add Monday webhook HMAC verification. The payout and shipping endpoints are triggerable by anyone on the internet right now.
1. Confirm which endpoints are actually live (Monday webhook URLs + Slack interactivity URL)
2. Wire standalone scripts where they exist, disable icloud-checker duplicates
3. Extract grade-check to standalone (no standalone exists yet)
4. Extract recheck cron to standalone scheduled job
5. Strip icloud-checker back to just iCloud checking + spec lookup
6. Create shared lib for Monday/Slack/BM API helpers
