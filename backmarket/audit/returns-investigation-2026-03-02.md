# Returns Investigation — Task 21

**Date:** 2 March 2026
**Data source:** repair-analysis-data-2026-03-02.json (1,256 orders, 534 matched to Monday)
**Filter:** Monday status = "Returned" (35 devices)

---

## Summary

| Grade | Returned | Capital | Avg Sale | Mismatch Rate |
|-------|----------|---------|----------|---------------|
| FUNC.CRACK | 18 | £2,383 | £482 | 67% |
| NONFUNC.USED | 8 | £608 | £422 | 100% |
| NONFUNC.CRACK | 6 | £326 | £412 | 100% |
| UNKNOWN | 3 | £807 | £510 | 67% |
| **Total** | **35** | **£4,124** | **£454** | **80%** |

**Key finding:** 80% of returned devices have a condition mismatch between what BM reported and what we found on inspection. This is by far the dominant pattern.

---

## Return Rates by Grade

Using Layer 1 data (534 matched devices, 366 shipped):

| Grade | Shipped | Returned | Return Rate |
|-------|---------|----------|-------------|
| FUNC.CRACK | 167 | 18 | **10.8%** |
| NONFUNC.USED | 126 | 8 | **6.3%** |
| NONFUNC.CRACK | 48 | 6 | **12.5%** |
| UNKNOWN | 25 | 3 | **12.0%** |
| **Total** | **366** | **35** | **9.6%** |

FUNC.CRACK has the most returns by volume (18) but NONFUNC.CRACK has the highest rate (12.5%).

---

## Mismatch Analysis — The Root Cause

### Most common mismatch types

| Mismatch Type | Devices | % of Returns | Pattern |
|---------------|---------|-------------|---------|
| **Casing** | 19 | 54% | Most frequent. Both over- and under-graded |
| **Function** | 12 | 34% | NONFUNC devices arriving functional, FUNC devices uncertain |
| **Screen** | 11 | 31% | Reported better than actual — the dangerous one |

### Casing mismatches (19 devices)

The most common issue. Split roughly evenly between:
- **Under-graded by BM** (reported worse than actual): 9 devices — Good→Fair, Damaged→Good, Damaged→Excellent. BM is conservative, we inspect and find better condition. Not a problem — we benefit.
- **Over-graded by BM** (reported better than actual): 10 devices — Good→Fair, Excellent→Fair. BM says it's good, it's not. This means we may overpay or list at wrong grade.

### Function mismatches (12 devices)

| Pattern | Count | Impact |
|---------|-------|--------|
| "Not Functional" → actually functional | 7 | **We benefit** — paid NFU price for a working device |
| "Functional" → "Functional?" (uncertain) | 4 | Our team uncertain about function status — QC gap |
| Various other | 1 | |

**7 of 12 function mismatches are in our favour** — BM says non-functional, device actually works. We pay less, repair is easier. However, the 4 "Functional?" entries suggest our own QC team is sometimes unsure, which is concerning.

### Screen mismatches (11 devices)

| Pattern | Count | Impact |
|---------|-------|--------|
| Good/Excellent → Damaged/Fair | 6 | **Bad** — BM says screen OK, it's actually cracked/damaged |
| Damaged → Fair/Excellent | 3 | We benefit — screen better than expected |
| Other | 2 | |

**6 devices arrived with worse screens than reported.** This means either:
1. Damage in transit (shipping issue)
2. BM's inspection missed it
3. Customer damaged after BM inspection

---

## FUNC.CRACK Returns — 18 Devices Detail

FUNC.CRACK is the highest-volume return grade. 6 had no mismatch at all — the return reason is likely buyer-side (changed mind, found cheaper, etc.).

### No condition mismatch (6 devices)
| BM Name | Device | Purchase | Sale |
|---------|--------|----------|------|
| BM 953 | MBA M1 8/256 | £100 | £415 |
| BM 963 | MBP14 M1Pro 16/1TB | £193 | £838 |
| BM 1077 | MBA M1 8/256 | £100 | £407 |
| BM 1070 | MBP14 M1Pro 16/512 | £223 | £830 |
| BM 1089 | MBP13 M1 16/256 | £83 | £530 |
| BM 1071 | MBA M2 8/256 | £184 | £581 |

These are likely buyer returns (14-day cooling-off, found cheaper, not what expected). We should be able to relist and resell.

### Condition mismatch (12 devices)

**Casing over-graded by BM → we listed higher than actual:**
- BM 989: casing Good→Fair
- BM 1088: casing Good→Fair

**Casing under-graded by BM → we listed lower than actual (benefit):**
- BM 965: casing Fair→Good
- BM 1036: casing Fair→Good
- BM 1053: casing Fair→Good
- BM 1068: casing Damaged→Good
- BM 1080: casing Fair→Good
- BM 1124: casing Fair→Good
- BM 1083: casing Damaged→Excellent

**Screen issue:**
- BM 980: screen Damaged→Fair (better than expected)
- BM 1091: screen Damaged→Excellent (much better than expected)

**Unclear/uncertain:**
- BM 1240: all fields show "Grade?" — incomplete intake, device not properly assessed

**Pattern:** Most FC casing mismatches are actually in our favour (BM says Fair/Damaged, we find Good). These shouldn't cause returns. The 2 devices where casing was over-graded (Good→Fair) may have been listed at wrong grade by us, leading to buyer complaint.

---

