# Back Market Control-Plane Inventory — 2026-05-02

Purpose: identify what is live, what is only local, what is committed, and what needs cleanup before further end-to-end automation work.

## Git roots
- /home/ricky/builds is a git worktree containing backmarket, icloud-checker, backmarket-browser, and buyback-monitor.
- /home/ricky/builds/royal-mail-automation is its own git repo.

## Main builds worktree
- Branch: codex/backmarket
- HEAD: 2cdd38d fix bm intake spec refs and sale sku matching
- Upstream: none

### Dirty files by operational area

#### backmarket
- Dirty entries: 74
   M backmarket/scripts/board-housekeeping.js
   M backmarket/scripts/buy-box-check.js
   M backmarket/scripts/lib/monday.js
   M backmarket/scripts/lib/v7-scraper.js
   M backmarket/scripts/list-device.js
   M backmarket/services/bm-grade-check/index.js
   M backmarket/services/bm-shipping/index.js
   M backmarket/test/unit/v7-scraper-reconcile.test.js
  ?? backmarket/.codex-tasks/2026-04-26-bm1541-previous-sale-price.md
  ?? backmarket/.codex-tasks/2026-04-26-clearance-list-bm1592-and-next-card.md
  ?? backmarket/.codex-tasks/2026-04-26-live-list-bm-1582.md
  ?? backmarket/.codex-tasks/2026-04-26-live-list-bm1524-and-next-card.md
  ?? backmarket/.codex-tasks/2026-04-26-missing-orders-triage.md
  ?? backmarket/.codex-tasks/2026-04-26-next-card-after-bm1549-hold.md
  ?? backmarket/.codex-tasks/2026-04-26-next-listing-card-after-1582.md
  ?? backmarket/.codex-tasks/2026-04-26-next-listing-card.md
  ?? backmarket/.codex-tasks/2026-04-26-nicola-serial-main-board-search.md
  ?? backmarket/.codex-tasks/2026-04-26-repairs-returns-sop.md
  ?? backmarket/OVERNIGHT-BACKMARKET-RECOVERY-2026-04-25.md
  ?? backmarket/data/sold-prices-latest.json
  ?? backmarket/docs/SOP-BM-REPAIRS-RETURNS-2026-04-26.md
  ?? backmarket/docs/historical/old-qa-2026-03/2026-04-23-icloud-checker-bm1605-relation-lookup-false-negative.md
  ?? backmarket/reports/bm-missing-orders-triage-2026-04-26.md
  ?? backmarket/reports/bm-trade-order-bm-devices-reconcile-2026-04-26-030005.json
  ?? backmarket/reports/bm-trade-order-bm-devices-reconcile-2026-04-26-030005.md
  ?? backmarket/reports/bm1541-previous-sale-price-2026-04-26.md
  ?? backmarket/reports/browser-ops-skeleton-2026-04-25.md
  ?? backmarket/reports/browser-session-strategy-2026-04-25.md
  ?? backmarket/reports/checkpoint-2-verification-2026-04-25.md
  ?? backmarket/reports/control-plane-inventory-2026-05-02.md
  ?? backmarket/reports/current-queue-pull-plan-2026-04-25.md
  ?? backmarket/reports/current-queue-qc-sku-map-2026-04-26-012655.json
  ?? backmarket/reports/current-queue-qc-sku-map-2026-04-26-013122.json
  ?? backmarket/reports/current-queue-qc-sku-map-2026-04-26-021252.json
  ?? backmarket/reports/current-queue-qc-sku-map-2026-04-26-023622.json
  ?? backmarket/reports/current-queue-qc-sku-map-2026-04-26-024008.json
  ?? backmarket/reports/current-queue-readonly-2026-04-26-000545.json
  ?? backmarket/reports/current-queue-readonly-2026-04-26-000638.json
  ?? backmarket/reports/current-queue-readonly-2026-05-02-035706.json
  ?? backmarket/reports/current-queue-readonly-scaffold-2026-04-25.md
  ?? backmarket/reports/current-queue-readonly-unit-test-2026-04-25.md
  ?? backmarket/reports/dispatch-match-regression-test-2026-04-25.md
  ?? backmarket/reports/harness-doctor-2026-04-25.md
  ?? backmarket/reports/imap-metadata-fetcher-2026-04-25.md
  ?? backmarket/reports/listing-cards-2026-05-02/
  ?? backmarket/reports/listing-dry-runs-2026-04-26/
  ?? backmarket/reports/listing-proposal-dry-runs-2026-04-26-0302.md
  ?? backmarket/reports/listing-sop-script-audit-first-pass-2026-04-26.md
  ?? backmarket/reports/live-list-bm-1582-2026-04-26.md
  ?? backmarket/reports/local-harness-preflight-2026-04-25.md
  ?? backmarket/reports/mailbox-code-preflight-2026-04-25.md
  ?? backmarket/reports/mailbox-fetcher-scaffold-2026-04-25.md
  ?? backmarket/reports/mailbox-imap-contract-2026-04-25.md
  ?? backmarket/reports/nicola-aaron-main-board-serial-search-2026-04-26.md
  ?? backmarket/reports/overnight-dispatch-match-fix-2026-04-25.md
  ?? backmarket/reports/overnight-listing-clearance-map-2026-04-25.md
  ?? backmarket/reports/parallel-readonly-queue-and-harness-2026-04-26.md
  ?? backmarket/reports/qc-sku-handoff-change-plan-2026-04-26.md
  ?? backmarket/reports/qc-sku-remaining-dry-run-2026-04-26-0217.md
  ?? backmarket/reports/queue-script-safety-audit-2026-04-25.md
  ?? backmarket/reports/return-refund-relist-invariant-2026-04-26.md
  ?? backmarket/reports/sop-audit-2026-05-02.md
  ?? backmarket/reports/sop06-card-BM-1527-2026-04-26.md
  ?? backmarket/reports/sop06-card-BM-1582-2026-04-26.md
  ?? backmarket/reports/sop06-card-BM-1592-2026-04-26.md
  ?? backmarket/reports/trade-ins-listing-push-2026-05-02-summary.md
  ?? backmarket/reports/vps-harness-preflight-runbook-2026-04-25.md
  ?? backmarket/scripts/build-sold-price-lookup.js
  ?? backmarket/scripts/lib/frontend-url-map.js
  ?? backmarket/scripts/stuck-inventory-audit.js
  ?? backmarket/scripts/stuck-inventory-execute.js
  ?? backmarket/scripts/tests/verify-sold-lookup.js
  ?? backmarket/test/unit/frontend-url-map.test.js
  ?? backmarket/tmp-check-sent-order-aiidm.js

