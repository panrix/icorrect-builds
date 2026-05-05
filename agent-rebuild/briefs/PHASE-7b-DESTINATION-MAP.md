# Phase 7b Destination Map

**Created:** 2026-05-05
**Status:** proposed execution map
**Scope:** top-level `~/builds/` cleanup after Phase 7a standardization
**Rule:** no physical move happens until source-of-truth is preserved, active work is clear, and path references are patched in the same batch.

## Operating Principles

1. `~/builds/` becomes only active experiments and unfinished build lanes.
2. Mature operating systems move to domain roots by business meaning.
3. Repo-owned projects keep their own GitHub repo as source of truth; the parent `icorrect-builds` repo keeps only pointer docs or control-plane notes.
4. Back Market, Intake, Inventory, and Shopify active work lanes are not moved mid-session.
5. Split folders are handled by audit-first copy/move plans, not by one blind rename.
6. Archive means date-stamped archive with an `INDEX.md` explaining why it moved.

## Target Top-Level Shape

```text
~/
├── backmarket/
├── customer-service/
├── diagnostics/
├── finance/
├── fleet/
├── intake/
├── inventory/
├── marketing/
├── operations/
├── team/
├── workshop/
├── archive/
└── builds/        # active experiments and temporary build lanes only
```

`~/fleet/` is the home for OpenClaw/fleet-meta docs, QA harnesses, audits, templates, and source-of-truth records that are not owned by a single business domain.

## Migration Waves

| Wave | Purpose | Folders |
|---|---|---|
| 0 | Merge GitHub pointer/source-of-truth PRs and remove temporary local masking | PRs #7, #8, #9, #10 |
| 1 | Low-risk archive and fleet-meta moves | Complete 2026-05-05; see `PHASE-7b-BATCH-1-REPORT.md` |
| 2 | Repo-owned standalone projects | Shopify, Parts, Royal Mail, Xero, Elek |
| 3 | Domain roots with active services | Operations, Finance, Team, Customer Service, Diagnostics; Inventory deferred while active |
| 4 | Active lanes only after their sessions are quiet | Back Market, Intake, Inventory, Shopify website work |
| 5 | Split-only folders | `scripts`, `system-audit-2026-03-31`, `webhook-migration`, ambiguous `data` |

## Per-Folder Destination Map

