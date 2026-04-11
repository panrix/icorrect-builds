# A2442 Power Path — Human-Readable Diagnostic Reference

Board: A2780 (MacBook Pro 16" M2 Pro/Max, 820-02652, J416)

## Power Chain Overview

```
USB-C 5V → CD3217 (UF400/UF500/UG400) → Charger IC (U5200) → PPBUS_AON (12.6V)
                                                                     │
                                                                U5700 (SVR AON, 30A)
                                                                     │
                                                               PP3V8_AON (3.8V)
                                                          ┌──────┬───┴───┬──────┐
                                                     U7700     U8100    WiFi   Display
                                                    (SPMU)    (MPMU)    /BT    TCON
                                                       │         │
                                                  SPMU Bucks  MPMU Bucks
                                                  SPMU LDOs   MPMU LDOs
                                                       │         │
                                                       │    ┌────┴────┐
                                                       │  U9300    Monaco VR
                                                       │  (Viper)  (GPU/Fabric)
                                                       │    │         │
                                                       └────┼─────────┘
                                                            │
                                                       SoC U6000
                                                  (M2 Pro/Max)
                                                  PCPU0/1, ECPU
                                                  GPU0/1, ANE
                                                  DISP, DCS, FABRIC
```

## Key Differences from A2681 (MacBook Air M2)

| Feature | A2681 (MBA M2) | A2442 (MBP14 M2 Pro/Max) |
|---------|---------------|--------------------------|
| USB-C ports | 2 (UF400, UF500) | 3 (UF400, UF500, UG400) |
| HDMI | None | Madea retimer (page 89) |
| SD Card | None | SD controller (page 92) |
| CPU VR | MPMU bucks direct | Viper VR (U9300) multi-phase |
| GPU VR | MPMU bucks direct | Monaco VR multi-instance |
| 5V VR | UC300 | TPS62130 |
| SSD | Single (2 NAND packages) | Dual SSD (8 NAND packages + Ocarina) |
| SPMU bucks | ~14 | 22+ (BUCK0-BUCK21) |
| Fan | None (fanless) | Active cooling (page 67) |
| TouchID | None | TouchID (pages 126-128) |
| Max variant | N/A | Additional GPU/CPU clusters + phases |

## Diagnostic Test Points (from Saf A2442 data)

### Known A2442 Faults from Diagnostic Records

| Reading | Component | Rail | Fault | Fix |
|---------|-----------|------|-------|-----|
| 5V/0.012A | CR765 | PPBUS_AON | Cap short on PPBUS | Remove CR765, retest |
| 20V/0.223A | U5500 | CD chip | Liquid under CD3217 | Clean + replace CD chip |
| 5V/0.223A | UF400, UF260, UF720 | USB-C path | Liquid damage multi-IC | Replace CD3217 + level shifters |
| 5V/0.012A, 20V/0.552A | UD740, RD764 | Various | Severe liquid damage | Board-level clean + multi-component |

### Step-by-Step Diagnostic (adapted from Ricky's A2681 workflow)

#### Step 1: Check PPBUS_AON
- **Probe:** CR765 area (PPBUS_AON decoupling)
- **Expect:** 12V
- YES → go to Step 2
- NO → Charger circuit / CD3217 / U5200 fault

#### Step 2: Check PP3V8_AON
- **Probe:** PP3V8_AON decoupling (C57xx/C58xx area, pages 33-34)
- **Expect:** 3.8V
- YES → go to Step 3
- NO → U5700 / phase drivers fault. Check PPVAON_PWR_EN, PPVAON_FAULT_L

#### Step 3: Check PP5V_S2
- **Probe:** TPS62130 output (MC6xx/RC6xx area, page 55)
- **Expect:** 5.14V
- YES → go to Step 4
- NO → TPS62130 fault or P5VS2_PWR_EN not asserted

#### Step 4: Check MPMU LDO Outputs (U8100)
- Check AON LDOs: PP1V8_AON, PP1V2_AON, PP1V5_AON_VCORE
- Check S2 rails: PP1V2_S2, PP1V25_S2
- ALL YES → go to Step 5
- ANY NO → Thermal cam on missing rail. If U8100 outputs all dead → replace U8100

#### Step 5: Check Viper VR (U9300) — Pro/Max specific
- **Probe:** PPVDD_PCPU0_AWAKESW area
- **Expect:** Variable voltage present (DVFS)
- YES → go to Step 6
- NO → U9300 Viper fault or VIPER_ALERT_L active. Check Viper power stages (pages 48-49)

#### Step 6: Check Monaco VR — Pro/Max specific
- **Probe:** PPVDD_GPU0_AWAKESW area
- **Expect:** Variable voltage present (DVFS)
- YES → SoC domains powered. Fault is downstream (display, storage, peripheral)
- NO → Monaco VR fault or MONACO_ALERT_L active. Max variant: check if GPU1 cluster is the failure point

### Power Domain Table

#### MPMU (U8100) Buck Outputs

| Buck # | Rail | State | Load |
|--------|------|-------|------|
| BUCK 1 | GPU domains (via Monaco) | AWAKE | GPU clusters |
| BUCK 2 | PPVDD_DISP_AWAKESW | AWAKE | Display |
| BUCK 3 | PPVDD_DISP2/AFR_AWAKESW | AWAKE | Display 2 / AFR |
| BUCK 4 | PPVDD_ANE0_AWAKESW | AWAKE | Neural Engine |
| BUCK 5 | PPVDD_ECPU_AWAKE | AWAKE | Efficiency CPU |
| BUCK 6 | PPVDD_GPU_BMPR_S1 / AMPH0/1 | S1/S2 | GPU bumper / Memory |
| BUCK 7 | PPVDD_SOC_S1 | S1 | SoC general |
| BUCK 8 | PPVDD_DCS_S1 / VDDQ0/1 | S1 | DCS + Memory |
| BUCK 9 | PPVDD_FABRIC_S1 / VDD2H0/1 | S1/S2 | Fabric + VDD2H |
| BUCK 10 | PPVDD_FIXED_S1 | S1 | Fixed domains |

#### SPMU (U7700) Buck Outputs

| Buck # | Rail | State | Load |
|--------|------|-------|------|
| BUCK 0 | PP0V81_S1_SRAM / S1AF | S1 | SRAM retention |
| BUCK 11 | PPVDD_S1VF_ABMRC | S1 | S1VF domain |
| BUCK 12 | PP3V3_S0MWLF | S0 | SoC MWLF |
| BUCK 13 | PP0V72_S2_VDDLOW | S2 | VDD_LOW |
| BUCK 14 | PP0V8_S2_CLVR_VDDDIG | S2 | CLVR digital |
| BUCK 15 | NC (Not used on p7) | — | — |
| BUCK 17 | PP1V8_S1_CLVR_VDDH | S1 | CLVR VDDH |
| BUCK 18 | PP0V855_S2SW_VDDCIO | S2 | SoC CIO |
| BUCK 19 | PP0V95_S2SW_VDD2L | S2 | VDD2L |
| BUCK 20 | PPVDD_S1CF_ABMRCN | S1 | S1CF domain |
| BUCK 21 | PP3V8_AWAKE | AWAKE | Audio amps, peripherals |

#### Viper VR (U9300) — PCPU Power

| Output | Load | Variant |
|--------|------|---------|
| PPVDD_PCPU0_AWAKESW | PCPU cluster 0 | All |
| PPVDD_PCPU1_AWAKESW | PCPU cluster 1 | Max only |
| PPVDD_PCPU_SRAM0_AWAKESW | PCPU SRAM 0 | All |
| PPVDD_PCPU_SRAM1_AWAKESW | PCPU SRAM 1 | Max only |

#### Monaco VR — GPU/Fabric Power (Instance C0)

| Buck # | Rail | Load |
|--------|------|------|
| 0 | PPVDD_S0VE_ABMCCN | SoC S0VE |
| 1 | PPVDD_S0VS_ABMCCN | SoC S0VS |
| 2 | PPVDD_MCPW_ABMCCN | SoC MCPW |
| 3 | PPVDD_S0CL_CAMU_ABMCCN | SoC S0CL/CAMU |
| 4 | PPVDD_GACS_ABMCCN | SoC GACS |
| 5 | PPVDD_S0DL_ABMCCN | SoC S0DL |
| 6 | PPVDD_AGXS_ABMCCN | SoC AGXS (GPU) |
| 7 | PPVDD_S0KE_ABMCCN | SoC S0KE |
| 8 | PPVDD_S0PE_ABMCCN | SoC S0PE |
| 9 | PP3V3_S0MWLF_S1 | SoC MWLF |
