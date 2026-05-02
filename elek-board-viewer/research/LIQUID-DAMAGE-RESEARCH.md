# Liquid Damage Research: Apple Silicon MacBooks

**Date:** 2026-04-11
**Purpose:** Liquid damage zones, corrosion patterns, diagnostic methodology, and repair approaches for Apple Silicon MacBooks (M1/M2/M3/M4)
**Context:** Supplements existing power path maps, diagnostic trees, and schematic data for 14 Apple Silicon boards

---

## 1. Liquid Damage Zones by Model Family

### MacBook Air (A2337 M1 / A2681 M2 / A3113 M3)

**Liquid Entry Points:**
- Keyboard deck: liquid seeps through key switches into the top case
- Speaker grilles (left and right): direct path to internal components
- Hinge area: liquid runs down from screen/lid into the base
- Ventilation openings (M2/M3 models with passive cooling have fewer but still present gaps)

**Pooling Zones:**
- Under the logic board: liquid from keyboard spills pools beneath the motherboard and under the battery (confirmed A2337)
- Trackpad area: small board mounted to the top case under the trackpad handles keyboard/trackpad function; highly vulnerable to liquid pooling
- Battery connector region: heavy corrosion frequently observed here
- Speaker connector areas: liquid pools near speaker flex cable connections

**Known Weak Spots:**
- Trackpad flex cable and connector: corrosion causes keyboard/trackpad failure (most common symptom on Air models)
- Battery connector: corrosion causes charging issues, battery swelling when one cell shorts
- Audio board connector: separate small board on Air models; liquid bridges connections
- Fan-less design (Air): no active airflow to help dry internal moisture, prolonging liquid contact time

### MacBook Pro 14" (A2442 M1 Pro / A2779 M2 Pro / A2918 M3 Pro / A3401 M4 Pro)

**Liquid Entry Points:**
- Keyboard deck (primary entry point for spills)
- Speaker grilles flanking keyboard
- USB-C/MagSafe/HDMI/SD card ports (side entry from desk-level spills)

**Pooling Zones:**
- NAND area: liquid pools around storage chips; discoloration observed on UN000 (A2442 case)
- Area beneath stickers covering main power controller: hidden pooling zone
- Speaker connector region: capacitors near speaker connectors (C6405, C6456, C6555, C6556) frequently short
- TouchID flex cable area: CT610 capacitor shorts observed on A2779

**Known Weak Spots:**
- NAND/SSD area: liquid causes brown discoloration, Error 21 in DFU, storage controller failure
- LCD backlight circuit: RENESAS 209100B IC failure common; backlight fails while display image persists
- MagSafe connector area: corrosion starts near power connector and migrates toward storage controller
- USB-C port controllers: CD3217 corrosion causes stuck-at-5V symptoms

### MacBook Pro 16" (A2485 M1 Max / A2780 M2 Pro/Max)

**Liquid Entry Points:**
- Same as 14" but larger keyboard deck area increases exposure surface
- Larger speaker grilles provide more entry points

**Pooling Zones:**
- Speaker amplifier area: corrosion affects 3V and 5V accessory rails, display backlight output, and speaker amplifiers
- Battery region: eight adhesive tabs on battery edges can trap liquid

**Known Weak Spots:**
- PP3V8_AON rail components: A2780 cases show persistent shorts even after removing U5700, Q5800, Q5820, Q5840
- PPBUS_AON to PP3V8_AON conversion circuit: complex failure mode where short persists through component removal
- Speaker amplifier ICs: audio circuit corrosion common due to proximity to speaker grilles

---

## 2. Common IC Failures and Symptoms

### Power Management

| IC | Function | Failure Symptom | Notes |
|---|---|---|---|
| U8100 (mPMU) | Main power management unit | No boot, no power rails | Injecting 1V on PP3V8_AON_MPMU_ISNS_VIN shows heat from mPMU if shorted |
| U7700 (sPMU) | Secondary PMU | Missing secondary rails | Often replaced alongside mPMU in liquid cases |
| U5700 | Buck converter for PP3V8_AON | PP3V8_AON reads 0V, diode mode 0.13V | Replacement restores 3V8 rail |
| UP700 | 1V25 line regulator | Power cycling, boot loops | A2681 case: replacement allowed 20V negotiation |
| UP900 | Keyboard backlight PWM | Stuck at 5V, no charge negotiation | Corrosion-caused short on A2338 |

