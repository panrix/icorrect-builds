# Agent Core Doc Audit

Date: 2026-03-31
Owner: Codex
Scope: active agent workspaces under `/home/ricky/.openclaw/agents`
Purpose: identify which live agents have incomplete or stale core document sets before the first rebuild tranche.

## Verified Inventory Snapshot

Core files checked:

- `IDENTITY.md`
- `SOUL.md`
- `CLAUDE.md`
- `MEMORY.md`
- `TOOLS.md`
- `AGENTS.md`
- `USER.md`
- `HEARTBEAT.md`

## Structural Findings

- `pm` is the weakest live workspace.
  - Present: `SOUL.md`, `CLAUDE.md`, `AGENTS.md`, `USER.md`, `WORKING-STATE.md`
  - Missing: `IDENTITY.md`, `MEMORY.md`, `TOOLS.md`, `HEARTBEAT.md`
- `slack-jarvis` is missing `MEMORY.md`.
- `backmarket`, `operations`, and other major domain leads have fuller file sets but still show content drift.

## Content Drift Findings

### `pm`

- `CLAUDE.md` still depends on retired Mission Control v2 utilities:
  - `/home/ricky/mission-control-v2/scripts/utils/save-fact.py`
- `CLAUDE.md` still references dead QA agents:
  - `qa-plan`
  - `qa-code`
  - `qa-data`
- `CLAUDE.md` still assumes old workflow primitives (`work_items`, `agent_messages`, old review flow) as live operating truth.
- The workspace has no current memory or tools notes to anchor the agent in the cleaned OpenClaw system.

### `operations`

- `CLAUDE.md` still describes itself as a Mission Control v2 domain lead with old sub-agent structure.
- `IDENTITY.md` is still an unfilled template.
- `MEMORY.md` still points at retired Mission Control paths such as `/home/ricky/mission-control-v2/scripts/kpi/kpi_updater.py`.
- At the start of the 2026-04-01 second pass, the live workspace root still carried `archive/`, `reports/`, `knowledge/`, and a root-level `IMPROVEMENTS.md`.
- `WORKING-STATE.md` still showed an old VAT-hunt task as active even though the live rebuild had moved on.

### `backmarket`

- `IDENTITY.md` is still an unfilled template.
- `MEMORY.md` is much fresher than many other agents, but it still needs alignment against the canonical KB and repo-local doc rules.
- At the start of the 2026-04-01 second pass, the live workspace root still carried `archive/`, `knowledge/`, and `scripts-legacy/` residue even though the active BM process had moved into `/home/ricky/builds/backmarket/`.
- `CLAUDE.md`, `AGENTS.md`, `TOOLS.md`, and `HEARTBEAT.md` still leaned on older private-workspace conventions rather than the newer OpenClaw authority model.

### `main`

- `CLAUDE.md` was missing at audit start.
- `AGENTS.md`, `TOOLS.md`, and `MEMORY.md` carried stale Mission Control v2, `agent-trigger`, and retired Monday-wrapper assumptions.
- `AGENTS.md` still contained a stale `session_status` checkpoint protocol at audit start.
- `WORKING-STATE.md` was stale and no longer reflected the active rebuild work.
- A leftover `knowledge/` subtree remained in the active workspace root even though the coordinator workspace had otherwise been trimmed.

### `customer-service`

- `IDENTITY.md` was still an unfilled template.
- `SOUL.md`, `CLAUDE.md`, and `AGENTS.md` still described Mission Control-era workflow, dead QA assumptions, and old undeployed sub-agent structure.
- `MEMORY.md` mixed historical service signals with live operating truth and needed to be recast as curated context.
- The live workspace root still carried its own `archive/` directory and a root-level `IMPROVEMENTS.md`.
- Most of the workspace weight came from historical raw Intercom exports in `data/`.

### `systems`

