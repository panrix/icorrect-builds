# A2337 Power Path - Human-Readable Diagnostic Reference

Board: A2337 (MacBook Air 13" M1, 820-02016, X1757/MLB)

**WARNING: This is an M1 board. NO MagSafe port. Two USB-C ports only. PMU uses SERA (Master/U8100) and SIMETRA (Slave/U7700) naming convention. Do NOT cross-reference M2 (A2681) test points or U-designators to this board.**

## Power Chain Overview

```
USB-C 5V -> CD3217 (UF400/UF500) -> Charger IC (U5200) -> PPBUS_AON (12.6V)
                                                              |
                                                         U5700 (SVR AON, 30A)
                                                              |
                                                        PP3V8_AON (3.8V)
                                                    ------+------+------
                                                    |           |       |
                                               U7700        U8100   UC100/UC200
                                             (SIMETRA)     (SERA)  (AON LDOs)
                                              Slave PMU   Master PMU
                                                    |           |
                                               SIMETRA     SERA Bucks
                                               Bucks/LDOs  & LDOs
                                                    |           |
                                                    +-----+-----+
                                                          |
                                                     SoC U6000
                                                  (M1 T8103 PCPU/ECPU/GPU)
```

Also from PPBUS_AON:
```
PPBUS_AON -> UC320 -> PP5V_S2 (5.15V)
PPBUS_AON -> XMC710 -> PP3V3_S2 (3.12V)
PPBUS_AON -> Load switches -> PP3V3_S2SW_IPD, PP5V_S2SW_IPD, PPBUS_AONSW_IPD
```

## Diagnostic Test Points

**NOTE: Test point references below are from the schematic. Probe at nearest accessible capacitor to each rail.**

### Step 1: PPBUS_AON
- **Probe: Bulk capacitor near U5200 output**
- **Expect: ~12V (battery connected)**
- YES -> go to Step 2
- NO -> Fault in charging circuit / CD3217 (UF400/UF500) / Charger IC (U5200)
  - Check: USB-C connector pins, CC line continuity
  - Check: CHGR_AUX_OK signal (page 24)
  - Check: SYS_DETECT circuit on BMU connector (J5100, page 22)

### Step 2: PP3V8_AON
- **Probe: Bulk capacitor on PP3V8_AON output**
- **Expect: 3.8V**
- YES -> go to Step 3
- NO -> Fault in U5700 (SVR AON)
  - Check: PPVAON_PWR_EN (enable signal - is it asserted?)
  - Check: PPVAON_FAULT_L (fault signal - is it pulled low?)
  - Check: U5910 current sense
  - Check: PP3V8_AON_VDDMAIN distribution for shorts

### Step 3: PP5V_S2
- **Probe: PP5V_S2 output capacitor**
- **Expect: 5.15V**
- YES -> go to Step 4
- NO ->
  - Check inductor/diode near UC320 (diode mode)
  - Check P5VS2_PWR_EN enable signal
  - UC320 fault if enable is present but no output

### Step 4: PMU LDO Outputs
- **SERA LDO 9 output -> expect ~1.8V** (AON)
- **SIMETRA LDO 9 output -> expect ~1.8V** (AON)
- **PP3V3_AON (UC100 output) -> expect 3.3V**
- **PP1V8_AON (UC200 output) -> expect 1.8V**
- ALL YES -> Fault is downstream of PMU. Investigate SoC domains.
- ANY NO -> go to Step 5

### Step 5: Thermal Imaging
- Apply thermal camera to the shorted rail
- **Hot chip found?**
  - YES -> Replace that chip
  - NO -> PMU is dead -> replace U8100 (SERA/Master) or U7700 (SIMETRA/Slave)

---

## Key Differences from A2681 (M2 Air)

| Feature | A2337 (M1) | A2681 (M2) |
|---------|------------|------------|
| SoC | M1 (T8103) | M2 |
| MagSafe | NO | YES (J5401) |
| USB-C Ports | 2 (left side) | 2 (left side) |
| Master PMU name | SERA (U8100) | MPMU (U8100) |
| Slave PMU name | SIMETRA (U7700) | SPMU (U7700) |
| 5V Buck | UC320 | UC300 |
| 3V3 Buck | XMC710 | UC710 |
| AON 3V3 LDO | UC100 (external) | MPMU LDO 5 (internal) |
| AON 1V8 LDO | UC200 (external) | MPMU LDO 9 (internal) |
| WiFi/BT Module | Rasputin | Typhoon |
| BEN IC | DP600 | U6560 |
| Display | eDP (LCD) | eDP (LCD) |

## Full Power Node Map

### Stage 1: USB-C Input (5V)
| Node | Voltage | IC | If Missing |
|------|---------|----|------------|
| PPVBUS_USBC0 | 5V->20V | UF400 (CD3217) | Cable/connector/CD3217 fault |
| PPVBUS_USBC1 | 5V->20V | UF500 (CD3217) | Cable/connector/CD3217 fault |

### Stage 2: PD Negotiation
| Signal | Function | Page |
|--------|----------|------|
| USBC0_CC1/CC2 | PD communication (port 0) | 55 |
| USBC1_CC1/CC2 | PD communication (port 1) | 56 |
| SPI_UPC0/UPC1 | CD3217 firmware ROM | 55, 56 |
| CHGR_AUX_OK | Charger ready indicator | 24 |

### Stage 3: Charger -> PPBUS
| Node | Voltage | IC | If Missing |
|------|---------|----|------------|
| PPBUS_AON | 12.6V | U5200 (charger) | Charger IC / CD3217 / battery fault |

### Stage 4: SVR AON -> 3V8
| Node | Voltage | IC | If Missing |
|------|---------|----|------------|
| PP3V8_AON | 3.8V | U5700 (30A, 1MHz) | U5700 fault / PPVAON_PWR_EN not asserted |
| PP3V8_AON_VDDMAIN | 3.8V | Distribution | Short on VDDMAIN caps |
| PP3V8_AON_VODMAN | 3.8V | Distribution | Feeds UC100/UC200 |

### Stage 5a: SERA (Master PMU / U8100) Outputs
| Output | Buck/LDO | State | Page |
|--------|----------|-------|------|
| PCPU | SERA BUCK 0 | ACTIVE | 32 |
| SW CTRL | SERA BUCK 1 | SW CTRL | 32 |
| Sleep domain | SERA BUCK 2 | SLEEP1 | 32 |
| Sleep domain | SERA BUCK 3 | SLEEP3 | 32 |
| Sleep domain | SERA BUCK 4 | SLEEP3 | 32 |
| Sleep domain | SERA BUCK 5 | SLEEP1 | 32 |
| Active | SERA BUCK 6 | ACTIVE | 32 |
| Active | SERA BUCK 7 | ACTIVE | 32 |
| SW CTRL | SERA BUCK 8 | SW CTRL | 33 |
| Sleep domain | SERA BUCK 9 | SLEEP1 | 33 |
| Sleep domain | SERA BUCK 10 | SLEEP1 | 33 |
| ECPU | SERA BUCK 11 | ACTIVE | 33 |
| Active | SERA BUCK 12 | ACTIVE | 33 |
| LDO | SERA LDO 1 | SLEEP2 | 34 |
| LDO | SERA LDO 2 | SLEEP2 | 34 |
| LDO | SERA LDO 3 | SLP_S2R | 34 |
| LDO | SERA LDO 4 | SW CTRL | 34 |
| LDO | SERA LDO 7 | SW CTRL | 34 |
| AON 1V8 equiv | SERA LDO 9 | ACTIVE | 34 |
| LDO | SERA LDO 10 | ACTIVE | 34 |
| LDO | SERA LDO 13 | SW CTRL | 34 |
| LDO | SERA LDO 16 | SW CTRL | 34 |
| **NC/SPARE** | **SERA LDO 19** | **SPARE** | 78 |
| LDO | SERA LDO 20 | SW CTRL | 34 |
| Switch | SERA SW1 | ACTIVE | 78 |

### Stage 5b: SIMETRA (Slave PMU / U7700) Outputs
| Output | Buck/LDO | State | Page |
|--------|----------|-------|------|
| Active | SIMETRA BUCK 13 | ACTIVE | 28 |
| Active | SIMETRA BUCK 14 | ACTIVE | 28 |
| LDO | SIMETRA LDO 8 | SLEEP2 | 29 |
| AON 1V8 equiv | SIMETRA LDO 9 | ACTIVE | 29 |
| LDO | SIMETRA LDO 10 | ACTIVE | 29 |
| LDO | SIMETRA LDO 11 | SLEEP2 | 29 |
| LDO | SIMETRA LDO 12 | SLEEP2 | 29 |
| Switch | SIMETRA SW4 | SLEEP2 | 78 |
| Switch | SIMETRA SW5 | SLEEP2 PAR | 78 |
| Switch | SIMETRA SW7 | SLEEP2 PAR | 78 |

### Stage 5c: External AON LDOs
| Output | Voltage | IC | Input | Page |
|--------|---------|----|-------|------|
| PP3V3_AON | 3.3V | UC100 | PP3V8_AON_VODMAN | 36 |
| PP1V8_AON | 1.8V | UC200 | PP3V8_AON_VODMAN | 36 |

### Stage 6: Standalone VRs
| Node | Voltage | IC | Enable | If Missing |
|------|---------|----|--------|------------|
| PP5V_S2 | 5.15V | UC320 | P5VS2_PWR_EN | UC320 / enable fault |
| PP3V3_S2 | 3.12V | XMC710 | P3V3S2_PWR_EN | XMC710 / enable fault |

### Stage 7: Load Switches
| Input | Output | Current Limit | Enable | Page |
|-------|--------|---------------|--------|------|
| PP3V3_S2 | PP3V3_S2SW_IPD | 400mA | MPMU GPIO6 | 40 |
| PP5V_S2 | PP5V_S2SW_IPD | 1.35A | MPMU GPIO6 | 40 |
| PPBUS_AON | PPBUS_AONSW_IPD | 3A | Self (3.13-5.93V) | 40 |

### Stage 8: Display Power
| Node | IC | Function | Page |
|------|----|----------|------|
| Display sequencer | UP700/UP705/UP715 | Panel power sequencing | 68 |
| Backlight | DP600 (BEN) | LCD/KBD backlight boost | 69 |
| eDP interface | Display connector | Panel data + MIPI camera | 67 |
