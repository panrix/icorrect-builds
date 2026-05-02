# Research Findings: Apple Silicon MacBook Diagnostics
*Compiled 2026-04-11 from repair community sources*

---

## 1. DFU/Restore Error Codes (Board-Level Root Causes)

### Error 4013
- **Apple's official definition**: Generic "device disconnected during update/restore". Unhelpful for board-level diagnosis.
- **Board-level root cause (iPad Rehab/Jessa Jones)**: On iPad 7 and iPhone 7 (A10 CPU), error 4013 with Apple logo boot loop is caused by **CPU BGA joint failure**. The CPU becomes electrically detached from the board despite no visible physical damage. Aftermarket chargers can cause this by damaging the CPU beyond the typical charger-facing circuitry damage.
  - **Fix**: Remove CPU, clean underfill from chip and board, reball with fresh solder balls, reattach. This restores function and recovers data.
  - **Applicability to Apple Silicon**: The CPU reball technique is specific to A10 devices (iPad 7, iPhone 7/7+). On Apple Silicon Macs, the SoC is far more complex and this exact failure mode has not been documented, but the principle (BGA joint failure causing 4013) could apply.
- **Rossmann Forums (A2179 820-01958)**: Error 4013 on MacBook Air M1 with 20V 0.06A current draw. Restore log shows: `Unexpected device state 'Recovery' expected 'RestoreOS'`. Board had no visible liquid damage or corrosion. Suspected NAND/SSD failure. DFU restore attempts fail at "Installing system" phase. Error 4010 (RestoreOS device removed before restored completed) also appears intermittently.
  - Key diagnostic: `failed to get board config from DFU mode device` in Apple Configurator logs indicates SoC communication failure.
  - **NAND swap consideration**: A2179 2019 model uses 2x256GB NAND; 2018 uses 2x128GB. These are NOT interchangeable without DFU restore.

### Error 4041
- **Definition**: "Gave up waiting for device to transition from Recovery state to BootedOS state" (10 minute timeout).
- **Rossmann Forums (A2442 820-02098, M1 Pro)**: Board power cycling every 3 seconds. USB-C meter sequence: 5V > 19V > power cycle (PPBUS_AON drops to 6V). L5800 getting warm during restarts.
  - **Root cause**: Shorted NAND (PP1V2_NAND1 short). UN500 was internally shorted. Since all NANDs function as a single storage array, ALL must be replaced together.
  - **Resolution**: Replace all NAND chips from donor board (same order). DFU restore via Finder (not Apple Configurator 2). External charger required, not USB from another Mac.
  - **Important**: SPI NOR (EEPROM U2010) does NOT need to be transferred from donor; it gets updated during DFU process.
  - **NAND upgrade possible**: Successfully upgraded from 512GB to 1TB using AliExpress NANDs after donor swap.

### Error 4042
- Variant of 4041, seen when NAND configuration is incorrect or soldering is bad after NAND transplant.

### Error 4010
- "RestoreOS device removed before restored completed" - device drops off USB during restore. Often indicates intermittent hardware fault (NAND, power rail instability).

### Error 53 (on Apple Silicon Macs)
- **Traditional meaning**: Touch ID sensor pairing failure (iPhone/iPad).
- **On Apple Silicon iMac M1 (A2438)**: Occurs during DFU restore of replacement logic boards. Error log: `AMRestoreErrorDomain error 53 - Failed to handle message type StatusMsg (FDR failure)`.
  - **Root cause**: FDR (Factory Data Restore) failure. Third-party logic boards cannot complete the Apple pairing process. Only Apple-sourced boards with access to Apple's proprietary pairing tool (GSX) can be restored.
  - **Implication**: Logic board replacement on Apple Silicon desktops requires Apple's activation server handshake. Third-party replacement boards will fail with error 53.

### Error 9
- On Apple Silicon context: ASR (Apple Software Restore) signature verification failure. Can indicate corrupted restore image or, at board level, data corruption during transfer to NAND.

### Error 75
- **Not directly found in sources** as a standalone Mac error code. The Badcaps/community references to "error 75" appear to be conflated with APFS corruption symptoms rather than a discrete restore error.

---

## 2. DCPS/Current Draw Diagnostic Signatures

