#!/usr/bin/env python3
"""
Zendesk Historical Analysis — iCorrect
Processes exported Zendesk ticket JSON files (2023-2025) to produce:
  1. Volume trends (weekly, monthly, quarterly)
  2. Response time benchmarks (first reply, quote turnaround, lifecycle)
  3. Conversion funnel (enquiry → booking → received → repaired)
  4. Agent activity (messages/week)
  5. Channel breakdown by period

Usage:
  python3 zendesk_historical_analysis.py

Output:
  zendesk_historical_report_YYYY-MM-DD.md in same directory
"""

import json
import os
from datetime import datetime, timedelta
from collections import Counter, defaultdict
from pathlib import Path

# === CONFIG ===
DATA_DIR = "/Users/icorrect/Downloads/Organized/Data_Files/Other"
FILE_PATTERN = "tickets_clean_part_{}.json"
FILE_COUNT = 5
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
MIN_YEAR = 2023
MAX_YEAR = 2025

# Tags to ignore (ghost AI — did nothing)
IGNORE_TAGS = {"ai_handled", "fin-failed"}

# Funnel stage tags (order matters)
FUNNEL_TAGS = {
    "web_enquiry": "Enquiry",
    "booking_confirmed_sent": "Booking Confirmed",
    "device_received_sent": "Device Received",
    "repaired_email": "Repair Complete",
    "device_repaired_sent": "Repaired Sent",
}

# Primary agent ID (Ferrari / main support)
PRIMARY_AGENT_ID = 368515462538


def load_tickets():
    """Load all tickets from JSON files, filter to MIN_YEAR-MAX_YEAR."""
    tickets = []
    for i in range(1, FILE_COUNT + 1):
        path = os.path.join(DATA_DIR, FILE_PATTERN.format(i))
        with open(path) as f:
            data = json.load(f)
        for t in data:
            created = parse_dt(t["created_at"])
            if MIN_YEAR <= created.year <= MAX_YEAR:
                t["_created_dt"] = created
                t["_updated_dt"] = parse_dt(t["updated_at"])
                tickets.append(t)
    tickets.sort(key=lambda t: t["_created_dt"])
    return tickets


