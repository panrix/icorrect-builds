# Intake System Plan QA Review — Round 2

Reviewed against:
- `plan.md`
- `QA-PLAN-REVIEW.md`
- `SPEC.md`
- `FORM-FLOW.md`
- `flows/client-ipad-flow.md`
- `flows/standard-repair-flow.md`
- `integrations.md`
- `react-form/src/App.tsx`
- `react-form/src/FormContext.tsx`
- `react-form/src/types.ts`
- `react-form/package.json`

Repo verification:
- `npm run build` in `react-form/`: passed
- `npm run lint` in `react-form/`: passed

## 1. Findings

### 1. Critical API contracts are still missing for half the system
- Severity: critical
- What is still wrong: The plan says "define request/response shapes for all endpoints" but only actually defines `POST /api/intake` and `GET /api/customer/lookup`. The team-view mutation endpoints that matter operationally are still just names in a table.
- Why this would cause execution pain: Backend and frontend cannot build in parallel without guessing payloads, error shapes, status codes, and transition rules. This will turn into rework the moment someone implements `PATCH /api/intake/:id`, notes, complete, or decline differently from the UI’s assumptions.
- Evidence from repo/plan: `plan.md:155-185`, `plan.md:408-413`, `plan.md:348-359`, `FORM-FLOW.md:88-104`
- What should change before implementation starts: Add full contracts for every endpoint on the critical path, including request body, response body, error cases, allowed status transitions, and which fields are mutable. Do not leave `columnValues` and `quoteData` as unspecified blobs.

### 2. The persistence model is still too vague to implement safely
- Severity: critical
- What is still wrong: The schema sketch defines `intake_sessions.form_data jsonb` while also defining `intake_responses` and `intake_checks`, but it never says which is authoritative, when they diverge, or what gets written synchronously vs derived later. It also omits status enums, versioning, idempotency keys, realtime publication details, and correlation IDs even though the spec still requires them.
- Why this would cause execution pain: This is how you get duplicate writes, untraceable state drift, and a team view that reads stale or partial data. It also makes reconciliation during pilot much harder because the system has no declared notion of the canonical record.
- Evidence from repo/plan: `plan.md:143-148`, `plan.md:363-370`, `plan.md:391-413`, `plan.md:461-464`, `SPEC.md:86-90`
- What should change before implementation starts: Define the storage model explicitly: authoritative tables, status enum, write order, idempotency key, correlation IDs, realtime trigger source, and whether `form_data` is a cache/snapshot or the source of truth. Add that to the plan, not just the future migration file.

### 3. “Duplicate suppression” during pilot is not suppression
- Severity: high
- What is still wrong: The pilot plan says both Typeform and the new system will create Monday items, then calls source-tagging plus daily comparison “duplicate suppression.” That is post-hoc labeling, not suppression.
- Why this would cause execution pain: Ops will still receive duplicate items, and the team will have to manually reason about which record is real while the pilot is running. That is exactly when trust in the new system gets destroyed.
- Evidence from repo/plan: `plan.md:461-464`, `plan.md:489-490`
- What should change before implementation starts: Pick one writer during pilot. Either the new system runs in shadow mode without creating live Monday items, or Typeform remains the writer and the new system only logs/compares. If both write, you need deterministic dedupe before Monday item creation, not after.

### 4. The lookup-heavy flows are still underspecified and will stall implementation
- Severity: high
- What is still wrong: Appointment lookup is still described as a simple email match, but the defined response shape returns `mondayItems[]`, not a single booking. There is no resolution rule for multiple matches, stale bookings, family-shared emails, or missing booking dates. Collection is worse: the verified references say Flow C needs lookup against collection-related groups, but the flow and plan do not define any collection lookup contract at all.
- Why this would cause execution pain: The appointment flow cannot be implemented cleanly until "which booking do we show?" is deterministic. The collection flow cannot reliably tell staff which device to bring without an explicit lookup/match step.
- Evidence from repo/plan: `plan.md:37`, `plan.md:51-62`, `plan.md:171-184`, `plan.md:331-336`, `plan.md:378`, `plan.md:553-554`, `FORM-FLOW.md:92-104`, `FORM-FLOW.md:235-265`
- What should change before implementation starts: Split booking lookup and collection lookup into explicit spikes with defined outputs. If those outputs are not known yet, cut collection lookup from v1 and make it staff-assisted rather than pretending it is deterministic.

### 5. The “open items” are still on the critical path, so the schedule is not actually executable
- Severity: high
- What is still wrong: The plan now lists blockers, but it still schedules Phase 2 work that depends directly on them. The Monday phone field is unresolved, the walk-in destination group is unresolved, and Intercom permissions for quote email are unresolved.
- Why this would cause execution pain: A blocker list is not the same thing as a buildable plan. The team still reaches Phase 2 and stops.
- Evidence from repo/plan: `plan.md:376-377`, `plan.md:410`, `plan.md:572-575`
- What should change before implementation starts: Add a hard pre-Phase-2 checkpoint with explicit exit criteria: phone mapping confirmed or dropped, walk-in target group chosen, Intercom email capability verified end-to-end. If any of those fail, the dependent feature must be cut, not left ambiguous.

