# Phase 7b SOP and KB Inventory - 2026-05-05

## Status

Read-only inventory pass complete. This is the first bridge from VPS cleanup into the end-state Ricky described: a clean source-of-truth estate, then an audited SOP list and KB build list that agents can work through without rediscovering the whole VPS.

No active Back Market, Intake, Inventory, Shopify, cron, systemd, or service files were changed.

## Purpose

Create the top-level operating map for:

- what SOPs already exist
- which sources are canonical, source candidates, or historical only
- what KB pages already exist
- what needs a verification/promote/rewrite pass
- which work queues should go to Back Market, Intake, Inventory/parts, Customer Service, Finance, Marketing, Operations, and Fleet/OpenClaw agents

## Source Authority Model

| Layer | Current location | Authority | Action |
|---|---|---|---|
| Canonical KB | `/home/ricky/kb` | Intended business truth for agents and humans, but many pages remain unverified or missing metadata | Lint, normalize metadata, update index, promote source-backed pages, mark weak pages clearly |
| Operations SOP drafts | `/home/ricky/kb/operations/sop-*.md` | Current general-ops SOP draft set | Keep as draft v1 until validated against live workflow and edge cases |
| Active Back Market SOPs | `/home/ricky/builds/backmarket/sops` | Current active BM working SOP set while BM lane is active | Do not move during active BM work; later promote stable SOP summaries into KB/backmarket and KB/operations |
| Fleet frozen source pack | `/home/ricky/fleet/system-audit-2026-03-31` | Immutable evidence/provenance, not latest truth | Use as source evidence only; do not treat stale gaps as current if active lanes have since fixed them |
| OpenClaw agent workspaces | `/home/ricky/.openclaw/agents/*/workspace` | Agent-local working memory and source candidates | Read-only as candidate material; promote through Code/Jarvis after review |
| Claude exports and old builds | `/home/ricky/Claude-SOPs-for-iCorrect`, `/home/ricky/builds-enquiry`, `/home/ricky/builds-fix-sold-price-lookup`, backups | Historical/provenance | Archive/reference only unless a human asks to mine them |

## Inventory Snapshot

### KB

- `/home/ricky/kb` currently has 110 markdown files and 1 YAML file.
- Only 48 markdown files expose a `status:` frontmatter field.
- Only 45 markdown files expose a `last_verified:` frontmatter field.
- Only 18 markdown files expose a `sources:` frontmatter field.
- `kb/index.md` says last updated 2026-04-13, so it is behind the current filesystem.
- Key files missing from the KB index include:
  - `backmarket/acquisition-policy.md`
  - `backmarket/spec-checker.md`
  - the newer customer-service pages such as `appointment-booking.md`, `courier-workflow.md`, `pricing-index.md`, `supported-devices.md`, `turnaround-tiers.md`, `warranty-policy.md`, and `xero-invoice-lookup.md`
  - `customer-service/pricing-overrides.yaml`
  - `system/google-oauth-refresh.md`
  - `system/runtime/browser-automation.md`
  - `system/runtime/gophr-end-to-end-map.md`
  - `system/runtime/london-ops-ai-architecture.md`

### Operations SOPs

`/home/ricky/kb/operations` contains 12 current general-operations SOP files:

- `sop-walk-in-simple-repair.md`
- `sop-walk-in-diagnostic.md`
- `sop-walk-in-corporate.md`
- `sop-mail-in-repair.md`
- `sop-mail-in-diagnostic.md`
- `sop-mail-in-corporate.md`
- `sop-bm-trade-in.md`
- `sop-bm-sale.md`
- `sop-bm-return.md`
- `sop-bm-return-repair.md`
- `sop-device-collection.md`
- `sop-quoting-process.md`

Current issue: most are plain draft documents with inline bold `Status` text, not the KB frontmatter format defined in `/home/ricky/kb/SCHEMA.md`.

Additional issue: `/home/ricky/kb/operations/README.md` still links to `sop-bm-trading.md`, but the actual file is `sop-bm-trade-in.md`.

### Back Market SOPs

