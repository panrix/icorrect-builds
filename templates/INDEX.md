# templates

**State:** dormant (last activity: 2026-02-22)
**Owner:** none
**Purpose:** Template library — reusable scaffolds for new builds. SPEC and stub-README templates that other build folders can copy from when seeding a new project.
**Last updated:** 2026-05-02

## Current state

Dormant. Last meaningful change: 2026-02-22 (initial creation). Has not been actively referenced; the folder-standard rollout uses its own templates (in `~/builds/agent-rebuild/briefs/PHASE-7a-STANDARDIZATION-SPEC.md`) rather than these.

**Phase 7c review candidate:** assess whether to (a) revive these as the canonical template library cited by the folder-standard, (b) replace with templates derived from the new folder-standard, or (c) archive entirely.

**Deviation from folder-standard:** template files are kept at the project root rather than moved into `briefs/`, because the folder IS a template library and flat-structure access is the whole point (per Phase 7a spec edge-case rule). Standard 5 subdirs created for consistency but are empty.

## Structure

- `briefs/` — empty (templates kept at root; see deviation note above).
- `decisions/` — empty.
- `docs/` — empty.
- `archive/` — empty.
- `scratch/` — empty.

## Key documents (kept at root as primary artifacts)

- [`SPEC-TEMPLATE.md`](SPEC-TEMPLATE.md) — 10-section build spec template (problem statement, business case, scope, architecture, data model, hard rules, phase plan, risks, open questions, source map).
- [`STUB-README-TEMPLATE.md`](STUB-README-TEMPLATE.md) — short stub for parked-build folders (status, why parked, what would unblock, latest known approach, snapshot inventory).

## Open questions

- Should these be regenerated to match the new folder-standard (so a future `templates/folder-standard-INDEX-template.md` exists)?
- Are these templates being used by any active build, or are they dead?
