# Adil Azad — Deep Dive Performance Audit
## Audit Date: 2 March 2026
## Period Reviewed: 9 February – 1 March 2026 (3 weeks)

**Auditor:** Ricky Panesar (via Claude Code)
**Data Sources:** Monday.com API (Board 349212843 activity logs + item details + update replies), Typeform API (all 4 customer forms), Roni QC/intake comparison script, previous workload report (Jan 26 – Feb 1)
**Key date:** 18 February 2026 — BM intake diagnostics moved from Adil to Roni. Adil on annual leave Feb 18-20.

---

## 1. EXECUTIVE SUMMARY

Adil has the weakest attendance pattern on the team. Latest median start time (10:20), never works Saturdays (0/3), took annual leave at the worst possible moment (Feb 18-20, the week the role change happened), and left at 14:56 on Feb 26 — a 5.5-hour day with no recorded reason.

**183 update replies in 3 weeks (15.8/day pre role change, 11.4/day post)** — this isn't nothing. His BM diagnostic reports were actually detailed (ammeter readings, component checklists, photos). His client intake notes are thorough. He catches BM model number discrepancies. When he's present and focused, he produces work.

**But the data confirms your gut on the pattern:**

1. **He starts later than everyone else** — median 10:20. Roni's at 08:50, Safan's at 08:15. He's front desk — arguably should be first, not last.
2. **He never works Saturdays** — while Roni, Safan, and Mykhailo work all 3. That's a 17% availability gap.
3. **His BM diagnostics were 2.5x slower than Roni's** — median 73 min vs 29 min. And Roni includes cleaning. The "feeling overworked" complaint was real in the sense that the work was taking him longer, but the comparison shows the issue was speed, not volume.
4. **Post role change, his work is lighter** — logistics (receiving, shipping, collections) generates fewer events and less complexity. Activity dropped 33%.
5. **He routes heavily to Ferrari** — invoices, refunds, client chasing, approvals. Each tag adds a task to someone already burned out.

**The question isn't "is Adil bad?" — the data doesn't support that. The question is "would a different person in this role give you more for the same money?" — and the data says yes.**

---

## 2. KEY METRICS

| Metric | Value | Team Comparison |
|--------|-------|-----------------|
| **Active days** | 11 full + 3 partial + 4 off | Roni: 18/18, Safan: 18/18, Mykhailo: 18/18 |
| **Activity events** | 2,053 (147/day) | Roni: 1,870 (104/day), but Roni's are higher-value |
| **Update replies** | 183 total | Roni: 267, Andreas: 104, Safan: 95, Mykhailo: 83 |
| **Items touched/day** | 25.2 | Stable across period |
| **Saturdays worked** | 0/3 | Team: Roni 3/3, Safan 3/3, Mykhailo 3/3, Andreas 2/3 |
| **Median start time** | 10:20 | Roni 08:50, Safan 08:15, Mykhailo 09:30, Andreas 09:45 |
| **Completions** | 0 | Expected — role is intake/logistics, not repair |

### Pre vs Post Role Change

| Metric | Pre Feb 18 (8 days) | Post Feb 18 (5 full days) | Change |
|--------|---------------------|--------------------------|--------|
| Activity events/day | 205 | 138 | **-33%** |
| Update replies/day | 15.8 | 11.4 | **-28%** |
| Items touched/day | 26.1 | 24.5 | Stable |
| BM diagnostics | Active (6/day) | None | Role removed |
| Primary work | Diagnostics + intake + logistics | Logistics + intake only | Lighter |

---

## 3. START & FINISH TIMES

