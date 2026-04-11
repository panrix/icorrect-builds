# Back Market

## Access

- `Observed`: reachable via BM API headers and `GET /ws/orders?state=1`
- Required credential set:
  - `BACKMARKET_API_AUTH`
  - `BACKMARKET_API_BASE`
  - `BACKMARKET_API_LANG`
  - `BACKMARKET_API_UA`

Important documented rule:
- all three BM headers are required on every request or routing/context can change

## Business Role

- `Observed`: Back Market is approximately `60%` of total revenue and the dominant revenue/sourcing channel.
- `Observed`: BM operations cover both buyback/trade-in and resale/listing flows.

## Local Operational Footprint

Source-of-truth docs:
- `/home/ricky/builds/backmarket/README.md`
- `/home/ricky/builds/backmarket/sops/`
- `/home/ricky/builds/agent-rebuild/backmarket/BM-PROCESS-CURRENT-STATE.md`

Documented live VPS services:
- `icloud-checker` on port `8010` route `/webhook/icloud-check`
- `bm-grade-check` on port `8011` route `/webhook/bm/grade-check`
- `bm-payout` on port `8012` route `/webhook/bm/payout`
- `bm-shipping` on port `8013` route `/webhook/bm/shipping-confirmed`

Runtime confirmation:
- `systemctl --user status bm-payout.service` shows the service is active and listening on `127.0.0.1:8012`

Documented Monday board dependencies:
- Main Board `349212843`
- BM Devices Board `3892194968`

## Documented SOP Coverage

SOPs mapped to scripts/services include:
- sent trade-in orders
- intake receiving
- diagnostic
- payout
- repair/refurb
- listing
- listings reconciliation
- buy box management
- sale detection
- shipping
- payment reconciliation
- tuesday cutoff
- returns/aftercare

Observed from docs:
- some BM steps remain manual or partially built
- several older n8n BM flows are inactive
- BM operations appear to depend on Monday, Slack/Telegram notifications, VPS services, and inventory/profitability logic

## Documented BM Ingress

Source:
- `/home/ricky/builds/backmarket/sops/01-trade-in-purchase.md`
- `/home/ricky/builds/backmarket/scripts/sent-orders.js`

Observed from SOP/script:
- `sent-orders.js` polls `GET /ws/buyback/v1/orders?status=SENT`
- de-dup key is Main Board column `text_mky01vb4` (BM order public ID)
- for each new SENT order, the script prepares:
  - one Main Board item on `349212843` group `new_group34198` (`Incoming Future`)
  - one BM Devices Board item on `3892194968` group `group_mkq3wkeq` (`BM Trade-Ins`)
- it links the two items via BM Devices column `board_relation`
- it sends Telegram notifications on success/failure paths
- the SOP documents a current cron schedule of `06:00 UTC`

Live runtime confirmation:
- user crontab contains:
  - `0 6 * * * cd /home/ricky/builds/backmarket && /usr/bin/node scripts/sent-orders.js --live`
- cron log `/home/ricky/logs/cron/sent-orders.log` shows a live run on `2026-03-31 06:00 UTC`
- that run created four linked Monday records and skipped three already-existing orders

Important documented tension:
- `BM-PROCESS-CURRENT-STATE.md` describes Stage 1 as poll-for-SENT -> Slack notification only.
- SOP 01, the rebuilt script, the live crontab, and the cron log show a stronger live ingestion path that writes directly into both Monday boards.

Inference:
- the current-state voice-note summary is stale or incomplete on BM ingress; the Monday-writing `sent-orders.js` path is live.

## Documented BM Listing Path

Source:
- `/home/ricky/builds/backmarket/sops/06-listing.md`
- `/home/ricky/builds/backmarket/scripts/list-device.js`

Observed from SOP/script:
- listing starts from Main Board `349212843` group `new_group88387__1` (`BMs Awaiting Sale`) when `status24` becomes `To List` index `8`
- live listing is intentionally single-item only: `list-device.js --live` requires `--item`, and batch live mode is disabled
- no crontab entry was found for `list-device.js` as of `2026-04-01`, so listing publication is currently operator-invoked rather than scheduler-driven
- the script reads:
  - Main Board final grade `status_2_Mjj4GJNQ`
  - Main Board colour `status8`
  - Main Board parts/labour cost mirrors and formulas
  - BM Devices linked specs via `board_relation`, including RAM, SSD, CPU, GPU, purchase price, stored listing ID, and stored product UUID
- it constructs a BM SKU, then resolves a product through:
  - canonical resolver truth in `data/listings-registry.json`
  - fallback catalog in `data/bm-catalog.json`
- the rebuilt resolver path is now stricter than the earlier catalog-first model:
  - `data/listings-registry.json` is treated as canonical resolver truth
  - resolver slots are normalized through `scripts/lib/resolver-truth.js`
  - only live-safe trust classes are allowed to auto-resolve without manual intervention
  - raw catalog matches are advisory unless they satisfy the stricter resolver-truth gate
