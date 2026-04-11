# Safan Patel — Deep Dive Performance Audit
## Audit Date: 2 March 2026
## Period Reviewed: 9 February – 1 March 2026 (3 weeks)

**Auditor:** Ricky Panesar (via Claude Code)
**Data Sources:** Monday.com API (Board 349212843 activity logs + item details + update replies), Ferrari's daily board (18393875720, team meeting durations), BM Board (3892194968, financials), monthly quality report
**Baseline:** Jan 26 – Feb 8, 2026 (2 weeks prior)

---

## 1. EXECUTIVE SUMMARY

Safan is the technical backbone of the workshop. 4.2 completions/day across 18 straight working days, zero absences, 95 detailed update replies, and the most complex repair work in the building (logic board, component-level soldering, all diagnostics). His output is 9% below baseline (4.6/day) but the baseline had no daily meetings — accounting for meetings, he's above the realistic target of 4.0/day.

**Two areas need attention:**

1. **QC failure rate is the highest on the team** — 11.8% this period, 15.3% for full February. Context matters: he does the hardest board-level work which carries inherent risk, but 1 in 7 items coming back from QC still costs time and money. Understanding what's failing (cosmetic vs functional) determines whether this is a Safan problem or a process problem.

2. **Parts supply remains the systemic blocker** — flagged in the Jan 26 report, still unresolved. Pause reasons include "Awaiting Part → No Stock" and "Repair Paused → Parts" throughout the period. Every blocked item is revenue sitting in the queue.

**His communication is excellent** — 95 update replies in 3 weeks with detailed diagnostic notes, AMM readings, parts lists, and direct @mentions routing work across the team. He is effectively the workshop's technical coordinator, not just a repair tech.

---

## 2. KEY METRICS

| Metric | Baseline (Jan 26–Feb 8) | Current (Feb 9–Mar 1) | Change |
|--------|------------------------|-----------------------|--------|
| **Completions/day** | 4.6 (no meetings) | 4.2 (with meetings) | -9% (above meeting-adjusted target) |
| **Revenue/day** | £1,059 | £943 | -11% |
| **Revenue/completion** | £230 | £223 | -3% |
| **Profit/completion** | £170 | £158 | -7% |
| **QC rework rate** | 10.9% | 11.8% | +0.9pp |
| **Update replies** | Not measured | 95 (5.3/day) | — |
| **Days off** | 2 | 0 | Improved |
| **BM returns** | — | 2 (5.4% of BM completions) | — |

*Baseline had no daily team meetings. Current period loses ~1h/day to meetings, making realistic target ~4.0/day. Safan is at 4.2 — above target.*

### Weekly Output

| Period | Days Worked | Completed | Per Day | Revenue | Net Profit | QC Reworks |
|--------|------------|-----------|---------|---------|------------|------------|
| **Baseline: Jan 26–Feb 1** | 6 | 23 | 3.8 | £5,601 | £3,832 | 2 |
| **Baseline: Feb 2–8** | 4 | 23 | 5.8 | £4,989 | £3,969 | 2 |
| Feb 9–14 | 6 | 25 | 4.2 | £7,265 | £5,456 | 3 |
| Feb 16–21 | 6 | 24 | 4.0 | £5,243 | £2,997 | 4 |
| Feb 23–28 | 6 | 27 | 4.5 | £4,462 | £3,521 | 2 |

Week 3 was his best for completions (4.5/day) despite lower revenue per item.

### Comparison: Safan vs Refurb Room (Same Period)

| Metric | Safan | Mykhailo | Andreas |
|--------|-------|----------|---------|
| Completions/day | **4.2** | 3.4 | 2.7 |
| Revenue/day | £943 | £977 | £509 |
| Revenue/completion | £223 | £284 | £189 |
| QC rework rate | 11.8% | 10.4% | 2.2% |
| Update replies (3 weeks) | 95 | 83 | 104 |
| Days off | **0** | 2 | 1 |
| BM returns | 2 | 0 | 0 |

