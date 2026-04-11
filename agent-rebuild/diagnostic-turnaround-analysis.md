# Diagnostic Turnaround Duration Analysis

Raw source: `/home/ricky/builds/agent-rebuild/data/repair-history-full.json`

## Scope and method

- Total items in raw file: `1889`
- Items matching diagnostic filter (`status24 = Diagnostic/Board Level` or a logged move into Diagnostics): `381`
- Items with a logged move into Diagnostics/Diagnostic: `170`
- Items with both a diagnostic start and a qualifying completion event (`Diagnostic Complete`, `Ready to Quote`, or `Quote Sent`): `136`
- Quote Sent cases after diagnostic start: `127`
- Measurable records by board: main `136`, archive `0`
- Measurable records by diagnostic-start year: `2025` = `80`, `2026` = `56`
- Working-day calculation excludes Saturdays and Sundays and counts weekday dates touched from the diagnostic-start event date through the completion event date.
- Year is grouped by the diagnostic-start timestamp, because the task anchors duration to the item entering diagnostics.
- Fault categories are assigned with the same overlap-friendly category matcher used in `c14_repair_history_rerun.py` for `repair-history-analysis.md`, so one repair can appear in multiple category rows.
- Device type is extracted from the combined item name plus visible item text fields because many rows are customer-name titles rather than device-name titles.

## Data limitation that materially affects the result

- Archive-slice items included by the filter: `208`
- Archive-slice filtered items with any activity logs at all: `208`
- Archive-slice filtered items with a visible diagnostic-start status log: `0`
- In practice, the archive rows mostly preserve only the later archive-move event in `activity_logs`, not the original 2023 diagnostic transitions. So this report is evidence-backed, but its measurable turnaround timings are concentrated in the live/main-board activity-log history rather than evenly across 2023 to 2026.

## Summary table

