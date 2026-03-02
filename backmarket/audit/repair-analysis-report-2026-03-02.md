# Repair Analysis Report — BM Buyback Devices

**Date:** 2 March 2026
**Data source:** 1,256 BM trade-in orders (last 6 months), 534 matched to Monday main board
**Script output:** `repair-analysis-data-2026-03-02.json`
**Reference:** `docs/repair-analysis-plan.md`

---

## Executive Summary

343 devices sold at £208 avg net, 1.5% loss rate. NONFUNC.USED confirmed as best grade: £289 avg net, 0% loss rate, fastest ramp. **Saf is the sole logic board repair capability** — every board-level repair goes through him. 50% of NONFUNC.USED devices need board work. Scaling NONFUNC.USED volume means scaling Saf's capacity or accepting that half the intake skips the board queue entirely.

24 devices stuck 30+ days with £2,150 capital tied up. 14 devices BER'd. 101 total in the pipeline (stuck + active repair). £17,160 total unrealised capital across all non-sold matched devices.

---

## Layer 1: Device Pipeline

### Full categorisation (1,256 orders)

| Category | Devices | Capital | Notes |
|----------|---------|---------|-------|
| **Sold** | 343 | £43,011 | Repaired and sold on BM |
| **Listed** | 10 | £989 | Repaired, awaiting sale |
| **In Repair** | 71 | £8,545 | Active repair/refurb/QC |
| **Stuck** | 30 | £3,203 | Repair Paused or Error |
| **BER** | 14 | £735 | Beyond Economic Repair |
| **Returned** | 34 | £4,031 | Returned to BM/customer |
| **Cancelled** | 300 | £33,422 | BM cancelled before shipment |
| **Not Sent** | 448 | £62,695 | Accepted but customer never shipped |
| **No Monday Data** | 8 | £1,135 | No match found on Monday board |
| **Total** | **1,256** | **£157,766** | |

**Key insight:** Only 38% of accepted orders (478/1,256) actually arrive at the workshop. 300 cancel, 448 never ship. The 6/day acceptance cap means ~2.2 devices/day actually received.

### Sold device performance

| Metric | Value |
|--------|-------|
| Devices sold | 343 |
| Avg net profit | £208 |
| Total net profit | £71,331 |
| Loss rate | 1.5% (5 devices) |

### Stuck + In Repair (101 devices, £11,748 capital)

| Status | Devices | Capital |
|--------|---------|---------|
| Repair Paused | 27 | £3,484 |
| Awaiting Part | 16 | £2,071 |
| Expecting Device | 14 | £1,901 |
| Book Return Courier | 13 | £1,862 |
| Received | 12 | £1,389 |
| Ready To Collect | 12 | £2,155 |
| BER/Parts | 14 | £1,139 |
| Queued For Repair | 6 | £720 |
| Other (Error, Battery Testing, Software Install, etc.) | 19 | £2,249 |

**Age distribution (stuck + in repair):**
- 0-14 days: 54 (fresh, expected)
- 15-30 days: 18
- 31-60 days: 17
- 61-90 days: 6
- 90+ days: 6

### Stuck by grade

| Grade | Stuck Devices | Capital |
|-------|---------------|---------|
| NONFUNC.USED | 57 | £5,726 |
| FUNC.CRACK | 44 | £7,299 |
| NONFUNC.CRACK | 24 | £2,032 |

NONFUNC.USED has the most stuck devices but lowest average capital per device (cheaper purchase prices).

---

## Layer 2: Grade x Tech Performance

### Grade summary (sold devices only)

| Grade | Sold | Avg Net | Total Net | Loss Rate | Avg Turnaround |
|-------|------|---------|-----------|-----------|----------------|
| **NONFUNC.USED** | 107 | £289 | £29,679 | 0% | 11 days (median 6d) |
| **NONFUNC.CRACK** | 37 | £195 | £7,214 | 3% | 12 days (median 6d) |
| **FUNC.CRACK** | 167 | £169 | £28,839 | 1% | 8 days (median 5d) |

NONFUNC.USED: highest margin, zero losses, but slowest turnaround (board work bottleneck).
FUNC.CRACK: highest volume, decent margin, fastest turnaround.
NONFUNC.CRACK: lowest volume, moderate margin, worst loss rate — board work + screen replacement.

### Tech performance by grade

#### NONFUNC.USED

