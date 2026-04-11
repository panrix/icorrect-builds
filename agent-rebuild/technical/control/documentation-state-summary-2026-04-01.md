# Documentation State Summary

Date: 2026-04-01
Status: current summary

Purpose: provide the short current-state view for the `agent-rebuild` workspace after the cleanup, KB verification, and documentation reorganization passes.

## Current State

- OpenClaw workspace normalization is complete across the active agent set.
- `/home/ricky/kb` is the canonical shared knowledge layer.
- `agent-rebuild` is now a project-local workspace for current state, small-scale classification, and retained evidence only.
- Back Market-specific staged source documents have been moved into `/home/ricky/builds/backmarket/docs/staged/2026-04-01/`.
- Production BM listing cache files have been rehomed into `/home/ricky/builds/icloud-checker/data/`.
- Historical plan and pre-rebuild reference material have been archived under `/home/ricky/builds/agent-rebuild/archive/2026-04-01/`.
- The large execution log for this tranche is complete and lives in [documentation-rebuild-worklog-2026-03-31.md](/home/ricky/builds/agent-rebuild/technical/evidence/documentation-rebuild-worklog-2026-03-31.md).

## Current Entry Points

- Start at [README.md](/home/ricky/builds/agent-rebuild/README.md) for workspace layout and placement rules.
- Use this file for the current state summary.
- Use [documentation-rebuild-worklog-2026-03-31.md](/home/ricky/builds/agent-rebuild/technical/evidence/documentation-rebuild-worklog-2026-03-31.md) for the full execution record.
- Use [agent-rebuild-doc-triage-2026-03-31.md](/home/ricky/builds/agent-rebuild/technical/triage/agent-rebuild-doc-triage-2026-03-31.md) for the current classification record of this workspace.

## Remaining Open Issues

- pricing docs still need source cleanup or operator confirmation before they can be treated as canonical
- team docs still need operator confirmation before they can be treated as canonical
- fresh Monday exports or API pulls are still needed for the Monday board docs
- the KB git repo is clean, but the surrounding `builds` repo is still dirty and should not be treated as a clean history surface for this tranche
- Obsidian vault scaffolding has still not been created by design

## Boundary Rules

- verified durable conclusions move to `/home/ricky/kb`
- build-local implementation docs belong in their owning `/home/ricky/builds/<project>` repo
- historical notes, superseded specs, and draft patterns belong in `archive/`
- `agent-rebuild` should not become a second KB again