| Device | Fault Category | Year | Count | Median Days | P75 Days | P90 Days | Max Days |
|---|---|---:|---:|---:|---:|---:|---:|
| MacBook | Board-level repair complexity | 2025 | 52 | 1.0 | 2 | 4 | 9 |
| MacBook | Board-level repair complexity | 2026 | 39 | 3.0 | 6 | 8 | 16 |
| MacBook | Client no-show / abandoned | 2025 | 46 | 1.0 | 2 | 4 | 9 |
| MacBook | Client no-show / abandoned | 2026 | 36 | 2.5 | 5 | 7 | 15 |
| MacBook | Customer communication issue | 2025 | 4 | 1.5 | 2 | 6 | 6 |
| MacBook | Customer communication issue | 2026 | 17 | 3.0 | 7 | 8 | 16 |
| MacBook | Diagnostic complexity | 2025 | 2 | 3.5 | 6 | 6 | 6 |
| MacBook | Diagnostic complexity | 2026 | 3 | 1.0 | 4 | 4 | 4 |
| MacBook | Escalation | 2025 | 12 | 2.0 | 2 | 6 | 9 |
| MacBook | Escalation | 2026 | 4 | 3.5 | 4 | 5 | 5 |
| MacBook | Insurance/corporate special handling | 2025 | 6 | 3.0 | 4 | 4 | 4 |
| MacBook | Insurance/corporate special handling | 2026 | 7 | 6.0 | 8 | 15 | 15 |
| MacBook | Liquid damage complexity | 2025 | 52 | 1.0 | 2 | 4 | 9 |
| MacBook | Liquid damage complexity | 2026 | 39 | 3.0 | 6 | 8 | 16 |
| MacBook | Parts delay | 2025 | 17 | 1.0 | 2 | 2 | 2 |
| MacBook | Parts delay | 2026 | 9 | 3.0 | 6 | 16 | 16 |
| MacBook | Pricing dispute | 2025 | 2 | 1.0 | 1 | 1 | 1 |
| MacBook | Pricing dispute | 2026 | 3 | 1.0 | 2 | 2 | 2 |
| MacBook | Warranty/return | 2025 | 50 | 1.0 | 2 | 4 | 9 |
| MacBook | Warranty/return | 2026 | 38 | 3.0 | 6 | 8 | 16 |
| Other | Board-level repair complexity | 2025 | 1 | 1.0 | 1 | 1 | 1 |
| Other | Board-level repair complexity | 2026 | 1 | 8.0 | 8 | 8 | 8 |
| Other | Client no-show / abandoned | 2025 | 1 | 1.0 | 1 | 1 | 1 |
| Other | Client no-show / abandoned | 2026 | 1 | 8.0 | 8 | 8 | 8 |
| Other | Customer communication issue | 2026 | 1 | 8.0 | 8 | 8 | 8 |
| Other | Diagnostic complexity | 2025 | 1 | 1.0 | 1 | 1 | 1 |
| Other | Insurance/corporate special handling | 2026 | 1 | 8.0 | 8 | 8 | 8 |
| Other | Liquid damage complexity | 2025 | 1 | 1.0 | 1 | 1 | 1 |
| Other | Liquid damage complexity | 2026 | 1 | 8.0 | 8 | 8 | 8 |
| Other | Parts delay | 2026 | 1 | 8.0 | 8 | 8 | 8 |
| Other | Warranty/return | 2026 | 1 | 8.0 | 8 | 8 | 8 |
| iPad | Board-level repair complexity | 2025 | 9 | 1.0 | 3 | 11 | 11 |
| iPad | Board-level repair complexity | 2026 | 2 | 3.5 | 4 | 4 | 4 |
| iPad | Client no-show / abandoned | 2025 | 9 | 1.0 | 2 | 3 | 3 |
| iPad | Client no-show / abandoned | 2026 | 3 | 3.0 | 4 | 4 | 4 |
| iPad | Customer communication issue | 2025 | 3 | 2.0 | 3 | 3 | 3 |
| iPad | Customer communication issue | 2026 | 2 | 2.5 | 4 | 4 | 4 |
| iPad | Escalation | 2025 | 3 | 2.0 | 3 | 3 | 3 |
| iPad | Extra fault found | 2025 | 1 | 1.0 | 1 | 1 | 1 |
| iPad | Liquid damage complexity | 2025 | 11 | 1.0 | 3 | 3 | 11 |
| iPad | Liquid damage complexity | 2026 | 3 | 3.0 | 4 | 4 | 4 |
| iPad | Parts delay | 2025 | 4 | 1.0 | 1 | 2 | 2 |
| iPad | Warranty/return | 2025 | 7 | 1.0 | 3 | 11 | 11 |
| iPad | Warranty/return | 2026 | 1 | 4.0 | 4 | 4 | 4 |
| iPhone | Board-level repair complexity | 2025 | 11 | 1.0 | 2 | 3 | 3 |
| iPhone | Board-level repair complexity | 2026 | 11 | 2.0 | 4 | 5 | 22 |
| iPhone | Client no-show / abandoned | 2025 | 15 | 1.0 | 2 | 3 | 3 |
| iPhone | Client no-show / abandoned | 2026 | 12 | 1.5 | 3 | 5 | 22 |
| iPhone | Customer communication issue | 2026 | 4 | 2.0 | 3 | 4 | 4 |
| iPhone | Diagnostic complexity | 2026 | 1 | 2.0 | 2 | 2 | 2 |
| iPhone | Escalation | 2025 | 3 | 1.0 | 2 | 2 | 2 |
| iPhone | Escalation | 2026 | 3 | 2.0 | 22 | 22 | 22 |
| iPhone | Insurance/corporate special handling | 2025 | 3 | 2.0 | 3 | 3 | 3 |
| iPhone | Insurance/corporate special handling | 2026 | 1 | 1.0 | 1 | 1 | 1 |
| iPhone | Liquid damage complexity | 2025 | 16 | 1.0 | 2 | 3 | 3 |
| iPhone | Liquid damage complexity | 2026 | 13 | 1.0 | 3 | 5 | 22 |
| iPhone | Parts delay | 2025 | 4 | 1.0 | 1 | 1 | 1 |
| iPhone | Parts delay | 2026 | 4 | 2.0 | 3 | 22 | 22 |
| iPhone | Pricing dispute | 2025 | 1 | 3.0 | 3 | 3 | 3 |
| iPhone | Pricing dispute | 2026 | 1 | 2.0 | 2 | 2 | 2 |
| iPhone | Warranty/return | 2025 | 9 | 1.0 | 1 | 3 | 3 |
| iPhone | Warranty/return | 2026 | 3 | 3.0 | 5 | 5 | 5 |

