# Mykhailo Kepeshchuk — Deep Dive Performance Audit
## Audit Date: 2 March 2026
## Period Reviewed: 9 February – 1 March 2026 (3 weeks)

**Auditor:** Ricky Panesar (via Claude Code)
**Data Sources:** Monday.com API (Board 349212843 activity logs + item time tracking), Ferrari's daily board (18393875720, team meeting durations), Safan comparison data, Slack #general + DM history (Jarvis query)
**Baseline:** Mykhailo report 2 Feb 2026 (week of 26 Jan – 1 Feb)

---

## 1. EXECUTIVE SUMMARY

Mykhailo's per-day output (3.4 items/day) is 21% below his baseline (4.3/day). Both missed Saturdays were legitimate (annual leave 14 Feb, sick 21 Feb). Daily team meetings (averaging 1h 15m) explain most of his "late" first Monday.com actions, and account for some of the output gap — the baseline had no daily meetings.

**However, there is a clear and escalating pattern of disengagement, confirmed across three independent sources:**

1. **Slack messages** — 10 lateness notifications in 8 weeks (9 Jan – 26 Feb). Already addressed by Ricky on 2 Feb ("this morning's lateness is not acceptable") with no sustained improvement. Excuses rotate: trains, Central line, alarm, and on 26 Feb he messaged the night before saying he was drunk and might be late.
2. **Monday.com activity logs** — On non-meeting days, he starts 70-90 min late 75% of the time. Saturday 28 Feb: arrived 90 min late, left 72 min early, completed 2 of 8 items, paused 7.
3. **CCTV** — 30 minutes on Instagram mid-repair on Saturday 28 Feb.
4. **Communication** — 83 update replies within items in 3 weeks (4.9/day) — he IS communicating technical notes on repairs. The original audit methodology only checked activity log events and missed these. Communication is not the problem.

**This is a chronic lateness and engagement problem that is now affecting output.** His per-item work quality is still there when he's working, and he does communicate on repairs (83 item replies in 3 weeks). But the pattern of lateness has been escalating since January, has already been addressed once with no change, and is now reaching a point where it affects output and the standard he sets for the refurb room.

---

## 2. KEY METRICS

| Metric | Baseline (Jan 26-Feb 1) | Current (Feb 9-Mar 1) | Change |
|--------|------------------------|----------------------|--------|
| **Completions/day (worked days)** | 4.3 | 3.4 | -21% |
| **Revenue/day** | — | £977 | — |
| **Update replies (within items)** | — | 83 in 3 weeks (4.9/day) | Active communicator |
| **Saturday output (28 Feb)** | 5 items (31 Jan) | 2 items | -60% |

*Completions are unique devices only — if an item fails QC and re-completes, it counts once. Baseline had no daily team meetings; current period loses ~1h/day to meetings.*

### Weekly Output

| Period | Days Worked | Completed | Per Day | Revenue | Notes |
|--------|------------|-----------|---------|---------|-------|
| **Baseline: Jan 26-Feb 1** | 7 (inc Sun) | 30 | 4.3 | — | No team meetings |
| Feb 9-15 | 5 | 16 | 3.2 | £4,135 | Sat 14 = annual leave |
| Feb 16-22 | 5 | 17 | 3.4 | £5,803 | Sat 21 = sick day |
| Feb 23-Mar 1 | 6 | 22 | 3.7 | £5,693 | Sat 28 = poor quality day |

### Comparison: Mykhailo vs Safan (Same Period)

| Metric | Mykhailo | Safan |
|--------|----------|-------|
| Completions/day | 3.4 | 4.9 |
| Saturdays worked (3-week period) | 1/1 expected* | 3/3 |
| Avg first action (non-meeting days) | 10:14 | 08:19 (most recent week) |
| Actions per week | 92-142 | 250-264 |
| Trend direction | Flat/slightly declining | Improving |

*2 Saturdays were authorised absence.

---

