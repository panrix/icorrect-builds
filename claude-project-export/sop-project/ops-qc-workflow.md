# QC Workflow

Status: needs-operator-confirmation
Last verified: 2026-03-31
Verification method: inherited SOP notes + operator/process confirmation
Evidence sources:
- /home/ricky/builds/documentation/raw-imports/sops-operational-procedures.md
- /home/ricky/builds/monday/main-board-column-audit.md
- /home/ricky/builds/monday/board-schema.md
- /home/ricky/builds/monday/repair-flow-traces.md
**Coverage note:** THIN -- needs formal documentation from team walkthrough

This document should not be treated as fully verified current process until the workshop QC flow is confirmed directly.

---

## Overview

Quality Control is the final gate before any device leaves iCorrect. Every repaired device passes through QC before being returned to customer or listed on Back Market.

**QC Lead:** Roni Mykhailiuk (MVP -- first to arrive, last to leave, 6 days/week)

---

## Scope

- Final inspection of completed repairs
- Grade verification for Back Market devices
- Functional testing (device works as expected after repair)
- Cosmetic assessment (no new damage introduced during repair)
- Failure routing (back to tech with specific notes)

---

## Process

1. Technician completes repair -> changes status to QC stage on Monday
2. Device moves to Quality Control group (Monday board)
3. QC tech (Roni) reviews:
   - Visual inspection of the repair work
   - Functional testing -- verify specific fault has been resolved
   - Check for new issues introduced during repair
   - For BM devices: verify grade accuracy against grading criteria
4. **If QC passes:** Status moves forward (Ready To Collect / Ready To Ship / To List for BM)
5. **If QC fails:** Back to technician with notes on what needs fixing

---

## Active Procedures

| Procedure | Detail |
|-----------|--------|
| QC fail = no rebuttal | When QC fails a device, photo documentation is required. No arguing -- fix it. |
| Bottom screws off for QC | Bottom case must be removed so QC can inspect internals |
| Fabric shields removed on liquid damage | All fabric shields must be removed for liquid damage inspection |
| QC fail count tracked | Number of QC failures per technician is monitored |

---

## QC Performance Data

From team performance tracking:
- Roni: 168 QC items per period, 8.3% fail rate
- Safan: 11.8% QC rework rate
- Andreas: 2.2% QC rework rate (best quality on the team)

---

## Monday Board Integration

- QC is tracked through the main Status column (`status4`) on Main Board (349212843)
- "QC Failure" exists as a status value but "QC Pass" does not -- items that pass simply move to the next status
- **No dedicated QC Status column exists** -- this is a known gap
- QC By: `multiple_person_mkyp2bka` column
- QC Time: `date_mkypt8db` column
- Final Grade: `status_2_Mjj4GJNQ` column (for BM devices)

---

## Known Gaps

- **No dedicated QC Status column** in Monday -- pass/fail tracked through main Status only
- **QC workflow SOP is thin** -- needs formal documentation from team walkthrough
- **No structured QC checklist** -- Roni relies on experience, not a documented checklist
- **Roni is overloaded** -- handles QC + Parts + T-con R&D across three roles
- **No QC metrics dashboard** -- fail rates tracked informally, not systematically
- **BM grade verification process needs formalising** -- criteria exist but checklist doesn't

---

## Reference Documents

- Grading criteria is not yet canonicalized in KB
- Full SOP source: `/home/ricky/builds/documentation/raw-imports/sops-operational-procedures.md`
- Intake system specs: `/home/ricky/builds/intake-system/SPEC.md`
