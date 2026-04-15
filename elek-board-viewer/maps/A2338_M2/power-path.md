# A2338_M2 Power Path — Human-Readable Diagnostic Reference

Board: A2338_M2 (MacBook Pro 13" M2, 820-02773, X2487/MLB)

## Power Chain Overview

```
USB-C 5V → CD3217 (UF400/UF500) → Charger IC (U5200) → PPBUS_AON (12.6V)
                                                              |
                                                    U5709 SVR AON (30A)
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
                                                        SoC U6000
                                                    (PCPU/ECPU/GPU/SRAM)
```

## Key Differences from A2681 (MacBook Air M2)

- A2338_M2 has DFR (Touch Bar) with UT700/UT710 LDOs — A2681 does not
- A2338_M2 has a fan with DZE500 controller — A2681 is fanless
- A2338_M2 has Rasputin WiFi module — A2681 has Typhoon
- A2338_M2 SVR AON controller (U5709) is 30A ICC MAX (pages 28-29)
- A2338_M2 has 3 speaker amplifiers (AMP A/B/C) — A2681 has 2
- A2338_M2 5V S2 is TPS62130 (Vout=5.14V) — A2681 uses different regulator
- Same SPMU (U7700) and MPMU (U8100) topology as A2681

## Diagnostic Test Points

### Step 1: PPBUS_AON
- **Probe: PPBUS_AON capacitors / PBUS caps (page 27)**
- **Expect: 12V**
- YES -> go to Step 2
- NO -> Fault in charging circuit / CD3217 (UF400/UF500) / Charger IC (U5200)
  - Check: USB-C connector pins, CC line continuity
  - Check: CHGR_AUX_OK signal (page 26)
  - Check: SYS_DETECT at TP5100/TP5101 (page 24)
  - Check: Battery flex solder pads (J5150A)

### Step 2: PP3V8_AON
- **Probe: PP3V8_AON decoupling capacitors**
- **Expect: 3.8V**
- YES -> go to Step 3
- NO -> Fault in SVR AON controller / output stage
  - Check: PPVAON_PWR_EN (enable signal from U5349 delay circuit, page 26)
  - Check: PPVAON_FAULT_L (fault signal, page 28)
  - Check: U5910 current sense output (page 30)
  - Known fault: PP3V8_AON_VDDMAIN short -> probe VDDMAIN caps

### Step 3: PP5V_S2
- **Probe: PP5V_S2 output capacitors**
- **Expect: 5.14V**
- YES -> go to Step 4
- NO ->
  - Check P5VS2_PWR_EN enable signal (from MPMU GPIO, page 40)
  - Check UC260 (TPS62130) switching
  - Check P5VS2TPS_PGOOD (power good output)
  - Check 5VS2_EN turn off delay circuit (DC401/RC401, page 44)

### Step 4: MPMU (U8100) LDO Outputs
- Probe MPMU LDO outputs (see probe points page 41):
  - PP1V8_AON_MPMU (LDO 9) -> 1.8V
  - PP1V2_AON_MPMU (LDO 9B) -> 1.2V
  - PP3V3_S2M_SNS (LDO 13) -> 3.3V
  - PP1V12_MAME_PLL (LDO 8) -> 1.12V
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
| PPVBUS_USBC0 | 5V->20V | UF400 (CD3217) | Cable/connector/CD3217 fault |
| PPVBUS_USBC1 | 5V->20V | UF500 (CD3217) | Cable/connector/CD3217 fault |

### Stage 2: PD Negotiation
| Signal | Function | Page |
|--------|----------|------|
| USBC0_CC1/CC2 | PD communication (port 0) | 66 |
| USBC1_CC1/CC2 | PD communication (port 1) | 67 |
| SPI_UPC0/UPC1 | CD3217 firmware ROM | 64, 66, 67 |
| CHGR_AUX_OK | Charger ready indicator | 26 |

### Stage 3: Charger -> PPBUS
| Node | Voltage | IC | If Missing |
|------|---------|-----|------------|
| PPCON_ACNSW | ~5-20V | Input path | CD3217 not passing VBUS |
| PPBUS_AON | 12.6V | U5200 (charger) | Charger IC / CD3217 / U5200 fault |

### Stage 4: SVR AON -> 3V8
| Node | Voltage | IC | If Missing |
|------|---------|-----|------------|
| PP3V8_AON | 3.8V | U5709 SVR AON (30A) | SVR AON controller fault |
| PP3V8_AON_VDDMAIN | 3.8V | Distribution | Short on VDDMAIN (common fault) |
| PP3V8_AON_WLBT | 3.8V | Distribution | WiFi/BT module short |

### Stage 5a: MPMU (U8100) Outputs
| Output | Rail | Voltage | Buck/LDO | State |
|--------|------|---------|----------|-------|
| PCPU | PPVDD_MAME_PCPU | DVFS | BUCK 0 | AWAKE |
| GPU | PPVDD_MAME_GPU | DVFS | BUCK 1 | AWAKE |
| 0V5 SOC | PP0V5_S1_SOC | 0.5V | BUCK 2 | S1 |
| 1V21 | PP1V21_S2 | 1.21V | BUCK 3 | S2 |
| 1V8 S2 | PP1V8_MAME (PP1V8_S2) | 1.8V | BUCK 3 SW1 | S2 |
| Memory | PPVDD_S2M_VDDQ5 | 1.85V | BUCK 4 | S2 |
| SRAM | PPVDD_MAME_CPU_SRAM | DVFS | BUCK 7 | AWAKE |
| DCS | PP0V5_S1_DCS | 0.5V | BUCK 9 | S1 |
| ECPU | PPVDD_MAME_ECPU | DVFS | BUCK 11 | AWAKE |
| 1V25 | PP1V25_S2 | 1.25V | BUCK 13 | S2 |
| 3D | PP1V25_MAME_3D | 1.25V | BUCK 13 SW3 | AWAKE |
| AON 1V8 | PP1V8_AON_MPMU | 1.8V | LDO 9 | AON |
| AON 1V2 | PP1V2_AON_MPMU | 1.2V | LDO 9B | AON |
| 3V AON | PP3V_AON | 3.0V | LDO 2 | AON |
| PLL | PP1V12_MAME_PLL | 1.12V | LDO 8 | AWAKE |
| CIO | PPVDS5_S2SM_CIO | 0.855V | LDO 10 | S2 |
| STOP | PP0V83_S1_STOP | 0.83V | LDO 11 | S1 |
| SNS | PP3V3_S2M_SNS | 3.3V | LDO 13 | S2 |
| CIO 3V3 | PP3V3_S2SM_CIO | 3.3V | LDO 14 | S2 |
| C10 | PP1V2_S2_C10 | 1.2V | LDO 20 | S2 |
| INT | PP1V05_LDOINT_MPMU | 1.05V | LDOINT | AON |

### Stage 5b: SPMU (U7700) Outputs
| Output | Rail | Voltage | Buck/LDO | State |
|--------|------|---------|----------|-------|
| SRAM | PP0V75_S1_SRAM | 0.75V | BUCK 5 | S1 |
| NAND VCC | PP1V25_MAME_NAND_VCC | 1.25V | BUCK 6 | AWAKE |
| ESTP | PP0V5_S1_ESTP | 0.5V | BUCK 8 | S1 |
| VDDOL | PP0V5_S1_VDDOL | 0.5V | BUCK 10 | S1 |
| PCPU 2 | PPVDD_MAME_PCPU_2 | DVFS | BUCK 12 | AWAKE |
| NAND VDDL | PP3V8_MAME_NAND_VDDL | 3.8V | BUCK 12 SW6/7 | AWAKE |
| NAND VCC2 | PP1V25_MAME_NAND_VCC2 | 1.25V | BUCK 13 SW5 | AWAKE |
| GFS5 | PP1V8_MAME_SPMU_GFS5 | 1.8V | BUCK 3 SW4 | AWAKE |
| AMPH | PP1V12_S2M_AMPH | 1.12V | BUCK 14 | S2 |
| VDD_LOW | PP0V72_S2_VDD_LOW | 0.72V | LDO 4 | S2 |
| VDD_FIXED | PP0V75_S1_VDD_FIXED | 0.75V | LDO 12 | S1 |
| AON 1V8 | PP1V8_AON_SPMU | 1.8V | LDO 9 | AON |
| AON 1V2 | PP1V2_AON_SPMU | 1.2V | LDO 9B | AON |
| INT | PP1V05_LDOINT_SPMU | 1.05V | LDOINT | AON |

### Stage 6: Standalone VRs
| Node | Voltage | IC | Enable | If Missing |
|------|---------|-----|--------|------------|
| PP5V_S2 | 5.14V | UC260 (TPS62130) | P5VS2_PWR_EN | Enable fault / UC260 dead |
| PP3V3_S2 | 3.3V | UC710 | P3V3S2_PWR_EN | UC710 / enable fault |
| PP5V_S2_UPC | 5.23V | UF800 | P5VUSBC01_EN | UF800 fault |
| PP1V8_S2M | 1.8V | UC820 | PVDDL_PWR_EN_1445 | UC820 / enable fault |

### Stage 7: Display / DFR Power
| Node | Voltage | IC | Function |
|------|---------|-----|----------|
| PPBUS_AONSW_LCD | 12.6V | Load switch | Backlight boost input |
| PPVOUT_LCDBKLT | Variable | LCD BKL boost | LED string drive |
| PP5V_SM_LCD | 5V | From PP5V_S2 | Display panel 5V |
| PP1V8_DFR | 1.8V | UT700 | Touch Bar logic 1.8V |
| PP3V3_DFR | 3.3V | UT710 | Touch Bar logic 3.3V |
| PPVOUT_KBDLED | Variable | KBD BKL driver | Keyboard backlight |
