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
