# Script Test Results

- Credentials source: `/home/ricky/config/api-keys/.env`
- Safety note: `parts_cost_audit.py` and `xero_revenue_by_repair.py` both rotate Xero refresh tokens by writing back to `.env`. To keep the run read-only against production credentials, they were executed against a temporary copy of that env file; no production data was modified.

## diagnostics_deep_dive.py
- Starts without import errors: Yes.
- Env vars / credentials: `MONDAY_APP_TOKEN`.
- Output / error: Ran with `--from-cache`. Rebuilt successfully from cached exports and wrote `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/diagnostics-deep-dive.md`.
- Production-ready fixes: replace the ad-hoc `--from-cache` argv check with a real CLI; make cache/report paths and report date configurable; add explicit preflight output about which cache files are required.

## gsc_crossref_lean.py
- Starts without import errors: Yes.
- Env vars / credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `EDGE_GOOGLE_REFRESH_TOKEN`.
- Output / error: First run failed because `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/repair-profitability-v2.md` did not exist yet. After `repair_profitability_v2.py` completed, it ran successfully, pulled GSC data, parsed `1122` profitability rows, and wrote `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/gsc-profitability-crossref-v2.md`.
- Production-ready fixes: fail fast with a clear prerequisite check for `repair-profitability-v2.md`; do not share an output filename with `gsc_profitability_crossref.py`; add CLI flags for output path/date ranges and a cache-only mode.

## gsc_profitability_crossref.py
- Starts without import errors: Yes.
- Env vars / credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `EDGE_GOOGLE_REFRESH_TOKEN`.
- Output / error: First run failed immediately with `FileNotFoundError` for `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/repair-profitability-v2.md`. After that prerequisite existed, a second run stayed alive for `300s` but produced no stdout/stderr and exited with timeout `124`. No output attributable to this run was produced; the shared `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/gsc-profitability-crossref-v2.md` file was from `gsc_crossref_lean.py`.
- Production-ready fixes: add visible progress logging; add prerequisite validation before starting API work; stop sharing the same output path as `gsc_crossref_lean.py`; add CLI/runtime controls so long runs can be bounded or resumed.

## gsc_repair_profit_rankings.py
- Starts without import errors: Yes.
- Env vars / credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `EDGE_GOOGLE_REFRESH_TOKEN`, `MONDAY_APP_TOKEN`.
- Output / error: Completed successfully. It wrote `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/gsc-repair-profit-rankings.md` after fetching GSC rows plus Monday product and parts data.
- Production-ready fixes: add CLI flags for output path/date windows; add a dry-run/auth-check mode; externalise hardcoded board IDs and thresholds.

## intercom_deep_metrics.py
- Starts without import errors: Yes.
- Env vars / credentials: an Intercom token matching `INTERCOM_(?:ACCESS_)?API?_?TOKEN` in `.env` (current file satisfies this with `INTERCOM_API_TOKEN`).
- Output / error: Ran with `--help` as the available safe path. Help text rendered cleanly; no runtime/auth path was exercised.
- Production-ready fixes: add a true dry-run or auth-check mode that validates the token and cache paths without fetching live conversation data; expose output/cache locations via CLI.

## intercom_full_metrics.py
- Starts without import errors: Yes.
- Env vars / credentials: an Intercom token matching `INTERCOM_(?:ACCESS_)?API?_?TOKEN` in `.env` (current file satisfies this with `INTERCOM_API_TOKEN`).
- Output / error: Ran with `--help` as the available safe path. Help text rendered cleanly; no runtime/auth path was exercised.
- Production-ready fixes: add a true dry-run or auth-check mode; expose report/export paths via CLI; add a lightweight dependency preflight before the expensive refresh path.

## monday_zombie_triage.py
- Starts without import errors: Yes.
- Env vars / credentials: `MONDAY_APP_TOKEN`.
- Output / error: A `120s` run timed out during board fetch. A `300s` run fetched all `4477` board rows, filtered down to `799` non-terminal rows, then reached update batch `12/40` before timing out with exit `124`. No `/home/ricky/fleet/system-audit-2026-03-31/monday-zombie-triage.md` file was written.
- Production-ready fixes: add resumable checkpoints for update/log batches; add CLI flags for limiting items/batches; add cache support for board snapshots; surface expected total runtime before starting.

