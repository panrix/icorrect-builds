# A2918 Power Path — Human-Readable Diagnostic Reference

Board: A2918 (MacBook Pro 14" M3, 820-02757, X2482/MLB)

## Power Chain Overview

```
USB-C 5V → CD3217 (UF400/UF500) → Charger IC (U5200) → PPBUS_AON (12.6V)
                                                              │
                                                         U5700 (SVR AON)
                                                              │
                                                        PP3V8_AON (3.8V)
                                                    ┌─────────┼─────────┐
                                               U7700 (SPMU)        U8100 (MPMU)
                                                    │                    │
                                               SPMU Bucks          MPMU Bucks
                                               SPMU LDOs           MPMU LDOs
                                                    │                    │
                                                    └────────┬──────────┘
                                                             │
                                                        SoC U6000 (M3)
                                                    (PCPU/ECPU/GPU/SRAM)
```

## Key Differences from A2681 (MacBook Air M2)

| Feature | A2681 (Air M2) | A2918 (Pro M3) |
|---------|---------------|----------------|
| SoC | M2 (U6000) | M3 (U6000) |
| 5V Buck | UC300 | UC260 (TPS62130) |
| 3V3 Buck | UC710 | No standalone 3V3 buck — uses MPMU LDO 7 |
| 1V8 Switch | None listed | UC840 (SLG04057TT) |
| HDMI | N/A | UH700 (Cobra) + UH908 (0.95V buck) |
| SD Card | N/A | UK550 (GL9755) |
| WiFi/BT | Typhoon | Willamette |
| USB-C 5V Reg | Not separate | LF800 (5.23V, 5A) |
| MagSafe | UPC5 area | UPC5 (CD3217/CD3218) on page 32 |
| SPMU BUCK 7 | BUCK 7 not on SPMU | SPMU BUCK 7 = SRAM phase 2 |
| Test Points | C5704, C8450, C8440 | TPU633, TPU630, TPU636 (FCT pages) |

## Diagnostic Test Points (from FCT pages 113-114)

### Step 1: PPBUS_AON
- **Probe: TPU633**
- **Expect: 12V**
- YES → go to Step 2
- NO → Fault in charging circuit / CD3217 (UF400/UF500) / Charger IC (U5200 area)
  - Check: USB-C connector pins, CC line continuity
  - Check: MagSafe Q5401 MOSFET pair
  - Check: F5601 fuse (MagSafe power path, page 33)

### Step 2: PP3V8_AON
- **Probe: TPU630**
- **Expect: 3.8V**
- YES → go to Step 3
- NO → Fault in U5700 (SVR AON) or phase drivers
  - Check: PPVAON_PWR_EN (enable signal — delayed by D5340/R5340/R5341)
  - Check: PPVAON_FAULT_L (fault signal — is it pulled low?)
  - Check: PP3V8_AON current sense (IMVR, page 57)

### Step 3: PP5V_S2
- **Probe: TPU636**
- **Expect: 5V**
- YES → go to Step 4
- NO →
  - UC260 (TPS62130) fault or PPV5S2TS_PWR_EN not asserted
  - Check inductor and diode components around UC260
  - If still no 5V: check PPBUS_AON input to UC260

### Step 4: U8100 (MPMU) LDO Outputs
- Probe MPMU LDO test points from analog probe area (page 47):
  - PP1V8_AON_MPMU (LDO 9) → expect 1.8V
  - PP1V2_AON_MPMU (LDO 9B) → expect 1.2V
  - PP3V3_S2M_SNR (LDO 13) → expect 3.3V
  - PP3V3_S2_LDO (LDO 7) → expect 3.3V
  - PP1V05_LDOINT_MPMU (LDOINT) → expect 1.05V
- ALL YES → Fault is downstream of PMU. Investigate SoC domains.
- ANY NO → go to Step 5

### Step 5: Thermal Imaging
- Apply thermal camera to the shorted rail
- **Hot chip found?**
  - YES → Replace that chip
  - NO → U8100 (MPMU) is dead → replace U8100

---

## Full Power Node Map

### Stage 1: USB-C Input (5V)
| Node | Voltage | IC | Probe | If Missing |
|------|---------|-----|-------|------------|
| PPVBUS_USBC0 | 5V→20V | UF400 (CD3217) | CF401 | Cable/connector/CD3217 fault |
| PPVBUS_USBC1 | 5V→20V | UF500 (CD3217) | CF503 | Cable/connector/CD3217 fault |
| PPVBUS_USBC5 | 5V→20V | UPC5 controller | J5401 pins | Q5401/controller fault |

### Stage 3: Charger → PPBUS
| Node | Voltage | IC | Probe | If Missing |
|------|---------|-----|-------|------------|
| PPDCIN_USBC_AON | ~5-20V | Input path | — | CD3217 not passing VBUS |
| PPBUS_AON | 12.6V | Charger IC (U5200) | **TPU633** | Charger IC / CD3217 / U5200 fault |

### Stage 4: SVR AON → 3V8
| Node | Voltage | IC | Probe | If Missing |
|------|---------|-----|-------|------------|
| PP3V8_AON | 3.8V | U5700 (30A) | **TPU630** | U5700 fault / phase driver issue |
| PP3V8_AON_VDDMAIN | 3.8V | Distribution | — | Short on VDDMAIN |
| PP3V8_AON_WLBT_1SNS | 3.8V | Distribution | — | WiFi/BT module short |
| PP3V8_AON_HDMI_1SNS | 3.8V | Distribution | — | HDMI circuit short |

### Stage 5a: MPMU (U8100) Outputs
| Output | Rail | Voltage | Buck/LDO | State |
|--------|------|---------|----------|-------|
| PCPU | PPVDD_MAME_PCPU | DVFS | BUCK 0 | AWAKE |
| GPU | PPVDD_MAME_GPU | DVFS | BUCK 1 | AWAKE |
| 0V5 SOC | PP0V5_S1_SOC | 0.5V | BUCK 2 | S1 |
| 1V21 | PP1V21_S2 | 1.21V | BUCK 3 | S2 |
| 1V8 | PP1V8_MAME (PP1V8_S2) | 1.8V | BUCK 3 SW1 | S2 |
| Memory Q5 | PP1V85_S2M_VDDQ5 | 1.85V | BUCK 4 | S2 |
| SRAM | PPVDD_MAME_CPU_SRAM | DVFS | BUCK 7 | AWAKE |
| DCS | PP0V5_S1_DCS | 0.5V | BUCK 9 | S1 |
| Memory Q | PPVDD_S2M_VDDQ | Variable | BUCK 10 | S2 |
| ECPU | PPVDD_MAME_ECPU | DVFS | BUCK 11 | AWAKE |
| 1V25 | PP1V25_S2 | 1.25V | BUCK 13 | S2 |
| 3D | PP1V25_MAME_3D | 1.25V | BUCK 13 SW3 | AWAKE |
| PLL | PP1V2_MAME_PLL | 1.2V | LDO 8 | AWAKE |
| AON 1V8 | PP1V8_AON_MPMU | 1.8V | LDO 9 | AON |
| AON 1V2 | PP1V2_AON_MPMU | 1.2V | LDO 9B | AON |
| CIO | PPVDS5_S2SM_CIO | 0.855V | LDO 10 | S2 |
| STOP | PP0V83_S1_STOP | 0.83V | LDO 11 | S1 |
| SNR | PP3V3_S2M_SNR | 3.3V | LDO 13 | S2 |
| S60 | PP3V3_S2M_S60 | 3.3V | LDO 14 | S2 |
| INT | PP1V05_LDOINT_MPMU | 1.05V | LDOINT | AON |

### Stage 5b: SPMU (U7700) Outputs
| Output | Rail | Voltage | Buck/LDO | State |
|--------|------|---------|----------|-------|
| SRAM ret | PP0V75_S1_SRAM | 0.75V | BUCK 5 | S1 |
| NAND VCC | PP1V25_MAME_NAND_VCC | 1.25V | BUCK 6 | AWAKE |
| SRAM ph2 | PPVDD_MAME_CPU_SRAM_2 | DVFS | BUCK 7 | AWAKE |
| ESTP | PP0V5_S1_ESTP | 0.5V | BUCK 8 | S1 |
| VDDOL | PP0V5_S1_VDDOL | 0.5V | BUCK 10 | S1 |
| PCPU 2 | PPVDD_MAME_PCPU_2 | DVFS | BUCK 12 | AWAKE |
| NAND VDDL | PP3V8_MAME_NAND_VDDL | 3.8V | BUCK 12 SW6/7 | AWAKE |
| NAND VCC5 | PP1V25_MAME_NAND_VCC5 | 1.25V | BUCK 13 SW5 | AWAKE |
| AMPH | PP1V12_S2M_AMPH | 1.12V | BUCK 14 | S2 |
| VDD_LOW | PP0V72_S2_VDD_LOW | 0.72V | LDO 4 | S2 |
| AON 1V8 | PP1V8_AON_SPMU | 1.8V | LDO 9 | AON |
| AON 1V2 | PP1V2_AON_SPMU | 1.2V | LDO 9B | AON |
| VDD_FIXED | PP0V75_S2_VDD_FIXED | 0.75V | LDO 12 | S2 |

### Stage 6: Standalone VRs
| Node | Voltage | IC | Probe | Enable | If Missing |
|------|---------|-----|-------|--------|------------|
| PP5V_S2 | 5.14V/5.232V | UC260 (TPS62130) | **TPU636** | PPV5S2TS_PWR_EN | UC260 / enable fault |
| PP1V8_S2SW | 1.8V | UC840 (SLG04057TT) | — | PV001_PWR_EN | UC840 / enable fault |
| PP5V_S2_UPC | 5.23V | LF800 | — | — | LF800 fault |

### Pro-Specific Power
| Node | Voltage | IC | Function |
|------|---------|-----|----------|
| PP0V95_MAME2W_DFCHM1 | 0.95V | UH908 | HDMI 0.95V buck |
| PP3V3_S2_HDMI_LDO | 3.3V | HDMI LDO | HDMI 3.3V |
| PP3V3_MAME_S60 | 3.3V | SD card regulator | SD card power |
| PP3V8_AON_HDMI_1SNS | 3.8V | PP3V8_AON branch | HDMI main power |

### Display Power
| Node | Voltage | IC | Function |
|------|---------|-----|----------|
| PPBUS_AON_BKLT_1SNS | 12.6V | Load switch | Backlight boost input |
| PP3V29_BCKN_MAME2W | 3.29V | Backlight regulator | Backlight feed |
| PP3V8_MAME2W_TCON | 3.8V | TCON power | Display TCON |
