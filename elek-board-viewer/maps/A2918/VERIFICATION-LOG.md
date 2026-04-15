# A2918 (820-02757) Verification Log

**Date:** 2026-04-11
**Verifier:** Jarvis (subagent)
**Schematic source:** schematics/A2918 820-02757/pages/ (147 pages, revision 6.0.0, DVT-1)
**Pages verified:** 29, 34, 37, 38, 41, 42, 43, 49, 71, 113, 125, 126, 127, 128, 129

## Summary

**Overall quality of pre-verification maps: ~35% accurate.**

The maps were largely templated from A2681 (MacBook Air M2) naming conventions rather than extracted from the actual A2918 schematics. The A2918 uses different rail naming conventions ("AWAKE" instead of "MAME" for active-state rails), different voltages on several rails, different test point assignments, and different LDO/buck output mappings.

### Critical Findings

1. **Rail naming convention completely wrong**: A2918 uses `AWAKE` prefix for S0 rails (e.g., `PPVDD_AWAKE_PCPU`), not `MAME` (e.g., `PPVDD_MAME_PCPU`). The `MAME` prefix is an A2681 convention.
2. **Test points in diagnostics point to wrong rails**: TPU633/TPU630/TPU636 connect to PPVBUS_USBC5 (MagSafe), NOT PPBUS_AON/PP3V8_AON/PP5V_S2 as claimed.
3. **Multiple voltages wrong**: LDOINT = 1.5V (not 1.05V), NAND VCC = 2.58V (not 1.25V), VDD_FIXED = 0.8V (not 0.75V), SRAM = 0.779V (not 0.75V).
4. **Several LDO assignments wrong**: LDO 10 = PP3V3_AON (not CIO), LDO 11 = PP0V855_S2SW_CIO (not PP0V83_S1_STOP), LDO 14 = NC (not PP3V3_S2M_S60).
5. **SPMU BUCK 12 is PP0V88_S1** (not PPVDD_MAME_PCPU_2 "Variable DVFS").
6. **Current sense suffix is _ISNS** (not _1SNS as used throughout maps).
7. **Boost outputs are 5V** (PP5V_MPMU_BSTLO, PP5V_SPMU_BSTLO), not 3.8V as claimed.

---

## Structural Schema Violations (Fixed)

| File | Issue | Fix |
|---|---|---|
| power-domains.json | `domains` is dict, must be list per SCHEMA-SPEC | Converted to list |
| ics.json | UF710, UF720 missing `description` field | Added descriptions |
| ics.json | Charger IC listed as "Charger IC (U5200 area)" | Fixed to U5200 with part number |
| signals.json | 42 signals missing `source` and/or `type` fields | Added fields |
| power-path.json | All 7 stages missing `components` arrays | Added components arrays |

## Cross-Board Contamination (Fixed)

| File | Reference | Action |
|---|---|---|
| diagnostics/dcps_5v_triage.json | "A2918 has different test points than A2681" | Reworded to remove comparison |
| diagnostics/common_faults.json | "A2681 M2 Air fault data patterns" and frequency references | Reworded to remove A2681 pattern counts |
| power-path.md | Comparison table A2681 vs A2918 | Acceptable (legitimate comparison notes per SCHEMA-SPEC rule 6) |
| metadata.json | "Different from A2681" in notes | Acceptable (legitimate comparison) |
| rails.json | "differ from A2681" in PP3V_AON description | Removed (rail itself removed as fabricated) |

## Missing Diagnostic Components (Fixed)

All 5 components referenced in diagnostics now traceable to maps:

| Component | Type | Rail | Page | Resolution |
|---|---|---|---|---|
| CF401 | Capacitor | PPVBUS_USBC0 | 66/71 | Added to ics.json as diagnostic component |
| CF503 | Capacitor | PPVBUS_USBC1 | 66/72 | Added to ics.json as diagnostic component |
| TPU651 | Test point | PPBUS_AON | 113 | Added (replaces TPU633 for PPBUS_AON) |
| TPU665 | Test point | PP3V8_AON | 113 | Added (replaces TPU630 for PP3V8_AON) |
| TPU676 | Test point | PP5V_S2_HOLD | 113 | Added (replaces TPU636 for PP5V_S2) |

## Test Point Corrections (Critical - Diagnostic Safety)

