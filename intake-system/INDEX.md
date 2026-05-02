# intake-system

**State:** active
**Owner:** operations
**Purpose:** Primary rebuild of iCorrect's intake stack — client-facing intake form, iPad-first team CRM/intake view, and the Supabase + Monday backend that ties them together.
**Last updated:** 2026-05-02 UTC

## Current state

### In flight
- Backend service rebuild (Supabase migrations + telegram-intake adapter) — see `backend/`.
- Frontend redesign per `briefs/BRIEF-CODEX-REDESIGN.md` and `briefs/TEAM-VIEW-SPEC-v2.md`.
- Pricing data + flow specs converging on the v3 form flow (`briefs/FORM-FLOW-v3.md`).

### Recently shipped
- Plan reviewed through 5 QA rounds, signed off in April (see `docs/audits/QA-PLAN-REVIEW-SIGNOFF.md`).
- Backend scaffolding committed under `backend/` (Apr 23).
- Shared types module in `shared/types.ts`.

### Next up
- Reconcile older docs (`SPEC.md`, `FORM-FLOW.md`) against the canonical four-flow plan (idea-inventory ID `8f1d7e33`).
- Replace mocked adapters in `backend/` with live Monday, Intercom, OpenAI, and Supabase integrations (idea-inventory ID `a983b8a9`).

## Structure

- [`briefs/`](briefs/INDEX.md) — 11 active proposals/specs (BRIEF-CODEX-*, FORM-FLOW, TEAM-VIEW-SPEC, plan.md, etc.). Has sub-INDEX.
- `decisions/` — empty.
- `docs/` — `IMPLEMENTATION-NOTES.md`, `integrations.md`, plus `audits/` (5 QA review files), `assets/` (empty), `staged/` (pre-existing).
- `archive/` — empty.
- `scratch/` — empty.
- `backend/` — Node/TS backend service (kept as-is).
- `frontend/` — frontend app (kept as-is).
- `react-form/` — separate Vite/React form project (kept as-is, has its own git history).
- `device-flows/` — per-device intake flow markdown + source images.
- `flows/` — high-level flow definitions (bm-tradein, client-ipad, diagnostic, standard-repair).
- `reference/` — `intake-audit-2026-02-18.md` + transcripts + SOURCE-MAP.md.
- `shared/` — shared TS types package.
- `supabase/` — Supabase migrations.
- `deploy/` — nginx config for deploy.
- `node_modules/` — excluded (do not edit).

## Key documents

### Briefs
- [`briefs/plan.md`](briefs/plan.md) — master plan (49KB).
- [`briefs/SPEC.md`](briefs/SPEC.md) — v1 spec.
- [`briefs/FORM-FLOW.md`](briefs/FORM-FLOW.md) and [`briefs/FORM-FLOW-v3.md`](briefs/FORM-FLOW-v3.md) — form flow specs (v3 is canonical).
- [`briefs/DESIGN-SPEC.md`](briefs/DESIGN-SPEC.md) — design spec.
- [`briefs/TEAM-VIEW-SPEC.md`](briefs/TEAM-VIEW-SPEC.md) and [`briefs/TEAM-VIEW-SPEC-v2.md`](briefs/TEAM-VIEW-SPEC-v2.md) — team-view spec (v2 is canonical).
- [`briefs/BRIEF-CODEX-BUILD.md`](briefs/BRIEF-CODEX-BUILD.md), [`briefs/BRIEF-CODEX-REDESIGN.md`](briefs/BRIEF-CODEX-REDESIGN.md), [`briefs/BRIEF-CODEX-TRIAGE.md`](briefs/BRIEF-CODEX-TRIAGE.md) — Codex BUILDER briefs.
- [`briefs/TASKLIST-CODEX.md`](briefs/TASKLIST-CODEX.md) — Codex tasklist.

### Docs
- [`docs/IMPLEMENTATION-NOTES.md`](docs/IMPLEMENTATION-NOTES.md) — implementation notes for the build.
- [`docs/integrations.md`](docs/integrations.md) — integration map.
- [`docs/audits/`](docs/audits/) — 5 plan-review reports (QA-PLAN-REVIEW + 3 rounds + FINAL + SIGNOFF).

### Pre-existing canonical
- [`reference/intake-audit-2026-02-18.md`](reference/intake-audit-2026-02-18.md) — canonical intake audit reference.
- [`device-flows/`](device-flows/) — per-device intake flows (iPhone, iPad, MacBook, Apple Watch).
- [`flows/`](flows/) — high-level flow definitions.

## Open questions

- Older docs (`SPEC.md`, `FORM-FLOW.md`) conflict with the v3 / canonical four-flow plan. Reconciliation deferred.
- `backend/` adapters still mocked. Live integration pending.

## Warnings

- `pricing-data.json` and `logo.png` are referenced by relative paths inside `backend/`, `frontend/`, and `react-form/` source files. They are kept at the project root as runtime data/asset to avoid breaking imports. Do not move without updating those imports.
