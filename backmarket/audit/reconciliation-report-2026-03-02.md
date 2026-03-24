# BM Trade-In Reconciliation Report

**Date:** 2 March 2026
**Data source:** 1,256 BM orders (6-month window from Sep 2025), cross-referenced against Monday BM board + Main board
**Purpose:** Verify every device BM considers shipped/received/paid is actually tracked and processed on our side

---

## Summary

BM records show **498 devices** were shipped, received, or paid in the last 6 months.

| Category | Count | % |
|----------|------:|--:|
| Matched & processed on Monday | 458 | 92% |
| Matched but stuck/needs attention | 32 | 6% |
| Found on main board (missing BM board link) | 2 | 0.4% |
| **Genuinely missing — no Monday record** | **6** | **1.2%** |

**98.8% accounted for.** 6 devices are completely untracked.

---

## The 6 Missing Devices

BM says these were shipped and paid. We have no record of them on either Monday board. BM API confirms all 6 have Royal Mail tracking numbers and receival dates — BM definitely received these at our premises.

| Order ID | Grade | Device | BM Offer | Tracking | BM Received | BM Paid | Notes |
|----------|-------|--------|----------|----------|-------------|---------|-------|
| GB-26053-BURRH | FUNC.CRACK | MBP 14" (2021) | £245 | YR546696904GB | 18 Feb | 20 Feb | |
| GB-26063-LSMJW | FUNC.CRACK | MBA 13" (2020) | £129 | YR558965912GB | 18 Feb | 20 Feb | |
| GB-26014-XYUFE | NONFUNC.USED | MBP 13" (2020) | £98 | YR434984137GB | 16 Jan | 23 Jan | Was suspended: customer account still active |
| GB-25522-KYPDX | NONFUNC.USED | MBA 13" (2020) | £97 | YR315727827GB | 7 Jan | 9 Jan | |
| GB-25485-BFHQG | FUNC.CRACK | MBA 13" (2020) | £100 | YR210644924GB | 15 Dec | 16 Dec | |
| GB-25393-XXOAL | NONFUNC.USED | MBA 13" (2020) | £62 | OY844452686GB | 26 Sep | 17 Oct | Was suspended: customer account still active |

**Total capital exposure: £731**

The two Feb orders (BURRH and LSMJW) are the most recent — likely still in the workshop somewhere. The older ones (Sep–Jan) are more concerning. Two were suspended for "customer account still active" which may explain a processing gap.

### Action Required

1. Ferrari/team to physically check the workshop for these 6 devices — use the tracking numbers to verify Royal Mail delivery
2. If found: create BM board items + main board items, link to BM orders, process as normal
3. If not found: raise with BM — they have receival dates and tracking showing delivery to us
4. Pay special attention to GB-26014-XYUFE and GB-25393-XXOAL — these were suspended for "customer account still active", may have been returned without being logged

---

## 2 Orders on Main Board But No BM Board Item

These are on the main board (Saf is actively working on them) but have **no BM board item at all**. They can't be auto-linked because there's nothing to link from. BM board items need to be created manually.

| Order ID | Main Board Item | Group | Status | Received | Tech | Tracking |
|----------|----------------|-------|--------|----------|------|----------|
| GB-26052-PRBJO | BM 1389 (Sacha Rhys Johnson) | Safan (Short Deadline) | Repair Paused | 6 Feb 2026 | Saf | YR543817696GB |
| GB-26085-VLXUG | BM 1483 (Conor Martin) | Safan (Short Deadline) | Battery Testing | 25 Feb 2026 | Saf | YR713924119GB |

Both also have **duplicate entries** in "Incoming Future" (BM 1394 and BM 1492) marked as "Expecting Device".

### Action Required

1. Create BM board items for GB-26052-PRBJO and GB-26085-VLXUG, then link to BM 1389 and BM 1483 respectively
2. Delete or archive the duplicate "Incoming Future" items (BM 1394 and BM 1492)

---

## 32 Stuck Devices

On Monday, linked to BM orders, but not progressing. £3,130 capital tied up.

### By Status

| Monday Status | Count | Notes |
|---------------|------:|-------|
| BER/Parts | 12 | Written off or stripped — need formal decision |
| Book Return Courier | 12 | Waiting to be returned to BM — are these actually being shipped? |
| Received | 5 | Recently received, likely in normal flow |
| Error | 3 | Something went wrong — needs triage |

### BER/Parts (12 items, £625 tied up)

These have been deemed beyond economic repair. Decision needed: strip for parts, write off, or return to BM.

