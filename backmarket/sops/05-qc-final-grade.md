# SOP 05: QC & Final Grade Assignment

**Version:** 1.0 (placeholder)
**Date:** 2026-04-17
**Scope:** Step between SOP 04 (repair & refurb) and SOP 06 (listing). Final grade is assigned to a BM device before it can be listed.
**Automation:** Manual process. Documented here so the SOP set is structurally complete; automation is out of scope for the current rebuild.

---

## Trigger

Device has completed repair/refurb (`status4` = "Ready To Collect" per Monday automation [411590646]) and moved to "BMs Awaiting Sale" group, status24 = "To List".

Before `list-device.js` can proceed, the **Final Grade** column (`status_2_Mjj4GJNQ` on Main Board) must be populated.

---

## Grading Inputs

The final grade is assigned manually by the technician performing QC, based on:

| Input | Column | Source |
|-------|--------|--------|
| Top Case pre-grade | `status_2_mkmcj0tz` | Set by repair tech during SOP 04 |
| Lid pre-grade | `status_2_mkmc4tew` | Set by repair tech during SOP 04 |
| LCD pre-grade | `color_mkp5ykhf` | Set during diagnostic (SOP 03) |
| Battery health | `lookup_mkqgb1te` | Mirror from diagnostic |
| Casing / cosmetic condition | Visual inspection at QC | QC tech |
| Functional test results | Post-repair verification | QC tech |

---

## Grade Mapping

| Final Grade | BM Grade | Notes |
|-------------|----------|-------|
| Fair | FAIR | Visible cosmetic wear, fully functional |
| Good | GOOD | Minor cosmetic wear, fully functional |
| Excellent | VERY_GOOD | Near-perfect cosmetic condition |

The assigned grade is the **worst-of** the pre-grades (i.e. if Top Case is Good but Lid is Fair, final grade ≤ Fair), subject to the QC tech's override where justified by post-refurb improvements.

---

## Process

1. QC tech inspects the device post-refurb
2. Reviews pre-grades captured during repair
3. Runs functional tests (boot, display, keyboard, trackpad, ports, battery cycle test)
4. If any test fails → return to repair queue (SOP 04)
5. If all pass → assign Final Grade column on Main Board
6. Device is now eligible for listing (SOP 06)

---

## Integration points

- **SOP 04 (Repair):** writes pre-grade columns; these feed the final grade decision.
- **SOP 03 (Diagnostic):** `bm-grade-check` service (port 8011) fires a profitability alert based on predicted final grade. SOP 05 is where the predicted grade becomes the actual grade.
- **SOP 06 (Listing):** hard-gates on Final Grade being set. If empty, listing is blocked (see SOP 06 Step 1).

---

## Known gaps

- No automation in the current rebuild.
- The predicted grade from `bm-grade-check` (SOP 03) is informational only — it does not auto-populate Final Grade.
- If QC disagrees with the prediction, QC wins. No audit trail comparing predicted vs actual grade today; this would be a future enhancement.

---

## When this SOP becomes the bottleneck

If QC is slow and "To List" devices pile up with no Final Grade, the listing flow halts. `stuck-inventory-audit.js` (Phase 1 of the rebuild) flags devices aged > 14 days in "BMs Awaiting Sale" group; if Final Grade is empty on many, that's a signal to escalate QC capacity.
