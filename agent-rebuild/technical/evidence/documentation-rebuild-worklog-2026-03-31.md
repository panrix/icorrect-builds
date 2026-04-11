# Documentation Rebuild Worklog

Date opened: 2026-03-31
Owner: Codex
Status: Completed

Current state summary:

- `/home/ricky/builds/agent-rebuild/technical/control/documentation-state-summary-2026-04-01.md`

## Purpose

This document is the completed execution log for the documentation rebuild tranche.

It records:

- core document audit and rebuild
- KB version-control setup
- `/home/ricky/builds` documentation triage
- Obsidian preparation
- verification results
- open issues and deferred risks

This is not a canonical knowledge document.

This file is no longer the active control sheet. Use the current state summary for the short live view and use this worklog as the detailed evidence trail.

## Current Verified State

- OpenClaw is the active runtime.
- Paperclip is parked.
- Mission Control v2 is legacy only.
- `/home/ricky/.openclaw/openclaw.json` currently has `14` configured agents as of the 2026-04-01 post-cleanup snapshot.
- `/home/ricky/.openclaw/agents` currently has `14` active directories as of the 2026-04-01 post-cleanup snapshot.
- `/home/ricky/.openclaw` is currently `1.8G`.
- `/home/ricky/kb` exists and is acting as the shared knowledge base.
- `/home/ricky/kb` is a git repository and is the cleanest place to keep canonical doc history.
- `/home/ricky/.openclaw` is not a git repository.
- `/home/ricky/builds` is the main tracked repo root and is currently dirty with unrelated work.
- `/home/ricky/builds` contains a large documentation footprint and should not remain a de facto second knowledge base.
- the completed worklog under `/home/ricky/builds/agent-rebuild/technical/evidence` and the verification ledger under `/home/ricky/builds/agent-rebuild/technical/control` are currently untracked inside the larger `builds` repo
- `/home/ricky/builds/agent-rebuild/archive/2026-04-01/` now holds the first dated archive tranche for superseded rebuild docs

## Phase Goal

Leave the system with:

- a rebuilt core document set that is current and minimal
- a version-controlled KB
- a clear rule for what stays in `/home/ricky/builds`
- a documented promotion path from `/builds` into `/home/ricky/kb`
- an Obsidian-ready KB structure without introducing a second source of truth

## Guardrails

- Do not use `/home/ricky/builds` as the canonical source of truth for operations
- Do not move docs into Obsidian before KB structure is settled
- Do not rewrite large doc sets blindly without classification first
- Do not mix working logs with canonical KB docs
- Do not lose historical material; archive before deleting

## Scope

### In Scope

- audit and rebuild core docs in `/home/ricky/kb`
- use the existing git repo in `/home/ricky/kb` as the canonical doc history
- classify documentation under `/home/ricky/builds`
- define the KB-to-Obsidian integration path
- create a durable documentation policy for ongoing work

### Out Of Scope For This Tranche

- making Paperclip authoritative
- implementing Obsidian Sync or desktop setup
- rebuilding every project-specific README in one pass
- deleting large legacy doc trees without classification

## Canonical Rules

- Canonical shared docs live in `/home/ricky/kb`
- Repo-local implementation docs live in `/home/ricky/builds/<project>`
- Historical execution material lives in archive locations
- Obsidian should use `/home/ricky/kb` as its vault root

Reference policies:

- [workspace-contract.md](/home/ricky/kb/system/workspace-contract.md)
- [live-operating-map.md](/home/ricky/kb/system/live-operating-map.md)
- [builds-documentation-policy.md](/home/ricky/kb/system/builds-documentation-policy.md)
- [kb-verification-framework.md](/home/ricky/kb/system/kb-verification-framework.md)
- [kb-promotion-map.md](/home/ricky/kb/system/kb-promotion-map.md)
- [obsidian-vault-structure.md](/home/ricky/kb/system/obsidian-vault-structure.md)
- [kb-verification-ledger-2026-03-31.md](/home/ricky/builds/agent-rebuild/technical/control/kb-verification-ledger-2026-03-31.md)

## Workstreams

### Workstream 1: Core KB Rebuild

Objective:

- rebuild the core document set so it is current, concise, and trustworthy

Target documents:

- `kb/system/live-operating-map.md`
- `kb/system/workspace-contract.md`
- `kb/system/agent-map.md`
- `kb/system/supabase-schema.md`
- KB indexes and key domain landing pages

Verification rule:

- no core document is treated as canonical until it has a ledger entry and an explicit status

### Workstream 2: KB Version Control

Objective:

- put the canonical knowledge layer under clean version control

Planned actions:

1. verify the git state in `/home/ricky/kb`
2. keep `.gitignore` aligned with KB/Obsidian needs
3. commit verified KB documentation tranches cleanly
4. use KB git history for future doc changes

### Workstream 3: `/builds` Documentation Triage

Objective:

- stop `/home/ricky/builds` from functioning as an accidental second KB

Priority clusters:

1. `/home/ricky/builds/agent-rebuild`
2. `/home/ricky/builds/backmarket`
3. `/home/ricky/builds/monday`
4. `/home/ricky/builds/intake-system`
5. `/home/ricky/builds/documentation/raw-imports`

Classification labels:

- `Keep local`
- `Promote to KB`
- `Archive`

### Workstream 4: Obsidian Preparation

Objective:

- prepare KB so Obsidian can be added cleanly later

Planned actions:

1. use `/home/ricky/kb` as the vault root
2. create any missing structural folders such as:
   - `inbox/`
   - `decisions/`
3. define promotion rules from workspaces and `/builds`
4. keep runtime chatter and dumps out of the vault

## Execution Order

1. Confirm this worklog as the live control document
2. Audit current KB core docs and mark rebuild targets
3. Verify and use the KB git repo
4. Triage `/home/ricky/builds/agent-rebuild`
5. Triage `/home/ricky/builds/backmarket`
6. Triage `/home/ricky/builds/monday`
7. Triage `/home/ricky/builds/intake-system`
8. Triage `/home/ricky/builds/documentation/raw-imports`
9. Create the KB promotion map for Obsidian readiness

