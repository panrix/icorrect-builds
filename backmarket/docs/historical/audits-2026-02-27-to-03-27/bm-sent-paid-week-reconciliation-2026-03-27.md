# BM Sent/Paid Week Reconciliation

**Generated:** 27 Mar 2026 13:22 UTC  
**Window used:** last 7 days  
**Purpose:** Read-only reconciliation of recent BM buyback orders against Monday Main Board, Monday BM Devices Board, and board linkage.

## Summary

| Category | Count |
|---|---:|
| Recent BM sent/paid orders | 6 |
| Present on Main Board | 3 |
| Present on BM Devices Board | 3 |
| Present on both boards | 3 |
| Linked across both boards | 3 |
| Missing from Main Board | 3 |
| Missing from BM Devices Board | 3 |
| Present on both but unlinked | 0 |

## Orders Present On Both Boards And Linked

| BM Trade-in ID | BM status | Main Board | BM Devices Board | Main status24 |
|---|---|---|---|---|
| `GB-26121-TOFQG` | `MONEY_TRANSFERED` | `11542999675` `BM 1562 ( Gajal Gupta )` | `11543014250` `BM 1562` | `Diagnostic` |
| `GB-26113-TSKFU` | `MONEY_TRANSFERED` | `11553196759` `BM 1564 ( Gemma Guarin )` | `11553102917` `BM 1564` | `Diagnostic` |
| `GB-26104-JLRUD` | `MONEY_TRANSFERED` | `11553176608` `BM 1563 ( Jack Ryan )` | `11553108028` `BM 1563` | `Diagnostic` |

## Orders Missing From Both Monday Boards

| BM Trade-in ID | BM status | Event time |
|---|---|---|
| `GB-26097-GILUZ` | `MONEY_TRANSFERED` | `2026-03-25T10:48:00.000Z` |
| `GB-26102-SUSBL` | `MONEY_TRANSFERED` | `2026-03-25T11:28:05.000Z` |
| `GB-26111-NUHVL` | `PAID` | `2026-03-26T11:08:51.000Z` |

## Notes

- No cases were found where both Monday items existed but the BM Devices relation link was missing.
- The 3 present orders are linked correctly but still sit at Main Board `status24 = Diagnostic`, so board presence does not mean operational state is current.
- The 3 missing orders are absent from both Main and BM Devices, which points to intake/creation coverage failure rather than just a linking failure.
