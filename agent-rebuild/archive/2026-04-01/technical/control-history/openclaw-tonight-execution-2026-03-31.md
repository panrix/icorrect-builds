# OpenClaw Tonight Execution Runbook

Date: 2026-03-31
Operator: Codex
Goal: leave the VPS in a clean, workable state where OpenClaw is the only active agent system, workspaces have a clear structure, and the system is ready for KB cleanup and later Obsidian work

## Success Criteria For Tonight

By the end of tonight:

- OpenClaw is the only active agent runtime/control plane
- no live runtime path depends on Mission Control v2
- the active agent list is intentional rather than inherited
- non-core or unfinished agents are archived or explicitly deferred
- `main` is a clean coordinator workspace
- the largest obvious workspace misuse is removed from active agent roots
- documentation reflects the live state
- every step is logged and verified before moving on

## Guardrails

- Do not introduce Paperclip as an authority tonight
- Do not build Obsidian tonight
- Do not delete legacy material without first archiving it
- Do not archive any bound agent until its bindings are reviewed
- Do not move large workspace content without recording source and destination

## Operating Rules

- OpenClaw is the only active agent system for tonight
- Mission Control v2 is legacy only
- Paperclip is parked
- every tranche ends with a QA check
- every material change is written into the execution log at the end of this document

## Destination Structure For Tonight's Cleanup

Use explicit destinations so cleanup does not create a new mess.

- archived agents:
  - `/home/ricky/archive/agents/2026-03-31/`
- extracted workspace repos:
  - `/home/ricky/worktrees/agent-extracted/`
- heavy reference material from active workspaces:
  - `/home/ricky/archive/references/2026-03-31/`
- exported artifacts and dumps:
  - `/home/ricky/data/agent-artifacts/`
- legacy config/reference files:
  - `/home/ricky/archive/legacy-config/2026-03-31/`

## Tonight Execution Order

### Step 1. Freeze The Scope

Objective:

- stop this from turning into an unbounded cleanup

Actions:

1. Confirm the authority model:
   - OpenClaw active
   - Paperclip parked
   - Mission Control v2 legacy
2. Confirm that tonight is about:
   - OpenClaw structure
   - agent inventory
   - workspace cleanup
   - legacy residue cleanup
3. Explicitly defer:
   - Paperclip promotion
   - Obsidian implementation
   - new QA system design

QA gate:

- audit doc and runbook both state the same authority model

### Step 2. Capture A Cleanup Checkpoint

Objective:

- preserve rollback state before the next structural edits

Actions:

1. Create a dated cleanup snapshot under `/home/ricky/backups/`
2. Save current copies of:
   - `.openclaw/openclaw.json`
   - active crontab
   - `systemctl --user list-unit-files`
   - `systemctl --user list-units --type=service`
3. Save a top-level inventory of:
   - configured agents
   - on-disk agent directories
   - largest workspaces

QA gate:

- backup folder exists
- all snapshot files exist

### Step 3. Finalize Mission Control v2 Decommission Residue

Objective:

- make sure legacy references do not keep reintroducing bad assumptions

Actions:

1. Update stale active docs that still describe `agent-trigger` or Mission Control v2 as live
2. Review `builds/server-config/nginx-mission-control.conf`
3. If it is only historical, move it to a clearly marked archive/reference location
4. Update KB docs that still claim webhooks post to port `8002`
5. Decide whether Supabase trigger verification is in scope tonight
6. If not verified tonight, record it explicitly as an external deferred risk rather than pretending the decommission is fully closed

QA gate:

- no active OpenClaw workspace docs claim `agent-trigger` is live
- KB no longer states that `agent-trigger.py` on `8002` is the active webhook path
- any remaining legacy config copies are clearly marked as reference/archive

### Step 4. Define The Active Agent Set

Objective:

- move from inherited agents to an intentional working set

Actions:

1. Categorize each configured agent as one of:
   - core
   - specialist
   - parked
   - archive now
2. Near-term expected core set:
   - `main`
   - `team`
   - `systems`
   - `operations`
   - `customer-service`
   - `marketing`
   - `website`
   - `backmarket`
   - `parts`
   - `pm`
