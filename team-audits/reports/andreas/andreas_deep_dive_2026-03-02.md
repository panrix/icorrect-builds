# Andreas Egas — Deep Dive Performance Audit
## Audit Date: 2 March 2026
## Period Reviewed: 9 February – 1 March 2026 (3 weeks)

**Auditor:** Ricky Panesar (via Claude Code)
**Data Sources:** Monday.com API (Board 349212843 activity logs + item details + update replies), Ferrari's daily board (18393875720, team meeting durations), BM Board (3892194968, financials), Mykhailo audit for comparison, historical baseline (Jan 26 – Feb 8)
**Context:** Andreas works in the refurb room alongside Mykhailo. Also covers 1h/day front desk (end of day, Ramadan cover for Adil). Was previously underperforming and considered for removal — Mykhailo brought him into the refurb room and numbers improved.

---

## 1. EXECUTIVE SUMMARY

Andreas is a reliable technician with the best quality on the team (2.2% QC failure rate vs 10.4% Mykhailo, 15.3% Safan). His 3-week average is 2.7 completions/day — below his 4/day target — but this is heavily dragged down by 3 days in week 2 where Adil was on annual leave and Andreas covered front desk full-time (0, 0, and 1 completions). Excluding those front desk days, he's at 3.2/day.

**The refurb room is not declining overall.** Week 3 was the strongest week (41 combined completions, 3.4/person-day). The week 2 dip was caused by Andreas being pulled to full-time front desk, not by declining performance.

His punctuality is acceptable on weekdays (arrives for meetings, starts within 15 min). Saturdays are consistently late (10:15, 10:23) — a pattern shared with Mykhailo that may be workshop culture rather than individual failure. One notable exception: **Thu 26 Feb he arrived 110 min late (10:50) — same night Mykhailo messaged Ricky saying he was drunk.** They were out drinking together on a work night.

**This is not a Mykhailo-style engagement problem.** Andreas shows up, works, produces quality output, communicates well (104 update replies in 3 weeks — best on team), and stays late when needed. Historical baseline (Jan 26 – Feb 8) confirms 3.2/day is his consistent rate with no decline. His constraints are: front desk duty is worse than assumed (customer interruptions throughout the day, not just 1h), lower-value items (£189/completion vs baseline £327 — a 42% drop), and the social dynamic with Mykhailo (the drinking night). He's a follower, not an instigator — but he follows Mykhailo's lead, for better and worse.

---

## 2. KEY METRICS

| Metric | Baseline (Jan 26-Feb 8) | Current (Feb 9-Mar 1) | Mykhailo (Current) | Target |
|--------|------------------------|----------------------|-------------------|--------|
| **Completions/day** | **3.2** | **2.7 (3.2 refurb only)** | 3.4 | 4 |
| **Revenue/day** | £1,062 | £511 (£620 refurb only) | £977 | — |
| **Revenue/completion** | **£327** | **£189** | £284 | — |
| **Profit/completion** | £217 | £106 | £187 | — |
| **QC failure rate** | 2.6% (1/39) | 2.2% (1/46) | 10.9% (6/55) | <10% |
| **Peak day** | **5** | 4 | 5 | — |
| **Update replies** | — | **104** | 83 | — |
| **Days worked** | 12/12 | 17/18 | 16/18 | — |