### Healthy Mac Boot Sequence (USB-C ammeter)
| Phase | Voltage | Current | Duration |
|-------|---------|---------|----------|
| Initial USB PD | 5V | 0.05-0.2A | <1 second |
| PD negotiation | Ramp to 20V | Increasing | 1-2 seconds |
| Boot | 20V | 1.5A+ | Continuous |

### Fault Signatures
| Reading | Diagnosis | Failed Component |
|---------|-----------|-----------------|
| Stuck at 5V, 0.05-0.2A | CD3217/CD3215 USB-C controller failure | USB PD negotiation IC (TI) |
| 20V but >3A immediate, no boot | PMIC dead short to ground | PMIC or shorted capacitor on output rail |
| 5V, 0.01A, PPBUS_G3H at 0.3V | PPBUS_G3H shorted to ground | TPS62180 NAND PMIC failed, applying PPBUS directly to NAND |
| 20V, 0.06A, no boot | SoC not initializing | NAND failure, SoC fault, or power rail missing |
| Power cycling every 3s (5V>19V>drop) | NAND short causing boot loop | Shorted NAND chip pulling down power rail |

### Key Voltage Rails to Check (Apple Silicon)
- **PPBUS_AON**: Should be ~12.26V. Cycling to 6V indicates power management failure.
- **PP0V9_NAND0**: 0.9V (cycles if NAND fault)
- **PP1V2_NAND0**: 1.2V (cycles if NAND fault)
- **PP2V5_NAND0**: 2.5V (cycles if NAND fault)
- **PP3V3_AON**: 3.3V (should be stable always-on rail)
- **PP1V8_AON**: 1.8V (stable)
- **NAND0_OCARINA_PGOOD**: Should be 3.3V stable. 0.752V or cycling = NAND PMIC fault

---

## 3. Component-Level Failure Patterns

### TPS62180 NAND PMIC Failure (Critical Pattern)
- **The most common NAND-related failure on T2 and Apple Silicon Macs**
- The TPS62180 buck converter creates SSD power rails from PPBUS_G3H (~12.6V)
- **Failure mode**: IC goes short internally, applies full PPBUS_G3H voltage (~12.6V) directly to NAND chips rated for 2.5V
- **Result**: Simultaneous short on PPBUS_G3H AND PP2V5_NAND rail
- **Diagnosis**: Inject 1V to PPBUS_G3H, check current draw. Use FLIR to locate heat source.
- **Common on**: A2141 (820-01700), A2442 (820-02098), and likely similar patterns on newer boards
- **Part numbers**: U9580, U9080, U6960, U6903, UA900, UG800 (varies by board)
- **Liquid damage correlation**: Corrosion around TPS62180 is the most common trigger

### NAND Chip Failures
- **A2141 (820-01700, 1TB model)**: Uses two "wings" of NAND:
  - Wing 0: U8100-U8600 (on PP2V5_NAND_SSD0)
  - Wing 1: U9100-U9400 (on PP2V5_NAND_SSD1)
  - 512GB model: 5 NAND chips (confirmed: some BOM groups use 5 chips for 512GB)
- **When one NAND shorts**: That wing's power rail shorts. May or may not pull PPBUS_G3H low depending on whether TPS62180 also failed.
- **NAND replacement rules**:
  - ALL NANDs in a set must be replaced together (they form a striped array)
  - Must come from a donor board of same model
  - Must be placed in SAME positions/order as donor
  - Configuration resistors on NAND pages must match donor board
  - After replacement, DFU restore re-encrypts and re-initializes all NAND
  - JCID P13 programmer can be used to program replacement NANDs

### CD3217/CD3215 USB-C Controller
- First component in power path from USB-C port
- Handles USB Power Delivery negotiation (5V to 20V)
- **Most common power surge casualty** - absorbs overvoltage before PMIC
- Failure = Mac stuck at 5V, appears completely dead
- Texas Instruments part, available for replacement

### PMIC (Power Management IC)
- Distributes regulated voltages to CPU, memory, SSD controller, NAND
- Surge damage: often absorbs overvoltage that would otherwise reach NAND
- When PMIC shorts: 20V input draws >3A immediately with no boot activity
- PMIC failure is actually protective for data (NAND usually survives)

---

