# Repair Analysis Report — BM Buyback Devices

**Date:** 2 March 2026
**Data source:** 1,256 BM trade-in orders (last 6 months), 534 matched to Monday main board
**Script:** `api/bm-repair-analysis.py`
**Data:** `audit/repair-analysis-data-2026-03-02.json`
**Reference:** `docs/repair-analysis-plan.md`

**Financial methodology:** Net = Sale - Purchase - BM Fee - Tax - Parts Cost - Labour - Shipping. Parts cost from Parts board `supply_price` column. Labour from Main board `formula__1` (RR&D hours) x £15/hr. Shipping flat £15.

---

## Executive Summary

347 devices sold at £159 avg net, 3.2% loss rate (11 devices). NONFUNC.USED confirmed as best grade: £250 avg net, 0% loss rate. FUNC.CRACK is £116 avg net with 4% losses — parts cost (£71 avg) eats into margins.

**Saf is the sole logic board repair capability** — every board-level repair goes through him. 50% of NONFUNC.USED devices need board work. Saf's bench time is 111min per NONFUNC.USED (diag + board repair only — screen/refurb is handed off to Misha/Andres). His theoretical ceiling is ~83 devices/month; he's at 30/month (36% utilisation). The bottleneck isn't Saf's capacity — it's him being pulled onto FUNC.CRACK and incoming volume.

24 devices stuck 30+ days with £2,150 capital tied up. 14 BER. 101 total in the pipeline (stuck + active repair).

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

Capital = purchase price paid for the device.

**Key insight:** Only 38% of accepted orders (478/1,256) actually arrive at the workshop. 300 cancel, 448 never ship. The 6/day acceptance cap means ~2.2 devices/day actually received.

### Sold device performance

| Metric | Value |
|--------|-------|
| Devices sold | 347 |
| Avg net profit | £159 |
| Total net profit | £55,178 |
| Loss rate | 3.2% (11 devices) |
| Avg parts cost | £50 |
| Avg labour cost | £41 |

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

---

## Layer 2: Grade x Tech Performance

### Grade summary (sold devices only)

| Grade | Sold | Avg Net | Avg Parts | Avg Labour | Total Net | Loss Rate | Avg Turnaround |
|-------|------|---------|-----------|------------|-----------|-----------|----------------|
| **NONFUNC.USED** | 107 | **£250** | £27 | £35 | £26,752 | **0%** | 11d (median 6d) |
| **NONFUNC.CRACK** | 37 | **£134** | £61 | £54 | £4,970 | **5%** | 12d (median 6d) |
| **FUNC.CRACK** | 167 | **£116** | £71 | £43 | £19,345 | **4%** | 8d (median 5d) |

