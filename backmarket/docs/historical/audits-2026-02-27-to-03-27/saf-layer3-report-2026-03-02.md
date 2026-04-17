# Layer 3: Saf's Repair Complexity — Deep Dive

**Date:** 2 March 2026
**Data source:** 150 devices where Saf is repair_person, 146 with diagnostic notes
**Script:** `api/bm-saf-diagnostics.py`
**Data:** `audit/saf-diagnostics-2026-03-02.json`
**Parent report:** `audit/repair-analysis-report-2026-03-02.md`

---

## Executive Summary

35% of Saf's logic board repairs are complex (liquid damage, multi-fault). 32% are routine (single component). 31% are moderate. Liquid damage is the #1 fault (49 devices, 33% of all Saf repairs) — these are specialist-only and not teachable.

The 17 FUNC.CRACK devices assigned to Saf without a logic board part are NOT misassignments. Saf's notes show he was diagnosing board-level issues, doing component repairs (charging ports, keyboard backlights, display flex, touch bars), then handing off for screen work. These devices needed Saf's diagnostic skill to identify what was actually wrong.

**Teachable repairs (routine): ~32% of logic board work.** Mostly battery + keyboard combos, single IC swaps, and backlight fixes. With training, Misha or Andres could handle these — freeing Saf for the 35% complex work that only he can do.

---

## Saf's Notes Coverage

| Metric | Value |
|--------|-------|
| Devices analysed | 150 |
| With Saf's written notes | 146 (97%) |
| With identifiable fault keywords | 128 (85%) |
| Notes source | Monday item update replies (Saf writes as "Safan Patel") |

Saf writes detailed repair notes as replies to the Systems Manager automation updates. Notes include ammeter readings, fault descriptions, parts replaced, and handoff instructions to other techs.

---

## Repair Complexity (92 Logic Board Devices)

| Complexity | Count | % | Description |
|------------|-------|---|-------------|
| **Routine** | 30 | 32% | Single component swap, known fault pattern |
| **Moderate** | 29 | 31% | Multi-component, probing required but predictable |
| **Complex** | 33 | 35% | Liquid damage trace work, multi-fault, T2/CPU |
| **Failed** | 0 | 0% | — |

### By grade (logic board devices only)

| Grade | Routine | Moderate | Complex |
|-------|---------|----------|---------|
| NONFUNC.USED | 13 (24%) | 21 (39%) | 20 (37%) |
| NONFUNC.CRACK | 7 (44%) | 2 (12%) | 7 (44%) |
| FUNC.CRACK | 8 (31%) | 6 (23%) | 6 (23%) |

NONFUNC.CRACK has the highest ratio of complex repairs (44%). NONFUNC.USED sits at 37% complex. FUNC.CRACK board work is more often routine (31%) — the board issues found during screen repair tend to be simpler.

---

## Top Fault Patterns

| Fault | Count | % of all Saf devices | Teachable? |
|-------|-------|---------------------|------------|
| **Liquid Damage** | 49 | 33% | No — trace-level work, unpredictable |
| **Keyboard** | 48 | 32% | Partially — keyboard swap is routine, but often paired with board faults |
| **Battery** | 30 | 20% | Yes — battery replacement is routine |
| **Charging IC** | 23 | 15% | Moderate — IC identification needs board skills, swap itself is learnable |
| **Short Circuit** | 16 | 11% | No — requires board-level probing and diagnosis |
| **T2 Chip** | 9 | 6% | No — specialist swap, requires BGA rework |
| **Audio IC** | 9 | 6% | Moderate — often means ordering audio board, not IC-level |
| **Display IC** | 4 | 3% | Moderate — display flex vs IC needs diagnosis |
| **CPU Issue** | 4 | 3% | No — specialist only |
| **NAND Flash** | 4 | 3% | No — data recovery + chip work |
| **SSD Controller** | 2 | 1% | No — specialist |
| **Power IC** | 2 | 1% | Moderate — identifiable fault, learnable swap |

### Fault combinations

