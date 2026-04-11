# A2338 Power Path — Human-Readable Diagnostic Reference

Board: A2338 (MacBook Pro 13" M1, 820-02020, T668 MLB)

**WARNING: This is A2338 (MBP 13" M1) — NOT A2681 (MBA M2). No MagSafe. USB-C charging only. Has DFR (Touch Bar) and active fan. Different PMU silicon (TNL T4741/T4600). Charger is Suona B379 (63W).**

## Power Chain Overview

```
USB-C 5V → CD3217 (UF400/UF500) → FF201 fuse → U5200 (Suona charger) → PPBUS_AON (12.6V)
                                                                              │
                                                                    U5700 (SVR AON, 30A)
                                                                              │
                                                                        PP3V8_AON (3.8V)
                                                              ┌───────────┬───┴───┬──────────┐
                                                         UC100        UC120    U7700      U8100
                                                        (3V3 AON)   (1V8 AON) (SPMU)    (MPMU)
                                                              │           │       │          │
                                                         PP3V3_AON  PP1V8_AON  SPMU     MPMU
                                                                              Bucks/LDO Bucks/LDO
                                                                                  │          │
                                                                              └────────┬─────┘
                                                                                       │
                                                                                  SoC U0600
                                                                              (PCPU/ECPU/GPU/SRAM)
```

## Diagnostic Test Points (from schematic pages 48, 88, 91-93)

### Step 1: PPBUS_AON
- **Probe: PPBUS_AON test point (FCT page 88: TPU040)**
- **Expect: ~12V**
- YES → go to Step 2
- NO → Fault in charging circuit / CD3217 (UF400/UF500) / Charger IC (U5200)
  - Check: USB-C connector pins (page 59)
  - Check: FF201 fuse (PPOCIN → PPVN_INT1_AONN, page 55)
  - Check: CHGR_AUX_OK signal (page 23)
  - Check: SYS_DETECT circuit (J5150 solder pads, Q5155, S5190/S5191)

### Step 2: PP3V8_AON
- **Probe: PP3V8_AON test point (desense page 97: CY120-CY12D)**
- **Expect: 3.8V**
- YES → go to Step 3
- NO → Fault in U5700 (SVR AON)
  - Check: P3V8AON_PWR_EN (is it asserted? Delayed by U5340)
  - Check: P3V8AON_FAULT_L (is it pulled low? → fault condition)
  - Check: Phase driver MOSFETs (Q5800 area, page 26)
  - Check: P3V8AON high bandwidth ISENSE (page 94, UN200-UN230 amplifiers)

### Step 3: PP5V_S2
- **Probe: PP5V_S2 (desense page 97: CY130-CY131)**
- **Expect: 5.15V**
- YES → go to Step 4
- NO →
  - Check: P5VS2_PWR_EN enable signal
  - Check: UC300 (LT8642S) — input: PPBUS_AON, output: PP5V_S2
  - Check: PP5V_S2 discharge circuit (QC420, page 38)
  - Check: 5VS2_EN turn off delay circuit (DC401, RC401/RC402, page 38)

### Step 4: PMU LDO Outputs
Probe these AON and S2 rails:
- **PP3V3_AON** → 3.3V (UC100 external LDO, page 36)
- **PP1V8_AON** → 1.8V (UC120 external LDO, page 36)
- **PP1V25_S2** → 1.25V (SPMU BUCK 13)
- **PP1V8_S2** → 1.8V (MPMU BUCK 3)
- **PP3V3_S2** → 3.3V (UC710 standalone buck)
- ALL YES → Fault is downstream of PMU. Check SoC domains.
- ANY NO → go to Step 5

### Step 5: Thermal Imaging / Isolation
- Apply thermal camera to the shorted rail
- **Hot chip found?**
  - YES → Replace that chip
  - NO → Check the PMU generating the missing rail:
    - SPMU rails missing → U7700 fault
    - MPMU rails missing → U8100 fault
    - External LDO rails missing → UC100/UC120 fault

---

## Full Power Node Map

### Stage 1: USB-C Input (5V)
| Node | Voltage | IC | If Missing |
|------|---------|-----|------------|
| PPVBUS_USBC0 | 5V→20V | UF400 (CD3217) | Cable/connector/CD3217 fault |
| PPVBUS_USBC1 | 5V→20V | UF500 (CD3217) | Cable/connector/CD3217 fault |

### Stage 3: Charger → PPBUS
| Node | Voltage | IC | If Missing |
|------|---------|-----|------------|
| PPOCIN_USBC_AON | ~5-20V | FF201 fuse | Blown fuse / CD3217 not passing VBUS |
| PPBUS_AON | 12.6V | U5200 (Suona B379 charger) | Charger IC / CD3217 / battery disconnect |

### Stage 4: SVR AON → 3V8
| Node | Voltage | IC | If Missing |
|------|---------|-----|------------|
| PP3V8_AON | 3.8V | U5700 (30A) | U5700 / phase MOSFETs fault |

### Stage 5a: MPMU (U8100) Outputs
| Output | Rail | Voltage | Buck/LDO | State |
|--------|------|---------|----------|-------|
| PCPU | PPVDD_PCPU_AWAKE | DVFS | BUCK 0 | AWAKE |
| GPU | PPVDD_GPU_AWAKE | DVFS | BUCK 1 | AWAKE |
| SOC | PPVDD_SOC_S1 | Var | BUCK 2 | S1 |
| 1V8 S2 | PP1V8_S2 | 1.8V | BUCK 3 | S2 |
| 1V8 AWK | PP1V8_AWAKE | 1.8V | BUCK 3 SW1 | AWAKE |
| SRAM | PPVDD_CPU_SRAM_AWAKE | DVFS | BUCK 7 | AWAKE |
| DISP | PPVDD_DISP_S1 | Var | BUCK 8 | S1 |
| DCS | PPVDD_DCS_S1 | Var | BUCK 9 | S1 |
| ECPU | PPVDD_ECPU_AWAKE | DVFS | BUCK 11 | AWAKE |
| LDO PRE | PP1V2_LDO_PREREG | 1.2V | BUCK 14 | AWAKE |
| 1V2 S2 | PP1V2_S2 | 1.2V | LDO 3 | S2 |
| INT | PP1V5_VLDOINT_MPMU | 1.05V | LDOINT | AON |

### Stage 5b: SPMU (U7700) Outputs
| Output | Rail | Voltage | Buck/LDO | State |
|--------|------|---------|----------|-------|
| DRAM | PPVDS_S2M_DRAM | Var | BUCK 4 | S2 |
| SRAM | PP0V764_S1_SRAM | 0.764V | BUCK 5 | S1 |
| NAND 2V5 | PP2V5_AWAKE_NAND | 2.5V | BUCK 6 | AWAKE |
| VDDOL | PPVDS_S1_VDDOL | Var | BUCK 10 | S1 |
| ECPU 2 | PPVDD_ECPU_AWAKE | DVFS | BUCK 12 | AWAKE |
| NAND 0V88 | PP0V88_AWAKE5W_NAND | 0.88V | BUCK 12 SW6 | AWAKE |
| NAND VCC | PPVDS_MAME5W_NAND | Var | BUCK 12 SW7 | AWAKE |
| 1V25 S2 | PP1V25_S2 | 1.25V | BUCK 13 | S2 |
| 1V25 IO | PP1V25_AWAKE_IO | 1.25V | BUCK 13 SW3 | AWAKE |
| NAND VCCQ | PP1V25_AWAKE5W_VCCQ | 1.25V | BUCK 13 SW5 | AWAKE |
| PLL | PP1V2_MAME_PLL | 1.2V | BUCK 14/LDO8 | AWAKE |
| VDD_LOW | PP0V72_S2_VDD_LOW | 0.72V | LDO 4 | S2 |
| CIO | PPVDS5_S2M_CIO | 0.855V | LDO 11 | S2 |
| VDD_FIXED | PP0V805_S1_VDD_FIXED | 0.805V | LDO 12 | S1 |
| CIO 1V2 | PP1V2_S2_CIO | 1.2V | LDO 20 | S2 |

### NC LDOs (Not Connected — confirmed from Power Aliases pages 101-102)
| LDO | Net Name | Status |
|-----|----------|--------|
| SPMU LDO 5 | NC_SPMU_VLDO5 | Not connected |
| SPMU LDO 6 | NC_SPMU_VLDO6 | Not connected |
| SPMU LDO 9 | NC_SPMU_VLDO9 | Not used for external power |
| SPMU LDO 10 | NC_SPMU_VLDO10 | Not connected |
| SPMU LDO 15 | NC_SPMU_VLD015 | Not connected |
| SPMU LDO 17 | NC_SPMU_VLD017 | Not connected |
| SPMU LDO 18 | NC_SPMU_VLD018 | Not connected |
| MPMU LDO 2 | NOT USED | Not connected |
| MPMU LDO 13 | NC_MPMU_VLD013 | Not connected |
| MPMU LDO 14 | NC_MPMU_VLD014 | Not connected |
| MPMU LDO 16 | NC_MPMU_VLD016 | Not connected |
| MPMU LDO 19 | NOT USED | Not connected |

### Stage 6: Standalone VRs & External LDOs
| Node | Voltage | IC | Enable | If Missing |
|------|---------|-----|--------|------------|
| PP3V3_AON | 3.3V | UC100 (LP5907UVX) | P3V3_AON_EN | UC100 / enable fault |
| PP1V8_AON | 1.8V | UC120 (LP5907UVX) | P1V8_AON_EN | UC120 / enable fault |
| PP5V_S2 | 5.15V | UC300 (LT8642S) | P5VS2_PWR_EN | UC300 / enable fault |
| PP3V3_S2 | 3.3V | UC710 (SN621371) | P3V3S2_PWR_EN | UC710 / enable fault |

### Stage 7: Display Power (unique to MBP 13" M1)
| Node | Voltage | IC | Function |
|------|---------|-----|----------|
| PP5V_SW_LCD | 5V | UP701 (SLG5AP1564V) | Panel 5V |
| PP3V3_SW_LCD | 3.3V | UP701 | Panel 3.3V |
| PPVOUT_LCDBKLT | Variable | UP800 (CK1714 BEN) | LCD backlight boost |
| PPVOUT_KBDLED | Variable | UP800 (BEN KBD out) | Keyboard backlight |

### DFR (Touch Bar) Power — A2338 SPECIFIC
| Node | Voltage | IC | Function |
|------|---------|-----|----------|
| PP16V_TOUCHID | 16V | UT600 boost | TouchID power |
| PP3V0_TOUCHID | 3.0V | UT610 LDO | TouchID 3V |
| PP1V85_TOUCHID | 1.85V | UT620 LDO | TouchID 1.85V |
| PP1V8_AWAKE_DFR | 1.8V | UT700 LDO | DFR 1.8V |
| PP3V3_AWAKE_DFR | 3.3V | UT710 LDO | DFR 3.3V |

### Fan Power — A2338 SPECIFIC (no fan on MBA)
| Node | Voltage | IC | Function |
|------|---------|-----|----------|
| PP5V_S2_TO_FAN | 5V | From PP5V_S2 | Fan power supply |
| FAN_RT_PWM | PWM | QE500 (NTS4C569N) | Fan speed control |
| FAN_RT_TACH | Tach | JE501 connector | Fan speed feedback |
