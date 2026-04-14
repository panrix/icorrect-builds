# CS Metrics Methodology — Michael Ferrari
**Created:** 2026-04-14
**Script:** `scripts/team_daily_csv.py` (CS mode, activated by `role: "client_services"`)

---

## Overview

Ferrari's value is not measured by repair completions. This document explains how each CS metric is sourced, attributed, and calculated.

---

## Intercom Metrics

### Attribution

Ferrari uses a shared Intercom admin account (ID `9702337`, display name "Support", email `admin@icorrect.co.uk`). There is no individual admin account for him. All human replies in Intercom come through this shared account.

**What IS Ferrari:** Any admin reply from ID `9702337` where `app_package_code` is absent or is not `n8n-automations-nkor`.

**What is NOT Ferrari:**
- Bot ID `9702338` ("Alex") — automated AI responses. Already excluded by being a different author.
- Messages with `app_package_code = "n8n-automations-nkor"` — n8n workflow automations (device received notifications, repair complete alerts, courier booked confirmations, etc.). These fire automatically and must not be counted as Ferrari's work.
- Part types `assignment`, `away_mode_assignment`, `note` — internal admin actions, not customer-facing replies.

**Signature matching** ("Kind regards, Michael" / "— Michael Ferrari") was considered as a secondary check but is unnecessary given the n8n filter above reliably excludes all automation. Cross-referencing with Monday active hours was also considered but adds noise: Intercom is accessed via email/browser and doesn't require Monday to be active.

### `intercom_conversations_handled`
Count of distinct conversations where Ferrari made at least one qualifying manual reply on the given day.

**Source:** Intercom `/conversations/search` (filter: `statistics.last_admin_reply_at` within day), then per-conversation `/conversations/{id}` to check parts.

### `intercom_avg_response_time_hrs`
Average time (in hours) from the last customer message before Ferrari's first reply on that day to Ferrari's reply. Per conversation, then averaged across all conversations he handled that day.

**Note:** If a conversation was opened days ago and Ferrari replies today, the response time reflects how long that customer waited — which is the real signal. Short response times mean he's staying on top of the queue; high times mean leads are going cold.

**Fallback:** If no customer message is found before the reply, `conversation.created_at` is used as the proxy for "when the customer first reached out."

### `intercom_median_response_time_hrs`
Median of the same per-conversation response times. More robust than average for distributions with outliers (e.g., one conversation left open 5 days skews the average but not the median).

### `intercom_under_2h_pct`
Percentage of handled conversations where Ferrari's response time was ≤ 2 hours. This is the primary customer service SLA indicator. Target: >50%.

### `intercom_over_24h_count`
Count of conversations where Ferrari's response time exceeded 24 hours. These represent leads most likely to have gone cold or customers likely to be frustrated. High counts (>5/day) are a flag.

---

## Phone Metrics

### `calls_answered_count`, `calls_missed_count`, `answer_rate_pct`

**Status: N/A — no live CDR feed available.**

The `telephone-inbound` service (port 8003) is a Slack slash command handler for manually logging phone enquiries. It is NOT a CDR (Call Detail Record) source and does not capture all calls.

The February 2026 call analysis used a TeleSphere static CDR export. Until a live TeleSphere API integration is built, phone metrics are returned as `N/A`.

**To implement:** Obtain TeleSphere API credentials and endpoint. The script has placeholder columns ready for live data. Add a `fetch_phone_metrics(date_str)` function that queries the CDR and populate these fields.

---

## Leads / Conversion Metrics

### `contact_form_leads_received`
Count of new Intercom conversations created on the given day with `source.type = "email"`. These correspond to contact form submissions routed via n8n into Intercom.

**Source:** Intercom `/conversations/search` (filter: `created_at` within day + `source.type = email`).

**Limitation:** Some direct email enquiries (not via contact form) may also appear here. This is intentional — any new inbound email conversation represents a potential lead.

### `leads_replied_personally`
Of the inbound leads received that day (or historically — any lead that exists in the date range), count how many had at least one qualifying manual Ferrari reply (using same attribution logic as above).

**Important nuance:** This checks if Ferrari replied to each lead AT ANY POINT (not just on the same day). This measures overall coverage, not same-day responsiveness. For same-day responsiveness, use `intercom_under_2h_pct`.

**Feb 2026 context:** Ferrari achieved 100% conversion when handling leads personally (4/4) vs 9% when Fin AI handled alone (0/45 confirmed conversions). High `leads_replied_personally` is therefore a direct revenue driver.

### `leads_converted_to_quote`, `leads_converted_to_job`

**Status: N/A — not implemented.**

Requires linking an Intercom conversation ID to a Monday board item (quote or job). There is no reliable join key between the two systems currently. The contact form doesn't pass a conversation ID into Monday; Monday items don't store Intercom conversation IDs.

**To implement:** Either (a) configure n8n to tag Monday items with the originating Intercom conversation ID when creating leads, or (b) match by customer email across both systems. Option (a) is cleaner.

---

## Derived Metrics

### `cs_utilisation_pct`
Formula: `gross_hours / CS_WORKING_HOURS * 100`

Where `gross_hours` = time span from Ferrari's first to last Monday board action on the day, and `CS_WORKING_HOURS = 8`.

**Why Monday-derived:** We don't have per-conversation composition time from Intercom (Intercom doesn't expose time spent in a conversation). The brief's intended formula — `(Intercom time + call time + Monday CS cards) / available_hours` — requires data we don't have for Intercom and calls.

**Interpretation:** Values >100% indicate Ferrari is logging activity beyond his 8h contract. Values <50% may indicate a slow day or time not being logged on Monday. This is a proxy, not a precise efficiency measure.

### `revenue_attributed`

**Status: N/A — not implemented.**

Would represent revenue from jobs where Ferrari was the converting touchpoint (i.e., he replied to the inbound lead that became the job). Requires the same Intercom↔Monday join key described above for `leads_converted_to_job`.

---

## Known Limitations

1. **Shared admin account:** All non-automated replies are attributed to Ferrari because he's the only human agent. If another person ever uses the shared `admin@icorrect.co.uk` account, their activity would be incorrectly attributed to Ferrari.

2. **Response time methodology:** Uses "last customer message before Ferrari's first reply today" rather than the total conversation wait time. If a customer sent multiple messages over several days, this measures time since their most recent message.

3. **API rate limits:** The script sleeps 80ms between Intercom per-conversation fetches. On high-volume days (>50 conversations), this adds ~4 seconds per day of API wait time. Cap is 300 conversations per search page set.

4. **Phone calls:** Entirely absent from the data. The most actionable missing metric is whether Ferrari is answering inbound calls. This should be the next integration priority.

5. **Leads conversion gap:** Without the Intercom↔Monday join, we can't close the loop from lead to job. The leads data shows Ferrari is personally handling 94%+ of inbound leads (Apr 2026), but we can't confirm conversion rates yet.

---

## Reference

- Feb 2026 audit: `reports/ferrari/ferrari_complete_reference_2026-02-26.md`
- Intercom audit protocol: `reports/ferrari/CS_JARVIS_INTERCOM_AUDIT_TASK.md`
- Call analysis: `reports/ferrari/call_analysis_report_2026-02-26.md`
