# Hugo Script Audit

Date: 2026-04-04
Scope: `/home/ricky/builds/backmarket/` SOPs, scripts, README, analysis/docs scan, `buyback-monitor/README.md`, and live `crontab -l`
Method: read-only research only; no existing files modified

---

## 1. Summary table — SOP → Script / service → Crontab → Needs LLM

| SOP | Script / service | Crontab? | Needs LLM? | Notes |
|---|---|---:|---:|---|
| 01 — Trade-in Purchase | `scripts/sent-orders.js` | Yes | NO | Daily 06:00 UTC live cron. Polls BM SENT buyback orders, parses packing slip PDF, creates Monday items, links boards, Telegram alerts. |
| 02 — Intake & Receiving | `icloud-checker` service (`/home/ricky/builds/icloud-checker/src/index.js`) | No | NO | Event-driven Monday webhook + in-process 30 min recheck loop. Checks iCloud, Apple specs, BM messaging, Slack buttons. |
| 03 — Diagnostic | `bm-grade-check` service (`/home/ricky/builds/backmarket/services/bm-grade-check` per SOP; script-side support only indirectly) | No | NO | Triggered by Monday `status4 = Diagnostic Complete`. Profitability alerting service; core diagnostic work is manual. |
| 03b — Trade-in Payout | `bm-payout` service (`services/bm-payout/index.js`) | No | NO | Event-driven webhook on `status24 = Pay-Out`. Financial action. There is also a support script `scripts/trade-in-payout.js`, but SOP points to the live service. |
| 04 — Repair & Refurb | Manual process | No | YES (human judgement) | Physical repair/refurb workflow; no active automation. Human inspection, parts decisions, workmanship, exception handling. |
| 06 — Listing | `scripts/list-device.js` | No | NO | Script is deterministic listing automation. SOP still requires Ricky approval per device, but that approval step is human policy control rather than an LLM requirement. |
| 06.5 — Listings Reconciliation | `scripts/reconcile-listings.js` | No | NO | On-demand currently. Deterministic cross-check between Monday and BM listings; can auto-offline oversell risk and backfill costs. |
| 07 — Buy Box Management | `scripts/buy-box-check.js` | No | NO | On-demand currently. Deterministic buy-box check + profitability + optional auto-bump. Existing Monday 05:00 cron is for older buyback Python pipeline, not this script. |
| 08 — Sale Detection & Acceptance | `scripts/sale-detection.js` | Yes | NO | Live hourly/working-hours cron. Polls BM orders state=1, accepts matched orders, updates Monday, Telegram alerts. |
| 09 — Label Buying | `dispatch.js` in `/home/ricky/builds/royal-mail-automation/` | Yes | NO | Weekday 07:00 and 12:00 UTC cron. Not in `backmarket/scripts`, but it is the live SOP 09 implementation. |
| 09.5 — Shipment Confirmation | `bm-shipping` service (`services/bm-shipping/index.js`) | No | NO | Event-driven Monday webhook on `status4 = Shipped`; notifies BM with tracking + serial, moves BM Devices item. |
| 10 — Payment Reconciliation | Manual process + support scripts `scripts/profitability-check.js`, `scripts/reconcile.js` | No | YES | SOP itself is not fully built. Actual bank-vs-expected reconciliation and discrepancy handling require human review. |
| 11 — Tuesday Cutoff | Not built | No | NO | Monitoring/alerting protocol only. Deterministic and should be scriptable; currently gap. |
| 12 — Returns & Aftercare | Manual + Slack/button flows in `icloud-checker` for counter-offers | No | YES | Return reasons, fraud calls, negotiation, counter-offer judgement, aftercare messaging all require human judgement. |

### Quick read
- Already cron-driven live BM automations: **SOP 01, SOP 08, SOP 09**, plus **board-housekeeping.js** and the separate **buyback-monitor** daily/weekly pipelines.
- Event-driven live automations: **SOP 02, SOP 03, SOP 03b, SOP 09.5**.
- On-demand but deterministic and good cron candidates: **SOP 06.5, SOP 07, SOP 11**.
- Human-heavy/manual: **SOP 04, SOP 10, SOP 12**, and approval-heavy **SOP 06**.

