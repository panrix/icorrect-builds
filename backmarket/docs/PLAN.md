# BackMarket Operations Rebuild

**Date:** 2026-04-17
**Version:** 5 (post-Codex QA pass 4 — full approval, all notes closed)
**Owner:** Ricky + Claude Code
**Status:** **APPROVED FOR EXECUTION** — Phase 0 cleared to start

---

## Changelog from v1

- Ricky confirmed: SKU remediation for all 456, but in batches (not one shot)
- Ricky confirmed: primary success metric is **£10k weekly revenue**
- Ricky confirmed donor-compatible parts: LCD, T-con, Battery, Trackpad, Charging port
- Codex QA: fixed split-brain claim (`buy_box_monitor.py` and `buy-box-check.js` are different subsystems, not duplicates — trade-in buy-side vs resale sell-side)
- Codex QA: removed stale Phase 0 tasks that are already fixed in code (pub_state retry, display_value reads, buyer identity handling)
- Codex QA: `reconcile-listings.js` has no `--dry-run` flag today — must be built, not just scheduled
- Codex QA: `listings-audit.js` has bugs (omits colour, wrong A-number maps) — must be rebuilt before any bulk SKU remediation
- Codex QA: grade classifier issue is wrong mappings, not missing ones — full mapping audit needed, not a 20-line add
- Codex QA: `sync_tradein_orders.py` has hardcoded Basic auth — must be removed before cron
- Codex QA: `text_mkyd4bx3` clear fires on all three events (sale acceptance, shipment, return) — split across the right services
- Phase re-sequence: stuck inventory triage pulled to **Phase 1** (was Phase 5). Cash release doesn't need donor engine or Telegram bot.
- Added per-phase rollback and canary strategy (Codex QA critical issue #6)

## Changelog from v2 → v3

- **Added returns module (Phase 4.9).** Returns have no known API endpoints and must be handled via browser automation of the BM seller portal. Scope: incoming only (buyers returning devices we sold them), ~1-2/week, two sub-types (change-of-mind vs return-for-repair).
- **Restructured Phase 4 around a shared browser automation runtime.** Both SKU fixes (one-off bulk) and Returns (ongoing polling) ride the same Playwright infrastructure — one codebase, pluggable operations, proven selectors before expansion.
- **Resolved the RTN data model.** On return: clear `text_mkyd4bx3` and sold fields on the original BM Devices item, move to "Returned" group, add return-reason note. On relist (after QC pass): reuse the same BM Devices item, new listing_id written. Preserves cost history and the "one BM item" principle.
- **Fixed 3 Codex v2 pre-flight conditions:**
  - Phase 0.6 now names Phase 4.9 as the concrete return-handler target; until then, the returns clear is explicitly manual with documented handoff steps.
  - Phase 0.10 + Critical files section now consistent on SOP 10/11 (remove dangling SOP 11 references only, keep other SOP 10 content intact).
  - Phase 0.6 now includes an explicit `sale-detection.js` shadow-test procedure with rollback commands.
- **Addressed Codex v2 partials:**
  - Phase 5.3 orchestrator now forecasts by actual part consumption (via `populate_60d_usage.py`), scores multi-shortage donors, and caps Cat C slots by workshop harvest labour capacity.
  - Phase 4 includes explicit rollback mechanics for one-way mutations (browser edits can't be dual-run, so we use pre-change snapshot + post-change audit + scripted revert of each listing's SKU via the same runtime).
  - Phase 4.8 batch rollout now has concrete wait windows (24h between batches), post-batch audit gates, and named go/no-go criteria.
  - Phase 1 canonical artifact: **CSV with a defined schema** (`stuck-inventory-YYYY-MM-DD.csv`) — both produced by the audit script and consumed by the executor, with `item_id` as the primary key and an `ACTION` column that must be populated before executor runs.
- **New Codex pre-flight task:** verify whether BM has any returns API endpoint (buybacks or marketplace sides) that has come online since Ricky's last check. Phase 4.9 design pivots on this.

## Changelog from v3 → v4

- **Note 1 closed:** Phase 4.9 introduces explicit `PROPOSE` and `AUTO` modes. In PROPOSE mode (default for first 2 weeks + all `UNKNOWN` cases forever), NO Monday mutations happen before Ferrari/Ricky confirms the Telegram card. "Read-only" wording replaced with accurate "human-gated" framing.
- **Note 2 closed:** Phase 4.9 Monday-side rollback added — `applied_mutations` table in `browser.db` records every column write with prior_value; `run-returns.js --rollback --mutation-id N` or `--last N` replays priors. Rollback drill required before AUTO mode.
- **Note 3 closed:** Shared browser runtime now enforces single-operation filesystem lock at `data/.runtime.lock`. Concurrent runs exit cleanly. Stale-lock detection after 30 min + no process.
- **Note 4 closed:** Orphan-return closure step added. Ferrari hits a "Link to BM Devices item" Telegram button on resolved orphans; button applies the same BM Devices reset as matched cases and records it in `applied_mutations`.
- **Note 5 closed:** Selector-validation sprint now has explicit pass/fail criteria — 6 named pages, named selectors per page, cached snapshots for unit tests, Ricky signed-off doc. Fail criteria halt runtime launch. Screenshot retention policy: 90-day auto-prune, anomaly screenshots archived indefinitely.

## Changelog from v4 → v5 (final)

- **Note 2 fully closed:** rollback now covers item creation and group moves, not just column writes. `applied_mutations.operations_json` schema handles `column_write`, `item_create`, `item_move` with inverse semantics per type.
- **Path inconsistency resolved:** Critical Files section clearly divides `backmarket/scripts/` (data + audit + REST API scripts) from `backmarket-browser/` (Playwright-driven portal operations). Import direction rule: browser → scripts allowed, never reverse.
- Codex final verdict: **APPROVED FOR EXECUTION.** Phase 0 cleared to start.

---

## Context

BackMarket is ~60% of iCorrect's revenue. Weekly target: **£10k MacBook sales**. Actual: £4-5k. This plan fixes the gap.

**Real issues surfaced by the audit:**

1. **Strategy is written but not wired into code.** `kb/backmarket/acquisition-policy.md` (verified 2026-04-07) says NO BID on GOLD/PLATINUM/DIAMOND. `docs/historical/buyback-optimisation-plan.md` (Feb 27) set £200 minimum net. Neither is enforced — `buy_box_monitor.py` still bumps GOLD bids; `buy-box-check.js` and `list-device.js` still propose at £50 net.

2. **Grade classifier mappings are wrong, not missing.** `bm-grade-check` (port 8011) has mappings for all current A-numbers, but some are incorrect (A2991/A2992 disagree with the repo's own title-pattern map). Modern repairs fall through or get classified against the wrong scraper model family.

3. **V7 scraper produces data but detects nothing.** 27 consecutive daily snapshots on disk. A2338 recovery (£460→£525) and A2337 Air drift (£418→£385) both visible. No script compares days, no alert fires when a grade price moves.

4. **Intel→M-series parts retrofit is iCorrect's real moat.** Workshop-confirmed parts (Ricky, 2026-04-17): LCD, T-con swap, Battery (A2159/A2289→A2338), Trackpad, Charging/USB-C port. `kb/monday/parts-board.md` (status: "needs-source-verification") supports LCDs; other parts rely on Ricky's workshop knowledge until Codex research (Phase 3.2) documents them.

5. **20-slot/day trade-in cap makes bidding a portfolio problem.** System posts bids without considering whether incoming mix serves direct revenue (Cat B) or cost reduction (Cat C donors).

6. **Market collapsed after M5 Neo launch and nothing alerted.** 100+ stuck devices bleeding losses. Parts costs held while sell prices fell. No auto-freeze when grade prices drop.

7. **Two "buy box" systems with confusingly similar names:**
   - **`buy_box_monitor.py`** — buy-side: trade-in bids (`/ws/buyback/v1/…`). Wins the customer's device.
   - **`buy-box-check.js`** — sell-side: resale listings (`/ws/listings/…`, `/ws/backbox/…`). Wins the customer's purchase.
   They are NOT duplicates. Both stay live. Plan edits both for different reasons.

**Intended outcome:** enforce written policy in live code; stop the bleed on stuck inventory; add trend intelligence; build Intel donor strategy; category-aware bidding; replace Hugo with a lean Telegram app (no LLM in the bot). **£10k/week becomes deterministic.**

---

## Delegation model

**Coding → Codex subagents** (isolated git worktree, I review diff before merge).
**Architecture, integration, decisions → Claude Code + Ricky.**
**Business judgement → Ricky.**

Standard workflow per script: I write detailed spec → spawn Codex with `isolation: worktree` → Codex implements → I review + dry-run against real data → Ricky approves deploy → I wire into cron.

**LLM-in-the-system:** Only one production LLM call — the weekly trend narrative (Phase 2.2). Anthropic Claude Sonnet via direct API, same pattern as CS bot. One call per week, pennies.

---

## Strategic frame — three device categories

| Category | Description | Market state | Target margin | Strategy |
|----------|-------------|--------------|---------------|----------|
| **Cat A** | Working devices, light refurb | Broken (post-M5 Neo) | £100+ net best-case | Avoid unless very cheap; blocked at £150 net floor with tight stop-loss |
| **Cat B** | Non-functional M-series (board repair) | Strong — iCorrect's edge | **£200+ net** | Primary revenue driver. Pay up to reach 20/day targets |
| **Cat C** | Intel donors (parts harvest) | Cheap, abundant | £0 direct (cost saving) | Buy to maintain 4-6 week donor-parts stock |

**Success metric (primary): £10k weekly MacBook revenue.**
Secondary signals: weekly net profit, cash released from cleared inventory, donor parts stock weeks of coverage.

---

## Per-phase rollback strategy

Every Phase 0-5 change follows this pattern:

1. **Pre-change snapshot.** Before any mutation: git diff, crontab dump, current script behaviour logged with a dry-run.
2. **Canary.** New scripts run in dry-run / shadow mode for 7 days before going live. New thresholds deploy behind a feature flag or CLI flag first.
3. **Dual-running where possible.** Where replacing live scripts: run old + new side by side, compare outputs, cut over only when delta is zero.
4. **Revert path logged.** For each change, the exact command / file-restore / crontab-line-add needed to roll back within 5 minutes.
5. **Sale-detection is the untouchable.** No Phase 0 or 3 change is allowed to risk `sale-detection.js` cron — it keeps BM orders flowing. Any edit is tested in a separate worktree against historical data first.

Rollback log: `/home/ricky/builds/backmarket/docs/rollback-log.md` — every deploy has an entry.

---

## Phase 0 — Enforce existing policy (Week 1, days)

Goal: wire written policy into live code. No new architecture. Stop the bleed from below.

### 0.1 Wire acquisition policy into buy-side (trade-in)

**Target:** `/home/ricky/builds/buyback-monitor/buy_box_monitor.py` — buy-side bid engine.

**Change:** grade gate before every bump call.
- **HARD BLOCK:** GOLD, PLATINUM, DIAMOND — never bump
- **CAUTION:** SILVER — only bump if full screen replacement cost is baked into break-even (i.e. treated as Cat B)
- **ACCEPTABLE:** BRONZE, STALLONE — bump as normal against the raised thresholds below

**Current gate:** margin ≥ 15% AND net ≥ £50 → bump.
**New gate:** margin ≥ 25% AND net ≥ £200 → bump silent; 15-25% AND net ≥ £150 → bump + Telegram flag; anything below → block.

Rollback: keep old thresholds behind `--legacy-thresholds` CLI flag for 7 days.

### 0.2 Wire policy into sell-side (resale)

**Target:** `/home/ricky/builds/backmarket/scripts/list-device.js` (listing decisions) and `/home/ricky/builds/backmarket/scripts/buy-box-check.js` (resale buybox auto-bump).

**`list-device.js` decision gate:**
- Current: net ≥ £50 AND margin ≥ 15% → propose
- New: net ≥ £150 AND margin ≥ 25% → propose; net ≥ £100 → propose with explicit `--min-margin` approval
- Loss-maker override remains via `--min-margin 0` for clearance

**`buy-box-check.js` auto-bump gate:**
- Same thresholds as `list-device.js` for consistency (≥ £150 net for auto-bump to fire)

Rollback: CLI flag `--legacy-gates` and env `BM_THRESHOLDS_VERSION=v1` honoured for 7 days post-deploy.

### 0.3 Grade classifier mapping audit (not "add missing")

**Target:** `/home/ricky/builds/backmarket/services/bm-grade-check/index.js`

Codex QA corrected an earlier misdiagnosis: the A-number map already contains all modern models. The real problems are (a) some mappings disagree with the repo's own title-pattern map (A2991/A2992 specifically), and (b) the derived scraper-model family is sometimes wrong.

**Fix:** Codex builds a single-source-of-truth `A_NUMBER_MAP.json` consumed by both `bm-grade-check/index.js` and `listings-audit.js`. Audit every mapping against:
- BackMarket's published model family labels (via V7 scraper output)
- iFixit teardown canonical model names
- iCorrect's Parts Board part naming conventions

Output: spec-compliant map + regression test suite (feed 30 known devices through the classifier, assert expected scraper model lookup).

Rollback: map lives in a single file; git revert restores previous state instantly.

### 0.4 Trade-in order sheet sync to cron — with creds fix

**Target:** `/home/ricky/builds/buyback-monitor/sync_tradein_orders.py`

**Blocker (Codex QA):** line 29 contains a hardcoded Basic-auth BM credential. **Cannot go on cron until removed.**

**Fix sequence:**
1. Move the credential from hardcoded string to `BACKMARKET_API_AUTH` env var (same source as other BM scripts).
2. Test manually end-to-end against the Google Sheet (`1A7-NSlqFeCZmS73i2xO-NqlB2wD_lc53V6BxKGjNW2g`).
3. Only then add to crontab at 05:30 UTC daily.

Rollback: crontab line removed; script still callable manually. Credential rotation note filed in `rollback-log.md`.

### 0.5 Schedule missing scripts (where they exist and work)

- `buy-box-check.js` default mode IS already check-only (no `--check-only` flag needed — Codex QA nit). Add to cron at 06:30 UTC daily weekdays.
- `morning-briefing.js` posts to **Slack** (not Telegram — Codex QA nit). Still useful; schedule at 08:00 UTC weekdays but route new Telegram notifications via a different wrapper once Phase 6 builds the Telegram UI.
- **`reconcile-listings.js` is NOT scheduled here.** The script has no `--dry-run` flag today (Codex QA critical issue #1). Running it in cron as-is would mutate live data. See Phase 0.7.

### 0.6 Clear `text_mkyd4bx3` on all three lifecycle events

**Root cause:** ISSUE-005 — stale listing_id in `text_mkyd4bx3` on BM Devices board causes reconciliation false positives and sale-detection ambiguity.

**Column confirmed:** `text_mkyd4bx3` on BM Devices Board (3892194968), label "BM Listing ID", stores numeric listing_id. Verified in `kb/monday/bm-devices-board.md`, SOP 00, SOP 06.5.

**Fix:** belt-and-braces clearing at all three events (Ricky's call + Codex QA critical issue #4):

| Event | Which service fires | Clears `text_mkyd4bx3`? | Phase |
|-------|---------------------|-------------------------|-------|
| Sale accepted | `sale-detection.js` (hourly cron) | Yes | Phase 0.6 |
| Shipment confirmed | `bm-shipping` webhook (port 8013, SOP 09.5) | Yes | Phase 0.6 |
| Return processed | `backmarket-browser/operations/returns.js` (Phase 4.9 returns operation) | Yes | **Phase 4.9** |

**Return-handler gap (Codex pre-flight):** there is no automated return handler today. SOP 12 is currently fully manual (Ferrari reviews BM CS tab, creates Monday items by hand). Until Phase 4.9 lands, the `text_mkyd4bx3` clear on returns is **manual**, documented in the interim SOP 12 runbook:

> **Interim return handoff (Phase 0 → Phase 4.9):**
> When Ferrari creates a new Main Board item for a returned device, the SOP runbook requires him to locate the corresponding BM Devices item (by listing_id or serial) and manually empty `text_mkyd4bx3`, set `text4` (Sold to) to empty, and move the item to the "Returned" group. Document this in `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md` as an explicit manual step.

Phase 4.9 automates this handoff fully.

**Redundancy is safe.** Each fire-point is independent — clearing an already-empty column is a no-op. If sale-detection runs first and clears, then shipping confirmation runs and attempts to clear the same field, there's no error and no data loss.

### 0.6a `sale-detection.js` shadow-test procedure (Codex pre-flight)

`sale-detection.js` is the untouchable hot path — if it breaks, BM orders stop flowing, directly impacting revenue. Before Phase 0.6's `text_mkyd4bx3` clear gets deployed, run this shadow-test:

1. **Worktree isolation.** Codex's implementation lands in a git worktree, not the live script.
2. **Historical replay.** Run the modified worktree version against the last 30 days of BM orders (pulled from `/home/ricky/logs/cron/sale-detection.log` + BM API history). Assert:
   - Every order that was accepted historically is still matched and accepted
   - Every `noMatch` case is still flagged correctly
   - New behaviour: post-accept, `text_mkyd4bx3` is empty on the affected BM Devices item
   - No new exceptions, no new log warnings, no changes to Telegram alert counts
3. **Parallel live run (canary).** For 24 hours, run the modified script alongside the live script in shadow mode (modified reads the same orders, logs what it would do, does NOT call BM API or Monday mutations). Compare outputs row-by-row. Zero deltas = green.
4. **Cutover with revert standing by.** Replace the live script. Monitor the next scheduled run explicitly. Revert command staged:
   ```bash
   # Rollback command, kept in rollback-log.md
   git -C /home/ricky/builds/backmarket checkout HEAD~1 -- scripts/sale-detection.js
   # Verify with next hourly cron, or manual test:
   cd /home/ricky/builds/backmarket && node scripts/sale-detection.js --dry-run
   ```
5. **Post-cutover watch.** First 3 hourly runs monitored live by Claude Code. Any anomaly → immediate revert, no discussion.

Rollback log entry template captured in `/home/ricky/builds/backmarket/docs/rollback-log.md`.

### 0.6b `bm-shipping` webhook edit (lower risk)

The shipment-confirmation webhook service fires on-demand (webhook from Monday), not on cron. Lower risk than sale-detection. Follow a simpler pattern:
1. Worktree implementation
2. Unit test the new clear logic against 10 synthetic shipment events
3. Deploy; verify next real shipment event fires the clear correctly
4. Revert: restart systemd service with prior binary; webhook still works

### 0.7 Build `reconcile-listings.js --dry-run` mode

**Critical prerequisite for Phase 4.** The script currently performs live offlining/backfill actions in its main path. Phase 4 audit + reconciliation depends on a trustworthy dry-run.

**Codex spec:**
- Add `--dry-run` flag that disables all mutation paths (Monday writes, BM listing updates).
- Add `--live` flag that explicitly enables mutation (mutation off by default — fail safe).
- Log every would-be action with structured JSON output to `data/reconcile-dry-run-YYYY-MM-DD.json`.
- Existing behaviour preserved behind `--live` flag for existing users.

Rollback: file revert; old behaviour restored.

### 0.8 Fix broken buyback daily cron

**Target:** `/home/ricky/config/api-keys/.env` — `JLL_EMAIL_REM_PASS=B>dk7f1:_6$1` unquoted, trips `set -u` in `run-daily.sh`.

**Fix:**
1. Quote the value in `.env`.
2. Add failure alerting via `telegram-alert.py` so silent failures are visible.
3. Fix the output path conflict: `buy_box_monitor.py` writes to `/home/ricky/.openclaw/agents/main/workspace/data/buyback/` but `run-daily.sh` reads from `/home/ricky/builds/buyback-monitor/data/buyback/`. Pick one canonical path (prefer `/builds/buyback-monitor/data/`) and fix both.

### 0.9 Remove dead crons

- `*/15 * * * * sync-token.sh` — superseded by CLI backend migration
- OpenClaw `bm_board_housekeeping.py` — duplicates plain-cron `board-housekeeping.js`

### 0.10 Document SOP changes

- **SOP 05 (QC)** — currently missing. Write a minimal placeholder SOP that documents the existing manual QC → Final Grade process, even if automation is out of scope for now.
- **SOP 11 (Tuesday Cutoff)** — removal from the active SOP set is fine (Ricky's call). Two precise wording changes required:
  1. **SOP 10 body:** remove only the dangling inline reference to SOP 11 (Codex QA nit). Keep all other SOP 10 content unchanged — the SOP itself stays live.
  2. **SOP 00 master index:** remove the SOP 11 row from the master table. Do not touch SOP 10's row or content.
- **SOP 12 (Returns)** — add the interim manual `text_mkyd4bx3` handoff step (Phase 0.6 runbook above), clearly marked as a Phase 0 stopgap that Phase 4.9 will automate.

### 0.11 Verify stale tasks that Codex flagged as already-done

Before Phase 0 is declared complete, Claude Code verifies against live code:
- `list-device.js` already has pub_state retry ✅ (verified in diff: line 1884-1896)
- `reconcile-listings.js` already reads `display_value` correctly ✅ (verified: lines 260, 264, 266)
- `sale-detection.js` buyer identity handling — verify against ISSUE-001 repro; add note to `CHANGELOG.md` confirming status

**Phase 0 deliverables:**
- Policy wired into 3 scripts (buy-side, sell-side listing, sell-side resale buybox)
- Grade classifier mapping audited with test suite
- 3 missing or fixed crons scheduled
- Secure `sync_tradein_orders.py` with creds from env
- `reconcile-listings.js --dry-run` built (unblocks Phase 4)
- `text_mkyd4bx3` clear wired on all 3 events
- Dead crons removed
- SOP 10 no longer references SOP 11
- All changes in `/home/ricky/builds/backmarket/CHANGELOG.md` with rollback commands in `rollback-log.md`

---

## Phase 1 — Stuck inventory triage (Week 1) — PULLED FORWARD

Goal: cash release from 100+ stuck devices. Doesn't need donor engine or Telegram app — just scripts + Ricky's decisions.

### 1.1 Enumerate

New `scripts/stuck-inventory-audit.js` (Codex-built):
- All BM Devices board items with status `To List` or `Listed` and age > 14 days
- Per item: cost basis (purchase + parts + labour + shipping), days-since-listed, current live market price (from scraper), proposed action

**Canonical artifact (Codex QA v2 concern resolved):** CSV at `/home/ricky/builds/backmarket/data/stuck-inventory-YYYY-MM-DD.csv` with a fixed schema:

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `item_id` | numeric | Yes (PK) | BM Devices item ID |
| `listing_id` | numeric | No | empty if not currently listed |
| `main_board_item_id` | numeric | Yes | Link for status updates |
| `device_name` | text | Yes | "MBA 13 M1 8/256 Grey" |
| `sku` | text | Yes | canonical SKU |
| `grade` | text | Yes | Fair/Good/Excellent |
| `cost_basis_gbp` | numeric | Yes | purchase + parts + labour + ship |
| `days_listed` | numeric | Yes | from date_listed |
| `market_price_gbp` | numeric | Yes | latest scrape |
| `proposed_action` | text | Yes | `LIST_AT_LOSS` / `SALVAGE` / `LOGIC_BOARD_DONOR` / `SCRAP` (seeded by script) |
| `ACTION` | text | **populated by Ricky** | Same options as `proposed_action`; must be filled before executor runs |
| `notes` | text | No | Ricky's override reasoning |

**Idempotent re-runs.** If the audit is re-run on the same day, it overwrites the CSV but preserves any `ACTION` + `notes` columns Ricky already populated (keyed by `item_id`). If Ricky's action conflicts with a newly-refreshed `proposed_action`, the CSV flags the row with a `CONFLICT` prefix in the notes — Ricky reviews.

Also emits a JSON mirror at `data/stuck-inventory-YYYY-MM-DD.json` for downstream scripts, plus a Telegram summary (counts per action, total £ at risk) for at-a-glance status.

### 1.2 Triage categories

For each stuck device, one of:
- **LIST AT LOSS** — accept loss to recover cash. Call `list-device.js --min-margin 0` or lower existing live price to current market floor.
- **SALVAGE FOR DONOR STOCK** — if the device contains Cat C-donor parts (screen, T-con, battery, trackpad, charging port) that serve current Cat B demand: harvest rather than sell at loss. Move to Parts Board via new "salvage" flow (ties into Phase 3 infrastructure — can be a manual entry until that exists).
- **LOGIC BOARD DONOR** — M-series that can't economically repair whole but has usable board components. Rare.
- **SCRAP** — not worth shelf space; recycle.

### 1.3 Batch execution

- Enumerate runs once, outputs a spreadsheet/Telegram summary.
- Ricky reviews, annotates action per device (column: `ACTION`).
- Script reads annotated file, executes in batches of 10-20 with logging per batch.
- No LLM; pure deterministic execution against Ricky's decisions.
- Telegram UI for batch approval comes in Phase 6; for now, CLI + CSV workflow is sufficient.

### 1.4 Freeze new inventory during triage

While triage is running, apply Phase 0.1 thresholds aggressively: reject any new Cat A bids that would add to the pile.

**Phase 1 deliverables:**
- Every stuck device has a documented triage decision
- Cash released from listings sold at loss
- Donor parts inventory seeded from salvaged stock (feeds Phase 3)
- BM board cleared of aged loss-makers

---

## Phase 2 — Trend intelligence (Week 2)

Goal: the system notices market moves and alerts.

### 2.1 Daily scraper diff + alert

New `scripts/scraper-diff.js` (runs 05:45 UTC after V7 scraper):
- Load today's `sell-prices-YYYY-MM-DD.json` and yesterday's
- Compute per-model, per-grade delta
- Flag day-over-day moves > 5%; week-over-week > 10%
- Detect and suppress scraper error spikes (e.g. A2338 £899 readings inconsistent with ±20% 7-day median — anomaly, not price move)
- Output: `data/trend-alerts-YYYY-MM-DD.json` + Telegram summary

### 2.2 Weekly trend narrative (the one LLM call)

New `scripts/weekly-trend-report.js` (runs Monday 07:30 UTC):
- Input: 7-day scraper deltas, live inventory counts, last week's completed sales (by SKU), donor parts stock, anomaly flags
- LLM: Anthropic Claude Sonnet via `@anthropic-ai/sdk` (direct API, prompt caching)
- Structured prompt → narrative output
- Posts to Telegram as Monday briefing
- Cost: ~pennies/week

Example output: "MacBook Pro 13 M1 (A2338) recovered 14% WoW after a two-week dip. Good grade £525, back in profitable range. Air 13 M1 (A2337) continues downward — Good £385, another 2% fall; parts costs unchanged, Cat A M1 Air listings at current prices will run negative. Recommend: bump Cat B A2338 bids toward recovery; freeze Cat A M1 Air bids; lower existing M1 Air listings aggressively."

### 2.3 Market-shift auto-freeze

New `scripts/market-freeze.js` (runs daily 06:00 UTC after scraper diff):
- Rule: any Cat A grade price drops > 10% WoW → auto-freeze new Cat A bids on that model for 7 days
- Writes freeze state to `data/freeze-state.json`
- `buy_box_monitor.py` reads freeze state and blocks bumps on frozen SKUs (Phase 0.1 Python change adds this read)
- Telegram alert on freeze and unfreeze

### 2.4 Parts Board data quality prerequisites

Before Phase 3 uses parts usage data:
- Re-run `populate_60d_usage.py` to refresh usage numbers (currently 16+ days stale)
- Ricky + team recount the 30+ items showing negative stock
- Fix Parts → Main Board writeback so techs see deducted parts
- Document intake SOP (undocumented since Adil's departure; Andres covers)

---

## Phase 3 — Intel Donor Strategy (Week 2-3)

Goal: build the Cat C layer. Highest-leverage module because it attacks cost not revenue.

### 3.1 Compatibility matrix — confirmed + researched

**Confirmed compatible (Ricky's workshop + Parts Board evidence):**

| Donor | Target | Part | Method | Source |
|-------|--------|------|--------|--------|
| A1932 (2019 Intel Air) | A2337 (M1 Air) | LCD display | T-con swap | `kb/monday/parts-board.md` (status: needs source-verification) + workshop |
| A2179 (2020 Intel Air) | A2337 (M1 Air) | LCD display | T-con swap | Same |
| A2251 (Intel 13" Pro 4-port) | A2338 (M1/M2 13" Pro) | LCD display | T-con swap | Same |
| A2289 (Intel 13" Pro 2-port) | A2338 (M1/M2 13" Pro) | LCD display | T-con swap | Same |
| — | — | **T-con board itself** | Harvest standalone | Workshop-confirmed |
| A2159 / A2289 | A2338 | Battery (A2171) | Direct swap | Parts Board SKU grouping + workshop |
| A1932 / A2179 | A2337 | Battery (A1965) | Same battery | Parts Board SKU grouping |
| Intel MBAs | M1/M2 MBAs | **Trackpad** | Workshop-confirmed | Ricky 2026-04-17 |
| Intel MBAs / Pros | M-series same size | **Charging/USB-C port** | Workshop-confirmed | Ricky + Parts Board combined SKUs |

**Confirmed NOT compatible:**
- Top case / keyboard (Apple design change)
- Speakers (separate parts per model)

**Needs Codex research (Phase 3.2):**
- Yield rates per confirmed-compatible part type (% of donors where harvest is clean)
- Labour time per retrofit (T-con swap vs. direct swap)
- Bezel / display housing beyond LCD assembly
- Hinges
- Non-LVDS flex cables
- A2681 (M2 Air) Intel donor mapping — no compatibility data exists
- A2442 / A2485 (M1 Pro 14"/16") Intel→M-series — did any Intel Pro 15"/16" parts retrofit?

### 3.2 Codex research agent — compatibility deep-dive

Spawn Codex research agent with scope:
- iFixit teardowns for A1932, A2179, A2251, A2289, A2337, A2338, A2681, A2442, A2485
- Apple service manuals where accessible
- Repair community sources (Louis Rossmann, Polar Bear Tech, r/mac repair)
- For each part × donor × target: confirmed / likely / incompatible with source links
- Yield rate estimates where community data exists

Output: `/home/ricky/kb/backmarket/intel-donor-compatibility.md` — comprehensive matrix. Reviewed by Ricky before wiring into valuation engine.

### 3.3 Parts Board schema additions

Add columns to Parts Board (985177480):
- `source` (status: `new-from-china`, `harvested-from-donor`, `supplier-other`)
- `donor_origin_item_id` (text: BM Devices item ID that this part came from)
- `harvested_cost_basis` (numeric: allocated £ share of donor's purchase price)
- `compatibility_tags` (text: comma-separated target A-numbers)

### 3.4 Donor valuation engine

New `scripts/donor-valuation.js`:

Input: candidate Intel device (A-number, spec, grade, current BM bid price).

For each retrofittable part (LCD, T-con, Battery, Trackpad, Charging port):
- Base value = China replacement cost (from supplier data)
- Yield factor = % of donors where this part harvests cleanly (from Codex research)
- Labour factor = harvest + retrofit time × £24/hr
- Internal value = (base × yield) − labour − allocated overhead

Sum internal values − chassis disposal cost − warranty risk buffer = **maximum bid**.

Example (notional, to be recalibrated after Phase 3.2 research):
```
Donor: A2179 Intel MBA, 8/256, STALLONE (non-func cracked)
  LCD → A2337 retrofit: £150 base × 0.85 yield, 30min labour → £116 net
  T-con board: £30 base × 0.95 yield → £28
  Charging port: £25 × 0.95 → £22
  Battery A1965: £0 (no demand — only fits Intel siblings)
  Trackpad: £15 × 0.70 yield → £10
Gross harvest: £176
- Harvest + retrofit labour (1.5hr): £36
- Chassis disposal: £2
- Warranty buffer (10%): £14
Max bid: £124
```

### 3.5 Donor inventory + consumption tracking

New `scripts/donor-inventory-report.js` (Sundays):
- Query Parts Board for all `source = harvested-from-donor`
- Group by part type and target model
- Compare to 60-day consumption rate (from `populate_60d_usage.py` output)
- Output: weeks of coverage per donor part
- Flag shortages: "Screens A2337: 2.1 weeks stock — bid up on A1932/A2179 donors"

### 3.6 Live donor purchasing starts

While Phase 3.4/3.5 tooling is being built, Ricky manually begins purchasing Intel donors at known-good prices (guided by draft valuation engine output):
- Target: 3-5 donors/week for first 2 weeks
- Manual approval per listing
- Feeds real consumption data for Phase 5 orchestrator calibration

---

## Phase 4 — Browser Automation Runtime + SKU Reconciliation + Returns (Week 3-5)

Goal: build the shared browser-automation infrastructure BM didn't give us an API for, then ride two operations on it — bulk SKU reconciliation and ongoing returns processing. One runtime, many operations.

### 4.1 Canonical SKU format spec

New `/home/ricky/builds/backmarket/docs/SKU-FORMAT-SPEC.md`:

```
MacBook Air:  MBA.{A-number}.{Chip}.{GPU-cores?}.{RAM}.{Storage}.{Colour}.{Grade}
              e.g. MBA.A2337.M1.7C.8GB.256GB.Grey.Fair
              e.g. MBA.A2681.M2.8GB.256GB.Midnight.Good

MacBook Pro:  MBP.{A-number}.{Chip}.{RAM}.{Storage}.{Colour}.{Grade}
              e.g. MBP.A2485.M1PRO.16GB.512GB.Grey.Fair
```

Locked decisions (same as v1):
- Colour stays in SKU
- Canonical colours: `Grey`, `Silver`, `Gold`, `Midnight`, `Starlight`, `Space Black`, `Black`
- `Space Gray` / `Space Grey` / `SpaceGrey` → `Grey`
- GPU cores only where variants exist at same A-number
- Grade: `Fair` / `Good` / `Excellent`
- A-numbers validated against device model name before accepting

### 4.2 Fix `listings-audit.js` (prerequisite — Codex QA critical issue #2)

**Current state:** audit tool intentionally omits colour from "correct SKU" (because BM titles don't expose colour), and has wrong model mappings (e.g. `Pro 13" 2022 M2 → A2681`).

**Fix:**
- Rebuild canonical-SKU derivation to read colour from BM Devices board (`status8` mirror), not BM listing title
- Replace inline A-number map with the single-source-of-truth JSON built in Phase 0.3
- Add regression test: feed 30 known live listings, assert correct canonical SKU derivation

Only once this passes regression can we trust the mismatch baseline.

### 4.3 Registry audit

New `scripts/audit-registry-sku-format.js`:
- Iterate all 264 slots in `listings-registry.json`
- Classify each as `spec-compliant`, `spec-drift`, `catalog-gap`, or `ambiguous`
- Output: `data/registry-audit-YYYY-MM-DD.json`

### 4.4 Live listings audit v2

Rerun the fixed `listings-audit.js`. Real mismatch count (no longer 456 based on the broken tool — could be higher or lower). Classify each as:
- `matches-spec`
- `mismatch-fixable` (rename fixes it, product_id correct)
- `mismatch-structural` (wrong product_id; needs Path B re-create)
- `catalog-gap` (format right, combination not in catalog)

### 4.5 Remove dead Step 12b from `list-device.js`

Lines 1902-1920 currently log false-positive "SKU updated" messages for an API path that silently fails. Either remove or convert to advisory log.

### 4.6 Build shared browser-automation runtime

**New module:** `/home/ricky/builds/backmarket-browser/` — Playwright-based automation runtime that multiple operations ride.

```
/home/ricky/builds/backmarket-browser/
├── lib/
│   ├── session.js              # Login, cookie persistence, session refresh, 2FA handling
│   ├── selectors.js            # Single source of truth for BM portal CSS selectors
│   ├── portal-client.js        # High-level portal API (goToListing, editField, submitReturn, etc.)
│   ├── rate-limiter.js         # 2-3s between actions, configurable per operation
│   ├── screenshots.js          # Auto-screenshot on every action for audit trail
│   └── db.js                   # SQLite for checkpoints + operation history
├── operations/
│   ├── fix-sku.js              # Operation: bulk SKU rename (Phase 4.7)
│   └── returns.js              # Operation: incoming returns polling (Phase 4.9)
├── scripts/
│   ├── run-fix-sku.js          # CLI: one-off bulk SKU rename runner
│   └── run-returns.js          # CLI: single-pass returns poll (called from cron)
├── deploy/
│   ├── returns-poller.cron     # Cron for returns polling
│   └── .env.example            # BM_SELLER_PORTAL_EMAIL, BM_SELLER_PORTAL_PASSWORD
└── data/
    ├── browser.db              # SQLite: operations_log, checkpoints, seen_returns
    └── screenshots/            # Per-run audit trail
```

**Shared infrastructure:**
- Login sequence with session cookie persistence (avoids logging in on every run)
- Session health check before every operation; re-login if expired
- Selector library that's unit-tested against cached page snapshots
- Rate limiting (2-3s between actions, configurable)
- Automatic screenshots on every mutation for audit
- SQLite-backed checkpointing so operations resume cleanly after failure
- Centralised selector-drift detection: if the DOM changes and selectors fail, all operations halt with alert

**Credentials:** `BM_SELLER_PORTAL_EMAIL` / `BM_SELLER_PORTAL_PASSWORD` in `/home/ricky/config/api-keys/.env` (not committed). Dedicated seller login preferred — if that's not possible, Ricky's primary login. Session reuse across operations prevents login storms.

**Concurrency (Codex v3 note #3):** the shared runtime enforces single-operation serialization. Any `fix-sku` or `returns` run acquires a filesystem lock at `/home/ricky/builds/backmarket-browser/data/.runtime.lock` before touching the session or `browser.db`. Second run attempting the lock:
- Logs "runtime busy, skipping this tick" and exits cleanly (for cron-driven `returns`)
- Errors with instructions (for manual `fix-sku` runs)

Lock is held for the full operation duration and released in a `finally` block even on crash. Stale-lock detection: if the lock is older than 30 min and no matching Node process is running, a new operation can steal it. This prevents one session hitting both the seller portal CS tab and a listing edit page concurrently (which would corrupt session state and break selectors).

**Selector-validation gate (Codex v3 note #5).** Before any operation ships, Ricky + Claude Code run a concrete validation session with measurable pass/fail. Pages + selectors + expected behaviours listed explicitly:

**Required pages to exercise:**
1. Login page — selectors: email input, password input, submit button, 2FA prompt (if present)
2. Dashboard / landing — selector: navigation confirms successful login
3. Listings index — selectors: listing row, listing_id cell, filter/search input
4. Individual listing edit page — selectors: SKU field, save button, success toast, error toast
5. Customer Service / Returns tab — selectors: return list, return row, order_id cell, message body, customer name, tracking field, "new since last visit" indicator
6. Individual return detail — selectors: full message history, accept button, reject button, message customer textarea

**Pass criteria per page:**
- Every listed selector resolves to a unique DOM element on the live page
- Selector survives across 3 different example entries (not just one lucky row)
- Runtime's portal-client method for that page executes end-to-end without errors
- Screenshot captured, stored in validation doc folder

**Pass criteria for the session overall:**
- All 6 pages have signed-off selectors captured
- Cached page snapshots saved to `/home/ricky/builds/backmarket-browser/test/fixtures/` for unit tests
- `selector-validation-YYYY-MM-DD.md` includes each selector, the element it targets, the example entry used, and a screenshot filename
- Ricky explicitly signs off in the doc

**Fail criteria (any one = halt):**
- A selector resolves to multiple elements (ambiguous, brittle)
- Portal requires 2FA that can't be scripted without user interaction (design change needed before proceeding)
- DOM structure obviously differs between listing types in a way one selector can't handle
- Login session doesn't persist across operation invocations within the same day

If fail: the runtime launch is paused. Either we redesign (e.g. add 2FA handling) or we wait for Ricky to work with BM on access. No operations run against an un-validated runtime.

**Screenshot retention policy.** Per-mutation screenshots are stored at `data/screenshots/YYYY-MM-DD/<operation>/<run_id>/` for 90 days, then auto-pruned by a weekly cron (`find ... -mtime +90 -delete`). Prior to prune, any batch with a flagged anomaly has its screenshots moved to `data/screenshots/archived/` indefinitely for audit.

### 4.7 Operation A — bulk SKU rename

`operations/fix-sku.js` — one-off bulk rename.

Input: CSV of `{ listing_id, current_sku, correct_sku }` from the Phase 4.4 audit.

Flow per listing:
1. Session check (login if needed)
2. Navigate to listing page
3. Pre-change snapshot: read current SKU field, capture screenshot
4. Edit SKU field to `correct_sku`
5. Save
6. Post-change verification: reload, confirm SKU now matches `correct_sku`, capture screenshot
7. Log outcome to `browser.db`; update checkpoint
8. Rate-limit pause (2-3s)
9. Next listing

**Rollback for one-way mutations (Codex v2 partial):** browser edits can't be dual-run, but they CAN be reversed by running the same operation with swapped source/target:
- Every successful SKU change writes a reverse-record: `{ listing_id, new_sku: correct_sku, old_sku: current_sku }` to `browser.db`
- Emergency rollback command: `node scripts/run-fix-sku.js --rollback --batch-id <N>` replays the reverse-records, restoring every listing in batch N to its pre-change SKU
- Tested against a 2-listing synthetic batch before the first real rollout

### 4.8 Batched SKU rollout (explicit gates)

Not one-shot. Batches with named go/no-go between each:

| Batch | Size | Wait after | Go criteria for next batch |
|-------|------|-----------|----------------------------|
| 1 | 5 listings | 2 hours | Manual visual check on all 5 BM listings; SKU field correct; listing still active qty=1 |
| 2 | 10 listings | 24 hours | Post-batch audit: `listings-audit.js` confirms 5 were fixed + 10 more now fixed; `sale-detection.js` log shows no new `noMatch` introduced; zero Monday writeback errors in cron logs |
| 3 | 25 listings | 24 hours | Same audit passes; Ricky spot-checks 3 random listings manually |
| 4 | 50 listings | 24 hours | Same audit passes; rollback drill completed once (confirm rollback command works on 1 listing, then re-apply fix) |
| 5+ | 100/day cap | 24 hours between | Audit passes every batch; any anomaly pauses rollout |

**Explicit stop criteria (halt and investigate):**
- `sale-detection.js` cron logs show any new `noMatch` for a listing we just touched
- A listing ends up pub_state ≠ 2 after the edit
- Quantity changes unexpectedly on any edited listing
- Portal UI shows a warning or error after save
- Post-change verification step fails on > 2% of listings in a batch

### 4.9 Operation B — incoming returns

`operations/returns.js` — polls BM seller portal Customer Service tab, detects new return requests, creates Monday items, feeds to QC queue.

**Pre-flight task (Codex research):** confirm whether BM has added any returns API endpoints since Ricky last checked. If yes, this operation may be partly or fully replaced by direct API calls (simpler, more robust). Likely outcome: no API, proceed with browser automation. Codex research budget: 1 hour.

**Scope:** incoming returns only (buyer returns a device we sold them). Outgoing returns (we ship back a rejected trade-in) stay manual — ~1-2/week, low enough volume that automation ROI is marginal.

**Sub-types we must distinguish:**
- **Change of mind** — buyer decided they don't want it. Device should be fully functional on arrival.
- **Defective / needs repair** — buyer reports a problem. Device goes through full QC + repair before relist.

Classification signal:
- BM CS tab message content (parsed string matching: "not working", "broken", "issue" → defective; "changed my mind", "no longer needed", "wrong model" → change-of-mind)
- If message absent or ambiguous: flag as `UNKNOWN`, trigger outbound BM message asking the customer ("Could you let us know the reason for the return so we can process it quickly?"), wait 48h for reply, escalate to Ferrari if no response
- Ferrari / Ricky final call via Telegram approval card on any ambiguous case

**Flow per return (polled every 6 hours) — human-gated for first 2 weeks:**

The operation has two modes controlled by a flag in `browser.db`: `PROPOSE` (default, first 2 weeks) and `AUTO` (enabled after 10+ returns processed correctly + Ricky explicit approval).

**In PROPOSE mode, the operation makes NO Monday mutations until Ferrari/Ricky confirms the Telegram card.** It only:

1. Session check
2. Navigate to CS tab
3. Extract all new entries since last poll (`last_seen_ts` stored in `browser.db`)
4. For each entry:
   - Parse order_id, customer name, tracking (if present), message body
   - Classify sub-type (change-of-mind / defective / unknown)
   - Look up the original sold item: BM Devices board item where `text_mkye7p1c` (Sales Order ID) matches — **read-only query**
   - Store the detected return + proposed action in `browser.db` as a `pending_return` row
   - **Post a Telegram card** with: customer name, order ID, parsed message, proposed classification, matched BM Devices item (or `ORPHAN-RETURN` flag), proposed Monday mutations
   - Wait for Ferrari/Ricky button action: `Confirm` / `Reclassify` / `Ask customer` / `Skip`

5. **Only on `Confirm` does a separate worker script execute the Monday mutations:**
   - Create Main Board item with status, issue note, link to original BM Devices item, sub-type flag
   - On the original BM Devices item: clear `text_mkyd4bx3`, clear `text4`, move to "Returned" group
   - Record `applied_mutation_id` in `browser.db` linked to the `pending_return` row (for rollback)
6. Update `last_seen_ts`; release session

**In AUTO mode (Phase 4.9 + 2 weeks, conditional on Ricky approval):** skip step 5's approval wait and auto-apply Monday mutations for `CONFIRMED-CLASSIFIED` cases only. `UNKNOWN` classification always goes through PROPOSE.

**Data model for relisting (RTN device data model, Codex v2 concern resolved):**

Original BM Devices item is the canonical record. Lifecycle:
- `Sold` → `Returned` (on return processed; listing_id cleared)
- `Returned` → QC queue on Main Board
- QC pass + change-of-mind → `Ready to Relist` → new `list-device.js --item <original_bm_devices_id>` run creates new listing_id, writes to same `text_mkyd4bx3`, moves back to `Listed`
- QC fail → Repair queue → after repair → QC → as above
- Refund state tracked via new Monday column `color_returns_refund_state` (status: `Pending` / `Auto-refunded-by-BM` / `Manual-refund-needed` / `Refunded`)

**Schedule:** cron every 6 hours (2 polls during the UK working day, 2 overnight). Low volume means high-frequency polling is wasteful.

**Safety:**
- Human-gated Monday mutations in PROPOSE mode (first 2 weeks + all `UNKNOWN` classifications forever). No Monday writes happen before Ferrari/Ricky confirms the Telegram card.
- BM portal actions (accept/reject return, print return label) stay manual throughout both modes. Phase 4.9 is detect + classify + record; not submit.
- All Monday writes go through the same transaction checkpoint pattern as the SKU rename operation.

**Rollback for Monday-side mutations (Codex v3 note #2):**

Every `applied_mutation` written in step 5 is stored as a reversible record in `browser.db` with the exact Monday operations it applied. Schema:
```
applied_mutations:
  id, pending_return_id, applied_at_ts,
  operations_json: [
    { op: "column_write", board_id, item_id, column_id, prior_value, new_value },
    { op: "item_create", board_id, created_item_id, initial_columns },
    { op: "item_move", board_id, item_id, prior_group_id, new_group_id },
    ...
  ]
```

Rollback replays operations in reverse order with inverted semantics:
- `column_write` → restore `prior_value`
- `item_create` → delete the created item via Monday `delete_item` mutation (or archive if delete is too aggressive — decision made during Phase 4.9 build)
- `item_move` → move item back to `prior_group_id`

The item-create rollback is important because every return processing creates a new Main Board item — without this, a mis-applied return would leave an orphaned Monday item that references a non-existent return.

Emergency rollback:
```bash
# Revert a single mis-applied return
node scripts/run-returns.js --rollback --mutation-id <N>

# Revert last N returns (e.g. after a bad classifier deployment)
node scripts/run-returns.js --rollback --last 5
```

The rollback script replays `prior_value` for every column write in the recorded mutation set. If Ferrari has since made manual edits that conflict, the rollback halts and surfaces the conflict for Ricky review.

Rollback drill mandatory before AUTO mode is enabled: run a synthetic PROPOSE → Confirm → Rollback cycle against a test Monday item, verify state returns cleanly.

**Orphan-return closure (Codex v3 note #4):**

When Ferrari resolves an `ORPHAN-RETURN` manually (finds the original sale via BM sales history export or memory), he records the resolution by triggering a Telegram button: `Link to BM Devices item <item_id>`. That button:
1. Updates the `pending_return` row with the resolved `original_bm_devices_item_id`
2. Applies the same BM Devices reset the matched path would have done (clear `text_mkyd4bx3`, clear `text4`, move to "Returned" group)
3. Writes the closure to `applied_mutations` so it's rollbackable like matched cases

Without this button flow, orphan cases would leave stale data on the original BM Devices item forever. The closure step makes orphan handling symmetrical with matched handling.

### 4.10 Monday sync

Ensure every live BM listing's listing_id matches `text_mkyd4bx3` on BM Devices board. Monday's SKU (`text89`) becomes canonical SKU regardless of BM drift.

---

## Phase 5 — Category-aware bid orchestrator (Week 4-5)

Goal: portfolio optimisation against 20 slots/day.

### 5.1 Category classifier

New `scripts/classify-bid.js`:
- For each standing BM buyback listing, classify Cat A / B / C:
  - Intel A-number + any grade → Cat C donor candidate
  - M-series NONFUNC_* → Cat B
  - M-series FUNC_* → Cat A (avoid unless cheap)
  - Edge case: **functional Intel** — default Cat A (list and sell) unless market underwater, then Cat C (harvest). Codex flags ambiguous cases for Ricky review (Codex QA technical concern #7).
- Tag stored in `data/bid-categories.json`

### 5.2 Cost feed engine

New `scripts/build-cost-lookup.js` (daily 04:30 UTC):
- Per active SKU, compute expected costs:
  - Parts cost: avg of `lookup_mkx1xzd7` across recent completions for this SKU family
  - Labour cost: avg of `formula__1` × £24
  - **Parts substitution:** if donor-harvested stock > 0 for a required part, use `harvested_cost_basis` instead of China price. If donor stock runs out mid-period, next day's cost lookup reverts to China-basis (Codex QA technical concern #3).
  - Shipping: £15 flat
  - BM fees: 10% + 10%
  - VAT: margin-scheme 16.67%
- Output: per-SKU `cost-lookup-YYYY-MM-DD.json` with `donor-available` and `china-only` cost variants

### 5.3 Bid orchestrator — per-part-family allocation with consumption forecast

New `scripts/orchestrate-bids.js` (daily 06:00 UTC, post cost + scraper):

Codex QA (v1 I6 + v2 I6 extended): v1 was coarse "average yield." v2 improved to part-family. v3 adds actual consumption forecast, multi-shortage donor scoring, and labour cap.

**Inputs:**
- `data/cost-lookup-YYYY-MM-DD.json` (Phase 5.2)
- `data/freeze-state.json` (Phase 2.3)
- `data/bid-categories.json` (Phase 5.1)
- **`populate_60d_usage.py` output — 60-day actual part consumption** (not just A-number demand)
- Parts Board current stock by part × source (donor-harvested vs china)
- Monday "To Repair" queue for Cat B pipeline demand
- Workshop labour capacity — weekly hours available for harvest operations (new input, Ricky-provided)

**Allocation algorithm:**

1. Budget: 20 BM trade-in slots/day
2. Compute **part-family shortfall**: for each (part type × target A-number) pair, weeks-of-coverage = `donor_stock / (60d_consumption / 8.57 weeks)`. Flag `SHORT` if < 4 weeks, `CRITICAL` if < 2 weeks
3. Score each Cat C donor candidate by **total shortfall coverage**:
   - For every compatible part on the donor: `(shortfall_weeks_gained) × (weighting by CRITICAL vs SHORT)`
   - A donor that relieves two CRITICAL shortages scores higher than one relieving a single CRITICAL + three non-shortages
4. **Labour cap:** Cat C slot allocation also capped by available workshop harvest hours for the week. If Ricky has 8 hours of harvest capacity and each donor takes ~1.5 hours to harvest + inventory, max Cat C slots for the week = 5-6 regardless of shortfall severity
5. Cat C slots allocated first (fills CRITICAL and SHORT shortfalls, subject to labour cap)
6. Remaining slots → Cat B bids, ranked by expected net margin descending (using donor-available cost basis for any repairs where donor parts will actually be available within 4 weeks)
7. Cat A bids only if cost-lookup + market price yields £150+ net AND no market freeze active on that model (Phase 2.3)
8. Post proposed bid changes to Telegram for Ricky approval (not auto-applied)
9. Move to auto-apply only after 2 weeks of approval data with <5% rejection rate

**Example daily output (notional):**
```
Today's allocation (2026-05-12):
- Donor shortages: A2337 LCD CRITICAL (1.4 weeks), A2338 battery SHORT (3.2 weeks)
- Labour capacity this week: 6 hours harvest remaining (cap = 4 donors this week)
- Cat C allocated: 2 slots (A1932 Intel MBA x1, A2289 Intel MBP x1) - targets both shortages
- Cat B allocated: 14 slots (top-ranked by expected margin after donor cost substitution)
- Cat A allocated: 4 slots (only 4 Cat A specs currently pass £150 net floor)
- Total: 20/20 slots filled
```

**Labour capacity input:** Ricky sets `data/workshop-capacity.json` weekly (or we default to 8hrs harvest/week + allow override). Gives Ricky a clean lever to throttle donor intake when the workshop is busy on other priorities.

### 5.4 Sell-side repricing engine

New `scripts/auto-reprice.js` (daily 05:30 UTC):

Per live listing:
1. Load cost-lookup (with donor-available flag)
2. Load live grade prices + backbox
3. Compute required price for ≥ £150 net AND ≥ 20% margin
4. Aging pressure:
   - 0-21 days: hold target price
   - 21-45 days: lower to £100 net floor
   - 45+ days: lower to £50 net, then offline and route to stuck-inventory triage (Phase 1's decision tree)
5. Decision: HOLD / LOWER / BLOCK / RAISE
6. Shadow mode 7 days → human review of delta → then live

### 5.5 Weekly performance report

New `scripts/weekly-performance.js` (Mondays 08:00 UTC, before trend narrative):
- **Primary KPI:** Revenue last 7 days vs £10k target
- Per-category breakdown (Cat A/B/C unit and £ counts)
- Donor parts harvested + used
- Cost savings vs China baseline (£ saved this week)
- Top-3 underperforming SKUs (age × margin)
- Posts to Telegram

---

## Phase 6 — Telegram app layer (Week 5-6)

Goal: thin UI over the scripts. **No LLM in the bot.** The only LLM call is Phase 2.2 weekly trend.

```
/home/ricky/builds/backmarket-bot/
├── services/
│   ├── telegram-bot.js        # Long-poll, handle callbacks
│   └── listing-poller.js      # Watch Monday "To List"
├── scripts/
│   └── (Phase 0-5 scripts wired here)
├── lib/
│   ├── db.js                  # SQLite state
│   ├── card-templates.js      # Telegram cards (templates)
│   ├── monday.js, bm-api.js   # imported from /builds/backmarket/scripts/lib/
│   └── decision-engine.js     # Rules: list/hold/lower/raise/block
└── deploy/
    ├── backmarket-bot.service # systemd
    └── cron                   # scheduled tasks
```

### Cards

- **Listing proposal** — P&L breakdown, market prices, historical sales, donor-part availability. Buttons: List / List at floor / Skip / More context
- **Donor bid proposal** — device spec, expected harvest yield, max bid. Buttons: Accept / Adjust / Decline
- **Cat A bid change** — freeze triggers, margin forecast. Buttons: Apply / Lower to floor / Skip
- **Salvage triage** — stuck device + proposed action. Buttons: List at loss / Salvage / Scrap
- **Return detected** — incoming return from Phase 4.9 with classification (change-of-mind / needs-repair / unknown) and proposed Monday action. Buttons: Confirm / Reclassify / Ask customer for details
- **Daily briefing** — revenue vs target, inventory health, donor stock weeks, flagged actions
- **Weekly trend report** — Phase 2.2 narrative

Dependencies: `better-sqlite3`, native `fetch`. **No `@anthropic-ai/sdk`, no `openai` SDK** in the bot. The weekly trend call lives in `/home/ricky/builds/backmarket/scripts/weekly-trend-report.js`, separate from the bot.

---

## Phase 7 — Decommission Hugo

Once Phase 6 is stable (2 weeks production, 100% BM flow handled, no manual intervention):

1. Disable Hugo binding in `openclaw.json`
2. Archive to `~/.openclaw/agents/_archive/backmarket-YYYYMMDD/`
3. Remove Hugo-triggered OpenClaw crons
4. Update `~/CLAUDE.md` to drop Hugo references

---

## Critical files

(Unchanged from v1 + additions.)

### New

**Phase 0:**
- `/home/ricky/builds/backmarket/CHANGELOG.md`
- `/home/ricky/builds/backmarket/docs/rollback-log.md`
- `/home/ricky/builds/backmarket/data/A_NUMBER_MAP.json` (single-source A-number → scraper model)

**Phase 1 (pulled forward):**
- `/home/ricky/builds/backmarket/scripts/stuck-inventory-audit.js`

**Phase 2:**
- `/home/ricky/builds/backmarket/scripts/scraper-diff.js`
- `/home/ricky/builds/backmarket/scripts/weekly-trend-report.js`
- `/home/ricky/builds/backmarket/scripts/market-freeze.js`

**Phase 3:**
- `/home/ricky/kb/backmarket/intel-donor-compatibility.md` (populated by Codex research)
- `/home/ricky/builds/backmarket/scripts/donor-valuation.js`
- `/home/ricky/builds/backmarket/scripts/donor-inventory-report.js`

**Phase 4 — docs + audit scripts (stay in backmarket/):**
- `/home/ricky/builds/backmarket/docs/SKU-FORMAT-SPEC.md`
- `/home/ricky/builds/backmarket/scripts/audit-registry-sku-format.js`
- `/home/ricky/builds/backmarket/scripts/reconcile-sku-to-registry.js`

**Phase 4 — browser runtime + operations (live in backmarket-browser/):**
- `/home/ricky/builds/backmarket-browser/lib/` — shared session/selector/rate-limit/screenshot/db modules
- `/home/ricky/builds/backmarket-browser/operations/fix-sku.js` — Operation A: bulk SKU rename
- `/home/ricky/builds/backmarket-browser/operations/returns.js` — Operation B: incoming returns
- `/home/ricky/builds/backmarket-browser/scripts/run-fix-sku.js` — CLI runner (and `--rollback` handler)
- `/home/ricky/builds/backmarket-browser/scripts/run-returns.js` — CLI runner (and `--rollback` handler)
- `/home/ricky/builds/backmarket-browser/deploy/returns-poller.cron`

**Division of responsibility:**
- `backmarket/scripts/` — data + audit + pure-API scripts (Monday/BM REST)
- `backmarket-browser/` — anything that drives the seller portal UI via Playwright
- Import direction: `backmarket-browser` may import from `backmarket/scripts/lib/` (monday.js, bm-api.js, resolver-truth.js). Never the reverse.

**Phase 5:**
- `/home/ricky/builds/backmarket/scripts/classify-bid.js`
- `/home/ricky/builds/backmarket/scripts/build-cost-lookup.js`
- `/home/ricky/builds/backmarket/scripts/orchestrate-bids.js`
- `/home/ricky/builds/backmarket/scripts/auto-reprice.js`
- `/home/ricky/builds/backmarket/scripts/weekly-performance.js`

**Phase 4 — Browser runtime and operations:**
- `/home/ricky/builds/backmarket-browser/` full tree (shared Playwright runtime + fix-sku and returns operations)

**Phase 6:**
- `/home/ricky/builds/backmarket-bot/` full tree

### To modify

- `/home/ricky/builds/buyback-monitor/buy_box_monitor.py` — wire acquisition policy + raise thresholds + read freeze state
- `/home/ricky/builds/backmarket/scripts/list-device.js` — raise thresholds; remove dead Step 12b (Phase 4.5); **pub_state retry already exists, no change**
- `/home/ricky/builds/backmarket/scripts/buy-box-check.js` — raise thresholds
- `/home/ricky/builds/backmarket/scripts/reconcile-listings.js` — add `--dry-run` flag, add Step 5; **column reads already fixed, no change**
- `/home/ricky/builds/backmarket/scripts/sale-detection.js` — clear `text_mkyd4bx3` after sale; buyer identity fix per ISSUE-001 (verify first, may already be done)
- `/home/ricky/builds/backmarket/services/bm-grade-check/index.js` — consume shared `A_NUMBER_MAP.json` + add test suite
- `/home/ricky/builds/backmarket/services/bm-shipping/` — clear `text_mkyd4bx3` on shipment confirm
- `/home/ricky/builds/backmarket/scripts/listings-audit.js` — rebuild to use registry-canonical SKU (Phase 4.2)
- `/home/ricky/builds/buyback-monitor/sync_tradein_orders.py` — remove hardcoded creds, move to env
- `/home/ricky/builds/buyback-monitor/run-daily.sh` — add failure alerting, resolve output path conflict
- `/home/ricky/config/api-keys/.env` — quote `JLL_EMAIL_REM_PASS`, add `BM_SELLER_PORTAL_*` creds
- Parts Board (985177480) — add 4 new columns (Phase 3.3)
- Main Board (349212843) — add `color_returns_refund_state` status column for returns refund tracking (Phase 4.9)
- `/home/ricky/builds/backmarket/sops/00-BACK-MARKET-MASTER.md` — **remove SOP 11 row from the master table only**; do not touch the SOP 10 row
- `/home/ricky/builds/backmarket/sops/10-payment-reconciliation.md` — **remove only the inline SOP 11 reference**; keep all other SOP 10 content intact
- `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md` — add interim manual `text_mkyd4bx3` handoff (Phase 0.6) + update with Phase 4.9 automated flow when live
- `/home/ricky/builds/backmarket/sops/` — add SOP 05 placeholder (QC flow)

### To reuse

- `/home/ricky/builds/customer-service/modules/enquiry/lib/db.js` — SQLite pattern for the bot
- `/home/ricky/builds/customer-service/modules/enquiry/services/telegram-bot.js` — long-poll pattern
- `/home/ricky/builds/backmarket/scripts/lib/` — all existing lib modules
- `/home/ricky/.openclaw/agents/parts/workspace/scripts/populate_60d_usage.py` — parts usage
- `/home/ricky/.openclaw/agents/parts/workspace/scripts/update_usage_columns.py`
- `/home/ricky/kb/monday/parts-board.md` (status: needs source-verification; don't treat as current truth)
- `/home/ricky/kb/backmarket/acquisition-policy.md` (verified 2026-04-07)
- `/home/ricky/builds/backmarket/docs/historical/buyback-optimisation-plan.md`

### To decommission

- Hugo workspace (after Phase 7)
- `*/15 * * * * sync-token.sh` cron
- OpenClaw `bm_board_housekeeping.py` cron

---

## Verification

### Phase 0 (Week 1)
- Policy gates: `grep 'GOLD\|PLATINUM\|DIAMOND' buy_box_monitor.py` shows block rules
- Thresholds: `grep -E '150|200' list-device.js buy-box-check.js` shows new floors
- Grade classifier: `A_NUMBER_MAP.json` exists; test suite passes on 30-device fixture
- Trade-in sheet sync runs daily with no credential leaks (source shows `env.BACKMARKET_API_AUTH`, not literal string)
- `reconcile-listings.js --dry-run` runs cleanly and mutates nothing
- `reconcile-listings.js` without `--live` flag defaults to dry-run (fail-safe)
- Buyback daily cron succeeds 2 days in a row
- `text_mkyd4bx3` clear confirmed on all 3 lifecycle events (grep each service)
- Dead crons removed; `crontab -l | grep sync-token` returns nothing
- Rollback commands logged for every change

### Phase 1 (Week 1)
- `stuck-inventory-audit.js` enumerates all 100+ devices with cost basis + age + proposed action
- Ricky reviews + annotates
- Batch execution log shows cash released
- BM board cleared of > 45-day stale listings

### Phase 2 (Week 2)
- `scraper-diff.js` produces daily trend-alerts file
- Weekly trend report posts to Telegram on Monday
- Market freeze triggers on synthetic 10% WoW drop test
- Parts Board 60-day usage numbers refreshed and accurate

### Phase 3 (Week 2-3)
- Codex research complete, `intel-donor-compatibility.md` covers all confirmed + extended part categories
- Parts Board has 4 new columns populated on sample devices
- `donor-valuation.js` produces a recommended bid for a test A2179 matching Ricky's expectation (±15%)
- Donor weeks-of-coverage report generated
- 5+ live donor purchases happening, feeding real consumption data

### Phase 4 (Week 3-4)
- SKU spec doc approved
- `listings-audit.js` passes regression test on 30 known listings
- 264 registry slots classified
- Real mismatch count re-derived (correct baseline — no longer 456 from the broken tool)
- Dead Step 12b removed from `list-device.js`
- `backmarket-browser/` runtime deployed; selector validation session completed with Ricky; `selector-validation-YYYY-MM-DD.md` committed
- Shared runtime tests pass against cached portal snapshots
- `fix-sku` operation validated on Batch 1 (5 listings, 2-hour wait); each batch gate passes before next size increase
- Rollback drill confirmed: SKU reverted cleanly for one test listing, then re-applied
- Progressive batch rollout completes per Phase 4.8 cadence; zero sale-detection regressions in logs
- Post-full-rollout audit shows residual mismatch < 20 (genuinely un-fixable / `mismatch-structural`)
- **Returns operation (4.9):** Codex API research complete; returns poller runs every 6 hours; first real return processed correctly (classification + Monday item + original BM Devices reset); Ferrari confirms the workflow saves him time vs manual
- Main Board `color_returns_refund_state` column created and populated for every return

### Phase 5 (Week 4-5)
- `cost-lookup.json` covers ≥ 80% of active SKUs with donor-available flag
- `orchestrate-bids.js` produces 7 days of human-approved recommendations
- Donor part-family allocation works correctly (verified with 3 scenarios)
- `auto-reprice.js` shadow mode 7 days then live
- Weekly performance report posts Mondays

### Phase 6 (Week 5-6)
- `backmarket-bot.service` active
- "To List" status triggers Telegram card within 10 min
- SQLite tracks listing attempts + state transitions
- Bot `package.json` contains no LLM SDK

### Phase 7
- Hugo disabled
- 7 consecutive days, new bot handling all BM flow, zero manual intervention
- **Primary KPI:** £10k weekly revenue target hit at least once before Phase 7 starts
- Sustained £10k+ weekly within 4 weeks of Phase 5 going live

---

## Risks and dependencies

1. **Codex output review overhead** — delegating coding means I review every diff. Mitigation: detailed specs, small scripts, dry-run every change.
2. **Codex research quality (Phase 3.2)** — compatibility matrix accuracy depends on research + Ricky validation. Budget half-day + buffer.
3. **Parts Board data quality** — 30+ negative stock items, broken writeback, 16-day stale export. Phase 2.4 is prerequisite for Phase 3.
4. **Donor purchasing ramp-up** — need 4-6 weeks of consumption data before orchestrator forecasts are reliable. Start manual purchasing Phase 3.6.
5. **BM API SKU is set-once on existing listings** — confirmed. Phase 4 uses browser automation of seller portal (Path C). Registry-as-truth covers residual.
6. **Browser automation risks** — seller portal may trip bot-detection, DOM may change, creds must be safe. Mitigations: 2-3s rate limit, selector validation per run, creds in `.env`, dedicated seller login if possible.
7. **20-slot/day cap** — BM enforced. Orchestrator never attempts more; telemetry on actual slot fills.
8. **Stuck inventory emotional weight** — salvage decisions mean writing off losses. Batch approval, not automated.
9. **T-con swap labour time** — valuation engine currently assumes 30 min. Measure actual time early in Phase 3 to calibrate.
10. **Credential leak in `sync_tradein_orders.py`** — line 29. **Must be fixed in Phase 0.4 before cron. Never commit.**
11. **`listings-audit.js` baseline unreliable** — must be rebuilt (Phase 4.2) before any bulk SKU remediation. Do NOT drive Phase 4.6 from the current 456 count.
12. **Sale-detection business continuity** — any Phase 0 or 4 change that risks breaking sale-detection gets tested in worktree against historical data first. `sale-detection.js` is the untouchable hot-path. Phase 0.6a shadow-test procedure is mandatory.
13. **BM portal UI drift** — any portal redesign breaks all browser operations at once. Mitigations: selectors centralised in `backmarket-browser/lib/selectors.js`; unit tests against cached snapshots; operations halt on selector failure rather than mis-targeting. Re-validate selectors quarterly even if no symptoms.
14. **Returns classification accuracy** — Phase 4.9 tries to auto-classify change-of-mind vs defective from BM CS message parsing. Low volume (1-2/week) means errors are catchable by Ferrari review on every Telegram card. Fully-autonomous classification deferred until accuracy is measured on 50+ returns.
15. **Returns data model for legacy orders** — sales pre-dating Monday tracking may have no `text_mkye7p1c` to match. Flagged as `ORPHAN-RETURN` in Phase 4.9; Ferrari handles each manually. Expect 5-10% of returns in first 90 days.

---

## What this plan does NOT cover

- **SOP 10 (payment reconciliation automation)** — no Monday column for actual BM payouts. Separate discovery needed.
- **Outgoing returns** (we ship back a rejected trade-in) — ~1-2/week. Stays manual; low-volume enough that automation ROI is marginal.
- **Auto-accept/reject of incoming returns on BM** — Phase 4.9 is detect-and-surface only; actual accept/reject of the return on the BM seller portal stays Ferrari's manual action until classification accuracy is proven (2+ weeks, 10+ returns).
- **Shopify / website integration** beyond existing pricing-index feed.
- **iMac / non-MacBook BM expansion** (business scope decision).
- **Customer-facing automation around rejections / counter-offers** (leave current icloud-checker service as-is).

---

## Open questions for Ricky before execution

None blocking. Ricky has confirmed:
- SKU remediation scope (all 456, batched)
- Primary success metric (£10k weekly revenue)
- Donor-compatible parts (LCD, T-con, Battery, Trackpad, Charging port)
- Two sell-side/buy-side subsystems distinction
- `text_mkyd4bx3` clear on all three lifecycle events
- Returns scope (incoming only, ~1-2/week, change-of-mind vs repair differentiation)
- Returns workflow (QC on every return, relist path after QC pass)

Ready for Codex QA pass 3.
