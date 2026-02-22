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

Back-end architecture direction (from source plans):
- React + TypeScript front-end.
- FastAPI integration service for Monday/Intercom/iCloud endpoints.
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
- New or refurbished?
- How did the fault occur?
- Passcode/password collection and validation status.
- Secondary-fault authorization.
- Battery upsell authorization for relevant screen repairs.

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

Core entities:
- `intake_sessions`: one per device drop-off.
- `intake_responses`: normalized question/answer records.
- `intake_checks`: pre-check and validation events.
- `intake_photos`: intake condition media links.
- `turnaround_times`: repair-type SLA table.
- `corporate_profiles`: account-level operating rules and passcode arrangements.

Data requirements:
- Must link session to Monday item IDs and integration correlation IDs.
- Must capture `service_type` and `intake_type` for branching logic.
- Must persist passcode verification outcome explicitly.
- Must preserve operator identity and timestamps for accountability.

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
- API layer: FastAPI service for server-side credentialed integrations (Monday, Intercom, iCloud checks).
- Data/storage: Supabase Postgres + Supabase Storage for intake photos and optional recordings.
- Notifications: event triggers for customer updates and staff handoff prompts.
- Deployment: systemd-managed backend service behind Nginx.

## 9) MVP Scope (build first)

MVP target: **MacBook screen repair intake, end-to-end**.

MVP must include:
- Client iPad route with model/fault capture and readiness decisioning.
- Team flow with universal questions and MacBook-specific intake gates.
- Passcode verification workflow.
- Parts check and reservation signaling.
- Photo capture and queue handoff package creation.
- Monday writes and customer receipt notification.

MVP excludes:
- Full AI chat escalation layer.
- Ambient conversation recording/transcription.
- Full BM trade-in branch.
- Full diagnostic branch.
- Dynamic turnaround engine.

## 10) Full Phasing

Phased rollout:
1. **Foundation**: schema, integrations, scaffolding.
2. **Repair flow MVP**: MacBook screen path validated with intake operator.
3. **Flow expansion**: iPhone/iPad/Watch + mail-in/courier adaptations.
4. **Advanced intelligence**: richer context pull, reconciliation analytics, dynamic decisioning.

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
