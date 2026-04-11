# A2442 CTO Power Path — Human-Readable Diagnostic Reference

Board: A2442 CTO (MacBook Pro 14" M1 Pro/Max CTO, 820-02443, J314-CTO, X2719 MLB-C)

**WARNING: This is the CTO variant (820-02443). Page numbers differ from base A2442 (820-02098). SVR AON is 42A design. Monaco has 5 instances. Viper has 3 power stage pages.**

## Power Chain Overview

```
USB-C 5V -> CD3217 (UF400/UF500/UG400) -> Charger IC (U5200) -> PPBUS_AON (12.6V)
                                                                     |
                                                                U5700 (SVR AON, 42A CTO)
                                                                     |
                                                               PP3V8_AON (3.8V)
                                                          +------+---+---+------+
                                                     U7700     U8100    WiFi   Display
                                                    (SPMU)    (MPMU)    /BT    TCON
                                                       |         |
                                                  SPMU Bucks  MPMU Bucks
                                                  SPMU LDOs   MPMU LDOs
                                                       |         |
                                                       |    +----+----+
                                                       |  U9300    Monaco VR
                                                       |  (Viper)  (5 instances CTO)
                                                       |  3 stage  C0,C1,C2*,C3*,C4
                                                       |  pages    *CTO-only
                                                       |    |         |
                                                       +----+---------+
                                                            |
                                                       SoC U6000
                                                  (M1 Pro/Max)
                                                  PCPU0/1, ECPU
                                                  GPU0/1, ANE
                                                  DISP, DCS, FABRIC
```

## Key CTO Differences from Base A2442 (820-02098)

| Feature | Base A2442 (820-02098) | CTO A2442 (820-02443) |
|---------|----------------------|----------------------|
| Internal name | X2724/MLB_S | X2719/MLB-C |
| SVR AON (U5700) | 30A ICC MAX | 42A design (BOM: 30/35/42A) |
| Viper power stages | 2 pages (48-49) | 3 pages (49-51) |
| Monaco instances | 3 (C0, C1, C4) | 5 (C0, C1, C2, C3, C4) |
| Total pages | 157 | 164 |
| Page 57 | VDDH discharge circuit | Empty (removed per RADAR) |

## Key Differences from A2681 (MacBook Air M2)

| Feature | A2681 (MBA M2) | A2442 CTO (MBP14 M1 Pro/Max CTO) |
|---------|---------------|----------------------------------|
| USB-C ports | 2 (UF400, UF500) | 3 (UF400, UF500, UG400) |
| HDMI | None | Madea retimer (page 93) |
| SD Card | None | SD controller (page 96) |
| CPU VR | MPMU bucks direct | Viper VR (U9300), 3 stage pages |
| GPU VR | MPMU bucks direct | Monaco VR, 5 instances |
| SVR AON | 30A | 42A design |
| 5V VR | UC300 | TPS62130 |
| SSD | Single (2 NAND) | Dual SSD (8 NAND + Ocarina) |
| SPMU bucks | ~14 | 22+ (BUCK0-BUCK21) |
| Fan | None | Active cooling (page 71) |
| TouchID | None | TouchID (pages 130-132) |

## Diagnostic Test Points

### Step-by-Step Diagnostic

#### Step 1: Check PPBUS_AON
- **Probe:** CR765 area (PPBUS_AON decoupling)
- **Expect:** 12V
- YES -> go to Step 2
- NO -> Charger circuit / CD3217 / U5200 fault

#### Step 2: Check PP3V8_AON
- **Probe:** PP3V8_AON output desense cap (CZ400 area, page 36)
- **Expect:** 3.8V
- YES -> go to Step 3
- NO -> U5700 / phase drivers fault. Check PPVAON_PWR_EN, PPVAON_FAULT_L
- **CTO note:** 42A design — higher current capacity. If short, more heat potential.

#### Step 3: Check PP5V_S2
- **Probe:** TPS62130 output cap (MC6xx area, page 59)
- **Expect:** 5.14V
- YES -> go to Step 4
- NO -> TPS62130 fault or P5VS2_PWR_EN not asserted

#### Step 4: Check MPMU LDO Outputs (U8100)
- Check AON LDOs: PP1V8_AON, PP1V2_AON, PP1V5_AON_VCORE
- Check S2 rails: PP1V2_S2, PP1V25_S2
- ALL YES -> go to Step 5
- ANY NO -> Thermal cam on missing rail. If U8100 outputs all dead -> replace U8100

#### Step 5: Check Viper VR (U9300) — Pro/Max specific
- **Probe:** PPVDD_PCPU0_AWAKESW area
- **Expect:** Variable voltage present (DVFS)
- YES -> go to Step 6
- NO -> U9300 Viper fault or VIPER_ALERT_L active. CTO has 3 power stage pages (49-51) — more phases to check.

#### Step 6: Check Monaco VR — Pro/Max specific
- **Probe:** PPVDD_GPU0_AWAKESW area
- **Expect:** Variable voltage present (DVFS)
- YES -> SoC domains powered. Fault is downstream (display, storage, peripheral)
- NO -> Monaco VR fault or MONACO_ALERT_L active. CTO has 5 instances (C0-C4). Check each instance separately (pages 52-56).

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
| BUCK 15 | NC (Not used on p7) | -- | -- |
| BUCK 17 | PP1V8_S1_CLVR_VDDH | S1 | CLVR VDDH |
| BUCK 18 | PP0V855_S2SW_VDDCIO | S2 | SoC CIO |
| BUCK 19 | PP0V95_S2SW_VDD2L | S2 | VDD2L |
| BUCK 20 | PPVDD_S1CF_ABMRCN | S1 | S1CF domain |
| BUCK 21 | PP3V8_AWAKE | AWAKE | Audio amps, peripherals |

#### Viper VR (U9300) — PCPU Power (3 Stage Pages CTO)

| Output | Load | Variant | Stage Page |
|--------|------|---------|------------|
| PPVDD_PCPU0_AWAKESW | PCPU cluster 0 | All | 49 |
| PPVDD_PCPU1_AWAKESW | PCPU cluster 1 | Max only | 50 |
| PPVDD_PCPU_SRAM0_AWAKESW | PCPU SRAM 0 | All | 49 |
| PPVDD_PCPU_SRAM1_AWAKESW | PCPU SRAM 1 | Max only | 50 |
| Additional phases | Max CPU | Max only | 51 (CTO-only) |

#### Monaco VR — GPU/Fabric Power (5 Instances CTO)

| Instance | Page | Buck # | Rail | Load |
|----------|------|--------|------|------|
| C0 | 52 | 0 | PPVDD_S0VE_ABMCCN | SoC S0VE |
| C0 | 52 | 1 | PPVDD_S0VS_ABMCCN | SoC S0VS |
| C0 | 52 | 2 | PPVDD_MCPW_ABMCCN | SoC MCPW |
| C0 | 52 | 3 | PPVDD_S0CL_CAMU_ABMCCN | SoC S0CL/CAMU |
| C0 | 52 | 4 | PPVDD_GACS_ABMCCN | SoC GACS |
| C0 | 53 | 5 | PPVDD_S0DL_ABMCCN | SoC S0DL |
| C0 | 53 | 6 | PPVDD_AGXS_ABMCCN | SoC AGXS (GPU) |
| C1 | 53 | -- | Additional GPU phases | GPU |
| **C2** | **54** | -- | **CTO-only GPU phases** | **Max GPU** |
| **C3** | **55** | -- | **CTO-only GPU phases** | **Max GPU** |
| C4 | 56 | 7 | PPVDD_S0KE_ABMCCN | SoC S0KE |
| C4 | 56 | 8 | PPVDD_S0PE_ABMCCN | SoC S0PE |
| C4 | 56 | 9 | PP3V3_S0MWLF_S1 | SoC MWLF |
