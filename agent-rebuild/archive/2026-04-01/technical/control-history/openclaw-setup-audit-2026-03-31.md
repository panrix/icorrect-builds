# OpenClaw Setup Audit

Date: 2026-03-31
Audited by: Codex
Status: Updated after Mission Control v2 decommission pass
Scope: `/home/ricky` VPS layout, OpenClaw runtime, Mission Control v2 residue, Paperclip state, KB state, agent workspaces, Obsidian readiness

## Executive Summary

The VPS problem is still operational boundaries, not lack of capability.

Before tonight, the setup had three overlapping stories:

- OpenClaw as the live agent runtime
- Mission Control v2 still active through webhook automation, cron, and instruction-file dependencies
- Paperclip newly installed, running, but not yet established as a real operating layer

That overlap made it impossible to tell:

- which system actually owned orchestration
- where durable knowledge belonged
- which workspaces were active vs. legacy
- which automation paths were safe to trust

The situation is materially better now because the live Mission Control v2 runtime path has been cut out:

- `agent-trigger.service` is no longer installed as a live user service
- port `8002` is no longer listening
- Mission Control v2 cron jobs were removed from the active crontab
- live OpenClaw agents no longer depend on `mission-control-v2` symlinked `CLAUDE.md` / `SOUL.md` files

But the system is not clean yet.

The remaining blockers are:

- OpenClaw workspaces are still carrying too much mixed-purpose material
- the active agent set is now cleanly reduced to `14`, but several active workspaces still need normalization
- `/home/ricky/kb` has grown materially tonight, but it is still not fully the canonical knowledge base yet
- Paperclip is running, but should not be treated as authoritative yet
- legacy Mission Control v2 material still exists on disk and in at least one nginx config copy

The correct conclusion is:

- Mission Control v2 is no longer part of the active runtime path
- OpenClaw should be treated as the only active orchestration/runtime system for now
- Paperclip should remain parked as an experiment until OpenClaw structure and KB boundaries are clean
- Obsidian should come after KB cleanup, not before it

## What Changed Tonight

The earlier version of this audit reflected the pre-cleanup state. The following changes have now been completed and verified:

### 1. Mission Control v2 webhook runtime was decommissioned

Verified current state:

- `systemctl --user list-unit-files` no longer shows `agent-trigger.service`
- `ss -ltnp` shows nothing listening on `:8002`
- the service file was removed from the live user systemd directory

Rollback material was preserved under:

- `/home/ricky/backups/decommission-mission-control-v2-2026-03-31`

That backup includes:

- the disabled service file
- the original service file backup
- pre/post crontab snapshots
- the previous agent instruction files that had been symlinked from Mission Control v2

### 2. OpenClaw agents were decoupled from Mission Control v2 instruction files

Verified current state:

- there are no remaining symlinked `workspace/CLAUDE.md` or `workspace/SOUL.md` files under `/home/ricky/.openclaw/agents`

This matters because it removes a hidden dependency where OpenClaw looked live but still relied on Mission Control v2 files to define agent behavior.

### 3. Active crontab was cleaned

The active user crontab no longer includes the Mission Control v2 workflow jobs that had been left running:

- health-check
- reconciliation
- janitor
- QA retry
- Supabase backup job from Mission Control v2
- the old Mission Control v2 chrome reaper reference

The current retained cron set is now limited to:

- OpenClaw health check
- log rotation
- Chrome/Whisper reaper
- Xero refresh
- parts usage update
- buyback monitor weekly
- sent-orders detection
- sale detection
- dispatch labels

### 4. First-pass workspace junk removal was completed

The worst root-level artifact dumps were moved out of agent workspace roots into:

- `/home/ricky/data/agent-artifacts`

Current archive footprint:

- `/home/ricky/data/agent-artifacts` = `39M`

Current root item counts after this pass:

- `main` workspace root = `18`
- `alex-cs` workspace root = `16`
- `diagnostics` workspace root = `20`

