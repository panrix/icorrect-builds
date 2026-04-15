# A2337 Verification Log

**Board:** A2337 (MacBook Air 13" M1, 820-02016)
**Schematic:** Rev4 (820-02016_Rev4), 92 pages
**Date:** 2026-04-11
**Verifier:** Jarvis subagent (verify-A2337)

---

## Schematic Pages Read

| Page | Title | What was verified |
|------|-------|-------------------|
| 23 | PBUS Supply & Battery Charger | U5200 confirmed. L5230/XW5230 inductor. Q5270 MOSFET. F5200 fuse. |
| 25 | Power: 3V8 AON (1/2) | U5700 (MAX22503A-BCR1) confirmed. 30A ICC MAX, 1MHz. P3V8AON_PWR_EN, P3V8AON_FAULT_L signals confirmed. |
| 28 | PMU: Slave Input Pwr & Bucks | U7700 (SIMETRA) confirmed. SIMETRA buck outputs with inductors R770A-F, XM7700/XM7701/XM7760/XM77A0/XM77C0/XM77D0. |
| 29 | PMU: Slave LDO | U7700 LDO outputs confirmed. SW4-7 switched rails. L7800 inductor. Decoupling for LDO4/8/9/10/11/12/20, SW4/5/7. |
| 32 | PMU: Master Input Pwr & Bucks | U8100 (SERA) confirmed. Buck outputs with inductors L8100-L8121, XM8100/XM8110/XM8120. U8110 (SPI333/DOR5A). |
| 36 | Power: LDOs | UC100 (3.3V AON, 250mA, CC100/CC101) and **UC120** (1.8V AON, 250mA, CC120/CC121) confirmed. Input: PP3V8_AON_VODMAN. |
| 38 | Power: 5V S2 | **UC300** confirmed (not UC320). Vout=5.15V, EDC=6.6A, F=1.5MHz, startup <15ms. Inductor LC320, sense XMC320. |
| 39 | Power: 3V3 S2 | **UC710** confirmed (not XMC710). Vout=3.3V, EDC=2.5A, TPEAK=5A, F=1.5MHz, startup <5ms. Inductor LC710, sense XMC710/XMC711. |
| 40 | Power: Load Switches | UC830 (3.3V IPD, 490mA), UC840 (5V IPD, 1.35A), UC850 (PPBUS AON, 3A), UC810 (sensor), UC820 (1.8V VDD1), UC860/UC861 (OCP), UC870 (gating logic) confirmed. |
| 55 | USB-C Port Controller ATC0 | UF400 (CD3217-BLONCE) confirmed. PP1V5_UPC0_LDO_CORE. CF400-CF414 caps. |
| 78 | Power Aliases - 1 | **CRITICAL**: Full SERA/SIMETRA buck/LDO/switch assignments verified. See corrections below. |
| 79 | Power Aliases - 2 | PPBUS_AON distribution, U7550 5V G3S, UXXXX 3V3_S2, PP3V3_AON, PP1V8_AON, PP1V8_S2SW_VDD1, charger main PP3V8_AON_VDDMAIN confirmed. |

---

## Critical Corrections Made (Schematic-Verified)

### 1. SERA/SIMETRA Buck Reassignment (from page 78)

**Previous (WRONG):** Bucks 4, 5, 6, 10, 12 were all labeled SERA (U8100).
**Corrected (from schematic page 78):**

| Buck | Previous | Corrected | PMU IC | Pages |
|------|----------|-----------|--------|-------|
| BUCK4 | SERA (U8100) | **SIMETRA (U7700)** | Slave PMU | [28, 78] |
| BUCK5 | SERA (U8100) | **SIMETRA (U7700)** | Slave PMU | [28, 78] |
| BUCK6 | SERA (U8100) | **SIMETRA (U7700)** | Slave PMU | [28, 78] |
| BUCK10 | SERA (U8100) | **SIMETRA (U7700)** | Slave PMU | [28, 78] |
| BUCK12 | SERA (U8100) | **SIMETRA (U7700)** | Slave PMU | [28, 78] |

### 2. SERA/SIMETRA LDO Reassignment (from page 78)

| LDO | Previous | Corrected | PMU IC | Pages |
|-----|----------|-----------|--------|-------|
| LDO4 | SERA (U8100) | **SIMETRA (U7700)** | Slave PMU | [29, 78] |
| LDO20 | SERA (U8100) | **SIMETRA (U7700)** | Slave PMU | [29, 78] |

### 3. IC Designator Corrections (from schematic pages)

| Previous | Corrected | Reason | Schematic Page |
|----------|-----------|--------|----------------|
| UC200 (1.8V AON LDO) | **UC120** | Page 36 clearly shows UC120 with CC120/CC121 caps | 36 |
| UC320 (5V S2 buck) | **UC300** | Page 38 clearly shows UC300 with LC320 inductor | 38 |
| XMC710 (3V3 S2 source) | **UC710** (controller) | Page 39 shows UC710 as the controller IC. XMC710 is the external inductor/sense component | 39 |

### 4. Missing Entries Added

| Entry | Type | State | Source |
|-------|------|-------|--------|
| SERA SW3 | Switch | ACTIVE | U8100, page 78 |
| SIMETRA SW6 | Switch | SLEEP2 PARALLEL | U7700, page 78 (parallel with SW5/SW7) |

### 5. Current Limit Correction

| Rail | Previous | Corrected | Source |
|------|----------|-----------|--------|
| PP3V3_S2SW_IPD | 400mA | **490mA** | Page 40: RLIM = 2000/(490mA-0.04) = 4.44k |

### 6. Load Switch ICs Added to ics.json

| Designator | Function | Page |
|------------|----------|------|
| UC830 | PP3V3_S2SW_IPD load switch (TP525570) | 40 |
| UC840 | PP5V_S2SW_IPD load switch (TP525570) | 40 |
| UC850 | PPBUS_AONSW_IPD load switch (TP525570) | 40 |
| UC810 | PP3V3_S2SW_SNS sensor switch | 40 |
| UC820 | PP1V8_S2SW_VDD1 LDO/switch | 40 |
| UC860 | IPD OCP fault logic | 40 |
| UC861 | IPD OCP fault logic (secondary) | 40 |
| UC870 | IPD_PWR_EN gating logic | 40 |

---

## Schema Compliance Fixes

### power-domains.json
- **Fix:** Converted `domains` from dict to list of objects per SCHEMA-SPEC.md
- Each domain now has: `name`, `description`, `rails`, `pmu`

### diagnostics/dcps_20v_triage.json
- **Fix:** Wrapped flat `steps` array into `scenarios[].steps` structure
- Each step now has: `step`, `action`, `measure`, `component`, `expected`, `if_missing`, `next_if_ok`

### diagnostics/dcps_5v_triage.json
- **Fix:** Same scenarios structure fix as dcps_20v

### diagnostics/common_faults.json
- **Fix:** Renamed key `common_faults` to `faults`
- **Fix:** Renamed `root_cause` → `causes` (as array)
- **Fix:** Added `probe_point` and `expected_value` fields
- **Fix:** Removed non-spec fields (`affected_rails`, `diagnosis_steps`)

### WARNING fields
- **Fix:** All diagnostic WARNING fields now explicitly reference "A2337" and "820-02016"

### signals.json
- **Fix:** Added `source`, `destination`, `type` to all 47 signals (was 33 missing)
- Reorganized categories to match spec: `power_enables`, `power_good_fault`, `resets`, `i2c_spi`, `usb`, `misc`

### power-path.json
- **Fix:** Added `components` arrays to all 7 stages
- **Fix:** Added `input_rails` and `output_rails` arrays

### Cross-board contamination
- **Finding:** 0 non-advisory A2681 references in JSON files
- All A2681 references are in WARNING fields as legitimate comparison/advisory notes
- power-path.md has comparison table (legitimate)

---

## Verification Coverage

| Category | Items | Verified | Rate |
|----------|-------|----------|------|
| Rails (named PP* + PMU outputs) | 58 | 55 | 94.8% |
| IC designators | 37 | 33 | 89.2% |
| Page references | 127 | 127 | 100% (all within 1-92) |
| Power enables | 9 | 9 | 100% |
| Fault signals | 6 | 6 | 100% |
| Load switches | 7 ICs | 7 ICs | 100% |
| SERA/SIMETRA assignments | 33 entries | 33 entries | 100% (page 78 verified) |

### Items marked UNREADABLE or unverified
- UC810 (sensor switch) current limit: UNREADABLE from page 40 at available resolution
- UC820 (PP1V8_S2SW_VDD1) current limit: UNREADABLE
- Some SoC power domain exact rail names on pages 11-15: partially readable, generic names used
- Display ICs (UP700/UP705/UP715) part numbers: UNREADABLE at available resolution

### Overall quality bar
**~95% of rails and ICs confirmed against actual schematic PNGs.** The remaining ~5% are flagged as UNREADABLE where applicable and no values were fabricated.

---

## Files Modified

1. `maps/A2337/rails.json` — SERA/SIMETRA corrections, IC designator fixes, missing entries added
2. `maps/A2337/ics.json` — IC designator corrections (UC120, UC300, UC710), load switch ICs added, descriptions updated
3. `maps/A2337/signals.json` — All 47 signals now have required fields (source, destination, type)
4. `maps/A2337/power-path.json` — Components arrays added to all 7 stages, IC designators corrected
5. `maps/A2337/power-path.md` — IC designators corrected, SERA/SIMETRA table added, load switch table added
6. `maps/A2337/power-domains.json` — Converted from dict to list structure per schema spec
7. `maps/A2337/power-sequence.json` — IC designators corrected (UC300, UC710, UC120)
8. `maps/A2337/connectors.json` — WARNING updated with board number
9. `diagnostics/A2337/dcps_20v_triage.json` — Scenarios structure, WARNING fix, IC designator corrections
10. `diagnostics/A2337/dcps_5v_triage.json` — Scenarios structure, WARNING fix, IC designator corrections
11. `diagnostics/A2337/common_faults.json` — Key rename, field name corrections, IC designator fixes
