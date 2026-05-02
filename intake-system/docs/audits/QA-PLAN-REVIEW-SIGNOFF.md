# Intake System Plan QA Review — Signoff Pass

Reviewed against:
- `plan.md`
- `SPEC.md`
- `FORM-FLOW.md`
- `QA-PLAN-REVIEW.md`
- `QA-PLAN-REVIEW-ROUND2.md`
- `QA-PLAN-REVIEW-ROUND3.md`

Repo verification:
- `npm run build` in `react-form/`: passed
- `npm run lint` in `react-form/`: passed

## 1. Findings

### 1. Collection is still described two different ways in `plan.md`
- Severity: low
- What is still wrong: The main flow definition says Flow C is staff-assisted with no backend lookup in v1, but the verified references table still labels `Awaiting Collection` and `Quality Control` as “used by Flow C lookup”.
- Why this would cause execution pain: This is unlikely to stall implementation, but it is still enough to confuse whoever wires Flow C or writes tests from the references section instead of the main flow.
- Evidence from repo/plan: `plan.md:106-118`, `plan.md:894-895`
- What should change before implementation starts: Update the verified references table to say those groups are relevant to future/manual Flow C matching, not active v1 backend lookup.

### 2. One stale sentence remains in the persistence section
- Severity: low
- What is still wrong: The persistence section still says `intake_responses` and `intake_checks` are derived/structured views, but `intake_responses` has been dropped later in the same section.
- Why this would cause execution pain: Very low. It is just unnecessary ambiguity in the most important data-model section.
- Evidence from repo/plan: `plan.md:159`, `plan.md:224`
- What should change before implementation starts: Change that sentence to refer only to `intake_checks`, or explicitly say `intake_responses` was removed.

## 2. What Earlier QA Likely Missed

- The plan is now functionally buildable; the remaining issues are documentation polish, not architecture gaps.
- At this point the main risk is someone implementing from a stale note in a reference table rather than from the main contract sections.

## 3. Required Plan Changes

- Fix the Flow C wording in the verified references table.
- Clean up the stale `intake_responses` sentence in the persistence section.

## 4. Recommended Final Execution Order

1. Make the two doc cleanups above.
2. Start Phase 0 as planned.
3. Continue with the existing execution order in `plan.md`.

## 5. Final Assessment

Ready to execute.

The remaining issues are low-severity doc cleanup only. They should be fixed, but they are not material blockers to starting the build.
