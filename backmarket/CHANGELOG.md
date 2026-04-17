# BackMarket CHANGELOG

Deploy-level record of every change made during the BM rebuild execution. Every entry includes the change, the rollback command, and verification performed.

See `/home/ricky/builds/backmarket/docs/rollback-log.md` for detailed rollback commands per change.

---

## 2026-04-17 — Phase 0.11 — Verification of already-fixed claims

Codex QA flagged some Phase 0 tasks as already resolved in the code. Verified before removing from scope:

### Verified already done
- **`list-device.js` pub_state retry** — confirmed. Lines 1884-1896 show retry loop: failed verification triggers re-publish and re-verify before giving up.
- **`reconcile-listings.js` `display_value` reads** — confirmed. Lines 260, 264, 266 correctly use `display_value` for mirror/formula columns.
- **`sale-detection.js` buyer identity handling (ISSUE-001)** — confirmed. Lines 271-278 construct `visibleIdentity` by comparing `billingName` vs `shippingName` and showing both when they differ: `"Buyer: ${billingName} / Ship to: ${shippingName}"`. Already fixes the case where BM buyer ≠ shipping addressee.

### Still needed (Phase 0 active scope)
- Dead Step 12b in `list-device.js` (Phase 3.6 — deferred to Phase 4/SKU work)
- Test SKU `TEST.UUID.001` on listing 6317632 (Phase 0.2 or manual portal fix)
- All other Phase 0 items as per plan

Rollback: N/A — this entry records verification only; no code changed.

---

## 2026-04-17 11:00 UTC — Phase 0.9 — Remove dead crons

- Removed cron: `*/15 * * * * /home/ricky/.openclaw/scripts/sync-token.sh` — superseded by CLI backend migration (`system-rethink.md`). OAuth token sync no longer needed.
- OpenClaw `bm_board_housekeeping.py` cron: searched `crontab -l` and `/home/ricky/.openclaw/openclaw.json` + agent config — not present. Either already removed or never ran. Plain crontab `board-housekeeping.js` at 07:30 UTC Mon-Fri is the live BM board housekeeping cron and remains untouched.

Crontab backup: `/tmp/crontab-backup-20260417-105952.txt`

Rollback command (if needed):
```bash
crontab /tmp/crontab-backup-20260417-105952.txt
```

---

## 2026-04-17 11:05 UTC — Phase 0.8 — Fix .env quoting + buyback cron failure alerting

**Files touched:**
- `/home/ricky/config/api-keys/.env` — single-quoted `JLL_EMAIL_REM_PASS` value (was unquoted, contained `$1` which `set -u` treated as positional parameter)
- `/home/ricky/builds/buyback-monitor/run-daily.sh` — added `trap on_early_exit EXIT` that fires a Telegram alert if the script dies before the normal reporting block; trap explicitly disabled on successful completion so normal report still fires

**Verification:**
```bash
# Confirms .env sources under set -euo pipefail (was failing daily since ~Apr 14)
bash -c "set -euo pipefail; source /home/ricky/config/api-keys/.env; echo OK"
# → OK: sources cleanly with set -u
```

**Impact:** Next buyback daily cron (05:00 UTC) will run successfully. Failure alerting now covers both early exits (bad env, missing binaries) and script-internal failures.

**Rollback:**
```bash
# Restore .env
cp /home/ricky/config/api-keys/.env.bak-20260417-110000 /home/ricky/config/api-keys/.env
# Revert run-daily.sh
cd /home/ricky/builds/buyback-monitor && git checkout HEAD -- run-daily.sh
```

---

## 2026-04-17 11:15 UTC — Phase 0.10 — SOP doc changes

**Files touched:**
- `sops/00-BACK-MARKET-MASTER.md` — removed SOP 11 row from the master table; added SOP 05 placeholder row; updated SOP 12 row to reference Phase 4.9 automation
- `sops/10-payment-reconciliation.md` — removed the dangling inline reference to SOP 11 (Tuesday Cutoff); replaced with reference to `dispatch.js` cron + `stuck-inventory-audit.js` (Phase 1)
- `sops/05-qc-final-grade.md` — NEW placeholder SOP documenting the existing manual QC → Final Grade process
- `sops/12-returns-aftercare.md` — NEW "Interim manual handoff" section documenting the manual `text_mkyd4bx3` clear that Ferrari does on every return until Phase 4.9 ships

