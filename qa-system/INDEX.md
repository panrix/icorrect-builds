# qa-system

**State:** dormant (parked stub, last touched 2026-02-22)
**Owner:** none
**Purpose:** Parked QA-system registry: a reviewed plan for git-triggered QA agents and a build/QA logging workflow. Per `README.md`: "controlled snapshot rather than redefining scope here" — kept as a reference baseline for whichever active build stream eventually closes the QA loop.
**Last updated:** 2026-05-02 08:30 UTC

## Current state

Dormant. The 2026-02-22 plan never resumed; the active QA work since then has run inside `agent-rebuild/` (the QA reports for Phase 6.9 and the folder-standard rollout) rather than against this stub.

**Phase 7c review candidate:** decide whether to revive (when the Codex-first QA model lands per `~/CLAUDE.md` "old OpenClaw QA agents were archived on 2026-03-31 and will be rebuilt later") or formally retire.

## Structure

- `briefs/` — empty
- `decisions/` — empty
- `docs/` — empty
- `archive/2026-02-22-snapshot/` — 2 files originally under `snapshot/` (`BUILD-QA-WORKFLOW.md`, `QA-TRIGGER-PLAN.md`). Moved per the folder-standard "snapshot named subdirs → archive" rule.
- `scratch/` — empty

## Key documents

- [`README.md`](README.md) — parked-stub explainer ("Status: In progress; Why parked: active build stream exists already")
- [`archive/2026-02-22-snapshot/QA-TRIGGER-PLAN.md`](archive/2026-02-22-snapshot/QA-TRIGGER-PLAN.md) — auto-trigger dormant QA agents from git events; track lifecycle in Supabase. Source of two captured P3 ideas in `idea-inventory.md` (`e1a2b1c3`, `9f9f3b85`).
- [`archive/2026-02-22-snapshot/BUILD-QA-WORKFLOW.md`](archive/2026-02-22-snapshot/BUILD-QA-WORKFLOW.md) — companion build/QA logging workflow.