## 4. Apple Diagnostics Reference Codes (Complete Mapping)

### Power & Battery
| Code | Component | Meaning |
|------|-----------|---------|
| PPT001 | Battery | Not detected |
| PPT002-003 | Battery | Replace soon (reduced capacity) |
| PPT004 | Battery | Requires service (not functioning normally) |
| PPT005 | Battery | Not installed properly - DISCONTINUE USE |
| PPT006 | Battery | Requires service (abnormal function) |
| PPT007 | Battery | Replace (significantly reduced capacity) |
| PPT021 | Battery | Charge too low for test (<6%) |
| PPP001-008 | Power Adapter | Issue detected |
| PPP017 | Power Adapter | Both ports of 35W dual adapter in use during test |
| PPP018 | Power Adapter | Fast charging not supported with current adapter |
| PPP020 | Power Adapter | Not detected |
| PPN001-002 | Power Management | Issue with power-management system (NEW - not in older lists) |

### Processor & System
| Code | Component | Meaning |
|------|-----------|---------|
| PPR001 | Processor | Issue detected |
| PFM001-007 | SMC | System Management Controller issue |
| PFR001 | Firmware | Firmware issue |
| PPM001 | Memory | Memory module issue |
| PPM002-016 | Memory | Onboard memory issue (PPM016 is NEW) |

### Storage
| Code | Component | Meaning |
|------|-----------|---------|
| VDH001-004 | Storage | Issue with storage device (VDH001, VDH003 are NEW) |
| VDH005 | Storage | Unable to start macOS Recovery |

### Connectivity
| Code | Component | Meaning |
|------|-----------|---------|
| CNW001-006 | Wi-Fi | Hardware issue |
| CNW007-008 | Wi-Fi | No networks detected (possibly hardware) |
| CNW009 | Wi-Fi | Hardware issue (NEW) |
| CNT001-007 | Ethernet | Hardware issue (NEW code series) |
| NDL001-002 | Bluetooth | Hardware issue (NDL002 is NEW) |
| NDT001-006 | Thunderbolt | Hardware issue |
| NDD001 | USB | Hardware issue |

### Input Devices
| Code | Component | Meaning |
|------|-----------|---------|
| NDK001-004 | Keyboard | Issue detected |
| NDR001-006 | Trackpad | Issue detected |
| NDR007 | Trackpad | External input device detected (disconnect it) |
| NDR008 | Trackpad | Issue detected (NEW) |
| BMT001-005 | Touch ID | Sensor issue |

### Display & Graphics
| Code | Component | Meaning |
|------|-----------|---------|
| VFD001-007 | Display | Display or graphics processor issue |
| VFD008-009 | HDMI | HDMI controller issue (NEW) |
| VFD010 | I/O Card | Apple I/O card issue (Mac Pro, NEW) |
| VFD011 | Antenna | Antenna Connector Board issue (NEW) |
| VFF001-003 | Audio | Hardware issue |

### Other
| Code | Component | Meaning |
|------|-----------|---------|
| ADP000 | System | No issues found |
| ALS001 | Ambient Light | Sensor issue |
| CEH001-002 | Case Handle | Latch issue (Mac Pro, NEW) |
| DFR001 | Touch Bar | Issue detected |
| IMU001 | IMU | Accelerometer/gyroscope issue (NEW) |
| LAS001-004 | Lid Sensor | Open/close sensor issue (NEW) |
| NDC001-006 | Camera | Issue detected |
| NNN001 | Serial | Serial number not detected |
| VDC001-007 | SD Card | Reader issue |

### Codes NEW vs Previous Lists
The following codes appear in Apple's current (2025/2026) reference list but are missing from older compilations (ToptekSystem, older LogiWiki):
- **PPN001-002** (power management system)
- **PPM016** (onboard memory)
- **PPP004-008, PPP017-018, PPP020** (expanded power adapter codes)
- **PPT021** (battery too low for test)
- **CNT001-007** (Ethernet, entire series)
- **CNW009** (Wi-Fi)
- **NDL002** (Bluetooth)
- **NDR007-008** (trackpad)
- **VDH001, VDH003** (storage)
- **VFD008-011** (HDMI, I/O card, antenna)
- **CEH001-002** (case handle)
- **IMU001** (accelerometer/gyroscope)
- **LAS001-004** (lid sensor)

