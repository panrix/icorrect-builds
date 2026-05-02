# QA Phase 7a Batch 1 Verification

Date: 2026-05-02 UTC
Scope: `backmarket`, `backmarket-browser`, `backmarket-seller-support`, `bm-scripts`, `buyback-monitor`, `data`
Spec inputs: `briefs/PHASE-7a-STANDARDIZATION-SPEC.md`, `briefs/folder-standard.md`, `scans/phase-7a/scan-batch-1.yaml`
Git scope used for rule E: repo root `/home/ricky/builds`

## Per-folder verdicts

### `backmarket` — FAIL
- A/B passed: root `INDEX.md` exists; `briefs/`, `decisions/`, `docs/`, `archive/`, `scratch/` exist; empty `briefs/` and `decisions/` have `.gitkeep`; `INDEX.md` matches active-folder template and inventory state.
- C passed: 3/3 move samples verified. `archive/CHANGELOG.md`, `docs/audits/OVERNIGHT-BACKMARKET-RECOVERY-2026-04-25.md`, and `scratch/tmp-check-sent-order-aiidm.js` exist; original root paths are gone.
- D/G passed: `docs/INDEX.md` exists; cron targets and BM systemd paths resolve.
- FAIL findings:
- `git status --short -- backmarket` shows `D backmarket/CHANGELOG.md` plus untracked destinations, not rename entries only.
- `git diff --name-only --diff-filter=M -- backmarket` is not empty: `scripts/board-housekeeping.js`, `scripts/buy-box-check.js`, `scripts/lib/monday.js`, `scripts/lib/v7-scraper.js`, `scripts/list-device.js`, `services/bm-grade-check/index.js`, `services/bm-shipping/index.js`, `test/unit/v7-scraper-reconcile.test.js`.
- WARNING findings:
- Root detritus remains in place: `.DS_Store`, `.claude/`, `.codex-tasks/`. This is spec-compliant for 7a but still clutter.

### `backmarket-browser` — FAIL
- A/B passed: root `INDEX.md` exists; five standard dirs exist; empty `decisions/`, `archive/`, and `scratch/` have `.gitkeep`; `INDEX.md` matches active-folder template and inventory state.
- C passed: 3/3 move samples verified. `briefs/BROWSER-AGENT-TODO-2026-04-26.md`, `briefs/SPEC-2026-04-25.md`, and `docs/audits/REPORT-DATAIMPULSE-EMAIL-STEP-CANARY-2026-04-26.md` exist; original root paths are gone.
- D passed: `docs/INDEX.md` and `docs/audits/INDEX.md` exist.
- Additional verification passed: the inspection stayed top-level only for the folder and did not recurse into `data/` session/profile contents.
- FAIL findings:
- `git status --short -- backmarket-browser` shows raw `D` entries for moved root files rather than rename entries.
- `git diff --name-only --diff-filter=M -- backmarket-browser` is not empty: `config/selectors/portal.json`, `lib/dataimpulse-proxy-canary.js`, `lib/frontend-url-capture-contract.js`, `lib/harness-check.js`, `lib/harness-doctor.js`, `lib/vps-cdp-harness.js`, `scripts/run-dataimpulse-mailbox-code-login.js`, `scripts/run-headful-cloudflare-auth-handoff.js`, `scripts/vps-cdp-about-blank-check.js`, `test/unit/frontend-url-capture-contract.test.js`, `test/unit/vps-cdp-harness.test.js`.
- WARNING findings:
- Stale inbound refs remain at the old root paths, including `~/.openclaw/agents/main/workspace/LIVE-TODO.md:59,63,68,70,72` and `~/kb/system/runtime/browser-automation.md:74`.

### `backmarket-seller-support` — WARN
- A/B passed: root `INDEX.md` exists; five standard dirs exist; empty `briefs/`, `decisions/`, `archive/`, and `scratch/` have `.gitkeep`; `INDEX.md` matches active-folder template and inventory state.
- C passed: 3/3 move samples verified. `data/api-inventory.json`, `data/bm-ssc-raw-articles.json`, and `docs/discovery.md` exist; original root paths are gone.
- FAIL findings:
- None.
- WARNING findings:
- This path has `0` tracked files in the repo (`git ls-files backmarket-seller-support` returns none), so rule E can only be checked as current untracked state (`?? backmarket-seller-support/`), not against tracked before/after rename history.
- `~/builds/agent-rebuild/idea-inventory.md:234,237` still references the old root path `backmarket-seller-support/discovery.md`.

### `bm-scripts` — WARN
- A/B passed: root `INDEX.md` exists; five standard dirs exist; all five standard dirs are empty except for `.gitkeep`; `INDEX.md` matches dormant-folder template and inventory state.
- The tracked payload file `test-output/reconciliation-2026-03-27.json` remains in place.
- FAIL findings:
- None.
- WARNING findings:
- The scan manifest lists `0` file moves for this folder, so the requested 3-move spot-check is not applicable here.
- Git coverage is limited: only one tracked file exists under this path, and current status is only new standardization files (`INDEX.md`, standard dirs).

