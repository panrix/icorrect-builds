# Agent Rebuild Workspace

Last updated: 2026-04-01

This workspace holds the active rebuild project material for the OpenClaw cleanup and KB/documentation program.

Start here, then use [documentation-state-summary-2026-04-01.md](/home/ricky/builds/agent-rebuild/technical/control/documentation-state-summary-2026-04-01.md) for the current state.

Current layout:

- `technical/` — control docs, triage sheets, and evidence docs
- `archive/` — dated archive of superseded material

Rule: verified durable conclusions move to `/home/ricky/kb`; this workspace stays project-local.

## Where New Files Go

- New current-state summaries or active transition logs go in `technical/control/`.
- New classification sheets or inventories go in `technical/triage/`.
- New audits, evidence captures, and technical reference notes go in `technical/evidence/`.
- New build specs should usually live in the owning `/home/ricky/builds/<project>/` repo, not here.
- Back Market-specific staged source docs now live in `/home/ricky/builds/backmarket/docs/staged/2026-04-01/`.
- Production BM listing cache files now live in `/home/ricky/builds/icloud-checker/data/`, not in this workspace.
- New durable knowledge should be promoted into `/home/ricky/kb`, not added here as a second canon.
- If a file is historical, superseded, or only useful as evidence, archive it instead of leaving it on the active surface.
