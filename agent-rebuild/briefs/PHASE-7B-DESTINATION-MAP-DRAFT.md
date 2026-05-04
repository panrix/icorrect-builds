# Phase 7b Destination Map Draft

**Created:** 2026-05-04
**Status:** Ricky decisions accepted 2026-05-04; scripts/system-audit split design + repo-ownership cleanup pending
**Source context:** `folder-inventory.md`, `ownership-orphans-and-conflicts.md`, `briefs/top-level-taxonomy.md`, `PHASE-7a-CONSOLIDATION-REPORT.md`, `QA-PHASE-7a-report.md`

## Purpose

Phase 7a is structurally complete. Phase 7b is blocked on one thing: every `~/builds/` folder needs an explicit destination before any top-level moves happen.

This draft turns the inventory into an approvable map. It does not move files. After Ricky's 2026-05-04 review, the remaining blockers are not ownership decisions; they are audit/split design for `scripts/` and `system-audit-2026-03-31/`, plus the GitHub/VPS source-of-truth cleanup.

## Proposed domain roots

- `~/agent-rebuild/` or keep under `~/builds/agent-rebuild/` for now: fleet-meta rebuild workspace. Recommendation: keep in `~/builds/` until Phase 9.5, then decide.
- `~/backmarket/`: Back Market operations, browser runtime, seller-support snapshots, buyback monitor, BM leftovers.
- `~/customer-service/`: Alex/Intercom/customer-service triage and snapshots.
- `~/diagnostics/`: Elek board-viewer and diagnostics tooling.
- `~/finance/`: Xero invoice automation/notifications plus future revenue/cashflow truth.
- `~/intake/`: intake-system, intake notifications, quote-wizard, iCloud checker, telephone inbound, voice-note intake pipeline if not archived first.
- `~/marketing/`: marketing intelligence, Shopify theme, website conversion.
- `~/operations/`: Monday, ops-system, fulfillment rails, repair analysis, webhook migration, llm summary, ops docs/snapshots.
- `~/parts/`: parts service, Apple SSR, Mobilesentrix, inventory-system.
- `~/team/`: hiring, shift bot, team audits.
- `~/fleet/`: shared infrastructure and meta assets that are not one business domain.
- `~/archive/2026-05-04-phase-7-retired/`: dead/superseded folders after review.

## Destination Map

| folder | proposed destination | confidence | notes |
|---|---|---:|---|
| agent-rebuild | `~/builds/agent-rebuild/` | high | Active rebuild control plane. Keep stable until 7b/7c settle. |
| alex-triage-classifier-rebuild | `~/customer-service/alex-triage-classifier-rebuild/` | high | Dormant classifier brief, conceptually part of Alex rebuild. |
| alex-triage-rebuild | `~/customer-service/alex-triage-rebuild/` | high | Canonical Intercom triage workflow. |
| apple-ssr | `~/parts/apple-ssr/` | high | Parts lookup/order-history research. |
| backmarket | `~/backmarket/ops/` | high | Primary BM ops workspace; use `ops` child to avoid nested `backmarket/backmarket`. |
| backmarket-browser | `~/backmarket/browser/` | high | Large browser runtime with session-bearing data. Move only with runtime path checks. |
| backmarket-seller-support | `~/backmarket/seller-support/` | high | Read-only BM KB snapshot. |
| bm-scripts | `~/backmarket/archive/bm-scripts/` | medium | Tiny dormant leftover; archive inside BM unless Ricky wants global archive. |
| buyback-monitor | `~/backmarket/buyback-monitor/` | high | Live BM buyback monitoring/price management. |
| claude-project-export | `~/operations/claude-project-export/` | medium | Ricky override tagged operations, but it is snapshot-ish. |
| customer-service | `~/customer-service/audit-snapshot/` | high | Read-only CS audit corpus; Ferrari/BM slices can be extracted later. |
| data | `~/backmarket/scratch/data/` | medium | BM profitability/buy-box data drop; low-confidence and ambiguous name. |
| data-architecture | `~/archive/2026-05-04-phase-7-retired/data-architecture/` | high | Ricky decision 2026-05-04: archive; parked architecture snapshot is no longer an active domain unit. |
| documentation | `~/operations/documentation-staging/` | medium | Imported ops docs staging; could also be `~/fleet/documentation/`. |
| elek-board-viewer | `~/diagnostics/elek-board-viewer/` | high | Large diagnostics workspace; move carefully due 4.5G data. |
| hiring | `~/team/hiring/` | high | Team hiring collateral. |
| icloud-checker | `~/intake/icloud-checker/` | high | Live intake/trade-in webhook; coordinate with secrets follow-up. |
| icorrect-parts-service | `~/parts/icorrect-parts-service/` | high | Live parts service; coordinate with `.env` handling. |
| icorrect-shopify-theme | `~/marketing/shopify-theme/` | high | Ricky decision 2026-05-04: Shopify theme/store belongs to marketing. Also has independent GitHub repo; fix source-of-truth before moving. |
| intake-notifications | `~/intake/intake-notifications/` | high | Intake notification replacement spec. |
| intake-system | `~/intake/intake-system/` | high | Primary intake stack. |
| intercom-agent | `~/customer-service/intercom-agent/` | high | Intercom backend agent spec. |
| intercom-config | `~/customer-service/intercom-config/` | high | Intercom API/config research. |
| inventory-system | `~/parts/inventory-system/` | high | Parts/inventory operating model spec. |
| llm-summary-endpoint | `~/operations/llm-summary-endpoint/` | medium | Live Monday repair-summary endpoint; deployment context needs health check. |
| marketing-intelligence | `~/marketing/marketing-intelligence/` | high | MI dashboard/snapshot; coordinate basic-auth cleanup. |
| mobilesentrix | `~/parts/mobilesentrix/` | high | Supplier automation discovery pack. |
| monday | `~/operations/monday/` | high | Primary Monday board/integration workspace. |
| mutagen-guide | `~/fleet/mutagen-guide/` | high | Shared infrastructure guide. |
| operations-system | `~/operations/operations-system/` | high | Main operations process-truth workspace. |
| pricing-sync | `~/operations/pricing-sync/` | medium | Cross-system pricing audit; could later split finance/ops. |
| qa-system | `~/fleet/qa-system/` | high | Ricky decision 2026-05-04: fleet. Parked QA registry, not operations-specific yet. |
| quote-wizard | `~/intake/quote-wizard/` | medium | Shopify quote navigation builder; Arlo-owned but intake-facing. |
| repair-analysis | `~/operations/repair-analysis/` | high | Repair profitability scripts. |
| research | `~/fleet/research/` | high | OpenClaw/VPS/runtime meta research. |
| royal-mail-automation | `~/operations/royal-mail-automation/` | high | Shared fulfillment rail; BM/CS consumers, ops owner. |
| scripts | split now | high | Ricky decision 2026-05-04: audit and split now, not park. Proposed buckets: BM scripts, operations scripts, shared utilities. |
| server-config | `~/fleet/server-config/` | high | Sensitive VPS runtime snapshot; handle pm2 dump secrets before/with move. |
| shift-bot | `~/team/shift-bot/` | high | Team scheduling bot. |
| system-audit-2026-03-31 | split now | high | Ricky decision 2026-05-04: audit and split now by domain. Do not move as one blob. |
| team-audits | `~/team/team-audits/` | high | Active team audit project; coordinate `.env` cleanup. |
| telephone-inbound | `~/intake/telephone-inbound/` | medium | Live phone intake service; coordinate PII log cleanup. |
| templates | `~/fleet/templates/` | high | Shared scaffolding templates. |
| voice-note-pipeline | archive after stopping worker | high | Deprecated 2026-05-02; stop worker, archive logs/state, then archive folder. |
| voice-notes | `~/archive/2026-05-04-phase-7-retired/voice-notes/` | high | Dead per inventory. |
| webhook-migration | `~/operations/webhook-migration/` | high | Ricky decision 2026-05-04: operations. Believed complete, but verify before marking closed. |
| website-conversion | `~/marketing/website-conversion/` | high | Ricky decision 2026-05-04: marketing. |
| whisper-api | `~/intake/whisper-api/` | medium | Audio helper used by OpenClaw config; path patch must be exact. |
| xero-invoice-automation | `~/finance/xero-invoice-automation/` | high | Ricky decision 2026-05-04: approve `~/finance/` as a root. Xero is the seed of finance truth, not just ops plumbing. |
| xero-invoice-notifications | `~/finance/xero-invoice-notifications/` | high | Ricky decision 2026-05-04: pair with Xero automation under the finance root. |

