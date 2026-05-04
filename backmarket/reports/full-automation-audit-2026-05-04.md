# BackMarket Automation Audit — 2026-05-04

This pass traced the source-tracked automation from SENT intake through listing, VPS sale detection, shipping, payout, notifications, and reconciliation against `qa/ISSUES.md`.

## Stage Status

| Stage | Current alignment | Source-tracked fix in this pass |
|---|---|---|
| SOP 01 SENT intake | Mostly aligned, but live BM title variants could leave Main Board `board_relation5` blank. | `scripts/sent-orders.js` now normalizes ISO-date BM model titles and 2025 Air wording before lookup, and emits a Telegram warning when device lookup still fails. |
| SOP 03b payout | Service path exists, but blocked/failed webhook attempts were not auditable on Monday. | `services/bm-payout/index.js` now writes Monday failure markers for stale webhook, missing trade-in ID, iCloud lock, and BM API failures. |
| SOP 06 listing | Resolver/listing trust is much closer: trusted registry colour evidence and profitability review are separated from identity hard blocks. | `scripts/list-device.js` now makes registry-slot colour trust explicit and requires operator override for economic review cases. |
| SOP 06 live scrape | Public-page scrape still depends on BM/Cloudflare, but live listing is blocked unless the scrape verifies exact RAM/SSD/colour/grade/product evidence. | `scripts/lib/v7-scraper.js` now lazily loads browser deps, waits for actual `__NUXT_DATA__`, and retries transient page failures once. `scripts/list-device.js` refuses live execution on unreconciled scrape targets. |
| SOP 06 sales history | Cold lookups could scan too much history and look hung. | `scripts/lib/bm-api.js` now uses disk cache, request/overall timeouts, early stop on old pages, and only expands to the second order state if needed. |
| VPS sale detection | Flow 6/n8n is retired. Sales detection should be handled by the VPS script only. | `scripts/sale-detection.js` matches by BM Devices `text89` SKU, verifies ambiguity through Main Board status, and writes BM order/listing IDs to Main Board for shipping. |
| SOP 09.5 shipping | Service no longer depends on wrong `board_relation5`, but failures needed visible audit markers. | `services/bm-shipping/index.js` now writes Monday failure markers for missing tracking, serial, BM order ID, and BM API failures. |
| Notifications | Telegram/Slack routing was scattered and Telegram failures could be swallowed. | `scripts/lib/notifications.js` now owns BM Telegram + Slack mapping, API response validation, webhook fallback, and health-check output; the main BM scripts/services route through it. |
| SOP 06.5 reconciliation | Defaults are fail-safe and shared slots are constrained by exact specs. | Already present in working tree: `scripts/reconcile-listings.js` defaults to dry-run, gates mutations behind `--live`, and flags spec drift on shared listing IDs. |

## Remaining Non-Code / Live-Ops Checks

- `icloud-checker` silent spec-match failure: referenced fix lives on another branch/service and still needs deployment/log verification.
- QC To List Watch cron: needs VPS cron log inspection.
- n8n/Flow 6 is retired: no remediation should target n8n. Keep the VPS `sale-detection.js` path as the owner.
- Notifications live env: run `node scripts/notifications-health.js --probe` on the VPS to confirm `TELEGRAM_BOT_TOKEN`, `BM_TELEGRAM_CHAT`, and Slack auth/channel access.
- Monday `formula_mm0za8kh`: board formula/config issue, not fixable from repo files alone.
- Payout/shipping success evidence: code now emits failure evidence, but recent real events still need log + Monday webhook endpoint verification.
- Trusted catalogue ownership: code now has resolver/frontend-url guardrails, but a full one-owner/exact-pool repair requires a live Monday/browser-capture reconciliation run.