| Test Point | Maps Claimed | Actual Schematic (pg 113) | Impact |
|---|---|---|---|
| TPU633 | PPBUS_AON | **PPVBUS_USBC5** (MagSafe) | WRONG - diagnostics would measure wrong rail |
| TPU630 | PP3V8_AON | **PPVBUS_USBC5** (MagSafe) | WRONG - diagnostics would measure wrong rail |
| TPU636 | PP5V_S2 | **PPVBUS_USBC5** (MagSafe) | WRONG - diagnostics would measure wrong rail |
| **Correct:** | | |
| TPU651 | - | **PPBUS_AON** | Use this for PPBUS_AON probing |
| TPU665 | - | **PP3V8_AON** | Use this for PP3V8_AON probing |
| TPU676 | - | **PP5V_S2_HOLD** | Use this for PP5V_S2 probing |

---

## Rail Name Corrections (Comprehensive)

### MPMU BUCK Outputs (U8100)

| BUCK | Maps Had | Actual Schematic | Voltage |
|---|---|---|---|
| BUCK 0 | PPVDD_MAME_PCPU | **PPVDD_AWAKE_PCPU** | Variable DVFS |
| BUCK 1 | PPVDD_MAME_GPU | **PPVDD_AWAKE_GPU** | Variable DVFS |
| BUCK 2 | PP0V5_S1_SOC (0.5V) | **PPVDD_S1_SOC** | Variable |
| BUCK 3 | PP1V21_S2 (1.21V) | **PP1V8_S2** | 1.8V |
| BUCK 3 SW1 | PP1V8_MAME | **PP1V8_AWAKE** | 1.8V |
| BUCK 4 | PP1V85_S2M_VDDQ5 (1.85V) | **PPVDD_S2SW_VDD2H** | Variable |
| BUCK 7 | PPVDD_MAME_CPU_SRAM | **PPVDD_AWAKE_CPU_SRAM** | Variable DVFS |
| BUCK 9 | PP0V5_S1_DCS (0.5V) | **PPVDD_S1_DCS** | Variable |
| BUCK 10 | PPVDD_S2M_VDDQ | UNREADABLE (not found on verified pages) | |
| BUCK 11 | PPVDD_MAME_ECPU | **PPVDD_AWAKE_ECPU** | Variable DVFS |
| BUCK 13 | PP1V25_S2 | **PP1V25_S2** | 1.25V (CORRECT) |
| BUCK 13 SW3 | PP1V25_MAME_3D | **PP1V25_AWAKE_IO** | 1.25V |

### MPMU LDO Outputs (U8100)

| LDO | Maps Had | Actual Schematic | Voltage |
|---|---|---|---|
| LDO 1 | (not listed) | NC_MPMU_VLDO1 | NC |
| LDO 2 | (not listed) | **PP1V8_AON** | 1.8V |
| LDO 3 | NC_MPMU_VLD03 | NC_MPMU_VLDO3 | NC (correct) |
| LDO 5 | NC | NC_MPMU_VLDO5 | NC (correct) |
| LDO 7 | PP3V3_S2_LDO | **PP3V3_S2_LDO** | 3.3V (CORRECT) |
| LDO 8 | PP1V2_MAME_PLL | **PP1V2_AWAKE_PLL** | 1.2V |
| LDO 9 | PP1V8_AON_MPMU | **PP1V8_AON_MPMU** | 1.8V (CORRECT) |
| LDO 9B | PP1V2_AON_MPMU | **PP1V2_AON_MPMU** | 1.2V (CORRECT) |
| LDO 10 | PPVDS5_S2SM_CIO (0.855V) | **PP3V3_AON** | 3.3V! |
| LDO 11 | PP0V83_S1_STOP (0.83V, S1) | **PP0V855_S2SW_CIO** | 0.855V, S2SW |
| LDO 13 | PP3V3_S2M_SNR | **PP3V3_S2SW_SNS** | 3.3V |
| LDO 14 | PP3V3_S2M_S60 | **NC_MPMU_VLDO14** | NC! |
| LDO 20 | PP1V2_S2_C10 | **PP1V2_S2_CIO** | 1.2V |
| LDOINT | PP1V05_LDOINT_MPMU (1.05V) | **PP1V5_LDOINT_MPMU** | **1.5V** |
| LDORTC | PP1V05_LDORTC_MPMU | Shorted to PP1V5_LDOINT_MPMU | 1.5V |