This improved the situation, but it did not fully solve the workspace design problem.

### 5. Agent inventory was reduced and synchronized

Verified current state:

- `openclaw.json` now contains `14` configured agents
- `/home/ricky/.openclaw/agents` now contains `14` active agent directories
- `openclaw agents list` returns the same `14` active agents

Archived configured agents:

- `qa-plan`
- `qa-code`
- `qa-data`
- `research-bm`

Archived disk-only orphan directories:

- `finance-archived`
- `finn`
- `processes`
- `schedule-archived`

Archive location:

- `/home/ricky/data/archives/agents/2026-03-31`

### 6. The two worst workspaces were materially cleaned

Completed:

- `main/workspace/repo` moved out of the active workspace
- `main/workspace/data/buyback` moved to `/home/ricky/data/exports`
- `main/workspace/docs`, `knowledge`, and `reports` moved into KB inbox staging
- `diagnostics/workspace/schematics` moved out of the active workspace

Current results:

- `main` workspace size reduced from `21M` to `11M`
- `main` root reduced to `13` top-level items
- `diagnostics` workspace size reduced from `4.3G` to `628K`
- `diagnostics` root now has `19` top-level items
- `.openclaw` total footprint reduced from `6.1G` to `1.8G`

## Current Runtime State

### Active services and processes

Verified current runtime state:

- `openclaw-gateway.service` is the only relevant active user systemd service
- `paperclip` is running as a background Node process
- `n8n` is running as a background Node process
- `pm2` daemon is running
- `agent-trigger.service` is not running and is no longer installed as a live user unit

Operational interpretation:

- OpenClaw is the only clearly active agent runtime/control surface
- Paperclip exists, but it is not yet the authoritative orchestration layer
- n8n and PM2 remain additional automation/process surfaces that should be treated carefully during cleanup

### OpenClaw gateway health

Current service status:

- `openclaw-gateway.service` is active and running
- recent logs show normal work plus model overload failover handling
- current service memory is high at roughly `4.7G`, with peak around `6.1G`

Current cron error log:

- `/tmp/openclaw/cron-errors.log` is empty on this check

This is better than the earlier audit state, but it should not be over-read as “fully healthy”. It means the current quick checks did not show fresh cron errors.

## Top-Level Layout Reality

Top-level directories under `/home/ricky` still mix several roles:

- runtime state: `.openclaw`, `.paperclip`, `.pm2`, `n8n-data`
- source repos and builds: `mission-control-v2`, `paperclip`, `builds`
- knowledge: `kb`, `shared-docs`
- logs: `logs`
- backups: `backups`, `data/backups`
- work/output: `data`, `worktrees`

This is still not a cleanly bounded filesystem layout.

The difference now is that the main runtime confusion has been reduced:

- `mission-control-v2` remains on disk as legacy code/reference
- it is no longer part of the active agent runtime path

## Key Findings

### 1. OpenClaw should be treated as the only active orchestrator for now

This is the most important architectural correction.

Paperclip was installed today and is running, but it is not yet populated or proven enough to act as the control plane for the VPS.

For the near term, the correct model is:

- OpenClaw = live runtime and agent system
- Paperclip = parked experiment / future orchestration candidate
- Mission Control v2 = legacy reference only

Any document or workflow that behaves as if Paperclip is already authoritative would be premature.

### 2. Mission Control v2 runtime dependency has been removed, but legacy residue remains

Resolved tonight:

- live webhook service removed
- live cron dependency removed
- live agent instruction symlink dependency removed

Still remaining:

- `/home/ricky/mission-control-v2` repo remains on disk
- `/home/ricky/builds/server-config/nginx-mission-control.conf` still contains a `/api/` proxy block to `127.0.0.1:8002`
- live Supabase trigger state was not re-audited tonight, so old DB-side webhook triggers may still exist there

This matters because “not running” and “fully decommissioned” are different states.

Mission Control v2 is no longer live in execution, but it is not fully erased from the environment.