`/home/ricky/builds/backmarket/sops` now contains an active BM SOP set that is newer than the frozen March/April system audit:

- `00-BACK-MARKET-MASTER.md`
- `01-trade-in-purchase.md`
- `02-intake-receiving.md`
- `03-diagnostic.md`
- `03b-trade-in-payout.md`
- `04-repair-refurb.md`
- `05-qc-final-grade.md`
- `06-listing.md`
- `06.5-listings-reconciliation.md`
- `07-buy-box-management.md`
- `08-sale-detection.md`
- `09-shipping.md`
- `09.5-shipment-confirmation.md`
- `10-payment-reconciliation.md`
- `11-tuesday-cutoff.md`
- `12-returns-aftercare.md`
- `13-counter-offers.md`

Important correction: the frozen system-audit SOP coverage doc says BM SOP 05 was missing. That is now stale. SOP 05 and SOP 13 exist in the active BM lane and should be treated as current candidate truth after the BM agent stabilizes the branch.

### OpenClaw SOP Candidates

OpenClaw contains useful but non-canonical candidate material, including:

- Alex/customer-service: `backmarket-sop.md`, `quote-building-sop.md`, `docs/SOPs/intercom-handling.md`
- Back Market: `exception-playbook.md`, `sop6-to-list-cards-2026-04-02.md`, SOP 6 memory notes
- Operations: `client-communication-sop-audit.md`, `intake-gate-sop-v0.1-2026-04-25.md`, `missing-sops-analysis.md`, `sop-kb-capture-method-audit-2026-04-28.md`
- Team: `mykhailo-weekly-signal-runbook.md`

These should be mined, but not treated as canonical until promoted into `/home/ricky/kb` or a domain repo with sources and verification status.

### Fleet Source Pack Hygiene

The fleet system-audit pack has a nested duplicate folder shape:

- local top-level source excluding nested copy: 144 files, including 11 `scripts/__pycache__/*.pyc` files
- local nested duplicate: 133 files
- VPS top-level source excluding nested copy: 133 files
- VPS nested duplicate: 144 files, including the 11 `__pycache__` files

This is not blocking SOP/KB work, but it is an ambiguity to clean after Mutagen settles: preserve one top-level frozen source pack, remove generated `__pycache__`, and remove the nested duplicate once checksums are verified.

## Highest-Priority SOP Build Queue

| Priority | SOP gap | Domain owner | Why it matters |
|---|---|---|---|
| P0 | Intake gate SOP | Intake / Operations | Active intake work must produce complete passcode, photos, stock, turnaround, customer, Monday, and Intercom handoff data. |
| P0 | Quote send, approval, and stale-exception SOP | Customer Service / Operations | Prevents `Diagnostic Complete`, `Quote Sent`, `Awaiting Part`, and `Repair Paused` jobs from silently ageing. |
| P0 | Customer communication SLA and chase SOP | Customer Service / Alex | Defines Intercom ownership, response targets, chase rules, and escalation for waiting customers. |
| P0 | Payment truth and Xero/Monday write-back SOP | Finance / Operations | Needed before agents can trust payment state, revenue channel reporting, corporate AR, or reconciliation. |
| P0 | General QC checklist and rejection/retest SOP | Operations / Workshop | BM has a newer SOP 05 candidate, but general repair QC still needs a verified checklist and evidence capture rule. |
| P1 | Non-BM outbound shipping / return dispatch SOP | Operations | BM shipping is much better documented than standard mail-in repair return logistics. |
| P1 | Phone lead promotion and follow-up SLA SOP | Customer Service / Operations | Prevents `log_only` phone enquiries from staying in Slack without owner, Intercom, or Monday follow-up. |
| P1 | Parts reservation, purchasing, wastage, and reorder SOP | Inventory / Parts | Must align with `panrix/icorrect-parts-service` and the active inventory agent, not the old root build folder. |
| P1 | Corporate intake, job creation, and AR closure SOP | Customer Service / Finance / Operations | Corporate work needs clear Monday creation, intake replacement, invoicing, and paid-state closure. |
| P1 | Back Market SOP promotion map | Back Market | Active BM SOPs need stable summaries in KB after current BM work lands, without disrupting the active branch. |
| P2 | Shopify-to-Intercom attribution SOP/build plan | Marketing / Customer Service / Operations | AWS SES is now authorized, but Ricky is not working on this today; keep it as a future queue item. |
| P2 | OpenClaw agent discipline SOP | Fleet/OpenClaw | Agents need branch/worktree/source-of-truth discipline so they do not work around GitHub or create new VPS mess. |

