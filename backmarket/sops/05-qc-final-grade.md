# SOP 05: QC & Final Grade Assignment

**Version:** 1.1
**Date:** 2026-05-05
**Scope:** Step between SOP 04 (repair & refurb) and SOP 06 (listing). Final grade is assigned to a BM device before it can be listed.
**Automation:** Hybrid. QC grading remains manual, but `bm-qc-listing.service` now owns the automated handoff after Monday status changes.

---

## Trigger

Device has completed repair/refurb. Two Monday changes are important:

- `status4` = "Ready To Collect" triggers `bm-qc-listing.service` to generate/write the canonical BM SKU to BM Devices `text89` using `scripts/qc-generate-sku.js`.
- `status24` = "To List" triggers `bm-qc-listing.service` to run SOP 06 in dry-run/card JSON mode and post a Telegram approval card to the Listings topic.

Before `list-device.js` can proceed, the **Final Grade** column (`status_2_Mjj4GJNQ` on Main Board) must be populated and the canonical BM SKU must be generated into BM Devices `text89` as part of QC handoff.

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
6. Confirm required BM Devices specs are complete: model/A-number, RAM, SSD, CPU, GPU
7. Confirm Main Board colour is complete
8. If running manually, run the QC SKU handoff helper in dry-run mode:
   ```bash
   node scripts/qc-generate-sku.js --item <mainBoardItemId> --json
   ```
9. If the dry-run classification is `QC_SKU_MISSING` or `QC_SKU_MISMATCH` and all required fields pass, write only BM Devices `text89`:
   ```bash
   node scripts/qc-generate-sku.js --item <mainBoardItemId> --write --json
   ```
10. Set `status24` to "To List" only when the device is ready for listing review. This posts the dry-run listing approval card to Telegram.
11. Device is eligible for listing (SOP 06) only once stored BM Devices `text89` matches the expected SKU.
12. For return/refund relists (`RTN > REFUND`, returned, refund markers), verify the Main workflow is linked to the **original** BM Devices item and that sale/listing reset steps from SOP 12 were completed before treating QC handoff as complete.

---

## Integration points

- **SOP 04 (Repair):** writes pre-grade columns; these feed the final grade decision.
- **SOP 03 (Diagnostic):** `bm-grade-check` service (port 8011) fires a profitability alert based on predicted final grade. SOP 05 is where the predicted grade becomes the actual grade.
- **SOP 06 (Listing):** hard-gates on Final Grade being set and validates BM Devices `text89` against the expected SKU. If final grade is empty, stored SKU is missing, or stored SKU mismatches expected SKU, listing is blocked (see SOP 06 Steps 1 and 3).
- **bm-qc-listing service:** live on `127.0.0.1:8015`, nginx route `/webhook/bm/qc-listing`, systemd unit `bm-qc-listing.service`.

---

## Known gaps

- Final grade selection is still manual; automation does not decide the grade.
- The predicted grade from `bm-grade-check` (SOP 03) is informational only — it does not auto-populate Final Grade.
- If QC disagrees with the prediction, QC wins. No audit trail comparing predicted vs actual grade today; this would be a future enhancement.
- The listing approval card flow should remain one-card-per-device and should ignore stale Telegram callbacks.

---

## When this SOP becomes the bottleneck

If QC is slow and "To List" devices pile up with no Final Grade, the listing flow halts. `stuck-inventory-audit.js` (Phase 1 of the rebuild) flags devices aged > 14 days in "BMs Awaiting Sale" group; if Final Grade is empty on many, that's a signal to escalate QC capacity.
