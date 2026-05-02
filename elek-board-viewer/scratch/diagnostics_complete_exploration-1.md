# Diagnostics Project: Complete Exploration Document

**Date:** 2 January 2025
**Status:** Vision documented, awaiting process documentation before build
**Dependency:** Process Documentation project must define workflows before interfaces are built

---

## Executive Summary

This document captures the full exploration of iCorrect's diagnostic and verification systems. We explored multiple layers of capability across software, hardware testing, automated optical inspection, and robotics. The key insight: all of these systems depend on having documented processes as a foundation.

**The layers explored:**

| Category | Layers | Buildability |
|----------|--------|--------------|
| Software Diagnostics | 3 layers | L1-L2 immediately achievable |
| Hardware Test Jig | 2 layers | Achievable with investment |
| Automated Optical Inspection | 1 system | Achievable, ML training needed |
| Robotics | 1 vision | 3-5 year aspiration |

---

## Part 1: Software Diagnostics

### The Core Problem

Currently, technicians self-report test completion: "Have you tested keyboard? Yes." There's no verification that tests were actually performed, no logging of results, no audit trail.

### Layer 1: Web-Based Diagnostic App

**What it is:**
A branded web application (e.g., diagnostics.icorrect.co.uk) that runs in the browser on the MacBook being tested.

**Fully automatable tests via browser:**
- Keyboard testing - JavaScript captures every keystroke, logs which keys pressed, detects stuck/non-responsive keys
- Trackpad - multi-touch detection, gesture recognition, click zones
- Camera/microphone - browser APIs test functionality, can capture test footage as proof
- Speakers - play test tones at different frequencies, user confirms
- Display - test patterns (solid colors, gradients, dead pixel checker grids)

**Semi-manual but logged tests:**
- Physical inspection (dents, scratches) - tech selects from standardized options, timestamped
- Display quality - patterns shown, tech records pass/fail with system logging that test screen was displayed

**The data flow:**
1. Tech opens branded site
2. Enters or scans MacBook serial number
3. Runs through each test module
4. System logs every interaction with timestamps
5. Results upload via API to cloud database
6. Links automatically to Monday.com against that device

**What this solves:**
- Accountability - you know the test was actually run
- Consistency - every MacBook goes through identical test sequence
- Audit trail - timestamped evidence for Back Market or customer disputes
- Training - new techs can't skip steps, system enforces the process

**Technical stack:**
- Frontend: React/Next.js
- Backend: Node.js or Python API
- Database: PostgreSQL
- Integrations: Monday.com API, potentially Xero

**Buildability:** Days to weeks for functional v1. Straightforward with Claude Code.

**Limitations:**
- Serial number capture: Browsers can't read system serial numbers directly. Options: manual entry, barcode scanning, or small native helper utility
- iCloud lock checking: Need third-party service or Apple GSX access
- Deep hardware diagnostics: Battery health, SSD status, logic board faults need native code

---

### Layer 2: Native macOS Application

**What it is:**
A lightweight app installed directly on the MacBook being tested, rather than running in browser.

**What this unlocks beyond Layer 1:**