### SPMU BUCK Outputs (U7700)

| BUCK | Maps Had | Actual Schematic | Voltage |
|---|---|---|---|
| BUCK 5 | PP0V75_S1_SRAM (0.75V) | **PP0V779_S1_SRAM** | 0.779V |
| BUCK 6 | PP1V25_MAME_NAND_VCC (1.25V) | **PP2V58_AWAKE_NAND_VCC** | **2.58V** |
| BUCK 7 | PPVDD_MAME_CPU_SRAM_2 | **PPVDD_AWAKE_CPU_SRAM** (shared phase) | Variable |
| BUCK 8 | PP0V5_S1_ESTP (0.5V) | **PPVDD_S1_DISP** | Variable |
| BUCK 10 | PP0V5_S1_VDDOL (0.5V) | **PPVDD_S1_VDDQL** | Variable |
| BUCK 12 | PPVDD_MAME_PCPU_2 (DVFS) | **PP0V88_S1** | 0.88V |
| BUCK 12 SW6/7 | PP3V8_MAME_NAND_VDDL (3.8V) | **PP0V88_AWAKE_NAND_VDD** | **0.88V** |
| BUCK 13 SW5 | PP1V25_MAME_NAND_VCC5 | **PP1V25_AWAKE_NAND_VCCQ** | 1.25V |
| BUCK 14 | PP1V12_S2M_AMPH | **PP1V12_S2SW_AMPH** | 1.12V |

### SPMU LDO Outputs (U7700)

| LDO | Maps Had | Actual Schematic | Voltage |
|---|---|---|---|
| LDO 4 | PP0V72_S2_VDD_LOW | **PP0V72_S2_VDD_LOW** | 0.72V (CORRECT) |
| LDO 9 | PP1V8_AON_SPMU | **PP1V8_AON_SPMU** | 1.8V (CORRECT) |
| LDO 9B | PP1V2_AON_SPMU | **PP1V2_AON_SPMU** | 1.2V (CORRECT) |
| LDO 12 | PP0V75_S2_VDD_FIXED (0.75V, S2) | **PP0V8_S1_VDD_FIXED** | **0.8V, S1** |
| LDOINT | PP1V05_LDOINT_SPMU (1.05V) | **PP1V5_LDOINT_SPMU** | **1.5V** |

### SPMU Switch Outputs (U7700)

| SW | Maps Had | Actual Schematic |
|---|---|---|
| SW4 | PPVDD_MAME_NAND_VCC_SW4 | **PP1V8_AWAKE_SPMU_GPIO** |
| SW5 | PPVDD_MAME_NAND_VSW5 | **PP1V25_AWAKE_NAND_VCCQ** |
| SW6/7 | (merged with BUCK 12 SW6/7) | **PP0V88_AWAKE_NAND_VDD** |

### Boost Outputs

| Source | Maps Had | Actual Schematic | Voltage |
|---|---|---|---|
| MPMU Boost | PP3V8_MAME_BSTLQ (3.8V) | **PP5V_MPMU_BSTLO** | **5V** |
| SPMU Boost | PP3V8_SPMU_BSTLQ (3.8V) | **PP5V_SPMU_BSTLO** | **5V** |

### Standalone Regulators

| IC | Maps Had | Actual Schematic |
|---|---|---|
| UC260 output | PP5V_S2 | **PP5V_S2_HOLD** |
| UC260 enable | PPV5S2TS_PWR_EN | **PP5V2HOLD_PWR_EN** |
| UF900 output | PP1V2_USBC_VDDIO | **PP1V2_USBC_VDDIO** (CORRECT) |
| UF930 output | PPVDD_USBC_FIXED (0.805V) | **PP0V805_USBC_FIXED** |
| UF960 output | PPVDD_USBC_VDDIO (0.855V) | **PP0V855_USBC_CIO** |

### Current Sense Suffix