---

## 2. Readme-derived mapping and known issues

## Mapping from `backmarket/README.md`

The README gives this primary mapping:

- SOP 01 → `scripts/sent-orders.js`
- SOP 02 → `icloud-checker` service (8010)
- SOP 03 → `bm-grade-check` service (8011)
- SOP 03b → `bm-payout` service (8012)
- SOP 04 → manual
- SOP 06 → `scripts/list-device.js`
- SOP 06.5 → `scripts/reconcile-listings.js`
- SOP 07 → `scripts/buy-box-check.js`
- SOP 08 → `scripts/sale-detection.js`
- SOP 09 → `dispatch.js`
- SOP 09.5 → `bm-shipping` service (8013)
- SOP 10 → manual
- SOP 11 → not built
- SOP 12 → manual + counter-offer buttons

## Known issues / mismatches called out in docs

From `docs/sop-script-issue-log.md` and SOP QA notes:

- SOP 09 had a confirmed bug where `dispatch.js` could set `Return Booked` even if tracking writeback failed; this was fixed by combining the tracking + status write in one mutation.
- SOP 09 and SOP 09.5 were intentionally split because label buying and BM shipment confirmation are separate systems/triggers.
- SOP 06.5 QA explicitly says the documented “missing BM Device protocol” is **not implemented** in `reconcile-listings.js`; script only flags missing BM Device entries.
- SOP 10 QA says the referenced support scripts do **not** implement full payment reconciliation end-to-end.
- SOP 11 remains a documentation/process SOP with **no built implementation**.
- SOP 01 QA notes two script drift risks: PDF title parsing mismatch vs old flow, and Intel CPU label handling drift.

---

## 3. Per-SOP detail

## SOP 01 — Trade-in Purchase

- File: `sops/01-trade-in-purchase.md`
- Process: when BM buyback order reaches `SENT`, create linked Monday records on Main Board + BM Devices Board.
- Script reference: `scripts/sent-orders.js`
- Trigger: scheduled poll of `GET /ws/buyback/v1/orders?status=SENT`, plus optional specific-order manual mode.
- Live scheduling: **Yes** — crontab has:
  - `0 6 * * * cd /home/ricky/builds/backmarket && /usr/bin/node scripts/sent-orders.js --live`
- Data sources:
  - BM buyback API
  - packing slip PDF + `pdftotext -layout`
  - Monday API
  - Device Lookup Board
  - Telegram
- Needs LLM?: **NO**
- Why: structured API/PDF extraction + deterministic board writes.

## SOP 02 — Intake & Receiving

- File: `sops/02-intake-receiving.md`
- Process: receive device, enter serial, run iCloud lock + Apple spec validation, handle locked devices and mismatch flow.
- Live implementation: **service**, not a script in `backmarket/scripts`
- Trigger: Monday webhook when Main Board `text4` serial is written.
- Scheduling: no crontab entry; service includes its own in-process 30-minute recheck loop for customer replies.
- Data sources:
  - Monday webhook/API
  - SickW API
  - Apple Self Service Repair API
  - BM buyback orders + messages API
  - Slack interactivity
- Needs LLM?: **NO**
- Why: all logic is deterministic checks and button-driven branching.

## SOP 03 — Diagnostic

- File: `sops/03-diagnostic.md`
- Process: technician diagnostic/pre-grading/parts identification; profitability alert runs after status change.
- Live automation: `bm-grade-check` webhook service for profitability prediction after `status4 = Diagnostic Complete`.
- Trigger: event-driven Monday webhook.
- Scheduling: no crontab entry.
- Data sources:
  - Monday columns (pre-grades, parts, labour)
  - sell price data from scraper dataset
  - Slack alerts / Monday comments
- Needs LLM?: **NO** for the automated portion; **manual** for actual diagnostic work.
- Why: service logic is deterministic; the physical assessment itself is human, not an LLM task.

## SOP 03b — Trade-in Payout