#### icloud-checker
- Dirty entries: 2
   M icloud-checker/batch-spec-check.js
  ?? icloud-checker/serial-check-state.json

#### backmarket-browser
- Dirty entries: 22
   M backmarket-browser/config/selectors/portal.json
   M backmarket-browser/lib/dataimpulse-proxy-canary.js
   M backmarket-browser/lib/frontend-url-capture-contract.js
   M backmarket-browser/lib/harness-check.js
   M backmarket-browser/lib/harness-doctor.js
   M backmarket-browser/lib/vps-cdp-harness.js
   M backmarket-browser/scripts/run-dataimpulse-mailbox-code-login.js
   M backmarket-browser/scripts/run-headful-cloudflare-auth-handoff.js
   M backmarket-browser/scripts/vps-cdp-about-blank-check.js
   M backmarket-browser/test/unit/frontend-url-capture-contract.test.js
   M backmarket-browser/test/unit/vps-cdp-harness.test.js
  ?? backmarket-browser/.codex-tasks/2026-04-26-dataimpulse-browser-path.md
  ?? backmarket-browser/.codex-tasks/2026-04-26-dataimpulse-email-step.md
  ?? backmarket-browser/lib/capture-candidates.js
  ?? backmarket-browser/lib/harness-path.js
  ?? backmarket-browser/scripts/build-frontend-url-capture-input.js
  ?? backmarket-browser/scripts/export-frontend-url-map.js
  ?? backmarket-browser/scripts/run-gb-frontend-url-capture.js
  ?? backmarket-browser/skills/
  ?? backmarket-browser/test/unit/active-listings-csv.test.js
  ?? backmarket-browser/test/unit/capture-candidates.test.js
  ?? backmarket-browser/test/unit/harness-path.test.js