Liquid damage rarely comes alone. Common combos from Saf's notes:
- **Liquid + Keyboard** — liquid reaches keyboard flex, corrodes connections
- **Liquid + Charging IC** — charging port area is often first point of liquid entry
- **Liquid + T2** — severe liquid damage reaches the T2 chip, requiring BGA rework
- **Battery + Keyboard** — often on older models (butterfly keyboards), straightforward

---

## What's Teachable vs Specialist-Only

### Teachable (could train Misha/Andres) — ~32% of LB work

| Repair Type | Example from Saf's Notes | Training Required |
|-------------|-------------------------|-------------------|
| Battery + keyboard backlight | "we change new keyboard back light and battery" | Low — component swap, no board probing |
| Single known IC swap | "we replace ic (u8250)" when fault is documented | Medium — needs IC identification training |
| Screen flex / display flex | "screen flex got issue that why camera not working" | Low — diagnostic skill, straightforward fix |
| Touch bar replacement | "we repair battery and touch bar" | Low — component swap |
| Charging port swap (no board damage) | "charging port damage... repair new charging port" | Low-Medium — identify port vs IC issue |

### Specialist-Only (Saf keeps) — ~35% of LB work

| Repair Type | Example from Saf's Notes | Why Specialist |
|-------------|-------------------------|----------------|
| Liquid damage trace work | "logic board has lot's off liquid damage, need T2 swap, screen back light, track pad, maybe keyboard" | Unpredictable scope, multi-fault, requires probing every circuit |
| T2 chip swap | "we repair T2 swap and macbook working fine" | BGA rework, specialist equipment |
| Multi-fault diagnosis | "we found one ic explosion on logic board (u8250) after we replace ic but still same" | Cascading faults need iterative diagnosis |
| CPU/GPU issues | "CPU issue" — rare but specialist only | Reball or replacement, high risk |
| Short circuit probing | "found short on PPBUS" | Requires thermal imaging + board-level knowledge |

### Grey Area (moderate — could teach with time) — ~31% of LB work

Charging IC replacements, audio board issues, and multi-component repairs where the fault pattern is known but requires board probing to confirm. These could become teachable after 3-6 months of Saf mentoring a second tech.

---

## FUNC.CRACK Investigation

### Why Saf gets assigned to FUNC.CRACK devices

37 FUNC.CRACK devices had Saf as repair_person. This is NOT Saf doing screen swaps.

**20 with logic board part (54%):** Board issue was discovered during or before screen repair. Saf did board-level work, then handed off for screen replacement.

**17 without logic board part (46%):** Saf's notes reveal he was assigned for diagnostic/component work that isn't a screen swap:

| Work Done | Count | Example Note |
|-----------|-------|-------------|
| Keyboard backlight / key repair | 5 | "we change new keyboard back light and battery" |
| Charging port repair | 2 | "charging port damage and liquid damage we clan logic bard and repair new charging port" |
| Display flex / camera fix | 3 | "screen flex got issue that why camera not working" |
| Battery + touch bar | 2 | "we repair battery and touch bar" |
| Logic board check (cleared) | 2 | "No liquid damage on logic board macbook is ready put new screen" |
| Logic board swap from donor | 1 | "we swap logic from BM 1451 now 8RAM/256GB" |
| Audio board order | 2 | "please can you oder audio logic board" |

**Conclusion:** Saf's FUNC.CRACK assignments are justified. He's either finding board issues that weren't expected, or doing component-level diagnosis/repair that other techs can't do. The earlier recommendation to "stop putting Saf on FUNC.CRACK" was wrong — he's there because he's needed.

**Revised recommendation:** Don't remove Saf from FUNC.CRACK. Instead, ensure FUNC.CRACK devices go to Misha/Andres first for screen assessment. If they discover a board issue or component fault beyond their skill, THEN escalate to Saf. This is likely already happening based on the notes — the workflow is correct.

---

## Ammeter Readings vs Outcomes (Logic Board Devices)

| Reading | Total | Sold | Stuck | BER | Avg Net |
|---------|-------|------|-------|-----|---------|
| 5V | 25 | 24 | 0 | 0 | £310 |
| 20V + 1.5A or higher | 38 | 35 | 0 | 0 | £168 |
| 20V + ~1A (low amp) | 8 | 8 | 0 | 0 | £220 |
| Unknown | 21 | 21 | 0 | 0 | £198 |