**Volume is identical: 3.2/day in both periods.** The headline drop to 2.7 is entirely caused by 3 front desk days (Adil's leave). Revenue per completion dropped 42% (£327 → £189) — he's doing the same amount of work on lower-value items.

### Weekly Output

| Period | Days | Completed | Per Day | Revenue | Rev/Item | Notes |
|--------|------|-----------|---------|---------|----------|-------|
| **Baseline: Jan 26-Feb 1** | 6 | 22 | 3.7 | £6,429 | £292 | No meetings, no front desk |
| **Baseline: Feb 2-8** | 6 | 17 | 2.8 | £6,313 | £371 | Meetings started |
| Feb 9-14 | 6 | 19 | 3.2 | £4,516 | £238 | Solid week, incl Saturday |
| Feb 16-21 | 5 | 8 | 1.6 | £784 | £98 | Wed-Fri: Adil on leave (front desk). Sat 21: annual leave |
| Feb 23-Mar 1 | 6 | 19 | 3.2 | £3,383 | £178 | Recovery — matched week 1 |
| **Current total** | **17** | **46** | **2.7** | **£8,681** | **£189** | |

Revenue per item has been declining week over week (£292 → £371 → £238 → £98 → £178). The baseline weeks had higher-value items. Current period items average £189 vs £327 in the baseline. This is an allocation change, not a performance change.

---

## 3. LATE START ANALYSIS — MEETING-ADJUSTED

### Meeting Days (11 days)

| Day | Start | Meeting | Adj Start | Late By | Verdict |
|-----|-------|---------|-----------|---------|---------|
| Mon 9 Feb | 11:54 | 25m | 09:24 | **150m** | **VERY LATE — short meeting** |
| Tue 10 Feb | 00:51* | 96m | 10:36 | — | *Data anomaly — midnight log event* |
| Wed 11 Feb | 10:11 | 49m | 09:48 | 23m | Minor |
| Fri 13 Feb | 10:44 | 105m | 10:45 | 0m | ON TIME |
| Mon 16 Feb | 09:04 | 101m | 10:40 | 0m | ON TIME (arrived before meeting) |
| Tue 17 Feb | 10:34 | 76m | 10:16 | 18m | Minor |
| Wed 18 Feb | 09:03 | 95m | 10:35 | 0m | ON TIME (arrived before meeting) |
| Thu 19 Feb | 09:09 | 101m | 10:40 | 0m | ON TIME (arrived before meeting) |
| Mon 23 Feb | 09:56 | 60m | 10:00 | 0m | ON TIME |
| Tue 24 Feb | 09:54 | 137m | 11:17 | 0m | ON TIME (before meeting ended) |
| Wed 25 Feb | 09:41 | 35m | 09:34 | 7m | ON TIME |
| Fri 27 Feb | 10:04 | 56m | 09:55 | 9m | ON TIME |

**8 of 11 meeting days: on time.** 2 minor delays (18-23m). 1 genuinely late (Mon 9 Feb — 150m, the first day in the period with only a 25m meeting).

*Feb 10 "00:51" is a data anomaly — likely a midnight automation event. His real work started after the 96m meeting.

### Non-Meeting Days (5 active days)

| Day | Start | Late By | Verdict |
|-----|-------|---------|---------|
| Thu 12 Feb | 09:15 | 15m | ON TIME |
| Sat 14 Feb | 10:15 | **75m** | **LATE** |
| Fri 20 Feb | 09:33 | 33m | Minor |
| Thu 26 Feb | 10:50 | **110m** | **VERY LATE — out drinking with Mykhailo night before** |
| Sat 28 Feb | 10:23 | **83m** | **LATE** |

**Pattern:** Both Saturdays are late (~10:15-10:23). One Thursday very late (10:50). Weekday non-meeting starts are generally acceptable.

### Comparison — Andreas vs Mykhailo Late Starts

| | Andreas | Mykhailo |
|---|---------|----------|
| Meeting days on time | 8/11 (73%) | 9/16 (56%) |
| Non-meeting days late 70+ min | 3/5 (60%) | 3/4 (75%) |
| Saturday pattern | 10:15, 10:23 | 10:30 |
| Weekday pattern | Generally on time | 70-90m late when no meeting |

**Andreas is noticeably more punctual than Mykhailo on weekdays.** Both share the same Saturday late-start pattern — this may be a workshop culture issue rather than individual failure.

---

## 4. WEEK 2 FRONT DESK COVERAGE (Feb 18-20)

**Confirmed:** Adil was on annual leave Feb 18-20. Andreas covered front desk full-time.

| Day | Start | Completions | Items Touched | Revenue | Role |
|-----|-------|-------------|---------------|---------|------|
| Wed 18 Feb | 09:03 | **0** | 12 | £0 | Front desk (Adil on leave) |
| Thu 19 Feb | 09:09 | **0** | **31** | £0 | Front desk (Adil on leave) |
| Fri 20 Feb | 09:33 | **1** | 18 | £0 | Front desk (Adil on leave) |

**31 items touched on Feb 19 with zero completions = front desk intake work.** He was logging devices, updating statuses, handling walk-ins and deliveries — not doing refurb. The 1 completion on Friday was likely squeezed in between front desk duties.

**On those same 3 days, Mykhailo completed 2, 4, and 4 items = 10 total.** This confirms the refurb room wasn't blocked — Mykhailo carried on as normal while Andreas was out covering Adil.

### Impact on Numbers

| Metric | Including Front Desk Days | Excluding Front Desk Days |
|--------|--------------------------|--------------------------|
| Completions/day | 2.7 | **3.2** |
| Revenue/day | £511 | **£620** |
| Working days | 17 | 14 (refurb only) |

The 3 front desk days account for the entire gap between his raw average (2.7) and his actual refurb output (3.2). **His refurb performance should be measured on refurb days only.**

### The Real Cost of Adil's Leave

When Adil takes leave, someone has to cover front desk. That someone is Andreas — which means the refurb room loses a tech for the duration. Cost:

- 3 days × 3.2 expected completions = ~10 missed refurb completions
- At £189/completion = **~£1,890 in delayed refurb revenue**
- Plus whatever front desk work Andreas handled (not tracked in Monday.com)

This is a structural problem: there's no front desk backup plan that doesn't cannibalise refurb output.

---

## 5. FRONT DESK IMPACT

Andreas has two front desk obligations:
1. **Daily:** 1h end-of-day coverage (Ramadan, Adil leaves early)
2. **Ad hoc:** Full-day coverage when Adil takes leave (Feb 18-20 in this period)

### Daily 1h Coverage — Time Cost
- 1h/day = ~14% of available refurb time (7h after meetings → 6h after meetings + front desk)
- Over 14 refurb days = ~14 hours pulled from refurb
- At ~0.5 completions/hour, that's ~7 missed completions over the period
- ~£1,300 in revenue opportunity cost

### Full-Day Coverage — Catastrophic to Refurb Output
- Feb 18-20: 3 full days on front desk = 0+0+1 completions vs ~10 expected
- ~£1,890 in delayed refurb revenue from one 3-day absence
- If Adil takes 1 week leave per quarter, that's ~£2,500/quarter in lost refurb output

### Context Switching Cost — Worse Than Expected
His update replies prove the front desk isn't a contained 1h block — customers interrupt him throughout the day:

> "DUring this repair i seen 5 customers" (Feb 24, BM 1425)
> "during this repair i seen 3 customers" (Feb 26, BM 1449)
> "seen 3 customers during this repair" (Feb 27, Daniel Tiley)
> "during this repair i seen 1 customer" (Feb 27, BM 1465)

That's 12 customer interruptions across 4 days he documented. Each means: stop refurb → handle customer → restart refurb. On Feb 24 alone, 5 customers during a single repair (BM 1425 — lid replacement, LCD cut, backlight replacement). That item was completed but the interruptions add up.

**The TEAM.md concern is relevant here:** Andreas "was previously highly distractible when sitting with Adil." The front desk puts him back in Adil's orbit — not just for 1h, but for scattered interruptions throughout the day. Full-day coverage (Adil's leave) puts him there all day.