#### buyback-monitor
- Dirty entries: 2
   M buyback-monitor/buy_box_monitor.py
   M buyback-monitor/pull_parts_data_v3.py

### Recent commits touching key areas

#### backmarket
  2cdd38d (HEAD -> codex/backmarket) fix bm intake spec refs and sale sku matching
  306358c Document BM shipping confirmation recovery
  f2e61f4 Document browser-harness private API research
  c2322d5 Add Back Market API listing and customer-care docs
  ad0304a Add Back Market test cleanup audit
  1a4335b Add Back Market private API discovery docs
  657c29b Add Back Market browser harness batch10 capture
  fbd2db2 Add Back Market browser harness URL capture pilot

#### icloud-checker
  2cdd38d (HEAD -> codex/backmarket) fix bm intake spec refs and sale sku matching
  6049877 fix(icloud-checker): load proxy creds from env + alert on silent failures
  b1cbc75 Fix BM Devices lookup for intake spec comparison
  27191db chore(backmarket, icloud-checker): delete dead _disabled_to_list + add Check F
  9a94f6d Add spam audit results and filter redesign spec
  9db6a70 feat: Phase 2 — split payout, shipping, grade-check from monolith
  237f857 fix: grade-check triggers on Diagnostic Complete, matches via A-number
  df01b90 security: bind icloud-checker to 127.0.0.1, add nginx BM webhook routes

#### backmarket-browser
  09ac9de Add Back Market listing alignment export
  45418e7 (feat/agents-removed, codex/bm-tradein) Add live Cloudflare handoff runbook
  89f6cd7 Add headful Cloudflare auth handoff runner
  1413328 Add headful Cloudflare auth handoff plan
  af0211b Record Cloudflare blocker in browser TODO
  c0a7ff3 Add mailbox-code Back Market login runner
  06ac89c Update browser TODO after password canary
  257b587 Add password-stage Back Market auth canary

#### buyback-monitor
  b9c8049 (master) feat(backmarket): Phase 0.1/0.2/0.3/0.6 — policy gates, A-number map, lifecycle clears
  aeb7436 feat(backmarket): Phase 0 — enforce policy, fix creds, add dry-run gates
  350bb05 chore: clean up git tracking, expand .gitignore, sync all outstanding work
  8e9e84d rewrite buyback pipeline for v7 scraper output
  9a94f6d Add spam audit results and filter redesign spec

## Royal Mail automation repo
- Branch: master
- HEAD: f529677 Add Gophr integration discovery
- Upstream: none
- Dirty entries: 5
   M buy-labels.js
   M dispatch.js
   M repairs-dispatch.js
  ?? john-one-off.js
  ?? soak-review.sh

## Live services