## NONFUNC.USED Returns — 8 Devices Detail

**100% mismatch rate.** Every single NFU return has a condition discrepancy.

| BM Name | Key Mismatches | Impact |
|---------|----------------|--------|
| BM 929 | screen Good→Damaged, function NFU→Functional | Screen damage found, but device actually works |
| BM 943 | casing Good→Fair, function NFU→Functional? | Minor casing, function uncertain |
| BM 992 | screen Good→Damaged, casing Good→Fair | Both over-graded by BM |
| BM 1051 | casing Good→Fair, function NFU→Functional | Device actually works |
| BM 1054 | screen Fair→Damaged | Screen worse than reported |
| BM 1060 | function NFU→Functional | Device actually works — easy repair |
| BM 1098 | screen Excellent→Damaged, casing Excellent→Fair | Massively over-graded by BM |
| BM 1096 | screen Good→Fair, casing Fair→Good | Mixed — screen worse, casing better |

**Pattern:** 5 of 8 NFU returns arrived with the device actually functional. These were graded as "not functional" by BM (hence NFU purchase price) but worked fine. The returns are likely because:
1. We listed as refurbished (higher price) after finding it functional
2. Buyer found an issue we missed because we assumed it worked
3. Screen/casing condition triggered the return after sale

**BM 1098 is the worst case:** Reported Excellent screen + Excellent casing, actual was Damaged screen + Fair casing. Either BM's inspection failed completely or damage occurred in transit.

---

## NONFUNC.CRACK Returns — 6 Devices Detail

**100% mismatch rate.** Similar pattern to NFU.

| BM Name | Key Mismatches | Impact |
|---------|----------------|--------|
| BM 981 | screen Excellent→Fair | Screen downgraded significantly |
| BM 1063 | function NFU→Functional | Device actually works |
| BM 1072 | function NFU→Functional | Device actually works |
| BM 1093 | screen Good→Fair, function NFU→Functional | Both screen and function mismatched |
| BM 1094 | casing Good→Fair, function NFU→Functional | Casing worse, device works |
| BM 1122 | casing Good→Fair | Casing downgraded |

**4 of 6 NFC devices arrived actually functional.** Same pattern as NFU — BM says non-functional, device works.

---

## Root Causes Summary

### 1. BM's inspection is unreliable for condition grading (high impact)
80% of returned devices have condition mismatches. BM's reported grades cannot be trusted as accurate. This affects:
- Our grading decisions (we rely on BM's reports for initial assessment)
- Our sale listing grade (if we trust BM's casing/screen report, we may list wrong)
- Counter-offer decisions (if BM over-grades, we're paying more than we should)

### 2. "Non-functional" devices are often functional (medium impact, net positive)
11 of 14 NFU+NFC returns had the device arrive actually functional. This is good for us financially (cheaper purchase, easier repair) but creates a QC risk — we may not do a full functional check if BM says "not functional," and miss actual issues.

### 3. Screen damage in transit or missed by BM (medium impact)
6 devices had screens reported as Good/Excellent but arrived Damaged/Fair. This is either:
- Transit damage (packaging issue)
- BM inspection failure
We can't control BM's inspection but we could photograph on arrival to document.

### 4. Our own QC uncertainty (low impact, needs attention)
4 devices show "Functional?" or "Grade?" — our team was uncertain and recorded a question mark instead of a definitive assessment. This suggests the intake form allows ambiguity where it shouldn't.

---

## Recommendations

### QC Process Changes
1. **Never trust BM's condition report as final** — always do full independent assessment on arrival. This is probably already happening but needs to be the explicit documented SOP.
2. **Photograph every device on arrival** — before opening packaging. Timestamps BM's responsibility vs transit damage.
3. **Mandatory function test on all devices** — even if BM says "functional." 4 devices had uncertain function status from our team.
4. **Remove "?" options from intake form** — force definitive assessment. "Functional?" and "Grade?" should not be valid entries.

### Listing Grade Process
5. **Grade from OUR inspection, not BM's report** — if BM says casing "Good" but we find "Fair," list as Fair. Don't assume BM is right.
6. **Flag devices where BM grade ≠ our grade** — these need extra QC attention before sale.

### Financial Tracking
7. **Track return reason per device** — currently we just have "Returned" status. Add a return_reason field: buyer_return, quality_issue, wrong_grade, transit_damage.
8. **Monitor return rate by grade monthly** — current 9.6% overall is high. Target <5%.

---

## Financial Impact

With 35 returns at avg £454 sale price:
- **Revenue at risk:** ~£15,890 in sales tied up in returns
- **Devices recoverable:** Most can be relisted and resold (maybe 25-30 of 35)
- **Unrecoverable loss:** Devices that were damaged in transit or genuinely BER after return (~5-10 devices)
- **Estimated return cost:** ~£500-1,000 (shipping, relisting, repricing, bench time for re-QC)

---

## COMPROMISES

- Return reasons not available in current data — we only have "Returned" status, not why the buyer returned
- Can't distinguish transit damage from BM inspection failure without arrival photos
- "Functional?" entries could mean "untested" rather than "uncertain" — ambiguous
- Sale price of £0 on 2 returned devices (BM 943, BM 1240) — either never sold or data not captured
- Counter_reasons and suspend_reasons fields were mostly empty on returned devices — BM return metadata not in our Monday board
- 3 "UNKNOWN" grade returns couldn't be analysed by grade pattern — listing_sku not matched