| Current folder | Destination | Action | Notes |
|---|---|---|---|
| `agent-rebuild` | `~/fleet/agent-rebuild` | move later | Keep in place until current cleanup PRs settle; this is the active control plane. |
| `alex-triage-classifier-rebuild` | `~/customer-service/alex-triage/archive/classifier-rebuild` | archive into domain | Dormant brief; preserve under Alex triage history. |
| `alex-triage-rebuild` | `~/customer-service/alex-triage` | move | Canonical Alex customer-service triage workflow. |
| `apple-ssr` | `~/inventory/suppliers/apple-ssr` | defer active | Supplier/parts research; freeze while Inventory lane is active. |
| `backmarket` | `~/backmarket/ops` | defer active | Active Back Market lane; move only when BM sessions are quiet. |
| `backmarket-browser` | `~/backmarket/browser` | defer active | Large browser runtime; audit session/profile data before moving. |
| `backmarket-seller-support` | `~/backmarket/seller-support` | defer active | Snapshot/support KB for BM automation. |
| `bm-scripts` | `~/backmarket/archive/bm-scripts` | archive | Dormant leftover output; keep for audit trail. |
| `buyback-monitor` | `~/backmarket/buyback-monitor` | defer active | Active BM buyback/pricing system. |
| `claude-project-export` | `~/fleet/archive/claude-project-export` | archive | Snapshot-of-other; not an active project. |
| `customer-service` | `~/customer-service/audits` | move | Read-only CS audit/report workspace. |
| `data` | split | audit first | Ambiguous ad hoc data drop; likely Back Market archive plus fleet note. |
| `data-architecture` | `~/fleet/archive/data-architecture` | archive | Ricky direction: archive/fleet reference, not active build. |
| `documentation` | `~/fleet/documentation` | move | Fleet documentation staging area. |
| `elek-board-viewer` | `~/diagnostics/elek-board-viewer` | move repo clone | Canonical repo is `panrix/elek-board-viewer`; large assets remain outside normal Git. |
| `hiring` | `~/team/hiring` | moved 2026-05-05 | Team domain. |
| `icloud-checker` | `~/backmarket/icloud-checker` | defer active | BM trade-in intake service; cross-reference from `~/intake/INDEX.md`. |
| `icorrect-parts-service` | `~/inventory/parts-service` | defer active | Canonical repo is `panrix/icorrect-parts-service`; active branch is `codex/inventory-system`. |
| `icorrect-shopify-theme` | `~/marketing/shopify-theme` | defer active | Canonical repo is `panrix/icorrect-shopify-theme`; current Shopify website work should use this repo directly. |
| `intake-notifications` | `~/intake/notifications` | defer active | Move with Intake stack. |
| `intake-system` | `~/intake/system` | defer active | Active Intake lane; includes unresolved `react-form` repo decision. |
| `intercom-agent` | `~/customer-service/alex-triage/archive/intercom-agent-spec` | archived 2026-05-05 | Dormant future Intercom service spec; preserve under Alex history and mine ideas during Phase 7c. |
| `intercom-config` | `~/customer-service/intercom-config` | move | Active Intercom configuration research. |
| `inventory-system` | `~/inventory/system` | defer active | Inventory operating model spec; do not move while Inventory agent is building. |
| `llm-summary-endpoint` | `~/operations/llm-summary-endpoint` | move with service check | Confirm systemd/nginx paths before move. |
| `marketing-intelligence` | `~/marketing/intelligence` | move after auth audit | Contains auth/basic-auth references; handle with Phase 7c security notes. |
| `mobilesentrix` | `~/inventory/suppliers/mobilesentrix` | defer active | Supplier automation discovery; freeze while Inventory lane is active. |
| `monday` | `~/operations/monday` | move | Monday schema and automation workspace. |
| `mutagen-guide` | `~/fleet/mutagen-guide` | move | Fleet setup guide. |
| `operations-system` | `~/operations/system` | move | Operations target-state build. |
| `pricing-sync` | `~/operations/pricing-sync` | move | Cross-system pricing process; cross-reference Marketing/Shopify. |
| `qa-system` | `~/fleet/qa-system` | move/archive | Ricky direction: fleet QA system, not a standalone build. |
| `quote-wizard` | `~/marketing/quote-wizard` | move | Shopify/conversion tool. |
| `repair-analysis` | `~/fleet/archive/repair-analysis-2026-05` | archived 2026-05-05 | Dormant hardcoded scratch scripts superseded by `system-audit-2026-03-31` repair profitability work. Rebuild a current workshop surface from the newer v2 pack if needed. |
| `research` | `~/fleet/research` | move/split later | Mixed fleet research; keep together for now. |
| `royal-mail-automation` | `~/operations/royal-mail-automation` | move repo clone | Canonical repo is `panrix/royal-mail-automation`. |
| `scripts` | split | audit first | Ricky direction: split into Back Market, operations, and utility/fleet scripts. |
| `server-config` | `~/fleet/server-config` | move after redaction plan | Sensitive VPS config snapshot; do not expose as normal docs. |
| `shift-bot` | `~/team/shift-bot` | move with service check | Active team scheduling bot. |
| `system-audit-2026-03-31` | split | audit first | Ricky direction: split now by domain; preserve original frozen audit under fleet. |
| `team-audits` | `~/team/audits` | move after credential review | Active team audit project; local secrets flagged by scans. |
| `telephone-inbound` | `~/operations/telephone-inbound` | move with service check | Active call intake server; PII/log handling belongs in Phase 7c. |
| `templates` | `~/fleet/templates` | move | Fleet template library. |
| `voice-note-pipeline` | `~/archive/2026-05-voice-note-pipeline-retired` | retire/archive | Stop worker first; module deprecated by Ricky. |
| `voice-notes` | `~/archive/2026-05-voice-notes-dead` | archive | Dead folder per inventory. |
| `webhook-migration` | `~/operations/webhook-migration` | split/close shipped slice | Monday-status slice shipped; Shopify/Intercom slice unbuilt. |
| `website-conversion` | `~/marketing/website-conversion` | move | Ricky direction: marketing/website conversion. |
| `whisper-api` | `~/fleet/whisper-api` | move with config patch | OpenClaw audio helper path is referenced from config; patch and verify voice note transcription. |
| `xero-invoice-automation` | `~/finance/xero-invoice-automation` | move repo clone | Canonical repo is `panrix/xero-invoice-automation`. |
| `xero-invoice-notifications` | `~/finance/xero-invoice-notifications` | move | Finance/Xero notification workflow. |

## Split Folder Rules

### `scripts`

Do not move as one unit. First inventory each script with:

- script name
- shebang/runtime
- owning domain
- inputs/secrets
- known callers from cron, systemd, OpenClaw config, or docs
- last modified date

Then move to:

- `~/backmarket/scripts/`
- `~/operations/scripts/`
- `~/fleet/scripts/`

Anything with unclear ownership stays quarantined in `~/fleet/scripts/pending-classification/` with an INDEX entry.

### `system-audit-2026-03-31`

Preserve the original frozen audit pack under:

`~/fleet/system-audit-2026-03-31`

Then extract domain-specific summaries/references to:

- `~/operations/docs/audits/`
- `~/marketing/docs/audits/`
- `~/finance/docs/audits/`
- `~/customer-service/docs/audits/`
- `~/team/docs/audits/`
- `~/inventory/docs/audits/`
- `~/diagnostics/docs/audits/`

Do not edit the frozen source pack during extraction.

### `webhook-migration`

Move the control folder to:

`~/operations/webhook-migration`

Then split state:

- shipped Monday-status work -> `archive/` inside the folder with a completion note
- unbuilt Shopify/Intercom slices -> `briefs/` with open status

## First Physical Move Batch

Run only after PRs #7-#10 are ready/merged and local skip-worktree masking is unwound.

1. `voice-notes` -> archive
2. `data-architecture` -> `~/fleet/archive/data-architecture`
3. `qa-system` -> `~/fleet/qa-system`
4. `templates` -> `~/fleet/templates`
5. `mutagen-guide` -> `~/fleet/mutagen-guide`
6. `documentation` -> `~/fleet/documentation`
7. `research` -> `~/fleet/research`

These are low-risk because they are dormant/fleet-meta and do not overlap the active Back Market, Intake, or Shopify work lanes.

## Acceptance Check For Each Physical Batch

- `git status` captured before the batch.
- Repo-owned folders are clean or committed before moving.
- All path references patched in OpenClaw config, agent workspaces, KB, cron, systemd, and docs.
- Moved folder has an `INDEX.md` at the new location.
- Old location has either disappeared cleanly or contains a pointer README if needed.
- Service health checked for any active service moved.
- Batch committed or documented before starting the next batch.
