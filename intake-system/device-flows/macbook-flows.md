# MacBook Intake Flows (Meesha's Original)

**Source:** Handwritten decision trees from Meesha  
**Transcribed:** 2026-02-09  
**Images:** `source-images/`

---

## 1. Display - Part 1

```
START: Does the MacBook work with an external screen?
│
├── YES → Provide Screen Quote
│   │
│   └── What type of damage?
│       │
│       ├── Cracked LCD
│       │   └── Screen Quote ✓
│       │
│       ├── No Display
│       │   └── Has it come into contact with liquid?
│       │       ├── YES → Link to Liquid Damage questions → Diagnostic
│       │       └── NO → Screen Repair
│       │
│       ├── Liquid in Screen
│       │   └── Video explanation on previous screen lines
│       │       └── Recommend Screen Repair ✓
│       │
│       ├── Only works at slight angles (A1706, A1707, A1708)
│       │   └── Video explanation on Flexgate
│       │       └── Does this look like the fault?
│       │           ├── YES → Flexgate Quote ✓
│       │           └── NO / UNSURE → END (capture info)
│       │
│       ├── All other models
│       │   └── Video explanation on Flexgate
│       │       └── Flexgate assessment
│       │
│       ├── Unsure of fault / Not listed
│       │   └── Please provide / Upload picture
│       │
│       └── Other
│           └── [Capture details]
│
└── NO → [Continue to Part 2]
```

---

## 2. Display - Part 2

```
CONTINUATION (External screen doesn't work):

Does it charge / show green caps lock?
│
├── YES → Screen Quote ✓
│
├── NO → Diagnostic ✓
│
└── UNSURE → [Further assessment needed]

SPECIAL CASE - RED (screen tint):
├── YES → Screen Quote ✓
└── [Continue assessment]
```

---

## 3. Trackpad

```
START: What fault are you experiencing?
│
├── NO RESPONSE
│   └── Has the device previously come into contact with liquid?
│       ├── YES → Liquid Damage Diagnostic
│       └── NO → Any previous repairs?
│           ├── YES → Provide details → Trackpad
│           └── NO → Trackpad Repair ✓
│
├── NOT CLICKING
│   └── Has the device previously come into contact with liquid?
│       ├── YES → Liquid Damage Diagnostic
│       └── NO → Any previous repairs?
│           ├── YES → Provide details → Trackpad
│           └── NO → Trackpad Repair ✓
│
└── PHYSICAL DAMAGE
    └── Trackpad Repair ✓
```

---

## 4. Touch Bar

```
START: What fault are you experiencing?
│
├── NO IMAGE (Touch Bar blank)
│   └── Has the device previously been liquid damaged?
│       ├── YES → Liquid Damage Diagnostic
│       └── NO → Any previous repairs?
│           ├── YES → Provide details
│           └── NO → Touch Bar Repair ✓
│
├── NO TOUCH RESPONSE
│   └── Touch Bar Repair ✓
│
└── PHYSICAL DAMAGE
    └── Touch Bar Repair ✓
```

---

## 5. Keyboard / Trackpad / Touch Bar (Combined)

```
START: Which fault are you experiencing?
│
├── STICKY KEYS
│   └── Has the MacBook previously been liquid damaged?
│       ├── YES → Is everything else working OK?
│       │   ├── YES → Keyboard Replacement ✓
│       │   └── NO → Keyboard Replacement + Diagnostic
│       └── NO → Keyboard Replacement ✓
│
├── WORN OUT KEYS
│   └── How many keys?
│       └── Key Replacement ✓
│
├── MISSING KEYS
│   └── How many missing?
│       └── Key Replacement or Keyboard Repair ✓
│
├── KEYBOARD NO RESPONSE
│   └── Does the trackpad respond?
│       ├── YES → Any previous liquid damage?
│       │   ├── YES → Liquid Damage Diagnostic
│       │   └── NO → Keyboard Repair ✓
│       └── NO → Diagnostic
│
└── TRACKPAD NO RESPONSE
    └── [See Trackpad flow above]
```

---

## 6. Power / Battery

```
START: Does the device turn on?
│
├── YES → What issue are you experiencing?
│   │
│   ├── BATTERY DRAINING QUICKLY
│   │   └── Has it been repaired before?
│   │       ├── YES → Has it been diagnosed by Apple?
│   │       │   ├── YES → Any liquid damage? → YES/NO → Diagnostic
│   │       │   └── NO → [Continue assessment]
│   │       └── NO → Battery showing "Service"?
│   │           └── Battery Replacement ✓
│   │
│   ├── DIFFICULTY CHARGING
│   │   └── Is it one or more ports damaged?
│   │       ├── YES → Provide info → Charging Port
│   │       │   (Advise might have to complete further diagnostic)
│   │       └── NO → Charging Port Repair ✓
│   │
│   ├── CRASHING
│   │   └── Has the device been diagnosed by Apple?
│   │       ├── YES → Diagnostic
│   │       └── NO → Diagnostic
│   │
│   └── OTHER → Provide info
│
└── NO → What fault?
    │
    ├── APPLE LOGO BOOT (loops)
    │   └── Any previous repairs?
    │       └── Has it been diagnosed by Apple?
    │           └── YES/NO → Diagnostic
    │
    ├── FROZEN ON APPLE LOGO + PROGRESS BAR
    │   └── Is data important?
    │       ├── YES → Diagnostic
    │       └── NO → Diagnostic
    │
    ├── NOT CHARGING
    │   └── Has the device come into contact with liquid?
    │       ├── YES → Liquid Damage Diagnostic
    │       └── NO → * Can you see the green caps lock light?
    │           ├── YES → Screen Quote
    │           └── NO → Diagnostic
    │
    └── NO SIGNS OF LIFE
        └── Diagnostic
```