- `IDENTITY.md` was still an unfilled template.
- `SOUL.md`, `CLAUDE.md`, and `AGENTS.md` still described Mission Control-era workflow, dead QA agents, `agent-trigger`, and a stale service/agent roster.
- `MEMORY.md` mixed historical planning notes with live systems truth and needed to be reduced to current operational context.
- The live workspace root still carried its own `archive/` directory and a root-level `IMPROVEMENTS.md`.

### `website`

- `CLAUDE.md` still described retired Mission Control task tracking, stale QA-gated git flow, and a stale persistent-agent roster.
- `AGENTS.md` still carried old checkpoint and context-preservation scaffolding.
- `SOUL.md` still referenced outdated coordination wording and a missing `WORKING.md` file.
- The live workspace root still carried a root-level `IMPROVEMENTS.md` and an unused `knowledge/` placeholder directory.

### `team`

- `IDENTITY.md` was still an unfilled template.
- `CLAUDE.md` still described retired Mission Control task tracking, stale QA-gated git flow, and a stale persistent-agent architecture.
- `AGENTS.md` still carried old checkpoint and context-preservation scaffolding.
- `SOUL.md` still referenced obsolete routing to non-live agent roles and a missing `WORKING.md` file.
- The live workspace root still carried a root-level `IMPROVEMENTS.md` and an unused `knowledge/` placeholder directory.

### `marketing`

- `IDENTITY.md` was still an unfilled template.
- `SOUL.md`, `CLAUDE.md`, and `AGENTS.md` still described Mission Control-era workflow, dead QA flow, stale merged-domain ownership, and dormant sub-agent structure.
- `MEMORY.md` and `TOOLS.md` mixed useful current context with stale workflow assumptions and root sprawl.
- The live workspace root still carried its own `archive/` directory, a `tmp/` directory, a root-level `IMPROVEMENTS.md`, and an unused `knowledge/` placeholder directory.
- `intelligence/` appears to be active local tooling and should not be moved blindly without a separate migration decision.

### `diagnostics`

- `IDENTITY.md` still used a YAML-style legacy format and no longer matched the live runtime metadata.
- `SOUL.md`, `CLAUDE.md`, and `AGENTS.md` still assumed older workspace conventions, including stale checkpoint scaffolding and outdated model assumptions.
- Several root docs still treated a local `schematics/` directory as if it existed, but the live workspace root did not actually contain one.
- The workspace root itself was otherwise relatively disciplined; the main risk was false-path guidance and stale control-layer behavior rather than heavy root clutter.

### `alex-cs`

- `IDENTITY.md` was still the blank template and `CLAUDE.md` was missing entirely.
- `AGENTS.md`, `TOOLS.md`, and `HEARTBEAT.md` still carried generic workspace boilerplate and stale checkpoint-era assumptions.
- The live workspace root still carried loose report files (`cleanup-plan.md`, `cs-report-2026-03-10.md`) that belonged under `docs/`.
- The team-facing role was real, but the root governance layer no longer matched the live OpenClaw authority model.

### `arlo-website`

- `IDENTITY.md` was still the blank template and `CLAUDE.md` was missing entirely.
- `AGENTS.md`, `TOOLS.md`, and `HEARTBEAT.md` still carried generic workspace boilerplate and stale checkpoint-era assumptions.
- The live workspace root still carried a loose `reports/` directory that belonged under `docs/`.
- The team-facing website role was real, but the root governance layer no longer matched the live OpenClaw authority model.

### `parts`

- `IDENTITY.md` was still an unfilled template.
- `SOUL.md`, `CLAUDE.md`, and `AGENTS.md` still described stale persistent-agent architecture, dead QA/work-item assumptions, and obsolete checkpoint workflow.
- `SOUL.md` still pointed at the missing `WORKING.md` filename instead of `WORKING-STATE.md`.
- The live workspace root still carried a root-level `IMPROVEMENTS.md` and an unused `knowledge/` placeholder directory.
- Domain memory and tooling were still useful, but the root governance layer no longer matched the live OpenClaw authority model.

## Workspace Weight Signals