### USB-C / Power Delivery

| IC | Function | Failure Symptom | Notes |
|---|---|---|---|
| CD3217 (UF400/UF500) | USB-C port controller (TI) | Stuck at 5V, no 20V negotiation | Version code "B12" must match; ROM dumps must be from same board model |
| UF260 | USB ROM chip | No charge, 5V/0.225A dropping to 0.055A | Pin 8 vulnerable to corrosion; reflowable with Amtech V2 flux |
| UC710 | USB-related IC | Missing PP3V3_S2, PPDCIN_USBC_AON cycling | Corrosion-caused failure on A2338 |

### Storage / NAND

| IC | Function | Failure Symptom | Notes |
|---|---|---|---|
| UN000 | NAND flash storage | Exclamation point on boot, Error 21 in DFU | Visible brown discoloration from liquid; donor NAND may not resolve if controller damaged |
| U1900 | Storage-related controller | DFU restore fails at ~20% progress | A2681 case: replacement extended progress bar but didn't complete |
| SSD Controller (in SoC) | Storage management | Error 4014/4041 in DFU | Integrated into Apple Silicon; not independently replaceable |

### Display / Backlight

| IC | Function | Failure Symptom | Notes |
|---|---|---|---|
| RENESAS 209100B | LCD backlight driver | No backlight, image visible with flashlight | Common on Pro 14" liquid damage |
| Backlight fuse | Backlight circuit protection | No backlight | Check before replacing driver IC |

### Other Components

| IC | Function | Failure Symptom | Notes |
|---|---|---|---|
| QD530 | Unknown (power-related) | Part of multi-component failure | Frequently corroded in A2338 liquid cases |
| UD560 | Unknown | Corrosion damage | Found corroded alongside multiple ICs |

---

## 3. DCPS Current Draw Signatures

### Normal Power-Up Sequence (Apple Silicon)
1. USB-C connected: 5V negotiation phase (0.1-0.3A)
2. CD3217 negotiates PD: transitions to 20V
3. 20V at 0.05-0.15A during idle boot
4. Current ramps as SoC initializes

### Liquid Damage Signatures

**Stuck at 5V (most common):**
- 5V/0.2-0.4A cycling: board repeatedly tries to boot but fails (A2681 pattern)
- 5V/0.225A dropping to 0.055A after 6 seconds: CD3217/ROM issue (A2338 pattern)
- 5V pulsing/cycling: downstream short after power distribution fuses (FF200/FF201)
- 5V stable but no 20V negotiation: CD3217 corrosion, ROM corruption, or UC710 failure

**Short Circuit Indicators:**
- 1V injection draws >3A with nothing heating up: internal PCB substrate short (check C6905/C6900 area)
- PP3V8_AON diode mode <0.2V: short on 3V8 rail (normal ~0.4-0.5V)
- PP3V8_AON diode mode 0.13V with 0V voltage: U5700 buck converter failure
- CT610 (TouchID area) short to ground <1 ohm: capacitor corrosion on A2779

**Power Cycling:**
- PPDCIN_USBC_AON fluctuating: fuse isolation test (remove FF200/FF201 individually)
- If removing FF200 stabilizes 5V: short is downstream of that fuse's USB-C port
- If both fuse removals still show cycling: issue is upstream or affects both ports

### Key Diagnostic Measurements (Reference Values)

| Rail | Normal Voltage | Normal Diode Mode | Liquid Damage Indicator |
|---|---|---|---|
| PPBUS_AON | 12.3V | varies | Short if <1 ohm to ground |
| PP3V8_AON | 3.8V | 0.4-0.5V | Short if <0.2V diode mode |
| PP5V_S2 | 5.19V | varies | Should be present with any power |
| PP3V3_S2 | 3.3V | varies | Absent = UC710 or related failure |
| PP1V8_AON | 1.8V | varies | Should be present early in sequence |
| PP1V25_S2 | 1.22V | varies | Dependent on PP3V3_S2 |
| PP1V5_LDOINT_MPMU | 1.5V | varies | mPMU internal regulator |
| NAND PP2V58 | 2.58V | varies | Storage power |
| NAND PP1V25 | 1.25V | varies | Storage power |
| NAND PP0V88 | 0.88V | varies | Storage power |