### icloud-checker.service
  ● icloud-checker.service - iCloud Checker Webhook Service
       Loaded: loaded (/home/ricky/.config/systemd/user/icloud-checker.service; enabled; preset: enabled)
       Active: active (running) since Sat 2026-05-02 06:05:44 UTC; 11min ago
     Main PID: 860639 (node)
        Tasks: 11 (limit: 37552)
       Memory: 51.4M (peak: 69.1M)
          CPU: 1.016s
       CGroup: /user.slice/user-1000.slice/user@1000.service/app.slice/icloud-checker.service
               └─860639 /usr/bin/node src/index.js
  
  May 02 06:05:44 mission-control systemd[1342]: Started icloud-checker.service - iCloud Checker Webhook Service.
  May 02 06:05:44 mission-control node[860639]: iCloud Checker running on 127.0.0.1:8010
  May 02 06:05:44 mission-control node[860639]: Recheck cron: every 30 minutes
  May 02 06:06:44 mission-control node[860639]: Recheck cron: starting...
  May 02 06:06:45 mission-control node[860639]: Recheck cron: 12 items in iCloud locked group
  May 02 06:06:49 mission-control node[860639]: Recheck cron: done. 0 auto-rechecked.
  May 02 06:11:24 mission-control node[860639]: Item 11876018111: empty serial, skipping
  May 02 06:11:31 mission-control node[860639]: Item 11876018111: duplicate serial event for G923K7PK6R, skipping

### bm-grade-check.service
  ● bm-grade-check.service - BM Grade Check Webhook Service (SOP 03)
       Loaded: loaded (/home/ricky/.config/systemd/user/bm-grade-check.service; enabled; preset: enabled)
       Active: active (running) since Mon 2026-04-27 16:02:34 UTC; 4 days ago
     Main PID: 4059791 (node)
        Tasks: 11 (limit: 37552)
       Memory: 23.2M (peak: 32.3M swap: 3.2M swap peak: 3.8M)
          CPU: 2.258s
       CGroup: /user.slice/user-1000.slice/user@1000.service/app.slice/bm-grade-check.service
               └─4059791 /usr/bin/node index.js
  
  May 01 14:36:43 mission-control node[4059791]: [grade-check] Diagnostic Complete on Elias Asselbergs (11888054121)
  May 01 14:36:45 mission-control node[4059791]: [grade-check] Elias Asselbergs: BM Device="iPhone SE2", deviceName="iPhone SE2", uuid="none", sku="none"
  May 01 14:36:45 mission-control node[4059791]: [grade-check] Elias Asselbergs: Top Case="", Lid=""
  May 01 14:36:45 mission-control node[4059791]: [grade-check] Elias Asselbergs: waiting for both grades
  May 01 15:17:09 mission-control node[4059791]: [grade-check] Received webhook: boardId=349212843, columnId=status4, pulseId=11887985156, pulseName=Dwayne Morris (Everything Apple Tech [7%]), value={"label":{"index":2,"text":"Diagnostic Complete","style":{"color":"#df2f4a","border":"#ce3048","var_name":"red-shadow"},"is_done":true},"post_id":null}
  May 01 15:17:09 mission-control node[4059791]: [grade-check] Diagnostic Complete on Dwayne Morris (Everything Apple Tech [7%]) (11887985156)
  May 01 15:17:11 mission-control node[4059791]: [grade-check] Dwayne Morris (Everything Apple Tech [7%]): BM Device="MacBook Pro 13 M1 A2338", deviceName="MacBook Pro 13 M1 A2338", uuid="none", sku="none"
  May 01 15:17:11 mission-control node[4059791]: [grade-check] Dwayne Morris (Everything Apple Tech [7%]): Top Case="", Lid=""
  May 01 15:17:11 mission-control node[4059791]: [grade-check] Dwayne Morris (Everything Apple Tech [7%]): waiting for both grades
  May 02 04:47:41 mission-control node[4059791]: [grade-check] Challenge received