- File: `sops/03b-trade-in-payout.md`
- Process: validate trade-in payout with BM after diagnostic/QC.
- Live implementation per SOP: `services/bm-payout/index.js`
- Support script present: `scripts/trade-in-payout.js`
- Trigger: Monday webhook when `status24` becomes Pay-Out (index 12).
- Scheduling: no crontab entry.
- Data sources:
  - Monday API
  - BM buyback validate endpoint
  - Slack + Telegram
- Needs LLM?: **NO**
- Why: purely rules-based gating and API mutation.
- Note: because this is irreversible financial action, keep event-driven/hard-gated rather than scheduled bulk cron.

## SOP 04 — Repair & Refurbishment

- File: `sops/04-repair-refurb.md`
- Process: actual repair, parts usage, refurbishment, labour tracking.
- Script reference: none; manual process.
- Trigger: human handoff after diagnostic.
- Scheduling: none.
- Data sources:
  - Monday boards / Parts Board
  - tech observations
- Needs LLM?: **YES** in the broad classification sense because this is human-judgement-heavy and physical, but really it is a **manual operator process**, not an AI automation target.

## SOP 06 — Listing

- File: `sops/06-listing.md`
- Process: create BM listing for one device, resolve product ID, compute P&L, create draft, verify, publish, update Monday.
- Script: `scripts/list-device.js`
- Trigger: on-demand; SOP says run one item at a time with dry-run → Telegram card → Ricky approval → live.
- Scheduling: no live cron.
- Data sources:
  - Monday Main + BM Devices boards
  - BM listings / tasks / backbox APIs
  - local resolver truth files (`data/listings-registry.json`, `data/bm-catalog.json`)
  - live BM product-page scrape via shared V7 scraper logic
  - historical sales lookup from BM orders
  - Telegram
- Needs LLM?: **NO**
- Why: the listing mechanics are deterministic. The approval step is a human control point, but it does not require an LLM.

## SOP 06.5 — Listings Reconciliation

- File: `sops/06.5-listings-reconciliation.md`
- Process: compare Monday “Listed” inventory vs BM active listings; catch oversell, missing cost data, orphan listings.
- Script: `scripts/reconcile-listings.js`
- Trigger: on-demand; intended to run after fresh pricing data and before SOP 07.
- Scheduling: **no active cron**.
- Data sources:
  - Monday Main Board + BM Devices Board
  - BM listings API
  - Telegram
- Needs LLM?: **NO**
- Why: all checks are deterministic joins and threshold logic.

## SOP 07 — Buy Box Management

- File: `sops/07-buy-box-management.md`
- Process: check sell-side live listings, verify variant integrity, get buy-box price-to-win, evaluate profitability, optionally auto-bump.
- Script: `scripts/buy-box-check.js`
- Trigger: on-demand.
- Scheduling: **no active cron** for this script.
- Important context: Monday 05:00 cron runs `/home/ricky/builds/buyback-monitor/run-weekly.sh`, which is the older **buyback** pipeline, not sell-side SOP 07.
- Data sources:
  - BM listings API
  - BM backbox competitors API
  - Monday boards for fixed cost, purchase, date listed, grade, colour
  - resolver truth + catalog files
  - live product-page scrape via V7 scraper logic
  - Telegram
- Needs LLM?: **NO**
- Why: deterministic analysis + thresholded actions.

## SOP 08 — Sale Detection & Acceptance

- File: `sops/08-sale-detection.md`
- Process: poll new BM sales orders, match to inventory, accept, update Monday, notify Telegram.
- Script: `scripts/sale-detection.js`
- Trigger: scheduled poll of `GET /ws/orders?state=1`.
- Live scheduling: **Yes** — crontab has:
  - `0 7-17 * * 1-5 ... scripts/sale-detection.js`
  - `0 8,12,16 * * 6,0 ... scripts/sale-detection.js`
- Data sources:
  - BM sales API
  - Monday BM Devices + Main Board
  - Telegram
- Needs LLM?: **NO**

## SOP 09 — Label Buying

