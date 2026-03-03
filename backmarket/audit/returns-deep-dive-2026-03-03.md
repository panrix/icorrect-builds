# Returns Deep Dive — Matched to Repair Chain

**Date:** 3 March 2026
**Data sources:**
- BM returns CSV: `docs/Backmarket_Returns_0303.csv` — 47 unique sale-side return orders (Oct 2025 - Mar 2026)
- Monday repair data: `audit/repair-analysis-data-2026-03-02.json` — 534 matched devices, 380 shipped
- **Matching method:** BM return ship date + model type matched to our date_sold_bm/date_listed_bm within 3 days. **44 of 47 matched.**

---

## Executive Summary

47 returns over 5 months. 81% preventable. **£3,869 direct cost** (BM fees + shipping). 4 devices returned multiple times. The root causes are: no boot test after repair, no pre-dispatch QC checklist, no serial→listing verification, and no repeat-return flagging. Mykhailo's refurb step is the last checkpoint before dispatch — he's on 17 of 44 returns.

---

## Financial Impact (44 matched returns)

| Metric | Amount |
|--------|--------|
| Sale value disrupted | £25,489 |
| BM fees lost (10% × sale) | £2,549 |
| Shipping cost (£15 each way × 44) | £1,320 |
| **Total direct return cost** | **£3,869** |
| Parts invested in returned devices | £2,603 |
| Purchase cost of returned devices | £5,108 |
| Avg cost per return | £88 |

Each return loses: 10% BM fee on original sale + £15 outbound shipping + £15 return shipping. Then we relist, pay another 10% BM fee + £15 shipping on the resale. **Effective cost of a return: ~20% of sale price + £45.**

At £580 avg sale price for matched returns: **~£161 lost per return = ~£7,500 total over 5 months = ~£1,500/month.**

---

## Return Rate by Technician

| Technician | Returns | Shipped | Return Rate |
|------------|---------|---------|-------------|
| **Roni Mykhailiuk** | 7 | 39 | **17.9%** |
| **Mykhailo Kepeshchuk** | 15 | 94 | **16.0%** |
| Unassigned | 2 | 16 | 12.5% |
| Safan Patel | 13 | 121 | 10.7% |
| **Andres Egas** | 7 | 110 | **6.4%** |

**Andres has half the return rate of Roni and Mykhailo.** Whatever Andres does at QC/refurb stage works better. His process should be the baseline.

---

## Who Was Last To Touch (Refurb = Final QC)

| Refurb Person | Returns | % of Returns |
|---------------|---------|-------------|
| **Mykhailo** | 17 | **39%** |
| No refurb recorded | 12 | 27% |
| Andres | 8 | 18% |
| Roni | 7 | 16% |

**Mykhailo is the last person to touch 39% of all returned devices.** The refurb step is the final checkpoint. If issues aren't caught here, they reach the buyer.

---

## Repair Person Gap — 59% Had No Repair Person

| Repair Person | Returns |
|---------------|---------|
| **No repair person** | **26 (59%)** |
| Safan Patel | 17 |
| Andres Egas | 1 |

26 of 44 returned devices had no `repair_person` recorded. Either:
1. Repair field isn't filled in (data quality issue)
2. Devices went through with minimal repair (screen swap only, no board work)
3. No formal repair sign-off before dispatch

**No chain of custody:** There's no documented "who repaired → who QC'd → who packed" trail.

---

## Repeat Return Devices — 4 Devices, 9 Returns

### BM 1198 — MBP16 M1Pro 32GB/1TB — **RETURNED 3 TIMES** (£923 sale)
- Tech/Refurb: Mykhailo
- Return 1: "Other Issues"
- Return 2: "Item Damaged Before Delivery"
- Return 3: "Accessories Not Working"
- **Cost: 3× BM fee (£277) + 3× shipping (£90) = £367 wasted on ONE device**
- Should have been flagged after first return for thorough re-QC

### BM 1078 — MBP14 M1Max 64GB — **RETURNED 2 TIMES** (£1,099 sale)
- Tech/Repair: Saf
- Return 1: "Keyboard Defects"
- Return 2: "Display Issues"
- £1,099 sale price = £220 in BM fees lost across 2 returns

