# iPad Intake Flows (Meesha's Original)

**Source:** Handwritten decision trees from Meesha  
**Transcribed:** 2026-02-09  
**Images:** `source-images/`

---

## 1. Battery / Power

```
START: Does the device turn on?
│
├── YES → What issue are you experiencing?
│   │
│   ├── Low battery health → Battery Repair
│   │
│   ├── Battery draining quickly → Battery Repair
│   │
│   ├── Difficulty charging
│   │   └── Confirmed with another cable?
│   │       ├── YES → Charging Port Repair
│   │       │   └── Has it been diagnosed by Apple?
│   │       │       └── YES/NO → [Continue]
│   │       └── NO → Test with known good cable first
│   │
│   ├── Rebooting
│   │   └── Have you tried a software update?
│   │       ├── YES → Has it been diagnosed by Apple?
│   │       │   └── YES/NO → Diagnostic
│   │       └── NO → Try software update → Diagnosed by Apple?
│   │           └── Diagnostic
│   │
│   └── Other → Please provide details
│
└── NO → What issue are you experiencing?
    │
    ├── Rebooting
    │   └── [Same as above]
    │
    ├── Stuck on Apple logo
    │   └── Software update tried?
    │       └── Diagnosed by Apple? → Diagnostic
    │
    ├── Not charging
    │   └── Good cable confirmed?
    │       └── YES/NO → [Continue assessment]
    │
    ├── No signs of life
    │   └── Diagnostic
    │
    └── Other → Provide details
```

---

## 2. Liquid Damage

```
START: Does the device turn on?
│
├── YES → How long ago was it damaged?
│   ├── 24 hours
│   ├── Last week
│   └── Over 1 month
│   │
│   └── What type of liquid?
│       ├── Sea
│       ├── Swimming pool → Any functions damaged? → [Continue]
│       ├── Bath
│       └── Other → Provide details
│       │
│       └── Has it been diagnosed by Apple?
│           ├── YES → Diagnostic
│           └── NO → Diagnostic
│
└── NO
    └── What type of liquid?
        ├── Sea
        ├── Swimming pool
        ├── Bath
        └── Other
        │
        └── Provide details → Diagnostic
```

---

## 3. Display (From iPhone flows - same structure)

```
START: Type of damage?
│
├── Cracked Glass
│   └── Is the phone still working OK?
│       ├── YES → Are the camera lenses cracked?
│       │   ├── NO → Screen Quote
│       │   └── YES → Camera checks + Rear Housing
│       └── NO → Please provide info
│
├── Cracked Edge Glass
│   └── [Similar flow]
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

ADDITIONAL FOR iPAD:
└── Do you use an Apple Pencil?
    ├── NO → Continue
    └── YES → (Video of pencil functionality required)
```

---

---

## 4. Camera / Lens

```
START: Damage to front or back camera?
│
├── FRONT
│   └── Is there any damage to the screen?
│       ├── YES → Can you see any image from the camera?
│       │   ├── YES → Is the image distorted/blurred?
│       │   │   ├── YES → Screen + Camera Repair
│       │   │   └── NO → Screen + Camera Repair
│       │   └── NO → Screen + Camera Repair
│       │
│       └── NO → Can you see any image from the camera?
│           ├── YES → Is this distorted/blurred?
│           │   ├── YES → Camera + Lens Repair
│           │   └── NO → Camera Repair
│           └── NO → Camera Repair
│
└── BACK
    └── Is there any damage to the camera glass?
        ├── YES → Can you see any image from the camera?
        │   ├── YES → Is this distorted/blurred?
        │   │   ├── YES → Camera + Lens Repair
        │   │   └── NO → Lens Repair
        │   └── NO → Camera Repair
        │
        └── NO → Camera Repair
```

---

## 5. Liquid Damage (Extended)

Additional outcomes after liquid damage assessment:
- Screen / Backlight / No touch
- Charging issues
- Audio issues

All lead to: Has it been diagnosed by Apple?
├── YES → Diagnostic
└── NO → Diagnostic

---

## Notes

1. **iPad batteries** — often require screen removal, higher risk repair
2. **Charging port** — can be Lightning or USB-C depending on model
3. **Apple Pencil compatibility** — important for Pro/Air models, affects Touch ID digitizer assessment
4. **Liquid damage** — iPads less water resistant than iPhones, more susceptible

---

## iPad-Specific Considerations

| Model Type | Notes |
|------------|-------|
| iPad Pro | Face ID, ProMotion, Apple Pencil 2, USB-C |
| iPad Air | Touch ID (button or top), Apple Pencil |
| iPad | Touch ID button, Lightning, budget line |
| iPad mini | Touch ID (button or top), compact |

**Always confirm model** — affects parts, pricing, and repair complexity.
