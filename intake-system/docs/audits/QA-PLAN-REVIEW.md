# Intake System Plan QA Review

Reviewed against:
- `plan.md`
- `SPEC.md`
- `FORM-FLOW.md`
- `flows/client-ipad-flow.md`
- `flows/standard-repair-flow.md`
- `integrations.md`
- `react-form/src/App.tsx`
- `react-form/src/FormContext.tsx`
- `react-form/src/types.ts`
- `react-form/src/steps/*`
- `react-form/package.json`

Validation run:
- `npm run build` in `react-form/`: passed
- `npm run lint` in `react-form/`: fails on `react-form/src/FormContext.tsx:54` (`react-refresh/only-export-components`)

## 1. Findings

### 1. Source-of-truth conflict on MVP scope and hard gates
- Severity: critical
- What is wrong: `plan.md` redefines the MVP around four client-facing flows and explicitly defers photo capture and diagnostic branching, while the repo's current canonical spec still says the MVP is MacBook screen repair end-to-end and requires intake photos, passcode verification, parts reservation signaling, and customer receipt notification.
- Why it matters: Execution will fork immediately. The team can implement exactly what `plan.md` says and still fail the repo's current MVP definition and hard-stop rules.
- Evidence from repo/plan: `plan.md:24-94`, `plan.md:279-287`, `plan.md:322-331`, `SPEC.md:40-49`, `SPEC.md:117-125`, `flows/standard-repair-flow.md:14-57`, `integrations.md:50-53`
- Recommended fix: Pick one authoritative scope document before build starts. Either update `SPEC.md` and the flow docs to match `plan.md`, or explicitly mark them superseded. Do not start implementation while both definitions remain active.

### 2. Phase 2 and 3 are treated like extensions of the prototype, but they are greenfield work
- Severity: critical
- What is wrong: The repo contains a client-only React prototype, not a backend or a team app. There is no Express service, no API package, no Supabase schema/migrations, no auth implementation, no shared API contract, and no `/team` route scaffold.
- Why it matters: The plan underestimates the amount of foundation work. "Build the form first, then backend and team view build naturally" is not true from the current repo state.
- Evidence from repo/plan: `plan.md:13`, `plan.md:196-235`, `plan.md:247-296`, `plan.md:349-357`, `react-form/package.json:6-32`, `react-form/src/App.tsx:15-93`
- Recommended fix: Add an explicit foundation phase before feature phases: backend package scaffold, env contract, Supabase schema/migrations, auth decision, integration adapter boundaries, and shared TypeScript contracts.

### 3. Flow A cannot be treated as a Phase 1 frontend task without deciding the lookup contract first
- Severity: high
- What is wrong: The appointment flow in `plan.md` requires email-based booking lookup and confirmation of existing booking data, but the current repo's phase-1 flow spec says appointment check-in is name-only and explicitly assumes no backend in phase 1.
- Why it matters: Frontend shape, loading states, failure states, and data contract all depend on the lookup source and response format. A stub is not enough unless the stub contract is defined first.
- Evidence from repo/plan: `plan.md:26-40`, `plan.md:116-123`, `plan.md:183`, `plan.md:421-422`, `FORM-FLOW.md:27`, `FORM-FLOW.md:60-69`, `flows/client-ipad-flow.md:15-18`
- Recommended fix: Either reduce Flow A in the first frontend batch to a minimal arrival check-in, or move appointment lookup contract design into the foundation batch and define the exact response shape before frontend build starts.

### 4. The current frontend implementation is linear; the plan requires a routing/state-machine rewrite, not incremental step edits
- Severity: high
- What is wrong: The prototype is built around a fixed `STEPS` array, linear `next/back`, static progress calculation, and hard-coded review edit indices. The plan requires four branches, conditional progress visibility, decline/quote subpaths, and different confirmation messages.
- Why it matters: This is the main client-side dependency. If the team treats it as "rewrite a few steps", navigation bugs and dead-end states are likely.
- Evidence from repo/plan: `plan.md:116-123`, `plan.md:173-176`, `react-form/src/App.tsx:15-38`, `react-form/src/App.tsx:41-79`, `react-form/src/FormContext.tsx:17-45`, `react-form/src/steps/Review.tsx:55-112`
- Recommended fix: Design the flow graph first. Introduce a route/step registry keyed by flow and state, define legal transitions, then rebuild the step components on top of that.

### 5. The prototype and docs disagree with the new flow details in several concrete places
- Severity: high
- What is wrong: The new plan is not just a refinement of the current prototype. It changes flow count, short-flow questions, pricing behavior, and data fields.
- Why it matters: The plan should acknowledge this as a full rewrite of the interaction model, otherwise effort and QA scope will be underestimated.
- Evidence from repo/plan:
  - Visit purpose currently has only three options and omits appointment: `react-form/src/types.ts:13`, `react-form/src/steps/VisitPurpose.tsx:6-42`
  - Pricing currently has no readiness/proceed/decline gate: `react-form/src/steps/Pricing.tsx:21-60`
  - Pre-repair questions currently omit additional-repair consent and use boolean backup state instead of `'yes' | 'no' | 'unknown'`: `react-form/src/types.ts:24-28`, `react-form/src/steps/BeforeWeBegin.tsx:41-67`
  - Current flow spec still defines collection as name + device only and enquiry as name + free text only: `FORM-FLOW.md:73-93`
- Recommended fix: Treat Phase 1 as a contract rewrite. Update `FORM-FLOW.md` first, then align `types.ts`, flow state, and step components against the new contract before doing visual polish.

