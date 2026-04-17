# Forensic Returns Investigation — 2026-03-03

**Source:** BM returns CSV (47 unique orders) × repair analysis data (534 devices)
**Matched:** 45 returns to repair chain data
**Unmatched:** 2 returns (no device found ±3 days)

## Summary

| Metric | Value |
|--------|-------|
| Total returns analysed | 45 |
| Total net revenue at risk | £8187 |
| Technical failures (repair + QC) | 19 (42%) |
| Potentially preventable | 34 (76%) |

## Root Cause Breakdown

| Cause | Count | Net at Risk | Devices |
|-------|-------|-------------|---------|
| qc_failure | 12 | £1891 | BM 1252, BM 1201, BM 1287, BM 1083, BM 1216 +7 more |
| listing_error | 9 | £1102 | BM 1359, BM 1261, BM 1449, BM 1489, BM 1262 +4 more |
| unknown | 7 | £938 | BM 1367, BM 1216, BM 1234, BM 1130, BM 1138 +2 more |
| repair_failure | 7 | £2114 | BM 1239, BM 1244, BM 1078, BM 1078, BM 1056 +2 more |
| transit_damage | 4 | £660 | BM 1223, BM 1054, BM 1103, BM 963 |
| buyers_remorse | 4 | £793 | BM 1211, BM 1061 (RTN > REFUND), BM 1020, BM 1091 |
| cosmetic_mismatch | 2 | £688 | BM 1198, BM 992 |

## Time With Customer Before Return

| Window | Count |
|--------|-------|
| 0-1 days | 17 |
| 2-3 days | 21 |
| 4-7 days | 5 |
| unknown | 2 |

## Returns by Last Person to Touch Device

| Person | Returns | Top Flags |
|--------|---------|-----------|
| Mykhailo Kepeshchuk | 16 | Only 1 day(s) with customer before return; Screen mismatch: reported Good, actua |
| Andres Egas | 12 | 0 min repair time — no functional test after part swap (LCD - A2337); No repair_ |
| Safan Patel | 10 | Casing mismatch: reported Good, actual Fair; Liquid damage noted at intake: 'Yes |
| Roni Mykhailiuk | 6 | Only 3 day(s) with customer before return; Liquid damage noted at intake: 'Liqui |
| Unknown | 1 | Only 3 day(s) with customer before return |

## What Would Have Caught It

| Measure | Returns Prevented | Net Saved |
|---------|-------------------|-----------|
| listing_accuracy_check_before_dispatch | 9 | £1102 |
| investigation_needed | 7 | £938 |
| retest_reported_fault_before_dispatch | 6 | £2102 |
| functional_test_before_dispatch | 6 | £1278 |
| better_packaging_or_courier | 4 | £660 |
| boot_test_after_screen_swap | 4 | £260 |
| charge_cycle_test_after_battery_swap | 2 | £354 |
| stricter_cosmetic_grading_at_refurb | 2 | £688 |
| extended_burn_in_test_after_screen_repair | 1 | £12 |

## Grade × Root Cause

| Grade | buyers_remorse | cosmetic_mismatch | listing_error | qc_failure | repair_failure | transit_damage | unknown | Total |
|-------|-------|-------|-------|-------|-------|-------|-------|-------|
| Excellent | 1 | 0 | 0 | 2 | 0 | 1 | 0 | 4 |
| Fair | 1 | 2 | 6 | 6 | 5 | 2 | 6 | 28 |
| Good | 2 | 0 | 3 | 4 | 2 | 1 | 1 | 13 |

## Key Findings

### 1. No feedback loop — 42/45 returned devices have zero post-return notes

Only 3 devices have any notes logged after the sale date. When a device comes back from a customer, nobody is recording what they find. This means:
- The team can't learn from mistakes — there's no record of what actually failed
- You can't verify if the customer's complaint was legit or exaggerated
- The same failure modes keep repeating because nobody is documenting the post-mortem

The 3 devices with post-return notes: BM 1061 (AZERTY keyboard investigation), BM 1099 (Ferrari chasing Andres on a mis-shipped device), BM 1010 (Client Services requesting a label).

### 2. Ghost repairs — 20 devices have parts installed but no repair person, 19 have 0 min repair time

LCD screens, batteries, and logic boards are being logged against devices with zero recorded repair time and nobody's name attached. Either the time tracker isn't being used, or parts are being assigned to devices without an actual repair step being completed. There is no accountability trail for the repair itself.

Worst examples:
- BM 963 — battery + LCD replaced, 0 min repair, no repair person → returned for boot failure
- BM 1010 — LCD replaced, 0 min repair, no repair person → returned for boot failure
- BM 1262 — LCD + USB-C port replaced, 0 min repair, no repair person → returned for boot failure

### 3. Condition grading is unreliable — 21/45 screen mismatches, 20/45 casing mismatches

Almost half of returned devices had a mismatch between the condition reported at trade-in and what was actually found. The most common pattern: screens reported "Good" but actually "Damaged". This feeds directly into listing errors — if intake grading is wrong, the BM listing grade is wrong, and the customer receives something they didn't expect.

| Mismatch | Count | % of returns |
|----------|-------|-------------|
| Screen reported ≠ actual | 21 | 47% |
| Casing reported ≠ actual | 20 | 44% |

### 4. Liquid damage devices are 44% of all returns

20 out of 45 returned devices had liquid damage flagged at intake. These devices are disproportionately represented in returns. Liquid damage creates intermittent faults that pass QC on the bench but fail in the customer's hands (thermal cycling, humidity, vibration during transit can reactivate corrosion).

**BM 1078** is the poster child: liquid damage at intake → Safan repaired logic board → passed QC → sold for £1,099 → came back twice in one day (keyboard defects, then display issues). £2,198 total sale value at risk from one liquid-damaged device.

### 5. Nine devices shipped with technical faults and no QC evidence

These devices had technical customer complaints but zero QC notes in Monday — no evidence anyone tested them before dispatch:

| Device | Parts Replaced | Complaint | Repair Person |
|--------|---------------|-----------|---------------|
| BM 963 | Battery + LCD | Boot failure | nobody (0m) |
| BM 1010 | LCD + other | Boot failure | nobody (0m) |
| BM 1083 | Unknown part | Display issues | nobody (0m) |
| BM 989 | LCD (Sharp) | Accessories not working | nobody (0m) |
| BM 1019 | Battery + LCD + other | Camera failures | nobody (0m) |
| BM 1099 | None logged | Camera + display | nobody (0m) |
| BM 1056 | 2 unknown parts | Keyboard defects | Mykhailo (34m) |
| BM 958 | Logic board + USB-C + backlight | Boot failure | Andres (59m) |
| BM 1028 | Logic board + other | Boot failure + wrong model | Safan (50m) |

6 of these 9 had no repair person AND no QC notes. A 2-minute boot test would have caught every one.

### 6. Four repeat returners — same device, multiple complaints

| Device | Returns | Total Sale Value | Complaints |
|--------|---------|-----------------|------------|
| BM 1078 (MBP14) | 2 | £2,198 | Keyboard defects → Display issues |
| BM 1216 (MBP13) | 2 | £798 | Other issues → Accessories not working |
| BM 1130 (MBA13) | 2 | £816 | Other issues → Wrong colour |
| BM 1103 (MBA13) | 2 | £744 | Keyboard mapping + tracking → Other issues |

These devices should have been pulled from sale after the first return for inspection, not relisted.

### 7. 84% of returns happen within 3 days of delivery

| Window | Count | % |
|--------|-------|---|
| 0-1 days | 17 | 38% |
| 2-3 days | 21 | 47% |
| 4-7 days | 5 | 11% |
| Unknown | 2 | 4% |

Customers aren't using these devices for weeks then returning — they're opening the box and immediately seeing the problem. This points to dispatch-side failures (QC, grading, listing accuracy), not durability or wear issues.

### 8. The Andres pattern — 9/16 devices he touched had 0 min repair time

Andres appears on 16 returned devices (diag or refurb). Of those, 9 had 0 min repair time with parts logged — LCDs, batteries, and other components swapped with no recorded repair step. 3 of those 9 came back for boot failure (BM 1098, BM 963, BM 1010).

### 9. Financial impact — repair failures cost the most per return

| Cause | Count | Net at Risk | Avg per Return |
|-------|-------|-------------|---------------|
| repair_failure | 7 | £2,114 | £302 |
| cosmetic_mismatch | 2 | £688 | £344 |
| buyers_remorse | 4 | £793 | £198 |
| transit_damage | 4 | £660 | £165 |
| qc_failure | 12 | £1,891 | £158 |
| unknown | 7 | £938 | £134 |
| listing_error | 9 | £1,102 | £122 |

Repair failures and cosmetic mismatches are the most expensive per incident. QC failures are the most frequent and preventable. Listing errors are pure process — nothing wrong with the device, just the wrong description.

---

## Per-Device Case Studies

### 1. BM 1078 — MBP14

- **BM Order:** 46441949 | **Trade-in:** GB-25456-XWPBL | **Grade:** NONFUNC.USED → Fair | **Serial:** G91PQFNW94
- **Financials:** Buy £123 → Sell £1099 | Parts £1 | Net £647
- **Repair chain:** Diag: - (46m) → Repair: Safan Patel (117m) → Refurb: - (0m)
- **Timeline:** Received 2025-11-13 → Repaired 2025-11-17 → Sold 2025-12-02 → Customer got 04/12/2025 → Returned 03/12/2025
- **Duration:** 4d in repair | 1d with customer
- **Customer complaint:** Technical > Keyboard Defects
- **Parts:** MacBook Logic Board
- **Root cause:** repair_failure — Technical complaint, repair was done (by Safan Patel, 117 min)
- **Prevention:** retest_reported_fault_before_dispatch
- **Flags:** Screen mismatch: reported Good, actual Damaged | Casing mismatch: reported Good, actual Fair | Only 1 day(s) with customer before return | Liquid damage noted at intake: 'Yes' | High value: sale price £1099 | Battery mismatch: reported Normal, actual Unable to Test
- **Pre-dispatch notes** (6):
  - [2025-11-13] Roni Mykhailiuk (reply): Faults: Liquid damage, Display -- not working I test at our tester Display brightness ~~in the center I saw that it works on the edges no. 𝗥𝗲𝗽𝗮𝗶𝗿𝘀 𝗻𝗲𝗲
  - [2025-11-14] Safan Patel (reply): Post repair all good,we repair logic board and check other all parts working fine ,repair one ic liquid damage on logic board (U2230)
  - [2025-11-14] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Failure  Not working jack 3.5  Ammeter - passed (20v 2.5+) Battery - passed 86% Camera - passed True tone - passed Display - passed
  - [2025-11-17] Safan Patel (reply): Post repair all good,we repair headphone jack ic and headphone jack after working fine
  - [2025-11-17] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Device cleaned. Ammeter - passed (20v 2.5+) Battery - passed 86% Camera - passed True tone - passed Display - passed Display brightn
  - [2025-11-17] Roni Mykhailiuk (reply): @Ricky Panesar we didn't reshaped lid because the screen is working and that's fair.

### 2. BM 1078 — MBP14

- **BM Order:** 72373581 | **Trade-in:** GB-25456-XWPBL | **Grade:** NONFUNC.USED → Fair | **Serial:** G91PQFNW94
- **Financials:** Buy £123 → Sell £1099 | Parts £1 | Net £647
- **Repair chain:** Diag: - (46m) → Repair: Safan Patel (117m) → Refurb: - (0m)
- **Timeline:** Received 2025-11-13 → Repaired 2025-11-17 → Sold 2025-12-02 → Customer got 03/12/2025 → Returned 03/12/2025
- **Duration:** 4d in repair | 0d with customer
- **Customer complaint:** Technical > Display Issues
- **Parts:** MacBook Logic Board
- **Root cause:** repair_failure — Technical complaint, repair was done (by Safan Patel, 117 min)
- **Prevention:** retest_reported_fault_before_dispatch
- **Flags:** Screen mismatch: reported Good, actual Damaged | Casing mismatch: reported Good, actual Fair | Only 0 day(s) with customer before return | Liquid damage noted at intake: 'Yes' | High value: sale price £1099 | Battery mismatch: reported Normal, actual Unable to Test
- **Pre-dispatch notes** (6):
  - [2025-11-13] Roni Mykhailiuk (reply): Faults: Liquid damage, Display -- not working I test at our tester Display brightness ~~in the center I saw that it works on the edges no. 𝗥𝗲𝗽𝗮𝗶𝗿𝘀 𝗻𝗲𝗲
  - [2025-11-14] Safan Patel (reply): Post repair all good,we repair logic board and check other all parts working fine ,repair one ic liquid damage on logic board (U2230)
  - [2025-11-14] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Failure  Not working jack 3.5  Ammeter - passed (20v 2.5+) Battery - passed 86% Camera - passed True tone - passed Display - passed
  - [2025-11-17] Safan Patel (reply): Post repair all good,we repair headphone jack ic and headphone jack after working fine
  - [2025-11-17] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Device cleaned. Ammeter - passed (20v 2.5+) Battery - passed 86% Camera - passed True tone - passed Display - passed Display brightn
  - [2025-11-17] Roni Mykhailiuk (reply): @Ricky Panesar we didn't reshaped lid because the screen is working and that's fair.