### BM 1130 — MBA M1 8/256 — **RETURNED 2 TIMES** (£408 sale)
- Tech/Refurb: Andres
- Return 1: "Other Issues"
- Return 2: "Wrong Color"
- Wrong colour = listing error, not device error

### BM 1103 — MBA i5 8/512 — **RETURNED 2 TIMES** (£372 sale)
- Tech/Refurb: Mykhailo
- Return 1: "Tracking Issue + Keyboard Mapping Issues"
- Return 2: "Other Issues"
- Keyboard layout mismatch (UK vs US?) = listing error

---

## Power On Boot Failure — #1 Complaint (8 orders, 17%)

| Device | Grade | Function Field | Repair Person | Repair Time | Parts |
|--------|-------|----------------|---------------|-------------|-------|
| BM 1201 M2 MBA | NFU | NFU→NFU | Saf | 0 min | Unknown |
| BM 1071 M2 MBA | FC | Func→Func | — | 0 min | LCD only |
| BM 1098 M1 MBP13 | NFU | NFU→Func | — | 0 min | Backlight + Battery |
| BM 1076 i5 MBP13 | NFU | NFU→NFU | Saf | 45 min | Logic Board |
| BM 963 M1Pro MBP14 | FC | Func→Func | — | 0 min | Battery + LCD |
| BM 1010 M1 MBA | FC | Func→Func | — | 0 min | LCD |
| BM 967 M2Pro MBP14 | FC | Func→Func? | Saf | 20 min | LCD |
| BM 1036 M1 MBA | FC | Func→Func | — | 0 min | LCD |

**6 of 8 had 0 minutes repair time. 5 of 8 had no repair person.**

Devices marked "Functional", had screen/battery replaced, shipped. Buyer says won't turn on.

**Root cause:** No boot test after LCD/battery replacement. Screen swap can unseat connectors or damage flex cables. The device was functional BEFORE the swap but nobody verified it after.

**BM 967 is the worst case:** M2 Pro MBP14, £1,048 sale, function field literally says "Functional?" with a question mark. Someone wasn't sure it worked and shipped it anyway.

---

## Return Rate by Trade-In Grade

| Trade-in Grade | Returns | Shipped | Return Rate |
|----------------|---------|---------|-------------|
| **NONFUNC.USED** | **19** | **114** | **16.7%** |
| FUNC.CRACK | 20 | 184 | 10.9% |
| UNKNOWN | 3 | 39 | 7.7% |
| NONFUNC.CRACK | 2 | 43 | 4.7% |

**NONFUNC.USED has the HIGHEST return rate (16.7%)** — these arrive non-functional, get board-level repair, then sell as refurbished. The board repair works (device functions) but other issues slip through: keyboard, display quality, cosmetics.

---

## All Issue Categories (47 orders, 61 issues)

| Category | Orders | % |
|----------|--------|---|
| **Technical** | 23 | 49% |
| Other (generic) | 8 | 17% |
| Bad Product | 6 | 13% |
| Changed Mind | 5 | 11% |
| Esthetical | 3 | 6% |
| Late Delivery | 2 | 4% |

### Technical breakdown (23 orders)
- Power On Boot Failure: 8
- Display Issues: 5
- Keyboard Defects: 3
- Accessories Not Working: 3
- Battery Not Charging: 2
- Camera Failures: 2
- Software: 1
- Battery Drain: 1
- Too Hot/Noisy: 1
- Random Shutdown: 1
- Keyboard Mapping: 1