def parse_dt(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def iso_week(dt):
    """Return 'YYYY-WXX' string."""
    cal = dt.isocalendar()
    return f"{cal[0]}-W{cal[1]:02d}"


def quarter(dt):
    q = (dt.month - 1) // 3 + 1
    return f"{dt.year} Q{q}"


def month_key(dt):
    return f"{dt.year}-{dt.month:02d}"


# === ANALYSIS FUNCTIONS ===

def volume_analysis(tickets):
    """Tickets per week, month, quarter."""
    weekly = Counter()
    monthly = Counter()
    quarterly = Counter()
    yearly = Counter()

    for t in tickets:
        dt = t["_created_dt"]
        weekly[iso_week(dt)] += 1
        monthly[month_key(dt)] += 1
        quarterly[quarter(dt)] += 1
        yearly[dt.year] += 1

    return weekly, monthly, quarterly, yearly


def response_time_analysis(tickets):
    """Calculate first reply times and lifecycle durations."""
    first_reply_times = []  # hours
    quote_turnarounds = []  # hours (customer provides info → agent sends quote)
    lifecycle_durations = []  # days (created → last update for closed tickets)

    # Per-quarter breakdown
    reply_by_quarter = defaultdict(list)

    for t in tickets:
        comments = t.get("comments", [])
        if not comments:
            continue

        created = t["_created_dt"]
        q = quarter(created)

        # First reply: first agent comment after ticket creation
        for c in comments:
            if c.get("author_type") == "agent":
                agent_reply = parse_dt(c["created_at"])
                delta_hours = (agent_reply - created).total_seconds() / 3600
                if 0 <= delta_hours <= 720:  # cap at 30 days to exclude outliers
                    first_reply_times.append(delta_hours)
                    reply_by_quarter[q].append(delta_hours)
                break

        # Lifecycle: created → updated for closed/solved tickets
        if t.get("status") in ("closed", "solved"):
            updated = t["_updated_dt"]
            lifecycle_days = (updated - created).total_seconds() / 86400
            if 0 <= lifecycle_days <= 90:  # cap at 90 days
                lifecycle_durations.append(lifecycle_days)

    return first_reply_times, lifecycle_durations, reply_by_quarter


def conversion_funnel(tickets):
    """Track how many tickets reach each funnel stage, by quarter."""
    funnel_by_quarter = defaultdict(lambda: Counter())
    funnel_total = Counter()

    for t in tickets:
        tags = set(t.get("tags", []))
        q = quarter(t["_created_dt"])

        for tag_key, stage_name in FUNNEL_TAGS.items():
            if tag_key in tags:
                funnel_total[stage_name] += 1
                funnel_by_quarter[q][stage_name] += 1

    return funnel_total, funnel_by_quarter


def agent_activity(tickets):
    """Count agent messages per week and total."""
    agent_weekly = defaultdict(Counter)  # agent_id → {week: count}
    agent_total = Counter()

    for t in tickets:
        for c in t.get("comments", []):
            if c.get("author_type") == "agent":
                author = c["author"]
                week = iso_week(parse_dt(c["created_at"]))
                agent_weekly[author][week] += 1
                agent_total[author] += 1

    return agent_weekly, agent_total


def channel_analysis(tickets):
    """Channel breakdown by quarter."""
    channel_by_quarter = defaultdict(Counter)
    channel_total = Counter()

    for t in tickets:
        ch = t.get("channel", "unknown")
        q = quarter(t["_created_dt"])
        channel_total[ch] += 1
        channel_by_quarter[q][ch] += 1

    return channel_total, channel_by_quarter


def tag_funnel_conversion_rates(tickets):
    """For web_enquiry tickets: what % reach each subsequent stage?"""
    web_enquiries = [t for t in tickets if "web_enquiry" in set(t.get("tags", []))]
    if not web_enquiries:
        return {}

    stages = ["web_enquiry", "booking_confirmed_sent", "device_received_sent", "repaired_email"]
    stage_names = ["Enquiry", "Booking Confirmed", "Device Received", "Repair Complete"]

    # By quarter
    rates_by_quarter = defaultdict(dict)
    overall = {}

    for q_tickets, q_label in _group_by_quarter(web_enquiries):
        total = len(q_tickets)
        for tag, name in zip(stages, stage_names):
            count = sum(1 for t in q_tickets if tag in set(t.get("tags", [])))
            rates_by_quarter[q_label][name] = (count, total, count / total * 100 if total else 0)

    total = len(web_enquiries)
    for tag, name in zip(stages, stage_names):
        count = sum(1 for t in web_enquiries if tag in set(t.get("tags", [])))
        overall[name] = (count, total, count / total * 100 if total else 0)

    return overall, rates_by_quarter


def _group_by_quarter(tickets):
    by_q = defaultdict(list)
    for t in tickets:
        by_q[quarter(t["_created_dt"])].append(t)
    for q in sorted(by_q):
        yield by_q[q], q


def percentile(data, p):
    if not data:
        return 0
    sorted_data = sorted(data)
    k = (len(sorted_data) - 1) * (p / 100)
    f = int(k)
    c = f + 1
    if c >= len(sorted_data):
        return sorted_data[f]
    return sorted_data[f] + (k - f) * (sorted_data[c] - sorted_data[f])


def median(data):
    return percentile(data, 50)


def mean(data):
    return sum(data) / len(data) if data else 0


# === REPORT GENERATION ===

def generate_report(tickets):
    lines = []
    L = lines.append

    today = datetime.now().strftime("%Y-%m-%d")

    L(f"# iCorrect — Zendesk Historical Analysis")
    L(f"## Period: {MIN_YEAR}–{MAX_YEAR}")
    L(f"## Generated: {today}")
    L(f"## Data: {len(tickets):,} tickets from Zendesk export")
    L("")
    L("---")
    L("")

    # === 1. VOLUME ===
    weekly, monthly, quarterly, yearly = volume_analysis(tickets)

    L("## 1. Volume Trends")
    L("")
    L("### Annual")
    L("")
    L("| Year | Tickets | Change |")
    L("|------|---------|--------|")
    prev = None
    for y in sorted(yearly):
        change = ""
        if prev:
            pct = (yearly[y] - prev) / prev * 100
            change = f"+{pct:.0f}%" if pct > 0 else f"{pct:.0f}%"
        L(f"| {y} | {yearly[y]:,} | {change} |")
        prev = yearly[y]

    L("")
    L("### Quarterly")
    L("")
    L("| Quarter | Tickets | Tickets/Week (avg) |")
    L("|---------|---------|-------------------|")
    for q in sorted(quarterly):
        per_week = quarterly[q] / 13  # ~13 weeks per quarter
        L(f"| {q} | {quarterly[q]:,} | {per_week:.1f} |")

    L("")
    L("### Monthly")
    L("")
    L("| Month | Tickets |")
    L("|-------|---------|")
    for m in sorted(monthly):
        L(f"| {m} | {monthly[m]:,} |")

    L("")
    L("---")
    L("")

    # === 2. RESPONSE TIMES ===
    first_reply_times, lifecycle_durations, reply_by_quarter = response_time_analysis(tickets)

    L("## 2. Response Time Benchmarks")
    L("")
    L("### First Reply Time (hours)")
    L("")
    if first_reply_times:
        L(f"- **Tickets measured:** {len(first_reply_times):,}")
        L(f"- **Median:** {median(first_reply_times):.1f}h")
        L(f"- **Mean:** {mean(first_reply_times):.1f}h")
        L(f"- **P25 (fast):** {percentile(first_reply_times, 25):.1f}h")
        L(f"- **P75:** {percentile(first_reply_times, 75):.1f}h")
        L(f"- **P90 (slow):** {percentile(first_reply_times, 90):.1f}h")
        L("")

        L("### First Reply Time by Quarter")
        L("")
        L("| Quarter | Median (h) | Mean (h) | P90 (h) | Count |")
        L("|---------|-----------|---------|---------|-------|")
        for q in sorted(reply_by_quarter):
            data = reply_by_quarter[q]
            L(f"| {q} | {median(data):.1f} | {mean(data):.1f} | {percentile(data, 90):.1f} | {len(data):,} |")
    else:
        L("*No first reply data available.*")

    L("")
    L("### Lifecycle Duration — Created to Closed (days)")
    L("")
    if lifecycle_durations:
        L(f"- **Tickets measured:** {len(lifecycle_durations):,}")
        L(f"- **Median:** {median(lifecycle_durations):.1f} days")
        L(f"- **Mean:** {mean(lifecycle_durations):.1f} days")
        L(f"- **P25 (fast):** {percentile(lifecycle_durations, 25):.1f} days")
        L(f"- **P75:** {percentile(lifecycle_durations, 75):.1f} days")
        L(f"- **P90 (slow):** {percentile(lifecycle_durations, 90):.1f} days")

    L("")
    L("---")
    L("")

    # === 3. CONVERSION FUNNEL ===
    overall_funnel, funnel_by_q = tag_funnel_conversion_rates(tickets)

    L("## 3. Conversion Funnel (Web Enquiries)")
    L("")
    L("Tracks web enquiry tickets through the pipeline using Zendesk tags.")
    L("")

    if overall_funnel:
        L("### Overall (2023–2025)")
        L("")
        L("| Stage | Count | % of Enquiries |")
        L("|-------|-------|---------------|")
        for stage in ["Enquiry", "Booking Confirmed", "Device Received", "Repair Complete"]:
            if stage in overall_funnel:
                count, total, pct = overall_funnel[stage]
                L(f"| {stage} | {count:,} | {pct:.1f}% |")

        L("")
        L("### By Quarter")
        L("")
        L("| Quarter | Enquiries | Booked | Booked % | Received | Repaired | Repair % |")
        L("|---------|-----------|--------|----------|----------|----------|----------|")
        for q in sorted(funnel_by_q):
            fq = funnel_by_q[q]
            enq = fq.get("Enquiry", (0, 0, 0))
            book = fq.get("Booking Confirmed", (0, 0, 0))
            recv = fq.get("Device Received", (0, 0, 0))
            rep = fq.get("Repair Complete", (0, 0, 0))
            L(f"| {q} | {enq[0]:,} | {book[0]:,} | {book[2]:.0f}% | {recv[0]:,} | {rep[0]:,} | {rep[2]:.0f}% |")

    L("")
    L("---")
    L("")

    # === 4. AGENT ACTIVITY ===
    agent_week, agent_total = agent_activity(tickets)

    L("## 4. Agent Activity")
    L("")
    L("### Total Messages by Agent ID")
    L("")
    L("| Agent ID | Total Messages | Avg/Week |")
    L("|----------|---------------|----------|")
    for aid, total in agent_total.most_common(10):
        weeks_active = len(agent_week[aid])
        avg = total / weeks_active if weeks_active else 0
        label = " *(primary — likely Ferrari)*" if aid == PRIMARY_AGENT_ID else ""
        L(f"| {aid}{label} | {total:,} | {avg:.1f} |")

    # Primary agent weekly trend by quarter
    if PRIMARY_AGENT_ID in agent_week:
        L("")
        L("### Primary Agent (368515462538) — Weekly Messages by Quarter")
        L("")

        primary_weeks = agent_week[PRIMARY_AGENT_ID]
        q_data = defaultdict(list)
        for week_str, count in primary_weeks.items():
            # Parse week to get quarter
            year = int(week_str[:4])
            week_num = int(week_str.split("W")[1])
            # Approximate month from week number
            approx_month = min(12, max(1, (week_num * 12) // 52 + 1))
            q = f"{year} Q{(approx_month - 1) // 3 + 1}"
            q_data[q].append(count)

        L("| Quarter | Weeks Active | Total Messages | Avg/Week | Min | Max |")
        L("|---------|-------------|---------------|----------|-----|-----|")
        for q in sorted(q_data):
            data = q_data[q]
            L(f"| {q} | {len(data)} | {sum(data):,} | {mean(data):.0f} | {min(data)} | {max(data)} |")

    L("")
    L("---")
    L("")

    # === 5. CHANNEL BREAKDOWN ===
    ch_total, ch_by_q = channel_analysis(tickets)

    L("## 5. Channel Breakdown")
    L("")
    L("### Overall")
    L("")
    L("| Channel | Tickets | % |")
    L("|---------|---------|---|")
    total_tickets = len(tickets)
    for ch, count in ch_total.most_common():
        pct = count / total_tickets * 100
        L(f"| {ch} | {count:,} | {pct:.1f}% |")

    L("")
    L("### By Quarter")
    L("")
    channels_list = [ch for ch, _ in ch_total.most_common(6)]
    header = "| Quarter | " + " | ".join(channels_list) + " | Total |"
    sep = "|---------|" + "|".join(["------" for _ in channels_list]) + "|-------|"
    L(header)
    L(sep)
    for q in sorted(ch_by_q):
        vals = [str(ch_by_q[q].get(ch, 0)) for ch in channels_list]
        total = sum(ch_by_q[q].values())
        L(f"| {q} | " + " | ".join(vals) + f" | {total:,} |")

    L("")
    L("---")
    L("")

    # === 6. KEY BENCHMARKS SUMMARY ===
    L("## 6. Key Benchmarks (for comparison with current Intercom data)")
    L("")
    L("These numbers represent what \"normal\" looked like in the Zendesk era.")
    L("")

    # Calculate some key numbers
    total_weeks = len(weekly)
    avg_tickets_week = len(tickets) / total_weeks if total_weeks else 0

    primary_total = agent_total.get(PRIMARY_AGENT_ID, 0)
    primary_weeks_active = len(agent_week.get(PRIMARY_AGENT_ID, {}))
    primary_avg = primary_total / primary_weeks_active if primary_weeks_active else 0

    web_enq = sum(1 for t in tickets if "web_enquiry" in set(t.get("tags", [])))
    booked = sum(1 for t in tickets if "booking_confirmed_sent" in set(t.get("tags", [])))
    conversion = booked / web_enq * 100 if web_enq else 0

    L("| Metric | Value |")
    L("|--------|-------|")
    L(f"| Total tickets (2023–2025) | {len(tickets):,} |")
    L(f"| Average tickets/week | {avg_tickets_week:.0f} |")
    L(f"| Median first reply time | {median(first_reply_times):.1f}h |")
    L(f"| Median lifecycle (created→closed) | {median(lifecycle_durations):.1f} days |")
    L(f"| Web enquiries | {web_enq:,} |")
    L(f"| Bookings confirmed | {booked:,} |")
    L(f"| Enquiry → Booking conversion | {conversion:.1f}% |")
    L(f"| Primary agent messages/week (avg) | {primary_avg:.0f} |")
    L(f"| Primary agent total messages | {primary_total:,} |")

    L("")
    L("---")
    L("")
    L("## 7. Data Notes")
    L("")
    L("- `ai_handled` and `fin-failed` tags ignored — Fin/AI did nothing meaningful in Zendesk era")
    L("- Agent ID 368515462538 is assumed to be Ferrari (accounts for ~95% of all agent messages)")
    L("- `channel: api` means ticket created via Monday.com integration, not a customer-initiated enquiry")
    L("- Phone calls not captured — only email/web/Instagram DM interactions")
    L("- Revenue/payment amounts not in Zendesk data")
    L("- Tags like `booking_confirmed_sent` and `repaired_email` are set by automation — reliable as funnel markers")
    L("")
    L("---")
    L("")
    L(f"*Report generated: {today} by zendesk_historical_analysis.py*")

    return "\n".join(lines)


# === MAIN ===

if __name__ == "__main__":
    print("Loading tickets...")
    tickets = load_tickets()
    print(f"Loaded {len(tickets):,} tickets ({MIN_YEAR}–{MAX_YEAR})")

    print("Generating report...")
    report = generate_report(tickets)

    today = datetime.now().strftime("%Y-%m-%d")
    output_path = os.path.join(OUTPUT_DIR, f"zendesk_historical_report_{today}.md")
    with open(output_path, "w") as f:
        f.write(report)

    print(f"Report saved to: {output_path}")