### 3. BM 1198 — MBP16

- **BM Order:** 52417828 | **Trade-in:** GB-25505-HTEYE | **Grade:** FUNC.CRACK → Fair | **Serial:** G9X9X0NC6J
- **Financials:** Buy £124 → Sell £923 | Parts £0 | Net £543
- **Repair chain:** Diag: Mykhailo Kepeshchuk (17m) → Repair: - (19m) → Refurb: Mykhailo Kepeshchuk (24m)
- **Timeline:** Received 2025-12-18 → Repaired 2025-12-20 → Sold 2026-01-16 → Customer got 19/01/2026 → Returned 16/01/2026
- **Duration:** 2d in repair | 3d with customer
- **Customer complaint:** Esthetical > Item Damaged Before Delivery
- **Parts:** Unknown-18285916257
- **Root cause:** cosmetic_mismatch — Customer complaint about cosmetic condition
- **Prevention:** stricter_cosmetic_grading_at_refurb
- **Flags:** Only 3 day(s) with customer before return | Liquid damage noted at intake: 'Yes' | High value: sale price £923
- **Pre-dispatch notes** (7):
  - [2025-12-18] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Pro (16-inch, 2021) 🔢 Serial: G9X9X0NC6J ✅ iCloud: OFF  ⚠️ Could not identify device from SickW data
  - [2025-12-18] Adil Azad: @Safan Patel Liquid damage and display damage
  - [2025-12-20] Safan Patel (reply): Repair notes;  No liquid damage on logic board  @Mykhailo Kepeshchuk please can you make screen and after check other all parts
  - [2025-12-20] Mykhailo Kepeshchuk (reply): Post repair: All good, screen LG replaced without soldering ICs   orig was LG
  - [2025-12-20] Mykhailo Kepeshchuk (reply): lid reshaped
  - [2025-12-20] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Device cleaned Ammeter - passed (20v 3A) Battery - passed 86% Ports - passed one port working only one side. After cleaned all good

### 4. BM 1054 — MBP13

- **BM Order:** 72595395 | **Trade-in:** GB-25423-TJHIH | **Grade:** NONFUNC.USED → Fair | **Serial:** RFK73L4PWL
- **Financials:** Buy £107 → Sell £785 | Parts £2 | Net £404
- **Repair chain:** Diag: - (12m) → Repair: Safan Patel (34m) → Refurb: Roni Mykhailiuk (217m)
- **Timeline:** Received 2025-11-04 → Repaired 2025-11-08 → Sold 2025-11-17 → Customer got 18/11/2025 → Returned 17/11/2025
- **Duration:** 4d in repair | 1d with customer
- **Customer complaint:** Late Delivery > Parcel Recovery Issues
- **Parts:** Battery Flex - A2442 / A2779 / A2918 / A2992, See Notes (All Models)
- **Root cause:** transit_damage — Customer complaint matches transit/delivery issue
- **Prevention:** better_packaging_or_courier
- **Flags:** Screen mismatch: reported Fair, actual Damaged | Only 1 day(s) with customer before return | Liquid damage noted at intake: 'Yes'
- **Pre-dispatch notes** (11):
  - [2025-11-04] Roni Mykhailiuk (reply): This A2442 not A2338 Lcd working , have 2 small dust at BL, and pol:fair. Faults : Not turn on , 5v . Battery looks bad bloated ,liquid damage on the
  - [2025-11-07] Safan Patel (reply): Repair notes;  we check No liquid damage macboo, battery is inflated and camera flex is bun  we repair new battery macbook ready to change camera flex
  - [2025-11-08] Roni Mykhailiuk (reply): @Ricky Panesar we had 2 lids for this MacBook but two of them have broken hinges.I tried to do something with this but hinges doesn't hold well there
  - [2025-11-08] Ricky Panesar (reply): @Roni Mykhailiuk Please mark it to say it needs to have a lid ordered. Can you confirm you know how to do this?
  - [2025-11-08] Roni Mykhailiuk (reply): @Ricky Panesar yes, I already did that.
  - [2025-11-08] Safan Patel (reply): @Roni Mykhailiuk yesterday I give two screen used one screen for this macbook

### 5. BM 1138 — MBP14

- **BM Order:** 73902913 | **Trade-in:** GB-25474-TYMVE | **Grade:** NONFUNC.USED → Good | **Serial:** V5VFVJ92WL
- **Financials:** Buy £123 → Sell £802 | Parts £60 | Net £366
- **Repair chain:** Diag: Safan Patel (85m) → Repair: Safan Patel (58m) → Refurb: Mykhailo Kepeshchuk (36m)
- **Timeline:** Received 2025-12-04 → Repaired 2025-12-08 → Sold 2025-12-11 → Customer got 12/12/2025 → Returned 11/12/2025
- **Duration:** 4d in repair | 1d with customer
- **Customer complaint:** Other > Other Issues
- **Parts:** MacBook Pro A2442 Battery (A2519), MacBook Logic Board, Keyboard - A2442 / A2779 / A2918 / A2992 / A3112 / A3401 / A3185
- **Root cause:** unknown — Generic 'Other' complaint — no data to classify
- **Prevention:** investigation_needed
- **Flags:** Screen mismatch: reported Good, actual Damaged | Only 1 day(s) with customer before return | High value: sale price £802 | Battery mismatch: reported Normal, actual Unable to Test
- **Pre-dispatch notes** (9):
  - [2025-12-04] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Pro (14-inch,2021) 🔢 Serial: V5VFVJ92WL 🔒 iCloud: ON  ⚠️ Could not identify device from SickW data  📊
  - [2025-12-05] Ricky Panesar: ✅ iCloud Recheck Complete ───────────────── iCloud Status: OFF ✅ Serial: V5VFVJ92WL  Device moved to Today's Repairs. Proceeding with trade-in.
  - [2025-12-05] Adil Azad: Device has been opened and repaired previously
  - [2025-12-05] Safan Patel (reply): Post repair all good,we repair logic board right side buttom charging port ram and battery connter and some battery data line and chnage new battery
  - [2025-12-05] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Failure Key Shift right not working Ammeter - passed (20v 2.5A) Battery - passed 100% Ports - passed Audio - passed Camera - passed
  - [2025-12-05] Safan Patel (reply): Post repair all good,we found sift right side key some time does not we repair fully keyboard

### 6. BM 1056 — MBP13

- **BM Order:** 72676015 | **Trade-in:** GB-25425-HQILQ | **Grade:** NONFUNC.USED → Good | **Serial:** FVFGK177Q05P
- **Financials:** Buy £97 → Sell £610 | Parts £0 | Net £342
- **Repair chain:** Diag: - (0m) → Repair: Mykhailo Kepeshchuk (34m) → Refurb: Mykhailo Kepeshchuk (3m)
- **Timeline:** Received 2025-11-04 → Repaired 2025-11-06 → Sold 2025-11-10 → Customer got 11/11/2025 → Returned 10/11/2025
- **Duration:** 2d in repair | 1d with customer
- **Customer complaint:** Technical > Keyboard Defects
- **Parts:** Unknown-18096807969, Unknown-9951310434
- **Root cause:** repair_failure — Technical complaint, repair was done (by Mykhailo Kepeshchuk, 34 min)
- **Prevention:** retest_reported_fault_before_dispatch
- **Flags:** Screen mismatch: reported Good, actual Damaged | Casing mismatch: reported Good, actual Excellent | Only 1 day(s) with customer before return
- **Pre-dispatch notes** (6):
  - [2025-11-04] Roni Mykhailiuk (reply): Faults : LCD damage, don't have true tone , key "4" Repairs needed: LCD replacement, key need replacement
  - [2025-11-06] Mykhailo Kepeshchuk (reply): Post repair: All good, Full screen A2251 with A2338 T-CON replaced  LCD Pol B+ grade  Lid fair was bend I reshaped bottom right corner, lid has scratc
  - [2025-11-06] Mykhailo Kepeshchuk (reply): also key "4" replaced
  - [2025-11-06] Adil Azad: QC:  DEVICE ERASED  both ports checked in all orientations.  Device cleaned.  Ammeter - passed (20v 1.5+)  Audio - passed  Camera - passed  Display -
  - [2025-11-06] Adil Azad: i cracked the bezel during qc and will therefore fail it and send back to techncian. - apologies.
  - [2025-11-06] Mykhailo Kepeshchuk (reply): bezel replaced

### 7. BM 1104 — MBP13

- **BM Order:** 73375963 | **Trade-in:** GB-25471-KDMMJ | **Grade:** NONFUNC.USED → Excellent
- **Financials:** Buy £81 → Sell £669 | Parts £18 | Net £318
- **Repair chain:** Diag: - (20m) → Repair: - (133m) → Refurb: Mykhailo Kepeshchuk (135m)
- **Timeline:** Received 2025-11-24 → Repaired 2025-11-25 → Sold 2025-11-27 → Customer got 01/12/2025 → Returned 27/11/2025
- **Duration:** 1d in repair | 4d with customer
- **Customer complaint:** Technical > Display Issues + Technical > Keyboard Defects
- **Parts:** MacBook Logic Board, Keyboard - A2338, Keyboard Backlight - A2289 / A2338, Other (See Notes)
- **Root cause:** qc_failure — Technical complaint but no repair logged (0 min / no person)
- **Prevention:** functional_test_before_dispatch
- **Flags:** No repair_person assigned but parts cost £18 | Liquid damage noted at intake: 'Yes' | Battery mismatch: reported Service, actual Unable to Test
- **Pre-dispatch notes** (7):
  - [2025-11-24] Andres Egas (reply): Description: ammeter : 5 amps device not turning on , liquid damage mainly at the wifi bar , lcd working tested with tester Faults: Liquid damage 5 vo
  - [2025-11-25] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Pro (13-inch, M2, 2022) 🔢 Serial: N7GYQDCW3M ✅ iCloud: OFF  📊 Spec Check: RAM: Actual 8GB ✅ Storage:
  - [2025-11-25] Safan Patel (reply): Description:  * AMM;5.0v * .0144 Faults:  * Macbook not on and working * we found lot's off liquid damage on logic board * we clan and chnage 8 ic liq
  - [2025-11-25] Safan Patel (reply): @Mykhailo Kepeshchuk please can you check camera because other screen has camera working look like liquid damage
  - [2025-11-25] Mykhailo Kepeshchuk (reply): @Safan Patel When you remove the battery, you need to apply new adhesive so the battery doesn’t rattle during normal use of the device.  Also, you did
  - [2025-11-25] Mykhailo Kepeshchuk (reply): Post repair: All good, camera flex replaced and I put tape for battery but I didn’t clean flex with microphones

### 8. BM 1211 — MBP13

- **BM Order:** 74281180 | **Trade-in:** GB-25505-MSOSZ | **Grade:** NONFUNC.USED → Fair | **Serial:** FVFFC770KPF
- **Financials:** Buy £114 → Sell £599 | Parts £1 | Net £291
- **Repair chain:** Diag: Safan Patel (20m) → Repair: Safan Patel (130m) → Refurb: - (0m)
- **Timeline:** Received 2025-12-23 → Repaired 2026-01-22 → Sold 2026-01-25 → Customer got 27/01/2026 → Returned 26/01/2026
- **Duration:** 30d in repair | 1d with customer
- **Customer complaint:** Changed Mind > Ask For Return
- **Parts:** MacBook Logic Board, Unknown-10839537537, Unknown-11069485348, Unknown-11069617210, Unknown-11069588689
- **Root cause:** buyers_remorse — Customer complaint matches buyer's remorse pattern
- **Prevention:** none — buyer's remorse is not preventable
- **Flags:** Function field: 'Functional?' — uncertain assessment | Screen mismatch: reported Excellent, actual Screen Grade? | Casing mismatch: reported Fair, actual Casing Grade? | Only 1 day(s) with customer before return | Liquid damage noted at intake: 'Liquid Damage?' | Battery mismatch: reported Normal, actual Battery Health?
- **Pre-dispatch notes** (20):
  - [2025-12-23] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Pro (13-inch, 2020, Two Thunderbolt 3 ports) Silver 🔢 Serial: FVFCX0PTP3XY 🔒 iCloud: ON  ⚠️ Could not
  - [2025-12-23] Ricky Panesar: ❌ iCloud Recheck Complete ───────────────── iCloud Status: STILL ON ❌ Serial: FVFCX0PTP3XY  Customer contacted with instructions.
  - [2026-01-05] Michael Ferrari: @Safan Patel can you please quickly open this up and confirm whether it's an A2338 or A2289?
  - [2026-01-05] Safan Patel (reply): @Michael Ferrari A2338
  - [2026-01-05] Michael Ferrari (reply): @Safan Patel you told me that an A2289 bottom cover would not be compatible with an A2338 😅 I’ve been fighting the client saying that we definitely do
  - [2026-01-05] Michael Ferrari (reply): @Safan Patel can you turn on the device to confirm the serial number?