- File: `sops/09-shipping.md`
- Process: buy Royal Mail labels for accepted orders, write tracking to Monday, post dispatch summary.
- Live implementation: `/home/ricky/builds/royal-mail-automation/dispatch.js`
- Trigger: scheduled batch run.
- Live scheduling: **Yes** — crontab has:
  - `0 7 * * 1-5 cd /home/ricky/builds/royal-mail-automation && /usr/bin/node dispatch.js`
  - `0 12 * * 1-5 cd /home/ricky/builds/royal-mail-automation && /usr/bin/node dispatch.js`
- Data sources:
  - BM orders state=3
  - Monday boards
  - Royal Mail automation
  - Slack
- Needs LLM?: **NO**
- Note: not a `backmarket/scripts` file, but it is the live SOP implementation.

## SOP 09.5 — Shipment Confirmation

- File: `sops/09.5-shipment-confirmation.md`
- Process: once team marks item shipped, notify BM with tracking + serial and move BM Devices item to shipped group.
- Live implementation: `services/bm-shipping/index.js`
- Trigger: Monday webhook on `status4 = Shipped`.
- Scheduling: no crontab entry.
- Data sources:
  - Monday webhook/API
  - BM order update endpoint
  - Slack + Telegram
- Needs LLM?: **NO**

## SOP 10 — Payment & Revenue Reconciliation

- File: `sops/10-payment-reconciliation.md`
- Process: compare expected BM sales revenue vs actual payout/bank statement.
- Script mapping in SOP: support tools only
  - `scripts/profitability-check.js`
  - `scripts/reconcile.js`
- Trigger: manual / agent process.
- Scheduling: none found for these scripts.
- Data sources:
  - BM completed orders API
  - Monday boards
  - bank statement / payout report (not scripted here)
  - Telegram for weekly report target
- Needs LLM?: **YES**
- Why: actual discrepancy interpretation, bank matching, and unresolved payout-column decisions still require human judgement.

## SOP 11 — Tuesday Cutoff Protocol

- File: `sops/11-tuesday-cutoff.md`
- Process: check accepted-but-not-shipped orders before weekly payout cutoff; alert team.
- Script reference: **not yet built**.
- Trigger: intended Monday 14:00 UK and Tuesday 09:00 UK.
- Scheduling: no cron entry found.
- Data sources it would need:
  - BM orders state=3
  - Monday Main + BM Devices boards
  - Telegram
- Needs LLM?: **NO**
- Why: fully deterministic monitoring/alerting problem.

## SOP 12 — Returns & Aftercare

- File: `sops/12-returns-aftercare.md`
- Process: buyer returns, wrong device shipped, suspensions, counter-offers, aftercare.
- Automation references:
  - counter-offer button flow in shared `icloud-checker`
  - otherwise manual / dashboard / BM messaging process
- Scheduling: none.
- Data sources:
  - BM dashboard / state changes / messages
  - Monday boards
  - Slack / Telegram
- Needs LLM?: **YES**
- Why: fraud calls, negotiation, free-text buyer communications, and return-resolution choices require judgement and drafting.

---

## 4. Script inventory (`backmarket/scripts/`)

Below is the practical script map from the script directory scan. “Primary role” reflects what the file appears to do from its header, early code, and main entrypoints.

