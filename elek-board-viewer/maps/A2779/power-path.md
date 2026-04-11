# A2779 Power Path -- Human-Readable Diagnostic Reference

Board: A2779 (MacBook Pro 14" M2 Pro/Max, 820-02655, X2371 MLB-C, J414-C)

## WARNING

**This board uses AUSTRINGER (not Viper) and CLVR (not Monaco).** Do NOT confuse with A2442 (M1 Pro/Max). MPMU/SPMU buck numbering is different. Always cross-reference power aliases pages 142-146 in the schematic.

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
                                                       |    +----+----+
                                                       |  U9300    CLVR 0-4
                                                       |  (Austringer) (GPU/Fabric/ANE)
                                                       |    |         |
                                                       +----+---------+
                                                            |
                                                       SoC U6000
                                                  (M2 Pro/Max)
                                                  PCPU0/1, ECPU
                                                  GPU0/1, ANE
                                                  DISP, DCS, FABRIC
```

## Key Differences from A2442 (MacBook Pro 14" M1 Pro/Max)

| Feature | A2442 (M1 Pro/Max) | A2779 (M2 Pro/Max) |
|---------|--------------------|--------------------|
| SoC | M1 Pro/Max | M2 Pro/Max |
| SVR AON current | 30A | 42A (3 Iceman phases) |
| CPU high-current VR | Viper VR (U9300) | Austringer VR (U9300) |
| GPU/Fabric VR | Monaco VR (3 instances) | CLVR (5 instances C0-C4) |
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
- NO -> U5700 fault. Check PPVAON_PWR_EN, PPVAON_FAULT_L. 42A design has Iceman gate drivers.

#### Step 3: Check PP5V_S2
- **Probe:** UC260 output (page 58)
- **Expect:** ~5V
- YES -> go to Step 4
- NO -> UC260 fault or PP5V2P5_PWR_EN not asserted

#### Step 4: Check MPMU LDO Outputs (U8100)
- Check AON LDOs: PP1V8_AON, PP1V2_AON, PP1V5_AON_VCORE
- Check S2 rails: PP1V2_S2, PP1V25_S2
- ALL YES -> go to Step 5
- ANY NO -> Thermal cam on missing rail. If U8100 outputs all dead -> replace U8100

#### Step 5: Check CLVR Outputs -- M2 Pro/Max specific
- **Probe:** PPVDD_PCPU0_AWAKESW area (CLVR0)
- **Expect:** Variable voltage present (DVFS)
- YES -> go to Step 6
- NO -> CLVR0 fault. Check CLVR support circuitry (page 57)

#### Step 6: Check Austringer VR (U9300) -- M2 Pro/Max specific
- **Probe:** PPVDD_PCPU_SRAM0_AWAKESW area
- **Expect:** Variable voltage present
- YES -> go to Step 7
- NO -> U9300 Austringer fault or PVRVD0N_FAULT_L active. Check 5 power stage pages (49-51)

#### Step 7: Check remaining CLVR instances
- **CLVR1:** PPVDD_GPU0_AWAKESW (page 53)
- **CLVR2:** PPVDD_GPU1_AWAKESW (Max only, page 54)
- **CLVR3:** PPVDD_DPL0_AWAKESW / PPVDD_FABRIC_S1 (page 55)
- **CLVR4:** PPVDD_ANE_AWAKESW (page 56)
- ALL YES -> SoC domains powered. Fault is downstream.
- ANY NO -> Check specific CLVR instance. Max variant: check if GPU1 (CLVR2) is failure point.

### Power Domain Table

#### MPMU (U8100) Buck Outputs (pages 43, 145)

| Buck # | FDK# | Rail | State | Load |
|--------|-------|------|-------|------|
| BUCK 0 | FDK0 | PPVDD_SRAM_S1 | S1 | SRAM retention |
| BUCK 1 | FDK1 | PPVDD_GPU_BMPR_S1 | S1 | GPU bumper |
| BUCK 2 | FDK2 | (unused on this board) | -- | -- |
| BUCK 3 | FDK3 | PP1V8_S2SW | S2 | 1.8V switched |
| BUCK 4 | FDK4 | PPVDD2H1_S2SW | S2 | VDD2H1 |
| BUCK 5 | FDK5 | PPVDD_ECPU_AWAKESW | AWAKE | Efficiency CPU |
| BUCK 6 | FDK6 | PPVDD_AMPH1_S2SW | S2 | Memory AMPH1 |
| BUCK 7 | FDK7 | PPVDD_DCS_S1 | S1 | DCS domain |
| BUCK 8 | FDK8 | PPVDD_FIXED_S1 / PP1V2_S2 | S1/S2 | Fixed + 1.2V S2 |
| BUCK 9 | FDK9 | PPVDD_AMPH0_S2SW | S2 | Memory AMPH0 |
| BUCK 10 | FDK10 | PPVDDOO_S1 | S1 | VDDOO domain |

#### SPMU (U7700) Buck Outputs (pages 39, 146)

| Buck # | FDKP# | Rail | State | Load |
|--------|-------|------|-------|------|
| BUCK 0 | FDKP0 | PPVDD_DCS_S1 | S1 | DCS domain |
| BUCK 1 | FDKP1 | PPVDDOO_S1 | S1 | VDDOO |
| BUCK 2 | FDKP2 | PPVDD_ECPU_SRAM_AWAKESW | AWAKE | ECPU SRAM |
| BUCK 3 | FDKP3 | PP1V8_S2 | S2 | 1.8V system |
| BUCK 4 | FDKP4 | PPVDD2H0_S2SW | S2 | VDD2H0 |
| BUCK 5 | FDKP5 | PPVDD_SOC_S1 | S1 | SoC general |
| BUCK 6 | FDKP6 | PPVDD_CIO_S2SW | S2 | SoC CIO |
| BUCK 7 | FDKP7 | PPVDD_DISP2_AWAKESW | AWAKE | Display 2 (not used on S designs) |
| BUCK 8 | FDKP8 | PP1V2_AWAKE | AWAKE | 1.2V AWAKE |
| BUCK 9 | FDKP9 | PPVDD_AMPH0_S2SW | S2 | Memory AMPH0 |
| BUCK 10 | FDKP10 | PPVDD_ECPU_AWAKESW | AWAKE | ECPU |
| BUCK 11 | FDKP11 | PPVDDOO_S1 | S1 | VDDOO |
| BUCK 12 | FDKP12 | PP1V2_S2 | S2 | 1.2V system |

#### CLVR Instances -- GPU/Fabric/ANE Power (pages 52-56, 144)

| Instance | Config | Buck0/HP0 | Buck1/LP0 | Buck2/HP1 | Buck3/LP1 |
|----------|--------|-----------|-----------|-----------|-----------|
| CLVR0 (C0) | D (12+2+12+2) | PCPU0 AWAKE | PCPU0 SRAM_B | PCPU1 AWAKE (Max) | PCPU1 SRAM_B (Max) |
| CLVR1 (C1) | A (13+1+13+1) | GPU0 AWAKE | GPU0 SRAM | GPU0 SRAM_B | -- |
| CLVR2 (C2) | A (13+1+13+1) | GPU1 AWAKE (Max) | GPU1 SRAM (Max) | GPU1 SRAM_B (Max) | -- |
| CLVR3 (C3) | E (4+0+24+0) | DPL0 AWAKE | -- | FABRIC S1 | -- (Buck8/HP1 unused on C) |
| CLVR4 (C4) | F_P (12+1+15+0) | ANE AWAKE | ANE SRAM | APR_CS S1 | -- |

#### Austringer VR (U9300) -- PCPU SRAM Power (pages 47-51)

| Output | Load | Variant |
|--------|------|---------|
| PPVDD_PCPU_SRAM0_AWAKESW | PCPU SRAM 0 | All |
| PPVDD_PCPU_SRAM1_AWAKESW | PCPU SRAM 1 | Max only |