Safan has the highest volume, the highest QC rate, and zero days off. Revenue per completion is lower than Mykhailo because of item mix — Mykhailo's client repairs average £328 each vs Safan's wide range (£20–£623), plus Safan has 12 £0 items (B2B/corporate).

---

## 3. START & FINISH TIME ANALYSIS

### Start Times

| Day | Meeting? | Meeting Duration | 1st Action | Adjusted Start | Verdict |
|-----|----------|-----------------|------------|----------------|---------|
| Mon 9 Feb | Yes | 25m | 11:07 | 09:24 | Late start, early meeting |
| Tue 10 Feb | Yes | 1h 36m | 10:38 | 10:36 | OK — meeting explains it |
| Wed 11 Feb | Yes | 49m | 09:47 | 09:48 | ON TIME |
| Thu 12 Feb | **No** | — | 09:16 | 09:00 | **ON TIME** |
| Fri 13 Feb | Yes | 1h 45m | 09:01 | 10:45 | **EARLY — in before meeting** |
| Sat 14 Feb | **No** | — | 10:03 | 09:00 | Saturday pattern |
| Mon 16 Feb | Yes | 1h 41m | 09:11 | 10:40 | **EARLY — in before meeting** |
| Tue 17 Feb | Yes | 1h 16m | 09:11 | 10:16 | **EARLY — in before meeting** |
| Wed 18 Feb | Yes | 1h 35m | 10:53 | 10:35 | OK — meeting explains it |
| Thu 19 Feb | Yes | 1h 41m | 08:09 | 10:40 | **EARLY — in before meeting** |
| Fri 20 Feb | **No** | — | 08:10 | 09:00 | **EARLY** |
| Sat 21 Feb | **No** | — | 09:47 | 09:00 | Saturday pattern |
| Mon 23 Feb | Yes | 1h 00m | 08:17 | 10:00 | **EARLY — in before meeting** |
| Tue 24 Feb | Yes | 2h 17m | 08:23 | 11:17 | **EARLY — in before meeting** |
| Wed 25 Feb | Yes | 35m | 08:20 | 09:34 | **EARLY — in before meeting** |
| Thu 26 Feb | **No** | — | 08:18 | 09:00 | **EARLY** |
| Fri 27 Feb | Yes | 56m | 08:11 | 09:55 | **EARLY — in before meeting** |
| Sat 28 Feb | **No** | — | 09:46 | 09:00 | Saturday pattern |

**Summary:**
- Non-meeting days: all on time or early. No late starts.
- Meeting days: first Monday.com action before or around meeting start on 10/12 days.
- **Week 3 shift:** From Feb 19, raw start times are consistently 08:09–08:23 on weekdays. He's arriving 40–50 minutes before the expected 09:00.

### Finish Times — Week 3 Pattern

| Period | Avg Finish | Range |
|--------|-----------|-------|
| Feb 9–18 (Week 1–2 weekdays) | 18:02 | 17:46–18:16 |
| Feb 19–28 (Week 2b–3) | 16:26 | 16:18–16:32 |

From Feb 19 onwards, Safan consistently finishes at 16:20–16:32. That's ~90 minutes earlier than weeks 1–2.

**However:** Gross hours are stable across all three weeks:

| Week | Avg Gross Hours | Avg Completions/Day |
|------|----------------|-------------------|
| 1 (Feb 9–14) | 7.94 | 4.2 |
| 2 (Feb 16–21) | 8.06 | 4.0 |
| 3 (Feb 23–28) | 7.88 | **4.5** |

He shifted his schedule earlier (start ~08:15, finish ~16:25) rather than working fewer hours. Week 3 had his highest output. The early finishes are a timing shift, not a work reduction.

---

## 4. QC FAILURE ANALYSIS

### The Numbers

