# iPhone Intake Flows (Meesha's Original)

**Source:** Handwritten decision trees from Meesha  
**Transcribed:** 2026-02-09  
**Images:** `source-images/`

---

## 1. Charging / Power Fault

```
START: Does the ammeter show normal boot / ending cycle?
│
├── YES → Does the device boot?
│   ├── NO → Logic Board Diagnostic Required
│   └── YES → Does the device boot with DCPS?
│       ├── YES → Battery Repair
│       └── NO → (Moved battery) Does the device charge with another charging port?
│           ├── NO → Logic Board Diagnostic Required
│           └── YES → Charging Port Repair
│
└── NO → Do you feel the haptic?
    ├── NO → Does the device work with another screen?
    │   ├── YES → Possible Screen Fault → Screen Repair
    │   └── NO → Logic Board Diagnostic Required
    │
    └── YES → Is the device recognized by PC / iTunes / Recovery?
        ├── NO → Logic Board Diagnostic Required
        └── YES → Does the device boot as normal after exiting recovery?
            ├── NO → Disconnect flexes, test again
            │   └── NO → Logic Board Repair Required
            └── YES → Locate flex causing issue
```

---

## 2. Display / Screen

```
START: What type of damage?
│
├── Glass (cracked)
│   └── Any previous repairs?
│       ├── YES → Please provide info (collecting data)
│       └── NO → Continue to quote
│
├── No Display
│   └── Any previous repairs?
│       ├── YES → Please provide info
│       └── NO → Screen Repair
│
├── Touch Fault
│   └── Please provide description
│
├── Lines on Display
│   └── Please provide description
│
└── Other
    └── Please provide description
```

---

## 3. iPad / iPod Display

```
START: Type of damage?
│
├── Cracked Glass
│   └── Is the phone still working OK?
│       ├── YES → Are the camera lenses cracked?
│       │   ├── NO → Continue
│       │   └── YES → Camera Checks → Rear Housing Repair
│       └── NO → Please provide info
│
├── Cracked Edge Glass
│   └── [Similar flow]
│
├── No Display
│   └── [Similar to iPhone flow]
│
├── Touch Fault
│   └── [Similar to iPhone flow]
│
├── Lines on Display
│   └── Please provide description
│
└── Other
    └── Please provide description

ADDITIONAL: Do you use an Apple Pencil?
├── NO → Continue
└── YES → (Video of pencil functionality required)
```

---

## 4. Audio - Part 1 (Issue Type)

```
START: What type of audio issue are you experiencing?
│
├── EARPIECE
│   └── Can you hear any sound?
│       ├── YES → Earpiece Repair
│       └── NO → Can you hear sound via loudspeaker?
│           ├── YES → Ear Speaker Repair
│           └── NO → Diagnostic
│
├── LOUDSPEAKER
│   └── What fault are you experiencing?
│       ├── No sound via bottom → Loudspeaker Repair
│       ├── No sound via top → Loudspeaker Repair
│       ├── Muffled / crackling → Loudspeaker Repair
│       └── Other → Please provide details
│
├── AUDIO GREYED OUT
│   └── YES → Logic Board Diagnostic
│
├── HEADPHONES
│   └── [Flow continues - unclear in original]
│
└── UNSURE
    └── Please provide details
```

---

## 5. Audio - Part 2 (Calls / Microphone)

```
IF ISSUE IS ON CALLS:
│
└── To confirm, can you hear other people?
    ├── YES → To confirm, they can't hear you?
    │   └── YES → Microphone Repair
    │
    └── NO → Can they hear you?
        ├── YES → Earpiece Repair (info required)
        └── NO → Is the audio option greyed out?
            ├── YES → Logic Board / Further Diagnostic
            └── NO → Further info required

IF ISSUE IS MICROPHONE:
└── If it's on loudspeaker → [Same as calls flow]

IF ISSUE IS BOTH:
└── Provide further information
```

---

## 6. Connectivity - Part 1 (WiFi / Bluetooth)