**5V devices are the most profitable** (£310 avg net) — these have a board-level power issue that Saf repairs, creating the most value-add. They also have the highest repair risk, but Saf's success rate on these is excellent (24/25 sold).

**20V + high amps** are the "easy" NONFUNC — board might need a minor fix or issue is elsewhere. Lower margin (£168) because the purchase price tends to be higher for devices that partially work.

---

## The 50/50 Split (NONFUNC.USED)

83 NONFUNC.USED devices assigned to Saf. 54 (65%) had logic board parts. 28 (34%) had no board work needed.

The no-board-work devices needed: batteries, keyboard backlights, display flex, adapters. Any tech could handle these once diagnosed — but Saf is currently doing the initial diagnosis on all of them because he's the default for NONFUNC.

**Opportunity:** If Saf diagnoses a NONFUNC.USED device and determines it's NOT a board issue, hand it off immediately to Misha/Andres. Saf's diagnosis time is ~32min — that's the only Saf time these devices should consume. Currently he's sometimes doing the full repair too.

---

## Capacity Implications

| Scenario | Saf's Monthly Board Work | Notes |
|----------|------------------------|-------|
| **Current** | ~30 devices/month | Mix of all grades + non-board work |
| **Optimised (board only)** | ~45-50 devices/month | Remove non-board NONFUNC.USED + reduce FUNC.CRACK diag |
| **With trained 2nd tech** | ~60-70 devices/month (Saf) + 15-20 (trained tech on routine) | Saf focuses complex, trained tech handles routine |
| **Theoretical ceiling** | ~83 devices/month | 111min/device, 7h/day, 22 days |

The immediate win is getting Saf off non-board repairs. That alone could take him from 30 to 45-50/month without any upskilling investment. The 32% routine repairs (~10/month at current volume) are the upskilling target.

---

## Recommendations (Updated from Layer 2)

### 1. Keep Saf on NONFUNC.USED and NONFUNC.CRACK — increase volume

The data confirms NONFUNC.USED is the best grade. Saf's notes show he handles both routine and complex repairs effectively. Increase bids as planned.

### 2. Don't remove Saf from FUNC.CRACK — the workflow is correct

Saf gets FUNC.CRACK devices that need board-level diagnosis or component repair beyond screen swaps. The current escalation path (screen team finds issue → Saf diagnoses/repairs → hands back) is working.

### 3. Fast-track non-board NONFUNC.USED off Saf's bench

34% of NONFUNC.USED devices Saf handles don't need board work. After Saf's 32min diagnosis, if it's battery/keyboard/LCD → hand off immediately to Misha/Andres. Don't wait for Saf to do the full repair.

### 4. Upskilling target: routine board repairs (32%)

Battery + keyboard backlight combos, single IC swaps, screen flex repairs. 30 of 92 LB devices were routine. Train one tech (probably Misha — he already handles the handoff stage) over 3-6 months with Saf mentoring. Start with the simplest: battery + keyboard backlight on non-liquid-damage devices.

### 5. Accept that 35% of board work is specialist-only

Liquid damage, T2 swaps, multi-fault diagnosis, CPU issues. This will always be Saf. The upskilling goal is to free him up so he can focus on these high-value, high-complexity repairs.

---

## COMPROMISES

- **Complexity categorisation is keyword-based** — automated classification from Saf's notes using fault keyword matching. Not validated by Saf himself. Some repairs may be mis-categorised (e.g. "keyboard" might be a simple swap or a board-level trace repair depending on context).
- **Liquid damage = complex by default** — any mention of liquid/water/corrosion triggers "complex" classification. Some liquid damage repairs are actually moderate (localised spill, single area), but we can't distinguish from keywords alone.
- **4 devices had no Saf notes** — classified based on parts data only.
- **"No board work" devices still went through Saf** — the data shows Saf as repair_person even when no LB part was used. This means Saf is spending diagnostic time on devices that don't need him, confirming the efficiency opportunity.
- **Ammeter data is from the Monday column, not parsed from notes** — the column values and note values may differ. The column is more reliable for aggregation.
