# Flow QA Backlog

Issues found in the schematic-derived diagnostic flow files during Phase 0 triage-brief validation. None are blocking, but all should be fixed in a follow-up QA pass before flows are trusted as the canonical reference for tech-facing instructions.

Each entry: what's wrong, where it lives, how it was discovered, suggested fix.

---

## A2681 (820-02536, M2 MBA 13")

### Q-1: `U8100` inconsistently labelled as MPMU in 3 of 4 flow files

**Files affected:**
- `diagnostics/A2681/common_faults.json` — calls U8100 "MPMU" (F005 entry, and Ricky's workflow note)
- `diagnostics/A2681/dcps_20v_triage.json` — calls U8100 "MPMU"
- `diagnostics/A2681/dcps_5v_triage.json` — calls U8100 "MPMU"
- `diagnostics/A2681/diagnostic-tree.json` — correctly calls U8100 "SPMU"

**Canonical source:** `schematics/A2681 820-02536/page_index.md` line 20 — *"33 | SPMU: Input PWR, Bulk, BSTLQ | U8100 boost converter → PP5V_MPMU_BSTLQ"*. U8100 is on the SPMU pages (33–36), it is the 5V boost converter whose output feeds the MPMU. It does not produce the NAND rails.

**Discovered:** Phase 0 verification of Ricky's Sion Bola (BM 1153) instructions on 2026-04-15. Ricky's original Mar 25 note said "trace back to U8100 output" for missing NAND rails, which is wrong on A2681 because NAND rails come from the MPMU (different chip on pages 37–43, likely U7700 based on pin count and physical proximity to the NAND zone).

**Likely root cause:** Copy-paste from the M1 A2337 flow. On M1 A2337, `U8100` = `SERA` = Master PMU (handles main bucks). The convention flipped on M2 A2681 — U8100 is the secondary boost PMU there. The Codex schematic-verification pass didn't catch the inversion.

**Fix:**
1. In all three broken files, replace `"U8100 (MPMU)"` with `"MPMU"` (chip designator TBD — see Q-3).
2. Leave `diagnostic-tree.json` as-is; it's correct.
3. Add a unit test or linter rule: any flow file for an M2/M3/M4 board that calls U8100 "MPMU" should fail validation.

**Priority:** Medium. Causes wrong trace-back targets when techs follow the flow literally, but the failure is recoverable (tech probes the wrong chip, finds nothing, escalates).

---

### Q-2: `FL4000` / `FL4001` fuses referenced but do not exist on A2681

**File affected:** `diagnostics/A2681/common_faults.json` → F006 "SSD / NAND power fault" → `"fix": "Check NAND power rails. Check fuses FL4000/FL4001..."`

Also referenced in `diagnostics/A2681/dcps_20v_triage.json` → scenario `0.5–1.5A` → step 2 → `if_missing: "NAND power fault. Check SPMU BUCK 6/12 outputs, FL4000/FL4001 fuses."`

**Evidence:** `python3 scripts/board_lookup.py A2681 FL4000 --info-only` and `FL4001` both return `status: error`, `error_code: component_not_found`. The BRD parser confirms these designators are not on the A2681 board.

**Discovered:** Phase 0 verification of Sion Bola brief on 2026-04-15.

**Likely root cause:** Copy-paste from a different board (possibly A2442, A2779, or similar) during the Codex batch. FL-series designators for fuses are common on M1 Pro/Max boards.

**Fix:**
1. Remove `FL4000 / FL4001` references from both files.
2. Replace with either (a) the real fuse designators on A2681 if fuses exist on those rails (needs schematic page 37/38 review), or (b) "trace back to MPMU buck output" if there are no discrete fuses.
3. Add a test: every component designator referenced in a flow file must resolve via `board_lookup.py` for that board.

**Priority:** Medium. Same as Q-1 — wrong trace-back target, recoverable.

---

### Q-3: MPMU chip designator not captured in flows or page index

**Files affected:** `schematics/A2681 820-02536/page_index.md` (pages 37–43 labelled "MPMU" with no IC reference), and all A2681 flow files (reference "MPMU" by name but never by chip designator).

**Evidence:** `page_index.md` rows 24–30 label pages 37–43 as "MPMU: Input PWR / Buck X / LDO / GPIO / Aliases / Support" but no `U####` reference. Compare with row 20 which correctly names `U8100` for the SPMU.

**Educated guess:** `U7700` — 196-pin IC, sits at x=6394, y=770 (upper area of the right-side NAND zone), which is physically near the NAND test points (CN010, CN020, CN032 at x≈6600–6900). Pin count and location are consistent with a main PMU. But this needs visual confirmation from schematic page 37 or 38.

**Fix:**
1. Visually confirm the MPMU chip designator from schematic page 37 or 38.
2. Update `page_index.md` to include the designator.
3. Update all flow file references to use the specific designator instead of just "MPMU".

**Priority:** Low. The flows work without it; the designator just makes trace-back faster.

---

### Q-4: `C9586` referenced in common_faults but not on A2681

**File affected:** `diagnostics/A2681/common_faults.json` → F006 → `"test_points": ["C9586 (SSD power area)"]`. Also `dcps_20v_triage.json` → `data_note: "Saf: 20V/0.7A → C9586 SSD power IC short"`.

**Evidence:** `python3 scripts/board_lookup.py A2681 C9586 --info-only` returns `status: error, error_code: component_not_found`.

**Discovered:** Phase 0 verification on 2026-04-15.

**Likely root cause:** Copy-paste from another board. The note `"Saf: 20V/0.7A → C9586 SSD power IC short"` is probably real historical diagnostic data but attributed to the wrong board in the flow.

**Fix:**
1. Cross-reference `safan_diagnostics_enriched.json` for the original `C9586` mention to find which board it was actually on.
2. Move the note to the correct board's flow file.
3. Remove from A2681.

**Priority:** Low. It's a stale test-point reference, not a wrong instruction.

---

## Systemic issues across all flow files

### Q-5: Flow files were not linted for component-designator existence

**Problem:** Q-2 and Q-4 above indicate that at least the A2681 flow files contain designators (`FL4000`, `FL4001`, `C9586`) that are not on the A2681 BRD. These are copy-paste errors from the Codex schematic-verification pass that a basic validator would catch.

**Suggested fix:** Add a CI-style check (can be a standalone Python script under `scripts/`) that walks every flow file, regex-extracts component designators (`[CURQFLD][A-Z]?\d{3,5}`), and runs each through `board_lookup.py` for that board. Any `component_not_found` errors get flagged. Run against all 13 boards on every flow edit.

**Priority:** Medium. This is a preventative fix — it won't find all bugs, but it will catch every bug of this class automatically.

---

### Q-6: No board-side metadata on component references

**Problem:** Flow files list components (`C8430`, `CN020`, etc.) but never indicate whether the component is on the top or bottom side of the board. Techs reading the flow don't know which side to probe. The BRD parser already exposes `board_side` — it's just not propagated into the flow files.

**Suggested fix:** On flow-file generation or QA pass, enrich every component reference with its board side. Output format could be `"CN020 (top)"` or a structured `{"component": "CN020", "side": "top"}`.

**Priority:** Medium. It's the difference between a brief Saf can follow and a brief that wastes 10 minutes looking on the wrong side.

---

## Log format for future entries

```
### Q-N: <short title>
**File affected:** <path>
**Evidence:** <how I know it's wrong>
**Discovered:** <date + context>
**Likely root cause:** <guess>
**Fix:** <what to do>
**Priority:** High / Medium / Low
```
