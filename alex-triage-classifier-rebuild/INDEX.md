# alex-triage-classifier-rebuild

**State:** dormant (last activity: 2026-04-10)
**Owner:** alex-cs
**Purpose:** Refactor brief for Alex's Intercom triage classifier — specifies new conversation categories, pricing extraction, and a five-way decision tree to replace the old `classifyConversation` logic.
**Last updated:** 2026-05-02

## Current state

Dormant since 2026-04-10. The only artifact is a single build brief; no implementation work appears to have started in this folder. The actual triage system lives in `/home/ricky/builds/alex-triage-rebuild/` — this folder is the planned-refactor brief that may be folded back into that codebase, or superseded.

**Phase 7c review candidate:** assess whether to revive (fold the brief into alex-triage-rebuild's briefs/ and merge code changes), archive (idea parked indefinitely), or merge into alex-triage-rebuild as a sibling brief.

## Structure

- `briefs/` — the single BUILD-BRIEF.md proposing the classifier refactor
- `decisions/` — empty
- `docs/` — empty
- `archive/` — empty
- `scratch/` — empty

## Key documents

- [`briefs/BUILD-BRIEF.md`](briefs/BUILD-BRIEF.md) — refactor brief specifying new conversation categories, pricing extraction, and the five-way decision tree to replace `classifyConversation`

## Open questions

- Should this brief be merged into `/home/ricky/builds/alex-triage-rebuild/briefs/` and this folder archived? The two are tightly coupled.
