# Maps Changelog

## 2026-04-11 — Repass: QA Fixes, Remaining Boards, Master Index

### Block 1: A3113 Audit-and-Rewrite

**A3113 (MacBook Air 13" M3, 820-03286, X2818/MLB)**
- Audited all 9 maps files + 3 diagnostics files against A2681 Air template
- Confirmed: Air topology (single PMU, no Viper/Monaco), AWAKE naming, correct metadata
- Fixed `power-domains.json`:
  - Removed PP3V3_S2SM_CIO (MPMU LDO 14 is NC on A3113, was A2681 carryover)
  - Fixed duplicate PPVDS5_S2SM_CIO entry to PPVBS5_S2SM_CIO (MPMU LDO 11)
- No Pro/Max artifacts found in any file
- All JSON validates cleanly

### Block 2: New Board Processing

**A3114 (MacBook Air 13" M3, 820-03285, X2819/MLB)**
- Created from A3113 template (same M3 Air platform, different BOM/revision)
- All 9 maps files + 3 diagnostics files created
- Board-specific metadata: schematic 820-03285, internal name X2819/MLB, APN 051-09344, rev 4.0.1
- Verified power aliases page structure matches A3113

**A2780 (MacBook Pro 16" M2 Pro/Max, 820-02652, X2293 MLB)**
- Created from A2442 Pro/Max template (same architecture, M2 generation)
- All 9 maps files + 3 diagnostics files created
- Board-specific metadata: 163 pages (C variant) + 159 pages (S variant)
- Pro/Max topology: Viper VR, Monaco VR, 3x USB-C, HDMI, SD card, dual SSD

### Block 3: Batch Board QA

QA'd all 10 batch boards:

**Air/base template boards** (verified against A2681):
- A2337 (MBA M1): 58 rails, 30 ICs. Clean, no Pro/Max artifacts.
- A2338 (MBP 13" M1): Different schema (PMU-organized). Valid JSON. 76 total items.
- A2338_M2 (MBP 13" M2): 67 rails, 42 ICs. Clean.

**Pro/Max template boards** (verified against A2442):
- A2442_CTO: 169 rails, 17 ICs. Viper + Monaco present.
- A2485 (MBP 16" M1 Pro/Max): 182 rails, 29 ICs. Viper + Monaco present.
- A2485_EVTc: 124 rails, 40 ICs. Added standard diagnostic files (dcps_20v/5v/common_faults).
- A2779 (MBP 14" M2 Pro/Max): 120 rails, 24 ICs. Viper + Monaco present.
- A2779_S: Fixed 4 malformed JSON entries (embedded note:value in name field). 79 rails, 33 ICs.

**A2918 metadata verification:**
- Confirmed: MacBook Pro 14" M3 (820-02757), NOT M2 Air.
- Identity: X2482/MLB, 051-07754, M3 chip, 14" Pro.
- 75 rails, 35 ICs. No Viper/Monaco (M3 Pro base uses different VR topology).

**Fixes applied:**
- A2779_S: Fixed 4 malformed JSON name fields with embedded notes
- A2485_EVTc: Created standard diagnostic files from A2485 template
- All JSON files across all 14 boards validate cleanly

### Block 4: Cross-Board Master Files

- `master-rail-index.json`: 520 unique rails across 14 boards. Top rails: PP3V8_AON (13 boards), PP5V_S2 (13), PPBUS_AON (13).
- `master-ic-index.json`: 213 unique ICs across 14 boards. Top ICs: UF500 (15), U7700/U8100 (14), UF400 (14), U5700 (13).
- `power-path-comparison.md`: Air vs Pro/Max architecture comparison with generation differences.
- `common-power-faults.md`: 9 fault patterns mapped to measurement points with board-specific notes.
- `changelog.md`: Updated with full repass documentation.

---

## 2026-04-10 — Second Pass

### A2681 (MacBook Air M2, 820-02536) — Phase 1 Complete

**Updated** `A2681/rails.json` — comprehensive extraction:
- Expanded from 38 → ~90 rails covering all MPMU/SPMU buck and LDO outputs
- Added all Ricky-flagged missing rails:
  - PP3V8_AON_VDDMAIN (branch of PP3V8_AON, C7705 short location)
  - PP0V72_S2_VDD_LOW (SPMU LDO 4)
  - PP0V75_S1_VDD_FIXED (SPMU LDO 12)
  - PP1V2_AON_MPMU (MPMU LDO 9B)
  - PP1V2_AON_SPMU (SPMU LDO 9B)
  - PP1V8_AWAKE (= PP1V8_MAME, MPMU BUCK 3 SW1)
  - PP0V88_AWAKE_NAND_VDD (= PPVDE_MAME_NAND_VCC on this board)
  - PP1V05_DISP (U6600 Display PMU)
  - PP0V75_S1_SRAM (SPMU BUCK 5)
- Added display rails (PP_AVDD_DISP, PP_VGH_DISP, PP_VGL_DISP)
- Added USB-C domain rails (PP0V855_USBC_CIO, PP0V805_USBC_FIXED, PP1V2_USBC_VDDIO)
- Added ATCSL regulator outputs
- Added keyboard/trackpad filtered rails
- Added NAND power rails
- Source: Power Aliases pages 92-95 (definitive SPMU/MPMU output mapping)

**Updated** `A2681/ics.json` — comprehensive extraction:
- Expanded from 20 → 33 ICs
- Fixed vague names: SVR AON Controller → **U5700**, 5V VR → **UC300** (not U6300)
- Added: U5050 (Ceres SE), U1950 (SEP EEPROM), U6600 (Display PMU), U6560 (BEN backlight), UP700/UP705/UP720 (display sequencers), UP950 (LCD e-Fuse), UE500 (lid SECDIS), UP420 (camera level shifter), J5150 (BMU), JG200 (debug)
- MagSafe controller: exact U-number not legible at available resolution, noted as UPC5 area

**Ambiguities resolved:**
1. PPVDD_MAME_CPU_State → corrected to **PPVDD_MAME_CPU_SRAM** (MPMU BUCK 7)
2. PPVSS5_S2M_CIO → corrected to **PPVDS5_S2SM_CIO** = 0.855V from MPMU LDO 10. Also aliased as PP0V855_USBC_CIO
3. PP3V_AON source → confirmed from **MPMU LDO 5** (PP3V_S2_LDO alias)
4. PPSC26_ADR_CHSR → transcription confirmed from page 92 power aliases
5. PP3V8_AON_VDDMAIN → confirmed as branch/distribution of PP3V8_AON (page 92). C7705 is its decoupling cap

**Source pages read:** All 113 pages (complete coverage)

---

## 2026-04-10 — Initial Pass

### A2681 (MacBook Air M2, 820-02536) — Phase 1 Pilot (superseded)

- Initial extraction: 38 rails, 20 ICs from 68 of 113 pages
- Identified gaps in rails and IC coverage
- Superseded by second pass above