## Status Board

### Workstream Status

- Core KB rebuild: `in progress`
- KB git setup: `completed`
- `/builds` doc triage: `completed`
- Obsidian preparation: `completed`

### Cluster Status

- `agent-rebuild`: `reorganized`
- `backmarket`: `classified`
- `monday`: `classified`
- `intake-system`: `classified`
- `documentation/raw-imports`: `classified`

## Task Checklist

- [x] Confirm this worklog as the active control sheet
- [x] Create KB verification framework
- [x] Create KB verification ledger
- [x] Audit KB core docs
- [x] Create KB document inventory
- [x] Verify KB git repo exists and is usable
- [x] Add KB `.gitignore`
- [x] Create KB baseline commit
- [x] Triage `builds/agent-rebuild`
- [x] Triage `builds/backmarket`
- [x] Triage `builds/monday`
- [x] Triage `builds/intake-system`
- [x] Triage `builds/documentation/raw-imports`
- [x] Create KB promotion map
- [x] Define Obsidian vault structure

## Decision Log

### 2026-03-31

- OpenClaw remains the active system
- Paperclip remains parked
- Mission Control v2 remains legacy only
- KB is the intended canonical knowledge layer
- Obsidian will be added on top of KB, not beside it
- KB verification will use an evidence-first ledger before any document is treated as fully canonical

## Verification Log

### Baseline

- Verified `.openclaw/openclaw.json` configured agents: `14`
- Verified on-disk `.openclaw/agents` directories: `14`
- Verified `.openclaw` disk usage: `1.8G`
- Verified `kb/` is a git repo
- Verified `.openclaw/` is not a git repo
- Verified `/home/ricky/builds` remains a dirty git working tree

### 2026-03-31 KB verification program started

- Created [kb-verification-framework.md](/home/ricky/kb/system/kb-verification-framework.md)
- Created [kb-verification-ledger-2026-03-31.md](/home/ricky/builds/agent-rebuild/technical/control/kb-verification-ledger-2026-03-31.md)
- Created [kb-document-inventory-2026-03-31.md](/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/triage-executed/kb-document-inventory-2026-03-31.md)
- Marked system, operations, Monday, pricing, and team docs with initial verification statuses in the ledger
- Identified [supabase-schema.md](/home/ricky/kb/system/supabase-schema.md) as the highest-risk system doc

### 2026-03-31 Wave 2 header and control-doc QA

- Verified the raw-imports triage sheet matches the actual file set under `/home/ricky/builds/documentation/raw-imports`
- Verified the KB promotion map and Obsidian vault structure docs exist and are internally aligned
- Refreshed Wave 2 `Last verified` headers across `operations`, `monday`, `pricing`, and `team` docs to reflect the active 2026-03-31 review pass
- Promoted the staged coding-task-format note into [coding-task-document-format.md](/home/ricky/kb/system/coding-task-document-format.md)
- Confirmed the source note now lives at `/home/ricky/data/archives/kb-inbox/2026-03-31/knowledge/claude-code-task-format.md`
- Corrected the canonical evidence path so it no longer points at a removed inbox file
- Recounted the active inbox subtree at `17` markdown files after the archive moves

### 2026-03-31 Inbox reduction: policy promotion tranche

- Confirmed the promoted policy doc [coding-task-document-format.md](/home/ricky/kb/system/coding-task-document-format.md) preserves the source note's important implementation guardrails
- Confirmed the original staged source note now lives at `/home/ricky/data/archives/kb-inbox/2026-03-31/knowledge/claude-code-task-format.md`
- Confirmed the active inbox subtree count reduced from `18` to `17`
- Confirmed no canonical docs still reference the old live inbox path for the task-format note

### 2026-03-31 Inbox reduction: Monday evidence tranche

- Confirmed the live schema note now lives at `/home/ricky/data/archives/kb-inbox/2026-03-31/knowledge/monday-main-board-schema.md`
- Confirmed canonical Monday docs point at the archived evidence copy rather than the inbox path
- Confirmed the active inbox subtree count reduced from `17` to `16`
- Confirmed no canonical docs still reference the old live inbox path for the Monday schema note

### 2026-03-31 Inbox reduction: Back Market domain tranche

### 2026-04-01 Main coordinator root-doc tranche

- Verified the live `main` agent roster, bindings, running services, and current crontab before changing root docs.
- Added the missing [CLAUDE.md](/home/ricky/.openclaw/agents/main/workspace/CLAUDE.md).
- Rewrote [AGENTS.md](/home/ricky/.openclaw/agents/main/workspace/AGENTS.md), [TOOLS.md](/home/ricky/.openclaw/agents/main/workspace/TOOLS.md), [MEMORY.md](/home/ricky/.openclaw/agents/main/workspace/MEMORY.md), [HEARTBEAT.md](/home/ricky/.openclaw/agents/main/workspace/HEARTBEAT.md), and [WORKING-STATE.md](/home/ricky/.openclaw/agents/main/workspace/WORKING-STATE.md) against the current OpenClaw and KB authority model.
- Removed stale coordinator assumptions about Mission Control v2, `agent-trigger`, retired QA agents, the dead Monday wrapper path, and `session_status` checkpointing as live operating instructions.
- Archived the leftover `main` workspace `knowledge/` subtree to `/home/ricky/data/archives/workspaces/main/2026-04-01/knowledge/` so the live coordinator root matches the current workspace contract more closely.
- Confirmed the live `main` root doc set now includes `CLAUDE.md`.

### 2026-04-01 Customer-service workspace cleanup tranche

