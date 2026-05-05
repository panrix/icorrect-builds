# BackMarket SOP and Script Audit - 2026-05-05

Audit time: 2026-05-05 04:25 UTC

Scope: active BackMarket SOPs, source-tracked scripts/services, iCloud checker notification changes, live VPS cron/systemd/health evidence, and the current unit/syntax test surface.

## Executive verdict

The main BackMarket control plane is now mostly VPS-owned and no active BackMarket path depends on n8n/Flow 6. The strongest paths are SENT intake, QC SKU handoff, listing dry-run/approval, live listing safety gates, SKU-first sale detection, shipping confirmation, payout gating, and shared notification routing.

The system is not yet fully "future-proof". The highest operational risk is the live VPS disk: `/` is at 100% and `build-sold-price-lookup.js` has already hit `ENOSPC`. The highest source/docs risk is SOP drift: the running automation is ahead of several SOP files, especially SOP 00, SOP 05, SOP 06.5, SOP 07, SOP 10, and SOP 11. The highest code-risk still visible is the Telegram listing approval edge case around stale/concurrent cards and manual override replies.

## Fresh verification run

Local source verification passed:

```bash
for f in test/unit/*.test.js; do node "$f"; done
node --check scripts/*.js scripts/lib/*.js services/bm-grade-check/index.js services/bm-payout/index.js services/bm-qc-listing/index.js services/bm-shipping/index.js /Users/ricky/vps/builds/icloud-checker/src/index.js /Users/ricky/vps/builds/icloud-checker/src/lib/telegram-topics.js
```

Unit tests passed:

- `backfill-main-device-relations.test.js`
- `bm-qc-listing-service.test.js`
- `current-queue-readonly.test.js`
- `frontend-url-map.test.js`
- `list-device-helpers.test.js`
- `notifications.test.js`
- `sale-detection-economics.test.js`
- `sent-orders-title-map.test.js`
- `sku.test.js`
- `trade-ins-daily-brief.test.js`
- `v7-scraper-reconcile.test.js`

Live VPS checks:

- Running services: `bm-grade-check`, `bm-payout`, `bm-qc-listing`, `bm-shipping`, `icloud-checker`
- Health OK:
  - `http://127.0.0.1:8011/health`
  - `http://127.0.0.1:8012/health`
  - `http://127.0.0.1:8013/health`
  - `http://127.0.0.1:8015/health`
  - `http://127.0.0.1:8010/webhook/icloud-check/health`
  - `https://mc.icorrect.co.uk/webhook/icloud-check/health`
- Note: `icloud-checker` does not expose `/health`; its health path is `/webhook/icloud-check/health`.

Live scheduler evidence:

- SOP 01: `sent-orders.js --live`, daily 06:00 UTC
- SOP 08: `sale-detection.js`, hourly weekdays 07:00-17:00 UTC, weekends 08:00/12:00/16:00 UTC
- SOP 07: `buy-box-check.js`, weekdays 06:30 UTC, check-only
- SOP 06.5: `reconcile-listings.js --dry-run`, Sundays 04:00 UTC
- Sold lookup: `build-sold-price-lookup.js --live`, daily 02:15 UTC
- Trade-ins brief: `trade-ins-daily-brief.js`, daily 08:01 UTC
- Board housekeeping: weekdays 07:30 UTC

## Critical findings

### 1. Urgent live ops: VPS root disk is full

Evidence:

```text
/dev/sda1 75G 72G 95M 100% /
[sold-lookup] ERROR: ENOSPC: no space left on device, write
```

Impact:

- JSON state writes can fail unpredictably.
- Cron logs can stop recording useful evidence.
- Sold-price lookup data may become stale or partially written.
- Services that rely on state files, cache files, or Monday failure markers can degrade in hard-to-debug ways.

Recommendation:

Clean or expand disk before further live automation work. Move large logs/reports/caches out of the repo path, rotate cron logs, and rerun `build-sold-price-lookup.js --live` after free space is restored.

### 2. SOP docs are behind the actual automation

The code is ahead of the docs in several places:

- SOP 05 still says manual/no automation, but `bm-qc-listing.service` now handles Ready To Collect SKU generation and To List approval cards.
- SOP 06.5 says no live cron, but weekly dry-run cron is live.
- SOP 07 says no live cron, but weekday check-only cron is live.
- SOP 10 still references `scripts/profitability-check.js` and `scripts/reconcile.js`; those active script paths do not exist in the repo.
- SOP 11 is still not implemented as a monitor, despite describing Monday/Tuesday cutoff alerts.
- SOP 02 should mention the new Telegram topics for iCloud/spec and iCloud-locked replies.
- SOP 00 master still has stale schedule/status rows for 06.5/07 and incomplete service inventory.

