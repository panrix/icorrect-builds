# Monday Main Board v2 — Build Status

**Date:** 26 Feb 2026
**Author:** Code (Claude Code build agent)
**Board:** iCorrect Main Board v2
**Board ID:** 18401688389
**URL:** https://icorrect.monday.com/boards/18401688389
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

### Phase 2: Build New Board — PARTIALLY COMPLETE

Board created from scratch via API. Script: `build-new-board.py`. Manifest: `board-v2-manifest.json`.

**What was built:**
- Board created in workspace 977316 (same workspace as current Main board)
- 94 columns created via API (text, status, date, people, time_tracking, board_relation, etc.)
- 20 groups created per target-state.md Section 3
- 6 board relations connected to: Devices (3923707691), Parts (985177480), Products & Pricing (2477699024), Client Info Capture (9490904355)
- All 6 core status columns with values set: Repair Status (14), QC Status (3), Comms Status (8), Trade-in Status (12), Pause Reason (6), Shipping Status (9)
- All renames applied: Address, Device Passcode, Priority (0-10)

**What's wrong — needs rebuild:**
- Column IDs are auto-generated random strings (e.g. `color_mm0yw9b8`)
- Monday API supports custom IDs via the `id` parameter in `create_column`
- Should rebuild with clean IDs like `repair_status`, `qc_status`, `technician`
- Clean IDs are critical for API integrations, automation scripts, and agent data pulls

**Action needed:** Delete board 18401688389 and rebuild with custom column IDs. Update `build-new-board.py` to pass `id` parameter.

---

## What Needs Doing

### Immediate — Rebuild with clean column IDs

1. Update `build-new-board.py` to pass custom `id` parameter for every column
2. Delete current v2 board (18401688389)
3. Run updated script to create new board with clean IDs
4. Update `board-v2-manifest.json` with new board ID and column IDs

### Phase 2 remaining — Manual setup in Monday UI

These cannot be done via API:

**15 mirror columns** (click board relation → select columns to mirror):
- Parts Cost (via Parts Used → Parts board)
- Stock Level (via Parts Required → Parts board)
- Intake Condition (via Client Info Capture link)
- Fault to Repair (Details) (via Client Info Capture link)
- Further Faults (via Client Info Capture link)
- Client Notes (via Client Info Capture link)
- Previous Repairs (via Client Info Capture link)
- Notes for Repairer (via Client Info Capture link)
- Collection Notes (via Client Info Capture link)
- Data (via Client Info Capture link)
- Been to Apple? (via Client Info Capture link)
- New or Refurb? (via Client Info Capture link)
- Battery (via Client Info Capture link)
- Requested Repairs Price (via Requested Repairs → Products & Pricing board)
- Custom Repairs Price (via Custom Products → Products & Pricing board)

**7 formula columns:**
- Quote = Requested Repairs Price + Custom Repairs Price - Discount
- On Time? = IF(Date Repaired <= Deadline, 'Yes', 'No')
- Total Labour = Diagnostic Time + Repair Time + Refurb Time + Cleaning Time
- Revenue ex Vat = Invoice Amount / 1.2
- Gross Profit = Revenue ex Vat - Parts Cost
- Parts Cost (formula) = SUM of Parts Cost mirror
- BM Deadline = Date Purchased (BM) + SLA offset

**1 button column:**
- Make Sale Item — needs webhook URL from current board's automation

**Subitems:**
- Enable via Monday UI board settings

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
| iCorrect Main Board v2 | 18401688389 | New board (needs rebuild with clean IDs) |
| Devices | 3923707691 | Device catalogue |
| Parts/Stock Levels | 985177480 | Parts inventory |
| Products & Pricing | 2477699024 | Repair service pricing |
| Client Information Capture | 9490904355 | Intake form data |
| Enquiries | 7494394307 | Sales enquiries |

## Key Files

| File | Purpose |
|------|---------|
| `main-board-column-audit.md` | Full 170-column audit with verdicts, activity data, decisions |
| `target-state.md` | Board design: 6 status columns, groups, workflows, migration plan |
| `board-v2-manifest.json` | Build output: board ID, column IDs, group IDs |
| `build-new-board.py` | Build script — needs update for custom column IDs |
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
