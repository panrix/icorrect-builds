# intake-notifications

**State:** dormant (last activity: 2026-04-08)
**Owner:** operations
**Purpose:** Planning/spec workspace for replacing n8n-hosted Typeform-to-Slack intake notifications with a self-hosted Node.js service.
**Last updated:** 2026-05-02 UTC

## Current state

Dormant. Last meaningful change: 2026-04-08 (`plan.md`). Reason for dormancy: spec/plan complete but build never started — superseded in priority by the broader `intake-system/` rebuild.

**Phase 7c review candidate:** assess whether to revive (build the small Slack-notif service) or fold the spec into `intake-system/` and archive this folder.

## Structure

- `briefs/` — `plan.md` and `REBUILD-BRIEF.md` — the planning surface for this work.
- `decisions/` — empty.
- `docs/` — empty.
- `archive/` — pre-existing archive: original SPEC.md, BUILD-LOG.md, COLLECTION-WORKFLOW-SPEC.md, SUMMARY.md, plus `n8n-workflows/` exports of the legacy n8n flows.
- `scratch/` — empty.
- `specs/` — pre-existing subdir with `slack-intake-2026-03-31/` spec snapshot. Left in place (existing structure).

## Key documents

### briefs/
- [`briefs/plan.md`](briefs/plan.md) — current build plan for the self-hosted Node service.
- [`briefs/REBUILD-BRIEF.md`](briefs/REBUILD-BRIEF.md) — original rebuild brief (problem framing + target shape).

### archive/
- `archive/SPEC.md` — earlier spec, superseded by `briefs/plan.md`.
- `archive/COLLECTION-WORKFLOW-SPEC.md` — n8n-era workflow capture.
- `archive/BUILD-LOG.md` — historical build log.
- `archive/SUMMARY.md` — historical summary.
- `archive/n8n-workflows/` — exported n8n workflow JSON.

### specs/
- `specs/slack-intake-2026-03-31/` — point-in-time spec snapshot (Mar 31).