```
START: Network connectivity - Physical damage?
│
├── YES → Does your SIM work in another device?
│   ├── YES → Logic Board
│   └── NO → We recommend contacting your network provider
│
└── NO → What is your issue with?
    │
    ├── WiFi CONNECTIVITY / BLUETOOTH
    │   └── Is your WiFi greyed out?
    │       ├── YES → Logic Board
    │       └── NO → Does it have weak signal?
    │           ├── YES → Diagnostic
    │           └── NO → Other info required
    │
    └── BOTH (WiFi + Physical damage)
        └── Do you have physical damage to top & rear of phone?
            ├── YES → Do you have damage to the front?
            │   ├── YES → Front Screen / Logic Board
            │   └── NO → Screen Repair / Logic Board
            │
            └── NO → Do you have damage to the front?
                ├── YES → Is the repair for data?
                │   ├── YES → Diagnostic
                │   └── NO → Diagnostic
                └── NO → Logic Board
```

---

## 7. Connectivity - Part 2 (Network / Cellular)

```
START: Top left of screen, do you see:
│
├── "No SIM"
│   └── Diagnostic
│
├── "No Service"
│   └── Diagnostic
│
└── "SOS"
    └── See → No Service → Diagnostic
```

---

## 8. Camera / Lenses

```
START: Damage to front or back camera?
│
├── FRONT CAMERA
│   └── Do you have any image?
│       ├── YES → Is the image blurred?
│       │   ├── YES → Do you have any condensation?
│       │   │   ├── YES → [Liquid Damage Flow]
│       │   │   └── NO → Front Camera Repair
│       │   └── NO → Does Face ID work?
│       │       ├── YES → Front Camera Repair
│       │       └── NO → Diagnostic
│       │
│       └── NO → Does Face ID work?
│           ├── YES → Front Camera Repair
│           └── NO → Diagnostic
│
├── REAR CAMERA
│   └── Do you have physical damage to the lenses?
│       ├── YES → How many lenses damaged? (1, 2, 3)
│       │   └── Please test all cameras, do you have any grey?
│       │       ├── NO → Camera + Lens Repair
│       │       ├── YES → Lens Repair only
│       │       └── UNSURE → Possible cam + lens → Camera Repair
│       │
│       └── NO → What fault are you experiencing?
│           ├── Dots in camera → Camera Repair
│           ├── Shaking camera → Camera Repair
│           ├── Blurred image → Camera Repair
│           ├── Condensation → [Liquid Damage Flow]
│           └── No image → Camera Repair
│
└── BOTH (Front + Rear)
    └── Do you have any image?
        ├── YES → Please provide further information
        └── NO → Does Face ID work?
            ├── YES → [Continue diagnostics]
            └── NO → Diagnostic
```

---

## 9. Face ID

```
START: iPhone or iPad?
│
└── [Either device] → Does Face ID show an error when setting up?
    │
    ├── YES → Which error?
    │   ├── "True Depth" → Not available → Face ID Repair
    │   └── "Move higher/lower" → Face ID Repair
    │
    └── NO → Have you had any previous repairs?
        ├── NO → Please provide details → Face ID Repair
        └── YES → Please provide details
```

---

## Universal Follow-up Questions (All Flows)

After determining repair type, always ask:

```
Is everything else working OK?
├── YES → Provide quote
├── NO → Please provide details (dropdown of other faults, linking to other flows)
└── UNSURE → Video on how to test
```

```
Any previous repairs?
├── YES → Please provide info
└── NO → Continue
```

---

## Notes on Flows

1. **Liquid Damage Flow** — Referenced but not included in these pages. Need separate flow.
2. **Logic Board Diagnostic** — Common endpoint when fault can't be isolated to specific component.
3. **"Please provide details"** — Captures free-form info for complex/unusual cases.
4. **Video requests** — For "unsure" cases, system should provide how-to-test videos.
5. **Previous repairs** — Critical question at multiple points — affects diagnosis and warranty.

---

---

## 10. Liquid Damage - Part 1

```
START: How long ago was it damaged?
├── Last 24 hours
├── Last week
├── Last month
└── Over 1 month

THEN: What type of liquid?
├── Sea
├── Swimming pool
├── Toilet
└── Other

THEN: Does the device turn on?
│
├── YES → How long ago was it damaged?
│   ├── Last 24 hours
│   ├── Last week
│   ├── Last month
│   └── Over 1 month
│   │
│   └── Do you have condensation in the cameras?
│       ├── YES → Has the device been opened by Apple?
│       │   ├── YES → Has the device been repaired before?
│       │   └── NO → Has the device been repaired before?
│       └── NO → [Continue to diagnostic assessment]
│
└── NO → Diagnostic
    └── How long ago?
        ├── Last 24 hours
        ├── Last week
        ├── Last month
        └── Over 1 month
```