### 9. BM 1239 — MacBook Pro 13" (Late 2020) - Apple M1 -

- **BM Order:** 77117529 | **Trade-in:** GB-25513-CRDMZ | **Grade:** UNKNOWN → Fair | **Serial:** R7QKHYR2RH
- **Financials:** Buy £100 → Sell £666 | Parts £53 | Net £285
- **Repair chain:** Diag: Mykhailo Kepeshchuk (56m) → Repair: Safan Patel (74m) → Refurb: Mykhailo Kepeshchuk (76m)
- **Timeline:** Received 2026-01-05 → Repaired 2026-02-24 → Sold 2026-02-24 → Customer got 25/02/2026 → Returned 24/02/2026
- **Duration:** 50d in repair | 1d with customer
- **Customer complaint:** Technical > Battery Not Charging Or Connectivity
- **Parts:** Keyboard Backlight - A2289 / A2338, Unknown-9951310434, Other (See Notes), Touch Bar - A2251 /A2289/A2338 M1 / A2338 M2, Trackpad Flex - A2338 M2, Unknown-10062529433
- **Root cause:** repair_failure — Technical complaint, repair was done (by Safan Patel, 74 min)
- **Prevention:** retest_reported_fault_before_dispatch
- **Flags:** Only 1 day(s) with customer before return
- **Pre-dispatch notes** (13):
  - [2026-01-05] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Pro (13-inch, M1, 2020) Silver 🔢 Serial: FVFGD0PFQ05G ✅ iCloud: OFF  ✅ Device: MacBook Pro 13 M1 A233
  - [2026-01-05] Roni Mykhailiuk (reply): @Ricky Panesar need to do counteroffer
  - [2026-01-05] Roni Mykhailiuk (reply): Pre diagnostics: Faults: Touch bar ^, bezel cracked, bottom cover , keyboard brightness, polariser need replacement  Ammeter - passed (20v 2.5A) Batte
  - [2026-01-07] Michael Ferrari (reply): @Safan Patel please repair Touch Bar and fix keyboard backlight. Then assign to refurb team for bezel and pol replacement
  - [2026-01-12] Safan Patel (reply): Repair notes;  we repair new keyboard keys and keyboard back light and touch bar  @Mykhailo Kepeshchuk please repair pol
  - [2026-01-16] Mykhailo Kepeshchuk (reply): Post repair: All good, Pol and bezel replaced

### 10. BM 1002 — MBP13

- **BM Order:** 47115620 | **Trade-in:** GB-25384-HZSZH | **Grade:** NONFUNC.USED → Good | **Serial:** FVFFJ8K2Q05G
- **Financials:** Buy £80 → Sell £520 | Parts £1 | Net £283
- **Repair chain:** Diag: Andres Egas (0m) → Repair: Safan Patel (64m) → Refurb: - (0m)
- **Timeline:** Received 2025-10-09 → Repaired 2025-10-14 → Sold 2025-10-15 → Customer got 15/10/2025 → Returned 14/10/2025
- **Duration:** 5d in repair | 1d with customer
- **Customer complaint:** Bad Product > Wrong Or Missing Accessories
- **Parts:** MacBook Logic Board
- **Root cause:** listing_error — Customer complaint matches listing discrepancy
- **Prevention:** listing_accuracy_check_before_dispatch
- **Flags:** Screen mismatch: reported Good, actual Fair | Casing mismatch: reported Good, actual Fair | Only 1 day(s) with customer before return | Liquid damage noted at intake: 'Liquid Damage?'
- **Pre-dispatch notes** (5):
  - [2025-10-09] Andres Egas (reply): Description: ammeter : 5 volts  No liquid detected inside , not turning on , screen tested with external screen and working Faults: 5 volts Repairs ne
  - [2025-10-09] Michael Ferrari (reply): @Andres Egas SN is wrong, please update
  - [2025-10-10] Andres Egas (reply): Icloud on🙃
  - [2025-10-13] Michael Ferrari (reply): iCloud off
  - [2025-10-14] Safan Patel (reply): Post repair all good,we repair logic board  we found one capacitor short (C81DB)

### 11. BM 1201 — MBA13

- **BM Order:** 52798593 | **Trade-in:** GB-25507-FDNJT | **Grade:** NONFUNC.USED → Fair | **Serial:** FX9FGKC76Q
- **Financials:** Buy £109 → Sell £527 | Parts £0 | Net £278
- **Repair chain:** Diag: Safan Patel (12m) → Repair: Safan Patel (0m) → Refurb: - (0m)
- **Timeline:** Received 2026-01-13 → Repaired 2025-12-20 → Sold 2026-01-16 → Customer got 19/01/2026 → Returned 16/01/2026
- **Duration:** -24d in repair | 3d with customer
- **Customer complaint:** Technical > Power On Boot Failure
- **Parts:** Unknown-9934303569, Other (See Notes)
- **Root cause:** qc_failure — Technical complaint but no repair logged (0 min / no person)
- **Prevention:** functional_test_before_dispatch
- **Flags:** Only 3 day(s) with customer before return | Battery mismatch: reported Service, actual Unable to Test
- **Pre-dispatch notes** (7):
  - [2025-12-18] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Air (13-inch M2 2022) 🔢 Serial: FX9FGKC76Q ✅ iCloud: OFF  ✅ Device: MacBook Air 13 M2 A2681  📊 Spec C
  - [2025-12-18] Adil Azad: @Safan Patel display going in and out please investigate thank you
  - [2025-12-20] Safan Patel (reply): Post repair all good,we repair hall sensor and check No liquid damage parts
  - [2025-12-20] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Ammeter - passed (20v 0.8A) Battery - passed 89% Ports - passed Audio - passed Camera - passed True tone - passed Display - passed P
  - [2025-12-20] Ricky Panesar: ✅ Listed on Backmarket SKU: MBA.A2681.8GB.256GB.Midnight.Fair Date Purchased: 2025-12-18 Price: £590
  - [2026-01-13] Michael Ferrari: Returned for refund. Client bought the wrong specs

### 12. BM 1083 — MBP13