### Per-Hour Productivity Comparison

| Metric | Andreas | Mykhailo |
|--------|---------|----------|
| Completions/day | 3.2 (excl anomaly) | 3.4 |
| Estimated available refurb hours/day | ~6h | ~7h |
| Completions/hour | **0.53** | **0.49** |

**When accounting for front desk time, Andreas's per-hour refurb productivity is higher than Mykhailo's.** The volume gap is primarily a time allocation problem, not a skill or effort problem.

---

## 6. COMPLETION vs PAUSE RATIO

| Week | Completed | Paused | Completion Ratio |
|------|-----------|--------|-----------------|
| Feb 9-14 | 19 | 13 | 59% |
| Feb 16-20 | 8 | 10 | 44% |
| Feb 23-Mar 1 | 19 | 11 | 63% |
| **3-week total** | **46** | **34** | **58%** |

Week 2's low ratio (44%) is driven by the anomaly days. Weeks 1 and 3 are consistent (59%, 63%).

**Comparison:** Mykhailo's ratio is 56% (55 completed / 44 paused). Andreas's is slightly better at 58%.

### Pause Reasons

| Reason Pattern | Count |
|----------------|-------|
| Repair Paused → Under Refurb (resumed later) | 8 |
| Repair Paused → Repaired (completed from pause) | 4 |
| Repair Paused → Client To Contact | 3 |
| Repair Paused → Diagnostic Complete | 3 |
| Repair Paused → Software Install | 2 |
| Repair Paused → Diagnostics | 2 |
| Other | 12 |

