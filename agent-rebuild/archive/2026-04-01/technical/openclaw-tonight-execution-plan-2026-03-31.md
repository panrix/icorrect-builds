# OpenClaw Tonight Execution Plan

Date: 2026-03-31
Owner: Codex
Objective: End tonight with one clean, working OpenClaw runtime structure that feels stable, organized, and ready to build on
Non-goals for tonight:

- making Paperclip authoritative
- implementing Obsidian
- preserving unfinished QA scaffolding just because it exists
- broad speculative redesign without cleaning the live system first

## Success Criteria

By the end of tonight, all of the following should be true:

1. OpenClaw is the only active agent runtime/orchestration surface in day-to-day use.
2. No live runtime dependency remains on `mission-control-v2`.
3. The configured agent list matches the intended near-term operating model.
4. Orphaned and archived agent directories are removed from the active runtime path.
5. `main` is a clean coordinator workspace again.
6. Large non-agent artifacts are removed from active workspaces.
7. `/home/ricky/kb` is clearly marked as the canonical durable knowledge base.
8. The system has a written post-cleanup map so future work does not drift immediately.

## Working Rules For Tonight

1. Every change must leave evidence in the cleanup log.
2. Every destructive move must go to an archive or backup location, not deletion first.
3. Every major step must end with a QA gate before the next one starts.
4. If a directory or file is ambiguous, archive it rather than leaving it loose in an active workspace.
5. OpenClaw stays live unless a change explicitly requires downtime.

## Execution Order

### Step 0: Preflight Snapshot

Goal:

- capture enough state to roll back or investigate any mistake

Actions:

1. Save current snapshots of:
   - `crontab -l`
   - `systemctl --user list-unit-files`
   - `systemctl --user list-units --type=service`
   - `/home/ricky/.openclaw/openclaw.json`
2. Save current counts for:
   - configured agents
   - on-disk agent directories
   - root items in key workspaces
3. Save current disk usage for:
   - `.openclaw`
   - `.openclaw/agents`
   - `main` workspace
   - `diagnostics` workspace

QA gate:

- all snapshots written under a dated backup or log location
- current-state counts recorded in the cleanup log

Evidence to capture:

- backup folder path
- exact counts and sizes

### Step 1: Lock The Control Plane

Goal:

- make OpenClaw the only active agent system for tonight’s cleanup

Actions:

1. Reconfirm `agent-trigger` is absent from active systemd units.
2. Reconfirm port `8002` is closed.
3. Reconfirm no active cron entries call `mission-control-v2`.
4. Reconfirm current docs mark `mission-control-v2` as legacy.
5. Record Paperclip as parked, not authoritative.

QA gate:

- no active unit, open port, or cron job remains on the Mission Control v2 runtime path

Evidence to capture:

- service/unit output summary
- cron summary
- any remaining legacy references still on disk

### Step 2: Decide The Active Agent Set

Goal:

- reduce the agent surface to the set that actually supports the near-term operating model

Actions:

1. Mark each configured OpenClaw agent as one of:
   - keep active
   - keep but secondary
   - archive tonight
2. Default recommendation for tonight:
   - keep active: `main`, `systems`, `operations`, `backmarket`, `customer-service`, `website`, `marketing`, `parts`, `team`
   - review carefully: `pm`, `slack-jarvis`, `research-bm`, `alex-cs`, `arlo-website`, `diagnostics`
   - archive tonight unless there is a live dependency: `qa-plan`, `qa-code`, `qa-data`
3. Record the final keep/archive decision in the cleanup log before making file changes.

QA gate:

- every configured agent has a clear status
- every archive candidate has a stated reason

Evidence to capture:

- final keep list
- final archive list
- unresolved agents, if any

### Step 3: Remove Agent Inventory Drift

Goal:

- make `.openclaw/agents` match the intended runtime shape

Actions:

1. Archive disk-only orphan directories out of the active path:
   - `finance-archived`
   - `finn`
   - `processes`
   - `schedule-archived`
2. Archive any configured-but-retired agents chosen in Step 2.
3. Update `openclaw.json` to remove archived agents from the configured list.
4. Verify bindings for any archived agents before removing them from config.

QA gate:

- no orphaned active-looking agent directories remain under `.openclaw/agents`
- configured agent count matches intended active set
- bindings no longer point at archived agents

Evidence to capture:

- archive destination paths
- before/after agent counts
- before/after configured agent IDs

### Step 4: Clean `main` Into The Coordinator Template

Goal:

- make `main` the cleanest workspace in the whole system

Actions:

1. Inspect every top-level item in `/home/ricky/.openclaw/agents/main/workspace`.
2. Keep only what belongs in a coordinator workspace:
   - identity/instruction files
   - small working notes
   - lightweight curated references
