# A2337 Power Path - Human-Readable Diagnostic Reference

Board: A2337 (MacBook Air 13" M1, 820-02016, X1757/MLB)

**WARNING: This is an M1 board (A2337 / 820-02016). NO MagSafe port. Two USB-C ports only. PMU uses SERA (Master/U8100) and SIMETRA (Slave/U7700) naming convention. Do NOT cross-reference M2 (A2681) test points or U-designators to this board.**

## Power Chain Overview

```
USB-C 5V -> CD3217 (UF400/UF500) -> Charger IC (U5200) -> PPBUS_AON (12.6V)
                                                              |
                                                         U5700 (SVR AON, 30A)
                                                              |
                                                        PP3V8_AON (3.8V)
                                                    ------+------+------
                                                    |           |       |
                                               U7700        U8100   UC100/UC120
                                             (SIMETRA)     (SERA)  (AON LDOs)
                                              Slave PMU   Master PMU
                                                    |           |
                                               SIMETRA     SERA Bucks
                                               Bucks/LDOs  & LDOs
                                                    |           |
                                                    +-----+-----+
                                                          |
                                                     SoC U6000
                                                  (M1 T8103 PCPU/ECPU/GPU)
```

Also from PPBUS_AON:
```
PPBUS_AON -> UC300 -> PP5V_S2 (5.15V)
PPBUS_AON -> UC710 -> PP3V3_S2 (3.3V)
PPBUS_AON -> Load switches -> PP3V3_S2SW_IPD, PP5V_S2SW_IPD, PPBUS_AONSW_IPD
```

## Diagnostic Test Points

**NOTE: Test point references below are from the schematic. Probe at nearest accessible capacitor to each rail.**

### Step 1: PPBUS_AON
- **Probe: Bulk capacitor near U5200 output (page 23)**
- **Expect: ~12V (battery connected)**
- YES -> go to Step 2
- NO -> Fault in charging circuit / CD3217 (UF400/UF500) / Charger IC (U5200)
  - Check: USB-C connector pins, CC line continuity
  - Check: CHGR_AUX_OK signal (page 24)
  - Check: SYS_DETECT circuit on BMU connector (J5100, page 22)

### Step 2: PP3V8_AON
- **Probe: Bulk capacitor on PP3V8_AON output (pages 25-27)**
- **Expect: 3.8V**
- YES -> go to Step 3
- NO -> Fault in U5700 (SVR AON)
  - Check: PPVAON_PWR_EN (enable signal - is it asserted?)
  - Check: PPVAON_FAULT_L (fault signal - is it pulled low?)
  - Check: U5910 current sense
  - Check: PP3V8_AON_VDDMAIN distribution for shorts

### Step 3: PP5V_S2
- **Probe: PP5V_S2 output capacitor (page 38)**
- **Expect: 5.15V**
- YES -> go to Step 4
- NO ->
  - Check inductor LC320 / diode near UC300 (diode mode)
  - Check P5VS2_PWR_EN enable signal (page 37)
  - UC300 fault if enable is present but no output

### Step 4: PMU LDO Outputs
- **SERA LDO 9 output -> expect ~1.8V** (AON, page 34)
- **SIMETRA LDO 9 output -> expect ~1.8V** (AON, page 29)
- **PP3V3_AON (UC100 output, CC101) -> expect 3.3V** (page 36)
- **PP1V8_AON (UC120 output, CC121) -> expect 1.8V** (page 36)
- ALL YES -> Fault is downstream of PMU. Investigate SoC domains.
- ANY NO -> go to Step 5

### Step 5: Thermal Imaging
- Apply thermal camera to the shorted rail
- **Hot chip found?**
  - YES -> Replace that chip
  - NO -> PMU is dead -> replace U8100 (SERA/Master) or U7700 (SIMETRA/Slave)

---

## SERA/SIMETRA Buck Assignment (from page 78)

**SERA (Master PMU / U8100, pages 32-33):**
- BUCK0 (ACTIVE) - PCPU primary DVFS
- BUCK1 (SW CTRL)
- BUCK2 (SLEEP1)
- BUCK3 (SLEEP3)
- BUCK7 (ACTIVE)
- BUCK8 (SW CTRL)
- BUCK9 (SLEEP1)
- BUCK11 (ACTIVE) - ECPU

**SIMETRA (Slave PMU / U7700, page 28):**
- BUCK4 (SLEEP3)
- BUCK5 (SLEEP1)
- BUCK6 (ACTIVE)
- BUCK10 (SLEEP1)
- BUCK12 (ACTIVE)
- BUCK13 (ACTIVE)
- BUCK14 (ACTIVE)

---

## Key Differences from A2681 (M2 Air)

| Feature | A2337 (M1) | A2681 (M2) |
|---------|------------|------------|
| SoC | M1 (T8103) | M2 |
| MagSafe | NO | YES (J5401) |
| USB-C Ports | 2 (left side) | 2 (left side) |
| Master PMU name | SERA (U8100) | MPMU (U8100) |
| Slave PMU name | SIMETRA (U7700) | SPMU (U7700) |
| 5V S2 Buck | UC300 | UC300 |
| 3V3 S2 Buck | UC710 | UC710 |
| AON 3V3 LDO | UC100 (external) | MPMU LDO 5 (internal) |
| AON 1V8 LDO | UC120 (external) | MPMU LDO 9 (internal) |
| WiFi/BT Module | Rasputin | Typhoon |
| BEN IC | DP600 | U6560 |
| Display | eDP (LCD) | eDP (LCD) |

## Load Switches (page 40)

| Input | Output | IC | Current Limit | Enable | RC Delay |
|-------|--------|-----|---------------|--------|----------|
| PP3V3_S2 | PP3V3_S2SW_IPD | UC830 | 490mA | MPMU GPIO6 | 25.5ms |
| PP5V_S2 | PP5V_S2SW_IPD | UC840 | 1.35A | MPMU GPIO6 | 4.7ms |
| PPBUS_AON | PPBUS_AONSW_IPD | UC850 | 3A | Self (3.13-5.93V) | - |
| PP3V3_S2 | PP3V3_S2SW_SNS | UC810 | UNREADABLE | SENSOR_PWR_EN | - |
| PP3V8_AON_STBMAIN | PP1V8_S2SW_VDD1 | UC820 | UNREADABLE | P5V01_PWR_EN | - |
