#!/usr/bin/env python3
"""
RONI WEEKLY PERFORMANCE REPORT
QC (Quality Control) and Parts

Expected output: No formal targets yet (to be established)
Works Mon-Sat

METHODOLOGY:
- Uses activity logs to track QC completions (status changed to QC Passed/QC Failed)
- Tracks QC pass rate and failure reasons
- Also monitors parts-related activities
- GMT timezone (API returns timestamps that need -8hr correction)

NOTES:
- Roni is responsible for quality control of all repaired devices
- QC Passed = device meets quality standards and is ready for return/sale
- QC Failed = device needs rework, returned to technician
- 42 QC passes last week matched total repairs completed
"""

import requests
import json
from datetime import datetime, timedelta
from collections import defaultdict
import os

# ============================================================
# CONFIGURATION
# ============================================================
MONDAY_APP_TOKEN = "MONDAY_TOKEN_REDACTED"
MONDAY_API_URL = "https://api.monday.com/v2"
MAIN_BOARD_ID = "349212843"

RONI_ID = "79665360"
RONI_NAME = "Roni Mykhailiuk"

# Other technicians for context
SAFAN_ID = "25304513"
ANDRES_ID = "49001724"
MYKHAILO_ID = "64642914"
ADIL_ID = "94961618"

# Expected capacity (no formal targets yet)
EXPECTED_QC_PER_DAY = None  # To be established
WORKING_DAYS_PER_WEEK = 6  # Mon-Sat
WORKING_HOURS_PER_DAY = 9  # 9am - 6pm
WORKING_MINS_PER_DAY = WORKING_HOURS_PER_DAY * 60

# Timezone offset (API timestamps need this adjustment for GMT)
TIMEZONE_OFFSET_HOURS = 8

# QC Status values
QC_PASSED_STATUSES = ["QC Passed", "Passed QC", "QC Pass"]
QC_FAILED_STATUSES = ["QC Failed", "Failed QC", "QC Fail", "Returned for Rework"]

# Columns to fetch
COLUMNS = [
    'status4',          # Status (includes QC statuses)
    'status',           # Client
    'color_mkypbg6z',   # Trade-in status
    'date4',            # Received date
    'collection_date',  # Date Repaired
    'person',           # Technician
    'multiple_person_mkwqsxse',  # Refurb person
    'multiple_person_mkwqy930',  # Repair person
    'status24',         # Repair Type
]

# ============================================================
# API HELPERS
# ============================================================
headers = {"Authorization": MONDAY_APP_TOKEN, "Content-Type": "application/json"}

def run_query(query, retries=3):
    for i in range(retries):
        try:
            response = requests.post(MONDAY_API_URL, json={"query": query}, headers=headers, timeout=30)
            return response.json()
        except:
            if i < retries - 1:
                import time
                time.sleep(2)
    return {}

def parse_timestamp(ts):
    """Parse Monday.com nanosecond timestamp to datetime (GMT)"""
    try:
        unix_ts = int(ts) / 10000000
        dt = datetime.fromtimestamp(unix_ts)
        return dt - timedelta(hours=TIMEZONE_OFFSET_HOURS)
    except:
        return None

def get_col(item, col_id):
    """Get column value from item"""
    for cv in item.get("column_values", []):
        if cv["id"] == col_id:
            return cv.get("text", ""), cv.get("value", "")
    return "", ""

def get_last_week_range():
    """Get Monday-Sunday of last week"""
    today = datetime.now()
    days_since_monday = today.weekday()
    if days_since_monday == 0:
        last_monday = today - timedelta(days=7)
    else:
        last_monday = today - timedelta(days=days_since_monday + 7)
    last_sunday = last_monday + timedelta(days=6)
    return last_monday, last_sunday

def categorize_item(name):
    """Categorize item as BM device or client device"""
    if name.startswith("BM "):
        return "bm_device"
    else:
        return "client_device"

def is_qc_passed(status):
    """Check if status indicates QC passed"""
    return any(qc_status.lower() in status.lower() for qc_status in QC_PASSED_STATUSES)

def is_qc_failed(status):
    """Check if status indicates QC failed"""
    return any(qc_status.lower() in status.lower() for qc_status in QC_FAILED_STATUSES)