| Period | Completions | QC Reworks | Rate |
|--------|------------|------------|------|
| Baseline (Jan 26–Feb 8) | 46 | 5 | 10.9% |
| Feb 9–14 | 25 | 3 | 12.0% |
| Feb 16–21 | 24 | 4 | 16.7% |
| Feb 23–28 | 27 | 2 | 7.4% |
| **Full audit period** | **76** | **9** | **11.8%** |

Full February (monthly quality report): **15 failures out of 98 completions = 15.3%** — highest of the three techs.

### Team QC Comparison (Full February)

| Tech | Completions | QC Failures | Rate | Work Type |
|------|------------|-------------|------|-----------|
| Andreas | 57 | 2 | 3.5% | Screen refurb, cosmetic |
| Mykhailo | 67 | 7 | 10.4% | Refurb, some board work |
| **Safan** | **98** | **15** | **15.3%** | **Board-level, all diagnostics** |

### Context

Safan's QC rate needs nuance. His work is fundamentally different:
- **Logic board repair** — component-level soldering, IC replacement, trace repair. Higher complexity = higher inherent failure risk.
- **All diagnostics** — he diagnoses every device in the building. Diagnostic-to-completion path has more steps to go wrong.
- **BER decisions** — he decides which items are beyond economic repair. Getting this wrong in either direction costs money.

His update replies confirm the complexity: "we found one CD chis and ROM missing, we repair CD chis and rom then macbook taking power but no screen light working" / "we found logic board has liquid damage near NAND ic, we clan logic board and replace liquid damage parts but still not working."

**The question isn't "why is his rate 15.3%?" — it's "what's failing QC?"** If it's functional failures on board-level work, that's inherent to the work. If it's cosmetic or reassembly issues, that's process. Roni (QC lead) would know.

### BM Returns

2 returns attributed to Safan in February (BM 1126 and BM 1231, both completed Feb 20). Out of 37 BM completions = 5.4% return rate.

For comparison, Mykhailo had 0 returns. But Safan's BM work is more board-level (IC replacement, logic board repair) vs Mykhailo's screen/cosmetic refurb. Different failure modes.

---

## 5. ITEM BREAKDOWN

### By Category

| Type | Count | Revenue | Avg Revenue |
|------|-------|---------|-------------|
| BM trade-ins | 37 (49%) | ~£10,100 | ~£273 |
| Client repairs | 27 (36%) | ~£6,870 | ~£254 |
| Other (B2B/corporate, £0) | 12 (16%) | £0 | £0 |
| **Total** | **76** | **£16,970** | **£223** |

The 12 "other" items at £0 include: Spacemade (x4, B2B batch), Dwayne Morris/Everything Apple Tech (x2, content creator deal), VCCP/Silver Fern/Freuds (corporate accounts), and individual items with revenue not yet captured. These depress his revenue/completion metric — excluding them: **£265/completion**.

### Revenue Distribution (Client Repairs)

| Band | Count | Examples |
|------|-------|---------|
| £400+ | 5 | Naboshika (£623), Dobrila/Tamika (£548), Khaled (£448), Fisayo/Adrian (£398) |
| £200–399 | 7 | Alex Darlow (£368), Daniel/Xinzhang (£348), Tabitha (£298), Calvin (£248) |
| Under £200 | 15 | Olivia/Guadalupe (£179), Steven (£149), Mark (£79), 6x at £49, Gabriele (£20) |

The £49 items are typically diagnostic-only charges where the device is BER. These are productive (diagnostic time is spent, decision is made, customer informed) but the revenue is low.

---

## 6. COMMUNICATION

**95 update replies in 3 weeks (5.3/day).** Best assessed alongside Andreas (104, 6.1/day) and Mykhailo (83, 4.9/day). All three workshop techs communicate actively through item threads.

### What His Replies Show

**Detailed diagnostics with AMM readings:**
> "AMM;5.0V * 0.220 Faults: Macbook not working, we found logic board has liquid damage, we found liquid damage on sound ic we clan liquid damage and replace CR605, CR638, CR665..."