- Rebuilt the customer-service core-doc layer: [IDENTITY.md](/home/ricky/.openclaw/agents/customer-service/workspace/IDENTITY.md), [SOUL.md](/home/ricky/.openclaw/agents/customer-service/workspace/SOUL.md), [CLAUDE.md](/home/ricky/.openclaw/agents/customer-service/workspace/CLAUDE.md), [AGENTS.md](/home/ricky/.openclaw/agents/customer-service/workspace/AGENTS.md), [MEMORY.md](/home/ricky/.openclaw/agents/customer-service/workspace/MEMORY.md), [TOOLS.md](/home/ricky/.openclaw/agents/customer-service/workspace/TOOLS.md), [HEARTBEAT.md](/home/ricky/.openclaw/agents/customer-service/workspace/HEARTBEAT.md), and [WORKING-STATE.md](/home/ricky/.openclaw/agents/customer-service/workspace/WORKING-STATE.md).
- Removed Mission Control v2, dead QA, stale sub-agent, and obsolete checkpoint assumptions from the root instruction layer.
- Archived the largest raw Intercom exports to `/home/ricky/data/archives/workspaces/customer-service/2026-04-01/data/`.
- Archived the root `archive/` directory to `/home/ricky/data/archives/workspaces/customer-service/2026-04-01/archive/`.
- Added [README.md](/home/ricky/.openclaw/agents/customer-service/workspace/data/README.md) under local `data/` so the workspace points to the archived evidence cleanly.
- Moved [IMPROVEMENTS.md](/home/ricky/.openclaw/agents/customer-service/workspace/docs/IMPROVEMENTS.md) under `docs/` to reduce root clutter.
- Reduced the live customer-service workspace from approximately `149M` to approximately `7.8M`.

### 2026-04-01 Systems workspace cleanup tranche

- Rebuilt the systems core-doc layer: [IDENTITY.md](/home/ricky/.openclaw/agents/systems/workspace/IDENTITY.md), [SOUL.md](/home/ricky/.openclaw/agents/systems/workspace/SOUL.md), [CLAUDE.md](/home/ricky/.openclaw/agents/systems/workspace/CLAUDE.md), [AGENTS.md](/home/ricky/.openclaw/agents/systems/workspace/AGENTS.md), [MEMORY.md](/home/ricky/.openclaw/agents/systems/workspace/MEMORY.md), [TOOLS.md](/home/ricky/.openclaw/agents/systems/workspace/TOOLS.md), [HEARTBEAT.md](/home/ricky/.openclaw/agents/systems/workspace/HEARTBEAT.md), and [WORKING-STATE.md](/home/ricky/.openclaw/agents/systems/workspace/WORKING-STATE.md).
- Removed stale Mission Control v2, dead QA, `agent-trigger`, stale roster, and obsolete checkpoint assumptions from the root instruction layer.
- Moved the root `archive/` directory to `/home/ricky/data/archives/workspaces/systems/2026-04-01/archive/`.
- Moved [IMPROVEMENTS.md](/home/ricky/.openclaw/agents/systems/workspace/docs/IMPROVEMENTS.md) under `docs/` to reduce root clutter.

### 2026-04-01 Website workspace cleanup tranche

- Rebuilt the website core-doc layer: [CLAUDE.md](/home/ricky/.openclaw/agents/website/workspace/CLAUDE.md), [AGENTS.md](/home/ricky/.openclaw/agents/website/workspace/AGENTS.md), [MEMORY.md](/home/ricky/.openclaw/agents/website/workspace/MEMORY.md), [TOOLS.md](/home/ricky/.openclaw/agents/website/workspace/TOOLS.md), [HEARTBEAT.md](/home/ricky/.openclaw/agents/website/workspace/HEARTBEAT.md), and [WORKING-STATE.md](/home/ricky/.openclaw/agents/website/workspace/WORKING-STATE.md).
- Updated [SOUL.md](/home/ricky/.openclaw/agents/website/workspace/SOUL.md) to remove stale pre-compaction/Supabase behavior, old coordination wording, and the missing `WORKING.md` reference.
- Removed stale Mission Control task-tracking, dead QA flow, stale persistent-agent roster, and obsolete checkpoint assumptions from the root instruction layer.
- Moved [IMPROVEMENTS.md](/home/ricky/.openclaw/agents/website/workspace/docs/IMPROVEMENTS.md) under `docs/` to reduce root clutter.
- Archived the unused `knowledge/` placeholder directory to `/home/ricky/data/archives/workspaces/website/2026-04-01/knowledge/`.

### 2026-04-01 Team workspace cleanup tranche

- Rebuilt the team core-doc layer: [IDENTITY.md](/home/ricky/.openclaw/agents/team/workspace/IDENTITY.md), [CLAUDE.md](/home/ricky/.openclaw/agents/team/workspace/CLAUDE.md), [AGENTS.md](/home/ricky/.openclaw/agents/team/workspace/AGENTS.md), [MEMORY.md](/home/ricky/.openclaw/agents/team/workspace/MEMORY.md), [TOOLS.md](/home/ricky/.openclaw/agents/team/workspace/TOOLS.md), [HEARTBEAT.md](/home/ricky/.openclaw/agents/team/workspace/HEARTBEAT.md), and [WORKING-STATE.md](/home/ricky/.openclaw/agents/team/workspace/WORKING-STATE.md).
- Updated [SOUL.md](/home/ricky/.openclaw/agents/team/workspace/SOUL.md) to remove stale pre-compaction/Supabase behavior, obsolete agent-role references, and the missing `WORKING.md` reference.
- Removed stale Mission Control task-tracking, dead QA flow, stale persistent-agent architecture, and obsolete checkpoint assumptions from the root instruction layer.
- Moved [IMPROVEMENTS.md](/home/ricky/.openclaw/agents/team/workspace/docs/IMPROVEMENTS.md) under `docs/` to reduce root clutter.
- Archived the unused `knowledge/` placeholder directory to `/home/ricky/data/archives/workspaces/team/2026-04-01/knowledge/`.

### 2026-04-01 Marketing workspace cleanup tranche

