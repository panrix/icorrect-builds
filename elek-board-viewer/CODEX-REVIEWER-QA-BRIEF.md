# QA Review: Schematic Extraction Project

**Project:** /home/ricky/builds/elek-board-viewer
**Date:** 2026-04-11
**Reviewer:** codex-reviewer

---

## What to review

A batch of Apple MacBook schematic data was extracted from PNG schematics into structured JSON. 14 boards total, 2 verified pilots (A2681, A2442), 10 batch-processed, 2 newly created (A3114, A2780). A repass just ran fixing issues and rebuilding master indexes.

## Your job

1. Read the verified pilot outputs first to understand the expected schema:
   - `maps/A2681/` (Air/base template)
   - `maps/A2442/` (Pro/Max template)
   - `diagnostics/A2681/` and `diagnostics/A2442/`

2. For EVERY non-pilot board, verify:
   - JSON schema matches the correct pilot (Air boards use A2681 schema, Pro/Max boards use A2442 schema)
   - All JSON files parse cleanly
   - metadata.json has correct board identity (model, chip, form factor, schematic number)
   - Rails have plausible voltages (no 0V rails that should have voltage, no obviously wrong values)
   - IC designators follow Apple conventions (U/C/R/L prefix + numbers)
   - Page references are within the board's total page count
   - Power sequence makes physical sense (input power -> charging -> system rails -> CPU/GPU)
   - Diagnostic trees reference components that exist in that board's maps files
   - No cross-board contamination (e.g. A2681 component designators appearing in A3113 files)

3. Spot-check at least 3 boards against their actual schematic PNGs:
   - Pick one Air board and two Pro/Max boards
   - Read 5-10 schematic pages per board from `/home/ricky/builds/elek-board-viewer/schematics/{board_dir}/pages/`
   - Verify that rail names, voltages, and IC designators in the JSON actually match what's on the schematics

4. Review the master index files:
   - `maps/master-rail-index.json` — check completeness (should cover all 14 boards)
   - `maps/master-ic-index.json` — check completeness
   - `maps/power-path-comparison.md` — verify Air vs Pro/Max differences are accurately described
   - `maps/common-power-faults.md` — verify fault patterns reference real components

5. Check the repass fixes:
   - A3113: confirm orphaned PP3V3_S2SM_CIO rail was removed
   - A2779_S: confirm malformed JSON entries were fixed
   - A2485_EVTc: confirm diagnostic files exist and match schema

## Air/base boards (use A2681 as reference):
A2337, A2338, A2338_M2, A2918, A3113, A3114

## Pro/Max boards (use A2442 as reference):
A2442_CTO, A2485, A2485_EVTc, A2779, A2779_S, A2780

## Output

Produce a QA report:
- PASS/FAIL per board with specific issues found
- Schema compliance summary
- Spot-check findings (what you verified against PNGs, any discrepancies)
- Master index completeness check
- Repass fix verification
- Overall verdict: PASS, PASS WITH NOTES, or FAIL

Be strict. If data looks templated without board-specific verification, call it out.