| Script | Primary role | Inputs / APIs / creds | Outputs | SOP match |
|---|---|---|---|---|
| `apple-spec-check.js` | Standalone wrapper around icloud-checker Apple spec lookup | iCloud-checker code + Apple lookup path; serial CLI arg | Console JSON | Support for SOP 02, not the live SOP entrypoint |
| `board-housekeeping.js` | Daily BM Devices board cleanup / group moves | Monday API, Slack token | Monday moves, Slack post, console | No direct SOP; operational housekeeping orphan/support |
| `build-listings-registry.js` | Build trusted listing-slot registry by creating/probing draft listings | BM API, local catalog/registry JSON, dotenv | Writes registry/corrections/duplicate JSON, console/logs | No direct SOP; infrastructure for SOP 06/07 |
| `buyback-profitability-builder.js` | Build real-data buyback profitability lookup | BM completed orders API, Monday API, local data | Writes `data/buyback-profitability-lookup.json` | No direct SOP; support for SOP 07 / buyback analytics |
| `buy-box-check.js` | Sell-side buy-box monitoring and optional bumping | BM API, Monday API, resolver truth files, V7 scraper, Telegram | Console, Telegram, BM listing updates, optional Monday cost writeback | SOP 07 |
| `list-device.js` | One-device listing flow with resolver truth, market scrape, pricing, BM create/publish, Monday update | BM API, Monday API, resolver truth files, scraper data, V7 scrape, Telegram | Console/logs, BM listing creation/update, Monday updates, Telegram | SOP 06 |
| `listings-audit.js` | Read-only listing rebuild audit of BM listings | BM API, product-id lookup JSON | JSON audit report file, console | No direct SOP; research/audit orphan |
| `morning-briefing.js` | Delivery arrival briefing for SENT buyback orders | BM buyback API via shared libs, Monday lookup, Slack | Slack post, console/log | Partial fit to SOP 03 “missing automations”; not in official README map |
| `profitability-check.js` | Legacy daily profitability check on live listings | Monday API, buyback-monitor sell prices, BM listings, Slack | Console/log, Slack | Support tool for SOP 10 / legacy SOP 07-type work |
| `reconcile.js` | Legacy daily listing reconciliation | BM API, Monday API, Slack | Console/log, Slack | Support tool; overlaps SOP 06.5 but README maps SOP 06.5 to `reconcile-listings.js` |
| `reconcile-listings.js` | SOP 6.5 listings reconciliation with Telegram + auto-actions | BM API, Monday API, Telegram | Console, Telegram, BM listing updates, Monday cost backfill | SOP 06.5 |
| `reset-live-listings.js` | Snapshot/offline/clear-links utility for listing estate reset | BM API, Monday API, local audit dir | BM listing updates, Monday link clears, audit files | No direct SOP; maintenance/orphan |
| `sale-detection.js` | Sales order detection and acceptance | BM API, Monday API, Telegram | BM acceptance, Monday updates, Telegram, console | SOP 08 |
| `sent-orders.js` | Buyback SENT order ingestion | BM buyback API, PDFs via `pdftotext`, Monday API, Telegram | Monday item creation/linking, Telegram, console | SOP 01 |
| `shipping.js` | Combined old-style labels + confirm flow script | BM API, Monday API, Slack, Telegram | BM updates, Monday writes/comments, Slack/Telegram | Superseded by SOP split; not the documented live path |
| `trade-in-payout.js` | CLI/script version of payout flow | BM API, Monday API, Telegram | BM payout validate, Monday status update, Telegram | Support/alternate implementation of SOP 03b |

## Dependencies

From `backmarket/package.json`:

- `dotenv` only (declared dependency)

In practice, many scripts also depend on:
- built-in Node modules (`fs`, `path`, etc.)
- local shared libs under `scripts/lib/`
- global/runtime tools like `pdftotext`
- external services/APIs: BM, Monday, Telegram, Slack, Apple/SickW via sibling projects/services

---

## 5. Current crontab map for BM-related work

Live `crontab -l` entries relevant to the BackMarket estate:

### BackMarket / related live entries

- **BM buyback weekly pipeline**
  - `0 5 * * 1 /home/ricky/builds/buyback-monitor/run-weekly.sh`
- **BM sent-orders detection**
  - `0 6 * * * cd /home/ricky/builds/backmarket && /usr/bin/node scripts/sent-orders.js --live`
- **SOP 08 sale detection**
  - `0 7-17 * * 1-5 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/sale-detection.js ...`
  - `0 8,12,16 * * 6,0 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/sale-detection.js ...`
- **SOP 09 dispatch labels**
  - `0 7 * * 1-5 cd /home/ricky/builds/royal-mail-automation && /usr/bin/node dispatch.js ...`
  - `0 12 * * 1-5 cd /home/ricky/builds/royal-mail-automation && /usr/bin/node dispatch.js ...`