**Clear delegation to the right person:**
- `@Mykhailo please can you make pol` — routing screen polariser work to refurb
- `@Andres please can you make screen` / `please can you repair screen lid and bezel` — routing assembly work
- `@Roni you can take out screen because working fine` — routing parts salvage to QC/parts
- `@Ferrari please can you oder US keyboard` — parts ordering
- `@Adil please can ask customer...` — customer contact

**Escalation to Ricky on technical decisions:**
- `@Ricky please can you tell me name of register making temperature high`
- `@Ricky This is not in the MacBook, the range of Wi-Fi is very low range, so we don't have its board view or anything, so how can I repair it`

**Proactive flags:**
- `please don't pay this macbook` — spotted MDM lock before purchase was confirmed
- `no point all repair if we used only screen good for as` — BER decision, recommending parts salvage
- `i need more time @Ferrari` — managing expectations on complex repair

**This is what lead tech communication looks like.** He's not just doing repairs — he's coordinating work across the team, making BER decisions, flagging risks, and routing tasks to the right people.

---

## 7. FINANCIAL IMPACT

### Revenue Through Safan's Hands (3 Weeks)

| Week | Revenue | Net Profit | Completions | Rev/Day | Shared Items |
|------|---------|-----------|-------------|---------|-------------|
| Feb 9–14 (6 days) | £7,265 | £5,456 | 25 | £1,211 | 7 |
| Feb 16–21 (6 days) | £5,243 | £2,997 | 24 | £874 | 4 |
| Feb 23–28 (6 days) | £4,462 | £3,521 | 27 | £744 | 5 |
| **3-week total** | **£16,970** | **£11,974** | **76** | **£943** | **16** |

**Revenue per completion declined week-over-week** (£291 → £218 → £165) — driven by item mix, not performance. Week 3 had more low-value BM items and diagnostic-only charges, but the highest completion count.

### Profitability

| Metric | Value |
|--------|-------|
| 3-week revenue | £16,970 |
| 3-week net profit | £11,974 |
| Profit margin | 71% |
| Revenue/day | £943 |
| Profit/day | £665 |

### Cost of QC Reworks

9 reworks × ~45 min avg rework time = ~6.75 hours lost in 3 weeks. At his productivity rate (~£120/hour in revenue), that's **~£810 in delayed or lost throughput** from rework.

### Comparison: Revenue Contribution

| Tech | 3-Week Revenue | 3-Week Profit | Days Worked |
|------|---------------|--------------|-------------|
| **Safan** | **£16,970** | **£11,974** | **18** |
| Mykhailo | £15,630 | £10,290 | 16 |
| Andreas | £8,681 | £4,894 | 17 |

Safan generates the most total revenue and profit. He works more days, has higher volume, and maintains solid margins. Even accounting for the 16 shared items (21% of his completions), he's the highest contributor.

---

## 8. COMPLETION vs PAUSE ANALYSIS

| Week | Completed | Paused | Items Touched | Completion Ratio |
|------|-----------|--------|--------------|-----------------|
| Feb 9–14 | 25 | 13 | 61 | 66% |
| Feb 16–21 | 24 | 16 | 56 | 60% |
| Feb 23–28 | 27 | 18 | 59 | 59% |
| **3-week total** | **76** | **47** | **176** | **62%** |

Pause count is consistent (~15/week). Pause reasons include:
- "Repair Paused → Diagnostics" — item needs further investigation
- "Repair Paused → Under Repair" — returning to item after pause
- "Awaiting Part → No Stock" — parts blocker
- "Repair Paused → Stuck" — genuinely blocked

A 62% completion ratio is healthy for someone doing all diagnostics. Diagnostics inherently produce more pauses (investigate → decide → act, vs refurb where you know the job upfront).

---

## 9. WHAT THE DATA SAYS vs DOESN'T SAY

