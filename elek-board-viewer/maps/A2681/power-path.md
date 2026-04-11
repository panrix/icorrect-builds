# A2681 Power Path — Human-Readable Diagnostic Reference

Board: A2681 (MacBook Air M2, 820-02536, X2203/MLB)

## Power Chain Overview

```
USB-C 5V → CD3217 (UF400/UF500) → Charger IC (U5200) → PPBUS_AON (12.6V)
                                                              │
                                                         U5700 (SVR AON)
                                                              │
                                                        PP3V8_AON (3.8V)
                                                         ┌────┴────┐
                                                    U7700 (SPMU)  U8100 (MPMU)
                                                         │           │
                                                    SPMU Bucks   MPMU Bucks
                                                    SPMU LDOs    MPMU LDOs
                                                         │           │
                                                    └────────┬───────┘
                                                             │
                                                        SoC U6000
                                                    (PCPU/ECPU/GPU/SRAM)
```

## Diagnostic Test Points (from Ricky's step-by-step workflow)

### Step 1: PPBUS_AON
- **Probe: C5704**
- **Expect: 12V**
- YES → go to Step 2
- NO → Fault in charging circuit / CD3217 (UF400/UF500) / Charger IC (U5200 area)
  - Check: USB-C connector pins, CC line continuity
  - Check: MagSafe Q5401 MOSFET pair
  - Check: F5601 fuse (MagSafe power)

### Step 2: PP3V8_AON
- **Probe: C8450**
- **Expect: 3.8V**
- YES → go to Step 3
- NO → Fault in U5700 (SVR AON) / Q5800
  - Check: PPVAON_PWR_EN (enable signal — is it asserted?)
  - Check: PPVAON_FAULT_L (fault signal — is it pulled low?)
  - Check: U5910 current sense output
  - Known fault: PP3V8_AON_VDDMAIN short → probe C7705

### Step 3: PP5V_S2
- **Probe: C8440**
- **Expect: 5V**
- YES → go to Step 4
- NO →
  - Check C8430 (diode mode — shorted?)
  - Check L8430 (diode mode — open/OL?)
  - Replace faulty component → retest C8440
  - If still no 5V: UC300 fault or P5VS2_PWR_EN not asserted

### Step 4: U8100 (MPMU) LDO Outputs
- **C8320 → 1.8V** (PP1V8_AON_MPMU, LDO 9)
- **C8330 → 3.3V** (PP3V3_S2M_SNR, LDO 13)
- **C83A0 → 3.3V** (MPMU LDO variant)
- **C8360 → 1.2V** (PP1V2_AON_MPMU, LDO 9B)
- **C8380 → 1.5V** (MPMU LDO output)
- ALL YES → Fault is downstream of PMU. Investigate SoC domains.
- ANY NO → go to Step 5

### Step 5: Thermal Imaging
- Apply thermal camera to the shorted rail
- **Hot chip found?**
  - YES → Replace that chip
    - PP1V8_AON shorted → suspect UC870
  - NO → U8100 (MPMU) is dead → replace U8100

---

## Full Power Node Map

### Stage 1: USB-C Input (5V)
| Node | Voltage | IC | Probe | If Missing |
|------|---------|-----|-------|------------|
| PPVBUS_USBC0 | 5V→20V | UF400 (CD3217) | CF400 | Cable/connector/CD3217 fault |
| PPVBUS_USBC1 | 5V→20V | UF500 (CD3217) | CF501 | Cable/connector/CD3217 fault |
| MagSafe VBUS | 5V→20V | UPC5 controller | J5401 pins | Q5401/controller fault |

### Stage 2: PD Negotiation
| Signal | Function | Page |
|--------|----------|------|
| USBC0_CC1/CC2 | PD communication (port 0) | 63 |
| USBC1_CC1/CC2 | PD communication (port 1) | 64 |
| SPI_UPC0/UPC1 | CD3217 firmware ROM | 63, 64 |
| CHGR_AUX_OK | Charger ready indicator | 26 |

### Stage 3: Charger → PPBUS
| Node | Voltage | IC | Probe | If Missing |
|------|---------|-----|-------|------------|
| PPCON_ACNSW | ~5-20V | Input path | — | CD3217 not passing VBUS |
| PPBUS_AON | 12.6V | U5200 (charger) | **C5704** | Charger IC / CD3217 / U5200 fault |

### Stage 4: SVR AON → 3V8
| Node | Voltage | IC | Probe | If Missing |
|------|---------|-----|-------|------------|
| PP3V8_AON | 3.8V | U5700 (30A) | **C8450** | U5700 / Q5800 fault |
| PP3V8_AON_VDDMAIN | 3.8V | Distribution | **C7705** | Short on VDDMAIN (common fault) |
| PP3V8_AON_WLBT | 3.8V | Distribution | — | WiFi/BT module short |

