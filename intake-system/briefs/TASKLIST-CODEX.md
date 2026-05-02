# Intake System Build Task List

Source of truth: `plan.md`

Legend:
- `[ ]` pending
- `[-]` in progress
- `[x]` completed

## Phase 0: Foundation

### 0A. Reconcile repo docs
- [x] Read `plan.md` fully and map the execution phases.
- [x] Read `FORM-FLOW.md`, `SPEC.md`, `DESIGN-SPEC.md`, and `QA-PLAN-REVIEW-SIGNOFF.md` for constraints.
- [x] Confirm locked spec files will remain unmodified during implementation.
- [x] Capture any doc/spec mismatches as implementation notes instead of editing locked files.

### 0B. Backend service scaffold
- [x] Create root workspace package and shared TypeScript baseline.
- [x] Create `backend/` package with Express + TypeScript entry point.
- [x] Add structured environment contract and example env file.
- [x] Add adapter interfaces for Monday, Intercom, LLM summary, and persistence.
- [x] Add route skeletons for all 8 API endpoints from `plan.md`.

### 0C. Persistence model
- [x] Add shared types for `IntakeSession`, `IntakeCheck`, `MondayItem`, request/response contracts.
- [x] Add Supabase SQL migration for `intake_status`, `intake_sessions`, and `intake_checks`.
- [x] Implement repository/service layer around idempotency, versioning, and gate checks.
- [x] Model `form_data` as the authoritative intake snapshot.

### 0D. Auth + operator concurrency
- [x] Document nginx basic-auth requirement for `/team`.
- [x] Implement optimistic concurrency checks in intake mutations.
- [x] Return `409` with current session state on version mismatch.
- [x] Support advisory claiming via `PATCH /api/intake/:id`.

### 0E. Full API contracts
- [x] Encode all request/response types in `shared/types.ts`.
- [x] Implement `POST /api/intake`.
- [x] Implement `GET /api/customer/lookup`.
- [x] Implement `GET /api/intake/today`.
- [x] Implement `GET /api/intake/:id`.
- [x] Implement `PATCH /api/intake/:id`.
- [x] Implement `POST /api/intake/:id/notes`.
- [x] Implement `POST /api/intake/:id/complete`.
- [x] Implement `POST /api/intake/:id/decline`.
- [x] Implement `POST /api/intake/:id/checks`.
- [x] Implement `GET /api/health`.

### 0F. Validation baseline
- [x] Add backend test runner and first health-endpoint test.
- [x] Add frontend test runner and first welcome-screen smoke test.
- [x] Make root `build` and `lint` run across the workspace.
- [x] Write Phase 0 QA note after checks pass.

## Phase 1: Client Form - Flow Engine + Walk-In Path

### 1A. Flow engine rewrite
- [x] Create `frontend/` app as a clean build, keeping `react-form/` intact.
- [x] Replace linear step indexes with keyed flow definitions and registry-driven routing.
- [x] Implement next/back navigation within the active flow definition.
- [x] Support conditional insertion/skipping of walk-in steps.
- [x] Make progress calculation flow-aware and hide until `proceed=yes`.

### 1B. Walk-in flow
- [x] Implement welcome + visit-purpose entry point.
- [x] Implement identity step with name/email/phone validation.
- [x] Implement device card selection step.
- [x] Implement searchable model selection from `pricing-data.json`.
- [x] Implement fault selection with MacBook-only keyboard option.
- [x] Implement pricing gate with static lookup and fallback copy.
- [x] Implement proceed decision, quote email choice, and decline-reason capture.
- [x] Implement pre-repair questions and delivery preference.
- [x] Implement confirmation state with auto-reset.

### 1C. Design overhaul
- [x] Build premium kiosk layout and responsive shell for landscape iPad first.
- [x] Define design tokens from `DESIGN-SPEC.md`.
- [x] Create reusable cards, buttons, inputs, progress, and summary components.
- [x] Improve motion and visual hierarchy over the prototype.

### 1D. Data model update
- [x] Replace prototype form model with full `IntakeFormData`.
- [x] Keep step components stateless where possible and bind them to shared flow state.
- [x] Ensure walk-in happy path and decline path both capture required data.

## Pre-Phase-2 Checkpoint
- [x] Verify Intercom quote email capability or mark graceful degradation.
- [x] Verify Monday phone column ID or keep phone in Supabase only.
- [x] Record deferred `SPEC.md` section 4 questions as implementation notes.

## Phase 2: Remaining Client Flows + Backend Integration