3. Review bound but non-core specialists:
   - `alex-cs`
   - `arlo-website`
   - `diagnostics`
   - `slack-jarvis`
4. Mark unbound cleanup candidates for archive tonight:
   - `qa-plan`
   - `qa-code`
   - `qa-data`
   - `research-bm`

QA gate:

- a written classification exists for every configured agent
- no archive decision is made blindly on a bound agent

### Step 5. Archive Low-Risk Configured Agents

Objective:

- reduce active clutter first where runtime risk is lowest

Actions:

1. Archive the unbound configured agents:
   - `qa-plan`
   - `qa-code`
   - `qa-data`
   - `research-bm`
2. Remove them from the active OpenClaw config only after archiving their directories
3. Restart or reload `openclaw-gateway.service` after config edits
4. Re-check configured agents and bindings immediately after the config change
5. Place archives in a single dated agent archive location
6. Record exactly what moved and why

QA gate:

- archived directories exist in the archive destination
- removed agents no longer appear in `openclaw.json`
- bindings remain valid for all still-active agents
- running gateway state has been refreshed after config edits

### Step 6. Archive Disk-Only Orphan Agent Directories

Objective:

- eliminate obvious drift between config and disk

Actions:

1. Run a reference search across `/home/ricky` for:
   - `finance-archived`
   - `finn`
   - `processes`
   - `schedule-archived`
2. Archive:
   - `finance-archived`
   - `finn`
   - `processes`
   - `schedule-archived`
3. Keep their content intact in archive
4. Record whether any of their documents should later be promoted into `kb`

QA gate:

- `.openclaw/agents` contains only active directories plus any intentionally retained exceptions
- archive location contains all four orphan directories
- no unresolved live path references remain to the moved orphan directories

### Step 7. Clean The `main` Workspace First

Objective:

- restore the coordinator workspace as the template for the system

Actions:

1. Inspect everything still at root in `/home/ricky/.openclaw/agents/main/workspace`
2. Move the `repo/` tree out of the active agent workspace
3. Review whether `reports/` and `data/` should live outside the workspace
4. Reduce duplicate knowledge surfaces where possible:
   - `docs/`
   - `kb/`
   - `knowledge/`
5. Keep only what the main coordinator actually needs to operate

QA gate:

- `main` no longer contains a full repo checkout
- root contents of `main` are limited to coordinator-relevant material
- no required agent identity files were removed

### Step 8. Cut The Biggest Workspace Weight

Objective:

- remove the highest-impact misuse of workspace storage

Actions:

1. Clean `/home/ricky/.openclaw/agents/diagnostics/workspace`
2. Search diagnostics docs/scripts for references to `schematics/`
3. Decide based on references whether tonight's action is:
   - full move
   - move plus symlink
   - defer with documentation
4. Move `schematics/` out of the active workspace only if the dependency scan supports it
5. Review whether `cases/` and `scripts/` should stay active or move elsewhere
6. Record any paths that diagnostics still needs to reference after the move

QA gate:

- diagnostics workspace size drops materially
- the heavy reference material still exists in the archive destination
- diagnostics identity/instruction files remain intact
- any surviving path dependency is documented

### Step 9. Normalize The Remaining Active Workspaces

Objective:

- make active workspaces consistent enough to build from

Actions:

1. Spot-check all kept active workspaces
2. Remove root-level junk or exports
3. Ensure each active workspace contains only:
   - identity files
   - memory
   - curated docs
   - working notes
4. Flag any workspace that still needs a second pass rather than making reckless edits

QA gate:

- no active workspace has obvious archive dumps at root
- all active workspaces follow the same broad shape

### Step 10. Refresh Live Documentation

Objective:

- stop the system map from lying the moment cleanup is finished

Actions:

1. Update the audit
2. Update the active agent map
3. Update any systems docs inside active workspaces that still mention dead services
4. Write a concise “current operating model” note:
   - OpenClaw active
   - Paperclip parked
   - Mission Control v2 legacy
   - KB next
   - Obsidian later

QA gate:

- active docs match runtime reality
- new operator reading the docs would not be misled

### Step 11. Final Verification

