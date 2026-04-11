# Intake System Plan QA Review — Final Pass

Reviewed against:
- `plan.md`
- `QA-PLAN-REVIEW.md`
- `QA-PLAN-REVIEW-ROUND2.md`
- `QA-PLAN-REVIEW-ROUND3.md`
- `SPEC.md`
- `FORM-FLOW.md`
- `react-form/src/App.tsx`
- `react-form/src/types.ts`
- `react-form/package.json`

Repo verification:
- `npm run build` in `react-form/`: passed
- `npm run lint` in `react-form/`: passed

## 1. Findings

### 1. `bookingData` is still typed inconsistently across the plan and flow spec
- Severity: medium
- What is still wrong: `plan.md` says `bookingData` is `CustomerLookupResponse | null`, but that is the full lookup response containing `found`, `mondayItems[]`, and lookup metadata. `FORM-FLOW.md` now types `bookingData` as a selected booking object, which is closer to how the UI would actually use it, but its fields still do not match the `MondayItem` contract from `plan.md` (`mondayItemId` vs `id`).
- Why this would cause execution pain: This will create unnecessary churn when the appointment confirmation UI is built. The form state should hold either the selected `MondayItem` or the whole `CustomerLookupResponse`, not both concepts mixed together.
- Evidence from repo/plan: `plan.md:284-293`, `plan.md:331-342`, `plan.md:590-593`, `FORM-FLOW.md:342-353`
- What should change before implementation starts: Pick one model and use it everywhere. The sensible choice is `selectedBooking: MondayItem | null` in form state, with `CustomerLookupResponse` only used as the API response type.

### 2. The `pending` status still exists without a defined operational use
- Severity: medium
- What is still wrong: The persistence enum and transition rules include `pending`, but the documented queue flow and UI labeling only describe `submitted` → `in_progress` → terminal states. Nothing in the execution plan says when a session enters `pending` or why that state exists.
- Why this would cause execution pain: Dead states create accidental complexity. Someone will either ignore `pending`, misuse it, or build tests around a state that never appears.
- Evidence from repo/plan: `plan.md:161-170`, `plan.md:388-390`, `plan.md:712-716`
- What should change before implementation starts: Either remove `pending` from the enum and transitions, or define exactly when it is set and how it differs from `submitted`.

### 3. Enquiry group usage is still contradictory
- Severity: medium
- What is still wrong: The endpoint comments say enquiry items are created in `New Orders`, but the verified references table still says `new_group77101__1` is “Not used in v1”.
- Why this would cause execution pain: This is small, but it is the kind of contradiction that turns into wrong group routing or a bogus test expectation.
- Evidence from repo/plan: `plan.md:437`, `plan.md:899`
- What should change before implementation starts: Update the verified references table to reflect actual v1 usage, or explicitly state that enquiry does not create Monday items in v1 if that is the intended behavior.

## 2. What the earlier QA likely missed

- The big architecture issues are resolved. The remaining risk is now contract hygiene, not plan shape.
- The last inconsistencies are subtle type/state mismatches that are easy to miss because the document now looks “finished”.

## 3. Required plan changes

- Reconcile `bookingData` to a single selected-booking type across `plan.md` and `FORM-FLOW.md`.
- Either define or remove `pending`.
- Fix the enquiry/New Orders contradiction in the verified references or endpoint comments.

## 4. Recommended final execution order

1. Do one last contract cleanup pass
- booking data type
- status enum
- enquiry group usage

2. Start Phase 0
- backend scaffold
- shared types
- schema
- minimal real tests

3. Proceed with the planned build order
- Phase 1 walk-in
- pre-Phase-2 checkpoint
- Phase 2 remaining flows + backend
- Phase 3 team view
- rehearsal and cutover

## 5. Final Assessment

Ready after minor edits.

This is good enough to execute once the remaining type/state/document mismatches are cleaned up. The plan no longer has major structural blockers.