## Rows That Block Automation

Ownership calls are now mostly resolved. These are the remaining blockers before a 7b migration script runs:

1. `scripts`: audit contents and write a split manifest before moving.
2. `system-audit-2026-03-31`: audit contents and write a domain split manifest before moving.
3. `webhook-migration`: verify completion and decide whether any unbuilt Shopify/Intercom residue remains.
4. GitHub/VPS source-of-truth cleanup: nested repos, broken gitlinks, dirty WIP, and tracked dependencies must be settled before top-level path migration.
5. Finance root: approved as `~/finance/` for Xero and future revenue/cashflow truth.

## Recommended Execution Order

1. **Stop and align GitHub/VPS truth first.** Current `~/builds` has unrelated source edits, nested repos, gitlinks without `.gitmodules`, and tracked `node_modules` deletions. Do not start 7b with a split-brain migration surface.
2. **Audit/split design:** write manifests for `scripts/` and `system-audit-2026-03-31/`; verify `webhook-migration/` completion.
3. **Optional security batch:** security is not a blocker per Ricky 2026-05-04, but do not reintroduce redacted PM2 dumps or inline credentials during moves.
4. **Runtime-sensitive migrations:** `whisper-api`, `icloud-checker`, `telephone-inbound`, `voice-note-pipeline`, `llm-summary-endpoint`, `buyback-monitor`, `backmarket-browser`, `icorrect-parts-service`.
5. **Domain migrations in atomic commits:** backmarket, intake, operations, customer-service, parts, marketing, team, diagnostics, finance, fleet.
6. **Archive/split pass:** data-architecture, voice-notes, voice-note-pipeline, scripts, system-audit, bm-scripts/data ambiguity.
7. **Final path sweep:** OpenClaw config, agent workspaces, KB, cron, systemd, `claude-audit-rebuild`, `agent-rebuild` inventories, and historical exceptions list.

## Notes From Current Local State

- The three KB files named in `QA-PHASE-7a-report.md` now point at `monday/docs/...`; stale old-path strings remain only in audit/report evidence.
- `~/builds/INDEX.md` is stale and still describes the pre-7a world. Rebuild it after 7b, not before.
- There are 2220 tracked `node_modules` files under `buyback-monitor/`; the working tree currently reports many deletions there. Decide separately whether to remove tracked dependencies in a cleanup commit.
