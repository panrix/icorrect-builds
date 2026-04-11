# Agent Audit Instructions — For Team Jarvis
## How to Run Weekly Team Audits

This document tells you exactly how to audit each team member. Run these weekly on Mondays covering the previous work week.

---

## Current Team Roles (as of Feb 2026)

| Person | Role | Location | Hours |
|--------|------|----------|-------|
| Safan | Lead Repair Tech | Workshop, 6 days | Mon–Sat 9am–6pm |
| Mykhailo | Lead Refurb Tech | Workshop, 6 days | Mon–Sat |
| Roni | QC + Parts + BM Intakes | Workshop, 6 days | First in, last out |
| Adil | Walk-in Intake + Front Desk | Workshop, 5 days | Reduced hours (Ramadan) |
| Andreas | Refurb Tech + 1h Front Desk cover | Workshop, 6 days | End-of-day front desk is temporary |
| Michael Ferrari | Client Services (Remote) | Italy, 5 days | 8:30am–6pm GMT |

---

## Data Access

### Monday.com API
- **Token:** Read from `/Users/icorrect/Projects/Monday KPIs/.env` → `MONDAY_API_TOKEN`
- **Main Board:** 349212843 (all workshop items)
- **Ferrari Board:** 18393875720 (Ferrari's daily work)
- **API:** `POST https://api.monday.com/v2` with header `Authorization: {token}`, `API-Version: 2024-01`

### Intercom
- Use MCP tools: `search_conversations`, `get_conversation`, `search_contacts`
- Ferrari operates as admin ID 9702337 ("Support", admin@icorrect.co.uk)
- Bot ID 9702338 ("Alex") is automation — ignore for human activity audit

---

## Audit Procedure: Workshop Techs (Safan, Mykhailo, Andreas)

### Step 1: Pull Activity Logs
```graphql
query {
  boards(ids: [349212843]) {
    activity_logs(from: "{WEEK_START_ISO}", to: "{WEEK_END_ISO}", limit: 10000) {
      id event data created_at user_id
    }
  }
}
```

### Step 2: Filter by User
- Filter activity logs by each technician's Monday user ID
- Count status changes to completion statuses: "Repaired", "Part Repaired"
- Count status changes to blocked statuses: "Repair Paused", "Awaiting Part", "Awaiting Info"

### Step 3: Calculate Metrics
- **Completions/day** = total completions / working days
- **Target:** Safan 5/day, Mykhailo 5/day, Andreas 3-4/day
- **Blocked rate** = blocked items / (completions + blocked)
- **QC failures** = items that went to "Repaired" then back to rework

### Step 4: Flag Anomalies
- Completion rate <80% of target → investigate
- Blocked items >30% → parts/support issue, escalate to Roni (parts) or Ricky
- QC failure rate >10% → quality issue, flag

### Existing Scripts (can be run directly)
- `/Users/icorrect/Projects/Monday KPIs/Team Reports/safan_weekly_report.py`
- `/Users/icorrect/Projects/Monday KPIs/Team Reports/mykhailo_weekly_report.py`
- `/Users/icorrect/Projects/Monday KPIs/Team Reports/andres_weekly_report.py`

Set `MONDAY_API_TOKEN` env var before running. Scripts output to markdown files in the same directory.

---

## Audit Procedure: Roni (QC + Parts + BM Intakes)

### Step 1: Pull Activity Logs (same as above)

### Step 2: Track Three Functions
1. **BM Intakes:** Count items Roni moved into the system / changed status from initial intake states
2. **QC:** Count items Roni moved to QC-related statuses (QC Passed, QC Failed, etc.)
3. **Parts:** Count parts-related status changes, stock updates

### Step 3: Key Metric — Intake Quality
- Track QC failure rate over time. Hypothesis: Roni doing intakes → fewer QC failures
- Compare current week's QC fail rate to baseline (pre-Roni-intake period)
- If QC failures are declining, the role change is working

### Step 4: Capacity Check
- Roni has 3 functions. Flag if any one function's output drops significantly — may indicate overload.

---

## Audit Procedure: Adil (Front Desk + Walk-in Intake)

### Step 1: Pull Monday Activity + Typeform Data

### Step 2: Track
- Walk-in visitors handled (Typeform submissions)
- Devices logged into system
- Hours present (note: reduced during Ramadan)
- Andreas front desk coverage: is the handoff working?

### Step 3: Ramadan Adjustment
- Don't compare Adil's reduced hours to full-time targets
- Focus on: are walk-ins being handled? Is anything falling through the cracks?

---

## Audit Procedure: Ferrari (Client Services)

**This is the most important audit to cross-reference. Self-reported time must be verified.**

### Step 1: Pull Monday.com Board Data
```graphql
query {
  boards(ids: [18393875720]) {
    groups {
      id title
      items_page(limit: 50) {
        items {
          id name
          column_values {
            id text value
          }
        }
      }
    }
  }
}
```
- Get items from daily groups for the audit period
- Extract time tracking from `duration_mkzakpnw` column
- Sum by category (Clients, BM, Labels, Quotes, Team Meeting, etc.)

### Step 2: Pull Intercom Data
- Search conversations authored by `michael.f@icorrect.co.uk` (contact form submissions via n8n) — this is INBOUND volume, not Ferrari's work
- Search conversations authored by admin 9702337 ("Support") — this is OUTBOUND, Ferrari's actual emails
- Check `first_admin_reply_at` on inbound conversations — are they being responded to?
- Count unread conversations

### Step 3: Cross-Reference
For every hour Ferrari logs under "Clients":
- Is there a corresponding Intercom conversation?
- Is there a documented phone call follow-up?
- Is there a Monday item linked to the work?

**If "Clients" hours > 2x identifiable Intercom activity → flag for review.**

### Step 4: Conversion Tracking
- Count: enquiries received (contact forms)
- Count: quotes sent (admin-initiated emails with pricing)
- Count: bookings confirmed (tagged "create-repair" in Intercom)
- Calculate: enquiry → booking conversion rate

### Step 5: Fin AI Health Check
- Count conversations where Fin participated
- Count "Assumed Resolution" vs "Confirmed Resolution"
- Count "Routed to team" conversations that are still open (nobody actioned)
- Flag if >50% of Fin resolutions are "Assumed" — means nobody is reviewing

---

## Output Format

Save audit reports to: `/Users/icorrect/Projects/Monday KPIs/Team Reports/`
Filename format: `{name}_audit_{YYYY-MM-DD}.md`

Follow the template in `AUDIT_FRAMEWORK.md`.

---

## Escalation

- **Yellow flags:** Include in weekly summary to Ricky
- **Red flags:** Notify Ricky immediately via Telegram (through Jarvis)
- **Revenue at risk:** Always calculate and include — Ricky needs to see the £ impact

---

## What NOT to Do

- Do not share audit results with the team member directly — route through Ricky
- Do not modify anyone's Monday board items
- Do not send messages to customers on anyone's behalf
- Do not make assumptions about phone calls — only report what's verifiable in systems

---

*Instructions v1.0 — Created 2026-02-26*
*To be deployed to Team Jarvis agent workspace when agent system is live*
