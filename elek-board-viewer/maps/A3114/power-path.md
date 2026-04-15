# A3114 Power Path -- Human-Readable Diagnostic Reference

Board: A3114 (MacBook Air 13" M3, 820-03285, X2819/MLB)

**WARNING: This is a MacBook AIR 13-inch with M3 chip. NOT a Pro, NOT M4.**

## M3 vs M2 (A2681) Key Differences

- Rail naming: AWAKE instead of MAME (e.g. PPVDD_AWAKE_PCPU not PPVDD_MAME_PCPU)
- WiFi module: Willamette (was Typhoon)
- USB-C retimers: MACAW (UF600/UF650) instead of separate repeater + level shifter
- MagSafe controller: ACE3 U5900 (was AAROXA9PA0830)
- Audio: 6x TAWANG amplifiers (was fewer)
- MPMU NC LDOs: 1, 3, 5, 14, 16 (different from A2681)
- SPMU NC LDOs: 6, 15, 17, 16, 18 (different from A2681)
- Boost rails: 5.0V (was 3.8V on A2681)
- VDD_FIXED: 0.78V from SPMU LDO 12 (was 0.75V)
- LDOINT: 1.5V (was 1.05V on A2681)
- PP3V_AON from MPMU LDO 2 (was LDO 5 on A2681)
- Camera filter uses PP5V_S2 (was PP3V_S2 on A2681)

## Power Chain Overview

```
USB-C 5V -> UF400/UF500 (Port Controllers) -> Charger IC (page 30) -> PPBUS_AON (12.6V)
                                                                           |
                                                                      U5700 (SVR AON)
                                                                           |
                                                                     PP3V8_AON (3.8V)
                                                                      +----+----+
                                                                 U7700 (SPMU)  U8100 (MPMU)
                                                                      |           |
                                                                 SPMU Bucks   MPMU Bucks
                                                                 SPMU LDOs    MPMU LDOs
                                                                      |           |
                                                                 +--------+-------+
                                                                          |
                                                                     SoC U6000 (M3)
                                                                 (PCPU/ECPU/GPU/SRAM)
```

## Diagnostic Test Points

### Step 1: PPBUS_AON
- **Probe: C5704**
- **Expect: 12V**
- YES -> go to Step 2
- NO -> Fault in charging circuit / Port Controller (UF400/UF500) / Charger IC
  - Check: USB-C connector pins, CC line continuity
  - Check: MagSafe D5401 diode, U5900 ACE3 controller
  - Check: F5600 fuse (MagSafe power, 4A-32V, CRITICAL)
  - Check: BMU SYS_DETECT circuit (J5150, Q5100/Q5190)

### Step 2: PP3V8_AON
- **Probe: PP3V8_AON output caps (page 35-36)**
- **Expect: 3.8V**
- YES -> go to Step 3
- NO -> Fault in U5700 (SVR AON, APN 351002645)
  - Check: P3V8AON_PWR_EN (enable signal)
  - Check: P3V8AON_FAULT_L (fault signal -- pulled low?)
  - Check: U5910 current sense output (MAX41033ANT+)
  - Check: PP3V8_AON_VDDMAIN branch for shorts

### Step 3: PP5V_S2
- **Probe: PP5V_S2 output caps**
- **Expect: 5.15V**
- YES -> go to Step 4
- NO ->
  - Check P5VS2_PWR_EN gating logic (UC637 inverter + UC630 AND gate, page 52)
  - Check UC300 (LN84243-1) for damage
  - Check if PMU_CRASH_L is asserted (blocks P5VS2_PWR_EN via UC637)

### Step 4: MPMU (U8100) LDO Outputs
- **C8320 -> 1.8V** (PP1V8_AON_MPMU, LDO 9)
- **C8330/C8331 -> varies** (MPMU LDO 9B: 1.2V)
- **C83A0 -> 3.3V** (MPMU LDO 20 CIO decoupling? Check)
- **C8350/C8351 -> 1.2V** (PP1V2_S2_CIO, LDO 20)
- **C8360/C8361/C8362 -> 1.2V** (PP1V2_AWAKE_PLL, LDO 8)
- ALL YES -> Fault is downstream of PMU. Investigate SoC domains.
- ANY NO -> go to Step 5

### Step 5: Thermal Imaging
- Apply thermal camera to the shorted rail
- **Hot chip found?**
  - YES -> Replace that chip
  - NO -> U8100 (MPMU) is dead -> replace U8100

---

## Full Power Node Map

### Stage 1: USB-C Input (5V)
| Node | Voltage | IC | If Missing |
|------|---------|-----|------------|
| PPVBUS_USBC0 | 5V->20V | UF400 (ATC0) | Cable/connector/port controller fault |
| PPVBUS_USBC1 | 5V->20V | UF500 (ATC1) | Cable/connector/port controller fault |
| PPVBUS_USBC5 | 5V->20V | U5900 (ACE3) | MagSafe D5401/ACE3/F5600 fault |

### Stage 3: Charger -> PPBUS
| Node | Voltage | IC | Probe | If Missing |
|------|---------|-----|-------|------------|
| PPCON_ACNSW | ~5-20V | Input path | -- | Port controller not passing VBUS |
| PPBUS_AON | 12.6V | Charger IC | **C5704** | Charger IC / port controller fault |

### Stage 4: SVR AON -> 3V8
| Node | Voltage | IC | If Missing |
|------|---------|-----|------------|
| PP3V8_AON | 3.8V | U5700 (30A) | U5700 fault, P3V8AON_PWR_EN not asserted |
| PP3V8_AON_VDDMAIN | 3.8V | Distribution | Short on VDDMAIN |
| PP3V8_AON_WLBT | 3.8V | Distribution | WiFi/BT Willamette module short |

### Stage 5a: MPMU (U8100) Outputs
| Output | Rail | Voltage | Buck/LDO | State |
|--------|------|---------|----------|-------|
| PCPU | PPVDD_AWAKE_PCPU | DVFS | BUCK 0 | AWAKE |
| GPU | PPVDD_AWAKE_GPU | DVFS | BUCK 1 | AWAKE |
| SOC | PPVDD_S1_SOC | Variable | BUCK 2 | S1 |
| 1V8 S2 | PP1V8_S2 | 1.8V | BUCK 3 | S2 |
| 1V8 AWAKE | PP1V8_AWAKE | 1.8V | BUCK 3 SW1 | AWAKE |
| DPG | PP1V8_S2SM_DPG | 1.8V | BUCK 3 SW2 | S2 |
| Memory | PP1V85_S2SM_VDDQ5 | 1.85V | BUCK 4 | S2 |
| SRAM | PPVDD_AWAKE_CPU_SRAM | DVFS | BUCK 7 | AWAKE |
| DCS | PPVDD_S1_DCS | Variable | BUCK 9 | S1 |
| ECPU | PPVDD_AWAKE_ECPU | DVFS | BUCK 11 | S1/AWAKE |
| 1V25 S2 | PP1V25_S2 | 1.25V | BUCK 13 | S2 |
| 3D | PP1V25_AWAKE_3D | 1.25V | BUCK 13 SW3 | AWAKE |
| NC | -- | NC | LDO 1 | NC |
| 3V AON | PP3V_AON | 3.0V | LDO 2 | AON |
| NC | -- | NC | LDO 3 | NC |
| NC | -- | NC | LDO 5 | NC |
| 3V3 LDO | PP3V3_S2_LDO | 3.3V | LDO 7 | S2 |
| PLL | PP1V2_AWAKE_PLL | 1.2V | LDO 8 | AWAKE |
| AON 1V8 | PP1V8_AON_MPMU | 1.8V | LDO 9 | AON |
| AON 1V2 | PP1V2_AON_MPMU | 1.2V | LDO 9B | AON |
| CIO | PPVDS5_S2SM_CIO | 0.855V | LDO 10 | S2 |
| CIO 1A | PPVBS5_S2SM_CIO | variable | LDO 11 | S2 |
| NC | -- | NC | LDO 13 | NC |
| NC | -- | NC | LDO 14 | NC |
| NC | -- | NC | LDO 16 | NC |
| CIO 1V2 | PP1V2_S2_CIO | 1.2V | LDO 20 | S2 |
| INT | PP1V5_LDOINT_MPMU | 1.5V | LDOINT | AON |

### Stage 5b: SPMU (U7700) Outputs
| Output | Rail | Voltage | Buck/LDO | State |
|--------|------|---------|----------|-------|
| SRAM | PP0V75_S1_SRAM | 0.75V | BUCK 5 | S1 |
| NAND VCC | PP1V25_AWAKE_NAND_VCC | 1.25V | BUCK 6 | AWAKE |
| ESTP | PPVDD_S1_ESTP | Variable | BUCK 8 | S1 |
| VDDOL | PP0V5_S1_VDDOL | 0.5V | BUCK 10 | S1 |
| PCPU 2 | PPVDD_AWAKE_PCPU_2 | DVFS | BUCK 12 | AWAKE |
| NAND VDD | PP3V8_AWAKE_NAND_VDD | 3.8V | BUCK 12 SW6/7 | AWAKE |
| NAND VCC5 | PP1V25_AWAKE_NAND_VCC5 | 1.25V | BUCK 13 SW5 | AWAKE |
| SPMU GP10 | PP1V8_AWAKE_SPMU_GP10 | 1.8V | BUCK 3 SW4 | AWAKE |
| AMPH | PP1V12_S2SM_AMPH | 1.12V | BUCK 14 | S2 |
| VDD_LOW | PP0V72_S2_VDD_LOW | 0.72V | LDO 4 | S2 |
| NC | -- | NC | LDO 6 | NC |
| AON 1V8 | PP1V8_AON_SPMU | 1.8V | LDO 9 | AON |
| AON 1V2 | PP1V2_AON_SPMU | 1.2V | LDO 9B | AON |
| VDD_FIXED | PP0V78_S1_VDD_FIXED | 0.78V | LDO 12 | S1 |
| NC | -- | NC | LDO 15 | NC |
| NC | -- | NC | LDO 17 | NC |
| NC | -- | NC | LDO 18 | NC |
| INT | PP1V5_LDOINT_SPMU | 1.5V | LDOINT | AON |

### Stage 6: Standalone VRs
| Node | Voltage | IC | Enable | If Missing |
|------|---------|-----|--------|------------|
| PP5V_S2 | 5.15V | UC300 (LN84243-1) | P5VS2_PWR_EN | UC300 / enable gating fault |
| PP3V3_S2 | 3.3V | UC710 | EDP_PANEL_PWR_EN | UC710 / enable fault |

### Stage 7: Display Power
| Node | Voltage | IC | Function |
|------|---------|-----|----------|
| PPBUS_AONSW_LCD | 12.6V | UP950 (5A fuse) | Backlight boost input |
| PPVOUT_LCDBKLT | Variable | LP800 (BEN) | LED string drive |
| PP_AVDD_DISP | ~4.85V | San Diego (page 85) | Panel AVDD |
| PP_VGH/VGL | +/- V | San Diego | Gate drivers |
| PP3V3_SW_LCD | 3.3V | UC710 derived | Panel logic |

### Load Switches (page 54)
| Node | Voltage | IC | Current Limit | Enable |
|------|---------|-----|---------------|--------|
| PP3V3_S2_HOLD_IPD | 3.3V | UC630 LDO | 350mA | IPD_PWR_EN_GATE |
| PP5V_S2_HOLD_IPD | 5V | UC840 (TPG2300570) | 490mA | PP5V_S2_HOLD_IPD_EN |
| PPBUS_AONSW_IPD | 12.6V | UC850 (TPG2300550) | 3A | PPBUS_AONSW_IPD_EN |
| PP1V8_S2SW | 1.8V | UC820 (SN74AUP1T17) | -- | SPDCL_PWR_EN |
