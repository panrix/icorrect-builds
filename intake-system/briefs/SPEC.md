# Intake System SPEC

## 1) Problem Statement

Intake is the highest-leverage operational bottleneck at iCorrect. Information is lost between customer conversations and workshop execution, creating repeat questions, poor handoffs, avoidable delays, and internal distrust between intake and technicians.

Primary failure modes observed in source materials:
- Incomplete intake notes and missing pre-check detail.
- Passcodes not validated before devices enter queue.
- Parts availability not confirmed at intake, causing timeline slips.
- Context from Intercom/phone is not carried into intake.
- No consistent conditional question flow across repair/diagnostic/BM trade-in.

## 2) Architecture Overview

Two interfaces with shared data contracts:

1. **Client-facing iPad interface**
   - Reception self-service triage.
   - Name lookup and returning-customer context pull.
   - Price/turnaround awareness and readiness branching.
   - Staff notification only when customer has intent to proceed.

2. **Team-facing internal intake interface**
   - Operator-guided workflow (Adil/Roni).
   - Hard-gated required fields.
   - Three flows:
     - Standard repair intake
     - Diagnostic intake
     - BM trade-in intake

Back-end architecture direction:
- React + TypeScript front-end.
- Node.js + Express integration service for Monday/Intercom endpoints. *(Changed from FastAPI, 2026-04-08 — all VPS services are Node.js, enables code reuse.)*
- Supabase for operational data and media storage.
- Nginx reverse proxy for service routing.

## 3) Hard Gates and Rules

Non-negotiables:
- Missing required fields blocks progression.
- No passcode for diagnostics means do not accept device.
- Password/passcode must be verified where testable before queue entry.
- Parts must be checked before queue entry.
- Turnaround must be confirmed with customer and recorded.
- Intake photos are required before queue entry.
- Corporate account passcode agreements must be respected (do not re-ask when policy exists).
- Device splitting for combined screen + board/liquid work must be tracked as parallel streams.
- Intake to tech handoff must include complete package; tech should not need to reconstruct context.

## 4) Universal Questions (all intakes)

Required baseline prompts:
- Has this device been repaired before?
- Has the Apple Store seen this device?
- ~~New or refurbished?~~ *(Deferred from v1 — rarely actionable at intake. See `plan.md`.)*
- ~~How did the fault occur?~~ *(Deferred from v1 — captured in free-text fault description. See `plan.md`.)*
- Passcode/password collection and validation status.
- ~~Secondary-fault authorization.~~ *(Deferred from v1 — currently handled verbally. See `plan.md`.)*
- ~~Battery upsell authorization for relevant screen repairs.~~ *(Deferred from v1 — currently offered during repair. See `plan.md`.)*

## 5) Device-Specific Flows

Detailed decision trees are in:
- `device-flows/macbook-flows.md`
- `device-flows/iphone-flows.md`
- `device-flows/ipad-flows.md`
- `device-flows/apple-watch-flows.md`

Operator flows authored for this registry:
- `flows/client-ipad-flow.md`
- `flows/standard-repair-flow.md`
- `flows/diagnostic-intake-flow.md`
- `flows/bm-tradein-flow.md`

## 6) Supabase Schema (consolidated minimum)

> **Revised 2026-04-08.** The authoritative schema is now in `plan.md` section 0C. Key changes: `intake_responses` dropped (form answers live in `form_data` JSONB on sessions), photos and turnaround tables deferred from v1.

v1 core entities:
- `intake_sessions`: one per form submission. Contains `form_data` JSONB (authoritative snapshot of all answers), status enum, version column for optimistic concurrency, idempotency key, Monday item correlation.
- `intake_checks`: operator verification events (passcode verified, parts available, turnaround confirmed, fields complete).

Deferred from v1:
- ~~`intake_responses`~~: dropped — normalised answers add complexity without value at current scale. `form_data` JSONB is the single source of truth.
- `intake_photos`: deferred until photo capture feature is built.
- `turnaround_times`: deferred until dynamic turnaround engine is built.
- `corporate_profiles`: deferred until corporate intake path is built.

Data requirements (unchanged):
- Must link session to Monday item IDs via `monday_item_id` column.
- Must capture `flow_type` for branching logic.
- Must persist passcode verification outcome explicitly (via `intake_checks`).
- Must preserve operator identity and timestamps for accountability (via `claimed_by`, `intake_checks.operator_name`).

## 7) Monday.com Mapping (intake-relevant)

Primary boards:
- Main repairs board: `349212843`
- Parts/stock board: `985177480`
- Product/repair relationships: `2477699024`

Critical fields:
- Service method, status, passcode, client contact details, serial/IMEI.
- Walk-in notes and longer structured intake notes.
- Passcode verification status, basic test status, stock status.
- Reported vs actual grading for BM-relevant paths.
- Mirror field caveat: some fields mirror from linked client capture structures and require writing to source relation.

## 8) Technical Architecture

Proposed implementation shape:
- Front-end: Vite React TypeScript app optimized for iPad.
- API layer: Node.js + Express service for server-side credentialed integrations (Monday, Intercom). *(Changed from FastAPI, 2026-04-08.)*
- Data/storage: Supabase Postgres + Supabase Storage for intake photos and optional recordings.
- Notifications: event triggers for customer updates and staff handoff prompts.
- Deployment: systemd-managed backend service behind Nginx.

## 9) MVP Scope (build first)

> **Superseded 2026-04-08.** The canonical MVP scope is now defined in `plan.md` (v2).
> The original MacBook-only MVP below is preserved for reference but is no longer the build target.

**Current MVP (from plan.md v2):** Four client-facing intake flows (appointment, walk-in, collection, enquiry) with a backend service, Supabase data layer, and iPad team intake view. Walk-in flow is built first because it exercises the most complexity (pricing gate, branching, Monday write-back).

**Deferred from original MVP to later phases:**
- Intake photos (needs camera API + Supabase Storage)
- Parts reservation signaling (needs parts service integration)
- Corporate passcode profiles (low volume, manual process works)
- Diagnostic and BM trade-in branching (separate systems)

See `plan.md` for full phasing, acceptance criteria, and QA resolution matrix.

## 10) Full Phasing

> **Superseded 2026-04-08.** See `plan.md` for the current phasing:
> Phase 0 (Foundation) → Phase 1 (Walk-in flow) → Phase 2 (Remaining flows + backend) → Phase 3 (Team view) → Phase 4 (Pilot + cutover).

## 11) Operational Context

Key operating realities:
- Adil role complexity and context switching are major error drivers.
- Monday board structure is broad and partially inconsistent in active usage.
- Intake quality directly impacts tech efficiency, rework risk, and customer comms quality.
- Corporate service quality expectations require deterministic intake consistency.

## 12) Open Questions

Resolved in source set:
- Photo storage direction (Supabase Storage).
- iCloud check ownership (moving away from brittle n8n dependency pattern).
- Corporate profile concept for passcode exceptions.

Still open / external dependency:
- Dedicated walk-in Cursor plan file path was not found during audit; intake logic currently sourced from `INTAKE-SYNTHESIS.md` and `DEV-BRIEF.md`.
- Full Monday column utilization audit still required as a prerequisite quality gate.
- Ownership model for keeping turnaround-time data fresh.

## Buildability Note

This directory is intentionally modular. Builders should start with:
1. `SPEC.md`
2. `flows/client-ipad-flow.md`
3. `flows/standard-repair-flow.md`
4. `integrations.md`
5. `reference/SOURCE-MAP.md`