## Distribution per device type

| Device | Count | 1 day | 2 days | 3 days | 4-5 days | 6-10 days | 10+ days | Median | P75 | Max |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| MacBook | 91 | 36 | 22 | 11 | 10 | 10 | 2 | 2.0 | 3 | 16 |
| Other | 2 | 1 | 0 | 0 | 0 | 1 | 0 | 4.5 | 8 | 8 |
| iPad | 14 | 7 | 2 | 3 | 1 | 0 | 1 | 1.5 | 3 | 11 |
| iPhone | 29 | 16 | 7 | 3 | 2 | 0 | 1 | 1.0 | 2 | 22 |

## Quote silence duration after Quote Sent

- Quote Sent cases total: `127`
- Quote Sent cases with a later status change logged: `127`
- Quote Sent cases with no later status change logged: `0`
- Silent cases by board: archive `0`, main `0`
- Silence duration where a next status exists: median `2.0` working days, P75 `3`, P90 `7`, max `70`

| Board bucket | Quote Sent total | With later status change | No later status change | Median silence days | P75 | P90 | Max |
|---|---:|---:|---:|---:|---:|---:|---:|
| Archive board | 0 | 0 | 0 | n/a | n/a | n/a | n/a |
| Main board | 127 | 127 | 0 | 2.0 | 3 | 7 | 70 |

## Longest diagnostic turnaround cases

| Item | ID | Device | Year | Board | Categories | Working Days | Start | End |
|---|---:|---|---:|---|---|---:|---|---|
| Xinzhang | 11010528016 | iPhone | 2026 | Main | Parts delay, Escalation, Liquid damage complexity, Board-level repair complexity, Client no-show / abandoned | 22 | 2026-01-16 | 2026-02-16 |
| Kaoutar | 11207445656 | MacBook | 2026 | Main | Parts delay, Customer communication issue, Warranty/return, Liquid damage complexity, Board-level repair complexity | 16 | 2026-02-06 | 2026-02-27 |
| Spacemade 6 | 11070779448 | MacBook | 2026 | Main | Warranty/return, Client no-show / abandoned, Insurance/corporate special handling, Liquid damage complexity, Board-level repair complexity | 15 | 2026-01-22 | 2026-02-11 |
| Hannah | 18300536810 | iPad | 2025 | Main | Warranty/return, Liquid damage complexity, Board-level repair complexity | 11 | 2025-10-29 | 2025-11-12 |
| Tosin | 18343264794 | MacBook | 2025 | Main | Warranty/return, Escalation, Liquid damage complexity, Board-level repair complexity, Client no-show / abandoned | 9 | 2025-11-06 | 2025-11-18 |
| #1088 - Charlie Tristram | 11364678853 | MacBook | 2026 | Main | Customer communication issue, Warranty/return, Client no-show / abandoned, Liquid damage complexity, Board-level repair complexity | 8 | 2026-02-25 | 2026-03-06 |
| Dwayne Morris (Everything Apple Tech [7%]) | 11247412252 | MacBook | 2026 | Main | Customer communication issue, Warranty/return, Insurance/corporate special handling, Liquid damage complexity, Board-level repair complexity, Client no-show / abandoned | 8 | 2026-02-11 | 2026-02-20 |
| Spacemade 4 | 11070776008 | Other | 2026 | Main | Parts delay, Customer communication issue, Warranty/return, Client no-show / abandoned, Insurance/corporate special handling, Liquid damage complexity, Board-level repair complexity | 8 | 2026-01-30 | 2026-02-10 |
| Wardah Meeajun *Paying £379 on collection | 11515298481 | MacBook | 2026 | Main | Customer communication issue, Warranty/return, Liquid damage complexity, Board-level repair complexity, Client no-show / abandoned | 7 | 2026-03-16 | 2026-03-24 |
| #1092 - Connor Carmichael | 11392130192 | MacBook | 2026 | Main | Parts delay, Customer communication issue, Warranty/return, Client no-show / abandoned, Liquid damage complexity, Board-level repair complexity | 7 | 2026-03-02 | 2026-03-10 |
| #1106 - Mohammed Sayeh | 11451838260 | MacBook | 2026 | Main | Customer communication issue, Warranty/return, Client no-show / abandoned, Liquid damage complexity, Board-level repair complexity | 6 | 2026-03-09 | 2026-03-16 |
| Spacemade 5 | 11070775890 | MacBook | 2026 | Main | Parts delay, Warranty/return, Client no-show / abandoned, Insurance/corporate special handling, Liquid damage complexity, Board-level repair complexity | 6 | 2026-01-22 | 2026-01-29 |
| Spacemade 1 | 11070689572 | MacBook | 2026 | Main | Parts delay, Warranty/return, Client no-show / abandoned, Insurance/corporate special handling, Liquid damage complexity, Board-level repair complexity | 6 | 2026-01-22 | 2026-01-29 |
| Spacemade 2 | 11070685756 | MacBook | 2026 | Main | Warranty/return, Client no-show / abandoned, Insurance/corporate special handling, Liquid damage complexity, Board-level repair complexity | 6 | 2026-01-22 | 2026-01-29 |
| Cristopher Hamilton *Will get back to us at the end of the month | 9268419919 | MacBook | 2025 | Main | Customer communication issue, Diagnostic complexity, Warranty/return, Escalation, Liquid damage complexity, Board-level repair complexity | 6 | 2025-06-04 | 2025-06-11 |