### Confirmed by data:
- Output is stable and above meeting-adjusted target (4.2 vs 4.0 target) — **no decline**
- He works every day, arrives on time or early, and communicates thoroughly — **he's the standard**
- QC rate is the highest on the team (11.8–15.3%) — **real concern, needs investigation**
- Revenue per completion is declining but driven by item mix, not performance
- He coordinates work across the entire team via update replies — **he's the workshop's technical coordinator**

### NOT shown by data:
- What specifically is failing QC — cosmetic or functional? Board-level or reassembly?
- Whether the early finishes from Feb 19 are by arrangement or unilateral
- Quality of his BER decisions — is he scrapping items that could be saved?
- Time spent helping others (mentoring, answering questions) that isn't captured in his own logs
- Whether the 12 £0 items are genuinely £0 or revenue not yet captured
- Parts blocker impact — how many completions are delayed 2-3 days by missing stock?

---

## 10. HONEST ASSESSMENT

Safan is your best performer and it's not close.

| Signal | Severity | What It Means |
|--------|----------|--------------|
| 4.2/day completions, 0 days off, 18 straight working days | **Positive** | Reliable, consistent, sets the standard |
| 95 update replies with detailed diagnostics and team coordination | **Positive** | Best communicator + de facto technical coordinator |
| Arrives 08:10–08:20 on weekdays (week 3), before 09:00 | **Positive** | Earliest starter when not in meetings |
| 11.8% QC rework rate (15.3% for full Feb) | **Medium** | Highest on team — but does hardest work. Investigation needed. |
| 2 BM returns in Feb (5.4% of his BM completions) | **Low–Medium** | Worth tracking but small sample size |
| Early finishes from Feb 19 (~16:25 vs prev ~18:00) | **Low** | Same total hours, shifted earlier. Output was highest in week 3. |
| Revenue/completion declining week-over-week | **Low** | Item mix, not performance. Excludes 12 £0 B2B/diagnostic items. |

**Baseline comparison:** 4.6/day (no meetings) → 4.2/day (with meetings) = 9% decline, fully explained by ~1h/day in meetings. Realistic meeting-adjusted target is 4.0. He's at 4.2. **No decline in performance.**

**The QC rate is the conversation.** Everything else is positive. If QC failures are on board-level work (inherent risk), the rate may be acceptable and the solution is process (better testing before QC handoff, specific checklist for board repairs). If failures are cosmetic or reassembly errors, that's a Safan-level issue.

**His value extends beyond completions.** From his update replies alone: he's routing work to Mykhailo, Andreas, Roni, and Ferrari. He's making BER decisions. He's flagging MDM-locked devices before payment. He's asking Ricky for technical guidance on edge cases. He's the person everyone else relies on. If Safan stopped doing this coordination, the whole workshop slows down.

---

## 11. COMPARISON: WORKSHOP HEALTH

All three techs audited side by side (same 3-week period):

| Metric | Safan | Mykhailo | Andreas |
|--------|-------|----------|---------|
| Role | Lead repair, all diagnostics | Lead refurb | Refurb tech |
| Completions/day | **4.2** | 3.4 | 2.7 |
| Days worked | **18** | 16 | 17 |
| Total completions | **76** | 55 | 46 |
| Revenue | **£16,970** | £15,630 | £8,681 |
| Net profit | **£11,974** | £10,290 | £4,894 |
| QC rate | 11.8% | 10.4% | **2.2%** |
| Update replies | 95 | 83 | **104** |
| BM returns | 2 | **0** | **0** |
| Start time (non-meeting) | **08:10–09:16** | 10:11–10:30 | 09:15–10:50 |
| Late pattern | **None** | 5/16 days, 70–90 min | 1 day (drinking night) |
| Attendance concern | **None** | High (escalating) | Low |

**Combined workshop output:** 177 completions, £41,281 revenue, £27,158 profit in 3 weeks. Safan accounts for 43% of completions and 44% of profit.

---

## 12. RECOMMENDATIONS

### For the Conversation

Safan's conversation is different from Mykhailo's. This isn't a performance review — it's a "what do you need?" conversation.

