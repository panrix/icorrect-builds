# iCorrect — Team Performance Analysis Project
## Project Overview for Code Agents
## Started: 26 February 2026

---

## What This Project Is

A data-driven mapping of every iCorrect team member's role, bottlenecks, profitability, and working hours. The goal is to understand exactly what each person does, how long it actually takes, where the gaps are, and what can be automated or restructured.

**This has been attempted before but never documented correctly.** This time it's being done with verifiable data from system APIs, not self-reports.

---

## Why It Matters

1. **AI implementation requires accurate workflow data.** We're building AI agents to help with workflows, but you can't automate what you don't understand.
2. **Revenue is leaking.** The Ferrari audit found ~£150k/year in missed revenue from unanswered communications alone.
3. **Self-reported time doesn't match output.** Ferrari logs 18h/week on "Clients" — verified output is ~5-9h.
4. **Role boundaries are unclear.** Ferrari wears 24 hats. Other team members likely have similar sprawl.
5. **No baseline exists.** Without audits, there's no way to measure improvement after changes.

---

## The Team

| Person | Role | Location | Data Sources | Audit Status |
|--------|------|----------|-------------|-------------|
| Michael Ferrari | Client Services (Remote) | Italy | Monday (personal board + main board), Intercom, TeleSphere CDR, Zendesk historical | **COMPLETE** — full audit 26 Feb 2026 |
| Safan Patel | Lead Repair Tech | Workshop | Monday main board activity logs | Pending |
| Mykhailo Kepeshchuk | Lead Refurb Tech | Workshop | Monday main board activity logs | Pending |
| Roni Mykhailiuk | QC + Parts + BM Intakes | Workshop | Monday main board activity logs | Pending |
| Adil Azad | Walk-in Intake + Front Desk | Workshop | Monday main board, Typeform | Pending |
| Andreas Egas | Refurb Tech + 1h Front Desk | Workshop | Monday main board activity logs | Pending |

---

## Methodology

### For Each Team Member, We Map:

1. **What they actually do** — from system activity logs, not self-reports
2. **How long it takes** — cross-referencing logged hours vs verifiable output
3. **What makes money** — categorising every task as revenue-generating or admin
4. **Where they're blocked** — bottlenecks, dependencies, context switching
5. **What can be automated** — tasks that AI/n8n could handle
6. **Revenue impact** — £ value of gaps, missed opportunities, inefficiencies

### Data Sources

| Source | Access | What It Shows | Key IDs |
|--------|--------|--------------|---------|
| **Monday.com Main Board** | GraphQL API (`POST https://api.monday.com/v2`) | Activity logs (who did what, when), item statuses, time tracking | Board: 349212843 |
| **Monday.com Personal Boards** | GraphQL API | Self-reported time tracking per person | Ferrari: 18393875720 |
| **Monday.com API Token** | `/Users/icorrect/Projects/Monday KPIs/.env` → `MONDAY_API_TOKEN` | Auth header: `Authorization: {token}`, `API-Version: 2024-01` | |
| **Intercom** | MCP tools (`search_conversations`, `get_conversation`, `search_contacts`) OR CS Jarvis agent (direct API) | Customer emails, response times, Fin AI performance, lead tracking | Admin 9702337 (Support/Ferrari), Bot 9702338 (Alex/n8n) |
| **TeleSphere CDR** | Excel export via John Reddie | Inbound call volume, answered/missed by extension, hourly patterns | Ferrari: Ext 205, Adil: Ext 200, Andreas: Ext 201 |
| **Zendesk** | Historical CSV export (migrated to Intercom 2025) | Baseline comparison — what "normal" looked like before Intercom | Agent 368515462538 (Ferrari) |
| **Typeform** | API (used by `adil_weekly_report.py`) | iPad intake form — walk-in customer data | |

### Monday.com User IDs

| User ID | Person |
|---------|--------|
| 55780786 | Michael Ferrari |
| 1034414 | Ricky Panesar |
| 25304513 | Safan Patel |
| 49001724 | Andreas Egas |
| 64642914 | Mykhailo Kepeshchuk |
| 79665360 | Roni Mykhailiuk |
| 94961618 | Adil Azad |
| 32191305 | CS-Auto (n8n service) |
| -4 | Monday internal automation |

### Key API Patterns

**Activity logs query:**
```graphql
query {
  boards(ids: [349212843]) {
    activity_logs(from: "{ISO_DATE}", to: "{ISO_DATE}", limit: 500, page: 1) {
      id event data created_at user_id
    }
  }
}
```

- `created_at` is a 17-digit number — divide by 10,000,000 for Unix timestamp
- `event` types: `update_column_value`, `create_item`, `move_item`, etc.
- `data` is JSON string containing column_title, previous_value, value, item_id, item_name, etc.
- User ID `-4` = Monday internal automation (ignore for human audits)
- n8n items identifiable by `#XXXX - Name` format — these run under individual API tokens, inflating user action counts

**Updates query (for team comms):**
```graphql
query {
  boards(ids: [349212843]) {
    updates(limit: 100) {
      id creator_id created_at text_body item_id
      replies { id creator_id created_at text_body }
    }
  }
}
```

---

## Audit Framework