### 2A. Appointment flow
- [x] Implement email lookup UX and loading/error states.
- [x] Handle zero, single, and multiple booking matches.
- [x] Support switch-to-walk-in while preserving identity data.

### 2B. Collection + enquiry flows
- [x] Implement collection flow screens.
- [x] Implement enquiry flow screens.
- [x] Ensure both submit cleanly into the shared intake pipeline.

### 2C. Live backend adapters
- [ ] Absorb Monday lookup patterns from `intake-notifications/REBUILD-BRIEF.md`.
- [ ] Absorb LLM summary helpers from `llm-summary-endpoint/server.js`.
- [ ] Swap mock adapters for live integrations behind environment flags.

### 2D. Submission pipeline
- [x] Wire frontend submission to `POST /api/intake`.
- [x] Create Supabase session before Monday mutation.
- [x] Persist Monday correlation and sync status.
- [x] Handle duplicate idempotency keys correctly.

## Phase 3: Team Intake View

### 3A. Intake queue
- [ ] Add `/team` route and queue layout.
- [ ] Show today’s sessions using Europe/London filtering.
- [ ] Add realtime subscription/update handling.

### 3B. Detail view
- [ ] Render full intake details and history context.
- [ ] Surface returning-customer metadata and LLM summary.

### 3C. Operator actions
- [ ] Add detail correction workflow.
- [ ] Add operator notes submission.
- [ ] Add decline action and reason capture.
- [ ] Add complete-intake action.

### 3D. Completion gates
- [ ] Render operator gate checklist.
- [ ] Block completion until all required checks pass.
- [ ] Handle version conflicts in the UI.

## Phase 4: Validation + Cutover

### 4A. Pre-cutover validation
- [ ] Expand automated tests to cover the planned client, API, team-view, and realtime paths.
- [ ] Write manual verification checklist for iPad rehearsal.
- [ ] Add monitoring/logging hooks for Monday write failures.

### 4B. Cutover prep
- [ ] Document nginx, DNS, SSL, and systemd deployment steps.
- [ ] Document rollback drill and failure triggers.
- [ ] Write final build report with deliverables, pass/fail status, manual checks, and compromises.

## QA Notes

### Phase 0
- `npm run build`: passed at root on 2026-04-08.
- `npm run lint`: passed at root on 2026-04-08.
- `npm run test`: passed at root on 2026-04-08.
- Backend scaffold, shared contracts, initial Supabase migration, nginx auth template, and env contract are in place.
- Appointment lookup implementation note recorded: booked-client lookup should search both `Incoming Future` and `Today's Repairs`.
- Live Monday, Intercom, Supabase, and OpenAI adapters are still mocked; Phase 2 will replace them.

### Phase 1
- `npm run build`: passed at root on 2026-04-08 with the new flow engine and walk-in UI.
- `npm run lint`: passed at root on 2026-04-08.
- `npm run test`: passed at root on 2026-04-08.
- Frontend now uses keyed flow definitions, step registry routing, conditional walk-in branching, and a premium kiosk layout.
- Playwright covers welcome render, walk-in happy path, and walk-in decline path with mocked intake submission.

### Phase 2
- `npm run build`: passed at root on 2026-04-08 after wiring appointment, collection, and enquiry into the shared frontend flow.
- `npm run lint`: passed at root on 2026-04-08.
- `npm run test`: passed at root on 2026-04-08.
- Appointment flow now supports customer lookup loading/error states, zero-match fallback, booking selection, and switch-to-walk-in while preserving name/email state.
- Collection and enquiry flows now submit through the shared intake pipeline instead of placeholder screens.
- Playwright now covers welcome, appointment success, appointment zero-match to walk-in, collection, walk-in happy path, walk-in decline path, and enquiry with mocked backend responses.
- Frontend submission is wired to `POST /api/intake` across the client flows, and backend intake creation already applies idempotency, Monday correlation, and sync-status handling against the current in-memory repository.
- Live Monday, Intercom, and Supabase integrations remain pending; Phase 2 is implementation-complete for mocked/local QA, not for live cutover QA.

### Phase 3
- Pending

### Phase 4
- Pending

## Checkpoint Notes

- Monday phone column verified live on 2026-04-08: `text00` (`Phone Number`).
- Intercom quote-email capability could not be verified because `INTERCOM_ACCESS_TOKEN` is missing from `/home/ricky/config/api-keys/.env` on this machine.
- Phase 2 should therefore treat quote email as a graceful-degradation path until credentials and a safe test recipient are available.
