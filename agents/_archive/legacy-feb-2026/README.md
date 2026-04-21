# Legacy — Feb 2026 agent planning docs

Historical artifacts from an earlier agent-system planning round (Feb 2026). Kept for audit trail, NOT authoritative. The live v2 agent system lives at `agents/_shared/` + `agents/chief-of-staff/` (and future top-level agents).

## What's in here

Documents from the pre-v2 planning era. None of these are referenced by the v2 build. They were moved here on 2026-04-21 to declutter `agents/` so Lucian's docs were easy to find.

| Bucket | Files |
|--------|-------|
| Top-level planning | `BUILD.md`, `BUILD-PLAN.md`, `PRD.md`, `PRD-HANDOFF.md`, `MC-BUILD-BRIEF.md`, `FINANCE-MERGE.md`, `code-agent-brief.md`, `code-master-brief.md`, `data-architecture-brief.md`, `agent-architecture-map.md`, `research.md`, `subagent-context.md`, `system-health-audit-plan.md`, `token-usage-optimisation.md` |
| Old index (superseded) | `INDEX.md` |
| Plans (subdir) | `plans/agent-architecture-feb18.md`, `agent-build-feb18.md`, `agent-build-feb22.md`, `cursor-health-assessment.plan.md`, `cursor-health-audit.plan.md`, `mc-v2-original-plan.md`, `system-health-audit-plan.md`, `vps-security-audit.md` |
| QA trigger (subdir) | `qa-trigger/MASTER-AUDIT.md`, `qa-trigger/QA-TRIGGER-PLAN.md` |

## Where the live system is

- **Index:** `agents/README.md`
- **Lucian's plan:** `agents/chief-of-staff/plan.md`
- **Shared canon, templates, bin, bridge, etc.:** `agents/_shared/`
- **Build progress tracker:** `agents/_shared/BUILD-STATUS.md`

## Why not just delete?

Some of these docs reference decisions, constraints, or ideas that might be useful to look back on. Git history alone isn't discoverable without knowing the filenames. A flat archive folder is. Delete them when the v2 system has been in production for 3 months and we're confident there's no reason to grep them.