**Automatic device identification:**
- Serial number pulled directly from system - no manual entry, no typos
- Model identifier (MacBook Pro 14" 2021 M1 Pro, etc.)
- macOS version
- Original specs vs detected specs (useful for spotting swapped components)

**Real hardware diagnostics:**
- Battery health percentage and cycle count - actual data, not "looks fine"
- SSD health via SMART data - remaining lifespan, read/write errors
- RAM detection - capacity, type, any errors
- Display native resolution and color profile verification
- Bluetooth/WiFi module status - is hardware present and functional
- USB-C/Thunderbolt port detection - how many ports, are they all registering

**Enhanced test logging:**
- Monitor system-level events during manual tests
- Trackpad test captures pressure sensitivity data
- Keyboard test detects actual key travel and response times
- Camera/mic tests capture sample recordings as proof

**Offline capability:**
- Tests run without internet
- Results cached locally, sync when connection available

**Benchmark system (post-repair verification):**

CPU stress test:
- Run intensive calculations for 5-10 minutes
- Monitor temperature sensors throughout
- Log thermal throttling events
- Compare against baseline for that specific chip

GPU stress test:
- Render demanding graphics
- Same thermal monitoring
- Detect graphical artifacts (indicates logic board issues)

Sensor monitoring dashboard:
- All temperature sensors in real-time (CPU, GPU, battery, palm rest, etc.)
- Fan speed response curves
- Power draw measurements

**What benchmarks prove post-repair:**
- Logic board handling load correctly
- Thermal paste application is good
- No components overheating abnormally
- Fans spinning up appropriately
- No thermal throttling under normal stress

**Workflow:**
1. Tech plugs in USB or downloads app
2. App launches, auto-detects serial and pulls device info
3. Runs automated hardware checks in seconds
4. Guides tech through manual verification tests
5. Generates comprehensive report
6. Syncs to cloud, links to Monday.com

**Permissions required (user grants once):**

| Permission | What it enables | How granted |
|------------|-----------------|-------------|
| Accessibility | Full keyboard monitoring, input event logging | System Preferences toggle |
| Camera | Functional camera testing with sample capture | Popup prompt |
| Microphone | Mic testing, speaker feedback loop testing | Popup prompt |
| Full Disk Access | SSD health scanning, storage analysis | System Preferences toggle |
| Bluetooth | Detecting Bluetooth hardware status | Usually automatic |
| Location | Optional - log where test performed | Popup prompt |

**Apple sign-off requirements:**
- NO App Store approval needed (internal distribution)
- NO special licensing from Apple
- YES Apple Developer Account needed (£79/year) - for signing and notarizing so app installs cleanly

All system information (serial numbers, battery health, SSD status, sensor data) accessible through public Apple frameworks (IOKit, System Configuration). Same as CoconutBattery, iStatMenus, etc.

**Buildability:** Native Swift app, 4-6 weeks for solid v1.

---

### Layer 3: Bootable USB Diagnostic Environment

**What it is:**
Diagnostic tool runs independently of whatever OS is (or isn't) installed. Boot from USB, run full hardware diagnostics without touching internal drive.

**Why it matters:**
- Test machines where macOS is corrupted or won't boot
- Run diagnostics before wiping and reinstalling
- Hardware verification completely independent of software state
- Can't be fooled by software masking hardware issues

**The critical limitation - Apple Silicon:**

| Mac Type | Bootable USB Capability |
|----------|------------------------|
| Intel Macs (pre-2020) | Fully achievable - boot any Linux distribution, access all hardware |
| Apple Silicon (M1/M2/M3/M4) | Significantly restricted - Apple's secure boot limits what can run |

**Apple Silicon options (limited):**
1. Asahi Linux - community project, works but doesn't have full hardware access
2. macOS Recovery environment - can build tools within it but still Apple's ecosystem
3. 1TR (One True Recovery) - limited diagnostic capabilities
4. Apple's own tools (AST 2) - requires Apple authorization as service provider

**Realistic approach for mixed inventory:**

Intel Macs: Full bootable USB diagnostic suite - complete hardware testing, certified data wiping, comprehensive sensor monitoring.

Apple Silicon Macs: Enhanced Layer 2 native app running in controlled "diagnostic mode" - boots into fresh user account with diagnostic suite auto-launching.

**Hybrid USB drive:**
- Boots Intel Macs into full Linux diagnostic environment
- Contains installable macOS diagnostic app for Apple Silicon
- Auto-detects which Mac it's plugged into, guides tech accordingly

**Buildability:** Significant jump in complexity. Custom Linux distribution, hardware drivers. 2-3 months for solid implementation.

---

## Part 2: Hardware Test Jig

### The Problem Software Can't Solve

Software can only read what Apple chose to expose through the SMC. It can tell you "trackpad not detected" but not "pin 3 is showing 2.1V instead of 3.3V."

For electrical-level verification after logic board repairs, you need actual measurement.

### Jig Layer 1: Voltage Testing with Pogo Pins

**The concept:**

```
Logic Board
    ↓
Test Jig (custom PCB with pogo pins)
    ↓
Microcontroller (reads voltages via ADC)
    ↓
Software (compares against known-good values)
    ↓
Pass/Fail Report (syncs to cloud system)
```

**Components required:**

| Component | Purpose | Cost | Accessibility |
|-----------|---------|------|---------------|
| Boardview files | Maps every test point, IC, and trace | Available in repair community | You likely have these |
| Custom PCB | Holds pogo pins in exact positions | £15-50 per design | JLCPCB or PCBWay |
| Pogo pins | Spring-loaded pins making contact with test points | Pennies each | Standard components |
| Microcontroller | Arduino, Raspberry Pi Pico, or ESP32 | £5-15 | Readily available |
| ADC modules | Analog-to-digital converters for precise voltage | £10-20 | Readily available |
| Reference database | Known-good voltage values for each test point | Built over time | From working boards |
| Housing/alignment | 3D printed cradle for exact positioning | Printable in-house | Design needed |

**Estimated first prototype cost:** £200-500 in components plus mapping time.

**The workflow:**
1. Tech completes logic board repair
2. Places board into jig (alignment pins ensure exact positioning)
3. Presses "Test" on connected laptop/tablet
4. Jig applies power and reads voltages at 20-50 key test points
5. Software compares each reading against acceptable range
6. Generates report: "PP3V3_S0 - Expected 3.3V ± 0.1V - Measured 3.28V - PASS"
7. Any failures flagged with specific location and expected vs actual
8. Full report uploads to system, linked to that repair job

**The mapping challenge:**
- Each MacBook model has different board layout
- Need separate jig (or jig insert) per model
- Building reference database of "known good" values takes time
- First board of each type requires manual mapping

**Starting point recommendation:**
Pick most common repair board (e.g., A1708 MacBook Pro). Build jig for that single board. Prove concept. Expand to other models.

---

### Jig Layer 2: Oscilloscope Integration

**Why it matters:**
Voltage tells you "is power present?" Oscilloscope tells you "is the signal behaving correctly?"

| Multimeter/ADC (Layer 1) | Oscilloscope (Layer 2) |
|--------------------------|------------------------|
| Static measurement | Dynamic measurement |
| "Is 3.3V present?" | "Is the clock signal clean?" |
| Snapshot | Movie |
| Detects dead rails | Detects corrupted signals, noise, timing issues |

**What oscilloscope catches that voltage misses:**
- Clock signals drifting or absent
- Data lines that should show communication but are flatlined
- Power rails with excessive ripple or noise under load
- PWM signals not pulsing correctly
- Startup sequences where signals should appear in specific order

**Architecture:**

```
Logic Board in Jig
       ↓
Pogo pins contact test points
       ↓
Analog multiplexer (switches between test points)
       ↓
USB Oscilloscope (captures waveform)
       ↓
Software analyzes waveform pattern
       ↓
Compares against known-good reference
       ↓
Pass/Fail with visual comparison
```

**Components:**

| Component | What it does | Cost range |
|-----------|--------------|------------|
| USB Oscilloscope | Captures waveforms, computer controlled | £150-400 (Hantek, Rigol, PicoScope) |
| Analog multiplexer | Routes multiple test points to single scope input | £10-30 |
| Signal conditioning | Protects scope from unexpected voltages | £20-50 |
| Software | Captures, stores, compares waveforms | Custom built |

**Waveform analysis approaches:**

Method 1 - Parameter extraction:
- Measure frequency (clock running at correct speed?)
- Measure amplitude (correct voltage swing?)
- Measure rise/fall time (signal transitioning cleanly?)
- Measure duty cycle (for PWM signals)
- Compare numbers against acceptable ranges

Method 2 - Pattern matching:
- Capture entire waveform shape
- Compare against reference "known good" capture
- Flag if deviation exceeds threshold
- ML could learn to spot anomalies (advanced step)

**Critical signals to focus on first:**

| Signal type | What you're checking | Example location |
|-------------|---------------------|------------------|
| Main clock | 32.768kHz crystal running | RTC circuit |
| CPU clock | High frequency clock present | Near CPU |
| Data buses | Activity during boot | USB, Thunderbolt controllers |
| Power sequencing | Rails come up in correct order | Multiple PP rails during power-on |
| Charging circuit | PWM signal to charging IC | Battery connector area |

**Output example:**
"CLK32K - Expected 32.768kHz square wave - Measured 32.771kHz - PASS" with actual waveform image attached.

**Cost for Layer 2 addition:** £200-400 on top of Layer 1, mainly the USB oscilloscope.

---

## Part 3: Automated Optical Inspection (AOI)

### The Concept

High-resolution imaging of logic boards before and after repair, with AI comparing against known-good references to detect damage, verify cleaning, and ensure repair quality.

**The flow:**

```
Board arrives
    ↓
High-res imaging (pre-repair baseline)
    ↓
Repair process (cleaning, component work)
    ↓
High-res imaging (post-repair)
    ↓
AI comparison: Pre vs Post vs Known-Good Reference
    ↓
Visual verification report with flagged areas
```

### What AI Can Detect

| Damage Type | What AI looks for |
|-------------|-------------------|
| Liquid damage/corrosion | Discoloration, green/white residue patterns, staining |
| Component burns | Blackening, melted plastic, discolored solder |
| Physical damage | Cracked ICs, lifted pads, broken traces |
| Solder issues | Bridges, cold joints, missing solder |
| Missing components | Empty pads where component should exist |
| Capacitor bulge | Swollen or leaking capacitors |
| Incomplete cleaning | Residual flux, debris, contamination |

### Hardware Setup

| Component | Purpose | Cost range |
|-----------|---------|------------|
| High-resolution camera | 20-50MP, captures full board detail | £200-800 |
| Macro lens | Close-up detail of individual components | £100-300 |
| Consistent lighting rig | Even illumination, no shadows, repeatable | £50-150 |
| Mounting system | Camera always at exact same position/angle | £50-100 (or 3D printed) |
| Rotating mount or dual camera | Capture both sides of board | £100-200 |

**Total hardware: £500-1500 for proper setup.**

### Critical Importance of Lighting

Most important element. Inconsistent lighting creates false positives - shadows that look like burns, reflections that look like contamination.

Professional AOI uses:
- Diffused overhead lighting (eliminates harsh shadows)
- Angled side lighting (reveals surface texture, lifted components)
- Sometimes UV lighting (shows flux residue invisible otherwise)

Simple lightbox with consistent positioning gets 80% there.

### The AI/ML Approach

**Method 1 - Anomaly Detection:**
Train model only on "known good" boards. It learns what healthy looks like. Anything deviating from healthy gets flagged.
- Advantage: Don't need examples of every fault type
- Advantage: Catches unexpected damage

**Method 2 - Defect Classification:**
Train on labelled examples of specific defects.
- Advantage: Can name the specific problem found
- Disadvantage: Needs labelled training data for each defect type

**Best approach: Combine both.**
1. Anomaly detection flags areas of concern
2. Classification model identifies what the anomaly likely is
3. Human tech reviews flagged areas and confirms

### What You Can Build In-House vs What Needs an Engineer

| Phase | In-house | Needs engineer |
|-------|----------|----------------|
| Hardware setup | ✓ | |
| Capture workflow | ✓ | |
| Data collection | ✓ | |
| Image labeling | ✓ | |
| Storage/organization | ✓ | |
| Basic preprocessing | ✓ | |
| Model training | | ✓ |
| Model optimization | | ✓ |
| Production deployment | Partial | ✓ |

**You can do 70-80% of the work.** The labelled data you create is the gold.

### Phase-by-Phase Build Plan

**Phase 1: Hardware Setup (1-2 weeks, £500-1000)**
- Camera: Sony A6000 or similar mirrorless, or industrial camera (Basler, FLIR)
- Lens: 50mm macro
- Mount: Fixed overhead position
- Lighting: LED ring light plus two angled side lights, all diffused
- Background: Matte grey or black, non-reflective
- Board holder: 3D printed cradle with alignment pins per model

Test by taking 10 photos of same board, removing and replacing each time. Images should be virtually identical when overlaid.

**Phase 2: Capture Workflow (1 week design, ongoing execution)**

```
Board arrives
    ↓
Log serial number in system
    ↓
Place in imaging station
    ↓
Capture top side (SERIAL_TOP_PRE_DATE)
    ↓
Flip board
    ↓
Capture bottom side (SERIAL_BOT_PRE_DATE)
    ↓
Proceed to diagnosis/repair
    ↓
After repair + cleaning
    ↓
Repeat imaging (SERIAL_TOP_POST_DATE, SERIAL_BOT_POST_DATE)
```

Automation buildable with Claude Code:
- Tethered shooting from computer
- Auto-naming based on serial number
- Automatic upload to cloud storage
- Folder structure: /boards/A1989/C02XXXXXX/pre/ and /post/

**Phase 3: Data Collection (3-6 months ongoing)**

Target volume:
- Minimum viable: 500 board images (250 boards, both sides)
- Good baseline: 1000-2000 images
- Strong dataset: 5000+ images

Capture every board regardless of condition. Mix of heavily damaged, lightly damaged, already clean, post-repair. More variety = better AI.

**Phase 4: Image Labeling (ongoing, 5-10 min per board)**

This is where your expertise becomes training data.

Simple approach - board-level:
```
Image: C02XXXXX_TOP_PRE.jpg
Labels: liquid_damage, corrosion_present, burn_damage
Severity: heavy
Outcome: repairable
```

Better approach - region-level:
```
Image: C02XXXXX_TOP_PRE.jpg
Region 1: [coordinates] - corrosion - severe
Region 2: [coordinates] - burn - moderate
Region 3: [coordinates] - clean
```

Best approach - pixel-level annotation with boxes/polygons around damage areas.

**Labeling tools (free or cheap):**
- Label Studio - general purpose, self-hosted, free
- CVAT - detailed polygon annotation, free
- Labelbox - cloud-based, team features, free tier
- Roboflow - end-to-end including training, free tier
- V7 - professional grade, paid

**Recommendation: Start with Roboflow.** Handles labeling, storage, preprocessing, and basic model training. Could get working prototype without engineer using their AutoML.

**Phase 5: What You Hand to an Engineer**

After 3-6 months:
- 1000+ labelled images
- Consistent image quality
- Clear labeling taxonomy
- Before/after pairs linked by serial
- Documentation of what each label means

Most ML projects fail because of bad data. You're solving the hard part.

**Engineer then does:**
1. Reviews labeling for consistency
2. Splits data into training/validation/test
3. Selects model architecture (YOLO, Faster R-CNN, U-Net)
4. Trains and fine-tunes
5. Evaluates performance
6. Optimizes for your hardware
7. Builds inference pipeline
8. Deploys and monitors

**Engineer timeline:** 4-8 weeks for initial working system
**Engineer cost:** Contract ML engineer £400-800/day. Fixed project £5-15K depending on scope.

### Example Output Report

```
Board: A1989 MacBook Pro 13" Logic Board
Serial: C02XXXXXXX
Pre-repair scan: 14 anomalies detected
Post-repair scan: 2 anomalies remaining

[Image of board with heat-map overlay]

Region: U3100 (Power IC area)
Pre-repair: Severe corrosion detected (94% confidence)
Post-repair: Clean (2% anomaly score) ✓ PASS

Region: J4800 (Battery connector)
Pre-repair: Liquid residue detected (87% confidence)
Post-repair: Minor discoloration remaining (34% anomaly score) ⚠️ REVIEW

Region: CD3215 (USB-C controller)
Pre-repair: Component burn detected (91% confidence)
Post-repair: Component replaced, solder joints clean ✓ PASS
```

---

## Part 4: Robotics (Long-Term Vision)

### The Concept

Automated or semi-automated disassembly and reassembly of MacBooks for high-volume trade-in processing.

### What Exists in Industry

Apple's Daisy and Dave robots process iPhones at scale. Foxconn has similar for manufacturing. The technology is real and proven.

### Core Components Needed

| Component | Function | Cost |
|-----------|----------|------|
| Collaborative robot arm | 6-axis movement, handles tools | £15-40K (Universal Robots, Franka, Dobot) |
| Machine vision system | Identifies model, locates screws | £1-5K (Intel RealSense, Cognex) |
| Automatic screwdriver end-effector | Drives screws with torque control | £2-5K (OnRobot, Kolver) |
| Tool changer | Swaps between bit sizes automatically | £3-8K |
| Vacuum/suction system | Lifts bottom case | £500-2K |
| Conveyor/positioning jig | Holds MacBook in known position | £2-5K (custom) |
| Control system | Orchestrates everything | £2-5K |

**Total hardware investment: £30-70K for functional cell**

### Workflow Breakdown - What's Automatable

**Step 1: Model identification**
✓ Fully achievable - camera reads form factor or barcode, database lookup returns screw positions.

**Step 2: Bottom case screw removal**
✓ Achievable with good vision - robot knows expected positions, vision confirms exact location, torque-controlled removal, screws sorted into compartments.

Challenge: Stripped or damaged screws. Robot needs to detect "not turning despite torque" and flag for human.

**Step 3: Bottom case removal with suction**
✓ Achievable with force feedback - three/four suction cups, controlled force and correct separation angle. Modern cobots have excellent force feedback.

**Step 4: Battery disconnection**
⚠️ Hybrid recommended - safety critical, varied between models, sometimes has tape/adhesive. Recommend human does this (takes 5 seconds).

**Step 5: Internal screw removal**
✓ Achievable but complex - multiple screw types means automatic bit changing. Robot references internal screw map, changes bits, removes in sequence, stores by type/location.

**Step 6: FPC disconnection**
⚠️ High risk - recommend manual. FPC connectors are fragile (locking tabs break), varied (flip-up, slide, pressure-fit), require tactile feedback. Tech disconnects all FPCs in 60-90 seconds. Cost of one damaged connector exceeds labor saved.

**Step 7: Logic board removal**
⚠️ Hybrid - could be lifted by vacuum but thermal paste adhesion, cables, flex risk. Easier for human (10 seconds).

### Realistic Hybrid Workflow

**Disassembly:**
- [Automated] MacBook placed in jig, scanned, identified
- [Automated] Bottom case screws removed, sorted
- [Automated] Suction cups remove bottom case
- [Human - 5 sec] Disconnect battery
- [Automated] Internal screws removed by type, sorted
- [Human - 60 sec] Disconnect all FPCs
- [Human - 10 sec] Lift out logic board

**Reassembly:**
- [Human - 10 sec] Place logic board
- [Human - 60 sec] Connect all FPCs
- [Human - 5 sec] Connect battery
- [Automated] Internal screws installed, torque-verified
- [Automated] Bottom case positioned
- [Automated] Bottom case screws installed, torque-verified
- [Automated] Final verification scan

**Human time per unit:** ~2.5 minutes
**Robot time per unit:** ~5-8 minutes
**Total:** ~8-10 minutes per unit
**vs. fully manual:** ~15-20 minutes per unit
**Time saving:** ~50% with added consistency and torque verification

### Economics Reality Check

**Investment:** £40-70K
**Maintenance:** £2-5K/year
**Break-even calculation:**

If saving 10 minutes per unit at £20/hour tech cost:
- Saving per unit: £3.33
- Units to break even on £50K: ~15,000 units
- At 50 units/week: 6 years to break even on labor alone

**Other value beyond labor:**
- Consistency - every screw at correct torque
- Verification - logged evidence all screws installed
- Capacity - robot works during breaks
- Scalability - handles volume spikes
- Differentiation - "robotic precision" marketing

**Where it makes sense:**
High volumes of standardized Back Market trade-in devices. Batch of 50 identical A1708 boards more efficient than 50 varied customer repairs.

### Staged Approach

**Stage 1: Positioning and vision (£5-10K)**
- Build jig and conveyor
- Implement model identification
- Create screw maps for each model
- Test with manual screwdriving but automated positioning

**Stage 2: Automated screwdriving (£15-25K)**
- Add cobot arm with screwdriver
- Bottom case removal only initially
- Human does everything else
- Prove concept, measure actual savings

**Stage 3: Full external automation (£10-15K)**
- Add tool changer
- Add suction system
- Automate internal screws

**Stage 4: Reassembly automation**
- Reverse the process
- Add torque verification logging

### Assessment

**Is this possible?** Yes. Technology exists and is accessible.

**Is this practical for iCorrect today?** Probably not at current scale. Could be 2-3 year goal as Back Market volume grows.

**What to do now:**
1. Document exact disassembly/reassembly workflow per model
2. Time each step precisely
3. Identify which models = 80% of volume
4. Build screw maps and positioning requirements
5. This documentation becomes specification for eventual automation

**The opportunity:**
If built and working, this isn't just improving iCorrect - it's a system other repair businesses would pay for. The repair industry has nothing like this at SME level.

---

## Part 5: The Complete Integrated System

### How Everything Connects

```
INTAKE
├── Software diagnostics (what's not working)
├── Visual inspection scan (what does damage look like)
└── Jig voltage test (which rails are affected)

REPAIR
├── Tech performs repair
├── Ultrasonic cleaning
└── Drying

VERIFICATION
├── Visual inspection scan (is it clean now?)
├── Jig voltage test (are rails restored?)
├── Jig oscilloscope test (are signals correct?)
├── Software diagnostics (does macOS see everything?)
└── Benchmark test (performance under load)

OUTPUT
└── Complete report with all evidence linked
```

### The Trade-In Pipeline Vision

```
INTAKE
├── MacBook arrives
├── Plugged into jig (HDMI + power)
├── Software triggers DFU mode
├── Automated OS reinstall
├── Diagnostic app auto-installs
├── Automated tests run
├── Engineer does manual verification
├── IMAGING: External cosmetic grading
└── Grade assigned (A/B/C) with visual evidence

INTERNAL INSPECTION
├── Bottom case removed
├── IMAGING: Logic board captured
├── Prong/voltage testing via jig
├── Any issues flagged
└── Decision: Pass / Repair needed / Reject

REASSEMBLY + QC
├── Everything back together
├── Final functional testing
├── IMAGING: Final cosmetic capture
├── Cross-reference against intake grading
├── Confirm grade matches or flag discrepancy
└── Ready for Back Market listing

OUTPUT
└── Complete evidence package per device
```

---

## Part 6: The Grading System

### The Problem

Grading is subjective, inconsistent, and undocumented. When Back Market queries a grade, or when training new staff on what "B grade" means, there's nothing concrete to point to.

### Required: Grading Rubric with Visual Examples

**Example structure:**

```
GRADE A - Like New
├── Screen: No scratches visible under direct light
├── Top case: No visible wear on palm rest
├── Bottom case: Max 2 minor scuffs, no dents
├── Keyboard: No shine on keys
├── Ports: No visible damage or debris
└── [Photo examples of each criterion at Grade A]

GRADE B - Good
├── Screen: Light scratches, not visible when display on
├── Top case: Light wear on palm rest acceptable
├── Bottom case: Minor scratches/scuffs, no dents
├── Keyboard: Slight shine acceptable
├── Ports: Minor cosmetic marks acceptable
└── [Photo examples of each criterion at Grade B]

GRADE C - Fair
├── Screen: Visible scratches, minor impact marks
├── Top case: Noticeable wear, minor dents acceptable
├── Bottom case: Scratches, minor dents acceptable
├── Keyboard: Shine, minor wear acceptable
├── Ports: Cosmetic damage acceptable if functional
└── [Photo examples of each criterion at Grade C]

REJECT
├── Screen: Cracks, dead pixels, delamination
├── Case: Significant dents affecting structure
├── Keyboard: Non-functional keys
├── Ports: Non-functional
└── [Photo examples]
```

### Building the Training Data

Action: Take last 50 graded devices. Photograph examples of each grade. Document why each was graded as it was. This becomes reference library and training data.

---

## Part 7: Critical Dependency

### The Foundational Insight

Every system described in this document depends on having documented processes.

| What we explored | What it depends on |
|------------------|-------------------|
| Diagnostic software interface | Documented diagnostic process |
| Trade-in intake system | Documented trade-in process |
| QC verification tool | Documented QC process |
| Grading system with AI | Documented grading criteria |
| Team training systems | Documented SOPs to train against |

**Process Documentation is its own project** - not a phase within Diagnostics, not a subtask. A foundational project that other projects depend on.

Before building any tools, the processes they support must be documented.

---

## Part 8: Build Priority and Dependencies

### Dependency Chain

```
Level 0: Process Documentation
    ↓
Level 1: Software Diagnostics L1 (Web App)
    ↓
Level 2: Software Diagnostics L2 (Native App) + Imaging Stations
    ↓
Level 3: Hardware Jig L1 (Voltage) + AOI Data Collection
    ↓
Level 4: Hardware Jig L2 (Oscilloscope) + AOI Model Training
    ↓
Level 5: Robotics (when volume justifies)
```

### Recommended Starting Sequence

1. **Process Documentation** - define workflows before building tools
2. **Software L1 (Web App)** - immediate value, low complexity
3. **Imaging Station Setup** - start collecting data now
4. **Grading Rubric Creation** - enables consistent grading and AI training
5. **Software L2 (Native App)** - adds hardware diagnostics and benchmarks
6. **Hardware Jig L1** - for logic board repair verification
7. **AOI Model Training** - once sufficient labelled data collected
8. **Everything else** - based on volume and ROI

---

## Part 9: Rough Time and Cost Estimates

### Software

| Layer | Build Time | Cost | Who |
|-------|------------|------|-----|
| L1 Web App | 2-4 weeks | Dev time only | Claude Code + Ricky |
| L2 Native App | 4-6 weeks | £79/year Apple Dev | Claude Code + Ricky |
| L3 Bootable USB | 2-3 months | Dev time only | Claude Code + Ricky (Intel only viable) |

### Hardware Jig

| Layer | Build Time | Cost |
|-------|------------|------|
| L1 Voltage Testing | 4-6 weeks | £200-500 prototype |
| L2 Oscilloscope | 2-4 weeks additional | £200-400 additional |

### AOI

| Phase | Time | Cost |
|-------|------|------|
| Imaging station | 1-2 weeks | £500-1500 |
| Data collection | 3-6 months ongoing | Time only |
| Labeling | Ongoing | Time only |
| ML training (if engineer) | 4-8 weeks | £5-15K |
| ML training (if Roboflow AutoML) | 2-4 weeks | Free tier or £100-500/month |

### Robotics

| Stage | Time | Cost |
|-------|------|------|
| Full system | 6-12 months | £40-70K |

---

## Summary

This document captures the complete vision for iCorrect's diagnostic and verification systems, from immediately buildable software tools to long-term robotic automation.

**Key takeaways:**

1. Software L1 and L2 are buildable now with Claude Code
2. Hardware jigs are achievable with modest investment
3. AOI requires data collection starting immediately, ML comes later
4. Robotics is a 3-5 year vision requiring significant volume to justify
5. Everything depends on documented processes as foundation
6. Start the Process Documentation project before building interfaces

**Next step:** Complete Process Documentation project, then return to this document to begin phased implementation.

---

*Document created: 2 January 2025*
*To be updated as project progresses*
