# Device Diagnosis Cheatsheet

Map common customer symptom descriptions to the correct repair name before quoting or escalating. Getting this wrong costs money — Jordan Clark's Flexgate/Dustgate symptoms got misquoted as a £499 screen replacement when the correct repair was £349.

**Rule:** If you are not certain of the repair type from the symptoms, flag to Ferrari before drafting any quote. Do not guess.

---

## MacBook Repairs — Symptom to Repair Mapping

### Flexgate

**What customers say:**
- "There are bright spots at the bottom of the screen"
- "My MacBook has a stage light effect"
- "There's a glowing line along the bottom of the display"
- "The display works but there are lit patches near the hinge"
- "Screen flickers when I open the lid past a certain angle"

**What it actually is:**
A failure of the display flex cable (the ribbon cable connecting the screen to the logic board). The cable runs across the bottom of the display and cracks with repeated opening/closing. Affected models include MacBook Pro 2016-2019.

**Correct repair name:** Flexgate / Display Cable Repair (not "Screen Replacement")

**Note:** Finn misquoted Jordan Clark: Flexgate symptoms → quoted £499 screen replacement. Customer corrected Finn. Actual repair was £349. Always distinguish Flexgate (cable) from screen damage (panel).

---

### Dustgate

**What customers say:**
- "My MacBook screen has a faint glow or haze across it"
- "There's a cloudy patch on my screen"
- "The backlight looks uneven — brighter in some areas"
- "Screen looks foggy from the inside"

**What it actually is:**
Dust infiltrating the MacBook's display assembly, settling between the backlight and LCD panel. Causes uneven backlight distribution or hazy appearance. Primarily affects 2017-2018 MacBook Pro models.

**Correct repair name:** Dustgate / Backlight Contamination Repair

**Known case:** Bonnie Awesu — 2018 MacBook Dustgate repair done summer 2024, issue recurring. Warranty claim as of Feb 2026. Not in Monday. Assigned to Ferrari.

---

### Stage Light Effect

**What customers say:**
- "There are bright spots at the bottom of my screen like stage spotlights"
- "Half circles of light along the bottom edge"

**What it actually is:**
A specific visual presentation of Flexgate — the flex cable failure causes the backlight to bleed through in semicircular patterns at the bottom of the display.

**Correct repair:** Same as Flexgate — display cable repair, not screen replacement.

---

### Logic Board / Board-Level Repair

**What customers say:**
- "My MacBook won't turn on at all"
- "I spilled liquid on it and now it's dead"
- "It keeps crashing and rebooting on its own"
- "Apple said the logic board needs replacing — it's too expensive"
- "It shows a folder with a question mark on boot"
- "Black screen, won't boot, not the battery"
- "MacBook turns on but no display at all, not even backlight"

**What it actually is:**
Failure of the logic board — the main circuit board. iCorrect does board-level repair (component-level microelectronics), which means repairing the board itself rather than replacing it. This is iCorrect's specialist capability — "we literally repair the MacBooks that nobody else can."

**Correct repair name:** Logic Board Repair / Board-Level Repair

**Important:** Liquid damage almost always needs a diagnostic first. Never quote a board repair price without a diagnostic. Start with the diagnostic fee (£49) and assess from there.

---

### Kernel Panic

**What customers say:**
- "My Mac keeps restarting with an error screen"
- "I get a black screen with an error message and it reboots"
- "Mac suddenly shuts down and shows a 'your computer restarted because of a problem' message"

**What it actually is:**
A kernel panic is a system-level crash causing an automatic reboot. Can be hardware (failing RAM, logic board fault, overheating) or software (driver conflict, OS corruption). A diagnostic is always needed to identify the cause.

**Correct repair:** Diagnostic first (£49). Repair depends on cause.

---

### Keyboard Issues

**What customers say:**
- "Keys are sticking / not registering"
- "Letters repeat when I type"
- "Keyboard is completely dead"

**What it actually is:**
Butterfly keyboard mechanism failure (common in 2016-2019 MacBook Pro/Air) or debris/liquid damage.

**Correct repair name:** Keyboard Repair or Keyboard Replacement. Note: MacBook 12" (2015-2019) and butterfly keyboard models are more complex — check if device is within supported age range before quoting (see KB-06).

---

## iPhone Repairs — Symptom to Repair Mapping

### Ghost Touch

**What customers say:**
- "My iPhone is tapping things on its own"
- "The screen is pressing buttons I didn't press"
- "Apps keep opening by themselves"
- "The touchscreen acts like something is touching it"

**What it actually is:**
The touchscreen digitizer registering phantom inputs. Can be caused by a damaged or faulty screen, a loose screen connector, or liquid damage affecting the touch layer.

**Correct repair name:** Screen Replacement (if the digitizer is faulty) or further diagnostic if liquid damage suspected.

---

### Screen Lines / Broken Display

**What customers say:**
- "There are coloured lines down my screen"
- "Half the screen is black"
- "My screen is cracked and has dead pixels"
- "The display has a green/pink tint"

**What it actually is:**
Display damage — cracked LCD/OLED panel or connector failure.

**Correct repair name:** Screen Replacement.

---

### Won't Charge / Charging Port

**What customers say:**
- "My iPhone won't charge"
- "The cable keeps falling out"
- "It charges sometimes but not reliably"
- "Charging is very slow"

**What it actually is:**
May be a dirty/damaged charging port, a faulty cable, or a battery issue. Diagnostic approach: try a known-good cable and adapter first. If that doesn't resolve, charging port replacement or battery diagnostic.

**Correct repair name:** Charging Port Repair (if port is damaged) OR Battery Replacement (if battery is failing). Don't quote port repair without ruling out battery first.

---

## iPad Repairs

### Won't Charge

Same logic as iPhone — diagnose cable/port/battery before quoting. Do not book a charging port repair before diagnostic.

Known failure: Fin booked Rose Ryk for a charging port repair before confirming the fault. Do not repeat.

---

## Key Vocabulary Reference

| Term | What it means |
|---|---|
| **Board-level repair** | Repairing the logic board at component level, not replacing the whole board |
| **BGA rework** | Ball Grid Array soldering — reballing or resoldering chips on the logic board (specialist microscope work) |
| **T-Con board** | Timing Controller board for screens. Roni is researching upgrades to convert Intel MacBook screens to Apple Silicon panels |
| **Flexgate** | MacBook display cable failure causing stage light effect or flicker. Not a screen replacement |
| **Dustgate** | Dust inside MacBook display causing backlight haze. Not a screen replacement |
| **Stage Light effect** | Visual symptom of Flexgate — semicircular bright spots at screen bottom |
| **Ghost touch** | Touchscreen registering phantom inputs — usually screen digitizer fault |
| **Kernel panic** | Mac crash-and-reboot with error report — needs diagnostic to find cause |
| **Logic board** | Main circuit board of the Mac (equivalent to motherboard in PCs) |
| **Diagnostic fee** | £49 — standard fee to assess a device before quoting repair |
| **VCCP** | iCorrect's corporate client (advertising agency). Tracked on board 30348537 |
| **Apple Silicon** | M1, M2, M3, M4 chips — all MacBooks from late 2020 onwards |
| **Intel** | MacBooks made before late 2020 — different repair paths and pricing tiers |
| **A-number** | Model identifier on bottom of MacBook (e.g. A2338). Definitive for model identification |

---

*Source: customer-service/workspace/docs/finn-audit/audit-feb-9-15.md, finn-lessons.md, finn-improvement-guide.md, shared-context/strategy-context.md, shared/COMPANY.md*
*Last updated: 2026-03-10*