See `AUDIT_FRAMEWORK.md` for the full standardised template and role-specific audit types:
- **Type A:** Repair Techs (Safan) — completions/day, blocked items, QC failure rate
- **Type A2:** Refurb (Mykhailo, Andreas) — refurb completions, time per device
- **Type B:** QC + Parts + BM Intakes (Roni) — intake quality, QC pass/fail, parts tracking
- **Type C:** Front Desk (Adil) — walk-ins handled, utilisation rate
- **Type D:** Client Services (Ferrari) — time vs output cross-reference, conversion tracking

See `AGENT_AUDIT_INSTRUCTIONS.md` for step-by-step procedures for running each audit type.

---

## Existing Scripts

| Script | What It Does | Location |
|--------|-------------|----------|
| `safan_weekly_report.py` | Safan repair completions + metrics | `/Users/icorrect/Projects/Monday KPIs/Team Reports/` |
| `mykhailo_weekly_report.py` | Mykhailo refurb completions | Same |
| `andres_weekly_report.py` | Andreas output tracking | Same |
| `roni_weekly_report.py` | Roni QC + parts (needs BM intake update) | Same |
| `adil_weekly_report.py` | Adil walk-in intake metrics | Same |
| `adil_deep_analysis.py` | Adil detailed activity analysis | Same |
| `adil_activity_analysis.py` | Adil activity patterns | Same |
| `zendesk_historical_analysis.py` | Reusable Zendesk data analysis | Same |

All scripts need `MONDAY_API_TOKEN` env var set before running.

---

## Completed Work

### Ferrari Audit (26 Feb 2026) — COMPLETE

**Full reference:** `ferrari_complete_reference_2026-02-26.md` (consolidated)
**Individual reports:**
- `ferrari_audit_2026-02-26.md` — Master audit (14 sections, 776 lines)
- `call_analysis_report_2026-02-26.md` — Phone analysis (373 lines)
- `zendesk_historical_report_2026-02-26.md` — Historical baseline (238 lines)
- VPS: `~/.openclaw/agents/customer-service/workspace/docs/intercom-audit-feb2026.md` — CS Jarvis deep dive

**Key findings:**
- 18h/week logged as "Clients" — verified output is ~5-9h
- 80 contact form leads, only 30% got a human reply, 1.25% conversion
- Fin AI handled 45 leads with 0 conversions, 17 actively harmful
- Revenue-generating work (quoting, invoicing) = 9% of 765 Monday actions
- 132 context switches on peak day — BM logistics fragmenting mornings
- ~£150k/year in missed revenue from unanswered communications
- 24 different hats — role needs restructuring

---

## What Comes Next

1. **Workshop tech audits** (Safan, Mykhailo, Andreas) — existing scripts need validation and running
2. **Roni audit** — new BM intake role needs tracking, script needs updating
3. **Adil audit** — Ramadan-adjusted, walk-in + front desk
4. **Cross-team analysis** — where do handoffs break? Which bottlenecks cascade?
5. **Automation opportunities** — what can n8n/AI agents take over per role?
6. **Weekly automated audits** — Team Jarvis running these on Monday mornings
7. **KPI dashboard** — tracked metrics feeding into Mission Control

---

## Important Notes for Agents

- **n8n automation runs under individual API tokens.** Ferrari's Monday activity is inflated by ~5% from n8n items created under his user ID. Same may be true for others. Always filter for user_id `-4` AND check for `#XXXX - Name` item patterns.
- **Shared Intercom admin account.** Ferrari and potentially others send from "Support" (admin 9702337). Can't distinguish individual activity without separate accounts. This is a known limitation.
- **TeleSphere CDR has no call duration.** Only answered/missed. Phone time estimates use assumed averages (3-10 min/call).
- **Monday time tracking is self-reported.** Always cross-reference with activity logs and external systems.
- **Don't share audit results directly with team members.** Route through Ricky.
- **Always calculate revenue impact.** Ricky needs to see the £ number, not just percentages.

---

## File Structure

```
/Users/icorrect/Projects/Monday KPIs/
├── .env                          # Monday API token
├── Team Reports/
│   ├── PROJECT_OVERVIEW.md       # THIS FILE
│   ├── AUDIT_FRAMEWORK.md        # Standardised audit template
│   ├── AGENT_AUDIT_INSTRUCTIONS.md # Step-by-step for Team Jarvis
│   ├── ferrari_complete_reference_2026-02-26.md  # Consolidated Ferrari audit
│   ├── ferrari_audit_2026-02-26.md               # Ferrari master audit
│   ├── call_analysis_report_2026-02-26.md        # Phone analysis
│   ├── zendesk_historical_report_2026-02-26.md   # Historical baseline
│   ├── zendesk_historical_analysis.py            # Reusable Zendesk script
│   ├── safan_weekly_report.py    # Safan audit script
│   ├── mykhailo_weekly_report.py # Mykhailo audit script
│   ├── andres_weekly_report.py   # Andreas audit script
│   ├── roni_weekly_report.py     # Roni audit script
│   ├── adil_weekly_report.py     # Adil audit script
│   ├── adil_deep_analysis.py     # Adil detailed analysis
│   └── adil_activity_analysis.py # Adil activity patterns
```

---

*Project started: 2026-02-26*
*Owner: Ricky Panesar (via Claude Code)*
*Last updated: 2026-02-27*