### Not preventable (9 orders, 19%)
- Changed Mind / Ask For Return: 5 (buyer's right)
- Late Delivery / Shipping Damage: 2 (courier)
- Tracking Issue: 1
- Late Shipping: 1

---

## How the 81% Could Have Been Prevented

### 1. Boot test after every repair (~17% of returns)
8 "Power On Boot Failure" returns. 6 had 0min repair time, 5 had no repair person. A 2-minute boot test after screen/battery swap catches disconnected cables and unseated connectors.

### 2. Pre-dispatch functional QC checklist (~30% of returns)
Display, keyboard, camera, battery — all catchable with a 10-minute test. No documented pre-dispatch QC step exists. Proposed checklist:
- Full boot to desktop
- Solid colour display test (white/black/red/green/blue)
- Every key pressed, layout matches listing
- Camera test (Photo Booth)
- Battery health check (80%+ required)
- Charge test with included charger
- All ports tested
- WiFi + Bluetooth connected

### 3. Serial → listing verification (~13% of returns)
Wrong colour (3), wrong model (3), wrong specs — 6 returns from listing errors. Serial number lookup confirms model/spec/colour before packing.

### 4. Accessories check (~10% of returns)
Wrong/missing/faulty charger or accessories. Test charger actually charges, verify wattage matches model.

### 5. Repeat-return flagging (~11% of returns)
4 devices returned 2-3 times each (9 of 44 returns). After first return, flag for thorough re-QC before relisting. Currently no flag — device just gets relisted.

### 6. Cosmetic grade verification (~6% of returns)
Body/screen appearance not as expected. Photograph against BM grade standards. Grade from our inspection, not BM's trade-in report.

---

## Recommended Process Changes

### Short term (this week)
1. **Add boot test to refurb step** — power on, reach desktop, after every screen/battery swap
2. **Flag repeat returns in Monday** — any device returned once gets a "RETURN_FLAG" before relisting
3. **Verify serial → listing** — 30-second check before packing

### Medium term (this month)
4. **Pre-dispatch QC checklist** — printed or digital, signed by the person who packed it
5. **Track BM sale order ID in Monday** — enables direct matching of returns to devices
6. **Review Mykhailo's refurb process** — he's on 39% of returns. Compare his checklist to Andres's

### Longer term
7. **Return reason tracking in Monday** — add column: buyer_return, quality_issue, listing_error, transit_damage
8. **Monthly return rate dashboard** — by tech, by grade, by issue type
9. **Target: <5% overall, <3% preventable** (currently 11.6% overall, ~9.5% preventable based on matched data)

---

## All 44 Matched Returns — Full Repair Chain

| BM Order | Ship Date | BM Name | Device | Trade-in Grade | Sale | Purchase | Issues | Tech | Repair | Refurb | Parts | Repair Time |
|----------|-----------|---------|--------|----------------|------|----------|--------|------|--------|--------|-------|-------------|
| 76375906 | 05/02/26 | BM 1367 | MBA M1 8/256 | FC | £401 | £117 | Other Issues | Andres | — | Andres | LCD | 0min |
| 75022292 | 07/02/26 | BM 1223 | MBA M1 16/256 | NFU | £444 | £77 | Damaged During Delivery | Saf | Saf | Andres | KB+LCD+Backlight | 130min |
| 76415529 | 09/02/26 | BM 1359 | MBP14 M1Pro 16/512 | FC | £729 | £248 | Wrong Color, Body Appearance | Mykhailo | — | Mykhailo | Unknown | 0min |
| 74346282 | 10/02/26 | BM 1261 | MBP13 M1 8/256 | NFU | £487 | £91 | Accessories Other | Mykhailo | Saf | Mykhailo | KB+Other | 120min |
| 77117529 | 24/02/26 | BM 1239 | MBP13 M1 8/256 | UNK | £666 | £100 | Battery Not Charging | Saf | Saf | Mykhailo | KB Backlight+TouchBar+Trackpad | 74min |
| 71606339 | 03/01/26 | BM 1198 | MBP16 M1Pro 32/1TB | FC | £923 | £124 | Other Issues | Mykhailo | — | Mykhailo | Unknown | 19min |
| 73769725 | 08/01/26 | BM 1244 | MBA M1 16/256 | FC | £420 | £138 | Software | Andres | Andres | Andres | LCD+Battery | 18min |
| 75170314 | 09/01/26 | BM 1234 | MBA M1 8/256 | NFU | £465 | £88 | Other Issues | Saf | Saf | — | LB+USB-C | 141min |
| 73644484 | 12/01/26 | BM 1252 | MBP13 i5 16/512 | NFC | £400 | £71 | Display Issues | Saf | Saf | — | Battery Flex+Other | 102min |
| 52417828 | 16/01/26 | BM 1198 | MBP16 M1Pro 32/1TB | FC | £923 | £124 | Item Damaged Before Delivery | Mykhailo | — | Mykhailo | Unknown | 19min |
| 52798593 | 16/01/26 | BM 1201 | MBA M2 8/256 | NFU | £527 | £109 | Power On Boot Failure | — | Saf | — | Unknown+Other | 0min |
| 75037091 | 20/01/26 | BM 1287 | MBA M1 8/256 | UNK | £407 | £193 | Battery Drain, Too Hot/Noisy | Mykhailo | — | Mykhailo | Software Restore | 22min |
| 76261799 | 20/01/26 | BM 1262 | MBP14 M2Pro 16/512 | FC | £1029 | £235 | Wrong Model/Specs | Mykhailo | — | Mykhailo | LCD+USB-C | 0min |
| 74281180 | 26/01/26 | BM 1211 | MBP13 M1 16/1TB | NFU | £599 | £114 | Changed Mind | Saf | Saf | — | LB+Unknown | 130min |
| 76545691 | 30/01/26 | BM 1318 | MBA M1 8/256 | FC | £383 | £137 | Body Appearance, Accessories | Andres | — | Andres | LCD+Battery+Charger | 6min |
| 46441949 | 03/12/25 | BM 1078 | MBP14 M1Max 64/? | NFU | £1099 | £123 | Keyboard Defects | Saf | Saf | — | LB | 117min |
| 72373581 | 03/12/25 | BM 1078 | MBP14 M1Max 64/? | NFU | £1099 | £123 | Display Issues | Saf | Saf | — | LB | 117min |
| 73811004 | 04/12/25 | BM 1061 | MBA M1 8/256 | NFU | £380 | £0 | Changed Mind | Saf | Saf | Mykhailo | Other | 21min |
| 54139159 | 05/12/25 | BM 1130 | MBA M1 8/256 | FC | £408 | £91 | Other Issues | Andres | — | Andres | LCD | 0min |
| 73500809 | 05/12/25 | BM 1083 | MBP13 M1 8/256 | FC | £587 | £133 | Display Issues | Roni | — | Roni | Unknown | 0min |
| 74115275 | 06/12/25 | BM 1130 | MBA M1 8/256 | FC | £408 | £91 | Wrong Color | Andres | — | Andres | LCD | 0min |
| 73902913 | 11/12/25 | BM 1138 | MBP14 M1Pro 16/512 | NFU | £802 | £123 | Other Issues | Mykhailo | Saf | Mykhailo | Battery+LB+KB | 57min |
| 73066608 | 17/12/25 | BM 1179 | MBA M1 8/256 | FC | £364 | £91 | Other Issues | Andres | — | Andres | Battery+LCD | 0min |
| 74549778 | 30/12/25 | BM 1217 | MBA M2 16/512 | NFU | £789 | £127 | Changed Mind | Saf | Saf | — | Liquid+Trackpad+Bezel | 100min |
| 75100215 | 02/01/26 | BM 1198 | MBP16 M1Pro 32/1TB | FC | £923 | £124 | Accessories Not Working | Mykhailo | — | Mykhailo | Unknown | 19min |
| 72206975 | 03/11/25 | BM 989 | MBP13 M1 8/256 | FC | £563 | £133 | Accessories Not Working | Mykhailo | — | Mykhailo | LCD | 0min |
| 72081868 | 04/11/25 | BM 1020 | MBA M1 8/256 | NFC | £289 | £56 | Changed Mind | Saf | Saf | — | LB | 28min |
| 72676015 | 10/11/25 | BM 1060 | MBP13 i5 8/256 | NFU | £390 | £74 | Keyboard Defects | Roni | — | Roni | Unknown+Battery | 0min |
| 70301212 | 14/11/25 | BM 1071 | MBA M2 8/256 | FC | £581 | £184 | Power On, Random Shutdown | Mykhailo | — | Mykhailo | LCD | 0min |
| 72595395 | 17/11/25 | BM 1054 | MBP13 M1 16/1TB | NFU | £785 | £107 | Parcel Recovery Issues | Roni | Saf | Roni | Battery Flex | 34min |
| 45815797 | 21/11/25 | BM 1098 | MBP13 M1 8/512 | NFU | £483 | £69 | Power On Boot Failure | Mykhailo | — | Mykhailo | Backlight+Battery | 0min |
| 72692403 | 21/11/25 | BM 1091 | MBA i3 8/256 | FC | £343 | £85 | Bought By Mistake | Andres | — | Andres | Battery | 0min |
| 73007256 | 25/11/25 | BM 1103 | MBA i5 8/512 | NFU | £372 | £41 | Tracking, KB Mapping | Mykhailo | — | Mykhailo | LCD+Backlight | 0min |
| 73250366 | 25/11/25 | BM 1103 | MBA i5 8/512 | NFU | £372 | £41 | Other Issues | Mykhailo | — | Mykhailo | LCD+Backlight | 0min |
| 73129338 | 26/11/25 | BM 1076 | MBP13 i5 8/256 | NFU | £380 | £74 | Accessories, Power On | Saf | Saf | — | LB+Other | 45min |
| 73375963 | 27/11/25 | BM 1104 | MBP13 M2 8/256 | NFU | £669 | £81 | Display, Keyboard | Mykhailo | — | Mykhailo | LB+KB+Backlight | 133min |
| 73335677 | 28/11/25 | BM 1099 | MBP13 M1 8/256 | UNK | £620 | £299 | Camera, Display | — | — | — | None | 0min |
| 73332891 | 01/12/25 | BM 992 | MBA i3 16/512 | NFU | £330 | £40 | Damaged Before Delivery | Saf | Saf | — | LB+Battery+Audio | 45min |
| 70768864 | 03/10/25 | BM 963 | MBP14 M1Pro 16/1TB | FC | £838 | £193 | Late Shipping, Power On | Roni | — | Roni | Battery+LCD | 0min |
| 47115620 | 14/10/25 | BM 1002 | MBP13 M1 8/256 | NFU | £520 | £80 | Wrong/Missing Accessories | Saf | Saf | — | LB | 64min |
| 45116315 | 24/10/25 | BM 1019 | MBP13 i5 8/256 | FC | £399 | £98 | Screen Appearance, Camera | Roni | — | Roni | Battery+LCD | 0min |
| 55187448 | 27/10/25 | BM 1010 | MBA M1 8/512 | FC | £390 | £144 | Power On Boot Failure | Roni | — | Roni | LCD | 0min |
| 71391015 | 29/10/25 | BM 967 | MBP14 M2Pro 16/512 | FC | £1048 | £165 | Power On Boot Failure | Mykhailo | Saf | Mykhailo | LCD | 20min |
| 72183549 | 31/10/25 | BM 1036 | MBA M1 8/512 | FC | £455 | £152 | Wrong Model, Body, Power On | Roni | — | Roni | LCD | 0min |

---

## COMPROMISES

- **Matching is approximate** — by ship date ±3 days + model type (Air/Pro). Some matches may be wrong, especially if multiple devices of same model shipped on same day.
- **4 repeat-return devices matched to the same Monday item** — BM 1198 matched 3 returns, BM 1078 matched 2. Correct (same device sold/returned multiple times) but inflates individual device counts.
- **3 unmatched returns** — BM orders 77407906, 77521186, and one other couldn't be matched (possibly shipped outside our 6-month data window or date mismatch >3 days).
- **"Other > Other Issues" (7 orders)** — generic BM category, actual reason unknown. Classified as preventable by default.
- **Repair time of 0min** doesn't necessarily mean no work done — the timer may not have been started, or work was done outside the tracked repair step.
- **Parts cost from Monday may be incomplete** — several "Unknown-XXXXX" part IDs couldn't be resolved to names or costs.
- **No BM sale order ID in Monday** — this matching exercise was necessary because we don't track the sale-side order ID. Adding this field would make future analysis instant.