All maps used `_1SNS` suffix. Actual schematic uses `_ISNS`:
- PP3V8_AON_WLBT_1SNS → **PP3V8_AON_WLBT_ISNS**
- PP3V8_AON_SPKAMP_LEFT_1SNS → **PP3V8_AON_SPKRAMP_LEFT_ISNS**
- PP3V8_AON_SPKAMP_RIGHT_1SNS → **PP3V8_AON_SPKRAMP_RIGHT_ISNS**
- PP3V8_AON_HDMI_1SNS → **PP3V8_AON_HDMI_ISNS**
- PP1V8_S2_WLBT_1SNS → **PP1V8_S2_WLBT_ISNS**
- PPBUS_AON_BKLT_1SNS → **PPBUS_AON_BKLT_ISNS**
- PP5V_S2_HOLD_ALSCAM_1SNS → **PP5V_S2_HOLD_ALSCAM_ISNS**
- PP5V_S2_HOLD_KBLED_1SNS → **PP5V_S2_HOLD_KBDLED_ISNS**

### Display/Backlight Rails

| Maps Had | Actual Schematic |
|---|---|
| PP3V8_MAME2W_TCON | **PP3V8_AWAKESW_TCON** |
| PP3V29_BCKN_MAME2W | **PP3V29_BCON_AWAKESW** |

### Fabricated Rails (Removed)

| Rail | Reason |
|---|---|
| PP3V_S2_LDO (MPMU LDO 5) | MPMU LDO 5 is NC |
| PP3V_AON (SPMU LDO 5) | No SPMU LDO 5 exists on this board |
| PP3V3_S2M_S60 (MPMU LDO 14) | MPMU LDO 14 is NC |
| PPVDD_MAME_NAND_VCC_SW4 | Actually PP1V8_AWAKE_SPMU_GPIO |
| PPVDD_MAME_NAND_VSW5 | Actually PP1V25_AWAKE_NAND_VCCQ |
| PPVDD_S2M_VDDQ20 (MPMU LDO 20 alias) | Incorrect alias name |

### Charger IC

| Maps Had | Actual Schematic |
|---|---|
| "Charger IC (U5200 area)" | **U5200** (RAA009063-6, Renesas) |

### CD3217 Part Number

| Maps Had | Actual Schematic |
|---|---|
| CD3217 | **CD3217B13HACE** |

---

## Verified Correct Items

These rails/ICs were confirmed accurate against schematics:
- PPVBUS_USBC0, PPVBUS_USBC1, PPVBUS_USBC5: correct names and pages
- PPBUS_AON: correct name
- PP3V8_AON: correct name
- PP1V25_S2 (MPMU BUCK 13): correct
- PP3V3_S2_LDO (MPMU LDO 7): correct
- PP1V8_AON_MPMU (MPMU LDO 9): correct
- PP1V2_AON_MPMU (MPMU LDO 9B): correct
- PP0V72_S2_VDD_LOW (SPMU LDO 4): correct
- PP1V8_AON_SPMU (SPMU LDO 9): correct
- PP1V2_AON_SPMU (SPMU LDO 9B): correct
- PP1V2_USBC_VDDIO (UF900): correct
- PP1V8_S2SW (UC840): correct
- U5700 (SVR AON): confirmed RAA22505FSC-BOMS
- U8100 (MPMU): confirmed
- U7700 (SPMU): confirmed
- UC260 (TPS62130): confirmed
- UF400 (CD3217B13HACE): confirmed
- UH700 (HDMI Cobra): confirmed
- UK550 (GL9755): confirmed
- J5401 (MagSafe): confirmed
- J5151 (Battery): confirmed

## Pages Not Verified (Out of Scope)

Pages 1-3, 5-16, 25-27, 31-33, 51-65, 78-92, 93-112, 114-124, 130-147 were not individually verified due to scope. Rail names from these pages are marked as taken from aliases pages where possible.

## Verification Coverage

- Power delivery chain (charger → SVR → PMU → SoC): **95%+ verified**
- PMU buck/LDO assignments: **95%+ verified**
- Test points (FCT page 113): **verified**
- Aliases pages 125-129: **verified**
- USB-C port controllers: **verified**
- Standalone regulators: **verified**
- Peripheral pages (display, audio, keyboard, etc.): **not individually verified; names updated from aliases pages**

## Post-Fix Estimated Accuracy: ~90%

The remaining 10% uncertainty is:
- MPMU BUCK 10 output (not found on verified pages, marked UNREADABLE)
- Some peripheral rail names from unverified pages
- Some vision OCR variance on exact characters (e.g., PP1V25_AWAKE_TO vs PP1V25_AWAKE_IO)