# ============================================================
# DATA FETCHING
# ============================================================
def get_activity_logs(user_id, from_date, to_date):
    """Fetch activity logs for a user from the board"""
    query = f'''
    query {{
        boards(ids: [{MAIN_BOARD_ID}]) {{
            activity_logs(
                user_ids: [{user_id}],
                from: "{from_date}",
                to: "{to_date}",
                limit: 500
            ) {{
                id
                event
                data
                created_at
            }}
        }}
    }}
    '''
    result = run_query(query)
    return result.get("data", {}).get("boards", [{}])[0].get("activity_logs", [])

def get_item_details(item_ids):
    """Fetch full details for specific items"""
    if not item_ids:
        return []

    ids_str = ", ".join(str(i) for i in item_ids[:50])
    query = f'''
    query {{
        items(ids: [{ids_str}]) {{
            id
            name
            group {{ id title }}
            column_values(ids: {json.dumps(COLUMNS)}) {{
                id
                text
                value
            }}
            updates(limit: 5) {{
                id
                body
                created_at
                creator {{ id name }}
            }}
        }}
    }}
    '''
    result = run_query(query)
    return result.get("data", {}).get("items", [])

# ============================================================
# MAIN ANALYSIS
# ============================================================
def generate_report():
    last_monday, last_sunday = get_last_week_range()
    week_start = last_monday.strftime("%Y-%m-%d")
    week_end = last_sunday.strftime("%Y-%m-%d")
    week_label = f"{last_monday.strftime('%d %b')} - {last_sunday.strftime('%d %b %Y')}"

    print(f"Fetching data for week: {week_label}")
    print(f"Using activity log methodology for QC tracking")

    # ========================================
    # STEP 1: Get Roni's activity logs
    # ========================================
    print("\nStep 1: Fetching Roni's activity logs...")
    activities = get_activity_logs(RONI_ID, week_start, week_end)
    print(f"  Found {len(activities)} activity log entries")

    # ========================================
    # STEP 2: Identify QC actions
    # ========================================
    print("\nStep 2: Analyzing QC actions...")

    items_touched = set()
    qc_passed = {}
    qc_failed = {}
    all_status_changes = []

    for act in activities:
        event = act.get("event", "")
        data_str = act.get("data", "{}")
        created_at = act.get("created_at", "")

        try:
            data = json.loads(data_str) if isinstance(data_str, str) else data_str
        except:
            data = {}

        item_id = data.get("pulse_id")
        item_name = data.get("pulse_name", "")

        if item_id:
            items_touched.add(item_id)

        # Check for QC status changes
        if event == "update_column_value":
            col_id = data.get("column_id", "")
            value = data.get("value", {})

            if col_id == "status4":
                new_label = ""
                if isinstance(value, dict) and "label" in value:
                    new_label = value["label"].get("text", "")

                dt = parse_timestamp(created_at)

                # Track QC Passed
                if is_qc_passed(new_label):
                    if item_id not in qc_passed:
                        qc_passed[item_id] = {
                            "name": item_name,
                            "status": new_label,
                            "qc_at": dt,
                            "category": categorize_item(item_name)
                        }

                # Track QC Failed
                elif is_qc_failed(new_label):
                    if item_id not in qc_failed:
                        qc_failed[item_id] = {
                            "name": item_name,
                            "status": new_label,
                            "qc_at": dt,
                            "category": categorize_item(item_name)
                        }

                # Track all status changes
                if new_label:
                    prev_value = data.get("previous_value", {})
                    old_label = ""
                    if isinstance(prev_value, dict) and "label" in prev_value:
                        old_label = prev_value["label"].get("text", "")

                    if dt:
                        all_status_changes.append({
                            "item_id": item_id,
                            "item_name": item_name,
                            "from": old_label,
                            "to": new_label,
                            "time": dt
                        })

    print(f"  Items touched: {len(items_touched)}")
    print(f"  QC Passed: {len(qc_passed)}")
    print(f"  QC Failed: {len(qc_failed)}")

    # ========================================
    # STEP 3: Get details for QC'd items
    # ========================================
    print("\nStep 3: Fetching item details...")
    all_qc_items = list(set(list(qc_passed.keys()) + list(qc_failed.keys())))
    item_details = get_item_details(all_qc_items)
    print(f"  Retrieved details for {len(item_details)} items")

    # Build item lookup
    items_lookup = {}
    for item in item_details:
        item_id = item.get("id")
        status, _ = get_col(item, "status4")
        client, _ = get_col(item, "status")

        items_lookup[item_id] = {
            "id": item_id,
            "name": item.get("name", ""),
            "group": item.get("group", {}).get("title", "Unknown"),
            "status": status,
            "client": client,
            "updates": item.get("updates", [])
        }

    # ========================================
    # STEP 4: Get team completions for context
    # ========================================
    print("\nStep 4: Fetching team repair completions for context...")

    team_completions = {}
    for tech_id, tech_name in [(SAFAN_ID, "Safan"), (ANDRES_ID, "Andres"), (MYKHAILO_ID, "Mykhailo"), (ADIL_ID, "Adil")]:
        tech_activities = get_activity_logs(tech_id, week_start, week_end)
        completed = 0
        for act in tech_activities:
            event = act.get("event", "")
            data_str = act.get("data", "{}")
            try:
                data = json.loads(data_str) if isinstance(data_str, str) else data_str
            except:
                continue

            if event == "update_column_value" and data.get("column_id") == "status4":
                value = data.get("value", {})
                new_label = ""
                if isinstance(value, dict) and "label" in value:
                    new_label = value["label"].get("text", "")
                if new_label in ["Repaired", "Part Repaired"]:
                    completed += 1

        team_completions[tech_name] = completed

    total_team_repairs = sum(team_completions.values())
    print(f"  Total team repairs: {total_team_repairs}")

    # ========================================
    # STEP 5: Count updates written
    # ========================================
    print("\nStep 5: Counting updates...")

    roni_updates = []
    last_week_start = last_monday.replace(hour=0, minute=0, second=0)
    last_week_end = last_sunday.replace(hour=23, minute=59, second=59)

    for item_id, item in items_lookup.items():
        for upd in item.get("updates", []):
            creator = upd.get("creator", {})
            if creator and str(creator.get("id")) == RONI_ID:
                created = upd.get("created_at", "")
                if created:
                    try:
                        dt = datetime.fromisoformat(created.replace("Z", "+00:00")).replace(tzinfo=None)
                        dt = dt - timedelta(hours=TIMEZONE_OFFSET_HOURS)
                        if last_week_start <= dt <= last_week_end:
                            roni_updates.append({
                                "item_name": item["name"],
                                "body": upd.get("body", ""),
                                "created_at": dt
                            })
                    except:
                        pass

    print(f"  Updates written: {len(roni_updates)}")

    # ========================================
    # STEP 6: Calculate metrics
    # ========================================

    # Categorize QC'd items
    qc_passed_bm = sum(1 for i in qc_passed.values() if i["category"] == "bm_device")
    qc_passed_client = sum(1 for i in qc_passed.values() if i["category"] == "client_device")
    qc_failed_bm = sum(1 for i in qc_failed.values() if i["category"] == "bm_device")
    qc_failed_client = sum(1 for i in qc_failed.values() if i["category"] == "client_device")

    total_qc = len(qc_passed) + len(qc_failed)
    pass_rate = (len(qc_passed) / total_qc * 100) if total_qc > 0 else 0
    fail_rate = (len(qc_failed) / total_qc * 100) if total_qc > 0 else 0

    # Daily breakdown
    by_day = defaultdict(lambda: {"passed": [], "failed": []})
    for item_id, info in qc_passed.items():
        if info.get("qc_at"):
            day = info["qc_at"].strftime("%Y-%m-%d")
            by_day[day]["passed"].append(info)

    for item_id, info in qc_failed.items():
        if info.get("qc_at"):
            day = info["qc_at"].strftime("%Y-%m-%d")
            by_day[day]["failed"].append(info)

    working_days = len(by_day) if by_day else WORKING_DAYS_PER_WEEK
    qc_per_day = total_qc / working_days if working_days > 0 else 0

    # QC coverage (how many of team's repairs were QC'd)
    qc_coverage = (total_qc / total_team_repairs * 100) if total_team_repairs > 0 else 0

    # ========================================
    # GENERATE MARKDOWN REPORT
    # ========================================

    report = f"""# Roni Weekly Performance Report
## Week: {week_label}

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')} (GMT)

**Role:** Quality Control (QC) & Parts
**Working Days:** Mon-Sat ({working_days} days this week)
**Target:** Not yet established

---

## Executive Summary

| Metric | Value | Notes |
|--------|-------|-------|
| **Total QC'd** | {total_qc} ({qc_per_day:.1f}/day) | All devices inspected |
| **QC Passed** | {len(qc_passed)} | Ready for return/sale |
| **QC Failed** | {len(qc_failed)} | Returned for rework |
| **Pass Rate** | {pass_rate:.1f}% | - |
| **QC Coverage** | {qc_coverage:.0f}% | vs team repairs ({total_team_repairs}) |
| **Updates Written** | {len(roni_updates)} | - |

### Key Finding
Roni QC'd **{total_qc}** devices this week. Team completed **{total_team_repairs}** repairs.
QC coverage: **{qc_coverage:.0f}%** - {"Good alignment" if qc_coverage >= 90 else "Gap to investigate" if qc_coverage < 80 else "Mostly aligned"}

---

## QC Results Breakdown

### By Category
| Category | Passed | Failed | Total | Pass Rate |
|----------|--------|--------|-------|-----------|
| BM Trade-in | {qc_passed_bm} | {qc_failed_bm} | {qc_passed_bm + qc_failed_bm} | {(qc_passed_bm/(qc_passed_bm+qc_failed_bm)*100) if (qc_passed_bm+qc_failed_bm) > 0 else 0:.0f}% |
| Client Devices | {qc_passed_client} | {qc_failed_client} | {qc_passed_client + qc_failed_client} | {(qc_passed_client/(qc_passed_client+qc_failed_client)*100) if (qc_passed_client+qc_failed_client) > 0 else 0:.0f}% |
| **TOTAL** | **{len(qc_passed)}** | **{len(qc_failed)}** | **{total_qc}** | **{pass_rate:.0f}%** |

---

## QC Passed Items ({len(qc_passed)})

| Device | QC Time | Category |
|--------|---------|----------|
"""

    for item_id, info in sorted(qc_passed.items(), key=lambda x: x[1].get("qc_at") or datetime.min):
        name = info.get("name", "")[:40]
        qc_time = info["qc_at"].strftime("%a %d %b %H:%M") if info.get("qc_at") else "-"
        cat = "BM" if info["category"] == "bm_device" else "Client"
        report += f"| {name} | {qc_time} | {cat} |\n"

    if not qc_passed:
        report += "| No items passed QC | - | - |\n"

    report += f"""
---

## QC Failed Items ({len(qc_failed)})

These items were returned to technicians for rework:

| Device | QC Time | Category | Reason |
|--------|---------|----------|--------|
"""

    for item_id, info in sorted(qc_failed.items(), key=lambda x: x[1].get("qc_at") or datetime.min):
        name = info.get("name", "")[:35]
        qc_time = info["qc_at"].strftime("%a %d %b %H:%M") if info.get("qc_at") else "-"
        cat = "BM" if info["category"] == "bm_device" else "Client"
        status = info.get("status", "-")[:20]
        report += f"| {name} | {qc_time} | {cat} | {status} |\n"

    if not qc_failed:
        report += "| No items failed QC | - | - | - |\n"

    report += f"""
---

## Daily QC Activity

"""

    for day in sorted(by_day.keys()):
        data = by_day[day]
        passed = data["passed"]
        failed = data["failed"]
        total_day = len(passed) + len(failed)

        try:
            day_name = datetime.strptime(day, "%Y-%m-%d").strftime("%A %d %b")
        except:
            day_name = day

        day_pass_rate = (len(passed) / total_day * 100) if total_day > 0 else 0

        report += f"### {day_name}\n"
        report += f"- QC Passed: {len(passed)}\n"
        report += f"- QC Failed: {len(failed)}\n"
        report += f"- Pass Rate: {day_pass_rate:.0f}%\n"
        report += f"- **Total: {total_day}**\n\n"

        report += "| Time | Item | Result |\n"
        report += "|------|------|--------|\n"

        all_day_items = [(i, "✓ Passed") for i in passed] + [(i, "✗ Failed") for i in failed]
        all_day_items.sort(key=lambda x: x[0].get("qc_at") or datetime.min)

        for item, result in all_day_items:
            time_str = item["qc_at"].strftime("%H:%M") if item.get("qc_at") else "-"
            name = item.get("name", "")[:40]
            report += f"| {time_str} | {name} | {result} |\n"

        report += "\n"

    report += f"""---

## Team Repairs vs QC Coverage

| Technician | Repairs Completed | Notes |
|------------|-------------------|-------|
"""

    for tech_name, completed in sorted(team_completions.items(), key=lambda x: -x[1]):
        report += f"| {tech_name} | {completed} | - |\n"

    report += f"""| **TOTAL TEAM** | **{total_team_repairs}** | - |

**Roni QC'd:** {total_qc} items
**Coverage:** {qc_coverage:.0f}%

"""

    if qc_coverage < 80:
        report += f"""
⚠️ **Gap Alert:** QC'd {total_qc} items but team completed {total_team_repairs} repairs.
Some devices may not have gone through QC, or timing differences between weeks.
"""
    elif qc_coverage > 110:
        report += f"""
📊 **Note:** QC count ({total_qc}) exceeds team repairs ({total_team_repairs}).
This is normal - some QC'd items may be from previous week's repairs.
"""

    report += f"""
---

## Updates Written ({len(roni_updates)})

"""

    if roni_updates:
        report += "| Time | Item | Content |\n"
        report += "|------|------|--------|\n"
        for upd in sorted(roni_updates, key=lambda x: x["created_at"])[:15]:
            time_str = upd["created_at"].strftime("%d %b %H:%M")
            item_name = upd["item_name"][:20] if upd["item_name"] else "Unknown"
            body = upd["body"][:40].replace("\n", " ").replace("|", "/").replace("<br>", " ") if upd["body"] else "N/A"
            report += f"| {time_str} | {item_name} | {body}... |\n"

        if len(roni_updates) > 15:
            report += f"\n*...and {len(roni_updates) - 15} more updates*\n"
    else:
        report += "*No updates found*\n"

    report += f"""
---

## Analysis & Recommendations

### QC Volume: {total_qc} items
"""

    if total_qc >= total_team_repairs * 0.9:
        report += """
**Good Coverage** - Roni is QC'ing most/all of the team's repairs.
"""
    else:
        report += f"""
**Coverage Gap** - Only {qc_coverage:.0f}% of team repairs went through QC.

**Possible reasons:**
- Timing differences (repairs completed late in week, QC'd next week)
- Some repairs bypassing QC
- Items stuck in queue awaiting QC
"""

    report += f"""
### Pass Rate: {pass_rate:.1f}%
"""

    if pass_rate >= 95:
        report += """
**Excellent Quality** - Very few items failing QC indicates strong repair quality.
"""
    elif pass_rate >= 85:
        report += """
**Good Quality** - Pass rate is acceptable with room for improvement.
"""
    else:
        report += f"""
**Quality Concern** - {fail_rate:.1f}% fail rate is high.

**Recommended actions:**
1. Review common failure reasons
2. Identify which technicians have higher fail rates
3. Provide feedback to technicians on recurring issues
"""

    if len(qc_failed) > 0:
        report += f"""
### QC Failures Analysis

{len(qc_failed)} items failed QC this week.

**Action:** Review failure reasons and provide feedback to relevant technicians.
Consider tracking failure categories (e.g., cosmetic, functional, incomplete repair).
"""

    report += f"""
### Target Setting Recommendation

Based on this week's data:
- Roni QC'd {qc_per_day:.1f} items per day
- Team completed ~{total_team_repairs/WORKING_DAYS_PER_WEEK:.1f} repairs per day

**Suggested KPI targets:**
- QC Volume: Match team repair output (currently ~{total_team_repairs//WORKING_DAYS_PER_WEEK + 1} per day)
- QC Pass Rate: Maintain ≥90%
- QC Turnaround: Same-day QC for all completed repairs

---

## Methodology Notes

This report uses **activity log analysis** for accurate metrics:
- **QC Passed** = Status changed to QC Passed by Roni
- **QC Failed** = Status changed to QC Failed/Returned for Rework by Roni
- **Team Repairs** = Status changed to Repaired/Part Repaired by any technician
- **Timestamps** = Adjusted to GMT (API returns timestamps +8 hours)

*Report generated by roni_weekly_report.py*
*Data source: Monday.com Main Board via Activity Logs*
"""

    return report, week_label

# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    print("=" * 60)
    print("GENERATING RONI'S WEEKLY REPORT")
    print("=" * 60)

    report, week_label = generate_report()

    # Save to file
    filename = f"roni_report_{datetime.now().strftime('%Y-%m-%d')}.md"
    filepath = os.path.join(os.path.dirname(__file__), filename)

    with open(filepath, "w") as f:
        f.write(report)

    print(f"\nReport saved to: {filepath}")
    print("\n" + "=" * 60)
    print("REPORT PREVIEW:")
    print("=" * 60)
    print(report)
