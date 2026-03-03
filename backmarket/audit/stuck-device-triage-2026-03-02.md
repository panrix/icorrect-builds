# Stuck Device Triage — Task 20

**Date:** 2 March 2026
**Data source:** repair-analysis-data-2026-03-02.json (1,256 orders, 534 matched to Monday)
**Filter:** Devices received 30+ days ago, NOT shipped, NOT returned, status not empty

---

## Summary

| Bucket | Devices | Capital Tied Up |
|--------|---------|-----------------|
| **90+ days** | 10 | £819 |
| **60-90 days** | 11 | £961 |
| **30-60 days** | 22 | £2,207 |
| **Total** | **43** | **£3,987** |

---

## By Status — What's Blocking Them

| Status | Count | Capital | Action Required |
|--------|-------|---------|-----------------|
| Repair Paused | 13 | £1,240 | Saf/tech to resume or declare BER |
| BER/Parts | 11 | £602 | Decide: strip for parts or write off |
| Awaiting Part | 9 | £843 | Chase parts supplier or substitute |
| Received | 3 | £260 | Never triaged — assign to tech |
| Client Contacted | 2 | £310 | Chase client response or close |
| Ready To Collect | 2 | £282 | Ship/sell immediately |
| Awaiting Confirmation | 1 | £248 | Chase Ferrari for decision |
| Battery Testing | 1 | £57 | Complete test and move forward |
| Repaired | 1 | £145 | QC and ship — should not be stuck |

---

## By Technician — Who's Holding What

| Technician | Devices | Capital | % of Stuck |
|------------|---------|---------|-----------|
| **Safan Patel** | 22 | £1,990 | **51%** |
| Mykhailo Kepeshchuk | 8 | £992 | 19% |
| (unassigned) | 7 | £431 | 16% |
| Andres Egas | 3 | £345 | 7% |
| Roni Mykhailiuk | 3 | £229 | 7% |

**Saf has 51% of all stuck devices and 50% of stuck capital.** This is expected — he handles the hardest repairs (logic board). But 22 devices on one person's bench is a queue problem.

---

## 90+ Days — Write Off or Rescue (10 devices, £819)

These have been sitting 3+ months. Most are either BER or waiting on Saf.

| BM Name | Device | Status | Grade | Purchase | Days | Tech | Recommended Action |
|---------|--------|--------|-------|----------|------|------|--------------------|
| BM 930 | MBP16 2019 i7 16/512 | BER/Parts | NFU | £20 | 174 | Saf | **WRITE OFF** — Intel, iCloud lock, £20 sunk cost |
| BM 957 | MBA 2020 i3 8/256 | BER/Parts | NFU | £76 | 161 | Saf | **STRIP FOR PARTS** — Intel, BER. Screen/battery salvageable |
| BM 958 | MBP13 2022 M2 24/256 | Awaiting Part | NFU | £80 | 160 | Andres | **CHASE PART** — M2, high sale value if repaired (~£500+) |
| BM 995 | MBA 2020 i3 8/256 | Repair Paused | NFU | £76 | 146 | Saf | **STRIP FOR PARTS** — Intel on Saf's bench, shouldn't be there |
| BM 1046 | MBP13 2020 i5 8/256 | BER/Parts | NFU | £74 | 123 | — | **WRITE OFF** — Intel, unassigned, BER |
| BM 1041 | MBP13 2020 i7 8/256 | Repair Paused | NFU | £98 | 123 | Saf | **ASSESS** — Intel but high purchase. Is board repair viable? |
| BM 1050 | MBP13 2020 i5 16/512 | Repair Paused | NFC | £44 | 122 | Saf | **WRITE OFF** — Intel, low purchase, 4 months stuck |
| BM 1109 | MBP13 M1 8/256 | BER/Parts | NFC | £60 | 95 | — | **STRIP FOR PARTS** — M1, BER. Screen/keyboard salvageable |
| BM 1113 | MBA M1 8/256 | Awaiting Part | FC | £91 | 95 | Mykhailo | **CHASE PART** — M1, good sale value (~£400). 3 months waiting |
| BM 1118 | MBP14 M3 16/512 | Repair Paused | FC | £200 | 94 | Saf | **PRIORITY RESCUE** — £200 purchase, M3 sells £800+. Get Saf to prioritise |

**Quick wins:** BM 1118 (MBP14 M3, £200 invested, potential £600+ net) is the highest-value rescue.
**Write-offs:** BM 930, 1046, 1050 = 3 Intel devices, £138 total sunk cost. Not worth repairing.

