# iPad Schematic Research: Apple Silicon Models

**Date:** 2026-04-11
**Purpose:** Assess schematic/boardview availability for M1+ iPad models to evaluate adding iPad support to Elek diagnostic system

---

## 1. Apple Silicon iPad Models: Complete Reference

### iPad Pro 11" (M1) - 3rd Generation (2021)
- **A-numbers:** A2377 (WiFi), A2301 (WiFi+Cell US), A2459 (WiFi+Cell Global), A2460 (WiFi+Cell China)
- **Board number:** 820-02300 (WiFi), cellular variant TBD
- **Project codename:** J517
- **EMC:** 3681
- **SoC:** Apple M1

### iPad Pro 12.9" (M1) - 5th Generation (2021)
- **A-numbers:** A2378 (WiFi), A2379 (WiFi+Cell US), A2461 (WiFi+Cell Global), A2462 (WiFi+Cell China)
- **Board number:** Not confirmed in public sources (likely 820-02299 or 820-02301 range)
- **SoC:** Apple M1
- **Notable:** First iPad with mini-LED XDR display

### iPad Air (M1) - 5th Generation (2022)
- **A-numbers:** A2588 (WiFi), A2589 (WiFi+Cell US), A2591 (WiFi+Cell Global)
- **Board number:** Not confirmed in public sources
- **SoC:** Apple M1

### iPad Pro 11" (M2) - 4th Generation (2022)
- **A-numbers:** A2759 (WiFi), A2435 (WiFi+Cell US), A2761 (WiFi+Cell Global), A2762 (WiFi+Cell China)
- **Board numbers:** 820-02878 (variant 1), 820-03154 (variant 2) - per laptop-schematics.com
- **SoC:** Apple M2

### iPad Pro 12.9" (M2) - 6th Generation (2022)
- **A-numbers:** A2764 (WiFi+Cell), A2437, A2766
- **Board number:** 820-03095 - confirmed via laptop-schematics.com
- **Project codename:** J621
- **EMC:** 8176, 8177
- **SoC:** Apple M2

### iPad Pro 11" (M4) - 5th Generation (2024)
- **A-numbers:** A2836 (WiFi), A2837 (WiFi+Cell), A3006
- **Board number:** Not confirmed in public sources
- **SoC:** Apple M4 (N3E process, deca-core)
- **Notable:** First M4 device from Apple

### iPad Pro 13" (M4) (2024)
- **A-numbers:** A2925 (WiFi), A2926 (WiFi+Cell), A3007
- **Board number:** Not confirmed in public sources
- **SoC:** Apple M4

### iPad Air 11" (M2) (2024)
- **A-numbers:** A2902 (WiFi), A2903 (WiFi+Cell)
- **Board number:** Not confirmed in public sources
- **SoC:** Apple M2

### iPad Air 13" (M2) (2024)
- **A-numbers:** A2898 (WiFi), A2899 (WiFi+Cell US), A2900 (WiFi+Cell Global)
- **Board number:** Not confirmed in public sources
- **SoC:** Apple M2

### Other Notable Apple Silicon iPads (non-M series)
- **iPad mini 6 (A15 Bionic):** A2568/A2569 - listed on laptop-schematics.com
- **iPad 10th Gen (A14 Bionic):** A2696/A2757/A2777 - listed on laptop-schematics.com
- **iPad A16 11" (A16):** A3354 - listed on laptop-schematics.com

---

## 2. Schematic & Boardview Availability

### Availability Matrix

| Model | Board # | Schematic | Boardview | Source |
|-------|---------|-----------|-----------|--------|
| iPad Pro 11" M1 (A2377) | 820-02300 | YES (paid) | YES (paid) | laptop-schematics.com ($40) |
| iPad Pro 12.9" M1 (A2378) | Unknown | Likely available (paid) | Likely available (paid) | laptop-schematics.com lists model |
| iPad Air M1 (A2588) | Unknown | Layout/bitmap available | Layout available | DZKJ (bitmap), Badcaps requests |
| iPad Pro 11" M2 (A2759) | 820-02878, 820-03154 | Listed (paid) | Listed (paid) | laptop-schematics.com |
| iPad Pro 12.9" M2 (A2764) | 820-03095 | NO (boardview only) | YES (paid, $12) | laptop-schematics.com |
| iPad Pro 11" M4 (A2836) | Unknown | Listed (paid) | Listed (paid) | laptop-schematics.com |
| iPad Pro 13" M4 (A2925) | Unknown | Not found | Not found | No confirmed source |
| iPad Air M2 11" (A2902) | Unknown | Listed (paid) | Listed (paid) | laptop-schematics.com |
| iPad Air M2 13" (A2898) | Unknown | Not found | Not found | No confirmed source |

### Key Findings

1. **laptop-schematics.com is the primary commercial source.** They list schematic + boardview packages for most Apple Silicon iPad models at $12-$40. Updated regularly (last update Nov 2025 for M1 Pro).

2. **Badcaps forum has NO Apple Silicon iPad schematics in their free collection.** The comprehensive ".pcb file collection" thread covers up to iPad Pro 12.9 4th Gen (A2229, pre-M1) and iPad Air 4 (A2316, A14 chip). M1+ models are absent.

3. **ZXW (Chinese boardview tool) has limited iPad coverage.** iPad Pro models are described as a "weak spot" in ZXW. M1/M2/M4 coverage is unconfirmed.

4. **DZKJ has bitmap/layout files** for iPad Air 5 (A2588/M1) and some older iPad Pro models. Full schematics for M1+ unclear.