Pause reasons are mixed — some legitimate (waiting for client, diagnostic complete) and some indicate work in progress (resumed under refurb). No pattern of systematic abandonment like Mykhailo's Saturday.

---

## 7. QC QUALITY

### This Period (Feb 9 – Mar 1)

| Metric | Value |
|--------|-------|
| Completions | 46 |
| QC reworks | 1 |
| QC failure rate | **2.2%** |
| When | Thu 26 Feb — his best completion day (4 items) |

### February Monthly Comparison (from quality report)

| Tech | Completions | QC Failures | QC Rate |
|------|------------|-------------|---------|
| **Andreas** | **57** | **2** | **3.5%** |
| Mykhailo | 67 | 7 | 10.4% |
| Safan | 98 | 15 | 15.3% |

**Andreas is the quality leader by a significant margin.** His QC rate is 3x better than Mykhailo and 4x better than Safan. The single QC rework in this period happened on his highest-output day (4 completions on Thu 26 Feb) — not a quality issue, likely a rush on a busy day.

**Zero BM returns attributed to Andreas.** Same as Mykhailo — the refurb room's return rate is clean.

---

## 8. COMMUNICATION — UPDATE REPLIES

**The original assessment of "zero communication trail" was wrong.** That assessment was based on activity log events only. Checking item update replies reveals a completely different picture.

### Andreas: 104 replies in 3 weeks (6.1/day)

He writes detailed diagnostic descriptions, repair notes, parts used, issues found, and customer interaction logs. Examples:

> "Lcd replaced , for some reason WiFi really low need to check it on tuesday"
> "Lid reshaped as much as i could still some yellowing at bottom left corner . key arrow mechanisms replaced"
> "Battery replaced , calibration took a lot of time"
> "After battery replacement , image only diplaying while charger its connected , battery its not bypassing something wrong with logic board"
> "I think this macbook its ber and @Safan Patel please check it"

He tags Ferrari, Safan, Adil, and Ricky when escalating. He attaches photos. He writes honest assessments of problems ("unable to proceed", "this macbook is ber").

### Mykhailo: 83 replies in 3 weeks (5.2/day)

More standardised — typically "Post repair: All good, [what was done]":

> "Post repair: All good, screen replaced"
> "Post repair: All good, screen BOE replaced without soldering ICs"
> "I damaged a LCD @Ricky Panesar we haven't LCD for 2681"

Also tags Ferrari, Safan, Roni, and Adil. Also attaches photos. But shorter and more formulaic than Andreas.

### Comparison

| | Andreas | Mykhailo |
|---|---------|----------|
| Replies in 3 weeks | **104** | 83 |
| Per working day | **6.1** | 5.2 |
| Style | Detailed diagnostics, fault descriptions, customer notes | Standardised "Post repair" notes |
| Escalations | Tags Ferrari, Safan, Adil, Ricky | Tags Ferrari, Safan, Roni, Adil |
| Transparency | Notes problems honestly, flags BER, asks for help | Notes issues but less detail on failures |

**Andreas is the better communicator.** Both write regularly (the "1 update in 3 weeks" from the Mykhailo audit was incorrect — that methodology only checked activity log events, not item update replies). But Andreas writes more, with more detail, and is more transparent about problems.

### Front Desk Interruption Evidence (Andreas's Own Words)

Andreas logs when customers interrupt his repairs:

| Date | Item | Note |
|------|------|------|
| Feb 24 | BM 1425 (Oliwia Kaczmara) | "DUring this repair i seen 5 customers" |
| Feb 26 | BM 1449 (Harry Matthews) | "during this repair i seen 3 customers" |
| Feb 27 | #1077 - Daniel Tiley | "seen 3 customers during this repair" |
| Feb 27 | BM 1465 (Kristina Sarkisova) | "during this repair i seen 1 customer" |
| Feb 28 | — | No interruption notes |

**The front desk impact is worse than "1h at end of day."** He's seeing 1-5 customers during individual repairs throughout the day, not just in a contained hour at the end. Each interruption means stopping mid-repair, handling a customer, then restarting. This is exactly the context-switching cost that's hardest to quantify but most damaging to refurb throughput.

