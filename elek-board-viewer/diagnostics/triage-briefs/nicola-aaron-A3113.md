# Nicola Aaron BM — A3113 (M3 MBA 13")

| Field | Value |
|---|---|
| Monday item | `9265728100` |
| Queue | Safan (Short Deadline) |
| Status | Repair Paused |
| Board | A3113 / 820-03286 / M3 MacBook Air 13" (2024) |
| Ammeter | Was 0A (dead), now boots normally after repair |
| Symptom | Hall sensor not working (lid close detection fails) |
| Already tried | New hall sensor, new T-CON, new flex cable, logic board line check |
| Stuck since | 2026-02-07 (over 2 months) |
| Written | 2026-04-16 |

---

## Case history

This was a **heavily liquid damaged** M3 MBA that Apple declared unrepairable. iCorrect bought it for £70 recycling. Initial assessment: power-management IC burned, both USB-C controllers damaged, delaminated copper, multiple trace damage.

Saf did a deep strip-down and rebuilt the logic board — replacing numerous liquid-damaged components. Misha replaced the full display lid (backlight + camera flex). The board now powers on and works correctly **except the hall sensor**.

Saf has tried:
1. **New hall sensor** — doesn't work
2. **New T-CON (Timing Control board/flex)** — doesn't work
3. **New flex cable** — doesn't work
4. **Checked logic board side "line give vellu"** (value/voltage) — unclear what was measured

All three replaceable parts in the hall sensor chain have been swapped. The fault persists. This means the problem is on the **logic board side** — either a broken trace, a damaged GPIO, or a configuration issue.

---

## How the hall sensor works on Apple Silicon MacBooks

The hall sensor is a magnetic sensor that detects when the display lid is closed (a magnet in the display assembly triggers it). The signal path on A3113 is:

```
Magnet (in display lid)
    ↓
Hall sensor (small IC near hinge area)
    ↓  Signal: IPD_LID_CLOSED_L
Flex cable → JT400 (44-pin flex connector, TOP side)
    ↓
Logic board traces
    ↓
CT412 (test cap, BOTTOM, pin 1 = IPD_LID_CLOSED_L, pin 2 = GND)
    ↓
RR320 (bridge resistor, BOTTOM — bridges IPD_LID_CLOSED_L ↔ LID_CLOSED_DMIC_WARN_L)
    ↓
RR303 (pull-up resistor, TOP — pulls LID_CLOSED_DMIC_WARN_L to PP1V2_AON_MPMU)
    ↓
UR300 (8-pin IC, BOTTOM) + UR330 (5-pin IC, BOTTOM) — signal processing/logic
    ↓
U8100 (MPMU) receives LID_CLOSED_DMIC_WARN_L
    ↓
macOS registers lid close event
```

**VCC for the hall sensor:** PP1V8_AON (from UR300 pin 1)

**Expected signal voltage on IPD_LID_CLOSED_L:**
- Lid open (no magnet): ~1.8V
- Lid closed (magnet near): ~0V

Saf has replaced everything from the hall sensor to the flex cable. The remaining links are:
- **JT400** — the 44-pin flex connector on the logic board (TOP side)
- **RR320** — the bridge resistor connecting raw sensor signal to processed signal (**most likely failure point**)
- **The trace from JT400 through RR320 → RR303 → UR300 → U8100** on the logic board
- **U8100 (MPMU)** GPIO pin itself

---

## Step 1 — Inspect the hall sensor connector (JT400)

The hall sensor flex plugs into **JT400** (44-pin connector, TOP side of the logic board). This connector carries `IPD_LID_CLOSED_L` among other signals.

**Reply to Ricky with:**

1. **Visually inspect JT400 under microscope:**
   - `JT400 connector: clean / corroded / pins bent / other: ___`
2. **Is there liquid damage corrosion on or around JT400?**
   - `Corrosion near JT400: YES / NO`
   - If yes, photograph it
3. **Is the flex seated properly in JT400?**
   - `Flex seating: secure / loose / latch broken`

---

## Step 2 — Measure the hall sensor signal

The hall sensor on A3113 outputs `IPD_LID_CLOSED_L`. VCC is PP1V8_AON (~1.8V). When the lid is open, the signal sits at ~1.8V. When a magnet is near (lid closed), it pulls to ~0V.

**With the new hall sensor connected and the Mac powered on:**

1. **Probe CT412 (BOTTOM side, at coordinates 518,1472)** — this is a test cap with pin 1 = IPD_LID_CLOSED_L, pin 2 = GND:
   - `CT412 pin 1 (IPD_LID_CLOSED_L): ___V` (expect ~1.8V lid open, ~0V lid closed)
   - `CT412 pin 2 (GND): ___V` (expect 0V)
