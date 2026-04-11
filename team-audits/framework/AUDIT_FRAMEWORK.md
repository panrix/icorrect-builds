# iCorrect Team Audit Framework
## Version 1.0 — 26 February 2026

---

## Purpose

Standardised, repeatable audit process for all iCorrect team members. Designed to be run weekly by a human or by Team Jarvis agent. Every audit produces a timestamped document with verifiable data.

---

## Audit Types by Role

### Type A: Repair Technician (Safan)
**Primary data:** Monday.com Main Board (349212843) activity logs
**Metrics:**
- Completions per day (status → Repaired/Part Repaired)
- Blocked items count + reasons
- QC failure rate (items returned for rework)
- Parts shortage impact
- Queue depth at start/end of day
- Time per device (if time tracking active)

**Existing script:** `safan_weekly_report.py`

### Type A2: Refurbishment (Mykhailo lead, Andreas)
**Primary data:** Monday.com Main Board activity logs
**Metrics:**
- Refurb completions per day
- Time per refurb (refurb time + repair time + diagnostic time)
- Blocked items / parts shortages
- Andreas: also covers 1h front desk end-of-day (Ramadan cover for Adil, temporary)

**Existing scripts:** `mykhailo_weekly_report.py`, `andres_weekly_report.py`

**Note (Feb 2026):** Andreas currently doing ~1h/day front desk at end of day to cover Adil leaving early for Ramadan. Track both refurb output AND front desk coverage separately. This is temporary (~1 month).

### Type B: QC + Parts + BM Intakes (Roni)
**Primary data:** Monday.com Main Board activity logs
**Metrics:**
- BM intake completions per day (moved from Adil — Roni now owns this)
- Intake quality score: % of devices that pass through repair without intake-related issues
- Devices QC'd per day
- QC pass/fail rate (target: reducing this as intake quality improves)
- Parts intake logged (China shipments, individual parts)
- Stock check completions

**Key hypothesis to track:** Better intakes by Roni → fewer QC failures downstream → techs trust the intake → faster throughput. Monitor QC failure rate trend over time — it should be declining.

**Existing script:** `roni_weekly_report.py` (needs updating to include BM intake metrics)

### Type C: Intake / Front Desk (Adil)
**Primary data:** Monday.com Main Board + Typeform API (iPad intake form)
**Current status:** Reduced hours during Ramadan (Feb/Mar 2026). Leaves early, Andreas covers last hour.
**Metrics:**
- Client visits handled (from Typeform)
- Walk-in intake completions
- Mail-in processing
- Utilisation rate (time on task vs available time)
- Interruption rate (gap analysis between visitors)

**Note:** BM trade-in intakes have moved to Roni. Adil retains walk-in/mail-in intake and front desk.

**Existing scripts:** `adil_weekly_report.py`, `adil_deep_analysis.py`, `adil_activity_analysis.py`

### Type D: Client Services / Remote (Michael Ferrari)
**Primary data:** Monday.com personal board (18393875720) + Intercom (admin activity)
**Metrics:**
- Time logged per category vs actual output
- Intercom: outbound emails sent (from Support admin account)
- Intercom: enquiries received vs responded to
- Intercom: unread/unanswered conversations count
- Conversion rate: enquiry → quote → booking
- Fin AI: assumed vs confirmed resolutions
- Fin AI: escalated-to-team conversations actioned

**Cross-reference required:** Monday "Clients" hours must map to identifiable Intercom conversations or documented phone calls.

---

## Standard Audit Template

Every audit document must follow this structure:

```
# [Name] — Performance Audit
## Audit Date: [DATE]
## Period Reviewed: [START] – [END]

**Auditor:** [Name or Agent ID]
**Data Sources:** [List all sources]

---

## 1. EXECUTIVE SUMMARY
[3-5 sentences: what's working, what's not, key number]

## 2. KEY METRICS
[Table of metrics for this role type with targets vs actuals]

## 3. DETAILED FINDINGS
[Data breakdown by day/category with supporting evidence]

## 4. CROSS-REFERENCE CHECK
[For roles with multiple data sources: do the numbers match?]

## 5. FINANCIAL IMPACT
[Revenue at risk, cost of gaps, missed opportunities]

## 6. RECOMMENDATIONS
[Immediate / Short-term / Structural — each with clear action]

## 7. DATA LIMITATIONS
[What couldn't be verified, what's missing]

---
*Audit generated: [DATE] by [AUDITOR]*
*Next audit due: [DATE]*
```

---

## Data Sources & Access

| Source | Access Method | Key IDs | Notes |
|--------|-------------|---------|-------|
| Monday.com Main Board | API (GraphQL) | Board: 349212843 | Activity logs, item statuses, time tracking |
| Monday.com Ferrari Board | API (GraphQL) | Board: 18393875720 | Daily groups, time tracking, task items |
| Monday.com API Token | `.env` file | See `/Users/icorrect/Projects/Monday KPIs/.env` | Token: `MONDAY_API_TOKEN` |
| Intercom | MCP tools or API | Admin 9702337 (Support), Bot 9702338 (Alex) | Search conversations, get conversation details |
| Typeform | API | Used by `adil_weekly_report.py` | iPad intake form data |

### Monday.com User IDs (for activity log filtering)

Needed: Map each team member's Monday user ID. Currently available from `team_activity.py` output:
- Adil Azad
- Michael Ferrari
- Safan Patel
- Roni Mykhailiuk
- Andres Egas
- Ricky Panesar
- Mykhailo Kepeshchuk

### Intercom Admin IDs

| ID | Name | Type |
|----|------|------|
| 9702337 | Support | Admin (shared — Ferrari uses this) |
| 9702338 | Alex | Bot (automation, workflows) |
| 9725695 | (team) | Support team assignment |

**Action needed:** Create individual Intercom admin accounts for trackability.

---

## Audit Schedule

| Audit | Frequency | Day | Covers |
|-------|-----------|-----|--------|
| Workshop techs (Safan, Mykhailo, Andreas) | Weekly | Monday | Previous Mon–Sat |
| QC/Parts (Roni) | Weekly | Monday | Previous Mon–Sat |
| Intake (Adil) | Weekly | Monday | Previous Mon–Fri |
| Client Services (Ferrari) | Weekly | Monday | Previous Mon–Fri |
| Full team summary | Monthly | 1st of month | Previous month |

---

## Cross-Reference Rules

For any role where time is self-reported, the audit must verify at minimum:

1. **Time vs Output:** Hours logged must correlate with identifiable outputs (emails sent, items completed, calls documented)
2. **System Consistency:** If someone logs 4h on "Clients" in Monday, there should be corresponding activity in Intercom/Typeform/call logs
3. **Completion Verification:** "Done" status must match actual evidence — not just a checkbox tick
4. **Gap Identification:** Flag days where logged hours are high but verifiable output is low

---

## Escalation Thresholds

| Metric | Yellow | Red |
|--------|--------|-----|
| Completion rate vs target | <80% | <60% |
| Unread customer enquiries | >5 (24h old) | >10 (24h old) |
| Time logged with no verifiable output | >2h/day | >4h/day |
| QC failure rate | >10% | >20% |
| Customer response time | >4h | >24h |
| Enquiry → booking conversion | <15% | <10% |

---

*Framework version 1.0 — Created 2026-02-26*
