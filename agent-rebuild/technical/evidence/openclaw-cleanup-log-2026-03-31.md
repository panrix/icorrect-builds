# OpenClaw Cleanup Log

Date: 2026-03-31
Owner: Codex
Purpose: Capture every material cleanup step, verification result, and unresolved issue during tonight's execution

## Starting State

- Mission Control v2 runtime path already decommissioned earlier tonight
- `openclaw-gateway.service` is active
- configured OpenClaw agents: `18`
- on-disk agent directories: `22`
- `.openclaw` size: `6.1G`
- `.openclaw/agents` size: `4.8G`
- `main` workspace size: `21M`
- `diagnostics` workspace size: `4.3G`
- `/home/ricky/kb` markdown files: `17`
- `/home/ricky/kb` markdown lines: `2,448`

## Log Entries

### 2026-03-31 Initial documentation setup

Action:

- created the tonight execution plan
- created this cleanup log

Verification:

- documentation scaffold exists and reflects the current post-shutdown state

Evidence:

- `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/openclaw-tonight-execution-plan-2026-03-31.md`
- `/home/ricky/builds/agent-rebuild/technical/evidence/openclaw-cleanup-log-2026-03-31.md`

Open issues:

- active agent set still needs tonight classification
- active workspaces still need structural cleanup

### 2026-03-31 Preflight snapshot captured

Action:

- created a preflight backup snapshot for tonight's cleanup
- saved current crontab, systemd user service lists, and `openclaw.json`
- saved baseline agent counts and key size metrics

Verification:

- snapshot folder exists and contains the expected baseline files

Evidence:

- `/home/ricky/backups/openclaw-tonight-preflight-2026-03-31/crontab.txt`
- `/home/ricky/backups/openclaw-tonight-preflight-2026-03-31/systemd-user-unit-files.txt`
- `/home/ricky/backups/openclaw-tonight-preflight-2026-03-31/systemd-user-services.txt`
- `/home/ricky/backups/openclaw-tonight-preflight-2026-03-31/openclaw.json`
- `/home/ricky/backups/openclaw-tonight-preflight-2026-03-31/counts.txt`
- `/home/ricky/backups/openclaw-tonight-preflight-2026-03-31/sizes.txt`

Recorded baseline:

- configured agents: `18`
- on-disk agent directories: `22`
- `main` root items: `18`
- `alex-cs` root items: `16`
- `diagnostics` root items: `20`
- `.openclaw`: `6.1G`
- `.openclaw/agents`: `4.8G`
- `main` workspace: `21M`
- `diagnostics` workspace: `4.3G`

Open issues:

- agent inventory still needs active/archive classification
- workspace standardization has not started yet

### 2026-03-31 Control-plane lock re-verified

Action:

- rechecked the active systemd user units
- rechecked port `8002`
- rechecked the active crontab for Mission Control v2 hooks
- rechecked local docs for Mission Control v2 status

Verification:

- `agent-trigger.service` is absent from the active user unit list
- port `8002` is closed
- active crontab contains no `mission-control-v2`, webhook, QA retry, janitor, or reconciliation entries
- local docs describe `mission-control-v2` as legacy

Evidence:

- `systemctl --user list-unit-files` currently shows only `openclaw-gateway.service` for the relevant services
- `ss -ltnp` shows no listener on `:8002`
- current `crontab -l` has no Mission Control v2 runtime references
- `/home/ricky/.openclaw/CLAUDE.md`
- `/home/ricky/README.md`

Open issues:

- active agent list still needs tonight cleanup decisions
- stale nginx config copy and possible DB-side legacy residue are still unresolved

### 2026-03-31 Agent inventory cut completed

Action:

- removed `qa-plan`, `qa-code`, `qa-data`, and `research-bm` from the active OpenClaw config
- removed retired entries from `agentToAgent.allow`
- archived the retired configured agent directories out of `.openclaw/agents`
- archived disk-only orphan agent directories out of `.openclaw/agents`
- restarted `openclaw-gateway.service`

