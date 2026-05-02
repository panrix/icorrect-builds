# VPS Agent Setup Audit

**Date:** 2026-02-24 (UTC)  
**Type:** Read-only audit (no config or code changes made)

## Executive Summary
The agent system is operational but structurally disorganized due to source-of-truth fragmentation and unresolved migration drift.

- Runtime is up and generally healthy.
- Architecture documentation is conflicting.
- Agent topology is inconsistent across config, definitions, and runtime directories.
- Model configuration is partially implicit and therefore risky.

## Scope Audited

- Runtime config and topology:
  - `~/.openclaw/openclaw.json`
- Agent definitions:
  - `/home/ricky/mission-control-v2/agents/*`
- Runtime agent directories/workspaces:
  - `/home/ricky/.openclaw/agents/*`
- Scheduling/runtime:
  - systemd user services
  - `crontab -l`
  - `openclaw cron list`
- Health and reconciliation logs:
  - `/home/ricky/logs/health/*.log`
  - `/home/ricky/logs/cron/qa-retry-cron.log`
- Documentation integrity/drift:
  - `/home/ricky/CLAUDE.md`
  - `/home/ricky/README.md`
  - `/home/ricky/builds/**`
  - `/home/ricky/mission-control-v2/docs/**`
  - `/home/ricky/open-claw-research-setup/**`
  - `/home/ricky/Claude-SOPs-for-iCorrect/**`

## Findings (Severity Ordered)

### Critical

1. Conflicting architecture truth in core docs.
   - `CLAUDE.md` states `team/parts/website` are transitional and being retired.
   - `builds/agents/research.md` states they are promoted domain leads and not being retired.
   - Impact: contradictory decisions depending on which doc is read.

2. Topology mismatch across runtime, definitions, and directories.
   - Runtime config: 14 agents.
   - Definitions in `mission-control-v2/agents`: 29 agent directories.
   - Runtime directories in `.openclaw/agents`: 18 directories including legacy/orphan entries.
   - Impact: no single reliable representation of "what exists now."

3. Model assignment ambiguity in runtime config.
   - `default_model` is unset in `openclaw.json`.
   - Some agents (`main`, `team`, `website`, `parts`) rely on implicit inheritance with no explicit default.
   - `systems` is set to Sonnet while audit/research documents indicate intended Haiku.
   - Impact: unpredictable performance/cost behavior and harder debugging.

### High

1. Sub-agent definition sprawl without runtime registration.
   - Many prefixed sub-agent definitions exist (`ops-*`, `mkt-*`, `bm-*`, `cs-*`, `fin-*`) but are not registered in active runtime config.
   - Impact: high cognitive load, unclear migration status, naming confusion.

2. Mixed file-linkage model in workspaces.
   - Some workspaces symlink `CLAUDE.md`/`SOUL.md` to `mission-control-v2/agents`.
   - Others keep local copies.
   - Impact: hidden divergence risk when one source is edited and another is not.

3. OpenClaw cron drift remains.
   - 3 marketing SEO-related OpenClaw cron jobs currently in `error`.
   - BM QC watch cron is `ok`.
   - Impact: partial automation failure despite healthy baseline checks.

4. Duplicate docs across two roots.
   - Major docs duplicated across `/home/ricky/builds/agents/` and `/home/ricky/mission-control-v2/docs/`.
   - Impact: guaranteed future drift unless one location is made canonical.

### Medium

1. `open-claw-research-setup` content is transcript-like and should not be treated as canonical implementation spec.

2. Legacy runtime directories still present:
   - `finn`, `processes`, `finance-archived`, `schedule-archived`.
   - Impact: clutter and accidental re-use risk.

3. Broken symlink in main workspace:
   - `~/.openclaw/agents/main/workspace/mission-control` points to missing `/home/ricky/mission-control`.

4. PM2 status is noisy/non-authoritative in this environment.
   - PM2 socket/daemon errors were observed during audit checks.
   - Core runtime is systemd-based (`openclaw-gateway`, `agent-trigger`) and healthy.

## What Is Working

- `openclaw-gateway` service running.
- `agent-trigger` service running.
- Health/reconciliation logs currently show clear status.
- Host-level resources (disk/memory/load) are stable.
- User crons are active.

## Root Causes

1. Fast iteration across multiple documentation and code locations.
2. No enforced canonical source for architecture + runtime registry + operational docs.
3. Migration steps partially completed (rename/promote/retire paths mixed).
4. Runtime and documentation updated on different timelines.

## Trust Tier Recommendation

### Tier 1 (Operational Truth)
- `~/.openclaw/openclaw.json`
- `openclaw cron list`
- systemd service status/logs

### Tier 2 (Implementation Truth)
- `/home/ricky/mission-control-v2/agents/`
- `/home/ricky/mission-control-v2/scripts/`

### Tier 3 (Planning/Reference Only)
- `/home/ricky/builds/**`
- `/home/ricky/open-claw-research-setup/**`
- `/home/ricky/Claude-SOPs-for-iCorrect/**`

## Final Verdict
The setup is functional but not governable in its current state model.  
Primary issue is not lack of capability; it is fragmented sources of truth and unresolved migration drift.
