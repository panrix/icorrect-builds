# Agent System Build Docs — Index

> Single reference for everything built, planned, and broken in the OpenClaw agent system.
> Last updated: 23 Feb 2026

---

## Timeline

### Week 1: Foundation (10–16 Feb)
1. **PRD-HANDOFF.md** — Two-day discussion sessions distilled into a full product requirements handoff
2. **MC-BUILD-BRIEF.md** — Current state snapshot: what Mission Control had, what was broken, what to build
3. **PRD.md** — Official Mission Control v2 PRD, approved for build

### Week 2: The Build (17–19 Feb)
4. **BUILD-PLAN.md** — 12-phase roadmap with pre-reqs and critical path. *This is the master build checklist.*
5. **BUILD.md** — Deployment docs, infrastructure, architecture. Written during/after the build.
6. **FINANCE-MERGE.md** — Finance agent merged into Operations. Completed (3 commits, 16 files).
7. **agent-architecture-map.md** — Full org chart of 18 agents (16 active, 2 archived) with Telegram mappings
8. **data-architecture-brief.md** — Vision doc: repair journey data flow across Monday, Xero, Intercom, Supabase
9. **token-usage-optimisation.md** — Cost analysis after hitting 32% of weekly token limit in one day
10. **code-agent-brief.md** — Brief for Code agent: inter-agent messaging broken, Slack voice notes missing
11. **subagent-context.md** — Template context block for sub-agent task prompts

### Week 2: QA Pipeline (20–22 Feb)
12. **qa-trigger/QA-TRIGGER-PLAN.md** — Auto-trigger QA agents via git commits + Supabase. All 12 agents, hooks, kill switch.
13. **qa-trigger/MASTER-AUDIT.md** — QA trigger audit. **Verdict: READY FOR PRODUCTION.** 10/10 steps, 3 blockers resolved.

### Week 2: Audit & Issues (21–22 Feb)
14. **code-master-brief.md** — Jarvis flagged 11 issues, prioritised by severity. *This is the issues reference doc.*
15. **system-health-audit-plan.md** — Ground truth audit: what works, what's broken, what's misconfigured. *This is the current action plan.*

---

## Plans (Historical)

All in `plans/`. These are snapshots — some are superseded. Read in this order:

| # | File | Date | Status | Notes |
|---|------|------|--------|-------|
| 1 | mc-v2-original-plan.md | 17 Feb | **Superseded** by BUILD-PLAN.md | Original MC v2 plan with PRD corrections |
| 2 | agent-architecture-feb18.md | 18 Feb | **Superseded** by BUILD-PLAN.md | Duplicate of the 12-phase plan |
| 3 | agent-build-feb18.md | 18 Feb | **Unbuilt** | Intake System plan (React+FastAPI). Not started. |
| 4 | vps-security-audit.md | 18 Feb | **Partially done** | 4 VPS security fixes. Some addressed, some pending. |
| 5 | agent-build-feb22.md | 22 Feb | **In progress** | Build Registry consolidation (this directory is part of it) |
| 6 | cursor-health-assessment.plan.md | 22 Feb | **Reviewed** | Cursor agent's 7-priority fix plan. 70% good, see audit plan critique. |
| 7 | cursor-health-audit.plan.md | 22 Feb | **Reviewed** | Cursor agent's 10-item audit. Overlaps with #6. |
| 8 | system-health-audit-plan.md | 22 Feb | **Active** | Step 0 consolidation (this directory). Now done. |

---

## What Supersedes What

- **PRD.md** is the spec. **BUILD-PLAN.md** is the execution checklist. Both are authoritative.
- **system-health-audit-plan.md** (root) is the current action plan. It incorporates and critiques the Cursor plans.
- **code-master-brief.md** is the live issues list. **code-agent-brief.md** is an older subset — use the master brief.
- Plans #1 and #2 in the table above are historical — BUILD-PLAN.md replaced them.

---

## Quick Reference

| Question | Read this |
|----------|-----------|
| What are we building? | PRD.md |
| What's the build status? | BUILD-PLAN.md (phases 1-8, 11-12 done; phase 9-10 partial) |
| What's broken right now? | system-health-audit-plan.md → Part 1 |
| What's the Monday fix plan? | system-health-audit-plan.md → Part 3 |
| How do agents talk to each other? | agent-architecture-map.md |
| How does data flow? | data-architecture-brief.md |
| Is the QA pipeline working? | qa-trigger/MASTER-AUDIT.md (yes, production-ready) |
| What did the finance merge change? | FINANCE-MERGE.md |
| Why are tokens expensive? | token-usage-optimisation.md |