- **BM board housekeeping**
  - `30 7 * * 1-5 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/board-housekeeping.js ...`
- **BM buyback daily pipeline**
  - `0 5 * * * /home/ricky/builds/buyback-monitor/run-daily.sh ...`

### Important finding

There are **both**:
- weekly buyback pipeline: `run-weekly.sh` Monday 05:00 UTC
- daily buyback pipeline: `run-daily.sh` every day 05:00 UTC

That suggests the buyback-monitor pipeline currently has **both daily and weekly scheduled paths live**, even though README and docs emphasize the weekly run. This is worth treating as an operational inconsistency.

### Not in crontab

These are **not** currently scheduled in crontab:
- `scripts/list-device.js`
- `scripts/reconcile-listings.js`
- `scripts/buy-box-check.js`
- `scripts/trade-in-payout.js`
- `scripts/reconcile.js`
- `scripts/profitability-check.js`
- `scripts/morning-briefing.js`

And these are live as services/webhooks instead of crontab jobs:
- SOP 02 intake (`icloud-checker`)
- SOP 03 grade-check (`bm-grade-check`)
- SOP 03b payout (`bm-payout`)
- SOP 09.5 shipping confirmation (`bm-shipping`)

---

## 6. Analysis / docs scan

## `analysis/`

Observed analysis tools include:
- pricing / repricing: `bm-pricing-report.py`, `bm-reprice.py`, `bm-post-reprice-audit.py`, `bm-buybox-audit.py`
- reconciliation / profit: `bm-reconcile.py`, `bm-reconcile-detail.py`, `bm-profit-by-shipdate.py`, `bm-profit-by-solddate.py`
- catalog / crossref: `bm-catalog-merge.py`, `bm-crossref.py`, `bm-full-chain.py`, `bm-sku-audit.py`, `bm-vetted-listings-audit.py`
- diagnostics / returns: `bm-returns-forensic.py`, `bm-repair-analysis.py`, `bm-saf-diagnostics.py`, `bm-nfu-analysis.py`
- issue/forensic helpers: `extract-tasks-20-21.py`, `bm-order-history-extract.py`

Takeaway: there is a large parallel Python analysis estate around pricing, catalog quality, reconciliation, and forensics. Most of it appears to be offline analysis/support tooling rather than the live SOP automation layer.

## `docs/`

Relevant strategy/ops docs seen:
- `BRIEF-SOP6-SOP7-PRICING-INTELLIGENCE-2026-03-29.md`
- `PLAN-SCRAPER-IMPROVEMENTS-2026-03-28.md`
- `sop-script-issue-log.md`
- `SPEC-LISTINGS-REGISTRY-2026-03-28.md`
- `SPEC-SENT-ORDERS-REBUILD-2026-03-30.md`
- `SPEC-VETTED-LISTINGS-UUID-RESOLUTION-2026-03-30.md`
- `INGRESS-MAP.md`, `VERIFIED-COLUMN-REFERENCE.md`

Takeaway: the docs strongly reinforce that SOP 06 / 06.5 / 07 are intended to run off resolver-truth data plus scraper-derived market signals, and that the live system has been actively split away from older combined scripts/flows.

## `buyback-monitor/README.md`

This is a separate buyback pipeline, not Hugo’s sell-side SOP 07 script.

What it does:
- scans buyback listings
- checks competitors via BM buyback API
- calculates profit at current and win prices
- generates JSON + markdown reports
- optionally auto-bumps losing buyback listings

Important context for this audit:
- It has its own daily cron in the README (`0 5 * * *`), while live crontab also contains a weekly `run-weekly.sh` plus a daily `run-daily.sh` entry.
- This pipeline is **buyback-side**, whereas SOP 07 is **sell-side**.
- The presence of this separate pipeline likely explains why SOP 07’s Node script is still on-demand.

---

## 7. Scripts with no matching SOP (orphans / support tools)

These scripts do not map cleanly to a numbered SOP as the primary implementation:

- `apple-spec-check.js` — support wrapper for SOP 02 internals
- `board-housekeeping.js` — operational housekeeping cron; useful but not a numbered SOP
- `build-listings-registry.js` — infrastructure for resolver-truth
- `buyback-profitability-builder.js` — analytics/data build support
- `listings-audit.js` — read-only audit tool
- `morning-briefing.js` — appears to fit a desired arrival briefing but not an official SOP mapping yet
- `profitability-check.js` — legacy/support profitability monitor
- `reconcile.js` — legacy/support reconciliation tool, overlapped by SOP 06.5 script
- `reset-live-listings.js` — maintenance/reset utility
- `shipping.js` — older combined labels+confirm script; docs now split live flow into `dispatch.js` + `bm-shipping`

### Special orphan notes

- `morning-briefing.js` is the strongest candidate to promote into a formal SOP or scheduled sub-process because SOP 03 explicitly lists a missing “arrival notification cron”.
- `shipping.js` and `trade-in-payout.js` look like CLI-script versions of flows now documented as webhook services. They may remain useful for testing/recovery, but they are not the primary live paths described in README/SOPs.
- `reconcile.js` / `profitability-check.js` look like older Slack-oriented support tools predating the newer SOP 06.5 / 07 implementations.

---

## 8. SOPs with no matching script (gaps)

### Clear gaps

- **SOP 11 — Tuesday Cutoff Protocol**
  - explicitly “Not yet built” in SOP
  - deterministic monitoring/alerting task
  - strong candidate for a cron job

### Partial / manual gaps

- **SOP 04 — Repair & Refurb**
  - intentionally manual physical process
  - no script expected for the core activity

- **SOP 10 — Payment & Revenue Reconciliation**
  - support scripts exist, but no true end-to-end reconciliation script exists
  - unresolved business/data-model question: where actual payout amount should live on Monday

- **SOP 12 — Returns & Aftercare**
  - partial support exists (counter-offer buttons in shared service), but most of the SOP is manual decisioning and BM/dashboard handling

### Process gap hidden in SOP 03

SOP 03’s “Missing Automations” section identifies two gaps:
- arrival notification cron
- auto-move to Today’s Repairs when BM order status changes to RECEIVED

`morning-briefing.js` appears to partially address the first gap, but it is not in live crontab.

---

## 9. Recommendations — what should move to crontab vs stay agent-triggered

## Move to crontab

### 1) `scripts/reconcile-listings.js` (SOP 06.5)
**Recommendation:** move to cron, probably daily after the relevant pricing/scraper freshness point and before any buy-box automation.

Why:
- deterministic safety script
- catches oversell risk and data integrity issues
- explicitly intended to run before SOP 07
- no LLM or judgement needed

Suggested posture:
- run read/write live automatically once timing is agreed
- keep Telegram summary
- ideally precede any future sell-side buy-box automation

### 2) SOP 11 build + cron
**Recommendation:** build a dedicated script for SOP 11 and schedule it.

Why:
- pure monitoring/alerting
- clear weekly cadence already defined in SOP
- directly tied to payout timing and missed-revenue prevention
- no LLM needed

Suggested schedule:
- Monday afternoon UK
- Tuesday morning UK
- optional Tuesday follow-up escalation run

### 3) `scripts/morning-briefing.js`
**Recommendation:** consider promoting to cron if the team actually wants arrival forecasting.

Why:
- SOP 03 already names arrival notification as missing automation
- this script appears purpose-built for that exact need
- deterministic and low risk

Suggested schedule:
- weekday early morning before receiving starts

## Keep agent-triggered / human-approved

### 4) `scripts/list-device.js` (SOP 06)
**Recommendation:** keep agent-triggered.

Why:
- SOP explicitly requires per-device Ricky approval
- listing creation has irreversible marketplace consequences if resolver/product match is wrong
- proposal-card review is the control point

If later automated further:
- only after resolver-truth confidence and approval policy change
- maybe auto-run dry-run proposals, but not live publish

### 5) `scripts/buy-box-check.js` (SOP 07)
**Recommendation:** keep on-demand for now, or introduce a cautious scheduled read-only mode first.

