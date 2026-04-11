# Monday Documentation Triage

Date: 2026-03-31
Owner: Codex
Scope: `/home/ricky/builds/monday`
Purpose: classify the Monday documentation set so project/migration docs are separated from material that should inform the KB

## Classification Key

- `Keep local` = keep in `/home/ricky/builds/monday` as project or integration documentation
- `Promote selected rules to KB` = do not move the whole doc, but extract verified schema/relationship/workflow truths into `/home/ricky/kb/monday`
- `Archive after rebuild` = keep as historical build or migration evidence, not active documentation

## File Triage

| File | Classification | Reason | Action |
|------|----------------|--------|--------|
| `QUERY-SPEC.md` | Keep local | implementation/query instruction for generating trace data | keep as build methodology |
| `automation-audit.md` | Keep local | strong operational audit, but still a build/project artifact tied to a specific board state | keep local, use to verify selected KB Monday facts |
| `automations.md` | Keep local | raw automation export summary for the old board | keep local as evidence source |
| `board-schema.md` | Promote selected rules to KB | high-value schema source, but based on older pull and mixed with commentary | extract verified board facts into KB Monday docs only after refresh |
| `board-v2-build-status.md` | Archive after rebuild | migration/build-state record for the v2 board | preserve as history only |
| `cleanup-brief.md` | Archive after rebuild | project kickoff brief, not current operating truth | historical only |
| `cowork-manual-setup-checklist.md` | Archive after rebuild | manual build checklist for a specific board phase | archive when Monday rebuild phase closes |
| `icorrect-status-notification-documentation.md` | Keep local | integration-specific technical reference | keep local unless a verified canonical notification doc is needed in KB |
| `main-board-column-audit.md` | Promote selected rules to KB | detailed audit with durable column decisions, but still tied to the rebuild project | extract only verified, still-relevant column/relationship facts |
| `repair-flow-traces.md` | Promote selected rules to KB | useful evidence for how work actually moved through Monday, but it is an older snapshot | use as evidence source, not as canonical current process by itself |
| `target-state.md` | Archive after rebuild | design intent for a cleanup/rebuild, not current truth | preserve as design history; only adopted rules belong in KB |

## Immediate Promotion Candidates

These files contain high-value material that should feed `/home/ricky/kb/monday`, but only by extracting verified facts:

- `board-schema.md`
- `main-board-column-audit.md`
- `repair-flow-traces.md`

## Immediate Archive Candidates

- `board-v2-build-status.md`
- `cleanup-brief.md`
- `cowork-manual-setup-checklist.md`
- `target-state.md`

## QA Notes

- `/home/ricky/builds/monday` is primarily a project and migration documentation set.
- The KB Monday docs should contain verified current board facts, not raw migration history.
- Fresh Monday exports or API pulls are still required before any board-specific KB doc can be upgraded beyond partial/source-needed status.
