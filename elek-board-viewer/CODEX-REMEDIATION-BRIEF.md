# Codex Brief: Schematic QA Remediation

**Project:** /home/ricky/builds/elek-board-viewer
**Date:** 2026-04-11
**Owner:** Ricky via Jarvis
**Follows:** QA-REPORT.md (codex-reviewer, FAIL verdict)

---

## Context

The QA reviewer found 3 hard failures and 1 minor issue. This brief fixes all of them. No other boards need changes; 8 passed clean.

---

## Fix 1: A2780 — Full Rebuild From Schematics (CRITICAL)

The current A2780 outputs are cloned from A2442 with header swaps. They must be rebuilt from scratch by reading the actual schematic PNGs.

1. Delete all files in `maps/A2780/` and `diagnostics/A2780/`
2. Read the verified A2442 pilot outputs to understand the Pro/Max schema:
   - `maps/A2442/rails.json`, `ics.json`, `connectors.json`, `signals.json`, `power-path.json`, `power-sequence.json`, `power-domains.json`, `metadata.json`
   - `diagnostics/A2442/dcps_20v_triage.json`, `dcps_5v_triage.json`, `common_faults.json`
3. Read A2780 schematic PNGs at `/home/ricky/builds/elek-board-viewer/schematics/A2780 820-02652/pages/`
4. Extract all data fresh from the actual schematics. Every rail name, voltage, IC designator, and page reference must come from the A2780 PNGs, not copied from A2442.
5. A2780 is MacBook Pro 16" M2 Pro/Max (820-02652), X2293 MLB. 322 pages across C + S variants.
6. Create `metadata.json` with full pilot-style section map (per-page section index, not a placeholder note)
7. Create all Phase 1-3 outputs matching A2442 schema structure but with A2780-specific content
8. Self-verify: after writing, grep for "A2442" in all A2780 output files. Zero matches expected.

## Fix 2: A3114 Diagnostics — Remove A3113 Contamination

1. Open `diagnostics/A3114/common_faults.json`
2. Replace all references to "A3113" with "A3114"
3. Replace all references to "820-03286" with "820-03285"
4. Remove or rename any `a3113_notes` fields to `a3114_notes`
5. Verify the opening text says "A3114" not "A3113"
6. Check `diagnostics/A3114/dcps_20v_triage.json` and `dcps_5v_triage.json` for the same contamination and fix if found
7. Self-verify: grep for "A3113" in all A3114 output files. Zero matches expected (except cross-references that legitimately mention the sibling board).

## Fix 3: A2779 Voltage Correction

1. Open `maps/A2779/rails.json`
2. Find the `PP5V_S2` rail entry
3. The voltage description currently says `VOUT=15V` — this is wrong
4. Schematic page 58 shows UC260 on the `5V_S2 VR` page with `Vout=5.15V`
5. Correct the voltage to `5.15V` and remove the contradictory "(VOUT=15V noted on schematic, actual ~5V)" text
6. Check if any other rails in A2779 have similar contradictory voltage descriptions and fix them

## Fix 4: A2918 Classification in power-path-comparison.md

1. Open `maps/power-path-comparison.md`
2. A2918 (MacBook Pro 14" M3) does NOT use Viper/Monaco VR modules (confirmed in repass). Its power architecture is closer to Air than Pro/Max.
3. Move A2918 from the Pro/Max section to its own "M3 Pro (hybrid architecture)" note, or add a clear annotation that it differs from M1/M2 Pro/Max boards
4. Do not simply move it to Air — it IS a Pro board, just with different power topology

---

## Verification

After all fixes:

1. Run `python3 -c "import json, glob; [json.load(open(f)) for f in glob.glob('maps/*//*.json') + glob.glob('diagnostics/*//*.json')]"` to confirm all JSON still parses
2. Grep for cross-board contamination:
   - `grep -r "A2442" maps/A2780/ diagnostics/A2780/` → expect 0 matches
   - `grep -r "A3113" diagnostics/A3114/` → expect 0 matches (or only legitimate cross-refs)
3. Rebuild master indexes:
   - `maps/master-rail-index.json` — update A2780 entries with real data
   - `maps/master-ic-index.json` — update A2780 entries with real data
4. Update `maps/changelog.md` with remediation work
5. Commit all changes

---

## Completion Report

Produce a summary:
- Which fixes were applied
- A2780 rail count and IC count (should differ from A2442 if extraction was genuine)
- Contamination grep results (must be clean)
- JSON validation result
- Confirm committed
