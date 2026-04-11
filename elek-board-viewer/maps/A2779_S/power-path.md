# A2779_S Power Path — Human-Readable Diagnostic Reference

Board: A2779 Standard (MacBook Pro 14" M2 Pro, 820-02841, X2523/MLB_S)

## WARNING

**This is the STANDARD (S) variant only** — M2 Pro, no M2 Max. The C/CTO/Max variant (820-02655) has different component designators and additional power phases. Do NOT mix test points between S and C variants.

**Component designators are board-specific.** The same rail appears at DIFFERENT components on other boards. These test points are for 820-02841 ONLY.

## Power Chain Overview

```
USB-C 5V → CD3217 (UF400/UF500/UF600) → Charger IC (pg 29) → PPBUS_AON (12.6V)
                                                                     │
                                                                U5700 (SVR AON, 30A, 3-phase)
                                                                     │
                                                               PP3V8_AON (3.8V)
                                                          ┌──────────┼──────────┐
                                                     U7700 (SPMU)    │    U8100 (MPMU)
                                                          │          │          │
                                                     SPMU Bucks  Austringer  MPMU Bucks
                                                     SPMU LDOs   (U9300)    MPMU LDOs
                                                          │       5 phases      │
                                                          │          │          │
                                                     └────┼──────────┼──────────┘
                                                          │          │
                                                    ┌─────┴─────┐    │
                                               CLVR0  CLVR1  CLVR2  │
                                               (UA100)(UA200)(UA600) │
                                                    │    │     │     │
                                                    └────┴─────┴─────┘
                                                              │
                                                         SoC U6000
                                                    (M2 Pro — PCPU/ECPU/GPU/ANE)
```

## Key Differences from A2681 (MacBook Air M2)

- **3 USB-C ports** (ATC0 left, ATC1 left, ATC2 right) vs 2
- **Austringer VR** (U9300, 5 phases) for high-current SoC domains — not on A2681
- **3 CLVR instances** (CLVR0/1/2 via UA100/UA200/UA600) — not on A2681
- **UC259** for 5V S2 buck (vs UC300 on A2681)
- **Willamette WiFi/BT** (vs Typhoon on A2681)
- **Luxe backlight** (UP800) vs BEN (U6560)
- **HDMI port** and **SD card reader** — not on A2681
- **Dual fans** (FAN0 left, FAN1 right)
- **SPMU Buck 7 is NC** on S variant (used only on C/Max variant)

## Diagnostic Test Points

### Step 1: PPBUS_AON
- **Expect: ~12V (battery) or rising voltage (adapter only)**
- YES → go to Step 2
- NO → Fault in charging circuit / CD3217 (UF400/UF500/UF600) / Charger IC
  - Check: USB-C connector pins, CC line continuity
  - Check: MagSafe Q5401 MOSFET pair (DS485)
  - Check: F5601 fuse (MagSafe power)
  - Check: SYS_DETECT circuit (J5150/U5150 — BLKAMPMHY CRITICAL)

### Step 2: PP3V8_AON
- **Expect: 3.8V**
- YES → go to Step 3
- NO → Fault in U5700 (SVR AON, 30A, 3-phase)
  - Check: PPVAON_PWR_EN (enable signal — is it asserted from J5150?)
  - Check: PPVAON_FAULT_L (fault signal — is it pulled low?)
  - Check: 3V8 VR enable delay circuit (page 30)
  - Check: PP3V8_AON_VDDMAIN for short (common fault)

### Step 3: PP5V_S2
- **Expect: 5V**
- YES → go to Step 4
- NO → UC259 fault or P5V2TPS_PWR_EN not asserted

### Step 4: MPMU (U8100) LDO Outputs
- Check AON LDOs: PP1V8_AON_MPMU (1.8V), PP1V2_AON_MPMU (1.2V), PP3V_AON (3.0V)
- ALL YES → Fault is downstream of PMU. Check Austringer/CLVR domains.
- ANY NO → go to Step 5

### Step 5: SPMU (U7700) Outputs
- Check: PP1V8_AON_SPMU (1.8V), PP1V2_AON_SPMU (1.2V)
- Note: SPMU Buck 7 is NC on S variant — do NOT expect output from it

### Step 6: Austringer (U9300) Output
- Check: PPVDD_SRAM_MAMEISM rails
- If missing → Check Austringer controller (page 48), power stage caps (pages 49-50)
- Check: FIVSDOH_FAULT_L, FIVSDOH_SMOS_FAULT_L

### Step 7: CLVR Outputs
- Check CLVR0 (UA100): PPVDD_PCPU1 domains
- Check CLVR1 (UA200): PPVDD_GPU_SRAM domains
- Check CLVR2 (UA600): PPVDD_ANE_SRAM domains (S variant specific)
- Note: CLVR address straps and config differ between S and C/D variants (page 54)

### Step 8: Thermal Imaging
- If a rail is shorted, apply thermal camera
- Identify hot component → cross-reference with rails/ICs

---

## Full Power Node Map

### Stage 1: USB-C Input (5V)
| Node | Voltage | IC | Port | Page |
|------|---------|-----|------|------|
| PPVBUS_USBC0 | 5V→20V | UF400 (CD3217) | Left Upper | 74 |
| PPVBUS_USBC1 | 5V→20V | UF500 (CD3217) | Left Lower | 75 |
| PPVBUS_USBC23 | 5V→20V | UF600 (CD3217) | Right | 83 |
| MagSafe VBUS | 5V→20V | MagSafe Controller | J5401 | 31-33 |

### Stage 2: Charger → PPBUS
| Node | Voltage | IC | Page |
|------|---------|-----|------|
| PPCON_ACNSW | ~5-20V | Input path | 29 |
| PPBUS_AON | 12.6V | Charger IC | 29 |

### Stage 3: SVR AON → 3V8
| Node | Voltage | IC | Page |
|------|---------|-----|------|
| PP3V8_AON | 3.8V | U5700 (30A, 3-phase) | 34-35 |
| PP3V8_AON_VDDMAIN | 3.8V | Distribution | 139 |
| PP3V8_AON_WLBT | 3.8V | Distribution | 98, 139 |

### Stage 4a: MPMU (U8100) Outputs
| Output | Rail | Buck/LDO | State | Page |
|--------|------|----------|-------|------|
| SRAM S1 | PPVDD_SRAM_S1 | BUCK 0 | S1 | 43 |
| GPU SRAM S1 | PPVDD_GPU_SRAM_S1 | BUCK 1 | S1 | 43 |
| AMPH1 | PPVDD_AMPH1_S2SM | BUCK 3 | S2 | 43 |
| VDD2H | PPVDD2HS_S2SM | BUCK 4 | S2 | 43 |
| PLL | PP1V2_MAME_PLL | BUCK 5 | AWAKE | 43 |
| DISP | PPVDD_DISP_MAMEISM | BUCK 6 | AWAKE | 43 |
| Austringer | PPVDD_JUSTBR_MAMEISM | BUCK 7 | AWAKE | 43 |
| 1V25 S2 | PP1V25_S2 | BUCK 8 | S2 | 43 |
| FIXED | PPVDD_FIXED_S1 | BUCK 9 | S1 | 43 |
| VDD1 | PPVDD1_S2 | BUCK 10 | S2 | 43 |
| AON 1V8 | PP1V8_AON_MPMU | LDO 9 | AON | 42 |
| AON 1V2 | PP1V2_AON_MPMU | LDO 9B | AON | 42 |
| 3V AON | PP3V_AON | LDO 5 | AON | 42 |
| LDOINT | PP1V05_LDOINT_MPMU | LDOINT | AON | 42 |

### Stage 4b: SPMU (U7700) Outputs
| Output | Rail | Buck/LDO | State | Page |
|--------|------|----------|-------|------|
| DCS S1 | PPVDD_DCS_S1 | BUCK 0 | S1 | 39 |
| 0E S1 | PPVDD0E_S1 | BUCK 1 | S1 | 39 |
| ECPU SRAM | PPVDD_ECPU_SRAM_MAMEISM | BUCK 2 | AWAKE | 39 |
| VDD2H | PPVDD2HS_S2SM | BUCK 3 | S2 | 39 |
| SOC S1 | PPVDD_SOC_S1 | BUCK 4 | S1 | 39 |
| CIO | PPVDD_CIO_S2SM | BUCK 5 | S2 | 39 |
| **NC** | **SPMU Buck 7** | **NC on S** | **NC** | 39 |
| 1V2 MAME | PP1V2_MAME | BUCK 8 | AWAKE | 39 |
| ECPU | PPVDD_ECPU_MAMEISM | BUCK 10 | AWAKE | 39 |
| AON 1V8 | PP1V8_AON_SPMU | LDO 9 | AON | 38 |
| AON 1V2 | PP1V2_AON_SPMU | LDO 9B | AON | 38 |

### Stage 5: Austringer (U9300)
| Output | IC | Phases | Page |
|--------|-----|--------|------|
| PPVDD_SRAM_MAMEISM | U9300 (Austringer) | 5 (PH1-PH5) | 47-50 |

### Stage 6: CLVR Instances
| Instance | IC | CFG | Outputs | Page |
|----------|-----|-----|---------|------|
| CLVR0 | UA100 | D (12+2+12+2) | PPVDD_PCPU1 domains | 51 |
| CLVR1 | UA200 | A (13+1+13+1) | PPVDD_GPU_SRAM domains | 52 |
| CLVR2 (S) | UA600 | C (6+1+13+6) | PPVDD_ANE_SRAM domains | 53-54 |

### Stage 7: Standalone VRs
| Node | Voltage | IC | Enable | Page |
|------|---------|-----|--------|------|
| PP5V_S2 | 5.15V | UC259 | P5V2TPS_PWR_EN | 55 |

### Stage 8: Display Power
| Node | IC | Function | Page |
|------|-----|----------|------|
| Display sequencer | UP710/UP730/UP701 | Panel sequenced rails | 114 |
| Luxe backlight | UP800 (RAX2915GKE) | LCD LED string drive | 115 |
| PP3V8_MAME_TCON | Feed from 3V8 | TCON power to display board | 114 |