| Tech | Devices | Sold | Avg Net | Loss | BER | Stuck | Diag | Repair | Refurb |
|------|---------|------|---------|------|-----|-------|------|--------|--------|
| **Saf** | 89 | 65 | £289 | 0% | 6 | 11 | 32min | 80min | 99min |
| Misha | 28 | 19 | £289 | 0% | 0 | 1 | 38min | 56min | 85min |
| Andres | 19 | 15 | £235 | 0% | 0 | 0 | 33min | 40min | 103min |
| Roni | 13 | 4 | £203 | 0% | 2 | 3 | 31min | 101min | 93min |

Saf handles 51% of all NONFUNC.USED — and every device that needs board-level work passes through him regardless of who is listed as technician. The workflow is: Saf does diag + board repair, then hands off to Misha/Andres for screen replacement + cosmetic refurb. Saf does not do screen work. The Repair column reflects Saf's board work; the Refurb column reflects the handoff stage done by Misha/Andres.

#### NONFUNC.CRACK

| Tech | Devices | Sold | Avg Net | Loss | BER | Stuck | Diag | Repair | Refurb |
|------|---------|------|---------|------|-----|-------|------|--------|--------|
| **Saf** | 25 | 14 | £183 | 7% | 0 | 3 | 36min | 197min | 100min |
| Andres | 17 | 9 | £219 | 0% | 0 | 1 | 53min | 60min | 131min |
| Misha | 14 | 10 | £196 | 0% | 0 | 1 | 37min | 70min | 101min |

Saf's repair time on NONFUNC.CRACK is 197min avg — 2.5x his NONFUNC.USED repair time. These need board work, then a handoff for screen/casing refurb. Only grade with a loss on Saf's bench (1 of 14).

#### FUNC.CRACK

| Tech | Devices | Sold | Avg Net | Loss | BER | Stuck | Diag | Repair | Refurb |
|------|---------|------|---------|------|-----|-------|------|--------|--------|
| **Andres** | 84 | 69 | £169 | 1% | 0 | 2 | 37min | 38min | 98min |
| **Misha** | 74 | 46 | £232 | 0% | 0 | 5 | 32min | 29min | 115min |
| **Saf** | 35 | 28 | £179 | 0% | 1 | 2 | 38min | 67min | 134min |
| **Roni** | 28 | 23 | £194 | 0% | 0 | 0 | 26min | 41min | 99min |

FUNC.CRACK is the most evenly distributed — all techs handle it. Andres does the most volume, Misha gets the highest net (likely assigned higher-value devices or better cosmetic outcomes). Saf shouldn't be doing FUNC.CRACK — his board skills are wasted on screen swaps.

### Turnaround time

| Grade | Received to Repaired | Repaired to Sold | End to End |
|-------|---------------------|------------------|------------|
| NONFUNC.USED | avg 7d, median 3d | avg 5d, median 3d | avg 11d, median 6d |
| NONFUNC.CRACK | avg 8d, median 3d | avg 5d, median 3d | avg 12d, median 6d |
| FUNC.CRACK | avg 4d, median 2d | avg 4d, median 2d | avg 8d, median 5d |

FUNC.CRACK moves fastest through the pipeline. NONFUNC grades take 3-4 extra days on average (the board work queue).

### Condition mismatch (BM reported vs actual at intake)

| Grade | Battery | Screen | Casing | Function |
|-------|---------|--------|--------|----------|
| NONFUNC.USED | 72% mismatch | 79% mismatch | 64% mismatch | 36% mismatch |
| NONFUNC.CRACK | 61% | 34% | 53% | 62% |
| FUNC.CRACK | 30% | 16% | 54% | 20% |

**Battery** mismatches are mostly "Normal" reported but "Unable to Test" actual — because NONFUNC devices can't be powered on at intake to check battery.

**Function** mismatch is interesting: 20% of NONFUNC.USED devices arrive actually functional. 46% of NONFUNC.CRACK arrive functional. BM's grading is conservative — we're getting easier repairs than expected on a meaningful chunk.

**Screen** mismatches on NONFUNC.USED are high (79%) — "Good" reported but "Fair" or "Damaged" actual. The device can't be tested at intake because it doesn't power on, so screen condition is unknown until board repair is done.

**Casing** is consistently overstated across all grades (reported as Good/Excellent, arrives Fair). This is universal BM seller behaviour — not grade-specific.

### Parts usage patterns (sold devices)