Objective:

- prove the cleanup left a working system, not just moved files around

Actions:

1. Re-check:
   - `openclaw.json`
   - `.openclaw/agents`
   - bindings
   - active services
   - crontab
2. Confirm no active file path still depends on Mission Control v2
3. Re-measure:
   - `.openclaw`
   - largest workspaces
   - active agent count
4. Write final state into the execution log

QA gate:

- configured agents match intended active directories
- all binding `agentId` values correspond to active configured agents
- no dead-service references remain in live docs
- workspace cleanup targets show measurable improvement

## QA Protocol Per Step

For every step tonight:

1. Perform the change
2. Run one verification command or doc diff
3. Record the result in the execution log
4. Only continue if the verification passes

If a verification fails:

1. stop the sequence
2. document the failure
3. either roll back that tranche or re-plan before continuing

## Execution Log

Use this section as the running ledger during execution.

### 2026-03-31 Initial State

- Mission Control v2 runtime path already decommissioned earlier
- active configured agents: `18`
- on-disk agent directories: `22`
- heaviest workspace: `diagnostics` at `4.3G`
- largest non-diagnostics active workspace: `customer-service` at `149M`
- `main` workspace still contains `repo/`
- `diagnostics` workspace still contains `schematics/`
- KB still not canonical

### Pending Tonight Entries

- Step 2 checkpoint created:
- Step 3 docs/residue cleanup completed:
- Step 4 agent classifications completed:
- Step 5 configured archives completed:
- Step 6 orphan archives completed:
- Step 7 main cleanup completed:
- Step 8 diagnostics cleanup completed:
- Step 9 active workspace normalization completed:
- Step 10 documentation refresh completed:
- Step 11 final verification completed:

## Next Phase After Tonight

These are the next priority items after the OpenClaw cleanup tranche.

### 1. Rebuild Core Documentation

Objective:

- make the core system docs current, minimal, and reliable

Actions:

1. Audit the canonical docs in `/home/ricky/kb`
2. Rebuild the core document set so it is current and concise:
   - live operating map
   - workspace contract
   - agent map
   - system architecture map
   - key operational SOP indexes
3. Remove duplication and stale references from inherited docs
4. Mark documents as:
   - canonical
   - local build doc
   - historical/archive

### 2. Put KB Under Version Control

Objective:

- give the canonical knowledge layer proper history and rollback

Actions:

1. initialize `/home/ricky/kb` as its own git repository
2. add a `.gitignore` appropriate for a markdown knowledge base
3. commit the current cleaned KB baseline
4. use KB git history as the source of truth for future documentation changes

### 3. Triage Documentation In `/home/ricky/builds`

Objective:

- stop `/home/ricky/builds` from pretending to be the canonical doc system

Actions:

1. use `/home/ricky/kb/system/builds-documentation-policy.md` as the rule set
2. classify `/home/ricky/builds` docs into:
   - keep local to repo
   - promote to KB
   - archive
3. start with the biggest/highest-value doc clusters:
   - `/home/ricky/builds/agent-rebuild`
   - `/home/ricky/builds/backmarket`
   - `/home/ricky/builds/monday`
   - `/home/ricky/builds/intake-system`
   - `/home/ricky/builds/documentation/raw-imports`
4. ensure repo-local `README.md` files point to KB when the canonical version lives there

### 4. Add Obsidian Cleanly

Objective:

- make Obsidian a view/editor over KB rather than a competing memory system

Actions:

1. use `/home/ricky/kb` as the vault root
2. add `.obsidian/` inside `/home/ricky/kb`
3. keep agent chatter, dumps, and runtime memory out of the vault
4. add structured KB folders where needed, including:
   - `inbox/`
   - `decisions/`
5. define a promotion workflow from agent workspaces and `/builds` into KB

### 5. Obsidian Access Model

Objective:

- make the vault usable without creating a second source of truth

Actions:

1. keep the markdown on the VPS in `/home/ricky/kb`
2. access it from your local Obsidian app via:
   - git clone/pull workflow
   - sshfs mount
   - Syncthing
   - Obsidian Sync
3. do not create a second unrelated vault path with duplicated notes