---

## 60-90 Days — Actively Stalling (11 devices, £961)

| BM Name | Device | Status | Grade | Purchase | Days | Tech | Recommended Action |
|---------|--------|--------|-------|----------|------|------|--------------------|
| BM 1134 | MBA M1 8/256 | Received | NFC | £51 | 89 | — | **ASSIGN TO TECH** — 89 days unassigned, just sitting |
| BM 1150 | MBP13 2020 i5 16/512 | Awaiting Part | NFU | £89 | 84 | Mykhailo | **ASSESS** — Intel. Worth the part? |
| BM 1153 | MBA M2 16/256 | Repair Paused | NFU | £119 | 84 | Saf | **PRIORITISE** — M2, high value, Saf needs to resume |
| BM 1165 | MBA M1 8/256 | BER/Parts | FC | £109 | 83 | Saf | **STRIP FOR PARTS** — BER declared by Saf |
| BM 1161 | MBP13 M2 8/256 | Repair Paused | NFC | £69 | 81 | Saf | **RESUME** — M2, decent value |
| BM 1194 | MBA M1 8/256 | Repair Paused | NFU | £77 | 75 | Saf | **RESUME** — M1 NFU is profitable grade |
| BM 1200 | MBP13 2020 i7 16/256 | Received | FC | £121 | 75 | — | **ASSESS** — Intel, £121 purchase. Expensive to write off |
| BM 1164 | MBA M1 8/256 | Repair Paused | FC | £109 | 74 | Saf | **RESUME** — M1 FC, good net |
| BM 1192 | MBP13 M1 8/256 | BER/Parts | NFC | £41 | 74 | Roni | **STRIP FOR PARTS** — BER, low purchase |
| BM 1193 | MBA M1 8/256 | BER/Parts | NFU | £88 | 74 | Saf | **STRIP FOR PARTS** — BER in QC group |
| BM 1222 | MBA M1 8/256 | Awaiting Part | NFU | £88 | 69 | Mykhailo | **CHASE PART** — M1 NFU, should be profitable |

**Critical:** BM 1134 has been "Received" for 89 days — never assigned. BM 1200 same situation at 75 days. These need immediate triage.

---

## 30-60 Days — Early Warning (22 devices, £2,207)

| BM Name | Device | Status | Grade | Purchase | Days | Tech | Recommended Action |
|---------|--------|--------|-------|----------|------|------|--------------------|
| BM 1256 | MBP13 2020 i5 16/512 | Repair Paused | NFU | £71 | 56 | Roni | **ASSESS** — Intel, paused on Roni |
| BM 1246 | MBA M1 8/256 | Repair Paused | NFU | £88 | 56 | Saf | **RESUME** — M1 NFU |
| BM 1255 | MBP13 M1 16/1TB | Awaiting Part | NFU | £77 | 56 | Mykhailo | **CHASE PART** |
| BM 1273 | MBA 2020 i3 16/256 | BER/Parts | NFU | £47 | 53 | Saf | **STRIP/WRITE OFF** — Intel BER |
| BM 1267 | MBP13 M1 16/256 | Repair Paused | NFU | £91 | 49 | Saf | **RESUME** — M1 NFU, good net |
| BM 1295 | MBA M1 8/256 | Awaiting Part | UNK | £193 | 47 | Andres | **URGENT CHASE** — £193 purchase! |
| BM 1303 | MBA M1 8/256 | Client Contacted | UNK | £193 | 46 | Saf | **CHASE CLIENT** — £193 tied up |
| BM 1294 | MBA M4 16/256 | BER/Parts | NFU | £1 | 45 | — | **WRITE OFF** — £1 purchase, M4 BER |
| BM 1302 | MBA 2020 i3 8/128 | BER/Parts | NFC | £36 | 42 | — | **WRITE OFF** — Intel BER |
| BM 1310 | MBA 2020 i3 8/128 | Awaiting Part | NFC | £36 | 42 | Saf | **ASSESS** — Intel, worth the part? |
| BM 1305 | MBA 2020 i5 8/512 | BER/Parts | NFU | £50 | 42 | Saf | **STRIP FOR PARTS** — Intel BER |
| BM 1311 | MBP14 M1Pro 16/512 | Awaiting Confirmation | FC | £248 | 42 | Mykhailo | **URGENT** — £248 purchase, awaiting Ferrari. Chase NOW |
| BM 1321 | MBA M1 8/256 | Awaiting Part | NFC | £72 | 40 | Andres | **CHASE PART** |
| BM 1327 | MBA M2 16/256 | Repair Paused | NFC | £91 | 39 | Saf | **RESUME** — M2, good value |
| BM 1334 | MBA 2020 i3 8/512 | Battery Testing | NFU | £57 | 35 | Saf | **COMPLETE TEST** — 35 days in battery testing? |
| BM 1337 | MBP16 M1Pro 16/1TB | Ready To Collect | FC | £194 | 33 | Mykhailo | **SHIP NOW** — repaired, £194 purchase, sitting in "collect" |
| BM 1338 | MBA M1 16/1TB | Repair Paused | NFU | £107 | 33 | Saf | **RESUME** |
| BM 1340 | MBA M1 8/256 | Awaiting Part | FC | £117 | 33 | Mykhailo | **CHASE PART** |
| BM 1351 | MBA M1 8/256 | Received | NFC | £88 | 33 | — | **ASSIGN** — 33 days unassigned |
| BM 1349 | MBP13 M1 8/512 | Repaired | FC | £145 | 33 | Saf | **QC AND SHIP** — repaired, why is it still here? |
| BM 1345 | MBA M1 8/256 | Client Contacted | FC | £117 | 32 | Roni | **CHASE CLIENT** |
| BM 1353 | MBP13 2020 i5 8/1TB | Ready To Collect | FC | £88 | 32 | Mykhailo | **SHIP NOW** — ready, sitting idle |