### 3. OpenClaw runtime storage is substantially smaller, but still mixed-purpose

Current OpenClaw footprint:

- `.openclaw` = `1.8G`
- `.openclaw/agents` = `498M`
- `.openclaw/browser` = `850M`
- `.openclaw/memory` = `235M`
- `.openclaw/media` = `181M`

This confirms `.openclaw` is still carrying more than runtime state. It is still functioning as:

- runtime home
- workspace host
- artifact host
- browser profile store
- memory store
- partial knowledge store

That is much better than the start of the night, but `.openclaw` is still not purely runtime state.

### 4. Agent inventory drift has been resolved locally

Current counts:

- configured agents in `openclaw.json` = `14`
- agent directories on disk = `14`

Configured agents:

- `main`
- `team`
- `backmarket`
- `systems`
- `website`
- `parts`
- `marketing`
- `slack-jarvis`
- `pm`
- `operations`
- `customer-service`
- `alex-cs`
- `arlo-website`
- `diagnostics`

Archived tonight:

- `qa-plan`
- `qa-code`
- `qa-data`
- `research-bm`
- `finance-archived`
- `finn`
- `processes`
- `schedule-archived`

This is a real structural improvement. The local runtime now has one intentional agent set instead of a mixed live-plus-legacy directory tree.

### 5. Several current agents or workspaces do not match the intended operating model

The stated target is a small set of main agents that you speak to directly, who can manage build work and future systems.

The current configured list still includes several agents that should be treated as secondary specialists rather than part of the direct executive layer:

- `slack-jarvis`
- `alex-cs`
- `arlo-website`
- `diagnostics`
- `pm`

That does not automatically mean they are wrong.

It does mean the current OpenClaw structure is still a mix of:

- executive agents
- domain leads
- experiments
- temporary specialists
- legacy or half-built roles

The unfinished QA layer was removed from the active runtime path tonight, which aligns the live system better with the intended operating model.

### 6. Workspaces are still overloaded and structurally inconsistent

Current spot checks:

- `main` workspace size = `11M`
- `alex-cs` workspace size = `460K`
- `diagnostics` workspace size = `628K`

Current root contents show that the two worst workspaces were improved, but not every active workspace follows one contract yet:

`main` workspace still includes:

- `foundation/`
- `kb/`
- `memory/`

This is now close to the correct coordinator shape.

`diagnostics` workspace still includes:

- `cases/`
- `scripts/`
- multiple knowledge/reference directories

The critical change is that its schematic library is no longer inside the active workspace.

`alex-cs` is cleaner than the worst workspaces, but it still follows the same multi-home pattern:

- `docs/`
- `kb/`
- `knowledge/`
- `memory/`

The platform still lacks one consistent workspace contract.

### 7. Knowledge is still fragmented; `/kb` is not yet canonical

Current knowledge totals:

- markdown under agent `docs/` = `44,492` lines
- markdown under agent `knowledge/` = `1,203` lines
- `/home/ricky/kb` markdown files = `42`
- `/home/ricky/kb` total markdown lines = `5,504`

This is a meaningful improvement, but it does not yet mean KB is fully canonical:

- durable knowledge still lives mostly inside agent workspaces
- much of the promoted material is still in inbox staging and needs a second-pass classification

Until this flips, Obsidian would just mirror a fragmented system.

### 8. Obsidian is still not implemented

Verified current state:

- no `.obsidian` directory found under `/home/ricky` within the expected shallow layout
- `obsidian-cli` is not installed
- there is no actual working vault in place

So Obsidian is not the next cleanup lever.

It is a later layer that should sit on top of a cleaned KB.

### 9. Documentation and config state are better, but decommission work is not fully closed

Good current signs:

- local docs now describe `mission-control-v2` as legacy rather than active runtime
- OpenClaw workspace instruction files are localized inside `.openclaw`

Remaining stale/deferred items:

- nginx config copy still points `/api/` to `127.0.0.1:8002`
- database trigger state remains unverified
- the legacy repo is still present and can still confuse future work if not archived cleanly