- Rebuilt the marketing core-doc layer: [IDENTITY.md](/home/ricky/.openclaw/agents/marketing/workspace/IDENTITY.md), [SOUL.md](/home/ricky/.openclaw/agents/marketing/workspace/SOUL.md), [CLAUDE.md](/home/ricky/.openclaw/agents/marketing/workspace/CLAUDE.md), [AGENTS.md](/home/ricky/.openclaw/agents/marketing/workspace/AGENTS.md), [MEMORY.md](/home/ricky/.openclaw/agents/marketing/workspace/MEMORY.md), [TOOLS.md](/home/ricky/.openclaw/agents/marketing/workspace/TOOLS.md), [HEARTBEAT.md](/home/ricky/.openclaw/agents/marketing/workspace/HEARTBEAT.md), and [WORKING-STATE.md](/home/ricky/.openclaw/agents/marketing/workspace/WORKING-STATE.md).
- Removed stale Mission Control task-tracking, dead QA flow, stale merged-domain ownership, dormant sub-agent assumptions, and obsolete checkpoint assumptions from the root instruction layer.
- Moved the root `archive/` directory to `/home/ricky/data/archives/workspaces/marketing/2026-04-01/archive/`.
- Moved the root `tmp/` directory to `/home/ricky/data/archives/workspaces/marketing/2026-04-01/tmp/`.
- Moved [IMPROVEMENTS.md](/home/ricky/.openclaw/agents/marketing/workspace/docs/IMPROVEMENTS.md) under `docs/` to reduce root clutter.
- Archived the unused `knowledge/` placeholder directory to `/home/ricky/data/archives/workspaces/marketing/2026-04-01/knowledge/`.
- Kept `intelligence/` in the live workspace because it appears to be active local tooling rather than passive residue.

- Created `/home/ricky/kb/backmarket/` as the canonical home for durable Back Market knowledge
- Added [README.md](/home/ricky/kb/backmarket/README.md) to define scope and keep time-sensitive commercial notes out of canon
- Added [product-id-resolution.md](/home/ricky/kb/backmarket/product-id-resolution.md) as the corrected canonical summary of BM `product_id` behavior
- Verified `/home/ricky/builds/backmarket/data/product-id-lookup.json` exists with `279` top-level entries
- Corrected the stale historical lookup path from `bm-scripts/` to `backmarket/data/` in the canonical summary
- Archived the inbox copy of `knowledge/bm-product-ids.md` to `/home/ricky/data/archives/kb-inbox/2026-03-31/knowledge/bm-product-ids.md`
- Confirmed the active inbox subtree count reduced from `16` to `14` because the archived team-state note was also no longer present on the live inbox surface

### 2026-03-31 Inbox reduction: Back Market commercial snapshot tranche

- Verified `buyback-strategy.md` and `revenue-model.md` are March 2026 snapshot notes rather than current canonical guidance
- Confirmed their real evidence anchors remain in `/home/ricky/builds/buyback-monitor/docs/PROFITABILITY-FINDINGS.md` and related build docs
- Archived both notes to `/home/ricky/data/archives/kb-inbox/2026-03-31/knowledge/`
- Updated [README.md](/home/ricky/kb/backmarket/README.md) so the domain keeps those notes as archived evidence, not live staged material
- Confirmed the active inbox subtree count reduced from `14` to `12`

### 2026-03-31 Inbox reduction: team evidence tranche

- Confirmed the team-state snapshot now lives at `/home/ricky/data/archives/kb-inbox/2026-03-31/knowledge/team-state.md`
- Confirmed canonical team docs point at the archived evidence copy rather than the inbox path
- Confirmed the active inbox subtree count reduced from `16` to `14` after the archive move
- Confirmed no canonical docs still reference the old live inbox path for the team-state note

### 2026-03-31 Inbox reduction: Intake build-material relocation

- Moved the Slack intake implementation pack out of KB inbox and into `/home/ricky/builds/intake-notifications/specs/slack-intake-2026-03-31/`
- Verified `intake-process-v2.md` now lives in `/home/ricky/builds/intake-system/docs/staged/2026-03-31/` with the rendered HTML/PDF under `artifacts/`
- Updated [intake-flow.md](/home/ricky/kb/operations/intake-flow.md) so the canonical operations doc points at the build-local master plan instead of the old inbox path
- Updated the moved master-plan doc so its internal file references resolve within the new project location
- Confirmed the active inbox subtree count reduced from `12` to `5`

### 2026-03-31 KB inbox triage

- Created [kb-inbox-triage-2026-03-31.md](/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/triage-executed/kb-inbox-triage-2026-03-31.md) to classify staged inbox material into promote, keep staged, and archive groups
- Confirmed the staged inbox subtree contains `23` markdown files and is the largest remaining non-canonical surface inside KB
- Identified the highest-risk competing truth in inbox at triage start: `intake-process-v2.md`, `knowledge/monday-main-board-schema.md`, `docs/buyback-monday-schema.md`, and `knowledge/team-state.md`
- Confirmed that the Monday schema conflict has since been resolved by refreshing canon and archiving the raw evidence note

### 2026-03-31 Monday canonical refresh from inbox evidence

- Refreshed [main-board.md](/home/ricky/kb/monday/main-board.md) with the March 31 live schema note as the strongest current schema evidence
- Updated the canonical Monday docs with fresher service values, client values, repair-type enum, BM Trade-in ID labeling, and the full current group inventory
- Refreshed [board-relationships.md](/home/ricky/kb/monday/board-relationships.md) with the confirmed Devices Board ID, `Custom Products` board relation, `Parts Required` relation, and unresolved Client Information Capture relation
- Narrowed the remaining Monday inbox risk to the conflicting `docs/buyback-monday-schema.md` note rather than the main-board schema itself

### 2026-03-31 Intake overlap reconciliation

- Marked [intake-flow.md](/home/ricky/kb/operations/intake-flow.md) as the canonical intake status document while explicitly stating that no verified company-wide SOP exists yet
- Marked [intake-process-v2.md](/home/ricky/builds/intake-system/docs/staged/2026-03-31/intake-process-v2.md) as a staged front-desk pilot proposal rather than canonical process truth
- Added explicit pilot-boundary language so Monday remains the canonical intake record and the Slack thread remains supplemental handoff tooling
- Softened canonical intake headings so spec-derived hard gates and intake paths no longer read like a fully verified live SOP

### 2026-03-31 Intake path normalization QA