- for new listings, the script creates a draft listing via `POST /ws/listings`, verifies the returned listing against expected grade/spec/colour/product UUID, then queries backbox pricing via `GET /ws/backbox/v1/competitors/{uuid}`
- probe mode is now explicitly a promotion gate, not a loose helper:
  - `--probe-product-id <uuid>` runs a strict five-check verification
  - output includes `verdict` and `promotable_resolver_truth`
  - failed probes exit non-zero and should not be treated as live-safe resolver evidence
- on successful publish, the script updates:
  - BM Devices `text_mkyd4bx3` with listing ID
  - BM Devices `text_mm1dt53s` with product UUID
  - BM Devices `text89` with constructed SKU
  - BM Devices `numeric_mm1mgcgn` with total fixed cost
  - Main Board `status24` to `Listed` index `7`
- Telegram is used for proposal/error confirmation, and Monday is only updated after publish verification passes

Observed implication:
- BM listing is partly automated but still operator-gated at the final live publish step.
- Resolver truth and profitability data are now first-class hard gates for live listing safety, with the raw catalog demoted to a fallback evidence source rather than a trusted resolver source by default.

## Weekly Pricing And Buy-Box Runtime

Source:
- `/home/ricky/builds/backmarket/sops/07-buy-box-management.md`
- `/home/ricky/builds/buyback-monitor/run-weekly.sh`
- `/home/ricky/builds/backmarket/qa/QA-SOP-SCRIPT-AUDIT-2026-04-01.md`

Observed from current docs/runtime:
- `scripts/buy-box-check.js` is documented as the rebuilt sell-side buy-box SOP path, but it does not currently have a live cron entry
- the live weekly Monday `05:00 UTC` sell-side pricing path is still `/home/ricky/builds/buyback-monitor/run-weekly.sh`
- that script runs:
  - `node sell_price_scraper_v7.js --all`
  - `python3 buy_box_monitor.py --no-resume --auto-bump`
  - `python3 sync_to_sheet.py`
- current BM QA docs explicitly confirm:
  - `buy-box-check.js` has no active live cron
  - the older Python `buy_box_monitor.py` path is still the scheduled runtime owner for weekly buy-box/pricing automation

Observed implication:
- BM sell-side price and buy-box ownership is split between a newer documented JS SOP path and an older live Python scheduled path.
- operators reading only SOP 07 could believe the JS flow is live when weekly scheduled pricing still depends on the Python monitor pipeline.

## Trade-In Payout Runtime

Source:
- `/home/ricky/builds/backmarket/sops/03b-trade-in-payout.md`
- `/home/ricky/builds/backmarket/services/bm-payout/index.js`
- `/home/ricky/builds/backmarket/docs/INGRESS-MAP.md`
- `/home/ricky/builds/backmarket/audit/bm-payout-root-cause-2026-03-27.md`
- current user crontab

Observed from docs/runtime:
- the canonical live payout executor is the standalone `bm-payout` webhook service on port `8012`
- `bm-payout.service` is active under user systemd and listening on `127.0.0.1:8012`
- the handler is gated on Monday Main Board `status24 = Pay-Out` and performs stale-webhook and iCloud checks before calling BM validate
- the historical rogue cron path documented in the March 27 incident evidence is not present in the current user crontab
- the old rogue script path `~/.openclaw/agents/backmarket/workspace/scripts/buyback_payout_watch.py` is not present in the current workspace

Observed implication:
- the current runtime payout owner is now the `bm-payout` webhook service, not the old OpenClaw cron watcher
- the remaining payout risk is documentation drift, because some staged/current-state notes still describe `buyback_payout_watch.py` as an active fallback or live cron even though current runtime evidence does not support that

## Documented BM Sale Detection Path

Source:
- `/home/ricky/builds/backmarket/sops/08-sale-detection.md`
- `/home/ricky/builds/backmarket/scripts/sale-detection.js`
- live crontab and `/home/ricky/logs/cron/sale-detection.log`

Observed from SOP/script:
- `sale-detection.js` polls `GET /ws/orders?state=1&page={n}&page_size=50`
- it matches each `orderlines[].listing_id` to BM Devices column `text_mkyd4bx3`
- stock verification blocks processing if:
  - BM Devices `text4` (`Sold to`) is already populated
  - BM Devices `text_mkye7p1c` already contains an order ID
  - the BM Devices item is in a returns/rejected group
- acceptance uses `POST /ws/orders/{order_id}` with `new_state: 2` and SKU from `orderlines[].listing`, not the stored Monday SKU
- successful acceptance updates:
  - BM Devices `text4` with buyer name
  - BM Devices `text_mkye7p1c` with BM sales order ID
  - BM Devices `numeric5` with sale price
  - Main Board `status24` to `Sold` index `10`
  - Main Board `date_mkq34t04` with the sale date
  - Main Board item name to `BM XXXX (Buyer Name)` while preserving the BM prefix
- Telegram receives a sale confirmation summary

Live runtime confirmation:
- user crontab contains hourly weekday and three-times-daily weekend `sale-detection.js` runs
- `/home/ricky/logs/cron/sale-detection.log` shows a live accepted order on `2026-03-31`, including:
  - listing `5606597`
  - BM order `78974208`
  - BM Device `11419137216`
  - Main Board item `11419132603`
  - successful BM acceptance, Monday status/date update, rename, and Telegram notification
