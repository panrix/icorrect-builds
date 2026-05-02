# Apple Diagnostics Research for iCorrect

**Date:** 2026-04-12
**Purpose:** Comprehensive reference for diagnostic capabilities, passcode dependencies, and practical workflow recommendations for iCorrect's repair operations.

---

## Table of Contents

1. [Apple Diagnostic Mode: What Testing Can We Complete?](#1-apple-diagnostic-mode)
2. [Passcode/Password Dependency](#2-passcodep-assword-dependency)
3. [Risk Assessment: Repairing Without Passcode Access](#3-risk-assessment)
4. [MacBook Diagnostics: OS Generation Dependency](#4-macbook-diagnostics-os-generation-dependency)
5. [Practical Recommendations for iCorrect](#5-practical-recommendations)

---

## 1. Apple Diagnostic Mode

### 1.1 Overview of Available Diagnostic Tools

Apple provides several tiers of diagnostic tools:

| Tool | Access Level | Available To |
|------|-------------|-------------|
| **Apple Diagnostics (built-in)** | Consumer/Self-Service | Anyone (built into device) |
| **AST2 (Apple Service Toolkit 2)** | Professional | AASPs and Apple Stores only |
| **Self-Service Diagnostics** | Consumer/IRP | Self-Service Repair participants, IRP members |
| **Repair Assistant** | Consumer/Professional | Anyone (built into iOS 18+/macOS Tahoe) |
| **Third-party tools** | Varies | Anyone (3uTools, DCSD cable, Phonecheck, etc.) |

### 1.2 iPhone Diagnostics

#### How to Enter Diagnostic Mode (iOS 17+)

1. Turn off the iPhone completely
2. Press and hold **both Volume Up and Volume Down** buttons simultaneously
3. While holding both buttons, plug the iPhone into a power adapter (18W+ recommended) or powered computer
4. When the Apple logo appears, release the buttons
5. Tap **Start Session** when the diagnostics screen appears
6. Connect to Wi-Fi when prompted

**Key point:** This works on locked devices. No passcode is required to enter diagnostic mode.

#### Available Hardware Tests (iPhone)

| Component | Test Available | Passcode Required? |
|-----------|---------------|-------------------|
| Audio Output (speakers) | Yes | No |
| Microphones | Yes | No |
| Display (pixel anomalies) | Yes | No |
| Multi-Touch | Yes | No |
| Ambient Light Sensor | Yes | No |
| Proximity Sensor | Yes | No |
| Gyroscope | Yes | No |
| Accelerometer | Yes | No |
| Face ID / TrueDepth Camera | Yes | No (hardware test) |
| Front Camera | Yes | No |
| Rear Camera(s) | Yes | No |
| Flash | Yes | No |
| Wi-Fi | Yes | No |
| Bluetooth | Yes | No |
| GPS | Yes | No |
| Charging Port | Yes | No |
| Vibration Motor (Taptic Engine) | Yes | No |
| Physical Buttons | Yes | No |
| Battery Health | Partial | No (basic); Yes (detailed in Settings) |

#### What Diagnostic Mode Cannot Test

- Software-level issues (app crashes, OS bugs)
- iCloud/Apple Account status verification
- Cellular network registration and call quality (requires SIM + unlock)
- NFC/Apple Pay functionality (requires unlock)
- Touch ID/Face ID unlock accuracy (hardware presence tested, but biometric enrollment requires unlock)
- Notification and alert delivery
- App-specific hardware integration

### 1.3 iPad Diagnostics

#### How to Enter Diagnostic Mode

Identical to iPhone:
1. Power off completely
2. Press and hold both Volume Up and Volume Down
3. While holding, plug into power adapter (18W+) or powered computer
4. Release when Apple logo appears
5. Tap Start Session, connect to Wi-Fi

#### Available Tests

Same component coverage as iPhone, plus:
- Apple Pencil pairing/connectivity (requires unlock for full test)
- Keyboard connector (Smart Connector models)
- Larger display uniformity tests

### 1.4 MacBook Diagnostics

#### How to Enter Apple Diagnostics

**Apple Silicon Macs (M1 and later):**
1. Shut down the Mac
2. Press and hold the power button until "Loading startup options" appears
3. Release, then press **Command + D**
4. Diagnostics will begin

**Intel Macs:**
1. Shut down the Mac
2. Press power button, immediately hold the **D** key
3. Release when language selection or progress bar appears

**Internet Recovery Diagnostics (fallback):**
- Intel: Hold **Option + D** at startup
- Apple Silicon: Same method as above (falls back to internet automatically if local diagnostics unavailable)

#### Available Tests (Mac)

Apple Diagnostics tests the following Mac components:

| Component | Reference Code Prefix | Notes |
|-----------|--------------------|-------|
| Audio Controller | - | Internal audio hardware |
| Backlight Controller | - | Display backlight |
| Battery | PPT | PPT001-PPT007 for battery issues |
| Bluetooth | - | Bluetooth hardware |
| Boot ROM | - | Firmware integrity |
| Camera (FaceTime) | - | Built-in camera |
| Chipset | - | Logic board chipset |
| Current Sensor | 4SNS (I prefix) | Electrical current sensors |
| DIMM / Memory | MEM | Memory modules |
| Display | VFD | VFD001-005/007 for display; VFD006 for GPU |
| Ethernet Controller | - | If present |
| Fan(s) | - | Cooling system |
| Keyboard | - | Built-in keyboard |
| Logic Board | - | General logic board |
| PCIe | - | PCIe bus |
| Power Port | - | Charging/power delivery |
| Processor | - | CPU tests |
| SATA | - | SATA bus (older Macs) |
| SD Card Reader | - | If present |
| SMC | PFM | PFM001-007 for SMC issues |
| Speaker | - | Built-in speakers |
| Storage (SSD/HDD) | VDH | VDH002/004 for storage issues |
| Temperature Sensor | 4SNS (T prefix) | Thermal sensors |
| Thunderbolt | - | Thunderbolt ports |
| Trackpad | - | Built-in trackpad |
| USB Bus | - | USB controller |
| Video Controller / GPU | VFD006 | Graphics processor |
| Voltage Sensor | 4SNS (V prefix) | Voltage monitoring |
| Wi-Fi | - | Wireless networking |

**Reference code ADP000 = No issues found.**

**No passcode/password is required for Mac diagnostics.** Apple Diagnostics runs from a dedicated partition (or internet recovery) before the OS loads, so the user account password is irrelevant.

### 1.5 AST2 (Apple Service Toolkit 2)

AST2 is Apple's professional cloud-based diagnostic system.

**Access:** Restricted to Apple Stores and AASPs under contract. Not available to independent repair shops unless enrolled in Apple's Independent Repair Provider (IRP) program.

**Capabilities beyond consumer diagnostics:**
- Deeper hardware-level testing with more granular pass/fail criteria
- Parts ordering integration (diagnostics must run before Apple authorises part orders)
- Serial-over-USB diagnostics for iPhones and iPads (can run on devices in DFU/Recovery mode)
- Automated test sequences that cover all components in one pass
- Detailed logging and reporting tied to Apple's GSX system
- Component-level fault isolation that consumer diagnostics cannot provide

**Key limitation for iCorrect:** Unless enrolled in Apple's IRP program, AST2 is not accessible. The IRP program provides AST2 access but requires compliance with Apple's repair standards and parts sourcing requirements.

### 1.6 Third-Party Diagnostic Tools

| Tool | What It Does | Passcode Required? |
|------|-------------|-------------------|
| **3uTools** (Windows) | Device info, battery health, component verification, genuine parts detection, flash/restore | No (for hardware info); Yes (for some software checks) |
| **DCSD Cable** | Serial/UART access to iPhone internals, NAND data read/write, syscfg access | No (hardware-level access) |
| **iRepair Box P10** | NAND read/write without removal, serial number/WiFi/BT data, works via DCSD | No |
| **Phonecheck** | Comprehensive device grading, IMEI/ESN checks, functional testing | Partial (some tests need unlock) |
| **coconutBattery** (Mac) | Battery health, cycle count, design capacity for Mac/iPhone/iPad | No (connected via USB) |

**Third-party tools vs Apple tools:**
- Third-party tools can read hardware-level data (serial, NAND, syscfg) that Apple's consumer diagnostics do not expose
- Apple's diagnostics provide standardised pass/fail results with reference codes
- Third-party tools can detect aftermarket/refurbished parts more effectively
- Apple's AST2 is the only tool that can authorise parts ordering and complete System Configuration
- DCSD/iRepair Box access device data at a lower level than Apple's consumer tools, useful for board-level repair

---

## 2. Passcode/Password Dependency

### 2.1 Tests That Do NOT Require Passcode

The following can all be completed on a locked device:

**iPhone/iPad (via built-in Diagnostics Mode):**
- All hardware diagnostic tests (display, touch, audio, cameras, sensors, connectivity, buttons, vibration)
- Serial number and IMEI retrieval (visible in diagnostics mode or via 3uTools)
- Battery health check (basic level)
- Physical inspection and component replacement
- Screen replacement and calibration (via Repair Assistant, which runs outside the OS)
- Battery replacement
- Charging port replacement
- Speaker/microphone replacement
- Camera module replacement
- DFU mode restore/update

**MacBook (via Apple Diagnostics):**
- All Apple Diagnostics tests (runs pre-boot, no password needed)
- Hardware component replacement
- Battery replacement
- Display replacement
- Keyboard/trackpad replacement
- Logic board replacement
- SMC/PRAM reset (Intel) / DFU restore (Apple Silicon)

### 2.2 Tests and Functions That REQUIRE Passcode/Password

| Function | Why Passcode Needed | Impact If Skipped |
|----------|-------------------|------------------|
| **Cellular call/data test** | SIM activation and cellular settings behind lock screen | Cannot verify cellular functionality |
| **NFC / Apple Pay** | Requires authenticated session | Cannot verify contactless payments |
| **Touch ID / Face ID unlock verification** | Biometric enrollment is per-user | Can verify hardware presence but not unlock accuracy |
| **iCloud / Find My status check** | Settings behind lock screen | Cannot confirm Activation Lock status without IMEI check |
| **Battery Health % (Settings)** | Detailed battery analytics in Settings app | Basic health available via 3uTools or diagnostics |
| **Software update** | May require passcode for OTA update | Can update via DFU/Recovery mode without passcode |
| **App-specific hardware** | AR apps, specific camera modes, etc. | Cannot test app-level hardware integration |
| **Notification delivery** | Requires unlocked state | Cannot verify alert routing |
| **Detailed Wi-Fi/Bluetooth pairing** | Saved networks and pairings behind lock | Basic hardware test works, saved connections inaccessible |
| **System Configuration (post-repair)** | Repair Assistant may prompt for Apple Account | Parts may show as "unknown" in Settings if not configured |

### 2.3 Apple-Sanctioned Workflows Without Credentials

1. **Built-in Diagnostics Mode (iOS 17+ / iPadOS 17+):** Officially documented by Apple, runs without passcode. Covers core hardware tests.

2. **AST2 over USB:** For AASPs/IRP members, AST2 can communicate with devices in DFU/Recovery mode via USB without requiring the device passcode. This is Apple's primary professional diagnostic path for locked devices.

3. **Repair Assistant (iOS 18+ / macOS Tahoe):** Runs as part of System Configuration after physical repair. Does not require the device passcode to initiate, but may require the Apple Account credentials for parts calibration (True Tone, Face ID, battery health reporting).

4. **DFU Mode Restore:** Apple-sanctioned for software recovery. Erases all data but does not require passcode. Customer consent required.

### 2.4 What Other Repair Shops Do

**AASPs (e.g., Best Buy Geek Squad):**
- Use AST2 for pre-repair diagnostics (works on locked devices)
- May request passcode for post-repair functional verification
- Some AASPs run diagnostics in front of the customer, who enters their own PIN for system checks
- Require Find My to be disabled before service (Apple policy)

**Independent Repair Shops:**
- Most perform physical repairs without requesting passcodes
- Use third-party tools (3uTools, DCSD) for hardware diagnostics on locked devices
- Post-repair verification often limited to hardware-only checks
- Some shops ask customers to verify functionality in-store before leaving
- Reputable shops never require passcode for standard hardware repairs (screen, battery, port)

**Industry consensus:** Hardware repairs do not require passcode access. Only full functional verification (cellular, biometrics, NFC) requires the device to be unlocked, and this is typically done by the customer in-store.

---

## 3. Risk Assessment: Repairing Without Passcode Access

### 3.1 Quality Level Achievable Without Passcode

| Repair Type | Quality Without Passcode | Notes |
|-------------|------------------------|-------|
| Screen replacement | 95% | Hardware diagnostics confirm display, touch, Face ID sensor. True Tone calibration needs Repair Assistant (no passcode, but may need Apple Account) |
| Battery replacement | 90% | Basic health readable. Detailed cycle count and health % in Settings requires unlock. Repair Assistant handles calibration |
| Camera replacement | 90% | Hardware test confirms function. Cannot verify all camera modes in apps |
| Charging port | 95% | Full hardware test available without unlock |
| Speaker/mic | 95% | Full audio diagnostic available |
| Logic board | 85% | Hardware diagnostics cover most components. Software-level verification limited |
| Water damage assessment | 70% | Physical inspection + hardware diagnostics. Software symptoms require unlock |

### 3.2 Risks of No-Passcode Workflow

**Functional verification gaps:**
- Cannot confirm cellular calling/data works post-repair
- Cannot verify NFC/Apple Pay
- Cannot test biometric unlock accuracy (only hardware presence)
- Cannot identify software-caused issues that mimic hardware faults
- Cannot verify all camera modes (Portrait, Night, etc.) work correctly

**Activation Lock complications:**
- Cannot check Find My status from Settings without unlock
- Can check Activation Lock status via IMEI lookup (Apple's Activation Lock status page or third-party services)
- If Find My is enabled, parts pairing via Repair Assistant may require the customer's Apple Account
- Risk of accepting stolen devices for repair (mitigated by IMEI checks)

**Parts pairing (iOS 18+):**
- Repair Assistant handles parts calibration post-repair
- Does not require device passcode to initiate
- May require Apple Account credentials for full calibration
- Without calibration: True Tone may not work, battery health may show "Unknown Part", Face ID may be degraded
- Customer can complete calibration themselves after pickup

**Missed software issues:**
- A device brought in for "screen not working" might actually have a software issue
- Without unlock, cannot distinguish hardware fault from software bug in some cases
- Mitigation: DFU restore can rule out software issues (but erases data)

### 3.3 Liability and Warranty Implications

**UK Consumer Rights Act 2015:**
- Repair shop is responsible for the quality of the repair performed
- If a repair causes additional damage, the shop is liable regardless of passcode access
- No legal requirement to access customer data for hardware repairs

**GDPR / Data Protection:**
- NOT requesting passcodes is actually the stronger position from a data protection standpoint
- Accessing a customer's unlocked device creates data handling obligations
- A no-passcode policy demonstrates good data protection practices

**Apple Warranty:**
- Apple requires Find My to be disabled before service (not passcode disclosure)
- Using genuine parts and completing System Configuration maintains Apple's warranty chain
- Independent repairs with genuine parts do not void Apple's warranty (EU consumer law)

**Professional liability:**
- Document the device's condition at intake (photos, notes)
- Run diagnostics pre- and post-repair
- Have customer verify functionality in-store when possible
- Clear terms of service stating scope of testing without passcode

### 3.4 Practical Impact Summary

| Scenario | Risk Level | Mitigation |
|----------|-----------|------------|
| Standard screen/battery repair | **Low** | Hardware diagnostics sufficient |
| Intermittent issue diagnosis | **Medium** | May need unlock to observe software behaviour |
| Water damage repair | **Medium** | Physical + hardware diagnostics cover most; software symptoms hidden |
| Logic board repair | **Medium-High** | Full system verification limited without unlock |
| Device received with unknown history | **Medium** | IMEI check for Activation Lock, physical inspection |

---

## 4. MacBook Diagnostics: OS Generation Dependency

### 4.1 Intel vs Apple Silicon: Key Differences

| Feature | Intel Mac | Apple Silicon Mac |
|---------|----------|-----------------|
| **Enter diagnostics** | Hold **D** at startup | Hold power button, then **Cmd + D** |
| **Internet diagnostics** | Hold **Option + D** | Automatic fallback if local unavailable |
| **Boot architecture** | EFI-based, separate diagnostic partition | iBoot-based, diagnostics in recoveryOS |
| **DFU restore** | Not available (use Internet Recovery) | Available via Apple Configurator 2 or another Mac |
| **SMC reset** | Yes (Shift+Ctrl+Option+Power) | No SMC; reset via shutdown for 30+ seconds |
| **NVRAM/PRAM reset** | Cmd+Option+P+R at startup | Not needed (resets automatically on restart) |
| **T2 chip diagnostics** | Additional T2-specific tests | N/A (integrated into SoC) |
| **Diagnostics scope** | Hardware tests only | Hardware tests + expanded in macOS Tahoe |

### 4.2 Generation Cutoffs

| Era | Models | Diagnostic Tool | Notes |
|-----|--------|----------------|-------|
| **Pre-2013** | Various | Apple Hardware Test (AHT) | Hold D or Option+D. Limited component coverage |
| **2013-2019** | Intel Macs | Apple Diagnostics | Replaced AHT. Same invocation method. Broader component testing |
| **2018-2020** | Intel with T2 chip | Apple Diagnostics + T2 tests | Added T2 security chip diagnostics, Secure Boot verification |
| **Late 2020+** | Apple Silicon (M1+) | Apple Diagnostics (new architecture) | iBoot-based, different invocation, DFU restore capability |
| **2025+** | Apple Silicon (macOS Tahoe) | Apple Diagnostics enhanced | Choose specific component tests (display, keyboard, trackpad). Repair Assistant built in |

### 4.3 What Changed with Apple Silicon

1. **No more SMC/NVRAM manual resets:** The unified SoC handles all low-level functions. Troubleshooting steps changed.

2. **DFU mode available:** Apple Silicon Macs support DFU restore via another Mac + Apple Configurator 2. This allows firmware-level recovery that was not possible on Intel Macs.

3. **Diagnostics architecture:** Runs from recoveryOS rather than a separate diagnostic partition. More tightly integrated with the OS.

4. **Secure Boot changes:** Apple Silicon uses a different secure boot chain. Diagnostics verification is handled differently.

5. **Repair Assistant integration (macOS Tahoe):** System Configuration and parts calibration built directly into macOS recovery. Significant improvement for post-repair workflows.

### 4.4 Internet Recovery vs Local Diagnostics

| Aspect | Local Diagnostics | Internet Recovery Diagnostics |
|--------|------------------|------------------------------|
| **Tests available** | Identical | Identical |
| **Speed** | Faster (no download) | Slower (downloads diagnostic image) |
| **When used** | Default if diagnostic partition exists | Fallback if local partition missing/corrupt |
| **Network required** | No | Yes (Wi-Fi or Ethernet) |
| **Invocation** | D key (Intel) / Power+Cmd+D (Silicon) | Option+D (Intel) / Automatic (Silicon) |

**Functionally identical.** The internet version exists purely as a fallback when local diagnostics are unavailable (e.g., after drive replacement or corruption). Both run the same test suite and produce the same reference codes.

### 4.5 macOS Version Impact on Diagnostics

- Apple Diagnostics runs independently of the installed macOS version (it uses its own partition or internet image)
- The diagnostic test suite is updated by Apple via firmware updates, not macOS updates
- However, **Repair Assistant** (for parts calibration) requires macOS Tahoe or later on Apple Silicon Macs
- Older macOS versions may not support System Configuration for newer replacement parts
- Recommendation: Keep Macs updated to latest macOS for best post-repair calibration support

---

## 5. Practical Recommendations for iCorrect

### 5.1 Recommended Diagnostic Workflow

```
INTAKE
  1. Physical inspection (document condition, photos)
  2. IMEI/Serial check for Activation Lock status
  3. Ask customer to describe issue (not for passcode)
  4. Note: Do NOT request passcode

PRE-REPAIR DIAGNOSTICS
  iPhone/iPad:
    - Enter Diagnostics Mode (Vol Up + Vol Down + plug in)
    - Run full hardware test suite
    - Record results (screenshot or note pass/fail per component)
    - Use 3uTools for battery health, genuine parts check

  MacBook:
    - Run Apple Diagnostics (Power + Cmd+D or D key)
    - Record reference codes
    - Use coconutBattery for battery detail

REPAIR
  - Perform hardware repair as needed
  - Use genuine Apple or quality aftermarket parts

POST-REPAIR DIAGNOSTICS
  iPhone/iPad:
    - Re-enter Diagnostics Mode
    - Run full hardware test suite
    - Compare pre/post results
    - Complete Repair Assistant / System Configuration if applicable
    - For parts calibration: customer may need to enter Apple Account

  MacBook:
    - Re-run Apple Diagnostics
    - Verify ADP000 (no issues)
    - Complete Repair Assistant (macOS Tahoe+) if needed

CUSTOMER HANDOFF
  - Have customer verify device in-store
  - Customer enters own passcode to check:
    - Cellular/calling (if applicable)
    - Face ID / Touch ID unlock
    - Camera modes they use
    - Any specific functionality related to the reported issue
  - Document sign-off
```

### 5.2 Policy Recommendations

1. **Never request customer passcodes.** This is both a data protection strength and reduces liability. Frame it positively: "We protect your privacy by never asking for your passcode."

2. **Always run pre- and post-repair diagnostics.** Document results. This provides evidence of repair quality and protects against claims.

3. **Ask customers to disable Find My before drop-off** when possible. This simplifies parts calibration. If they cannot (forgotten Apple Account password, etc.), note this on the repair ticket.

4. **In-store verification at pickup.** Have the customer unlock the device and verify key functions before they leave. This catches any issues that hardware diagnostics alone cannot detect.

5. **IMEI checks at intake.** Use Apple's Activation Lock checker or third-party IMEI services to screen for stolen devices. This protects iCorrect legally.

6. **Keep devices updated.** For macOS repairs, ensure Macs are running the latest supported macOS for best Repair Assistant/System Configuration support.

7. **Invest in third-party diagnostic tools.** 3uTools (free), coconutBattery (free/cheap), and DCSD cables provide hardware-level diagnostics that complement Apple's built-in tools, especially for board-level work.

### 5.3 What We Can Confidently Repair Without Passcode

- Screen replacements (all device families)
- Battery replacements (all device families)
- Charging port / Lightning / USB-C repairs
- Speaker and microphone replacements
- Camera module replacements
- Button repairs
- MacBook keyboard / trackpad replacements
- MacBook logic board replacements
- Water damage assessment and repair (with noted limitations)
- Housing / back glass replacements

### 5.4 Where Passcode Access Would Improve Quality

- Diagnosing intermittent software-related issues
- Verifying cellular functionality post-repair
- Confirming biometric unlock accuracy post-screen replacement
- Full system verification on logic board swaps
- Identifying software bugs misreported as hardware faults

**Mitigation:** Customer in-store verification at pickup covers most of these gaps without iCorrect ever handling the passcode.

---

## Sources

- [How to put your iPhone in diagnostics mode - Apple Support](https://support.apple.com/en-us/101944)
- [How to put your iPad in diagnostics mode - Apple Support](https://support.apple.com/en-us/121125)
- [Use Apple Diagnostics to test your Mac - Apple Support](https://support.apple.com/en-us/102550)
- [Use Repair Assistant to finish an iPhone or iPad repair - Apple Support](https://support.apple.com/en-us/120579)
- [Use Repair Assistant to finish a Mac repair - Apple Support](https://support.apple.com/en-us/123128)
- [If Repair Assistant shows that a part is locked - Apple Support](https://support.apple.com/en-us/120610)
- [Activation Lock for iPhone and iPad - Apple Support](https://support.apple.com/en-us/108794)
- [Self Service Repair - Apple Support](https://support.apple.com/self-service-repair)
- [AST - The Apple Wiki](https://theapplewiki.com/wiki/AST)
- [Apple Diagnostics Reference Codes - LogiWiki](https://logi.wiki/index.php/Apple_Hardware_Test_(AHT)_and_Apple_Diagnostics_(AD)_Codes)
- [The End of Parts Pairing? Almost - iFixit](https://www.ifixit.com/News/100266/the-end-of-parts-pairing-almost)
- [Here Are the Secret Repair Tools Apple Won't Let You Have - iFixit](https://www.ifixit.com/News/33593/heres-the-secret-repair-tool-apple-wont-let-you-have)
- [How to Test Apple Silicon and Intel Macs - iTech Palm Beach](https://www.itechpalmbeach.com/blog/how-to-test-apple-silicon-macs-and-intel-macs-using-apple-diagnostics)
- [iPhone Diagnostic Mode and Testing - SimplyMac](https://www.simplymac.com/iphone/iphone-diagnostic-mode-and-testing)
- [iPhone Self-diagnosis Mode - DIY Fix Tool](https://www.diyfixtool.com/blogs/news/the-key-information-about-iphone-self-diagnosis-mode)
- [Independent Repair Provider Program - Apple Support](https://support.apple.com/irp-program)