## Longest quote-silence cases with a later status change

| Item | ID | Device | Board | Working Days Silent | Quote Sent | Next Status Change |
|---|---:|---|---|---:|---|---|
| Theone Coleman | 18063424245 | MacBook | Main | 70 | 2025-09-30 | 2026-01-05 |
| Lauren Kennedy | 11144850246 | iPhone | Main | 32 | 2026-02-13 | 2026-03-30 |
| Joseph Idahor | 10973838600 | MacBook | Main | 31 | 2026-01-16 | 2026-02-27 |
| Tabitha Kantenga | 10973795390 | MacBook | Main | 30 | 2026-01-16 | 2026-02-26 |
| Jason Karr *DO NOT THROW AWAY SSD | 18127802265 | MacBook | Main | 30 | 2025-10-21 | 2025-12-01 |
| Harry McAllister (Freuds) [FC0908] PO69253 | 10733781953 | MacBook | Main | 22 | 2025-12-15 | 2026-01-13 |
| Sauda hasan | 18182847266 | iPhone | Main | 16 | 2025-10-16 | 2025-11-06 |
| Linfred Bentil | 10773675200 | MacBook | Main | 13 | 2025-12-18 | 2026-01-05 |
| Mitch Holmes | 18302910522 | iPhone | Main | 13 | 2025-11-04 | 2025-11-20 |
| Dobrila Brice | 11039417054 | MacBook | Main | 9 | 2026-01-28 | 2026-02-09 |
| Ryszard Kolendo | 10644054971 | MacBook | Main | 9 | 2025-12-02 | 2025-12-12 |
| Mario Balcan (Mother Family) | 18034349226 | MacBook | Main | 8 | 2025-10-15 | 2025-10-24 |
| Andrea Bonzi (Hakluyt) | 18096268751 | MacBook | Main | 7 | 2025-10-03 | 2025-10-13 |
| #1092 - Connor Carmichael | 11392130192 | MacBook | Main | 6 | 2026-03-16 | 2026-03-23 |
| Samantha Vanderpuye | 10594578005 | iPhone | Main | 6 | 2025-11-27 | 2025-12-04 |

## Notes

- This analysis uses activity-log status transitions rather than static board snapshots, so it only counts cases where the diagnostic path is explicitly visible in the logs.
- Some items show overlapping fault/process categories by design. Counts by category therefore do not add up to the unique item count.
- “Silent” Quote Sent cases are defined here as items that reached `Quote Sent` and had no later status-change event in the captured activity logs.