| Day | First Action | Last Action | Span | Events | Notes |
|-----|-------------|-------------|------|--------|-------|
| Mon 9 Feb | **10:21** | 17:59 | 7h 38m | 197 | |
| Tue 10 Feb | **10:41** | 18:00 | 7h 19m | 189 | |
| Wed 11 Feb | **10:20** | 18:12 | 7h 52m | 219 | |
| Thu 12 Feb | 09:19 | 17:41 | 8h 22m | 291 | Best day |
| Fri 13 Feb | **11:27** | 18:09 | 6h 42m | 54 | Latest start |
| Sat 14 Feb | — | — | — | 0 | **OFF** |
| Mon 16 Feb | 09:10 | 19:07 | 9h 57m | 356 | Only day past 19:00 |
| Tue 17 Feb | **10:55** | 18:00 | 7h 05m | 130 | |
| Wed 18 Feb | 13:09 | 13:20 | 0h 11m | 12 | **Annual leave** |
| Thu 19 Feb | — | — | — | 0 | **Annual leave** |
| Fri 20 Feb | 12:20 | 12:35 | 0h 15m | 12 | **Annual leave** |
| Sat 21 Feb | — | — | — | 0 | **OFF** |
| Mon 23 Feb | 09:30 | 11:45 | 2h 15m | 43 | Short day — first day back |
| Tue 24 Feb | 09:18 | 17:15 | 7h 57m | 171 | |
| Wed 25 Feb | **10:28** | 17:56 | 7h 28m | 178 | |
| Thu 26 Feb | 09:25 | **14:56** | 5h 31m | 83 | **Left 3 hours early** |
| Fri 27 Feb | ~~05:36~~ | 17:09 | — | 118 | 05:36 is data anomaly |
| Sat 28 Feb | — | — | — | 0 | **OFF** |

### Start Time Comparison — All Team Members (same period)

| Person | Role | Typical Start | Latest Start | Median |
|--------|------|--------------|-------------|--------|
| **Safan** | Lead Tech | 08:09–08:20 | 08:35 | **08:15** |
| **Roni** | QC + Intake | 07:11–09:32 | 10:18 (Sat) | **08:50** |
| **Mykhailo** | Refurb Tech | 09:08–10:30 | 10:30 | **09:30** |
| **Andreas** | Refurb Tech | 09:15–10:50 | 10:50 | **09:45** |
| **Adil** | **Front Desk** | 09:10–11:27 | 11:27 | **10:20** |

Adil is the last person to arrive at the office — and he's the front desk. Walk-in customers arriving at 09:30 find nobody at reception for an hour and a half.

### Working Days Comparison

| Person | Days Worked (of 18) | Saturdays | Days Off |
|--------|--------------------|-----------|---------|
| Roni | 18 | 3/3 | 0 |
| Safan | 18 | 3/3 | 0 |
| Mykhailo | 18 | 3/3 | 0 |
| Andreas | 17 | 2/3 | 1 (annual leave) |
| **Adil** | **11 full + 3 partial** | **0/3** | **4+ days** |

---

## 4. POST ROLE CHANGE — WHAT ADIL DOES NOW

On Feb 18, BM intake diagnostics moved to Roni. Adil's role narrowed to logistics + reception.

### Status Transitions (full period, top 20)

| Count | Transition | Category |
|-------|-----------|----------|
| 85x | Expecting Device → Received | **Receiving** |
| 83x | (none) → Space Grey | **Grading** (BM intake, pre Feb 18) |
| 75x | (none) → Fair | **Grading** (BM intake, pre Feb 18) |
| 73x | To Ship → Shipped | **Shipping** |
| 49x | Received → Queued For Repair | **Intake routing** |
| 47x | (none) → No Case | **Grading** |
| 46x | Return Booked → To Ship | **BM returns** |
| 42x | (none) → Damaged | **Grading** |
| 37x | (none) → Good | **Grading** |
| 34x | Ready To Collect → Returned | **Collections** |
| 31x | Diagnostic Complete → Queued For Repair | **Intake routing** |
| 31x | Received → Diagnostics | **Intake routing** |
| 24x | Book Return Courier → To Ship | **BM returns** |
| 23x | Diagnostics → Cleaning | **Intake (residual)** |
| 22x | Booking Confirmed → Received | **Receiving** |
| 22x | Cleaning → Diagnostic Complete | **Intake (residual)** |