---

## 4. Multi-Fault Diagnostic Methodology

### The Liquid Damage Problem
Liquid damage is fundamentally different from single-component failure because:
- Multiple circuits are affected simultaneously
- Corrosion is progressive (continues after liquid dries)
- Hidden damage under BGA chips may not be visible
- Fixing one fault may reveal another that was masked
- Battery voltage accelerates electrochemical corrosion across copper traces

### Physical-First vs Electrical-First Approach

**Recommended: Physical-First for Liquid Damage**

1. **Disconnect battery immediately** (prevents ongoing electrochemical corrosion)
2. **Visual inspection under microscope** before any cleaning
   - Document all visible corrosion locations
   - Photograph affected areas
   - Note which connectors show oxidation
   - Check under stickers and shielding
3. **Ultrasonic cleaning** (15 min at 40C with electronics-safe detergent)
   - Critical: removes corrosion from under BGA chips where toothbrush cannot reach
   - Follow with IPA rinse to displace water
   - Blow dry with compressed air
   - **WARNING:** Some sources note that boards from 2015+ MacBook Pros should not be put through ultrasonic baths as it may damage the CPU; exercise caution with Apple Silicon boards
4. **Post-clean microscope inspection**
   - Look for: discoloration, pitting on metal contacts, broken solder joints
   - Check under connectors where corrosion hides
   - Identify components with visible damage for replacement
5. **Only then: electrical testing**
   - Connect DCPS (not battery) for controlled power-up
   - Check power rails sequentially
   - Use thermal camera during powered testing

### Multi-Fault Diagnostic Tree

```
LIQUID DAMAGE BOARD
|
+-- Step 1: Clean (ultrasonic)
+-- Step 2: Visual inspection (document all damage)
+-- Step 3: DCPS power-up (5V, current-limited)
|   |
|   +-- Stuck at 5V?
|   |   +-- Check CD3217 (UF400/UF500) for corrosion
|   |   +-- Check UF260 (USB ROM) pin 8
|   |   +-- Check UC710
|   |   +-- Fuse isolation test (FF200/FF201)
|   |
|   +-- 5V cycling/pulsing?
|   |   +-- Downstream short after fuses
|   |   +-- Check PPDCIN_USBC_AON
|   |   +-- Isolate each port
|   |
|   +-- Reaches 20V but no boot?
|       +-- Check PP3V8_AON (U5700)
|       +-- Check mPMU (U8100)
|       +-- Check NAND power rails
|
+-- Step 4: Rail-by-rail testing
|   +-- PP3V8_AON present?
|   |   +-- No: Check U5700, diode mode test
|   |   +-- Yes: Check downstream rails
|   |
|   +-- PP1V8_AON present?
|   +-- PP3V3_S2 present?
|   +-- PP1V25_S2 present?
|   +-- NAND rails present?
|
+-- Step 5: Thermal imaging
|   +-- Inject voltage on shorted rail
|   +-- Look for hot spots with FLIR
|   +-- Apply IPA to localize heat source
|   +-- Identify and replace shorted component
|
+-- Step 6: Functional testing
    +-- DFU restore attempt
    +-- Check for Error codes (21, 4014, 4041)
    +-- Display/backlight test
    +-- Keyboard/trackpad test
    +-- All ports test
```

---

## 5. Cleaning and Repair Procedures

### Ultrasonic Cleaning Protocol

**Equipment:**
- Ultrasonic cleaner (40kHz recommended)
- Electronics-safe detergent
- 99% isopropyl alcohol (reagent grade)
- Lint-free towels
- Compressed air or electric air gun
- Stereo microscope

**Procedure:**
1. Remove logic board from chassis completely
2. Remove heat sink and clean off thermal paste
3. Pre-clean: toothbrush + 99% IPA for visible corrosion
4. Ultrasonic bath: 15 minutes at 40C with electronics-safe detergent
5. Rinse: shallow bath of 99% IPA for several minutes to displace water
6. Dry: compressed air, paying attention to under connectors and BGA areas
7. Allow 24 hours complete drying before testing
8. Post-clean microscope inspection