> **NOTE:** This also corrects the Mykhailo audit. The "1 written update in 3 weeks" finding should be revised to "83 update replies in 3 weeks." The original methodology only counted activity log column changes, not item update replies. Mykhailo's communication concern should be downgraded from "High" to "Low" — he IS writing post-repair notes consistently.

---

## 9. FINANCIAL IMPACT

### Revenue Through Andreas's Hands (3 Weeks)

| Week | Revenue | Profit | Completions | Rev/Day | Shared |
|------|---------|--------|-------------|---------|--------|
| Feb 9-14 (6 days) | £4,516 | £2,569 | 19 | £753 | 3 |
| Feb 16-20 (5 days) | £784 | £620 | 8 | £157 | 3 |
| Feb 23-28 (6 days) | £3,383 | £1,704 | 19 | £564 | 3 |
| **3-week total** | **£8,681** | **£4,894** | **46** | **£511** | **9** |

### Revenue Per Item — Why Andreas Is Lower

| | Andreas | Mykhailo | Gap |
|---|---------|----------|-----|
| Revenue/completion | £189 | £284 | -33% |
| Profit/completion | £106 | £187 | -43% |
| Revenue/day | £511 | £977 | -48% |

**Andreas generates significantly less revenue per item — confirmed by item breakdown:**

### Item Mix (Completed Items)

| Category | Andreas | Mykhailo |
|----------|---------|----------|
| BM trade-ins | 21 (46%) | 27 (49%) |
| Client repairs (with revenue) | 14 (30%) | 18 (33%) |
| Other (£0 / internal / unsold) | 11 (24%) | 10 (18%) |

Similar BM/client split. The difference is in **client repair value:**

**Mykhailo's top client repairs:** £618, £599, £549, £538, £430, £379, £349, £348, £339 — avg £328
**Andreas's top client repairs:** £399, £369, £344, £319, £299, £298, £229, £198, £159 — avg £224

Mykhailo gets the high-value complex jobs (£400+). Andreas gets the mid-range work. This is a 46% gap in client repair value — explains most of the revenue-per-completion difference.

Andreas also has 11 items with £0 revenue (24%) vs Mykhailo's 10 (18%). Some are unsold BM items in pipeline, some are internal/warranty work, some are corporate accounts billed separately.

### Revenue Per Completion — Declining Over Time

| Period | Rev/Completion | Notes |
|--------|---------------|-------|
| Baseline: Jan 26-Feb 1 | £292 | No meetings, no front desk |
| Baseline: Feb 2-8 | £371 | Meetings started |
| Feb 9-14 | £238 | Front desk started |
| Feb 16-21 | £98 | Mostly front desk + annual leave |
| Feb 23-Mar 1 | £178 | |

The value of items Andreas is working on has been declining. Whether this is because higher-value items are being routed to Mykhailo, or because the mix of work coming in has shifted, isn't clear from the data.

### Cost of Below-Target Output

| Scenario | Completions/Day | Revenue/Day | Annual Gap |
|----------|----------------|-------------|------------|
| Current (with front desk days) | 2.7 | £511 | — |
| Current (refurb days only) | 3.2 | £604* | — |
| Target (4/day) | 4.0 | £756* | — |
| Gap (refurb days vs target) | -0.8/day | -£151/day | ~£39,300/year |

*Estimated at £189/completion average.