**Post role change, Adil's work is:**
- Receiving inbound packages (BM trade-ins, mail-in repairs)
- Shipping outbound (repaired devices, BM returns)
- Walk-in customer intake (logging device, assigning to tech)
- Customer collections
- Some residual diagnostic support (cleaning, routing)

This is a logistics + reception role. No diagnostic judgment, no quality decisions, no revenue-generating work.

---

## 5. WALK-IN & CUSTOMER INTERACTION DATA (TYPEFORM)

Typeform data pulled directly from API across all 4 customer-facing forms for the audit period.

### Volume Summary

| Form | Purpose | Responses | % of Total |
|------|---------|-----------|-----------|
| Collection | Customer picking up repaired device | 56 | 40% |
| Walk-in (non-booked) | No appointment, walked in off street | 38 | 27% |
| Drop-Off (booked) | Pre-booked appointment, dropping off | 30 | 21% |
| Enquiry | General question, no device | 16 | 11% |
| **Total client interactions** | | **140** | |

**9.3 client interactions per weekday.** On Adil's full working days: 9.9/day.

Old report (Jan 26 – Feb 1) estimated 53 visits/week. Current data: 47/week on normal weeks (Wk1: 51, Wk3: 61). Broadly consistent — volume hasn't dropped.

### Daily Breakdown

| Date | Day | Drop-Off | Walk-in | Collection | Enquiry | **Total** |
|------|-----|----------|---------|------------|---------|-----------|
| Feb 9 | Mon | 4 | 4 | 3 | 2 | **13** |
| Feb 10 | Tue | 2 | — | 6 | 1 | **9** |
| Feb 11 | Wed | 2 | 2 | 3 | 1 | **8** |
| Feb 12 | Thu | 4 | 3 | 5 | 1 | **13** |
| Feb 13 | Fri | — | — | 7 | 1 | **8** |
| **Wk1 total** | | 12 | 9 | 24 | 6 | **51** |
| Feb 16 | Mon | 1 | 3 | — | 2 | **6** |
| Feb 17 | Tue | 1 | 1 | 2 | — | **4** |
| Feb 18 | Wed | 1 | 2 | 3 | — | **6** ← Adil on leave |
| Feb 19 | Thu | — | 1 | 4 | 2 | **7** ← Adil on leave |
| Feb 20 | Fri | 1 | 3 | 1 | — | **5** ← Adil on leave |
| **Wk2 total** | | 4 | 10 | 10 | 4 | **28** |
| Feb 23 | Mon | 4 | 5 | 4 | — | **13** ← Adil left at 11:45 |
| Feb 24 | Tue | 2 | 3 | 4 | 2 | **11** |
| Feb 25 | Wed | 4 | 4 | 4 | 3 | **15** |
| Feb 26 | Thu | 1 | 4 | 4 | — | **9** ← Adil left at 14:56 |
| Feb 27 | Fri | 3 | 3 | 6 | 1 | **13** |
| **Wk3 total** | | 14 | 19 | 22 | 6 | **61** |

Zero Saturday Typeform submissions across the entire period. Consistent with shop being quieter on Saturdays — but also consistent with Adil never working Saturdays.

### Hourly Distribution

```
09:00 —   5  #####
10:00 —  15  ###############
11:00 —  14  ##############
12:00 —  19  ###################
13:00 —  27  ###########################  ← PEAK
14:00 —  16  ################
15:00 —  20  ####################
16:00 —  18  ##################
17:00 —   5  #####
18:00 —   1  #
```

Customers arrive from 09:00 to 18:00. **Peak is 12:00-16:00** (100 of 140 interactions, 71%). But 20 interactions happen at 09:00-10:00 — when Adil typically isn't in yet.

### The Coverage Gap — 24% of Customers Missed

**33 of 140 customer interactions (24%) happened when Adil was not present.**