---

## 7. Liquid Damage

```
START: How long ago was it liquid damaged?
├── Last 24 hours
├── Last week
├── Last month
└── Over 1 month

THEN: Are any functions not working?
├── Charging port / Charging issues → Diagnostic
├── Liquid in screen
├── Keyboard damaged
├── Trackpad
├── Touch Bar (if applicable)
├── Sound / Audio
└── Connectivity

THEN: Has it been diagnosed by Apple?
├── YES → [Continue]
└── NO → [Continue]

THEN: Does the device turn on?
│
├── YES → Is data important?
│   ├── YES → Diagnostic
│   └── NO → Diagnostic
│
├── NO → Diagnostic
│
└── UNSURE → Please provide details → Diagnostic
```

---

## 8. Audio (Speakers, Microphone, Headphone Jack)

```
START: Which audio fault are you experiencing?
│
├── SPEAKERS
│   └── What's the issue?
│       ├── Distorted sound → One speaker or both?
│       │   ├── ONE → Has the MacBook come into contact with liquid?
│       │   │   ├── YES → Liquid Damage Diagnostic
│       │   │   └── NO → Speaker Replacement ✓
│       │   └── BOTH → [Same flow]
│       │
│       ├── No sound → One speaker or both?
│       │   └── [Same flow as distorted]
│       │
│       └── Low volume → [Same flow]
│
├── MICROPHONE
│   └── Any previous repairs?
│       ├── YES → Please provide details
│       └── NO → Any previous liquid damage?
│           ├── YES → Liquid Damage Diagnostic
│           └── NO → Microphone Repair ✓
│
└── HEADPHONE JACK
    └── Have you tested with a known good pair?
        ├── YES → How is the sound quality?
        │   ├── No sound → Headphone Jack Replacement ✓
        │   └── Distorted sound → Headphone Jack Replacement ✓
        └── NO → Test with known good pair first
```

---

## 9. Camera

```
START: Have you had any previous repairs?
│
├── YES → Please describe → Diagnostic
│
└── NO → Has it come into contact with any liquid?
    ├── YES → Please provide information → Diagnostic
    └── NO → Diagnostic
```

---

## 10. Connectivity (WiFi / Bluetooth)

```
START: Which are you experiencing an issue with?
│
├── WIFI
│   └── Is the option greyed out?
│       ├── YES → Has the MacBook previously come into contact with liquid?
│       │   ├── YES → Liquid Damage Diagnostic
│       │   └── NO → WiFi / Bluetooth Diagnostic
│       │
│       └── NO → Is this showing low signal?
│           ├── YES → Any previous repairs?
│           │   ├── YES → [Continue assessment]
│           │   └── NO → Diagnostic
│           └── NO → [Continue assessment]
│
├── BLUETOOTH
│   └── [Similar flow to WiFi]
│
└── BOTH
    └── Please provide details → WiFi / Bluetooth Diagnostic
```

---

---

## 11. Dustgate (Display Dust Buildup)

> Added to match website offerings

```
START: Is there visible dust/debris behind the screen?
│
├── YES → Is the display still functional?
│   ├── YES → Does it show "stage light" effect at bottom?
│   │   ├── YES → Dustgate + potential Flexgate → Screen Assessment
│   │   └── NO → Dustgate Repair ✓
│   └── NO → Full Screen Diagnostic
│
└── NO / UNSURE
    └── Please provide photo of display issue
        └── [Assessment based on image]
```

**Note:** Dustgate often accompanies Flexgate on affected models (A1706, A1707, A1708). Check for both.

---

## MacBook-Specific Notes

### Flexgate (A1706, A1707, A1708)
- Backlight cable wear issue on 2016-2017 MacBook Pro models
- Screen works at certain angles but goes dark when opened fully
- Requires display cable repair or screen replacement
- Video explanation helps client identify issue

### External Screen Test
- Critical first question for display issues
- If external works → issue is screen/display cable
- If external doesn't work → could be logic board

### Liquid Damage Critical Questions
From Ricky's voice note:
- What type of liquid? (water vs coffee vs alcohol affects corrosion)
- How long ago? (timing affects repair success)
- Has Apple seen it? (validates why coming to iCorrect)
- What charger? International plug? (power issues)

### Keyboard/Trackpad Cascade
- Often liquid damage presents as keyboard/trackpad issues first
- Always ask about liquid contact for these repairs

---

## Repair Outcomes Key

| Symbol | Meaning |
|--------|---------|
| ✓ | Confirmed repair type — can quote |
| Diagnostic | Needs tech assessment before quote |
| Video | Show explainer video to client |
| END | Capture info, route to specialist |