The documentation drift is smaller now, but the environment still has legacy landmarks that invite re-contamination.

### 10. Backups and archives are still spread across multiple homes

Current backup/archive locations include:

- `/home/ricky/backups` = `84M`
- `/home/ricky/data/backups` = `134M`
- `/home/ricky/.paperclip` = `274M`
- `/home/ricky/data/agent-artifacts` = `39M`

That is survivable, but not organized.

Right now backups, app state, and cleanup archives still live in different conceptual systems.

## What This Means For the Desired Operating Model

The desired model is:

- a small set of main agents you speak to directly
- those agents manage build work and future system creation
- durable knowledge is organized and promotable
- Obsidian becomes a clean memory/publishing layer

The current VPS can support that, but only if the next cleanup decisions are strict.

The most important near-term rule is:

- do not add new orchestration layers while OpenClaw is still structurally messy

That means:

- do not promote Paperclip yet
- do not implement Obsidian yet
- do not keep legacy QA scaffolding alive “just in case”

## Recommended Near-Term Operating Model

For the next cleanup phase, the recommended model is:

### 1. OpenClaw is the only active agent system

Treat OpenClaw as authoritative for:

- live agents
- live bindings
- live instruction files
- live cron-owned agent behavior

### 2. Paperclip is parked

Paperclip may become useful later, but right now it should be treated as:

- newly installed
- exploratory
- not yet the source of truth

If you try to make it authoritative before the OpenClaw cleanup is finished, you will recreate the same split-control problem.

### 3. Mission Control v2 is legacy reference only

Keep it only long enough to:

- extract anything still worth preserving
- verify DB/nginx residue
- archive it cleanly

Do not allow it back onto the live path.

## Cleanup Priorities From Here

### Phase 0: Completed tonight

Completed:

- decommissioned `agent-trigger`
- removed Mission Control v2 cron runtime dependencies
- localized agent instruction files inside OpenClaw
- performed first-pass workspace artifact cleanup
- corrected key local docs to treat Mission Control v2 as legacy

### Phase 1: Finish the OpenClaw cleanup

Next actions:

1. Normalize the remaining active workspaces against the new workspace contract
2. Decide whether `pm`, `slack-jarvis`, `alex-cs`, `arlo-website`, and `diagnostics` stay active long term or become secondary/archived later
3. Review the new KB inbox staging and classify promoted material into permanent KB homes
4. Remove any remaining obviously misplaced data/log/archive folders from active workspaces

### Phase 2: Finish decommission residue cleanup

Next actions:

1. Remove or archive the stale nginx Mission Control v2 config copy
2. Audit the live Supabase database for old webhook trigger functions
3. Archive the `mission-control-v2` repo into a clear legacy location

### Phase 3: Rebuild knowledge boundaries

Next actions:

1. Promote durable workspace knowledge into `/home/ricky/kb`
2. Define what belongs in:
   - `kb`
   - agent-local memory
   - project/build repositories
3. Stop duplicating the same concept across `docs/`, `kb/`, and `knowledge/` inside every workspace

### Phase 4: Add Obsidian after KB is canonical

Only after the earlier phases are complete:

1. create the vault
2. define a strict vault folder structure
3. sync curated markdown from `/home/ricky/kb`
4. keep agent session chatter and raw runtime memory out of the vault by default

## Bottom Line

The VPS is in a better state than it was at the start of the day.

The critical Mission Control v2 runtime dependency has been removed, which is a real cleanup step and not just a documentation change.

But the core problem is still active:

- several active workspaces still need normalization
- KB is improved but still not canonical
- legacy Mission Control residue still exists on disk
- Obsidian is still premature

The correct order now is:

1. finish OpenClaw cleanup
2. re-establish KB as the canonical knowledge layer
3. only then build the Obsidian layer

That sequence does not cut corners. It is the minimum sequence that avoids rebuilding the same mess in a new tool.
