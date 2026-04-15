# Codex Brief: Extend Ferrari Daily Tracking with CS Metrics

**Project:** /home/ricky/builds/team-audits/
**Date:** 2026-04-14
**Owner:** Ricky via Jarvis

---

## Context

We have `scripts/team_daily_csv.py` which tracks Monday board activity per team member. It works for techs (Safan, Andres, Mykhailo) because their work maps cleanly to "items completed" and "revenue generated". It does NOT work for Michael Ferrari (client services / front desk) because his value isn't measured by repair completions — it's measured by customer response times, quote conversions, and phone calls handled.

We need to extend the script so Ferrari has a meaningful daily tracking output that reflects CS work.

## Current State

`team_daily_csv.py` already has Ferrari in the `TEAM_MEMBERS` dict (user_id `55780786`, role `client_services`), and the script runs for him successfully. But the CSV output shows:
- `revenue=0`, `net_profit=0`, `completions=0`, `utilisation_pct=0%`
- `items_touched` is the only meaningful metric (e.g. 37-62 items/day)
- Everything else is zero because CS work doesn't hit "Repaired" / "Collected" statuses

Historical reference (comprehensive Feb 2026 audit):
- `/home/ricky/builds/team-audits/reports/ferrari/ferrari_audit_2026-02-26.md` — Monday board analysis
- `/home/ricky/builds/team-audits/reports/ferrari/ferrari_complete_reference_2026-02-26.md` — Intercom, conversions, revenue impact
- `/home/ricky/builds/team-audits/reports/ferrari/call_analysis_report_2026-02-26.md` — phone CDR analysis
- `/home/ricky/builds/team-audits/reports/ferrari/CS_JARVIS_INTERCOM_AUDIT_TASK.md` — Intercom audit protocol

## Task

Extend `team_daily_csv.py` to add a CS-specific tracking mode that activates when `role == "client_services"`. When running the script for Ferrari (or any future CS role), the CSV should include the CS metrics below **instead of or in addition to** the tech-focused columns.

## CS Metrics to Track

For each day in the date range, add these columns:

### Intercom (primary CS metric)
- `intercom_conversations_handled` — count of conversations where Ferrari replied
- `intercom_avg_response_time_hrs` — average time from customer message to Ferrari reply
- `intercom_median_response_time_hrs` — median (more robust than average)
- `intercom_under_2h_pct` — % of conversations replied to within 2 hours
- `intercom_over_24h_count` — count of conversations with reply time > 24h

**Challenge:** Intercom uses a shared "Support" admin account (ID 9702337). Ferrari's individual activity cannot be isolated by admin_id. Instead, identify Ferrari's replies by:
1. Message content signatures (writing style, sign-off "Kind regards, Michael" / "— Michael Ferrari")
2. Cross-reference with hours he was active on Monday board (proxy: if a reply lands during Ferrari's tracked work hours and uses his signature, attribute to him)
3. Accept this is imperfect — note the methodology in the script header

Alternative: if Intercom's admin IDs can be retrieved via API and there's a Ferrari-specific one, use that instead.

### Phone (TeleSphere CDR)
- `calls_answered_count` — calls Ferrari personally answered
- `calls_missed_count` — calls where Ferrari was on shift but didn't answer
- `answer_rate_pct` — answered / (answered + missed during his hours)

**Reference:** The Feb 2026 call analysis used TeleSphere CDR data. Check if there's a live CDR feed or if it's a static export. If live, wire it in. If static, note it as a manual-input field.

### Leads / Conversion
- `contact_form_leads_received` — inbound leads (from website contact form, tracked in Monday clients board 18393875720)
- `leads_replied_personally` — leads where Ferrari (not Fin AI) replied
- `leads_converted_to_quote` — leads that reached quote stage
- `leads_converted_to_job` — leads that became a paid job

**Reference:** Feb audit found Ferrari achieves 100% conversion when handling personally (4/4), vs 9% when Fin AI handles alone. Any new metric should preserve that "personal vs AI" split.

### Derived metrics
- `cs_utilisation_pct` — calculated from actual CS work, not repair completions. Proposed formula: `(time on Intercom replies + time on calls + time on Monday CS cards) / available_hours`
- `revenue_attributed` — revenue from jobs where Ferrari was the converting touchpoint (needs a traceable ID linking a lead/conversation to the final job)

## Keep These From the Existing Script

Don't remove the existing columns — add CS columns alongside. Ferrari's CSV should still show:
- `start_time`, `finish_time`, `gross_hours` (from Monday activity logs) — these ARE useful for him, just don't tie them to completions
- `items_touched` — still useful, just reframe as "Monday board interactions"
- `meetings`, `lunch_*` — useful context

For Ferrari specifically, **remove** (or set to N/A):
- `completions` — he doesn't complete repairs
- `revenue` / `net_profit` as currently calculated — will be replaced by `revenue_attributed`
- `max_capacity` — irrelevant for CS

## Data Sources

- **Monday API:** already wired, uses `MONDAY_API_TOKEN` from `../.env`
- **Intercom API:** token in `/home/ricky/config/.env` (look for `INTERCOM_TOKEN` or similar)
- **TeleSphere CDR:** check `/home/ricky/builds/telesphere*` or reference the Feb 2026 call_analysis_report for data source
- **Ferrari board:** `18393875720` (already defined as `FERRARI_BOARD_ID`)
- **Main board:** `349212843` (clients board)

## Acceptance Criteria

1. Running `python3 team_daily_csv.py --person ferrari --from 2026-04-07 --to 2026-04-13` produces a CSV with ALL CS columns populated (not zero unless genuinely zero).
2. Running it for a tech (e.g. `--person mykhailo`) still works with the original tech columns. The CS extension only activates for `role: client_services`.
3. The script header comments explain the CS attribution methodology (especially the shared Intercom account workaround).
4. Any API credentials are loaded from .env, never hardcoded.
5. If an API is unreachable (Intercom down, etc.), the script logs a warning and fills that column with `N/A` rather than crashing.
6. Commit the changes to the repo with a clear message.

## Deliverables

- Updated `scripts/team_daily_csv.py`
- A fresh CSV output for Ferrari for the period 2026-04-07 to 2026-04-13 at `reports/ferrari/ferrari_daily_2026-04-07_2026-04-13_with_cs_metrics.csv`
- A short report at `reports/ferrari/cs_metrics_methodology.md` explaining how each metric is calculated, data sources, and known limitations
- Git commit with the changes

## Do NOT

- Do not refactor the tech-focused code paths. Leave them alone.
- Do not hardcode Ferrari's name anywhere — use the `role: "client_services"` flag
- Do not skip the methodology doc. Future you (or future agents) will need to understand how CS metrics are attributed
- Do not claim completion without actually running the script end-to-end and producing a CSV

---

Reference the original audits in `reports/ferrari/` for what "good" CS data looks like.