- Rechecked the live inbox filesystem and confirmed only `5` markdown files remain under `/home/ricky/kb/inbox/main-workspace-2026-03-31/`
- Confirmed canonical intake docs no longer point at stale KB inbox paths for the pilot markdown or Slack intake master plan
- Left the intake pilot material in build-local homes under `/home/ricky/builds/intake-system/` and `/home/ricky/builds/intake-notifications/`

### 2026-03-31 Remaining build-spec rehome tranche

- Confirmed `pricing-sync-brief.md` now lives under `/home/ricky/builds/pricing-sync/docs/staged/2026-03-31/`
- Moved `profit-calculator-spec.md` out of KB inbox and into `/home/ricky/builds/backmarket/docs/staged/2026-03-31/profit-calculator-spec.md`
- Rechecked the live inbox filesystem and confirmed only `3` markdown files remain under `/home/ricky/kb/inbox/main-workspace-2026-03-31/`

### 2026-03-31 Inbox reduction: Pricing-sync brief rehome

- Moved `pricing-sync-brief.md` out of KB inbox and into `/home/ricky/builds/pricing-sync/docs/staged/2026-03-31/pricing-sync-brief.md`
- Kept the brief with the pricing-sync project that owns the implementation work
- Confirmed the active KB inbox markdown subtree count reduced from `5` to `4`

### 2026-03-31 Inbox reduction: final profitability and hiring rehome

- Verified `buyback-monday-schema.md`, `buyback-profit-model.md`, and `profit-calculator-spec.md` now live under `/home/ricky/builds/backmarket/docs/staged/2026-03-31/`
- Verified `operations-coordinator-jd-v3.md` now lives under `/home/ricky/builds/hiring/docs/staged/2026-03-31/`
- Confirmed the active KB inbox markdown subtree count reduced from `4` to `0`
- Left KB inbox as an empty staging area rather than an active shadow knowledge base

### 2026-03-31 Agent core-doc audit

- Created [agent-core-doc-audit-2026-03-31.md](/home/ricky/builds/agent-rebuild/technical/evidence/agent-core-doc-audit-2026-03-31.md)
- Verified the live agent roster from `/home/ricky/.openclaw/openclaw.json`
- Verified `pm` as the first rebuild target because it was both structurally incomplete and still coupled to retired Mission Control v2 assumptions

### 2026-03-31 Agent rebuild: `pm`

- Added the missing core docs to `/home/ricky/.openclaw/agents/pm/workspace/`: `IDENTITY.md`, `MEMORY.md`, `TOOLS.md`, and `HEARTBEAT.md`
- Rewrote `SOUL.md` to match the current OpenClaw authority model instead of the old workflow-engine framing
- Rewrote `CLAUDE.md` to remove retired Mission Control v2, old QA-agent, and old workflow-primitive assumptions
- Simplified `AGENTS.md` so the checkpoint protocol no longer depends on old tool names
- QA-confirmed the `pm` workspace now has the full expected core-doc set
- QA-confirmed no positive instruction remains telling `pm` to use retired Mission Control paths or dead QA agents

### 2026-03-31 Agent rebuild: `operations`

- Replaced the template `IDENTITY.md` with a current Ops Jarvis identity doc
- Rewrote `SOUL.md` to reflect the live OpenClaw authority model and a narrower, evidence-backed operations scope
- Replaced `CLAUDE.md` to remove Mission Control v2 framing, dead QA-agent references, and the stale `ops-*` / `fin-*` sub-agent tree
- Replaced `MEMORY.md` with a lean reference set pointing back to the canonical KB and active build repos
- Simplified `TOOLS.md`, `AGENTS.md`, and `HEARTBEAT.md` so the root doc layer no longer depends on retired tooling or stale context assumptions
- QA-confirmed the operations core-doc layer now has a complete file set and no live instructions pointing back to dead QA or Mission Control machinery

### 2026-03-31 Agent cleanup: `backmarket` root docs

- Replaced the template [IDENTITY.md](/home/ricky/.openclaw/agents/backmarket/workspace/IDENTITY.md) with a current Hugo identity doc
- Removed the stale `session_status` checkpoint instruction from the root [AGENTS.md](/home/ricky/.openclaw/agents/backmarket/workspace/AGENTS.md)
- QA-confirmed the backmarket root docs no longer contain the template identity text or the stale tool-specific checkpoint instruction

### 2026-03-31 Agent rebuild: `slack-jarvis`

- Replaced the minimal YAML-style [IDENTITY.md](/home/ricky/.openclaw/agents/slack-jarvis/workspace/IDENTITY.md) with a clearer Slack Jarvis identity doc
- Added the missing [MEMORY.md](/home/ricky/.openclaw/agents/slack-jarvis/workspace/MEMORY.md)
- Replaced [CLAUDE.md](/home/ricky/.openclaw/agents/slack-jarvis/workspace/CLAUDE.md) to remove stale QA/work-item assumptions and align the bridge to the current OpenClaw authority model
- Simplified [AGENTS.md](/home/ricky/.openclaw/agents/slack-jarvis/workspace/AGENTS.md) and [HEARTBEAT.md](/home/ricky/.openclaw/agents/slack-jarvis/workspace/HEARTBEAT.md) so the root doc layer no longer depends on old checkpoint tooling
- QA-confirmed the workspace now has the full expected core-doc set and no root-doc references to the old QA/work-item/checkpoint machinery

### 2026-04-01 Agent rebuild: `main`, `customer-service`, and `systems`

- Rebuilt the `main` root-doc layer and added the missing [CLAUDE.md](/home/ricky/.openclaw/agents/main/workspace/CLAUDE.md)
- Archived the stale `knowledge/` subtree from `main` to `/home/ricky/data/archives/workspaces/main/2026-04-01/`
- Rebuilt the `customer-service` core-doc layer around the live OpenClaw authority model
- Archived raw Intercom exports and the root `archive/` directory out of the live `customer-service` workspace
- Moved `customer-service` root [IMPROVEMENTS.md](/home/ricky/.openclaw/agents/customer-service/workspace/docs/IMPROVEMENTS.md) under `docs/`
- Rebuilt the `systems` core-doc layer around live service/config reality
- Archived the `systems` root `archive/` directory out of the live workspace
- Moved `systems` root [IMPROVEMENTS.md](/home/ricky/.openclaw/agents/systems/workspace/docs/IMPROVEMENTS.md) under `docs/`
- QA-confirmed each workspace root now contains only active control files plus current working folders

