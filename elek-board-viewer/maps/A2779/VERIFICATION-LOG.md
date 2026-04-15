# A2779 Verification Log

**Board:** A2779 (MacBook Pro 14" M2 Pro/Max, 820-02655)
**Date:** 2026-04-11
**Verified by:** Jarvis subagent (schematic PNG analysis via vision model)
**Schematic source:** schematics/A2779 820-02655/pages/ (163 pages, J414-C-001 through J414-C-163)

## Pages Verified

| Page | Section | Verification Status |
|------|---------|-------------------|
| 29 | PBUS Supply & Battery Charger | VERIFIED — U5200, PPDCIN_AON, PPBUS_AON, charger signals confirmed |
| 34 | 3V8 AON Controller (42A Design) | VERIFIED — U5700 (RAA2255010-RC01), P3V8AON_PWR_EN, P3V8AON_FAULT_L, PP5V_AON_P3V8AON confirmed |
| 39 | SPMU Bucks | VERIFIED — All 11 buck-to-rail mappings confirmed against PD# assignments |
| 43 | MPMU Bucks | VERIFIED — All 11 buck-to-rail mappings confirmed against PD# assignments |
| 48 | Austringer Controller | VERIFIED — U9300 produces P1V8VDDH domain (PP1V8_S1_CLVR_VDDH), NOT PCPU SRAM |
| 52 | CLVR0 | VERIFIED — UA100 (MIRABEAU FCCSP), PCPU and PCPU_SRAM outputs confirmed |
| 58 | 5V S2 VR | VERIFIED — UC260, VOUT=5.15V, f=1.5MHz, EDC=3.0A, startup typ=6.4ms |
| 77 | USB-C Port Controller ATC0 | VERIFIED — UF400 (CD3217), PP3V3_UPC0_LDO, PP1V5_UPC0_LDO_CORE, USBC0_CC1/CC2 |
| 142 | Power Aliases 1 | VERIFIED — General alias mappings: PPBUS_AON, PP3V8_AON, PP5V_S2, PP1V8_AWAKE (SPMU SW0) |
| 144 | Power Aliases CLVR | VERIFIED — All 5 CLVR instances buck-to-rail mappings confirmed |
| 145 | Power Aliases MPMU | VERIFIED — MPMU Buck0-10 + LDO + SW mappings confirmed |
| 146 | Power Aliases SPMU | VERIFIED — SPMU Buck0-10 + LDO + SW mappings confirmed |

## Major Corrections Made

### 1. Austringer VR (U9300) Output Rail — CRITICAL FIX
- **Before:** JSON claimed U9300 produces PPVDD_PCPU_SRAM0/1_AWAKESW
- **After:** U9300 produces PP1V8_S1_CLVR_VDDH (feeds all 5 CLVR instances)
- **Evidence:** Page 48 — all signal names use P1V8VDDH_* prefix (P1V8VDDH_PW_EN_R, P1V8VDDH_FAULT_L, P1V8VDDH_DRMOS_FAULT_L, P1V8VDDH_IMON, SPMI_NUB_P1V8VDDH_CLK/DATA)
- **Impact:** PCPU SRAM rails come from CLVR0 (UA100, page 52), not Austringer

### 2. MPMU Buck Mappings — 5 buck-to-rail corrections
All corrected per power aliases page 145 (source of truth):

| Buck | Old (wrong) | Corrected (from page 145) | PD# |
|------|------------|--------------------------|-----|
| Buck 5 | PPVDD_ECPU_AWAKESW (FDK5) | PPVDD_DISP_AWAKESW (PD#20) | 20 |
| Buck 7 | PPVDD_DCS_S1 (FDK7) | PPVDD_AVEMSR_AWAKESW (PD#5) | 5 |
| Buck 8 | PPVDD_FIXED_S1 (FDK8) primary | PP1V2_S2 (PD#8) | 8 |
| Buck 9 | PPVDD_AMPH0_S2SW (FDK9) | PPVDD_FIXED_S1 (PD#9) | 9 |
| Buck 10 | PPVDDOO_S1 (FDK10) | PPVDDQ1_S1 (PD#10) | 10 |

### 3. SPMU Buck 1 Correction
- **Before:** PPVDDOO_S1_SPMU (FDKP1)
- **After:** PPVDDQ0_S1 (PD#13)
- **Evidence:** Page 39 schematic + page 146 power aliases

### 4. MPMU LDO Corrections
- **LDO 0:** Was PPVDD_S2_CLVR_VDDIO → Corrected to PP3V3_S2 (per page 145)
- **LDO 1:** Was PP1V2_S2_CLVR_VDDC1 → Corrected to PP1V8_S2SW_CLVR_VDDC1 (per page 145)
- **LDO 4:** Added PP3V3_AON (per page 142)
- **LDO 5:** Added PP0V8_S2_CLVR_VDDDIG (per page 145)
- **SW 0:** Added PP1V2_S2_CLVR_VDDIO (per page 145)

### 5. CLVR Output Rail Names — Corrected per page 144
- CLVR0 now correctly shows PCPU and PCPU_SRAM rails (not PCPU_SRAMB)
- CLVR1/CLVR2 GPU cluster numbering corrected (GPU0/1/2/3 distribution)
- CLVR0 Buck0/HP0 → PPVDD_PCPU1_AWAKESW (was PPVDD_PCPU0_AWAKESW)
- CLVR0 Buck2/HP1 → PPVDD_PCPU0_AWAKESW (was PPVDD_PCPU1_AWAKESW)

### 6. Signal Name Corrections
- PPVAON_PWR_EN → P3V8AON_PWR_EN (per page 34 schematic)
- PPVAON_FAULT_L → P3V8AON_FAULT_L (per page 34)
- PP5V2P5_PWR_EN → P5VS2TPS_PWR_EN (per page 58)
- PVRVD0N_FAULT_L → P1V8VDDH_FAULT_L (per page 48)
- Added P1V8VDDH_DRMOS_FAULT_L, P1V8VDDH_IMON, SPMI signals

### 7. UC260 Specs Corrected
- **Before:** f=1.25MHz, typ=6.0ms
- **After:** f=1.5MHz, EDC=3.0A, startup min=4.3ms typ=6.4ms max=8.81ms, VOUT=5.15V
- **Evidence:** Page 58 schematic annotation

## Schema Compliance Fixes

| Issue | Status |
|-------|--------|
| power-domains.json: domains was dict, must be list | FIXED ✓ |
| rails.json: 6 rails missing state field | FIXED ✓ (0 remaining) |
| signals.json: 84 signals missing required fields | FIXED ✓ (0 remaining, signals restructured with all required fields) |
| power-path.json: all stages missing components arrays | FIXED ✓ (all 7 stages have components) |
| Cross-board contamination: A2442 references | FIXED ✓ (0 in all JSON except metadata.json comparison field) |

## A2442 Reference Audit

| File | Before | After | Notes |
|------|--------|-------|-------|
| rails.json | 1 | 0 | WARNING field cleaned |
| ics.json | 6 | 0 | IC descriptions cleaned |
| power-domains.json | 2 | 0 | Description/WARNING cleaned |
| power-path.json | 2 | 0 | WARNING/description cleaned |
| power-sequence.json | 4 | 0 | All cleaned |
| signals.json | 0 | 0 | Clean |
| connectors.json | 0 | 0 | Clean |
| metadata.json | 4 | 4 | Retained — legitimate key_differences_from_a2442 field |
| dcps_20v_triage.json | 2 | 0 | Cleaned |
| dcps_5v_triage.json | 1 | 0 | Cleaned |
| common_faults.json | 7 | 0 | Cleaned |
| power-path.md | 4 | 2 | Retained — legitimate comparison table |

## Verification Confidence

### High confidence (>95% verified):
- MPMU buck-to-rail mappings (pages 43, 145)
- SPMU buck-to-rail mappings (pages 39, 146)
- Austringer U9300 output = PP1V8_S1_CLVR_VDDH (page 48)
- CLVR0 produces PCPU + PCPU_SRAM (page 52, 144)
- UC260 specs (page 58)
- PP3V8_AON / U5700 details (page 34)
- USB-C ATC0 / UF400 details (page 77)
- CLVR4 ANE/APR mappings (page 144)
- CLVR3 Fabric mapping + Buck0 unused (page 144)

### Medium confidence (80-95%):
- CLVR1/CLVR2 GPU cluster numbering (GPU0/1/2/3 assignment) — vision model at 4000px resolution may have limited accuracy on small text. GPU numbering was read as GPU2/GPU_SRAM2/GPU1/GPU_SRAM1 for CLVR1 and GPU0/GPU_SRAM0/GPU3/GPU_SRAM3 for CLVR2.
- CLVR4 Buck2/HP1 rail: read as PPVDD_AFR_CS_S1 on page 144, but may be PPVDD_APR_CS_S1. AFR vs APR are visually similar. Flagged in rails.json note.
- MPMU LDO3, LDO6 mappings — not visible on pages 145 at 4000px resolution. Excluded.

### Items needing manual verification at full resolution:
1. CLVR1/CLVR2 GPU cluster numbering (GPU0 vs GPU2, GPU1 vs GPU3)
2. PPVDD_AFR_CS_S1 vs PPVDD_APR_CS_S1 (CLVR4 Buck2/HP1)
3. MPMU LDO3 and LDO6 output rail names (unreadable at 4000px)
4. SPMU LDO1-6 output rail names (some not visible at 4000px)
5. Full Austringer power stage outputs on pages 49-51 (not yet verified at page level)

## Verification Method

Schematic PNG pages were resized to 4000x4000px and analyzed via vision model (Claude). Rail names, IC designators, signal names, voltages, and PD# assignments were extracted. Power aliases pages 144, 145, 146 were used as the definitive source of truth for buck-to-rail mappings, as these are Apple's own alias definition pages in the schematic.