- `customer-service` was the largest active workspace at approximately `149M` at audit time, driven mostly by historical raw Intercom exports. After the 2026-04-01 cleanup tranche it is approximately `7.8M`.
- `backmarket` is about `13M`
- `main` is about `11M`
- `operations` is about `7.0M`
- `systems` is about `6.4M`

## Rebuild Order

### 1. `pm`

Reasons:

1. It is live in bindings and therefore user-facing enough to matter.
2. It was structurally incomplete compared with the current workspace contract.
3. Its core instruction layer pointed at retired Mission Control v2 automation and dead QA agents.

Status: rebuilt on 2026-03-31.

### 2. `operations`

Reasons:

1. It is live in bindings and central to workshop/process clarity.
2. Its core docs still described Mission Control v2, dead QA agents, and a non-existent sub-agent tree.
3. Its memory/tools layer pointed at retired paths and risked competing with the canonical KB.

Status: core-doc layer rebuilt on 2026-03-31.
Second-pass workspace cleanup completed on 2026-04-01. Root `archive/` moved to `/home/ricky/data/archives/workspaces/operations/2026-04-01/`. Unused `knowledge/` placeholder archived there as well. Root `reports/` moved under `docs/reports/`, root `IMPROVEMENTS.md` moved under `docs/`, and `WORKING-STATE.md` was reset to `No active task`.

### 3. `backmarket` (surgical root-doc cleanup)

Reasons:

1. It is heavily used and already mostly current.
2. The root `IDENTITY.md` was still a template, which signaled unfinished workspace hygiene.
3. `AGENTS.md` still carried a stale tool-specific checkpoint instruction at the root.

Status: surgical root-doc cleanup completed on 2026-03-31.
Second-pass workspace cleanup completed on 2026-04-01. Rebuilt the root governance layer around the current OpenClaw and BM SOP authority model. Root `archive/`, `scripts-legacy/`, and unused `knowledge/` placeholder moved to `/home/ricky/data/archives/workspaces/backmarket/2026-04-01/`. Live workspace size dropped from approximately `13M` to `7.0M`.

### 4. `slack-jarvis`

Reasons:

1. It is live and channel-facing.
2. It was missing `MEMORY.md` entirely.
3. Its `CLAUDE.md` still assumed old QA/work-item machinery and its `AGENTS.md` still carried a stale tool-specific checkpoint instruction.

Status: core-doc cleanup completed on 2026-03-31.

### 5. `main`

Reasons:

1. It is the coordinator workspace and therefore the highest-risk place for stale system assumptions.
2. It was missing `CLAUDE.md`, which left the live coordinator without a current explicit operating spec.
3. Its root docs still pointed at retired control-plane and integration paths.

Status: root-doc layer rebuilt on 2026-04-01. `knowledge/` archived from the live workspace root to `/home/ricky/data/archives/workspaces/main/2026-04-01/`.

### 6. `customer-service`

Reasons:

1. It was the largest active workspace and clearly carried historical residue.
2. Its core-doc layer was still anchored to Mission Control-era workflow and dead QA assumptions.
3. Its live workspace still held raw exports and an internal archive at the root.

Status: core-doc layer rebuilt on 2026-04-01. Historical raw Intercom exports and the root `archive/` directory were moved to `/home/ricky/data/archives/workspaces/customer-service/2026-04-01/`. Root `IMPROVEMENTS.md` was moved under `docs/`.

### 7. `systems`

Reasons:

1. It is central to infrastructure truth, so stale service documentation here creates system-wide confusion.
2. Its root docs still treated dead services, dead QA flow, and Mission Control-era architecture as live.
3. It still carried a root `archive/` directory and working-note clutter.

Status: core-doc layer rebuilt on 2026-04-01. Root `archive/` moved to `/home/ricky/data/archives/workspaces/systems/2026-04-01/`. Root `IMPROVEMENTS.md` moved under `docs/`.

### 8. `website`

Reasons:

1. It still carried stale coordination and QA/task-tracking scaffolding in the root instruction layer.
2. Its root doc set mixed current website practice with outdated agent-architecture assumptions.
3. It had loose root notes and an unused `knowledge/` placeholder cluttering the active workspace.

Status: core-doc layer rebuilt on 2026-04-01. Root `IMPROVEMENTS.md` moved under `docs/`. Unused `knowledge/` placeholder archived to `/home/ricky/data/archives/workspaces/website/2026-04-01/`.

### 9. `team`

Reasons:

1. It still carried stale people-ops routing and task-tracking architecture in the root layer.
2. It mixed real team context with obsolete agent-structure assumptions.
3. It had loose root notes and an unused `knowledge/` placeholder cluttering the active workspace.

Status: core-doc layer rebuilt on 2026-04-01. Root `IMPROVEMENTS.md` moved under `docs/`. Unused `knowledge/` placeholder archived to `/home/ricky/data/archives/workspaces/team/2026-04-01/`.

### 10. `marketing`

Reasons:

1. It still carried stale Mission Control and dead QA workflow assumptions in the root instruction layer.
2. It mixed current growth work with outdated merged-domain and dormant-sub-agent logic.
3. It had clear root residue that should not stay inside an active workspace.

Status: core-doc layer rebuilt on 2026-04-01. Root `archive/`, `tmp/`, and unused `knowledge/` placeholder moved to `/home/ricky/data/archives/workspaces/marketing/2026-04-01/`. Root `IMPROVEMENTS.md` moved under `docs/`. `intelligence/` retained in place as active local tooling pending a separate migration decision.

### 11. `parts`

Reasons:

1. It still carried stale parts-specific workflow guidance wrapped in old agent-architecture and QA/work-item assumptions.
2. Its root instruction layer no longer matched the live OpenClaw authority model.
3. It still had low-risk root residue that should not remain inside an active workspace.

Status: core-doc layer rebuilt on 2026-04-01. Root `IMPROVEMENTS.md` moved under `docs/`. Unused `knowledge/` placeholder archived to `/home/ricky/data/archives/workspaces/parts/2026-04-01/`. Live stale-scan now only finds negative guardrail references such as "Mission Control v2 is retired."

### 12. `diagnostics`

Reasons:

1. It still carried stale root governance and checkpoint scaffolding despite being a specialist workspace.
2. Its docs no longer matched the live runtime metadata.
3. It contained false guidance about a local `schematics/` directory that does not actually exist in the workspace.

Status: core-doc layer rebuilt on 2026-04-01. Root case, data, knowledge, memory, and scripts structure was retained. Live stale-scan now only finds negative guardrail references and the explicit warning that no local `schematics/` directory currently exists.

### 13. `alex-cs`

Reasons:

1. It was live but missing `CLAUDE.md` entirely.
2. It still carried template identity and generic workspace scaffolding instead of a clear team-facing CS support contract.
3. Loose root report files were cluttering the active workspace.

Status: core-doc layer rebuilt on 2026-04-01. Added missing `CLAUDE.md`, replaced template/root boilerplate, and moved loose report files under `docs/reports/`. Live stale-scan now only finds negative guardrail references such as "Mission Control v2 is retired."

### 14. `arlo-website`

Reasons:

1. It was live but missing `CLAUDE.md` entirely.
2. It still carried template identity and generic workspace scaffolding instead of a clear team-facing website support contract.
3. A loose root report directory was cluttering the active workspace.

Status: core-doc layer rebuilt on 2026-04-01. Added missing `CLAUDE.md`, replaced template/root boilerplate, and moved the loose website report under `docs/reports/`. Live stale-scan now only finds negative guardrail references such as "Mission Control v2 is retired."

### Next likely targets

- no immediate root-doc drift targets remain in the active agent layer; next pass should be periodic verification rather than emergency cleanup

## QA Note

This audit is based on live filesystem reads from the active `.openclaw` workspaces and the current OpenClaw config/bindings, not older planning docs.