---

## 5. DFU Mode Procedures (Apple Silicon Specific)

### DFU Port Identification
- **Apple Silicon laptops**: LEFT-MOST USB-C port (changed from Intel where it was right-most)
- **Apple Silicon desktops**: Refer to Apple KB 120694 for specific port
- **T2 Intel laptops**: RIGHT-MOST USB-C port

### DFU Entry: Apple Silicon Laptop (Official Keyboard Method)
1. Shut down Mac (hold power 10s if needed)
2. Connect USB-C data+charge cable to DFU port
3. Press and release power button
4. IMMEDIATELY press and hold ALL FOUR keys: Left Control + Left Option + Right Shift + Power
5. Hold all four for ~10 seconds
6. Release all keys EXCEPT power button
7. Continue holding power for up to 10 more seconds until host Mac shows DFU window
8. If "allow accessory" alert appears, release power and click Allow

### DFU Entry: Apple Silicon Desktop
1. Unplug from power
2. Connect USB-C cable to DFU port
3. Press and hold power button
4. While holding power, plug in power cable
5. Continue holding power for up to 10 seconds until host Mac shows DFU window

### DFU Entry: Bare Board (Repair Context)
- For T2 machines: Bridge SOC_FORCE_DFU pad to 1V8_SLPS2R power rail
- For Apple Silicon: SOC_FORCE_DFU to ground (reported inconsistently; some boards may need different approach)
- A2179 report: "SOC_FORCE_DFU pad to ground is not triggering it" - may need battery/power in specific state

### Revive vs Restore
- **Revive**: Reinstalls firmware WITHOUT erasing data. Try this FIRST.
- **Restore**: Erases EVERYTHING and restores to factory. Data loss guaranteed.
- **CRITICAL WARNING**: On Apple Silicon, a "Restore" wipes the APFS volume and triggers TRIM. If data recovery is the goal, ONLY use Revive unless the drive is already known to be empty.

### Host Mac Requirements
- macOS Sonoma 14 or later on the host Mac
- macOS 14+ also supports revive/restore via Finder (not just Apple Configurator 2)
- USB-C to USB-C cable must support data AND charging
- Do NOT use Thunderbolt 3 cable (different protocol)

---

## 6. APFS Corruption (Board-Level Implications)

### Key APFS Structures
- **Container Superblock (NXSB)**: Master index. If corrupted, macOS can't find volumes.
- **Object Map (OMAP)**: Maps virtual object IDs to physical NAND addresses. Damage = files exist but can't be located.
- **Checkpoint Descriptor Area**: Circular buffer of consistent filesystem snapshots. Incomplete write = "fsroot tree is invalid".
- **Space Manager (Spaceman)**: Tracks free/allocated blocks. Desync = "0 bytes free" error.

### APFS Error Messages and Board-Level Causes
| Error | Cause | Board Implication |
|-------|-------|-------------------|
| "overallocation detected on Main device" | Space Manager desync | Could be NAND wear or voltage rail instability |
| "cross-volume extent allocation conflict" | Snapshot metadata failure | Likely software, but voltage drops during write can cause |
| "fsroot tree is invalid" | Incomplete Checkpoint write | Power loss during macOS update is #1 cause |
| "volume could not be verified completely" | Object Map corruption | NAND bit errors exceeding ECC correction |
| Device timeout / kernel panic on mount | Hardware failure | Degraded NAND, failing controller, or logic board power rail fault |

### Most Common Cause of APFS Corruption on Apple Silicon
**Power loss during macOS OTA updates**. The update rewrites firmware partitions, APFS preboot volumes, and system snapshots in a multi-stage process. Interruption leaves Checkpoint descriptor in inconsistent state.

### NAND Wear and Read Disturb
- All NAND has finite program/erase cycles
- As cells wear, bit error rate increases
- When errors exceed ECC correction capability, metadata pages return corrupted data
- APFS B-tree structures are metadata-dense; single uncorrectable bit error in key Object Map page can make entire volume unmountable

### Voltage Rail Faults Causing APFS Corruption
- NAND communicates with SoC via 1.8V (I/O) and 3.3V (controller logic) rails
- Intermittent voltage regulator failure = corrupted write commands
- APFS journal records write that NAND didn't execute correctly
- Result: metadata/data mismatch, "?" folder at boot, DFU recovery loop