**Frame it clearly:**
"Your numbers are solid — 4.2 a day, no days off, you're the most consistent person in the building. I also looked at your item replies and I can see you're coordinating work across the whole team — routing to Misha, Andreas, Roni, Ferrari. That's leadership and I want you to know I see it."

"Two things I want to discuss: your QC rate is the highest on the team at 15%. I know your work is harder than anyone else's — board-level stuff has more risk. But I want to understand what's coming back from Roni and whether we can tighten it up."

### QC Investigation (Action Item)

| Question | Who To Ask | Why It Matters |
|----------|-----------|---------------|
| What types of items are failing QC? | Roni | Cosmetic vs functional determines the fix |
| Are board repairs failing at higher rate than non-board? | Data pull | Separates inherent risk from process gap |
| Is there a pre-QC check Safan could do? | Safan + Roni | Could catch issues before they reach QC |
| Are the 2 BM returns related to the QC failures? | Cross-reference | If returns passed QC, that's a QC process issue |

### Parts Supply (Systemic — Not Safan's Fault)

The Jan 26 report flagged 15 items blocked by missing parts. This period still shows "Awaiting Part → No Stock" and "Repair Paused → Parts" across multiple days. Every blocked item = delayed revenue.

| Action | Owner |
|--------|-------|
| Audit top 5 parts causing blocks | Roni / Ferrari |
| Set reorder triggers for common parts | Operations |
| Track "days blocked" per item | Data pull |

### Early Finish Pattern

Not urgent, but worth understanding:

| Action | How |
|--------|-----|
| Ask Safan about the schedule shift (Feb 19 onwards) | Direct conversation |
| Confirm if this is by arrangement or unilateral | Ricky |

His total hours haven't changed and output is highest in week 3. If he prefers 08:15–16:30, this is arguably better for the business (workshop productive before meetings start).

### What Safan Needs From You

Based on his update replies and work patterns:

1. **Faster responses on technical questions** — he @mentioned Ricky twice asking for component guidance (register identification, WiFi antenna repair) and waited for replies
2. **Parts supply reliability** — blockers are systemic, not in his control
3. **Queue management** — his low days (1–2 completions) correlate with complex diagnostics and parts blocks, not laziness. Better queue visibility = smoother throughput
4. **Recognition** — he's the highest contributor, works 6 days, communicates thoroughly, and coordinates the team. He likely knows his value. Make sure he knows you know it.

---

## 13. DATA LIMITATIONS

- Monday.com activity logs capture board interactions, not physical presence
- Time tracking is cumulative per item (not per day) — daily utilisation is unreliable
- 12 items show £0 revenue — B2B/corporate invoiced separately or revenue not yet captured in Monday
- QC rework detection counts items transitioning "QC Failure → Under Repair" in Safan's activity logs. Doesn't distinguish cosmetic vs functional failure.
- BM return attribution depends on matching BM board items to main board activity. 19/21 February returns are "unattributable" (completed before activity log retention).
- Revenue is split 50/50 when both refurb and repair time logged on same item. 16 items (21% of completions) were shared.
- "Other/£0" category may include items with revenue not yet captured — the true £0 count could be lower.
- Slack history not pulled (no API access). TEAM.md notes Safan communicates via Slack and Monday.com.
- Baseline period (Jan 26–Feb 8) had 2 days off (Feb 3–4) — reason unknown.
- Device type detection returned "Unknown" for all 76 items — item names don't consistently include parseable model identifiers.

---

*Audit generated: 2026-03-02 by Claude Code*
*Data sources: Monday.com Main Board API (activity logs + item details + update replies), Monday.com BM Board (sale prices, fees, purchase costs), Ferrari daily board (meeting durations), monthly quality report*
*Financial methodology: BM items = sale - purchase - fee - tax - labour (£15/hr) - shipping (£15). Client repairs = payment inc VAT. 50/50 split on shared items.*
*Next steps: QC investigation with Roni, parts supply audit*