- **BM Order:** 73500809 | **Trade-in:** GB-25465-JZSWP | **Grade:** FUNC.CRACK → Excellent | **Serial:** FVFH41LHQ05D
- **Financials:** Buy £133 → Sell £587 | Parts £0 | Net £275
- **Repair chain:** Diag: - (24m) → Repair: - (0m) → Refurb: Roni Mykhailiuk (96m)
- **Timeline:** Received 2025-12-01 → Repaired 2025-12-02 → Sold 2025-12-04 → Customer got 08/12/2025 → Returned 05/12/2025
- **Duration:** 1d in repair | 3d with customer
- **Customer complaint:** Technical > Display Issues
- **Parts:** Unknown-18276358203
- **Root cause:** qc_failure — Technical complaint but no repair logged (0 min / no person)
- **Prevention:** functional_test_before_dispatch
- **Flags:** Casing mismatch: reported Damaged, actual Excellent | Only 3 day(s) with customer before return
- **Pre-dispatch notes** (8):
  - [2025-12-01] Michael Ferrari: * Device's camera doesn't focus * Screen doesn't display anything * Battery life is shorter than expected * Item doesn't turn on * Unexpected shutdown
  - [2025-12-01] Michael Ferrari (reply): @Andres Egas there you go
  - [2025-12-01] Andres Egas (reply): Description: ammeter : 20 volts , 2amps No image , camera with fingerprint , rest tested and working , unable to test touch id (using guest account to
  - [2025-12-01] Michael Ferrari (reply): @Roni Mykhailiuk we can replace the full screen (that's the same repair we did last time). Client requested a refund but the device is iCloud locked,
  - [2025-12-01] Roni Mykhailiuk (reply): @Michael Ferrari we don't have a full screen so but we have a lid grade A and LCD I make full screen.
  - [2025-12-01] Roni Mykhailiuk (reply): Post repair: all good I replaced lid, camera ,LCD.

### 13. BM 1359 — MBP14

- **BM Order:** 76415529 | **Trade-in:** GB-26027-TGFCZ | **Grade:** FUNC.CRACK → Fair | **Serial:** T4PW92YYV1
- **Financials:** Buy £248 → Sell £729 | Parts £0 | Net £258
- **Repair chain:** Diag: Mykhailo Kepeshchuk (24m) → Repair: - (0m) → Refurb: Mykhailo Kepeshchuk (194m)
- **Timeline:** Received 2026-02-02 → Repaired 2026-02-05 → Sold 2026-02-09 → Customer got 10/02/2026 → Returned 09/02/2026
- **Duration:** 3d in repair | 1d with customer
- **Customer complaint:** Bad Product > Wrong Color + Esthetical > Body Appeareance Is Not As Expected
- **Parts:** Unknown-18096827880
- **Root cause:** listing_error — Customer complaint matches listing discrepancy
- **Prevention:** listing_accuracy_check_before_dispatch
- **Flags:** Only 1 day(s) with customer before return | Battery mismatch: reported Normal, actual Unable to Test
- **Pre-dispatch notes** (7):
  - [2026-02-02] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Pro (14-inch,2021) 🔢 Serial: T4PW92YYV1 ✅ iCloud: OFF  ⚠️ Could not identify device from SickW data
  - [2026-02-03] Ricky Panesar: Stock Check Complete  Status: Low Stock  Parts Checked: - LCD - A2442 | A2779 | A3112 | A3185 | A3401 (LG): 2 in stock
  - [2026-02-03] Adil Azad (reply): @Mykhailo Kepeshchuk   screen gave image for less than 1 minute and cut out again.  screen replacement (in stock)  unable to test most other features
  - [2026-02-05] Mykhailo Kepeshchuk (reply): Post repair: All good, new screen BOE replaced without soldering ICs  Orig LCD was LG
  - [2026-02-05] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 : Ammeter - passed (20v 4.3A) Battery - passed 85% Ports - passed Audio - passed Camera - passed True tone - passed Display - passed Display b
  - [2026-02-05] Michael Ferrari: ✅ Parts Checkout Complete  📦 Parts Deducted: • LCD - A2992 | A2918 (BOE): 16 → 15  🤖 Automated by Parts Deduction System

### 14. BM 1262 — MBP14

- **BM Order:** 76261799 | **Trade-in:** GB-26015-DLTYB | **Grade:** FUNC.CRACK → Fair | **Serial:** F49JVPQGKM
- **Financials:** Buy £235 → Sell £1029 | Parts £233 | Net £246
- **Repair chain:** Diag: Mykhailo Kepeshchuk (44m) → Repair: - (0m) → Refurb: Mykhailo Kepeshchuk (217m)
- **Timeline:** Received 2026-01-06 → Repaired 2026-01-17 → Sold 2026-01-20 → Customer got 21/01/2026 → Returned 20/01/2026
- **Duration:** 11d in repair | 1d with customer
- **Customer complaint:** Bad Product > Wrong Model Or Specifications
- **Parts:** LCD (LG) - A2442 | A2779 | A2992 | A2918 | A3112 | A3185 | A3401, USB-C Port - A2442 / A2779  / A2485 / A2780
- **Root cause:** listing_error — Customer complaint matches listing discrepancy
- **Prevention:** listing_accuracy_check_before_dispatch
- **Flags:** 0 min repair time — no functional test after part swap (LCD (LG) - A2442 | A2779 | A2992 | A2918 | A3112 | A3185 | A3401, USB-C Port - A2442 / A2779  / A2485 / A2780) | No repair_person assigned but parts cost £233 | Only 1 day(s) with customer before return | High value: sale price £1029
- **Pre-dispatch notes** (12):
  - [2026-01-06] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Pro (14-inch, 2023) 🔢 Serial: F49JVPQGKM ✅ iCloud: OFF  ⚠️ Could not identify device from SickW data
  - [2026-01-08] Adil Azad: pre repair testing -  @Mykhailo Kepeshchuk right side keyboard sticky, some keys need replacing please double check, i tried to unstick but no luck. o
  - [2026-01-09] Mykhailo Kepeshchuk (reply): Post repair: All good, screen LG replaced without soldering ICs and keyboard keys cleaned ( enter and right shift)
  - [2026-01-09] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Failure Big dusts on the middle ❗️
  - [2026-01-10] Ricky Panesar (reply): @Mykhailo Kepeshchuk Why do we need another screen for this MacBook. Is it not Dust under the screen?
  - [2026-01-10] Mykhailo Kepeshchuk (reply): because I found same fault like in Saf's mac that LCD flickering not much but I saw that 4 times and Roni as well  I guess it better replace but we ha

### 15. BM 1061 (RTN > REFUND) — MBA13

- **BM Order:** 73811004 | **Trade-in:** GB-25443-MWWIR | **Grade:** NONFUNC.USED → Fair | **Serial:** C02DT6UFQ6LC
- **Financials:** Buy £0 → Sell £380 | Parts £0 | Net £245
- **Repair chain:** Diag: Safan Patel (54m) → Repair: Safan Patel (21m) → Refurb: Mykhailo Kepeshchuk (0m)
- **Timeline:** Received ? → Repaired 2025-12-04 → Sold 2025-12-04 → Customer got 05/12/2025 → Returned 04/12/2025
- **Duration:** 1d with customer
- **Customer complaint:** Changed Mind > Ask For Return
- **Parts:** Other (See Notes)
- **Root cause:** buyers_remorse — Customer complaint matches buyer's remorse pattern
- **Prevention:** none — buyer's remorse is not preventable
- **Flags:** Screen mismatch: reported Excellent, actual Good | Only 1 day(s) with customer before return
- **Pre-dispatch notes** (6):
  - [2025-11-28] Andres Egas: Description: ammeter : 20 volts , 2amps All working device going into AZERTY keyboard layout automatically , the only option on setup in britishpc key
  - [2025-11-28] Andres Egas (reply): @Ricky Panesar According to saf even if you replace the keyboard azerty it's not going to change , he mention the only option it's doing it from setti
  - [2025-11-28] Ricky Panesar (reply): @Andres Egas I’ll speak about this in the meeting on Monday.
  - [2025-11-28] Ricky Panesar (reply): @Roni Mykhailiuk I’d like you to investigate this one please. We can speak about it
  - [2025-11-28] Michael Ferrari (reply): @Roni Mykhailiuk @Ricky Panesar might be worth flashing the SSD in DFU. mode to exclude it's a software-based issue. Might be firmware-related given t
  - [2025-12-03] Safan Patel (reply): @Michael Ferrari @Ricky Panesar   I restored macbook on DFU mode Even after that, the original keyboard showing AYQZ,i tried reinstalling our UK keybo
- **Post-return notes** (4):
  - [2025-12-05] Roni Mykhailiuk (reply): @Ricky Panesar @Michael Ferrari In my opinion, the issue could also be on the trackpad board, where the keyboard is connected. There might be an IC th
  - [2025-12-05] Michael Ferrari (reply): @Roni Mykhailiuk we've sold this BM, please prioritise QC
  - [2025-12-05] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Device cleaned Ammeter - passed (20v 2A) Battery - passed 100% Ports - passed Audio - passed Camera - passed True tone - passed Disp
  - [2025-12-05] Roni Mykhailiuk (reply): @Michael Ferrari After еrased it automatically selected AZERTY keyboard. But if you go through a few steps to the keyboard setup and delete the AZERTY

### 16. BM 1261 — MBP13

- **BM Order:** 74346282 | **Trade-in:** GB-26012-EISVR | **Grade:** NONFUNC.USED → Fair | **Serial:** FVFH209TQ05D
- **Financials:** Buy £91 → Sell £487 | Parts £9 | Net £206
- **Repair chain:** Diag: Safan Patel (33m) → Repair: Safan Patel (120m) → Refurb: Mykhailo Kepeshchuk (50m)
- **Timeline:** Received 2026-01-08 → Repaired 2026-02-02 → Sold 2026-02-10 → Customer got 11/02/2026 → Returned 10/02/2026
- **Duration:** 25d in repair | 1d with customer
- **Customer complaint:** Other > Accessories Other
- **Parts:** Keyboard - A2338, Other (See Notes), Unknown-9951310434
- **Root cause:** listing_error — Customer complaint matches listing discrepancy
- **Prevention:** listing_accuracy_check_before_dispatch
- **Flags:** Screen mismatch: reported Good, actual Damaged | Casing mismatch: reported Good, actual Fair | Only 1 day(s) with customer before return | Liquid damage noted at intake: 'Yes'
- **Pre-dispatch notes** (12):
  - [2026-01-08] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Pro (13-inch, M1, 2020) Silver 🔢 Serial: FVFH209TQ05D ✅ iCloud: OFF  ✅ Device: MacBook Pro 13 M1 A233
  - [2026-01-08] Adil Azad: @Safan Patel device was filthy and very difficult to clean. keyboard not working, bezel damaged, needs a polarizer. liquid damage signs on the inside
  - [2026-01-17] Safan Patel (reply): Repair notes;  we change new keyboard but keyboard back light not good  we waiting for keyboard back light
  - [2026-01-31] Safan Patel (reply): Post repair all good,we used pull track pad and keyboard back light and bezel
  - [2026-01-31] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 : Failure ❗️ Need replacement polariser ❗️ Keyboard and Touch bar was very dirty why not cleaned when replace Keyboard.@Safan Patel Adil wrote
  - [2026-01-31] Roni Mykhailiuk (reply): @Mykhailo Kepeshchuk can you please replacement polariser?

### 17. BM 1234 — MBA13

- **BM Order:** 75170314 | **Trade-in:** GB-25511-YQVPZ | **Grade:** NONFUNC.USED → Fair | **Serial:** C02F9017Q05G
- **Financials:** Buy £88 → Sell £465 | Parts £6 | Net £206
- **Repair chain:** Diag: Safan Patel (21m) → Repair: Safan Patel (141m) → Refurb: - (0m)
- **Timeline:** Received 2026-01-05 → Repaired 2026-01-08 → Sold 2026-01-09 → Customer got 12/01/2026 → Returned 09/01/2026
- **Duration:** 3d in repair | 3d with customer
- **Customer complaint:** Other > Other Issues
- **Parts:** MacBook Logic Board, USB-C Port - A1706 / A1708 / A1989 / A2159 / A2251 / A2289 / A2338 / A1707 / A1990 / A2141
- **Root cause:** unknown — Generic 'Other' complaint — no data to classify
- **Prevention:** investigation_needed
- **Flags:** Screen mismatch: reported Good, actual Fair | Casing mismatch: reported Good, actual Fair | Only 3 day(s) with customer before return | Liquid damage noted at intake: 'Yes' | Battery mismatch: reported Normal, actual Unable to Test
- **Pre-dispatch notes** (8):
  - [2026-01-05] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Pro (13-inch, M1, 2020) Silver 🔢 Serial: C02F9017Q05G ✅ iCloud: OFF  ⚠️ Device mismatch. Expecting: M
  - [2026-01-05] Adil Azad: @Safan Patel one port reading 5v one port reading very low amps. device is liquid damaged as you can see in the below photos. grading has been done by
  - [2026-01-06] Safan Patel (reply): Description:  * AMM;5.0v * .0230 Faults:  * Macbook not on and working * has been repair logic board * we found logic board has liquid damage * we fou
  - [2026-01-08] Safan Patel (reply): Post repair all good,we repair logic board and charging port
  - [2026-01-08] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Failure The left speaker plays quieter❗️❌️ Ammeter - passed (20v 2.5A) Battery - passed 86% Ports - passed Audio - ❌️ Left speaker C
  - [2026-01-08] Safan Patel (reply): Post repair , i change new speaker but look like same on my side also it's no to much low sound but minor low  i have before same issue macbook has an

### 18. BM 1099 — MacBook Pro 13" (Late 2020) - Apple M1 -

- **BM Order:** 73335677 | **Trade-in:** GB-25457-GTAUK | **Grade:** UNKNOWN → Excellent | **Serial:** C02G9487Q05N
- **Financials:** Buy £299 → Sell £620 | Parts £0 | Net £189
- **Repair chain:** Diag: - (6m) → Repair: - (0m) → Refurb: - (0m)
- **Timeline:** Received 2025-11-21 → Repaired ? → Sold 2025-11-28 → Customer got 01/12/2025 → Returned 28/11/2025
- **Duration:** 3d with customer
- **Customer complaint:** Technical > Camera Failures + Technical > Display Issues
- **Parts:** None
- **Root cause:** qc_failure — Technical complaint but no repair logged (0 min / no person)
- **Prevention:** functional_test_before_dispatch
- **Flags:** Only 3 day(s) with customer before return
- **Pre-dispatch notes** (3):
  - [2025-11-21] Adil Azad: @Michael Ferrari  IC check please 🙏
  - [2025-11-21] Michael Ferrari (reply): @Adil Azad IC off
  - [2025-11-21] Adil Azad: QC:  DEVICE ERASED  both ports checked in all orientations.  Device cleaned.  Ammeter - passed (20v 1.5+)  Audio - passed  Camera - passed  Display -
- **Post-return notes** (3):
  - [2025-12-01] Michael Ferrari: @Andres Egas you marked this one as Shipped 3 days ago but we've sold it now. Do we still have it?
  - [2025-12-01] Michael Ferrari (reply): @Andres Egas can you please check this when you get a sec
  - [2025-12-01] Andres Egas (reply): @Michael Ferrari  yes we do have it i think i missclik it by mistake apologies

### 19. BM 1076 — MBP13

- **BM Order:** 73129338 | **Trade-in:** GB-25457-PLPHV | **Grade:** NONFUNC.USED → Fair | **Serial:** C02DKH3WP3XY
- **Financials:** Buy £74 → Sell £380 | Parts £1 | Net £181
- **Repair chain:** Diag: - (36m) → Repair: Safan Patel (45m) → Refurb: - (0m)
- **Timeline:** Received 2025-11-13 → Repaired 2025-11-22 → Sold 2025-11-26 → Customer got 27/11/2025 → Returned 26/11/2025
- **Duration:** 9d in repair | 1d with customer
- **Customer complaint:** Technical > Accessories Not Working + Technical > Power On Boot Failure
- **Parts:** MacBook Logic Board, Other (See Notes)
- **Root cause:** repair_failure — Technical complaint, repair was done (by Safan Patel, 45 min)
- **Prevention:** retest_reported_fault_before_dispatch
- **Flags:** Only 1 day(s) with customer before return | Intel device — older architecture, higher failure risk | Battery mismatch: reported Service, actual Unable to Test
- **Pre-dispatch notes** (3):
  - [2025-11-13] Roni Mykhailiuk (reply): Display + I test at our tester Display brightness + Faults: Not turn on, charging 20v 0.5A. 𝗥𝗲𝗽𝗮𝗶𝗿𝘀 𝗻𝗲𝗲𝗱𝗲𝗱:Logic board, not turn on.
  - [2025-11-22] Safan Patel (reply): Post repair all good,we repair T2 restored and SSD one line
  - [2025-11-22] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : I am installing the update. Ammeter - passed (20v 2A) Battery - passed 83% Ports - passed Audio - passed Camera - passed True tone -

### 20. BM 1252 — MBP13

- **BM Order:** 73644484 | **Trade-in:** GB-26012-EVQDE | **Grade:** NONFUNC.CRACK → Good | **Serial:** C02ZF1QJLVDM
- **Financials:** Buy £71 → Sell £400 | Parts £2 | Net £178
- **Repair chain:** Diag: Safan Patel (55m) → Repair: - (102m) → Refurb: - (0m)
- **Timeline:** Received 2026-01-05 → Repaired 2026-01-08 → Sold 2026-01-12 → Customer got 14/01/2026 → Returned 12/01/2026
- **Duration:** 3d in repair | 2d with customer
- **Customer complaint:** Technical > Display Issues
- **Parts:** Battery Flex - A1989 / A2251, Other (See Notes), Unknown-18388343858
- **Root cause:** qc_failure — Technical complaint but no repair logged (0 min / no person)
- **Prevention:** charge_cycle_test_after_battery_swap
- **Flags:** No repair_person assigned but parts cost £2 | Casing mismatch: reported Good, actual Fair | Only 2 day(s) with customer before return | Intel device — older architecture, higher failure risk
- **Pre-dispatch notes** (6):
  - [2026-01-05] Adil Azad: Will do this as one of the last ones as the back has been replaced and there is no SN no.
  - [2026-01-07] Michael Ferrari (reply): @Adil Azad was this one completed? The deadline is over now
  - [2026-01-07] Adil Azad: @Safan Patel charging port intermittently not working, can you please diagnose/investigate before sending to refurb for a screen. battery is also 3rd
  - [2026-01-07] Adil Azad: pre repair testing -    Ammeter - passed (20v 1.5+)  Audio - passed  Camera - passed  Display - ❌  Display brightness - passed  Keyboard backlight - p
  - [2026-01-08] Safan Patel (reply): Post repair all good,we repair full screen B grad and change top case because has been pent and we change new battery
  - [2026-01-08] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Bezel silver Ammeter - passed (20v 2A) Battery - passed 100% Ports - passed Audio - passed Camera - passed True tone - passed Displa

### 21. BM 1098 — MBP13

- **BM Order:** 45815797 | **Trade-in:** GB-25445-PGBHL | **Grade:** NONFUNC.USED → Fair | **Serial:** FVFFX37ZQ05F
- **Financials:** Buy £69 → Sell £483 | Parts £48 | Net £176
- **Repair chain:** Diag: Andres Egas (26m) → Repair: - (0m) → Refurb: Mykhailo Kepeshchuk (206m)
- **Timeline:** Received 2025-11-21 → Repaired 2025-11-22 → Sold 2025-11-22 → Customer got 24/11/2025 → Returned 21/11/2025
- **Duration:** 1d in repair | 3d with customer
- **Customer complaint:** Technical > Power On Boot Failure
- **Parts:** MacBook Backlight, MacBook Pro A2159/A2289/A2338 Battery (A2171)
- **Root cause:** qc_failure — Technical complaint but no repair logged (0 min / no person)
- **Prevention:** charge_cycle_test_after_battery_swap
- **Flags:** 0 min repair time — no functional test after part swap (MacBook Backlight, MacBook Pro A2159/A2289/A2338 Battery (A2171)) | No repair_person assigned but parts cost £48 | Screen mismatch: reported Excellent, actual Damaged | Casing mismatch: reported Excellent, actual Fair | Only 3 day(s) with customer before return | Liquid damage noted at intake: 'Yes' | Battery mismatch: reported Normal, actual Service
- **Pre-dispatch notes** (6):
  - [2025-11-21] Adil Azad: @Michael Ferrari IC check please 🙏
  - [2025-11-21] Michael Ferrari (reply): @Adil Azad IC off
  - [2025-11-21] Adil Azad: Pre repair diagnostics -    @Andres Egas device has liquid damage on screen/backlight however there are no obvious signs of liquid damage to the board
  - [2025-11-21] Andres Egas (reply): this device needs to go through diagnostics
  - [2025-11-22] Mykhailo Kepeshchuk (reply): Post repair: All good, backlight and battery replaced
  - [2025-11-22] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Device cleaned. Ammeter - passed (20v 1.5A) Battery - passed 100% Ports - passed Audio - passed Camera - passed a bit blurred True t

### 22. BM 1216 — MBP13

- **BM Order:** 71606339 | **Trade-in:** GB-25484-KVVUY | **Grade:** FUNC.CRACK → Fair | **Serial:** C02CX374P3Y0
- **Financials:** Buy £107 → Sell £399 | Parts £0 | Net £150
- **Repair chain:** Diag: Andres Egas (76m) → Repair: - (0m) → Refurb: Andres Egas (80m)
- **Timeline:** Received 2025-12-22 → Repaired 2025-12-23 → Sold 2026-01-05 → Customer got 07/01/2026 → Returned 03/01/2026
- **Duration:** 1d in repair | 4d with customer
- **Customer complaint:** Other > Other Issues
- **Parts:** Unknown-10839537537, Unknown-18388343879
- **Root cause:** unknown — Generic 'Other' complaint — no data to classify
- **Prevention:** investigation_needed
- **Flags:** Function field: 'Functional?' — uncertain assessment | Screen mismatch: reported Damaged, actual Screen Grade? | Casing mismatch: reported Damaged, actual Casing Grade? | Liquid damage noted at intake: 'Liquid Damage?' | Intel device — older architecture, higher failure risk | Battery mismatch: reported Normal, actual Battery Health?
- **Pre-dispatch notes** (6):
  - [2025-12-22] Adil Azad: @Andres Egas Software testing as discussed in this mornings meeting
  - [2025-12-22] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Pro (13-inch, 2020, Two Thunderbolt 3 ports) Silver 🔢 Serial: C02CX374P3Y0 ✅ iCloud: OFF  ⚠️ Could no
  - [2025-12-23] Andres Egas (reply): Description: ammeter : 20 volts , 2amps Device bypassing , top case corners bend inwards , lcd damage , bezel damage rest working fine , lid corner ba
  - [2025-12-23] Andres Egas (reply): Top case reshape as much as i could , full screen replaced , battery replaced
  - [2025-12-24] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Ammeter - passed (20v 1.8A) Battery - passed 84% Ports - passed Audio - passed Camera - passed True tone - passed Display - passed D
  - [2025-12-24] Roni Mykhailiuk (reply): This corner looks bad, we send this MacBook with case

### 23. BM 1216 — MBP13

- **BM Order:** 75100215 | **Trade-in:** GB-25484-KVVUY | **Grade:** FUNC.CRACK → Fair | **Serial:** C02CX374P3Y0
- **Financials:** Buy £107 → Sell £399 | Parts £0 | Net £150
- **Repair chain:** Diag: Andres Egas (76m) → Repair: - (0m) → Refurb: Andres Egas (80m)
- **Timeline:** Received 2025-12-22 → Repaired 2025-12-23 → Sold 2026-01-05 → Customer got 05/01/2026 → Returned 02/01/2026
- **Duration:** 1d in repair | 3d with customer
- **Customer complaint:** Technical > Accessories Not Working
- **Parts:** Unknown-10839537537, Unknown-18388343879
- **Root cause:** qc_failure — Technical complaint but no repair logged (0 min / no person)
- **Prevention:** functional_test_before_dispatch
- **Flags:** Function field: 'Functional?' — uncertain assessment | Screen mismatch: reported Damaged, actual Screen Grade? | Casing mismatch: reported Damaged, actual Casing Grade? | Only 3 day(s) with customer before return | Liquid damage noted at intake: 'Liquid Damage?' | Intel device — older architecture, higher failure risk | Battery mismatch: reported Normal, actual Battery Health?
- **Pre-dispatch notes** (6):
  - [2025-12-22] Adil Azad: @Andres Egas Software testing as discussed in this mornings meeting
  - [2025-12-22] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Pro (13-inch, 2020, Two Thunderbolt 3 ports) Silver 🔢 Serial: C02CX374P3Y0 ✅ iCloud: OFF  ⚠️ Could no
  - [2025-12-23] Andres Egas (reply): Description: ammeter : 20 volts , 2amps Device bypassing , top case corners bend inwards , lcd damage , bezel damage rest working fine , lid corner ba
  - [2025-12-23] Andres Egas (reply): Top case reshape as much as i could , full screen replaced , battery replaced
  - [2025-12-24] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Ammeter - passed (20v 1.8A) Battery - passed 84% Ports - passed Audio - passed Camera - passed True tone - passed Display - passed D
  - [2025-12-24] Roni Mykhailiuk (reply): This corner looks bad, we send this MacBook with case

### 24. BM 992 — MBA13

- **BM Order:** 73332891 | **Trade-in:** GB-25402-CNALJ | **Grade:** NONFUNC.USED → Fair | **Serial:** FVFCL4WQMNHQ
- **Financials:** Buy £40 → Sell £330 | Parts £34 | Net £145
- **Repair chain:** Diag: - (14m) → Repair: Safan Patel (45m) → Refurb: - (0m)
- **Timeline:** Received 2025-10-10 → Repaired 2025-12-02 → Sold 2025-12-03 → Customer got 03/12/2025 → Returned 01/12/2025
- **Duration:** 53d in repair | 2d with customer
- **Customer complaint:** Esthetical > Item Damaged Before Delivery
- **Parts:** MacBook Logic Board, MacBook Air A1932/A2179 Battery (A1965), Other (See Notes), Audio Board / Audio Flex - A2179
- **Root cause:** cosmetic_mismatch — Customer complaint about cosmetic condition
- **Prevention:** stricter_cosmetic_grading_at_refurb
- **Flags:** Screen mismatch: reported Good, actual Damaged | Casing mismatch: reported Good, actual Fair | Only 2 day(s) with customer before return | Liquid damage noted at intake: 'Yes' | Intel device — older architecture, higher failure risk | Battery mismatch: reported Normal, actual Battery Health?
- **Pre-dispatch notes** (10):
  - [2025-10-10] Andres Egas (reply): Description: 5 volts  Device liquid damage , not turning on , lcd working (tested with external screen) , backlight liquid damage  Faults: Badly liqui
  - [2025-10-11] Safan Patel (reply): Repair note  To much liquid damage on logic board
  - [2025-10-22] Safan Patel (reply): repair notes;  logic board has lot's off liquid damage  need T2 swap  screen back light  track pad  maybe keyboard as well  headphone jack @Ricky Pane
  - [2025-10-22] Ricky Panesar (reply): @Safan Patel Agreed.  @Michael Ferrari we should be counter offering super low on these destroyed ones
  - [2025-10-22] Ricky Panesar (reply): @Michael Ferrari ignore, we only paid £30
  - [2025-10-22] Ricky Panesar (reply): @Safan Patel we can take the LCD from this

### 25. BM 1020 — MBA13

- **BM Order:** 72081868 | **Trade-in:** GB-25393-MPIHQ | **Grade:** NONFUNC.CRACK → Fair | **Serial:** FVFCM402MNHP
- **Financials:** Buy £56 → Sell £289 | Parts £1 | Net £142
- **Repair chain:** Diag: Client Services (0m) → Repair: Safan Patel (28m) → Refurb: - (0m)
- **Timeline:** Received 2025-10-20 → Repaired 2025-10-22 → Sold 2025-11-05 → Customer got 06/11/2025 → Returned 04/11/2025
- **Duration:** 2d in repair | 2d with customer
- **Customer complaint:** Changed Mind > Ask For Return
- **Parts:** MacBook Logic Board
- **Root cause:** buyers_remorse — Customer complaint matches buyer's remorse pattern
- **Prevention:** none — buyer's remorse is not preventable
- **Flags:** Screen mismatch: reported Fair, actual Good | Only 2 day(s) with customer before return
- **Pre-dispatch notes** (4):
  - [2025-10-21] Client Services (reply): @Michael Ferrari Hi Ferrari, Jolene Fendler's mac was reported as a 2337 however it is a 2179. iv corrected it on monday 👍
  - [2025-10-21] Michael Ferrari (reply): @Client Services great stuff, thank you! What's the issue with Touch ID? If it's faulty we cannot replace it so the value of the device would drop. Yo
  - [2025-10-21] Michael Ferrari (reply): @Safan Patel please let me know about the Touch ID issue
  - [2025-10-22] Safan Patel (reply): Post repair all good, we repair clan logic board and touch id other parts working fine

### 26. BM 1071 — MBA13

- **BM Order:** 70301212 | **Trade-in:** GB-25455-UOSXI | **Grade:** FUNC.CRACK → Fair | **Serial:** G3GCWYYX26
- **Financials:** Buy £184 → Sell £581 | Parts £95 | Net £133
- **Repair chain:** Diag: - (24m) → Repair: - (0m) → Refurb: Mykhailo Kepeshchuk (95m)
- **Timeline:** Received 2025-11-10 → Repaired 2025-11-11 → Sold 2025-11-14 → Customer got 17/11/2025 → Returned 14/11/2025
- **Duration:** 1d in repair | 3d with customer
- **Customer complaint:** Technical > Power On Boot Failure + Technical > Random Shutdown
- **Parts:** LCD - A2681 | A3113 | A3240
- **Root cause:** qc_failure — Technical complaint but no repair logged (0 min / no person)
- **Prevention:** boot_test_after_screen_swap
- **Flags:** 0 min repair time — no functional test after part swap (LCD - A2681 | A3113 | A3240) | No repair_person assigned but parts cost £95 | Only 3 day(s) with customer before return
- **Pre-dispatch notes** (3):
  - [2025-11-11] Adil Azad: @Mykhailo Kepeshchuk after screen repair can you re-test the camera please thank you
  - [2025-11-12] Mykhailo Kepeshchuk (reply): Post repair: All good, new LCD replaced
  - [2025-11-12] Roni Mykhailiuk (reply): Post QC Control : Device cleaned. Ammeter - passed (20v 2.2+) Battery - passed 88% Ports - passed Audio - passed Camera - passed True tone - passed Di

### 27. BM 1091 — MBA13

- **BM Order:** 72692403 | **Trade-in:** GB-25462-XKXXE | **Grade:** FUNC.CRACK → Good | **Serial:** FVFCD0AQMNHP
- **Financials:** Buy £85 → Sell £343 | Parts £33 | Net £115
- **Repair chain:** Diag: Andres Egas (38m) → Repair: - (0m) → Refurb: Andres Egas (33m)
- **Timeline:** Received 2025-11-20 → Repaired 2025-11-21 → Sold 2025-11-21 → Customer got 24/11/2025 → Returned 21/11/2025
- **Duration:** 1d in repair | 3d with customer
- **Customer complaint:** Changed Mind > Bought Item By Mistake
- **Parts:** MacBook Air A1932/A2179 Battery (A1965), Unknown-9951309601
- **Root cause:** buyers_remorse — Customer complaint matches buyer's remorse pattern
- **Prevention:** none — buyer's remorse is not preventable
- **Flags:** 0 min repair time — no functional test after part swap (MacBook Air A1932/A2179 Battery (A1965), Unknown-9951309601) | No repair_person assigned but parts cost £33 | Screen mismatch: reported Damaged, actual Excellent | Only 3 day(s) with customer before return | Intel device — older architecture, higher failure risk | Battery mismatch: reported Normal, actual Service
- **Pre-dispatch notes** (9):
  - [2025-11-20] Adil Azad: @Michael Ferrari Last one for today please bro
  - [2025-11-20] Michael Ferrari (reply): @Adil Azad IC off on this one too
  - [2025-11-20] Adil Azad (reply): @Michael Ferrari thank you!
  - [2025-11-21] Andres Egas (reply): battery and bezel replaced
  - [2025-11-21] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Ammeter - passed (20v 1.8A) Battery - passed 100% Ports - passed Audio - passed Camera - passed True tone - passed Display - passed
  - [2025-11-21] Roni Mykhailiuk (reply): @Ricky Panesar final grade good because the polarizer has scratches and this is A2179 so I don't think there's any sense in replacing the polarizer an

### 28. BM 963 — MBP14

- **BM Order:** 70768864 | **Trade-in:** GB-25386-YFJKL | **Grade:** FUNC.CRACK → Good | **Serial:** TJ97W7V4C7
- **Financials:** Buy £193 → Sell £838 | Parts £278 | Net £113
- **Repair chain:** Diag: Andres Egas (16m) → Repair: - (0m) → Refurb: Roni Mykhailiuk (175m)
- **Timeline:** Received 2025-09-25 → Repaired 2025-09-30 → Sold 2025-10-04 → Customer got 06/10/2025 → Returned 03/10/2025
- **Duration:** 5d in repair | 3d with customer
- **Customer complaint:** Late Delivery > Late Shipping + Technical > Power On Boot Failure
- **Parts:** MacBook Pro A2442 Battery (A2519), LCD (LG) - A2442 | A2779 | A2992 | A2918 | A3112 | A3185 | A3401
- **Root cause:** transit_damage — Customer complaint matches transit/delivery issue
- **Prevention:** better_packaging_or_courier
- **Flags:** 0 min repair time — no functional test after part swap (MacBook Pro A2442 Battery (A2519), LCD (LG) - A2442 | A2779 | A2992 | A2918 | A3112 | A3185 | A3401) | No repair_person assigned but parts cost £278 | Only 3 day(s) with customer before return | Liquid damage noted at intake: 'Liquid Damage?' | High value: sale price £838 | Battery mismatch: reported Normal, actual Battery Health?
- **Pre-dispatch notes** (2):
  - [2025-09-25] Andres Egas (reply): Description: ammeter : 20 volts , 2amps Battery puncture with big dust particle , battery health 84% , lcd damage , no liquid detected inside , Faults
  - [2025-09-30] Roni Mykhailiuk (reply): Post repair:all good I replaced lcd and battery. @Ricky Panesar The repair was longer.We have a few screens 2442 there write is no image and need to t

### 29. BM 1130 — MBA13

- **BM Order:** 54139159 | **Trade-in:** GB-25472-TSWOO | **Grade:** FUNC.CRACK → Good | **Serial:** FVFJP32U1WFV
- **Financials:** Buy £91 → Sell £408 | Parts £99 | Net £86
- **Repair chain:** Diag: - (27m) → Repair: - (0m) → Refurb: Andres Egas (65m)
- **Timeline:** Received 2025-12-02 → Repaired 2025-12-02 → Sold 2025-12-05 → Customer got 08/12/2025 → Returned 05/12/2025
- **Duration:** 0d in repair | 3d with customer
- **Customer complaint:** Other > Other Issues
- **Parts:** LCD - A2337
- **Root cause:** unknown — Generic 'Other' complaint — no data to classify
- **Prevention:** investigation_needed
- **Flags:** 0 min repair time — no functional test after part swap (LCD - A2337) | No repair_person assigned but parts cost £99 | Only 3 day(s) with customer before return
- **Pre-dispatch notes** (4):
  - [2025-12-02] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Air (M1, 2020) Space Gray 🔢 Serial: FVFJP32U1WFV ✅ iCloud: OFF  📊 Spec Check: RAM: 8GB ✅ Storage: 256
  - [2025-12-02] Adil Azad: Pre repair diagnostics -    both ports checked in all orientations.  Ammeter - passed (20v 1.5+)  Audio - passed  Camera - passed  Display - ❌  Displa
  - [2025-12-02] Andres Egas (reply): a2337 lcd replaced , small dust particle at the middle all good
  - [2025-12-03] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Device cleaned Ammeter - passed (20v 1.8A) Battery - passed 86% Ports - passed Audio - passed Camera - passed True tone - passed Dis

### 30. BM 1130 — MBA13

- **BM Order:** 74115275 | **Trade-in:** GB-25472-TSWOO | **Grade:** FUNC.CRACK → Good | **Serial:** FVFJP32U1WFV
- **Financials:** Buy £91 → Sell £408 | Parts £99 | Net £86
- **Repair chain:** Diag: - (27m) → Repair: - (0m) → Refurb: Andres Egas (65m)
- **Timeline:** Received 2025-12-02 → Repaired 2025-12-02 → Sold 2025-12-05 → Customer got 10/12/2025 → Returned 06/12/2025
- **Duration:** 0d in repair | 4d with customer
- **Customer complaint:** Bad Product > Wrong Color
- **Parts:** LCD - A2337
- **Root cause:** listing_error — Customer complaint matches listing discrepancy
- **Prevention:** listing_accuracy_check_before_dispatch
- **Flags:** 0 min repair time — no functional test after part swap (LCD - A2337) | No repair_person assigned but parts cost £99
- **Pre-dispatch notes** (4):
  - [2025-12-02] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Air (M1, 2020) Space Gray 🔢 Serial: FVFJP32U1WFV ✅ iCloud: OFF  📊 Spec Check: RAM: 8GB ✅ Storage: 256
  - [2025-12-02] Adil Azad: Pre repair diagnostics -    both ports checked in all orientations.  Ammeter - passed (20v 1.5+)  Audio - passed  Camera - passed  Display - ❌  Displa
  - [2025-12-02] Andres Egas (reply): a2337 lcd replaced , small dust particle at the middle all good
  - [2025-12-03] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Device cleaned Ammeter - passed (20v 1.8A) Battery - passed 86% Ports - passed Audio - passed Camera - passed True tone - passed Dis

### 31. BM 1103 — MBA13

- **BM Order:** 73007256 | **Trade-in:** GB-25452-HCRBR | **Grade:** NONFUNC.USED → Fair | **Serial:** C02F10D5Q6L7
- **Financials:** Buy £41 → Sell £372 | Parts £100 | Net £86
- **Repair chain:** Diag: - (32m) → Repair: - (0m) → Refurb: Mykhailo Kepeshchuk (120m)
- **Timeline:** Received 2025-11-24 → Repaired 2025-11-26 → Sold 2025-11-26 → Customer got 27/11/2025 → Returned 25/11/2025
- **Duration:** 2d in repair | 2d with customer
- **Customer complaint:** Late Delivery > Tracking Issue + Technical > Keyboard Mapping Issues
- **Parts:** LCD - A2337, MacBook Backlight
- **Root cause:** transit_damage — Customer complaint matches transit/delivery issue
- **Prevention:** better_packaging_or_courier
- **Flags:** 0 min repair time — no functional test after part swap (LCD - A2337, MacBook Backlight) | No repair_person assigned but parts cost £100 | Screen mismatch: reported Good, actual Fair | Only 2 day(s) with customer before return | Intel device — older architecture, higher failure risk
- **Pre-dispatch notes** (6):
  - [2025-11-24] Adil Azad: @Michael Ferrari device is 2337 not 2179
  - [2025-11-25] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Air (M1,2020) Silver 🔢 Serial: C02F10D5Q6L7 🔒 iCloud: ON  📊 Spec Check: RAM: Actual 8GB ✅ Storage: Ac
  - [2025-11-25] Ricky Panesar: ✅ iCloud Recheck Complete ───────────────── iCloud Status: OFF ✅ Serial: C02F10D5Q6L7  Device moved to Today's Repairs. Proceeding with trade-in.
  - [2025-11-26] Roni Mykhailiuk: Ammeter - passed (20v 1A) Battery - passed 85% Ports - passed Audio - passed Camera ❌️ True tone - passed Display brightness ❌️ Proximity sensor - pas
  - [2025-11-26] Mykhailo Kepeshchuk (reply): Post repair: All good, screen, backlight, camera flex and backlight flex replaced  orig LCD had a lot of liquid damage it why I replaced
  - [2025-11-26] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Device cleaned Ammeter - passed (20v 0.7A) Battery - passed 85% Ports - passed Audio - passed Camera - passed True tone - passed Dis

### 32. BM 1103 — MBA13

- **BM Order:** 73250366 | **Trade-in:** GB-25452-HCRBR | **Grade:** NONFUNC.USED → Fair | **Serial:** C02F10D5Q6L7
- **Financials:** Buy £41 → Sell £372 | Parts £100 | Net £86
- **Repair chain:** Diag: - (32m) → Repair: - (0m) → Refurb: Mykhailo Kepeshchuk (120m)
- **Timeline:** Received 2025-11-24 → Repaired 2025-11-26 → Sold 2025-11-26 → Customer got 26/11/2025 → Returned 25/11/2025
- **Duration:** 2d in repair | 1d with customer
- **Customer complaint:** Other > Other Issues
- **Parts:** LCD - A2337, MacBook Backlight
- **Root cause:** unknown — Generic 'Other' complaint — no data to classify
- **Prevention:** investigation_needed
- **Flags:** 0 min repair time — no functional test after part swap (LCD - A2337, MacBook Backlight) | No repair_person assigned but parts cost £100 | Screen mismatch: reported Good, actual Fair | Only 1 day(s) with customer before return | Intel device — older architecture, higher failure risk
- **Pre-dispatch notes** (6):
  - [2025-11-24] Adil Azad: @Michael Ferrari device is 2337 not 2179
  - [2025-11-25] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Air (M1,2020) Silver 🔢 Serial: C02F10D5Q6L7 🔒 iCloud: ON  📊 Spec Check: RAM: Actual 8GB ✅ Storage: Ac
  - [2025-11-25] Ricky Panesar: ✅ iCloud Recheck Complete ───────────────── iCloud Status: OFF ✅ Serial: C02F10D5Q6L7  Device moved to Today's Repairs. Proceeding with trade-in.
  - [2025-11-26] Roni Mykhailiuk: Ammeter - passed (20v 1A) Battery - passed 85% Ports - passed Audio - passed Camera ❌️ True tone - passed Display brightness ❌️ Proximity sensor - pas
  - [2025-11-26] Mykhailo Kepeshchuk (reply): Post repair: All good, screen, backlight, camera flex and backlight flex replaced  orig LCD had a lot of liquid damage it why I replaced
  - [2025-11-26] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Device cleaned Ammeter - passed (20v 0.7A) Battery - passed 85% Ports - passed Audio - passed Camera - passed True tone - passed Dis

### 33. BM 1019 — MBP13

- **BM Order:** 45116315 | **Trade-in:** GB-25401-ZYQHA | **Grade:** FUNC.CRACK → Fair | **Serial:** C02DQ7HGP3Y0
- **Financials:** Buy £98 → Sell £399 | Parts £92 | Net £72
- **Repair chain:** Diag: Client Services (0m) → Repair: - (0m) → Refurb: Roni Mykhailiuk (128m)
- **Timeline:** Received 2025-10-20 → Repaired 2025-10-23 → Sold 2025-10-25 → Customer got 27/10/2025 → Returned 24/10/2025
- **Duration:** 3d in repair | 3d with customer
- **Customer complaint:** Esthetical > Screen Apparence Not As Expected + Technical > Camera Failures
- **Parts:** MacBook Pro A2159/A2289/A2338 Battery (A2171), LCD - A1706 | A1708, Unknown-9951310434
- **Root cause:** qc_failure — Technical complaint but no repair logged (0 min / no person)
- **Prevention:** boot_test_after_screen_swap
- **Flags:** 0 min repair time — no functional test after part swap (MacBook Pro A2159/A2289/A2338 Battery (A2171), LCD - A1706 | A1708, Unknown-9951310434) | No repair_person assigned but parts cost £92 | Casing mismatch: reported Good, actual Fair | Only 3 day(s) with customer before return | Intel device — older architecture, higher failure risk | Battery mismatch: reported Normal, actual Service
- **Pre-dispatch notes** (2):
  - [2025-10-23] Roni Mykhailiuk (reply): Also need replacement bezel
  - [2025-10-23] Roni Mykhailiuk (reply): Post repair: all good I replaced lcd put a1706 ,bezel and battery .

### 34. BM 1287 — MacBook Air 13" (Late 2020) - Apple M1 -

- **BM Order:** 75037091 | **Trade-in:** GB-26012-THLTZ | **Grade:** UNKNOWN → Good | **Serial:** C17GCHHTQ6L4
- **Financials:** Buy £193 → Sell £407 | Parts £1 | Net £69
- **Repair chain:** Diag: Mykhailo Kepeshchuk (30m) → Repair: - (22m) → Refurb: Mykhailo Kepeshchuk (158m)
- **Timeline:** Received 2026-01-12 → Repaired 2026-01-19 → Sold 2026-01-20 → Customer got 22/01/2026 → Returned 20/01/2026
- **Duration:** 7d in repair | 2d with customer
- **Customer complaint:** Technical > Battery Drain Or Health Problem + Technical > Too Hot Or Noisy
- **Parts:** MacBook Software Restore, Other (See Notes)
- **Root cause:** qc_failure — Technical complaint but no repair logged (0 min / no person)
- **Prevention:** functional_test_before_dispatch
- **Flags:** No repair_person assigned but parts cost £1 | Casing mismatch: reported Fair, actual Good | Only 2 day(s) with customer before return | Battery mismatch: reported Normal, actual Unable to Test
- **Pre-dispatch notes** (9):
  - [2026-01-12] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Air (M1,2020) Space Gray 🔢 Serial: C17GCHHTQ6L4 🔒 iCloud: ON  ✅ Device: MacBook Air 13 M1 A2337  📊 Sp
  - [2026-01-16] Ricky Panesar: ✅ iCloud Recheck Complete ───────────────── iCloud Status: OFF ✅ Serial: C17GCHHTQ6L4  Device moved to Today's Repairs. Proceeding with trade-in.
  - [2026-01-16] Adil Azad (reply): @Safan Patel no signs of liquid damage. unable to update mac due to disk issue, current disk full, when attempting to erase we receive an error (see p
  - [2026-01-17] Safan Patel (reply): Repair notes;  we check no liquid damage,we restored and found error 6 after i disconnect screen then software installing fine but need screen lid  @M
  - [2026-01-19] Mykhailo Kepeshchuk (reply): Pst repair: All good, Pol and copy lid B grade with orig backlight replaced  now this macbook we can sell like good condition
  - [2026-01-19] Mykhailo Kepeshchuk (reply): and right speaker was quiet but I just cleaned and now all good

### 35. BM 1223 — MBA13

- **BM Order:** 75022292 | **Trade-in:** GB-25516-VPSBG | **Grade:** NONFUNC.USED → Fair | **Serial:** C02GN5MFQ6L4
- **Financials:** Buy £77 → Sell £444 | Parts £116 | Net £58
- **Repair chain:** Diag: Safan Patel (40m) → Repair: Safan Patel (130m) → Refurb: Andres Egas (122m)
- **Timeline:** Received 2025-12-22 → Repaired 2026-01-17 → Sold 2026-02-07 → Customer got 09/02/2026 → Returned 07/02/2026
- **Duration:** 26d in repair | 2d with customer
- **Customer complaint:** Late Delivery > Item Damaged During Delivery + Late Delivery > Late Delivery
- **Parts:** Keyboard - A2337, Keyboard Backlight - A2179 / A2337, Unknown-9934302590, LCD - A2337, Unknown-10839429574
- **Root cause:** transit_damage — Customer complaint matches transit/delivery issue
- **Prevention:** better_packaging_or_courier
- **Flags:** Screen mismatch: reported Excellent, actual Damaged | Casing mismatch: reported Excellent, actual Good | Only 2 day(s) with customer before return | Liquid damage noted at intake: 'Yes' | Battery mismatch: reported Normal, actual Unable to Test
- **Pre-dispatch notes** (9):
  - [2025-12-22] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Air (M1,2020) Space Gray 🔢 Serial: C02GN5MFQ6L4 ✅ iCloud: OFF  ✅ Device: MacBook Air 13 M1 A2337  📊 S
  - [2025-12-22] Adil Azad: @Safan Patel 5V. display tested and working however it has been put as damaged due to dead lid from sticker marks, Bezel is cracked. Camera tested and
  - [2025-12-23] Safan Patel (reply): Repair note  we repair new keyboard and keyboard back light also we repair audio logic board  @Andres Egas please can you chnage screen lid
  - [2025-12-23] Andres Egas (reply): `Lcd replaced , original lcd has damage under the broken bezel unable to use lcd for customer , lid replaced . Audio not working
  - [2026-01-06] Safan Patel (reply): Repair note  need oder audio logic board
  - [2026-01-17] Safan Patel (reply): Post repair all good,we repair logic board sound ic and pull battery

### 36. BM 1367 — MBA13

- **BM Order:** 76375906 | **Trade-in:** GB-26054-ZIZZP | **Grade:** FUNC.CRACK → Fair | **Serial:** C02FV33KQ6LC
- **Financials:** Buy £117 → Sell £401 | Parts £99 | Net £43
- **Repair chain:** Diag: Andres Egas (64m) → Repair: - (0m) → Refurb: Andres Egas (96m)
- **Timeline:** Received 2026-02-02 → Repaired 2026-02-03 → Sold 2026-02-05 → Customer got 06/02/2026 → Returned 05/02/2026
- **Duration:** 1d in repair | 1d with customer
- **Customer complaint:** Other > Other Issues
- **Parts:** LCD - A2337
- **Root cause:** unknown — Generic 'Other' complaint — no data to classify
- **Prevention:** investigation_needed
- **Flags:** 0 min repair time — no functional test after part swap (LCD - A2337) | No repair_person assigned but parts cost £99 | Only 1 day(s) with customer before return
- **Pre-dispatch notes** (8):
  - [2026-02-02] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Air (M1,2020) Gold 🔢 Serial: C02FV33KQ6LC ✅ iCloud: OFF  ✅ Device: MacBook Air 13 M1 A2337  📊 Spec Ch
  - [2026-02-02] Ricky Panesar: Stock Check Complete  Status: Out of Stock  Parts Checked: - Full Screen - A2337 - Grade Poor - Rose Gold: 0 in stock  Out of stock: Full Screen - A23
  - [2026-02-02] Adil Azad (reply): pre repair testing -    Ammeter - ❓  Audio - passed  Camera - passed  Display - ❌  Display brightness - passed  Keyboard backlight - passed  Touch ID
  - [2026-02-02] Adil Azad (reply): @Andres Egas   no imagine, screen replacement  bezel cracked  top case needs reshaping  bottom plate badly scratched  please tag saf when you're done
  - [2026-02-03] Andres Egas (reply): Lcd replaced top case reshaped , bottom plate left as its fair
  - [2026-02-04] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖: Keyboard was dirty I cleaned arrows, shift, caps lock Was message I configure Trackpad left corner small crack Keyboard BL bottom more bright

### 37. BM 1449 — MBA13

- **BM Order:** 77407906 | **Trade-in:** GB-26081-WJLEO | **Grade:** FUNC.CRACK → Good | **Serial:** FVFJQDGV1WFV
- **Financials:** Buy £129 → Sell £412 | Parts £114 | Net £35
- **Repair chain:** Diag: Andres Egas (64m) → Repair: - (0m) → Refurb: Andres Egas (60m)
- **Timeline:** Received 2026-02-19 → Repaired 2026-02-26 → Sold 2026-03-01 → Customer got ? → Returned 02/03/2026
- **Duration:** 7d in repair
- **Customer complaint:** Bad Product > Wrong Color
- **Parts:** LCD - A2337, Charger MacBook Air  13-inch, (2018 or later) 30W, Unknown-11069588689, Unknown-11069617210
- **Root cause:** listing_error — Customer complaint matches listing discrepancy
- **Prevention:** listing_accuracy_check_before_dispatch
- **Flags:** 0 min repair time — no functional test after part swap (LCD - A2337, Charger MacBook Air  13-inch, (2018 or later) 30W, Unknown-11069588689, Unknown-11069617210) | No repair_person assigned but parts cost £114 | Liquid damage noted at intake: 'Minor'
- **Pre-dispatch notes** (14):
  - [2026-02-19] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Air (M1, 2020) Space Gray 🔢 Serial: FVFJQDGV1WFV 🔒 iCloud: ON  ⚠️ Device mismatch. Expecting: MacBook
  - [2026-02-19] Roni Mykhailiuk (reply): @Michael Ferrari  we received A2337 , maybe need to do counteroffer LCD Damage MacBook turn on
  - [2026-02-23] Ricky Panesar: ✅ iCloud Recheck Complete ───────────────── iCloud Status: OFF ✅ Serial: FVFJQDGV1WFV  Device moved to Today's Repairs. Proceeding with trade-in.
  - [2026-02-23] Michael Ferrari (reply): @Roni Mykhailiuk please proceed with intake and tag me once you're finished. I need to counteroffer but need images and all the issues listed
  - [2026-02-24] Roni Mykhailiuk (reply): Pre-diagnostics  𝗙𝗮𝘂𝗹𝘁𝘀: LCD damage, bezel crack ,Touch ID crookedly installed, liquid damage minor on audio board  𝗡𝗲𝗲𝗱 Repair: LCD , Bezel , Touch I
  - [2026-02-24] Roni Mykhailiuk (reply): @Michael Ferrari ^ Do you need photo full MacBook?

### 38. BM 989 — MBP13

- **BM Order:** 72206975 | **Trade-in:** GB-25405-IVANG | **Grade:** FUNC.CRACK → Excellent | **Serial:** FVHFW5P3Q05D
- **Financials:** Buy £133 → Sell £563 | Parts £100 | Net £30
- **Repair chain:** Diag: - (350m) → Repair: - (0m) → Refurb: Mykhailo Kepeshchuk (277m)
- **Timeline:** Received 2025-10-09 → Repaired 2025-10-30 → Sold 2025-11-03 → Customer got 05/11/2025 → Returned 03/11/2025
- **Duration:** 21d in repair | 2d with customer
- **Customer complaint:** Technical > Accessories Not Working
- **Parts:** LCD - A2338 (Sharp)
- **Root cause:** qc_failure — Technical complaint but no repair logged (0 min / no person)
- **Prevention:** boot_test_after_screen_swap
- **Flags:** 0 min repair time — no functional test after part swap (LCD - A2338 (Sharp)) | No repair_person assigned but parts cost £100 | Casing mismatch: reported Good, actual Fair | Only 2 day(s) with customer before return | Liquid damage noted at intake: 'Liquid Damage?'
- **Pre-dispatch notes** (13):
  - [2025-10-10] Michael Ferrari (reply): @Andres Egas iCloud off, please complete assessment
  - [2025-10-13] Michael Ferrari (reply): @Andres Egas please assess this one as well, we are late
  - [2025-10-13] Andres Egas (reply): Description: ammeter : 20 volts , 2amps Lcd damage ,lid sticker mark , bezel damage , battery health 88% , trackpad flex with dust punctures but track
  - [2025-10-17] Ricky Panesar (reply): @Mykhailo Kepeshchuk I’ve tagged this one to you to finish. It was one which Roni was stuck on yesterday.
  - [2025-10-17] Mykhailo Kepeshchuk (reply): @Ricky Panesar we don’t have any lcd
  - [2025-10-17] Ricky Panesar (reply): @Mykhailo Kepeshchuk I know. But they’re tagged to you.

### 39. BM 1010 — MBA13

- **BM Order:** 55187448 | **Trade-in:** GB-25395-QKYFL | **Grade:** FUNC.CRACK → Fair | **Serial:** C02GP4RCQ6L8
- **Financials:** Buy £144 → Sell £390 | Parts £99 | Net £24
- **Repair chain:** Diag: Andres Egas (20m) → Repair: - (0m) → Refurb: Roni Mykhailiuk (91m)
- **Timeline:** Received ? → Repaired 2025-10-18 → Sold 2025-10-27 → Customer got 29/10/2025 → Returned 27/10/2025
- **Duration:** 2d with customer
- **Customer complaint:** Technical > Power On Boot Failure
- **Parts:** LCD - A2337, Unknown-10050030304
- **Root cause:** qc_failure — Technical complaint but no repair logged (0 min / no person)
- **Prevention:** boot_test_after_screen_swap
- **Flags:** 0 min repair time — no functional test after part swap (LCD - A2337, Unknown-10050030304) | No repair_person assigned but parts cost £99 | Only 2 day(s) with customer before return | Liquid damage noted at intake: 'Liquid Damage?'
- **Pre-dispatch notes** (2):
  - [2025-10-14] Andres Egas (reply): Description: ammeter : 20 volts , 2amps Battery service 84% , lcd damage ,bezel damage , no liquid detected inside , rest working fine Faults: Lcd dam
  - [2025-10-18] Roni Mykhailiuk (reply): Post repair: all good I replaced lcd and bezel
- **Post-return notes** (1):
  - [2025-10-28] Client Services: @Michael Ferrari hey, can we get a label for this one if possible. thank you

### 40. BM 1244 — MBA13

- **BM Order:** 73769725 | **Trade-in:** GB-25521-QLCVD | **Grade:** FUNC.CRACK → Fair | **Serial:** C02FG3TTQ6LR
- **Financials:** Buy £138 → Sell £420 | Parts £119 | Net £12
- **Repair chain:** Diag: Andres Egas (42m) → Repair: Andres Egas (18m) → Refurb: Andres Egas (128m)
- **Timeline:** Received 2026-01-05 → Repaired 2026-01-07 → Sold 2026-01-08 → Customer got 12/01/2026 → Returned 08/01/2026
- **Duration:** 2d in repair | 4d with customer
- **Customer complaint:** Technical > Software
- **Parts:** LCD - A2337, MacBook Air A2337 Battery (A2389)
- **Root cause:** repair_failure — Technical complaint, repair was done (by Andres Egas, 18 min)
- **Prevention:** extended_burn_in_test_after_screen_repair
- **Flags:** Battery mismatch: reported Normal, actual Service
- **Pre-dispatch notes** (8):
  - [2026-01-05] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Air (M1,2020) Space Gray 🔢 Serial: C02FG3TTQ6LR ✅ iCloud: OFF  ✅ Device: MacBook Air 13 M1 A2337  📊 S
  - [2026-01-06] Andres Egas (reply): Description: ammeter : 20 volts , 2amps `Lcd damage , lid badly bend , battery health 80% rest working fine Faults: Battery 80% , lcd damage , lid ben
  - [2026-01-07] Andres Egas (reply): Lid reshaped , battery replaced , lcd replaced , all good
  - [2026-01-07] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Failure ❗️ Key 'option' hard to press ❗️
  - [2026-01-07] Andres Egas (reply): no issues detected
  - [2026-01-08] Roni Mykhailiuk (reply): Was problem with left option

### 41. BM 1318 — MBA13

- **BM Order:** 76545691 | **Trade-in:** GB-26021-WREFL | **Grade:** FUNC.CRACK → Fair | **Serial:** C02FT4U4Q6L4
- **Financials:** Buy £137 → Sell £383 | Parts £134 | Net £-12
- **Repair chain:** Diag: Andres Egas (35m) → Repair: - (6m) → Refurb: Andres Egas (78m)
- **Timeline:** Received 2026-01-22 → Repaired 2026-01-29 → Sold 2026-01-30 → Customer got 05/02/2026 → Returned 30/01/2026
- **Duration:** 7d in repair | 6d with customer
- **Customer complaint:** Esthetical > Body Appeareance Is Not As Expected + Other > Accessories Other
- **Parts:** Unknown-9934322876, LCD - A2337, MacBook Air A2337 Battery (A2389), Unknown-10049471931, Charger MacBook Air  13-inch, (2018 or later) 30W, Unknown-11069617210, Unknown-11069588689
- **Root cause:** listing_error — Customer complaint matches listing discrepancy
- **Prevention:** listing_accuracy_check_before_dispatch
- **Flags:** No repair_person assigned but parts cost £134 | Casing mismatch: reported Damaged, actual Fair | Battery mismatch: reported Normal, actual Unable to Test
- **Pre-dispatch notes** (8):
  - [2026-01-22] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Air (M1,2020) Space Gray 🔢 Serial: C02FT4U4Q6L4 🔒 iCloud: ON  ✅ Device: MacBook Air 13 M1 A2337  📊 Sp
  - [2026-01-26] Ricky Panesar: ✅ iCloud Recheck Complete ───────────────── iCloud Status: OFF ✅ Serial: C02FT4U4Q6L4  Device moved to Today's Repairs. Proceeding with trade-in.
  - [2026-01-27] Adil Azad (reply): @Safan Patel  i'm not entirely sure what is wrong with this mac. when original screen was attached it was powering on, i put tester screen on and it w
  - [2026-01-28] Safan Patel (reply): @Andres Egas please can make screen charging working fine
  - [2026-01-29] Andres Egas (reply): Lcd replaced , battery replaced , right speaker replaced
  - [2026-01-30] Michael Ferrari: ✅ Parts Checkout Complete  📦 Parts Deducted: • MacBook Air A2337 Battery (A2389): 16 → 15 • LCD - A2337: 5 → 4 • USB-C Port - A1932 / A2179 / A2337: 8

### 42. BM 1179 — MBA13

- **BM Order:** 73066608 | **Trade-in:** GB-25481-NUTVB | **Grade:** FUNC.CRACK → Fair | **Serial:** C02G5YCDQ6L4
- **Financials:** Buy £91 → Sell £364 | Parts £132 | Net £2
- **Repair chain:** Diag: Andres Egas (47m) → Repair: - (0m) → Refurb: Andres Egas (121m)
- **Timeline:** Received 2025-12-15 → Repaired 2025-12-16 → Sold 2025-12-17 → Customer got 18/12/2025 → Returned 17/12/2025
- **Duration:** 1d in repair | 1d with customer
- **Customer complaint:** Other > Other Issues
- **Parts:** MacBook Air A1932/A2179 Battery (A1965), Unknown-9951309601, LCD - A2337
- **Root cause:** unknown — Generic 'Other' complaint — no data to classify
- **Prevention:** investigation_needed
- **Flags:** 0 min repair time — no functional test after part swap (MacBook Air A1932/A2179 Battery (A1965), Unknown-9951309601, LCD - A2337) | No repair_person assigned but parts cost £132 | Only 1 day(s) with customer before return
- **Pre-dispatch notes** (5):
  - [2025-12-15] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Air (M1,2020) Space Gray 🔢 Serial: C02G5YCDQ6L4 ✅ iCloud: OFF  ✅ Device: MacBook Air 13 M1 A2337  📊 S
  - [2025-12-15] Andres Egas (reply): Description: ammeter : 20 volts , 2amps Battery 81% 800 cycles , lcd damage , backlight has white mark on the left , dust in the backlight , bezel dam
  - [2025-12-16] Andres Egas (reply): Backlight cleaned , white mark still in bottom left corner but now much better not worth replacing floor 2 for it , lcd replaced , bezel replaced , ba
  - [2025-12-16] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Rubber frame poorly glued Device cleaned Ammeter - passed (20v 2A) Battery - passed 100% Ports - passed Audio - passed Camera - pass
  - [2025-12-16] Ricky Panesar: ✅ Listed on Backmarket SKU: MBA.M1A2337.8GB.256GB.Grey.Fair Date Purchased: Unknown Price: £364

### 43. BM 1489 — MBP14

- **BM Order:** 77521186 | **Trade-in:** GB-26091-JWFAC | **Grade:** NONFUNC.USED → Good | **Serial:** NQF1Y4J2F3
- **Financials:** Buy £148 → Sell £0 | Parts £22 | Net £?
- **Repair chain:** Diag: Mykhailo Kepeshchuk (31m) → Repair: - (0m) → Refurb: Mykhailo Kepeshchuk (73m)
- **Timeline:** Received 2026-02-25 → Repaired 2026-02-28 → Sold ? → Customer got ? → Returned 02/03/2026
- **Duration:** 3d in repair
- **Customer complaint:** Bad Product > Wrong Model Or Specifications
- **Parts:** Unknown-18096827880, Charger MacBook Pro 14-inch, 96W(2021 or later) and 16-inch(2019), Unknown-11069617210, Unknown-11069619398
- **Root cause:** listing_error — Customer complaint matches listing discrepancy
- **Prevention:** listing_accuracy_check_before_dispatch
- **Flags:** No repair_person assigned but parts cost £22 | Screen mismatch: reported Good, actual Damaged | Liquid damage noted at intake: 'Minor'
- **Pre-dispatch notes** (6):
  - [2026-02-25] Ricky Panesar: iCloud Check Result: ───────────────── 📱 MacBook Pro (14-inch,2021) 🔢 Serial: NQF1Y4J2F3 ✅ iCloud: OFF  ⚠️ Could not identify device from SickW data
  - [2026-02-26] Roni Mykhailiuk (reply): Pre-diagnostics  𝗙𝗮𝘂𝗹𝘁𝘀: LCD damage , Lid installed crookedly and looks like copy , Touch ID installed crookedly, minor liquid on wi fi antenna  𝗡𝗲𝗲𝗱
  - [2026-02-26] Roni Mykhailiuk (reply): .
  - [2026-02-26] Ricky Panesar: Stock Check Complete  Status: In Stock  Parts Checked: - LCD (BOE) - A2442 | A2779 | A2992 | A2918 | A3112 | A3185 | A3401: 9 in stock
  - [2026-02-28] Mykhailo Kepeshchuk (reply): Post re[pair: All good, screen BOE replaced without soldering ICs
  - [2026-02-28] Roni Mykhailiuk (reply): 𝗣𝗼𝘀𝘁 𝗤𝗖:  Ammeter - passed (20v 2.5A)  Battery - passed 88%  Ports - passed  Audio - passed  Camera - passed  True tone - passed  Display - passed  Di

### 44. BM 958 *removed — MBP13

- **BM Order:** 71391015 | **Trade-in:** GB-25382-MADOO | **Grade:** NONFUNC.USED → Good | **Serial:** MT6FQW1QHT
- **Financials:** Buy £80 → Sell £0 | Parts £7 | Net £?
- **Repair chain:** Diag: Client Services (26m) → Repair: Andres Egas (59m) → Refurb: Andres Egas (334m)
- **Timeline:** Received 2025-09-23 → Repaired 2025-10-20 → Sold ? → Customer got 30/10/2025 → Returned 29/10/2025
- **Duration:** 27d in repair | 1d with customer
- **Customer complaint:** Technical > Power On Boot Failure
- **Parts:** MacBook Logic Board, USB-C Port - A2681, MacBook Backlight
- **Root cause:** repair_failure — Technical complaint, repair was done (by Andres Egas, 59 min)
- **Prevention:** retest_reported_fault_before_dispatch
- **Flags:** Screen mismatch: reported Excellent, actual Fair | Casing mismatch: reported Excellent, actual Good | Only 1 day(s) with customer before return | Liquid damage noted at intake: 'Liquid Damage?' | Battery mismatch: reported Service, actual Battery Health?
- **Pre-dispatch notes** (16):
  - [2025-09-26] Michael Ferrari (reply): iCloud now off
  - [2025-09-26] Michael Ferrari (reply): @Andres Egas please assess asap
  - [2025-09-26] Andres Egas (reply): Description: ammeter : Not working  Device its liquid damage , charging ports are not working , lcd working but backlight liquid (tested with external
  - [2025-10-10] Safan Patel (reply): Repair notes  we repair logic board and change both charging port and hall sensor  macbook ready to change back light @Mykhailo Kepeshchuk
  - [2025-10-17] Andres Egas (reply): backlight replaced , led backlight stirp replaced , camera swapped .
  - [2025-10-17] Mike McAdam (reply): Post Testing: Flex holder bar broken, missing end

### 45. BM 1028 (Carlos Santos) — MBA13

- **BM Order:** 72183549 | **Trade-in:** GB-25421-QWWWI | **Grade:** FUNC.CRACK → Fair | **Serial:** FVFFM72YQ6L4
- **Financials:** Buy £100 → Sell £0 | Parts £1 | Net £?
- **Repair chain:** Diag: - (28m) → Repair: Safan Patel (50m) → Refurb: Roni Mykhailiuk (132m)
- **Timeline:** Received 2025-10-22 → Repaired 2025-10-30 → Sold 2025-10-31 → Customer got 03/11/2025 → Returned 31/10/2025
- **Duration:** 8d in repair | 3d with customer
- **Customer complaint:** Bad Product > Wrong Model Or Specifications + Esthetical > Body Appeareance Is Not As Expected + Technical > Power On Boot Failure
- **Parts:** Unknown-18096803587, MacBook Logic Board
- **Root cause:** listing_error — Customer complaint matches listing discrepancy
- **Prevention:** listing_accuracy_check_before_dispatch
- **Flags:** Casing mismatch: reported Good, actual Fair | Only 3 day(s) with customer before return
- **Pre-dispatch notes** (6):
  - [2025-10-22] Client Services: Audio - passed, Camera - passed, Display - damaged, - display brightness - passed, keyboard backlight - passed, touch id -0 passed, mic - pssed, keybo
  - [2025-10-28] Ricky Panesar (reply): @Roni Mykhailiuk repair this macbook using the screen you made today.
  - [2025-10-28] Roni Mykhailiuk (reply): @Ricky Panesar here need to change lid I think it is better to make another screen c grade and put full screen
  - [2025-10-28] Roni Mykhailiuk (reply): Repair notes: I replaced full screen A2179 resolder T-CON(It didn't work the first time so I tried 3 times and 2 different T-CONs). Not working camera
  - [2025-10-30] Safan Patel (reply): Post repair all good,we repair logic board LP670 AND UP700 chnage after we found display flex damage as well
  - [2025-10-30] Andres Egas (reply): duts particle on middle top

## Unmatched Returns (2)

These returns could not be matched to a device in the repair chain data.

- **74091714** — MacBook Pro Fair | Shipped 29/12/2025 | Bad Product > Wrong Or Missing Accessories + Technical > Battery Not Charging Or Connectivity
- **74549778** — MacBook Air Fair | Shipped 30/12/2025 | Changed Mind > Ask For Return

## COMPROMISES

- **Matching:** Primary: date ±3 days + model type. Fallback: BM board sale order ID → mirrored serial → main board match. Serial numbers included on all profiles for verification.
- **Days with customer:** Approximated from CSV date_delivery → CSV date_shipped (return).
- **Root cause classification:** Rules-based from complaint text + repair data. Not verified against actual return inspection.
- **Monday notes:** Limited to 100 most recent updates per item. Older notes may be missing.
- **Return cost:** Not available in CSV — BM fee + return shipping not included in this analysis.
- **Repeat returns:** Tracked by Monday item ID. If the same physical device was relisted with a new Monday item, it won't be detected.
