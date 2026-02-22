# Apple Watch Intake Flows (Meesha's Original)

**Source:** Handwritten decision trees from Meesha  
**Transcribed:** 2026-02-09  
**Images:** `source-images/`

---

## 1. Display / Exterior Damage

```
START: Type of damage?
│
├── FRONT GLASS (cracked)
│   └── Provide Screen Quote ✓
│
├── DAMAGED / NO DISPLAY
│   └── Can you hear sound / feel haptic?
│       ├── YES → Provide Full Screen Quote ✓
│       └── NO → Diagnostic ✓
│
├── TOUCH FAULT
│   └── Please provide information / picture → END
│
└── UNSURE
    └── Please provide information / picture → END
```

---

## 2. Heart Rate Sensor

```
START: Is the watch still showing signs of life?
│
├── YES → Heart Rate Repair ✓
│
└── NO → Diagnostic ✓
```

---

## 3. Crown / Side Button / Sensors

```
START: Which module are you experiencing an issue with?
│
├── CROWN
│   └── Is the crown responsive?
│       ├── YES → Please provide details → Crown Repair ✓
│       └── NO → Diagnostic ✓
│
├── SIDE BUTTON
│   └── Is the side button responsive?
│       ├── YES → Please provide details → Side Button Repair ✓
│       └── NO → Has it been in contact with liquid?
│           ├── YES → HR Sensor Repair ✓
│           └── NO → Diagnostic ✓
│
├── HR SENSOR
│   └── Does this have physical damage?
│       ├── YES → Diagnostic ✓
│       └── NO → Has it been in contact with liquid?
│           ├── YES → Diagnostic ✓
│           └── NO → Diagnostic ✓
│
├── HAPTIC
│   └── Has it been in contact with liquid?
│       ├── YES → Diagnostic ✓
│       └── NO → Diagnostic ✓
│
└── OTHER
    └── Please provide details → Diagnostic ✓
```

---

## 4. Liquid Damage / Charging / Power

```
START: Does the device turn on?
│
├── YES
│   │
│   ├── IF LIQUID DAMAGE:
│   │   └── How long ago was it damaged?
│   │       ├── 1 week
│   │       ├── 1 month
│   │       └── Unsure → Has it been diagnosed by Apple?
│   │           ├── YES → Diagnostic
│   │           └── NO → Diagnostic
│   │
│   └── IF CHARGING/POWER ISSUE:
│       └── What is the fault?
│           ├── Low battery health → Battery
│           ├── Battery not holding charge → Battery
│           ├── Difficulty charging → Diagnostic
│           └── Stuck on Apple logo / Exclamation → Diagnostic
│
└── NO
    └── Any physical damage?
        ├── YES → Diagnostic
        └── NO → Diagnostic
```

---

## Notes

1. **Apple Watch repairs are limited** — many issues lead to Diagnostic because component-level repair isn't always possible
2. **Liquid contact** is a critical question for most Watch issues — affects repair approach
3. **Heart rate sensor** issues often indicate back crystal or sensor flex damage
4. **Crown issues** — can be debris, physical damage, or liquid ingress
5. **Battery** — Watch batteries are delicate, screen removal required

---

## Repair Outcomes Key

| Symbol | Meaning |
|--------|---------|
| ✓ | Confirmed repair type — can quote |
| Diagnostic | Needs tech assessment before quote |
| END | Capture info, route to specialist |
