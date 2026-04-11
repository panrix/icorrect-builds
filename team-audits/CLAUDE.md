# CLAUDE.md — Team Performance Audit Project

## READ THIS FIRST

You are working on iCorrect's team performance audit project. The goal is a **data-driven map of every team member's role, bottlenecks, profitability, and working hours** — using system API data, not self-reports.

**This has been attempted before but never documented correctly.** Everything you need is in this directory. Read it before asking Ricky to repeat context.

**Working directory:** `~/builds/team-audits/`
**API token:** `~/builds/team-audits/.env` → `MONDAY_API_TOKEN`
**Ricky's shared context:** `~/.openclaw/shared/` (COMPANY.md, TEAM.md, GOALS.md, etc.)

---

## What We're Building

For EVERY team member, we produce:

1. **What they actually do** — from Monday.com activity logs, Intercom, phone CDR, Typeform
2. **How long it takes** — cross-reference logged hours vs verifiable output
3. **What makes money** — categorise every task as revenue-generating or admin
4. **Where they're blocked** — bottlenecks, dependencies, context switching patterns
5. **What can be automated** — tasks AI/n8n could handle
6. **Revenue impact** — always calculate the £ number

---

## Current Status

| Person | Role | Audit Status | Report |
|--------|------|-------------|--------|
| Michael Ferrari | Client Services (Remote, Italy) | **COMPLETE** | `reports/ferrari/ferrari_complete_reference_2026-02-26.md` |
| Safan Patel | Lead Repair Tech (Workshop) | **COMPLETE** | `reports/safan/safan_deep_dive_2026-03-02.md` |
| Mykhailo Kepeshchuk | Lead Refurb Tech (Workshop) | **COMPLETE** | `reports/mykhailo/mykhailo_deep_dive_2026-03-02.md` |
| Roni Mykhailiuk | QC + BM Intake Diagnostics + Parts (Workshop) | **COMPLETE** | `reports/roni/roni_deep_dive_2026-03-02.md` |
| Adil Azad | Front Desk + Logistics (Workshop) | **COMPLETE** | `reports/adil/adil_deep_dive_2026-03-02.md` |
| Andreas Egas | Refurb Tech + 1h Front Desk (Workshop) | **COMPLETE** | `reports/andreas/andreas_deep_dive_2026-03-02.md` |

---

## How to Run an Audit

### Step 1: Get the data

**Monday.com Main Board activity logs** — the primary data source for all team members:

```bash
# Load API token
TOKEN=$(cat ~/builds/team-audits/.env | grep MONDAY_API_TOKEN | cut -d'=' -f2)

# Query activity logs (adjust dates and page number)
curl -s -X POST https://api.monday.com/v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -H "API-Version: 2024-01" \
  -d '{"query":"{ boards(ids: [349212843]) { activity_logs(from: \"2026-02-24T00:00:00Z\" to: \"2026-03-02T23:59:59Z\" limit: 500 page: 1) { id event data created_at user_id } } }"}'
```

**Key facts about the API:**
- `created_at` is a 17-digit number — divide by 10,000,000 for Unix timestamp
- `data` is a JSON string with column_title, previous_value, value, item_id, item_name
- User ID `-4` = Monday internal automation (ignore for human audits)
- n8n items have `#XXXX - Name` format — run under individual API tokens, inflate user counts
- Paginate: max 500 per page, increment `page` until you get <500 results
- Dates must be ISO 8601 format

**For Ferrari specifically** — also query his personal board:
```
boards(ids: [18393875720])
```

**For Intercom data** — use MCP tools (search_conversations, get_conversation) or delegate to CS Jarvis agent.

### Step 2: Filter by user

Monday.com User IDs:

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

### Step 3: Analyse and produce report

Follow the template in `framework/AUDIT_FRAMEWORK.md`. Role-specific procedures in `framework/AGENT_AUDIT_INSTRUCTIONS.md`.

Save output to: `reports/{name}/{name}_audit_{YYYY-MM-DD}.md`

---

## Audit Types by Role

| Type | Who | Key Metrics |
|------|-----|------------|
| **A: Repair Tech** | Safan | Completions/day (target: 5), blocked items, QC failure rate, queue depth |
| **A2: Refurb** | Mykhailo, Andreas | Refurb completions, time per device, parts shortages |
| **B: QC + Parts + BM Intake** | Roni | BM intake completions, QC pass/fail rate, parts logged, stock checks |
| **C: Front Desk** | Adil | Walk-ins handled, devices logged, utilisation rate (Ramadan: reduced hours) |
| **D: Client Services** | Ferrari | Time vs output cross-ref, Intercom response rate, conversion rate, Fin AI health |