## n8n_workflow_triage.py
- Starts without import errors: Yes.
- Env vars / credentials: `N8N_CLOUD_API_TOKEN`.
- Output / error: Ran with `--help` as the available safe path. Help text rendered cleanly; no live API call was made in this probe.
- Production-ready fixes: add a real dry-run/auth-check mode; make API base URL and output path configurable; add a lightweight connectivity test separate from full triage.

## parts_cost_audit.py
- Starts without import errors: Yes.
- Env vars / credentials: `MONDAY_APP_TOKEN`, `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REFRESH_TOKEN`, `XERO_TENANT_ID` and optional fallback token file `/tmp/xero-recon-ATuAJ1/xero-refresh-token.txt`.
- Output / error: First run failed immediately because `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/repair-profitability-v2.md` did not exist yet. After that prerequisite existed, it completed successfully under a temp env-file wrapper, refreshed Xero access, matched ACCPAY invoice lines, and wrote `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/parts-cost-audit.md`.
- Production-ready fixes: stop mutating the shared `.env` during token refresh; add clear prerequisite checks for upstream markdown inputs; add a no-write auth-check mode and an env-file override flag.

## product_cards.py
- Starts without import errors: Yes.
- Env vars / credentials: `MONDAY_APP_TOKEN`.
- Output / error: First run failed with `FileNotFoundError` for `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/repair-profitability-v2.md`. Second run failed with `FileNotFoundError` for `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/gsc-profitability-crossref-v2.md`. After both upstream files existed, it completed successfully and wrote `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/product-cards.md` with `347` cards.
- Production-ready fixes: add explicit preflight checks for both upstream markdown dependencies; make input/output paths configurable; fail with actionable dependency messages instead of raw `FileNotFoundError`.

## repair_profitability_model.py
- Starts without import errors: Yes.
- Env vars / credentials: `MONDAY_APP_TOKEN`.
- Output / error: Completed successfully and wrote `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/repair-profitability-model.md`. It also updated that file with live progress during execution.
- Production-ready fixes: add CLI flags for board IDs/output path; add a lightweight auth preflight mode; reduce reliance on hardcoded environment and board constants.

## repair_profitability_v2.py
- Starts without import errors: Yes.
- Env vars / credentials: `MONDAY_APP_TOKEN`, `SHOPIFY_ACCESS_TOKEN`.
- Output / error: A `180s` run timed out before writing output. A second run with a `480s` cap completed successfully and wrote `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/repair-profitability-v2.md`.
- Production-ready fixes: add checkpointing around the expensive status-activity-log step; expose a limit/sample mode for testing; add clearer runtime progress so long execution is observable.

## shopify_health_audit.py
- Starts without import errors: Yes.
- Env vars / credentials: `MONDAY_APP_TOKEN`, `SHOPIFY_STORE`, `SHOPIFY_ACCESS_TOKEN`.
- Output / error: Completed successfully and wrote `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/shopify-health-audit.md`.
- Production-ready fixes: add CLI flags for output path and optional scope limiting; add a dry-run/auth-check mode; externalise hardcoded board and file dependencies.

## xero_revenue_by_repair.py
- Starts without import errors: Yes.
- Env vars / credentials: `MONDAY_APP_TOKEN` in the Python script, plus `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, and `XERO_REFRESH_TOKEN` via `/home/ricky/config/xero_refresh.sh`; optional fallback token file `/tmp/xero-recon-ATuAJ1/xero-refresh-token.txt`.
- Output / error: Under the temp env-file wrapper, a `180s` run timed out while scoring matches. A `360s` run completed successfully and wrote `/home/ricky/fleet/system-audit-2026-03-31/docs/audits/xero-revenue-by-repair.md`, reporting `297` invoices and `470` revenue allocations.
- Production-ready fixes: stop depending on a helper script that writes back to the shared `.env`; add direct env-file override support; add CLI controls for date window/output path and better progress logging through the Xero and allocation phases.