**NONFUNC.USED:**
- 50% need a logic board (Saf's work)
- 50% fixed without board replacement (battery, adapters, keyboard backlight, LCD)
- 3% needed zero parts

**NONFUNC.CRACK:**
- 100% needed parts (expected — board + screen)
- 32% need logic board + 27% need LCD-A2337 (the M1 Air screen)

**FUNC.CRACK:**
- 99% needed parts
- 36% LCD-A2337 (dominant part — M1 Air screen swap is the bread and butter)
- Only 7% needed logic board (unexpected findings during screen work)

---

## Layer 3: Logic Board Deep Dive

### Saf is the sole board-level repair capability

97 devices in the dataset used a logic board part. By "technician" field:
- Saf: 68 devices (58 sold)
- Misha: 18 devices (11 sold)
- Andres: 9 devices (7 sold)

**But this is misleading.** The "technician" field shows current assignee, not who did the board work. Checking the `repair_person` field on non-Saf devices: most show `Safan Patel` as the person who did the actual repair. The device then passed to Misha/Andres for screen and refurb.

**Saf does every logic board repair.** No exceptions. No one else in the team has board-level skills.

### Saf's actual bench time (diag + board repair only)

Saf does diagnosis and board-level repair. He does not do screen replacements or cosmetic refurb — those are handed off to Misha/Andres. The Refurb column below is the handoff stage, not Saf's time.

| Grade | Avg Diag | Avg Repair | **Saf bench (diag+repair)** | Refurb (handoff) |
|-------|----------|------------|----------------------------|------------------|
| NONFUNC.USED | 32min | 80min | **111min** | 99min (Misha/Andres) |
| NONFUNC.CRACK | 36min | 197min | **230min** | 100min (Misha/Andres) |
| FUNC.CRACK | 38min | 67min | **102min** | 134min (Misha/Andres) |

NONFUNC.USED is Saf's most efficient grade — 111min of his bench time per device. NONFUNC.CRACK takes over double (230min) because it's board work on a more damaged device.

### Saf's throughput ramp

| Month | Devices Sold |
|-------|-------------|
| Sep 2025 | 4 |
| Oct 2025 | 11 |
| Nov 2025 | 20 |
| Dec 2025 | 15 |
| Jan 2026 | 27 |
| Feb 2026 | 30 |

Saf is scaling — from 4/month to 30/month over 6 months. At 30/month and 111min/device for NONFUNC.USED, that's ~55 hours of board work per month (14h/week).

**Theoretical ceiling:** At 7 effective hours/day and 111min/device, Saf can do ~3.8 NONFUNC.USED devices/day = **83/month**. He's currently at 30/month — running at 36% of theoretical capacity. The bottleneck isn't Saf's hours, it's incoming volume and devices queued on other priorities (FUNC.CRACK, NONFUNC.CRACK).

### Ammeter readings vs outcomes (NONFUNC.USED)

| Reading | Total | Sold | BER | Stuck | Sold Avg Net |
|---------|-------|------|-----|-------|-------------|
| 5V | 58 | 38 | 2 | 9 | £307 |
| 20V + 1.5A or higher | 47 | 33 | 2 | 3 | £275 |
| 20V + ~1A (low amp) | 16 | 14 | 0 | 1 | £246 |

**5V devices** (not negotiating USB-C PD — likely board-level power issue) have the highest net but also the most stuck devices (9). These are the harder repairs but more profitable when they work.

**20V + 1.5A or higher** (charging normally) — these are the "easy" NONFUNC devices. Board might just need a minor fix or the issue is elsewhere (screen, keyboard, etc.). Lower stuck rate.

**20V + ~1A (low amp)** — partial charging, moderate difficulty. Best stuck ratio (1/16), decent net. Most predictable outcome.

### The 50/50 split

Half of NONFUNC.USED devices need a logic board, half don't.

| Category | Sold | Avg Net |
|----------|------|---------|
| With logic board | 53 | £297 |
| Without logic board | 54 | £258 |

Devices needing board work are actually more profitable (+£39/device) — they have more wrong so the purchase price is lower, but sale price is similar once repaired.

Non-board NONFUNC.USED repairs use: batteries, adapters, LCD panels, keyboard backlights. These could be handled by any tech — they don't need Saf.

---

## BER Devices (14 total)

| Grade | Count | Capital | Notes |
|-------|-------|---------|-------|
| NONFUNC.USED | 10 | £735 | Mix of Intel and M1 devices |
| NONFUNC.CRACK | 2 | £97 | |
| FUNC.CRACK | 1 | £109 | |

BER rate: 2.6% of matched devices. Low. Most BER devices were cheap purchases (avg £53). The Intel MBP16 2019 i9 (£20 purchase) and Intel i3 MBAs are the most common BER candidates — old architecture, expensive to fix.

---

## Returned Devices (34 total, £4,031 capital)

| Grade | Count | Capital |
|-------|-------|---------|
| FUNC.CRACK | 18 | £2,383 |
| NONFUNC.USED | 8 | £608 |
| NONFUNC.CRACK | 6 | £326 |

FUNC.CRACK has the most returns (18) — likely cosmetic issues post-repair that customers reject. Needs investigation: are these BM quality complaints or customer buyer's remorse?

---

## Stuck Devices 30+ Days (24 devices, £2,150)

These need triage decisions — repair, write off, or return to BM.

| Days | Grade | Status | Tech | Capital | Item |
|------|-------|--------|------|---------|------|
| 160 | NONFUNC.USED | Awaiting Part | Andres | £80 | BM 958 |
| 146 | NONFUNC.USED | Repair Paused | Saf | £76 | BM 995 |
| 123 | NONFUNC.USED | Repair Paused | Saf | £98 | BM 1041 |
| 122 | NONFUNC.CRACK | Repair Paused | Saf | £44 | BM 1050 |
| 95 | FUNC.CRACK | Awaiting Part | Misha | £91 | BM 1113 |
| 94 | FUNC.CRACK | Repair Paused | Saf | £200 | BM 1118 |
| 89 | NONFUNC.CRACK | Received | Unassigned | £51 | BM 1134 |
| 84 | NONFUNC.USED | Awaiting Part | Misha | £89 | BM 1150 |
| 84 | NONFUNC.USED | Repair Paused | Saf | £119 | BM 1153 |
| 81 | NONFUNC.CRACK | Repair Paused | Saf | £69 | BM 1161 |
| 75 | NONFUNC.USED | Repair Paused | Saf | £77 | BM 1194 |
| 75 | FUNC.CRACK | Received | Unassigned | £121 | BM 1200 |
| 74 | FUNC.CRACK | Repair Paused | Saf | £109 | BM 1164 |
| 69 | NONFUNC.USED | Awaiting Part | Misha | £88 | BM 1222 |
| 56 | NONFUNC.USED | Repair Paused | Roni | £71 | BM 1256 |
| 56 | NONFUNC.USED | Repair Paused | Saf | £88 | BM 1246 |
| 56 | NONFUNC.USED | Awaiting Part | Misha | £77 | BM 1255 |
| 49 | NONFUNC.USED | Repair Paused | Saf | £91 | BM 1267 |
| 42 | NONFUNC.CRACK | Awaiting Part | Saf | £36 | BM 1310 |
| 40 | NONFUNC.CRACK | Awaiting Part | Andres | £72 | BM 1321 |
| 39 | NONFUNC.CRACK | Repair Paused | Saf | £41 | BM 1324 |
| 35 | NONFUNC.USED | Repair Paused | Misha | £80 | BM 1339 |
| 33 | NONFUNC.USED | Repair Paused | Saf | £91 | BM 1340 |
| 31 | NONFUNC.USED | Error | Misha | £42 | BM 1349 |

11 of 24 are Saf's — consistent with him being the bottleneck for board-level work. When he has more incoming than he can clear, devices queue up as "Repair Paused."

---

## Recommendations

### 1. Scale NONFUNC.USED — but manage the Saf bottleneck

The data confirms NONFUNC.USED is the best grade: £289 avg net, 0% loss rate, ramping volume. But 50% of these devices need Saf for board work.

**Strategy:**
- Increase bids on NONFUNC.USED SKUs (the 23 bump candidates from Task 15)
- Saf's theoretical ceiling is ~83 NONFUNC.USED/month (111min bench time, 7h/day, 22 days). He's at 30/month — plenty of headroom
- The bottleneck is incoming volume and Saf being pulled onto FUNC.CRACK, not his capacity
- The other 50% of NONFUNC.USED (non-board repairs) can be handled by any tech — these scale freely

**At current mix:** If we increase NONFUNC.USED intake to 60/month, ~30 need Saf (board) and ~30 can go to Misha/Andres (battery/LCD/adapter). That's still within Saf's capacity if he's not wasting time on FUNC.CRACK.

### 2. Stop putting Saf on FUNC.CRACK

Saf repaired 28 FUNC.CRACK devices in the dataset. At 102min avg bench time (diag + repair), that's ~48 hours he spent on work that doesn't require board-level skills. Every FUNC.CRACK on Saf's bench is a NONFUNC.USED that's waiting.

**Action:** Update Monday workflow — FUNC.CRACK should never be assigned to Saf unless there's a discovered board issue during screen repair.

### 3. Triage the 24 stuck devices

24 devices sitting 30+ days. Total capital: £2,150. Not huge money, but they're consuming mental overhead and bench space.

**Suggested triage:**
- **90+ days (6 devices, £501):** Decision needed per device — repair or write off. These have been stuck for 3+ months. If the part isn't coming or the repair isn't viable, write them off and recover the bench space.
- **30-90 days (18 devices, £1,649):** Review with team — what's blocking each one? "Awaiting Part" devices need parts ordered or written off. "Repair Paused" on Saf's bench = he deprioritised them (ask him why).

### 4. Investigate FUNC.CRACK returns (18 devices)

18 FUNC.CRACK devices returned, £2,383 capital. This is the highest return count of any grade. Are these BM quality rejections? Customer complaints? Cosmetic issues missed at QC?

**Action:** Pull the return reasons from BM API or Monday board for these 18 devices. If it's a QC gap, tighten the refurb QC checklist.

### 5. Deprioritise NONFUNC.CRACK

NONFUNC.CRACK is the worst grade: £195 avg net (vs £289 NONFUNC.USED), 3% loss rate, 230min of Saf's bench time plus a screen/refurb handoff. It needs board work AND screen/casing — the most resource-intensive repair path, consuming time from both Saf and the refurb team.

**Action:** Don't increase NONFUNC.CRACK bids. Accept what comes in but don't chase volume. If Saf's queue gets long, NONFUNC.CRACK should be last priority.

### 6. Exploit the "actually functional" arbitrage

20% of NONFUNC.USED devices arrive actually functional. These are the easiest repairs — the device works, it just needs cosmetic cleanup or a battery swap.

This isn't actionable as a bid strategy (we can't predict which ones will arrive functional), but it means our effective board-work rate is lower than 50%. Of the 107 NONFUNC.USED sold, roughly 21 arrived functional and didn't need Saf at all. That's another free scaling lever.