**Limitations:**
- Ultrasonic cleaning alone will NOT fix damaged components
- Cleaning halts corrosion progression but doesn't reverse damage
- Components with broken solder joints or trace damage need replacement
- Some boards may need re-cleaning if initial pass doesn't remove all deposits

### When Cleaning is Sufficient vs Board Work Required

**Cleaning Sufficient:**
- Light surface corrosion only
- No shorted components
- Board powers up normally after cleaning
- All rails present at correct voltages
- Keyboard/trackpad functional

**Board Work Required:**
- Shorted capacitors or ICs (diode mode readings abnormal)
- Missing power rails after cleaning
- Visible component damage (burned, discolored, or missing parts)
- Board stuck at 5V or power cycling
- DFU errors during restore
- Display/backlight failure

### Component Replacement Notes
- Use Hakko FM-2032 or equivalent microsoldering iron
- ULPA-filtered clean bench recommended (0.02um)
- CD3217 version code must match (e.g., "B12")
- USB ROM dumps must come from exact same board model
- CH341 programmer used for ROM reflashing
- Amtech V2 flux for reflow work
- Always compare measurements against known-good reference board

---

## 6. Apple Silicon Specific Considerations

### Architecture Differences from Intel

**Unified Memory:**
- RAM is integrated into the SoC package (LPDDR4X/LPDDR5)
- RAM failure = logic board replacement (no DIMM swaps)
- However, RAM is well-protected inside the SoC package; liquid rarely reaches it directly

**Integrated SSD Controller:**
- SSD controller moved into the Apple Silicon SoC
- NAND chips are soldered to the logic board
- Encryption keys generated in Secure Enclave during initial setup
- Keys fused to that specific processor; never leave the SoC
- AES-256 encryption in XTS mode on all storage writes
- Desoldering NAND produces only ciphertext; useless without original SoC

**Power Architecture Changes (vs Intel):**
- No S5-S0 sleep state sequence (simplified power states)
- SSD is always powered on (like T2 boards)
- All CPU power rails generated by Apple proprietary PMU
- Most important rails: PP3V8_AON and PP5V_S2
- PP3V8_AON powers the mPMU which distributes rails to the M-series processor

### Data Recovery Implications

**On Apple Silicon, data recovery IS board repair:**
- Cannot remove NAND and read externally
- Cannot transplant NAND to donor board (encryption pairing)
- Must repair the original logic board enough to power the SSD controller
- Recovery method: repair power rails -> boot to DFU/Recovery -> extract via Thunderbolt Share Disk
- CPU/NAND/EEPROM swap to donor board is last resort (transplant original SoC, NAND, and EEPROMs to working donor)

**Catastrophic vs Recoverable:**
- If SoC itself is damaged (liquid on the chip package): likely unrecoverable
- If damage is to power management/delivery only: high recovery chance
- If NAND chips physically damaged (corrosion on pads): data loss likely
- If only peripheral ICs affected (USB-C, backlight, keyboard): good prognosis

### Security/Pairing After Repair

- Activation Lock tied to Apple ID via Secure Enclave
- Component pairing enforced: display, battery, Touch ID, camera
- After board repair, components may need re-pairing via Apple System Configuration (ASC)
- Touch ID replacement requires Apple's calibration tool
- Battery health data may reset after connector/battery replacement

---

## 7. Repair Success Rates and Prognosis Indicators

### Overall Success Rates

| Severity | Success Rate | Notes |
|---|---|---|
| Light (surface corrosion only) | 85-90% | Cleaning often sufficient |
| Moderate (1-3 component failures) | 60-80% | Standard board-level repair |
| Severe (multiple rail shorts, NAND affected) | 30-50% | Complex multi-fault repair |
| Catastrophic (SoC damage, extensive board corrosion) | <10% | Often uneconomical |

### Positive Prognosis Indicators
- Board powers from battery (SoC likely OK)
- Reaches 20V on DCPS (power delivery working)
- NAND rails present and at correct voltage
- DFU mode accessible
- Corrosion limited to one area of the board
- Liquid was water (not sugary/acidic)
- Board was powered off quickly after spill
- Professional cleaning within 48 hours