**Rollback:**
```bash
cd /home/ricky/builds/backmarket && git checkout HEAD -- \
  sops/00-BACK-MARKET-MASTER.md \
  sops/10-payment-reconciliation.md \
  sops/12-returns-aftercare.md
rm -f sops/05-qc-final-grade.md
```

---

## 2026-04-17 11:30 UTC — Workspace cleanup

Workspace reduced from 57MB → 23MB (34MB freed). All historical material preserved under `docs/historical/` with dated subdirs. Zero live scripts or active docs affected.

**Archived (moved, not deleted) into `docs/historical/`:**
- `audits-2026-02-27-to-03-27/` — 18 audit reports + payout incident evidence folder (was `/audit/`)
- `analysis-2026-02-to-04/` — 24 Python analysis scripts (was `/analysis/`). Includes the 4 Apr-15 scripts Ricky didn't recognise (`bm-crossref.py`, `bm-full-chain.py`, `bm-profit-by-shipdate.py`, `bm-profit-by-solddate.py`) — archived per Ricky's call.
- `staged-plans-2026-03-31-04-01/` — 2 subdirectories (Mar 31 + Apr 1 staged planning docs, was `/docs/staged/`)
- `old-qa-2026-03/` — 11 QA docs (was `/qa/`)
- `legacy-scripts-2026-03/` — 7 files: 6 dead scripts (`apple-spec-check.js`, `buyback-profitability-builder.js`, `profitability-check.js`, `reconcile.js`, `shipping.js`, `trade-in-payout.js`) + `backmarket-tmux.sh` (referenced archived handoff doc)
- `reconciliation-snapshots-2026-03-2026-04/` — 9 reconciliation JSON snapshots (was `data/reports/reconciliation-*.json`)

**Deleted (truly stale, regenerable):**
- `/data/cache/` — 8.8MB of pre-rebuild analysis caches (bm-crossref, bm-full-chain, reprice-plans, listing-decisions, returns-forensic, etc.)
- `/data/exports/` — 3.1MB of Feb-Mar CSV exports (buyback listings, trade-in data, returns CSV, killed-SKU list)
- `/data/logs/` — 2 old Python run logs (Mar 1, Mar 2)
- `/data/reports/pricing-report-*.md` — 5 old pricing reports (Feb 27)
- `/data/buy-box-check-*.txt` older than 2026-04-06 — 7 old runs; kept Apr 13, Apr 11, Apr 6
- `/scripts/data/cache/` — 3.5MB of stale script cache (listings.json, orders.json from Mar 27)
- `/scripts/logs/` — 4 old operational logs
- `/analysis/__pycache__/` — compiled Python
- `/docs/` stale CSVs: `Backmarket Sales Data - Sheet1.csv` (580KB), `export_listings_57b75831....csv` (4.9MB), `listing.csv`, `listing (1).csv`

**Kept as-is (will revisit after Phase 4.2):**
- `data/listings-audit-2026-04-13.json` (937KB) — current (unreliable) baseline; Phase 4.2 rebuild compares against it
- `data/vetted-listings-audit.json` (17MB) — rebuild target for Phase 4.2
- `data/labels/` — Royal Mail shipping slips (keep 6 months, auto-prune later)

**README.md updated** to reflect new structure.