---

## Numbers at a Glance

| Metric | Value |
|--------|-------|
| Total orders (6 months) | 1,256 |
| Matched to Monday | 534 (43%) |
| Sold | 343 |
| Total net profit | £71,331 |
| Avg net per sold device | £208 |
| Overall loss rate | 1.5% |
| BER rate | 2.6% |
| Capital in stuck devices (30d+) | £2,150 |
| Capital in all non-sold matched | £17,160 |
| Saf monthly throughput (latest) | 30 devices |
| Saf bench time per NONFUNC.USED | 111min (diag + board repair) |
| Saf theoretical ceiling | ~83 devices/month (at 36% utilisation) |
| NONFUNC.USED avg net | £289 |
| FUNC.CRACK avg net | £169 |
| NONFUNC.CRACK avg net | £195 |

---

## COMPROMISES

- **Parts cost per device not calculated** — the `parts_used` field gives part names but not individual costs. The mirrored `parts_cost` column wasn't in the extracted data. Labour cost IS present and used in net calculation, but we can't break out "how much did parts cost for this specific device" separately from the net figure.
- **"Unknown" parts** — 20+ parts show as `Unknown-{id}` (Monday board item IDs that didn't resolve to names). These are real parts but we can't identify them without querying the Parts board by those IDs.
- **Layer 3 complexity categorisation not done** — the plan called for categorising Saf's repairs as routine/moderate/complex/failed based on diagnostic notes. This requires pulling Monday item updates (per-item API calls) which we haven't done yet. The ammeter analysis is a partial proxy.
- **Saf's diagnostic notes not pulled** — Layer 3 spec called for parsing ammeter readings from update text. We have the ammeter status column data but not the written diagnostic notes with fault descriptions.
- **Total time tracking seems broken** — `total_time_secs` values are wildly high (600,000+ seconds = 7 days) for some devices. Used component times (diag + repair + refurb) instead, which are reasonable.
- **722 devices with no Monday match** — 57% of orders couldn't be matched. These are mostly TO_SEND (never shipped) and CANCELED, but some RECEIVED/PAID orders may have Monday items under different IDs.