## KB Build Queue

| Priority | KB task | Owner | Notes |
|---|---|---|---|
| P0 | Run KB lint and write `/home/ricky/kb/inbox/lint-YYYY-MM-DD.md` | Code/Jarvis | Index gaps, missing metadata, stale status, orphan pages, old source paths, contradictions. |
| P0 | Normalize metadata for all canonical KB pages | Code/Jarvis | Every page should have `status`, `last_verified`, `sources`, and `related` where applicable. |
| P0 | Update `kb/index.md` | Code/Jarvis | Add missing backmarket, customer-service, system/runtime, and YAML entries. |
| P0 | Promote or mark customer-service draft pages | Customer Service / Alex | Many CS pages exist outside the index; decide which are canonical, draft, or archive. |
| P1 | Update Back Market KB section from active SOPs | Back Market / Code | Include SOP 05, SOP 13, spec checker, acquisition policy, and product ID resolution once BM lane is stable. |
| P1 | Create SOP index page in KB | Operations / Code | A single list of current SOPs, draft SOPs, and missing SOPs by domain. |
| P1 | Create KB gap index page | Code/Jarvis | A second list of missing or weak KB pages by domain. |
| P1 | Resolve `system` vs `systems` naming mismatch | Fleet/OpenClaw | `SCHEMA.md` says `systems/`, filesystem has `system/`. Decide once and update references. |
| P2 | Mine OpenClaw candidate docs into KB | Domain agents | Read-only extraction, then Code/Jarvis promotion after source verification. |

## Agent Working Rules To Add To OpenClaw Discipline

These should become part of the future OpenClaw discipline mapping:

1. Agents read `/home/ricky/kb` first and check page status before acting.
2. Agents treat `/home/ricky/kb` as read-only unless explicitly acting as Code/Jarvis with Ricky-approved promotion.
3. Agents use one Git branch/worktree per active task.
4. Agents state their repo, branch, cwd, and source-of-truth before making changes.
5. Agents do not write production docs into random VPS folders; they write into the owning repo/domain workspace.
6. Agents treat `fleet/system-audit-2026-03-31` as frozen evidence only.
7. Agents propose KB/SOP changes as structured patches or handoff notes, not silent edits.

## Recommended Next Sequence

1. Create a KB lint report in `/home/ricky/kb/inbox/`.
2. Create a canonical SOP inventory page in `/home/ricky/kb/operations/` after Ricky approves the shape.
3. Create a canonical KB gap index in `/home/ricky/kb/system/knowledge/`.
4. Give the Intake agent only the intake-gate SOP queue.
5. Give the Back Market agent only the BM SOP promotion/verification queue after its active branch lands.
6. Give the Inventory agent only the parts reservation/purchasing/wastage queue in `panrix/icorrect-parts-service`.
7. Keep Shopify-to-Intercom attribution as a future Marketing/CS/Ops queue item, because Ricky is not working on it today.

## Verification Commands

- `rg --files /Users/ricky/vps/kb`
- `find /Users/ricky/vps/{kb,operations,customer-service,fleet,team,finance,marketing,parts,inventory,backmarket,openclaw,.openclaw/agents} ...`
- `rg -l '^status:' /Users/ricky/vps/kb -g '*.md'`
- `rg -l '^last_verified:' /Users/ricky/vps/kb -g '*.md'`
- `rg -l '^sources:' /Users/ricky/vps/kb -g '*.md'`
- `find /Users/ricky/vps/builds/backmarket -maxdepth 3 -type f -path '*/sops/*.md'`

