# Codex Brief: Schematic Repass — QA Fixes, Remaining Boards, Master Index

**Project:** /home/ricky/builds/elek-board-viewer
**Date:** 2026-04-11
**Owner:** Ricky via Jarvis
**Follows:** CODEX-SCHEMATIC-BATCH-BRIEF.md (first pass completed 2026-04-10)

---

## What Happened Last Pass

- Board identity verified from PDFs for A3113, A3114, A2918, A2780
- A3113 metadata corrected (Air M3, not Pro); existing output closer to correct than expected but was processed with Pro/Max template — needs audit-and-rewrite against A2681 Air template
- Several metadata issues flagged (mislabeled page indexes on newer boards)
- Extraction tooling working; scripted verification and patching set up but stopped at audit stage

## Scope of This Repass

Three blocks of work, in order:

### Block 1: A3113 Audit-and-Rewrite

A3113 (MacBook Air 13" M3, 820-03286) was processed with the wrong template. The output structure exists but needs correction.

1. Read the verified A2681 pilot outputs as ground truth for Air-style board structure:
   - `maps/A2681/rails.json`, `ics.json`, `connectors.json`, `signals.json`, `power-path.json`, `power-sequence.json`, `power-domains.json`, `metadata.json`
   - `diagnostics/A2681/dcps_20v_triage.json`, `dcps_5v_triage.json`, `common_faults.json`
2. Read A3113 schematic PNGs at `/home/ricky/builds/elek-board-viewer/schematics/A3113 820-03286/pages/`
3. Audit every entry in `maps/A3113/` against actual schematic PNGs:
   - Rail names, voltages, IC designators, page references must match the schematics exactly
   - Power sequence must follow Air topology (single PMU), not Pro/Max (dual PMU)
   - Remove any Pro/Max artifacts (VR modules, dual-die references, etc.)
4. Fix all errors in place. Do not create separate QA files.
5. Rebuild `diagnostics/A3113/` to match A2681 diagnostic tree structure with A3113-specific components
6. Update `maps/A3113/metadata.json` — keep the corrected identity info already there

### Block 2: Process Remaining Boards

#### A3114 (MacBook Air 13" M3, 820-03285)
- Schematics: `/home/ricky/builds/elek-board-viewer/schematics/A3114 820-03285/pages/`
- Template: A2681 (Air/base board structure)
- Board identity: X2819/MLB, 051-09344
- Create all outputs in `maps/A3114/` and `diagnostics/A3114/` matching A2681 schema exactly
- QA every entry against schematic PNGs before writing

#### A2780 (MacBook Pro 16" M2 Pro/Max, 820-02652)
- Schematics: `/home/ricky/builds/elek-board-viewer/schematics/A2780 820-02652/pages/`
- Template: A2442 (Pro/Max structure with dual PMU, VR modules)
- Board identity: X2293 MLB
- Create directories: `maps/A2780/` and `diagnostics/A2780/`
- Create all Phase 1-3 outputs matching A2442 schema exactly
- Note: 322 pages across 2 PDF variants (C + S). Process both.
- QA every entry against schematic PNGs before writing

### Block 3: QA All Batch Outputs

For each of these 10 batch-processed boards, verify against their schematic PNGs:

**Air/base template boards** (compare against A2681):
- A2337 (MBA M1)
- A2338 (MBP 13" M1)
- A2338_M2

**Pro/Max template boards** (compare against A2442):
- A2442_CTO
- A2485 (MBP 16" M1 Pro/Max)
- A2485_EVTc
- A2779 (MBP 14" M2 Pro/Max)
- A2779_S

**Metadata fix:**
- A2918: verify this is MacBook Pro 14" M3 (820-02757), NOT M2 Air. Correct metadata.json if wrong.

For each board:
1. Read schematic PNGs at `/home/ricky/builds/elek-board-viewer/schematics/{board_dir}/pages/`
2. Cross-reference every entry in `maps/{board}/rails.json` against actual schematics
3. Verify: rail names exact match, voltages correct, IC designators correct, page refs correct, power sequence physically accurate, diagnostic test points exist
4. Fix errors in place
5. Flag anything unreadable in PNGs

### Block 4: Cross-Board Master Files

After all boards are QA'd:

1. Rebuild `maps/master-rail-index.json` — all rails across all boards, normalised
2. Rebuild `maps/master-ic-index.json` — all ICs across all boards
3. Create `maps/power-path-comparison.md` — Air vs Pro/Max architecture differences
4. Create `maps/common-power-faults.md` — known fault patterns mapped to measurement points
5. Update `maps/changelog.md` with all work done in this repass

---

## Critical Rules

- Read the verified pilot outputs FIRST (A2681 for Air, A2442 for Pro/Max) before touching anything
- Every component designator is board-specific. Do NOT copy U-numbers between boards.
- If a designator is unreadable in the PNG, note it explicitly rather than guessing
- Cross-reference Saf's diagnostic data where available: `/home/ricky/builds/elek-board-viewer/data/safan_diagnostics_enriched.json`
- All JSON must follow the exact schema of the pilot outputs
- Do NOT claim completion without actually reading schematic PNGs
- Commit all changes to the repo when done

---

## Completion Report

Produce a single summary:
- Board count processed/QA'd
- Rail count and IC count per board
- Corrections made to batch outputs during QA
- Any anomalies or boards with incomplete/ambiguous data
- Confirm all files committed
