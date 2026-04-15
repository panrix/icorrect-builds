# A2779 Power Path — Human-Readable Diagnostic Reference

Board: A2779 (MacBook Pro 14" M2 Pro/Max, 820-02655, X2371 MLB-C, J414-C)

## WARNING

**This board uses AUSTRINGER and CLVR architecture.** Austringer (U9300) produces PP1V8_S1_CLVR_VDDH which feeds all 5 CLVR instances. CLVR0 produces PCPU rails (not Austringer). MPMU/SPMU buck numbering per power aliases pages 145-146.

## Power Chain Overview

```
USB-C 5V -> CD3217 (UF400/UF500/UG400) -> Charger IC (U5200) -> PPBUS_AON (12.6V)
                                                                     |
                                                                U5700 (SVR AON, 42A)
                                                                     |
                                                               PP3V8_AON (3.8V)
                                                          +------+---+---+------+
                                                     U7700     U8100    WiFi   Display
                                                    (SPMU)    (MPMU)    /BT    TCON
                                                       |         |
                                                  SPMU Bucks  MPMU Bucks
                                                  SPMU LDOs   MPMU LDOs
                                                       |         |
                                                       +----+----+
                                                            |
                                                       U9300 (Austringer)
                                                            |
                                                  PP1V8_S1_CLVR_VDDH
                                                            |
                                                    +---+---+---+---+
                                                  CLVR0 CLVR1 CLVR2 CLVR3 CLVR4
                                                  PCPU  GPU   GPU   Fabric ANE
                                                  +SRAM  1/2   0/3         +SRAM
                                                            |
                                                       SoC U6000
                                                  (M2 Pro/Max)
```

## Key Differences from A2442 (MacBook Pro 14" M1 Pro/Max)

| Feature | A2442 (M1 Pro/Max) | A2779 (M2 Pro/Max) |
|---------|--------------------|--------------------|
| SoC | M1 Pro/Max | M2 Pro/Max |
| SVR AON current | 30A | 42A (3 Iceman phases) |
| CLVR VDDH VR | Viper VR | Austringer VR (U9300) |
| GPU/CPU/Fabric VR | Monaco VR (3 instances) | CLVR (5 instances C0-C4) |
| HDMI retimer | Madea | Cobra |
| WiFi/BT module | Previous gen | Willamette (WiFi 6E) |
| Audio codec | Previous gen | Carlow B0 |
| Secure Element | Ceres | Eos (SN300V) |
| 5V S2 VR | TPS62130 | UC260 |

## Diagnostic Test Points

### Step-by-Step Diagnostic

#### Step 1: Check PPBUS_AON
- **Probe:** PPBUS_AON decoupling area (pages 28-29)
- **Expect:** ~12.6V (battery) or ~20V (adapter)
- YES -> go to Step 2
- NO -> Charger circuit / CD3217 / U5200 fault

#### Step 2: Check PP3V8_AON
- **Probe:** PP3V8_AON decoupling (C57xx area, pages 34-35)
- **Expect:** 3.8V
- YES -> go to Step 3
- NO -> U5700 fault. Check P3V8AON_PWR_EN, P3V8AON_FAULT_L. 42A design has Iceman gate drivers.

#### Step 3: Check PP5V_S2
- **Probe:** UC260 output (page 58)
- **Expect:** ~5.15V
- YES -> go to Step 4
- NO -> UC260 fault or P5VS2TPS_PWR_EN not asserted. Check P5VS2SN_PGOOD.

#### Step 4: Check MPMU LDO Outputs (U8100)
- Check AON LDOs: PP1V8_AON (LDO1V8), PP1V2_AON (LDO1V2), PP3V3_AON (LDO4)
- Check S2 rails: PP1V2_S2 (Buck8), PP3V3_S2 (LDO0)
- ALL YES -> go to Step 5
- ANY NO -> Thermal cam on missing rail. If U8100 outputs all dead -> replace U8100

#### Step 5: Check Austringer VR (U9300) — CLVR VDDH Supply
- **Probe:** PP1V8_S1_CLVR_VDDH
- **Expect:** ~1.8V
- YES -> go to Step 6
- NO -> U9300 fault. Check P1V8VDDH_PW_EN_R enable, P1V8VDDH_FAULT_L, P1V8VDDH_DRMOS_FAULT_L.

#### Step 6: Check CLVR0 (PCPU) Outputs
- **Probe:** PPVDD_PCPU0_AWAKESW area (CLVR0 Buck2/HP1, page 52)
- **Expect:** Variable voltage present (DVFS)
- YES -> go to Step 7
- NO -> CLVR0 fault. Check CLVR support circuitry (page 57), PP1V8_S1_CLVR_VDDH supply.

#### Step 7: Check remaining CLVR instances
- **CLVR1:** PPVDD_GPU2_AWAKESW (page 53)
- **CLVR2:** PPVDD_GPU0_AWAKESW (Max only, page 54)
- **CLVR3:** PPVDD_FABRIC_S1 (page 55)
- **CLVR4:** PPVDD_ANE_AWAKESW (page 56)
- ALL YES -> SoC domains powered. Fault is downstream.
- ANY NO -> Check specific CLVR instance.

### Power Domain Table

#### MPMU (U8100) Buck Outputs (pages 43, 145)

| Buck # | PD# | Rail | Voltage | State | Load |
|--------|-----|------|---------|-------|------|
| BUCK 0 | 7 | PPVDD_SRAM_S1 | 0.8125V | S1 | SRAM retention |
| BUCK 1 | 1 | PPVDD_GPU_BMPR_S1 | 0.9V | S1 | GPU bumper |
| BUCK 2 | — | (unused on this board) | — | — | — |
| BUCK 3 | 3 | PP1V8_S2SW | 1.8V | S2 | 1.8V switched |
| BUCK 4 | 4 | PPVDD2H1_S2SW | 1.05V | S2 | VDD2H1 (OFF in SLP_SMC) |
| BUCK 5 | 20 | PPVDD_DISP_AWAKESW | 0.7V | AWAKE | Display (DVFS 686-1047mV) |
| BUCK 6 | 6 | PPVDD_AMPH1_S2SW | 1.121875V | S2 | Memory AMPH1 (OFF in SLP_SMC) |
| BUCK 7 | 5 | PPVDD_AVEMSR_AWAKESW | 0.7V | AWAKE | AVE/MSR (DVFS 645-973mV) |
| BUCK 8 | 8 | PP1V2_S2 | 1.225V | S2 | 1.2V system |
| BUCK 9 | 9 | PPVDD_FIXED_S1 | 0.80625V | S1 | SoC fixed domain |
| BUCK 10 | 10 | PPVDDQ1_S1 | 0.575V | S1 | LPDDR VDDQ1 |

#### MPMU LDO/SW Outputs (pages 42, 145)

| Output | Rail | Voltage | State |
|--------|------|---------|-------|
| LDO 0 | PP3V3_S2 | 3.3V | S2 |
| LDO 1 | PP1V8_S2SW_CLVR_VDDC1 | 1.8V | S2 |
| LDO 4 | PP3V3_AON | 3.3V | AON |
| LDO 5 | PP0V8_S2_CLVR_VDDDIG | 0.8V | S2 |
| LDO1V8 | PP1V8_AON | 1.8V | AON |
| LDO1V2 | PP1V2_AON | 1.2V | AON |
| SW 0 | PP1V2_S2_CLVR_VDDIO | 1.2V | S2 |

#### SPMU (U7700) Buck Outputs (pages 39, 146)

| Buck # | PD# | Rail | Voltage | State | Load |
|--------|-----|------|---------|-------|------|
| BUCK 0 | 17 | PPVDD_DCS_S1 | 0.675V | S1 | DCS (DVFS 643-1060mV) |
| BUCK 1 | 13 | PPVDDQ0_S1 | 0.575V | S1 | LPDDR VDDQ0 |
| BUCK 2 | 2 | PPVDD_ECPU_SRAM_AWAKESW | 0.790625V | AWAKE | ECPU SRAM (DVFS 770-1060mV) |
| BUCK 3 | 19 | PP1V8_S2 | 1.8V | S2 | 1.8V system |
| BUCK 4 | 14 | PPVDD2H0_S2SW | 1.05V | S2 | VDD2H0 (OFF in SLP_SMC) |
| BUCK 5 | 11 | PPVDD_SOC_S1 | 0.725V | S1 | SoC general (DVFS 642-904mV) |
| BUCK 6 | 16 | PPVDD_CIO_S2SW | 0.85625V | S2 | SoC CIO (OFF in SLP_SMC) |
| BUCK 7 | 15 | PPVDD_DISP2_AWAKESW | 0.7125V | AWAKE | Display 2 (not used on S designs) |
| BUCK 8 | 12 | PP1V2_AWAKE | 1.225V | AWAKE | 1.2V AWAKE |
| BUCK 9 | 21 | PPVDD_AMPH0_S2SW | 1.21875V | S2 | Memory AMPH0 (OFF in SLP_SMC) |
| BUCK 10 | 0 | PPVDD_ECPU_AWAKESW | 0.675V | AWAKE | ECPU (DVFS 625-1060mV) |

#### CLVR Instances — PCPU/GPU/Fabric/ANE Power (pages 52-56, 144)

| Instance | Buck0/HP0 | Buck1/LP0 | Buck2/HP1 | Buck3/LP1 |
|----------|-----------|-----------|-----------|-----------|
| CLVR0 (C0) | PPVDD_PCPU1_AWAKESW | PPVDD_PCPU_SRAM1_AWAKESW | PPVDD_PCPU0_AWAKESW | PPVDD_PCPU_SRAM0_AWAKESW |
| CLVR1 (C1) | PPVDD_GPU2_AWAKESW | PPVDD_GPU_SRAM2_AWAKESW | PPVDD_GPU1_AWAKESW | PPVDD_GPU_SRAM1_AWAKESW |
| CLVR2 (C2, Max) | PPVDD_GPU0_AWAKESW | PPVDD_GPU_SRAM0_AWAKESW | PPVDD_GPU3_AWAKESW | PPVDD_GPU_SRAM3_AWAKESW |
| CLVR3 (C3) | unused (C platforms) | — | PPVDD_FABRIC_S1 | — |
| CLVR4 (C4) | PPVDD_ANE_AWAKESW | PPVDD_ANE_SRAM_AWAKESW | PPVDD_APR_CS_S1 | — |

#### Austringer VR (U9300) — CLVR VDDH Supply (pages 47-51)

| Output | Voltage | Load |
|--------|---------|------|
| PP1V8_S1_CLVR_VDDH | 1.8V | CLVR VDDH supply — feeds all 5 CLVR instances |