3. Move out what does not belong:
   - `repo/`
   - bulky `data/`
   - stale `reports/`
   - duplicated knowledge structures if they belong in shared KB instead
4. Normalize the root so it becomes the template for other active agents.

QA gate:

- `main` no longer contains a full repo tree
- root contents are intentionally minimal
- no raw artifacts or archives remain in root

Evidence to capture:

- before/after root listing
- before/after size
- destination of every moved directory

### Step 5: Remove Heavy Non-Agent Material From Active Workspaces

Goal:

- stop using agent workspaces as storage buckets

Actions:

1. Clean `diagnostics` first because it is the heaviest current workspace.
2. Move `schematics/` out of the active workspace to an archive/reference area.
3. Move other large non-runtime reference material out of active workspaces where possible.
4. Repeat targeted cleanup for any other active workspace with large non-agent data.

QA gate:

- no active workspace contains obviously archival-scale binary/reference material
- biggest workspace sizes drop materially after cleanup

Evidence to capture:

- before/after sizes for cleaned workspaces
- moved path list
- any items intentionally left in place, with reason

### Step 6: Standardize Active Workspace Structure

Goal:

- make active workspaces feel consistent and predictable

Actions:

1. Define the allowed top-level structure for active agent workspaces.
2. Remove duplicate concept folders where possible:
   - `docs/`
   - `kb/`
   - `knowledge/`
   - `memory/`
3. Keep only the folders that have a clear purpose.
4. Apply the same structure to every active agent workspace.

QA gate:

- all active workspaces follow one intentional pattern
- no workspace has unclear duplicate homes for the same kind of knowledge

Evidence to capture:

- the final workspace contract
- example before/after listings for at least `main` and one domain agent

### Step 7: Re-establish KB Boundaries

Goal:

- make `/home/ricky/kb` the canonical durable knowledge layer

Actions:

1. Declare `/home/ricky/kb` the canonical shared knowledge base in docs.
2. Promote durable docs from agent workspaces into `kb/`.
3. Leave only short-term and local context in active workspaces.
4. Record what belongs in `kb/` versus workspace-local memory.

QA gate:

- key durable docs are in `kb/`
- active workspaces no longer look like the main long-term knowledge home

Evidence to capture:

- promoted file list
- updated KB structure
- updated documentation references

### Step 8: Finish Legacy Residue Cleanup

Goal:

- remove obvious leftover landmarks that will cause confusion later

Actions:

1. Remove or archive stale nginx Mission Control v2 config copies if no longer needed.
2. Archive the `mission-control-v2` repo into a clear legacy location once its remaining value is extracted.
3. Document any DB-side cleanup still required if it cannot be completed tonight.

QA gate:

- no local runtime/config path still suggests Mission Control v2 is active
- any remaining database-side residue is explicitly documented

Evidence to capture:

- files moved/archived
- unresolved external cleanup items

### Step 9: Post-Cleanup Validation

Goal:

- prove the system is cleaner and still operational

Actions:

1. Re-check OpenClaw service status.
2. Re-check configured agents and on-disk agent directories.
3. Re-check the biggest workspaces and `.openclaw` size.
4. Re-check active cron entries.
5. Re-check key docs so they match runtime reality.

QA gate:

- OpenClaw still runs cleanly
- active structure matches the written plan
- no obvious legacy runtime dependencies remain

Evidence to capture:

- final counts
- final sizes
- final active agent list

### Step 10: Leave The System Ready For Build Work

Goal:

- end the night with a stable, understandable base for future system building

Actions:

1. Update the audit with final completed state.
2. Write a one-page operating map:
   - active agents
   - archived agents
   - canonical knowledge home
   - archive locations
   - next step before Obsidian
3. Write the next-session starting point so no context is lost.

QA gate:

- a future session can resume from docs alone without rediscovering the cleanup

Evidence to capture:

- final audit path
- final operating map path
- final cleanup log path

## Proposed Agent Roles For Tonight

Primary execution:

- Codex

Domain review support:

- `systems` for structure decisions
- `main` for coordinator workspace decisions
- `diagnostics` for technical archive decisions

QA model for every major step:

1. execute the change
2. verify filesystem/runtime state
3. record evidence
4. only then proceed

## Stop Conditions

Stop and reassess if any of the following happens:

- OpenClaw service health degrades after a cleanup step
- an archived agent still has a live binding or workflow dependency
- a file or directory cannot be confidently classified as active vs archive
- database-side legacy dependencies appear that cannot be safely changed tonight

## Definition Of Done For Tonight

Tonight is complete only if:

- the active agent set is intentionally small and documented
- `main` is clean
- the worst heavy workspace clutter is gone from active paths
- KB boundaries are explicit
- Mission Control v2 is clearly legacy everywhere local
- the system feels easier to navigate than it did at the start of the night