### Stage 5a: MPMU (U8100) Outputs
| Output | Rail | Voltage | Buck/LDO | Probe | State |
|--------|------|---------|----------|-------|-------|
| PCPU | PPVDD_MAME_PCPU | DVFS | BUCK 0 | — | AWAKE |
| GPU | PPVDD_MAME_GPU | DVFS | BUCK 1 | — | AWAKE |
| 0V5 SOC | PP0V5_S1_SOC | 0.5V | BUCK 2 | — | S1 |
| 1V21 | PP1V21_S2 | 1.21V | BUCK 3 | — | S2 |
| 1V8 S2 | PP1V8_MAME (PP1V8_S2) | 1.8V | BUCK 3 SW1 | — | S2 |
| Memory | PP1V85_S2M_VDDQ5 | 1.85V | BUCK 4 | — | S2 |
| SRAM | PPVDD_MAME_CPU_SRAM | DVFS | BUCK 7 | — | AWAKE |
| DCS | PP0V5_S1_DCS | 0.5V | BUCK 9 | — | S1 |
| ECPU | PPVDD_MAME_ECPU | DVFS | BUCK 11 | — | AWAKE |
| 1V25 | PP1V25_S2 | 1.25V | BUCK 13 | — | S2 |
| 3D | PP1V25_MAME_3D | 1.25V | BUCK 13 SW3 | — | AWAKE |
| AON 1V8 | PP1V8_AON_MPMU | 1.8V | LDO 9 | **C8320** | AON |
| AON 1V2 | PP1V2_AON_MPMU | 1.2V | LDO 9B | **C8360** | AON |
| 3V AON | PP3V_AON | 3.0V | LDO 5 | — | AON |
| PLL | PP1V12_MAME_PLL | 1.12V | LDO 8 | — | AWAKE |
| CIO | PPVDS5_S2SM_CIO | 0.855V | LDO 10 | — | S2 |
| STOP | PP0V83_S1_STOP | 0.83V | LDO 11 | — | S1 |
| SNR | PP3V3_S2M_SNR | 3.3V | LDO 13 | **C8330** | S2 |
| CIO 3V3 | PP3V3_S2SM_CIO | 3.3V | LDO 14 | — | S2 |
| INT | PP1V05_LDOINT_MPMU | 1.05V | LDOINT | — | AON |

### Stage 5b: SPMU (U7700) Outputs
| Output | Rail | Voltage | Buck/LDO | State |
|--------|------|---------|----------|-------|
| SRAM | PP0V75_S1_SRAM | 0.75V | BUCK 5 | S1 |
| NAND VCC | PP1V25_MAME_NAND_VCC | 1.25V | BUCK 6 | AWAKE |
| ESTP | PP0V5_S1_ESTP | 0.5V | BUCK 8 | S1 |
| VDDOL | PP0V5_S1_VDDOL | 0.5V | BUCK 10 | S1 |
| PCPU 2 | PPVDD_MAME_PCPU_2 | DVFS | BUCK 12 | AWAKE |
| NAND VDDL | PP3V8_MAME_NAND_VDDL | 3.8V | BUCK 12 SW6/7 | AWAKE |
| AMPH | PP1V12_S2M_AMPH | 1.12V | BUCK 14 | S2 |
| VDD_LOW | PP0V72_S2_VDD_LOW | 0.72V | LDO 4 | S2 |
| VDD_FIXED | PP0V75_S1_VDD_FIXED | 0.75V | LDO 12 | S1 |
| AON 1V8 | PP1V8_AON_SPMU | 1.8V | LDO 9 | AON |
| AON 1V2 | PP1V2_AON_SPMU | 1.2V | LDO 9B | AON |

### Stage 6: Standalone VRs
| Node | Voltage | IC | Probe | Enable | If Missing |
|------|---------|-----|-------|--------|------------|
| PP5V_S2 | 5.15V | UC300 | **C8440** | P5VS2_PWR_EN | C8430 short / L8430 open |
| PP3V3_S2 | 3.3V | UC710 | — | P3V3S2_PWR_EN | UC710 / enable fault |

### Stage 7: Display Power
| Node | Voltage | IC | Function |
|------|---------|-----|----------|
| PPBUS_AONSW_LCD | 12.6V | UP950 (5A fuse) | Backlight boost input |
| Backlight | Variable | U6560 (BEN) | LED string drive |
| PP1V05_DISP | 1.05V | U6600 (Display PMU) | Panel logic |
| PP_AVDD_DISP | ~5.5V | U6600 | Panel AVDD |
| PP_VGH/VGL | ±V | U6600 | Gate drivers |
| Panel power | 3.0V | UP700/UP705 | Panel sequenced rails |