### bm-payout.service
  ● bm-payout.service - BM Payout Webhook Service (SOP 03b)
       Loaded: loaded (/home/ricky/.config/systemd/user/bm-payout.service; enabled; preset: enabled)
       Active: active (running) since Fri 2026-04-10 14:56:55 UTC; 3 weeks 0 days ago
     Main PID: 1420 (node)
        Tasks: 7 (limit: 37552)
       Memory: 4.7M (peak: 20.1M swap: 11.5M swap peak: 11.9M)
          CPU: 7.297s
       CGroup: /user.slice/user-1000.slice/user@1000.service/app.slice/bm-payout.service
               └─1420 /usr/bin/node index.js
  
  Apr 10 14:56:55 mission-control systemd[1342]: Started bm-payout.service - BM Payout Webhook Service (SOP 03b).
  Apr 10 14:56:55 mission-control node[1420]: [bm-payout] Listening on 127.0.0.1:8012
  Apr 10 14:56:55 mission-control node[1420]: [bm-payout] Pre-flight checks: BM trade-in ID, iCloud lock

### bm-shipping.service
  ● bm-shipping.service - BM Shipping Confirmation Webhook Service (SOP 09)
       Loaded: loaded (/home/ricky/.config/systemd/user/bm-shipping.service; enabled; preset: enabled)
       Active: active (running) since Tue 2026-04-28 15:05:23 UTC; 3 days ago
     Main PID: 25281 (node)
        Tasks: 11 (limit: 37552)
       Memory: 28.6M (peak: 31.9M swap: 1.4M swap peak: 13.7M)
          CPU: 2.320s
       CGroup: /user.slice/user-1000.slice/user@1000.service/app.slice/bm-shipping.service
               └─25281 /usr/bin/node index.js
  
  May 01 16:05:45 mission-control node[25281]: [shipping] #1219 - Kitty Walker (11853882115) marked as Shipped
  May 01 16:05:47 mission-control node[25281]: [shipping] #1219 - Kitty Walker: no tracking number found
  May 01 16:40:52 mission-control node[25281]: [shipping] #1198 - Davidson Drakes-Jarrett (11795578861) marked as Shipped
  May 01 16:40:52 mission-control node[25281]: [shipping] BM 1580 (David Teague/Davey Teague) *REPAIR* (11658455045) marked as Shipped
  May 01 16:40:52 mission-control node[25281]: [shipping] #1230 - Andrew Croft (11898295623) marked as Shipped
  May 01 16:40:53 mission-control node[25281]: [shipping] BM 1580 (David Teague/Davey Teague) *REPAIR*: already notified BM, skipping
  May 01 16:40:53 mission-control node[25281]: [shipping] Tracking: MV102443018GB
  May 01 16:40:53 mission-control node[25281]: [shipping] #1198 - Davidson Drakes-Jarrett: no BM Sales Order ID on Main Board (text_mm2vf3nk empty)
  May 01 16:40:54 mission-control node[25281]: [shipping] Tracking: MZ487840801GB
  May 01 16:40:54 mission-control node[25281]: [shipping] #1230 - Andrew Croft: no serial number found

## Listeners
  LISTEN 0      511        127.0.0.1:8011       0.0.0.0:*    users:(("node",pid=4059791,fd=21))          
  LISTEN 0      511        127.0.0.1:8010       0.0.0.0:*    users:(("node",pid=860639,fd=21))           
  LISTEN 0      511        127.0.0.1:8013       0.0.0.0:*    users:(("node",pid=25281,fd=21))            
  LISTEN 0      511        127.0.0.1:8012       0.0.0.0:*    users:(("node",pid=1420,fd=21))             