### 2026-04-01 Agent rebuild: `website`, `team`, and `marketing`

- Rebuilt the `website` root-doc layer and archived its unused `knowledge/` placeholder
- Moved `website` root [IMPROVEMENTS.md](/home/ricky/.openclaw/agents/website/workspace/docs/IMPROVEMENTS.md) under `docs/`
- Rebuilt the `team` root-doc layer and archived its unused `knowledge/` placeholder
- Moved `team` root [IMPROVEMENTS.md](/home/ricky/.openclaw/agents/team/workspace/docs/IMPROVEMENTS.md) under `docs/`
- Rebuilt the `marketing` root-doc layer, archived its root `archive/`, `tmp/`, and unused `knowledge/` placeholder, and kept `intelligence/` in place as active local tooling
- Moved `marketing` root [IMPROVEMENTS.md](/home/ricky/.openclaw/agents/marketing/workspace/docs/IMPROVEMENTS.md) under `docs/`
- QA-confirmed the live stale scans now only hit explicit negative guardrails such as "Mission Control v2 is retired"

### 2026-04-01 Agent rebuild: `parts`

- Replaced the template [IDENTITY.md](/home/ricky/.openclaw/agents/parts/workspace/IDENTITY.md) with a current Parts Jarvis identity doc
- Rebuilt [SOUL.md](/home/ricky/.openclaw/agents/parts/workspace/SOUL.md), [CLAUDE.md](/home/ricky/.openclaw/agents/parts/workspace/CLAUDE.md), [AGENTS.md](/home/ricky/.openclaw/agents/parts/workspace/AGENTS.md), [TOOLS.md](/home/ricky/.openclaw/agents/parts/workspace/TOOLS.md), [HEARTBEAT.md](/home/ricky/.openclaw/agents/parts/workspace/HEARTBEAT.md), and [WORKING-STATE.md](/home/ricky/.openclaw/agents/parts/workspace/WORKING-STATE.md) around the current OpenClaw authority model
- Preserved the existing domain memory and local helper scripts while removing stale QA/work-item and checkpoint assumptions from the root governance layer
- Moved the root [IMPROVEMENTS.md](/home/ricky/.openclaw/agents/parts/workspace/docs/IMPROVEMENTS.md) under `docs/`
- Archived the unused `knowledge/` placeholder to `/home/ricky/data/archives/workspaces/parts/2026-04-01/`
- QA-confirmed the live stale scan now only hits explicit negative guardrails such as "Mission Control v2 is retired"

### 2026-04-01 Agent cleanup: `operations` second pass

- Reworked [AGENTS.md](/home/ricky/.openclaw/agents/operations/workspace/AGENTS.md), [HEARTBEAT.md](/home/ricky/.openclaw/agents/operations/workspace/HEARTBEAT.md), and [WORKING-STATE.md](/home/ricky/.openclaw/agents/operations/workspace/WORKING-STATE.md) so the root governance layer matches the newer workspace contract
- Cleared the stale VAT-hunt task out of [WORKING-STATE.md](/home/ricky/.openclaw/agents/operations/workspace/WORKING-STATE.md) and reset it to `No active task`
- Moved the root [IMPROVEMENTS.md](/home/ricky/.openclaw/agents/operations/workspace/docs/IMPROVEMENTS.md) under `docs/`
- Moved the root `reports/` tree under `/home/ricky/.openclaw/agents/operations/workspace/docs/reports/`
- Archived the root `archive/` and unused `knowledge/` placeholder to `/home/ricky/data/archives/workspaces/operations/2026-04-01/`
- QA-confirmed the live `operations` root now contains only active control files plus working folders, and the stale scan only hits explicit negative guardrails such as "Mission Control v2 is retired"

### 2026-04-01 Agent rebuild: `backmarket` second pass

- Rebuilt [SOUL.md](/home/ricky/.openclaw/agents/backmarket/workspace/SOUL.md), [CLAUDE.md](/home/ricky/.openclaw/agents/backmarket/workspace/CLAUDE.md), [AGENTS.md](/home/ricky/.openclaw/agents/backmarket/workspace/AGENTS.md), [TOOLS.md](/home/ricky/.openclaw/agents/backmarket/workspace/TOOLS.md), [HEARTBEAT.md](/home/ricky/.openclaw/agents/backmarket/workspace/HEARTBEAT.md), and [WORKING-STATE.md](/home/ricky/.openclaw/agents/backmarket/workspace/WORKING-STATE.md) around the current OpenClaw plus BM-SOP authority model
- Preserved the active local `data/`, `logs/`, and `memory/` areas while removing legacy-root assumptions from the control layer
- Archived the root `archive/`, `scripts-legacy/`, and unused `knowledge/` placeholder to `/home/ricky/data/archives/workspaces/backmarket/2026-04-01/`
- QA-confirmed the live `backmarket` root now contains only active control files plus working folders, and the stale scan only hits explicit negative guardrails plus the intentional note that `scripts-legacy/` is historical
- Reduced live `backmarket` workspace size from approximately `13M` to `7.0M`

### 2026-04-01 Agent rebuild: `diagnostics`

- Rebuilt [IDENTITY.md](/home/ricky/.openclaw/agents/diagnostics/workspace/IDENTITY.md), [SOUL.md](/home/ricky/.openclaw/agents/diagnostics/workspace/SOUL.md), [CLAUDE.md](/home/ricky/.openclaw/agents/diagnostics/workspace/CLAUDE.md), [AGENTS.md](/home/ricky/.openclaw/agents/diagnostics/workspace/AGENTS.md), [TOOLS.md](/home/ricky/.openclaw/agents/diagnostics/workspace/TOOLS.md), [HEARTBEAT.md](/home/ricky/.openclaw/agents/diagnostics/workspace/HEARTBEAT.md), and [WORKING-STATE.md](/home/ricky/.openclaw/agents/diagnostics/workspace/WORKING-STATE.md) around the current OpenClaw authority model and the real diagnostics runtime metadata
- Preserved the active `cases/`, `data/`, `knowledge/`, `memory/`, and `scripts/` structure because it appears to be live diagnostics state rather than clutter
- Corrected [MEMORY.md](/home/ricky/.openclaw/agents/diagnostics/workspace/MEMORY.md) so it no longer points at a nonexistent live `schematics/reference/` path as if it were present
- QA-confirmed the stale checkpoint scaffolding is gone and the remaining scan hits are only explicit retirement guardrails plus the intentional warning that no local `schematics/` directory currently exists