2. **Probe TBTP5 (BOTTOM side)** — test point for IPD_LID_CLOSED_L (should match CT412 pin 1):
   - `TBTP5 (IPD_LID_CLOSED_L): ___V`
3. **Hold a magnet near the hall sensor location. Does the voltage at CT412/TBTP5 change?**
   - `Signal changes with magnet: YES / NO`
4. **If signal does NOT change:** the hall sensor replacement isn't detecting the magnet (bad part, wrong orientation, or wrong sensor type for A3113)
5. **If signal DOES change:** the sensor works. Now check the processed signal:
   - `TBTP3 (LID_CLOSED_DMIC_WARN_L, TOP): ___V`
   - `TBTP4 (LID_CLOSED_DMIC_WARN_L, BOTTOM): ___V`
   - These should follow the raw signal (toggling with magnet). If CT412 toggles but TBTP3/4 do NOT toggle, the break is between the raw and processed signals — **RR320 is the prime suspect**.

---

## Step 3 — Trace continuity from CT412 to U8100

**With power off, in diode/continuity mode, trace the full signal path:**

1. **CT412 pin 1 (IPD_LID_CLOSED_L) → RR320 (BOTTOM side):**
   - `CT412 to RR320: GOOD / OPEN`
   - RR320 is the bridge resistor between IPD_LID_CLOSED_L and LID_CLOSED_DMIC_WARN_L. **This is the most likely failure point** — it connects the raw sensor signal to the processed signal path.
2. **RR320 → RR303 (TOP side, pull-up to PP1V2_AON_MPMU):**
   - `RR320 to RR303: GOOD / OPEN`
3. **RR303 → UR300 (BOTTOM, 8-pin IC):**
   - `RR303 to UR300: GOOD / OPEN`
4. **UR300 → U8100 (MPMU):**
   - `UR300 to U8100: GOOD / OPEN`

**If any link is open:** that trace is broken. Given the severity of the original liquid damage on this board, a corroded inner-layer trace is the most probable cause.

**If trace is broken:**
- Can be repaired with a jumper wire bridging the open section
- The most likely break is at or near **RR320** — if that resistor or its pads are damaged, replacing RR320 and running a jumper wire should fix it
- STOP — message Ricky with the continuity readings. We'll confirm the jumper path.

---

## Step 4 — Verify the right hall sensor type

Different MacBook models use different hall sensor ICs. The A3113 (M3 MBA 2024) may use a different sensor than what Saf installed.

**Reply to Ricky with:**

1. **What part number is on the replacement hall sensor?** (read off the chip)
   - `Hall sensor part: ___`
2. **Where did the replacement come from?** (donor board model number)
   - `Donor board: ___`
3. **Is it the same physical size and pinout as the original?**
   - `Match: YES / NO / original was too corroded to compare`

If the replacement came from a different model (e.g. A2681 M2 MBA), the sensor may be incompatible even if it fits.

---

## Step 5 — Software verification

Before doing more hardware work, rule out a software issue:

1. **Open System Settings > Displays > Advanced** (or check via Terminal: `ioreg -r -k AppleClamshellState`)
   - Does macOS see the hall sensor at all? If it reports "clamshell mode not supported" -> hardware issue confirmed
   - If it reports the sensor but the state never changes -> signal path issue
2. **Reset SMC** (on M3: shut down, wait 30 seconds, hold power button for 10 seconds, release, wait, power on)
   - Some hall sensor issues are SMC configuration problems after board repair

---

## Why this has been stuck since February

Saf has replaced every external component in the chain (sensor, T-CON, flex) and is now at the limit of what he can do without:
1. **The schematic** showing the exact trace path from the hall sensor connector to the MPMU
2. **Net data** confirming which signal/net the hall sensor is on
3. **Board-side continuity measurements** that prove the trace is broken

The net data is now available. The signal is `IPD_LID_CLOSED_L`, the connector is `JT400`, the bridge resistor `RR320` is the most likely failure point, and the destination is `U8100` (MPMU). Saf can now:
- Probe CT412/TBTP5 for the raw signal
- Probe TBTP3/TBTP4 for the processed signal
- Check continuity through the full path (CT412 → RR320 → RR303 → UR300 → U8100)
- Design a jumper wire repair if a trace is broken

---

## Escalation protocol

Same as other briefs — one message per step, include readings/photos, wait for Ricky.