Recommendation:

Patch the active SOPs to match the running control plane. Treat SOP 00 as the first update because it is the map future agents will trust.

### 3. Payment reconciliation is not automated

SOP 10 is conceptually correct that payment reconciliation is manual/agent-owned, but its implementation table is wrong. There is no dedicated payment reconciliation engine and no active `profitability-check.js` or `reconcile.js` under `scripts/`.

Recommendation:

Build a real SOP 10 reconciler later, using code-derived economics from:

- BM Devices `numeric5` actual sale price
- BM Devices `numeric` purchase price
- BM Devices `numeric_mm1mgcgn` fixed cost
- BM order payout/payment fields
- bank/Xero statement source when available

Do not depend on `formula_mm0za8kh` or other Monday formula/mirror columns for automation.

### 4. Tuesday cutoff monitor is still missing

SOP 11 is a good operational idea, but there is no script or cron implementing it.

Recommendation:

Build a small read-only monitor:

- Pull BM accepted/not-shipped orders.
- Match to BM Devices by `text_mkye7p1c`.
- Check linked Main Board tracking/status.
- Post Telegram Shipping/Issues topic summary Monday afternoon and Tuesday morning.

## SOP-by-SOP alignment

| SOP | Status | Audit result |
|---|---|---|
| 00 Master | Partially stale | Needs update for 8015 service, live crons, notifications topics, SOP 05 status, SOP 10 script paths, SOP 11 state. |
| 01 Trade-in Purchase | Aligned | `sent-orders.js --live` cron exists. Title normalization and Telegram warnings cover the recent Main Board device lookup gap. |
| 02 Intake & Receiving | Mostly aligned | `icloud-checker` is live and topics now work. SOP should mention Telegram topic routing and reply dedupe behavior. |
| 03 Diagnostic | Mostly aligned | `bm-grade-check` is live. It still uses Slack for grade/profitability checks; that matches the SOP, but it is less unified than the newer BM notification paths. |
| 03b Payout | Aligned | `bm-payout` is live, health OK, writes failure markers, and uses shared notifications. |
| 04 Repair/Refurb | Manual/aligned | No dedicated service expected. Stale text says SOP 05 missing; update docs. |
| 05 QC & Final Grade | Code ahead of SOP | `bm-qc-listing` now performs QC SKU handoff from Ready To Collect. SOP still calls itself placeholder/manual. |
| 06 Listing | Strong alignment | `list-device.js` has strict stored-SKU, trusted resolver, exact scrape verification, profitability review, and Telegram notification gates. |
| 06.5 Reconciliation | Code/live ahead of SOP | `reconcile-listings.js --dry-run` is scheduled weekly and matched 4/4 active listings in recent logs. Two old BM Devices back-links remain missing: BM 969 and BM 1208. |
| 07 Buy Box | Code/live ahead of SOP | `buy-box-check.js` is scheduled check-only. Recent log shows 4 active listings, 3 losing, 2 grade inversions, 0 bumps. |
| 08 Sale Detection | Aligned after recent fix | `sale-detection.js` is SKU-first via BM Devices `text89`, accepts with order-line SKU, writes Main Board order/listing IDs, and sends Telegram. Older cron log still shows the pre-fix no-match for order 80281440. |
| 09 Shipping | Aligned | Label buying remains in Royal Mail automation cron. |
| 09.5 Shipment Confirmation | Aligned | `bm-shipping` is live, health OK, reads Main Board order/listing IDs instead of fragile relation fallback, and writes failure markers. |
| 10 Payment Reconciliation | Manual gap | SOP has correct warnings about formula columns but wrong active script paths and no implemented engine. |
| 11 Tuesday Cutoff | Not implemented | Useful monitoring SOP, but no script/cron exists. |
| 12 Returns/Aftercare | Manual/aligned | Return handling remains manual. Automation for return detection/reset is still future work. |

## Script/service audit notes

### Notifications

`scripts/lib/notifications.js` is the correct canonical module for BM Telegram and Slack. It now supports:

- `ICORRECT_TELEGRAM_BOT_TOKEN` before legacy `TELEGRAM_BOT_TOKEN`
- BackMarket group chat default
- Telegram topics: trade-ins, listings, sales, shipping, payouts, issues, iCloud/spec, iCloud locked
- Slack channel aliases
- Telegram/Slack API response validation
- health checks via `scripts/notifications-health.js --probe`

Live iCloud health confirms the new iCloud topics:

```json
{"icloudSpec":"5637","icloudLocked":"5638"}
```