Why:
- deterministic, so it does not need an LLM
- but automatic price changes affect live margin and market position
- there is already a separate live buyback-monitor pipeline, so sell-side automation may still be under active policy tuning

Best next step:
- if scheduled, first run in **check-only / alert-only** mode
- only later enable `--auto-bump` once thresholds are trusted

## Keep event-driven services, not cron

### 6) SOP 02, SOP 03, SOP 03b, SOP 09.5 services
**Recommendation:** keep as event-driven services.

Why:
- all are naturally triggered by webhook/business events
- cron would be a worse fit than the current event model
- payout and shipment confirmation especially benefit from immediate, single-item handling

## Keep manual / judgement-led

### 7) SOP 04, SOP 10, SOP 12
**Recommendation:** keep human-led.

Why:
- repair is physical work
- payment reconciliation still depends on external bank/payout evidence and unresolved schema questions
- returns/aftercare involves negotiation, fraud calls, and exception handling

---

## 10. Bottom line

The BackMarket estate is already mostly deterministic automation, and most of it **does not need an LLM**.

### Already automated without LLM
- SOP 01
- SOP 02
- SOP 03 automated check portion
- SOP 03b
- SOP 08
- SOP 09
- SOP 09.5
- plus board housekeeping and the separate buyback-monitor pipeline

### Deterministic but still not scheduled
- SOP 06.5
- SOP 07
- SOP 11 (not built yet)
- likely `morning-briefing.js`

### Human / approval / judgement layer remains important
- SOP 06 live listing approval
- SOP 10 reconciliation judgement
- SOP 12 returns and aftercare
- SOP 04 physical repair/refurb

### Highest-value next cron candidates
1. **SOP 11 build + schedule**
2. **`reconcile-listings.js` live schedule**
3. **`morning-briefing.js` if the receiving team wants it**

### Operational inconsistency to resolve
The live crontab currently shows **both** weekly and daily buyback-monitor runs. That should be checked, because the docs/readme emphasize weekly operation in some places while daily execution is also present.

---

## Sources checked

- `/home/ricky/builds/agent-rebuild/BRIEF-01-HUGO-SCRIPT-AUDIT.md`
- `/home/ricky/builds/backmarket/sops/00-BACK-MARKET-MASTER.md`
- `/home/ricky/builds/backmarket/sops/01-trade-in-purchase.md`
- `/home/ricky/builds/backmarket/sops/02-intake-receiving.md`
- `/home/ricky/builds/backmarket/sops/03-diagnostic.md`
- `/home/ricky/builds/backmarket/sops/03b-trade-in-payout.md`
- `/home/ricky/builds/backmarket/sops/04-repair-refurb.md`
- `/home/ricky/builds/backmarket/sops/06-listing.md`
- `/home/ricky/builds/backmarket/sops/06.5-listings-reconciliation.md`
- `/home/ricky/builds/backmarket/sops/07-buy-box-management.md`
- `/home/ricky/builds/backmarket/sops/08-sale-detection.md`
- `/home/ricky/builds/backmarket/sops/09-shipping.md`
- `/home/ricky/builds/backmarket/sops/09.5-shipment-confirmation.md`
- `/home/ricky/builds/backmarket/sops/10-payment-reconciliation.md`
- `/home/ricky/builds/backmarket/sops/11-tuesday-cutoff.md`
- `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md`
- `/home/ricky/builds/backmarket/README.md`
- `/home/ricky/builds/backmarket/package.json`
- `/home/ricky/builds/backmarket/docs/sop-script-issue-log.md`
- `/home/ricky/builds/backmarket/docs/BRIEF-SOP6-SOP7-PRICING-INTELLIGENCE-2026-03-29.md`
- `/home/ricky/builds/backmarket/docs/PLAN-SCRAPER-IMPROVEMENTS-2026-03-28.md`
- `/home/ricky/builds/backmarket/analysis/api-migration.md`
- `/home/ricky/builds/buyback-monitor/README.md`
- live `crontab -l`