## Cron / scheduled BM jobs
  # BM sent-orders detection — daily 06:00 UTC
  0 6 * * * cd /home/ricky/builds/backmarket && /usr/bin/node scripts/sent-orders.js --live >> /home/ricky/logs/cron/sent-orders.log 2>&1
  0 7-17 * * 1-5 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/sale-detection.js >> /home/ricky/logs/cron/sale-detection.log 2>&1
  0 8,12,16 * * 6,0 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/sale-detection.js >> /home/ricky/logs/cron/sale-detection.log 2>&1
  # SOP 09: Dispatch labels — 07:00 and 12:00 UTC weekdays
  0 7 * * 1-5 cd /home/ricky/builds/royal-mail-automation && /usr/bin/node dispatch.js >> /home/ricky/logs/cron/dispatch.log 2>&1
  0 12 * * 1-5 cd /home/ricky/builds/royal-mail-automation && /usr/bin/node dispatch.js >> /home/ricky/logs/cron/dispatch.log 2>&1
  30 7 * * 1-5 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/board-housekeeping.js >> /home/ricky/logs/cron/board-housekeeping.log 2>&1
  # BM resale buy-box check (SOP 07) — daily 06:30 UTC Mon-Fri, check-only (Phase 0.5)
  30 6 * * 1-5 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/buy-box-check.js >> /home/ricky/logs/cron/buy-box-check.log 2>&1
  0 8 * * 1-5 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/morning-briefing.js >> /home/ricky/logs/cron/morning-briefing.log 2>&1
  0 4 * * 0 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/reconcile-listings.js --dry-run >> /home/ricky/logs/cron/reconcile-listings.log 2>&1
  # SOP: Repairs Dispatch — Royal Mail labels for mail-in repair customers
  0 12 * * 1-5 cd /home/ricky/builds/royal-mail-automation && /usr/bin/node repairs-dispatch.js >> /home/ricky/logs/cron/repairs-dispatch.log 2>&1
  0 15 * * 1-5 cd /home/ricky/builds/royal-mail-automation && /usr/bin/node repairs-dispatch.js >> /home/ricky/logs/cron/repairs-dispatch.log 2>&1

## High-risk live files changed locally
- icloud-checker/src/index.js: clean; mtime=2026-05-02 04:22:23.881376279 +0000; last_commit=2cdd38d fix bm intake spec refs and sale sku matching
- backmarket/scripts/sale-detection.js: clean; mtime=2026-05-02 04:21:00.148855849 +0000; last_commit=2cdd38d fix bm intake spec refs and sale sku matching
- backmarket/services/bm-grade-check/index.js: M backmarket/services/bm-grade-check/index.js; mtime=2026-04-27 14:48:48.061627636 +0000; last_commit=b9c8049 feat(backmarket): Phase 0.1/0.2/0.3/0.6 — policy gates, A-number map, lifecycle clears
- backmarket/services/bm-payout/index.js: clean; mtime=2026-03-27 12:06:06.841573853 +0000; last_commit=6a25e89 fix: harden bm payout dedup and split alert channels
- backmarket/services/bm-shipping/index.js: M backmarket/services/bm-shipping/index.js; mtime=2026-04-28 14:57:29.423362278 +0000; last_commit=b9c8049 feat(backmarket): Phase 0.1/0.2/0.3/0.6 — policy gates, A-number map, lifecycle clears
- backmarket/scripts/list-device.js: M backmarket/scripts/list-device.js; mtime=2026-04-26 08:21:05.165351897 +0000; last_commit=b175763 Add reconciled V7 scrape verification
- backmarket/scripts/buy-box-check.js: M backmarket/scripts/buy-box-check.js; mtime=2026-04-27 14:49:09.594796234 +0000; last_commit=b9c8049 feat(backmarket): Phase 0.1/0.2/0.3/0.6 — policy gates, A-number map, lifecycle clears
- backmarket/scripts/board-housekeeping.js: M backmarket/scripts/board-housekeeping.js; mtime=2026-04-27 14:49:06.212769759 +0000; last_commit=cbd6c61 feat: add board-housekeeping.js
- backmarket/scripts/lib/v7-scraper.js: M backmarket/scripts/lib/v7-scraper.js; mtime=2026-04-26 08:20:37.276141492 +0000; last_commit=b175763 Add reconciled V7 scrape verification

## Immediate operating rule
Freeze live mutations except established cron/services already running. Before any new live write path, classify the relevant file as committed or intentionally-live-local.