### 2026-04-01 Agent rebuild: `alex-cs`

- Added the missing [CLAUDE.md](/home/ricky/.openclaw/agents/alex-cs/workspace/CLAUDE.md)
- Rebuilt [IDENTITY.md](/home/ricky/.openclaw/agents/alex-cs/workspace/IDENTITY.md), [SOUL.md](/home/ricky/.openclaw/agents/alex-cs/workspace/SOUL.md), [AGENTS.md](/home/ricky/.openclaw/agents/alex-cs/workspace/AGENTS.md), [TOOLS.md](/home/ricky/.openclaw/agents/alex-cs/workspace/TOOLS.md), and [HEARTBEAT.md](/home/ricky/.openclaw/agents/alex-cs/workspace/HEARTBEAT.md) around the current OpenClaw authority model and the real team-facing CS support role
- Kept the active `knowledge/` and `memory/` structure in place
- Moved `cleanup-plan.md` and `cs-report-2026-03-10.md` out of the root and into `/home/ricky/.openclaw/agents/alex-cs/workspace/docs/reports/`
- QA-confirmed the live root is now clean and the stale scan only hits explicit retirement guardrails

### 2026-04-01 Agent rebuild: `arlo-website`

- Added the missing [CLAUDE.md](/home/ricky/.openclaw/agents/arlo-website/workspace/CLAUDE.md)
- Rebuilt [IDENTITY.md](/home/ricky/.openclaw/agents/arlo-website/workspace/IDENTITY.md), [SOUL.md](/home/ricky/.openclaw/agents/arlo-website/workspace/SOUL.md), [AGENTS.md](/home/ricky/.openclaw/agents/arlo-website/workspace/AGENTS.md), [TOOLS.md](/home/ricky/.openclaw/agents/arlo-website/workspace/TOOLS.md), [HEARTBEAT.md](/home/ricky/.openclaw/agents/arlo-website/workspace/HEARTBEAT.md), and [WORKING-STATE.md](/home/ricky/.openclaw/agents/arlo-website/workspace/WORKING-STATE.md) around the current OpenClaw authority model and the real team-facing website support role
- Moved the loose website report into `/home/ricky/.openclaw/agents/arlo-website/workspace/docs/reports/conversion-audit-mar2026.md`
- QA-confirmed the live root is now clean and the stale scan only hits explicit retirement guardrails

### 2026-04-01 Active-layer verification sweep

- Verified every active workspace now has a root [CLAUDE.md](/home/ricky/.openclaw/agents/main/workspace/CLAUDE.md)-style control file present
- Verified there are no remaining template `IDENTITY.md` files in the active `.openclaw` agent layer
- Verified the targeted root-clutter classes (`archive/`, `tmp/`, root `IMPROVEMENTS.md`, `repo/`, root `reports/`) are no longer present in active workspace roots
- Verified every active [WORKING-STATE.md](/home/ricky/.openclaw/agents/main/workspace/WORKING-STATE.md) now reads `No active task.`
- Cleared the last two residuals found by the sweep:
  - [marketing IDENTITY.md](/home/ricky/.openclaw/agents/marketing/workspace/IDENTITY.md)
  - [main WORKING-STATE.md](/home/ricky/.openclaw/agents/main/workspace/WORKING-STATE.md)

### 2026-04-01 KB system-doc refresh after workspace normalization

- Updated [workspace-contract.md](/home/ricky/kb/system/workspace-contract.md) to reflect the verified post-cleanup runtime, including the rule that logs belong under `data/` rather than at workspace root
- Moved `backmarket` watch logs from the root `logs/` directory into `/home/ricky/.openclaw/agents/backmarket/workspace/data/logs/` so runtime matches the workspace contract
- Updated [live-operating-map.md](/home/ricky/kb/system/live-operating-map.md) to record that the active agent layer has completed the current normalization pass
- Updated [agent-map.md](/home/ricky/kb/system/agent-map.md) to 2026-04-01 verification status and documented that all 14 active workspaces now have a current root control layer

### 2026-04-01 Agent-rebuild archive pass

- Added [technical/README.md](/home/ricky/builds/agent-rebuild/technical/README.md) as the current map of the active `technical/` doc set
- Added [archive/2026-04-01/README.md](/home/ricky/builds/agent-rebuild/archive/2026-04-01/README.md) as the dated archive index
- Archived the superseded root rebuild docs into `/home/ricky/builds/agent-rebuild/archive/2026-04-01/root-docs/`
- Archived the superseded technical discovery and planning docs into `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/`
- Updated [agent-rebuild-doc-triage-2026-03-31.md](/home/ricky/builds/agent-rebuild/technical/agent-rebuild-doc-triage-2026-03-31.md) so the archive moves are recorded as completed actions instead of future intentions

### 2026-04-01 Canonical decision capture

- Added [2026-04-01-openclaw-kb-boundary.md](/home/ricky/kb/decisions/2026-04-01-openclaw-kb-boundary.md) to record the live boundary between OpenClaw workspaces, KB, `/builds`, archives, and the future Obsidian vault

### 2026-04-01 Pre-Obsidian verification sweep

- Verified the active `agent-rebuild` root now contains only the remaining keep-local and promote-later docs
- Verified the active `agent-rebuild/technical` root now contains only the active control, triage, and evidence docs plus `README.md`
- Verified the dated archive tree at `/home/ricky/builds/agent-rebuild/archive/2026-04-01/` contains the superseded root and technical docs moved during this pass
- Verified the immediate archive candidates are no longer present on the live `agent-rebuild` and `agent-rebuild/technical` surfaces
- Verified the KB top-level structure now includes `system/`, `decisions/`, and `inbox/`, with the canonical boundary recorded in KB

