# CS Metrics Methodology — Michael Ferrari (client_services)
**Generated:** 2026-04-14
**Script:** `scripts/team_daily_csv.py` (CS mode activates when `role == "client_services"`)

---

## Overview

Standard tech metrics (completions, revenue, utilisation tied to repair status) do not apply to client services work. This document explains how each CS metric is calculated, what data source it uses, and what its limitations are.

---

## Metric Categories

### 1. Intercom Metrics

**Source:** Intercom REST API (`https://api.intercom.io`)
**Credential:** `INTERCOM_API_TOKEN` from `/home/ricky/config/.env`

#### Attribution methodology

Ferrari uses a shared Intercom admin account (`id: 9702337`, display name "Support"). There is no separate admin ID for Ferrari vs other human agents. Attribution works as follows:

1. **Include:** All conversation parts (replies) where `author.id == 9702337` AND `app_package_code != "n8n-automations-nkor"`
2. **Exclude:** Parts with `app_package_code == "n8n-automations-nkor"` — these are n8n workflow automations (device received confirmations, repair complete notifications, etc.)
3. **Exclude:** Bot author ID `9702338` ("Alex") — already a distinct author ID, excluded automatically

Signature matching ("Kind regards, Michael" / "— Michael Ferrari") was evaluated but deemed unnecessary: the n8n exclusion filter is sufficient to isolate human replies per the Feb 2026 audit. Cross-referencing with Monday active hours adds noise without improving accuracy and was not implemented.

**Known limitation:** If another human agent ever uses the shared Support account, their replies will be misattributed to Ferrari. This has not been observed historically.

#### Metrics

| Column | Definition |
|---|---|
| `intercom_conversations_handled` | Count of distinct conversations where at least one human reply (per above filter) was sent on that calendar day |
| `intercom_avg_response_time_hrs` | Mean time (hours) from customer's first message in each conversation to Ferrari's first human reply. Only conversations with a measurable first-reply time are included. |
| `intercom_median_response_time_hrs` | Median of the same first-reply times. More robust than average when there are outliers (e.g. conversations picked up after a weekend). |
| `intercom_under_2h_pct` | % of handled conversations where first reply time <= 2 hours |
| `intercom_over_24h_count` | Count of conversations where first reply time > 24 hours |

**Date scoping:** Conversations are included if a human reply from the Support account was sent on the target calendar day (UTC). The response time is calculated against the *conversation's* customer-created timestamp, not the day boundary.

---

### 2. Phone Metrics (TeleSphere CDR)

**Source:** TeleSphere CDR
**Status: N/A — no live CDR API available**

Investigation found no live CDR feed. The telephone inbound server (port 8003) is a Slack slash command logger, not a CDR data source. The Feb 2026 call analysis used a static CDR export.

| Column | Status |
|---|---|
| `calls_answered_count` | N/A — requires manual TeleSphere CDR export |
| `calls_missed_count` | N/A — requires manual TeleSphere CDR export |
| `answer_rate_pct` | N/A — derived from above |

**To activate:** Wire in a live TeleSphere CDR API endpoint and populate these fields in `fetch_phone_cs_metrics()` (not yet implemented).

---

### 3. Leads / Conversion Metrics

**Source:** Intercom API (contact form leads identified by tag/subject)
**Credential:** Same `INTERCOM_API_TOKEN`

Lead conversations are identified by searching Intercom for conversations tagged with `contact-form` or whose subject contains "Contact Form".

| Column | Definition |
|---|---|
| `contact_form_leads_received` | Count of contact form conversations created on that day |
| `leads_replied_personally` | Count where Ferrari (Support account, human, non-automated) sent at least one reply |
| `leads_converted_to_quote` | N/A — requires Intercom-to-Monday join key (see below) |
| `leads_converted_to_job` | N/A — requires Intercom-to-Monday join key (see below) |

**Known limitation (conversion tracking):** There is no reliable join key linking an Intercom conversation to a Monday job. The Feb 2026 audit found Ferrari achieves ~100% conversion when handling leads personally (4/4) vs ~9% when Fin AI handles alone. To wire this up, either:
- Add a Monday item ID to Intercom conversation notes at the point of booking, or
- Use customer email/phone as a fuzzy join across systems

Until that join exists, `leads_converted_to_quote` and `leads_converted_to_job` remain N/A.

---

### 4. Derived Metrics

| Column | Formula | Notes |
|---|---|---|
| `cs_utilisation_pct` | `gross_hours / CS_WORKING_HOURS * 100` where `CS_WORKING_HOURS = 8` | Gross hours from Monday activity log (first event to last event on the board). Values >100% indicate days longer than 8h. Does not account for actual CS task time (Intercom + calls) because per-message time data is unavailable. |
| `revenue_attributed` | N/A | Would require a traceable ID linking a lead/Intercom conversation to a paid job on the Monday board. Not currently available. |

---

## Columns Retained from Tech Mode

| Column | Notes for CS role |
|---|---|
| `start_time` | First Monday board activity — valid proxy for start of shift |
| `finish_time` | Last Monday board activity — valid proxy for end of shift |
| `gross_hours` | `finish_time - start_time` — total time on the board |
| `items_touched` | Monday board interactions; reframed as "Monday board items touched" rather than repairs |
| `meeting_mins` | Meeting time parsed from Ferrari's board |
| `lunch_*` | Lunch break detection |

Columns **not included** in CS mode: `completions`, `revenue`, `net_profit`, `max_capacity`, `utilisation_pct`, `available_hours`, `tracked_mins`.

---

## Sample Output (2026-04-07 to 2026-04-13)

| Date | Intercom handled | Avg response (h) | Median (h) | <2h % | >24h count | Leads in | Personally replied |
|---|---|---|---|---|---|---|---|
| 2026-04-07 | 23 | 52.4 | 42.3 | 21.7% | 13 | 14 | 14 |
| 2026-04-08 | 15 | 88.1 | 18.3 | 26.7% | 5 | 5 | 5 |
| 2026-04-09 | 17 | 69.2 | 16.5 | 11.8% | 6 | 5 | 5 |
| 2026-04-10 | 15 | 73.2 | 26.3 | 20.0% | 8 | 9 | 9 |
| 2026-04-13 | 27 | 76.9 | 47.3 | 29.6% | 16 | 13 | 10 |

**Note on response times:** Average response times of 52-88 hours reflect conversations opened days or weeks earlier that Ferrari replies to on the given day — not same-day response latency. Median is a better day-level indicator.

---

## Running the Script

```bash
# Ferrari (CS mode — produces _with_cs_metrics.csv)
python3 scripts/team_daily_csv.py --person ferrari --from 2026-04-07 --to 2026-04-13

# Tech (unchanged)
python3 scripts/team_daily_csv.py --person mykhailo --from 2026-04-07 --to 2026-04-13
```

Output path: `reports/{person_key}/{person_key}_daily_{from}_{to}_with_cs_metrics.csv`