- later `14:00`, `15:00`, `16:00`, and `17:00 UTC` runs on `2026-03-31` completed with `0` pending orders

Observed implication:
- BM resale order acceptance is live production automation, not just a documented future state.
- the sale path treats the BM order payload as the source of truth when Monday SKU text diverges.

## Reconciliation And Dispatch Adjacency

Observed from local code/runtime:
- `reconcile-listings.js` exists and cross-checks Monday `Listed` items against BM listing inventory, flags spec mismatches/offline listings/orphans/missing cost, and posts summary output to BM Telegram
- no active scheduler was found for `reconcile-listings.js` in user crontab, systemd timers, or pm2 as of `2026-04-01`
- current runtime ownership therefore appears operator-driven/on-demand rather than hidden scheduled automation
- `/home/ricky/logs/cron/dispatch.log` shows Royal Mail dispatch automation is live, buys labels, extracts tracking, uploads PDFs to Slack, and explicitly states `BM NOT notified — confirm shipping in Monday when physically posted`
- current shipping SOP/code now adds an important duplicate-label guard:
  - if Main Board `text53` already contains tracking, dispatch skips the order instead of buying another label even if BM still shows `state=3`
- current SOP also calls out a manual Northern Ireland customs edge where the standard label flow is not sufficient
- `royal-mail-automation/dispatch.js` still contains an `updateBmTracking()` helper, but the current main flow does not call it
- staged BM process notes under `backmarket/docs/staged/2026-04-01/BM-PROCESS-AUDIT.md` still describe a label-to-shipped bug, which conflicts with the current dispatch code path and live dispatch log

Inference:
- the resale chain is split across at least three runtime modes:
  - operator-invoked listing publication
  - scheduled sale detection
  - scheduled dispatch
- weekly sell-side price/buy-box changes are still controlled by the older scheduled Python monitor path rather than the rebuilt JS SOP 07 script
- BM shipment confirmation still depends on the later Monday `status4 -> Shipped` webhook path rather than dispatch automation directly notifying BM

## Returns And Aftercare

Source:
- `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md`
- `/home/ricky/builds/icloud-checker/src/index.js`
- `/home/ricky/builds/icloud-checker/lib/counter-offer.js`
- active n8n workflow `Warranty Claim Form`

Observed from SOP/code:
- buyer return requests are still initiated manually from BM dashboard/email/state-change awareness rather than from a dedicated live return-detection service
- when a returned device physically arrives, SOP 12 moves the BM Devices item into `BM Returns` group `new_group_mkmybfgr`
- returned devices require human re-assessment before they can re-enter listing, repair, or BER paths
- BM `/ws/sav` aftercare API is explicitly documented as under construction/non-functional, so post-sale service handling remains manual in BM dashboard messaging
- counter-offer support on the trade-in side is partly automated:
  - spec mismatch can be detected from `icloud-checker` after Apple spec lookup
  - Slack approval buttons are posted
  - approval/adjust actions can execute `PUT /ws/buyback/v2/orders/{orderPublicId}/counter-offers`
  - rolling counter-offer rate is enforced at `15%`
- active n8n workflow `Warranty Claim Form` provides a non-BM aftercare intake path:
  - webhook path `warranty-claim`
  - allowed origins `https://icorrect.co.uk,https://www.icorrect.co.uk`
  - parses customer/device/problem fields
  - emails `support@icorrect.co.uk` from `michael.f@icorrect.co.uk`
  - then searches or creates the Intercom contact and swaps the real customer onto the created conversation

Observed implication:
- BM resale aftercare is not one single system flow.
- There are two distinct post-sale tracks today:
  - BM-side buyer returns/aftercare, still largely manual
  - website warranty claims, actively routed into Intercom through n8n

## Strategic Signals From Current Docs

- NFU and NFC grades appear materially more profitable than FC in current profitability analysis
- current-state BM docs still flag operational gaps in morning visibility, payout timing, listing automation, dispatch separation, and returns handling
- BM board data is tightly linked to the main Monday board and parts data rather than standing alone

## Open Threads

- pull sample BM objects safely from orders/listings endpoints and map returned fields
- cross-reference BM order and listing flows into Monday item creation, trade-in status, payout, and shipping updates
- inspect local BM scripts/services to map exact API endpoints, trigger conditions, and side effects without invoking risky write routes
- determine whether the Slack-only Stage 1 note refers to an additional morning briefing layer rather than the core SENT-order ingestion path
- decide whether the canonical scheduled sell-side runtime should remain the Python `buy_box_monitor.py` pipeline or be moved onto `scripts/buy-box-check.js`
- decide whether `reconcile-listings.js` should stay explicitly operator-driven or be promoted into a live scheduled control
- align staged/current-state BM payout docs with the now-confirmed runtime so they stop implying `buyback_payout_watch.py` is still an active fallback
- map returns/aftercare against the now-confirmed resale runtime rather than the older planned-state notes
