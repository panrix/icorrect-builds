# Agent Rebuild Documentation Triage

Date: 2026-03-31
Owner: Codex
Scope: `/home/ricky/builds/agent-rebuild`
Purpose: classify the `agent-rebuild` documentation set so transition materials stop being mistaken for canonical knowledge

Execution status: the immediate archive pass was completed on 2026-04-01.

Archive locations:

- `/home/ricky/builds/agent-rebuild/archive/2026-04-01/root-docs/`
- `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/`

## Classification Key

- `Keep local` = keep in `agent-rebuild` as active project/rebuild documentation
- `Promote selected rules to KB` = do not move the whole file, but extract durable rules or summaries into `/home/ricky/kb`
- `Archive after rebuild` = useful historical record, but not an active long-term working doc

## Root-Level and Structured Project Docs

Note: this file began as a pre-reorg classification sheet. Paths below have been updated to the current structured layout where relevant.

| File | Classification | Reason | Action |
|------|----------------|--------|--------|
| `00-why.md` | Archive after rebuild | context and motivation, not canonical operating truth | archived 2026-04-01 |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/reference/01-lessons-learned.md` | Archived historical reference | retained for future KB extraction if needed | archived 2026-04-01 |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/reference/02-knowledge-map.md` | Archived historical reference | retained for future KB extraction if needed | archived 2026-04-01 |
| `03-sequencing.md` | Archive after rebuild | planning logic for an earlier phase | archived 2026-04-01 |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/reference/04-agent-architecture-spec.md` | Archived historical reference | retained for future KB extraction if needed | archived 2026-04-01 |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/reference/05-memory-problem.md` | Archived historical reference | retained for future KB extraction if needed | archived 2026-04-01 |
| `06-jarvis-fixes.md` | Archive after rebuild | pre-rebuild stopgap record | archived 2026-04-01 |
| `07-supabase-audit.md` | Archive after rebuild | superseded by direct live verification in KB system docs | archived 2026-04-01 |
| `08-research-needed.md` | Archive after rebuild | planning/task split for earlier rebuild phase | archived 2026-04-01 |
| `09-research-agents.md` | Archive after rebuild | earlier agent-design concept, not current operating model | archived 2026-04-01 |
| `10-handoff.md` | Archive after rebuild | session handoff, not durable system knowledge | archived 2026-04-01 |
| `/home/ricky/builds/backmarket/docs/staged/2026-04-01/BM-PROCESS-AUDIT.md` | Moved to owning repo | still useful as Back Market source material, but not an `agent-rebuild` active doc | moved 2026-04-01 into Back Market staged docs |
| `/home/ricky/builds/backmarket/docs/staged/2026-04-01/BM-PROCESS-CURRENT-STATE.md` | Moved to owning repo | still useful as source material for future verified KB/backmarket docs | moved 2026-04-01 into Back Market staged docs |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/reference/KB-CONSOLIDATION-BRIEF.md` | Archived historical reference | methodology reference retained as archive only | archived 2026-04-01 |
| `/home/ricky/builds/backmarket/docs/staged/2026-04-01/PHASE-3-BUILD-BRIEF.md` | Moved to owning repo | build brief belongs closer to the Back Market implementation surface | moved 2026-04-01 into Back Market staged docs |
| `/home/ricky/builds/backmarket/docs/staged/2026-04-01/SOP-pricing-to-listing-SPEC.md` | Moved to owning repo | still useful as source material for future verified KB/backmarket docs | moved 2026-04-01 into Back Market staged docs |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/root-docs/plan.md` | Archive after rebuild | historical rebuild plan retained for archaeology only | archived 2026-04-01 |
| `team-agents.md` | Archive after rebuild | design idea, not current runtime truth | archived 2026-04-01 |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/reference/workspace-research.md` | Archived historical reference | root-cause evidence retained as archive only | archived 2026-04-01 |

## Technical Docs

| File | Classification | Reason | Action |
|------|----------------|--------|--------|
| `technical/INDEX.md` | Archive after rebuild | good discovery scaffold, but counts and locations are stale | archived 2026-04-01 and replaced by `technical/README.md` |
| `technical/triage/agent-rebuild-doc-triage-2026-03-31.md` | Keep local | active triage sheet for this cluster | keep local as the classification record |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/triage-executed/backmarket-doc-triage-2026-03-31.md` | Archive after rebuild | completed triage worksheet | archived 2026-04-01 |
| `technical/evidence/bm-api-reference.md` | Keep local | project-level technical reference; may later inform domain KB | keep local for build work |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/evidence-history/cron-audit.md` | Archive after rebuild | historical cron-state audit | archived 2026-04-01 |
| `technical/evidence/documentation-rebuild-worklog-2026-03-31.md` | Keep as evidence | completed execution record for this tranche | moved to evidence 2026-04-01 |
| `technical/evidence/intercom-capability-matrix.md` | Keep local | technical capability reference for a specific integration surface | keep local |
| `technical/control/kb-verification-ledger-2026-03-31.md` | Keep local | active verification control document | keep local until KB verification program stabilises |
| `technical/evidence/openclaw-cleanup-log-2026-03-31.md` | Keep as evidence | completed cleanup log retained as evidence | moved to evidence 2026-04-01 |
| `technical/openclaw-config-audit.md` | Archive after rebuild | useful historical config audit but stale on active counts | archived 2026-04-01 |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/control-history/openclaw-setup-audit-2026-03-31.md` | Archive after rebuild | historical session audit | archived 2026-04-01 |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/control-history/openclaw-tonight-execution-2026-03-31.md` | Archive after rebuild | historical session runbook | archived 2026-04-01 |
| `technical/openclaw-tonight-execution-plan-2026-03-31.md` | Archive after rebuild | superseded by the current execution runbook/log set | archived 2026-04-01 |
| `technical/token-budget-analysis.md` | Archive after rebuild | useful historical tuning analysis, not canonical operations doc | archived 2026-04-01 |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/evidence-history/workspace-audit-backmarket.md` | Archive after rebuild | historical pre-rebuild workspace audit | archived 2026-04-01 |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/evidence-history/workspace-audit-cs.md` | Archive after rebuild | historical pre-rebuild workspace audit | archived 2026-04-01 |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/evidence-history/workspace-audit-jarvis.md` | Archive after rebuild | historical pre-rebuild workspace audit | archived 2026-04-01 |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/evidence-history/workspace-audit-operations.md` | Archive after rebuild | historical pre-rebuild workspace audit | archived 2026-04-01 |
| `technical/evidence/agent-core-doc-audit-2026-03-31.md` | Keep as evidence | completed audit retained as evidence | moved to evidence 2026-04-01 |
| `technical/evidence/xero-api-reference.md` | Keep local | integration reference, not yet promoted into verified domain KB | keep local |

## Immediate Promotion Candidates

These should not be moved wholesale, but they contain durable material worth extracting into KB in later passes:

- `/home/ricky/builds/agent-rebuild/archive/2026-04-01/reference/01-lessons-learned.md`
- `/home/ricky/builds/agent-rebuild/archive/2026-04-01/reference/02-knowledge-map.md`
- `/home/ricky/builds/agent-rebuild/archive/2026-04-01/reference/04-agent-architecture-spec.md`
- `/home/ricky/builds/agent-rebuild/archive/2026-04-01/reference/05-memory-problem.md`
- `/home/ricky/builds/backmarket/docs/staged/2026-04-01/BM-PROCESS-CURRENT-STATE.md`
- `/home/ricky/builds/backmarket/docs/staged/2026-04-01/SOP-pricing-to-listing-SPEC.md`

## QA Notes

- No file in `agent-rebuild` should currently be treated as canonical business truth by default.
- `agent-rebuild` is a transition workspace, not the permanent home of system knowledge.
- Canonical knowledge extracted from this folder must be re-verified before promotion into `/home/ricky/kb`.
- The active project surface is now materially smaller: superseded planning docs and stale technical snapshots have been moved into the dated archive tree.
- The active project surface is now structured around `technical/` plus the root workspace map; historical plan and reference material have been archived.
