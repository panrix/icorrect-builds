# Codex Brief: Schematic Processing — QA + Remaining Boards

**Project:** /home/ricky/builds/elek-board-viewer
**Date:** 2026-04-11
**Owner:** Ricky via Jarvis

---

## Context

We're extracting structured diagnostic data from Apple MacBook schematic PNGs to build a diagnostic decision system for board-level repair. Two pilot boards (A2681 MBA M2, A2442 MBP 14" M1 Pro/Max) were fully processed and verified by hand against schematics. Then the remaining boards were batch-processed using those pilots as templates.

## Current State

### Completed (all 3 phases — maps + diagnostics):
| Board | Directory | Status |
|-------|-----------|--------|
| A2681 (MBA M2) | maps/A2681, diagnostics/A2681 | **PILOT — verified** |
| A2442 (MBP 14" M1 Pro/Max BTR) | maps/A2442, diagnostics/A2442 | **PILOT — verified** |
| A2442 CTO | maps/A2442_CTO, diagnostics/A2442_CTO | Batch — needs QA |
| A2337 (MBA M1) | maps/A2337, diagnostics/A2337 | Batch — needs QA |
| A2338 (MBP 13" M1) | maps/A2338, diagnostics/A2338 | Batch — needs QA |
| A2338 M2 | maps/A2338_M2, diagnostics/A2338_M2 | Batch — needs QA |
| A2485 (MBP 16" M1 Pro/Max EVTs) | maps/A2485, diagnostics/A2485 | Batch — needs QA |
| A2485 EVTc | maps/A2485_EVTc, diagnostics/A2485_EVTc | Batch — needs QA |
| A2779 (MBP 14" M2 Pro/Max C) | maps/A2779, diagnostics/A2779 | Batch — needs QA |
| A2779 S (MBP 14" M2 Pro) | maps/A2779_S, diagnostics/A2779_S | Batch — needs QA |
| A2918 (MacBook Pro 14" M3, 820-02757) | maps/A2918, diagnostics/A2918 | Batch — needs QA. Use A2681 base template. |
| A3113 (MacBook Air M3, 820-03286) | maps/A3113, diagnostics/A3113 | **Needs REDO** — was processed with Pro/Max template, output is wrong. Delete and reprocess using A2681 base template. |

### Not yet processed:
| Board | Directory | Notes |
|-------|-----------|-------|
| A3114 (MacBook Air M3, 820-03285) | maps/A3114 exists but empty | Use A2681 base template |
| A2780 (MBP 16" M2 Pro/Max, 820-02652) | No directory | Use A2442 Pro/Max template. Note: has 2 PDFs (C + S variants, 322 pages total) |

### Not processing (Intel — on request only):
- A2179, A2251, A2289

---

## Task 1: QA Batch Outputs

For each batch-processed board (10 boards listed above as "needs QA"):

1. **Read the schematic PNGs** at `/home/ricky/data/schematics/{board_directory}/pages/`
2. **Cross-reference** every entry in `maps/{board}/rails.json` against the actual schematic pages
3. **Verify:**
   - Rail names match exactly as printed on schematics
   - Voltages are correct
   - IC designators (U-numbers) are correct
   - Page references point to the right pages
   - Power sequence order is physically accurate
   - Diagnostic tree test points exist on the actual board
4. **Fix** any errors in place — do not create separate QA files
5. **Flag** anything ambiguous or unreadable in the schematic PNGs

### QA template (use verified pilots as ground truth):
- Base boards (M1/M2/M3 base — A2337, A2338, A2338_M2, A2918, A3113, A3114): compare structure against A2681
- Pro/Max boards (A2442_CTO, A2485, A2485_EVTc, A2779, A2779_S, A2780): compare structure against A2442

### A2918 metadata fix:
A2918 is MacBook Pro 14" M3 (NOT M2 Air). Correct metadata.json accordingly.

---

## Task 2: Process Remaining Boards

### A3113 (MacBook Air M3, 820-03286) — REDO
- Schematics: `/home/ricky/data/schematics/A3113 820-03286/pages/`
- Template: A2681 (base board structure) — NOT Pro/Max
- Delete existing maps/A3113 and diagnostics/A3113 outputs (wrong template was used)
- Create all Phase 1-3 outputs fresh using A2681 base template
- QA against schematic PNGs before finalising

### A3114 (MacBook Air M3, 820-03285)
- Schematics: `/home/ricky/data/schematics/A3114 820-03285/pages/`
- Template: A2681 (base board structure) — NOT Pro/Max
- Create all Phase 1-3 outputs in maps/A3114 and diagnostics/A3114
- QA against schematic PNGs before finalising

### A2780 (MBP 16" M2 Pro/Max, 820-02652)
- Schematics: `/home/ricky/data/schematics/A2780 820-02652/pages/`
- Template: A2442 (Pro/Max structure)
- Note: 322 pages across 2 PDF variants (C + S). Process both.
- Create all Phase 1-3 outputs in maps/A2780 and diagnostics/A2780
- QA against schematic PNGs before finalising

---

## Task 3: Cross-Board Master Files

After all boards are QA'd and remaining boards processed:

1. **Rebuild** `maps/master-rail-index.json` — all rails across all boards, normalised
2. **Rebuild** `maps/master-ic-index.json` — all ICs across all boards
3. **Create** `maps/power-path-comparison.md` — differences between architectures
4. **Create** `maps/common-power-faults.md` — known fault patterns mapped to measurement points
5. **Update** `maps/changelog.md` with all work done

---

## Output Format

All JSON files must follow the exact structure of the verified pilot outputs. Do not change the schema.

**Before writing any files, read the verified pilot outputs to understand the exact structure:**

Read these files first — they are your ground truth:
- `maps/A2681/rails.json` — rail extraction format (name, voltage, state, source, description, page)
- `maps/A2681/ics.json` — IC extraction format (designator, function, description, pages)
- `maps/A2681/connectors.json` — connector pinout format
- `maps/A2681/signals.json` — signal extraction format
- `maps/A2681/power-path.json` — power path chain format
- `maps/A2681/power-sequence.json` — boot sequence format
- `maps/A2681/power-domains.json` — power domain groupings
- `maps/A2681/metadata.json` — board metadata format
- `diagnostics/A2681/dcps_20v_triage.json` — 20V DCPS diagnostic tree format (scenarios with step-by-step measurement instructions, component refs, expected values)
- `diagnostics/A2681/dcps_5v_triage.json` — 5V DCPS diagnostic tree format
- `diagnostics/A2681/common_faults.json` — common fault signatures

For Pro/Max boards, also read:
- `maps/A2442/` — Pro/Max has dual PMU topology, VR modules (Viper/Monaco), different power domains
- `diagnostics/A2442/` — Pro/Max diagnostic trees reference different component locations

**Critical:** Every JSON file includes board-specific component designators (U-numbers, C-numbers, test points). These are NOT interchangeable between boards. Each board's files must reference that board's actual schematic.

---

## Verification

- Do NOT claim completion without actually reading schematic PNGs
- Every rail, IC, and test point must be verified against the source schematic
- If a component designator is unreadable in the PNG, note it explicitly rather than guessing
- Cross-reference Saf's diagnostic data where available: `/home/ricky/builds/elek-board-viewer/data/safan_diagnostics_enriched.json`

---

## Completion Report

When done, produce a single summary:
- Board count processed
- Rail count and IC count per board
- Any anomalies or boards with incomplete/ambiguous data
- Any corrections made to batch outputs during QA
- Commit all changes to the repo
