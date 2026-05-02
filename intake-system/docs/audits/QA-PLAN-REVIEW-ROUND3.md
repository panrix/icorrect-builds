# Intake System Plan QA Review — Round 3

Reviewed against:
- `plan.md`
- `QA-PLAN-REVIEW.md`
- `QA-PLAN-REVIEW-ROUND2.md`
- `SPEC.md`
- `FORM-FLOW.md`
- `react-form/src/App.tsx`
- `react-form/src/types.ts`
- `react-form/package.json`

Repo verification:
- `npm run build` in `react-form/`: passed
- `npm run lint` in `react-form/`: passed

## 1. Findings

### 1. The repo still has a schema source-of-truth conflict
- Severity: high
- What is still wrong: `plan.md` says `SPEC.md` sections 1-8 remain valid, but the plan now explicitly drops `intake_responses` and makes `form_data` on `intake_sessions` authoritative. `SPEC.md` section 6 still lists `intake_responses` as a core entity and still describes a different consolidated minimum schema.
- Why this would cause execution pain: This is enough to split implementation again. One person can build migrations from `plan.md` while another reads `SPEC.md` and assumes a normalized response table is still part of the v1 data model.
- Evidence from repo/plan: `plan.md:22-23`, `plan.md:155-228`, `SPEC.md:76-90`
- What should change before implementation starts: Update `SPEC.md` section 6 to match the current plan, or stop claiming sections 1-8 are all still valid. The schema contract needs one authoritative definition.

### 2. Status and queue semantics are still internally inconsistent
- Severity: high
- What is still wrong: The persistence enum is `submitted | pending | in_progress | completed | declined | cancelled`, but the team queue section still describes status flow as `new → in-progress → completed | declined`. That is not the same state machine. The naming mismatch is not cosmetic because the API contracts and realtime filters use the enum values.
- Why this would cause execution pain: Backend, frontend, and tests will drift immediately. Someone will build UI labels and filters around `new`, someone else around `submitted`, and queue behavior will be wrong or inconsistently mapped.
- Evidence from repo/plan: `plan.md:161-170`, `plan.md:226-228`, `plan.md:386-393`, `plan.md:705-707`
- What should change before implementation starts: Pick one status model and use it everywhere. If `new` is only a UI label for `submitted`, say that explicitly in the plan and contracts.

### 3. Monday group movement is still contradictory
- Severity: high
- What is still wrong: The plan says walk-in items are created directly in Today's Repairs (`new_group70029`), but the complete-intake endpoint also says it moves the Monday item to Today's Repairs group as a side effect.
- Why this would cause execution pain: This means the key lifecycle transition is still undefined. Either the item starts in Today's Repairs and completion only changes status, or it starts elsewhere and completion moves it. Right now the plan says both.
- Evidence from repo/plan: `plan.md:42`, `plan.md:689`, `plan.md:724-726`, `plan.md:428-430`, `plan.md:889`
- What should change before implementation starts: Declare the exact Monday lifecycle. Example: "walk-in create goes to group X, complete moves to group Y" or "walk-in create already goes to Today's Repairs; complete only updates status4 and session state." Do not leave both behaviors in the plan.

### 4. “Today” is specified in UTC, but the business operates in London time
- Severity: medium
- What is still wrong: `GET /api/intake/today` is defined as "filtered to today (UTC)". iCorrect is in London. Around DST and at shop open/close boundaries, UTC day boundaries are not the same as business-day boundaries.
- Why this would cause execution pain: The team queue will intermittently hide same-day submissions or include previous-day ones at exactly the times operators care about most.
- Evidence from repo/plan: `plan.md:352`, `SPEC.md:5`, `react-form/package.json:1-33`  
- What should change before implementation starts: Define "today" in `Europe/London`, not UTC. Put that directly into the endpoint contract and tests.

### 5. The docs are still not actually fully aligned with the revised plan
- Severity: medium
- What is still wrong: `plan.md` marks `SPEC.md` and `FORM-FLOW.md` as updated/done, but `FORM-FLOW.md` still lags the new plan in concrete places:
  - it does not include the new appointment lookup resolution rules for multiple matches/family-shared emails or the explicit API error state
  - it still presents collection as a generic minimal flow without the new "staff-assisted, no backend lookup in v1" positioning
  - its data model still leaves `bookingData` as `object | null` instead of the typed lookup response the plan now defines
- Why this would cause execution pain: The plan is now good enough that doc drift becomes the main way engineers get implementation details wrong.
- Evidence from repo/plan: `plan.md:66-73`, `plan.md:106-116`, `plan.md:330-341`, `FORM-FLOW.md:90-104`, `FORM-FLOW.md:235-265`, `FORM-FLOW.md:339-346`
- What should change before implementation starts: Do one more doc sync pass. `FORM-FLOW.md` should reflect the exact lookup/error/fallback behavior and the typed booking contract, or it should stop calling itself the definitive flow spec.

### 6. The cutover plan is now safer than the dual-writer version, but still has no low-risk live soak
- Severity: medium
- What is still wrong: The plan correctly removed the fake duplicate-suppression pilot, but it replaced it with direct cutover after automated tests and a manual walkthrough. That is clean operationally, but still aggressive for a brand-new intake path tied to Monday and realtime.
- Why this would cause execution pain: The first real customer becomes the real soak test. Rollback exists, but that still means an outage or manual scramble is the first time the production path is exercised under live conditions.
- Evidence from repo/plan: `plan.md:43`, `plan.md:781-807`, `plan.md:810-821`
- What should change before implementation starts: Add one bounded live rehearsal before full switch. The boring option is an operator-only smoke in the shop with real APIs and a test device/customer record before customer-facing cutover that same day.

## 2. What the first QA likely missed

- The major remaining problems are not missing sections anymore. They are contract mismatches between the now-detailed sections.
- The lingering risk is mostly internal inconsistency: schema docs, status names, and Monday lifecycle behavior still do not fully agree.
- The UTC definition for "today" is the kind of bug a weaker review misses because it only shows up in operations, not in code structure.

## 3. Required plan changes

- Reconcile `SPEC.md` section 6 with the current persistence model.
- Reconcile the queue status names with the API enum and realtime filters.
- Resolve the Monday group lifecycle contradiction for walk-in creation vs completion.
- Define `GET /api/intake/today` in `Europe/London`.
- Sync `FORM-FLOW.md` to the new appointment/collection contract details.
- Add one pre-cutover live rehearsal step with real integrations.

## 4. Recommended final execution order

1. Do one final document-contract cleanup
- Schema source of truth
- Status model
- Monday group lifecycle
- London-time business-day definition
- FORM-FLOW alignment

2. Build Phase 0 exactly as planned
- Backend scaffold
- Shared types
- Supabase schema
- Health test and one client test

3. Build Phase 1 walk-in path
- Flow engine
- Walk-in UI
- Walk-in smoke coverage

4. Close the pre-Phase-2 blockers
- Intercom capability
- Phone column mapping or explicit fallback

5. Build Phase 2 backend and remaining flows
- Appointment lookup
- Collection staff-assisted path
- Enquiry
- Submission pipeline

6. Build Phase 3 team view
- Queue
- Detail
- Mutations
- Conflict handling

7. Run a live rehearsal, then cut over
- Real API smoke in-shop
- Rollback drill
- Full switch

## 5. Final Assessment

Ready after minor edits.

This is the first revision that is structurally credible. The remaining issues are important, but they are mostly contract-cleanup issues, not missing-architecture issues. Fix the schema/status/group/document mismatches before coding starts, and the plan is executable.
