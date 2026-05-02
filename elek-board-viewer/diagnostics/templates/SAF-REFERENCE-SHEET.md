# Saf — Diagnostic Reference Sheet (v2)

**Every note starts with the ammeter reading. It tells us everything.**

---

## Spellcheck — fix these common typos before you send

| You type | Use instead |
|---|---|
| clan | clean |
| chis | chips |
| liuqid | liquid |
| chnage | change |
| mac book | macbook |
| diod | diode |
| sill | still |
| register | resistor (a register is a storage cell, a resistor is a component) |
| vellu | value |
| evrytime | every time |
| capactier | capacitor |

---

## Template 1 — Initial Diagnostic (use for every new repair)

You already use `Description / Faults / Repairs needed / Optional repairs`. Keep that — just add line breaks and always lead with AMM.

```
Description:
AMM: ___V / ___A [stable / cycling / fluctuating]
[One line: what the board is physically doing — boots, no power, ? folder, etc.]

Faults:
[Liquid damage? Where?]
[What you checked and what you found]
[Which side / chip / connector is damaged]

Repairs needed:
[Logic board work]
[Parts to order]

Optional repairs:
[Cosmetic, battery, extra items]
```

**Filled-in example (liquid damage case):**

```
Description:
AMM: 20V / 0A
Macbook not on, does not take power.

Faults:
Liquid damage visible around ATC0 charging port (bottom side).
Corrosion on UF400 and CF408. CD3217 internal short confirmed (diode mode).
Logic board otherwise clean.

Repairs needed:
Replace UF400 (ATC0 port controller)
Clean CF408 area, replace if still shorted
Replace USB-C flex if connector damaged

Optional repairs:
Battery health check
Keyboard clean (liquid evidence)
```

---

## Template 2 — Repair Notes (mid-work update)

Use when you're partway through and want to report progress.

```
Repair notes:
AMM now: ___V / ___A  (was ___V / ___A before)
Done so far: [list parts replaced / actions taken]
Current state: [what does board do now]
Next: [what you'll try next]
```

**Filled-in example:**

```
Repair notes:
AMM now: 5V / 0.090A stable  (was 5V / 0A before)
Done so far: Replaced UF400 + CF408. Cleaned charging port area.
Current state: Board takes power but stuck at 5V, won't go to 20V.
Next: Check PD negotiation on UF400 SPI ROM. If corrupted, re-program.
```

---

## Template 3 — Post-Repair Closeout (when repair is done)

You already use "Post repair all good". Keep that — just add what was actually wrong and what you fixed.

```
Post repair:
AMM: ___V / ___A (final idle reading)
Fault found: [what it actually was]
Fix applied: [what you did]
Tested: [what works, what doesn't]
Handover: @[next person] [what they need to do]
```

**Filled-in example:**

```
Post repair:
AMM: 20V / 1.8A idle, stable.
Fault found: CD3217 (UF400) internal short from liquid damage on charging port.
Fix applied: Replaced UF400, replaced USB-C connector flex, ultrasonic clean.
Tested: Boots to macOS, both USB-C ports charge, keyboard + trackpad + speakers all work.
Handover: @Mykhailo please replace polariser before QC.
```

---

## Template 4 — Need Help (when you're stuck)

Instead of "@Ricky please any update", use this so Ricky can help quickly without asking 5 questions back.

```
Need help on this one:
AMM: ___V / ___A [pattern]
Steps tried:
1. [action] → [result]
2. [action] → [result]
3. [action] → [result]
Measurements so far:
[rail] at [test point] = [value] (expected [X])
Stuck because:
[What specifically you don't know / can't find]
```

**Filled-in example:**

```
Need help on this one:
AMM: 20V / 0.552A cycling (rises to 0.55, drops to 0, repeats every 3s)
Steps tried:
1. Ultrasonic clean → still cycling
2. Replaced UD740, RD764 → no change
3. Swapped all 4 CD chips → no change
Measurements so far:
PP3V8_AON at C8450 = 3.8V ok
PP5V_S2 at C8440 = 5V present but cycling with main rail
Stuck because:
Board appears to try DFU but won't enumerate on host Mac. Can't tell if it's NAND short or SoC fault.
```

---

## Copy-paste blocks for top 4 scenarios

### A. Liquid damage repair, full recovery