The BM services on 8011/8012/8013/8015 are healthy but their health output did not show the two iCloud topics. Restarting those services after deployment will refresh their in-memory notifications module. This is low risk for their current paths because they do not send iCloud topic messages.

### Listing approval service

`services/bm-qc-listing/index.js` is the right control-plane replacement for the old QC To List cron. It:

- writes SKU through `scripts/qc-generate-sku.js --write`
- posts To List dry-run approval cards through the Listings topic
- runs `list-device.js --live` on approval
- supports override pricing

Known risk:

- The extracted `listing-bot.js` helpers still have legacy queue behavior where override replies are only partly topic/card isolated.
- The service itself filters callbacks by chat/topic/message ID and state, which is good, but the shared helper should be refactored so manual CLI and service behavior cannot drift.

Recommended patch:

- Create a shared `scripts/lib/listing-approval-card.js`.
- Add nonce/message ID to callback data.
- Filter override replies by chat ID, topic ID, and pending card.
- Keep `list-device.js --card-json` as the boundary rather than importing listing internals.

### Sale detection

The design is correct now:

- Match by canonical/order SKU first.
- Use listing ID only as a tie-break after SKU/spec match.
- Require saleable BM Devices rows with no buyer/order fields unless an explicit group override is safe.
- Accept BM order with the BM order-line SKU, not Monday's stored SKU.
- Write BM Devices `text4`, `text_mkye7p1c`, `numeric5`.
- Write Main Board `status24`, sold date, order ID, listing ID.
- Telegram fires on accepted sale and mismatch/manual cases.

Remaining improvement:

- Add unit tests around `updateBmDevices()`, `updateMainBoard()`, and sale write verification payloads.

### Listing and pricing

The current direction is correct:

- `numeric_mm1mgcgn` stores fixed cost only.
- Projected total cost/net/margin are code-derived at listing-review time.
- Actual economics are code-derived after real sale price lands in `numeric5`.
- `formula_mm0za8kh` and Monday formula/mirror columns are deprecated for automation.

The sold-price lookup cron failure is operational, not primarily algorithmic: the current blocker is disk space.

### iCloud checker

The recent duplicate reply fix is directionally correct:

- reply/recheck dedupe now uses message fingerprints and merged state
- iCloud/spec results route to topic 5637
- iCloud locked reply/recheck notifications route to topic 5638
- live health path confirms configured topics

Keep using `/webhook/icloud-check/health`, not `/health`.

## Prioritized next fixes

1. Free/expand VPS disk and rerun sold-price lookup.
2. Update SOP 00/02/03/04/05/06.5/07/10/11 to match the current running system.
3. Refactor listing approval card helpers and harden Telegram callback/override isolation.
4. Build SOP 11 cutoff monitor.
5. Build SOP 10 payment reconciliation instead of referencing non-existent support scripts.
6. Run trusted catalogue/ownership repair for exact one-owner listing slots, using live Monday/browser-capture data.
7. Automate SOP 12 returns detection/reset when the core sale/list/ship loop has been stable for a full cycle.

## Bottom line

The rebuilt BackMarket path is now mostly coherent and VPS-owned. The high-risk live paths are gated more safely than before: exact SKU, exact product/spec, scrape trust, sale write verification, and topic-based notifications are all in place. The remaining risk is not one single hidden code bug; it is operational drift. Fix the disk issue first, then make the SOPs match reality, then harden the listing approval callback path and build the two missing monitors: payment reconciliation and Tuesday cutoff.

## Follow-up applied same day

After VPS storage was restored, the live disk check showed `/` at 71% used with 21GB free. `node scripts/build-sold-price-lookup.js --live` was rerun successfully and rewrote `data/sold-prices-latest.json` at `2026-05-05T04:50:55Z` with 92 SKU groups and 35 model-grade groups.

The active SOP docs were then synced to the current control plane:

- SOP 00 now lists `bm-qc-listing` on port 8015, current crons, notification token preference, and SOP 11 as a monitoring gap.
- SOP 02 now documents Telegram topic routing for iCloud/spec and iCloud-locked replies.
- SOP 03 and SOP 04 no longer say SOP 05 is missing.
- SOP 05 now documents the hybrid manual QC + automated SKU/listing-card handoff.
- SOP 06 and SOP 00 now match the current economics model: weak/loss economics route to human review/override, while identity/spec/scrape failures remain hard blocks.
- SOP 06.5 and SOP 07 now document their live dry-run/check-only cron schedules.
- SOP 10 no longer references non-existent active `profitability-check.js` or `reconcile.js` scripts.

The listing approval path was also hardened so new Telegram card buttons include a nonce, callbacks must match the exact stored card, and override price replies are constrained to the Listings topic.