### 2026-03-31 Buyback schema note fencing

- Marked [buyback-monday-schema.md](/home/ricky/builds/backmarket/docs/staged/2026-03-31/buyback-monday-schema.md) as staged analysis rather than authoritative board mapping
- Corrected the main-board anchor in the note to the current canonical ID (`349212843`) and pointed the file back to the canonical Monday docs
- Replaced the older hard-coded data-chain framing with a canonical-anchor section plus explicit warnings that the stock-checkouts traversal is legacy/unverified
- Added snapshot-language cautions so fill rates, missing fields, and sample values are not mistaken for permanent schema guarantees

### 2026-03-31 Team-state evidence fencing

- Marked [team-state.md](/home/ricky/data/archives/kb-inbox/2026-03-31/knowledge/team-state.md) as staged evidence rather than canonical team truth
- Added snapshot/canonical banners so roster, authority, and KPI claims in the note cannot be mistaken for current live truth
- Softened time-sensitive gap and authority language so recommendations remain recommendations, not current policy
- Corrected the intake-owner reference to `Andreas` and made the note explicitly evidence-only for follow-up or archival

### 2026-03-31 Low-risk inbox archive moves

- Created `/home/ricky/data/archives/kb-inbox/2026-03-31/` as the dated archive home for safe inbox removals
- Archived the superseded hiring drafts `operations-coordinator-jd.md` and `operations-coordinator-jd-v2.md`
- Archived the local inbox `knowledge/README.md` housekeeping note
- Archived `local-model-cost-comparison.md` and `bm-listing-audit-2026-03-27.md` as low-risk evidence/report artifacts
- Reduced the active staged inbox subtree from `23` markdown files to `18`

## Open Issues

- pricing docs still need either source cleanup or operator confirmation before they can be treated as canonical
- team docs still need operator confirmation before they can be treated as canonical
- fresh Monday exports/API pulls are still needed for the Monday board docs
- the active worklog and verification ledger are still untracked inside the dirty `builds` repo
- Obsidian vault scaffolding has not been created yet by design; this worklog stops one step before that

## Change Log

### 2026-03-31

- Created the documentation rebuild worklog
- Established the workstreams, task list, and execution order
- Added KB verification framework reference
- Added KB verification ledger reference
- Marked core KB verification as started
- Verified the first system-doc tranche against live runtime/config/filesystem evidence
- Rewrote `kb/system/supabase-schema.md` from live database evidence
- Confirmed that live Supabase still contains Mission Control-era webhook triggers
- Classified Wave 2 domain docs with explicit verification statuses
- Completed a consistency QA pass ensuring Wave 2 docs and ledger entries align
- Corrected `kb/README.md` so KB status is evidence-based rather than assumed
- Added a file-level Wave 2 verification queue for operations, Monday, pricing, and team docs
- Verified the existing git repo in `/home/ricky/kb`
- Added KB-specific `.gitignore`
- Created a clean KB baseline commit and removed the stale duplicate KB ledger from the repo
- Created a structural KB inventory snapshot for the rebuild baseline
- Classified `/home/ricky/builds/agent-rebuild` docs into keep-local, promote-to-KB, and archive-later
- Classified `/home/ricky/builds/backmarket`, `/home/ricky/builds/monday`, `/home/ricky/builds/intake-system`, and `/home/ricky/builds/documentation/raw-imports`
- Verified that the raw-imports triage sheet matches the live imported file set
- Created the KB promotion map and Obsidian vault structure docs for the future vault layer
- Refreshed Wave 2 headers to 2026-03-31 across operations, Monday, pricing, and team docs
- Upgraded `iphone.md` and `macbook.md` to `partially-verified` from local pricing export evidence
- Downgraded `ipad.md` and `watch.md` to `needs-source-verification` where local source coverage remained too weak
- Replaced stale agent-system references in `team/escalation-paths.md` with the current OpenClaw operating model
- Added caution notes to pricing and team docs so partial verification is obvious in the body, not just the header
- Created [kb-inbox-triage-2026-03-31.md](/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/triage-executed/kb-inbox-triage-2026-03-31.md) to classify staged KB inbox material and call out duplicate-risk notes
- Refreshed the canonical Monday docs from the March 31 live schema note in inbox and reduced the highest-risk overlap to the conflicting buyback schema note
- Archived the March 31 Monday schema note after extraction and repointed the canonical evidence trail to the archive copy
- Fenced the intake overlap by turning `intake-process-v2.md` into an explicit pilot proposal and `operations/intake-flow.md` into a clearer canonical status document
- Fenced the buyback schema note so it can no longer be mistaken for the canonical Monday mapping source
- Fenced the team-state note so it can no longer be mistaken for the live roster or authority source
- Started physically shrinking the active inbox surface by archiving the first low-risk superseded files into `/home/ricky/data/archives/kb-inbox/2026-03-31/`
- Continued shrinking the active inbox surface by archiving low-risk research/report artifacts that did not belong on the live KB path
- Classified `/home/ricky/builds/backmarket` docs into keep-local, promote-to-KB, and archive-later
- Classified `/home/ricky/builds/monday` docs into keep-local, promote-to-KB, and archive-later
- Classified `/home/ricky/builds/intake-system` docs into keep-local, promote-to-KB, and archive-later
- Classified `/home/ricky/builds/documentation/raw-imports` into temporary evidence, extract-then-archive, and archive-later use
- Confirmed `/home/ricky/kb` already had its own git repo and continued using that clean history
- Added follow-up KB commit `a4ab44a` for the current verification tranche
- Created the KB promotion map to define canonical promotion routes into KB
- Defined the Obsidian vault structure on top of `/home/ricky/kb`
- Activated the worklog after user confirmation
- Added the KB verification framework and ledger as the first rebuild control documents
- Added the KB verification framework
- Added the KB verification ledger for the first system-doc verification wave