NONFUNC.USED: highest margin by far, zero losses, lowest parts cost (£27 avg — many don't need parts).
FUNC.CRACK: highest volume but parts-heavy (£71 avg — screen replacements are expensive). 4% loss rate.
NONFUNC.CRACK: worst grade — lowest net, highest loss rate, longest Saf bench time.

### Tech performance by grade

#### NONFUNC.USED

| Tech | Devices | Sold | Avg Net | Avg Parts | Avg Labour | Loss | BER | Stuck |
|------|---------|------|---------|-----------|------------|------|-----|-------|
| **Saf** | 89 | 65 | £262 | £27 | £35 | 0% | 6 | 11 |
| Misha | 28 | 19 | £258 | £31 | £41 | 0% | 0 | 1 |
| Andres | 19 | 15 | £201 | £34 | £35 | 0% | 0 | 0 |
| Roni | 13 | 4 | £193 | £10 | £38 | 0% | 2 | 3 |

Saf handles 51% of all NONFUNC.USED — and every device that needs board-level work passes through him regardless of who is listed as technician. The workflow is: Saf does diag + board repair, then hands off to Misha/Andres for screen replacement + cosmetic refurb. Saf does not do screen work. The Repair column reflects Saf's board work; the Refurb column reflects the handoff stage done by Misha/Andres.

#### NONFUNC.CRACK

| Tech | Devices | Sold | Avg Net | Avg Parts | Avg Labour | Loss | BER | Stuck |
|------|---------|------|---------|-----------|------------|------|-----|-------|
| **Saf** | 25 | 14 | £140 | £43 | £66 | 14% | 0 | 3 |
| Andres | 17 | 9 | £117 | £102 | £47 | 0% | 0 | 1 |
| Misha | 14 | 10 | £140 | £58 | £43 | 0% | 0 | 1 |
| Roni | 4 | 2 | £206 | £7 | £46 | 0% | 1 | 0 |

Saf has a 14% loss rate on NONFUNC.CRACK (2 of 14). These need board work + screen/casing — the most resource-intensive and riskiest repair path. Andres has £102 avg parts cost — screen replacements on cracked + non-functional devices are expensive.

#### FUNC.CRACK

| Tech | Devices | Sold | Avg Net | Avg Parts | Avg Labour | Loss | BER | Stuck |
|------|---------|------|---------|-----------|------------|------|-----|-------|
| **Andres** | 84 | 69 | £99 | £74 | £32 | 4% | 0 | 2 |
| **Misha** | 74 | 46 | £150 | £83 | £38 | 0% | 0 | 5 |
| **Saf** | 35 | 28 | £129 | £50 | £48 | 7% | 1 | 2 |
| **Roni** | 28 | 23 | £128 | £65 | £30 | 0% | 0 | 0 |

FUNC.CRACK is evenly distributed across all techs. Misha gets the highest net (£150) — likely assigned higher-value devices. **Note:** Saf's FUNC.CRACK assignments were initially flagged as wasteful, but Layer 3 analysis (see `saf-layer3-report-2026-03-02.md`) proved they're justified — he's doing board-level diagnosis and component repairs, not screen swaps.

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

**Function mismatch:** 20% of NONFUNC.USED devices arrive actually functional. 46% of NONFUNC.CRACK arrive functional. BM's grading is conservative — we're getting easier repairs than expected on a meaningful chunk.

**Casing** is consistently overstated across all grades (reported as Good/Excellent, arrives Fair). Universal BM seller behaviour.

### Parts usage patterns (sold devices)

**NONFUNC.USED (avg parts £27):**
- 50% need a logic board (Saf's work)
- 50% fixed without board replacement (battery, adapters, keyboard backlight, LCD)
- 3% needed zero parts

**NONFUNC.CRACK (avg parts £61):**
- 100% needed parts (board + screen)
- 32% need logic board + 27% need LCD-A2337

**FUNC.CRACK (avg parts £71):**
- 99% needed parts
- 36% LCD-A2337 (M1 Air screen swap is the bread and butter)
- Only 7% needed logic board

---

## Layer 3: Logic Board Deep Dive

### Saf is the sole board-level repair capability

97 devices in the dataset used a logic board part. The "technician" field shows current assignee, not who did the board work. Checking the `repair_person` field: Saf did every logic board repair. Devices then passed to Misha/Andres for screen and refurb.

**Saf does every logic board repair. No one else in the team has board-level skills.**

### Saf's actual bench time (diag + board repair only)

Saf does diagnosis and board-level repair. He does not do screen replacements or cosmetic refurb — those are handed off to Misha/Andres.

| Grade | Avg Diag | Avg Repair | **Saf bench (diag+repair)** | Refurb (handoff) |
|-------|----------|------------|----------------------------|------------------|
| NONFUNC.USED | 32min | 80min | **111min** | 99min (Misha/Andres) |
| NONFUNC.CRACK | 36min | 197min | **230min** | 100min (Misha/Andres) |
| FUNC.CRACK | 38min | 67min | **102min** | 134min (Misha/Andres) |

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

**Theoretical ceiling:** At 7 effective hours/day and 111min/device, Saf can do ~3.8 NONFUNC.USED devices/day = **83/month**. He's at 30/month — running at 36% of theoretical capacity. The bottleneck isn't Saf's hours, it's incoming volume and devices queued on other priorities (FUNC.CRACK, NONFUNC.CRACK).

### Ammeter readings vs outcomes (NONFUNC.USED)

| Reading | Total | Sold | BER | Stuck | Sold Avg Net |
|---------|-------|------|-----|-------|-------------|
| 5V | 58 | 38 | 2 | 9 | £268 |
| 20V + 1.5A or higher | 47 | 33 | 2 | 3 | £237 |
| 20V + ~1A (low amp) | 16 | 14 | 0 | 1 | £218 |

**5V devices** (board-level power issue) have the highest net but most stuck devices (9). Harder repairs, more profitable when they work.

**20V + 1.5A or higher** (charging normally) — "easy" NONFUNC. Board might need a minor fix or issue is elsewhere. Lower stuck rate.

### The 50/50 split

| Category | Sold | Avg Net |
|----------|------|---------|
| With logic board | 53 | £259 |
| Without logic board | 54 | £241 |

Devices needing board work are slightly more profitable (+£18). Non-board NONFUNC.USED repairs use batteries, adapters, LCD panels, keyboard backlights — any tech can handle these.

---

## Loss-Making Devices (11 total)

| Device | Grade | Net | Parts | Sale | Purchase |
|--------|-------|-----|-------|------|----------|
| BM 1086 | FUNC.CRACK | -£989 | £0 | £357 | £0 |
| BM 1366 | NONFUNC.CRACK | -£69 | £187 | £349 | £72 |
| BM 1185 | UNKNOWN | -£174 | £0 | £315 | £172 |
| BM 1286 | NONFUNC.CRACK | -£224 | £8 | £387 | £91 |
| BM 1289 | UNKNOWN | -£126 | £0 | £550 | £308 |
| BM 1403 | FUNC.CRACK | -£53 | £115 | £341 | £156 |
| BM 1330 | FUNC.CRACK | -£28 | £151 | £439 | £139 |
| BM 1317 | UNKNOWN | -£19 | £48 | £359 | £234 |
| BM 1318 | FUNC.CRACK | -£12 | £134 | £383 | £137 |
| BM 1421 | FUNC.CRACK | -£11 | £134 | £349 | £92 |
| BM 1307 | FUNC.CRACK | -£9 | £114 | £387 | £156 |

**Pattern:** 6 of 11 losses are FUNC.CRACK — parts cost (£114-£151) is the killer. When a screen replacement costs £134+ and the device was purchased at £92-£156, margins evaporate. 0 losses on NONFUNC.USED.

---

## BER Devices (14 total, £735 capital)

BER rate: 2.6% of matched devices. Most BER devices were cheap purchases (avg £53). Intel MBP16 2019 and Intel i3 MBAs are the most common — old architecture, expensive to fix.

---

## Returned Devices (34 total, £4,031 capital)

| Grade | Count | Capital |
|-------|-------|---------|
| FUNC.CRACK | 18 | £2,383 |
| NONFUNC.USED | 8 | £608 |
| NONFUNC.CRACK | 6 | £326 |

FUNC.CRACK has the most returns (18). Needs investigation — QC gap or cosmetic issues post-refurb?

---

## Stuck Devices 30+ Days (24 devices, £2,150)

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

11 of 24 are Saf's — consistent with him being the bottleneck for board-level work.

---

## Recommendations

### 1. Scale NONFUNC.USED — the margins justify it

NONFUNC.USED is the clear winner: £250 avg net, 0% loss rate, lowest parts cost (£27 avg). Even with proper parts and labour deducted, it's more than double FUNC.CRACK's net.

**Strategy:**
- Increase bids on NONFUNC.USED SKUs (the 23 bump candidates from Task 15)
- Saf's theoretical ceiling is ~83 NONFUNC.USED/month (111min bench time, 7h/day, 22 days). He's at 30/month — plenty of headroom
- The bottleneck is incoming volume and Saf being pulled onto FUNC.CRACK, not his capacity
- The other 50% of NONFUNC.USED (non-board repairs) can be handled by any tech — these scale freely

**At current mix:** If we increase NONFUNC.USED intake to 60/month, ~30 need Saf (board) and ~30 can go to Misha/Andres (battery/LCD/adapter). That's still within Saf's capacity if he's not wasting time on FUNC.CRACK.

### 2. ~~Stop putting Saf on FUNC.CRACK~~ — CORRECTED by Layer 3 deep dive

~~Saf repaired 28 FUNC.CRACK devices in the dataset. At 102min avg bench time (diag + repair), that's ~48 hours he spent on work that doesn't require board-level skills.~~

**CORRECTION (2 March 2026):** Layer 3 analysis (`audit/saf-layer3-report-2026-03-02.md`) pulled Saf's actual diagnostic notes and found his FUNC.CRACK assignments are justified. 54% had board issues discovered during repair; the other 46% needed component-level diagnosis (keyboard backlight, charging port, display flex, touch bar) that other techs can't do. The current escalation workflow is correct — don't change it.

### 3. Watch FUNC.CRACK parts cost

FUNC.CRACK looks good on volume (167 sold) but parts cost (£71 avg) eats margins. 6 of 11 loss-making devices are FUNC.CRACK where screen replacement cost exceeded the margin. The grade is still net positive overall (£116 avg) but individual device risk is real — 4% loss rate.

**Action:** Review parts pricing for LCD-A2337 and other high-frequency screen parts. If supplier cost can be reduced, FUNC.CRACK margins improve across the board.

### 4. Deprioritise NONFUNC.CRACK

NONFUNC.CRACK is the worst grade: £134 avg net, 5% loss rate, 230min of Saf's bench time plus a screen/refurb handoff. It needs board work AND screen/casing — the most resource-intensive repair path, consuming time from both Saf and the refurb team. Saf's loss rate on this grade is 14%.

**Action:** Don't increase NONFUNC.CRACK bids. Accept what comes in but don't chase volume. If Saf's queue gets long, NONFUNC.CRACK should be last priority.

### 5. Triage the 24 stuck devices

24 devices sitting 30+ days. Total capital: £2,150.

- **90+ days (6 devices, £501):** Decision needed per device — repair or write off.
- **30-90 days (18 devices, £1,649):** Review with team — what's blocking each one?

### 6. Investigate FUNC.CRACK returns (18 devices)

18 FUNC.CRACK devices returned, £2,383 capital. Highest return count of any grade. If it's a QC gap, tighten the refurb checklist.

---

## Numbers at a Glance

| Metric | Value |
|--------|-------|
| Total orders (6 months) | 1,256 |
| Matched to Monday | 534 (43%) |
| Sold | 347 |
| Total net profit | £55,178 |
| Avg net per sold device | £159 |
| Avg parts cost per device | £50 |
| Avg labour cost per device | £41 |
| Overall loss rate | 3.2% (11 devices) |
| BER rate | 2.6% |
| Capital in stuck devices (30d+) | £2,150 |
| Saf monthly throughput (latest) | 30 devices |
| Saf bench time per NONFUNC.USED | 111min (diag + board repair) |
| Saf theoretical ceiling | ~83 devices/month (at 36% utilisation) |
| NONFUNC.USED avg net | £250 (0% loss) |
| FUNC.CRACK avg net | £116 (4% loss) |
| NONFUNC.CRACK avg net | £134 (5% loss) |

---

## COMPROMISES

- **Parts cost coverage:** 268 of 347 sold devices have parts cost > 0. 79 show £0 — either genuinely no parts used, or `supply_price` not populated on the Parts board for those items. The 20+ "Unknown" part IDs couldn't be resolved and have no price data.
- **Labour methodology:** Uses RR&D formula from Monday main board (hours x £15/hr), not raw time tracking. This is the same method as `bm-profit-by-shipdate.py`. Some devices show £0 labour where RR&D wasn't logged.
- **Layer 3 complexity categorisation not done** — Saf's diagnostic notes not pulled (requires per-item Monday API calls). Ammeter analysis is a partial proxy.
- **Total time tracking broken** — `total_time_secs` values are wildly high for some devices. Report uses component times and RR&D instead.
- **722 devices with no Monday match** — mostly TO_SEND (never shipped) and CANCELED.
