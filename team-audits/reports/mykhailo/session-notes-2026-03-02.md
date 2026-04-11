# Session Notes — 2 March 2026

## What we did

Finished Mykhailo's audit. Added financials, fixed broken metrics, built two new scripts that work for any tech going forward.

---

## Mykhailo Audit — Final Numbers

**3-week period (Feb 9 – Mar 1, 16 working days):**

| Metric | Value |
|--------|-------|
| Completions | 55 unique devices (deduped — QC rework re-completions excluded) |
| Completions/day | 3.4 avg (baseline: 4.3, no meetings) |
| Peak day | 5 (Wed 25 Feb) |
| Revenue | £15,630 |
| Net profit | £10,290 |
| Revenue/day | £977 |
| Profit/completion | £187 avg |
| QC reworks | 6 (10.9% of completions) |
| Shared items (50/50 with Safan) | 7 of 55 (13%) |
| BM returns | 0 |

**Output gap:** 3.4/day vs 4.3 baseline = 21% drop. Meetings (~1h/day) explain roughly half. Realistic meeting-adjusted target is 4.0/day. Gap = ~3 items/week = ~£852/week = ~£44,300/year.

**Saturday 28 Feb:** Net loss day. 2 completions, 7 paused, £228 revenue, -£31 profit. CCTV confirmed 30 min Instagram mid-repair.

---

## New Metrics Added

### 1. QC Failure Rate (daily CSV + monthly report)

Counts items that come back from QC failure. Added `qc_reworks` column to the daily CSV.

**February team comparison (monthly quality report):**

| Tech | Completions | QC Failures | QC Rate |
|------|------------|-------------|---------|
| Andreas | 57 | 2 | 3.5% |
| Mykhailo | 67 | 7 | 10.4% |
| Safan | 98 | 15 | 15.3% |

Mykhailo sits middle of the pack. Safan has the worst QC rate despite highest volume. Andreas is the quality leader. **QC is not Mykhailo's problem — attendance and engagement are.**

### 2. BM Return Rate (monthly report)

20 returns / 774 shipped+returned = 2.7% business-level return rate. 0 attributed to Mykhailo. Most returns are older items (BM 328-1097 range) that predate current person tracking — 19 of 21 are unattributable.

### 3. Revenue Attribution with 50/50 Split

When both refurb time and repair time are logged on an item, revenue and profit split 50/50 between the techs. 7 of Mykhailo's 55 items were shared. Simple, fair, accounts for the fact that refurb can take longer than repair.

### 4. Max Capacity (fixed)

Was calculating average (completions/days = 3.4). Now shows peak day observed = 5. That's what he's demonstrated he can do on his best day.

---

## Scripts Built / Updated

### `scripts/team_daily_csv.py` (updated)
Reusable for any tech. Run with:
```bash
python3 scripts/team_daily_csv.py --person mykhailo --from 2026-02-09 --to 2026-03-01
python3 scripts/team_daily_csv.py --person andreas --from 2026-02-09 --to 2026-03-01
```

CSV columns: date, day, start_time, meeting_mins, adjusted_start, lunch_start, lunch_over, lunch_mins, finish_time, gross_hours, available_hours, completions, items_touched, paused_count, pause_reasons, revenue, net_profit, shared_items, **qc_reworks**, tracked_mins, utilisation_pct, max_capacity

Changes this session:
- Added `qc_reworks` column (QC Failure → Under Refurb transitions)
- Fixed `max_capacity` (was just average, now peak day observed)
- All previous fixes from earlier session still in place (dedup, 50/50 split, pagination, utilisation base)

### `scripts/monthly_quality_report.py` (new)
QC failure rate + BM return rate per tech. Run with:
```bash
python3 scripts/monthly_quality_report.py --month 2026-02
python3 scripts/monthly_quality_report.py --month 2026-03 --tech mykhailo
```

Output: markdown report at `reports/monthly_quality_YYYY-MM.md`

Fetches activity logs per-user (avoids 10,000 entry API cap). Includes Roni's logs because he's the one setting QC Failure statuses. Attributes QC failures to the tech who originally completed the item. Cross-references BM board returns to main board items by BM order number.

---

## BM Matching — Resolved

The "15% unmatched BM items" from earlier was a pagination bug — we were only fetching the first 500 of 1,266 BM board items. Already fixed in a prior session. All 27 of Mykhailo's BM items now match. 5 show £0 revenue because they haven't been sold yet (recently completed, still in pipeline). Not a data problem.

---

## Report Updates

`reports/mykhailo/mykhailo_deep_dive_2026-03-02.md` — all sections now consistent:
- Section 1 (Executive Summary): 3.4/day, 21% below baseline
- Section 6 (Completion vs Pause): added QC failure rate subsection with team comparison
- Section 7 (Time Tracking): corrected metrics
- Section 9 (Financial Impact): real revenue data, cost of late starts
- Section 10 (What Data Says): updated to reflect 21% gap
- Section 11 (Honest Assessment): output severity upgraded to Medium
- Section 12 (Recommendations): target set to 4.0+/day (meeting-adjusted)
- Section 13 (Data Limitations): added notes on QC rework detection and revenue methodology

---

## What's Next

1. **Andreas audit** — run `team_daily_csv.py --person andreas` for the same period. Answers: is the refurb room declining overall, or is it just Mykhailo?
2. **Queue depth** — how many items sitting in Mykhailo's queue at any given time? Growing queue = capacity problem.
3. **Schedule weekly CSV generation** — the 16 March review needs automated data, not another manual pull.
4. **Run monthly quality report for March** — track whether QC rates change after conversations happen.

---

## Key Decisions Made

- **Revenue split:** 50/50 between repair tech and refurb tech on shared items
- **Completions:** unique devices only, first completion counts, QC rework re-completions excluded
- **Utilisation base:** fixed 480 mins (9am-6pm minus 1h lunch) minus meeting time
- **Max capacity:** peak day observed (not calculated theoretical)
- **QC failure rate:** attributed to the tech who completed the item, not the QC person who flagged it
- **Return rate:** monthly report, not daily CSV (returns happen weeks after completion)
