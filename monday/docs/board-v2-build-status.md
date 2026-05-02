# Monday Main Board v2 — Build Status

**Date:** 27 Feb 2026 (updated)
**Author:** Code (Claude Code build agent)
**Board:** iCorrect Main Board v2
**Board ID:** 18401861682
**URL:** https://icorrect.monday.com/boards/18401861682
**Current Main Board:** https://icorrect.monday.com/boards/349212843 (UNTOUCHED)

---

## What Has Been Done

### Phase 1: Column Audit — COMPLETE

Full audit of all 170 columns on the current Main board. Output: `main-board-column-audit.md`.

**Key deliverables:**
- Every column assessed with verdict (KEEP/DROP/MERGE/REMAP/NEW)
- All 11 decision points resolved with Ricky
- All column IDs confirmed via Monday API
- 14-day activity log analysis (11,018 events, Feb 11-25) to validate which KEEP columns are actually used
- 17 columns downgraded from KEEP to DROP based on zero activity + Ricky approval

**Final column counts for new board:**
- 96 KEEP + 3 KEEP(rename) + 3 REMAP + 4 NEW = ~106 total
- ~15 are mirrors (auto-created), ~7 are formulas (computed)
- Real user-facing columns: ~85

### Phase 2: Build New Board — API BUILD COMPLETE

Board created from scratch via API with **clean custom column IDs**. Script: `build-new-board.py`. Manifest: `board-v2-manifest.json`.

**Build history:**
- First build (26 Feb): Board 18401688389 — had auto-generated random column IDs (e.g. `color_mm0yw9b8`). Deleted.
- **Second build (27 Feb): Board 18401861682** — rebuilt with custom IDs (e.g. `repair_status`, `qc_status`, `technician`). This is the current board.

**What was built (94 columns, 20 groups):**
- Board created in workspace 977316 (same workspace as current Main board)
- 94 columns created via API with clean custom IDs
- 20 groups created per target-state.md Section 3
- 5 board relations connected to: Devices (3923707691), Parts (985177480), Products & Pricing (2477699024). Client Info Capture relation removed 16 Mar (board archived).
- All 6 core status columns with values set: Repair Status (14), QC Status (3), Comms Status (8), Trade-in Status (12), Pause Reason (6), Shipping Status (9)
- All renames applied: Address, Device Passcode, Priority (0-10)
- All column IDs are clean, human-readable: `repair_status`, `technician`, `deadline`, `invoice_amount`, etc.

**Phase 2 remaining — Manual setup in Monday UI (Cowork):**
Checklist generated: `cowork-manual-setup-checklist.md`. Give this file to Cowork along with the board URL.

Items for Cowork:
- 4 mirror columns (Parts Cost, Stock Level, Requested Repairs Price, Custom Repairs Price)
- 7 formula columns
- ~~1 button column (Make Sale Item)~~ — REMOVED, Sales board is legacy
- ~~11 Client Info Capture mirrors~~ — REMOVED 16 Mar, board archived by Ricky
- Enable subitems

---

## What Needs Doing

### Phase 3: Build Automations

- Rebuild automations from scratch using `automations.md` (147 active) as reference
- Deduplicate redundant automations (e.g. 5 separate QC Failure rules)
- Map old status values → new column structure
- 8 automations from DROP columns should NOT be rebuilt (already identified)
- New automations needed: Repair Paused → require Pause Reason, Repaired → QC Testing, QC Pass → Complete, QC Fail → Under Repair, 30-day auto-archive

### Phase 4: Test Data & Validation

- Load 10-20 fake items covering every flow type
- Walk each flow end-to-end
- Verify automations fire correctly
- Ricky + Ferrari review before migration

### Phase 5: Migrate Active Items

- Script to move ~100-150 active items from old → new board
- Map old status values → new columns (status4 → Repair Status + Comms Status + QC Status + Shipping Status)
- Map old Repair Type BM values → Trade-in Status
- Preserve board relations, dates, people, notes, financial data
- Test with 5 items first

### Phase 6: Cutover

- Team switches to new board (Monday morning, announced in advance)
- Old board renamed to "iCorrect Main Board (ARCHIVE)"
- 1-week monitoring period

### Phase 7: Views & Training

- Role-based views (Ferrari, Techs, QC, BM, Management)
- Ferrari's dashboard view
- Training videos per role
- 30-day auto-archive automation

---

## Connected Board IDs (for reference)

| Board | ID | Purpose |
|-------|-----|---------|
| iCorrect Main Board (current) | 349212843 | Current production board — DO NOT TOUCH |
| **iCorrect Main Board v2** | **18401861682** | **New board — clean custom IDs** |
| Devices | 3923707691 | Device catalogue |
| Parts/Stock Levels | 985177480 | Parts inventory |
| Products & Pricing | 2477699024 | Repair service pricing |
| ~~Client Information Capture~~ | ~~9490904355~~ | ~~Intake form data~~ — ARCHIVED 16 Mar (legacy, items never used) |
| ~~Enquiries~~ | ~~7494394307~~ | ~~Sales enquiries~~ — DEAD since Jan 2026 |

## Key Files

| File | Purpose |
|------|---------|
| `main-board-column-audit.md` | Full 170-column audit with verdicts, activity data, decisions |
| `target-state.md` | Board design: 6 status columns, groups, workflows, migration plan |
| `board-v2-manifest.json` | Build output: board ID, all 94 column IDs, 20 group IDs |
| `build-new-board.py` | Build script — uses custom `id` parameter for clean column IDs |
| `cowork-manual-setup-checklist.md` | Step-by-step checklist for Cowork (mirrors, formulas, button, subitems) |
| `automations.md` | 147 active automations documented (reference for Phase 3) |
| `board-schema.md` | Original board schema (170 columns, 33 groups, 39 statuses) |
| `repair-flow-traces.md` | 80 items traced across 8 flow types |

---

## Automation Deactivation (on OLD board — pending)

8 automations reference DROP columns and are still firing. Should be deactivated on the old board to stop wasted cycles:

| Automation ID | What It Does | Why Deactivate |
|---------------|-------------|----------------|
| [277388549] | Notify Gabriel Barr on status change | Gabriel gone. Column dropped. |
| [255422860] | Notify Gabriel Barr on status change | Gabriel gone. Column dropped. |
| [259333840] | Tech Repair Status → Complete | Dev column. 766 hits burning cycles. |
| [259328813] | Tech Repair Status → Active | Dev column. |
| [259328523] | Tech Repair Status → Active | Dev column. |
| [259334255] | Tech Repair Status → Complete | Dev column. |
| [275236281] | Item created → Unified Groups = Complete | Migration artifact. 156 hits. |
| [511131197] | Refurb Time start (duplicate of [511131239]) | Duplicate. |

---

*This document is the handoff reference for the next session. Start here.*
