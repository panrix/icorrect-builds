# Phase 7b Batch 2 Candidates - 2026-05-05

## Purpose

Identify the next cleanup batch that can proceed around active Back Market, Intake, and Inventory work.

This is a candidate plan only. Do not execute physical moves while `/Users/ricky/vps/builds` is an active Back Market checkout with uncommitted work.

## Current Blockers

- `/Users/ricky/vps/builds` is on `codex/backmarket` with active Back Market edits.
- `vps-core` still has 21 conflicts in active Alex, Back Market, and Intake files.
- Inventory is now active in `panrix/icorrect-parts-service` branch `codex/inventory-system`.
- Physical moves under `~/builds` would appear as deletes/moves in the active Back Market checkout and add noise to active agents.

## Freeze Continues

Do not touch these active product lanes:

- Back Market: `backmarket`, `backmarket-browser`, `buyback-monitor`, `icloud-checker`, `backmarket-seller-support`
- Intake: `intake-system`, `intake-notifications`, `quote-wizard`
- Inventory: `inventory-system`, `apple-ssr`, `mobilesentrix`, `icorrect-parts-service` / `~/inventory/parts-service`
- Shopify/website conversion while Shopify website work is active

## Candidate Batch 2

These folders are dormant or documentation-heavy and can be handled after the active checkout is quiet or when the move is small enough to isolate cleanly in a parent cleanup PR.

| Folder | Current state | Proposed destination | Action | Risk |
|---|---|---|---|---|
| `hiring` | dormant single job-description draft | `~/team/hiring` | completed 2026-05-05; see `PHASE-7b-BATCH-2-HIRING-MOVE-REPORT-2026-05-05.md` | low |
| `repair-analysis` | dormant scripts superseded by system audit profitability work | `~/fleet/archive/repair-analysis-2026-05` | archived 2026-05-05; see `PHASE-7b-BATCH-2-REPAIR-ANALYSIS-ARCHIVE-REPORT-2026-05-05.md` | low |
| `intercom-agent` | dormant superseded Intercom backend-agent spec | `~/customer-service/alex-triage/archive/intercom-agent-spec` | archived 2026-05-05; see `PHASE-7b-BATCH-2-INTERCOM-AGENT-ARCHIVE-REPORT-2026-05-05.md` | low |
| `alex-triage-classifier-rebuild` | dormant single classifier refactor brief | `~/customer-service/alex-triage/archive/classifier-rebuild` | archive/merge into Alex triage briefs after Alex conflict is resolved | medium because Alex has a current Mutagen conflict |
| `webhook-migration` | dormant control folder; Monday slice shipped, Shopify/Intercom slice unbuilt | `~/operations/webhook-migration` | moved 2026-05-05; see `PHASE-7b-BATCH-2-WEBHOOK-MIGRATION-MOVE-REPORT-2026-05-05.md` | low-medium |
| `website-conversion` | dormant Shopify conversion spec | defer | do not move while Shopify website work is active | deferred |

## Not Batch 2

These looked movable from the map, but are not safe for Batch 2:

| Folder | Reason to defer |
|---|---|
| `customer-service` | active Alex CS audit output workspace; contains PII-sensitive reports and module data. |
| `intercom-config` | active CS/Intercom strategy. |
| `llm-summary-endpoint` | live systemd service path. |
| `marketing-intelligence` | disabled live service plus auth/security concerns. |
| `monday` | active operations workspace and live status-notifications service. |
| `operations-system` | active process-truth workspace. |
| `pricing-sync` | dormant but has KB/OpenClaw inbound references and Back Market/pricing overlap. |
| `server-config` | sensitive VPS config snapshot with known secret-bearing PM2 dumps. |
| `shift-bot` | live systemd service. |
| `team-audits` | active team audit project with `.env` credential material. |
| `telephone-inbound` | live systemd service and PII log. |
| `whisper-api` | OpenClaw path reference must be patched before move. |
| `xero-invoice-notifications` | active/broken finance timer flow; live systemd timer path. |

## Recommended Execution Order

1. Wait for the active Back Market checkout to be committed/pushed or move cleanup to a clean VPS worktree.
2. Merge active-lane guardrail PRs before any move PR.
3. `hiring` was executed first as the smallest physical proof of Batch 2.
4. `repair-analysis` was archived because no live caller was found and the newer repair profitability source is in `system-audit-2026-03-31`.
5. `intercom-agent` was archived without touching live `alex-triage-rebuild` cron/systemd paths.
6. Handle `alex-triage-classifier-rebuild` only after the Alex Mutagen conflict is resolved.
7. `webhook-migration` was moved as documentation/control material; the live `status-notifications.service` runtime remains under `monday/services/status-notifications`.
8. Leave all active service folders for a dedicated service-path patch batch.

## Acceptance Checks

- `git status` captured before moves.
- No protected active-lane paths touched.
- New destination has an `INDEX.md`.
- Old source removed or replaced with pointer README only if needed.
- Path references patched in docs for any moved folder.
- Physical move and Git PR happen in the same batch, not separated across days.