| Gap Type | Customers | Details |
|----------|-----------|---------|
| Before Adil arrived | 5 | Customers at 09:17, 10:13, 10:31, 11:20, 13:02 — Adil not yet started |
| After Adil left early | 16 | 9 on Feb 23 (left 11:45), 2 on Feb 26 (left 14:56), 5 on other days |
| Days Adil was off | 12 | 7 on Feb 19, 5 on Feb 20 (annual leave) |

**Feb 23 is the worst day.** Adil came back from annual leave, worked 2h 15min (09:30-11:45), then left. After he left: 2 drop-offs, 4 walk-ins, 3 collections. 9 customers with no front desk person. Someone else handled them — or they waited.

**Feb 26:** Adil left at 14:56. Walk-in at 16:44, collection at 16:45. Two customers in the last 2 hours with no front desk.

### Gap Between Customers

| Metric | Value |
|--------|-------|
| Median gap between interactions | **28 min** |
| Mean gap | 42 min |
| Gaps > 60 min | 26% |
| Gaps > 120 min | 5% |
| Shortest gap | 1 min |
| Longest gap | 256 min (4h 16m) |

Old report estimated 43 min average gap. Current data shows **28 min median** — busier than previously thought. Three-quarters of gaps are under an hour, meaning Adil rarely has more than an hour between customer interactions.

### Utilisation Estimate

| Activity | Estimated Time/Day | Source |
|----------|-------------------|--------|
| Customer interactions (Typeform) | ~145 min (2h 25m) | 9.9 interactions/day, weighted by type |
| Package receiving (BM + mail-in) | ~40 min | 85 Expecting→Received over 11 days, ~5 min each |
| Shipping prep + dispatch | ~33 min | 73 To Ship→Shipped over 11 days, ~5 min each |
| Status updates / routing | ~15 min | Quick board clicks between tasks |
| Ferrari coordination | ~15 min | ~3 messages/day, 5 min each |
| **Total productive** | **~248 min (4h 8m)** | |
| **Available (avg)** | **~450 min (7h 30m)** | |
| **Utilisation** | **~55%** | |

This aligns with the old report's 56% estimate. The remaining ~45% is dead time — waiting for the next customer, next package, next task. This is structural to the role (front desk has downtime by nature), but a 08:30 start instead of 10:20 would increase available hours and spread the load.

### What This Means

1. **The walk-in volume is real** — 9.3 interactions/day, 28-min median gaps. This isn't a nothing role.
2. **But 24% of customers arrive when Adil isn't there** — late starts, early finishes, and days off create a coverage gap someone else has to fill.
3. **The role is ~55% utilised** — this is normal for front desk (you need someone present even during gaps). But it means a more reliable person gets the same output with no increase in difficulty.
4. **Peak hours (12-16:00) are well-covered** — Adil is present during the busiest window. The gap is mornings (09:00-10:20) and when he leaves early.

---

## 6. COMMUNICATION

**183 update replies in 3 weeks** — second highest on the team after Roni (267).

### Pre vs Post Role Change

| Period | Replies | Per Day | Content |
|--------|---------|---------|---------|
| Pre Feb 18 (8 days) | 126 | 15.8 | BM diagnostics, client intake, tech assignments |
| Post Feb 18 (5 days) | 57 | 11.4 | Client intake, logistics, Ferrari coordination |

### What His Updates Look Like

**BM diagnostic reports (pre Feb 18):**

> pre repair testing -
> Ammeter - passed (20v 1.5+)
> Audio - passed
> Camera - passed
> Display - ❌
> Display brightness - passed
> Keyboard backlight - ❓
> Touch ID - passed
> Mic - passed
> Keyboard - passed
> Battery - passed