```
Description:
AMM: 20V / 1.8A stable (post repair).
Board arrived with liquid damage around [area]. Powers on now.

Faults:
Liquid damage on [components]. We cleaned and replaced [parts].

Repairs needed:
Logic board liquid damage repair — DONE
Replace [part if still needed]

Optional repairs:
[top case / battery / screen if mentioned]
```

### B. BER — beyond economic repair

```
BER.
AMM: [reading]
Reason: [SoC damage / multiple cascading faults / cost > device value]
Summary: [one-line explanation]
Recommend: recycle / parts harvest / trade-in value £___
Data: [recovered via test housing / not recoverable]
```

### C. Screen-side only (logic board fine)

```
Description:
AMM: 20V / 2.2A stable.
Board takes power normally, boots to macOS. No liquid on logic board.

Faults:
Screen / display issue only. Tested on test macbook housing, screen does not work.
Logic board confirmed good: all rails normal, boots to macOS with known-good screen.

Repairs needed:
Replace LCD / screen assembly

Optional repairs:
None — logic board side clean.
```

### D. Charging port only

```
Description:
AMM: 20V / 0A (does not charge).
Board does not take power from adapter.

Faults:
Charging port pins damaged / bent / liquid residue.
CD3217 (UF400) tested in diode mode — normal.
Other rails not tested because no power yet.

Repairs needed:
Replace USB-C charging port flex.

Optional repairs:
None.
```

---

## Phrase sheet — shorthand → full sentence

### 1. AMMETER (always line 1)

| Short | Full |
|---|---|
| "AMM;20V 1.22A" | "AMM: 20V / 1.22A, stable" |
| "up and down" | "AMM: 5V / 0.224A, fluctuating between 0.09 and 0.22" |
| "cycling" | "AMM: 20V / cycling — rises to [X]A, drops to 0, repeats every [N] seconds" |
| "0A" | "AMM: 20V / 0A — board dead, no current draw" |
| "3A+" | "AMM: 20V / 3.2A — above normal boot (1.5–2.5A), something drawing excess" |

### 2. STATE OF THE BOARD

| Short | Full |
|---|---|
| "not on" | "Board does not power on. AMM 0A at 20V." |
| "taking power" | "Board takes power, AMM [X]V / [Y]A, but no display and no boot." |
| "? mark" | "Boots to question mark folder. macOS not found." |
| "boot loop" | "Cycling — AMM rises to [X]A, drops to 0, repeats every [N]s." |
| "stuck at 5V" | "Stuck at 5V. Won't negotiate to 20V. AMM [X]A." |
| "working fine" | "Powers on, Apple logo, boots to macOS, all peripherals tested working." |

### 3. MEASUREMENTS

| Short | Full |
|---|---|
| "[rail] fine" | "[rail] = [X]V at [test point]. Expected [Y]V. Match." |
| "[rail] not coming up" | "[rail] missing. Probed [test point], reads [X]V, expected [Y]V." |
| "line short" | "[rail] reads SHORT to ground in diode mode at [test point]." |
| "voltage up and down" | "[rail] fluctuating between [X]V and [Y]V at [test point]." |
| "diode mode fine" | "Diode mode normal (>0.15V) on PPBUS_AON, PP3V8_AON, PP5V_S2." |

### 4. ACTIONS + OUTCOMES

| Short | Full |
|---|---|
| "we change [X]" | "Replaced [X] (donor: ___). AMM [before] → [after]. Symptom: [change]." |
| "we try DFU" | "DFU attempted via host Mac (Sonoma 14+, known-good cable). Result: [success / error ___]." |
| "we clan" | "Ultrasonic cleaned + IPA + microscope. Residue: [clean / found near ___]." |
| "still same" | "After [action], fault unchanged. Still [specific symptom]. AMM unchanged." |
| "fixed" | "Fault resolved. Boots to macOS. AMM [X]A idle. All peripherals tested." |
| "BER" | "BER. Reason: [SoC damage / cascading faults / cost > value]. Recommend recycle / parts." |

---

## Golden rule — three parts every note

1. **AMM reading** — always line 1
2. **What you saw / measured** — specific, with numbers
3. **What you did and what happened** — action → result

Two-word answers lose information. A full sentence takes 10 extra seconds to type but saves 30 minutes of back-and-forth per repair.