### Critical Rules for Corrupted APFS
1. Do NOT run Disk Utility First Aid more than once (repeated traversals worsen degraded NAND)
2. Do NOT use Target Disk Mode to scan (host Mac can kernel panic)
3. Do NOT reformat and restore from Time Machine (TRIM erases data blocks permanently)
4. Do NOT attempt DFU Restore if data recovery is needed (wipes APFS and triggers TRIM)

---

## 7. Secure Enclave & Encryption (Repair Implications)

### Apple Silicon Architecture
- Storage controller, Secure Enclave, and application processor are on SINGLE SoC die
- AES-256 XTS encryption on every block written to NAND
- Keys generated during initial device setup, fused to specific processor
- Keys NEVER leave the SoC

### T2 vs Apple Silicon
- **T2**: Separate IC on board. Surge damage to T2 is separate failure point from CPU.
- **Apple Silicon**: Integrated into SoC. Damage to SoC = loss of both processor AND encryption keys.
- **Implication**: On T2 Macs, you could theoretically bridge a failure between T2 and CPU. On Apple Silicon, any SoC failure blocks all NAND access.

### Data Recovery Rules
1. Chip-off NAND extraction is IMPOSSIBLE on T2+ and Apple Silicon Macs
2. Board must boot far enough for Secure Enclave to initialize
3. Full board repair not needed; just enough for SoC to power on and decrypt
4. Display, keyboard, trackpad NOT required for data extraction
5. Data transfer via Target Disk Mode (Intel) or Apple Configurator sharing (M-series)

### If SoC is Physically Destroyed
- AES-256 XTS encryption keys are permanently lost
- NAND contents become unrecoverable encrypted ciphertext
- No known method to extract or transfer Secure Enclave keys between processors
- Improper rework heat can damage Secure Enclave even if attempting repair

---

## 8. M3/M4 Specific Information (Gap Area)

### What We Know
- M3 arrived late 2023, M4 late 2024
- Same Secure Enclave architecture as M1/M2
- NAND still soldered, still cryptographically paired to SoC
- DFU mode procedures identical (keyboard method, same DFU port)
- Storage controller continues to be integrated into SoC
- Each generation refines storage controller implementation and NAND interface protocol

### What's Missing (Identified Gaps)
- **No board-level case studies found** for M3/M4 specific boards (820-02614 for M3 Pro, 820-02862 for M4 Pro)
- **No DCPS current draw profiles** documented for M3/M4 boards
- **No TPS62180 equivalent** identified for M3/M4 NAND power management (may use different PMIC)
- **No NAND configuration details** for M3/M4 boards (chip counts, BOM groups, positions)
- **No liquid damage case studies** specific to M3/M4 board layouts
- M3/M4 boards are too new for significant repair community documentation
- Rossmann forums and Badcaps have zero M3/M4 board-level threads as of April 2026

### Likely Similarities to M1/M2
- Same overall power delivery architecture (USB-C > CD3217 > PMIC > rails)
- Same NAND encryption (Secure Enclave in SoC)
- Same DFU restore procedures
- Same diagnostic methodology (bench PSU, FLIR, schematic-guided probing)

---

## 9. Status Indicator Light (SIL) Patterns

Applies to Mac mini, Mac Studio, Mac Pro (and some older MacBook/iMac models):

| Pattern | Meaning |
|---------|---------|
| Off | Mac is turned off |
| Solid white | Mac is on or sleeping |
| Pulsating white (pre-2014 only) | Sleep mode |
| Rapidly flashing amber / solid amber | Firmware recovery mode - needs DFU revive/restore |
| Flashing white (one or more times at startup) | Hardware issue - run Apple Diagnostics |

---

## 10. Mac Startup Beep Codes

| Pattern | Meaning |
|---------|---------|
| One beep every 5 seconds | No RAM detected |
| Three beeps, pause, repeat | RAM failed integrity check |
| Long tone | Firmware is being restored (progress bar should appear) |

Note: These apply primarily to Intel Macs with user-replaceable RAM. Apple Silicon Macs have soldered RAM and are less likely to produce beep codes, but firmware restore tones still apply.
