# A2485 EVTc Power Path -- Human-Readable Diagnostic Reference

Board: A2485 EVTc (MacBook Pro 16" M1 Pro/Max, 820-02382, J316-EVTc, X2723 MLB-C)

## WARNING

This is the EVTc (Engineering Validation Test-c) variant. Page numbers and some
component designators differ from EVTs (820-02100). The overall power architecture
is identical. Key EVTc-specific notes:
- PP3V8_AON is 42A design (same as EVTs, but higher than A2442's 30A)
- 5 Monaco VR instances (UA100-UA500) vs 3 on A2442
- 3 Viper power stages (pages 94-96) vs 2 on A2442
- USB-C 5V: UF800 (LT8640, 5.23V/6.6A left) + UG800 (TPS62180, 5.23V/3.3A right)
- 6 speaker amps (A-F) vs 4 on A2442
- ATC3 redriver (page 87) still in progress
- SoC is U6600 (not U6000 as on A2442)

## Power Chain Overview

```
USB-C 5V -> CD3217/CD3218 (UF400/UF500/UG400) -> Charger IC (U5200) -> PPBUS_AON (12.6V)
           MagSafe -> U5500 (UPC5) ----^                                      |
                                                                         U5700 (SVR AON, 42A)
                                                                              |
                                                                        PP3V8_AON (3.8V)
                                                               +---------+---+---+---------+
                                                          U7700      U8100    WiFi    Display
                                                         (SPMU)     (MPMU)    /BT     TCON
                                                            |          |       SE     Codec
                                                       SPMU Bucks  MPMU Bucks SpkrAmps
                                                       SPMU LDOs   MPMU LDOs
                                                            |          |
                                                            |    +-----+------+
                                                            |  U9300     Monaco VR
                                                            |  (Viper)   (5 instances)
                                                            |  3 stages  GPU/Fabric
                                                            |    |          |
                                                            +----+----------+
                                                                 |
                                                            SoC U6600
                                                       (M1 Pro/Max)
                                                       PCPU0/1, ECPU
                                                       GPU, ANE
                                                       DISP, DCS, FABRIC
```

## Key Differences from A2442 (MacBook Pro 14" M1 Pro/Max)

| Feature | A2442 (MBP14) | A2485 EVTc (MBP16) |
|---------|--------------|---------------------|
| Form factor | 14.2" | 16" |
| PP3V8_AON | 30A ICC MAX | 42A ICC MAX |
| Viper stages | 2 (pages 48-49) | 3 (pages 94-96) |
| Monaco instances | 3 (0, 1, 4) | 5 (0, 1, 2, 3, 4) |
| USB-C 5V left | Load switch | UF800 LT8640 (5.23V/6.6A) |
| USB-C 5V right | Load switch | UG800 TPS62180 (5.23V/3.3A) |
| Speaker amps | 4 | 6 (A-F, SN377780RTW) |
| SoC designator | U6000 | U6600 |
| SVR AON controller | U5700 | U5700 (same, RAGCFKID_KOPU) |
| MPMU | U8100 | U8100 (same, with XWB170/JM8170) |
| SPMU | U7700 | U7700 (same) |
| Viper controller | U9300 | U9300 (same, MAX2553/26A) |
| MagSafe APN | 516300787 | 516500767 |

## Step-by-Step Diagnostic

### Step 1: Check PPBUS_AON
- **Probe:** PPBUS_AON decoupling (C52xx area, page 52)
- **Expect:** ~12.6V (battery) or ~20V (adapter)
- YES -> go to Step 2
- NO -> Charger circuit / CD3217 / U5200 fault. Check PPDCIN_AON, SYS_DETECT

### Step 2: Check PP3V8_AON
- **Probe:** PP3V8_AON decoupling (C57xx/C58xx area, pages 57-58). Test point TP5700.
- **Expect:** 3.8V
- YES -> go to Step 3
- NO -> U5700 / phase drivers fault. Check P3V8AON_PWR_EN, P3V8AON_FAULT_L

### Step 3: Check PP5V_S2
- **Probe:** TPS62130 output (CC2xx/RC2xx area, page 122)
- **Expect:** 5.14V
- YES -> go to Step 4
- NO -> TPS62130 fault or P5V2TPS_PWR_EN not asserted

### Step 4: Check MPMU LDO Outputs (U8100)
- Check AON LDOs: PP1V8_AON, PP1V2_AON, PP1V5_AON_MPMU
- Check S2 rails: PP1V2_S2, PP1V8_S2SW
- ALL YES -> go to Step 5
- ANY NO -> Thermal cam on missing rail. If U8100 outputs all dead -> replace U8100

### Step 5: Check Viper VR (U9300) -- Pro/Max specific
- **Probe:** PPVDD_PCPU0_AWAKESW area (power stages 1, page 94)
- **Expect:** Variable voltage present (DVFS)
- YES -> go to Step 6
- NO -> U9300 Viper fault or PVDDVDN_FAULT_L active. Check 3 Viper power stages (pages 94-96)

### Step 6: Check Monaco VR -- Pro/Max specific
- **Probe:** Monaco0 (UA100) output area
- **Expect:** Variable voltage present (DVFS)
- YES -> SoC domains powered. Fault is downstream (display, storage, peripheral)
- NO -> Monaco VR fault. Check CLVR GPIO connections. Max variant: check if Monaco 3/4 are the failure point

## Power Domain Tables

### MPMU (U8100) Buck Outputs (page 82)

| Buck # | Rail | Vboot | Iout Max | State | Load |
|--------|------|-------|----------|-------|------|
| BUCK 0 | PPVDD_ECPU_AWAKE | 0.725V | 19.2A | AWAKE | Efficiency CPU |
| BUCK 1 | PPVDD_GPU_BMPR_S1 / ECPU_SRAM | * | varies | S1/AWAKE | GPU bumper + ECPU SRAM |
| BUCK 2 | PP1V8_S2SW | Variable | varies | S2 | Various S2 loads |
| BUCK 3 | PPVDD0H1_S2SW | Variable | varies | S2 | SoC VDD0H1 |
| BUCK 4 | PPVDD_AVEMSR_AWAKESW | 0.806V | 4.4A | AWAKE | AVEMSR |
| BUCK 5 | PPVDD_AMPH1_S2SW | 0.72V | 12.2A | S2 | Memory AMPH1 |
| BUCK 6 | PPVDD_AMPH0_S2SW | 1.213V | 2.1A | S2 | Memory AMPH0 |
| BUCK 7 | PP0V81_S1_SRAM | 0.81V | 2.1A | S1 | SoC SRAM |
| BUCK 8 | PP1V2_S2 | 1.225V | 3.2A | S2 | General S2 |
| BUCK 9 | PPVDD_FIXED_S1 | 0.806V | 2.1A | S1 | SoC fixed domain |
| BUCK 10 | PPVD75_S1_VDDQ1 | 0.575V | 5A | S1 | Memory VDDQ1 |

### SPMU (U7700) Buck Outputs (page 78)

| Buck # | Rail | Vboot | Iout Max | State | Load |
|--------|------|-------|----------|-------|------|
| BUCK 0 | PPVDD_DCS_S1 | - | - | S1 | DCS domain |
| BUCK 1 | PPVD75_S1_VDDQ0 | 0.575V | - | S1 | Memory VDDQ0 |
| BUCK 2 | PPVDD5_S2SW_VDDQ1 | - | - | S2 | VDDQ1 |
| BUCK 3 | PP1V2_S2_SPMU | 1.2V | - | S2 | S2 general |
| BUCK 4 | PPVDD0H2_S2SW | - | - | S2 | SoC VDD0H2 |
| BUCK 5 | PPVDD_SOC_S1 | - | - | S1 | SoC general |
| BUCK 6 | PPVD55_S2_VDDCIO | 0.857A | 3.4A | S2 | SoC CIO |
| BUCK 9 | PPVDD_D1SP_AWAKESW | 0.577V | 5A | AWAKE | Display alt |
| BUCK 11 | PPVDD_SOC_S1_REG | 0.725V | 12.2A | S1 | SoC S1 regulated |
| BUCK 12 | PP1V225_AWAKE | 1.225V | 2.1A | AWAKE | General AWAKE |
| BUCK 13 | PPVDD_D1SP2_AWAKESW | 1.218V | 2.4A | AWAKE | Display 2 (sC note) |
| BUCK 15 | NOT USED on sC designs | - | - | - | NC |
| BUCK 17 | PP1V8_S1_CLVR_VDDH | - | 19.2A | S1 | CLVR VDDH |
| BUCK 18 | PP1V8_S2_REG | 0.857V | 3.4A | S2 | S2 regulated |
| BUCK 19 | PPVDD_FABRIC_S1 | - | - | S1 | SoC Fabric |
| BUCK 20 | PPVDD_DISP_AWAKESW | 0.577V | 13.2A/14.3A | AWAKE | Display |

### Viper VR (U9300) -- PCPU Power (3 power stages)

| Stage | Output | Load | Variant |
|-------|--------|------|---------|
| Stage 1 (page 94) | PPVDD_PCPU0_AWAKESW | PCPU cluster 0 | All |
| Stage 2 (page 95) | PPVDD_PCPU1_AWAKESW | PCPU cluster 1 | Max only |
| Stage 3 (page 96) | Additional phases | Extended power | Max variant |
| All stages | PPVDD_PCPU_SRAM0_AWAKESW | PCPU SRAM 0 | All |
| All stages | PPVDD_PCPU_SRAM1_AWAKESW | PCPU SRAM 1 | Max only |

### Monaco VR -- GPU/Fabric Power (5 instances)

| Instance | Designator | CFG | Key Outputs | Page |
|----------|-----------|------|-------------|------|
| Monaco 0 | UA100 | C0, A0:A0 | S0VE, S0VS, MCPW, S0CL_CAMU, GACS | 101 |
| Monaco 1 | UA200 | C1, A1 | S0DL, AGXS | 102 |
| Monaco 2 | UA300 | C2, A1 | S0KE, S0PE | 103 |
| Monaco 3 | UA400 | C3, B0, IP_ | AFR, ANE1_SRAM, FABRIC_S1 | 104 |
| Monaco 4 | UA500 | sC/1C/2C multi | CLVR domains | 105 |