### 6. The team-view hard gates in `plan.md` are incomplete relative to the repo's existing intake requirements
- Severity: high
- What is wrong: `plan.md` only blocks completion on passcode verification, stock, turnaround, and required fields. Existing repo docs also require universal intake questions, credential validation outcome, photo evidence, and richer handoff data.
- Why it matters: A team view built to the plan can still allow incomplete technician handoffs, which is the exact operational failure the repo docs are trying to solve.
- Evidence from repo/plan: `plan.md:279-287`, `SPEC.md:51-60`, `SPEC.md:86-90`, `flows/standard-repair-flow.md:14-49`, `flows/standard-repair-flow.md:51-57`
- Recommended fix: Split "customer self-service capture" from "operator completion gates" explicitly. The latter should be derived from the agreed technician handoff requirements, not from the reduced client-form question set.

### 7. Critical discovery items are parked as open questions instead of gated prerequisites
- Severity: high
- What is wrong: Phone write-back, `status_14` semantics, team auth, quote email transport, and appointment data source are unresolved, but the plan still treats the affected features as implementation work in later phases.
- Why it matters: These are not minor details. They directly change schema, API shape, auth model, UX copy, and acceptance criteria.
- Evidence from repo/plan: `plan.md:274-277`, `plan.md:304-305`, `plan.md:418-422`
- Recommended fix: Move these into a prerequisite discovery/decision checkpoint with owners and outputs. Phase 2 should not begin until these are resolved or explicitly deferred out of scope.

### 8. Architecture drift is unresolved: repo docs point to FastAPI, plan chooses Express
- Severity: medium
- What is wrong: Existing architecture docs describe a FastAPI integration service, while `plan.md` switches to Node.js + Express without updating the rest of the repo docs.
- Why it matters: This creates ambiguity around implementation patterns, deployment shape, and what prior docs or code are actually reusable.
- Evidence from repo/plan: `plan.md:196`, `plan.md:341`, `SPEC.md:32-36`, `SPEC.md:108-113`
- Recommended fix: Add a short ADR selecting the backend stack and update the repo docs to match. If Express is the new direction, say so explicitly and mark the FastAPI references obsolete.

### 9. Validation strategy is too weak for the amount of branching and integration risk
- Severity: medium
- What is wrong: The repo currently has only `build` and `lint` scripts. There are no automated flow tests, no API tests, no realtime tests, no deployment smoke tests, and no cutover reconciliation checks. Lint is already red before new work starts.
- Why it matters: The plan's acceptance criteria are mostly qualitative. Without explicit smoke coverage, regressions in branching and operator gating will be caught late in pilot.
- Evidence from repo/plan: `plan.md:178-190`, `plan.md:236-243`, `plan.md:289-318`, `react-form/package.json:6-10`, `react-form/src/FormContext.tsx:54`
- Recommended fix: Define a minimum validation matrix now: client-flow happy paths, decline branch, appointment lookup fallback, API contract tests, realtime queue update, and cutover reconciliation. Also make lint green before treating it as a gate.

### 10. The cutover phase lacks rollback and reconciliation mechanics
- Severity: medium
- What is wrong: The plan says to run in parallel for one week and then disable Typeform/n8n, but it does not define duplicate handling, cross-system reconciliation, monitoring, or rollback criteria.
- Why it matters: "Zero data loss" is not verifiable without a comparison method and rollback trigger.
- Evidence from repo/plan: `plan.md:302-318`
- Recommended fix: Add a cutover runbook: event logging, daily reconciliation against Typeform/Monday, duplicate suppression rules, and explicit rollback criteria before any webhook shutdown.

## 2. Open Questions / Assumptions

- Is `plan.md` now the canonical source of truth, or must it conform to `SPEC.md` and the existing flow docs?
- Is the backend stack definitively Node.js + Express, or is FastAPI still in play?
- What system sends the decline-quote email?
- What is the authoritative appointment lookup source: Monday, Shopify, or both?
- Is phone write-back to Monday required for v1, or can that action be omitted until the column mapping exists?

## 3. Recommended Revised Execution Order

1. Reconcile scope and architecture
- Decide the authoritative MVP.
- Resolve backend stack.
- Resolve auth, quote email, appointment source, and Monday field gaps.
- Update `SPEC.md`, `FORM-FLOW.md`, and `plan.md` together.

2. Build foundation before feature work
- Create backend service scaffold.
- Define shared API/contracts and env vars.
- Add Supabase schema/migrations and local dev setup.
- Add mocked integration adapters for Monday/Intercom/email.

3. Rebuild the client flow engine with mocks
- Replace the linear step model with flow-aware routing/state.
- Implement only the data contract and transitions first.
- Then build the visual redesign on top.

4. Deliver the highest-value slice before all four flows
- Safer default: walk-in flow first, because it exercises pricing, branching, intake creation, and team handoff.
- Then add appointment, collection, and enquiry once the backend/team path is proven.

5. Build backend integrations and team view together
- Customer lookup
- Intake create/update
- Realtime queue
- Operator hard gates aligned to the agreed technician handoff contract

6. Add validation and cutover machinery before migration
- Automated happy-path and branch smoke tests
- Pilot reconciliation checks
- Logging, monitoring, rollback plan
- Only then disable Typeform/n8n

## 4. Go / No-Go Assessment

No-go as written.

Minimum changes needed before execution:
- Reconcile `plan.md` with `SPEC.md` and the existing flow docs so there is one authoritative scope.
- Add a foundation phase ahead of Phase 1/2/3.
- Resolve the blocking discovery items: backend stack, auth, quote email, appointment source, and phone-column handling.
- Define a concrete validation strategy beyond visual/manual acceptance criteria.

The current React prototype is a useful UI seed, not a reliable implementation baseline for the plan as written.