---

## Immediate Actions Summary

### Ship today (2 devices, £282 tied up → £0)
- **BM 1337** MBP16 M1Pro — Ready To Collect, £194 purchase
- **BM 1353** MBP13 i5 — Ready To Collect, £88 purchase

### QC and ship this week (2 devices, £290)
- **BM 1349** MBP13 M1 — Status "Repaired", 33 days sitting
- **BM 1334** MBA i3 — "Battery Testing" for 35 days

### Chase Ferrari immediately (1 device, £248)
- **BM 1311** MBP14 M1Pro — £248 purchase, highest single value, "Awaiting Confirmation"

### Priority rescues for Saf (4 devices, £505)
- **BM 1118** MBP14 M3 — £200 purchase, potential £600+ net
- **BM 1153** MBA M2 — £119 purchase, 84 days stuck
- **BM 1267** MBP13 M1 16/256 — £91, 49 days
- **BM 1194** MBA M1 — £77, 75 days

### Assign to tech (3 devices, £399, never triaged)
- **BM 1134** MBA M1 — 89 days unassigned!
- **BM 1200** MBP13 i7 — 75 days unassigned
- **BM 1351** MBA M1 — 33 days unassigned

### Write off / strip for parts (9 devices, £459)
Intel BER or very low value:
- BM 930 (£20), BM 957 (£76), BM 995 (£76), BM 1046 (£74), BM 1050 (£44), BM 1273 (£47), BM 1294 (£1), BM 1302 (£36), BM 1305 (£50)
Salvageable parts: screens, keyboards, batteries from M1+ devices

### Chase parts (6 devices, £578)
- BM 958 (£80, 160 days!), BM 1113 (£91), BM 1150 (£89), BM 1222 (£88), BM 1255 (£77), BM 1295 (£193)

### Chase clients (2 devices, £310)
- BM 1303 (£193), BM 1345 (£117)

---

## Saf Queue Problem

Saf has 22 stuck devices. Of those:
- **4 are Intel** (BM 930, 957, 995, 1041) — shouldn't be on his bench at all
- **5 are BER/Parts** — decisions already made, need to be cleared off his bench
- **8 are Repair Paused** — these are his actual queue bottleneck
- **5 are other statuses** — awaiting part, battery testing, client contacted

**Recommendation:** Clear the 4 Intel devices and 5 BER off Saf's bench immediately. That frees 9 slots. Then prioritise the £200+ purchases (BM 1118, BM 1153) first.

---

## COMPROMISES

- Days stuck calculated from `received` date to 2 March 2026 — some devices may have had work done recently but status wasn't updated
- "Repair Paused" could mean waiting for parts, waiting for Saf's time, or deprioritised — can't distinguish from data alone
- Parts salvage value not estimated — would need Nancy's input
- Intel devices labelled "write off" may have screen/battery value if stripped — depends on parts demand