**Rollback:** Everything that was moved is in git and can be restored via `git mv` back to original location. Everything that was deleted can be regenerated from live BM API + Monday data (that's why it was classified as deletable).

Full cleanup audit report (produced by Explore agent): archived at `docs/historical/cleanup-audit-2026-04-17.md` (will be added to git after this commit).

---

## 2026-04-17 11:40 UTC — Phase 0.4 — `sync_tradein_orders.py` credentials fix + schedule

**Files touched:**
- `/home/ricky/builds/buyback-monitor/sync_tradein_orders.py`:
  - Removed hardcoded Basic-auth BM credential from line 29 (was a secret leak sitting in git-tracked source)
  - `BM_HEADERS` now initialised in `main()` from `env["BACKMARKET_API_AUTH"]`
  - Script refuses to run if env var missing (fails loudly, not silently)
  - `load_env()` call moved up so env-backed headers populate before the API fetch

**Crontab addition:**
```
30 5 * * * /usr/bin/python3 /home/ricky/builds/buyback-monitor/sync_tradein_orders.py >> /home/ricky/logs/buyback/tradein-sync.log 2>&1
```
Daily 05:30 UTC. Runs after `run-daily.sh` (05:00) so sheet has latest BM state right after the scraper refresh.

**Verification:**
- Python syntax parses cleanly
- `--dry-run` executed end-to-end: authenticated, paginated 140+ orders from BM API successfully, status + grade breakdown printed. No writes to sheet in dry-run (as intended).

**Rollback:**
```bash
# Remove the new cron line
crontab /tmp/crontab-backup-20260417-105952.txt  # pre-cleanup backup
# Or surgically:
crontab -l | grep -v 'sync_tradein_orders.py' | crontab -
# Revert source
cd /home/ricky/builds/buyback-monitor && git checkout HEAD -- sync_tradein_orders.py
```

**Note on committed secret:** the credential was in git history. A credential rotation is advisable at the next natural break (BM API UI → new auth token → update `.env` → test). Flagging separately for Ricky; not executing the rotation in Phase 0.

---

## 2026-04-17 11:50 UTC — Phase 0.5 — Schedule missing crons

**Crontab additions:**
```
# BM resale buy-box check (SOP 07) — daily 06:30 UTC Mon-Fri, check-only (Phase 0.5)
30 6 * * 1-5 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/buy-box-check.js >> /home/ricky/logs/cron/buy-box-check.log 2>&1

# BM morning briefing (Slack) — 08:00 UTC Mon-Fri (Phase 0.5)
0 8 * * 1-5 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/morning-briefing.js >> /home/ricky/logs/cron/morning-briefing.log 2>&1
```

**`buy-box-check.js` safety:** default mode is check-only (no mutations to live listings). Only `--auto-bump` flag triggers price changes. Scheduling in check-only mode surfaces losing listings + margin issues daily without risking unintended bumps. Will be switched to `--auto-bump` after Phase 0.2 raises the thresholds.

**`reconcile-listings.js` NOT scheduled.** Current script has no `--dry-run` flag and its main path mutates live data — Phase 0.7 builds the dry-run flag, then we schedule.

**Verification:** Both scripts syntax-check cleanly with `node -c`. Live runs will start tomorrow on their schedules.

**Rollback:**
```bash
crontab -l | grep -vE 'buy-box-check\.js|morning-briefing\.js' | crontab -
```

---

## 2026-04-17 11:30 UTC — Phase 0.7 — reconcile-listings.js `--dry-run` flag + weekly cron

**Implementation note:** Codex sandbox couldn't reach the file from its isolated worktree (bwrap loopback network error). Rather than workaround the sandbox, Claude Code applied the refactor directly. Codex had already identified the correct 3 mutation callsites before failing. Clean surgical edit.

**Files touched:**
- `/home/ricky/builds/backmarket/scripts/reconcile-listings.js`:
  - Added `--dry-run` / `--live` CLI flags; default is dry-run with a warning banner
  - Added shared `maybeMutate(action, executor)` helper at line 42
  - Refactored 3 mutation callsites through the helper (Monday backfill at line 315, BM offline for status-oversell at 413, BM offline for qty-oversell at 434)
  - Telegram report remains always-on but prefixed with `Mode: DRY-RUN | LIVE` line
  - End-of-run writes actions log to `data/reconcile-{mode}-YYYY-MM-DD.json` with schema `{run_timestamp, mode, actions[], summary{total, by_type, executed, proposed_only}}`

**Verification:**
- `node -c scripts/reconcile-listings.js` — syntax OK
- `grep -n maybeMutate` — 1 definition + 3 callsites ✓
- End-to-end dry-run tested: processed 7 Monday Listed items, 950 BM listings, 1362 BM Devices board items. Found 1 Monday backfill opportunity (BM 1578, £296 Total Fixed Cost), logged as `executed: false`. No mutations occurred.
- Output file `data/reconcile-dry-run-2026-04-17.json` written correctly with the proposed action.

**Crontab addition (schedules the --dry-run run weekly):**
```
0 4 * * 0 cd /home/ricky/builds/backmarket && /usr/bin/node scripts/reconcile-listings.js --dry-run >> /home/ricky/logs/cron/reconcile-listings.log 2>&1
```
Runs Sunday 04:00 UTC. Drift detection weekly; no mutations. When we want live execution, Ricky runs manually with `--live` flag.

**Rollback:**
```bash
cd /home/ricky/builds/backmarket && git checkout HEAD -- scripts/reconcile-listings.js
crontab -l | grep -v 'reconcile-listings' | crontab -
```

---

## 2026-04-17 12:32 UTC — Phase 0.3 — `A_NUMBER_MAP.json` + grade classifier refactor (Codex)

Built by Codex subagent in `danger-full-access` sandbox mode (see Codex patch note). 30/30 regression tests passing.

**Files touched:**
- `/home/ricky/builds/backmarket/data/A_NUMBER_MAP.json` — NEW. Single source of truth for A-number → BM scraper model family. 22 mappings, schema v1. 12 entries flagged `verification: needs_manual` (multi-variant A-numbers like A2338/A2442/A2485 and Intel/M3-M4 families not yet in the V7 scraper feed).
- `/home/ricky/builds/backmarket/services/bm-grade-check/index.js` — load map from JSON at startup; fail-loud if missing; replaced inline `A_NUMBER_TO_SCRAPER_MODEL` with map lookup. No behaviour change.
- `/home/ricky/builds/backmarket/scripts/listings-audit.js` — same pattern; wrong mappings fixed as part of the migration.
- `/home/ricky/builds/backmarket/scripts/tests/test-a-number-map.js` — NEW. 30 regression cases including explicit anti-drift assertions for the bugs found during refactor.

**Wrong mappings fixed in this pass:**
- `Pro 13" 2022 M2 → A2681` (wrong — A2681 is Air M2; corrected to A2338)
- `A3114 → Air 13" M4` (wrong — A3114 is Air 15" M3; corrected)
- `A2918 / A2991 / A2992` previously confused across base M3 vs M3 Pro and 14 vs 16 chassis — now disambiguated: A2918 = Pro 14 M3 base, A2991 = Pro 16 M3 Pro/Max, A2992 = Pro 14 M3 Pro/Max

**Verification:**
- `node scripts/tests/test-a-number-map.js` — 30/30 passed
- `node -c services/bm-grade-check/index.js` — syntax OK
- `node -c scripts/listings-audit.js` — syntax OK
- `bm-grade-check.service` restarted via systemd and came up cleanly (PID 2324007 since 12:31:57 UTC). Active, listening on 8011, map loaded.

**`needs_manual` entries** (12): A1466, A1932, A2179 (Intel-era Airs), A3114, A3241 (newer M3/M4), A2159, A2251, A2289 (Intel Pros), A2338, A2442, A2485 (multi-variant M-series), A2993 (M4 Pro 16). Deferred to Phase 3 (donor strategy) where we'll verify each Intel A-number's retrofit scope anyway, and to the M4 scraper coverage work in Phase 2.

**Rollback:**
```bash
cd /home/ricky/builds/backmarket && git checkout HEAD -- \
  services/bm-grade-check/index.js scripts/listings-audit.js
rm -f data/A_NUMBER_MAP.json scripts/tests/test-a-number-map.js
systemctl --user restart bm-grade-check
```

---

## 2026-04-17 12:55 UTC — Phase 0.1 — Wire acquisition policy into buy_box_monitor.py (Codex)

**Files touched:** `/home/ricky/builds/buyback-monitor/buy_box_monitor.py`

**What was added:**
- Grade-based hard-block gate: listings with BM `aestheticGradeCode` mapping to GOLD / PLATINUM / DIAMOND are now never bumped. Previously no grade filter existed.
- `AESTHETIC_TO_POLICY_GRADE` translation layer — Codex discovered BM's API exposes the grade as `aestheticGradeCode` (e.g. `FUNCTIONAL_USED`), not as the shorthand (`GOLD`) used in the policy doc. Both forms are mapped:
  ```
  NOT_FUNCTIONAL_CRACKED → STALLONE (acceptable)
  NOT_FUNCTIONAL_USED    → BRONZE   (acceptable)
  FUNCTIONAL_CRACKED     → SILVER   (caution — needs screen cost baked in)
  FUNCTIONAL_USED        → GOLD     (HARD BLOCK)
  FUNCTIONAL_GOOD        → PLATINUM (HARD BLOCK)
  FUNCTIONAL_FLAWLESS    → DIAMOND  (HARD BLOCK)
  ```
- Raised thresholds for acceptable + SILVER-caution bumps:
  - `margin ≥ 25% AND net ≥ £200` → silent bump
  - `margin 15–25% AND net ≥ £150` → bump with Telegram caution flag
  - Below → block
- `--legacy-thresholds` CLI escape hatch (7-day transition) — falls back to old £50/15% gate with `[LEGACY]` banner warning.
- `freeze-state.json` reader at `/home/ricky/builds/backmarket/data/freeze-state.json` — Phase 2.3 will populate this; graceful fallback when absent.
- Skip-reason codes: `SKIP_GRADE_GOLD`, `SKIP_GRADE_PLATINUM`, `SKIP_GRADE_DIAMOND`, `SKIP_MARGIN`, `SKIP_NET`, `SKIP_MARKET_FROZEN`, `SKIP_UNKNOWN_GRADE` — every skip logged with reason + appears in the run's skip breakdown summary.

**Verification:**
- `python3 -c "import ast; ast.parse(open('buy_box_monitor.py').read())"` — Syntax OK
- `python3 buy_box_monitor.py --help` — `--legacy-thresholds` flag visible
- Module-level unit test on helpers: freeze-state loads safely when file missing, grade mapping correctly flags GOLD as hard_block, UNKNOWN → no block (will be SKIP_UNKNOWN_GRADE)
- Full end-to-end validation deferred to tomorrow's 05:00 UTC cron (can't do in ad-hoc run — takes 90+ min, hits every active buyback listing)

**Business impact (immediate, once cron fires):**
- Any FUNCTIONAL_USED / FUNCTIONAL_GOOD / FUNCTIONAL_FLAWLESS listings we currently bump bids on → stop being bumped. Acquisition policy now matches live behaviour.
- SILVER (FUNCTIONAL_CRACKED) listings only bump if margin ≥ 25% + net ≥ £200 (Cat B treatment — assumes full screen replacement cost).
- STALLONE / BRONZE (non-functional) are the remaining volume — Cat B repair edge applies.

**Rollback:**
```bash
cd /home/ricky/builds/buyback-monitor && git checkout HEAD -- buy_box_monitor.py
# OR use --legacy-thresholds at runtime without code revert
```

---

## 2026-04-17 13:05 UTC — Phase 0.2 — Raise sell-side thresholds (Codex)

**Files touched:**
- `/home/ricky/builds/backmarket/scripts/list-device.js`
- `/home/ricky/builds/backmarket/scripts/buy-box-check.js`

**`list-device.js` — listing decision gate (function `decisionGate`, line 1058):**
- Primary gate: `net ≥ £150 AND margin ≥ 25%` → PROPOSE
- Secondary gate: `net ≥ £100 AND margin ≥ 20%` → PROPOSE but flagged `requiresMinMarginOverride: true` (needs `--min-margin` to actually go live)
- Below: BLOCK with specific reason
- Loss-maker (`net < 0`): BLOCK unless `--min-margin` explicitly passed
- Previously: `net ≥ £50 AND margin ≥ 15%`

**`buy-box-check.js` — auto-bump decision (line 727 onwards):**
- Silent bump: `net ≥ £200 AND margin ≥ 25%`
- Flagged bump (Telegram alert): `net ≥ £150 AND margin ≥ 15%`
- Below: block
- Previously: `net ≥ £50` with various combined margin rules

**Escape hatches (7-day transition):**
- CLI flag `--legacy-gates` on both scripts restores old thresholds with `[LEGACY]` banner
- Environment variable `BM_THRESHOLDS_VERSION=v1` is an alternative (no code redeploy needed; useful if we want to flip cron back quickly)

**`--min-margin <n>` override:** behaviour preserved. `--min-margin 0` still lets clearance work go live at any margin.

**New in buy-box-check.js:** a `--min-margin` CLI arg parser was added (wasn't there before). Needed to honour the clearance bypass contract on the resale side.

**Verification:**
- `node -c scripts/list-device.js` — Syntax OK
- `node -c scripts/buy-box-check.js` — Syntax OK
- Thresholds visible at `list-device.js:1079-1090` and `buy-box-check.js:720-730`
- Both `--legacy-gates` flags parsed (confirmed in source)

**Business impact:**
- `list-device.js` (manual per-device, SOP 06): next listing attempt surfaces the new gate. If current data for a device doesn't clear £150 net / 25% margin, it's blocked unless Ricky explicitly passes `--min-margin`.
- `buy-box-check.js` (daily cron 06:30 UTC weekdays, currently check-only): tomorrow's run shows how many live listings would fall under the new gate vs the old one. Live auto-bump enablement stays deferred — we look at the output first before flipping.

**Rollback:**
```bash
cd /home/ricky/builds/backmarket && git checkout HEAD -- \
  scripts/list-device.js scripts/buy-box-check.js
# OR per-run: BM_THRESHOLDS_VERSION=v1 node scripts/list-device.js ...
```

---

## 2026-04-17 13:08 UTC — Phase 0.6 — `text_mkyd4bx3` clear on sale + shipment (Codex + shadow-test cutover)

**HIGHEST RISK ITEM OF PHASE 0.** Touches `sale-detection.js` — the hourly-cron hot path. Followed the full Phase 0.6a shadow-test procedure.

**Files touched:**
- `/home/ricky/builds/backmarket/scripts/sale-detection.js` (hot path — cutover from `.phase-0-6` variant)
- `/home/ricky/builds/backmarket/scripts/sale-detection.js.phase-0-6` (Codex's draft, kept as reference)
- `/home/ricky/builds/backmarket/scripts/sale-detection.js.bak-phase-0-6` (pre-cutover backup)
- `/home/ricky/builds/backmarket/services/bm-shipping/index.js` (webhook — lower risk, direct edit)

**Behaviour added:**

**`sale-detection.js`:**
1. `matchToBmDevice` GraphQL query expanded to include `text_mkyd4bx3` in the fetched columns (lets the clear read current value without an extra API round-trip)
2. New `clearBmDeviceListingId(bmDeviceItem)` function (lines 189-201): reads current listing_id from the already-fetched item, no-ops if empty, otherwise writes `""` to `text_mkyd4bx3`
3. Clear invoked immediately after match is found, wrapped in try/catch — failure degrades to `console.warn`, sale-accept pipeline continues regardless (BM API accept takes precedence; stale Monday data is recoverable, a lost sale is not)
4. Multi-unit safe: `matchToBmDevice` already selects a single `availableItem` by filtering `text4` empty — only that specific item gets cleared, siblings untouched

**`bm-shipping/index.js`:**
1. New `clearBmDeviceSaleFields(bmDeviceItemId)` function — clears BOTH `text_mkyd4bx3` (listing_id) AND `text4` (sold-to) in a single `change_multiple_column_values` mutation
2. Called on primary shipment confirm path AND the retry path — belt-and-braces
3. On failure: log error + post Telegram alert asking for manual clear; shipment confirm itself NOT blocked

**Shadow test performed:**
1. Pre-deploy: `node -c` against copy of `.phase-0-6` variant → syntax OK
2. Live shadow smoke test: ran the `.phase-0-6` script against live BM + Monday API from within backmarket/ dir → no errors, successfully queried the `/ws/orders?state=1` endpoint, reported "0 pending orders", cleanly exited. The new `clearBmDeviceListingId` code path didn't fire (no pending orders to accept) but the plumbing is verified.
3. Post-cutover: re-ran the live deployed `sale-detection.js` → identical clean exit, same behavior.
4. `bm-shipping.service` restarted via systemd; PID 2335574, listening on 127.0.0.1:8013 with new code.

**Return processed** event (the 3rd trigger per the plan) intentionally NOT built here — no automated return handler exists yet (Phase 4.9 scope, via `backmarket-browser/operations/returns.js`). SOP 12 interim handoff already documents Ferrari's manual clear (Phase 0.10 edit).

**Rollback (30-second revert if any issue):**
```bash
# Instant revert for sale-detection (backup already staged):
cp /home/ricky/builds/backmarket/scripts/sale-detection.js.bak-phase-0-6 \
   /home/ricky/builds/backmarket/scripts/sale-detection.js

# Revert bm-shipping and restart:
cd /home/ricky/builds/backmarket && git checkout HEAD -- services/bm-shipping/index.js
systemctl --user restart bm-shipping
```

**Monitoring recommendation:** watch the next 3 sale-detection cron runs (next hour, +1hr, +2hr) for any change in the log signature. Specifically confirm that when a sale IS accepted, there's a new `✅ Cleared BM listing_id on matched device` line AFTER match and BEFORE `Step 5a: Update BM Devices`.
