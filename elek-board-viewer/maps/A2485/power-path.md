# A2485 Power Path — Human-Readable Diagnostic Reference

Board: A2485 (MacBook Pro 16" M1 Pro/Max, 820-02100, J316-EVTs, X2728 MLB)

**WARNING: This is extracted from an EVT schematic (rev 6.33.0). Component designators and page numbers may differ from production schematics. Always verify against boardview (.brd).**

## Power Chain Overview

```
USB-C 5V -> CD3217 (UF400/UF500/UG400) -> Charger IC (U5200) -> PPBUS_AON (12.6V)
                                                                     |
                                                                U5700 (SVR AON, 30A)
                                                                     |
                                                               PP3V8_AON (3.8V)
                                                          +------+----+------+------+
                                                     U7700     U8100    WiFi   Display
                                                    (SPMU)    (MPMU)    /BT    TCON
                                                       |         |
                                                  SPMU Bucks  MPMU Bucks
                                                  SPMU LDOs   MPMU LDOs
                                                       |         |
                                                       |    +----+----+
                                                       |  U9300    Monaco VR
                                                       |  (Viper)  (C0/C1/C2/C4)
                                                       |    |         |
                                                       +----+---------+
                                                            |
                                                       SoC U6000
                                                  (M1 Pro/Max)
                                                  PCPU0/1, ECPU
                                                  GPU0/1, ANE
                                                  DISP, DCS, FABRIC
```

## Key Differences from A2442 (MacBook Pro 14" M1 Pro/Max)

| Feature | A2442 (MBP14) | A2485 (MBP16) |
|---------|---------------|---------------|
| Screen | 14.2" | 16.2" |
| Battery | 70 Wh | 99.6 Wh |
| Fans | 1 fan | 2 fans (FAN0 left JE500, FAN1 right JE510) |
| Board number | 820-02098 | 820-02100 |
| Schematic pages | 157 | 155 |
| MLB platform | X2728 (J314) | X2728 (J316) |
| USB-C ATC0 | UF400 | UF400 |
| USB-C ATC1 | UF500 | UF500 |
| USB-C ATC2 | UG400 | UG400 |
| Power topology | Identical | Identical |

## Key Differences from A2681 (MacBook Air M2)

| Feature | A2681 (MBA M2) | A2485 (MBP16 M1 Pro/Max) |
|---------|---------------|--------------------------|
| USB-C ports | 2 | 3 (UF400, UF500, UG400) |
| HDMI | None | Madea retimer (pages 87-89) |
| SD Card | None | SD controller (pages 91-94) |
| CPU VR | MPMU bucks direct | Viper VR (U9300) multi-phase |
| GPU VR | MPMU bucks direct | Monaco VR multi-instance (C0/C1/C2/C4) |
| 5V VR | UC300 | TPS62130 (5.14V, 2.1A) |
| SSD | Single (2 NAND packages) | Dual SSD (8 NAND packages + Ocarina) |
| SPMU bucks | ~14 | 22+ (BUCK0-BUCK21) |
| Fan | None (fanless) | Dual active cooling (page 66) |
| TouchID | None | TouchID (pages 124-126) |
| Max variant | N/A | Additional GPU/CPU clusters + phases |

## Step-by-Step Diagnostic

### Step 1: Check PPBUS_AON
- **Probe:** Battery connector area (page 27) or charger output
- **Expect:** 12.6V (battery)
- YES -> go to Step 2
- NO -> Charger circuit / CD3217 / U5200 fault

### Step 2: Check PP3V8_AON
- **Probe:** PP3V8_AON decoupling (C57xx/C58xx area, pages 33-34)
- **Expect:** 3.8V
- YES -> go to Step 3
- NO -> U5700 / phase drivers fault. Check PPVAON_PWR_EN, PPVAON_FAULT_L

### Step 3: Check PP5V_S2
- **Probe:** TPS62130 output (CC2xx/RC2xx area, page 54)
- **Expect:** 5.14V
- YES -> go to Step 4
- NO -> TPS62130 fault or P5VS2_PWR_EN not asserted. Check P5VS2TPS_PGOOD.

### Step 4: Check MPMU LDO Outputs (U8100)
- Check AON LDOs: PP1V8_AON, PP1V2_AON, PP1V5_AON_VCORE
- Check S2 rails: PP1V2_S2, PP1V25_S2
- ALL YES -> go to Step 5
- ANY NO -> Thermal cam on missing rail. If U8100 outputs all dead -> replace U8100

### Step 5: Check Viper VR (U9300) -- Pro/Max specific
- **Probe:** PPVDD_PCPU0_AWAKESW area
- **Expect:** Variable voltage present (DVFS)
- YES -> go to Step 6
- NO -> U9300 Viper fault or VIPER_ALERT_L active. Check Viper power stages (pages 48-49), 3 phase inputs (page 46: PH1/PH2/PH3)

### Step 6: Check Monaco VR -- Pro/Max specific
- **Probe:** PPVDD_GPU0_AWAKESW area
- **Expect:** Variable voltage present (DVFS)
- YES -> SoC domains powered. Fault is downstream (display, storage, peripheral)
- NO -> Monaco VR fault or MONACO_ALERT_L active. Check instances C0 (page 50), C1 (page 51), C2/C4 (page 52). Max variant: check if GPU1 cluster is the failure point

## NC LDOs (Not Connected on This Board)

| Output | Source | Page |
|--------|--------|------|
| NC_MPMU_VLDO3 | MPMU LDO 3 | 41 |
| NC_MPMU_VLDO6 | MPMU LDO 6 | 41 |
| NC_SPMU_VLDO1 | SPMU LDO 1 | 37 |
| NC_SPMU_VLDO2 | SPMU LDO 2 | 37 |
| NC_SPMU_VLDO5 | SPMU LDO 5 | 37 |
| NC_SPMU_VLDO6 | SPMU LDO 6 | 37 |
| NC_MPMU_VSW1 | MPMU SW 1 | 41 |
| NC_MPMU_VSW2 | MPMU SW 2 | 41 |
| NC_SPMU_VSW2 | SPMU SW 2 | 37 |
| NC_SPMU_BUCK15 | SPMU BUCK 15 | 38 |

Note: SPMU BUCK15 marked "Not used on sC designs" on page 38.

## Power Domain Table

### MPMU (U8100) Buck Outputs (page 42)

| Buck # | Rail | State | Load |
|--------|------|-------|------|
| BUCK 0 | PPVDD_ECPU_AWAKE (via B5) | AWAKE | Efficiency CPU |
| BUCK 1 | GPU domains (via Monaco) | AWAKE | GPU clusters |
| BUCK 2 | PPVDD_DISP_AWAKESW / AVEMSR | AWAKE | Display / AVEMSR |
| BUCK 3 | PPVDD_DISP2/AFR_AWAKESW | AWAKE | Display 2 / AFR |
| BUCK 4 | PPVDD_ANE0_AWAKESW | AWAKE | Neural Engine |
| BUCK 5 | PPVDD_ECPU_AWAKE | AWAKE | Efficiency CPU |
| BUCK 6 | PPVDD_GPU_BMPR_S1 / AMPH0/1 | S1/S2 | GPU bumper / Memory |
| BUCK 7 | PPVDD_SOC_S1 | S1 | SoC general |
| BUCK 8 | PPVDD_DCS_S1 / VDDQ0/1 | S1 | DCS + Memory |
| BUCK 9 | PPVDD_FABRIC_S1 / VDD2H0/1 | S1/S2 | Fabric + VDD2H |
| BUCK 10 | PPVDD_FIXED_S1 (0.84002V) | S1 | Fixed domains |

### SPMU (U7700) Buck Outputs (page 38)

| Buck # | Rail | State | Load |
|--------|------|-------|------|
| BUCK 0 | PP0V81_S1_SRAM / S1AF | S1 | SRAM retention |
| BUCK 11 | PPVDD_S1VF_ABMRC | S1 | S1VF domain |
| BUCK 12 | PP3V3_S0MWLF | S0 | SoC MWLF |
| BUCK 13 | PP0V72_S2_VDDLOW (LDON) | S2 | VDD_LOW |
| BUCK 14 | PP0V8_S2_CLVR_VDDDIG | S2 | CLVR digital |
| BUCK 15 | PPVDD_S1CF_AWAKESW (NC on sC) | -- | Not used on sC designs |
| BUCK 16 | PPVDD_DCS_S1_RES | S1 | DCS S1 |
| BUCK 17 | PP1V8_S1_CLVR_VDDH | S1 | CLVR VDDH |
| BUCK 18 | PP0V855_S2SW_VDDCIO | S2 | SoC CIO |
| BUCK 19 | PP0V95_S2SW_VDD2L | S2 | VDD2L |
| BUCK 20 | PPVDD_S1CF_ABMRCN | S1 | S1CF domain |
| BUCK 21 | PP3V8_AWAKE | AWAKE | Audio amps, peripherals |

### Viper VR (U9300) -- PCPU Power (pages 46-49)

| Output | Load | Variant |
|--------|------|---------|
| PPVDD_PCPU0_AWAKESW | PCPU cluster 0 | All |
| PPVDD_PCPU1_AWAKESW | PCPU cluster 1 | Max only |
| PPVDD_PCPU_SRAM0_AWAKESW | PCPU SRAM 0 | All |
| PPVDD_PCPU_SRAM1_AWAKESW | PCPU SRAM 1 | Max only |

### Monaco VR -- GPU/Fabric Power

#### Instance C0 (page 50, UA100)

| Buck # | Rail | Load |
|--------|------|------|
| 0 | PPVDD_S0VE_ABMCCN | SoC S0VE |
| 1 | PPVDD_S0VS_ABMCCN | SoC S0VS |
| 2 | PPVDD_MCPW_ABMCCN | SoC MCPW |
| 3 | PPVDD_S0CL_CAMU_ABMCCN | SoC S0CL/CAMU |
| 4 | PPVDD_GACS_ABMCCN | SoC GACS |

#### Instance C1 (page 51, UA200)

| Buck # | Rail | Load |
|--------|------|------|
| 5 | PPVDD_S0DL_ABMCCN | SoC S0DL |
| 6 | PPVDD_AGXS_ABMCCN | SoC AGXS (GPU) |
| 7 | PPVDD_S0KE_ABMCCN | SoC S0KE |
| 8 | PPVDD_S0PE_ABMCCN | SoC S0PE |

#### Instance C2/C4 (page 52, UA500)

SC (C2), 1C (C4), 2C (C4) instances for GPU SRAM, ANE SRAM, PCPU SRAM domains.

| Buck # | Rail | Load |
|--------|------|------|
| 9 | PP3V3_S0MWLF_S1 | SoC MWLF |

### TPS62130 -- 5V S2 (page 54)

- Vout-nom = 5.14V
- Iout Max = 2.1A
- f = 1.25 MHz
- Startup = 4.7/7.5/10.5 ms (min/typ/max)
- PGOOD: P5VS2TPS_PGOOD