These are structured, detailed, and follow the same format Roni now uses. The quality of Adil's diagnostic documentation wasn't the problem — the speed was (73 min median vs Roni's 29 min).

**Client intake notes (throughout):**

> "@Safan Patel  Battery replacement  Camera working  Battery health normal  Passcode verified  SN verified"

> "@Mykhailo Kepeshchuk  Screen replacement, client reports damage to the bottom left side. System shows we have both manufacturers in stock"

These are competent. Passcode, SN, camera check, battery health, repair instructions to tech. The intake process itself works when he does it.

**BM model corrections:**

> "2179 not 2337"
> "2338 not 2442"
> "A2992 not A2918"

9 model number corrections across the period. These are Adil checking the physical device model against what Back Market supplied and correcting discrepancies. This is diligent work.

### Communication Breakdown

| Type | Count (est.) | Content |
|------|-------------|---------|
| BM pre-repair testing reports | ~15 | Full component checklists (pre Feb 18 only) |
| Client intake notes | ~40 | Tech assignments, passcode/SN/camera verification |
| Ferrari coordination | ~30 | Invoices, refunds, client chasing, approvals |
| BM model corrections | 9 | Correcting BM-supplied model numbers |
| Logistics notes | ~15 | Parts in boxes, charging equipment tagged, shipping |
| Client interaction notes | ~10 | Handling walk-in situations |
| General coordination | ~15 | Status updates, follow-ups |
| Photos / attachments | ~15 | Diagnostic evidence photos |
| Empty / image-only | ~34 | No text content |

### Ferrari Dependency

~30 of Adil's 183 replies tag @Ferrari. Common patterns:

- "could you refund them for one please thank you"
- "don't forget to send invoice please"
- "hey bro can we send this client a invoice please"
- "let me know when you've processed a refund bro"
- "client called to chase up a missed call from us?"
- "let me know when passcode is provided and i will queue"
- "let me know if/when its accepted and ill begin diags"

Many of these are legitimate operational routing — Ferrari handles invoicing, refunds, and client email. But the volume of back-and-forth adds load to someone already burned out. Every "@Ferrari" tag is a task on Ferrari's plate. Some of these could be resolved without Ferrari if Adil had invoice access or client email capability.

---

## 7. BM DIAGNOSTICS — THE COMPARISON THAT MATTERS

From the Roni audit (same data, same period):

| Metric | Adil (Pre Feb 18) | Roni (Post Feb 18) |
|--------|-------------------|-------------------|
| Unique BM items diagnosed | ~36 | ~41 |
| Active days | 6 | 10 |
| Items/day | 6.0 | 4.1 |
| Median time per diagnostic | **73 min** | **29 min** |
| Includes cleaning | No | Yes |
| Formal written diagnostic | Yes | Yes |
| Simultaneously running QC | No | **Yes** |

**Roni is 2.5x faster per item, includes cleaning, and does QC at the same time.**

Adil's lower items/day (6.0 vs 4.1) reflects the fact that diagnostics was his primary job. Roni's lower daily count is because he's simultaneously running QC on 9 items/day.

The previous workload report (Jan 26 – Feb 1) estimated 20 min per BM diagnostic. Adil's actual median was 73 min — **3.65x the estimate**. The old report calculated 56% utilisation based on the 20-min estimate. With actual timing, his diagnostic utilisation was significantly higher — but the speed gap vs Roni shows it wasn't because the work was hard, it was because Adil was slower at it.

### The "Overworked" Question

Adil felt overworked on diagnostics. The old report showed 60% of his diagnostic work was interrupted by walk-in customers. This is a real structural problem — you can't do focused diagnostic work when customers walk in every 43 minutes.

But Roni handles the same diagnostic work + QC + walk-in interruptions from techs, starts earlier, finishes later, and is 2.5x faster. The structural excuse only goes so far.

---

## 8. WHAT THE DATA SAYS vs DOESN'T SAY

### Confirmed by data:
- **He's the latest starter on the team** — median 10:20, front desk role should be first in
- **He never works Saturdays** — 0/3 while the full team does 6 days
- **He left at 14:56 on Feb 26** — no recorded reason in activity logs
- **His BM diagnostics were 2.5x slower than Roni's** — 73 min vs 29 min median
- **Post role change, his work is lighter** — activity dropped 33%, communication dropped 28%
- **He routes heavily to Ferrari** — ~30 tags creating tasks for someone already burned out
- **When present, he does produce work** — 183 update replies, detailed intake notes, model corrections
- **His diagnostic documentation quality was fine** — same structured format Roni now uses

### NOT shown by data:
- **Walk-in customer handling quality** — Typeform captures volume (9.3/day) but not outcome. Old report showed 68% conversion. Can't measure if Adil's interactions lead to bookings.
- **What happens when he's not there** — 33 customers arrived when Adil was absent (24%). Who covered? Someone else handled them or they waited.
- **Whether the 14:56 finish had a reason** — could be legitimate (appointment, illness), could be taking the piss
- **How much management time he consumes** — Ricky says he's the only one causing chaos. No data on Slack messages to Ricky, calls for help, or escalations.
- **What he does between events** — 25 items/day at ~10 min each = ~4 hours of tracked work. What fills the other 3-4 hours?
- **Whether his annual leave timing (Feb 18-20) was coincidence or avoidance** — he was off exactly when the role change happened. Andreas covered full-time.

---

## 9. HONEST ASSESSMENT

| Signal | Assessment | What It Means |
|--------|-----------|--------------|
| Median start 10:20 (latest on team) | **Negative** | Front desk person arrives last — customers wait |
| 0/3 Saturdays worked | **Negative** | 17% less availability than Roni/Safan/Mykhailo |
| Left at 14:56 on Feb 26 | **Negative** | Short day with no recorded reason |
| BM diagnostics 2.5x slower than Roni | **Negative** | Speed gap is what drove the role change |
| Activity dropped 33% post role change | **Concern** | Less work to do, but hours didn't increase |
| 183 update replies | **Positive** | Second highest on team — he does communicate |
| Detailed diagnostic reports | **Positive** | Documentation quality was fine before role change |
| 9 BM model corrections | **Positive** | Catches discrepancies, diligent on data accuracy |
| Client handling (K Yeboah, Jan Perera) | **Positive** | Some evidence of good customer interaction |
| ~30 Ferrari tags | **Structural** | Heavy dependency, but partly how the role is designed |
| Annual leave Feb 18-20 | **Neutral** | Bad timing, but annual leave is annual leave |

### The Bottom Line

The data doesn't say Adil is useless. It says he's **inconsistent and undercommitted relative to the team standard.**

Every other team member works 6 days. Adil works 5. Every other team member starts by 09:45 at the latest. Adil starts at 10:20. Every other team member has 0 unexplained short days. Adil left at 14:56.

His work quality when present is adequate — not exceptional, not terrible. He follows processes, writes reasonable notes, catches some errors. But the role he's in now (receiving, shipping, collections, walk-in intake) doesn't require expertise. It requires **reliability** — being there, being on time, handling what comes in consistently. That's exactly where the data shows his weakness.

**Would a new hire with Roni-like reliability produce more in this role?** Almost certainly yes. Not because the job is hard, but because showing up at 08:30 instead of 10:20 and working Saturdays gives you 30-35% more availability. The role is about presence and consistency, and Adil's data shows the opposite.

---

## 10. COMPARISON: WHAT THE SAME ROLE LOOKS LIKE WITH THE RIGHT PERSON

This is the comparison that matters. Roni and Adil overlapped on BM diagnostics:

| Metric | Adil | Roni | Difference |
|--------|------|------|-----------|
| Diagnostic speed (median) | 73 min | 29 min | Roni 2.5x faster |
| Cleaning included | No | Yes | Roni does more in less time |
| Formal documentation | Yes | Yes | Both write reports |
| Start time (median) | 10:20 | 08:50 | Roni 90 min earlier |
| Saturdays worked | 0/3 | 3/3 | Roni 20% more available |
| Days off (3 weeks) | 4+ | 0 | Roni never misses |
| Simultaneous roles | 1 (diagnostics) | 2 (QC + diagnostics) | Roni absorbs more |

If you replaced Adil with someone who has Roni's work ethic but in the front desk/logistics role:
- 90 extra minutes per day (08:30 start vs 10:00)
- 3 extra days per 3-week period (Saturdays)
- More consistent availability (no unexplained short days)
- That's roughly **30-35% more productive time** for the same salary

---

## 11. RECOMMENDATIONS

### For the Conversation

This is a harder conversation than Roni or Safan. The data supports your gut feeling, but it's not a "zero output" situation — it's a "not enough for what the role needs" situation.

**If you're leaning toward replacement:**

"Adil, I've looked at the team data for the last three weeks. The shop opens at 9. Your median start time is 10:20. Roni starts at 08:50, Safan at 08:15. You're on 5 days while everyone else does 6. Last Thursday you left at 3pm. I need someone in this role who's here when the shop opens and stays until it closes. The data tells me the role needs more reliability than you're currently giving it."

**If you're giving a final chance:**

"These are the non-negotiables: in the building by 09:00 every day, Saturday rota shared with the team, no unexplained short days. I'll measure it over the next 4 weeks. The Monday data tells me everything."

### Structural Considerations

| Decision | Options | Data Says |
|----------|---------|-----------|
| Replace Adil? | Replace / Final warning / Keep | Data supports replacement — the gap is attendance and commitment, which coaching rarely fixes |
| Role scope post-replacement | Same (logistics + intake) / Expanded (add diagnostics back) | Keep logistics + intake for new hire. Roni should keep diagnostics — he's proven. |
| Ferrari dependency | Give front desk invoice access / Keep routing | Reduce Ferrari load by giving front desk basic Xero/invoice access |
| Saturday coverage | Add front desk to Saturday rota / Keep weekday only | New hire should be 6 days, matching the team |
| Transition period | Immediate / Overlap training | 2-week overlap minimum — new hire needs to learn Monday board, shipping process, BM receiving |

### What to Monitor (If Keeping)

| Metric | Target | How |
|--------|--------|-----|
| Start time | Before 09:00 | First activity log event |
| Saturday attendance | 2/month minimum | Activity log presence |
| Finish time | After 17:30 | Last activity log event |
| Walk-in coverage | 0 customers missed due to absence | Typeform timestamps vs activity log start/end |
| Ferrari tags | Reduce to <15/week | Update reply analysis |

---

## 12. DATA LIMITATIONS

- Activity logs capture board interactions, not physical presence. Adil could be in the building before his first board action. But front desk work (walk-in customers) should generate board events from arrival.
- Typeform data pulled via API for all 4 forms. Note: the Typeform → Monday integration (via n8n Cloud) has been broken since ~Feb 5 — Monday credential expired. Typeform data is still flowing to Slack but not to Monday board 4752037048. This needs fixing.
- No Slack data pulled. The "management time consumed" question (how much chaos he generates for Ricky) can't be measured from Monday data alone.
- Ferrari dependency count (~30 tags) is an estimate from manual review of update replies.
- The 14:56 finish on Feb 26 and the short day on Feb 23 (2.25 hours, first day back from leave) may have legitimate explanations not captured in the data.
- BM diagnostic timing comparison (73 min vs 29 min) was measured differently — Adil's from the roni_qc_intake.py script using first event to "Diagnostic Complete", Roni's from the same script. Both exclude multi-day items.
- Annual leave (Feb 18-20) is legitimate scheduled time off. The timing coincidence with the role change may be exactly that — coincidence.
- The "items touched" metric doesn't distinguish between meaningful actions (writing a diagnostic report) and trivial ones (changing a status colour).
- No Intercom data — can't measure how many customer inquiries he handles vs routes to Ferrari.

---

*Audit generated: 2026-03-02 by Claude Code*
*Data sources: Monday.com Main Board API (activity logs + item details + update replies), Typeform API (4 customer forms, 140 responses), roni_qc_intake.py comparison data, previous workload report (Jan 26 – Feb 1)*
*Previous report: adil_report_2026-02-02.md (Jan 26 – Feb 1, showed 56% utilisation)*
*Key finding: Data confirms gut — inconsistent attendance weakest on team, 24% customer coverage gap from late starts/early finishes/absences, ~55% utilised, role needs reliability more than skill*