### 6. The plan still claims alignment with `SPEC.md` sections 3-4 while silently dropping required operator data
- Severity: high
- What is still wrong: `plan.md` says the operator gates map to `SPEC.md` sections 3 and 4, but the operator flow still does not capture several section 4 baseline prompts: new/refurbished state, fault causation, secondary-fault authorization, and battery upsell authorization. Those are still marked as valid repo requirements.
- Why this would cause execution pain: You still have a source-of-truth split between the revised plan and the standing intake requirements. That means the team view can ship and still fail the repo’s stated handoff requirements.
- Evidence from repo/plan: `plan.md:22-27`, `plan.md:425-434`, `SPEC.md:51-60`, `flows/standard-repair-flow.md:14-20`
- What should change before implementation starts: Either explicitly defer those section 4 requirements in `SPEC.md` and the plan, or add them to the operator flow/data model now. Do not keep saying sections 1-8 remain valid if section 4 is only partially honored.

### 7. Auth is still fuzzy and operator concurrency is completely unspecified
- Severity: medium
- What is still wrong: The plan says auth must be decided before Phase 3, then immediately says nginx basic auth is the simplest option "for now." That is not a real decision. More importantly, nothing defines how two operators or two browser tabs interact with the same session: no claim/lock behavior, no version field, no conflict handling.
- Why this would cause execution pain: The team view is a mutable operations surface. Without ownership and conflict rules, you will get overwritten edits and unreliable status transitions as soon as two people touch the queue.
- Evidence from repo/plan: `plan.md:150-153`, `plan.md:391-413`
- What should change before implementation starts: Decide auth now, not later. Also define session claiming or optimistic concurrency before any team-view implementation: version column, conflict response, and what happens when a second operator edits an in-progress intake.

### 8. The validation gates are still too weak too early
- Severity: medium
- What is still wrong: Phase 0 accepts "test framework installed" even if the suites are empty. Phase 1 only requires a smoke test for the walk-in happy path and decline path. The serious API, realtime, and end-to-end checks are deferred to Phase 4.
- Why this would cause execution pain: This still allows most of the system to be built before there is any meaningful guardrail against contract drift or branching regressions.
- Evidence from repo/plan: `plan.md:187-203`, `plan.md:321-323`, `plan.md:449-456`, `react-form/package.json:6-10`
- What should change before implementation starts: Make minimum real tests part of each phase gate. Phase 0 should end with at least one backend contract test and one client flow test running in CI/local scripts. Phase 2 should not start without them.

## 2. What the first QA likely missed

- The pilot’s “duplicate suppression” is fake. It labels duplicates after creation instead of preventing them.
- The lookup flows are not actually deterministic yet. Appointment returns an array; collection has no defined lookup contract at all.
- The storage model is still not sharp enough to support realtime, reconciliation, and operator mutations safely.
- The revised plan still overstates its alignment with `SPEC.md` section 4.
- Team-view concurrency is not addressed anywhere, which is the kind of omission that only shows up once operators start using it.

## 3. Required plan changes

- Add full contracts for every endpoint in Phases 2-3, not just `POST /api/intake` and customer lookup.
- Define the authoritative persistence model, status enum, idempotency strategy, and correlation IDs.
- Replace the pilot dual-writer approach with a real single-writer or shadow-mode plan.
- Add explicit booking lookup and collection lookup resolution rules, or cut the unresolved lookup behavior from v1.
- Convert the Phase 2 open items into a hard prerequisite checkpoint with exit criteria.
- Either reconcile `SPEC.md` section 4 explicitly or defer the missing operator questions in writing.
- Define auth and operator concurrency before Phase 3.
- Upgrade phase gates so they require working tests, not empty harnesses.

## 4. Recommended final execution order

1. Finish plan sharpness first
- Full endpoint contracts
- Persistence/state model
- Auth decision
- Concurrency rules
- Lookup resolution rules

2. Close Phase 2 blockers before any real backend build
- Intercom email capability verified
- Walk-in Monday destination chosen
- Phone write-back resolved or cut

3. Build Phase 0 foundation for real
- Backend scaffold
- Shared types location chosen
- Supabase schema with explicit enums/keys
- Real test scripts added

4. Rebuild the walk-in client flow
- Flow engine
- Walk-in UI
- Pricing/proceed/decline paths
- One real browser smoke test

5. Implement backend pipeline for walk-in only
- `POST /api/intake`
- Monday write
- Supabase write
- Realtime event
- Quote email only if Intercom capability is already proven

6. Add team view with concurrency rules in place
- Queue
- Detail
- Mutations
- Completion gates

7. Add appointment and collection only after their lookup spikes are closed
- Appointment lookup
- Collection lookup or staff-assisted fallback
- Enquiry path last

8. Run a shadow or single-writer pilot
- Reconciliation
- Monitoring
- Rollback drill
- Cutover only after clean metrics

## 5. Final Assessment

Not ready.

This is substantially better than v1. The obvious structural problems were fixed. The remaining issues are sharper and more dangerous: missing contracts, undefined persistence rules, fake duplicate suppression, and unresolved lookup behavior. If a team starts coding from this version tomorrow, they will still hit avoidable ambiguity on the backend, pilot, and operator surfaces.