**The annual gap to target is ~£39k.** However, ~£16k of that is explained by the daily front desk hour (~7 completions over 3 weeks × £189). A further ~£1,890 is the week 2 full front desk coverage (Adil's leave). The remaining shortfall (~£21k) is the real gap — about 0.4 items/day below where he should be on refurb-only days.

### Worst Days

| Date | Completions | Revenue | Profit | Notes |
|------|-------------|---------|--------|-------|
| Sat 28 Feb | 2 | £0 | -£134 | Net loss — items completed but not yet sold |
| Thu 19 Feb | 0 | £0 | £0 | Front desk (Adil on leave) — 31 items logged/updated |
| Wed 18 Feb | 0 | £0 | £0 | Front desk (Adil on leave) — 12 items logged/updated |

---

## 9. REFURB ROOM HEALTH — Is It Declining?

### Combined Room Output (Andreas + Mykhailo)

| Week | Andreas | Mykhailo | Room Total | Person-Days | Per Person/Day |
|------|---------|----------|------------|-------------|----------------|
| Feb 9-14 | 19 | 16 | 35 | 11 | 3.2 |
| Feb 16-20 | 8 | 17 | 25 | 10 | 2.5 |
| Feb 23-28 | 19 | 22 | 41 | 12 | **3.4** |

**Week 3 was the strongest week.** The room is not declining — it's recovering.

The week 2 dip (2.5/person-day) was caused by Adil's annual leave pulling Andreas to full-time front desk. Mykhailo maintained 3.4/day that week. If Andreas had been on refurb (3.2/day), week 2 would have been 33 completions (3.3/person-day) — consistent with the other weeks.

### Answer: Is the refurb room declining overall?

**No.** The data shows:
- Week-on-week, the room improved (3.2 → 2.5 → 3.4 per person/day)
- Week 3 was the highest output week
- The week 2 dip was entirely caused by Adil's leave (Andreas on front desk), not declining performance
- Both techs' quality is holding (QC rates within normal range)

**Mykhailo's issue is engagement/attendance.** When he works, he's productive. **Andreas's issue is capacity** — front desk duty (daily 1h + ad hoc full coverage) eats into his refurb time, and he's allocated lower-value items.

---

## 10. IS MYKHAILO SUPERVISING ANDREAS?

### What the Data Shows

**Shared items:** 9 of Andreas's 46 completions (20%) had both refurb and repair time logged — meaning another tech also worked on the device. This indicates some collaboration, likely with Safan (repair tech) rather than Mykhailo (both are refurb).

**No written evidence of mentoring.** Zero updates from Mykhailo about Andreas's progress, development areas, or blockers. Zero updates from Andreas referencing guidance from Mykhailo. The communication trail is empty.

**Front desk days (Feb 18-20):** Mykhailo worked solo in the refurb room while Andreas covered for Adil. Mykhailo completed 10 items across those 3 days — no drop in his output. The room doesn't collapse without Andreas; Mykhailo just operates at his normal rate.

**Output patterns are independent.** Their completion rates don't correlate day-to-day. When Mykhailo had his worst day (Sat 28 Feb: 2 completions), Andreas also had 2 completions — but that Saturday pattern appears to be shared workshop culture, not supervision.

**The drinking night (Thu 26 Feb):** Both came in late the next day — Mykhailo at 10:11, Andreas at 10:50. Mykhailo messaged Ricky the night before saying he was drunk. Andreas didn't message anyone. **This is the clearest evidence of the social dynamic:** they went out together on a work night, both showed up late, but Mykhailo at least communicated while Andreas didn't. The "supervision" relationship includes a social dimension that's pulling Andreas into Mykhailo's bad habits.

### Assessment

The TEAM.md says Mykhailo "actively supervises him day-to-day, helping him when he gets stuck" and "has paced Andreas and brought his numbers up." **This may be true in the room — physical presence, verbal guidance, showing technique — but none of it is visible in the data.**

What IS visible:
- Andreas's QC rate (2.2%) is dramatically better than Mykhailo's (10.9%). If Mykhailo is teaching him, the student has surpassed the teacher on quality.
- They share the same Saturday late-start pattern and went out drinking together on a work night. The social dynamic is visible; the professional mentoring is not.

**Bottom line:** The Mykhailo-Andreas relationship has two sides. Professionally — he may be teaching Andreas refurb techniques, but there's zero documentation and the quality data suggests Andreas doesn't need much help. Socially — Mykhailo's influence is pulling Andreas into late starts and a drinking-on-work-nights culture. If Mykhailo's behaviour doesn't improve, it will drag Andreas down. Andreas is a follower — the question is who he follows.

---

## 11. HONEST ASSESSMENT

Andreas is the opposite of Mykhailo's problem. He's not disengaged — he shows up, does good work, and his quality is the best on the team. His issues are mostly structural, with one behavioural concern.

| Signal | Severity | What It Means |
|--------|----------|--------------|
| 3.2/day on refurb days (same as baseline) | **Positive** | No decline in volume — he's consistent |
| Revenue per item £189 vs baseline £327 | **Medium** | 42% drop — getting lower-value items, not producing less |
| Week 2 (0, 0, 1 completions) | **Explained** | Adil on annual leave — Andreas covering front desk full-time |
| Drinking night with Mykhailo (Thu 26 Feb) | **Medium** | Social dynamic — following Mykhailo's lead, didn't message Ricky |
| Saturday late starts (10:15, 10:23) | Low | Consistent since baseline (10:14-10:18) — established pattern, not new |
| QC rate 2.2% | **Positive** | Best on team by 3x, consistent across both periods |
| 104 update replies in 3 weeks | **Positive** | Best communicator on the team — detailed diagnostics, photos, escalations |
| Front desk interruptions (1-5 customers per repair) | **Medium** | Worse than assumed — not a contained 1h block, scattered throughout day |
| Front desk full days (Adil's leave) | **Medium** | No backup plan — loses entire refurb days |

### What's Working
- **Quality is excellent** — fewest QC failures (2.2%), zero BM returns, consistent across both periods
- **Communication is strong** — 104 update replies, detailed diagnostics, photos, escalations. Best on team.
- **Volume is stable** — 3.2/day in both baseline and current period. No decline.
- **Attendance is good on weekdays** — arrives for meetings consistently
- **Per-hour productivity beats Mykhailo** — 0.53 vs 0.49 completions/hour
- **Honest and transparent** — flags BER devices, notes problems, asks for help when stuck

### What's Not Working
- **Revenue per item collapsed** — £327 → £189 (42% drop). Same output, lower-value items.
- **Front desk duty is worse than assumed** — not 1h/day, scattered customer interruptions + full days when Adil is off
- **Below 4/day target** — but target doesn't account for front desk time. Realistic target with current duties is ~3.5/day.
- **Susceptible to Mykhailo's social influence** — the drinking night shows he'll follow rather than self-regulate
- **Peak day dropped** — 5 in baseline → 4 in current. Could be front desk drag or item mix.

### Historical Baseline Comparison (Jan 26 – Feb 8)

| Metric | Baseline | Current | Change |
|--------|----------|---------|--------|
| Completions/day | 3.2 | 3.2 (refurb) | **No change** |
| Revenue/completion | £327 | £189 | **-42%** |
| Profit/completion | £217 | £106 | **-51%** |
| QC rework rate | 2.6% | 2.2% | Stable |
| Peak day | 5 | 4 | -1 |
| Days off | 0/12 | 1/18 (annual leave) | Consistent |
| Saturday starts | 10:14, 10:18 | 10:15, 10:23 | Consistent pattern |

**The baseline proves there is no performance decline.** His refurb output is rock-solid at 3.2/day across 5 weeks. Quality is consistent. Attendance is consistent. The only thing that's changed is the value of items he's working on and the addition of front desk duties.

### Previous Context (from TEAM.md)

Andreas was previously underperforming and distractible — "a performance review out of the business was considered." Mykhailo brought him into the refurb room and "numbers have been consistently improving." **The baseline data confirms the turnaround held** — he's a reliable 3.2/day producer with the best quality on the team. The previous concerns about attitude and distractibility are not visible in the current data, with the exception of the drinking night.

**Two old concerns resurfacing:**
1. "Was previously highly distractible when sitting with Adil" — he now does 1h/day front desk with Adil, plus full days when Adil takes leave.
2. "Attitude was flagged as a serious concern" — the drinking night suggests he's influenced by whoever he's closest to. With Mykhailo's engagement declining, that influence is going the wrong way.

---

## 12. RECOMMENDATIONS

### Open Question

**Is he being given lower-value items intentionally?** £189/completion vs Mykhailo's £284 is a 33% gap. If the allocation is deliberate (junior gets simpler jobs while he builds speed), it's fine. If it's random, he's leaving money on the table.

### Adil's Leave — Need a Backup Plan

When Adil takes leave, Andreas covers front desk full-time and the refurb room loses a tech. Feb 18-20 cost ~10 missed refurb completions (~£1,890). Options:
- **Accept it** — 3 days/quarter is manageable, just plan for reduced refurb output
- **Cross-train someone else** — Roni or another team member covers basic front desk so Andreas stays on refurb
- **Close front desk** — mail-in only during Adil's leave days (extreme, probably not viable)

### If Ramadan Coverage Continues

| Action | Impact |
|--------|--------|
| Shift front desk hour to start of day (before refurb begins) instead of end of day | Eliminates mid-refurb context switching |
| Cap front desk at exactly 1h with a hard handoff time | Prevents drift into 2h+ coverage days |
| Track front desk days separately in Monday.com | Makes the time cost visible instead of hidden in refurb numbers |

### For the 16 March Review

Andreas doesn't need the same kind of conversation as Mykhailo. He needs:

| What | Why |
|------|-----|
| Acknowledge the quality — 2.2% QC rate is the standard | Positive reinforcement. He should know he's the quality leader. |
| Set a volume target: 3.5/day (accounting for front desk) | Realistic. 4/day is the target without front desk drag. 3.5 is fair with it. |
| Address the drinking night directly | "You and Mykhailo both came in late on the 27th after a night out. I need you to make your own choices about work nights, regardless of what anyone else is doing." |
| Review Saturday expectations | If both techs are arriving at 10:15-10:30 on Saturdays, either the expectation is 09:00 and it needs enforcing, or the expectation is actually 10:00 and nobody's said it. |

### Structural Changes to Consider

| Change | Impact |
|--------|--------|
| End Ramadan front desk coverage (when Adil returns to full hours) | +1h/day refurb time, +7 completions per 3-week period |
| Mix higher-value items into Andreas's queue | Improve revenue per completion from £189 toward £230+ |
| Weekly refurb room target (combined, not individual) | Aligns both techs toward room output rather than individual comparisons |
| Mykhailo writes 1 update/week on Andreas's development | Creates the mentoring trail that's currently invisible |
| Monitor the social dynamic | If Mykhailo doesn't improve, his influence on Andreas becomes a risk factor |

---

## 13. DATA LIMITATIONS

- ~~**No historical baseline for Andreas.**~~ **RESOLVED.** Baseline (Jan 26 – Feb 8) now included: 3.2/day, £327/completion, 2.6% QC rate. Confirms no decline in volume.
- **Slack history not pulled.** No Slack API access from this environment. Ricky confirms Andreas doesn't write much on Slack. His communication happens in Monday.com item replies (104 in 3 weeks).
- **Feb 10 "00:51" start time is a data anomaly.** Likely a midnight automation event. Real work started after the 96m meeting. Excluded from late start analysis.
- **Feb 16 finish time of 22:21** — either a very long day (13.3h) or a late automation event. Flagged but not used in analysis.
- **Front desk time is not tracked separately in Monday.com.** But Andreas's own update replies ("during this repair i seen 5 customers") prove interruptions happen throughout the day, not just in a contained end-of-day block. Full-day coverage (Feb 18-20, Adil's leave) confirmed by Ricky.
- **Mykhailo audit correction needed.** The "1 written update in 3 weeks" finding was wrong — Mykhailo wrote 83 update replies in the same period. The original methodology only checked activity log column changes, not item update replies. Both techs communicate regularly.
- **Revenue attribution:** Same methodology as Mykhailo audit — BM items = sale - purchase - fee - tax - labour - shipping. Client repairs = payment inc VAT. 50/50 split on shared items (9 items, 20% of Andreas's completions).
- **Time tracking is cumulative per item, not per day.** Daily utilisation figures are unreliable. Period-level averages are more meaningful.
- **"Items touched" doesn't distinguish between refurb work and other board activity.** The 31-item day could be front desk intake, stock checks, or diagnostic triage — all look the same in activity logs.
- **No visibility into front desk performance.** When Andreas covers front desk, we have no metrics on what he does there — walk-ins handled, devices logged, time per interaction. His front desk output is invisible.
- **Shared item detection** (50/50 split) relies on both refurb and repair time being logged on the same item. If one tech forgot to start a timer, the split won't trigger and the completing tech gets full credit.

---

*Audit generated: 2026-03-02 by Claude Code*
*Data sources: Monday.com Main Board API (activity logs + item details), Monday.com BM Board (sale prices, fees, purchase costs), Ferrari daily board (meeting durations)*
*Financial methodology: BM items = sale - purchase - fee - tax - labour (£15/hr) - shipping (£15). Client repairs = payment inc VAT. 50/50 split on shared items.*
*Comparison data: Mykhailo deep dive (same period), Monthly quality report (Feb 2026)*
*Next review due: 2026-03-16*