---

## Ferrari Audit Summary (For Context)

The completed Ferrari audit found:
- **18h/week logged as "Clients"** — verified output ~5-9h (31 emails + 45 calls)
- **80 contact form leads, 30% got human reply, 1.25% conversion rate**
- **Fin AI handled 45 leads with 0 conversions** — 17 actively harmful
- **Revenue work = 9% of activity** — 91% is board admin, BM logistics, intake, parts
- **132 context switches on peak day** — BM logistics fragments mornings
- **~£150k/year missed revenue** from unanswered communications
- **24 hats** — role needs restructuring

Full details: `reports/ferrari/ferrari_complete_reference_2026-02-26.md`

---

## Data Sources

| Source | Access | Notes |
|--------|--------|-------|
| **Monday.com Main Board** | GraphQL API, Board 349212843 | Activity logs, statuses, time tracking |
| **Monday.com Personal Boards** | GraphQL API | Ferrari: 18393875720. Others TBD |
| **Intercom** | MCP tools or CS Jarvis agent | Admin 9702337 (Support/Ferrari), Bot 9702338 (Alex/n8n) |
| **TeleSphere CDR** | Excel export via John Reddie | Inbound only, no call duration, Ferrari Ext 205 |
| **Zendesk** | Historical CSV (migrated to Intercom 2025) | Baseline comparison only |
| **Typeform** | API (used by adil scripts) | iPad intake form data |

---

## Known Gotchas

- **n8n inflates user action counts.** Automations run under individual API tokens. Ferrari's count inflated ~5%. Check for `#XXXX - Name` items.
- **Shared Intercom account.** Ferrari sends as "Support" (admin 9702337). Can't distinguish individuals without separate accounts.
- **No phone call duration.** TeleSphere CDR only has answered/missed. Use 3-10 min/call estimates.
- **Monday time tracking is self-reported.** Always verify against activity logs.
- **Don't share results with team directly.** Route everything through Ricky.

---

## File Structure

```
~/builds/team-audits/
├── CLAUDE.md                     # THIS FILE — read first
├── PROJECT_OVERVIEW.md           # Detailed project context
├── .env                          # Monday API token
├── framework/
│   ├── AUDIT_FRAMEWORK.md        # Standardised audit template
│   └── AGENT_AUDIT_INSTRUCTIONS.md
├── reports/
│   ├── ferrari/                  # COMPLETE — 5 files
│   │   ├── ferrari_complete_reference_2026-02-26.md  # Consolidated (start here)
│   │   ├── ferrari_audit_2026-02-26.md               # Original master
│   │   ├── call_analysis_report_2026-02-26.md        # Phone data
│   │   ├── zendesk_historical_report_2026-02-26.md   # Historical baseline
│   │   └── CS_JARVIS_INTERCOM_AUDIT_TASK.md          # CS agent task spec
│   ├── adil/                     # 1 old report
│   ├── safan/                    # 1 old report
│   ├── mykhailo/                 # COMPLETE — deep dive + daily CSV
│   │   ├── mykhailo_deep_dive_2026-03-02.md        # Full audit (start here)
│   │   └── mykhailo_daily_2026-02-09_2026-03-01.csv # Daily performance data
│   ├── monthly_quality_2026-02.md  # Monthly quality report (all techs)
│   ├── andreas/                  # COMPLETE — deep dive + daily CSV
│   │   ├── andreas_deep_dive_2026-03-02.md        # Full audit (start here)
│   │   └── andreas_daily_2026-02-09_2026-03-01.csv # Daily performance data
│   └── roni/                     # Empty — pending
└── scripts/
    ├── team_daily_csv.py           # Reusable daily CSV generator (any tech)
    ├── monthly_quality_report.py   # Monthly QC + return rate report
    └── [legacy per-person scripts] # Old scripts, replaced by team_daily_csv.py
```

---

## Rules

- Always calculate £ revenue impact — Ricky decides based on numbers
- Cross-reference self-reported time against system data — that's the whole point
- One person at a time, one audit at a time — don't try to do everyone in one session
- Save reports as markdown in the correct `reports/{name}/` directory
- Update this CLAUDE.md status table when an audit is completed
- If blocked or missing data, say so — don't ship placeholders