Verification:

- `openclaw.json` now contains `14` configured agents
- `.openclaw/agents` now contains `14` directories
- `openclaw agents list` returns the same `14` active agents
- gateway restart completed successfully

Evidence:

- `/home/ricky/.openclaw/openclaw.json`
- `/home/ricky/data/archives/agents/2026-03-31/configured-retired`
- `/home/ricky/data/archives/agents/2026-03-31/disk-orphans`
- `/home/ricky/kb/system/agent-map.md`
- `/home/ricky/CLAUDE.md`
- `/home/ricky/.openclaw/CLAUDE.md`

Archived configured agents:

- `qa-plan`
- `qa-code`
- `qa-data`
- `research-bm`

Archived disk-only orphan dirs:

- `finance-archived`
- `finn`
- `processes`
- `schedule-archived`

Post-step state:

- configured agents: `14`
- on-disk agent directories: `14`

Open issues:

- `main` and `diagnostics` workspace cleanup still needed
- stale nginx Mission Control config copy still unresolved

### 2026-03-31 Main and diagnostics workspace cleanup completed

Action:

- moved `main/workspace/repo` to archives
- moved `main/workspace/data/buyback` to `/home/ricky/data/exports`
- moved `main/workspace/docs`, `knowledge`, and `reports` into KB inbox staging
- moved `diagnostics/workspace/schematics` to diagnostics archives

Verification:

- `main` root is reduced to coordinator files plus `memory/`, `foundation/`, and `kb`
- `main` workspace size dropped from `21M` to `11M`
- `diagnostics` workspace size dropped from `4.3G` to `628K`
- `.openclaw` size dropped from `6.1G` at start of cleanup to `1.8G`

Evidence:

- `/home/ricky/kb/inbox/main-workspace-2026-03-31`
- `/home/ricky/data/exports/buyback/main-workspace-2026-03-31`
- `/home/ricky/data/archives/workspaces/main/2026-03-31`
- `/home/ricky/data/archives/diagnostics/2026-03-31`

Open issues:

- other active workspaces still use mixed folder layouts
- KB promotion from inbox staging still needs a second pass

### 2026-03-31 Structure documentation added

Action:

- added a live operating map for the cleaned system
- added a workspace contract for active OpenClaw workspaces

Verification:

- the core structure and storage rules are now documented inside KB

Evidence:

- `/home/ricky/kb/system/live-operating-map.md`
- `/home/ricky/kb/system/workspace-contract.md`

### 2026-03-31 Final verification snapshot

Action:

- rechecked the live gateway
- rechecked the active agent count and on-disk agent directories
- rechecked the `main` and `diagnostics` workspace roots
- rechecked the updated audit

Verification:

- `openclaw-gateway.service` is active after the cleanup changes
- `openclaw.json` and `.openclaw/agents` both now resolve to `14` active agents
- `main` workspace root is reduced to coordinator material
- `diagnostics` workspace no longer contains `schematics/`
- audit, runbook, and cleanup log now reflect the current state

Final observed state:

- `.openclaw` = `1.8G`
- `.openclaw/agents` = `498M`
- `main` workspace = `11M`
- `diagnostics` workspace = `628K`
- `/home/ricky/kb` markdown files = `42`
- `/home/ricky/kb` markdown lines = `5,504`

Evidence:

- `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/control-history/openclaw-setup-audit-2026-03-31.md`
- `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/openclaw-tonight-execution-plan-2026-03-31.md`
- `/home/ricky/builds/agent-rebuild/technical/evidence/openclaw-cleanup-log-2026-03-31.md`

Remaining issues for the next session:

- active workspace normalization is not finished across every remaining agent
- KB inbox staging still needs second-pass classification into permanent homes
- stale nginx Mission Control config copy and live Supabase trigger state still need explicit cleanup