5. **Free schematic/boardview availability: NONE** for Apple Silicon iPads. All confirmed sources are paid.

6. **Compared to MacBook M1 schematics:** MacBook Pro M1 (820-02020) schematics are actively discussed on Badcaps, suggesting MacBook schematics leak more readily than iPad ones.

---

## 3. Comparison to MacBook Boards

### Architecture Similarities

Both Apple Silicon iPads and MacBooks share:
- **Same M-series SoC family** (M1/M2/M4)
- **Unified memory architecture** (LPDDR4X/LPDDR5/LPDDR5X soldered to SoC package)
- **Similar power management IC families** (Apple 343Sxxxxx series PMICs)
- **Similar storage architecture** (NAND flash with Apple SSD controller integrated in SoC)
- **Same Thunderbolt/USB4 controller approach** (integrated or Apple custom)

### M4 iPad Pro Chip Architecture (from iFixit teardown)

Key ICs identified on M4 iPad Pro 13" board:

**Power Management (5 PMICs):**
- Apple APL1066/343S00682
- Apple APL1067/343S00683
- Apple 343S00613-A0
- Apple 343S00377
- Qualcomm PMX65-000

**Connectivity:**
- Apple 339S01360 (WiFi/BT module)
- Qualcomm SDX70M-000 (Snapdragon X70 modem)
- Qualcomm SDR735-001 (RF transceiver)

**Other:**
- Texas Instruments SN25A23 (USB-C controller)
- Analog Devices MAX98709B (audio amp)
- STMicroelectronics ST33J (secure MCU)
- Multiple Skyworks/Broadcom front-end modules

### Key Differences from MacBook

| Aspect | MacBook | iPad Pro |
|--------|---------|----------|
| Form factor | Larger board, more space | Ultra-compact, components extremely dense |
| Battery | Single large cell, screwed | 2-4 cells, adhesive pull tabs |
| Connectors | MagSafe, USB-C ports, headphone jack | Single USB-C, no user-facing connectors |
| Display connection | eDP/LVDS via cable | Flex cable, direct to board |
| Cellular modem | None (most models) | Qualcomm modem + RF chain |
| Repairability | Board accessible after bottom case | Requires full screen removal first |
| Thermal design | Fan + heat pipe | Passive: graphite sheets + copper logo |
| Daughterboards | Separate, replaceable | Fragile, glued, bend easily |
| PMIC architecture | Similar Apple 343S series | Similar Apple 343S series + Qualcomm PMX for modem |

### Board-Level Repair Feasibility

**Similarities that help:**
- Same SoC means similar power rail architecture
- Same PMIC families mean similar diagnostic approaches
- Diode mode measurements on power rails should follow similar patterns
- Many of the same ICs appear on both platforms

**Challenges specific to iPad:**
- Board density is significantly higher (thinner device, less board area)
- Components are smaller, tighter pitch
- Daughterboards are extremely fragile ("bent out of shape if you look at it wrong" per iFixit)
- Screen removal required for any board access (high risk of display damage)
- Adhesive-heavy construction makes non-destructive disassembly difficult
- Cellular models add modem/RF complexity not present in most MacBooks

---

## 4. Feasibility Assessment for Elek Diagnostic System

### Can We Add iPad Support?

**YES, with caveats.**

**What we can do now:**
- Schematics and boardviews exist for most M1 and M2 iPad Pro models via paid sources (laptop-schematics.com, $12-$40 per model)
- The power management architecture is similar enough to MacBook that the same diagnostic methodology applies
- Board numbers are known for key models (820-02300, 820-02878, 820-03154, 820-03095)

**What's harder:**
- M4 iPad Pro schematics are newest and least available (11" M4 listed, 13" M4 not confirmed)
- iPad Air models have the weakest schematic coverage
- No free/community schematics available (unlike some MacBook models)
- Every schematic requires purchase from commercial providers

**Recommended approach:**
1. Start with iPad Pro 11" M1 (820-02300) as pilot: best documented, most forum discussion, schematic available for $40
2. Add iPad Pro M2 models next (board numbers confirmed, available on laptop-schematics.com)
3. iPad Air and M4 models last (least documentation, newest)

**Cost estimate for full coverage:**
- ~8-10 schematic/boardview packages at $12-$40 each
- Total: approximately $150-$300 for comprehensive iPad schematic library

### Integration Considerations
- Board format is the same as MacBook (.brd/.pcb for boardview, PDF for schematics)
- Existing boardview software (FlexBV, OpenBoardView) works with iPad files
- Diagnostic approach (diode mode measurements, power rail tracing) is directly transferable
- Need to account for cellular-specific circuits (modem PMICs, RF chain) not present in MacBook diagnostics

---

## 5. Sources Summary

**Primary commercial sources:**
- laptop-schematics.com: Most comprehensive, covers M1 through M4, paid ($12-$40)
- DZKJ (dzkj16888.com): Chinese source, has bitmap/layout files, coverage of newer models unclear
- schematic-expert.com: Blocked during research, claims iPad schematic PDFs

**Community sources:**
- Badcaps.net: Free .pcb collection covers up to pre-M1 models only. Active request threads for M1+ models go unanswered.
- LogiWiki (logi.wiki): Blocked during research. Known to track schematic availability status.
- iFixit: Chip ID guides available (M4 iPad Pro fully documented). No schematics.
- ZXW: Limited iPad coverage, M1+ status unclear.

**Key gap:** No free/leaked schematics for any Apple Silicon iPad model confirmed. This contrasts with MacBook where community sharing is more active.