---

## 11. Liquid Damage - Part 2

```
CONTINUATION (Yes, before liquid damage):

Any attempted repair after damage?
│
├── YES → Is data important on the device?
│   ├── YES → Diagnostic
│   └── NO → Diagnostic
│
└── NO (No previous repairs) → Is data important on the device?
    ├── YES → Diagnostic
    └── NO → Diagnostic
```

---

## 12. Power / Battery - Part 1

```
START: Does the device turn on?
│
├── YES → What issue are you experiencing?
│   │
│   ├── Low battery health → Battery Repair
│   │
│   ├── Battery draining quickly → Battery Repair
│   │
│   ├── Difficulty charging → Confirmed with another cable?
│   │   ├── YES/NO → Has the device been diagnosed by Apple?
│   │   │   └── YES/NO → Charging Port Repair
│   │
│   ├── Rebooting → Have you tried a software update?
│   │   ├── YES → Has it been diagnosed by Apple?
│   │   │   └── YES/NO → Diagnostic
│   │   └── NO → Try software update first
│   │
│   └── Other → Please provide details
│
└── NO → Any prior repair attempts?
    │
    └── What issue are you experiencing?
        │
        ├── Restarting / Apple logo loop
        │   └── Tried software update?
        │       ├── YES → Diagnosed by Apple? → Diagnostic
        │       └── NO → Try software update
        │
        ├── Stuck on Apple logo
        │   └── [Similar flow]
        │
        ├── Not charging
        │   └── Confirmed with a good cable?
        │       ├── YES → Has this been diagnosed by Apple? → [Continue]
        │       └── NO → Test with known good cable
        │
        └── No signs of life
            └── Has this been diagnosed by Apple?
                └── YES/NO → [Continue to Part 2]
```

---

## 13. Power / Battery - Part 2

```
CONTINUATION (Device not turning on):

Is data important?
├── YES → Diagnostic
└── NO → Has the device come into contact with liquid?
    ├── YES → Liquid Damage Diagnostic
    └── NO → Has the device been diagnosed by Apple?
        └── YES/NO → Diagnostic
```

---

## 14. Connectivity - SIM / Network (Extended)

```
START: Any impact damage?
│
├── YES → Has modem firmware?
│   ├── NO → Logic Board Repair
│   └── YES → Check IMEI#
│
└── NO → Check IMEI# → Has IMEI?
    │
    ├── YES → Does this show 'No Service'?
    │   ├── YES → Check if device is blacklisted
    │   │   ├── YES (Blacklisted) → No repair available
    │   │   └── NO → Test another SIM card in the phone
    │   │           before opening for visual checks
    │   │
    │   └── NO → Test another SIM card in the phone
    │
    └── NO → Logic Board Repair

IF "No SIM" message:
└── Check SIM reader/module
```

---

---

## 15. Rear Glass Repair

> Added to match website offerings

```
START: Which iPhone model?
│
├── iPhone 15 / 15 Plus / 14 / 14 Plus (Modular back glass)
│   └── Glass-only repair possible
│       └── Any other damage to device?
│           ├── YES → Please provide details → Combined Quote
│           └── NO → Rear Glass Repair ✓
│
└── iPhone 14 Pro / 14 Pro Max / Earlier models (Fused glass)
    └── Requires full housing replacement
        └── What colour is your device?
            └── [Match housing colour]
                └── Housing Replacement Quote ✓

NOTE: Glass-only repairs on fused models are low quality and crack easily.
Always recommend original housing replacement.
```

---

## Flows Complete

- [x] Charging / Power Fault
- [x] Display / Screen  
- [x] iPad / iPod Display
- [x] Audio (Issue Type)
- [x] Audio (Calls / Microphone)
- [x] Connectivity (WiFi / Bluetooth)
- [x] Connectivity (Network / Cellular)
- [x] Camera / Lenses
- [x] Face ID
- [x] Liquid Damage
- [x] Power / Battery
- [x] Connectivity - SIM / Network
- [x] Rear Glass Repair