| Item | Device | Grade | Received | Purchase |
|------|--------|-------|----------|----------|
| BM 930 | MBP 16" (2019) | NONFUNC.USED | 9 Sep | £20 |
| BM 957 | MBA 13" (2020) | NONFUNC.USED | 22 Sep | £76 |
| BM 1165 | MBA 13" (2020) | FUNC.CRACK | 9 Dec | £109 |
| BM 1192 | MBP 13" (2020) | NONFUNC.CRACK | 18 Dec | £41 |
| BM 1193 | MBA 13" (2020) | NONFUNC.USED | 18 Dec | £88 |
| BM 1273 | MBA 13" (2020) | NONFUNC.USED | 8 Jan | £47 |
| BM 1294 | MBA 13" (2025) | NONFUNC.USED | 16 Jan | £1 |
| BM 1302 | MBA 13" (2020) | NONFUNC.CRACK | 19 Jan | £36 |
| BM 1305 | MBA 13" (2020) | NONFUNC.USED | 19 Jan | £50 |
| BM 1381 | MBP 13" (2020) | NONFUNC.USED | 3 Feb | £71 |
| BM 1452 | MBP 13" (2020) | NONFUNC.USED | 19 Feb | £105 |
| BM 1458 | MBP 13" (2020) | NONFUNC.USED | 19 Feb | £91 |

### Book Return Courier (12 items, £1,506 tied up)

Marked for return but still sitting here. These need to actually be shipped back.

| Item | Device | Grade | Received | Purchase |
|------|--------|-------|----------|----------|
| BM 1392 | MBP 13" (2020) | NONFUNC.USED | 9 Feb | £89 |
| BM 1409 | MBP 14" (2023) | NONFUNC.CRACK | 11 Feb | £182 |
| BM 1411 | MBP 13" (2020) | NONFUNC.CRACK | 11 Feb | £40 |
| BM 1417 | MBP 13" (2020) | FUNC.CRACK | 16 Feb | £145 |
| BM 1434 | MBA 13" (2020) | FUNC.CRACK | 18 Feb | £117 |
| BM 1439 | MBA 13" (2022) | NONFUNC.CRACK | 18 Feb | £91 |
| BM 1449 | MBA 13" (2022) | FUNC.CRACK | 19 Feb | £129 |
| BM 1457 | MBP 13" (2020) | NONFUNC.USED | 19 Feb | £91 |
| BM 1466 | MBP 14" (2021) | FUNC.CRACK | 24 Feb | £248 |
| BM 1468 | MBP 13" (2020) | FUNC.CRACK | 24 Feb | £139 |
| BM 1472 | MBA 13" (2020) | FUNC.CRACK | 24 Feb | £117 |
| BM 1474 | MBA 13" (2020) | FUNC.CRACK | 24 Feb | £117 |

### Error (3 items, £306 tied up)

| Item | Device | Grade | Received | Purchase |
|------|--------|-------|----------|----------|
| BM 1424 | MBA 13" (2020) | FUNC.CRACK | 13 Feb | £117 |
| BM 1464 | MBA 13" (2020) | NONFUNC.CRACK | 24 Feb | £72 |
| BM 1467 | MBA 13" (2020) | FUNC.CRACK | 24 Feb | £117 |

---

## Overall Numbers

| Metric | Value |
|--------|-------|
| Total BM orders (6 months) | 1,256 |
| Cancelled by BM | 300 |
| Customer hasn't sent (TO_SEND) | 448 |
| Suspended | 10 |
| Shipped/received/paid | 498 |
| Accounted for on Monday | 492 (98.8%) |
| Missing from Monday | 6 (1.2%) |
| Capital at risk (missing) | £731 |
| Capital tied up (stuck) | £3,130 |
| **Total unresolved capital** | **£3,861** |

---

## Action Summary

| Priority | Action | Owner |
|----------|--------|-------|
| High | Physically locate 6 missing devices — use tracking numbers to verify Royal Mail delivery | Ferrari/team |
| High | Ship the 12 "Book Return Courier" devices back to BM | Ferrari/team |
| Medium | Create BM board items for GB-26052-PRBJO and GB-26085-VLXUG, link to main board | Adil |
| Medium | Delete duplicate "Incoming Future" items (BM 1394, BM 1492) | Adil |
| Medium | Triage 3 "Error" items — what went wrong? | Ferrari |
| Low | Decide on 12 BER/Parts items — strip, write off, or return | Ferrari/Ricky |
| Low | If missing devices not found, dispute with BM (they have tracking + receival dates) | Ricky |