## 3. LATE START ANALYSIS — MEETING-ADJUSTED

Team meetings happen almost daily (logged on Ferrari's board). These are legitimate and explain most of the late first Monday.com actions.

**Assumption:** Meetings start at 09:00. "Adjusted late" = first action minus (09:00 + meeting duration).

| Day | Meeting? | Meeting Duration | 1st Action | Adjusted Late | Verdict |
|-----|----------|-----------------|------------|--------------|---------|
| Mon 9 Feb | Yes | 25m | 12:44 | — | **Explained** (iPhone screen refurb task, not logged in Monday) |
| Tue 10 Feb | Yes | 1h 36m | 10:53 | 17m | OK — meeting explains it |
| Wed 11 Feb | Yes | 49m | 10:05 | 16m | OK — meeting explains it |
| Thu 12 Feb | **No** | — | 09:11 | 11m | **ON TIME** |
| Fri 13 Feb | Yes | 1h 45m | 10:47 | 2m | OK — meeting explains it |
| Mon 16 Feb | Yes | 1h 41m | 10:06 | 0m | OK — meeting explains it |
| Tue 17 Feb | Yes | 1h 16m | 10:21 | 5m | OK — meeting explains it |
| Wed 18 Feb | Yes | 1h 35m | 09:59 | 0m | OK — meeting explains it |
| Thu 19 Feb | Yes | 1h 41m | 09:08 | 0m | OK — meeting explains it |
| Fri 20 Feb | **No** | — | 10:14 | **74m** | **LATE — no meeting** |
| Mon 23 Feb | Yes | 1h 00m | 09:41 | 0m | OK — meeting explains it |
| Tue 24 Feb | Yes | 2h 17m | 09:51 | 0m | OK — meeting explains it |
| Wed 25 Feb | Yes | 35m | 10:47 | **73m** | **LATE — short meeting** |
| Thu 26 Feb | **No** | — | 10:11 | **71m** | **LATE — no meeting** |
| Fri 27 Feb | Yes | 56m | 10:04 | 8m | OK — meeting explains it |
| Sat 28 Feb | **No** | — | 10:30 | **90m** | **LATE — no meeting** |

**Summary:**
- 9/16 days: meeting fully explains the late start
- 1/16 days: explained by assigned iPhone screen refurb task (Mon 9 Feb)
- 1/16 days: on time (Thu 12 Feb)
- **5/16 days: genuinely late (70-90 min) with no meeting excuse**
- Non-meeting days specifically: 1 on time, 3 late by 70-90 min

---

## 4. SLACK HISTORY — LATENESS & ABSENCE PATTERN

**Source:** Jarvis query of Slack #general and DMs with Ricky.

### Lateness Messages (8 weeks)

| Date | Source | Message | Cross-ref (Monday.com) |
|------|--------|---------|----------------------|
| 9 Jan | #general | "I'll be a bit late" | Pre-audit period |
| 14 Jan | #general | "I'll be a bit late" | Pre-audit period |
| 16 Jan | #general | "I'll be a bit late, my train was cancelled" | Pre-audit period |
| 19 Jan | #general | "I'll be late, something wrong with central line" | Pre-audit period |
| 2 Feb | DM + #general | "I'll be late" — **Ricky responded: "this morning's lateness is not acceptable."** Excuse: alarm wasn't working | Pre-audit period |
| 4 Feb | #general | "My train delayed, will be a bit late" | Pre-audit period |
| 6 Feb | #general | "Morning, central line delayed" | Pre-audit period |
| 16 Feb | #general | "I'm so sorry guys I'll be late" — team meeting held until he arrived (~9:25) | First action: 10:06 (meeting ran 1h41m) |
| 20 Feb | #general | "I'll be until 10:20" (unclear — possibly late arrival or early leave) | First action: 10:14 (no meeting logged) |
| 26 Feb | DM | **Night before:** "I'm a little bit drunk... maybe I will be late tomorrow morning." Ricky asked what time he arrived — he said 10:00 | First action: 10:11 (no meeting) |

**10 lateness messages in 8 weeks. Pattern:**
- Rotating excuses: train (4x), Central line (2x), alarm (1x), drunk night before (1x), unspecified (2x)
- Already escalated by Ricky on 2 Feb — no sustained improvement
- 16 Feb: late enough to hold the team meeting for everyone
- 26 Feb: pre-warned about being drunk, arrived at 10:00 — this is the day before the Saturday Instagram incident

### Leave & Absence Requests

| Date | Source | Request | Outcome |
|------|--------|---------|---------|
| 12 Jan | DM | Morning off until ~11am (keys handover for old flat) | Approved with condition: if later than 11, take half day |
| 16 Jan | DM | Requested day off 27 Jan | Approved (annual leave — in baseline period) |
| 9 Feb | DM | Requested holiday on a Saturday + possibly 20 Feb | — |
| 21 Feb | DM | "I feel bad, headache and can't sleep, can I have a day off tomorrow" | Approved — sick day (Sat 22 Feb) |
| 25 Feb | DM | Requested holidays 7–11 March | — |

**Note:** The 26 Feb drunk message followed by the 28 Feb Saturday Instagram incident is a 3-day sequence: drunk Thursday night → arrived 10:00 Friday → poor Saturday (late, early, Instagram, 2 completions).

### Timeline of Escalation

```
Jan 9-19:  4 late messages in 11 days (establishing pattern)
Feb 2:     Ricky addresses it directly — "not acceptable"
Feb 4-6:   2 more late messages within 4 days of being told off
Feb 16:    Late enough to hold up the team meeting
Feb 20:    Late (no meeting excuse)
Feb 26:    Admits being drunk night before, arrives 10:00
Feb 28:    Saturday — late, early, Instagram, 2/8 completed
```

The pattern is: address → brief improvement → revert → escalate.

---

## 5. SATURDAY 28 FEB — DETAILED TIMELINE

Arrived 10:30 (90 min late). Last action 16:48 (72 min early). Active span: 6h 18min vs expected 9h.

| Time | Item | Action | Outcome |
|------|------|--------|---------|
| 10:30 | BM 1489 (Nekita Gulati) | Started — Under Refurb | |
| 10:54 | BM 1489 (Nekita Gulati) | Paused — after 24 min | |
| 11:05 | BM 1418 (Gary Buckley) | Started | |
| 11:13 | BM 1418 (Gary Buckley) | **Paused** — after 8 min | Paused |
| 11:13 | BM 1489 (Nekita Gulati) | Resumed | |
| 12:02 | BM 1489 (Nekita Gulati) | **COMPLETED** — parts logged | Completed |
| 12:04 | BM 1447 (Cassandra Adoptante) | Started | |
| 12:48 | BM 1447 (Cassandra Adoptante) | **COMPLETED** — 44 min | Completed |
| — | — | *~41 min gap* | |
| 13:29 | BM 1470 (clem ouroussoff) | Started | |
| 14:23 | BM 1470 (clem ouroussoff) | **Paused** — 53 min | Paused |
| 14:30 | BM 1459 (Richard Holt) | Started | |
| 14:51 | BM 1459 (Richard Holt) | **Paused** — 21 min | Paused |
| 15:09 | BM 1404 (Wilbur Gladstone) | Started | |
| 15:29 | BM 1404 (Wilbur Gladstone) | **Paused** — 20 min | Paused |
| 15:30 | BM 1423 (jonathan mccune) | Started | |
| 16:09 | BM 1423 (jonathan mccune) | **Paused** — 39 min | Paused |
| 16:19 | BM 1397 (Paul Smith) | Started | |
| 16:48 | BM 1397 (Paul Smith) | **Paused** — 29 min. Left. | Paused |

**After 12:48, zero completions.** Started 5 items in a row and paused every one within 20-53 minutes. CCTV confirmed 30 minutes on Instagram mid-repair.

**Saturday totals:** 8 items touched, 2 completed, 7 paused. 6.3h present vs 9h expected.

---

## 6. COMPLETION vs PAUSE RATIO

| Week | Completed | Paused | Completion Ratio |
|------|-----------|--------|-----------------|
| Feb 9-15 | 16 | 15 | 52% |
| Feb 16-22 | 17 | 10 | 63% |
| Feb 23-Mar 1 | 22 | 19 | 54% |
| **3-week total** | **55** | **44** | **56%** |

Some pauses are legitimate (glue curing, parts, equipment). But on Saturday 28 Feb the ratio was 2 completed / 7 paused — every item after lunchtime was started and abandoned.

### All Status Transitions (3 weeks)

| Transition | Count |
|-----------|-------|
| Under Refurb → Repaired | 52 |
| Queued For Repair → Under Refurb | 43 |
| Under Refurb → Repair Paused | 37 |
| Repair Paused → Under Refurb | 30 |
| Diagnostics → Under Refurb | 15 |
| QC Failure → Under Refurb | 6 |
| Repair Paused → Repaired | 4 |

### QC Failure Rate

**6 QC reworks out of 55 completions = 10.9% failure rate** (~1 in 9 items comes back from QC).

| Week | Completions | QC Reworks | Failure Rate |
|------|------------|------------|-------------|
| Feb 9-15 | 16 | 1 | 6% |
| Feb 16-20 | 17 | 2 | 12% |
| Feb 23-Mar 1 | 22 | 3 | 14% |

Week 3 had the highest rework count (3). Fri 27 Feb alone had 2 reworks. Saturday 28 Feb had 0 reworks — his poor day was a motivation problem, not a quality problem.

**Team comparison (full February, from monthly quality report):**

| Tech | Completions | QC Failures | QC Rate |
|------|------------|-------------|---------|
| Andreas | 57 | 2 | 3.5% |
| **Mykhailo** | **67** | **7** | **10.4%** |
| Safan | 98 | 15 | 15.3% |

Mykhailo sits in the middle — worse than Andreas but better than Safan. Safan's higher volume (98 vs 67) contributes to more QC failures overall but his rate is also the highest. Andreas is the quality leader. **QC is not Mykhailo's main problem — attendance and engagement are.**

---

## 7. TIME TRACKING & UTILISATION

### How the numbers work

Mykhailo works 9am–6pm (9h). Deduct 1h lunch = **8h available**. Deduct the team meeting = **~7h available for tech work** on a meeting day.

Monday.com's time tracking is cumulative per item (not per day), so we can't measure exactly how many of those 7 hours were productive on any given day. What we can measure:

- **Completions per day** (most reliable metric): 3.4 avg
- **Revenue per day** (from actual sales): £977 avg
- **Tracked time per completion** (period average): ~2.1h (inflated by multi-day items)

### Week 3 Time Breakdown (Feb 23–Mar 1)

| Category | Hours | Minutes |
|----------|-------|---------|
| Refurb Time | 28.9h | 1,731m |
| Repair Time | 4.0h | 242m |
| Diagnostic Time | 12.2h | 731m |
| **Total Logged** | **45.1h** | **2,704m** |

Over 6 working days = **7.5h/day logged** vs ~7h available after meetings. Looks on target, but this figure is inflated by multi-day items completing in week 3.

### Highest Time Items

| Item | Status | Total Time | Notes |
|------|--------|-----------|-------|
| BM 1439 (Nadeem Nazar) | Returned | 4h 45m | Complex refurb |
| Alexander Dobb | Shipped | 3h 38m | |
| BM 1466 (Kerryjane Carlyle) | Returned | 2h 53m | |
| BM 1451 (Akif Nalbantoglu) | Shipped | 2h 50m | |
| BM 1470 (clem ouroussoff) | Paused | 2h 40m | Started Sat 28, paused |

---

## 8. COMMUNICATION

**CORRECTION (2 March 2026):** The original audit only checked Monday.com activity log events (column value changes) and found "1 written update in 3 weeks." This was wrong. A subsequent query of item update replies (comments within items) found **83 replies by Mykhailo** in the 3-week period — an average of 4.9 per working day. Andreas had 104 (6.1/day) for comparison.

| Period | Activity Log Updates | Item Update Replies | Total |
|--------|---------------------|-------------------|-------|
| Baseline (Jan 26-Feb 1) | 1 | Not queried | — |
| Feb 9-Mar 1 (3 weeks) | 1 | **83** | 84 |

The replies are technical repair notes within item threads — parts needed, fault descriptions, repair progress. He is communicating on his work. The original "zero proactive communication" assessment was a methodology error: activity logs only capture column changes, not comments.

**Revised assessment:** Communication is not a significant concern. The lateness and engagement pattern remains the primary issue.

---

## 9. FINANCIAL IMPACT

### Revenue Through Mykhailo's Hands (3 Weeks)

| Week | Revenue | Net Profit | Completions | Rev/Day | Shared Items |
|------|---------|-----------|-------------|---------|-------------|
| Feb 9-13 (5 days) | £4,135 | £2,896 | 16 | £827 | 1 |
| Feb 16-20 (5 days) | £5,803 | £3,734 | 17 | £1,161 | 1 |
| Feb 23-28 (6 days) | £5,693 | £3,659 | 22 | £949 | 4 |
| **3-week total** | **£15,630** | **£10,290** | **55** | **£977** | **7** |

**Methodology:** Revenue = BM sale price (for BM items) or client payment inc VAT (for repairs). When both a refurb tech and repair tech worked the same item (detected by both time trackers having logged time), revenue and profit are split 50/50. 7 items were shared this way. Each device is counted **once only** — if an item fails QC and re-completes, only the first completion counts.

**Average per completion: £284 revenue, £187 profit.**

### Saturday 28 Feb — Financial Cost

| Metric | Normal Saturday | Sat 28 Feb | Gap |
|--------|----------------|------------|-----|
| Completions | ~3.4 | 2 | -1.4 |
| Revenue | ~£977 | £228 | -£749 |
| Net profit | ~£640 | -£31 (loss) | -£671 |

Saturday 28 Feb was a **net loss day** — the 2 items completed (1 shared) didn't cover their costs. The 7 paused items represent an additional **~£2,000 in delayed revenue** sitting in his queue.

### Cost of Late Starts

| Source | Weekly Impact | Revenue Lost |
|--------|-------------|-------------|
| Output decline (3.4 vs 4.3/day) | ~4.5 items/week | ~£1,278/week |
| Sat 28 Feb underperformance (one-off) | ~1.4 items | ~£749 |
| **Ongoing weekly cost** | **~4.5 items** | **~£1,278/week** |

**~£66,400/year gap between current output (3.4/day) and target (4.3/day).** This is the revenue difference, not a "loss" — it's the cost of operating at 79% of baseline. The baseline was set during a week with no daily team meetings, so the realistic target accounting for meetings is closer to 4.0/day, reducing the gap to ~3 items/week (~£852/week, ~£44,300/year).

### Utilisation (Period-Level)

Monday.com time tracking is cumulative per item (no daily breakdown available), so daily utilisation figures are unreliable. Period-level calculation:

| Metric | Value |
|--------|-------|
| Total available hours (16 days × 8h - meetings) | ~113h |
| Total tracked time on completed items | ~121h* |
| Avg tracked time per completion | ~2.1h |
| Estimated productive hours per day (completions × avg time) | ~8.5h* |

*Tracked time includes multi-day items where work from previous days is attributed to the completion day. True daily productive time is lower — the best indicator remains completions per day (3.4 avg).

---

## 10. WHAT THE DATA SAYS vs DOESN'T SAY

### Confirmed by data:
- Output is 21% below baseline (3.4 vs 4.3/day), partly explained by daily meetings — **skills intact but output declining**
- On non-meeting days, he starts 70-90 min late 75% of the time — **attendance pattern**
- Saturday 28 Feb was genuinely poor — **one clear bad day with CCTV evidence**
- ~~Near-zero written communication~~ **CORRECTED:** 83 update replies in 3 weeks (4.9/day) — communicating on repairs via item threads
- Utilisation drop is real but partly explained by meetings — **some unexplained gap remains**

### NOT shown by data:
- Whether he arrives at the building on time but doesn't start Monday.com work (possible but unlikely for a refurb tech)
- What's driving the change — personal life, dissatisfaction, burnout, conflict with someone
- Whether Andreas is being affected (not audited here)
- Whether the "Repair Paused" items on Saturday were legitimate blocks or loss of focus
- Phone screen refurb work and other tasks not tracked in Monday.com

---

## 11. HONEST ASSESSMENT

The Slack history changes the framing. This is not a recent dip — it's a **chronic pattern spanning 8+ weeks** that has already been addressed once with no lasting change.

| Signal | Severity | What It Means |
|--------|----------|--------------|
| 10 lateness messages in 8 weeks (Slack) | **High** | Established, recurring pattern — not a blip |
| Already addressed 2 Feb — no improvement | **High** | He heard the feedback and continued |
| "I'm a little bit drunk" message (26 Feb) | **High** | Boundary issue — pre-warning lateness due to drinking |
| Non-meeting late starts (70-90 min, Monday.com) | **High** | Corroborates the Slack pattern with system data |
| Saturday 28 Feb (Instagram, 2 completions, CCTV) | **High** | Visible, undeniable incident |
| ~~1 update in 3 weeks~~ 83 replies in 3 weeks | ~~Medium~~ **Low** | Communication is active — original finding was a methodology error |
| Per-day output 4.3 → 3.4 (21% drop) | **Medium** | Partly meetings, partly late starts — output gap is real |

**He's not tanking. He's coasting — and the lateness pattern is escalating despite being told it's not acceptable.** Output has dropped 21% from baseline (3.4 vs 4.3/day). Meetings explain roughly half of that gap, but the rest is lost to late starts and disengagement. He does communicate on his repairs (83 item replies in 3 weeks), so this isn't someone who's completely disengaged from the work itself — but the attendance and reliability pattern has been escalating since January, and the self-correction mechanism (being told off on 2 Feb) didn't hold.

---

## 12. RECOMMENDATIONS

### For the Conversation

This is beyond "something's shifted, let's talk." You've already had that conversation on 2 Feb. This is: "We spoke about this a month ago. The data shows it hasn't changed. Here's what I'm seeing."

**Frame it clearly:**
"I spoke to you about lateness on February 2nd. Since then I've seen 10:14 on a Friday with no meeting, 10:11 on a Thursday with no meeting, you messaged me drunk the night before a work day, and Saturday I saw you on Instagram for 30 minutes mid-repair. Your actual work quality is still good and I can see you're communicating on your items — that's not the issue. The issue is reliability and punctuality, and it's getting worse, not better."

**Have ready:**
- The Slack timeline: 10 lateness messages, 9 Jan to 26 Feb (his own words)
- Non-meeting day start times: Fri 20 (10:14), Thu 26 (10:11), Sat 28 (10:30)
- Saturday 28 Feb timeline: 2 completed, 7 paused, left at 16:48
- CCTV: 30 minutes on Instagram mid-repair
- Safan comparison (only if he pushes back on fairness): 08:15-08:25 starts, 4.9/day, every Saturday

**Ask directly:**
- What's going on? (Give space for an honest answer — personal issues are real, but this pattern predates any single event)
- Do you still want to be here? Do you want the leadership path?
- What needs to change for you to be the person I hired?

**What you need to hear from him:**
- Acknowledgement that the pattern is real (not excuses)
- A specific plan for punctuality (not "I'll try harder")
- Whether something external is driving this (so you can decide how to support him or whether this is just drift)

### Concrete Expectations (After Conversation)

| Expectation | Measurable | Review Date |
|-------------|-----------|-------------|
| First Monday.com action within 15 min of meeting ending (or by 09:15 on non-meeting days) | Activity log timestamps | 16 March |
| Saturday: full day when scheduled | Activity log span | 16 March |
| Continue item update replies (already doing 4.9/day — maintain) | Reply count | 16 March |
| Maintain 4.0+ completions/day (meeting-adjusted target) | Completion count | 16 March |

### If He Acknowledges and Commits

| Action | Timeline |
|--------|----------|
| 2-week review against the expectations above | 16 March |
| Audit Andreas (is refurb room declining overall?) | This week |
| Review meeting durations — 1h 15m avg is excessive, affects whole team | Separate conversation |
| Consider whether personal situation warrants short-term support (adjusted hours, etc.) | Based on conversation |

### If He Doesn't Change After This Conversation

This will be the second time lateness has been addressed. The data package is comprehensive — Slack messages (his own words), Monday.com activity logs, CCTV, time tracking. If the pattern continues after a clear, documented conversation:
- He's choosing not to change
- The leadership path closes
- Formal performance process begins
- Note: he has holidays booked 7-11 March. The 2-week review on 16 March gives him a full working week after returning to demonstrate change.

---

## 13. DATA LIMITATIONS

- Monday.com activity logs capture board interactions, not physical presence
- Monday 9 Feb (12:44 start) was explained — assigned to iPhone screen refurb not tracked in Monday
- Time tracking on items is self-reported (start/stop timers)
- "Repair Paused" has legitimate uses (glue, parts, equipment) — not all pauses = disengagement
- 3-week window with baseline of only 1 week — could be normal variance
- No visibility into mentoring/supervision time spent on Andreas
- Team meeting start times assumed at 09:00 — actual start time may vary
- **Time tracking is cumulative per item, not per day.** Monday.com API doesn't expose individual timer sessions. When an item takes 3 days and has 4h logged total, all 4h is attributed to the day it was completed. Daily utilisation figures are unreliable — use period-level averages instead.
- **Revenue attribution:** When both refurb and repair time are logged on an item, revenue/profit is split 50/50. 7 items (12% of completions) were shared. The split is approximate — actual work distribution may differ.
- **BM item matching:** BM board items matched to main board items by order number in item name (e.g., "BM 1388"). Board relation links are empty but name matching captures all 27 BM items. 5 items show £0 revenue because they haven't been sold yet (recently completed or returns still in pipeline).
- **QC rework detection:** Counts items transitioning from "QC Failure → Under Refurb" in Mykhailo's activity logs. This captures reworks he picks up, not items currently sitting in QC failure waiting. 10.9% rate needs team-wide comparison to determine if it's normal for refurb work.

---

**CORRECTION LOG:**
- **2 March 2026 (post-Andreas audit):** Communication section corrected. Original methodology only checked activity log events (column changes) and found "1 update in 3 weeks." Subsequent query of item update replies found 83 replies (4.9/day). Communication severity downgraded from Medium to Low. Affected sections: Executive Summary, Key Metrics, Section 8, Section 10, Section 11, Recommendations.

*Audit generated: 2026-03-02 by Claude Code*
*Data sources: Monday.com Main Board API (activity logs + item details), Monday.com BM Board (sale prices, fees, purchase costs), Ferrari daily board (meeting durations)*
*Financial methodology: BM items = sale - purchase - fee - tax - labour (£15/hr) - shipping (£15). Client repairs = payment inc VAT. 50/50 split on shared items.*
*Context provided by Ricky: annual leave 14 Feb, sick day 21 Feb, iPhone refurb task 9 Feb*
*Next review due: 2026-03-16*