### `buyback-monitor` — FAIL
- A/B passed: root `INDEX.md` exists; five standard dirs exist; empty `decisions/` and `scratch/` have `.gitkeep`; `INDEX.md` matches active-folder template and inventory state.
- C passed within available sample: 2/2 manifest moves verified. `archive/CHANGELOG-2026-04-04.md` and `briefs/CODEX-V7-PIPELINE-REWRITE-BRIEF.md` exist; original root paths are gone.
- D/G passed: `docs/INDEX.md` exists; cron targets resolve.
- Hard-rule exception check passed: root `*.py`, `*.js`, and `*.sh` files remain at folder root; there is no `scripts/` directory.
- FAIL findings:
- `git status --short -- buyback-monitor` shows raw `D` entries for the two moved root files rather than rename entries.
- `git diff --name-only --diff-filter=M -- buyback-monitor` is not empty: `buy_box_monitor.py`, `pull_parts_data_v3.py`.
- WARNING findings:
- Only 2 file moves exist in the manifest, so a 3-move sample was not possible.
- `~/builds/agent-rebuild/idea-inventory.md:238` still references the old root path for `CODEX-V7-PIPELINE-REWRITE-BRIEF.md`.

### `data` — FAIL
- A/B passed: root `INDEX.md` exists; five standard dirs exist; empty `briefs/`, `decisions/`, `docs/`, and `archive/` have `.gitkeep`; `INDEX.md` matches dormant-folder template and inventory state.
- C passed within available sample: 2/2 manifest moves verified. `scratch/buyback-profitability-lookup.json` and `scratch/buy-box-check-2026-03-23.txt` exist; original root paths are gone.
- FAIL findings:
- `git status --short -- data` shows `D data/buy-box-check-2026-03-23.txt` and `D data/buyback-profitability-lookup.json` rather than rename entries only.
- `git diff -- data` is not empty because the moved tracked files are presented as deletions in the working tree.
- WARNING findings:
- Only 2 file moves exist in the manifest, so a 3-move sample was not possible.
- `~/builds/agent-rebuild/idea-inventory.md:233,235` still references the old root path for `buy-box-check-2026-03-23.txt`.
- The folder name is still overly generic and remains a Phase 7c cleanup candidate.

## Spot-checks summary

- Structure: all 6 folders have root `INDEX.md` plus `briefs/`, `decisions/`, `docs/`, `archive/`, and `scratch/`.
- Empty-dir markers: all empty standard dirs that were checked have `.gitkeep`.
- Required sub-indexes: all 4 required files exist.
- `/home/ricky/builds/backmarket/docs/INDEX.md`
- `/home/ricky/builds/backmarket-browser/docs/INDEX.md`
- `/home/ricky/builds/backmarket-browser/docs/audits/INDEX.md`
- `/home/ricky/builds/buyback-monitor/docs/INDEX.md`
- Move samples:
- `backmarket` 3/3 passed.
- `backmarket-browser` 3/3 passed.
- `backmarket-seller-support` 3/3 passed.
- `buyback-monitor` 2/2 available samples passed.
- `data` 2/2 available samples passed.
- `bm-scripts` N/A, no file moves listed in YAML.
- Inbound-ref spot-checks from YAML:
- `~/.openclaw/agents/main/workspace/LIVE-TODO.md:59` still points at old root `backmarket-browser/BROWSER-AGENT-TODO-2026-04-26.md` and is stale.
- `~/builds/agent-rebuild/idea-inventory.md:234,237` still points at old root `backmarket-seller-support/discovery.md` and is stale.
- `~/.openclaw/agents/backmarket/workspace/TOOLS.md:21` still points at `buyback-monitor/data/sell-prices-latest.json` and remains valid.
- Runtime paths:
- All cron targets for `backmarket` and `buyback-monitor` resolve.
- BM systemd unit `WorkingDirectory` paths resolve for `bm-shipping.service`, `bm-payout.service`, and `bm-grade-check.service`.
- `ExecStart` binaries referenced by these checks exist: `/usr/bin/node`, `/usr/bin/python3`.

## Final verdict

FAIL

Reason: the folder-standard structure itself is mostly in place and move spot-checks passed, but hard rule E is not satisfied in the live repo state. Scoped git checks for this batch show ordinary modifications to existing tracked files in `backmarket`, `backmarket-browser`, and `buyback-monitor`, and tracked moved files are currently represented as raw deletions rather than rename-only status in `backmarket`, `backmarket-browser`, `buyback-monitor`, and `data`.