### Negative Prognosis Indicators
- Board does not power from battery or DCPS
- Multiple power rails shorted simultaneously
- NAND area shows brown discoloration
- DFU errors 4014, 4041 (storage controller issue)
- Error 21 persists after NAND replacement (controller in SoC damaged)
- Extensive corrosion across multiple board areas
- Liquid was sugary, acidic, or salty (more aggressive corrosion)
- Board was powered on while wet (accelerated corrosion)
- Weeks elapsed before professional cleaning

### Timing Impact on Outcomes
- Powered on before 24 hours drying: ~10% success
- Professional intervention within 48 hours: 70-80% success
- Waiting 72+ hours with no power applied: ~80% success for cleaning
- Weeks/months before professional cleaning: corrosion may be too extensive

### Cost-Benefit Decision Framework
- Simple cleaning + 1-2 components: economical at $250-600
- Multiple IC replacements: marginal at $400-800
- SoC-level damage on recent model: usually uneconomical (board replacement cheaper)
- Data recovery driving decision: repair attempt justified regardless of hardware outcome

---

## 8. Model-Specific Quick Reference

### M1 Generation (2020-2021)

| Model | Board Number | Key Vulnerabilities |
|---|---|---|
| Air A2337 | 820-02016 | Trackpad connector, battery connector, under-board pooling |
| Pro 13" A2338 | 820-02020 | CD3217 area, UF260 pin 8, UP900, UC710, multi-IC corrosion |
| Pro 14" A2442 | 820-02098 | NAND area (UN000), RENESAS backlight IC, power controller under sticker |
| Pro 16" A2485 | 820-02100 | Speaker amplifier area, 3V/5V accessory rails, backlight circuit |

### M2 Generation (2022-2023)

| Model | Board Number | Key Vulnerabilities |
|---|---|---|
| Air A2681 | 820-02846 | UP700 (1V25), mPMU (U8100), sPMU (U7700), NAND/U1900 |
| Pro 14" A2779 | 820-02841 | CT610 TouchID capacitor, PP3V8_AON rail |
| Pro 16" A2780 | varies | PP3V8_AON conversion circuit, U5700/Q5800/Q5820/Q5840 area |

### M3 Generation (2023-2024)

| Model | Board Number | Key Vulnerabilities |
|---|---|---|
| Air A3113 | varies | Similar pattern to M2 Air; trackpad/battery connector area |
| Pro 14" A2918 | varies | PMIC area; 5V rail dropping to 0.1V documented |
| Pro 16" | varies | Speaker area corrosion pattern similar to M1/M2 16" |

### M4 Generation (2024)

| Model | Board Number | Key Vulnerabilities |
|---|---|---|
| Pro 14" A3401 | 820-03400 | Custom Apple ICs with no schematics available; charging failure after 3-4 days |

**Note on M4:** No schematics exist yet for 2024 M4 models. Custom Apple silicon complicates third-party repair. Self Service Repair program may be only source for replacement logic boards.

---

## 9. Diagnostic Equipment Recommendations

| Tool | Purpose | Notes |
|---|---|---|
| Stereo microscope (high-power) | Visual inspection of SMD components | Essential; first step in any liquid damage assessment |
| Ultrasonic cleaner (40kHz) | Remove corrosion under BGA/shielding | 15 min at 40C; electronics-safe detergent required |
| DCPS (bench power supply) | Controlled power-up, current monitoring | Current-limited; start at 5V |
| FLIR thermal camera | Locate shorts via heat mapping | FLIR One PRO popular; apply IPA to localize |
| Multimeter (diode mode) | Rail testing, short detection | Compare readings against known-good board |
| CH341 programmer | USB ROM reflashing | Required for CD3217/ROM chip replacement |
| Hakko FM-2032 | Microsoldering | Fine tip for SMD work |
| Apple Configurator 2 | DFU restore testing | Required for functional verification |

---

*This document is based on community repair sources, forum case studies, and repair shop documentation. Component locations and diagnostic values should be verified against schematics for each specific board number. Data current as of April 2026.*
